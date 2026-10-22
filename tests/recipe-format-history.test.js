import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {extractRecipeKeyInventory,sourceSchemaDiff,extractRecipeFieldExpressions,sourceExpressionDiff} from '../scripts/build-recipe-format-history.mjs';
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

test('source-expression history detects changed defaults without mistaking key presence for equivalence',()=>{
  const make=defaultValue=>`export function normalizeRecipe(input = {}) {
  const seed=String(input.seed);
  return {
    version: 1,
    seed,
    strength: finiteRange(input.strength, ${defaultValue}, 0, 100),
    nested: Object.fromEntries(
      Object.entries(input.nested||{})),
  };
}
`;
  const first=extractRecipeFieldExpressions(make(45));
  const next=extractRecipeFieldExpressions(make(0));
  assert.equal(first.seed,'[shorthand]');
  assert.equal(first.strength,'finiteRange(input.strength, 45, 0, 100)');
  assert.equal(next.strength,'finiteRange(input.strength, 0, 0, 100)');
  assert.deepEqual(sourceExpressionDiff(first,next),
    {added:[],removed:[],changed:['strength']});
  assert.equal(first.nested,next.nested);
});
test('four source-blob-pinned boundary anchors expose concrete v1/v2 semantic changes',()=>{
  const evidence=JSON.parse(read('docs/recipe-format-history/SEMANTIC-EXPRESSION-ANCHORS.json'));
  assert.equal(evidence.schema,1);
  assert.equal(evidence.anchors.length,4);
  for(const anchor of evidence.anchors){
    assert.match(anchor.commit,/^[a-f0-9]{40}$/);
    assert.match(anchor.modelBlobSha,/^[a-f0-9]{40}$/);
    assert.equal(anchor.fields.seed,'seed');
    assert.match(anchor.seedInitializer,/rainbow-001/);
  }
  const [v1,shadow,v2,current]=evidence.anchors;
  assert.match(v1.fields.stripeShadowEnabled,/input\.stripeShadowEnabled/);
  assert.match(v1.fields.stripeShadowStrength,/45, 0, 100/);
  assert.equal(shadow.fields.stripeShadowEnabled,null);
  assert.match(shadow.fields.stripeShadowStrength,/0, 0, 100/);
  assert.equal(v1.fields.structure,null);
  assert.match(v2.fields.structure,/input\.structure.*'paths'/);
  assert.equal(v1.fields.version,'version: 1');
  assert.equal(v2.fields.version,'version: 2');
  const latest=extractRecipeFieldExpressions(read('src/model.js'));
  for(const [key,sourceLine] of Object.entries(current.fields)){
    if(sourceLine===null)assert.equal(latest[key],undefined);
    else assert.equal(latest[key],key==='seed'?'[shorthand]':
      sourceLine.slice(sourceLine.indexOf(':')+1).trim());
  }
});

test('full 45-revision field-expression matrix is reproducible from pinned source batches',()=>{
  const keyHistory=JSON.parse(read('docs/recipe-format-history/model-key-ledger.json'));
  const expressionHistory=JSON.parse(read('docs/recipe-format-history/model-expression-ledger.json'));
  const raw=[1,2,3,4,5].flatMap(n=>JSON.parse(read(
    'docs/recipe-format-history/model-expression-sources-'+String(n).padStart(2,'0')+'.json')).revisions);
  assert.equal(raw.length,45);
  assert.equal(expressionHistory.count,45);
  assert.equal(expressionHistory.revisions.length,45);
  let previous={},priorSeed=null,changedCount=0;
  for(let i=0;i<45;i++){
    const record=raw[i],expected=expressionHistory.revisions[i],structural=keyHistory.revisions[i];
    assert.equal(record.commit,expected.commit);
    assert.equal(record.commit,structural.sha);
    assert.equal(record.modelBlobSha,structural.modelBlobSha);
    assert.deepEqual(Object.keys(record.fields).sort(),
      [...structural.explicitKeys,'seed'].sort());
    const changes=sourceExpressionDiff(previous,record.fields);
    assert.deepEqual(expected.added.map(x=>x.key),changes.added);
    assert.deepEqual(expected.removed.map(x=>x.key),changes.removed);
    assert.deepEqual(expected.changed.map(x=>x.key),changes.changed);
    for(const change of expected.changed){
      assert.equal(change.before,previous[change.key]);
      assert.equal(change.after,record.fields[change.key]);
    }
    changedCount+=changes.changed.length;
    assert.equal(record.seedInitializer,priorSeed??record.seedInitializer,
      'source-era seed initializer is stable in these observed main revisions');
    priorSeed=record.seedInitializer;previous=record.fields;
  }
  assert.equal(changedCount,10);
  const latest=extractRecipeFieldExpressions(read('src/model.js'));
  assert.deepEqual(latest,raw.at(-1).fields);
  const rows=expressionHistory.revisions;
  assert.ok(rows.some(row=>row.changed.some(change=>
    change.key==='stripeShadowStrength'&&change.before.includes('45, 0, 100')&&
    change.after.includes('0, 0, 100'))));
});
