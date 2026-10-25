#!/usr/bin/env node
// Acceptance of ACTUAL collapsed expressive text controls and the visible
// portrait PNG action. Chromium touch emulation != physical Android acceptance.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
import {extractPngRecipe} from '../src/png-metadata.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/agent3-664-expressive-portrait');
await mkdir(out,{recursive:true});
const base=normalizeRecipe({
  seed:'agent3-expressive-acceptance',structure:'paths',geometry:'drawn',
  customPath:[[.04,.36],[.21,.30],[.42,.46],[.60,.58],[.84,.37],[.97,.44]],
  textOverlays:[{id:'expressive-proof',text:'ROYGBIV IN MOTION',
    font:'bold',colour:'rainbow-letter',outline:'white',size:58,
    x:50,y:52,path:'drawn'}]
});
assert.equal(base.textOverlays[0].path,'drawn');
assert.equal(base.customPath.length,6);
const browser=await chromium.launch({headless:true});
const results=[];
try{
 for(const [width,height] of [[320,700],[412,892]]){
  const context=await browser.newContext({viewport:{width,height},
    isMobile:true,hasTouch:true,acceptDownloads:true,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[],remotes=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('request',request=>{
    if(request.url().startsWith('https://api.github.com/'))remotes.push(request.url());
  });
  page.setDefaultTimeout(30000);
  const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
  const item=()=>current().textOverlays[0];
  try{
   await page.goto(origin+'/?r='+encodeRecipe(base),{waitUntil:'domcontentloaded'});
   assert.deepEqual(current(),base,'starting canonical URL changed before editing');
   await page.locator('#mobileEdit').tap();
   await page.locator('#tab-details').tap();
   await page.locator('.editor-tool-chooser [data-editor-tool="typography"]').tap();
   await page.locator('.text-overlay-advanced > summary').tap();
   assert.equal(await page.locator('[data-text-key="path"]').inputValue(),'drawn');
   assert.match(await page.locator('[data-text-path-status]').textContent(),
     /authored Draw path shape/);
   await page.locator('.text-overlay-effects > summary').tap();
   assert.equal(await page.locator('[data-text-key="rainbowOffset"]').isEnabled(),true);
   assert.equal(await page.locator('[data-text-key="shadowBlur"]').isDisabled(),true);
   assert.equal(await page.locator('[data-text-key="shadowDistance"]').isDisabled(),true);

   // Real keyboard operations on the source form controls. DOM property
   // writes would bypass the editor and falsely certify user-operability.
   const tracking=page.locator('[data-text-key="letterSpacing"]');
   await tracking.focus(); await tracking.press('ArrowRight'); await tracking.press('Tab');
   assert.equal(item().letterSpacing,.5,'slider did not commit native tracking');
   const beforeShadow=current();
   await page.locator('[data-text-key="shadow"]').selectOption('white');
   assert.equal(item().shadow,'white','white shadow selector inert');
   assert.equal(await page.locator('[data-text-key="shadowBlur"]').isEnabled(),true);
   assert.equal(await page.locator('[data-text-key="shadowDistance"]').isEnabled(),true);
   // Existing canonical Undo must back out just the last selector change.
   await page.locator('#undo').tap();
   assert.deepEqual(current(),beforeShadow,'Undo failed to restore before-shadow recipe');
   assert.equal(await page.locator('[data-text-key="shadowBlur"]').isDisabled(),true,
     'Undo must refresh the disabled source shadow controls');
   await page.locator('[data-text-key="shadow"]').selectOption('black');
   assert.equal(item().shadow,'black');
   const offset=page.locator('[data-text-key="rainbowOffset"]');
   await offset.focus(); await offset.press('ArrowRight'); await offset.press('Tab');
   assert.equal(item().rainbowOffset,1,'keyboard rainbow phase did not commit');
   await page.locator('[data-text-key="rainbowReverse"]').check();
   assert.equal(item().rainbowReverse,true,'rainbow reverse source checkbox inert');
   const leading=page.locator('[data-text-key="lineSpacing"]');
   await leading.focus(); await leading.press('ArrowRight'); await leading.press('Tab');
   assert.equal(item().lineSpacing,5,'line-spacing source control did not commit');
   const authored=current();
   assert.deepEqual(authored.customPath,base.customPath,
     'expressive source settings destroyed canonical Draw path');
   await page.locator('#mobileDismissHandle').tap();
   await page.locator('.mobile-preview-rail-left #randomizeAll').tap();
   const randomized=current();
   assert.notEqual(randomized.seed,authored.seed,'actual Random was inert');
   assert.deepEqual(randomized.customPath,authored.customPath,
     'Random must retain canonical Draw path referenced by text');
   assert.deepEqual(randomized.textOverlays,authored.textOverlays,
     'Random altered authored text and opt-in expressive defaults');
   await page.locator('#mobileEdit').tap();
   await page.locator('#undo').tap();
   assert.deepEqual(current(),authored,'Undo after randomization lost expressive art');
   await page.locator('#mobileDismissHandle').tap();

   const [download]=await Promise.all([
     page.waitForEvent('download',{timeout:120000}),
     page.locator('#mobileDownload').tap()
   ]);
   const bytes=new Uint8Array(await readFile(await download.path()));
   assert.match(download.suggestedFilename(),/\.png$/i);
   assert.ok(bytes.length>100000,'actual exported PNG unexpectedly small');
   assert.deepEqual(extractPngRecipe(bytes),authored,
     'actual full-resolution PNG source recipe dropped expressive/Draw fields');
   assert.deepEqual(errors,[],'unexpected page error');
   assert.deepEqual(remotes,[],'unconsented remote requests');
   await page.screenshot({path:join(out,width+'x'+height+'.png'),animations:'disabled'});
   const record={viewport:[width,height],path:'drawn',editable:true,
     nativeTracking:.5,rainbowOffset:1,reverse:true,shadow:'black',
     shadowUndo:true,sourceControlGates:true,randomRetainsDraw:true,
     undoRandom:true,visiblePngDownload:true,pngBytes:bytes.length,
     exactEmbeddedRecipe:true,pageErrors:0,remoteRequests:0,
     physicalAndroid:'NOT TESTED',androidIme:'NOT TESTED',
     talkBack:'NOT TESTED',humanApproval:'NOT TESTED'};
   results.push(record);
   console.log('AGENT3_EXPRESSIVE_PASS '+JSON.stringify(record));
  }catch(error){
   await page.screenshot({path:join(out,'failure-'+width+'.png')}).catch(()=>{});
   throw new Error(width+'x'+height+': '+error.stack);
  }finally{await context.close();}
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify(results,null,2));
}finally{await browser.close()}
