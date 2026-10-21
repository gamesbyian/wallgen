import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
const trace=load('docs/ui-reference/agent2-runtime-plate-traceability.json');
const register=load('docs/ui-reference/canonical-plate-exception-register-2026-10-20.json');
test('exactly all 177 original canonical plate claims have audited dispositions',()=>{
 assert.equal(register.rows.length,177);
 assert.deepEqual(register.counts,{
  total:177,plates:12,required:121,conditional:29,forbidden:27,
  'source-mapped-browser-121':121,'conditional-exception-annotated':29,
  'bounded-objective-evidence':20,'subjective-or-unbounded-exception':7
 });
 assert.deepEqual(register.rows.map(({id,plate,kind,exactClaim,sourceCandidate})=>
  ({id,plate,kind,exactClaim,sourceCandidate})),
  trace.entries.map(({id,plate,kind,claim,sourceCandidate})=>
   ({id,plate,kind,exactClaim:claim,sourceCandidate})));
 assert.equal(new Set(register.rows.map(row=>row.id)).size,177);
});
test('all 12 plates declare every conditional and forbidden exception independently',()=>{
 const observed=new Set();
 for(const row of register.rows){
  observed.add(row.plate);
  assert.ok(row.disposition.length>30&&row.limits.length>20,
   row.id+' missing disposition/boundary');
  assert.ok(row.evidenceCandidates.length,
   row.id+' no linked runtime source witness');
  if(row.kind==='required'){
   assert.equal(row.comparison,'source-mapped-browser-121');
   assert.ok(row.sourceCandidate);
  }else if(row.kind==='conditional'){
   assert.equal(row.comparison,'conditional-exception-annotated');
   assert.match(row.limits,/not every/i);
  }else{
   assert.equal(row.sourceCandidate,null);
   assert.ok(['bounded-objective-evidence','subjective-or-unbounded-exception']
    .includes(row.comparison));
   if(row.comparison==='subjective-or-unbounded-exception')
    assert.match(row.limits,/human/i);
  }
 }
 assert.equal(observed.size,12);
 assert.match(register.acceptanceMeaning,/not blanket/i);
});
