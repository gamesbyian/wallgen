import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRecipe, encodeRecipe, decodeRecipe, resolveScene } from '../src/model.js';
import { RAINBOW_ORBITS, buildScatteredObjects } from '../src/scattered-composition.js';
import { normalizeScatteredOverrides,normalizeScatteredLayerOrder,
  effectiveScatteredLayerOrder,moveScatteredLayer } from '../src/scattered-object-edits.js';
import { GEOMETRY_SNAPSHOT_SCHEMA } from '../src/geometry-asset.js';

test('bounded manual transforms are canonical, sorted and reject malformed input', () => {
  assert.deepEqual(normalizeScatteredOverrides([null,{index:-1,x:0,y:0,radius:.2},
    {index:4,x:Infinity,y:0,radius:.2},{index:2,x:5,y:-2,radius:0},
    {index:1,x:.4,y:.6,radius:.22},{index:1,x:.123456789,y:.5,radius:.333333333}]), [
    {index:1,x:.123457,y:.5,radius:.333333},
    {index:2,x:1.5,y:-.5,radius:.01}
  ]);
  assert.deepEqual(normalizeScatteredOverrides({index:1,x:0,y:0,radius:.2}),[]);
});

test('the unchanged default recipe has no added serialization field', () => {
  const old=normalizeRecipe(RAINBOW_ORBITS);
  assert.equal(Object.hasOwn(old,'scatteredOverrides'),false);
  assert.deepEqual(decodeRecipe(encodeRecipe(old)),old);
});

test('moving and resizing one circle leaves every other seeded circle alone', () => {
  const base=normalizeRecipe(RAINBOW_ORBITS);
  const before=resolveScene(base).objects;
  assert.ok(before.length>=2,'the seeded preset supplies multiple objects');
  const chosen=before[0],index=Number(chosen.id.slice(7));
  const edit={index,x:.25,y:.72,radius:.12};
  const afterRecipe=normalizeRecipe({...base,scatteredOverrides:[edit]});
  const after=resolveScene(afterRecipe).objects;
  const moved=after.find(o=>o.id===chosen.id);
  assert.deepEqual(moved.circle,{cx:150,cy:936,r:72});
  assert.deepEqual(after.filter(o=>o.id!==chosen.id),before.filter(o=>o.id!==chosen.id),
    'one manual edit must never reshuffle the other circle positions or colours');
  assert.deepEqual(decodeRecipe(encodeRecipe(afterRecipe)),afterRecipe,
    'manual edits must survive saved/share/PNG recipe transport');
  const reset=normalizeRecipe({...afterRecipe,scatteredOverrides:[]});
  assert.deepEqual(resolveScene(reset).objects,before);
  assert.equal(Object.hasOwn(reset,'scatteredOverrides'),false);
});

test('imported silhouette stamps inherit individual transforms but keep compound shape painting', () => {
  const square={schema:GEOMETRY_SNAPSHOT_SCHEMA,version:1,geometry:{
    type:'compound-region',space:'asset-local',viewBox:[0,0,100,100],
    fillRule:'evenodd',components:[{outer:[[0,0],[100,0],[100,100],[0,100]],holes:[]}]
  }};
  const recipe=normalizeRecipe({...RAINBOW_ORBITS,scatteredShapeKind:'imported',
    scatteredShape:square,scatteredOverrides:[{index:0,x:.7,y:.33,radius:.17}]});
  const scene=buildScatteredObjects(recipe);
  const stamp=scene.objects.find(o=>o.id==='region-0');
  assert.ok(stamp,'first shape is present');
  assert.equal(stamp.circle,undefined,'renderer must draw compound paths, never its bounding disk');
  assert.equal(stamp.editCircle.cx,420);
  assert.equal(stamp.editCircle.cy,429);
  assert.ok(Math.abs(stamp.editCircle.r-102)<1e-9,
    'the transformed radius is stable to sub-pixel floating-point precision');
  assert.ok(stamp.rings[0].length>=4);
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
});

import {scatteredWorldToPixel,scatteredPixelToWorld,
  pickScatteredRegion,scatteredMoveOverride} from '../src/scattered-drag.js';

test('scattered drag camera round trips under zoom, pan and composition nudge',()=>{
  const recipe=normalizeRecipe({...RAINBOW_ORBITS,
    viewZoom:1.7,viewPanX:19,viewPanY:-13,positionX:14,positionY:-9});
  for(const [x,y] of [[100,200],[335,844],[-80,1340]]){
    const px=scatteredWorldToPixel(recipe,600,1300,x,y);
    const back=scatteredPixelToWorld(recipe,600,1300,px.x,px.y);
    assert.ok(Math.abs(back.x-x)<1e-8);
    assert.ok(Math.abs(back.y-y)<1e-8);
  }
});

