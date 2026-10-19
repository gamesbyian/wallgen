import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  createPointEditor,clonePointEditor,insertPointAnchor,movePointAnchor,
  savedPointAnchors,savedPointCorners
} from '../src/path-point-editor.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const sparse=[[.2,.3],[.8,.7]];
test('two-point imported path gets a real movable middle anchor without refitting',()=>{
  const e=createPointEditor(sparse);
  const before=clonePointEditor(e);
  assert.deepEqual(e.anchors,[0,1]);
  assert.equal(insertPointAnchor(e,0,.5),true);
  assert.deepEqual(e.anchors,[0,1,2]);
  assert.deepEqual(e.points[0],before.points[0]);
  assert.deepEqual(e.points[2],before.points[1]);
  assert.deepEqual(e.points[1],[.5,.5]);
  assert.deepEqual(savedPointAnchors(e),[1]);
  movePointAnchor(e,1,[.52,.48]);
  assert.deepEqual(e.points[0],before.points[0]);
  assert.deepEqual(e.points[2],before.points[1]);
  const recipe=normalizeRecipe({geometry:'drawn',customPath:e.points,
    drawnAnchors:savedPointAnchors(e),drawnCorners:savedPointCorners(e),
    viewZoom:.5,viewPanX:25,viewPanY:-18,positionX:15,positionY:-6});
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
  assert.deepEqual(createPointEditor(recipe.customPath,recipe.drawnAnchors).points,e.points);
  assert.deepEqual(before.points,sparse,'Undo snapshot must remain unchanged');
});

test('inserting ahead of pinned corners remaps every saved identity atomically',()=>{
  const points=[[.1,.2],[.3,.4],[.5,.2],[.7,.5],[.9,.6]];
  const e=createPointEditor(points,[2,3],[3]);
  const before=clonePointEditor(e);
  assert.equal(insertPointAnchor(e,0,.5),true);
  assert.deepEqual(e.points[0],points[0]);
  assert.deepEqual(e.points[1],[.2,.3]);
  assert.deepEqual(e.points.slice(2),points.slice(1));
  assert.ok(savedPointAnchors(e).includes(3));
  assert.ok(savedPointAnchors(e).includes(4));
  assert.deepEqual(savedPointCorners(e),[4]);
  assert.equal(e.selected,1);
  // Undo is an exact restoration of all sampled points and index metadata.
  assert.deepEqual(before.points,points);
  assert.deepEqual(savedPointCorners(before),[3]);
  assert.deepEqual(savedPointAnchors(before),[2,3]);
});

test('invalid, endpoint-adjacent and full-capacity insertion is nonmutating',()=>{
  const e=createPointEditor(sparse);
  const prior=clonePointEditor(e);
  for(const [segment,t] of [[-1,.5],[1,.5],[.5,.5],[0,-.01],
    [0,0],[0,.05],[0,.95],[0,1],[0,NaN],[0,Infinity]]){
    assert.equal(insertPointAnchor(e,segment,t),false,String([segment,t]));
    assert.deepEqual(e,prior);
  }
  const dense=Array.from({length:96},(_,i)=>[.1+i*.008,.2+i*.005]);
  const full=createPointEditor(dense);
  assert.equal(full.points.length,96);
  const snap=clonePointEditor(full);
  assert.equal(insertPointAnchor(full,2,.5),false);
  assert.deepEqual(full,snap);
});

test('off-frame segments remain off-frame on insertion and camera stays independent',()=>{
  const path=[[-1.2,-.9],[2.5,1.8]];
  const editor=createPointEditor(path);
  assert.equal(insertPointAnchor(editor,0,.25),true);
  assert.ok(editor.points[1][0]<0&&editor.points[1][1]<0);
  assert.deepEqual([editor.points[0],editor.points[2]],path);
  const recipe=normalizeRecipe({structure:'paths',geometry:'drawn',customPath:editor.points,
    extendDrawnPath:true,positionX:16,positionY:-12,viewZoom:.5,
    viewPanX:33,viewPanY:-29});
  assert.equal(recipe.extendDrawnPath,true);
  assert.deepEqual([recipe.positionX,recipe.positionY],[16,-12]);
  assert.deepEqual([recipe.viewZoom,recipe.viewPanX,recipe.viewPanY],[.5,33,-29]);
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)).customPath,editor.points);
});

test('Draw pointer integration uses same transformed hit plane for segment insertion',()=>{
  const source=readFileSync(new URL('../src/draw-path-ui.js',import.meta.url),'utf8');
  assert.match(source,/const a=project\(m,editor\.points\[i\]\),b=project\(m,editor\.points\[i\+1\]\)/);
  assert.match(source,/best=\{type:'insert',index:i,t\}/);
  assert.match(source,/insertPointAnchor\(editor,hit\.index,hit\.t\)/);
  assert.match(source,/if\(editor\.anchors\.some\(anchor=>Math\.abs\(anchor-i\)<3\)\)continue/);
});
