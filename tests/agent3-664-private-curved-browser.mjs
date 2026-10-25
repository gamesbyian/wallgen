#!/usr/bin/env node
// Genuine UI TTF upload + shadowed curved text + 3024x6552 visible PNG.
// Confirms browser integration only. Physical Pixel/IME/TalkBack NOT TESTED.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
import {extractPngRecipe} from '../src/png-metadata.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/agent3-664-private-curved');
await mkdir(out,{recursive:true});
const baseline=normalizeRecipe({
 seed:'private-font-curve-proof',structure:'paths',geometry:'wave',
 customPath:[[.04,.36],[.21,.30],[.42,.46],[.60,.58],[.84,.37],[.97,.44]],
 textOverlays:[{id:'curve-private',text:'CURVED RAINBOW TYPE',
   font:'bold',path:'drawn',colour:'rainbow-letter',outline:'white',
   size:60,x:50,y:52}]
});
const browser=await chromium.launch({headless:true}),results=[];
try{
 for(const [width,height] of [[320,700],[412,892]]){
  const context=await browser.newContext({viewport:{width,height},
    hasTouch:true,isMobile:true,acceptDownloads:true,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[],apiRequests=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('request',r=>{
    if(r.url().startsWith('https://api.github.com/'))apiRequests.push(r.url());
  });
  page.setDefaultTimeout(30000);
  const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
  try{
   await page.goto(origin+'/?r='+encodeRecipe(baseline),{waitUntil:'domcontentloaded'});
   await page.locator('#mobileEdit').tap();
   await page.locator('#tab-details').tap();
   await page.locator('.editor-tool-chooser [data-editor-tool="typography"]').tap();
   const importer=page.locator('[data-text-import]');
   await importer.setInputFiles(resolve('assets/fonts/bangers.ttf'));
   await page.waitForFunction(()=>
     document.querySelector('[data-text-key="font"]')?.value?.startsWith('user-'));
   const id=current().textOverlays[0].font;
   assert.match(id,/^user-[a-f0-9]{64}$/,'private TTF import did not commit SHA ID');
   await page.locator('.text-overlay-advanced > summary').tap();
   assert.equal(await page.locator('[data-text-key="path"]').inputValue(),'drawn');
   await page.locator('.text-overlay-effects > summary').tap();
   await page.locator('[data-text-key="shadow"]').selectOption('black');
   await page.locator('[data-text-key="rainbowReverse"]').check();
   const letter=page.locator('[data-text-key="letterSpacing"]');
   await letter.focus();await letter.press('ArrowRight');await letter.press('Tab');
   const saved=current();
   assert.equal(saved.textOverlays[0].letterSpacing,.5);
   assert.equal(saved.textOverlays[0].shadow,'black');
   assert.equal(saved.textOverlays[0].rainbowReverse,true);
   assert.equal(saved.textOverlays[0].font,id);
   assert.equal(saved.textOverlays[0].path,'drawn');
   assert.deepEqual(saved.customPath,baseline.customPath);
   await page.locator('#mobileDismissHandle').tap();
   await page.waitForFunction(()=>document.querySelector('#preview')
     ?.dataset.renderPending==='false',{timeout:30000}).catch(()=>{});
   const [originalDownload]=await Promise.all([
     page.waitForEvent('download',{timeout:120000}),
     page.locator('#mobileDownload').tap()
   ]);
   assert.match(originalDownload.suggestedFilename(),/\.png$/i);
   const png1=new Uint8Array(await readFile(await originalDownload.path()));
   assert.ok(png1.length>100000,'curved shadowed imported type disappeared from PNG');
   assert.deepEqual(extractPngRecipe(png1),saved,
     'original visible PNG lost imported font identifier or expressive style');
   assert.ok(!Buffer.from(png1).includes(Buffer.from('Bangers-Regular')),
     'ordinary downloaded PNG unexpectedly appears to include raw TTF');
   await page.screenshot({path:join(out,width+'x'+height+'-before.png'),
     animations:'disabled'});
   await page.reload({waitUntil:'domcontentloaded'});
   assert.deepEqual(current(),saved,'reload lost canonical private-font expressive recipe');
   await page.locator('#mobileEdit').tap();
   await page.locator('#tab-details').tap();
   await page.locator('.editor-tool-chooser [data-editor-tool="typography"]').tap();
   await page.waitForFunction(expected=>[...document.querySelectorAll(
     '[data-text-key="font"] option')].some(option=>option.value===expected
     &&option.textContent.includes('My fonts')),id,{timeout:30000});
   assert.equal(await page.locator('[data-text-font-status]').textContent(),'',
     'font missing from local IndexedDB after reload');
   await page.locator('#mobileDismissHandle').tap();
   const [secondDownload]=await Promise.all([
     page.waitForEvent('download',{timeout:120000}),
     page.locator('#mobileDownload').tap()
   ]);
   const png2=new Uint8Array(await readFile(await secondDownload.path()));
   assert.deepEqual(extractPngRecipe(png2),saved,'reloaded full PNG changed canonical art');
   assert.ok(png2.length>100000,'reloaded full PNG appears empty');
   assert.deepEqual(errors,[],'browser application errors');
   assert.deepEqual(apiRequests,[],'remote GitHub requests without consent');
   await page.screenshot({path:join(out,width+'x'+height+'-after.png'),
     animations:'disabled'});
   const evidence={viewport:[width,height],privateFontId:id.slice(0,18)+'…',
     actualTTFUpload:true,curvedDraw:true,shadowed:true,rainbowReversed:true,
     reloadIndexedDB:true,actualUIFileExport:true,
     beforePngBytes:png1.length,afterPngBytes:png2.length,
     beforeAfterRecipeExact:true,remoteCalls:0,pageErrors:0,
     physicalPixel:'NOT TESTED',androidIme:'NOT TESTED',
     talkBack:'NOT TESTED',nativeMemory:'NOT TESTED'};
   results.push(evidence);
   console.log('AGENT3_PRIVATE_CURVE_PASS '+JSON.stringify(evidence));
  }catch(e){
   await page.screenshot({path:join(out,'failure-'+width+'.png')}).catch(()=>{});
   throw new Error(width+'x'+height+': '+e.stack);
  }finally{await context.close();}
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify(results,null,2));
}finally{await browser.close()}
