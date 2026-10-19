import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPointEditor,clonePointEditor,movePointAnchor,
  savedPointAnchors,savedPointCorners
} from '../src/path-point-editor.js';
import {normalizeDrawnPathWithIndexMap,MAX_DRAWN_POINTS} from '../src/drawn-path.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const duplicate=[[.1,.1],[.4,.3],[.40012,.30003],[.66,.64],[.86,.91]];

test('live point editor remaps duplicate authored sample pins before selecting anchors',()=>{
  const editor=createPointEditor(duplicate,[2,4],[2]);
  assert.ok(editor);
  assert.deepEqual(editor.points,[duplicate[0],duplicate[1],duplicate[3],duplicate[4]]);
  assert.deepEqual(savedPointAnchors(editor),[1,3]);
  assert.deepEqual(savedPointCorners(editor),[1],
    'corner must attach to the original authored bend, not the next sample');
  assert.ok(editor.anchors.includes(1));
  assert.ok(editor.corners.has(1));
  const before=clonePointEditor(editor);
  movePointAnchor(editor,1,[.45,.32]);
  assert.deepEqual(editor.points[0],before.points[0]);
  assert.deepEqual(editor.points.at(-1),before.points.at(-1));
  assert.ok(before.corners.has(1),'Undo snapshot retains mapped corner identity');
  const saved=normalizeRecipe({geometry:'drawn',customPath:editor.points,
    drawnAnchors:savedPointAnchors(editor),drawnCorners:savedPointCorners(editor),
    positionX:12,viewZoom:.5,viewPanX:20});
  assert.deepEqual(decodeRecipe(encodeRecipe(saved)),saved);
});

test('oversampled self-crossing imports retain late-station pins and corners',()=>{
  const input=Array.from({length:240},(_,i)=>{
    const t=i/239*Math.PI*4;
    return [.5+.3*Math.sin(t),.5+.2*Math.sin(2*t)];
  });
  const mapped=normalizeDrawnPathWithIndexMap(input);
  assert.equal(mapped.points.length,MAX_DRAWN_POINTS);
  const late=191,early=45;
  assert.ok(mapped.indexMap[late]>mapped.indexMap[early]);
  const editor=createPointEditor(input,[late,early,239],[late,early]);
  assert.deepEqual(editor.points,mapped.points);
  assert.deepEqual(savedPointCorners(editor),
    [mapped.indexMap[early],mapped.indexMap[late]]);
  assert.deepEqual(savedPointAnchors(editor),
    [mapped.indexMap[early],mapped.indexMap[late],95]);
  for(const i of savedPointCorners(editor))assert.ok(editor.anchors.includes(i));
  assert.deepEqual(clonePointEditor(editor).points,editor.points);
});

test('hostile invalid indices never relocate valid authored metadata',()=>{
  const source=[[.08,.11],['bad',.11],[.25,.42],null,
    [.25002,.42002],[.79,.88]];
  const editor=createPointEditor(source,[1,2,3,4,5,900,-1,NaN,1.5],[4]);
  assert.deepEqual(savedPointAnchors(editor),[1,2]);
  assert.deepEqual(savedPointCorners(editor),[1]);
  assert.deepEqual(editor.points,[[.08,.11],[.25,.42],[.79,.88]]);
});

test('editing already normalized 96-point drawn recipes is pixel-identical on entry',()=>{
  const raw=Array.from({length:96},(_,i)=>{
    const t=i/95*Math.PI*2;
    return [.5+.35*Math.sin(t),.5+.21*Math.sin(2*t)];
  });
  const input=normalizeRecipe({geometry:'drawn',customPath:raw,
    drawnAnchors:[14,63,83],drawnCorners:[63]});
  const editor=createPointEditor(input.customPath,input.drawnAnchors,input.drawnCorners);
  assert.deepEqual(editor.points,input.customPath);
  assert.deepEqual(savedPointAnchors(editor),input.drawnAnchors);
  assert.deepEqual(savedPointCorners(editor),input.drawnCorners);
});
