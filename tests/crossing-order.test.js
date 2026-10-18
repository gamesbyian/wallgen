import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {CROSSING_MODES,segmentIntersection,findPathCrossings,crossingTopIsLater,crossingBranchClip} from '../src/crossing-order.js';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';
import {samplePath,widthAt} from '../src/path-geometry.js';
import {safeDrawnBandSpan,prepareDrawnPath} from '../src/drawn-path.js';
import {stripeFillPath} from '../src/renderer.js';

test('over under weave are distinct, saved and lockable',()=>{
  assert.deepEqual(CROSSING_MODES,['over','under','weave']);
  assert.equal(normalizeRecipe({}).crossingMode,'over');
  assert.equal(normalizeRecipe({crossingMode:'invalid'}).crossingMode,'over');
  for(const crossingMode of CROSSING_MODES){
    const recipe=normalizeRecipe({crossingMode,lockedSettings:['crossingMode']});
    const roundtrip=decodeRecipe(encodeRecipe(recipe));
    assert.equal(roundtrip.crossingMode,crossingMode);
    assert.ok(roundtrip.lockedSettings.includes('crossingMode'));
    assert.equal(resolveScene(recipe).crossingMode,crossingMode);
  }
});
test('weave alternates by both stripe index and successive crossing',()=>{
  for(let index=0;index<7;index++)for(let crossing=0;crossing<4;crossing++){
    assert.equal(crossingTopIsLater('over',index,crossing),true);
    assert.equal(crossingTopIsLater('under',index,crossing),false);
    assert.equal(crossingTopIsLater('weave',index,crossing),(index+crossing)%2===0);
  }
});
test('segment intersection excludes near-parallel touches and adjacent endpoints',()=>{
  const A={x:0,y:0},B={x:100,y:100},C={x:0,y:100},D={x:100,y:0};
  const hit=segmentIntersection(A,B,C,D);
  assert.ok(hit);assert.equal(hit.x,50);assert.equal(hit.y,50);
  assert.equal(segmentIntersection(A,B,{x:100,y:100},{x:200,y:0}),null);
  assert.equal(segmentIntersection(A,B,{x:0,y:1},{x:100,y:101}),null);
});
test('detector finds two separated visits at a genuine figure-eight intersection',()=>{
  const stripe={segmentStart:-350,segmentEnd:350,width:12,center:0,index:3};
  const sampler=(_,x)=>{
    const t=-Math.PI/2+(x+350)/700*Math.PI*2;
    return {x:170*Math.sin(t),y:115*Math.sin(2*t)};
  };
  const crossings=findPathCrossings(stripe,350,sampler,{step:4});
  assert.ok(crossings.length>=1,'one transverse centreline crossing');
  assert.ok(crossings.every(c=>c.late>c.early));
  assert.ok(crossings.every(c=>c.angle>=.12));
});
test('a plain straight path has no false crossings',()=>{
  const stripe={segmentStart:-300,segmentEnd:300};
  const found=findPathCrossings(stripe,300,(_,x)=>({x,y:0}));
  assert.deepEqual(found,[]);
});
test('over under weave do not change the seven stripe geometries',()=>{
  const input={seed:'stable-crossings',geometry:'loop',loopSweep:440,
    construction:'ribbon',loopRadius:80,individuality:0};
  const standard=resolveScene({...input,crossingMode:'over'});
  for(const crossingMode of ['under','weave']){
    const variant=resolveScene({...input,crossingMode});
    for(let i=0;i<7;i++){
      const t=250;
      assert.deepEqual(samplePath(standard.stripes[i],t,standard.extent),
        samplePath(variant.stripes[i],t,variant.extent));
    }
  }
});

test('folded crossing masks form same-winding local quads, not a winding-cancelling loop',()=>{
  class Polygons {
    constructor(){this.polygons=[];this.current=[];}
    moveTo(x,y){this.current=[{x,y}];}
    lineTo(x,y){this.current.push({x,y});}
    closePath(){this.polygons.push(this.current);}
  }
  // More than one entire revolution inside the mask window is deliberately
  // adversarial: a single global outline would cross itself repeatedly.
  const stripe={width:25,segmentStart:-180,segmentEnd:180};
  const sampler=(_,station)=>{
    const a=station/60*Math.PI;
    return {x:26*Math.cos(a),y:26*Math.sin(a),nx:Math.cos(a),ny:Math.sin(a)};
  };
  const mask=crossingBranchClip(stripe,180,0,170,sampler,Polygons);
  assert.ok(mask.polygons.length>40);
  for(const polygon of mask.polygons){
    assert.equal(polygon.length,4);
    const area=polygon.reduce((sum,p,i)=>{
      const q=polygon[(i+1)%polygon.length];
      return sum+p.x*q.y-p.y*q.x;
    },0);
    assert.ok(area>0,'each quad must contribute positively to the union');
  }
});

test('over-rotated inner loops remain a positive union of ribbon cells',()=>{
  class PolygonPath {
    constructor(){this.polygons=[];this.current=[];}
    moveTo(x,y){this.current=[{x,y}];}
    lineTo(x,y){this.current.push({x,y});}
    closePath(){this.polygons.push(this.current);}
  }
  const scene=resolveScene({seed:'folded-ink',geometry:'loop',
    loopSweep:445,loopRadius:0,spread:92,geometrySafety:false});
  const stripe=scene.stripes[0];
  const path=stripeFillPath(stripe,scene.extent,scene,PolygonPath);
  assert.ok(path.polygons.length>300);
  for(const corners of path.polygons){
    assert.equal(corners.length,4);
    const area=corners.reduce((sum,p,i)=>{
      const q=corners[(i+1)%corners.length];
      return sum+p.x*q.y-p.y*q.x;
    },0);
    assert.ok(area>0,'ribbon cells must add, never cancel at a retraced arc');
  }
});

