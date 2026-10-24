// Private user-supplied TTF/OTF storage. Fonts are never sent to a server
// and are not embedded into PNG/JSON/share URLs. SHA-256 identifiers are the
// only information preserved in ordinary canonical recipes.
export const LOCAL_FONT_LIMIT_BYTES=5*1024*1024;
export const LOCAL_FONT_MAX_COUNT=32;
export const LOCAL_FONT_ID_PATTERN=/^user-[a-f0-9]{64}$/;
const DB_NAME='roygbiv-local-fonts-v1';
const STORE='fonts';
const loaded=new Map();
const ready=new Set();
export const isLocalFontId=id=>typeof id==='string'&&LOCAL_FONT_ID_PATTERN.test(id);
export const fontFamilyForId=id=>{
  if(!isLocalFontId(id))throw Error('Invalid local font ID');
  return 'ROYGBIV-Private-'+id.slice(5);
};
export function inspectLocalFont(bytes,name=''){
  if(!(bytes instanceof ArrayBuffer))throw Error('Font bytes unavailable');
  if(bytes.byteLength<12||bytes.byteLength>LOCAL_FONT_LIMIT_BYTES)
    throw Error('Font must be between 12 bytes and 5 MB');
  const signature=new DataView(bytes).getUint32(0,false);
  const format=signature===0x00010000?'ttf':signature===0x4f54544f?'otf':null;
  if(!format)throw Error('Only actual TrueType (.ttf) or OpenType (.otf) font files are supported');
  if(name&&(!/\.(ttf|otf)$/i.test(name)||name.length>250))
    throw Error('Choose a .ttf or .otf file with a valid filename');
  return {format,size:bytes.byteLength};
}
export async function hashFontBytes(bytes){
  if(!globalThis.crypto?.subtle?.digest)throw Error('Secure font fingerprinting is unavailable');
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return 'user-'+Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
}
function openDatabase(){
  if(typeof indexedDB==='undefined')return Promise.reject(Error('Local font storage is unavailable in this browser'));
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,1);
    request.onupgradeneeded=()=>{request.result.createObjectStore(STORE,{keyPath:'id'});};
    request.onerror=()=>reject(Error('Cannot open local font library'));
    request.onsuccess=()=>resolve(request.result);
  });
}
async function transact(mode,operation){
  const db=await openDatabase();
  return new Promise((resolve,reject)=>{
    let result;
    const tx=db.transaction(STORE,mode);
    const req=operation(tx.objectStore(STORE));
    req.onsuccess=()=>{result=req.result;};
    req.onerror=()=>{ /* transaction abort reports the failure */ };
    tx.oncomplete=()=>{db.close();resolve(result);};
    tx.onabort=()=>{db.close();reject(Error('Local font library transaction failed'));};
    tx.onerror=()=>{ /* onabort handles the error */ };
  });
}
const getRecord=id=>transact('readonly',store=>store.get(id));
const putRecord=record=>transact('readwrite',store=>store.put(record));
export async function listLocalFonts(){
  const records=await transact('readonly',store=>store.getAll());
  return records.map(({id,name,format,size})=>({id,name,format,size}))
    .sort((a,b)=>a.name.localeCompare(b.name));
}
const fontSet=()=>globalThis.document?.fonts||globalThis.fonts;
async function registerFont(id,bytes){
  if(loaded.has(id))return loaded.get(id);
  const task=(async()=>{
    if(typeof FontFace!=='function'||!fontSet()?.add)
      throw Error('This browser cannot install local fonts for Canvas rendering');
    inspectLocalFont(bytes);
    const face=new FontFace(fontFamilyForId(id),bytes,{style:'normal',weight:'700'});
    await face.load();  // Native browser parser, rejects malformed fonts.
    fontSet().add(face);
    ready.add(id);
    return face;
  })();
  loaded.set(id,task);
  try{return await task;}
  catch(error){loaded.delete(id);throw error;}
}
export function recipeLocalFontIds(recipe){
  return [...new Set((recipe?.textOverlays||[])
    .filter(x=>x.enabled!==false&&x.text)
    .map(x=>x.font).filter(isLocalFontId))];
}
export function localFontsReady(recipe){
  return recipeLocalFontIds(recipe).every(id=>ready.has(id));
}
export async function prepareLocalFonts(recipe){
  for(const id of recipeLocalFontIds(recipe)){
    if(loaded.has(id)){await loaded.get(id);continue;}
    const record=await getRecord(id);
    if(!record)throw Error('Missing local font '+id.slice(5,17)+'. Import the original TTF/OTF file again.');
    if(!record.bytes)throw Error('Local font data is damaged for '+id.slice(5,17));
    const idFromBytes=await hashFontBytes(record.bytes);
    if(idFromBytes!==id)throw Error('Local font failed its SHA-256 integrity check');
    await registerFont(id,record.bytes);
  }
}
export async function importLocalFont(file){
  if(!file||typeof file.arrayBuffer!=='function'||!Number.isFinite(file.size)||
    file.size>LOCAL_FONT_LIMIT_BYTES||file.size<12)
    throw Error('Choose a TTF/OTF font file smaller than 5 MB');
  const name=String(file.name||'imported.ttf').slice(0,250);
  const bytes=await file.arrayBuffer();
  const {format,size}=inspectLocalFont(bytes,name);
  const id=await hashFontBytes(bytes);
  const existing=await getRecord(id);
  if(!existing){
    const fonts=await listLocalFonts();
    if(fonts.length>=LOCAL_FONT_MAX_COUNT)
      throw Error('Font library is full (32 fonts). Existing fonts are never removed automatically.');
  }
  // Reject invalid font binaries before persistence and before selecting
  // them on a wallpaper. Never turn a failed import into a fallback render.
  await registerFont(id,bytes);
  await putRecord({id,name,format,size,bytes});
  return {id,name,format,size,alreadyInstalled:!!existing};
}

