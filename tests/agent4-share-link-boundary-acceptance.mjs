#!/usr/bin/env node
/**
 * Agent 4: real mobile Copy Link must not silently promise that a very long
 * encoded design URL will open on supported static hosting. Full JSON export
 * remains usable and normal share links must still copy and navigate.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
import {embedPngMetadata,serializePngRecipe} from '../src/png-metadata.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const tiny=Buffer.from(
 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/9QAAAABJRU5ErkJggg==','base64');
const ids=n=>Array.from({length:200},(_,i)=>
  'region-'+n+'-'+String(i).padStart(3,'0')+'-'+
  String(n*200+i).padStart(3,'0').repeat(30).slice(0,82));
const large=normalizeRecipe({seed:'a4-url-too-large-for-reliable-sharing',
  structure:'regions',regionMode:'nested',viewZoom:.75,
  interiorElements:Array.from({length:5},(_,n)=>({
    id:'inactive-ink-'+n,enabled:false,type:'line',shape:'wave',
    color:'custom',customColor:'#1166aa',
    placement:'contour',objectIds:ids(n)
  }))
});
const previous=normalizeRecipe({seed:'a4-share-url-normal',
  structure:'paths',geometry:'straight',viewZoom:1.14});
assert.ok(Buffer.byteLength(serializePngRecipe(large),'utf8')>65536);
const image=Buffer.from(embedPngMetadata(tiny,{}, {recipe:large}));
const out=resolve('artifacts/agent4-share-boundary');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const evidence=[],errors=[];
try{
 const context=await browser.newContext({viewport:{width:412,height:892},
   isMobile:true,hasTouch:true,acceptDownloads:true,reducedMotion:'reduce'});
 await context.grantPermissions(['clipboard-read','clipboard-write']);
 const page=await context.newPage();
 page.setDefaultTimeout(25000);
 page.on('pageerror',error=>errors.push(String(error)));
 const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
 try{
  await page.goto(origin+'/?r='+encodeRecipe(previous),
    {waitUntil:'domcontentloaded'});
  await page.locator('#mobileMore').click();
  await page.locator('#importRecipeFile').setInputFiles({
    name:'large-design.png',mimeType:'image/png',buffer:image});
  await page.waitForFunction(seed=>document.querySelector('#seedInput')
    ?.value===seed,large.seed,{timeout:30000});
  assert.deepEqual(current(),large);
  const urlSize=page.url().length;
  assert.ok(urlSize>8192,'Large share fixture does not challenge URL length');

  const sentinel='intentionally-unchanged-clipboard';
  await page.evaluate(value=>navigator.clipboard.writeText(value),sentinel);
  await page.locator('#copyLink').click();
  await page.waitForFunction(()=>document.querySelector('#studioStatus')
    ?.textContent.includes('too long to open reliably'));
  assert.match(await page.locator('#studioStatus').textContent(),
    /Save recipe JSON|Download PNG/);
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),sentinel,
    'Oversized link silently replaced clipboard despite unsupported direct navigation');
  assert.deepEqual(current(),large,'Share refusal altered the wallpaper');

  // The same source offers a lossless share artifact without requiring a
  // giant URL. Verify actual original Save recipe JSON download and reimport.
  const pending=page.waitForEvent('download');
  await page.locator('#downloadRecipe').click();
  const download=await pending;
  const bytes=await readFile(await download.path());
  assert.deepEqual(JSON.parse(bytes.toString('utf8')),large);
  await page.locator('#mobileToolsClose').click();
  await page.locator('#undo').click();
  assert.deepEqual(current(),previous);
  await page.locator('#mobileMore').click();
  await page.locator('#importRecipeFile').setInputFiles({
    name:download.suggestedFilename(),mimeType:'application/json',buffer:bytes});
  await page.waitForFunction(seed=>document.querySelector('#seedInput')
    ?.value===seed,large.seed,{timeout:30000});
  assert.deepEqual(current(),large,'JSON sharing fallback lost hidden fields');
  await page.locator('#mobileToolsClose').click();
  await page.locator('#undo').click();
  assert.deepEqual(current(),previous);

  await page.locator('#mobileMore').click();
  await page.locator('#copyLink').click();
  await page.waitForFunction(()=>document.querySelector('#studioStatus')
    ?.textContent==='Copied to clipboard.');
  const copied=await page.evaluate(()=>navigator.clipboard.readText());
  assert.equal(copied,page.url(),'Normal-sized link changed during copying');
  const opened=await context.newPage();
  try{
   await opened.goto(copied,{waitUntil:'domcontentloaded'});
   assert.deepEqual(decodeRecipe(new URL(opened.url()).searchParams.get('r')),
     previous,'Normal copied share URL does not restore original design');
  }finally{await opened.close();}
  const row={largeUrlChars:urlSize,rejectedOverlongLink:true,
    clipboardPreserved:true,downloadedAndReimportedJSON:true,
    normalCopiedLinkNavigated:true};
  evidence.push(row);
  console.log('AGENT4_SHARE_BOUNDARY_PASS',JSON.stringify(row));
 }catch(error){
  errors.push({message:String(error).slice(0,1000),
    stack:String(error.stack||'').slice(0,1500)});
  await page.screenshot({path:join(out,'failure.png'),
    animations:'disabled'}).catch(()=>{});
 }finally{await context.close();}
 await writeFile(join(out,'evidence.json'),JSON.stringify({evidence,errors,
   boundaries:['conservative 8192-character guard for static hosts',
     'not a universal browser maximum','native OS clipboard/device unverified']},null,2));
 assert.deepEqual(errors,[],'Live large URL copy/fallback acceptance failed');
}finally{await browser.close();}
