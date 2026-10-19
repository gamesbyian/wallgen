import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeInteriorElements,resolveInteriorSelection} from '../src/interior-elements.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const items=()=>normalizeInteriorElements([
  {id:'top',shape:'wave',color:'white'},
  {id:'middle',shape:'zigzag',color:'custom',customColor:'#ffaa11'},
  {id:'bottom',shape:'loop',colorSlots:[1,3],enabled:false}
]);
test('selected interior identity survives reorders and their history Undo',()=>{
  const original=items(),selectedId=original[2].id;
  const moved=[original[0],original[2],original[1]];
  assert.equal(resolveInteriorSelection(original,selectedId,2),2);
  assert.equal(resolveInteriorSelection(moved,selectedId,2),1,
    'Move up changes the visual index, not the selected identity');
  assert.equal(resolveInteriorSelection(original,selectedId,1),2,
    'Undo restores order without selecting the different element at index 1');
  const restored=decodeRecipe(encodeRecipe(normalizeRecipe({interiorElements:moved})));
  assert.equal(resolveInteriorSelection(restored.interiorElements,selectedId,2),1);
  assert.deepEqual(restored.interiorElements[1],original[2]);
});
test('remove, replacement recipe, empty and hostile fallback indexes remain safe',()=>{
  const original=items();
  assert.equal(resolveInteriorSelection([],original[2].id,2),0);
  assert.equal(resolveInteriorSelection([original[0]],original[2].id,2),0);
  assert.equal(resolveInteriorSelection(original,'missing',2),2);
  assert.equal(resolveInteriorSelection(original,'missing',-99),0);
  assert.equal(resolveInteriorSelection(original,'missing',99),2);
  assert.equal(resolveInteriorSelection(original,'missing',NaN),0);
  assert.equal(resolveInteriorSelection(original,null,1),1);
});
test('actual editor code tracks ID on explicit changes and resolves before render',()=>{
  const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  assert.match(source,/let selectedInterior=0,selectedInteriorId=null,lastInteriorState='';/);
  assert.match(source,/selectedInterior=resolveInteriorSelection\(items,selectedInteriorId,selectedInterior\)/);
  assert.match(source,/choose\.addEventListener\('change',\(\)=>\{\s*selectedInterior=Number\(choose\.value\);\s*selectedInteriorId=items\[selectedInterior\]\?\.id\?\?null/);
  assert.match(source,/selectedInteriorId=id;\s*changeRecipe\(\{\.\.\.current,interiorElements:/);
  assert.match(source,/selectedInteriorId=remaining\[selectedInterior\]\?\.id\?\?null/);
});
