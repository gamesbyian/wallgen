#!/usr/bin/env node
/**
 * Agent 3 A/B acceptance: original source fields vs opt-in Focus.
 * Count actual post-navigation gestures, compare full recipes, and reject
 * locked/inactive proxy writes. Browser UI actions, no synthetic DOM events.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve(process.env.ROYGBIV_EDITOR_AB_OUT||'artifacts/agent3-editor-focus-ab');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const evidence=[],failures=[];
async function setup(recipe,category,tool){
  const page=await browser.newPage({viewport:{width:412,height:892},
    isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  page.setDefaultTimeout(18000);
  await page.goto(origin+'/?r='+encodeRecipe(normalizeRecipe(recipe)),
    {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.body.classList.contains('mobile-five-nav'));
  await page.locator('#mobileEdit').click();
  await page.locator('#tab-'+category).click();
  await page.locator('[data-editor-tool="'+tool+'"].editor-tool-tab').click();
  assert.equal(await page.locator('[data-editor-tool="'+tool+'"].editor-tool-card').isVisible(),true);
  return page;
}
const current=p=>decodeRecipe(new URL(p.url()).searchParams.get('r'));
const card=p=>p.locator('.editor-tool-card:not([hidden])');
const focus=p=>p.locator('.editor-focus-toggle');
const chip=(p,key)=>p.locator('.editor-focus-chip[data-focus-key="'+key+'"]');
function expectedDelta(before,after,key,delta){
  assert.equal(after[key],before[key]+delta,key+' moved by unexpected amount');
  assert.deepEqual(after,normalizeRecipe({...before,[key]:after[key]}),
    'Changing '+key+' contaminated another recipe field');
}
async function capture(page,name){
  await page.screenshot({path:join(out,name+'.png'),animations:'disabled'});
}
try{
  // Same initial recipe and same one-step intent in both interfaces.
  for(const item of [
    {name:'path-depth',category:'path',tool:'geometry',key:'shapeDepth',
      base:{seed:'a3-ab-path',structure:'paths',geometry:'wave',shapeDepth:48}},
    {name:'material-strength',category:'material',tool:'finish1',key:'textureStrength',
      base:{seed:'a3-ab-material',structure:'paths',material:'linen',
        textureStrength:48,textureScale:65,textureRotation:17}}
  ]){
    let full,one;
    try{
      full=await setup(item.base,item.category,item.tool);
      const original=current(full);
      const field=card(full).locator('input[type="range"][name="'+item.key+'"]');
      assert.ok(await field.isVisible(),'Full inspector missing '+item.key);
      assert.ok(await field.isEnabled(),'Full inspector improperly disabled '+item.key);
      await field.focus(); // original control is focusable; keyboard is real
      await full.keyboard.press('ArrowRight');
      const fullResult=current(full);
      const increment=fullResult[item.key]-original[item.key];
      assert.ok(increment>0,'Full inspector keyboard failed to adjust '+item.key);
      expectedDelta(original,fullResult,item.key,increment);
      await capture(full,item.name+'-all');

      one=await setup(item.base,item.category,item.tool);
      assert.deepEqual(current(one),original,'A/B starting recipes differ');
      await focus(one).click();
      assert.equal(await focus(one).getAttribute('aria-pressed'),'true');
      await chip(one,item.key).click();
      assert.equal(await one.locator('.editor-focus-slider').isEnabled(),true);
      assert.equal(await one.locator('.editor-focus-slider').getAttribute('aria-label')?.then(Boolean),true);
      await one.locator('.editor-focus-step[aria-label="Increase focused parameter"]').click();
      const focusResult=current(one);
      assert.deepEqual(focusResult,fullResult,
        item.name+': Focus did not use exactly the original source adjustment');
      assert.equal(await one.locator('.editor-focus-value').textContent(),
        String(focusResult[item.key]));
      await capture(one,item.name+'-focus');
      await one.locator('.editor-focus-all').click();
      assert.equal(await fieldOn(one,item.key).isVisible(),true,
        'All controls did not restore the original field');
      assert.deepEqual(current(one),fullResult,'Leaving Focus changed the recipe');
      evidence.push({journey:item.name,field:item.key,step:increment,
        fullActionsAfterTool:['focus source slider','ArrowRight'],
        focusActionsAfterTool:['Focus','choose source parameter','+'],
        fullGestures:2,focusGestures:3,recipesIdentical:true,
        allExitRetained:true});
    }finally{await full?.close();await one?.close();}
  }
  // A contextually inactive Path scalar is selectable but cannot be edited.
  {
    const p=await setup({seed:'a3-ab-inactive',geometry:'straight',
      shapeDepth:44},'path','geometry');
    try{
      const before=current(p);
      const source=card(p).locator('input[name="shapeDepth"]');
      assert.equal(await source.isDisabled(),true);
      await focus(p).click();
      await chip(p,'shapeDepth').click();
      assert.equal(await p.locator('.editor-focus-slider').isDisabled(),true);
      assert.match(await p.locator('.editor-focus-help').textContent(),/inactive/i);
      assert.equal(await p.locator('.editor-focus-step[aria-label="Increase focused parameter"]').isDisabled(),true);
      assert.deepEqual(current(p),before,'Inactive Focus control changed saved value');
      await capture(p,'path-inactive-focus');
      evidence.push({journey:'path-inactive',sourceDisabled:true,focusDisabled:true,
        help:'contextually inactive',recipeUnchanged:true});
    }finally{await p.close();}
  }
  // A user lock is not conflated with applicability: original remains locked
  // after mode switches and Focus cannot bypass it.
  {
    const p=await setup({seed:'a3-ab-locked',material:'linen',
      textureStrength:63,lockedSettings:['textureStrength']},
      'material','finish1');
    try{
      const before=current(p);
      assert.equal(await card(p).locator('input[name="textureStrength"]').isDisabled(),true);
      await focus(p).click();
      await chip(p,'textureStrength').click();
      assert.equal(await p.locator('.editor-focus-slider').isDisabled(),true);
      assert.match(await p.locator('.editor-focus-help').textContent(),/locked/i);
      assert.deepEqual(current(p),before,'Locked source value changed under Focus');
      await p.locator('.editor-focus-all').click();
      assert.equal(await card(p).locator('input[name="textureStrength"]').isDisabled(),true);
      assert.deepEqual(current(p),before,'Focus exit bypassed Material lock');
      await capture(p,'material-locked-all');
      evidence.push({journey:'material-locked',originalLock:true,
        focusLock:true,recipeUnchanged:true,allExitRetained:true});
    }finally{await p.close();}
  }
  // Colour is selectors/checkboxes: no scalar ranges to proxy. Focus must
  // say so and provide a real return route, leaving source controls usable.
  {
    const p=await setup({seed:'a3-ab-colour',palette:'classic',
      reverseStripes:false},'colour','rainbow');
    try{
      const before=current(p);
      await focus(p).click();
      assert.equal(await p.locator('#controls').evaluate(el=>
        el.classList.contains('editor-focus-empty')),true);
      assert.equal(await p.locator('.editor-focus-slider-row').isVisible(),false);
      assert.match(await p.locator('.editor-focus-help').textContent(),/no sliders/i);
      assert.deepEqual(current(p),before,'Empty Focus mutated Colour values');
      await capture(p,'colour-no-sliders');
      await p.locator('.editor-focus-all').click();
      const checkbox=card(p).locator('input[name="reverseStripes"]');
      await checkbox.check();
      assert.deepEqual(current(p),normalizeRecipe({...before,reverseStripes:true}));
      evidence.push({journey:'colour-nonrange',focusEmpty:true,
        otherControlsAvailableAfterExit:true,colourChangeSaved:true});
    }finally{await p.close();}
  }
}catch(e){failures.push({message:String(e),stack:e.stack});throw e;}
finally{
  await writeFile(join(out,'evidence.json'),JSON.stringify({
    baseline:'latest main, real Chromium 412x892',
    classification:failures.length?'NOT VERIFIED':'bounded A/B behavior verified',
    recommendation:'Retain All controls by default pending human comparative usability testing.',
    limitations:['Interaction count is an operational proxy, not user preference.',
      'No native Android, screen-reader narration, or human A/B participants.',
      'All settings beyond tested Path, Material and Colour branches remain unqualified.'],
    evidence,failures
  },null,2));
  await browser.close();
}
console.log('AGENT3_EDITOR_FOCUS_AB_SUCCESS');
function fieldOn(page,key){return card(page).locator('input[name="'+key+'"]');}
