import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {normalizeRecipe} from '../src/model.js';
import {embedPngMetadata,readRawPngRecipe,extractPngRecipe,scanPngChunks,RECIPE_FORMAT}
  from '../src/png-metadata.js';
import {inspectPngMigration,migratePngMetadataOnly,validatePngMigrationContainer,inspectPngRecipeArchive,archivePngRecipeRecords} from '../src/png-recipe-migration.js';
const tiny=Uint8Array.from(Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/mXPo5QAAAABJRU5ErkJggg==','base64'));
const same=(a,b)=>assert.equal(Buffer.compare(Buffer.from(a),Buffer.from(b)),0);
const emitted=(raw)=>embedPngMetadata(tiny,{}, {recipe:raw});
const native=normalizeRecipe({seed:'archive-🌈',family:'currents',geometry:'loop',
  viewZoom:.7,viewPanX:12,positionX:-7,material:'linen',
  photoLook:{enabled:true,presetId:'film-slide',amount:69},
  surfaceTreatments:[{id:'embroider',enabled:true,target:{scope:'palette',colorSlots:[3]},pitch:6}]});

test('raw inspection reports provenance and does not normalize named recipe fields',()=>{
  const input=emitted(native),data=readRawPngRecipe(input);
  assert.equal(data.width,1);assert.equal(data.height,1);
  assert.equal(data.records.length,1);assert.equal(data.selected.format,RECIPE_FORMAT);
  assert.deepEqual(data.selected.rawRecipe,native);
  assert.equal(data.selected.envelope.output.width,3024);
  const report=inspectPngMigration(input);
  assert.equal(report.safe,true,JSON.stringify(report));
  assert.deepEqual(report.unknownKeys,[]);
  assert.deepEqual(report.coercedKeys,[]);
  assert.deepEqual(report.synthesizedKeys,[]);
});
test('migration does not rewrite IDAT, critical or unrelated ancillary metadata',()=>{
  const original=embedPngMetadata(tiny,{title:'Original 🌈',description:'do not touch',
    creator:'Painter',cameraModel:'not a real camera'},{recipe:native});
  const {png,report}=migratePngMetadataOnly(original);
  const originalScan=scanPngChunks(original),later=scanPngChunks(png);
  assert.equal(report.preservedImageBytes,true);
  assert.equal(report.originalRecipeChunks,1);
  assert.equal(report.outputRecipeChunks,1);
  assert.equal(later.width,1);assert.equal(later.height,1);
  assert.deepEqual(extractPngRecipe(png),native);
  assert.deepEqual(readRawPngRecipe(png).selected.envelope.output,
    {width:1,height:1},'report true historical IHDR, never current defaults');
  for(const type of ['IHDR','IDAT','IEND','eXIf']){
    const before=originalScan.chunks.filter(c=>c.type===type),
      after=later.chunks.filter(c=>c.type===type);
    assert.equal(before.length,after.length);
    for(let i=0;i<before.length;i++)same(before[i].raw,after[i].raw);
  }
});
test('unrecognized current fields refuse lossy migrations, keeping raw source unchanged',()=>{
  const raw={...native,unrecognizedArtistField:{photogrammetry:'unusual'}};
  // The standard exporter intentionally normalizes current input, so create
  // a checksummed named iTXt with a locally supplied raw body for this test.
  const serialized=JSON.stringify({format:RECIPE_FORMAT,recipe:raw});
  const recordData=Buffer.concat([
    Buffer.from('ROYGBIV Recipe\0\0\0\0\0','utf8'),Buffer.from(serialized)]);
  const chunk=Buffer.alloc(recordData.length+12);
  chunk.writeUInt32BE(recordData.length,0);chunk.write('iTXt',4,'ascii');recordData.copy(chunk,8);
  let crc=0xffffffff;
  for(const byte of chunk.subarray(4,chunk.length-4)){
    crc^=byte;for(let i=0;i<8;i++)crc=crc&1?0xedb88320^(crc>>>1):crc>>>1;
  }
  chunk.writeUInt32BE((crc^0xffffffff)>>>0,chunk.length-4);
  const base=emitted(native),rawRecord=readRawPngRecipe(base).selected;
  const at=rawRecord.offset,end=at+rawRecord.bytes;
  const unknown=Buffer.concat([base.subarray(0,at),chunk,base.subarray(end)]);
  const report=inspectPngMigration(unknown);
  assert.equal(report.safe,false);
  assert.deepEqual(report.unknownKeys,['unrecognizedArtistField']);
  assert.throws(()=>migratePngMetadataOnly(unknown),/discard, coerce or synthesize/);
  assert.deepEqual(readRawPngRecipe(unknown).selected.rawRecipe,raw);
});
test('historical v1, missing recipes and malformed pixels remain safe refusals',()=>{
  assert.equal(inspectPngMigration(tiny).safe,false);
  const corrupted=tiny.slice();corrupted[0]=0;
  assert.throws(()=>inspectPngMigration(corrupted),/not a PNG/);
  const raw={seed:'old-export',geometry:'straight'};
  const envelope=JSON.stringify({format:'roygbiv-recipe-v1',recipe:raw});
  const src=Buffer.concat([Buffer.from('ROYGBIV Recipe\0\0\0\0\0'),Buffer.from(envelope)]);
  const chunk=Buffer.alloc(src.length+12);chunk.writeUInt32BE(src.length);chunk.write('iTXt',4);src.copy(chunk,8);
  let crc=0xffffffff;
  for(const byte of chunk.subarray(4,chunk.length-4)){
    crc^=byte;for(let i=0;i<8;i++)crc=crc&1?0xedb88320^(crc>>>1):crc>>>1;
  }
  chunk.writeUInt32BE((crc^0xffffffff)>>>0,chunk.length-4);
  const offset=scanPngChunks(tiny).chunks.find(c=>c.type==='IDAT').offset;
  const v1=Buffer.concat([tiny.subarray(0,offset),chunk,tiny.subarray(offset)]);
  assert.deepEqual(readRawPngRecipe(v1).selected.rawRecipe,raw);
  assert.deepEqual(extractPngRecipe(v1),normalizeRecipe(raw));
  const report=inspectPngMigration(v1);
  assert.equal(report.safe,false);assert.match(report.reason,/v1 defaults/);
  const archive=archivePngRecipeRecords(v1);
  assert.equal(archive.format,'roygbiv-recipe-archive-v1');
  assert.equal(archive.recordCount,1,'refusing v1 migration must not block backup');
  const originalNamed=scanPngChunks(v1).chunks.find(c=>c.type==='iTXt');
  same(Buffer.from(archive.records[0].originalChunkBase64,'base64'),originalNamed.raw);
  assert.equal(archive.records[0].format,'roygbiv-recipe-v1');
  // The complete original iTXt chunk was already checked byte-for-byte above.
  // Do not reinterpret the PNG chunk terminator as part of its JSON text.
});
test('canonical migration is idempotent in recipe content, even when source had duplicate records',()=>{
  const first=migratePngMetadataOnly(emitted(native)).png;
  const second=migratePngMetadataOnly(first).png;
  same(first,second);
  const raw=readRawPngRecipe(first);
  assert.equal(raw.records.length,1);
  assert.equal(raw.selected.envelope.output.width,1);
});

function ancillaryChunk(type,payload){
  const data=Buffer.from(payload),result=Buffer.alloc(data.length+12);
  result.writeUInt32BE(data.length,0);
  result.write(type,4,'ascii');data.copy(result,8);
  let crc=0xffffffff;
  for(const byte of result.subarray(4,result.length-4)){
    crc^=byte;
    for(let i=0;i<8;i++)crc=crc&1?0xedb88320^(crc>>>1):crc>>>1;
  }
  result.writeUInt32BE((crc^0xffffffff)>>>0,result.length-4);
  return result;
}
function beforeIdat(image,chunk){
  const at=scanPngChunks(image).chunks.find(c=>c.type==='IDAT').offset;
  return Buffer.concat([image.subarray(0,at),chunk,image.subarray(at)]);
}
test('migration validates every PNG chunk, not only recipe text, before rewriting',()=>{
  const input=emitted(native);
  const intact=inspectPngMigration(input);
  assert.equal(intact.validatedPngCrc,true);
  assert.ok(intact.validatedPngChunks>=4);
  const idat=scanPngChunks(input).chunks.find(c=>c.type==='IDAT');
  const damagedImage=input.slice();damagedImage[idat.offset+9]^=1;
  assert.throws(()=>inspectPngMigration(damagedImage),/IDAT checksum/);
  assert.throws(()=>migratePngMetadataOnly(damagedImage),/IDAT checksum/);
  const extended=beforeIdat(input,ancillaryChunk('tEXt',Buffer.from('Comment\0untouched')));
  assert.equal(inspectPngMigration(extended).safe,true);
  const textChunk=scanPngChunks(extended).chunks.find(c=>c.type==='tEXt');
  const damagedText=Uint8Array.from(extended);
  damagedText[textChunk.offset+10]^=1;
  assert.throws(()=>inspectPngMigration(damagedText),/tEXt checksum/);
});
test('migration refuses valid-checksum unknown critical chunks and malformed chunk ordering',()=>{
  const input=emitted(native);
  const unknown=beforeIdat(input,ancillaryChunk('FAKE',Buffer.from([42])));
  assert.throws(()=>inspectPngMigration(unknown),/Unsupported critical PNG chunk: FAKE/);
  const extraIdat=ancillaryChunk('IDAT',Buffer.from([1,2,3]));
  const scan=scanPngChunks(input),iend=scan.chunks.find(c=>c.type==='IEND').offset;
  const noncontiguous=Buffer.concat([input.subarray(0,iend),
    ancillaryChunk('tEXt',Buffer.from('Comment\0gap')),extraIdat,input.subarray(iend)]);
  assert.throws(()=>validatePngMigrationContainer(noncontiguous),/Non-contiguous PNG image data/);
});

test('archival export keeps every named record verbatim and preserves PNG input',()=>{
  const input=emitted(native);
  const src=scanPngChunks(input);
  const named=src.chunks.find(c=>c.type==='iTXt');
  const before=Buffer.from(input);
  const duplicated=Buffer.concat([
    input.subarray(0,named.offset),named.raw,input.subarray(named.offset)
  ]);
  const archive=archivePngRecipeRecords(duplicated);
  assert.equal(archive.width,1);assert.equal(archive.height,1);
  assert.equal(archive.recordCount,2);
  assert.equal(archive.records.length,2);
  for(const record of archive.records)
    same(Buffer.from(record.originalChunkBase64,'base64'),named.raw);
  assert.equal(archive.selectedChunkIndex,archive.records[1].chunkIndex);
  same(duplicated,Buffer.concat([before.subarray(0,named.offset),
    named.raw,before.subarray(named.offset)]),
    'archive leaves original byte sequence untouched');
  assert.equal(JSON.parse(JSON.stringify(archive)).records.length,2);
});
test('archive exporter independently refuses damaged non-recipe PNG integrity',()=>{
  const input=emitted(native),image=scanPngChunks(input).chunks.find(c=>c.type==='IDAT');
  const corrupt=input.slice();corrupt[image.offset+9]^=2;
  assert.throws(()=>archivePngRecipeRecords(corrupt),/IDAT checksum/);
});

test('identical duplicate recipes may consolidate; conflicting history is refused and archivable',()=>{
  const current=emitted(native);
  const named=scanPngChunks(current).chunks.find(c=>c.type==='iTXt');
  const previous=emitted(normalizeRecipe({...native,seed:'different-previous-art'}));
  const olderRecord=scanPngChunks(previous).chunks.find(c=>c.type==='iTXt');
  const insert=(record)=>Buffer.concat([
    current.subarray(0,named.offset),record.raw,current.subarray(named.offset)]);
  const duplicates=insert(named);
  const consistent=inspectPngMigration(duplicates);
  assert.equal(consistent.safe,true,JSON.stringify(consistent));
  assert.deepEqual(consistent.conflictingChunkIndexes,[]);
  const collapsed=migratePngMetadataOnly(duplicates).png;
  assert.equal(readRawPngRecipe(collapsed).records.length,1);

  const conflicting=insert(olderRecord);
  const report=inspectPngMigration(conflicting);
  assert.equal(report.safe,false);
  assert.match(report.reason,/Conflicting embedded recipe records/);
  assert.equal(report.recordCount,2);
  assert.deepEqual(report.conflictingChunkIndexes,
    [readRawPngRecipe(conflicting).records[0].chunkIndex]);
  assert.throws(()=>migratePngMetadataOnly(conflicting),/Conflicting/);
  const archive=archivePngRecipeRecords(conflicting);
  assert.equal(archive.recordCount,2);
  same(Buffer.from(archive.records[0].originalChunkBase64,'base64'),olderRecord.raw);
  same(Buffer.from(archive.records[1].originalChunkBase64,'base64'),named.raw);
  assert.deepEqual(readRawPngRecipe(conflicting).selected.rawRecipe,native,
    'latest selected recipe remains unchanged despite refusing metadata replacement');
});

test('exact-byte archive survives valid-PNG malformed recipe JSON, unsupported text flags and duplicates',()=>{
  const broken=ancillaryChunk('iTXt',Buffer.concat([
    Buffer.from('ROYGBIV Recipe'),Buffer.from([0,0,0,0,0]),
    Buffer.from('{"format":"v1","recipe":{')
  ]));
  const encoded=ancillaryChunk('iTXt',Buffer.concat([
    Buffer.from('ROYGBIV Recipe'),Buffer.from([0,1,0,0,0]),
    Buffer.from('unknown-compression')
  ]));
  const source=beforeIdat(beforeIdat(tiny,broken),encoded);
  assert.throws(()=>readRawPngRecipe(source),/Unsupported recipe metadata encoding|Damaged recipe metadata/);
  assert.throws(()=>inspectPngMigration(source),/Unsupported recipe metadata encoding|Damaged recipe metadata/);
  const intact=Uint8Array.from(source);
  const info=inspectPngRecipeArchive(source);
  assert.equal(info.recordCount,2);
  assert.equal(info.validatedPngCrc,true);
  const archived=archivePngRecipeRecords(source);
  assert.equal(archived.recordCount,2);
  assert.equal(archived.records[0].format,null);
  assert.equal(archived.records[1].format,null);
  const named=scanPngChunks(source).chunks.filter(c=>c.type==='iTXt');
  for(let i=0;i<2;i++)
    same(Buffer.from(archived.records[i].originalChunkBase64,'base64'),named[i].raw);
  same(source,intact,'unparseable source must not be modified by recovery');
});
test('CLI --archive writes original bytes even when PNG metadata migration cannot parse JSON',()=>{
  const damagedText=ancillaryChunk('iTXt',Buffer.concat([
    Buffer.from('ROYGBIV Recipe'),Buffer.from([0,0,0,0,0]),
    Buffer.from('not-json')
  ]));
  const image=beforeIdat(tiny,damagedText);
  const folder=mkdtempSync(join(tmpdir(),'roygbiv-archive-test-'));
  try{
    const input=join(folder,'before.png'),out=join(folder,'recovery.json'),
      report=join(folder,'report.json'),output=join(folder,'should-not-exist.png');
    writeFileSync(input,image);
    const run=spawnSync(process.execPath,[
      new URL('../scripts/update-png-recipe.mjs',import.meta.url).pathname,
      '--in',input,'--archive',out,'--report',report,'--out',output
    ],{encoding:'utf8',timeout:15000});
    assert.equal(run.status,2,run.stderr||String(run.error));
    assert.equal(existsSync(output),false,'unsafe migration never rewrites an image');
    const backup=JSON.parse(readFileSync(out,'utf8'));
    assert.equal(backup.recordCount,1);
    same(Buffer.from(backup.records[0].originalChunkBase64,'base64'),damagedText);
    assert.match(JSON.parse(readFileSync(report,'utf8')).reason,/inspection failed/i);
    same(readFileSync(input),image);
  }finally{rmSync(folder,{recursive:true,force:true});}
});
