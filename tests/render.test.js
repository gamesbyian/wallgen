import test from 'node:test';
import assert from 'node:assert/strict';
import { drawWallpaper, presentNudgedArtwork, motifFits, balanceStripeEnds, stripeFrameContacts, textureHeight, stripeShadowParameters, nudgeOverhang, stripeLineMarks } from '../src/renderer.js';
import { MATERIALS, MOTIFS, GEOMETRIES, OUTLINES, resolveScene } from '../src/model.js';
import {samplePath} from '../src/path-geometry.js';

// Node's lightweight Canvas API spy catches geometry/material code path errors
// without requiring a native browser, raster library, or platform build step.
const calls=[];
class FakePath2D {
  moveTo(){} lineTo(){} closePath(){} arc(){}
}
class FakeContext {
  constructor(tag='layer') {this.tag=tag;this.fillStyle='#000';this.strokeStyle='#000';this.globalAlpha=1;this.globalCompositeOperation='source-over';}
  save(){} restore(){} scale(x,y){calls.push(['scale',x,y]);} translate(){} rotate(a){calls.push(['rotate',a]);} setTransform(){}
  clearRect(){} beginPath(){} moveTo(){} lineTo(){} closePath(){}
  arc(){} quadraticCurveTo(){} clip(){calls.push(['clip',this.tag]);} stroke(){} setLineDash(){}
  fill(){} fillRect(...args){calls.push(['fillRect',this.fillStyle,...args,this.tag]);}
  drawImage(_src,...args){
    if(this.shadowBlur>0)calls.push(['lightingShadow',this.shadowBlur,this.shadowOffsetX,this.shadowOffsetY,this.shadowColor]);
    calls.push(['drawImage',this.globalCompositeOperation,this.tag,...args]);
  }
  createPattern(){return '#pattern';}
  createRadialGradient(...coords){calls.push(['ambientGlow',this.tag,...coords]);return {addColorStop(offset,color){calls.push(['ambientGlowStop',this.tag,offset,color]);}};}
  createLinearGradient(...coords){
    calls.push(['lightingGradient',...coords]);
    return {addColorStop(offset,color){calls.push(['lightingStop',offset,color]);}};
  }
}
const oldPath=globalThis.Path2D;
const oldDocument=globalThis.document;
globalThis.Path2D=FakePath2D;
globalThis.document={createElement(tag){if(tag!=='canvas')throw new Error(tag);return {width:0,height:0,getContext:()=>new FakeContext()};}};

function render(recipe) {
  calls.length=0;
  const canvas={width:600,height:1300,getContext:()=>new FakeContext()};
  const scene=drawWallpaper(canvas,recipe);
  assert.equal(scene.stripes.length,7);
  assert.ok(calls.some(c=>c[0]==='fillRect' && c[1]==='#000'));
  assert.ok(calls.some(c=>c[0]==='drawImage'));
}
test('radial and regional objects use the complete common painting pipeline',()=>{
  for(const [structure,modes,key] of [
    ['radial',['sunburst','starburst','pinwheel','spokes','concentric'],'radialMode'],
    ['regions',['voronoi','organic','facets','blocks','nested'],'regionMode'],
  ])for(const mode of modes)for(const material of ['none','linen']){
    const recipe={seed:'unified:'+mode+material,structure,[key]:mode,
      rayCount:21,regionCount:21,material,textureStrength:80,
      textureCoverage:'stripes',glow:20,dividerColor:'black',dividerWidth:24};
    assert.doesNotThrow(()=>render(recipe),structure+'/'+mode+'/'+material);
  }
});

