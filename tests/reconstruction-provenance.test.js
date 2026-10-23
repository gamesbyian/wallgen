import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,encodeRecipe,decodeRecipe,resolveScene,respectSettingLocks}
  from '../src/model.js';
import {embedPngMetadata,extractPngRecipeWithProvenance}
  from '../src/png-metadata.js';

const png=Uint8Array.from(Buffer.from(
 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/9QAAAABJRU5ErkJggg==','base64'));

test('inferred-source receipt is optional, bounded and saved without impersonating historical recipe',()=>{
 const ordinary=normalizeRecipe({seed:'ordinary'});
 assert.equal(Object.hasOwn(ordinary,'reconstructionOrigin'),false);
 const guessed=normalizeRecipe({...ordinary,reconstructionOrigin:{
   origin:'inferred-image',method:'current-render-fit-v1',
   candidateKind:'shape',sourceWidth:480,sourceHeight:1040,
   initialFitError:.0026477658371040678,uploadedBytes:'do not save me'
 }});
 assert.deepEqual(guessed.reconstructionOrigin,{
   origin:'inferred-image',method:'current-render-fit-v1',
   candidateKind:'shape',sourceWidth:480,sourceHeight:1040,
   initialFitError:.002648
 });
 assert.ok(!JSON.stringify(guessed).includes('uploadedBytes'));
 assert.deepEqual(decodeRecipe(encodeRecipe(guessed)),guessed);
 assert.deepEqual(normalizeRecipe(guessed),guessed);
 assert.deepEqual(resolveScene(guessed).objects,resolveScene(ordinary).objects,
   'provenance has zero renderer/scene effect');
 const bytes=embedPngMetadata(png,{}, {recipe:guessed});
 const stored=extractPngRecipeWithProvenance(bytes);
 assert.equal(stored.format,'roygbiv-recipe-v2',
   'generated wallpaper pixels have a genuine current output recipe');
 assert.deepEqual(stored.recipe.reconstructionOrigin,guessed.reconstructionOrigin,
   'original uploaded source remains explicitly an inferred image');
});

test('malformed or excessively large inference receipts are discarded, never persisted',()=>{
 for(const bad of [
   {origin:'genuine-original',method:'current-render-fit-v1',
     sourceWidth:400,sourceHeight:400,initialFitError:.1},
   {origin:'inferred-image',method:'unknown',sourceWidth:400,
     sourceHeight:400,initialFitError:.1},
   {origin:'inferred-image',method:'current-render-fit-v1',
     sourceWidth:10000,sourceHeight:10000,initialFitError:.1},
   {origin:'inferred-image',method:'current-render-fit-v1',
     sourceWidth:400,sourceHeight:400,initialFitError:Infinity},
   {origin:'inferred-image',method:'current-render-fit-v1',
     sourceWidth:400,sourceHeight:400,initialFitError:-1},
   'text',null
 ]){
   const out=normalizeRecipe({seed:'untrusted',reconstructionOrigin:bad});
   assert.equal(Object.hasOwn(out,'reconstructionOrigin'),false);
 }
});
test('later normal edits and Undo-lock pathway preserve acceptance-time provenance',()=>{
 const initial=normalizeRecipe({seed:'inferred',lockedSettings:['background'],
   reconstructionOrigin:{origin:'inferred-image',method:'current-render-fit-v1',
     candidateKind:'loop',sourceWidth:3024,sourceHeight:6552,initialFitError:.053835}});
 const changed=respectSettingLocks(initial,{...initial,spread:67,background:'white'});
 assert.equal(changed.spread,67);
 assert.equal(changed.background,'black');
 assert.deepEqual(changed.reconstructionOrigin,initial.reconstructionOrigin);
 assert.deepEqual(decodeRecipe(encodeRecipe(changed)).reconstructionOrigin,
   initial.reconstructionOrigin);
});


test('inferred procedural wave jagged and hairpin labels survive canonical PNG/JSON transport',()=>{
 for(const candidateKind of ['wave','jagged','chevron','hairpin']){
   const recipe=normalizeRecipe({seed:'curved-source',reconstructionOrigin:{
     origin:'inferred-image',method:'current-render-fit-v1',
     candidateKind,sourceWidth:480,sourceHeight:1040,initialFitError:.11
   }});
   assert.equal(recipe.reconstructionOrigin.candidateKind,candidateKind);
   assert.equal(decodeRecipe(encodeRecipe(recipe)).reconstructionOrigin.candidateKind,
     candidateKind);
 }
});
