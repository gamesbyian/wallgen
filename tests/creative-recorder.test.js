import test from 'node:test';
import assert from 'node:assert/strict';
import {createCreativeRecorder,memoryUsageStore,recipeDiff,replayEpisode} from '../src/creative-recorder.js';
import {normalizeRecipe} from '../src/model.js';

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
