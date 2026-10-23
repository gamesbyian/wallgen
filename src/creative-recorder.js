// Optional, local-first evidence from canonical recipe transactions.
// No recording is performed until the owner explicitly enables it.
import {normalizeRecipe} from './model.js';
import {makeUsageBatch,orderUsageEvents} from './creative-github-sync.js';

export const USAGE_DB='roygbiv-creative-usage-v1';
export const USAGE_MODE_KEY='roygbiv:creative-usage-mode:v1';
const clone=x=>x===undefined?undefined:structuredClone(x);

export function recipeDiff(before,after){
  const a=normalizeRecipe(before),b=normalizeRecipe(after);
  return [...new Set([...Object.keys(a),...Object.keys(b)])]
    .filter(key=>JSON.stringify(a[key])!==JSON.stringify(b[key]))
    .map(key=>({key,before:clone(a[key]),after:clone(b[key])}));
}
// A compact, deterministic corruption detector over the canonical recipe.
// FNV-1a is a checksum, not authentication or a tamper-resistant signature.
export function recipeDigest(recipe){
  const bytes=new TextEncoder().encode(JSON.stringify(normalizeRecipe(recipe)));
  let hash=0x811c9dc5;
  for(const byte of bytes)hash=Math.imul(hash^byte,0x01000193)>>>0;
  return 'fnv1a32:'+hash.toString(16).padStart(8,'0');
}
export function replayEpisode(records){
  let result=null;
  for(const record of records){
    if(record.type==='episode_start'){
      if(result)throw new Error('Multiple starts in one recipe episode');
      if(!record.recipe)throw new Error('Missing initial recipe checkpoint');
      result=normalizeRecipe(record.recipe);
    }else if(record.type==='recipe_commit'){
      if(!result)throw new Error('Missing initial recipe checkpoint');
      if(!Array.isArray(record.changes))
        throw new Error('Missing committed recipe changes');
      if(record.beforeDigest&&record.beforeDigest!==recipeDigest(result))
        throw new Error('Recipe replay predecessor checksum mismatch');
      for(const {key,before,after} of record.changes){
        if(JSON.stringify(result[key])!==JSON.stringify(before))
          throw new Error('Recipe replay before-value mismatch: '+key);
        result[key]=clone(after);
      }
      result=normalizeRecipe(result);
      if(record.recipe&&
        JSON.stringify(result)!==JSON.stringify(normalizeRecipe(record.recipe)))
        throw new Error('Recipe replay full checkpoint mismatch');
    }else if((record.type==='episode_end'||record.type==='session_interrupted')&&result){
      if(JSON.stringify(result)!==JSON.stringify(normalizeRecipe(record.recipe)))
        throw new Error('Incomplete or inconsistent recipe journey');
    }
    if(result&&record.afterDigest&&record.afterDigest!==recipeDigest(result))
      throw new Error('Recipe replay successor checksum mismatch');
  }
  return result?normalizeRecipe(result):null;
}
// Retention is opt-in and session-atomic: never leave a partial journey,
// discard unsent activity or prune the last-known live session.
export function prunableSyncedEventIds(rows,syncedIds,before,{
  protectedSessionIds=[],reservedEventIds=[]
}={}){
  const cutoff=Date.parse(before);
  if(!Number.isFinite(cutoff))throw new Error('Invalid activity retention cutoff');
  const synced=new Set(syncedIds),reserved=new Set(reservedEventIds);
  const protectedIds=new Set(protectedSessionIds);
  const sessions=new Map();
  for(const event of rows){
    if(typeof event.sessionId!=='string'||typeof event.eventId!=='string')continue;
    if(!sessions.has(event.sessionId))
      sessions.set(event.sessionId,{allSyncedAndOld:!protectedIds.has(event.sessionId),ids:[]});
    const group=sessions.get(event.sessionId);
    group.ids.push(event.eventId);
    const at=Date.parse(event.at);
    if(!Number.isFinite(at)||at>=cutoff||!synced.has(event.eventId)||
      reserved.has(event.eventId))group.allSyncedAndOld=false;
  }
  return [...sessions.values()].filter(s=>s.allSyncedAndOld).flatMap(s=>s.ids);
}
// Counts are derived from durable event IDs and acknowledgements, not the
// presence of a configured token. A reserved outbox is still unconfirmed.
export function summarizeUsageBacklog(eventIds,syncedIds,reservedBatch=null){
  const present=new Set(eventIds);
  const synced=new Set(syncedIds);
  const backedUp=[...present].filter(id=>synced.has(id)).length;
  const reserved=(reservedBatch?.eventIds||[]).filter(id=>
    present.has(id)&&!synced.has(id)).length;
  return {total:present.size,backedUp,
    pending:present.size-backedUp,reserved};
}
export function memoryUsageStore(warning='Temporary session-only records'){
  const events=new Map();let last=null,outbox=null,synced=new Set();
  return {
    durable:false,warning,
    async append(event,snapshot){events.set(event.eventId,clone(event));last=clone(snapshot);},
    async all(){return clone(orderUsageEvents([...events.values()]));},
    async last(){return clone(last);},
    async syncSummary(){
      return summarizeUsageBacklog([...events.keys()],[...synced],outbox);
    },
    async reserveBatch(){
      if(!outbox)outbox=makeUsageBatch([...events.values()],[...synced]);
      return clone(outbox);
    },
    async ackBatch(id){
      if(!outbox||outbox.id!==id)throw new Error('Unknown activity batch');
      for(const eventId of outbox.eventIds)synced.add(eventId);
      outbox=null;
    },
    async pruneSyncedBefore(before){
      const ids=prunableSyncedEventIds([...events.values()],synced,before,{
        protectedSessionIds:last?[last.sessionId]:[],
        reservedEventIds:outbox?.eventIds||[]
      });
      for(const eventId of ids){events.delete(eventId);synced.delete(eventId);}
      return ids.length;
    },
    async clear(){events.clear();last=null;outbox=null;synced.clear();}
  };
}
export async function openUsageStore(factory=globalThis.indexedDB){
  if(!factory)return memoryUsageStore('Browser storage unavailable; data lasts only this visit.');
  try{
    const db=await new Promise((resolve,reject)=>{
      const req=factory.open(USAGE_DB,1);
      req.onupgradeneeded=()=>{
        if(!req.result.objectStoreNames.contains('events'))
          req.result.createObjectStore('events',{keyPath:'eventId'});
        if(!req.result.objectStoreNames.contains('state'))
          req.result.createObjectStore('state',{keyPath:'key'});
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('Could not open usage storage'));
      req.onblocked=()=>reject(new Error('Close other ROYGBIV tabs before upgrading usage storage'));
    });
    db.onversionchange=()=>db.close();
    const txRun=(stores,mode,fn)=>new Promise((resolve,reject)=>{
      const tx=db.transaction(stores,mode);
      let outcome;
      tx.oncomplete=()=>resolve(clone(outcome));
      tx.onerror=()=>reject(tx.error||new Error('Usage storage transaction failed'));
      tx.onabort=()=>reject(tx.error||new Error('Usage storage transaction aborted'));
      try{fn(tx,v=>{outcome=v;});}catch(e){tx.abort();reject(e);}
    });
    return {
      durable:true,warning:null,
      append:(event,snapshot)=>txRun(['events','state'],'readwrite',tx=>{
        tx.objectStore('events').put(clone(event));
        tx.objectStore('state').put({key:'last',value:clone(snapshot)});
      }),
      all:()=>txRun(['events'],'readonly',(tx,set)=>{
        const request=tx.objectStore('events').getAll();
        request.onsuccess=()=>set(orderUsageEvents(request.result));
      }),
      last:()=>txRun(['state'],'readonly',(tx,set)=>{
        const request=tx.objectStore('state').get('last');
        request.onsuccess=()=>set(request.result?.value??null);
      }),
      syncSummary:()=>txRun(['events','state'],'readonly',(tx,set)=>{
        const request=tx.objectStore('events').getAllKeys();
        request.onsuccess=()=>{
          const state=tx.objectStore('state'),synced=state.get('synced');
          synced.onsuccess=()=>{
            const reserved=state.get('outbox');
            reserved.onsuccess=()=>set(summarizeUsageBacklog(
              request.result,synced.result?.value||[],reserved.result?.value
            ));
          };
        };
      }),
      reserveBatch:()=>txRun(['events','state'],'readwrite',(tx,set)=>{
        const state=tx.objectStore('state'),old=state.get('outbox');
        old.onsuccess=()=>{
          if(old.result?.value){set(old.result.value);return;}
          const request=tx.objectStore('events').getAll();
          request.onsuccess=()=>{
            const synced=state.get('synced');
            synced.onsuccess=()=>{
              try{
                const batch=makeUsageBatch(request.result,synced.result?.value||[]);
                if(batch)state.put({key:'outbox',value:batch});
                set(batch);
              }catch(error){console.warn('Cannot prepare usage backup:',error);tx.abort();}
            };
          };
        };
      }),
      ackBatch:id=>txRun(['state'],'readwrite',tx=>{
        const state=tx.objectStore('state'),old=state.get('outbox');
        old.onsuccess=()=>{
          const batch=old.result?.value;
          if(batch?.id!==id){tx.abort();return;}
          const previous=state.get('synced');
          previous.onsuccess=()=>{
            const ids=new Set(previous.result?.value||[]);
            for(const eventId of batch.eventIds)ids.add(eventId);
            state.put({key:'synced',value:[...ids]});
            state.delete('outbox');
          };
        };
      }),
      pruneSyncedBefore:before=>txRun(['events','state'],'readwrite',(tx,set)=>{
        const events=tx.objectStore('events'),state=tx.objectStore('state');
        const all=events.getAll();
        all.onsuccess=()=>{
          const synced=state.get('synced');
          synced.onsuccess=()=>{
            const outbox=state.get('outbox');
            outbox.onsuccess=()=>{
              const last=state.get('last');
              last.onsuccess=()=>{
                const ids=prunableSyncedEventIds(all.result,synced.result?.value||[],before,{
                  protectedSessionIds:last.result?.value?[last.result.value.sessionId]:[],
                  reservedEventIds:outbox.result?.value?.eventIds||[]
                });
                if(ids.length){
                  const deleted=new Set(ids);
                  for(const id of ids)events.delete(id);
                  state.put({key:'synced',value:(synced.result?.value||[])
                    .filter(id=>!deleted.has(id))});
                }
                set(ids.length);
              };
            };
          };
        };
      }),
      clear:()=>txRun(['events','state'],'readwrite',tx=>{
        tx.objectStore('events').clear();tx.objectStore('state').clear();
      })
    };
  }catch(error){return memoryUsageStore('Persistent usage storage unavailable: '+String(error.message||error));}
}
export function createCreativeRecorder({store,id=()=>globalThis.crypto.randomUUID(),
  now=()=>new Date().toISOString(),clock=()=>Date.now(),enabled=false,onError=()=>{}}){
  let active=Boolean(enabled),sessionId=id(),episodeId=null,seq=0,commits=0,latest=null;
  let queue=Promise.resolve(),failed=null,recoveryWarning=null;
  let manualEdits=0,engagedMs=0,lastActivityMs=null,lastExportedRecipe=null;
  let lastManualKey=null,lastManualAt=null,lastRequestedRecipe=null;
  const recipeKey=x=>JSON.stringify(normalizeRecipe(x));
  const engagement=()=>{
    if(lastActivityMs===null)return engagedMs;
    return engagedMs+Math.max(0,Math.min(60000,clock()-lastActivityMs));
  };
  const episodeStats=recipe=>({
    manualEdits,engagedMs:engagement(),
    finalExported:lastExportedRecipe===recipeKey(recipe??latest),
    finalExportPending:lastRequestedRecipe===recipeKey(recipe??latest)
  });
  const enqueue=(record,snapshot)=>{
    queue=queue.then(()=>store.append(record,snapshot)).catch(error=>{
      failed=error;onError(error);
    });
  };
  function event(type,recipe,extra={}){
    if(!active)return;
    const normalized=normalizeRecipe(recipe??latest??{});
    latest=normalized;
    const item={schema:1,eventId:id(),sessionId,episodeId,seq:++seq,
      at:now(),type,...extra};
    // Every row has the latest persisted full snapshot, even when the event
    // itself stores only a compact top-level recipe diff.
    enqueue(item,{sessionId,episodeId,seq,at:item.at,recipe:normalized,type});
    return item;
  }
  function begin(recipe,cause='session_start'){
    if(!active)return;
    episodeId=id();commits=0;manualEdits=0;engagedMs=0;lastActivityMs=null;
    lastExportedRecipe=null;lastRequestedRecipe=null;lastManualKey=null;lastManualAt=null;
    const normalized=normalizeRecipe(recipe);
    event('episode_start',normalized,{cause,recipe:clone(normalized),
      afterDigest:recipeDigest(normalized)});
  }
  function recoverPrevious(previous){
    // Only the existing last durable snapshot may be reconciled. No browser
    // unload event is reliable enough to prove a session ended intentionally.
    // Another tab may even still be active: this is explicitly unconfirmed.
    if(!active||episodeId||!previous||previous.type==='session_interrupted')
      return false;
    // IndexedDB can survive an interrupted or partially migrated session.
    // Do not turn a corrupt checkpoint into a fabricated "interrupted" event,
    // nor write an unsafe sequence that poisons downstream replay forever.
    const invalid=()=>{
      recoveryWarning='Previous activity checkpoint could not be verified. '+
        'Its existing events remain available to inspect/export; no terminal event was invented.';
      return false;
    };
    if(typeof previous.sessionId!=='string'||!previous.sessionId||
      typeof previous.episodeId!=='string'||!previous.episodeId||
      !Number.isSafeInteger(previous.seq)||previous.seq<1||
      previous.seq>=Number.MAX_SAFE_INTEGER||!previous.recipe)
      return invalid();
    let snapshot,digest;
    try{
      snapshot=normalizeRecipe(previous.recipe);
      digest=recipeDigest(snapshot);
    }catch{return invalid();}
    const at=now(),seq=previous.seq+1;
    const eventId=id();
    const item={schema:1,eventId,sessionId:previous.sessionId,
      episodeId:previous.episodeId,seq,at,type:'session_interrupted',
      cause:'next_startup_found_last_known_snapshot',uncertain:true,
      lastObservedAt:previous.at||null,recipe:clone(snapshot),
      afterDigest:digest};
    enqueue(item,{sessionId:previous.sessionId,episodeId:previous.episodeId,
      seq,at,type:'session_interrupted',recipe:snapshot});
    return true;
  }
  function start(recipe){
    if(!active||episodeId)return;
    latest=normalizeRecipe(recipe);
    begin(latest);
  }
  function transition(before,after,{cause='edit',context=null}={}){
    if(!active)return;
    const changes=recipeDiff(before,after);
    if(!changes.length)return;
    if(!episodeId)begin(before);
    commits++;
    if(cause==='edit'||cause==='slider_settled'){
      // Interactive slider preview frames are not distinct creative decisions.
      // Consecutive edits to the same fields form one gesture within 1.2 s.
      const tick=clock(),fieldSet=changes.map(x=>x.key).sort().join('|');
      if(lastManualKey!==fieldSet||lastManualAt===null||
        tick-lastManualAt>1200)manualEdits++;
      lastManualKey=fieldSet;lastManualAt=tick;
      if(lastActivityMs!==null)engagedMs+=Math.max(0,Math.min(60000,tick-lastActivityMs));
      lastActivityMs=tick;
    }
    const normalized=normalizeRecipe(after);
    event('recipe_commit',normalized,{cause,changes,
      beforeDigest:recipeDigest(before),afterDigest:recipeDigest(normalized),
      ...(context?{context:clone(context)}:{}),
      ...(commits%10===0?{recipe:clone(normalized)}:{})});
  }
  function action(type,recipe,details={}){
    if(!active)return;
    // Async exports can finish after opting out, clearing history, or opting
    // in anew. Never import a pre-revocation result into the new session.
    if(details.targetSessionId&&details.targetSessionId!==sessionId)return;
    if(!episodeId)begin(recipe??latest);
    const allowed=['navigation','favorite_added','favorite_removed','export_requested',
      'download_initiated','export_failed','save_recipe_json','photo_compare',
      'hidden_unconfirmed','visible_again','survey_answer','survey_offered',
      'survey_skipped','session_interrupted'];
    if(!allowed.includes(type))throw new Error('Invalid usage event type');
    const {targetSessionId:_targetSessionId,...item}=details;
    const targetEpisodeId=details.targetEpisodeId||episodeId;
    const historical=targetEpisodeId!==episodeId;
    if(!historical){
      if(type==='export_requested')lastRequestedRecipe=recipeKey(recipe??latest);
      if(type==='download_initiated'){
        lastExportedRecipe=recipeKey(recipe??latest);
        lastRequestedRecipe=null;
      }
      if(type==='export_failed')lastRequestedRecipe=null;
    }
    if(type==='hidden_unconfirmed')lastActivityMs=null;
    if(['export_requested','download_initiated','export_failed',
      'favorite_added','favorite_removed','save_recipe_json'].includes(type))
      item.recipe=clone(normalizeRecipe(recipe??latest));
    // A PNG may finish rendering after Randomize All started another episode.
    // Retain the original export's episode attribution without regressing the
    // currently active episode's durable last-known recipe checkpoint.
    return event(type,historical?latest:recipe,{...item,episodeId:targetEpisodeId});
  }
  function supersede(before,after,cause='randomize_all'){
    if(!active)return null;
    if(!episodeId)begin(before);
    const previousEpisodeId=episodeId,stats=episodeStats(before);
    event('episode_end',before,{cause,recipe:clone(normalizeRecipe(before)),
      afterDigest:recipeDigest(before),committedEdits:commits,...stats});
    begin(after,cause);
    return {targetEpisodeId:previousEpisodeId,...stats};
  }
  function setEnabled(next,recipe){
    if(active===Boolean(next))return;
    active=Boolean(next);
    sessionId=id();episodeId=null;seq=0;commits=0;
    manualEdits=0;engagedMs=0;lastActivityMs=null;lastExportedRecipe=null;
    lastRequestedRecipe=null;lastManualKey=null;lastManualAt=null;
    if(active)start(recipe);
  }
  async function exportJSON(){
    await queue;
    return JSON.stringify({schema:1,exportedAt:now(),source:'ROYGBIV local activity',
      durable:store.durable,events:await store.all(),lastKnown:await store.last()},null,2)+'\n';
  }
  async function clear(){
    await queue;await store.clear();
    // The remote immutable archive may still contain events from the deleted
    // session. A fresh locally consented history must not reuse its identity
    // or restart its sequence inside that same historical session.
    sessionId=id();failed=null;recoveryWarning=null;episodeId=null;seq=0;commits=0;
    manualEdits=0;engagedMs=0;lastActivityMs=null;lastExportedRecipe=null;
    lastRequestedRecipe=null;lastManualKey=null;lastManualAt=null;
  }
  return {
    get enabled(){return active;},get episodeId(){return episodeId;},
    get sessionId(){return sessionId;},
    get durable(){return store.durable;},episodeStats,
    get error(){return failed;},get warning(){return store.warning;},
    get recoveryWarning(){return recoveryWarning;},
    start,recoverPrevious,transition,action,supersede,setEnabled,exportJSON,clear,
    flush:()=>queue,records:async()=>{await queue;return store.all();},
    last:async()=>{await queue;return store.last();}
  };
}
