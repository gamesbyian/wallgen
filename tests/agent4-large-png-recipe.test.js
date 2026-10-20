import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
import {embedPngMetadata,extractPngRecipe,serializePngRecipe,RECIPE_KEYWORD}
  from '../src/png-metadata.js';

const png=Uint8Array.from(Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/9QAAAABJRU5ErkJggg==','base64'));
const makeIds=(element)=>Array.from({length:200},(_,i)=>
  'region-'+element+'-'+String(i).padStart(3,'0')+'-'+
  String(element*200+i).padStart(3,'0').repeat(30).slice(0,82));
export function largeValidRecipe(count=5){
  return normalizeRecipe({seed:'agent4-large-embedded-recipe',structure:'regions',
    regionMode:'nested',regionCount:21,viewZoom:.75,viewPanX:-6.5,
    lockedSettings:['regionMode','viewZoom','interiorElements'],
    interiorElements:Array.from({length:count},(_,i)=>({
      id:'ink-'+i,enabled:false,type:'line',placement:'contour',
      shape:'wave',color:'custom',customColor:'#44aabb',
      objectIds:makeIds(i),colorSlots:[0,3,6],frequency:7,phase:25
    }))
  });
}
function u32(bytes,at){return new DataView(bytes.buffer,bytes.byteOffset+at,4).getUint32(0);}
function chunks(bytes){
  const out=[];
  for(let at=8;at+12<=bytes.length;){
    const size=u32(bytes,at),type=Buffer.from(bytes.subarray(at+4,at+8)).toString('ascii');
    assert.ok(size<=bytes.length-at-12,'PNG chunk out of bounds');
    out.push({type,size,offset:at,data:bytes.subarray(at+8,at+8+size)});
    at+=size+12;
    if(type==='IEND')break;
  }
  return out;
}
function chunk(type,data){
  const encoded=Buffer.from(type,'ascii'),out=Buffer.alloc(data.length+12);
  out.writeUInt32BE(data.length,0);encoded.copy(out,4);data.copy(out,8);
  let checksum=0xffffffff;
  for(const b of out.subarray(4,out.length-4)){
    checksum^=b;
    for(let bit=0;bit<8;bit++)
      checksum=(checksum&1)?(0xedb88320^(checksum>>>1)):(checksum>>>1);
  }
  out.writeUInt32BE((checksum^0xffffffff)>>>0,out.length-4);
  return out;
}
const insertBeforeIDAT=(original,raw)=>{
  const start=chunks(original).find(c=>c.type==='IDAT').offset;
  return Buffer.concat([Buffer.from(original.subarray(0,start)),raw,
    Buffer.from(original.subarray(start))]);
};

test('PNG exports with canonical recipe above 64 KiB remain fully importable',()=>{
  const original=largeValidRecipe();
  const serialized=serializePngRecipe(original);
  const bytes=Buffer.byteLength(serialized,'utf8');
  assert.ok(bytes>65536&&bytes<1024*1024,'Fixture must cross 64 KiB old-reader boundary');
  assert.deepEqual(decodeRecipe(encodeRecipe(original)),original);
  const image=embedPngMetadata(png,{creator:'Agent4 Unicode 🌈'},{recipe:original});
  const recipeChunk=chunks(image).find(c=>c.type==='iTXt'&&
    Buffer.from(c.data.subarray(0,c.data.indexOf(0))).toString()===RECIPE_KEYWORD);
  assert.ok(recipeChunk,'Export lacks dedicated recipe iTXt');
  assert.ok(recipeChunk.size>65536,'Exported iTXt did not cross 64 KiB');
  assert.deepEqual(extractPngRecipe(image),original,
    'PNG reader silently ignored exporter-written valid oversized recipe');
  assert.deepEqual(chunks(image).filter(c=>c.type==='IDAT').map(c=>[...c.data]),
    chunks(png).filter(c=>c.type==='IDAT').map(c=>[...c.data]));
  console.log('AGENT4_LARGE_PNG_RECIPE',JSON.stringify({
    serializedBytes:bytes,embeddedChunkBytes:recipeChunk.size,
    count:original.interiorElements.length,objectIds:original.interiorElements
      .reduce((n,item)=>n+item.objectIds.length,0)}));
});

test('too-large named recipe reports explicit bounded error; huge foreign iTXt is skipped',()=>{
  const named=Buffer.concat([
    Buffer.from(RECIPE_KEYWORD+'\0\0\0\0\0','utf8'),
    Buffer.alloc(1024*1024+1,0x61)
  ]);
  const invalid=insertBeforeIDAT(png,chunk('iTXt',named));
  assert.throws(()=>extractPngRecipe(invalid),/recipe metadata.*limit|recipe.*too large/i,
    'A targeted oversized recipe must not silently resemble an unrelated PNG');
  const foreign=Buffer.concat([Buffer.from('Unrelated large keyword\0\0\0\0\0'),
    Buffer.alloc(1024*1024+1,0x42)]);
  const unrelated=insertBeforeIDAT(png,chunk('iTXt',foreign));
  assert.equal(extractPngRecipe(unrelated),null,
    'Large unrelated ancillary records should not be interpreted as recipes');
});
