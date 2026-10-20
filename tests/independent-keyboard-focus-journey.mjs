#!/usr/bin/env node
/**
 * Actual Tab/Enter/Arrow/Shift-Tab only: document → mobile Edit → Path →
 * Focus → source parameter → All. No .focus(), click(), or synthetic events.
 * Tests that accessibility isn't merely a locator reaching offscreen nodes.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/independent-keyboard-focus');
await mkdir(out,{recursive:true});
const recipe=normalizeRecipe({seed:'qa-real-keys-geometry',structure:'paths',
  geometry:'wave',shapeDepth:48,shapeFrequency:22});
const current=page=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
const browser=await chromium.launch({headless:true});
const evidence=[],errors=[];
const is=x=>!!x;
try{
 for(const [width,height] of [[412,892],[700,412]]){
  for(const theme of ['cream','dark']){
   const context=await browser.newContext({viewport:{width,height},isMobile:true,
     hasTouch:true,reducedMotion:'reduce'});
   const page=await context.newPage();page.setDefaultTimeout(18000);
   const trace=[],pageErrors=[];
   page.on('pageerror',e=>pageErrors.push(String(e)));
   async function read(){
    return page.evaluate(()=>{
      const el=document.activeElement;
      if(!el||el===document.body)return {body:true};
      const r=el.getBoundingClientRect(),css=getComputedStyle(el);
      const x=r.left+r.width/2,y=r.top+r.height/2;
      const top=x>=0&&x<innerWidth&&y>=0&&y<innerHeight?
        document.elementFromPoint(x,y):null;
      return {id:el.id||'',className:String(el.className||''),
        tool:el.dataset.editorTool||'',focusKey:el.dataset.focusKey||'',
        tag:el.tagName,hidden:r.width<1||r.height<1||css.display==='none'||
          css.visibility==='hidden'||!!el.closest('[hidden],[inert]'),
        inViewport:x>=0&&y>=0&&x<innerWidth&&y<innerHeight,
        centerHit:top===el||el.contains(top)};
    });
   }
   async function seek(key,predicate,label,limit=170){
    for(let n=0;n<limit;n++){
      await page.keyboard.press(key);
      const x=await read();
      trace.push({key,focus:x});
      assert.equal(x.hidden||false,false,'Key reached hidden/inert element '+JSON.stringify(x));
      if(predicate(x))return n+1;
    }
    throw new Error('Cannot reach '+label+' by '+key+' within '+limit+' steps');
   }
   try{
    await page.goto(origin+'/?r='+encodeRecipe(recipe),{waitUntil:'domcontentloaded'});
    await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
    await page.reload({waitUntil:'domcontentloaded'});
    const editTabs=await seek('Tab',x=>x.id==='mobileEdit','Edit destination');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(()=>document.body.classList.contains('mobile-edit-open')),true);
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'mobileDismissHandle');
    const categoryTabs=await seek('Tab',x=>x.id==='tab-layout','initial editor category');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'tab-path',
      'ArrowRight must select/focus Path category, not merely change a visual marker');
    assert.equal(await page.locator('#tab-path').getAttribute('aria-selected'),'true');
    const focusTabs=await seek('Tab',x=>x.className.includes('editor-focus-toggle'),'Focus control');
    assert.equal((await read()).inViewport,true,'Focus keyboard destination offscreen');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.editor-focus-toggle').getAttribute('aria-pressed'),'true');
    const chipsTabs=await seek('Tab',x=>x.className.includes('editor-focus-chip'),'first Focus parameter',30);
    assert.ok((await read()).centerHit,'Selected Focus chip is visually occluded');
    await page.keyboard.press('End');
    assert.equal(await page.locator('.editor-focus-chip').last().getAttribute('aria-pressed'),'true');
    const sourceBefore=current(page);
    const sliderTabs=await seek('Tab',x=>x.className.includes('editor-focus-slider')&&x.tag==='INPUT',
      'focused original slider',10);
    assert.ok(await page.locator('.editor-focus-slider').isEnabled(),'Wave source slider is unavailable');
    assert.ok((await read()).centerHit,'Focused slider has no visible hit target');
    await page.keyboard.press('ArrowRight');
    const after=current(page);
    assert.notDeepEqual(after,sourceBefore,'Keyboard range adjustment did nothing');
    const changed=Object.keys(after).filter(key=>JSON.stringify(after[key])!==JSON.stringify(sourceBefore[key]));
    assert.equal(changed.length,1,'Keyboard Focus slider changed unrelated fields: '+changed);
    const allTabs=await seek('Shift+Tab',x=>x.className.includes('editor-focus-all'),
      'return to All controls',15);
    assert.ok((await read()).centerHit,'All controls is keyboard-focused behind an obstruction');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.editor-focus-toggle').getAttribute('aria-pressed'),'false');
    assert.deepEqual(current(page),after,'Returning to All discarded keyboard edit');
    assert.deepEqual(pageErrors,[],'Browser errors during keyboard traversal');
    evidence.push({viewport:[width,height],theme,
      steps:{editTabs,categoryTabs,focusTabs,chipsTabs,sliderTabs,allTabs},
      changedField:changed[0],recipePreserved:true,keyEvents:trace.length});
    await page.screenshot({path:join(out,theme+'-'+width+'x'+height+'.png'),animations:'disabled'});
    console.log('INDEPENDENT_KEYBOARD_FOCUS',JSON.stringify(evidence.at(-1)));
   }catch(e){
    errors.push({viewport:[width,height],theme,error:String(e),stack:e.stack,
      trace:trace.slice(-45),pageErrors});
    await page.screenshot({path:join(out,'failure-'+theme+'-'+width+'x'+height+'.png'),
      animations:'disabled'}).catch(()=>{});
   }finally{await context.close();}
  }
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({evidence,errors,
   classification:errors.length?'NOT VERIFIED':'bounded actual keyboard-only Chromium behavior',
   limitations:['No screen-reader speech or OS focus announcement','Not all editor categories/disabled states',
     'No physical keyboard or Android TalkBack']},null,2));
 assert.deepEqual(errors,[],'Cold keyboard Focus navigation failed');
 assert.equal(evidence.length,4);
 console.log('INDEPENDENT_KEYBOARD_FOCUS_SUCCESS');
}finally{await browser.close();}
