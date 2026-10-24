import test from 'node:test';
import assert from 'node:assert/strict';
import {RECONSTRUCTION_R0_CASES,baselineRecipe,readBaselineArgs}
  from '../scripts/review-reconstruction.mjs';
import {embedPngMetadata,stripPngDescriptiveMetadata,scanPngChunks,
  extractPngRecipe} from '../src/png-metadata.js';
import {normalizeRecipe,resolveScene} from '../src/model.js';

// This tiny valid PNG fixture is only for verifying byte-safe stripping.
// Actual artwork baselines are generated separately via Playwright opt-in.
const tiny=Uint8Array.from(Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/9QAAAABJRU5ErkJggg==',
  'base64'));

test('metadata-free reconstruction source keeps every IDAT and image dimension verbatim',()=>{
  const recipe=normalizeRecipe({seed:'strip-evidence',structure:'paths'});
  const before=embedPngMetadata(tiny,{title:'Artist proof',comment:'Study'},
    {recipe,output:{width:1,height:1}});
  const bytes=Uint8Array.from(before);
  const cleaned=stripPngDescriptiveMetadata(before);
  assert.deepEqual(before,bytes,'input argument remains intact');
  assert.deepEqual(extractPngRecipe(before),recipe);
  assert.equal(extractPngRecipe(cleaned),null);
  const original=scanPngChunks(before),copy=scanPngChunks(cleaned);
  assert.equal(original.width,copy.width);
  assert.equal(original.height,copy.height);
  const preserve=chunks=>chunks.filter(c=>['IHDR','IDAT','IEND'].includes(c.type))
    .map(c=>({type:c.type,bytes:Array.from(c.raw)}));
  assert.deepEqual(preserve(original.chunks),preserve(copy.chunks));
  assert.ok(cleaned.length<before.length,'descriptive and recipe chunks removed');
  assert.deepEqual(stripPngDescriptiveMetadata(tiny),tiny,
    'unannotated baseline must remain byte-for-byte identical');
  assert.throws(()=>stripPngDescriptiveMetadata([1,2,3]),/not a PNG/);
});

test('R0 baseline covers current renderer path/radial/shape/material/fibre modes',()=>{
  assert.equal(RECONSTRUCTION_R0_CASES.length,22);
  const names=new Set(RECONSTRUCTION_R0_CASES.map(c=>c.id));
  assert.equal(names.size,RECONSTRUCTION_R0_CASES.length,'output names must be unique, no overwrite');
  const cases=RECONSTRUCTION_R0_CASES.map(baselineRecipe);
  assert.ok(cases.some(c=>c.structure==='regions'&&c.regionMode==='scattered'&&
    c.scatteredOverrides?.length===7));
  assert.ok(cases.some(c=>c.scatteredShapeKind==='imported'&&
    c.scatteredShape?.geometry?.components.length===2));
  assert.ok(cases.some(c=>c.material==='linen-organic'&&
    c.surfaceTreatments?.some(t=>t.style==='satin-fibre')));
  assert.ok(cases.some(c=>c.palette==='jewel'&&c.geometry==='straight'));
  assert.ok(cases.some(c=>c.palette==='pastel'&&c.regionMode==='scattered'));
  const overlapped=cases.find(c=>c.seed==='r0-overlap-reverse-layer');
  assert.equal(overlapped.scatteredCount,7);
  assert.deepEqual(overlapped.scatteredLayerOrder,[6,5,4,3,2,1,0]);
  assert.deepEqual(resolveScene(overlapped).objects.map(object=>object.colorIndex),
    [6,5,4,3,2,1,0],'actual source explicitly reverses paint/occlusion order');
  const partial=cases.find(c=>c.seed==='r0-five-hue-islands');
  assert.equal(partial.scatteredCount,5);
  assert.deepEqual(resolveScene(partial).objects.map(object=>object.colorIndex),[0,1,2,3,4]);
  const twice=cases.find(c=>c.seed==='r0-fourteen-colour-circles');
  assert.equal(twice.scatteredCount,14);
  assert.equal(resolveScene(twice).objects.length,14,
    'two native objects for each canonical hue render without a new scene');
  const holes=cases.find(c=>c.seed==='r0-seven-holed-stamps');
  assert.equal(holes.scatteredCount,7);
  assert.equal(resolveScene(holes).objects.length,7);
  assert.ok(resolveScene(holes).objects.every(o=>o.rings?.length===3),
    'seven hue stamps retain one hole and one detached island per source shape');
  assert.ok(cases.some(c=>c.structure==='radial'));
  assert.ok(cases.some(c=>c.geometry==='drawn'&&c.customPath.length>=2));
  for(const item of cases){
    const scene=resolveScene(item);
    assert.ok(scene&&scene.objects?.length,'each study must resolve current scene objects');
  }
});

test('R0 command-line supports list/help and rejects accidental flags',()=>{
  assert.equal(readBaselineArgs(['--list']).list,true);
  assert.equal(readBaselineArgs(['--out-dir','artifacts/r0','--browser','/usr/bin/chromium']).outDir,'artifacts/r0');
  assert.throws(()=>readBaselineArgs(['--out-dir']),/incomplete/);
  assert.throws(()=>readBaselineArgs(['--write-main']),/Unknown/);
});
