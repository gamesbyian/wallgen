// Self-contained, dependency-free JSON interchange for a single asset or library.
// ZIP packaging can wrap the same manifest later without changing this contract.
import {normalizeGeometryAsset,geometryContentHash} from './geometry-asset.js';

export const GEOMETRY_BACKUP_FORMAT='roygbiv.geometry-library';
export const GEOMETRY_BACKUP_VERSION=1;
export const MAX_BACKUP_BYTES=16*1024*1024;
export const MAX_BACKUP_ASSETS=500;
const bytes=new TextEncoder();
const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);

async function verifiedAsset(record){
  if(!object(record)||typeof record.id!=='string'||!record.id||
    typeof record.contentHash!=='string')throw new TypeError('Malformed geometry backup asset');
  const clean=normalizeGeometryAsset(record);
  const contentHash=await geometryContentHash(clean.geometry);
  if(contentHash!==record.contentHash)
    throw new TypeError('Geometry backup failed content integrity check for '+clean.id);
  return {...clean,contentHash};
}
function parseJSON(text){
  if(typeof text!=='string'||bytes.encode(text).length>MAX_BACKUP_BYTES)
    throw new TypeError('Geometry backup exceeds size limit');
  let data;
  try{data=JSON.parse(text);}catch{throw new TypeError('Invalid geometry backup JSON');}
  if(!object(data))throw new TypeError('Invalid geometry backup root');
  return data;
}
export async function serializeGeometryAsset(record){
  const clean=await verifiedAsset(record);
  return JSON.stringify(clean);
}
export async function parseGeometryAsset(text){
  const parsed=parseJSON(text);
  if(parsed.schema!=='roygbiv.geometry-asset'||parsed.version!==1)
    throw new TypeError('Unsupported geometry asset format');
  return verifiedAsset(parsed);
}
export async function serializeGeometryLibrary(records,{createdAt=new Date().toISOString()}={}){
  if(!Array.isArray(records)||records.length>MAX_BACKUP_ASSETS)
    throw new TypeError('Too many geometry assets to export');
  const items=[],ids=new Set();
  for(const record of records){
    const clean=await verifiedAsset(record);
    if(ids.has(clean.id))throw new TypeError('Duplicate asset identifier: '+clean.id);
    ids.add(clean.id);items.push(clean);
  }
  items.sort((a,b)=>a.id.localeCompare(b.id));
  const result={format:GEOMETRY_BACKUP_FORMAT,version:GEOMETRY_BACKUP_VERSION,
    createdAt,assets:items};
  const text=JSON.stringify(result);
  if(bytes.encode(text).length>MAX_BACKUP_BYTES)
    throw new TypeError('Geometry library backup exceeds size limit');
  return text;
}
export async function parseGeometryLibraryBackup(text){
  const parsed=parseJSON(text);
  if(parsed.format!==GEOMETRY_BACKUP_FORMAT||parsed.version!==GEOMETRY_BACKUP_VERSION||
    !Array.isArray(parsed.assets)||parsed.assets.length>MAX_BACKUP_ASSETS||
    typeof parsed.createdAt!=='string'||!Number.isFinite(Date.parse(parsed.createdAt)))
    throw new TypeError('Unsupported geometry library backup format');
  if(Object.keys(parsed).some(key=>!['format','version','createdAt','assets'].includes(key)))
    throw new TypeError('Unknown backup manifest property');
  const ids=new Set(),assets=[];
  for(const candidate of parsed.assets){
    const clean=await verifiedAsset(candidate);
    if(ids.has(clean.id))throw new TypeError('Duplicate asset identifier: '+clean.id);
    ids.add(clean.id);assets.push(clean);
  }
  return assets; // All assets validated before any caller can write to storage.
}
export async function prepareGeometryBackupEntry(input){
  const clean=normalizeGeometryAsset(input);
  return {...clean,contentHash:await geometryContentHash(clean.geometry)};
}
