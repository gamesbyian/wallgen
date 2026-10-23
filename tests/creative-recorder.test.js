import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCreativeRecorder,memoryUsageStore,recipeDiff,replayEpisode,recipeDigest,
  prunableSyncedEventIds,summarizeUsageBacklog} from '../src/creative-recorder.js';
import {normalizeRecipe} from '../src/model.js';
import {analyzeCreativeUsage} from '../src/creative-usage-report.js';

function rig(enabled=true){
  const store=memoryUsageStore();let counter=0;
  const recorder=createCreativeRecorder({store,enabled,id:()=>String(++counter),
    now:()=> '2026-10-22T12:00:00.000Z'});
  return {recorder,store};
}
test('off means no events, even for changes and exports',async()=>{
  const {recorder}=rig(false);
  const a=normalizeRecipe({seed:'a'}),b=normalizeRecipe({seed:'b'});
  recorder.start(a);recorder.transition(a,b);recorder.action('export_requested',b);
  assert.equal((await recorder.records()).length,0);
  recorder.setEnabled(true,b);
  assert.deepEqual((await recorder.records()).map(x=>x.type),['episode_start']);
});
test('one canonical committed transition, compact diff and deterministic replay',async()=>{
  const {recorder}=rig();
  const a=normalizeRecipe({seed:'a',stripeWidth:30});
  const b=normalizeRecipe({...a,stripeWidth:38,viewZoom:.7});
  recorder.start(a);recorder.transition(a,a);recorder.transition(a,b,{cause:'slider_settled'});
  const rows=await recorder.records();
  assert.equal(rows.length,2);
  assert.equal(rows[1].cause,'slider_settled');
  assert.deepEqual(rows[1].changes.map(x=>x.key),['viewZoom','stripeWidth'].sort(
    (x,y)=>Object.keys(a).indexOf(x)-Object.keys(a).indexOf(y)));
  assert.deepEqual(replayEpisode(rows),b);
  assert.deepEqual((await recorder.last()).recipe,b);
});
test('randomize all closes old episode with final unexported state',async()=>{
  const {recorder}=rig();
  const a=normalizeRecipe({seed:'a'}),b=normalizeRecipe({seed:'a',gap:27});
  const c=normalizeRecipe({seed:'next'});
  recorder.start(a);recorder.transition(a,b,{cause:'edit'});
  recorder.action('export_requested',a,{exportId:'e'});
  recorder.action('download_initiated',a,{exportId:'e'});
  recorder.supersede(b,c);
  const records=await recorder.records();
  assert.deepEqual(records.map(x=>x.type),
    ['episode_start','recipe_commit','export_requested','download_initiated','episode_end','episode_start']);
  assert.deepEqual(records[4].recipe,b);
  assert.deepEqual(records[5].recipe,c);
  assert.notEqual(records[4].episodeId,records[5].episodeId);
  assert.deepEqual(replayEpisode(records.slice(0,5)),b);
});
test('a failed export is distinct from a downloaded PNG and does not corrupt latest',async()=>{
  const {recorder}=rig();
  const a=normalizeRecipe({seed:'a'});
  recorder.start(a);
  recorder.action('export_requested',a,{exportId:'request'});
  recorder.action('export_failed',a,{exportId:'request'});
  assert.deepEqual((await recorder.records()).map(x=>x.type),
    ['episode_start','export_requested','export_failed']);
  assert.deepEqual((await recorder.last()).recipe,a);
});
test('bounded complex settings retain full replacement values for deterministic recovery',()=>{
  const a=normalizeRecipe({seed:'a'}),b=normalizeRecipe({...a,interiorElements:[{
    id:'interior-1',enabled:true,type:'line',color:'red'}]});
  const changes=recipeDiff(a,b);
  assert.ok(changes.some(x=>x.key==='interiorElements'));
  const {recorder}=rig();
  recorder.start(a);recorder.transition(a,b);
  return recorder.records().then(records=>assert.deepEqual(replayEpisode(records),b));
});
test('clear deletes all locally retained events and checkpoints',async()=>{
  const {recorder}=rig();
  recorder.start({seed:'first'});
  await recorder.clear();
  assert.deepEqual(await recorder.records(),[]);
  assert.equal(await recorder.last(),null);
});