test('open drawn paths use overscan; closed and floating strokes keep their ends',()=>{
  const r={geometry:'drawn',customPath:[[.35,.42],[.5,.48],[.65,.54]],
    material:'none',viewZoom:.5,positionX:30,positionY:-30};
  const canvas=()=>({width:600,height:1300,getContext:()=>new FakeContext()});
  const finite=drawWallpaper(canvas(),r);
  const extended=drawWallpaper(canvas(),{...r,extendDrawnPath:true});
  assert.ok(extended.extent>finite.extent);
  const s={...extended.stripes[3],coreExtent:extended.coreExtent,extendDrawnPath:true};
  const p=samplePath(s,extended.coreExtent+400,extended.extent);
  const cap=samplePath({...s,extendDrawnPath:false},extended.coreExtent+400,extended.extent);
  assert.ok(Math.hypot(p.x-cap.x,p.y-cap.y)>150);
  const c=[[.2,.2],[.8,.2],[.8,.8],[.2,.8],[.2,.2]];
  assert.equal(drawWallpaper(canvas(),{...r,customPath:c,extendDrawnPath:true}).extent,
    drawWallpaper(canvas(),{...r,customPath:c}).extent);
  assert.equal(drawWallpaper(canvas(),{...r,composition:'floating',extendDrawnPath:true}).extent,
    finite.extent);
});
test('paper and textiles render without exceptions',()=>{
  for(const material of MATERIALS)render({seed:`textile-${material}`,material,motif:'solid'});
});
test('all stripe motifs render without exceptions',()=>{
  for(const motif of MOTIFS)render({seed:`motif-${motif}`,motif,material:'grain'});
});
test('all geometries and outlines render without exceptions',()=>{
  for(const geometry of GEOMETRIES)render({seed:`path-${geometry}`,geometry});
  for(const outline of OUTLINES)render({seed:`edge-${outline}`,outline,gap:100});
});
test('render works at full native 210% export resolution',()=>{
  calls.length=0;
  const canvas={width:3024,height:6552,getContext:()=>new FakeContext()};
  assert.doesNotThrow(()=>drawWallpaper(canvas,{seed:'full-res',material:'canvas',glow:80,motif:'stars'}));
});

test('paper and textiles cover the chosen background as well as stripes',()=>{
  for(const background of ['black','white'])for(const material of ['linen','construction','felt']){
    for(const textureCoverage of ['both','background','stripes']){
      calls.length=0;
      const canvas={width:600,height:1300,getContext:()=>new FakeContext('main')};
      const scene=drawWallpaper(canvas,{seed:'surface-test',background,material,textureCoverage,motif:'dots'});
      assert.equal(scene.background,background);
      assert.ok(calls.some(x=>x[0]==='fillRect' && x[1]===(background==='black'?'#000':'#fff') && x.at(-1)==='main'));
      assert.equal(calls.filter(x=>x[0]==='drawImage' && x[2]==='main').length>1,textureCoverage!=='stripes');
    }
  }
});
test('motif shapes must fit completely, no boundary clipping',()=>{
  for(const motif of MOTIFS){
    calls.length=0;
    drawWallpaper({width:600,height:1300,getContext:()=>new FakeContext('main')},{seed:'whole-motifs',motif,individuality:100,chaos:100});
    assert.ok(!calls.some(x=>x[0]==='clip'),motif+' was clipped');
  }
  const scene=resolveScene({seed:'fit-boundary',family:'studio',motif:'stars'});
  const stripe=scene.stripes[3];
  assert.equal(motifFits(stripe,scene,scene.extent,stripe.center,2,2),false);
  assert.equal(motifFits(stripe,scene,0,stripe.center+10000,2,2),false);
});

test('frame contacts are bilateral or fully inset for a variety of seeded geometries',()=>{
  let inset=0,through=0;
  for(const orientation of ['vertical','horizontal','diagonal'])
    for(let i=0;i<24;i++){
      const scene=resolveScene({
        seed:'frame-balance:'+orientation+':'+i,orientation,
        individuality:85,chaos:85,spread:66,stripeWidth:65,
        positionX:((i%5)-2)*7,positionY:((i%7)-3)*5,
      });
      for(const stripe of scene.stripes){
        const result=balanceStripeEnds(scene,stripe);
        if(stripe.hidden)continue;
        const edges=stripeFrameContacts(scene,stripe);
        assert.equal(edges.left,edges.right,orientation+':'+i+':'+stripe.index+' left/right');
        assert.equal(edges.top,edges.bottom,orientation+':'+i+':'+stripe.index+' top/bottom');
        if(result.balanced)through++;
        else{
          inset++;
          assert.ok(stripe.segmentEnd>stripe.segmentStart);
          assert.equal(motifFits(stripe,scene,stripe.segmentStart,stripe.center,3,3),false);
        }
      }
    }
  assert.ok(through>0,'Some stripes should still cross paired opposite edges');
  assert.ok(inset>0,'Unbalanced edge contact should trigger paired end insets');
});

