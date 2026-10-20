import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const spec=JSON.parse(read('docs/ui-reference/canonical-screen-contract.json'));
const matrix=JSON.parse(read('docs/ui-reference/agent2-runtime-plate-traceability.json'));
const inventory=JSON.parse(read('docs/ui-reference/source-control-inventory.json'));

test('all 177 canonical screen claims have one exact, reviewable trace row',()=>{
  const expected=spec.screens.flatMap(plate=>
    ['required','conditional','forbidden'].flatMap(kind=>
      plate[kind].map((claim,i)=>({
        id:plate.id+'.'+kind+'.'+String(i+1).padStart(2,'0'),
        plate:plate.id,kind,claim
      }))));
  assert.equal(spec.screens.length,12);
  assert.deepEqual(matrix.counts,{plates:12,required:121,conditional:29,
    forbidden:27,total:177});
  assert.equal(matrix.entries.length,177);
  assert.deepEqual(matrix.entries.map(({id,plate,kind,claim})=>
    ({id,plate,kind,claim})),expected,
    'No omitted, reordered, rewritten or invented canonical acceptance claim');
  assert.ok(inventory.counts.staticIds===116&&inventory.counts.settings===87);
  assert.equal(new Set(matrix.entries.map(row=>row.id)).size,177);
});

test('every claim declares how to falsify it without claiming source presence is browser approval',()=>{
  for(const row of matrix.entries){
    assert.ok(row.exercise.length>25,row.id+' no exercise');
    assert.ok(row.applicableState.length>20,row.id+' no applicable state');
    assert.ok(row.qualification.includes('VERIFIED')||row.qualification.includes('TRACED'),
      row.id+' classification missing');
    assert.ok(row.evidenceCandidates.length,row.id+' no evidence candidate');
    for(const path of row.evidenceCandidates)
      assert.ok(existsSync(new URL('../'+path,import.meta.url)),row.id+' missing '+path);
    if(row.kind!=='forbidden')
      assert.ok(row.sourceCandidate?.length,row.id+' missing concrete source selector');
    else assert.equal(row.sourceCandidate,null,
      'Forbidden feature selector requires an observed counterexample, never invented DOM');
  }
  assert.match(matrix.evidencePolicy,/do not themselves confer reachability/i);
});