test('a slow PNG from a retired episode remains attributed there without overwriting the new draft',async()=>{
  const {recorder}=rig();
  const initial=normalizeRecipe({seed:'first'}),next=normalizeRecipe({seed:'second'});
  recorder.start(initial);
  const firstEpisode=recorder.episodeId;
  recorder.action('export_requested',initial,{exportId:'slow',targetEpisodeId:firstEpisode});
  const previous=recorder.supersede(initial,next);
  assert.equal(previous.finalExportPending,true);
  assert.equal(previous.finalExported,false);
  const newerEpisode=recorder.episodeId;
  recorder.action('download_initiated',initial,{exportId:'slow',targetEpisodeId:firstEpisode});
  recorder.action('survey_answer',next,{surveyKind:'export',targetEpisodeId:firstEpisode,answer:'close'});
  const events=await recorder.records();
  assert.equal(events.at(-2).episodeId,firstEpisode);
  assert.deepEqual(events.at(-2).recipe,initial);
  assert.equal(events.at(-1).episodeId,firstEpisode);
  assert.equal((await recorder.last()).episodeId,newerEpisode);
  assert.deepEqual((await recorder.last()).recipe,next);
  assert.deepEqual(recorder.episodeStats(next).finalExported,false);
});

test('a long exploratory slider gesture is not counted as multiple intentional edits',async()=>{
  const store=memoryUsageStore();let index=0,ms=0;
  const recorder=createCreativeRecorder({store,enabled:true,
    id:()=>String(++index),clock:()=>ms,now:()=>new Date().toISOString()});
  const base=normalizeRecipe({seed:'gesture',stripeWidth:20});
  recorder.start(base);
  let before=base;
  for(let i=0;i<5;i++){
    ms+=400;
    const after=normalizeRecipe({...base,stripeWidth:21+i});
    recorder.transition(before,after);
    before=after;
  }
  assert.equal(recorder.episodeStats(before).manualEdits,1);
  ms+=3000;
  const other=normalizeRecipe({...before,gap:27});
  recorder.transition(before,other);
  assert.equal(recorder.episodeStats(other).manualEdits,2);
  assert.ok(recorder.episodeStats(other).engagedMs>0);
  const retired=recorder.supersede(other,normalizeRecipe({seed:'new'}));
  assert.equal(retired.manualEdits,2);
  assert.equal(recorder.episodeStats({seed:'new'}).manualEdits,0);
});

test('random seed and scoped randomization are not misclassified as manual editing',async()=>{
  const {recorder}=rig();
  const a=normalizeRecipe({seed:'a'}),b=normalizeRecipe({...a,seed:'b'});
  const c=normalizeRecipe({...b,gap:30});
  recorder.start(a);
  recorder.transition(a,b,{cause:'seed_reroll'});
  recorder.transition(b,c,{cause:'scoped_vary_setting'});
  assert.equal(recorder.episodeStats(c).manualEdits,0);
});

test('a new opted-in launch preserves the previous episode last-known recipe without guessing intent',async()=>{
  const store=memoryUsageStore();let serial=0;
  const id=()=>String(++serial);
  const now=()=> '2026-10-23T05:00:00.000Z';
  const old=createCreativeRecorder({store,id,now,enabled:true});
  const first=normalizeRecipe({seed:'first'});
  const adjusted=normalizeRecipe({...first,stripeWidth:42});
  old.start(first);old.transition(first,adjusted);
  await old.flush();
  const oldSession=(await store.last()).sessionId;
  const oldEpisode=(await store.last()).episodeId;
  const next=createCreativeRecorder({store,id,now,enabled:true});
  assert.equal(next.recoverPrevious(await store.last()),true);
  next.start({seed:'fresh'});
  const events=await next.records();
  const recovered=events.find(e=>e.type==='session_interrupted');
  assert.equal(recovered.uncertain,true);
  assert.equal(recovered.sessionId,oldSession);
  assert.equal(recovered.episodeId,oldEpisode);
  assert.deepEqual(recovered.recipe,adjusted);
  assert.equal((await next.last()).recipe.seed,'fresh');
  assert.notEqual((await next.last()).episodeId,oldEpisode);
  assert.equal(events.filter(e=>e.type==='session_interrupted').length,1);
});
test('recording off cannot retroactively inspect or reconcile saved episodes',async()=>{
  const store=memoryUsageStore(),enabled=createCreativeRecorder({store,enabled:true,
    id:(()=>{let i=0;return ()=>String(++i);})()});
  enabled.start({seed:'previous'});
  await enabled.flush();
  const off=createCreativeRecorder({store,enabled:false});
  assert.equal(off.recoverPrevious(await store.last()),false);
  assert.equal((await off.records()).filter(e=>e.type==='session_interrupted').length,0);
});

