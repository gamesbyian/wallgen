import test from 'node:test';
import assert from 'node:assert/strict';
import {embedPngMetadata,extractPngRecipe,serializePngRecipe,RECIPE_KEYWORD,cleanMetadata} from '../src/png-metadata.js';
import {normalizeRecipe,resolveScene} from '../src/model.js';

const tiny=Uint8Array.from(Buffer.from(
 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/9QAAAABJRU5ErkJggg==','base64'));
const decode=(b)=>new TextDecoder().decode(b);
function chunks(bytes){
  let at=8;const out=[];
  while(at+12<=bytes.length){
    const n=new DataView(bytes.buffer,bytes.byteOffset+at,4).getUint32(0);
    const type=decode(bytes.subarray(at+4,at+8));
    const data=bytes.subarray(at+8,at+8+n);
    out.push({type,data});
    at+=12+n;
    if(type==='IEND')break;
  }
  return out;
}
function crc(data){
  let value=0xffffffff;
  for(const b of data){value^=b;for(let i=0;i<8;i++)value=value&1?0xedb88320^(value>>>1):value>>>1;}
  return (value^0xffffffff)>>>0;
}
test('real PNG preserves pixels while carrying Unicode international metadata',()=>{
  const result=embedPngMetadata(tiny,{title:'Rainbow 🌈',creator:'Ian',keywords:'art, prism',
    software:'Wallgen · Made with ChatGPT',description:'Seven colours on black'});
  const original=chunks(tiny),actual=chunks(result);
  assert.deepEqual(actual.filter(x=>['IHDR','IDAT','IEND'].includes(x.type)).map(x=>[x.type,[...x.data]]),
    original.map(x=>[x.type,[...x.data]]));
  assert.ok(actual.some(x=>x.type==='iTXt' && decode(x.data).includes('Rainbow 🌈')));
  assert.ok(actual.some(x=>x.type==='eXIf' && decode(x.data).includes('Ian')));
  for(let at=8;at<result.length;){
    const dv=new DataView(result.buffer,result.byteOffset+at,4),n=dv.getUint32(0);
    const type=decode(result.subarray(at+4,at+8));
    if(type==='iTXt'||type==='eXIf'){
      const storedCrc=new DataView(result.buffer,result.byteOffset+at+n+8,4).getUint32(0);
      assert.equal(storedCrc,crc(result.subarray(at+4,at+n+8)));
    }
    at+=n+12;
  }
});
test('empty metadata leaves original file intact',()=>{
  assert.deepEqual(embedPngMetadata(tiny,{}),tiny);
  assert.deepEqual(cleanMetadata({creator:' ',title:'  test  ',junk:'hello'}),{title:'test'});
});
test('malformed non-PNG input is rejected',()=>{
  assert.throws(()=>embedPngMetadata(new Uint8Array([1,2,3]),{title:'x'}),/not a PNG/);
});

test('saved PNG always embeds regenerable, lossless normalized recipe even with empty optional metadata',()=>{
  const input=normalizeRecipe({
    seed:'persist-regenerate-🌈',family:'signal',orientation:'diagonal',
    diagonalRotation:-73,reverseStripes:true,mirrorHorizontal:true,mirrorVertical:false,
    palette:'pastel',motif:'hatch',textureLayer2Enabled:true,material2:'felt',
    textureRotation2:29,positionX:8,positionY:-12,
    lockedSettings:['orientation','reverseStripes','mirrorHorizontal','position'],
    primesOnly:true,
  });
  const result=embedPngMetadata(tiny,{}, {recipe:input});
  const recipeChunk=chunks(result).find(c=>c.type==='iTXt'&&decode(c.data).includes(RECIPE_KEYWORD));
  assert.ok(recipeChunk,'R.O.Y.G.B.I.V. recipe is a dedicated PNG iTXt field');
  assert.deepEqual(extractPngRecipe(result),input);
  assert.deepEqual(resolveScene(extractPngRecipe(result)),resolveScene(input));
  assert.deepEqual(chunks(result).filter(x=>['IHDR','IDAT','IEND'].includes(x.type))
    .map(x=>[x.type,[...x.data]]),chunks(tiny).map(x=>[x.type,[...x.data]]));
  const envelope=JSON.parse(serializePngRecipe(input));
  assert.equal(envelope.format,'roygbiv-recipe-v2');
  assert.deepEqual(envelope.output,{width:3024,height:6552});
});
test('recipe reader rejects corrupted chunks and distinguishes old PNGs without a recipe',()=>{
  assert.equal(extractPngRecipe(tiny),null);
  const data=embedPngMetadata(tiny,{title:'test'},{recipe:{seed:'recover-me'}});
  const corrupted=new Uint8Array(data);
  const raw=Buffer.from(corrupted);
  const index=raw.indexOf(Buffer.from('recover-me'));
  assert.ok(index>0);
  corrupted[index]=corrupted[index]^1;
  assert.throws(()=>extractPngRecipe(corrupted),/checksum/);
  assert.throws(()=>extractPngRecipe(new Uint8Array([3,1,4])),/not a PNG/);
});
