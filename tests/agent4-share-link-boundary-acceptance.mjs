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
import {decodePortableRecipe,portableShareTokenFromLocation} from '../src/share-recipe.js';

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

  // A versioned fragment carries a compressed canonical recipe but never
  // sends the recipe to the static server in its HTTP request line.
  const sentinel='intentionally-unchanged-clipboard';
  await page.evaluate(value=>navigator.clipboard.writeText(value),sentinel);
  await page.locator('#copyLink').click();
  await page.waitForFunction(()=>document.querySelector('#studioStatus')
    ?.textContent==='Copied to clipboard.');
  const compact=await page.evaluate(()=>navigator.clipboard.readText());
  assert.notEqual(compact,sentinel);
  assert.ok(compact.length<=8192,'Copied link is still over static-host limit');
  assert.equal(new URL(compact).searchParams.has('r'),false);
  const token=portableShareTokenFromLocation(new URL(compact));
  assert.ok(token?.startsWith('v1.'));
  assert.deepEqual(await decodePortableRecipe(token),large);
  assert.deepEqual(current(),large,'Copying compact link altered wallpaper');

  // A CLEAN browser context with no local storage proves standalone sharing.
  const clean=await browser.newContext({viewport:{width:412,height:892},
    isMobile:true,hasTouch:true,acceptDownloads:true,reducedMotion:'reduce'});
  const linked=await clean.newPage();
  try{
    await linked.goto(compact,{waitUntil:'domcontentloaded',timeout:30000});
    await linked.waitForFunction(seed=>document.querySelector('#seedInput')?.value===seed,
      large.seed,{timeout:30000});
    assert.equal(portableShareTokenFromLocation(new URL(linked.url())),token,
      'Initial render rewrote compressed URL into oversized ?r query');
    assert.equal(new URL(linked.url()).searchParams.has('r'),false);
    const loaded=await linked.evaluate(async()=>{
      const {decodePortableRecipe,portableShareTokenFromLocation}=
        await import('/src/share-recipe.js');
      return decodePortableRecipe(portableShareTokenFromLocation(location));
    });
    assert.deepEqual(loaded,large,'Clean browser compressed share lost hidden settings');
    // Compare actual application state, not merely the standalone decoder:
    // the original Save recipe JSON must download every recovered hidden field.
    await linked.locator('#mobileMore').click();
    const pendingShared=linked.waitForEvent('download');
    await linked.locator('#downloadRecipe').click();
    const actualRecipe=JSON.parse((await readFile(
      await (await pendingShared).path())).toString('utf8'));
    assert.deepEqual(actualRecipe,large,
      'App bootstrap restored only seed, not full compressed wallpaper settings');
    await linked.reload({waitUntil:'domcontentloaded'});
    await linked.waitForFunction(seed=>document.querySelector('#seedInput')?.value===seed,
      large.seed,{timeout:30000});
    assert.equal(portableShareTokenFromLocation(new URL(linked.url())),token);
    await linked.goto(origin+'/#s=v1.broken!',{waitUntil:'domcontentloaded'});
    await linked.waitForFunction(()=>document.querySelector('#studioStatus')
      ?.textContent?.includes('Cannot restore compressed design link'));
    assert.notEqual(await linked.locator('#seedInput').inputValue(),large.seed,
      'Invalid compressed share restored an unrelated saved wallpaper');
  }finally{await clean.close();}

  // A browser without CompressionStream must fail truthfully and leave its
  // clipboard unchanged, retaining the existing JSON/PNG sharing routes.
  const unsupported=await browser.newContext({viewport:{width:412,height:892},
    isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await unsupported.grantPermissions(['clipboard-read','clipboard-write']);
  await unsupported.addInitScript(()=>{
    Object.defineProperty(window,'CompressionStream',{value:undefined,configurable:true});
    Object.defineProperty(window,'DecompressionStream',{value:undefined,configurable:true});
  });
  const fallback=await unsupported.newPage();
  try{
    await fallback.goto(origin+'/?r='+encodeRecipe(previous),
      {waitUntil:'domcontentloaded'});
    await fallback.locator('#mobileMore').click();
    await fallback.locator('#importRecipeFile').setInputFiles({
      name:'large-design.png',mimeType:'image/png',buffer:image});
    await fallback.waitForFunction(seed=>document.querySelector('#seedInput')
      ?.value===seed,large.seed,{timeout:30000});
    await fallback.evaluate(value=>navigator.clipboard.writeText(value),sentinel);
    await fallback.locator('#copyLink').click();
    await fallback.waitForFunction(()=>document.querySelector('#studioStatus')
      ?.textContent?.includes('Use Save recipe JSON or Download PNG'));
    assert.equal(await fallback.evaluate(()=>navigator.clipboard.readText()),sentinel,
      'Unsupported compression silently overwrote clipboard');
  }finally{await unsupported.close();}

  // A failed History API update must not let a stale, short ?r URL
  // masquerade as the CURRENT wallpaper's share link.
  const blockedHistory=await browser.newContext({viewport:{width:412,height:892},
    isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await blockedHistory.grantPermissions(['clipboard-read','clipboard-write']);
  await blockedHistory.addInitScript(()=>{
    History.prototype.replaceState=function(){
      throw Error('Simulated History API denial');
    };
  });
  const stale=await blockedHistory.newPage();
  try{
    await stale.goto(origin+'/?r='+encodeRecipe(previous),
      {waitUntil:'domcontentloaded'});
    await stale.locator('#mobileMore').click();
    await stale.locator('#importRecipeFile').setInputFiles({
      name:'large-design.png',mimeType:'image/png',buffer:image});
    await stale.waitForFunction(seed=>document.querySelector('#seedInput')
      ?.value===seed,large.seed,{timeout:30000});
    assert.deepEqual(decodeRecipe(new URL(stale.url()).searchParams.get('r')),
      previous,'Failure injection did not retain prior short URL');
    await stale.evaluate(value=>navigator.clipboard.writeText(value),sentinel);
    await stale.locator('#copyLink').click();
    await stale.waitForFunction(()=>document.querySelector('#studioStatus')
      ?.textContent==='Copied to clipboard.');
    const actual=await stale.evaluate(()=>navigator.clipboard.readText());
    assert.notEqual(actual,stale.url(),
      'History denial allowed Copy Link to copy a stale previous wallpaper');
    assert.deepEqual(await decodePortableRecipe(portableShareTokenFromLocation(
      new URL(actual))),large,'History-denied compact link lost current artwork');
  }finally{await blockedHistory.close();}

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
  const row={largeUrlChars:urlSize,compactUrlChars:compact.length,
    compressedStandaloneLink:true,cleanBrowserOpened:true,
    sourceJSONDownloadedFromSharedBrowser:true,malformedTokenRejected:true,unsupportedCompressionFallback:true,
    staleShortHistoryLinkRejected:true,exactCanonicalRecipe:true,downloadedAndReimportedJSON:true,
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
   boundaries:['versioned compressed fragment must stay below 8192 characters',
     'not a universal browser maximum','native OS clipboard/device unverified',
     'JSON and PNG remain necessary when native stream APIs are unavailable']},null,2));
 assert.deepEqual(errors,[],'Live large URL copy/fallback acceptance failed');
}finally{await browser.close();}
