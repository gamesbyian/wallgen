import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
import {prepareReconstructionApply} from '../src/reconstruction-apply-transaction.js';

const detail={kind:'shape-repeats',sourceWidth:480,
  sourceHeight:1040,error:.058721503425};
const old=normalizeRecipe({
  seed:'creator-work',structure:'paths',geometry:'drawn',
  customPath:[[.11,.16],[.72,.82]],positionX:-11,positionY:17,
  background:'white',spread:56,lockedSettings:[
    'structure','geometry','position','background'
  ]
});
const fitted=normalizeRecipe({
  ...old,lockedSettings:[],structure:'regions',regionMode:'scattered',
  scatteredShapeKind:'imported',background:'black',geometry:'jagged',
  customPath:[[.2,.2],[.9,.9]],positionX:24,positionY:-12,spread:35
});

test('late creator locks project onto Apply and preserve provenance without changing the original candidate',()=>{
  const original=structuredClone(fitted);
  const {recipe,lockedChanges}=prepareReconstructionApply(old,fitted,detail);
  assert.equal(recipe.structure,'paths');
  assert.equal(recipe.geometry,'drawn');
  assert.deepEqual(recipe.customPath,old.customPath);
  assert.equal(recipe.background,'white');
  assert.deepEqual([recipe.positionX,recipe.positionY],[-11,17]);
  assert.equal(recipe.spread,35,'unlocked source-fit fields must still apply');
  assert.deepEqual(recipe.lockedSettings,old.lockedSettings);
  for(const field of ['structure','geometry','position','background'])
    assert.ok(lockedChanges.includes(field),'missing late-lock alert for '+field);
  assert.equal(lockedChanges.length,4,
    'a late lock invalidates the exact preview and fitted error');
  assert.deepEqual(fitted,original,'source fit must never be mutated');
  assert.equal(recipe.reconstructionOrigin.candidateKind,'shape-repeats');
  assert.equal(recipe.reconstructionOrigin.origin,'inferred-image');
  assert.equal(recipe.reconstructionOrigin.initialFitError,.058722);
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
});

test('no locks means precise fitted recipe, same Undo-compatible canonical object',()=>{
  const current=normalizeRecipe({...old,lockedSettings:[]});
  const {recipe,lockedChanges}=prepareReconstructionApply(current,fitted,detail);
  assert.deepEqual(lockedChanges,[]);
  assert.equal(recipe.structure,'regions');
  assert.equal(recipe.regionMode,'scattered');
  assert.equal(recipe.positionX,24);
  assert.equal(recipe.positionY,-12);
  assert.equal(recipe.background,'black');
  assert.deepEqual(recipe.customPath,fitted.customPath);
  assert.deepEqual(
    normalizeRecipe({...recipe,reconstructionOrigin:undefined}),
    fitted
  );
});

test('the production UI uses the projected recipe rather than a stale candidate',()=>{
  const code=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  assert.match(code,/const \{recipe:inferred,lockedChanges\}=prepareReconstructionApply\(\s*current,candidate,description\)/,
    'live App Apply must reproject locks at time of user confirmation');
  assert.match(code,/if\(lockedChanges\.length\)\{[\s\S]*?return false;\s*\}/,
    'mismatched preview must never be applied after lock drift');
  assert.match(code,/changeRecipe\(inferred,\{cause:'image-reconstruction'\}\)/);
  assert.match(code,/Locked settings preserved:/);
  const ui=readFileSync(new URL('../src/image-path-ui.js',import.meta.url),'utf8');
  assert.match(ui,/recipeApply\.disabled=true;[\s\S]*?Close|Close[\s\S]*?recipeApply\.disabled=true/,
    'the modal must explain why the pending candidate was refused');
  assert.doesNotMatch(code,/const inferred=normalizeRecipe\(\{\.\.\.candidate,reconstructionOrigin:/,
    'must not commit raw pre-lock snapshot or drop the projected recipe');
});