test('three composited materials apply rotated masks, background and blend modes',()=>{
  calls.length=0;
  const canvas={width:600,height:1300,getContext:()=>new FakeContext()};
  const scene=drawWallpaper(canvas,{
    seed:'composite-test',material:'wood-grain',textureCoverage:'both',
    textureRotation:45,textureBlend:'overlay',
    textureLayer2Enabled:true,material2:'adobe',textureCoverage2:'background',
    textureRotation2:90,textureBlend2:'multiply',
    textureLayer3Enabled:true,material3:'corduroy',textureCoverage3:'stripes',
    textureRotation3:13.5,textureBlend3:'screen',
  });
  assert.equal(scene.textureLayers.length,3);
  assert.ok(calls.some(c=>c[0]==='rotate' && Math.abs(c[1]-Math.PI/2)<1e-7));
  assert.ok(calls.some(c=>c[0]==='rotate' && Math.abs(c[1]-13.5*Math.PI/180)<1e-7));
  for(const composite of ['overlay','multiply','screen','destination-in']){
    assert.ok(calls.some(c=>c[0]==='drawImage' && c[1]===composite),composite);
  }
});

test('material-informed height field is deterministic, bounded, and disabled by default',()=>{
  const base={seed:'edge-relief',orientation:'diagonal',stripeWidth:70,material:'adobe',textureCoverage:'stripes'};
  const none=resolveScene({...base});
  const scene=resolveScene({...base,textureDisplacement:85});
  const stripe=scene.stripes[3];
  assert.equal(textureHeight(none,none.stripes[3],153,1),0);
  // No active stripe material uses seeded neutral grain instead of a dead slider.
  const bare=resolveScene({...base,material:'none',textureDisplacement:85});
  const bgOnly=resolveScene({...base,textureCoverage:'background',textureDisplacement:85});
  assert.notEqual(textureHeight(bare,bare.stripes[3],153,1),0);
  assert.notEqual(textureHeight(bgOnly,bgOnly.stripes[3],153,1),0);
  const first=textureHeight(scene,stripe,153,1);
  assert.equal(first,textureHeight(scene,stripe,153,1));
  const max=Math.min(28,stripe.width*.34)*Math.pow(.85,.85);
  assert.ok(Math.abs(first)<=max+1e-10);
  const material=resolveScene({...base,material:'corduroy',textureDisplacement:85});
  assert.notEqual(first,textureHeight(material,material.stripes[3],153,1));
  const rotated=resolveScene({...base,textureDisplacement:85,textureRotation:90});
  assert.notEqual(first,textureHeight(rotated,rotated.stripes[3],153,1));
});
test('displaced edges preserve the opposite-edge framing rule',()=>{
  let rendered=0;
  for(const orientation of ['vertical','horizontal','diagonal'])for(let i=0;i<10;i++){
    const scene=resolveScene({seed:'relief-balance-'+orientation+'-'+i,orientation,
      material:'stucco',textureDisplacement:78,textureCoverage:'both',
      textureLayer2Enabled:true,material2:'wood-grain',textureCoverage2:'stripes',
      individuality:80,chaos:75,spread:60,stripeWidth:62});
    for(const stripe of scene.stripes){
      balanceStripeEnds(scene,stripe);
      if(stripe.hidden)continue;
      const edges=stripeFrameContacts(scene,stripe);
      assert.equal(edges.left,edges.right,orientation+' '+i+' stripe '+stripe.index+' LR');
      assert.equal(edges.top,edges.bottom,orientation+' '+i+' stripe '+stripe.index+' TB');
      rendered++;
    }
  }
  assert.ok(rendered>0);
});
test('rough material and fine motif rendering complete together without clipping',()=>{
  calls.length=0;
  const canvas={width:600,height:1300,getContext:()=>new FakeContext('main')};
  assert.doesNotThrow(()=>drawWallpaper(canvas,{seed:'rough-stars',motif:'stars',
    textureDisplacement:85,material:'stone',textureCoverage:'stripes',
    textureLayer2Enabled:true,material2:'felt',textureCoverage2:'stripes'}));
  assert.ok(!calls.some(c=>c[0]==='clip'));
});

