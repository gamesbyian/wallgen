#!/usr/bin/env node
/**
 * Agent 4 adversarial REAL DESKTOP Saved test.
 * Same-tab favourite mutations must refresh an already open Saved view,
 * independently of cross-tab storage events and without erasing Explore.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/agent4-local-saved');
await mkdir(out,{recursive:true});
const original=normalizeRecipe({seed:'a4-local-saved-A',structure:'radial',
  radialMode:'pinwheel',rayCount:21,viewZoom:.75,lockedSettings:['radialMode']});
const alternate=normalizeRecipe({seed:'a4-local-saved-B',structure:'regions',
  regionMode:'nested',regionCount:21,material:'linen',viewPanY:10});
const browser=await chromium.launch({headless:true});
const results=[],errors=[];
try{
 for(const width of [1280,840]){
   const context=await browser.newContext({viewport:{width,height:900},
     reducedMotion:'reduce'});
   const page=await context.newPage();
   page.setDefaultTimeout(15000);
   page.on('pageerror',error=>errors.push(String(error)));
   try{
     await page.goto(origin+'/?r='+encodeRecipe(original),
       {waitUntil:'domcontentloaded'});
     const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
     assert.deepEqual(current(),original);
     const favorite=page.locator('#favorite');
     const saved=page.locator('#showFavorites');
     const cards=page.locator('#gallery .thumb');
     const waitSaved=async seeds=>{
       await page.waitForFunction(expected=>
         document.querySelector('#gallery')?.dataset.view==='saved' &&
         document.querySelector('#gallery').getAttribute('aria-busy')!=='true' &&
         JSON.stringify([...document.querySelectorAll('#gallery .thumb')]
           .map(node=>node.dataset.recipeSeed))===JSON.stringify(expected),
         seeds,{timeout:10000});
     };
     await favorite.click();
     assert.equal(await favorite.getAttribute('aria-pressed'),'true');
     await saved.click();
     await waitSaved([original.seed]);
     assert.equal(await page.locator('#favoriteCount').textContent(),'1');

     // Same page, same wallpaper, no storage event: Saved should shrink.
     await favorite.click();
     await waitSaved([]);
     assert.equal(await page.locator('#favoriteCount').textContent(),'0');
     assert.equal(await favorite.getAttribute('aria-pressed'),'false');
     assert.match(await page.locator('#gallery').textContent(),
       /Nothing saved yet/);

     await favorite.click();
     await waitSaved([original.seed]);
     assert.equal(await page.locator('#favoriteCount').textContent(),'1');

     // Import a second already-authored design via URL reload: Saved should
     // retain the previous entry, then reflect additions and removals in situ.
     await page.goto(origin+'/?r='+encodeRecipe(alternate),{
       waitUntil:'domcontentloaded'});
     await favorite.click();
     await saved.click();
     await waitSaved([alternate.seed,original.seed]);
     await favorite.click();
     await waitSaved([original.seed]);
     assert.deepEqual(current(),alternate,
       'Favourite mutation changed wallpaper source state');
     await cards.first().click();
     assert.deepEqual(current(),original,
       'Remaining gallery item lost its complete source recipe');
     assert.equal(await page.locator('#favoriteCount').textContent(),'1');
     assert.deepEqual(errors,[]);
     const row={width,localRemoval:true,localReadd:true,
       staleCardsRejected:true,exactSavedRestore:true};
     results.push(row);
     console.log('AGENT4_LOCAL_SAVED_PASS',JSON.stringify(row));
   }catch(error){
     errors.push({width,message:String(error),stack:error.stack});
     await page.screenshot({path:join(out,'failure-'+width+'.png'),
       animations:'disabled'}).catch(()=>{});
   }finally{await context.close();}
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({
   status:errors.length?'not verified':'passed real desktop Saved local mutation',
   results,errors,
   exclusions:['native operating system','all zoom/recipe types','human aesthetic review']
 },null,2));
 assert.deepEqual(errors,[],'Local Saved mutation browser acceptance failed');
 console.log('AGENT4_LOCAL_SAVED_SUCCESS');
}finally{await browser.close();}
