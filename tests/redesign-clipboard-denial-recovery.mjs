#!/usr/bin/env node
/**
 * Agent 3 negative clipboard permission path, followed by actual recovery.
 * Browser permission override is test-only; real source button and handler run.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve(process.env.ROYGBIV_CLIPBOARD_NEG_OUT||'artifacts/agent3-clipboard-denial');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const witnesses=[];
try{
  const context=await browser.newContext({
    viewport:{width:412,height:892},hasTouch:true,isMobile:true,
    reducedMotion:'reduce'
  });
  const page=await context.newPage();
  page.setDefaultTimeout(12000);
  const source=normalizeRecipe({seed:'a3-clipboard-denial',structure:'regions',
    regionMode:'voronoi',regionCount:19,viewZoom:.74,viewPanX:10,
    material:'linen',textureLayer2Enabled:true,material2:'foil',
    lockedSettings:['regionCount','textureRotation2'],
    interiorElements:[{id:'clipboard-interior',type:'line',shape:'loop',
      enabled:true,color:'custom',customColor:'#54aaee',colorSlots:[1,4]}]
  });
  const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
  await page.goto(origin+'/?r='+encodeRecipe(source),{waitUntil:'domcontentloaded'});
  await page.locator('#mobileMore').click();
  assert.equal(await page.locator('#mobileMore').getAttribute('aria-current'),'page');
  // This override denies clipboard-write despite the secure localhost
  // context and the real user gesture, exercising the source catch path.
  await context.grantPermissions([],{origin});
  await page.locator('#copyRecipe').click();
  await page.waitForFunction(()=>/Clipboard blocked by browser/.test(
    document.querySelector('#studioStatus')?.textContent||''));
  const denied=await page.locator('#studioStatus').textContent();
  assert.match(denied,/Clipboard blocked by browser. Try HTTPS or localhost/);
  assert.equal(await page.locator('#notice').textContent(),denied);
  assert.deepEqual(current(),source,'Denied permission changed wallpaper recipe');
  assert.equal(await page.locator('#mobileMore').getAttribute('aria-current'),'page');
  witnesses.push({name:'permission-denied',status:denied,recipePreserved:true,
    moreStillOpen:true});
  console.log('AGENT3_CLIPBOARD_DENIED',JSON.stringify(witnesses.at(-1)));
  // Grant the same browser page explicit clipboard permission again, proving
  // the failed action has not poisoned the handler or future user attempts.
  await context.grantPermissions(['clipboard-read','clipboard-write'],{origin});
  await page.locator('#copyRecipe').click();
  await page.waitForFunction(()=>document.querySelector('#studioStatus')
    ?.textContent==='Copied to clipboard.');
  const text=await page.evaluate(()=>navigator.clipboard.readText());
  assert.deepEqual(JSON.parse(text),source);
  assert.deepEqual(current(),source);
  witnesses.push({name:'recovered-recipe',completeClipboardRecipe:true});
  await page.locator('#copyLink').click();
  const link=await page.evaluate(()=>navigator.clipboard.readText());
  assert.equal(new URL(link).searchParams.get('r'),new URL(page.url()).searchParams.get('r'));
  assert.deepEqual(decodeRecipe(new URL(link).searchParams.get('r')),source);
  witnesses.push({name:'recovered-design-link',exactSource:true});
  await page.screenshot({path:join(out,'clipboard-recovered.png'),animations:'disabled'});
  await writeFile(join(out,'evidence.json'),JSON.stringify({
    classification:'Chromium permission-denial and successful retry browser-verified',
    witnesses,exclusions:['OS clipboard permissions on Android','native assistive speech',
      'every browser vendor and nonsecure origin']},null,2));
  console.log('AGENT3_CLIPBOARD_DENIAL_RECOVERY_SUCCESS');
  await context.close();
}catch(error){
  await writeFile(join(out,'failure.json'),JSON.stringify({
    classification:'not verified',message:String(error),stack:error.stack,witnesses
  },null,2));
  throw error;
}finally{await browser.close()}