test('nudge repaints cached completed layers without redrawing any geometry',()=>{
  const canvas={width:600,height:1300,getContext:()=>new FakeContext('main')};
  const cache={};
  const recipe={seed:'nudge-cache',material:'stucco',motif:'stars',textureDisplacement:100,
    individuality:100,chaos:100,outline:'double',glow:55};
  const base=drawWallpaper(canvas,{...recipe,positionX:0,positionY:0},{cache});
  assert.ok(cache.background && cache.ink);
  assert.equal(cache.ink.width,960);
  assert.equal(cache.ink.height,2080);
  assert.deepEqual(cache.overhang,{left:180,right:180,top:390,bottom:390,width:600,height:1300});
  calls.length=0;
  presentNudgedArtwork(canvas,cache,{positionX:12,positionY:-8});
  assert.deepEqual(calls,[
    ['drawImage','source-over','main',0,0],
    ['drawImage','source-over','main',-108,-494],
  ]);
  assert.equal(base.positionX,0);
  const moved=resolveScene({...recipe,positionX:12,positionY:-8});
  assert.equal(moved.centerX,base.centerX);
  assert.equal(moved.centerY,base.centerY);
  assert.deepEqual(moved.stripes,base.stripes.map(({segmentStart,segmentEnd,hidden,...stripe})=>stripe));
});
test('nudge at export dimensions is a scaled bitmap translation, not recapping stripes',()=>{
  calls.length=0;
  const canvas={width:3024,height:6552,getContext:()=>new FakeContext('main')};
  const scene=drawWallpaper(canvas,{seed:'export-pan',orientation:'diagonal',positionX:-10,positionY:7});
  const draws=calls.filter(x=>x[0]==='drawImage' && x[2]==='main');
  const last=draws.at(-1);
  assert.equal(last[3],-302.4);
  assert.ok(Math.abs(last[4]-(458.64-459))<1e-7);
  const base=resolveScene({seed:'export-pan',orientation:'diagonal'});
  assert.equal(scene.centerX,base.centerX);
  assert.equal(scene.centerY,base.centerY);
});

