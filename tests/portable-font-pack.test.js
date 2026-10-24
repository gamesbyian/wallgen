import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe} from '../src/model.js';
import {hashFontBytes} from '../src/local-fonts.js';
import {FONT_PACK_FORMAT,FONT_PACK_VERSION,MAX_PACK_FILE_BYTES,
  packageFontIds,inspectPortableFontPack,importPortableFontPack,
} from '../src/portable-font-pack.js';

function synthetic(){
  const b=new Uint8Array(128);
  new DataView(b.buffer).setUint32(0,0x00010000,false);
  b.set([0x47,0x50,0x4f,0x4c,0x44,0x21],16);
  return b;
}
async function fixture(){
  const bytes=synthetic(),id=await hashFontBytes(bytes.buffer);
  const recipe=normalizeRecipe({seed:'portable',textOverlays:[
    {id:'one',text:'A portable font',font:id},
    {id:'two',text:'A bundled font',font:'pack-bangers'}]});
  const make=()=>({format:FONT_PACK_FORMAT,version:FONT_PACK_VERSION,recipe,
    fonts:[{id,name:'Private.ttf',format:'ttf',size:bytes.length,
      base64:Buffer.from(bytes).toString('base64')}]});
  return {id,recipe,make};
}
const asFile=value=>new Blob([JSON.stringify(value)],{type:'application/json'});

test('only actual local-font dependencies need private bytes, including hidden objects',async()=>{
  const {id,recipe}=await fixture();
  assert.deepEqual(packageFontIds(recipe),[id]);
  assert.deepEqual(packageFontIds({...recipe,textOverlays:[
    {text:'HIDDEN',font:id,enabled:false}]}),[id]);
  assert.deepEqual(packageFontIds({...recipe,textOverlays:[]}),[]);
});
test('valid portable design preserves exact canonical text/font identities',async()=>{
  const {id,recipe,make}=await fixture();
  const parsed=await inspectPortableFontPack(asFile(make()));
  assert.equal(parsed.fontCount,1);
  assert.equal(parsed.totalBytes,128);
  assert.equal(parsed.records[0].id,id);
  assert.equal(parsed.records[0].format,'ttf');
  assert.deepEqual(parsed.recipe,recipe);
  assert.equal(JSON.stringify(parsed.recipe).includes('Private.ttf'),false);
});
test('damaged, mismatched and extra private fonts refuse import before IndexedDB',async()=>{
  const {make}=await fixture();
  const scenarios=[
    obj=>{obj.version=2;},
    obj=>{obj.format='malicious';},
    obj=>{obj.fonts[0].id='user-'+'0'.repeat(64);},
    obj=>{obj.fonts[0].base64='AA==';},
    obj=>{obj.fonts[0].base64='@'.repeat(172);},
    obj=>{obj.fonts[0].size=22;},
    obj=>{obj.fonts[0].name='not-a-font.png';},
    obj=>{obj.fonts[0].format='otf';},
    obj=>{obj.fonts[0].base64=Buffer.alloc(128).toString('base64');},
    obj=>{obj.fonts=[];},
    obj=>{obj.fonts.push({...obj.fonts[0]});},
    obj=>{obj.recipe.textOverlays[0].font='bold';},
  ];
  for(const mutate of scenarios){
    const candidate=make();mutate(candidate);
    await assert.rejects(inspectPortableFontPack(asFile(candidate)));
  }
});
test('bad file shapes and oversized files are rejected without parsing',async()=>{
  await assert.rejects(inspectPortableFontPack(null),/Choose a portable/);
  await assert.rejects(inspectPortableFontPack(new Blob(['{}'])),/Choose a portable/);
  const huge={size:MAX_PACK_FILE_BYTES+1,text:()=>{throw Error('Should not read');}};
  await assert.rejects(inspectPortableFontPack(huge),/smaller than 18 MB/);
});
test('declined import leaves both recipe and local font library untouched',async()=>{
  const {make}=await fixture();
  let inspected=false;
  const value=await importPortableFontPack(asFile(make()),{approve:({fontCount})=>{
    assert.equal(fontCount,1);
    inspected=true;
    return false;
  }});
  assert.equal(value,null);
  assert.equal(inspected,true);
});
