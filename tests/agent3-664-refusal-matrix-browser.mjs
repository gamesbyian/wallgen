#!/usr/bin/env node
/** Opt-in genuine Chromium input-file -> production importer -> accessible
 * refusal/qualified editable recipe. Independent source art never comes from
 * ROYGBIV. No native Android, TalkBack, physical Pixel or human validation.
 *
 * First generate metadata-free source art through the standalone Canvas2D
 * source author (not the production renderer):
 *   node scripts/review-reconstruction-external-pigments.mjs --collection gapped-hue --out-dir artifacts/agent3-refusal-sources-gapped
 *   node scripts/review-reconstruction-external-pigments.mjs --collection low-chroma --out-dir artifacts/agent3-refusal-sources-low
 *   node scripts/review-reconstruction-external-pigments.mjs --collection sparse-hue --out-dir artifacts/agent3-refusal-sources-sparse
 */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {extractPngRecipe} from '../src/png-metadata.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/agent3-664-refusal-matrix');
const cases=[
 {id:'gapped-red-green-blue',group:'gapped',mode:'skipped'},
 {id:'gapped-five-colours',group:'gapped',mode:'skipped'},
 {id:'neutral-seven-control',group:'low',mode:'neutral'},
 {id:'leading-three-control',group:'gapped',mode:'editable'},
 {id:'leading-five-control',group:'gapped',mode:'editable'},
 {id:'contiguous-red-orange',group:'sparse',mode:'editable'}
];
const dirs={gapped:'artifacts/agent3-refusal-sources-gapped',
 low:'artifacts/agent3-refusal-sources-low',
 sparse:'artifacts/agent3-refusal-sources-sparse'};
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const reports=[];
try{
 for(const [width,height] of [[320,700],[412,892]]){
  const context=await browser.newContext({viewport:{width,height},
   isMobile:true,hasTouch:true,acceptDownloads:true,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[],remote=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('request',r=>{if(r.url().startsWith('https://api.github.com/'))remote.push(r.url());});
  try{
   await page.goto(origin,{waitUntil:'domcontentloaded'});
   for(const {id,group,mode} of cases){
    const file=resolve(dirs[group],id+'.png');
    const source=await readFile(file),hash=createHash('sha256').update(source).digest('hex');
    assert.equal(extractPngRecipe(source),null,'source must have NO embedded recipe');
    await page.locator('#imagePathFile').setInputFiles(file);
    await page.locator('#imagePathDialog[open]').waitFor({state:'visible'});
    let status;
    if(mode!=='editable'){
      const element=page.locator('#imageRecipeUnavailable');
      await element.waitFor({state:'visible',timeout:60000});
      status=await element.textContent();
      assert.match(status,/No (faithful|reliable) editable recipe/);
      assert.match(status,/source image is unchanged/);
      if(mode==='skipped')assert.match(status,/skip earlier ROYGBIV slots/);
      if(mode==='neutral')assert.doesNotMatch(status,/skip earlier ROYGBIV slots/,
       'grey source is unsupported for a DIFFERENT reason');
      assert.equal(await element.getAttribute('role'),'status');
      assert.equal(await element.getAttribute('aria-live'),'polite');
      assert.equal(await page.locator('#imageRecipeWorkspace').isVisible(),false);
      assert.equal(await page.locator('#imageRecipeCandidate option').count(),0);
      assert.equal(await page.locator('#imageRecipeApply').isEnabled(),false);
    }else{
      await page.waitForFunction(()=>{
       const card=document.querySelector('#imageRecipeWorkspace');
       const options=document.querySelector('#imageRecipeCandidate');
       const apply=document.querySelector('#imageRecipeApply');
       return card?.hidden===false&&options?.options.length>0&&!apply.disabled;
      },null,{timeout:90000});
      status=await page.locator('#imageRecipeStatus').textContent();
      assert.match(status,/lower is better/);
      assert.equal(await page.locator('#imageRecipeUnavailable').isVisible(),false,
       'a previous source refusal must not leak into valid import');
      const choices=await page.locator('#imageRecipeCandidate option').allTextContents();
      assert.ok(choices.some(x=>/pigment silhouettes|observed|circle/i.test(x)),
       'qualified source-visible geometry must remain available: '+choices);
    }
    await page.screenshot({path:join(out,width+'x'+height+'-'+id+'.png'),animations:'disabled'});
    assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'),hash);
    const entry={viewport:[width,height],case:id,mode,status,hash,sourceUnchanged:true};
    reports.push(entry);
    console.log('AGENT3_REFUSAL_MATRIX_CASE '+JSON.stringify(entry));
   }
   await page.locator('#imagePathCancel').click();
   await page.locator('#imagePathDialog').waitFor({state:'hidden'});
   assert.equal(await page.locator('#imageRecipeUnavailable').textContent(),'');
   assert.deepEqual(remote,[],'no automatic private GitHub upload');
   assert.deepEqual(errors,[],'no unhandled JavaScript exceptions');
  }finally{await context.close();}
 }
 await writeFile(join(out,'report.json'),JSON.stringify({
  schema:'roygbiv-agent3-664-source-refusal-matrix/v1',
  evidence:'genuine-Chromium-portrait-source-input',
  physicalPixel:'NOT TESTED',nativeIME:'NOT TESTED',
  nativeTalkBack:'NOT TESTED',humanUsability:'NOT TESTED',reports
 },null,2)+'\n');
 console.log('AGENT3_REFUSAL_MATRIX_PASS '+JSON.stringify({
  cases:reports.length,viewports:[[320,700],[412,892]],noRemote:true,
  authenticSourceFiles:true}));
}finally{await browser.close();}
