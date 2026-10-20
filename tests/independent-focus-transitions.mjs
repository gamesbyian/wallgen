#!/usr/bin/env node
/**
 * Stateful negative journeys omitted by static Focus A/B snapshots.
 * Lock → unlock, slider mutation, empty Colour, viewport handoff, motion changes.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/independent-focus-transitions');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const rows=[],failures=[];
const initial=normalizeRecipe({seed:'focus-transition-qa',structure:'paths',
  geometry:'wave',material:'linen',textureStrength:45,shapeDepth:40});
const current=page=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
try{
 for(const [width,height] of [[412,892],[700,412]]){
  for(const theme of ['cream','dark']){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,
     isMobile:true,reducedMotion:'reduce'});
   const page=await context.newPage();page.setDefaultTimeout(18000);
   const jsErrors=[];page.on('pageerror',e=>jsErrors.push(String(e)));
   try{
    await page.goto(origin+'/?r='+encodeRecipe(initial),{waitUntil:'domcontentloaded'});
    await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#mobileEdit').click();
    await page.locator('#tab-material').click();
    await page.locator('[data-editor-tool="finish1"].editor-tool-tab').click();
    const toggle=page.locator('.editor-focus-toggle');
    await toggle.click();
    await page.locator('.editor-focus-chip[data-focus-key="textureStrength"]').click();
    const source=page.locator('.editor-tool-card:not([hidden]) input[name="textureStrength"]');
    const slider=page.locator('.editor-focus-slider');
    const lock=page.locator('.editor-focus-lock');
    assert.equal(await slider.isEnabled(),true);
    assert.equal(await lock.isEnabled(),true,'An active Material lock must be usable in Focus');
    const before=current(page);
    await lock.click();
    const locked=current(page);
    assert.ok(locked.lockedSettings.includes('textureStrength'),
      'Focus lock failed to preserve the exact user lock');
    assert.equal(await source.isDisabled(),true);
    assert.equal(await slider.isDisabled(),true);
    assert.match(await page.locator('.editor-focus-help').innerText(),/locked/i);
    assert.equal(await lock.getAttribute('aria-pressed'),'true');
    assert.equal(locked.textureStrength,before.textureStrength);
    await lock.click();
    const unlocked=current(page);
    assert.equal(unlocked.lockedSettings.includes('textureStrength'),false);
    assert.equal(await source.isEnabled(),true);
    assert.equal(await slider.isEnabled(),true);
    assert.equal(await lock.getAttribute('aria-pressed'),'false');
    await page.locator('.editor-focus-step[aria-label="Increase focused parameter"]').click();
    const modified=current(page);
    assert.ok(modified.textureStrength>before.textureStrength);
    assert.deepEqual(modified,normalizeRecipe({...before,textureStrength:modified.textureStrength}),
      'Lock/unlock/adjust should not contaminate the recipe');
    // Media query transition should close Focus, not retain hidden active state.
    await page.setViewportSize({width:791,height});
    await page.waitForFunction(()=>!document.getElementById('controls')?.classList.contains('editor-focus-active'));
    assert.equal(await toggle.getAttribute('aria-pressed'),'false');
    assert.deepEqual(current(page),modified);
    await page.setViewportSize({width,height});
    assert.equal(await toggle.getAttribute('aria-pressed'),'false');
    assert.deepEqual(current(page),modified);
    // Breakpoint switches intentionally close the mobile sheet; reopen through
    // its genuine dock button before navigating to the next tool family.
    await page.locator('#mobileEdit').click();
    // The original parameter and Colour checkbox remain independently usable.
    await page.locator('#tab-colour').click();
    await page.locator('[data-editor-tool="rainbow"].editor-tool-tab').click();
    await toggle.click();
    assert.equal(await page.locator('#controls').evaluate(el=>el.classList.contains('editor-focus-empty')),true);
    assert.match(await page.locator('.editor-focus-help').innerText(),/no sliders/i);
    assert.equal(await page.locator('.editor-focus-slider-row').isVisible(),false);
    const beforeColour=current(page);
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.deepEqual(current(page),beforeColour,'Motion preference changed saved composition');
    await page.locator('.editor-focus-all').click();
    assert.equal(await page.locator('.editor-tool-card:not([hidden]) input[name="reverseStripes"]').isEnabled(),true);
    assert.deepEqual(current(page),beforeColour);
    assert.deepEqual(jsErrors,[],'Javascript errors during state transitions');
    const result={viewport:[width,height],theme,sequence:[
      'Material Focus','source lock','source unlock','source +',
      '791px desktop handoff','mobile return','Colour empty Focus','reduced-motion switch',
      'All original controls'],sameRecipeOutsideExplicitAdjustment:true};
    rows.push(result);
    await page.screenshot({path:join(out,theme+'-'+width+'x'+height+'.png'),animations:'disabled'});
    console.log('FOCUS_TRANSITION',JSON.stringify(result));
   }catch(e){
    failures.push({viewport:[width,height],theme,error:String(e),stack:e.stack,jsErrors});
    await page.screenshot({path:join(out,'failed-'+theme+'-'+width+'x'+height+'.png'),
      animations:'disabled'}).catch(()=>{});
   }finally{await context.close();}
  }
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({rows,failures,
  classification:failures.length?'NOT VERIFIED':'bounded real-browser transition verified',
  limitations:['No human preference review','No physical Android browser or AT',
    'Additional dynamic editors and source locks are untested']},null,2));
 assert.deepEqual(failures,[],'Focus state-transition negative test failed');
 console.log('INDEPENDENT_FOCUS_TRANSITIONS_SUCCESS');
}finally{await browser.close();}
