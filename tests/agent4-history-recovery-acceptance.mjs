#!/usr/bin/env node
/**
 * Real browser Recent variations acceptance, independent of gallery Saved and
 * Undo: bounded history, exact restoration, asynchronous thumbnail failures.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/agent4-history');
await mkdir(out,{recursive:true});
const original=normalizeRecipe({seed:'a4-history-baseline',structure:'regions',
  regionMode:'nested',viewZoom:.7,viewPanX:12,
  material:'linen',textureLayer2Enabled:true,material2:'foil',
  textureRotation2:177.5,lockedSettings:['material2','regionMode'],
  interiorElements:[{id:'history-contour',type:'line',shape:'wave',
    color:'custom',customColor:'#3eacb0',placement:'contour'}]});
const browser=await chromium.launch({headless:true});
const evidence=[],errors=[];
try{
 for(const failThumbnail of [false,true]){
  const context=await browser.newContext({viewport:{width:412,height:892},
    isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  if(failThumbnail)await context.addInitScript(()=>{
    HTMLCanvasElement.prototype.toDataURL=function(){
      throw Error('Simulated history JPEG encoding failure');
    };
  });
  const page=await context.newPage();
  page.setDefaultTimeout(20000);
  page.on('pageerror',error=>errors.push(String(error)));
  const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
  try{
   await page.goto(origin+'/?r='+encodeRecipe(original),{waitUntil:'domcontentloaded'});
   assert.deepEqual(current(),original);
   const sequence=[original];
   for(let i=0;i<3;i++){
     await page.locator('#randomize').click();
     sequence.push(current());
     assert.notDeepEqual(sequence.at(-1),sequence.at(-2),'New seed did not change recipe');
   }
   await page.locator('#mobileEdit').click();
   await page.locator('#editorHistoryToggle').click();
   assert.equal(await page.locator('#editorHistory').isVisible(),true);
   assert.equal(await page.locator('#editorHistoryToggle').getAttribute('aria-pressed'),'true');
   const choices=page.locator('#editorHistory .editor-history-choice');
   assert.equal(await choices.count(),4,
     'Before/after history should de-duplicate same successive seed');
   if(!failThumbnail){
     await page.waitForFunction(()=>[...document.querySelectorAll(
       '#editorHistory .editor-history-choice img')].every(img=>
       img.complete&&img.naturalWidth===120&&img.naturalHeight===260),
       null,{timeout:90000});
   }else{
     await page.waitForTimeout(300);
     assert.equal(await choices.count(),4,
       'Failed thumbnail encoding must retain restorable history recipes');
   }
   const earliest=page.locator('#editorHistory .editor-history-choice').last();
   await earliest.click();
   assert.deepEqual(current(),original,'History restored an altered recipe');
   assert.equal(await page.locator('#editorHistory').isVisible(),false);
   assert.equal(await page.locator('#editorHistoryToggle').getAttribute('aria-pressed'),'false');
   // Restoration participates in Undo without erasing the earlier undo chain.
   await page.locator('#mobileDismissHandle').click();
   await page.locator('#undo').click();
   assert.deepEqual(current(),sequence[3],
     'History restoration erased the immediately previous wallpaper');
   await page.locator('#undo').click();
   assert.deepEqual(current(),sequence[2],
     'History restoration damaged pre-existing Undo provenance');
   evidence.push({thumbnailFailureInjected:failThumbnail,
     historyItems:4,restoredOriginal:true,undoChainPreserved:true,
     thumbnailResult:failThumbnail?'deliberately failed and recovered':'painted 120x260 JPEG'});
   console.log('AGENT4_HISTORY_VERIFIED',JSON.stringify(evidence.at(-1)));
  }catch(error){
   errors.push({thumbnailFailureInjected:failThumbnail,message:String(error),stack:error.stack});
   await page.screenshot({path:join(out,'failure-'+(failThumbnail?'thumbnail':'normal')+'.png'),
     animations:'disabled'}).catch(()=>{});
  }finally{await context.close();}
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({
   classification:errors.length?'not verified':'real Chromium Recent variations restore/Undo',
   evidence,errors,limitations:['not physical Android','history intentionally lasts this session',
     'not a user-evaluated thumbnail aesthetic review']
 },null,2));
 assert.deepEqual(errors,[],'Real Recent variations acceptance failed');
 console.log('AGENT4_HISTORY_SUCCESS');
}finally{await browser.close();}
