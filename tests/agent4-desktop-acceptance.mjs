#!/usr/bin/env node
/**
 * Desktop independent counterpart to mobile Agent 4 tests. Uses source gallery
 * and metadata buttons at 1024×768, never hidden mobile dock proxies.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/agent4-desktop');
await mkdir(out,{recursive:true});
const complete=normalizeRecipe({seed:'a4-desktop-saved',structure:'radial',
  radialMode:'pinwheel',viewZoom:1.25,material:'linen',
  lockedSettings:['material','radialMode']});
const base=normalizeRecipe({seed:'a4-desktop-current'});
const browser=await chromium.launch({headless:true});
const evidence=[],errors=[];
try{
 for(const theme of ['cream','dark']){
  const context=await browser.newContext({viewport:{width:1024,height:768},
    reducedMotion:'reduce',acceptDownloads:true});
  const page=await context.newPage();
  page.setDefaultTimeout(16000);
  page.on('pageerror',e=>errors.push({theme,message:String(e)}));
  const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
  try{
   await page.goto(origin+'/?r='+encodeRecipe(base),{waitUntil:'domcontentloaded'});
   await page.evaluate(({theme,complete})=>{
     localStorage.setItem('roygbiv:studio-theme:v1',theme);
     localStorage.setItem('wallgen:favorites:v1',JSON.stringify(
       [null,complete,{seed:''},'damaged']));
   },{theme,complete});
   await page.reload({waitUntil:'domcontentloaded'});
   assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),theme);
   const buttons=['#showFavorites','#batch','#favorite','#metadataToggle',
     '#downloadRecipe','#importRecipePNG'];
   const geometry={};
   for(const selector of buttons){
     const el=page.locator(selector);
     await el.scrollIntoViewIfNeeded();
     geometry[selector]=await el.evaluate(node=>{
       const r=node.getBoundingClientRect();
       const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
       return {width:r.width,height:r.height,
         visible:r.width>0&&r.height>0,hit:hit===node||node.contains(hit),
         title:node.getAttribute('aria-label')||node.textContent.trim()||node.title};
     });
     assert.ok(geometry[selector].visible&&geometry[selector].hit,
       selector+' is not pointer reachable on desktop');
     assert.ok(geometry[selector].width>=24&&geometry[selector].height>=24,
       selector+' below 24px desktop input minimum');
     assert.ok(geometry[selector].title,selector+' unnamed');
   }
   await page.locator('#showFavorites').focus();
   await page.keyboard.press('Enter');
   await page.waitForFunction(()=>document.querySelectorAll('#gallery .thumb').length===1
     && document.getElementById('gallery').getAttribute('aria-busy')!=='true');
   assert.deepEqual(await page.locator('#gallery .thumb').evaluateAll(cards=>
     cards.map(x=>x.dataset.recipeSeed)),[complete.seed]);
   await page.locator('#gallery .thumb').focus();
   await page.keyboard.press('Enter');
   assert.deepEqual(current(),complete,
     'Desktop restoration must replace prior locks and all recipe options');
   await page.locator('#batch').click();
   await page.waitForFunction(()=>document.querySelectorAll('#gallery .thumb').length===12
     && document.getElementById('gallery').getAttribute('aria-busy')!=='true',
     null,{timeout:90000});
   const explore=await page.locator('#gallery .thumb').evaluateAll(cards=>
     cards.map(x=>x.dataset.recipeSeed));
   assert.equal(new Set(explore).size,12);
   await page.locator('#showFavorites').click();
   await page.waitForFunction(()=>document.querySelectorAll('#gallery .thumb').length===1
     && document.getElementById('gallery').getAttribute('aria-busy')!=='true');
   assert.equal(await page.locator('#gallery .thumb').first().getAttribute('title'),
     'Open variation 1');
   await page.locator('#metadataToggle').click();
   assert.equal(await page.locator('#metadataToggle').getAttribute('aria-expanded'),'true');
   await page.locator('#metadataPanel [name=title]').fill('Agent4 desktop metadata');
   assert.equal(await page.locator('#metadataPanel [name=title]').inputValue(),
     'Agent4 desktop metadata');
   await page.screenshot({path:join(out,'desktop-'+theme+'.png'),
     animations:'disabled'});
   evidence.push({theme,viewport:[1024,768],geometry,
     corruptedStorageRecovered:true,keyboardSavedRestore:true,
     exactLockedRecipe:true,exploreUnique:explore.length,
     desktopMetadataReachable:true});
   console.log('AGENT4_DESKTOP_QUALIFIED',JSON.stringify(evidence.at(-1)));
  }catch(e){errors.push({theme,message:String(e),stack:e.stack});
   await page.screenshot({path:join(out,'failure-'+theme+'.png'),
     animations:'disabled'}).catch(()=>{});}
  finally{await context.close();}
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({
  classification:errors.length?'not verified':'real desktop browser gallery/keyboard/metadata',
  evidence,errors,limits:['not physical screen reader','not every desktop editor control',
    'independent Saved and Explore navigation is primarily a mobile destination contract']
 },null,2));
 assert.deepEqual(errors,[],'Desktop source action acceptance failed');
 console.log('AGENT4_DESKTOP_SUCCESS');
}finally{await browser.close();}
