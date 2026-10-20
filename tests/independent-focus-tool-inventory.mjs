#!/usr/bin/env node
/**
 * Independent adversarial Focus/All inventory parity. Reads the actual mounted
 * source controls in Chromium, not just the schema; flips the opt-in Focus
 * surface across every runtime applicable named tool in distinct scene modes.
 * Human preference, native hardware and screen-reader speech remain out of scope.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {EDITOR_CATEGORIES} from '../src/editor-schema.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/independent-focus-inventory');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const scenarios=[
 {id:'path-phone-cream',size:[412,892],theme:'cream',source:{
   seed:'focus-inventory-path-a',structure:'paths',geometry:'wave',material:'linen'}},
 {id:'path-landscape-dark',size:[700,412],theme:'dark',source:{
   seed:'focus-inventory-path-b',structure:'paths',geometry:'arc',material:'grain'}},
 {id:'path-locked-cream',size:[412,892],theme:'cream',source:{
   seed:'focus-inventory-locked',structure:'paths',geometry:'wave',material:'linen',
   lockedSettings:['shapeDepth','shapeFrequency','textureStrength','textureScale']}},
 {id:'radial-phone-dark',size:[412,892],theme:'dark',source:{
   seed:'focus-inventory-radial',structure:'radial',radialMode:'pinwheel',rayCount:23,
   material:'linen'}},
 {id:'radial-landscape-cream',size:[700,412],theme:'cream',source:{
   seed:'focus-inventory-radial-short',structure:'radial',radialMode:'rays',rayCount:29,
   material:'grain'}},
 {id:'regions-phone-cream',size:[412,892],theme:'cream',source:{
   seed:'focus-inventory-region',structure:'regions',regionMode:'nested',regionCount:11,
   material:'grain'}},
 {id:'regions-landscape-dark',size:[700,412],theme:'dark',source:{
   seed:'focus-inventory-region-short',structure:'regions',regionMode:'voronoi',
   regionCount:17,material:'linen'}}
];
const observations=[],failures=[];
const current=p=>decodeRecipe(new URL(p.url()).searchParams.get('r'));
try{
 for(const scene of scenarios){
  const [width,height]=scene.size;
  const context=await browser.newContext({viewport:{width,height},
    isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page=await context.newPage();
  page.setDefaultTimeout(16000);
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const entry={scene:scene.id,size:scene.size,theme:scene.theme,
    tools:[],categoryCounts:{},skipped:[],noRange:0,disabled:0,enabled:0};
  let step='setup';
  try{
   const normalized=normalizeRecipe(scene.source);
   await page.goto(origin+'/?r='+encodeRecipe(normalized),{waitUntil:'domcontentloaded'});
   await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),scene.theme);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('#mobileEdit').click();
   assert.ok(await page.locator('#controls').isVisible());
   const initial=current(page);
   const toggle=page.locator('.editor-focus-toggle');
   const all=page.locator('.editor-focus-all');
   for(const category of EDITOR_CATEGORIES){
    step='category '+category.id;
    const tab=page.locator('#tab-'+category.id);
    if(!await tab.isEnabled()){
      entry.skipped.push({category:category.id,reason:'category disabled'});
      continue;
    }
    await tab.click();
    assert.equal(await tab.getAttribute('aria-selected'),'true');
    let categoryCount=0;
    for(const tool of category.tools){
     step='tool '+category.id+'/'+tool.id;
     const toolButton=page.locator('.editor-tool-chooser .editor-tool-tab[data-editor-tool="'+tool.id+'"]');
     if(await toolButton.count()!==1 || !await toolButton.isVisible() ||
        !await toolButton.isEnabled()){
      entry.skipped.push({category:category.id,tool:tool.id,reason:'not runtime-applicable'});
      continue;
     }
     await toolButton.click();
     const card=page.locator('.editor-tool-card[data-editor-tool="'+tool.id+'"]');
     assert.ok(await card.isVisible(),step+' source card absent');
     const before=current(page);
     const ranges=await card.locator('input[type="range"][name]').evaluateAll(els=>
      els.filter(el=>!el.closest('[hidden]')).map(el=>{
       const locked=!!el.closest('.lockable-setting')?.querySelector('.setting-lock.is-locked');
       return {key:el.name,value:el.value,disabled:el.disabled,
         inactive:el.dataset.inactive==='true',locked};
      }));
     await toggle.click();
     assert.equal(await toggle.getAttribute('aria-pressed'),'true');
     const chips=page.locator('.editor-focus-chip[data-focus-key]');
     assert.equal(await chips.count(),ranges.length,
       step+' Focus omitted/added source sliders');
     if(!ranges.length){
       entry.noRange++;
       assert.equal(await page.locator('.editor-focus-slider-row').isVisible(),false,
         step+' sliderless tool leaves a phantom focus range');
       assert.match(await page.locator('.editor-focus-help').innerText(),/no sliders/i);
     }else{
      for(const source of ranges){
       step='parameter '+category.id+'/'+tool.id+'/'+source.key;
       const chip=page.locator('.editor-focus-chip[data-focus-key="'+source.key+'"]');
       assert.equal(await chip.count(),1,step+' parameter chip missing');
       await chip.click();
       assert.equal(await chip.getAttribute('aria-pressed'),'true',step+' selection');
       const slider=page.locator('.editor-focus-slider');
       assert.equal(await slider.inputValue(),source.value,step+' value mismatch');
       const expectedDisabled=source.disabled||source.inactive||source.locked;
       assert.equal(await slider.isDisabled(),expectedDisabled,step+' unavailable state mismatch');
       const name=await slider.getAttribute('aria-label');
       assert.ok(name?.trim(),step+' focused range has no accessible name');
       if(expectedDisabled){
         entry.disabled++;
         const help=await page.locator('.editor-focus-help').innerText();
         assert.match(help,/inactive|locked|unavailable/i,step+' disabled reason unavailable');
       }else entry.enabled++;
       assert.equal(await page.locator('.editor-focus-slider-row').isVisible(),true);
       assert.deepEqual(current(page),before,step+' selection mutated wallpaper recipe');
      }
     }
     await all.click();
     assert.equal(await toggle.getAttribute('aria-pressed'),'false');
     assert.deepEqual(current(page),before,step+' Focus→All mutated the recipe');
     categoryCount++;
     entry.tools.push({category:category.id,tool:tool.id,
       rangeCount:ranges.length,disabled:ranges.filter(x=>x.disabled||x.locked||x.inactive).length});
    }
    entry.categoryCounts[category.id]=categoryCount;
   }
   assert.ok(entry.tools.length>=12,'Too few applicable live tools tested: '+entry.tools.length);
   assert.ok(entry.enabled>0&&entry.noRange>0,'Expected both enabled sliders and sliderless tools');
   assert.deepEqual(current(page),initial,'Tool navigation changed recipe');
   assert.deepEqual(errors,[],'Browser errors during Focus inventory sweep');
   observations.push(entry);
   await page.screenshot({path:join(out,scene.id+'.png'),animations:'disabled'});
   console.log('INDEPENDENT_FOCUS_INVENTORY',JSON.stringify({
     scene:scene.id,tools:entry.tools.length,noRange:entry.noRange,
     enabled:entry.enabled,disabled:entry.disabled,skipped:entry.skipped.length}));
  }catch(e){
   failures.push({scene:scene.id,step,error:String(e),stack:e.stack,entry,runtimeErrors:errors});
   await page.screenshot({path:join(out,'failure-'+scene.id+'.png'),
     animations:'disabled'}).catch(()=>{});
  }finally{await context.close();}
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({
  classification:failures.length?'NOT VERIFIED':'bounded real-browser Focus/All parity',
  observations,failures,limitations:['No physical device or spoken AT',
   'Source input/candidate runtime state tested, not aesthetic equivalence',
   'Not a comparative human interaction preference study']},null,2));
 assert.deepEqual(failures,[],'Independent Focus/All tool matrix found counterexamples');
 assert.equal(observations.length,scenarios.length);
 console.log('INDEPENDENT_FOCUS_INVENTORY_SUCCESS');
}finally{await browser.close();}
