import test from 'node:test';
import assert from 'node:assert/strict';
import {openGeometryLibrary,RECENT_DRAFT_LIMIT,RECENT_DRAFT_DAYS} from '../src/geometry-library-store.js';

const geometry={type:'open-path',space:'wallpaper-600x1300',
  points:[[.1,.1],[.3,.5],[.8,.7]],anchors:[1],corners:[1]};
const shape={type:'compound-region',space:'asset-local',viewBox:[0,0,20,20],
  fillRule:'evenodd',components:[{outer:[[1,1],[19,1],[19,19],[1,19]],holes:[]}]};
const baseClock='2026-10-22T00:00:00.000Z';
const memory=(clock=()=>baseClock)=>openGeometryLibrary({indexedDB:null,
  now:clock,idFactory:()=>'generated-asset'});

test('No IndexedDB explicitly declares temporary storage, never durable saved state',async()=>{
  const db=await memory();
  assert.equal(db.durable,false);
  assert.match(db.warning,/this visit only/i);
  assert.deepEqual(await db.list(),[]);
  db.close();
});

test('Add/list/filter/get/rename/duplicate IDs without aliasing source geometry',async()=>{
  const db=await memory();
  const first=await db.add({id:'wave-1',name:'Wave',geometry,tags:['Abstract','soft']});
  const second=await db.add({id:'shape-2',name:'Maple Leaf',geometry:shape,tags:['Leaf']});
  assert.equal(first.kind,'path');
  assert.equal(second.kind,'shape');
  assert.match(first.contentHash,/^sha256:[a-f0-9]{64}$/);
  assert.deepEqual((await db.list()).map(a=>a.id),['shape-2','wave-1'],
    'stable newest-name tie-break uses identifier');
  assert.deepEqual((await db.list({kind:'shape'})).map(a=>a.id),['shape-2']);
  assert.deepEqual((await db.list({query:'aBsTrAcT'})).map(a=>a.id),['wave-1']);
  assert.deepEqual((await db.list({query:'leaf'})).map(a=>a.id),['shape-2']);
  assert.deepEqual((await db.list({limit:1,offset:1})).map(a=>a.id),['wave-1']);
  first.geometry.points[0][0]=.999;
  const actual=await db.get(first.id);
  assert.deepEqual(actual.geometry.points[0],[.1,.1]);
  assert.equal(actual.searchName,undefined,'internal name index is not in export');
  await assert.rejects(db.add({id:'wave-1',geometry}),{code:'duplicate'});
  await assert.rejects(db.list({kind:'bogus'}),{code:'filter'});
  await assert.rejects(db.list({limit:0}),{code:'filter'});
});

test('Optimistic revision guards preserve the first saved version and protect deletes',async()=>{
  let clock=Date.parse(baseClock);
  const db=await memory(()=>new Date(clock).toISOString());
  const saved=await db.add({id:'wave',name:'Original',geometry});
  clock+=5000;
  const revised=await db.update('wave',{name:'Revision 2'},{ifRevision:1});
  assert.equal(revised.revision,2);
  assert.equal(revised.name,'Revision 2');
  assert.equal(revised.createdAt,saved.createdAt);
  assert.notEqual(revised.modifiedAt,saved.modifiedAt);
  assert.equal(revised.contentHash,saved.contentHash,'renaming cannot change geometry hash');
  await assert.rejects(db.update('wave',{name:'Stale'},{ifRevision:1}),{code:'conflict'});
  await assert.rejects(db.delete('wave',{ifRevision:1}),{code:'conflict'});
  assert.equal((await db.get('wave')).name,'Revision 2');
  assert.equal(await db.delete('wave',{ifRevision:2}),true);
  assert.equal(await db.get('wave'),null);
  assert.equal(await db.delete('wave'),false);
  await assert.rejects(db.update('wave',{name:'Nope'}),{code:'not-found'});
});

test('Recent drafts are independent, bounded, promotable, and never evict library assets',async()=>{
  let clock=Date.parse(baseClock);
  const db=await memory(()=>new Date(clock).toISOString());
  await db.add({id:'permanent',geometry});
  for(let i=0;i<RECENT_DRAFT_LIMIT+5;i++){
    await db.saveDraft({id:'draft-'+i,geometry,name:'Sketch '+i});
    clock+=1000;
  }
  const drafts=await db.listDrafts();
  assert.equal(drafts.length,RECENT_DRAFT_LIMIT);
  assert.ok(!drafts.some(r=>r.id==='draft-0'));
  const candidate=drafts[0];
  const promoted=await db.promoteDraft(candidate.id);
  assert.equal(promoted.id,candidate.id);
  assert.equal((await db.listDrafts()).length,RECENT_DRAFT_LIMIT-1);
  assert.equal((await db.get(candidate.id)).kind,'path');
  assert.ok(await db.get('permanent'));
  await assert.rejects(db.promoteDraft(candidate.id),{code:'not-found'});
  clock+=(RECENT_DRAFT_DAYS+1)*86400000;
  await db.pruneDrafts();
  assert.deepEqual(await db.listDrafts(),[]);
  assert.ok(await db.get('permanent'));
  assert.ok(await db.get(candidate.id));
});

test('Different libraries have no shared session fallback and data never leaks into recipes',async()=>{
  const a=await memory(),b=await memory();
  const record=await a.add({id:'private-item',geometry});
  assert.equal(await b.get(record.id),null);
  assert.equal(JSON.stringify(record).includes('data:image'),false);
  assert.equal(record.geometry.type,'open-path');
});


test('Atomic batch import skips identical geometry but rejects conflicting IDs without partial write',async()=>{
  const db=await memory();
  const a=await db.add({id:'existing',name:'Original',geometry});
  const b={id:'new',name:'Second',geometry:shape};
  assert.deepEqual(await db.importMany([a,b]),{added:1,skipped:1});
  assert.deepEqual(await db.importMany([a,b]),{added:0,skipped:2});
  const conflicts=[
    {id:'extra',name:'Should not be committed',geometry:shape},
    {id:'existing',name:'Different shape',geometry:shape}
  ];
  await assert.rejects(db.importMany(conflicts),{code:'conflict'});
  assert.equal(await db.get('extra'),null,'one bad conflict aborts all staged additions');
  assert.equal((await db.get('existing')).contentHash,a.contentHash);
  await assert.rejects(db.importMany([b,b]),{code:'invalid-import'});
  assert.equal((await db.list()).length,2);
});
