import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeRecipe} from '../src/model.js';
test('straight geometry hides inactive curves without destroying their canonical values',()=>{
  const zigzag=normalizeRecipe({structure:'paths',geometry:'zigzag',
    shapeFrequency:61,shapeDepth:79});
  const straight=normalizeRecipe({...zigzag,geometry:'straight'});
  assert.equal(straight.shapeFrequency,61);
  assert.equal(straight.shapeDepth,79);
  const restored=normalizeRecipe({...straight,geometry:'zigzag'});
  assert.equal(restored.shapeFrequency,61);
  assert.equal(restored.shapeDepth,79);
});
test('inactive source controls display zero and preserve recipe state on save',()=>{
  const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  assert.match(source,/if\(\['straight','hairpin','loop','drawn'\]\.includes\(scene\.geometry\)\)/);
  assert.match(source,/inactive\.add\('shapeFrequency'\),inactive\.add\('shapeDepth'\)/);
  assert.match(source,/data\[key\]=field\.dataset\.inactive==='true'\?current\[key\]/);
  assert.match(source,/field\.value=isInactive\?'0':String\(current\[key\]\)/);
  assert.match(source,/numeric\.value=isInactive\?'0':String\(current\[key\]\)/);
  assert.match(source,/field\.disabled=isInactive\|\|locked/);
});