test('lighting is an ambient wash across the whole canvas with no stripe cast shadows',()=>{
  for(const mood of ['off','daylight','golden','moonlight']){
    calls.length=0;
    const canvas={width:600,height:1300,getContext:()=>new FakeContext('main')};
    drawWallpaper(canvas,{seed:'ambient:'+mood,material:'none',motif:'stars',lightingMood:mood,
      lightDirection:'top-left',lightStrength:60,shadowStrength:75});
    assert.equal(calls.some(c=>c[0]==='ambientGlow'&&c[1]==='main'),mood!=='off');
    assert.equal(calls.some(c=>c[0]==='lightingGradient'),mood!=='off');
    assert.ok(!calls.some(c=>c[0]==='lightingShadow'),'no cast shadows');
    assert.ok(!calls.some(c=>c[0]==='clip'));
    const picture=calls.findLastIndex(c=>c[0]==='drawImage'&&c[2]==='main');
    const shade=calls.findLastIndex(c=>c[0]==='fillRect'&&c.at(-1)==='main');
    if(mood!=='off')assert.ok(shade>picture,'ambient wash should be composited after the picture');
  }
});
test('whole-canvas ambient light direction and shade scale to full export without shadows',()=>{
  for(const [lightDirection,x,y] of [
    ['top-left',0,0],['top-right',3024,0],
    ['bottom-left',0,6552],['bottom-right',3024,6552],
  ]){
    calls.length=0;
    const canvas={width:3024,height:6552,getContext:()=>new FakeContext('main')};
    drawWallpaper(canvas,{seed:'ambient-'+lightDirection,lightingMood:'golden',
      lightDirection,lightStrength:77,shadowStrength:84});
    assert.ok(calls.some(c=>c[0]==='ambientGlow'&&c[1]==='main'&&c[2]===x&&c[3]===y));
    assert.ok(calls.some(c=>c[0]==='lightingGradient'&&c[1]===x&&c[2]===y));
    assert.ok(!calls.some(c=>c[0]==='lightingShadow'));
  }
});
test('nudge reuses immutable geometry while moving under stationary ambient light',()=>{
  const canvas={width:600,height:1300,getContext:()=>new FakeContext('main')};
  const cache={};
  const recipe={seed:'ambient-nudge',lightingMood:'moonlight',lightDirection:'bottom-right',
    lightStrength:63,shadowStrength:57};
  drawWallpaper(canvas,recipe,{cache});
  assert.ok(cache.ink&&cache.background);
  calls.length=0;
  presentNudgedArtwork(canvas,cache,{...recipe,positionX:14,positionY:-6});
  assert.equal(calls.filter(c=>c[0]==='ambientGlow'&&c[1]==='main').length,1);
  assert.equal(calls.filter(c=>c[0]==='lightingGradient').length,1);
  assert.ok(!calls.some(c=>c[0]==='lightingShadow'));
  const draws=calls.filter(c=>c[0]==='drawImage'&&c[2]==='main');
  assert.deepEqual(draws.map(c=>c.slice(3)),[[0,0],[-96,-468]]);
  assert.deepEqual(resolveScene({...recipe,positionX:14,positionY:-6}).stripes,
    resolveScene(recipe).stripes);
});
test('texture displacement yields visible bounded silhouette movement with and without texture',()=>{
  for(const material of ['none','stucco','stone','linen','wood-grain']){
    const opts={seed:'relief-visibility',material,orientation:'vertical',
      stripeWidth:55,textureCoverage:'stripes'};
    const zero=resolveScene({...opts,textureDisplacement:0});
    const high=resolveScene({...opts,textureDisplacement:100});
    const stripe=high.stripes[3];
    const samples=Array.from({length:250},(_,i)=>textureHeight(high,stripe,-750+i*6,1));
    const magnitude=Math.max(...samples.map(Math.abs));
    assert.ok(magnitude>Math.min(4,stripe.width*.17),material+' relief too subtle: '+magnitude);
    assert.ok(samples.every(v=>Math.abs(v)<=Math.min(28,stripe.width*.34)+1e-8));
    assert.equal(textureHeight(zero,zero.stripes[3],330,1),0);
    assert.equal(textureHeight(high,stripe,330,1),textureHeight(high,stripe,330,1));
    assert.deepEqual(high.stripes,zero.stripes);
  }
});

