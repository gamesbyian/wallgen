#!/usr/bin/env node
/** Real Chromium regression: two live tabs share Saved without stale writes. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:412,height:892},isMobile:true,hasTouch:true});
  const a=await context.newPage(), b=await context.newPage();
  const first=normalizeRecipe({seed:'agent4-tab-a'});
  const second=normalizeRecipe({seed:'agent4-tab-b'});
  const key='wallgen:favorites:v1';
  await a.goto(origin+'/?r='+encodeRecipe(first),{waitUntil:'domcontentloaded'});
  await b.goto(origin+'/?r='+encodeRecipe(second),{waitUntil:'domcontentloaded'});
  await b.locator('#mobileSaved').click();
  await a.locator('#mobileFavorite').click();
  await b.waitForFunction(()=>document.querySelectorAll('#gallery .thumb').length===1);
  assert.equal(await b.locator('#gallery .thumb').first().getAttribute('data-recipe-seed'),first.seed);
  await b.locator('#mobileStudio').click();
  await b.locator('#mobileFavorite').click();
  await a.waitForFunction(()=>JSON.parse(localStorage.getItem('wallgen:favorites:v1')).length===2);
  await a.locator('#mobileSaved').click();
  await a.waitForFunction(()=>document.querySelectorAll('#gallery .thumb').length===2);
  assert.deepEqual((await a.locator('#gallery .thumb').evaluateAll(cards=>cards.map(c=>c.dataset.recipeSeed))).sort(),[first.seed,second.seed].sort());
  // Another tab removes a design. Existing Saved view must react immediately.
  await b.locator('#mobileFavorite').click();
  await a.waitForFunction(()=>document.querySelectorAll('#gallery .thumb').length===1);
  assert.equal(await a.locator('#gallery .thumb').first().getAttribute('data-recipe-seed'),first.seed);
  assert.equal(await a.locator('#mobileFavorite').getAttribute('aria-pressed'),'true');
  await a.locator('#mobileStudio').click();
  await a.locator('#mobileFavorite').click();
  await b.waitForFunction(()=>localStorage.getItem('wallgen:favorites:v1')==='[]');
  assert.equal(await b.locator('#mobileFavorite').getAttribute('aria-pressed'),'false');
  assert.deepEqual(await b.evaluate(key=>JSON.parse(localStorage.getItem(key)),key),[]);
  console.log('AGENT4_TWO_TAB_SAVED_SUCCESS');
  await context.close();
}finally{await browser.close();}
