import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeCreativeUsage,markdownCreativeUsageReport} from '../src/creative-usage-report.js';
import {createCreativeRecorder,memoryUsageStore} from '../src/creative-recorder.js';
const payload=events=>({schema:1,events});
test('analysis keeps delayed export evidence with the originating episode',async()=>{
  const store=memoryUsageStore();let i=0;
  const recorder=createCreativeRecorder({store,enabled:true,
    id:()=>String(++i),now:()=>new Date().toISOString()});
  recorder.start({seed:'first'});
  const old=recorder.episodeId;
  recorder.action('export_requested',{seed:'first'},{exportId:'e',targetEpisodeId:old});
  recorder.supersede({seed:'first'},{seed:'second'});
  recorder.action('download_initiated',{seed:'first'},{exportId:'e',targetEpisodeId:old});
  recorder.action('survey_answer',{seed:'second'},{targetEpisodeId:old,surveyKind:'export',answer:'close'});
  const events=await recorder.records();
  const report=analyzeCreativeUsage([
    {source:'local.json',data:payload(events)},
    {source:'batch.json',data:payload(events.slice(0,2))}
  ]);
  assert.equal(report.uniqueEventCount,events.length);
  assert.equal(report.duplicateEventCount,2);
  assert.equal(report.sessionCount,1);
  assert.equal(report.episodeCount,2);
  const previous=report.episodes.find(e=>e.episodeId===old);
  assert.equal(previous.downloadsInitiated,1);
  assert.equal(previous.surveyAnswers[0].answer,'close');
  assert.equal(previous.finalKnownRecipe.seed,'first');
  const next=report.episodes.find(e=>e.episodeId!==old);
  assert.equal(next.finalKnownRecipe.seed,'second');
  assert.match(markdownCreativeUsageReport(report),/Download initiations/);
});
test('conflicting duplicate event IDs are rejected, not silently overwritten',()=>{
  const e={schema:1,eventId:'e',sessionId:'s',episodeId:'ep',seq:1,type:'episode_start',at:'2026-10-22T12:00:00Z',recipe:{seed:'a'}};
  assert.throws(()=>analyzeCreativeUsage([
    {source:'a',data:payload([e])},{source:'b',data:payload([{...e,type:'recipe_commit'}])}
  ]),/Conflicting duplicate/);
});
test('incomplete episode is reported without claiming user abandonment',()=>{
  const event={schema:1,eventId:'e',sessionId:'s',episodeId:'ep',seq:1,type:'episode_start',
    at:'2026-10-22T12:00:00Z',recipe:{seed:'a'}};
  const report=analyzeCreativeUsage([{source:'a',data:payload([event])}]);
  assert.equal(report.episodes[0].outcome,'open_or_interrupted_unconfirmed');
  assert.equal(report.episodes[0].finalKnownRecipe.seed,'a');
  assert.equal(report.downloadInitiationCount,0);
});
