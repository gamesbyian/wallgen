import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../docs/ui-reference/',import.meta.url);
const source=JSON.parse(readFileSync(new URL('actual-implementation/review-provenance.json',root),'utf8'));
const companion=readFileSync(new URL('ACTUAL-IMPLEMENTATION-COMPANION.md',root),'utf8');
const screens=['studio','geometry','draw','explore','more','material',
 'colour','diagonal','compact','focus','history','search'];
const icons=['pan','anchor-points','smooth-path','extend-path','weave',
 'focus-slider','metadata','restore-variation'];
const keys=[...['cream','dark'].flatMap(theme=>screens.map(screen=>
 'implemented-plates/'+theme+'-'+screen+'.png')),
 ...icons.map(id=>'icons/'+id+'-states.png')].sort();
test('all original implementation screenshots and candidate matrices are exact reviewed binary pixels',()=>{
 assert.equal(source.count,32);
 assert.deepEqual(Object.keys(source.sha256).sort(),keys);
 assert.equal(source.humanUserApproval,false);
 assert.equal(source.physicalDevice,false);
 assert.equal(source.independentAiOpticalReview,true);
 assert.equal(source.source.runId,'39527554784');
 assert.equal(source.source.checkedOutCommit,'89b09ea54da1368335785038bfd05eeed717eb8f');
 const aggregate=createHash('sha256');
 for(const key of keys){
  const file=new URL('actual-implementation/'+key,root);
  assert.ok(existsSync(file),key+' missing exact real browser PNG');
  const bytes=readFileSync(file);
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
  assert.equal(width,key.startsWith('icons/')?1280:412,key+' width changed');
  assert.equal(height,key.startsWith('icons/')?900:892,key+' height changed');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sha256[key],
   key+' no longer original review-approved capture');
  aggregate.update(key);aggregate.update(Buffer.from([0]));
  aggregate.update(bytes);aggregate.update(Buffer.from([0]));
 }
 assert.equal(aggregate.digest('hex'),'41ce3b1dbffd1d2b15fb8dafb50f9f3548c472cf1e4989cc09bbf7a14d2521ed');
});
test('source visual companion retains all twelve schematic links and reviews eight unwired candidates',()=>{
 for(const screen of screens){
  assert.ok(existsSync(new URL(screen+'.svg',root)),screen+' schematic disappeared');
  for(const theme of ['cream','dark'])
   assert.ok(companion.includes('actual-implementation/implemented-plates/'+theme+'-'+screen+'.png'));
 }
 for(const name of icons)
  assert.ok(companion.includes('actual-implementation/icons/'+name+'-states.png'));
 assert.match(companion,/still unwired/i);
 assert.match(companion,/physical Android/i);
});
