#!/usr/bin/env node
/**
 * Independent source-vs-Focus Undo parity after ONE native keyboard edit.
 * A Focus proxy dispatches delegated input/change; it must create exactly the
 * same reversible canonical history as native source input, with no double
 * checkpoint and no stale Focus value after Undo.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {encodeRecipe,normalizeRecipe,decodeRecipe} from '../src/model.js';
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/independent-focus-undo-ab');
await mkdir(out,{recursive:true});
const cases=[
 {id:'path-depth-portrait',size:[412,892],theme:'cream',
  category:'path',tool:'geometry',key:'shapeDepth',
  source:{seed:'qa-undo-path',structure:'paths',geometry:'wave',shapeDepth:48}},
 {id:'material-strength-landscape',size:[700,412],theme:'dark',
  category:'material',tool:'finish1',key:'textureStrength',
  source:{seed:'qa-undo-material',structure:'paths',material:'linen',textureStrength:42}},
 {id:'radial-count-portrait',size:[412,892],theme:'dark',
  category:'path',tool:'rays',key:'rayCount',
  source:{seed:'qa-undo-radial',structure:'radial',radialMode:'pinwheel',rayCount:21}},
 {id:'region-jitter-portrait',size:[412,892],theme:'cream',
  category:'path',tool:'region-detail',key:'regionJitter',
  source:{seed:'qa-undo-regions',structure:'regions',regionMode:'voronoi',regionJitter:45}}
];
const browser=await chromium.launch({headless:true});
const evidence=[],failures=[];
const current=p=>decodeRecipe(new URL(p.url()).searchParams.get('r'));
async function open(item){
 const context=await browser.newContext({viewport:{width:item.size[0],height:item.size[1]},
   isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const page=await context.newPage();page.setDefaultTimeout(17000);
 await page.goto(origin+'/?r='+encodeRecipe(normalizeRecipe(item.source)),
   {waitUntil:'domcontentloaded'});
 await page.evaluate(theme=>localStorage.setItem('roygbiv:studio-theme:v1',theme),item.theme);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('#mobileEdit').click();
 await page.locator('#tab-'+item.category).click();
 await page.locator('.editor-tool-tab[data-editor-tool="'+item.tool+'"]').click();
 return {context,page};
}
try{
 for(const item of cases){
  let a,b,step='setup';const errors=[];
  try{
   a=await open(item);b=await open(item);
   const source=a.page,focus=b.page;
   source.on('pageerror',e=>errors.push('All: '+String(e)));
   focus.on('pageerror',e=>errors.push('Focus: '+String(e)));
   const original=current(source);
   assert.deepEqual(current(focus),original);
   const sourceInput=source.locator('.editor-tool-card:not([hidden]) input[name="'+item.key+'"]');
   const originalFocus=focus.locator('.editor-tool-card:not([hidden]) input[name="'+item.key+'"]');
   assert.equal(await sourceInput.isEnabled(),true);
   assert.equal(await originalFocus.isEnabled(),true);
   assert.equal(await source.locator('#undo').isDisabled(),true,
     'All setup already has Undo history');
   assert.equal(await focus.locator('#undo').isDisabled(),true,
     'Focus setup already has Undo history');
   step='native keyboard source vs Focus';
   await focus.locator('.editor-focus-toggle').click();
   await focus.locator('.editor-focus-chip[data-focus-key="'+item.key+'"]').click();
   const proxy=focus.locator('.editor-focus-slider');
   assert.equal(await proxy.isEnabled(),true);
   assert.equal(await proxy.inputValue(),await sourceInput.inputValue());
   await sourceInput.focus();await source.keyboard.press('ArrowRight');
   await proxy.focus();await focus.keyboard.press('ArrowRight');
   const allEdit=current(source),focusEdit=current(focus);
   assert.notDeepEqual(allEdit,original,item.id+' source did not edit');
   assert.deepEqual(focusEdit,allEdit,item.id+' proxy altered different recipe');
   step='Undo stack depth';
   const srcUndo=source.locator('#undo'),focusUndo=focus.locator('#undo');
   assert.equal(await srcUndo.isEnabled(),true,item.id+' source lacks Undo');
   assert.equal(await focusUndo.isEnabled(),true,item.id+' Focus lacks Undo');
   const srcTitle=await srcUndo.getAttribute('title'),focusTitle=await focusUndo.getAttribute('title');
   assert.equal(focusTitle,srcTitle,item.id+' mismatched history checkpoint counts');
   assert.match(srcTitle,/Undo \(1 available\)/,
     item.id+' one native range edit should generate one checkpoint');
   step='Undo source vs Focus';
   await srcUndo.click();
   await focusUndo.click();
   assert.deepEqual(current(source),original,item.id+' All Undo wrong recipe');
   assert.deepEqual(current(focus),original,item.id+' Focus Undo wrong recipe');
   assert.equal(await srcUndo.isDisabled(),true,item.id+' All has unexpected extra history');
   assert.equal(await focusUndo.isDisabled(),true,item.id+' Focus has unexpected extra history');
   assert.equal(await focus.locator('.editor-focus-toggle').getAttribute('aria-pressed'),'true');
   assert.equal(await proxy.inputValue(),await originalFocus.inputValue(),
     item.id+' Focus range not synchronized after Undo');
   assert.equal(await focus.locator('.editor-focus-value').innerText(),
     await originalFocus.inputValue(),item.id+' Focus output stale after Undo');
   assert.deepEqual(errors,[]);
   evidence.push({scenario:item.id,viewport:item.size,theme:item.theme,
     key:item.key,historyTitle:srcTitle,sourceAndFocusSame:true,
     undoRestoredRecipe:true,extraCheckpoints:false,proxyResynced:true});
   await focus.screenshot({path:join(out,item.id+'.png'),animations:'disabled'});
   console.log('INDEPENDENT_FOCUS_UNDO_AB',JSON.stringify(evidence.at(-1)));
  }catch(e){
   failures.push({scenario:item.id,step,error:String(e),stack:e.stack,
    runtimeErrors:errors});
   await b?.page.screenshot({path:join(out,'failure-'+item.id+'.png'),
    animations:'disabled'}).catch(()=>{});
  }finally{await a?.context.close();await b?.context.close();}
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({evidence,failures,
  classification:failures.length?'NOT VERIFIED':'bounded real-browser source/Focus Undo parity',
  limitations:['Four deliberately selected source ranges','No physical AT or human preference assessment']},null,2));
 assert.deepEqual(failures,[],'Source versus Focus Undo history parity failed');
 assert.equal(evidence.length,cases.length);
 console.log('INDEPENDENT_FOCUS_UNDO_AB_SUCCESS');
}finally{await browser.close();}