test('stripe shadow strength alone enables casting, independently of ambient light',()=>{
  const recipe={seed:'cast-shadow-check',lightingMood:'off',
    stripeShadowStrength:76,stripeShadowSoftness:65,stripeShadowDirection:'top-right'};
  calls.length=0;
  const canvas={width:600,height:1300,getContext:()=>new FakeContext('main')};
  drawWallpaper(canvas,recipe);
  const shadows=calls.filter(c=>c[0]==='lightingShadow');
  assert.equal(shadows.length,1,'one silhouette shadow on the finished ink');
  assert.ok(shadows[0][2]<0&&shadows[0][3]>0);
  assert.equal(calls.some(c=>c[0]==='ambientGlow'&&c[1]==='main'),false);
  assert.equal(stripeShadowParameters({...recipe,stripeShadowStrength:0}),null);
  assert.ok(stripeShadowParameters({...recipe,stripeShadowEnabled:false}),
    'legacy checkbox cannot override nonzero strength');
});
test('stripe shadow softness and export scale change blur, not the original scene',()=>{
  const base={seed:'shadow-geometry',stripeShadowStrength:67,
    stripeShadowDirection:'bottom-left'};
  const a=stripeShadowParameters({...base,stripeShadowSoftness:10},1);
  const b=stripeShadowParameters({...base,stripeShadowSoftness:90},1);
  assert.ok(a.blur<b.blur);
  assert.equal(a.color,b.color);
  assert.ok(a.x>0&&a.y<0);
  const hires=stripeShadowParameters({...base,stripeShadowSoftness:90},3024/600);
  assert.ok(Math.abs(hires.blur/b.blur-3024/600)<1e-10);
  assert.ok(Math.abs(hires.x/b.x-3024/600)<1e-10);
  assert.deepEqual(resolveScene({...base,stripeShadowSoftness:10}).stripes,
    resolveScene({...base,stripeShadowSoftness:90}).stripes);
});
test('ambient and stripe shadows coexist, and nudge reuses the exact cached ink',()=>{
  const canvas={width:600,height:1300,getContext:()=>new FakeContext('main')};
  const recipe={seed:'both-lighting-modes',lightingMood:'moonlight',lightStrength:60,
    shadowStrength:75,stripeShadowStrength:65,
    stripeShadowSoftness:40,stripeShadowDirection:'bottom-right'};
  const cache={};
  drawWallpaper(canvas,recipe,{cache});
  assert.ok(cache.background&&cache.ink);
  calls.length=0;
  presentNudgedArtwork(canvas,cache,{...recipe,positionX:6,positionY:-4});
  assert.equal(calls.filter(c=>c[0]==='lightingShadow').length,1);
  assert.equal(calls.filter(c=>c[0]==='ambientGlow'&&c[1]==='main').length,1);
  const draws=calls.filter(c=>c[0]==='drawImage'&&c[2]==='main');
  assert.deepEqual(draws.map(c=>c.slice(3)),[[0,0],[-144,-442]]);
  const shadowIndex=calls.findIndex(c=>c[0]==='lightingShadow');
  const ambientIndex=calls.findIndex(c=>c[0]==='ambientGlow');
  assert.ok(shadowIndex<ambientIndex,'canvas-wide ambience is applied after stripe shadow');
  assert.deepEqual(resolveScene(recipe).stripes,
    resolveScene({...recipe,positionX:6,positionY:-4}).stripes);
});

