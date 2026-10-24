// Explicit portable design + private fonts package. This is NOT PNG
// metadata and never sent through ROYGBIV share URLs or any network API.
import {normalizeRecipe} from './model.js';
import {isLocalFontId,getLocalFontRecord,importLocalFontRecords,
  LOCAL_FONT_LIMIT_BYTES,inspectLocalFont,hashFontBytes} from './local-fonts.js';

export const FONT_PACK_FORMAT='roygbiv-portable-design';
export const FONT_PACK_VERSION=1;
export const FONT_PACK_MIME='application/json';
export const MAX_PACK_FONTS=8;
export const MAX_PACK_FONT_BYTES=12*1024*1024;
export const MAX_PACK_FILE_BYTES=18*1024*1024;

export function packageFontIds(recipe){
  return [...new Set((recipe?.textOverlays||[]).map(x=>x.font)
    .filter(isLocalFontId))].sort();
}
const encodeBytes=bytes=>{
  const view=new Uint8Array(bytes);
  let result='';
  // Avoid apply() or large argument lists on 5 MB user fonts.
  for(let i=0;i<view.length;i+=0x8000)
    result+=String.fromCharCode(...view.subarray(i,i+0x8000));
  return btoa(result);
};
const decodeBytes=(base64,expectedSize)=>{
  if(typeof base64!=='string'||!/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)||
      base64.length!==Math.ceil(expectedSize/3)*4)
    throw Error('Portable font binary encoding is invalid');
  const raw=atob(base64);
  if(raw.length!==expectedSize)throw Error('Portable font binary size mismatch');
  const bytes=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
  return bytes.buffer;
};
export async function exportPortableFontPack(input){
  const recipe=normalizeRecipe(input);
  const ids=packageFontIds(recipe);
  if(!ids.length)throw Error('This design has no private fonts to package');
  if(ids.length>MAX_PACK_FONTS)throw Error('Too many private font files in design');
  const fonts=[];
  let sizeSum=0;
  for(const id of ids){
    const record=await getLocalFontRecord(id);
    sizeSum+=record.size;
    if(sizeSum>MAX_PACK_FONT_BYTES)
      throw Error('Package exceeds the 12 MB private-font budget');
    fonts.push({id,name:record.name,format:record.format,size:record.size,
      base64:encodeBytes(record.bytes)});
  }
  const document={format:FONT_PACK_FORMAT,version:FONT_PACK_VERSION,
    notice:'Private font files: share or redistribute only when you have permission.',
    recipe,fonts};
  const json=JSON.stringify(document);
  if(new Blob([json]).size>MAX_PACK_FILE_BYTES)
    throw Error('Portable font package exceeds 18 MB');
  return new Blob([json],{type:FONT_PACK_MIME});
}
export async function inspectPortableFontPack(file){
  if(!file||typeof file.text!=='function'||!Number.isFinite(file.size)||
      file.size<30||file.size>MAX_PACK_FILE_BYTES)
    throw Error('Choose a portable ROYGBIV font package smaller than 18 MB');
  const parsed=JSON.parse(await file.text());
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)||
      parsed.format!==FONT_PACK_FORMAT||parsed.version!==FONT_PACK_VERSION)
    throw Error('Unsupported ROYGBIV portable font package version');
  if(!parsed.recipe||typeof parsed.recipe!=='object'||Array.isArray(parsed.recipe))
    throw Error('Portable design recipe is missing');
  const recipe=normalizeRecipe(parsed.recipe);
  const expected=packageFontIds(recipe);
  if(!expected.length||expected.length>MAX_PACK_FONTS||!Array.isArray(parsed.fonts)||
      parsed.fonts.length!==expected.length)
    throw Error('Portable font manifest does not match the recipe');
  const records=[];
  let total=0;
  const seen=new Set();
  for(const source of parsed.fonts){
    if(!source||typeof source!=='object'||!isLocalFontId(source.id)||
      !expected.includes(source.id)||seen.has(source.id))
      throw Error('Unexpected or duplicate font in package');
    seen.add(source.id);
    if(!Number.isSafeInteger(source.size)||source.size<12||
        source.size>LOCAL_FONT_LIMIT_BYTES)
      throw Error('Portable font exceeds allowed size');
    total+=source.size;
    if(total>MAX_PACK_FONT_BYTES)throw Error('Portable package exceeds 12 MB budget');
    const name=source.name;
    if(typeof name!=='string'||name.length>250)
      throw Error('Portable font filename is invalid');
    const bytes=decodeBytes(source.base64,source.size);
    const {format,size}=inspectLocalFont(bytes,name);
    if(format!==source.format||size!==source.size)
      throw Error('Portable font binary signature does not match manifest');
    if((await hashFontBytes(bytes))!==source.id)
      throw Error('Portable font SHA-256 mismatch');
    records.push({id:source.id,name,format,size,bytes});
  }
  return {recipe,records,fontCount:records.length,totalBytes:total};
}
export async function importPortableFontPack(file,{approve}={}){
  const inspected=await inspectPortableFontPack(file);
  // Presentation controls call approve only after a *full* safe parsing pass.
  // No byte is persisted if the user declines to replace their design.
  if(typeof approve==='function'&&!await approve(inspected))return null;
  await importLocalFontRecords(inspected.records);
  return inspected.recipe;
}