test('recorded predecessor and successor checksums reject missing or reordered edits',async()=>{
  const {recorder}=rig();
  const a=normalizeRecipe({seed:'a',stripeWidth:20,gap:12});
  const b=normalizeRecipe({...a,stripeWidth:25});
  const next=normalizeRecipe({...b,gap:18});
  recorder.start(a);
  recorder.transition(a,b);
  recorder.transition(b,next);
  const events=await recorder.records();
  assert.equal(events[1].beforeDigest,recipeDigest(a));
  assert.equal(events[1].afterDigest,recipeDigest(b));
  assert.deepEqual(replayEpisode(events),next);
  assert.throws(()=>replayEpisode([events[0],events[2]]),/predecessor checksum/);
  assert.throws(()=>replayEpisode([events[0],events[2],events[1]]),/predecessor checksum/);
  const corrupted=structuredClone(events);
  corrupted[1].changes[0].after=99;
  assert.throws(()=>replayEpisode(corrupted),/successor checksum/);
});

test('periodic full checkpoints detect inconsistent patches instead of silently repairing them',async()=>{
  const {recorder}=rig();
  let previous=normalizeRecipe({seed:'check',stripeWidth:20});
  recorder.start(previous);
  for(let i=0;i<10;i++){
    const next=normalizeRecipe({...previous,stripeWidth:21+i});
    recorder.transition(previous,next);
    previous=next;
  }
  const events=await recorder.records();
  const tenth=events.at(-1);
  assert.deepEqual(tenth.recipe,previous);
  assert.deepEqual(replayEpisode(events),previous);
  const altered=structuredClone(events);
  altered.at(-1).recipe.stripeWidth=999;
  assert.throws(()=>replayEpisode(altered),/full checkpoint/);
});

test('unconfirmed previous-session recovery is a verified terminal checkpoint',async()=>{
  const store=memoryUsageStore();let count=0;
  const id=()=>String(++count);
  const original=createCreativeRecorder({store,id,enabled:true});
  const a=normalizeRecipe({seed:'old',gap:16});
  const b=normalizeRecipe({...a,gap:33});
  original.start(a);
  original.transition(a,b);
  await original.flush();
  const continued=createCreativeRecorder({store,id,enabled:true});
  continued.recoverPrevious(await store.last());
  continued.start({seed:'new'});
  const rows=await continued.records();
  const oldEpisode=rows.filter(e=>e.episodeId===rows[0].episodeId);
  assert.deepEqual(replayEpisode(oldEpisode),b);
  oldEpisode.at(-1).recipe.gap=100;
  assert.throws(()=>replayEpisode(oldEpisode),/inconsistent recipe journey/);
});

