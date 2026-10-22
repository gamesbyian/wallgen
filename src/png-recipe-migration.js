import {normalizeRecipe} from './model.js';
import {embedPngMetadata,extractPngRecipe,readRawPngRecipe,scanPngChunks,
  isRecipePngChunk,RECIPE_FORMAT} from './png-metadata.js';

// Version names are scoped to PNG envelopes. Compressed share-v1 and local
// favourites use different transports and must never be inferred from these.
export const PNG_MIGRATION_VERSION=1;

// A valid recipe checksum does not establish that the *image* is a valid PNG.
// For a no-render archival rewrite, reject damaged opaque chunks rather than
// preserving them under a misleading newly valid recipe envelope. Stream CRC
// over existing chunk views: no IDAT decompression, canvas or pixel allocation.
const pngCrcTable=Uint32Array.from({length:256},(_,index)=>{
  let value=index;
  for(let i=0;i<8;i++)value=(value&1)?(0xedb88320^(value>>>1)):(value>>>1);
  return value>>>0;
});
function pngCrc(bytes){
  let value=0xffffffff;
  for(let i=0;i<bytes.length;i++)
    value=pngCrcTable[(value^bytes[i])&255]^(value>>>8);
  return (value^0xffffffff)>>>0;
}
function uint32(bytes,offset){
  return (bytes[offset]*0x1000000+(bytes[offset+1]<<16)+
    (bytes[offset+2]<<8)+bytes[offset+3])>>>0;
}
export function validatePngMigrationContainer(input){
  const scan=scanPngChunks(input);
  if(scan.width<1||scan.height<1||scan.width>0x7fffffff||scan.height>0x7fffffff)
    throw Error('Invalid PNG image dimensions');
  const ihdr=scan.chunks[0].data;
  const allowedDepth={0:[1,2,4,8,16],2:[8,16],3:[1,2,4,8],4:[8,16],6:[8,16]};
  const depth=ihdr[8],color=ihdr[9];
  if(!allowedDepth[color]?.includes(depth)||ihdr[10]!==0||ihdr[11]!==0||
    ![0,1].includes(ihdr[12]))
    throw Error('Unsupported or damaged PNG image header');
  let palette=false,seenIdat=false,finishedIdat=false;
  for(const [index,item] of scan.chunks.entries()){
    const raw=item.raw;
    if(uint32(raw,raw.length-4)!==pngCrc(raw.subarray(4,raw.length-4)))
      throw Error('Damaged PNG '+item.type+' checksum');
    if(item.type==='IHDR'&&index!==0)throw Error('Duplicate PNG image header');
    if(item.type==='PLTE'){
      if(palette||seenIdat||item.size===0||item.size%3!==0||item.size>768)
        throw Error('Invalid PNG palette order or length');
      palette=true;
    }
    if(item.type==='IDAT'){
      if(finishedIdat)throw Error('Non-contiguous PNG image data');
      seenIdat=true;
    }else if(seenIdat)finishedIdat=true;
    if(item.type==='IEND'&&item.size!==0)throw Error('Invalid PNG image end');
    // Unknown critical PNG chunks require an unsupported image decoder.
    if(item.type[0]===item.type[0].toUpperCase()&&
      !['IHDR','PLTE','IDAT','IEND'].includes(item.type))
      throw Error('Unsupported critical PNG chunk: '+item.type);
  }
  if(color===3&&!palette)throw Error('Indexed PNG lacks required palette');
  if([0,4].includes(color)&&palette)throw Error('Grayscale PNG cannot contain a palette');
  return {validatedPngChunks:scan.chunks.length,validatedPngCrc:true};
}
const isPollutionKey=key=>['__proto__','prototype','constructor'].includes(key);
const jsonSame=(left,right)=>JSON.stringify(left)===JSON.stringify(right);
function findDangerousKeys(value,path='$',depth=0,seen={count:0}){
  if(depth>32||++seen.count>300000)throw Error('Recipe inspection complexity limit exceeded');
  if(!value||typeof value!=='object')return [];
  const warnings=[];
  for(const [key,child] of Object.entries(value)){
    if(isPollutionKey(key))warnings.push(path+'.'+key);
    else warnings.push(...findDangerousKeys(child,path+'.'+key,depth+1,seen));
  }
  return warnings;
}
function compareOpaqueChunks(source,target){
  const original=scanPngChunks(source),updated=scanPngChunks(target);
  validatePngMigrationContainer(target);
  const withoutRecipe=scan=>scan.chunks.filter(chunk=>!isRecipePngChunk(chunk));
  const left=withoutRecipe(original),right=withoutRecipe(updated);
  if(left.length!==right.length)throw Error('PNG rewrite changed non-recipe chunk count');
  for(let i=0;i<left.length;i++){
    const a=left[i].raw,b=right[i].raw;
    if(a.length!==b.length||left[i].type!==right[i].type)
      throw Error('PNG rewrite changed non-recipe chunk identity');
    for(let j=0;j<a.length;j++)if(a[j]!==b[j])
      throw Error('PNG rewrite changed non-recipe chunk bytes');
  }
  const a=original.afterIend,b=updated.afterIend;
  if(a.length!==b.length||a.some((byte,i)=>byte!==b[i]))
    throw Error('PNG rewrite changed trailing bytes');
  const records=updated.chunks.filter(isRecipePngChunk);
  if(records.length!==1)throw Error('PNG rewrite must contain exactly one recipe');
  if(original.width!==updated.width||original.height!==updated.height)
    throw Error('PNG rewrite changed image dimensions');
  return {preservedChunks:left.length,preservedImageBytes:true,
    originalRecipeChunks:original.chunks.filter(isRecipePngChunk).length,
    outputRecipeChunks:records.length};
}
export function inspectPngMigration(input){
  const container=validatePngMigrationContainer(input);
  const raw=readRawPngRecipe(input);
  const report={
    migrationVersion:PNG_MIGRATION_VERSION,...container,
    width:raw.width,height:raw.height,recordCount:raw.records.length,
    detectedFormat:raw.selected?.format||null,
    selectedChunkIndex:raw.selected?.chunkIndex??null,
    safe:false,reason:null,unknownKeys:[],coercedKeys:[],synthesizedKeys:[],
    recordFormats:raw.records.map(record=>record.format),
    warnings:[],
  };
  if(!raw.selected){report.reason='PNG contains no ROYGBIV Recipe record';return report;}
  const {format,rawRecipe}=raw.selected;
  if(![RECIPE_FORMAT,'roygbiv-recipe-v1'].includes(format)){
    report.reason='Unsupported PNG recipe dialect; preserve original';return report;
  }
  if(typeof rawRecipe.seed!=='string'||!rawRecipe.seed.trim()||
    (format===RECIPE_FORMAT&&!['paths','radial','regions'].includes(rawRecipe.structure))){
    report.reason='Damaged recipe identity';return report;
  }
  if(format!=='roygbiv-recipe-v2'){
    report.reason='Historical v1 defaults and field semantics are not yet verified';
    report.warnings.push('Raw recipe is readable; no unverified conversion was attempted');
    return report;
  }
  const polluted=findDangerousKeys(rawRecipe);
  if(polluted.length){
    report.reason='Unsafe object keys in original recipe';
    report.warnings.push('Disallowed keys: '+polluted.slice(0,8).join(', '));
    return report;
  }
  const normalized=normalizeRecipe(rawRecipe);
  const keys=new Set(Object.keys(normalized));
  // Accepted opt-in extension keys have a legitimate empty/absent default.
  for(const key of ['photoLook','surfaceTreatments','scatteredOverrides'])
    keys.add(key);
  report.unknownKeys=Object.keys(rawRecipe).filter(key=>!keys.has(key));
  report.coercedKeys=Object.keys(rawRecipe).filter(key=>
    keys.has(key)&&!jsonSame(rawRecipe[key],normalized[key]));
  report.synthesizedKeys=Object.keys(normalized).filter(key=>
    !Object.hasOwn(rawRecipe,key));
  if(report.unknownKeys.length||report.coercedKeys.length||
      report.synthesizedKeys.length){
    report.reason='Migration would discard, coerce or synthesize original fields';
    report.warnings.push('Original image can remain intact even when historical recipe semantics cannot be proven');
    return report;
  }
  report.safe=true;
  report.warnings.push('Opening this saved recipe in a newer generator may produce a different picture');
  return report;
}
export function migratePngMetadataOnly(input){
  const bytes=input instanceof Uint8Array?input:new Uint8Array(input);
  const report=inspectPngMigration(bytes);
  if(!report.safe)throw Object.assign(Error(report.reason),{report});
  const original=readRawPngRecipe(bytes);
  const normalized=normalizeRecipe(original.selected.rawRecipe);
  const result=embedPngMetadata(bytes,{},{
    recipe:normalized,output:{width:report.width,height:report.height},
  });
  const verification=compareOpaqueChunks(bytes,result);
  if(!jsonSame(extractPngRecipe(result),normalized))
    throw Error('Migrated PNG did not restore the complete canonical recipe');
  const updated=readRawPngRecipe(result);
  if(updated.selected.envelope.output.width!==report.width||
    updated.selected.envelope.output.height!==report.height)
    throw Error('Migrated metadata misreported historical raster dimensions');
  return {png:result,report:{...report,...verification}};
}
