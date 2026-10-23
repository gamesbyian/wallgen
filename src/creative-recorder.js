// Optional, local-first evidence from canonical recipe transactions.
// No recording is performed until the owner explicitly enables it.
import {normalizeRecipe} from './model.js';

export const USAGE_DB='roygbiv-creative-usage-v1';
export const USAGE_MODE_KEY='roygbiv:creative-usage-mode:v1';
const clone=x=>x===undefined?undefined:structuredClone(x);

export function recipeDiff(before,after){
  const a=normalizeRecipe(before),b=normalizeRecipe(after);
  return [...new Set([...Object.keys(a),...Object.keys(b)])]
    .filter(key=>JSON.stringify(a[key])!==JSON.stringify(b[key]))
    .map(key=>({key,before:clone(a[key]),after:clone(b[key])}));
}
export function replayEpisode(records){
  let result=null;
  for(const record of records){
    if(record.type==='episode_start')result=clone(record.recipe);
    else if(record.type==='recipe_commit'&&result){
      for(const {key,after} of record.changes)result[key]=clone(after);
    }else if(record.type==='episode_end'&&result){
      if(JSON.stringify(normalizeRecipe(result))!==JSON.stringify(normalizeRecipe(record.recipe)))
        throw new Error('Incomplete or inconsistent recipe journey');
    }
  }
  return result?normalizeRecipe(result):null;
}
export function memoryUsageStore(warning='Temporary session-only records'){
  const events=new Map();let last=null;
  return {
    durable:false,warning,
    async append(event,snapshot){events.set(event.eventId,clone(event));last=clone(snapshot);},
    async all(){return clone([...events.values()]);},
    async last(){return clone(last);},
    async clear(){events.clear();last=null;}
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
        request.onsuccess=()=>set(request.result);
      }),
      last:()=>txRun(['state'],'readonly',(tx,set)=>{
        const request=tx.objectStore('state').get('last');
        request.onsuccess=()=>set(request.result?.value??null);
      }),
      clear:()=>txRun(['events','state'],'readwrite',tx=>{
        tx.objectStore('events').clear();tx.objectStore('state').clear();
      })
    };
  }catch(error){return memoryUsageStore('Persistent usage storage unavailable: '+String(error.message||error));}
}
export function createCreativeRecorder({store,id=()=>globalThis.crypto.randomUUID(),
  now=()=>new Date().toISOString(),enabled=false,onError=()=>{}}){
  let active=Boolean(enabled),sessionId=id(),episodeId=null,seq=0,commits=0,latest=null;
  let queue=Promise.resolve(),failed=null;
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
    episodeId=id();commits=0;
    const normalized=normalizeRecipe(recipe);
    event('episode_start',normalized,{cause,recipe:clone(normalized)});
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
    const normalized=normalizeRecipe(after);
    event('recipe_commit',normalized,{cause,changes,
      ...(context?{context:clone(context)}:{}),
      ...(commits%10===0?{recipe:clone(normalized)}:{})});
  }
  function action(type,recipe,details={}){
    if(!active)return;
    if(!episodeId)begin(recipe??latest);
    const allowed=['navigation','favorite_added','favorite_removed','export_requested',
      'download_initiated','export_failed','save_recipe_json','photo_compare',
      'hidden_unconfirmed','visible_again','survey_answer','session_interrupted'];
    if(!allowed.includes(type))throw new Error('Invalid usage event type');
    const item={...details};
    if(['export_requested','download_initiated','export_failed',
      'favorite_added','favorite_removed','save_recipe_json'].includes(type))
      item.recipe=clone(normalizeRecipe(recipe??latest));
    return event(type,recipe,item);
  }
  function supersede(before,after,cause='randomize_all'){
    if(!active)return;
    if(!episodeId)begin(before);
    event('episode_end',before,{cause,recipe:clone(normalizeRecipe(before)),
      committedEdits:commits});
    begin(after,cause);
  }
  function setEnabled(next,recipe){
    if(active===Boolean(next))return;
    active=Boolean(next);
    sessionId=id();episodeId=null;seq=0;commits=0;
    if(active)start(recipe);
  }
  async function exportJSON(){
    await queue;
    return JSON.stringify({schema:1,exportedAt:now(),source:'ROYGBIV local activity',
      durable:store.durable,events:await store.all(),lastKnown:await store.last()},null,2)+'\n';
  }
  async function clear(){await queue;await store.clear();failed=null;episodeId=null;seq=0;commits=0;}
  return {
    get enabled(){return active;},get durable(){return store.durable;},
    get error(){return failed;},get warning(){return store.warning;},
    start,transition,action,supersede,setEnabled,exportJSON,clear,
    flush:()=>queue,records:async()=>{await queue;return store.all();},
    last:async()=>{await queue;return store.last();}
  };
}