test('retention removes only complete acknowledged sessions and protects live/partial/outbox data',()=>{
  const old='2025-01-02T12:00:00.000Z';
  const recent='2026-10-23T12:00:00.000Z';
  const rows=[
    {sessionId:'old',eventId:'old-a',at:old},
    {sessionId:'old',eventId:'old-b',at:old},
    {sessionId:'partial',eventId:'part-a',at:old},
    {sessionId:'partial',eventId:'part-b',at:old},
    {sessionId:'current',eventId:'cur',at:recent},
    {sessionId:'reserved',eventId:'pending',at:old}
  ];
  assert.deepEqual(prunableSyncedEventIds(rows,
    ['old-a','old-b','part-a','cur','pending'],'2026-01-01T00:00:00Z',{
      protectedSessionIds:['current'],reservedEventIds:['pending']
    }),['old-a','old-b']);
  assert.throws(()=>prunableSyncedEventIds(rows,[],'invalid'),/cutoff/);
});
test('explicit local retention keeps latest checkpoint and never deletes unsent records',async()=>{
  const store=memoryUsageStore();
  const old='2025-01-02T12:00:00.000Z';
  for(const id of ['old-a','old-b'])
    await store.append({schema:1,eventId:id,sessionId:'old',at:old,seq:1},
      {sessionId:'old',recipe:normalizeRecipe({seed:'old'})});
  await store.append({schema:1,eventId:'cur',sessionId:'current',
    at:'2026-10-23T12:00:00.000Z',seq:1},
    {sessionId:'current',recipe:normalizeRecipe({seed:'current'})});
  const batch=await store.reserveBatch();
  await store.ackBatch(batch.id);
  const removed=await store.pruneSyncedBefore('2026-01-01T00:00:00Z');
  assert.equal(removed,2);
  assert.deepEqual((await store.all()).map(e=>e.eventId),['cur']);
  assert.equal((await store.last()).sessionId,'current');
  await store.append({schema:1,eventId:'pending',sessionId:'unsent',
    at:old,seq:1},{sessionId:'unsent',recipe:normalizeRecipe({seed:'unsent'})});
  assert.equal(await store.pruneSyncedBefore('2026-01-01T00:00:00Z'),0);
  assert.ok((await store.all()).some(e=>e.eventId==='pending'));
});

test('backlog status counts only remotely acknowledged records, including a reserved retry',async()=>{
  assert.deepEqual(summarizeUsageBacklog(['one','two','three'],['one','orphan'],{
    eventIds:['two','gone']
  }),{total:3,backedUp:1,pending:2,reserved:1});
  const {recorder,store}=rig();
  recorder.start({seed:'start'});
  recorder.transition({seed:'start'},{seed:'next'});
  await recorder.flush();
  assert.deepEqual(await store.syncSummary(),{
    total:2,backedUp:0,pending:2,reserved:0
  });
  const batch=await store.reserveBatch();
  assert.deepEqual(await store.syncSummary(),{
    total:2,backedUp:0,pending:2,reserved:2
  });
  await store.ackBatch(batch.id);
  assert.deepEqual(await store.syncSummary(),{
    total:2,backedUp:2,pending:0,reserved:0
  });
  recorder.action('navigation',{seed:'next'},{route:'edit'});
  await recorder.flush();
  assert.deepEqual(await store.syncSummary(),{
    total:3,backedUp:2,pending:1,reserved:0
  });
  await recorder.clear();
  assert.deepEqual(await store.syncSummary(),{
    total:0,backedUp:0,pending:0,reserved:0
  });
});

test('local deletion starts a new session identity so immutable remote history does not collide',async()=>{
  const {recorder,store}=rig();
  recorder.start({seed:'old'});
  recorder.transition({seed:'old'},{seed:'changed'});
  await recorder.flush();
  const archived=await store.reserveBatch();
  await store.ackBatch(archived.id);
  const oldEvents=JSON.parse(archived.json).events;
  assert.equal(oldEvents[0].seq,1);
  const oldSession=oldEvents[0].sessionId;
  await recorder.clear();
  assert.deepEqual(await recorder.records(),[]);
  recorder.start({seed:'new'});
  const newEvents=await recorder.records();
  assert.equal(newEvents[0].seq,1);
  assert.notEqual(newEvents[0].sessionId,oldSession);
  const report=analyzeCreativeUsage([
    {source:'immutable-private-batch',data:JSON.parse(archived.json)},
    {source:'local-after-delete',data:{schema:1,events:newEvents}}
  ]);
  assert.equal(report.sessionCount,2);
  assert.ok(report.sessions.every(s=>s.sequenceError===null));
  assert.ok(report.episodes.every(e=>e.replayError===null));
  const later=await store.reserveBatch();
  assert.notEqual(later.path,archived.path);
  assert.match(later.path,new RegExp('/'+newEvents[0].sessionId+'/'));
});

