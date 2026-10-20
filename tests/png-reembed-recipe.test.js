import test from 'node:test';
import assert from 'node:assert/strict';
import {embedPngMetadata,extractPngRecipe} from '../src/png-metadata.js';
import {normalizeRecipe} from '../src/model.js';

// One-pixel valid PNG; ancillary recipe writes must never alter the image bytes.
const source=Uint8Array.from(Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9JYHkAAAAASUVORK5CYII=',
  'base64'
));
const pngChunks=bytes=>{
  const chunks=[];
  for(let at=8;at+12<=bytes.length;){
    const size=new DataView(bytes.buffer,bytes.byteOffset+at).getUint32(0);
    const end=at+12+size;
    assert.ok(end<=bytes.length,'PNG chunk remains in bounds');
    chunks.push({offset:at,end,type:Buffer.from(bytes.subarray(at+4,at+8)).toString('ascii'),
      data:bytes.subarray(at+8,at+8+size),raw:bytes.subarray(at,end)});
    at=end;
  }
  return chunks;
};
const idat=bytes=>Buffer.concat(pngChunks(bytes).filter(c=>c.type==='IDAT').map(c=>Buffer.from(c.raw)));

test('re-embedding an existing PNG replaces stale recipe while preserving raster',()=>{
  const first=normalizeRecipe({seed:'before-replacement',structure:'paths',
    geometry:'loops',viewZoom:.7,viewPanX:12});
  const second=normalizeRecipe({seed:'after-replacement',structure:'regions',
    regionMode:'nested',viewZoom:1.3,viewPanY:-8});
  const initial=embedPngMetadata(source,{title:'first'},{recipe:first});
  assert.deepEqual(extractPngRecipe(initial),first);
  const again=embedPngMetadata(initial,{description:'re-exported'},{recipe:second});
  assert.deepEqual(extractPngRecipe(again),second);
  assert.deepEqual(idat(again),idat(source),'IDAT remains byte-identical');
  const recipeChunks=pngChunks(again).filter(c=>c.type==='iTXt'&&
    Buffer.from(c.data.subarray(0,c.data.indexOf(0))).toString('utf8')==='ROYGBIV Recipe');
  assert.equal(recipeChunks.length,1,'only the latest recipe is embedded');
  assert.equal(new DataView(again.buffer,again.byteOffset+16).getUint32(0),1);
  assert.equal(new DataView(again.buffer,again.byteOffset+20).getUint32(0),1);
});

test('repeated export keeps the last recipe across all three scene structures',()=>{
  let png=source;
  for(const recipe of [
    {seed:'ribbon',structure:'paths',geometry:'hairpin'},
    {seed:'burst',structure:'radial',radialMode:'pinwheel'},
    {seed:'cells',structure:'regions',regionMode:'voronoi'}
  ]){
    png=embedPngMetadata(png,{}, {recipe});
    assert.deepEqual(extractPngRecipe(png),normalizeRecipe(recipe));
  }
  assert.deepEqual(idat(png),idat(source));
});

const insertBefore=(png,type,raw)=>{
  const at=pngChunks(png).find(chunk=>chunk.type===type)?.offset;
  assert.ok(at>=8,'expected PNG '+type+' insertion point');
  const out=new Uint8Array(png.length+raw.length);
  out.set(png.subarray(0,at));
  out.set(raw,at);
  out.set(png.subarray(at),at+raw.length);
  return out;
};
const isRecipeChunk=chunk=>chunk.type==='iTXt'&&
  Buffer.from(chunk.data.subarray(0,chunk.data.indexOf(0)))
    .toString('utf8')==='ROYGBIV Recipe';
const embeddedRecipeChunk=recipe=>pngChunks(
  embedPngMetadata(source,{}, {recipe})
).find(isRecipeChunk).raw;

test('old duplicate-recipes restore the LAST valid design, before and after IDAT',()=>{
  const old={seed:'legacy-original',structure:'paths',geometry:'straight'};
  const newer={seed:'legacy-latest',structure:'radial',radialMode:'concentric'};
  const reexport={seed:'after-cleanup',structure:'regions',regionMode:'nested'};
  const initial=embedPngMetadata(source,{}, {recipe:old});
  const later=embeddedRecipeChunk(newer);
  for(const insertion of ['IDAT','IEND']){
    const legacy=insertBefore(initial,insertion,later);
    assert.equal(pngChunks(legacy).filter(isRecipeChunk).length,2);
    assert.deepEqual(extractPngRecipe(legacy),normalizeRecipe(newer),
      insertion+' legacy duplicate should restore the most recent design');
    const cleaned=embedPngMetadata(legacy,{title:'re-exported'}, {recipe:reexport});
    assert.equal(pngChunks(cleaned).filter(isRecipeChunk).length,1,
      're-export should deduplicate recipe chunks anywhere in PNG');
    assert.deepEqual(extractPngRecipe(cleaned),normalizeRecipe(reexport));
    assert.deepEqual(idat(cleaned),idat(source));
  }
});

function makeChunk(type,data){
  const head=Buffer.alloc(8);
  head.writeUInt32BE(data.length,0);head.write(type,4,'ascii');
  const content=Buffer.concat([head.subarray(4),data]);
  let checksum=0xffffffff;
  for(const byte of content){
    checksum^=byte;
    for(let bit=0;bit<8;bit++)
      checksum=(checksum&1)?(0xedb88320^(checksum>>>1)):(checksum>>>1);
  }
  const trailer=Buffer.alloc(4);trailer.writeUInt32BE((checksum^0xffffffff)>>>0);
  return Buffer.concat([head,data,trailer]);
}
const forgedRecipePng=(envelope)=>{
  const body=Buffer.concat([Buffer.from('ROYGBIV Recipe\\0','utf8'),
    Buffer.alloc(4),Buffer.from(JSON.stringify(envelope),'utf8')]);
  return insertBefore(source,'IDAT',makeChunk('iTXt',body));
};

test('malformed but checksummed recipe envelopes cannot silently reset the design',()=>{
  for(const recipe of [{},{seed:''},{seed:'valid',structure:'alien'}]){
    const png=forgedRecipePng({format:'roygbiv-recipe-v2',recipe});
    assert.throws(()=>extractPngRecipe(png),/Damaged recipe metadata identity/);
  }
  const v1=forgedRecipePng({format:'roygbiv-recipe-v1',
    recipe:{seed:'historical-seed',geometry:'straight'}});
  assert.deepEqual(extractPngRecipe(v1),normalizeRecipe({
    seed:'historical-seed',geometry:'straight'
  }),'legacy v1 files without the new structure must remain supported');
});
