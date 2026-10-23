import test from 'node:test';
import assert from 'node:assert/strict';
import {createCreativeRecorder,memoryUsageStore} from '../src/creative-recorder.js';
import {makeUsageBatch,encodeGithubContent,createGithubUsageWriter,
  createGithubUsageSync,GITHUB_USAGE_BRANCH} from '../src/creative-github-sync.js';

const token='github_pat_test-only-never-valid';
function fixture(){
  const store=memoryUsageStore();let count=0;
  const recorder=createCreativeRecorder({store,enabled:true,
    id:()=> 'record-'+(++count),
    now:()=> '2026-10-22T12:13:14.000Z'});
  recorder.start({seed:'first'});
  recorder.transition({seed:'first'},{seed:'second'});
  return {store,recorder};
}
test('batch is bounded, namespaced, and contains no upload credentials',()=>{
  const {store,recorder}=fixture();
  return recorder.flush().then(async()=>{
    const rows=await store.all();
    const batch=makeUsageBatch(rows,[],{id:()=> 'batch-1'});
    assert.equal(batch.eventIds.length,2);
    assert.match(batch.path,/^telemetry\/roygbiv\/2026\/10\/22\/record-1\/batch-1\.json$/);
    assert.deepEqual(JSON.parse(batch.json).events,rows);
    assert.ok(!batch.json.includes(token));
    assert.equal(atob(encodeGithubContent('æ ♥')).includes('æ'),false,
      'Base64 preserves UTF-8 bytes, not naive Unicode codepoints');
  });
});
test('a reserved batch survives new events, a failed upload, and retry',async()=>{
  const {store,recorder}=fixture();
  await recorder.flush();
  const first=await store.reserveBatch();
  recorder.transition({seed:'second'},{seed:'third'});
  await recorder.flush();
  assert.deepEqual(await store.reserveBatch(),first);
  await store.ackBatch(first.id);
  const next=await store.reserveBatch();
  assert.deepEqual(next.eventIds.length,1);
  await store.ackBatch(next.id);
  assert.equal(await store.reserveBatch(),null);
});
test('upload requests write only the intended private branch and batch',async()=>{
  const calls=[];
  let expectedContent='';
  const writer=createGithubUsageWriter({fetchImpl:async(url,request)=>{
    calls.push({url,request});
    if(request.method==='PUT'){
      expectedContent=JSON.parse(request.body).content;
      return {status:201};
    }
    return {ok:true,json:async()=>({encoding:'base64',content:expectedContent})};
  }});
  const batch=makeUsageBatch([{eventId:'e',at:'2026-10-22T00:00:00Z',
    sessionId:'s',seq:1,type:'test'}],[],{id:()=> 'unique'});
  const result=await writer.upload(batch,token);
  assert.deepEqual(result,{uploaded:true,existing:false});
  assert.equal(calls.length,2);
  assert.equal(calls[0].request.method,'PUT');
  assert.ok(calls[1].url.endsWith('?ref='+encodeURIComponent(GITHUB_USAGE_BRANCH)));
  assert.equal(calls[1].request.cache,'no-store');
  const body=JSON.parse(calls[0].request.body);
  assert.equal(body.branch,GITHUB_USAGE_BRANCH);
  assert.deepEqual(JSON.parse(new TextDecoder().decode(Uint8Array.from(
    atob(body.content),c=>c.charCodeAt(0)))),JSON.parse(batch.json));
  assert.ok(calls[0].url.includes('/repos/gamesbyian/general-purpose/contents/telemetry/roygbiv/'));
  assert.ok(!calls[0].request.body.includes(token));
  assert.equal(calls[0].request.headers.Authorization,'Bearer '+token);
});
test('ambiguous create collision confirms exact bytes, rejects foreign content',async()=>{
  const batch=makeUsageBatch([{eventId:'event',at:'2026-10-22T00:00:00Z',
    sessionId:'session',seq:1}],[],{id:()=> 'collision'});
  const good=createGithubUsageWriter({fetchImpl:async(_url,req)=>{
    if(req.method==='PUT')return {status:422};
    return {ok:true,json:async()=>({encoding:'base64',content:encodeGithubContent(batch.json)})};
  }});
  assert.deepEqual(await good.upload(batch,token),{uploaded:true,existing:true});
  const bad=createGithubUsageWriter({fetchImpl:async(_url,req)=>
    req.method==='PUT'?{status:422}:{ok:true,json:async()=>({
      encoding:'base64',content:encodeGithubContent('different')})}});
  await assert.rejects(()=>bad.upload(batch,token),/readback differs/);
});
test('sync only acknowledges after confirmed upload, retains failed batch',async()=>{
  const {store,recorder}=fixture();
  let first=true;
  const writer={upload:async()=>{
    if(first){first=false;throw new Error('offline');}
    return {uploaded:true};
  }};
  const sync=createGithubUsageSync({store,recorder,writer});
  await assert.rejects(()=>sync.run(token),/offline/);
  const pending=await store.reserveBatch();
  assert.ok(pending);
  const outcome=await sync.run(token);
  assert.equal(outcome.uploaded,2);
  assert.equal(await store.reserveBatch(),null);
});