test('safe loops never invert the inner ribbon or exceed the outer frame radius',()=>{
  // Sweep and colour do not change radial nesting. Vary both seed-shifted
  // offsets and spread extremes to catch the formerly negative inner turn.
  for(let i=0;i<24;i++)for(const spread of [0,40,100])
    for(const loopRadius of [0,50,100]){
      const scene=resolveScene({seed:'loop-clearance-'+i,geometry:'loop',
        geometrySafety:true,spread,loopRadius,loopSweep:450});
      const radius=scene.stripes[0].loopRadius;
      const inner=radius+Math.min(...scene.stripes.map(s=>s.center));
      const outer=radius+Math.max(...scene.stripes.map(s=>s.center));
      assert.ok(inner>=28-1e-7,`inner loop clearance: ${inner} (${i},${spread},${loopRadius})`);
      assert.ok(outer<=600*.43+1e-7,`outer loop frame: ${outer} (${i},${spread},${loopRadius})`);
    }
  // Unrestricted mode still permits the extreme overlap that artists chose.
  const unrestricted=resolveScene({seed:'free-loop',geometry:'loop',
    geometrySafety:false,spread:100,loopRadius:0});
  const r=unrestricted.stripes[0].loopRadius;
  assert.ok(r+unrestricted.stripes[0].center<0);
});

test('coherent drawn ribbons respect sustained tight bend curvature',()=>{
  // The upper arc of the user-supplied 10x-smoothed knot, sampled in its
  // original stroke order. Its abrupt turn is short but geometrically real.
  const points=[
    [.78896,.53643],[.81093,.49653],[.82761,.45608],[.84025,.41532],
    [.84562,.37423],[.84553,.33306],[.8371,.29211],[.81811,.25188],
    [.80431,.23233],[.77967,.21526],[.74849,.20054],[.71391,.18759],
    [.67196,.18155],[.6283,.18536],[.58616,.19211],[.54435,.19929],
    [.50364,.20769],[.46474,.21776],[.4274,.22902],[.3928,.24199],
    [.36387,.25762],[.34157,.27543],[.32374,.29429],[.3079,.31354],
    [.29352,.33303],[.28187,.3529],[.27393,.37316],[.26937,.39363]
  ];
  const path=prepareDrawnPath(points);
  const span=safeDrawnBandSpan(path);
  assert.ok(span<100,'tight bend must constrain the whole 7-stripe span: '+span);
  assert.ok(span>=16,'the coherence guard must preserve visible stripes');
  const input={seed:'t0b4v5-ice7lf',geometry:'drawn',customPath:points,
    spread:67,individuality:77,geometrySafety:true,construction:'tonal'};
  const scene=resolveScene(input);
  assert.ok(scene.stripes[6].center-scene.stripes[0].center<=span+1e-6);
  const stripe=scene.stripes[0],fullExtent=scene.extent;
  // Smooth normals must not teleport the offset curve at sample vertices.
  let previous=samplePath(stripe,-fullExtent,fullExtent),maxJump=0;
  for(let x=-fullExtent+2;x<=fullExtent;x+=2){
    const next=samplePath(stripe,x,fullExtent);
    maxJump=Math.max(maxJump,Math.hypot(next.x-previous.x,next.y-previous.y));
    previous=next;
  }
  assert.ok(maxJump<15,'drawn normal offsets must not create sideways spikes: '+maxJump);
});

test('local crossing segments retain the original endpoint taper',()=>{
  const stripe={width:8,taper:0,endTaper:75,
    segmentStart:-800,segmentEnd:800};
  const original=widthAt(stripe,0,800);
  const branch={...stripe,segmentStart:-100,segmentEnd:100,
    taperStart:-800,taperEnd:800};
  assert.equal(widthAt(branch,0,800),original);
  assert.equal(widthAt(branch,100,800),widthAt(stripe,100,800));
});

test('exact 96-point reported wallpaper keeps all seven offset ribbons coherent',()=>{
  const recipe=JSON.parse(readFileSync(new URL('./fixtures/drawn-knot-t0b4v5.json',import.meta.url),'utf8'));
  assert.equal(recipe.customPath.length,96);
  assert.equal(recipe.seed,'t0b4v5-ice7lf');
  assert.equal(recipe.geometrySafety,true);
  assert.equal(recipe.construction,'tonal');
  assert.equal(recipe.textureDisplacement,100);
  const scene=resolveScene(recipe);
  const span=scene.stripes.at(-1).center-scene.stripes[0].center;
  const bound=safeDrawnBandSpan(scene.stripes[0].drawnPath);
  assert.ok(span<=bound+1e-6,'whole bundle must respect curvature limit');
  assert.ok(span<80,'small inner knot must retain radial clearance: '+span);
  for(const stripe of scene.stripes){
    let prev=samplePath(stripe,-scene.extent,scene.extent);
    let largest=0;
    for(let x=-scene.extent+2;x<=scene.extent;x+=2){
      const cur=samplePath(stripe,x,scene.extent);
      largest=Math.max(largest,Math.hypot(cur.x-prev.x,cur.y-prev.y));
      prev=cur;
    }
    assert.ok(largest<16,`stripe ${stripe.index} must not sprout a transverse spur: ${largest}`);
  }
});
