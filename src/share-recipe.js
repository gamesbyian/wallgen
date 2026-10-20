import {normalizeRecipe} from './model.js';

// Static-host friendly sharing, requiring no server, account, third-party
// package or generated asset. This format is optional: old ?r= URLs keep
// working, as do JSON and embedded PNG recipes.
export const PORTABLE_SHARE_FORMAT='v1';
export const MAX_PORTABLE_RECIPE_BYTES=1024*1024;
export const MAX_PORTABLE_LINK_CHARS=8192;
const utf8=new TextEncoder();
const decoder=new TextDecoder('utf-8',{fatal:true});
const own=(a,key)=>Object.prototype.hasOwnProperty.call(a,key);

function recipeDelta(recipe){
  const normalized=normalizeRecipe(recipe),defaults=normalizeRecipe({});
  const delta={seed:normalized.seed,structure:normalized.structure};
  for(const [key,value] of Object.entries(normalized)){
    if(key==='seed'||key==='structure')continue;
    if(JSON.stringify(value)!==JSON.stringify(defaults[key]))delta[key]=value;
  }
  return delta;
}
function base64url(bytes){
  let binary='';
  for(let i=0;i<bytes.length;i+=8192)
    binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function fromBase64url(input){
  if(!/^[A-Za-z0-9_-]+$/.test(input))throw Error('Invalid compressed design link encoding');
  const padding='='.repeat((4-input.length%4)%4);
  const binary=atob(input.replace(/-/g,'+').replace(/_/g,'/')+padding);
  return Uint8Array.from(binary,c=>c.charCodeAt(0));
}
function compressionAvailable(){
  return typeof CompressionStream==='function'&&typeof DecompressionStream==='function';
}
async function readBounded(stream,limit){
  const reader=stream.getReader();
  const parts=[];
  let length=0;
  try{
    while(true){
      const {done,value}=await reader.read();
      if(done)break;
      length+=value.length;
      if(length>limit)throw Error('Compressed design expands beyond the 1 MB safety limit');
      parts.push(value);
    }
  }catch(error){
    await reader.cancel().catch(()=>{});
    throw error;
  }
  const all=new Uint8Array(length);
  let offset=0;
  for(const part of parts){all.set(part,offset);offset+=part.length;}
  return all;
}

export async function encodePortableRecipe(recipe){
  if(!compressionAvailable())throw Error('Compressed design links unsupported by this browser');
  // Store only nondefault canonical fields. This remains a complete recipe:
  // normalizeRecipe restores the exact remaining defaults on another device.
  const record={v:1,r:recipeDelta(recipe)};
  const bytes=utf8.encode(JSON.stringify(record));
  if(bytes.length>MAX_PORTABLE_RECIPE_BYTES)
    throw Error('Design is too large to encode as a portable link');
  const source=new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'));
  const packed=await readBounded(source,MAX_PORTABLE_RECIPE_BYTES);
  return PORTABLE_SHARE_FORMAT+'.'+base64url(packed);
}

export async function decodePortableRecipe(token){
  if(!compressionAvailable())throw Error('Compressed design links unsupported by this browser');
  if(typeof token!=='string'||!token.startsWith(PORTABLE_SHARE_FORMAT+'.'))
    throw Error('Unsupported compressed design link version');
  const encoded=token.slice(PORTABLE_SHARE_FORMAT.length+1);
  if(encoded.length>MAX_PORTABLE_LINK_CHARS)
    throw Error('Compressed design link is too long');
  const bytes=fromBase64url(encoded);
  let data;
  try{
    const decompressed=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
    data=await readBounded(decompressed,MAX_PORTABLE_RECIPE_BYTES);
  }catch{
    throw Error('Damaged compressed design link');
  }
  let record;
  try{record=JSON.parse(decoder.decode(data));}
  catch{throw Error('Damaged compressed design link');}
  if(!record||Array.isArray(record)||record.v!==1||!record.r||
     typeof record.r!=='object'||Array.isArray(record.r)||
     typeof record.r.seed!=='string'||!record.r.seed.trim()||
     !['paths','radial','regions'].includes(record.r.structure))
    throw Error('Invalid compressed design recipe');
  // A versioned delta must not insert prototype-controlled unknown fields.
  const defaults=normalizeRecipe({});
  if(Object.keys(record.r).some(key=>!own(defaults,key)))
    throw Error('Unsupported compressed design field');
  const restored=normalizeRecipe(record.r);
  // Require one canonical serialization form, so duplicate or incompatible
  // compressed records cannot masquerade as valid design snapshots.
  if(JSON.stringify(recipeDelta(restored))!==JSON.stringify(record.r))
    throw Error('Noncanonical compressed design recipe');
  return restored;
}

export function portableShareUrl(href,token){
  const url=new URL(href);
  url.searchParams.delete('r');
  url.hash='s='+token;
  if(url.href.length>MAX_PORTABLE_LINK_CHARS)
    throw Error('Compressed link is still too long. Use Save recipe JSON or Download PNG.');
  return url.href;
}

export function portableShareTokenFromLocation(locationLike){
  const raw=locationLike.hash?.startsWith('#')?locationLike.hash.slice(1):'';
  return new URLSearchParams(raw).get('s');
}