test('preview caches both nudge directions without regenerating stripe geometry',()=>{
  const canvas={width:600,height:1300,getContext:()=>new FakeContext('main')};
  const cache={};
  const base=drawWallpaper(canvas,{seed:'overscan-extreme',orientation:'diagonal',motif:'solid'},{cache});
  assert.deepEqual(cache.overhang,{left:180,right:180,top:390,bottom:390,width:600,height:1300});
  for(const positionX of [-30,0,30])for(const positionY of [-30,0,30]){
    calls.length=0;
    presentNudgedArtwork(canvas,cache,{positionX,positionY,lightingMood:'off'});
    const draws=calls.filter(c=>c[0]==='drawImage'&&c[2]==='main');
    assert.equal(draws.length,2);
    assert.equal(draws[1][3],positionX*6-180);
    assert.equal(draws[1][4],positionY*13-390);
    const sourceX=-draws[1][3], sourceY=-draws[1][4];
    assert.ok(sourceX>=0&&sourceX+600<=cache.ink.width,
      'horizontal pixel range should never fall outside cached ink');
    assert.ok(sourceY>=0&&sourceY+1300<=cache.ink.height,
      'vertical pixel range should never fall outside cached ink');
  }
  assert.equal(base.stripes.length,7);
});
test('export overscan allocates only required nudge sides, never a full 30% blanket',()=>{
  assert.deepEqual(nudgeOverhang(3024,6552,{positionX:0,positionY:0}),
    {left:0,right:0,top:0,bottom:0,width:3024,height:6552});
  assert.deepEqual(nudgeOverhang(3024,6552,{positionX:30,positionY:-30}),
    {left:908,right:0,top:0,bottom:1966,width:3024,height:6552});
  assert.deepEqual(nudgeOverhang(3024,6552,{positionX:-30,positionY:30}),
    {left:0,right:908,top:1966,bottom:0,width:3024,height:6552});
  assert.deepEqual(nudgeOverhang(600,1300,{positionX:0,positionY:0},true),
    {left:180,right:180,top:390,bottom:390,width:600,height:1300});
  assert.deepEqual(nudgeOverhang(600,1300,{positionX:30,positionY:-30},true),
    {left:180,right:180,top:390,bottom:390,width:600,height:1300});
});
test('background texture is cropped to the frame while extra stripe material extends off-frame',()=>{
  calls.length=0;
  const canvas={width:600,height:1300,getContext:()=>new FakeContext('main')};
  const cache={};
  drawWallpaper(canvas,{seed:'overscan-textures',material:'concrete',
    textureCoverage:'both',textureStrength:78,textureLayer2Enabled:true,
    material2:'linen',textureCoverage2:'stripes',motif:'checker'}, {cache});
  assert.equal(cache.ink.width,960);
  assert.equal(cache.ink.height,2080);
  // Background uses the 9-argument source crop instead of shifting.
  assert.ok(calls.some(c=>c[0]==='drawImage'&&c[2]==='main'&&
    c.slice(3).join(',')==='180,390,600,1300,0,0,600,1300'));
  assert.ok(calls.some(c=>c[0]==='drawImage'&&c[2]==='main'&&
    c[3]===-180&&c[4]===-390),'ink uses its overscan origin');
});
test('visible motif placement stays the same, while whole motifs may populate off-frame overscan',()=>{
  const scene=resolveScene({seed:'motif-visible-unchanged',motif:'dots'});
  const stripe=scene.stripes[3];
  const x=0,y=stripe.center,halfX=.4,halfY=.4;
  const standard=motifFits(stripe,scene,x,y,halfX,halfY);
  const extended={...scene,renderBounds:{left:-180,right:780,top:-390,bottom:1690}};
  assert.equal(motifFits(stripe,extended,x,y,halfX,halfY),standard);
  assert.deepEqual(scene.stripes,extended.stripes);
});

test('dotted and dashed styles form different spaced geometry-independent silhouettes',()=>{
  for(const geometry of GEOMETRIES){
    const scene=resolveScene({seed:'ribbon-line-style',family:'studio',
      geometry,motif:'solid',lineStyle:'dashed',individuality:0});
    const stripe=scene.stripes[3];
    const dashes=stripeLineMarks(stripe,scene.extent);
    assert.ok(dashes.length>4,geometry+' should have several dashes');
    assert.ok(dashes.every(m=>m.type==='dash'&&m.end>m.start));
    for(let i=1;i<dashes.length;i++)assert.ok(dashes[i].start>dashes[i-1].end);
    const dots=stripeLineMarks({...stripe,lineStyle:'dotted'},scene.extent);
    assert.ok(dots.length>4);
    assert.ok(dots.every(m=>m.type==='dot'&&m.radius>0));
    const continuous=stripeLineMarks({...stripe,lineStyle:'continuous'},scene.extent);
    assert.equal(continuous,null);
  }
});
test('standard dot and dash line styles render on chevron and wave independently of motif',()=>{
  for(const geometry of ['chevron','wave','zigzag']){
    for(const lineStyle of ['dotted','dashed']){
      calls.length=0;
      const canvas={width:600,height:1300,getContext:()=>new FakeContext('main')};
      const result=drawWallpaper(canvas,{seed:'style-'+geometry+lineStyle,
        family:'studio',geometry,lineStyle,motif:'solid',individuality:0,outline:'none'});
      assert.ok(result.stripes.some(s=>s.geometry===geometry&&s.lineStyle===lineStyle));
      assert.ok(calls.some(c=>c[0]==='drawImage'&&c[2]==='main'));
    }
  }
});
test('dot or dash motif stays independent from dotted or dashed stripe line style',()=>{
  for(const lineStyle of ['continuous','dotted','dashed']){
    for(const motif of ['dots','dashes']){
      const scene=resolveScene({seed:'style-versus-motif',family:'studio',
        geometry:'chevron',lineStyle,motif,individuality:0});
      const canvas={width:600,height:1300,getContext:()=>new FakeContext('main')};
      assert.doesNotThrow(()=>drawWallpaper(canvas,scene));
      assert.equal(scene.stripes[0].lineStyle,lineStyle);
      assert.equal(scene.stripes[0].motif,motif);
    }
  }
});
test('dotted/dashed marks keep the same anchor and spacing when overscan is used',()=>{
  const scene=resolveScene({seed:'off-frame-style',family:'studio',
    geometry:'chevron',lineStyle:'dashed',motif:'solid'});
  const stripe=scene.stripes[2],marks=stripeLineMarks(stripe,scene.extent);
  const canvas={width:600,height:1300,getContext:()=>new FakeContext('main')},cache={};
  drawWallpaper(canvas,{...scene,positionX:0,positionY:0},{cache});
  assert.ok(cache.ink.width>600);
  assert.deepEqual(stripeLineMarks(stripe,scene.extent),marks);
});

