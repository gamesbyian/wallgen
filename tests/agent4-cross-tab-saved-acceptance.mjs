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
  assert.equal(await b.locator('#favoriteCount').textContent(),'1',
    'Cross-tab Saved count did not refresh');
  assert.equal(await b.locator('#favorite .ui-icon').getAttribute('data-roygbiv-icon'),
    'favourite','Unselected second design should have empty heart');

  await b.locator('#mobileStudio').click();
  await b.locator('#mobileFavorite').click();
  await a.waitForFunction(()=>JSON.parse(localStorage.getItem('wallgen:favorites:v1')).length===2);
  await a.waitForFunction(()=>document.getElementById('favoriteCount')?.textContent==='2');
  assert.equal(await a.locator('#favorite .ui-icon').getAttribute('data-roygbiv-icon'),
    'favourite-filled','Source heart icon did not reflect remote favourite');

  await a.locator('#mobileSaved').click();
  await a.waitForFunction(()=>document.querySelectorAll('#gallery .thumb').length===2);
  assert.deepEqual((await a.locator('#gallery .thumb').evaluateAll(cards=>cards.map(c=>c.dataset.recipeSeed))).sort(),[first.seed,second.seed].sort());
  // Another tab removes a design. Existing Saved view must react immediately.
  await b.locator('#mobileFavorite').click();
  await a.waitForFunction(()=>document.querySelectorAll('#gallery .thumb').length===1);
  assert.equal(await a.locator('#gallery .thumb').first().getAttribute('data-recipe-seed'),first.seed);
  assert.equal(await a.locator('#favoriteCount').textContent(),'1');

  assert.equal(await a.locator('#mobileFavorite').getAttribute('aria-pressed'),'true');
  await a.locator('#mobileStudio').click();
  await a.locator('#mobileFavorite').click();
  await b.waitForFunction(()=>localStorage.getItem('wallgen:favorites:v1')==='[]');
  assert.equal(await b.locator('#mobileFavorite').getAttribute('aria-pressed'),'false');
  assert.deepEqual(await b.evaluate(key=>JSON.parse(localStorage.getItem(key)),key),[]);
  assert.equal(await b.locator('#favoriteCount').textContent(),'0',
    'Remote removal left a stale visible count');
  assert.equal(await b.locator('#favorite .ui-icon').getAttribute('data-roygbiv-icon'),
    'favourite');
  // Switch favourites while another tab is still painting a populated Saved
  // contact sheet. The final view must not regain stale thumbnail cards.
  await b.locator('#mobileStudio').click();
  await b.locator('#mobileSaved').click();
  await b.waitForFunction(()=>document.querySelector('#mobileSaved')
    ?.getAttribute('aria-current')==='page');
  const many=Array.from({length:30},(_,i)=>normalizeRecipe({
    seed:'a4-stale-tab-'+i,structure:i%2?'regions':'radial',
    regionMode:'nested',radialMode:'pinwheel'
  }));
  await a.evaluate(([storageKey,items])=>
    localStorage.setItem(storageKey,JSON.stringify(items)),[key,many]);
  await a.evaluate(([storageKey,items])=>
    localStorage.setItem(storageKey,JSON.stringify(items)),[key,[first,second]]);
  try{
    await b.waitForFunction(()=>document.querySelector('#gallery')?.dataset.view==='saved'
      && document.querySelector('#gallery').getAttribute('aria-busy')!=='true'
      && document.querySelectorAll('#gallery .thumb').length===2,null,{timeout:12000});
  }catch(error){
    const state=await b.evaluate(()=>({
      mode:document.querySelector('#gallery')?.dataset.view,
      busy:document.querySelector('#gallery')?.getAttribute('aria-busy'),
      dock:document.querySelector('#mobileActionDock [aria-current="page"]')?.id,
      panelOpen:document.body.classList.contains('mobile-gallery-open'),
      seeds:[...document.querySelectorAll('#gallery .thumb')].map(c=>c.dataset.recipeSeed),
      favoriteCount:document.querySelector('#favoriteCount')?.textContent,
      localSeeds:JSON.parse(localStorage.getItem('wallgen:favorites:v1')||'[]')
        .map(recipe=>recipe.seed)
    }));
    console.error('AGENT4_TWO_TAB_RACE_DIAGNOSTIC',JSON.stringify(state));
    throw error;
  }
  assert.deepEqual(await b.locator('#gallery .thumb').evaluateAll(cards=>
    cards.map(c=>c.dataset.recipeSeed)),[first.seed,second.seed],
    'Cancelled thumbnail batch contaminated remote Saved updates');
  assert.equal(await b.locator('#favoriteCount').textContent(),'2');
  assert.equal(await b.locator('#showFavorites').isEnabled(),true,
    'Cancelled gallery reload left Saved control disabled');
  assert.equal(await b.locator('#showFavorites').getAttribute('data-previous'),null,
    'Cancelled gallery reload corrupted the original source button text');
  await a.evaluate(storageKey=>localStorage.setItem(storageKey,'{bad json'),key);
  await b.waitForFunction(()=>document.querySelectorAll('#gallery .thumb').length===0
    && document.querySelector('#gallery').getAttribute('aria-busy')!=='true');
  assert.equal(await b.locator('#favoriteCount').textContent(),'0');
  await a.evaluate(([storageKey,items])=>
    localStorage.setItem(storageKey,JSON.stringify(items)),[key,[second]]);
  await b.waitForFunction(()=>document.querySelectorAll('#gallery .thumb').length===1
    && document.querySelector('#gallery .thumb')?.dataset.recipeSeed==='agent4-tab-b');
  assert.equal(await b.locator('#favorite .ui-icon').getAttribute('data-roygbiv-icon'),
    'favourite-filled');
  await a.evaluate(()=>localStorage.clear());
  await b.waitForFunction(()=>document.querySelectorAll('#gallery .thumb').length===0
    && document.querySelector('#favoriteCount')?.textContent==='0');
  assert.equal(await b.locator('#favorite .ui-icon').getAttribute('data-roygbiv-icon'),
    'favourite');

  console.log('AGENT4_TWO_TAB_SAVED_SUCCESS');
  await context.close();
}finally{await browser.close();}
