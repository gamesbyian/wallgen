#!/usr/bin/env node
/** Original two-point Drawn path: native finger insert, delete, Undo, Apply. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/mobile-drawn-insert-delete-native');
await mkdir(out,{recursive:true});
const source=normalizeRecipe({seed:'sparse-two-point-native-insertion',
  structure:'paths',geometry:'drawn',customPath:[[.22,.25],[.78,.75]],
  drawnAnchors:[],drawnCorners:[],viewZoom:1,viewPanX:0,viewPanY:0,
  positionX:0,positionY:0});
const browser=await chromium.launch({headless:true}),records=[],failures=[];
try{
 for(const width of [320,412])for(const theme of ['cream','dark']){
  const context=await browser.newContext({viewport:{width,height:892},
   isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.setDefaultTimeout(20000);
  const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
  try{
   await page.goto(origin+'/?r='+encodeRecipe(source),{waitUntil:'domcontentloaded'});
   await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
   await page.reload({waitUntil:'domcontentloaded'});
   assert.deepEqual(current(),source);
   await page.locator('#drawPathToggle').tap();
   await page.locator('#drawEditPoints').tap();
   assert.equal(await page.locator('#drawPathPanel').getAttribute('data-phase'),'anchors');
   const add=page.locator('#drawAddPoint'),del=page.locator('#drawDeletePoint'),
     undo=page.locator('#drawUndoPoint');
   assert.ok(await add.isEnabled());
   await add.tap();
   assert.equal(await add.getAttribute('aria-pressed'),'true');
   const preview=await page.locator('#preview').boundingBox();
   const middle={x:preview.x+preview.width*.5,y:preview.y+preview.height*.5};
   assert.equal(await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.id,middle),
     'drawOverlay','Midpoint finger target obscured');
   await page.touchscreen.tap(middle.x,middle.y);
   assert.equal(await add.getAttribute('aria-pressed'),'false');
   assert.ok(await del.isEnabled(),'Inserted interior anchor not selected');
   assert.ok(await undo.isEnabled(),'Insert omitted local Undo');
   await undo.tap();
   assert.ok(await del.isDisabled(),'Local Undo did not restore sparse endpoints');
   await add.tap();
   await page.touchscreen.tap(middle.x,middle.y);
   assert.ok(await del.isEnabled(),'Second insert missing selected interior');
   await del.tap();
   assert.ok(await undo.isEnabled(),'Delete missing local Undo');
   await undo.tap();
   assert.ok(await del.isEnabled(),'Local Undo did not restore inserted interior');
   await page.locator('#drawApply').tap();
   const after=current();
   assert.equal(after.customPath.length,3,'Native sparse insertion did not save third sample');
   assert.deepEqual(after.customPath[0],source.customPath[0]);
   assert.deepEqual(after.customPath[2],source.customPath[1]);
   assert.equal(after.customPath[1][0],.5);
   assert.equal(after.customPath[1][1],.5);
   for(const key of Object.keys(source).filter(k=>!['customPath','drawnAnchors','drawnCorners'].includes(k)))
     assert.deepEqual(after[key],source[key],'Point insertion changed unrelated recipe '+key);
   await page.locator('#undo').tap();
   assert.deepEqual(current(),source,'Original global Undo failed after inserted point Apply');
   assert.deepEqual(errors,[]);
   records.push({width,theme,sourcePoints:2,resultPoints:3,
     nativeMidpointInsert:true,nativeDelete:true,localUndoTwice:true,
     globalUndo:true,previewWidth:preview.width});
   await page.screenshot({path:join(out,width+'-'+theme+'.png'),animations:'disabled'});
   console.log('NATIVE_SPARSE_INSERT_DELETE_PASS',JSON.stringify(records.at(-1)));
  }catch(e){
   failures.push({width,theme,error:String(e),stack:e.stack,pageErrors:errors});
   await page.screenshot({path:join(out,'failure-'+width+'-'+theme+'.png'),
    animations:'disabled'}).catch(()=>{});
  }finally{await context.close();}
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({records,failures,
  limits:['dense paths','OS thumb precision','screen magnification','TalkBack','human approval']},null,2));
 assert.deepEqual(failures,[],'Native sparse Drawn insertion/deletion failed');
}finally{await browser.close()}
