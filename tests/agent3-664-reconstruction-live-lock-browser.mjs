#!/usr/bin/env node
// Independent Chromium proof: a live lock changed after the actual image
// fit must invalidate that score instead of committing a different artwork.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
import {extractPngRecipe} from '../src/png-metadata.js';
const source=resolve('artifacts/agent3-680-source/16-offset-jagged.no-metadata.png');
const out=resolve('artifacts/agent3-680-lock-browser');
await mkdir(out,{recursive:true});
const bytes=await readFile(source);
assert.equal(extractPngRecipe(bytes),null,'source must not contain recipe truth');
const base=normalizeRecipe({seed:'agent3-late-lock',structure:'paths',
  geometry:'wave',background:'black'});
const browser=await chromium.launch({headless:true});
const report={viewport:[412,892],fixture:'current-painter 16-offset-jagged metadata-free',
  physicalAndroid:'NOT TESTED',humanUse:'NOT TESTED'};
try{
 const context=await browser.newContext({viewport:{width:412,height:892},
   isMobile:true,hasTouch:true,acceptDownloads:true,reducedMotion:'reduce'});
 const page=await context.newPage(),errors=[],external=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('request',r=>{if(r.url().startsWith('https://api.github.com/'))external.push(r.url());});
 page.setDefaultTimeout(30000);
 const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
 const ready=async()=>{
   await page.waitForFunction(()=>{
     const button=document.getElementById('imageRecipeApply'),
       dialog=document.getElementById('imagePathDialog');
     return !!(dialog?.open&&button&&!button.disabled);
   },null,{timeout:120000});
 };
 const openFixture=async()=>{await page.locator('#imagePathFile').setInputFiles(source);await ready();};
 try{
  await page.goto('http://127.0.0.1:4173/?r='+encodeRecipe(base),
    {waitUntil:'domcontentloaded'});
  await openFixture();
  const firstChoice=await page.locator('#imageRecipeCandidate').inputValue();
  const firstLabel=await page.locator('#imageRecipeCandidate option:checked').textContent();
  assert.match(firstLabel,/cropped hue silhouettes/,
    'actual source should offer new editable cropped shape candidate');
  await page.evaluate(()=>{
    const lock=document.querySelector('[data-lock-key="structure"]');
    if(!lock)throw Error('Live Structure lock control missing');
    lock.click(); // source lock event while modal stays open; not physical fingertap
  });
  assert.ok(current().lockedSettings.includes('structure'),
    'source lock handler did not update authoritative recipe');
  await page.locator('#imageRecipeApply').tap();
  assert.equal(await page.locator('#imagePathDialog').evaluate(x=>x.open),true,
    'stale, scored candidate was allowed to close dialog');
  assert.match(await page.locator('#imageRecipeStatus').textContent(),
    /Locks changed\. Re-import image\./);
  const lineFit=await page.locator('#imageRecipeStatus').evaluate(el=>({
    height:el.clientHeight,scrollHeight:el.scrollHeight
  }));
  assert.ok(lineFit.scrollHeight<=lineFit.height+1,
    'mobile fit-refusal notice clips its own two-line status');
  assert.equal(await page.locator('#imageRecipeApply').isDisabled(),true);
  assert.equal(current().structure,'paths','creator locked Structure was overwritten');
  assert.equal(current().reconstructionOrigin,undefined,
    'refused preview must not falsely claim inferred provenance');
  await page.screenshot({path:join(out,'late-lock-refused.png'),animations:'disabled'});
  report.lateLock={preservedStructure:true,refusedStaleFit:true,
    modalStayedOpen:true,noFalseProvenance:true,firstChoice,firstLabel};
  await page.locator('#imagePathCancel').tap();
  await page.evaluate(()=>document.querySelector('[data-lock-key="structure"]').click());
  assert.ok(!current().lockedSettings.includes('structure'));
  await openFixture();
  const acceptedLabel=await page.locator('#imageRecipeCandidate option:checked').textContent();
  assert.match(acceptedLabel,/cropped hue silhouettes/);
  await page.locator('#imageRecipeApply').tap();
  assert.equal(await page.locator('#imagePathDialog').evaluate(x=>x.open),false);
  const inferred=current();
  assert.equal(inferred.structure,'regions');
  assert.equal(inferred.scatteredShapeKind,'imported');
  assert.equal(inferred.reconstructionOrigin.candidateKind,'shape-repeats');
  assert.equal(inferred.reconstructionOrigin.origin,'inferred-image');
  assert.equal(inferred.scatteredOverrides.length,7);
  await page.screenshot({path:join(out,'editable-accepted.png'),animations:'disabled'});
  const [download]=await Promise.all([
    page.waitForEvent('download',{timeout:120000}),
    page.locator('#mobileDownload').tap()
  ]);
  const png=new Uint8Array(await readFile(await download.path()));
  assert.ok(png.length>100000,'visible production PNG unexpectedly tiny');
  assert.deepEqual(extractPngRecipe(png),inferred,
    'full-resolution PNG did not retain editable inferred provenance');
  await page.locator('#mobileEdit').tap();
  await page.locator('#undo').tap();
  const undone=current();
  assert.equal(undone.reconstructionOrigin,undefined);
  assert.equal(undone.structure,'paths');
  report.accepted={label:acceptedLabel,kind:inferred.reconstructionOrigin.candidateKind,
    sevenEditableStamps:true,visibleFullPngBytes:png.length,
    exactRecipeFromPng:true,undoRestoredOriginal:true};
  assert.deepEqual(errors,[]);
  assert.deepEqual(external,[]);
  report.pageErrors=0;report.unsolicitedApiRequests=0;
  await writeFile(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('AGENT3_RECON_LATE_LOCK_PASS '+JSON.stringify(report));
 }catch(e){
  await page.screenshot({path:join(out,'failure.png')}).catch(()=>{});
  throw e;
 }finally{await context.close();}
}finally{await browser.close()}
