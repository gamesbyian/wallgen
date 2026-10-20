#!/usr/bin/env node
// Actual 412x892 Chromium refusal of incompressible but VALID supported design.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe} from '../src/model.js';
import {embedPngMetadata} from '../src/png-metadata.js';
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/agent4-highentropy-share');
await mkdir(out,{recursive:true});
const tiny=Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/9QAAAABJRU5ErkJggg==','base64');
let state=0x1f7acafe;
const chars='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-';
const next=()=>{
  state^=state<<13;state^=state>>>17;state^=state<<5;
  return chars[(state>>>0)%chars.length];
};
const ids=element=>Array.from({length:200},(_,index)=>
  'piece-'+element+'-'+index+'-'+Array.from({length:75},next).join(''));
const large=normalizeRecipe({seed:'bounded-compression-fallback',structure:'regions',
  regionMode:'nested',material:'linen',viewZoom:.85,
  interiorElements:Array.from({length:8},(_,element)=>({
    id:'entropy-'+element,type:'line',shape:'wave',placement:'contour',
    objectIds:ids(element),colorSlots:[element%7],
    customColor:'#1188bb',color:'custom'
  }))
});
const PNG=Buffer.from(embedPngMetadata(tiny,{}, {recipe:large}));
const previous=normalizeRecipe({seed:'share-highentropy-before',structure:'paths'});
const browser=await chromium.launch({headless:true});
const errors=[],evidence=[];
try{
  const context=await browser.newContext({viewport:{width:412,height:892},
    isMobile:true,hasTouch:true,acceptDownloads:true,reducedMotion:'reduce'});
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  const page=await context.newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror',error=>errors.push({pageError:String(error)}));
  try{
    await page.goto(origin+'/?r='+encodeRecipe(previous),
      {waitUntil:'domcontentloaded'});
    await page.locator('#mobileMore').click();
    await page.locator('#importRecipeFile').setInputFiles({
      name:'valid-highentropy-recipe.png',mimeType:'image/png',buffer:PNG
    });
    await page.waitForFunction(seed=>document.querySelector('#seedInput')?.value===seed,
      large.seed,{timeout:30000});
    const legacyChars=page.url().length;
    assert.ok(legacyChars>8192,'Invalid fixture: URL already fits');
    const sentinel='untouched-by-overlong-validated-recipe';
    await page.evaluate(text=>navigator.clipboard.writeText(text),sentinel);
    await page.locator('#copyLink').click();
    await page.waitForFunction(()=>document.querySelector('#studioStatus')
      ?.textContent.includes('Compressed link is still too long'));
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),sentinel,
      'Source Copy Link overwrote clipboard with unshareable high-entropy link');
    assert.equal(await page.locator('#seedInput').inputValue(),large.seed,
      'Failed share silently changed current design');

    // Failures must not break the original lossless download/undo transport.
    const pending=page.waitForEvent('download');
    await page.locator('#downloadRecipe').click();
    const download=await pending;
    const exported=JSON.parse((await readFile(await download.path())).toString('utf8'));
    assert.deepEqual(exported,large,
      'Truthful share fallback did not preserve every Interior selection in JSON');
    const row={legacyChars,interiorElements:8,objectIds:1600,
      compressedLinkRefused:true,clipboardUnchanged:true,
      exactSourceJSONFallback:true};
    evidence.push(row);
    console.log('AGENT4_HIGHENTROPY_BROWSER_PASS',JSON.stringify(row));
  }catch(error){
    errors.push({message:String(error),stack:error.stack});
    await page.screenshot({path:join(out,'failure.png'),
      animations:'disabled'}).catch(()=>{});
  }finally{await context.close();}
  await writeFile(join(out,'evidence.json'),JSON.stringify({evidence,errors,
    boundaries:['synthetic deterministic high-entropy fixture',
      'Chromium browser, not physical Android OS clipboard']},null,2));
  assert.deepEqual(errors,[],'High entropy source browser fallback acceptance failed');
}finally{await browser.close();}