// Portable packages explicitly selected by a user may retrieve only their
// own locally stored font bytes. Ordinary PNG and share URLs still cannot.
export async function getLocalFontRecord(id){
  if(!isLocalFontId(id))throw Error('Invalid local font ID');
  const record=await getRecord(id);
  if(!record?.bytes)throw Error('Missing original local font '+id.slice(5,17));
  if((await hashFontBytes(record.bytes))!==id)
    throw Error('Local font integrity check failed: '+id.slice(5,17));
  const {format,size}=inspectLocalFont(record.bytes,record.name);
  return {id,name:record.name,format,size,bytes:record.bytes};
}
// Install a fully validated portable group in one IndexedDB transaction.
// Validate *every* binary before writing anything: a corrupt second face
// must not leave the first one half-imported.
export async function importLocalFontRecords(records){
  if(!Array.isArray(records)||!records.length||records.length>8)
    throw Error('Expected 1 to 8 imported fonts');
  const distinct=new Set();
  const prepared=[];
  for(const record of records){
    const id=record?.id;
    if(!isLocalFontId(id)||distinct.has(id))
      throw Error('Invalid or repeated portable font identifier');
    distinct.add(id);
    const name=String(record.name||'');
    const {format,size}=inspectLocalFont(record.bytes,name);
    if(record.format!==format||record.size!==size)
      throw Error('Portable font format or size mismatch');
    if((await hashFontBytes(record.bytes))!==id)
      throw Error('Portable font SHA-256 mismatch');
    prepared.push({id,name,format,size,bytes:record.bytes});
  }
  const already=await listLocalFonts();
  if(new Set([...already.map(x=>x.id),...distinct]).size>LOCAL_FONT_MAX_COUNT)
    throw Error('Not enough space in the 32-font library for this package');
  // Validate each binary through the native font parser before writing.
  // Do not populate the rendering cache until the group transaction commits.
  if(typeof FontFace!=='function'||!fontSet()?.add)
    throw Error('This browser cannot install portable fonts');
  for(const record of prepared){
    const trial=new FontFace(fontFamilyForId(record.id),record.bytes,
      {style:'normal',weight:'700'});
    await trial.load();
  }
  await transact('readwrite',store=>{
    const first=store.put(prepared[0]);
    for(const next of prepared.slice(1))store.put(next);
    return first;
  });
  for(const record of prepared)await registerFont(record.id,record.bytes);
  return prepared.map(({id,name,format,size})=>({id,name,format,size}));
}
