#!/usr/bin/env node
/** Agent 3: actual mobile More/status clipboard and favourite announcements. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe} from '../src/model.js';

const out=resolve('artifacts/agent3-global-status');
await mkdir(out,{recursive:true});
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const cases=[],errors=[];
try{
  const context=await browser.newContext({viewport:{width:412,height:892},
    acceptDownloads:true,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await context.grantPermissions(['clipboard-read','clipboard-write'],{origin});
  const page=await context.newPage();
  page.setDefaultTimeout(14000);
  const recipe=normalizeRecipe({seed:'a3-status-source',structure:'radial',
    radialMode:'pinwheel',rayCount:17});
  await page.goto(origin+'/?r='+encodeRecipe(recipe),{waitUntil:'domcontentloaded'});
  const status=page.locator('#studioStatus');
  const semantics=await status.evaluate(el=>({
    role:el.getAttribute('role'),live:el.getAttribute('aria-live'),
    atomic:el.getAttribute('aria-atomic')
  }));
  assert.deepEqual(semantics,{role:'status',live:'polite',atomic:'true'});
  const record=async (name,pattern)=>{
    const text=await status.textContent();
    assert.match(text,pattern,name+' lost visible accessible status');
    const original=await page.locator('#notice').textContent();
    assert.equal(original,text,'original/global status diverged from studio status');
    cases.push({name,text});
    console.log('AGENT3_STATUS',name,JSON.stringify(text));
  };
  await page.locator('#mobileFavorite').click();
  await record('favorite-add',/Added to favourites/);
  await page.locator('#mobileFavorite').click();
  await record('favorite-remove',/Removed from favourites/);
  await page.locator('#mobileMore').click();
  assert.equal(await page.locator('#mobileMore').getAttribute('aria-current'),'page');
  await page.locator('#copyRecipe').click();
  await record('copy-recipe',/Copied to clipboard/);
  const copied=await page.evaluate(()=>navigator.clipboard.readText());
  assert.deepEqual(JSON.parse(copied),recipe);
  await page.locator('#copyLink').click();
  await record('copy-link',/Copied to clipboard/);
  const link=await page.evaluate(()=>navigator.clipboard.readText());
  assert.equal(new URL(link).searchParams.get('r'),new URL(page.url()).searchParams.get('r'));
  const capture=page.waitForEvent('download');
  await page.locator('#downloadRecipe').click();
  const download=await capture;
  assert.match(download.suggestedFilename(),/a3-status-source\.json$/);
  cases.push({name:'json-file-output',filename:download.suggestedFilename()});
  await page.locator('#mobileToolsClose').click();
  await page.locator('#mobileEdit').click();
  await page.locator('#tab-colour').click();
  await page.locator('.editor-tool-chooser [data-editor-tool="rainbow"]').click();
  const reverse=page.locator('.editor-tool-card[data-editor-tool="rainbow"] [name="reverseStripes"]');
  await reverse.setChecked(!recipe.reverseStripes);
  await page.locator('#undo').click();
  await record('undo',/Undid last design change/);
  const noticeHistory=cases.map(x=>x.text).filter(Boolean);
  assert.equal(noticeHistory.length,5);
  await writeFile(join(out,'evidence.json'),JSON.stringify({classification:'real browser status+output journey',
    semantics,cases,exclusions:['native screen-reader voice','all status branches',
      'OS download integration','canonical visual fidelity']},null,2));
  console.log('AGENT3_GLOBAL_STATUS_SUCCESS');
  await context.close();
}catch(error){
  errors.push({message:String(error),stack:error.stack});
  await writeFile(join(out,'failure.json'),JSON.stringify({classification:'not verified',errors,cases},null,2));
  throw error;
}finally{await browser.close()}
