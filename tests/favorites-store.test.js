import test from 'node:test';
import assert from 'node:assert/strict';
import {parseStoredFavorites} from '../src/favorites-store.js';
import {normalizeRecipe} from '../src/model.js';

test('a corrupt Saved storage value is an empty gallery rather than a startup crash',()=>{
  for(const value of [null,'','{not json}', '{}','null','42','"string"'])
    assert.deepEqual(parseStoredFavorites(value),[],String(value));
});

test('one malformed Saved entry never discards valid neighbours or their settings',()=>{
  const full=normalizeRecipe({seed:'legitimate-first',structure:'regions',
    regionMode:'nested',viewZoom:.75,viewPanX:-10,material:'linen',
    lockedSettings:['material'],interiorElements:[]});
  const stored=[null,full,undefined,7,'junk',[],{seed:''},
    {seed:'legacy-minimal'}, {seed:'legitimate-last',structure:'radial',
      radialMode:'pinwheel',viewPanY:15}];
  const results=parseStoredFavorites(JSON.stringify(stored));
  assert.deepEqual(results.map(x=>x.seed),[
    'legitimate-first','legacy-minimal','legitimate-last']);
  assert.deepEqual(results[0],full);
  assert.deepEqual(results[1],normalizeRecipe({seed:'legacy-minimal'}));
  assert.equal(results[2].structure,'radial');
  assert.equal(results[2].viewPanY,15);
});

test('Saved import does not mutate its stored objects or treat missing IDs as favourites',()=>{
  const original={seed:'valid',structure:'paths',lockedSettings:['geometry']};
  const before=JSON.stringify(original);
  assert.deepEqual(parseStoredFavorites(JSON.stringify([{},null,original])),
    [normalizeRecipe(original)]);
  assert.equal(JSON.stringify(original),before);
});

test('Saved reads cap at sixty valid favourites, searching beyond corrupt entries',()=>{
  const stored=[...Array.from({length:10},()=>null),
    ...Array.from({length:90},(_,i)=>({seed:'saved-'+i}))];
  const results=parseStoredFavorites(JSON.stringify(stored));
  assert.equal(results.length,60);
  assert.equal(results[0].seed,'saved-0');
  assert.equal(results.at(-1).seed,'saved-59');
  assert.deepEqual(parseStoredFavorites(JSON.stringify(stored),2)
    .map(x=>x.seed),[],'bounded work stops after five times requested limit');
});
