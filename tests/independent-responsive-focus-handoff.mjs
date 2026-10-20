#!/usr/bin/env node
/** Responsive Focus keyboard handoff: source slider focus must not become
 * body/hidden/stranded when switching across the 790/791 mobile boundary.
 * This intentionally uses .focus() only to stage an actual native DOM focus,
 * then changes a real Chromium viewport. It does not claim a cold Tab journey.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/independent-responsive-focus');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const observations=[],errors=[];
const recipe=normalizeRecipe({seed:'responsive-focus-handoff',structure:'paths',
  geometry:'wave',shapeDepth:47,shapeFrequency:22});
const read=page=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
async function focusedState(page){
 return page.evaluate(()=>{
  const el=document.activeElement;
  const rect=el?.getBoundingClientRect(),cs=el?getComputedStyle(el):null;
  const x=rect?rect.left+rect.width/2:-1,y=rect?rect.top+rect.height/2:-1;
  const above=x>=0&&y>=0&&x<innerWidth&&y<innerHeight?
    document.elementFromPoint(x,y):null;
  return {tag:el?.tagName||'',name:el?.getAttribute('name')||'',id:el?.id||'',
   className:String(el?.className||''),isBody:el===document.body,
   isConnected:el?.isConnected??false,
   hidden:!rect||rect.width<1||rect.height<1||cs?.display==='none'||
     cs?.visibility==='hidden'||!!el?.closest('[hidden],[inert]'),
   viewportHit:!!el&&!!rect&&(above===el||el.contains(above)),
   rect:rect?[rect.x,rect.y,rect.width,rect.height]:null};
 });
}
try{
 for(const [width,height] of [[790,892],[700,412]]){
  for(const theme of ['cream','dark']){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,
     isMobile:true,reducedMotion:'reduce'});
   const page=await context.newPage();page.setDefaultTimeout(15000);
   const runtimeErrors=[];page.on('pageerror',e=>runtimeErrors.push(String(e)));
   try{
    await page.goto(origin+'/?r='+encodeRecipe(recipe),{waitUntil:'domcontentloaded'});
    await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#mobileEdit').click();
    await page.locator('#tab-path').click();
    await page.locator('[data-editor-tool="geometry"].editor-tool-tab').click();
    await page.locator('.editor-focus-toggle').click();
    await page.locator('.editor-focus-chip[data-focus-key="shapeDepth"]').click();
    const focusSlider=page.locator('.editor-focus-slider');
    await focusSlider.focus();
    assert.equal(await page.evaluate(()=>document.activeElement?.classList.contains('editor-focus-slider')),true);
    const before=read(page);
    await page.setViewportSize({width:791,height:892});
    await page.waitForFunction(()=>!document.querySelector('#controls')?.classList.contains('editor-focus-active'));
    const after=await focusedState(page);
    assert.equal(await page.locator('.editor-focus-toggle').getAttribute('aria-pressed'),'false');
    assert.deepEqual(read(page),before,'Responsive Focus exit mutated the recipe');
    assert.equal(after.isBody,false,'Breakpoint reflow stranded keyboard focus on document.body');
    assert.equal(after.hidden,false,'Breakpoint reflow left focus on hidden/inert element');
    assert.equal(after.isConnected,true);
    assert.ok(after.viewportHit,'Breakpoint reflow left focused control out of its physical viewport');
    // Keyboard continuity must still work from the destination.
    await page.keyboard.press('Tab');
    const next=await focusedState(page);
    assert.equal(next.hidden,false,'First Tab after responsive Focus handoff enters hidden control');
    assert.equal(next.isBody,false);
    assert.deepEqual(runtimeErrors,[]);
    observations.push({viewport:[width,height],theme,after,next,recipeUnchanged:true});
    await page.screenshot({path:join(out,theme+'-'+width+'x'+height+'.png'),animations:'disabled'});
    console.log('INDEPENDENT_RESPONSIVE_FOCUS',JSON.stringify(observations.at(-1)));
   }catch(e){
    errors.push({viewport:[width,height],theme,error:String(e),stack:e.stack,
      focused:await focusedState(page).catch(()=>null),runtimeErrors});
    await page.screenshot({path:join(out,'failure-'+theme+'-'+width+'x'+height+'.png'),
      animations:'disabled'}).catch(()=>{});
   }finally{await context.close();}
  }
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({observations,errors,
  classification:errors.length?'NOT VERIFIED':'bounded native Chromium breakpoint focus handoff',
  limits:['Not physical Android/AT','Programmatic focus used only for starting state',
   'Only active Path geometry slider across mobile→desktop']},null,2));
 assert.deepEqual(errors,[],'Responsive Focus keyboard handoff counterexamples');
 assert.equal(observations.length,4);
 console.log('INDEPENDENT_RESPONSIVE_FOCUS_SUCCESS');
}finally{await browser.close();}
