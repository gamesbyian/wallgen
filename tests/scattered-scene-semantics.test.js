import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeRecipe,resolveScene,decodeRecipe,encodeRecipe} from '../src/model.js';
import {buildScatteredObjects,RAINBOW_ORBITS} from '../src/scattered-composition.js';

test('an unavailable imported silhouette never falsely paints perfect circles',()=>{
  const recipe=normalizeRecipe({...RAINBOW_ORBITS,scatteredShapeKind:'imported',scatteredShape:null});
  const layout=buildScatteredObjects(recipe);
  assert.equal(layout.placed,0);
  assert.deepEqual(layout.objects,[]);
  assert.match(layout.diagnostic,/choose an imported shape/i);
  assert.deepEqual(resolveScene(recipe).objects,[]);
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
});

test('overlap stays explicitly optional while keeping seeded circle placement valid',()=>{
  const separate=buildScatteredObjects(normalizeRecipe({...RAINBOW_ORBITS,
    scatteredOverlap:'separate',scatteredSpacing:28}));
  const overlap=buildScatteredObjects(normalizeRecipe({...RAINBOW_ORBITS,
    scatteredOverlap:'overlap',scatteredSpacing:28}));
  assert.ok(separate.placed>0&&overlap.placed>0);
  assert.deepEqual(overlap.objects,buildScatteredObjects(normalizeRecipe({...RAINBOW_ORBITS,
    scatteredOverlap:'overlap',scatteredSpacing:85})).objects,
    'clearance currently has no rendering effect in overlap mode');
});

test('tonal bands can be selected without modifying existing recipes or random presets',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html,/<option value="tonal">Layered tonal bands<\/option>/);
  const recipe=normalizeRecipe({seed:'tonal-review',construction:'tonal',tonalContrast:78});
  assert.equal(resolveScene(recipe).construction,'tonal');
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
});
