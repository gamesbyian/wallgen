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
    assert.match(batch.path,/^telemetry\/roygbiv\/2026\/10\/22\/batch-1\.json$/);
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
  const writer=createGithubUsageWriter({fetchImpl:async(url,request)=>{
    calls.push({url,request});
    return {status:201};
  }});
  const batch=makeUsageBatch([{eventId:'e',at:'2026-10-22T00:00:00Z',
    sessionId:'s',seq:1,type:'test'}],[],{id:()=> 'unique'});
  const result=await writer.upload(batch,token);
  assert.deepEqual(result,{uploaded:true,existing:false});
  assert.equal(calls.length,1);
  assert.equal(calls[0].request.method,'PUT');
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
  await assert.rejects(()=>bad.upload(batch,token),/collision/);
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
