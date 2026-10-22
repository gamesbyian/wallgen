// Local-first geometry library: IndexedDB if available, explicitly session-only otherwise.
// Transactions resolve after COMMIT, not just after an individual request succeeds.
import {normalizeGeometryAsset,geometryContentHash} from './geometry-asset.js';

export const GEOMETRY_LIBRARY_DB='roygbiv-geometry-v1';
export const GEOMETRY_LIBRARY_DB_VERSION=1;
export const RECENT_DRAFT_LIMIT=20;
export const RECENT_DRAFT_DAYS=14;

const copy=value=>value===undefined?undefined:structuredClone(value);
const fold=s=>s.toLocaleLowerCase();
const error=(code,message)=>Object.assign(new Error(message),{code});
const revisionCheck=(actual,expected)=>{
  if(expected!==undefined&&actual!==expected)
    throw error('conflict','This item changed in another tab. Reload it before saving.');
};
function display(record){
  if(!record)return null;
  const {searchName,...asset}=copy(record);
  return asset;
}
function internal(asset){return {...copy(asset),searchName:fold(asset.name)};}
async function prepared(input,{idFactory,now}){
  const asset=normalizeGeometryAsset(input,{idFactory,now});
  return {...asset,contentHash:await geometryContentHash(asset.geometry)};
}
function ordered(records,{kind,query='',limit=60,offset=0}={}){
  if(kind!==undefined&&!['path','shape'].includes(kind))
    throw error('filter','Unrecognized asset kind');
  if(!Number.isInteger(offset)||offset<0||!Number.isInteger(limit)||limit<1||limit>500)
    throw error('filter','Invalid library page bounds');
  const term=String(query).trim().toLocaleLowerCase();
  return records.filter(r=>(!kind||r.kind===kind)&&
    (!term||fold(r.name).includes(term)||r.tags.some(t=>fold(t).includes(term))))
    .sort((a,b)=>b.modifiedAt.localeCompare(a.modifiedAt)||a.id.localeCompare(b.id))
    .slice(offset,offset+limit).map(display);
}
const day=86400000;
function recent(records,now){
  const cutoff=Date.parse(now)-RECENT_DRAFT_DAYS*day;
  return records.filter(r=>Date.parse(r.modifiedAt)>=cutoff)
    .sort((a,b)=>b.modifiedAt.localeCompare(a.modifiedAt)||a.id.localeCompare(b.id))
    .slice(0,RECENT_DRAFT_LIMIT);
}
function makeMemory({idFactory,now},warning){
  const assets=new Map(),drafts=new Map();
  const api={
    durable:false,warning,
    async get(id){return display(assets.get(id));},
    async list(options){return ordered([...assets.values()],options);},
    async add(input){
      const record=await prepared(input,{idFactory,now});
      if(assets.has(record.id))throw error('duplicate','That item ID already exists');
      assets.set(record.id,internal(record));
      return display(record);
    },
    async update(id,patch,{ifRevision}={}){
      const current=assets.get(id);
      if(!current)throw error('not-found','Library item not found');
      revisionCheck(current.revision,ifRevision);
      const next=await prepared({...current,...patch,id,
        createdAt:current.createdAt,revision:current.revision+1,
        modifiedAt:now()},{idFactory,now});
      assets.set(id,internal(next));
      return display(next);
    },
    async delete(id,{ifRevision}={}){
      const current=assets.get(id);
      if(!current)return false;
      revisionCheck(current.revision,ifRevision);
      assets.delete(id);
      return true;
    },
    async saveDraft(input){
      const record=await prepared(input,{idFactory,now});
      drafts.set(record.id,internal(record));
      await api.pruneDrafts();
      return display(record);
    },
    async listDrafts(){return recent([...drafts.values()],now()).map(display);},
    async pruneDrafts(){
      const keep=new Set(recent([...drafts.values()],now()).map(r=>r.id));
      for(const id of drafts.keys())if(!keep.has(id))drafts.delete(id);
    },
    async promoteDraft(id){
      const draft=drafts.get(id);
      if(!draft)throw error('not-found','Recent item not found');
      if(assets.has(id))throw error('duplicate','That item is already in your library');
      assets.set(id,copy(draft));drafts.delete(id);
      return display(draft);
    },
    close(){}
  };
  return api;
}
function openDatabase(factory){
  return new Promise((resolve,reject)=>{
    let finished=false;
    let request;
    try{request=factory.open(GEOMETRY_LIBRARY_DB,GEOMETRY_LIBRARY_DB_VERSION);}
    catch(e){reject(e);return;}
    const failure=e=>{if(!finished){finished=true;reject(e);}};
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains('assets')){
        const store=db.createObjectStore('assets',{keyPath:'id'});
        store.createIndex('kind','kind');
        store.createIndex('modifiedAt','modifiedAt');
        store.createIndex('searchName','searchName');
      }
      if(!db.objectStoreNames.contains('drafts'))
        db.createObjectStore('drafts',{keyPath:'id'});
      if(!db.objectStoreNames.contains('blobs'))
        db.createObjectStore('blobs',{keyPath:'id'});
      if(!db.objectStoreNames.contains('meta'))
        db.createObjectStore('meta',{keyPath:'key'});
    };
    request.onblocked=()=>failure(error('blocked','Close other ROYGBIV tabs to finish updating your library'));
    request.onerror=()=>failure(request.error||error('storage','Could not open geometry library'));
    request.onsuccess=()=>{
      if(finished){request.result.close();return;}
      finished=true;resolve(request.result);
    };
  });
}
// The callback runs synchronously while IDB transaction is active. It may queue
// further requests inside onsuccess; do not await arbitrary work inside this callback.
function transaction(db,stores,mode,work){
  return new Promise((resolve,reject)=>{
    let tx,finished=false,value;
    try{tx=db.transaction(stores,mode);}
    catch(e){reject(e);return;}
    const fail=e=>{if(!finished){finished=true;reject(e);}};
    const setResult=next=>{value=next;};
    tx.oncomplete=()=>{if(!finished){finished=true;resolve(copy(value));}};
    tx.onerror=()=>fail(tx.error||error('storage','Library transaction failed'));
    tx.onabort=()=>fail(tx.error||error('storage','Library transaction cancelled'));
    try{work(tx,setResult);}
    catch(e){try{tx.abort();}catch{}fail(e);}
  });
}
function idbStore(db,{idFactory,now}){
  db.onversionchange=()=>db.close();
  const get=id=>transaction(db,['assets'],'readonly',(tx,set)=>{
    const req=tx.objectStore('assets').get(id);
    req.onsuccess=()=>set(display(req.result));
  });
  const api={
    durable:true,warning:null,
    get,
    list(options){return transaction(db,['assets'],'readonly',(tx,set)=>{
      const req=tx.objectStore('assets').getAll();
      req.onsuccess=()=>{try{set(ordered(req.result,options));}catch(e){tx.abort();}};
    });},
    async add(input){
      const record=await prepared(input,{idFactory,now});
      await transaction(db,['assets'],'readwrite',(tx,set)=>{
        tx.objectStore('assets').add(internal(record));set(display(record));
      });
      return display(record);
    },
    async update(id,patch,{ifRevision}={}){
      const original=await get(id);
      if(!original)throw error('not-found','Library item not found');
      revisionCheck(original.revision,ifRevision);
      const next=await prepared({...original,...patch,id,
        createdAt:original.createdAt,revision:original.revision+1,
        modifiedAt:now()},{idFactory,now});
      // Verify under the write lock again: async hashing happened before this tx.
      return transaction(db,['assets'],'readwrite',(tx,set)=>{
        const store=tx.objectStore('assets'),read=store.get(id);
        read.onsuccess=()=>{
          if(!read.result||read.result.revision!==original.revision){
            tx.abort();return;
          }
          store.put(internal(next));set(display(next));
        };
      }).catch(async failure=>{
        if(failure?.name==='AbortError'){
          const present=await get(id);
          if(!present)throw error('not-found','Library item was deleted');
          throw error('conflict','This item changed in another tab. Reload it before saving.');
        }
        throw failure;
      });
    },
    delete(id,{ifRevision}={}){
      return transaction(db,['assets'],'readwrite',(tx,set)=>{
        const store=tx.objectStore('assets'),read=store.get(id);
        read.onsuccess=()=>{
          if(!read.result){set(false);return;}
          if(ifRevision!==undefined&&read.result.revision!==ifRevision){
            tx.abort();return;
          }
          store.delete(id);set(true);
        };
      }).catch(failure=>{
        if(failure?.name==='AbortError')
          throw error('conflict','This item changed in another tab. Reload it before deleting.');
        throw failure;
      });
    },
    async saveDraft(input){
      const record=await prepared(input,{idFactory,now});
      await transaction(db,['drafts'],'readwrite',(tx,set)=>{
        tx.objectStore('drafts').put(internal(record));set(record);
      });
      await api.pruneDrafts();
      return display(record);
    },
    listDrafts(){
      return transaction(db,['drafts'],'readonly',(tx,set)=>{
        const req=tx.objectStore('drafts').getAll();
        req.onsuccess=()=>set(recent(req.result,now()).map(display));
      });
    },
    pruneDrafts(){
      return transaction(db,['drafts'],'readwrite',(tx,set)=>{
        const store=tx.objectStore('drafts'),req=store.getAll();
        req.onsuccess=()=>{
          const keep=new Set(recent(req.result,now()).map(r=>r.id));
          for(const entry of req.result)if(!keep.has(entry.id))store.delete(entry.id);
          set(req.result.length-keep.size);
        };
      });
    },
    promoteDraft(id){
      return transaction(db,['assets','drafts'],'readwrite',(tx,set)=>{
        const assets=tx.objectStore('assets'),drafts=tx.objectStore('drafts');
        const draftRead=drafts.get(id);
        draftRead.onsuccess=()=>{
          if(!draftRead.result){tx.abort();return;}
          const current=assets.get(id);
          current.onsuccess=()=>{
            if(current.result){tx.abort();return;}
            assets.add(draftRead.result);drafts.delete(id);
            set(display(draftRead.result));
          };
        };
      }).catch(failure=>{
        if(failure?.name==='AbortError')throw error('conflict','Recent item is missing or already saved');
        throw failure;
      });
    },
    close(){db.close();}
  };
  return api;
}
export async function openGeometryLibrary({
  indexedDB=globalThis.indexedDB,idFactory=()=>globalThis.crypto.randomUUID(),
  now=()=>new Date().toISOString(),fallback=true
}={}){
  const dependencies={idFactory,now};
  if(indexedDB){
    try{return idbStore(await openDatabase(indexedDB),dependencies);}
    catch(e){
      if(!fallback)throw e;
      return makeMemory(dependencies,'Browser storage unavailable ('+(e.code||e.name||'error')+
        '). Items kept this visit only. Export a copy to preserve them.');
    }
  }
  if(!fallback)throw error('unavailable','IndexedDB is unavailable');
  return makeMemory(dependencies,
    'Browser storage is unavailable. Items kept this visit only. Export a copy to preserve them.');
}
