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
    chunks.push({type:Buffer.from(bytes.subarray(at+4,at+8)).toString('ascii'),
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
    Buffer.from(c.data).toString('utf8').startsWith('ROYGBIV Recipe\\0'));
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
