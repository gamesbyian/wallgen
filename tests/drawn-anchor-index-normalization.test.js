import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeDrawnPath,normalizeDrawnPathWithIndexMap,MAX_DRAWN_POINTS}
  from '../src/drawn-path.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe,resolveScene,respectSettingLocks}
  from '../src/model.js';
import {createPointEditor,savedPointCorners,savedPointAnchors}
  from '../src/path-point-editor.js';

test('a deduplicated imported sample never moves authored corners to the next vertex',()=>{
  const raw=[[.1,.1],[.4,.4],[.4001,.4001],[.6,.45],[.8,.8]];
  const geometry=normalizeDrawnPathWithIndexMap(raw);
  assert.deepEqual(geometry.points,[raw[0],raw[1],raw[3],raw[4]]);
  assert.deepEqual(geometry.indexMap,[0,1,1,2,3]);
  const saved=normalizeRecipe({geometry:'drawn',customPath:raw,
    drawnAnchors:[2,3,4,4],drawnCorners:[2,3]});
  assert.deepEqual(saved.customPath,geometry.points);
  assert.deepEqual(saved.drawnAnchors,[1,2,3]);
  assert.deepEqual(saved.drawnCorners,[1,2]);
  const editor=createPointEditor(saved.customPath,saved.drawnAnchors,saved.drawnCorners);
  assert.deepEqual(savedPointCorners(editor),[1,2]);
  assert.deepEqual(savedPointAnchors(editor),[1,2,3]);
  assert.deepEqual(normalizeRecipe(saved),saved);
  assert.deepEqual(decodeRecipe(encodeRecipe(saved)),saved);
});

test('legacy long paths remap pins by arc-length station, not XY proximity',()=>{
  const raw=Array.from({length:240},(_,i)=>{
    const t=i/239*Math.PI*4;
    return [.5+.28*Math.sin(t),.5+.2*Math.sin(2*t)];
  });
  const source=normalizeDrawnPath(raw);
  assert.equal(source.length,MAX_DRAWN_POINTS);
  const {points,indexMap}=normalizeDrawnPathWithIndexMap(raw);
  assert.deepEqual(points,source,'the actual 96 world samples are unchanged');
  assert.equal(indexMap[0],0);
  assert.equal(indexMap[239],MAX_DRAWN_POINTS-1);
  for(let i=1;i<240;i++)assert.ok(indexMap[i]>=indexMap[i-1],
    'source station mapping must never jump backwards through a crossing');
  const sourcePin=173;
  const saved=normalizeRecipe({geometry:'drawn',customPath:raw,
    drawnAnchors:[sourcePin,239],drawnCorners:[sourcePin],
    extendDrawnPath:true,viewZoom:.5,viewPanX:21,positionY:-11});
  assert.deepEqual(saved.drawnAnchors,[indexMap[sourcePin],95]);
  assert.deepEqual(saved.drawnCorners,[indexMap[sourcePin]]);
  assert.ok(indexMap[sourcePin]>0&&indexMap[sourcePin]<95);
  assert.deepEqual(saved.customPath,source);
  const roundtrip=decodeRecipe(encodeRecipe(saved));
  assert.deepEqual(roundtrip,saved);
  assert.deepEqual([roundtrip.viewZoom,roundtrip.viewPanX,roundtrip.positionY],
    [.5,21,-11]);
});

test('invalidation and out-of-range raw metadata stay inert and well-defined',()=>{
  const input=[[.08,.1],['invalid',.2],[.4,.4],null,[.75,.9]];
  const path=normalizeDrawnPathWithIndexMap(input);
  assert.deepEqual(path.indexMap[0],0);
  assert.equal(path.indexMap[1],undefined);
  assert.deepEqual(path.indexMap[2],1);
  assert.equal(path.indexMap[3],undefined);
  assert.deepEqual(path.indexMap[4],2);
  const saved=normalizeRecipe({geometry:'drawn',customPath:input,
    drawnAnchors:[1,2,3,4,400,-2,1.7],drawnCorners:[2,4]});
  assert.deepEqual(saved.drawnAnchors,[1,2]);
  assert.deepEqual(saved.drawnCorners,[1,2]);
  assert.deepEqual(normalizeDrawnPathWithIndexMap('invalid'),{points:[],indexMap:[]});
  assert.deepEqual(normalizeDrawnPathWithIndexMap([[.1,.1]]),{points:[],indexMap:[]});
});

test('already-normalized 96-point source is pixel/scene invariant and metadata remains stable',()=>{
  const fixture=JSON.parse(readFileSync(new URL('./fixtures/drawn-knot-t0b4v5.json',
    import.meta.url),'utf8'));
  const recipe=normalizeRecipe({...fixture,drawnAnchors:[4,26,78],
    drawnCorners:[26],viewZoom:.75,viewPanX:12,viewPanY:-19,
    positionX:13,positionY:-8});
  assert.deepEqual(recipe.customPath,fixture.customPath);
  assert.deepEqual(recipe.drawnAnchors,[4,26,78]);
  assert.deepEqual(recipe.drawnCorners,[26]);
  const again=normalizeRecipe(recipe);
  assert.deepEqual(again,recipe);
  assert.deepEqual(resolveScene(again),resolveScene(recipe));
});

test('geometry lock protects both path geometry and remapped corner constraints',()=>{
  const current=normalizeRecipe({geometry:'drawn',customPath:[
    [.1,.1],[.4,.3],[.8,.8]],drawnAnchors:[1],drawnCorners:[1],
    lockedSettings:['geometry']});
  const hostile=normalizeRecipe({geometry:'wave',customPath:[
    [.1,.1],[.35,.32],[.3501,.3201],[.7,.9]],
    drawnAnchors:[2],drawnCorners:[2]});
  const retained=respectSettingLocks(current,hostile);
  assert.equal(retained.geometry,'drawn');
  assert.deepEqual(retained.customPath,current.customPath);
  assert.deepEqual(retained.drawnAnchors,[1]);
  assert.deepEqual(retained.drawnCorners,[1]);
});
