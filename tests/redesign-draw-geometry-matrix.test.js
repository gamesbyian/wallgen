import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe,
  OUTPUT_WIDTH,OUTPUT_HEIGHT} from '../src/model.js';
import {viewCamera} from '../src/view-camera.js';
import {normalizeDrawnPath,prepareDrawnPath,pointOnDrawnPath,
  finishDrawnPath,MAX_DRAWN_POINTS} from '../src/drawn-path.js';
import {CROSSING_MODES,findPathCrossings,crossingTopIsLater}
  from '../src/crossing-order.js';
import {embedPngMetadata,extractPngRecipe,serializePngRecipe}
  from '../src/png-metadata.js';
const png=Uint8Array.from(Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/9QAAAABJRU5ErkJggg==',
  'base64'));
const crossPath=[
  [-.28,.12],[.12,.30],[.5,.48],[.88,.67],[1.28,.86],
  [1.15,.86],[.78,.86],[.35,.86],[-.28,.86],
  [-.12,.77],[.2,.62],[.5,.48],[.8,.34],[1.1,.2],[1.28,.12],
  [.85,.12],[.5,.12],[.1,.12],[-.28,.12],[-.28,.22]
];
const scenes=[
  ['paths-wave',{structure:'paths',geometry:'wave',shapeFrequency:22}],
  ['paths-drawn-weave',{structure:'paths',geometry:'drawn',
    customPath:crossPath,drawnAnchors:[3,11],drawnCorners:[11],
    extendDrawnPath:true,crossingMode:'weave'}],
  ['radial-pinwheel',{structure:'radial',radialMode:'pinwheel',
    rayCount:23,rayTwist:35}],
  ['regions-voronoi',{structure:'regions',regionMode:'voronoi',
    regionCount:19,regionJitter:64}],
  ['regions-nested',{structure:'regions',regionMode:'nested',
    regionCount:12,regionSides:7}]
];
test('all supported structure fixtures retain identical source geometry across camera and native-size framing',()=>{
  for(const [id,input] of scenes){
    const original=normalizeRecipe({seed:'a3-geometry-'+id,...input,
      viewZoom:1,viewPanX:0,viewPanY:0,positionX:6,positionY:-4});
    const master=resolveScene(original);
    for(const zoom of [.5,.7,1,1.3,2.5])for(const [panX,panY] of [[0,0],[25,-20],[-50,50]]){
      const recentered=normalizeRecipe({...original,
        viewZoom:zoom,viewPanX:panX,viewPanY:panY});
      const generated=resolveScene(recentered);
      assert.deepEqual(generated.stripes,master.stripes,
        id+' regenerated authored stripe geometry while moving only the camera');
      assert.deepEqual(recentered.customPath,original.customPath,
        id+' discarded custom path while changing structure camera');
      assert.deepEqual(recentered.drawnAnchors,original.drawnAnchors);
      assert.deepEqual(recentered.drawnCorners,original.drawnCorners);
      assert.equal(recentered.positionX,6);
      assert.equal(recentered.positionY,-4);
      for(const side of ['left','right','top','bottom']){
        const preview=viewCamera(600,1300,zoom,{panX,panY});
        const native=viewCamera(OUTPUT_WIDTH,OUTPUT_HEIGHT,zoom,{panX,panY});
        assert.ok(Math.abs(preview.viewBounds[side]-native.viewBounds[side])<1e-8,
          id+' native and preview do not sample the same world '+side);
      }
      assert.deepEqual(decodeRecipe(encodeRecipe(recentered)),recentered,
        id+' camera state lost during URL transport');
      const serialized=JSON.parse(serializePngRecipe(recentered));
      assert.deepEqual(serialized.output,{width:OUTPUT_WIDTH,height:OUTPUT_HEIGHT});
      assert.deepEqual(serialized.recipe,recentered);
    }
  }
});
test('off-frame Draw geometry survives camera and both PNG and URL transport without clipping source',()=>{
  const initial=normalizeRecipe({seed:'a3-outside-source',
    structure:'paths',geometry:'drawn',customPath:crossPath,
    drawnAnchors:[3,11],drawnCorners:[11],
    extendDrawnPath:true,crossingMode:'under',
    viewZoom:.5,viewPanX:-25,viewPanY:20});
  assert.ok(initial.customPath.some(([x])=>x<0));
  assert.ok(initial.customPath.some(([x])=>x>1));
  const restored=extractPngRecipe(embedPngMetadata(png,
    {title:'Off-frame authored line'}, {recipe:initial}));
  assert.deepEqual(restored,initial);
  assert.deepEqual(decodeRecipe(encodeRecipe(initial)),initial);
  const prepared=prepareDrawnPath(initial.customPath);
  assert.ok(prepared&&!prepared.closed);
  const before=pointOnDrawnPath(prepared,0,{extrapolate:false});
  const beyond=pointOnDrawnPath(prepared,-.1,{extrapolate:true});
  assert.ok(Math.hypot(beyond.x-before.x,beyond.y-before.y)>10,
    'Enabled extension failed to generate world-space continuation');
  assert.deepEqual(pointOnDrawnPath(prepared,-.1,{extrapolate:false}),before,
    'Disabled extrapolation must clamp to original authored start');
});
test('saved traversals yield real intersections while over/under/weave never rewrite saved points',()=>{
  assert.deepEqual(CROSSING_MODES,['over','under','weave']);
  const stored=normalizeDrawnPath(crossPath);
  const prepared=prepareDrawnPath(stored);
  assert.ok(prepared&&prepared.total>300);
  const stripe={segmentStart:0,segmentEnd:1000,width:12};
  const crossings=findPathCrossings(stripe,1000,(_,t)=>
    pointOnDrawnPath(prepared,t/1000),{step:5});
  assert.ok(crossings.length>0,
    'Stored bow-tie is meant to contain at least one transverse crossing');
  for(const mode of CROSSING_MODES){
    const r=normalizeRecipe({seed:'a3-crossing-order',
      structure:'paths',geometry:'drawn',customPath:stored,
      crossingMode:mode,extendDrawnPath:true});
    assert.deepEqual(r.customPath,stored,'Crossing mode rewrote original stroke');
    assert.deepEqual(decodeRecipe(encodeRecipe(r)).customPath,stored);
  }
  for(let n=0;n<4;n++){
    assert.equal(crossingTopIsLater('over',0,n),true);
    assert.equal(crossingTopIsLater('under',0,n),false);
    assert.equal(crossingTopIsLater('weave',0,n),n%2===0);
    assert.equal(crossingTopIsLater('weave',1,n),n%2!==0);
  }
});
test('10x Smooth and Geometric are deterministic, capped, and retain original stroke endpoints',()=>{
  const original=[
    [.1,.2],[.14,.26],[.2,.3],[.3,.35],[.42,.42],[.52,.5],
    [.62,.58],[.75,.62],[.83,.75],[.9,.8]
  ];
  for(const mode of ['smooth','geometric']){
    const a=finishDrawnPath(original,mode,10);
    const b=finishDrawnPath(structuredClone(original),mode,10);
    assert.deepEqual(a,b,'10x '+mode+' changed without input changes');
    assert.ok(a.length>=2&&a.length<=MAX_DRAWN_POINTS);
    assert.ok(Math.hypot(a[0][0]-.1,a[0][1]-.2)<.005);
    assert.ok(Math.hypot(a.at(-1)[0]-.9,a.at(-1)[1]-.8)<.005);
    assert.deepEqual(original[0],[.1,.2],
      'Smoothing must not mutate original pointer samples');
  }
});
