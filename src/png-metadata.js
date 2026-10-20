import { normalizeRecipe, OUTPUT_WIDTH, OUTPUT_HEIGHT } from './model.js';

// PNG ancillary metadata writer. No external dependencies, no canvas rerendering.
// The original PNG pixels/IDAT remain byte-for-byte unchanged.
const encoder=new TextEncoder();
const PNG_SIGNATURE=[137,80,78,71,13,10,26,10];
const put32=(out,n)=>{out.push((n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255);};
function u32(bytes,at){return ((bytes[at]*0x1000000)+(bytes[at+1]<<16)+(bytes[at+2]<<8)+bytes[at+3])>>>0;}
const crcTable=Uint32Array.from({length:256},(_,n)=>{
  let x=n;
  for(let i=0;i<8;i++)x=(x&1)?(0xedb88320^(x>>>1)):(x>>>1);
  return x>>>0;
});
function crc(bytes){let x=0xffffffff;for(const b of bytes)x=crcTable[(x^b)&255]^(x>>>8);return (x^0xffffffff)>>>0;}
function chunk(type,data){
  const t=encoder.encode(type);
  const out=new Uint8Array(data.length+12);
  const view=new DataView(out.buffer);
  view.setUint32(0,data.length,false);
  out.set(t,4);out.set(data,8);
  view.setUint32(out.length-4,crc(out.subarray(4,out.length-4)),false);
  return out;
}
function utf8Text(keyword,value){
  // iTXt: keyword, null, compression flag 0, method 0, empty language and
  // translated keyword, UTF-8 value.
  const k=encoder.encode(keyword),v=encoder.encode(value);
  const payload=new Uint8Array(k.length+5+v.length);
  payload.set(k);payload.set(v,k.length+5);
  return chunk('iTXt',payload);
}
export const METADATA_FIELDS=['title','creator','description','copyright','keywords','comment','software',
  'dateTime','cameraMake','cameraModel'];
export function cleanMetadata(values={}){
  const result={};
  for(const key of METADATA_FIELDS){
    const raw=values[key];
    const cleaned=String(raw??'').replace(/\u0000/g,'').trim().slice(0,key==='description'||key==='comment'?2000:400);
    if(cleaned)result[key]=cleaned;
  }
  return result;
}
function ascii(value){return encoder.encode(value.replace(/[^\x20-\x7E]/g,'?')+'\0');}
// TIFF IFD0 for standard EXIF tag readers; iTXt additionally retains Unicode.
function exifTiff(info){
  const tags=[];
  const add=(id,value)=>{if(value)tags.push({id,bytes:ascii(value)});};
  add(0x010e,info.description||info.title);
  add(0x010f,info.cameraMake);
  add(0x0110,info.cameraModel);
  add(0x0131,info.software);
  add(0x0132,info.dateTime?.replace('T',' ').replace(/-/g,':').slice(0,19));
  add(0x013b,info.creator);
  add(0x8298,info.copyright);
  tags.sort((a,b)=>a.id-b.id);
  if(!tags.length)return null;
  const fixed=8+2+12*tags.length+4;
  const length=fixed+tags.reduce((n,t)=>n+(t.bytes.length>4?t.bytes.length:0),0);
  const out=new Uint8Array(length),dv=new DataView(out.buffer);
  out[0]=73;out[1]=73;dv.setUint16(2,42,true);dv.setUint32(4,8,true);
  dv.setUint16(8,tags.length,true);
  let extra=fixed;
  tags.forEach((tag,i)=>{
    const off=10+12*i;dv.setUint16(off,tag.id,true);dv.setUint16(off+2,2,true);
    dv.setUint32(off+4,tag.bytes.length,true);
    if(tag.bytes.length<=4)out.set(tag.bytes,off+8);
    else{dv.setUint32(off+8,extra,true);out.set(tag.bytes,extra);extra+=tag.bytes.length;}
  });
  dv.setUint32(10+12*tags.length,0,true);
  return out;
}
export const RECIPE_KEYWORD='ROYGBIV Recipe';
export const RECIPE_FORMAT='roygbiv-recipe-v2';
// Full normalized Interior selections can legitimately exceed the old 64 KiB
// reader bound. Still cap named metadata before parsing untrusted JSON.
export const MAX_RECIPE_ITXT_BYTES=1024*1024;
const recipeKeywordBytes=encoder.encode(RECIPE_KEYWORD);
export function serializePngRecipe(recipe){
  return JSON.stringify({format:RECIPE_FORMAT,recipe:normalizeRecipe(recipe),
    output:{width:OUTPUT_WIDTH,height:OUTPUT_HEIGHT},generator:'R.O.Y.G.B.I.V.'});
}
export function embedPngMetadata(input,values={},options={}){
  const bytes=input instanceof Uint8Array?input:new Uint8Array(input);
  const metadata=cleanMetadata(values);
  // Every exported PNG must contain a complete machine-readable recipe,
  // even if the user leaves all optional descriptive metadata empty.
  if(!Object.keys(metadata).length && options.recipe===undefined)return new Uint8Array(bytes);
  if(bytes.length<20||!PNG_SIGNATURE.every((v,i)=>bytes[i]===v))throw Error('Input is not a PNG');

  const names={title:'Title',creator:'Author',description:'Description',copyright:'Copyright',
    keywords:'Keywords',comment:'Comment',software:'Software',dateTime:'Creation Time',
    cameraMake:'Camera Make',cameraModel:'Camera Model'};
  const chunks=Object.entries(metadata).map(([key,value])=>utf8Text(names[key],value));
  if(options.recipe!==undefined){
    const embedded= utf8Text(RECIPE_KEYWORD,serializePngRecipe(options.recipe));
    if(embedded.length-12>MAX_RECIPE_ITXT_BYTES)
      throw Error('PNG recipe metadata exceeds 1 MB export limit');
    chunks.push(embedded);
  }
  const exif=exifTiff(metadata);
  if(exif)chunks.push(chunk('eXIf',exif));
  // Replace recipe chunks wherever they occur: PNG permits ancillary
  // text both before and after the (contiguous) IDAT sequence. Older exports
  // could contain multiple recipes; never let a stale one survive re-export.
  const oldChunks=[];
  let offset=8,insertIndex=-1;
  while(offset+12<=bytes.length){
    const size=u32(bytes,offset);
    if(size>bytes.length-offset-12)throw Error('Damaged PNG chunk');
    const end=offset+12+size;
    const type=String.fromCharCode(...bytes.subarray(offset+4,offset+8));
    if(type==='IDAT'&&insertIndex<0)insertIndex=oldChunks.length;
    // Compare just the fixed keyword prefix; never scan a potentially huge
    // unrelated PNG text record simply to decide whether to preserve it.
    const oldRecipe=type==='iTXt'&&size>recipeKeywordBytes.length&&
      recipeKeywordBytes.every((value,i)=>bytes[offset+8+i]===value)&&
      bytes[offset+8+recipeKeywordBytes.length]===0;
    if(!(options.recipe!==undefined&&oldRecipe))
      oldChunks.push(bytes.subarray(offset,end));
    offset=end;
    if(type==='IEND')break;
  }
  if(insertIndex<0)throw Error('PNG has no image data');
  const parts=[bytes.subarray(0,8),...oldChunks.slice(0,insertIndex),
    ...chunks,...oldChunks.slice(insertIndex)];
  // Preserve trailing bytes exactly; ancillary replacement must never
  // accidentally rewrite opaque image data or container extensions.
  if(offset<bytes.length)parts.push(bytes.subarray(offset));
  const total=parts.reduce((n,part)=>n+part.length,0);
  const result=new Uint8Array(total);
  let cursor=0;
  for(const part of parts){result.set(part,cursor);cursor+=part.length;}
  return result;
}

// Reads a PNG recipe without decoding or altering its potentially huge IDAT.
// Only our explicit iTXt keyword is accepted; freeform comments are ignored.
// This can be used on exported images even when optional EXIF was left blank.
export function extractPngRecipe(input){
  const bytes=input instanceof Uint8Array?input:new Uint8Array(input);
  if(bytes.length<20||!PNG_SIGNATURE.every((v,i)=>bytes[i]===v))throw Error('Input is not a PNG');
  const decoder=new TextDecoder('utf-8',{fatal:true});
  let offset=8,latestRecipe=null;
  while(offset+12<=bytes.length){
    const size=u32(bytes,offset);
    if(size>bytes.length-offset-12)throw Error('Damaged PNG chunk');
    const type=String.fromCharCode(...bytes.subarray(offset+4,offset+8));
    if(type==='iTXt'){
      // Peek at a fixed-size keyword before touching potentially enormous
      // unrelated ancillary data. An explicit recipe must never be silently
      // treated as absent merely because it exceeds the supported bound.
      const targeted=size>recipeKeywordBytes.length &&
        recipeKeywordBytes.every((value,i)=>bytes[offset+8+i]===value) &&
        bytes[offset+8+recipeKeywordBytes.length]===0;
      if(targeted){
        if(size>MAX_RECIPE_ITXT_BYTES)
          throw Error('PNG recipe metadata exceeds 1 MB import limit');
        const data=bytes.subarray(offset+8,offset+8+size);
        const end=data.indexOf(0);
        if(end+5>data.length||data[end+1]!==0||data[end+2]!==0||
           data[end+3]!==0||data[end+4]!==0)throw Error('Unsupported recipe metadata encoding');
        const stored=u32(bytes,offset+8+size);
        if(stored!==crc(bytes.subarray(offset+4,offset+8+size)))throw Error('Damaged recipe metadata checksum');
        let envelope;
        try{envelope=JSON.parse(decoder.decode(data.subarray(end+5)));}
        catch{throw Error('Damaged recipe metadata');}
        if(![RECIPE_FORMAT,'roygbiv-recipe-v1'].includes(envelope?.format)||typeof envelope.recipe!=='object'||
           !envelope.recipe||Array.isArray(envelope.recipe))throw Error('Unsupported recipe metadata version');
        // An unrelated PNG must never restore the silent default wallpaper
        // simply by claiming the correct envelope format.
        if(typeof envelope.recipe.seed!=='string'||!envelope.recipe.seed.trim()||
           (envelope.format===RECIPE_FORMAT&&
            !['paths','radial','regions'].includes(envelope.recipe.structure)))
          throw Error('Damaged recipe metadata identity');
        // A legacy writer could append a newer recipe without removing its
        // previous record. Honour the last valid record for compatibility.
        latestRecipe=normalizeRecipe(envelope.recipe);
      }
    }
    if(type==='IEND')break;
    offset+=size+12;
  }
  return latestRecipe;
}