test('source transaction contract flushes both pending slider stages before outputs',()=>{
  const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  const between=(start,end)=>{
    const a=app.indexOf(start),b=app.indexOf(end,a+start.length);
    assert.ok(a>=0&&b>a,'Expected live editor section '+start);
    return app.slice(a,b);
  };
  assert.match(app,/function cancelQueuedControlUpdate\(\)/);
  assert.match(app,/if\(rangeTimeout\)\{clearTimeout\(rangeTimeout\);rangeTimeout=0;\}/);
  assert.match(app,/if\(pendingControlFrame\)\{cancelAnimationFrame\(pendingControlFrame\);pendingControlFrame=0;\}/);
  assert.match(app,/function flushQueuedControlUpdate\(\)\{[\s\S]*?if\(cancelQueuedControlUpdate\(\)\)updateControlsFromInputs\(\)/);
  assert.match(app,/rangeTimeout=setTimeout\(\(\)=>\{\s*rangeTimeout=0;\s*queueControlUpdate\(\);\s*\},75\)/);
  assert.match(between('async function downloadPNG(){','const snapshot=normalizeRecipe(current);'),
    /flushQueuedControlUpdate\(\)/);
  for(const [start,end] of [
    ["document.getElementById('copyRecipe').addEventListener('click',()=>{","void copyText"],
    ["document.getElementById('copyLink').addEventListener('click',async()=>{","const url=location.href;"],
    ["document.getElementById('downloadRecipe').addEventListener('click',()=>{","usageRecorder?.action('save_recipe_json'"],
    ["favoriteButton.addEventListener('click',()=>{","reconcileFavoritesFromStorage();"],
    ["document.getElementById('randomizeAll').addEventListener('click',()=>{","const previous=current;"],
    ["function undo(){","const previous=undoStack.pop();"]
  ])assert.match(between(start,end),/flushQueuedControlUpdate\(\)/);
  assert.match(between('function changeRecipe(recipe,options={}){','render(recipe,options);'),
    /cancelQueuedControlUpdate\(\)/);
});

test('late worker export cannot cross an opt-out and renewed consent session',async()=>{
  const {recorder}=rig();
  const old={seed:'before'},next={seed:'after'};
  recorder.start(old);
  const targetSessionId=recorder.sessionId;
  const targetEpisodeId=recorder.episodeId;
  recorder.action('export_requested',old,{
    exportId:'slow',targetSessionId,targetEpisodeId
  });
  recorder.setEnabled(false,old);
  recorder.setEnabled(true,next);
  assert.notEqual(recorder.sessionId,targetSessionId);
  assert.equal(recorder.action('download_initiated',old,{
    exportId:'slow',targetSessionId,targetEpisodeId
  }),undefined);
  assert.equal(recorder.action('export_failed',old,{
    exportId:'slow',targetSessionId,targetEpisodeId
  }),undefined);
  const rows=await recorder.records();
  assert.equal(rows.filter(e=>e.type==='download_initiated').length,0);
  assert.equal(rows.filter(e=>e.type==='export_failed').length,0);
  assert.equal(rows.at(-1).type,'episode_start');
  assert.equal(rows.at(-1).sessionId,recorder.sessionId);
});

test('late export after deleting local records is not imported into the new session',async()=>{
  const {recorder}=rig();
  recorder.start({seed:'old'});
  const targetSessionId=recorder.sessionId,targetEpisodeId=recorder.episodeId;
  await recorder.clear();
  recorder.start({seed:'new'});
  recorder.action('download_initiated',{seed:'old'},{
    exportId:'erased',targetSessionId,targetEpisodeId
  });
  const rows=await recorder.records();
  assert.deepEqual(rows.map(e=>e.type),['episode_start']);
  assert.notEqual(rows[0].sessionId,targetSessionId);
});

test('async download after Randomize All still belongs to the old episode in the same session',async()=>{
  const {recorder}=rig();
  const old={seed:'old'},next={seed:'random'};
  recorder.start(old);
  const targetSessionId=recorder.sessionId,targetEpisodeId=recorder.episodeId;
  recorder.action('export_requested',old,{
    exportId:'slow',targetSessionId,targetEpisodeId
  });
  recorder.supersede(old,next);
  recorder.action('download_initiated',old,{
    exportId:'slow',targetSessionId,targetEpisodeId
  });
  const rows=await recorder.records();
  const download=rows.find(e=>e.type==='download_initiated');
  assert.ok(download);
  assert.equal(download.sessionId,targetSessionId);
  assert.equal(download.episodeId,targetEpisodeId);
  assert.equal((await recorder.last()).episodeId,recorder.episodeId);
});
