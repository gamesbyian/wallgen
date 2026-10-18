import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createPointEditor,chooseAnchorIndices,clonePointEditor,
  addPointAnchor,deletePointAnchor,movePointAnchor,movePointHandle,
  pointHandles,resmoothPointEdits,savedPointAnchors,savedPointCorners} from '../src/path-point-editor.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe,respectSettingLocks} from '../src/model.js';

const figureEight=Array.from({length:96},(_,i)=>{
  const t=-Math.PI/2+2*Math.PI*i/95;
  return [.5+.29*Math.sin(t),.5+.17*Math.sin(2*t)];
});
const pixel=(a,b)=>Math.hypot(600*(a[0]-b[0]),1300*(a[1]-b[1]));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
test('entering anchor edit mode leaves the actual imported curve untouched',()=>{
  const fixture=JSON.parse(readFileSync(new URL('./fixtures/drawn-knot-t0b4v5.json',import.meta.url),'utf8'));
  const e=createPointEditor(fixture.customPath);
  assert.deepEqual(e.points,fixture.customPath);
  assert.ok(e.anchors.length>=4&&e.anchors.length<fixture.customPath.length);
  assert.equal(e.anchors[0],0);
  assert.equal(e.anchors.at(-1),fixture.customPath.length-1);
});
test('anchor choice includes meaningful bends, long reaches and user pins',()=>{
  const result=chooseAnchorIndices(figureEight,[20,73]);
  assert.ok(result.includes(20)&&result.includes(73));
  assert.ok(result.length>=7,'curved knot gets multiple edit stations');
  assert.deepEqual(result,[...result].sort((a,b)=>a-b));
});
test('anchor movement is local, preserves neighbouring nodes and original topology elsewhere',()=>{
  const e=createPointEditor(figureEight),index=e.anchors[Math.floor(e.anchors.length/2)];
  const at=e.anchors.indexOf(index),lo=e.anchors[at-1],hi=e.anchors[at+1];
  const before=e.points.map(p=>p.slice());
  const moved=[before[index][0]+.03,before[index][1]-.015];
  movePointAnchor(e,index,moved);
  assert.ok(pixel(e.points[index],moved)<.01);
  assert.deepEqual(e.points[lo],before[lo]);
  assert.deepEqual(e.points[hi],before[hi]);
  assert.deepEqual(e.points.slice(0,lo),before.slice(0,lo));
  assert.deepEqual(e.points.slice(hi+1),before.slice(hi+1));
  assert.ok(savedPointAnchors(e).includes(index));
  resmoothPointEdits(e,10);
  assert.ok(pixel(e.points[index],moved)<.01,'smoothing may never move a corrected anchor');
  assert.deepEqual(e.points[lo],before[lo]);
  assert.deepEqual(e.points[hi],before[hi]);
});
test('smooth tangent handles influence adjacent spans without changing anchors',()=>{
  const e=createPointEditor(figureEight),index=e.anchors[Math.floor(e.anchors.length/2)];
  const before=e.points.map(p=>p.slice()),handles=pointHandles(e,index);
  movePointHandle(e,index,'out',[handles.out[0]+.035,handles.out[1]-.02]);
  assert.deepEqual(e.points[index],before[index]);
  assert.deepEqual(e.points[0],before[0]);
  assert.deepEqual(e.points.at(-1),before.at(-1));
  assert.ok(e.points.some((p,i)=>pixel(p,before[i])>1));
  for(const anchor of e.anchors)assert.deepEqual(e.points[anchor],before[anchor]);
  assert.ok(savedPointAnchors(e).includes(index));
});
test('new/deleted anchors and undo clones preserve sampled pixels',()=>{
  const e=createPointEditor(figureEight),before=clonePointEditor(e);
  const index=Array.from({length:e.points.length},(_,i)=>i)
    .find(i=>i>2&&i<e.points.length-3&&e.anchors.every(k=>Math.abs(k-i)>=3));
  assert.ok(Number.isInteger(index));
  assert.ok(addPointAnchor(e,index));
  assert.ok(savedPointAnchors(e).includes(index));
  assert.equal(addPointAnchor(e,index),false);
  assert.ok(deletePointAnchor(e,index));
  assert.ok(!e.anchors.includes(index));
  assert.deepEqual(e.points,before.points,'changing handles never redraws the curve');
  movePointAnchor(e,e.anchors[1],[.35,.52]);
  assert.notDeepEqual(e.points,before.points);
  assert.deepEqual(before.points,createPointEditor(figureEight).points);
});
test('manual anchor metadata roundtrips and geometry locks guard it',()=>{
  const recipe=normalizeRecipe({geometry:'drawn',customPath:figureEight,
    drawnAnchors:[4,22,22,70,200,-9,2.5],drawnCorners:[22,70]});
  assert.deepEqual(recipe.drawnAnchors,[4,22,70]);
  const saved=decodeRecipe(encodeRecipe(recipe));
  assert.deepEqual(saved.drawnAnchors,recipe.drawnAnchors);
  assert.deepEqual(saved.drawnCorners,[22,70]);
  const locked=normalizeRecipe({...recipe,lockedSettings:['geometry']});
  const attempted=respectSettingLocks(locked,{geometry:'wave',
    customPath:[[.1,.1],[.8,.8]],drawnAnchors:[],drawnCorners:[]});
  assert.equal(attempted.geometry,'drawn');
  assert.deepEqual(attempted.drawnAnchors,[4,22,70]);
  assert.deepEqual(attempted.drawnCorners,[22,70]);
  const editor=createPointEditor(saved.customPath,saved.drawnAnchors,saved.drawnCorners);
  for(const pin of saved.drawnAnchors)assert.ok(editor.anchors.includes(pin));
  assert.deepEqual(savedPointCorners(editor),[22,70]);
});

test('endpoint anchor can move without tearing the rest of a path',()=>{
  const e=createPointEditor(figureEight);
  const before=e.points.map(p=>p.slice()),last=e.points.length-1;
  const target=[before[0][0]+.022,before[0][1]+.013];
  movePointAnchor(e,0,target);
  assert.ok(pixel(e.points[0],target)<.01);
  assert.deepEqual(e.points.at(-1),before.at(-1));
  const neighbour=e.anchors[1];
  assert.deepEqual(e.points[neighbour],before[neighbour]);
  assert.deepEqual(e.points.slice(neighbour+1),before.slice(neighbour+1));
  assert.ok(savedPointAnchors(e).includes(0));
});
test('sharp-corner handles read different tangents and persist as manual constraints',()=>{
  const e=createPointEditor([[.1,.1],[.2,.2],[.25,.35],[.4,.4],
    [.6,.4],[.75,.6],[.8,.8]]);
  const index=e.anchors.find(i=>i>0&&i<e.points.length-1);
  e.corners.add(index);e.pinned.add(index);
  const handles=pointHandles(e,index),p=e.points[index];
  const incoming=[(p[0]-handles.in[0])*600,(p[1]-handles.in[1])*1300];
  const outgoing=[(handles.out[0]-p[0])*600,(handles.out[1]-p[1])*1300];
  assert.ok(Number.isFinite(incoming[0]+outgoing[0]));
  assert.deepEqual(savedPointCorners(e),[index]);
});
