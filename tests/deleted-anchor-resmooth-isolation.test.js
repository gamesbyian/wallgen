import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPointEditor,clonePointEditor,movePointAnchor,deletePointAnchor,
  resmoothPointEdits,savedPointAnchors,savedPointCorners
} from '../src/path-point-editor.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const source=Array.from({length:96},(_,i)=>{
  const t=i/95*2*Math.PI;
  return [.5+.36*Math.sin(t),.5+.18*Math.sin(2*t)+.025*Math.sin(9*t)];
});
const interior=e=>e.anchors.find(i=>i>5&&i<e.points.length-6);
const copy=e=>e.points.map(p=>p.slice());

test('delete removes a moved anchor from pending resmoothing and preserves the remaining curve',()=>{
  const e=createPointEditor(source),index=interior(e);
  assert.ok(Number.isInteger(index));
  movePointAnchor(e,index,[e.points[index][0]+.028,e.points[index][1]-.018]);
  assert.ok(e.changed.has(index));
  const prior=clonePointEditor(e);
  assert.equal(deletePointAnchor(e,index),true);
  assert.equal(e.changed.has(index),false,
    'removed anchor must not survive in next resmoothing transaction');
  assert.ok(!savedPointAnchors(e).includes(index));
  assert.ok(!savedPointCorners(e).includes(index));
  const afterDelete=copy(e);
  resmoothPointEdits(e,10);
  assert.deepEqual(e.points,afterDelete,
    'resmoothing with no remaining changed anchors is an exact no-op');
  assert.equal(e.selected,-1);
  assert.ok(prior.anchors.includes(index),
    'Undo snapshot keeps the original anchor and moved geometry');
  assert.ok(prior.changed.has(index));
});

test('stale foreign marker indices cannot select unrelated anchor regions',()=>{
  const e=createPointEditor(source);
  const points=copy(e);
  e.changed.add(-1);e.changed.add(200);e.changed.add(1.25);
  resmoothPointEdits(e,10);
  assert.deepEqual(e.points,points);
  assert.deepEqual([...e.pinned],[]);
});

test('removal does not corrupt unrelated authored corner metadata or portable recipe',()=>{
  const e=createPointEditor(source);
  const candidates=e.anchors.filter(i=>i>0&&i<e.points.length-1);
  assert.ok(candidates.length>=2);
  const [deleteIndex,cornerIndex]=[candidates[0],candidates.at(-1)];
  e.pinned.add(deleteIndex);e.pinned.add(cornerIndex);e.corners.add(cornerIndex);
  movePointAnchor(e,deleteIndex,[e.points[deleteIndex][0]+.012,e.points[deleteIndex][1]+.01]);
  assert.equal(deletePointAnchor(e,deleteIndex),true);
  assert.deepEqual(savedPointCorners(e),[cornerIndex]);
  assert.ok(savedPointAnchors(e).includes(cornerIndex));
  assert.ok(!savedPointAnchors(e).includes(deleteIndex));
  const recipe=normalizeRecipe({geometry:'drawn',customPath:e.points,
    drawnAnchors:savedPointAnchors(e),drawnCorners:savedPointCorners(e),
    viewZoom:.5,viewPanX:22,viewPanY:-17,positionX:11,positionY:-8});
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
  assert.deepEqual([recipe.viewZoom,recipe.viewPanX,recipe.viewPanY,
    recipe.positionX,recipe.positionY],[.5,22,-17,11,-8]);
});
