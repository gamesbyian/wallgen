#!/usr/bin/env node
/** Precision Draw touch witness: real Chromium touchscreen, not mouse events. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const output=resolve('artifacts/mobile-drawn-touch-precision');
await mkdir(output,{recursive:true});
const source=normalizeRecipe({seed:'native-touch-anchor-selection',
  structure:'paths',geometry:'drawn',viewZoom:1,viewPanX:0,viewPanY:0,
  positionX:0,positionY:0,extendDrawnPath:true,
  customPath:[[.12,.16],[.19,.30],[.28,.42],[.48,.50],
    [.67,.62],[.79,.75],[.87,.87]],
  drawnAnchors:[3],drawnCorners:[]});
const target=source.customPath[3];
const offsets=[[0,0],[5,0],[-5,0],[0,5],[0,-5]];
const browser=await chromium.launch({headless:true}),records=[],failures=[];
try{
 for(const width of [320,412,499])for(const theme of ['cream','dark']){
  const context=await browser.newContext({viewport:{width,height:892},
    isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(String(e)));
  try{
   await page.goto(origin+'/?r='+encodeRecipe(source),{waitUntil:'domcontentloaded'});
   await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
   await page.reload({waitUntil:'domcontentloaded'});
   const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
   assert.deepEqual(current(),source,'Starting authored geometry changed');
   await page.locator('#drawPathToggle').tap();
   await page.locator('#drawEditPoints').tap();
   assert.equal(await page.locator('#drawPathPanel').getAttribute('data-phase'),'anchors');
   const preview=await page.locator('#preview').boundingBox();
   assert.ok(preview&&preview.width>=125&&preview.height>=250,
     'Insufficient visible wallpaper for genuine touch precision');
   const toScreen=(p,dx=0,dy=0)=>({
     x:preview.x+p[0]*preview.width+dx,
     y:preview.y+p[1]*preview.height+dy
   });
   const corner=page.locator('#drawCornerPoint'),undo=page.locator('#drawUndoPoint');
   const probes=[];
   for(const [dx,dy] of offsets){
     const blank=toScreen([.04,.43]),anchor=toScreen(target,dx,dy);
     const top=await page.evaluate(({blank,anchor})=>{
       const a=document.elementFromPoint(anchor.x,anchor.y);
       const b=document.elementFromPoint(blank.x,blank.y);
       return {anchor:a?.id||'',blank:b?.id||''};
     },{blank,anchor});
     assert.deepEqual(top,{anchor:'drawOverlay',blank:'drawOverlay'},
       'Drawing surface blocked native touch points: '+JSON.stringify({width,theme,dx,dy,top}));
     await page.touchscreen.tap(blank.x,blank.y);
     assert.equal(await corner.isDisabled(),true,
       'Blank wallpaper tap did not clear earlier selected point');
     await page.touchscreen.tap(anchor.x,anchor.y);
     assert.equal(await corner.isEnabled(),true,
       'Real touch missed visible interior anchor at '+JSON.stringify({dx,dy}));
     assert.equal(await corner.textContent(),'Make corner');
     await corner.tap();
     assert.equal(await corner.textContent(),'Make smooth');
     assert.equal(await undo.isEnabled(),true,'Point operation has no local Undo');
     await undo.tap();
     assert.equal(await corner.textContent(),'Make corner');
     assert.deepEqual(current(),source,
       'Unapplied corner or Undo contaminated the source recipe');
     probes.push({dx,dy,touchSelected:true,localUndo:true,overlayOwner:top.anchor});
   }
   await page.screenshot({path:join(output,width+'-'+theme+'.png'),animations:'disabled'});
   await page.locator('#drawCancel').tap();
   assert.equal(await page.locator('#drawPathPanel').isVisible(),false);
   assert.deepEqual(current(),source,'Cancel failed to preserve authored path/camera');
   assert.deepEqual(errors,[],'Uncaught source page errors');
   const record={width,theme,preview:{w:preview.width,h:preview.height},
     probes,sourceRecipePreserved:true};
   records.push(record);
   console.log('DRAW_TOUCH_PRECISION_PASS',JSON.stringify(record));
  }catch(e){
   failures.push({width,theme,error:String(e),stack:e.stack,pageErrors:errors});
   await page.screenshot({path:join(output,'failure-'+width+'-'+theme+'.png'),
     animations:'disabled'}).catch(()=>{});
  }finally{await context.close();}
 }
 await writeFile(join(output,'evidence.json'),JSON.stringify({records,failures,
   limitation:'Bounded 0/5px authored anchor taps; physical thumb accuracy, motor accessibility, OS gestures, crowded-handle tolerance and native TalkBack remain unverified'},null,2));
 assert.deepEqual(failures,[],'Native touchscreen anchor selection failed');
}finally{await browser.close()}
