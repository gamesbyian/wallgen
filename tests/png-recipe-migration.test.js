import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe} from '../src/model.js';
import {embedPngMetadata,readRawPngRecipe,extractPngRecipe,scanPngChunks,RECIPE_FORMAT}
  from '../src/png-metadata.js';
import {inspectPngMigration,migratePngMetadataOnly,validatePngMigrationContainer,archivePngRecipeRecords} from '../src/png-recipe-migration.js';
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
