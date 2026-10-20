#!/usr/bin/env node
/** Actual 412x892 Chrome original PNG input at the old 64 KiB iTXt boundary. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
import {embedPngMetadata,serializePngRecipe} from '../src/png-metadata.js';

const tiny=Buffer.from(
 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/9QAAAABJRU5ErkJggg==','base64');
const ids=n=>Array.from({length:200},(_,i)=>
  'region-'+n+'-'+String(i).padStart(3,'0')+'-'+
  String(n*200+i).padStart(3,'0').repeat(30).slice(0,82));
const recipe=normalizeRecipe({
  seed:'a4-browser-large-recipe',structure:'regions',regionMode:'nested',
  regionCount:21,viewZoom:.75,viewPanY:-10,lockedSettings:['regionMode'],
  interiorElements:Array.from({length:5},(_,n)=>({
    id:'disabled-ink-'+n,enabled:false,type:'line',placement:'contour',
    shape:'wave',color:'custom',customColor:'#45bbac',
    objectIds:ids(n),colorSlots:[1,5],frequency:6,phase:25
  }))
});
const serializedBytes=Buffer.byteLength(serializePngRecipe(recipe),'utf8');
assert.ok(serializedBytes>65536&&serializedBytes<1024*1024);
const nativeFile=Buffer.from(embedPngMetadata(tiny,{creator:'Large recipe acceptance'},
  {recipe}));
const before=normalizeRecipe({seed:'before-large-import',structure:'paths',
  geometry:'wave',viewZoom:1.25,viewPanX:17});
const out=resolve('artifacts/agent4-large-import');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const evidence=[],errors=[];
try{
 const context=await browser.newContext({viewport:{width:412,height:892},
   isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const page=await context.newPage();
 page.setDefaultTimeout(20000);
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto((process.env.ROYGBIV_URL||'http://127.0.0.1:4173')+
    '/?r='+encodeRecipe(before),{waitUntil:'domcontentloaded'});
  await page.locator('#mobileMore').click();
  await page.locator('#importRecipeFile').setInputFiles({
    name:'large-recipe-from-original-export.png',mimeType:'image/png',
    buffer:nativeFile
  });
  await page.waitForFunction(seed=>document.querySelector('#seedInput')?.value===seed,
    recipe.seed,{timeout:30000});
  const current=decodeRecipe(new URL(page.url()).searchParams.get('r'));
  assert.deepEqual(current,recipe,'Original file input lost oversized-but-valid PNG fields');
  assert.match(await page.locator('#studioStatus').textContent(),
    /Restored original wallpaper settings from PNG recipe/);
  await page.locator('#mobileToolsClose').click();
  await page.locator('#undo').click();
  assert.deepEqual(decodeRecipe(new URL(page.url()).searchParams.get('r')),
    before,'Large metadata import erased previous Undo checkpoint');

  // Rejected oversized metadata must not mutate artwork or history, and the
  // exact same original input should accept a later valid file immediately.
  const payload=Buffer.concat([Buffer.from('ROYGBIV Recipe\0\0\0\0\0'),
    Buffer.alloc(1024*1024+1,0x61)]);
  const rawChunk=Buffer.alloc(payload.length+12);
  rawChunk.writeUInt32BE(payload.length,0);
  rawChunk.write('iTXt',4,4,'ascii');
  payload.copy(rawChunk,8);
  let crc=0xffffffff;
  for(const byte of rawChunk.subarray(4,rawChunk.length-4)){
    crc^=byte;
    for(let bit=0;bit<8;bit++)
      crc=crc&1?0xedb88320^(crc>>>1):crc>>>1;
  }
  rawChunk.writeUInt32BE((crc^0xffffffff)>>>0,rawChunk.length-4);
  let idat=8;
  while(idat+12<=tiny.length){
    if(tiny.toString('ascii',idat+4,idat+8)==='IDAT')break;
    idat+=tiny.readUInt32BE(idat)+12;
  }
  assert.ok(idat<tiny.length);
  const malformed=Buffer.concat([tiny.subarray(0,idat),rawChunk,
    tiny.subarray(idat)]);
  await page.locator('#mobileMore').click();
  await page.locator('#importRecipeFile').setInputFiles({
    name:'oversized-recipe.png',mimeType:'image/png',buffer:malformed
  });
  await page.waitForFunction(()=>document.querySelector('#studioStatus')
    ?.textContent.includes('PNG recipe metadata exceeds 1 MB import limit'));
  assert.deepEqual(decodeRecipe(new URL(page.url()).searchParams.get('r')),
    before,'Rejected oversize import changed canonical artwork');
  await page.locator('#importRecipeFile').setInputFiles({
    name:'restored-large-recipe.png',mimeType:'image/png',buffer:nativeFile
  });
  await page.waitForFunction(seed=>document.querySelector('#seedInput')?.value===seed,
    recipe.seed,{timeout:30000});
  assert.deepEqual(decodeRecipe(new URL(page.url()).searchParams.get('r')),recipe,
    'Same original PNG input could not recover after oversized rejection');
  await page.locator('#mobileToolsClose').click();
  await page.locator('#undo').click();
  assert.deepEqual(decodeRecipe(new URL(page.url()).searchParams.get('r')),before,
    'Rejected import created a phantom Undo checkpoint');
  const observation={serializedBytes,sourceInteriorElements:5,
    sourceObjectIds:1000,originalFileInput:true,exactRestore:true,
    undoRestoresPrevious:true,oversizedRejectedWithoutMutation:true,
    sameInputRecovery:true};
  evidence.push(observation);
  console.log('AGENT4_LARGE_RECIPE_BROWSER_PASS',JSON.stringify(observation));
 }catch(error){
  errors.push({message:String(error),stack:error.stack});
  await page.screenshot({path:join(out,'failure.png'),
    animations:'disabled'}).catch(()=>{});
 }finally{await context.close();}
 await writeFile(join(out,'evidence.json'),JSON.stringify({evidence,errors,
   limitations:['not Android OS file picker','not all PNG metadata producers',
     'fixture uses existing real 1x1 PNG to isolate metadata transport']},null,2));
 assert.deepEqual(errors,[],'Actual browser large-recipe import failed');
}finally{await browser.close();}
