import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compoundStitchRecipe} from '../scripts/compound-stitch-fixture.mjs';
import {normalizeRecipe,encodeRecipe,decodeRecipe,resolveScene} from '../src/model.js';
import {matchingEmbroidery} from '../src/embroidery.js';
test('imported compound reference has one region with a hole and a detached island',()=>{
  const plain=compoundStitchRecipe('compound-proof',null);
  const tatami=compoundStitchRecipe('compound-proof','tatami');
  assert.equal(plain.structure,'regions');
  assert.equal(plain.scatteredShapeKind,'imported');
  assert.deepEqual(plain.scatteredShape.geometry.components.map(c=>c.holes.length),[1,0]);
  assert.deepEqual(tatami.scatteredShape,plain.scatteredShape);
  assert.equal(resolveScene(plain).objects.length,1);
  const source=resolveScene(tatami).objects[0];
  assert.equal(source.id,'region-0');
  assert.equal(source.circle,undefined);
  assert.equal(source.rings.length,3);
  assert.ok(source.rings.every(r=>r.length>=4));
  assert.ok(matchingEmbroidery(tatami.surfaceTreatments,{id:'region-0',colorSlot:0}));
  assert.equal(matchingEmbroidery(tatami.surfaceTreatments,{id:'region-1',colorSlot:1}),null);
  assert.deepEqual(normalizeRecipe(tatami),tatami);
  assert.deepEqual(decodeRecipe(encodeRecipe(tatami)),tatami);
  // Prior original remains unchanged; only the optional treatment differs.
  assert.equal(Object.hasOwn(plain,'surfaceTreatments'),false);
});
test('focused compound art review uses original production renderer and exact JSON source',()=>{
  const s=readFileSync(new URL('../scripts/review-embroidery.mjs',import.meta.url),'utf8');
  assert.match(s,/--focus-compound/);
  assert.match(s,/compoundStitchRecipe\(seed,study\.style\)/);
  assert.match(s,/id:'08-compound-plain'/);
  assert.match(s,/id:'09-compound-tatami'/);
  assert.match(s,/\['--recipe',join\(out,recipeFile\)/);
  assert.match(s,/Review output exists/);
});
