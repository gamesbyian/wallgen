#!/usr/bin/env node
/** Entire mobile source journey: generate, edit, lock, save, restore, export. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
import {extractPngRecipe} from '../src/png-metadata.js';
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/mobile-complete-creation-export');
await mkdir(out,{recursive:true});
const baseline=normalizeRecipe({
 seed:'complete-native-mobile-journey',structure:'paths',geometry:'zigzag',
 shapeFrequency:61,shapeDepth:74,viewZoom:.8,viewPanX:5,viewPanY:-3,
 positionX:2,positionY:-2,lockedSettings:[]
});
const browser=await chromium.launch({headless:true}),results=[],failures=[];
try{
 for(const [width,theme] of [[320,'cream'],[412,'dark']]){
  const context=await browser.newContext({viewport:{width,height:892},
    isMobile:true,hasTouch:true,acceptDownloads:true,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.setDefaultTimeout(30000);
  const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
  try{
   await page.goto(origin+'/?r='+encodeRecipe(baseline),{waitUntil:'domcontentloaded'});
   await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
   await page.reload({waitUntil:'domcontentloaded'});
   assert.deepEqual(current(),baseline);
   const frameBefore=await page.locator('.wallpaper-frame').boundingBox();
   await page.locator('.mobile-preview-rail-left #randomizeAll').tap();
   const generated=current();
   assert.notEqual(generated.seed,baseline.seed,'Real source Random did not generate');
   await page.locator('#undo').tap();
   assert.deepEqual(current(),baseline,'Original Undo failed whole generated-recipe recovery');

   await page.locator('#mobileEdit').tap();
   await page.locator('#tab-path').tap();
   await page.locator('.editor-tool-chooser [data-editor-tool="geometry"]').tap();
   const shape=page.locator('[data-setting][name="shapeFrequency"]');
   const row=page.locator('.editor-tool-card[data-editor-tool="geometry"] .lockable-setting:has(input[name="shapeFrequency"])');
   const plus=row.locator('.stepper .step-button').nth(1);
   const lock=row.locator(':scope > .setting-lock');
   assert.equal(await shape.isEnabled(),true);
   await plus.tap();
   const edited=current();
   assert.deepEqual(edited,{...baseline,shapeFrequency:62},
     'Original source Path stepper changed unrelated properties');
   await lock.tap();
   const authored=current();
   assert.equal(authored.shapeFrequency,62);
   assert.ok(authored.lockedSettings.includes('shapeFrequency'));
   assert.equal(await shape.isDisabled(),true);
   assert.equal(await plus.isDisabled(),true);
   await page.locator('#mobileDismissHandle').tap();
   assert.deepEqual(current(),authored,'Dismissing editor mutated authored scene');
   const frameAfter=await page.locator('.wallpaper-frame').boundingBox();
   assert.ok(Math.abs(frameAfter.height-frameBefore.height)<1,
     'Opening/closing controls permanently changed artwork preview');

   await page.locator('#mobileFavorite').tap();
   assert.equal(await page.locator('#favorite').getAttribute('aria-pressed'),'true');
   const storage=await page.evaluate(()=>JSON.parse(localStorage.getItem('wallgen:favorites:v1')));
   assert.ok(storage.some(record=>record.seed===authored.seed),
     'Original Favourite did not persist authored design');
   await page.locator('.mobile-preview-rail-left #randomizeAll').tap();
   const next=current();
   assert.notEqual(next.seed,authored.seed,'Source Random was inert after save');
   assert.equal(next.shapeFrequency,62,'Source Random ignored authored property lock');
   assert.ok(next.lockedSettings.includes('shapeFrequency'));

   await page.locator('#mobileSaved').tap();
   await page.waitForFunction(seed=>{
     const gallery=document.querySelector('#gallery');
     return gallery?.dataset.view==='saved'&&gallery.getAttribute('aria-busy')!=='true'&&
       [...gallery.querySelectorAll('.thumb')].some(c=>c.dataset.recipeSeed===seed);
   },authored.seed,{timeout:90000});
   const saved=page.locator('#gallery .thumb[data-recipe-seed="'+authored.seed+'"]');
   assert.equal(await saved.count(),1,'Saved authored source card missing/duplicated');
   await saved.tap();
   assert.deepEqual(current(),authored,'Saved restore lost original path/lock/camera');
   assert.equal(await page.locator('#favorite').getAttribute('aria-pressed'),'true');

   await page.reload({waitUntil:'domcontentloaded'});
   assert.deepEqual(current(),authored,'Reload lost restored source recipe');
   await page.locator('#mobileSaved').tap();
   await page.waitForFunction(seed=>
     [...document.querySelectorAll('#gallery .thumb')]
       .some(c=>c.dataset.recipeSeed===seed)&&
     document.querySelector('#gallery').getAttribute('aria-busy')!=='true',
     authored.seed,{timeout:90000});
   await page.locator('#gallery .thumb[data-recipe-seed="'+authored.seed+'"]').tap();
   assert.deepEqual(current(),authored,'Persisted Saved restoration drifted');
   const [download]=await Promise.all([
     page.waitForEvent('download',{timeout:90000}),
     page.locator('#mobileDownload').tap()
   ]);
   assert.match(download.suggestedFilename(),/\.png$/i);
   const png=new Uint8Array(await readFile(await download.path()));
   const embedded=extractPngRecipe(png);
   assert.deepEqual(embedded,authored,
     'The actual downloaded PNG lost saved Path setting, lock, camera or recipe');
   assert.deepEqual(current(),authored,'PNG export modified live authored source');
   assert.deepEqual(errors,[],'Uncaught page errors in full mobile journey');
   const result={width,theme,generated:true,fullUndo:true,
     originalNativeStepper:true,propertyLock:true,randomHonoursLock:true,
     savedRestored:true,persistedSavedRestored:true,
     pngBytes:png.length,exactEmbeddedRecipe:true,previewHeight:frameBefore.height};
   results.push(result);
   await page.screenshot({path:join(out,width+'-'+theme+'.png'),animations:'disabled'});
   console.log('MOBILE_SOURCE_FULL_JOURNEY_PASS',JSON.stringify(result));
  }catch(e){
   failures.push({width,theme,error:String(e),stack:e.stack,pageErrors:errors});
   await page.screenshot({path:join(out,'failure-'+width+'-'+theme+'.png'),
     animations:'disabled'}).catch(()=>{});
  }finally{await context.close();}
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({results,failures,
   limitations:['two phone/theme combinations','not real OS Chrome/PWA',
     'not physical thumb accuracy or TalkBack','not human visual approval']},null,2));
 assert.deepEqual(failures,[],'Full native mobile create-to-PNG journey failed');
}finally{await browser.close()}