test('diagonal mirroring applies to ink transform, not the whole background canvas',()=>{
  for(const [mirrorHorizontal,mirrorVertical] of [[true,false],[false,true],[true,true]]){
    calls.length=0;
    const scene=drawWallpaper({width:600,height:1300,getContext:()=>new FakeContext('main')},
      {seed:'reflect-geometry',orientation:'diagonal',geometry:'wave',
        diagonalRotation:29,mirrorHorizontal,mirrorVertical});
    assert.equal(scene.mirrorHorizontal,mirrorHorizontal);
    assert.equal(scene.mirrorVertical,mirrorVertical);
    assert.ok(calls.some(x=>x[0]==='scale'&&x[1]===(mirrorHorizontal?-1:1)&&
      x[2]===(mirrorVertical?-1:1)),'stripe ink uses reflected geometry');
    for(const stripe of scene.stripes){
      balanceStripeEnds(scene,stripe);
      if(stripe.hidden)continue;
      const contacts=stripeFrameContacts(scene,stripe);
      assert.equal(contacts.left,contacts.right);
      assert.equal(contacts.top,contacts.bottom);
    }
  }
});

test('interior decoration renders and clips for paths and every region family',()=>{
  for(const [structure,mode,key] of [
    ['paths','wave','geometry'],
    ['paths','loop','geometry'],
    ['radial','sunburst','radialMode'],
    ['radial','pinwheel','radialMode'],
    ['radial','spokes','radialMode'],
    ['radial','concentric','radialMode'],
    ['regions','voronoi','regionMode'],
    ['regions','organic','regionMode'],
    ['regions','facets','regionMode'],
    ['regions','blocks','regionMode'],
    ['regions','nested','regionMode']
  ]){
    const recipe={seed:'decor:'+mode,structure,[key]:mode,rayCount:7,regionCount:7,
      interiorElements:[
        {id:'line',type:'line',shape:'wave',stroke:'dotted',color:'custom',
          customColor:'#eeeeee',width:1.5,frequency:7},
        {id:'band',type:'band',shape:'zigzag',stroke:'solid',color:'darker',
          width:2.5,amplitude:.08,colorSlots:[0,1,2,3,4,5,6]}
      ]};
    calls.length=0;
    assert.doesNotThrow(()=>drawWallpaper(
      {width:300,height:650,getContext:()=>new FakeContext('main')},recipe),structure+'/'+mode);
    assert.ok(calls.some(x=>x[0]==='clip'),structure+'/'+mode+' decorations must be clipped');
  }
});