test('a fresh 201 response is never acknowledged without matching readback',async()=>{
  const batch=makeUsageBatch([{eventId:'e',at:'2026-10-22T00:00:00Z',
    sessionId:'s',seq:1}],[],{id:()=> 'fresh'});
  const unavailable=createGithubUsageWriter({fetchImpl:async(_url,req)=>
    req.method==='PUT'?{status:201}:{ok:false,status:404}});
  await assert.rejects(()=>unavailable.upload(batch,token),/readback failed/);
  const mismatch=createGithubUsageWriter({fetchImpl:async(_url,req)=>
    req.method==='PUT'?{status:201}:{ok:true,json:async()=>({
      encoding:'base64',content:encodeGithubContent('wrong bytes')})}});
  await assert.rejects(()=>mismatch.upload(batch,token),/readback differs/);
});

test('revocation during an in-flight write keeps the reserved batch for consented retry',async()=>{
  const {store,recorder}=fixture();
  await recorder.flush();
  let started,finish;
  const startedPromise=new Promise(resolve=>{started=resolve;});
  const finishing=new Promise(resolve=>{finish=resolve;});
  const writer={upload:async(_batch,_token,{signal})=>{
    assert.ok(signal);
    started();
    await finishing;
    return {uploaded:true};
  }};
  const sync=createGithubUsageSync({store,recorder,writer});
  const pending=sync.run(token);
  await startedPromise;
  const reserved=await store.reserveBatch();
  sync.cancel();
  finish();
  assert.equal((await pending).uploaded,0);
  assert.deepEqual(await store.reserveBatch(),reserved);
  recorder.setEnabled(false,{seed:'second'});
  assert.equal((await sync.run(token)).uploaded,0);
});

test('private archive batch paths identify one source session and retain later sessions',()=>{
  const rows=[
    {eventId:'a',at:'2026-10-22T00:00:00Z',sessionId:'session-1',seq:1},
    {eventId:'b',at:'2026-10-22T00:00:01Z',sessionId:'session-2',seq:1},
    {eventId:'c',at:'2026-10-22T00:00:02Z',sessionId:'session-2',seq:2}
  ];
  const first=makeUsageBatch(rows,[],{id:()=> 'first'});
  assert.deepEqual(first.eventIds,['a']);
  assert.match(first.path,/\/session-1\/first\.json$/);
  const next=makeUsageBatch(rows,first.eventIds,{id:()=> 'next'});
  assert.deepEqual(next.eventIds,['b','c']);
  assert.match(next.path,/\/session-2\/next\.json$/);
  assert.equal(makeUsageBatch(rows,first.eventIds.concat(next.eventIds)),null);
});

test('clock rollback cannot reorder per-session private batches or strand old events',()=>{
  const rows=[
    {eventId:'first',at:'2026-10-23T12:00:01Z',sessionId:'phone',seq:1},
    {eventId:'second',at:'2026-10-23T11:59:58Z',sessionId:'phone',seq:2},
    {eventId:'third',at:'2026-10-23T11:59:59Z',sessionId:'phone',seq:3},
    {eventId:'other',at:'2026-10-23T12:00:02Z',sessionId:'other-tab',seq:1}
  ];
  const first=makeUsageBatch(rows,[],{maxEvents:2,id:()=> 'batch-one'});
  assert.deepEqual(first.eventIds,['first','second']);
  const second=makeUsageBatch(rows,first.eventIds,{maxEvents:2,id:()=> 'batch-two'});
  assert.deepEqual(second.eventIds,['third']);
  const third=makeUsageBatch(rows,first.eventIds.concat(second.eventIds),{
    maxEvents:2,id:()=> 'batch-three'
  });
  assert.deepEqual(third.eventIds,['other']);
  assert.equal(makeUsageBatch(rows,[...first.eventIds,...second.eventIds,...third.eventIds]),null);
});
