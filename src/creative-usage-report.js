// Report only the events that actually exist. Do not infer user emotion,
// abandoned designs, or saved files from a download being initiated.
import {normalizeRecipe} from './model.js';
import {replayEpisode} from './creative-recorder.js';
import {orderUsageEvents} from './creative-github-sync.js';

function materializeRecipe(rows){
  try{return {recipe:replayEpisode(rows),error:null};}
  catch(error){return {recipe:null,error:String(error.message||error)};}
}
export function analyzeCreativeUsage(sources){
  if(!Array.isArray(sources))throw new TypeError('Expected a list of activity exports or batches');
  const unique=new Map();
  for(const {source,data} of sources){
    if(data?.schema!==1||!Array.isArray(data.events))
      throw new Error('Unrecognized activity format in '+source);
    for(const event of data.events){
      if(!event||event.schema!==1||typeof event.eventId!=='string'||
        typeof event.sessionId!=='string'||typeof event.episodeId!=='string'||
        typeof event.type!=='string'||!Number.isSafeInteger(event.seq))
        throw new Error('Malformed activity event in '+source);
      const original=unique.get(event.eventId);
      if(original){
        if(JSON.stringify(original.event)!==JSON.stringify(event))
          throw new Error('Conflicting duplicate event ID in '+source);
        original.sources.push(source);
      }else unique.set(event.eventId,{event,sources:[source]});
    }
  }
  const ordered=orderUsageEvents([...unique.values()].map(v=>v.event));
  const byEpisode=new Map(),bySession=new Map(),bySetting=new Map();
  const eventSources=new Map([...unique].map(([id,{sources}])=>[id,[...new Set(sources)]]));
  for(const event of ordered){
    const sk=event.sessionId,ek=sk+'\u0000'+event.episodeId;
    if(!bySession.has(sk))bySession.set(sk,{id:sk,events:0,episodes:new Set()});
    const session=bySession.get(sk);session.events++;session.episodes.add(ek);
    if(!byEpisode.has(ek))byEpisode.set(ek,[]);
    byEpisode.get(ek).push(event);
    if(event.type==='recipe_commit')
      for(const edit of event.changes||[]){
        if(typeof edit.key==='string')
          bySetting.set(edit.key,(bySetting.get(edit.key)||0)+1);
      }
  }
  const episodes=[];
  for(const [key,rows] of byEpisode){
    const first=rows.find(e=>e.type==='episode_start');
    const end=rows.findLast(e=>e.type==='episode_end');
    const exported=rows.filter(e=>e.type==='download_initiated');
    const requested=rows.filter(e=>e.type==='export_requested');
    const answers=rows.filter(e=>e.type==='survey_answer').map(e=>({
      kind:e.surveyKind,answer:e.answer,exportId:e.exportId||null,
      eventId:e.eventId
    }));
    const {recipe,error}=materializeRecipe(rows);
    episodes.push({
      sessionId:rows[0].sessionId,episodeId:rows[0].episodeId,
      firstEvent:rows[0].at,lastEvent:rows.at(-1).at,
      eventCount:rows.length,recipeChanges:rows.filter(e=>e.type==='recipe_commit').length,
      navigationEvents:rows.filter(e=>e.type==='navigation').length,
      exportsRequested:requested.length,downloadsInitiated:exported.length,
      exportSnapshots:exported.map(e=>({
        eventId:e.eventId,exportId:e.exportId||null,at:e.at,
        recipe:e.recipe?normalizeRecipe(e.recipe):null
      })),
      surveysOffered:rows.filter(e=>e.type==='survey_offered').length,
      surveysSkipped:rows.filter(e=>e.type==='survey_skipped').length,
      surveyAnswers:answers,
      outcome:end?'superseded_by_'+(end.cause||'unknown'):'open_or_interrupted_unconfirmed',
      replayError:error,
      initialRecipe:first?.recipe?normalizeRecipe(first.recipe):null,
      finalKnownRecipe:recipe,
      terminalRecipe:end?.recipe?normalizeRecipe(end.recipe):null,
      eventIds:rows.map(e=>e.eventId)
    });
  }
  const sessions=[...bySession.values()].map(s=>({
    sessionId:s.id,eventCount:s.events,episodeCount:s.episodes.size
  }));
  return {
    schema:1,sourceCount:sources.length,uniqueEventCount:ordered.length,
    duplicateEventCount:sources.reduce((n,s)=>n+s.data.events.length,0)-ordered.length,
    sessionCount:sessions.length,episodeCount:episodes.length,
    downloadInitiationCount:episodes.reduce((n,e)=>n+e.downloadsInitiated,0),
    surveyAnswerCount:episodes.reduce((n,e)=>n+e.surveyAnswers.length,0),
    topChangedSettings:[...bySetting].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
      .map(([key,changes])=>({key,changes})),
    sessions,episodes,eventSources:Object.fromEntries(eventSources)
  };
}
const nice=(v)=>String(v??'unknown').replace(/[|\n\r]/g,' ');
export function markdownCreativeUsageReport(report){
  const lines=[
    '# ROYGBIV creative activity evidence',
    '',
    '**Method:** Observed app events only. A download initiation is not proof a file was kept or used; an open/unconfirmed episode is not proof of intentional abandonment.',
    '',
    'Sessions: **'+report.sessionCount+'** · Episodes: **'+report.episodeCount+
      '** · Unique events: **'+report.uniqueEventCount+'** · Download initiations: **'+
      report.downloadInitiationCount+'** · Survey answers: **'+report.surveyAnswerCount+'**',
    '',
    '| Episode | Last observed | Recipe edits | Download initiations | Answers | Status |',
    '| --- | --- | ---: | ---: | ---: | --- |'
  ];
  for(const e of report.episodes){
    lines.push('| '+nice(e.episodeId.slice(0,12))+' | '+nice(e.lastEvent)+
      ' | '+e.recipeChanges+' | '+e.downloadsInitiated+
      ' | '+e.surveyAnswers.length+' | '+nice(e.replayError?
        'REPLAY INCOMPLETE: '+e.replayError:e.outcome)+' |');
  }
  lines.push('','## Most changed recipe settings','');
  if(!report.topChangedSettings.length)lines.push('No committed recipe changes recorded.');
  else for(const e of report.topChangedSettings.slice(0,15))
    lines.push('- '+nice(e.key)+': '+e.changes+' committed changes');
  lines.push('','**Evidence gaps:** This report cannot measure visual quality, actual wallpaper installation, satisfaction without a survey answer, nor interactions that were never durably recorded.');
  return lines.join('\n')+'\n';
}
