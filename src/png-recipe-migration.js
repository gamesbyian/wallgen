import {normalizeRecipe} from './model.js';
import {embedPngMetadata,extractPngRecipe,readRawPngRecipe,scanPngChunks,
  isRecipePngChunk,RECIPE_FORMAT} from './png-metadata.js';

// Version names are scoped to PNG envelopes. Compressed share-v1 and local
// favourites use different transports and must never be inferred from these.
export const PNG_MIGRATION_VERSION=1;
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
  const raw=readRawPngRecipe(input);
  const report={
    migrationVersion:PNG_MIGRATION_VERSION,
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
