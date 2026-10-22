import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {extractRecipeKeyInventory,sourceSchemaDiff} from '../scripts/build-recipe-format-history.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('forty-five source-pinned recipe model snapshots form a complete chronological ledger',()=>{
  const ledger=JSON.parse(read('docs/recipe-format-history/model-key-ledger.json'));
  assert.equal(ledger.count,45);
  assert.equal(ledger.revisions.length,ledger.count);
  assert.equal(new Set(ledger.revisions.map(rev=>rev.sha)).size,ledger.count);
  for(let i=0;i<ledger.count;i++){
    const r=ledger.revisions[i];
    assert.match(r.sha,/^[a-f0-9]{40}$/);
    assert.match(r.modelBlobSha,/^[a-f0-9]{40}$/);
    assert.ok(r.explicitKeys.length>=16);
    assert.equal(r.count,r.explicitKeys.length);
    const old=i?ledger.revisions[i-1]:null;
    assert.deepEqual(sourceSchemaDiff(old?.explicitKeys?
      {explicitKeys:old.explicitKeys}:null,{explicitKeys:r.explicitKeys}),
      {added:r.added,removed:r.removed});
  }
});
test('current model has the same explicit recipe field list as latest historical snapshot',()=>{
  const ledger=JSON.parse(read('docs/recipe-format-history/model-key-ledger.json'));
  const latest=ledger.revisions.at(-1);
  const current=extractRecipeKeyInventory(read('src/model.js'));
  assert.deepEqual(current.explicitKeys,latest.explicitKeys);
  // This first archaeological pass indexes "name: expression" properties.
  // The literal "seed," shorthand is covered by runtime normalization,
  // not by this explicit-property-only source ledger.
  assert.ok(!current.explicitKeys.includes('seed'));
  assert.match(read('src/model.js'),/^    seed,?$/m);
  assert.ok(current.explicitKeys.includes('structure'));
  assert.ok(current.explicitKeys.includes('viewZoom'));
  assert.ok(current.explicitKeys.includes('viewPanX'));
  assert.ok(!current.explicitKeys.includes('photoLook'),
    'optional nested spreads are recorded separately from compulsory fields');
});
