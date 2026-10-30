import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe,respectSettingLocks} from '../src/model.js';
import {normalizeVectorPath} from '../src/vector-path-commands.js';
import {prepareTextFollowPath} from '../src/text-path-geometry.js';
import {appliedDrawnPathRecipe} from '../src/draw-apply-transaction.js';
import {importAgentRecipe,describeAgentCapabilities} from '../src/agent-api.js';
import {embedPngMetadata,extractPngRecipeWithProvenance,RECIPE_FORMAT_V3} from '../src/png-metadata.js';

const source=normalizeVectorPath({
  space:'normalized-design',closed:false,
  start:{id:'begin',point:[.16,.12]},
  segments:[
    {kind:'cubic',to:{id:'bend',point:[.5,.7]},
      controlOut:[.2,.6],controlIn:[.3,.82]},
    {kind:'cubic',to:{id:'finish',point:[.85,.9]},
      controlOut:[.7,.58],controlIn:[.8,.72]}
  ],nodeModes:{bend:'independent'}
});
const v3=()=>normalizeRecipe({
  seed:'vector-v3-preview-test',structure:'paths',geometry:'drawn',
  orientation:'horizontal',vectorPath:source,construction:'stroke'
});

test('v3 recipe and URL serialization preserve real authored control coordinates and IDs',()=>{
  const recipe=v3();
  assert.equal(recipe.version,3);
  assert.equal(Object.hasOwn(recipe,'vectorPath'),true);
  assert.deepEqual(recipe.vectorPath,source);
  assert.deepEqual(recipe.customPath,[]);
  assert.deepEqual(recipe.drawnAnchors,[]);
  assert.deepEqual(recipe.drawnCorners,[]);
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
  const modified=normalizeRecipe({...recipe,spread:45,viewZoom:1.5,viewPanX:-4});
  assert.equal(modified.version,3);
  assert.deepEqual(modified.vectorPath,source);
  assert.deepEqual(recipe.vectorPath,source);
});
test('true cubic commands resolve through the same production scene and stripe sampler',()=>{
  const scene=resolveScene(v3());
  assert.equal(scene.geometry,'drawn');
  assert.equal(scene.stripes.length,7);
  assert.ok(scene.stripes.every(s=>s.drawnPath===scene.stripes[0].drawnPath));
  const p=scene.stripes[0].drawnPath;
  assert.ok(p.total>500&&p.points.length>3);
  assert.equal(p.closed,false);
  assert.deepEqual(p.points[0],{x:.16*600-300,y:.12*1300-650});
  assert.deepEqual(p.points.at(-1),{x:.85*600-300,y:.9*1300-650});
});
test('curved text follows the same v3 authored path source',()=>{
  const prepared=prepareTextFollowPath({path:'drawn'},source);
  assert.ok(prepared&&prepared.total>500);
  for(const n of [-40,0,40]){
    const s=prepared.sample(n);
    assert.ok(Number.isFinite(s.x)&&Number.isFinite(s.y)&&Number.isFinite(s.angle));
  }
});
test('legacy v2 recipes and sampled-path editor commits keep their original schema',()=>{
  const legacy=normalizeRecipe({
    geometry:'drawn',customPath:[[.2,.2],[.45,.6],[.8,.8]]});
  assert.equal(legacy.version,2);
  assert.equal(Object.hasOwn(legacy,'vectorPath'),false);
  assert.ok(legacy.customPath.length>=2);
  const replaced=appliedDrawnPathRecipe(v3(),[[.2,.2],[.4,.5],[.8,.8]]);
  assert.equal(replaced.version,2);
  assert.equal(Object.hasOwn(replaced,'vectorPath'),false);
  assert.deepEqual(replaced.customPath,[[.2,.2],[.4,.5],[.8,.8]]);
});
test('explicit v3 refuses competing geometry, malformed control points and absent vectors',()=>{
  assert.throws(()=>normalizeRecipe({version:3}),/requires a vectorPath/);
  assert.throws(()=>normalizeRecipe({version:3,vectorPath:source,customPath:[[.1,.1],[.9,.9]]}),
    /one valid vectorPath/);
  assert.throws(()=>normalizeRecipe({version:3,vectorPath:{
    ...source,segments:[{kind:'cubic',to:{id:'bad',point:[.8,.8]},
      controlOut:[NaN,.3],controlIn:[.4,.5]}]
  }}),/one valid vectorPath/);
  assert.equal(decodeRecipe(encodeURIComponent(JSON.stringify({version:3,seed:'x'}))),null);
});
test('geometry lock preserves exact source dialect, direction and stable node IDs',()=>{
  const locked=normalizeRecipe({...v3(),lockedSettings:['geometry']});
  const next=normalizeRecipe({geometry:'drawn',customPath:[[.1,.1],[.8,.8]]});
  const retained=respectSettingLocks(locked,next);
  assert.equal(retained.version,3);
  assert.deepEqual(retained.vectorPath,source);
  assert.deepEqual(retained.customPath,[]);
  const oldLocked=normalizeRecipe({geometry:'drawn',customPath:[[.1,.1],[.8,.8]],
    lockedSettings:['geometry']});
  const older=respectSettingLocks(oldLocked,v3());
  assert.equal(older.version,2);
  assert.equal(Object.hasOwn(older,'vectorPath'),false);
  assert.deepEqual(older.customPath,oldLocked.customPath);
});
test('agent import accepts canonical v3, but malformed/future geometry fails closed',()=>{
  const recipe=v3();
  assert.deepEqual(importAgentRecipe(recipe),recipe);
  assert.ok(describeAgentCapabilities().supportedImportRecipeVersions.includes(3));
  assert.throws(()=>importAgentRecipe({...recipe,vectorPath:{broken:true}}));
  assert.throws(()=>importAgentRecipe({...recipe,version:4}));
});

test('embedded PNG records true vector v3 metadata and restores exact authored controls',()=>{
  const tiny=Uint8Array.from(Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/9QAAAABJRU5ErkJggg==','base64'));
  const recipe=v3();
  const file=embedPngMetadata(tiny,{title:'vector test'},{recipe});
  const restored=extractPngRecipeWithProvenance(file);
  assert.equal(restored.format,RECIPE_FORMAT_V3);
  assert.deepEqual(restored.recipe,recipe);
  assert.equal(restored.normalizedFieldsChanged,false);
  assert.deepEqual(restored.recipe.vectorPath.segments[0].controlIn,
    source.segments[0].controlIn);
});