test('touch selection respects topmost disk and holes in imported compound silhouettes',()=>{
  const round={kind:'region',id:'region-0',circle:{cx:100,cy:100,r:80}};
  const front={kind:'region',id:'region-1',circle:{cx:125,cy:120,r:60}};
  assert.equal(pickScatteredRegion([round,front],{x:115,y:110}).id,'region-1');
  const donut={kind:'region',id:'region-2',rings:[
    [{x:0,y:0},{x:90,y:0},{x:90,y:90},{x:0,y:90}],
    [{x:25,y:25},{x:65,y:25},{x:65,y:65},{x:25,y:65}]
  ]};
  assert.equal(pickScatteredRegion([donut],{x:5,y:5}).id,'region-2');
  assert.equal(pickScatteredRegion([donut],{x:45,y:45}),null);
  assert.equal(pickScatteredRegion([round],{x:182,y:100},3)?.id,'region-0');
});

test('single pointerup move retains unrelated authored transforms and saved recipe',()=>{
  const base=normalizeRecipe({...RAINBOW_ORBITS,scatteredOverrides:[
    {index:3,x:.2,y:.48,radius:.22}]});
  const circle={cx:390,cy:600,r:63};
  const edited=scatteredMoveOverride(base,2,circle,{x:198,y:936});
  assert.deepEqual(edited.map(z=>z.index),[2,3]);
  assert.equal(edited[0].x,.33);
  assert.equal(edited[0].y,.72);
  assert.equal(edited[0].radius,.105);
  assert.deepEqual(edited[1],base.scatteredOverrides[0]);
  const recipe=normalizeRecipe({...base,scatteredOverrides:edited});
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
});


test('layer order is bounded, identity-based and survives recipe transport',()=>{
  assert.deepEqual(normalizeScatteredLayerOrder([3,1,3,-1,70,0,2.5,2]),[3,1,0,2]);
  assert.deepEqual(normalizeScatteredLayerOrder('0,1,2'),[]);
  const defaultRecipe=normalizeRecipe(RAINBOW_ORBITS);
  assert.equal(Object.hasOwn(defaultRecipe,'scatteredLayerOrder'),false);
  const initial=Array.from({length:7},(_,i)=>i);
  assert.equal(moveScatteredLayer(undefined,0,-1,initial),null);
  const moved=moveScatteredLayer(undefined,0,1,initial);
  assert.deepEqual(moved,[1,0,2,3,4,5,6]);
  const recipe=normalizeRecipe({...defaultRecipe,scatteredLayerOrder:moved});
  assert.deepEqual(recipe.scatteredLayerOrder,moved);
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
  const ordered=resolveScene(recipe).objects;
  assert.deepEqual(ordered.slice(0,2).map(o=>o.id),['region-1','region-0']);
  assert.equal(ordered.find(o=>o.id==='region-0').colorIndex,0);
  assert.equal(ordered.find(o=>o.id==='region-1').colorIndex,1);
  assert.deepEqual(moveScatteredLayer(moved,0,-1,initial),[],
    'reversing the move omits the default-order field');
});

test('paint order controls overlap hit-testing without altering geometry or imported holes',()=>{
  const before=normalizeRecipe({...RAINBOW_ORBITS,scatteredOverlap:'overlap',
    scatteredOverrides:[
      {index:0,x:.5,y:.5,radius:.2},
      {index:1,x:.5,y:.5,radius:.2}]});
  const moved=normalizeRecipe({...before,
    scatteredLayerOrder:[1,0,2,3,4,5,6]});
  const a=resolveScene(before).objects,b=resolveScene(moved).objects;
  for(const id of ['region-0','region-1']){
    assert.deepEqual(a.find(o=>o.id===id).circle,b.find(o=>o.id===id).circle);
  }
  const beforeOverlap=a.filter(o=>['region-0','region-1'].includes(o.id));
  const afterOverlap=b.filter(o=>['region-0','region-1'].includes(o.id));
  assert.equal(pickScatteredRegion(beforeOverlap,{x:300,y:650})?.id,'region-1');
  assert.equal(pickScatteredRegion(afterOverlap,{x:300,y:650})?.id,'region-0');
  assert.deepEqual(effectiveScatteredLayerOrder(moved.scatteredLayerOrder,[0,1,2]),
    [1,0,2]);
  assert.deepEqual(effectiveScatteredLayerOrder([3,1,0,2],[0,1,2]),[1,0,2]);
});
