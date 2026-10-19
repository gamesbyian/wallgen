import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeInteriorElements,elementApplies,interiorTargetSummary} from '../src/interior-elements.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

test('shape and colour filters appear together in the selected element scope',()=>{
  const [element]=normalizeInteriorElements([{id:'both-scopes',enabled:false,
    objectIds:['region-3','region-7'],colorSlots:[0,4],
    color:'custom',customColor:'#553399'}]);
  assert.equal(interiorTargetSummary(element),
    'Applied to 2 selected shapes · Colours: Red · Blue');
  assert.equal(elementApplies(element,0,'region-3'),true);
  assert.equal(elementApplies(element,4,'region-7'),true);
  assert.equal(elementApplies(element,1,'region-3'),false);
  assert.equal(elementApplies(element,0,'region-9'),false);
  assert.equal(element.enabled,false);
  const saved=normalizeRecipe({interiorElements:[element]});
  assert.deepEqual(decodeRecipe(encodeRecipe(saved)),saved);
  assert.equal(interiorTargetSummary(saved.interiorElements[0]),
    'Applied to 2 selected shapes · Colours: Red · Blue');
});

test('existing shape-only, colour-only and unrestricted scope wording is preserved',()=>{
  const [shape,colour,all]=normalizeInteriorElements([
    {objectIds:['region-3']},{colorSlots:[1,3,6]},{}
  ]);
  assert.equal(interiorTargetSummary(shape),'Applied to 1 selected shapes');
  assert.equal(interiorTargetSummary(colour),'Colours: Orange · Green · Violet');
  assert.equal(interiorTargetSummary(all),'Applied to all seven colours');
  assert.equal(interiorTargetSummary(null),'Applied to all seven colours');
  assert.equal(elementApplies(shape,5,'region-3'),true);
  assert.equal(elementApplies(colour,3,'unrestricted-object'),true);
  assert.equal(elementApplies(all,5,'unrestricted-object'),true);
});

test('live Interior manager derives its visible and accessible status from one scope rule',()=>{
  const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  assert.match(source,/const targeting=interiorTargetSummary\(active\)/);
  assert.match(source,/scope\.textContent=stackIdentity\+' · '\+targeting/);
  assert.match(source,/scope\.setAttribute\('aria-label',scope\.textContent\)/);
  assert.match(source,/checkbox\.checked=!active\.colorSlots\.length\|\|active\.colorSlots\.includes\(i\)/);
});
