import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeRecipe} from '../src/model.js';
import {scatteredRadiusRange,buildScatteredCircles,buildScatteredObjects}
  from '../src/scattered-composition.js';

test('the reported size limit is the exact packing size limit',()=>{
  const recipe=normalizeRecipe({structure:'regions',regionMode:'scattered',
    scatteredCount:7,scatteredMinSize:100,scatteredMaxSize:0,seed:'range'});
  const r=scatteredRadiusRange(recipe);
  assert.equal(r.count,7);
  assert.equal(r.minRadius,73);
  assert.equal(r.maxRadius,73);
  assert.equal(r.collapsed,true);
  assert.equal(r.countCapped,false);
  const generated=buildScatteredCircles(recipe);
  assert.ok(generated.objects.every(obj=>obj.circle.r>=r.minRadius));
  assert.deepEqual(buildScatteredCircles(recipe),generated,
    'only UI explanation changes; seeded placement remains reproducible');
});
test('large independent shape counts cap maximum before placement',()=>{
  const r=scatteredRadiusRange({scatteredCount:70,scatteredMinSize:0,
    scatteredMaxSize:100});
  assert.equal(r.count,70);
  assert.equal(r.minRadius,8);
  assert.ok(Math.abs(r.maxRadius-170*Math.sqrt(10/70))<1e-9);
  assert.equal(r.collapsed,false);
  assert.equal(r.countCapped,true);
});
test('a valid seven-circle range needs no unnecessary warning',()=>{
  const r=scatteredRadiusRange({scatteredCount:7,scatteredMinSize:10,
    scatteredMaxSize:83});
  assert.equal(r.count,7);
  assert.equal(r.collapsed,false);
  assert.equal(r.countCapped,false);
  assert.ok(r.maxRadius>r.minRadius);
});
test('invalid imported silhouette renders safely, with explicit placeholder text',()=>{
  const recipe=normalizeRecipe({structure:'regions',regionMode:'scattered',
    scatteredShapeKind:'imported',scatteredShape:null,scatteredCount:3});
  const generated=buildScatteredObjects(recipe);
  assert.ok(generated.diagnostic?.includes('Choose an imported shape'));
  assert.ok(generated.objects.length);
  const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  assert.match(app,/Circles are placeholders/);
  assert.match(app,/scatteredSourceNotice/);
  assert.match(app,/scatteredSizeRangeStatus/);
  assert.match(app,/scatteredRadiusRange\(current\)/);
});
