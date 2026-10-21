#!/usr/bin/env node
/**
 * Independent Focus/All keyboard and state-transition counterexample probe.
 * Real Chromium key presses and pointer actions; no synthetic click/input.
 * Evidence is conditional on successful execution, never source-only signoff.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/independent-focus-qa');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const rows=[],failures=[];
const samples=[
  {id:'path-live',category:'path',tool:'geometry',key:'shapeDepth',
   recipe:{seed:'independent-path-live',structure:'paths',geometry:'wave',shapeDepth:48}},
  {id:'path-inactive',category:'path',tool:'geometry',key:'shapeDepth',
   recipe:{seed:'independent-path-inactive',structure:'paths',geometry:'straight',shapeDepth:44},unavailable:'inactive'},
  {id:'material-live',category:'material',tool:'finish1',key:'textureStrength',
   recipe:{seed:'independent-material-live',material:'linen',textureStrength:48}},
  {id:'material-locked',category:'material',tool:'finish1',key:'textureStrength',
   recipe:{seed:'independent-material-locked',material:'linen',textureStrength:63,
     lockedSettings:['textureStrength']},unavailable:'locked'},
  {id:'colour-no-range',category:'colour',tool:'rainbow',
   recipe:{seed:'independent-colour',palette:'classic',reverseStripes:false}}
];
function recipe(page){return decodeRecipe(new URL(page.url()).searchParams.get('r'));}
async function go(page,item){
  await page.goto(origin+'/?r='+encodeRecipe(normalizeRecipe(item.recipe)),{waitUntil:'domcontentloaded'});
  await page.locator('#mobileEdit').click();
  await page.locator('#tab-'+item.category).click();
  await page.locator('[data-editor-tool="'+item.tool+'"].editor-tool-tab').click();
  assert.ok(await page.locator('[data-editor-tool="'+item.tool+'"].editor-tool-card').isVisible());
}
try{
 for(const viewport of [[320,700],[412,892],[700,412]]){
  for(const theme of ['cream','dark']){
   for(const item of samples){
    const context=await browser.newContext({viewport:{width:viewport[0],height:viewport[1]},
      isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    const page=await context.newPage();page.setDefaultTimeout(16000);
    const jsErrors=[];
    page.on('pageerror',e=>jsErrors.push(String(e)));
    try{
     await go(page,item);
     await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
     await page.reload({waitUntil:'domcontentloaded'});
     await page.locator('#mobileEdit').click();
     await page.locator('#tab-'+item.category).click();
     await page.locator('[data-editor-tool="'+item.tool+'"].editor-tool-tab').click();
     const before=recipe(page);
     const allFields=await page.locator('.editor-tool-card:not([hidden]) input[type=range][name]').evaluateAll(els=>
       els.filter(e=>!e.closest('[hidden]')).map(e=>({name:e.name,value:e.value,disabled:e.disabled})));
     const toggle=page.locator('.editor-focus-toggle');
     assert.equal(await toggle.getAttribute('aria-pressed'),'false','All must be default');
     await toggle.click();
     assert.equal(await toggle.getAttribute('aria-pressed'),'true');
     // A clickable element must be genuinely exposed at the actual viewport,
     // not merely report isVisible() while another surface occludes its centre.
     const hit=await page.locator('.editor-focus-all').evaluate(el=>{
       const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
       const top=document.elementFromPoint(x,y);
       const points=[.18,.5,.82].flatMap(fy=>[.18,.5,.82].map(fx=>{
         const owner=document.elementFromPoint(r.left+r.width*fx,r.top+r.height*fy);
         return owner===el||el.contains(owner);
       }));
       return {width:r.width,height:r.height,
         inside:x>=0&&y>=0&&x<innerWidth&&y<innerHeight,
         centerHit:top===el||el.contains(top),nineUnobstructed:points.every(Boolean)};
     });
     assert.ok(hit.inside&&hit.centerHit&&hit.width>=44&&hit.height>=44&&
       hit.nineUnobstructed,
       'Focus → All native exit must expose an unobstructed 44px hit region: '+
       JSON.stringify(hit));
     const chips=page.locator('.editor-focus-chip[data-focus-key]');
     assert.equal(await chips.count(),allFields.length,'Focus chips must match original visible sliders');
     if(allFields.length){
       // A horizontally scrollable chip strip deliberately clips noncurrent
       // choices. Scroll each REAL source button into view before probing
       // pointer ownership; testing offscreen rectangles falsely reports an
       // overlap and would reward deleting accessible overflow.
       const measured=[];
       for(let i=0;i<await chips.count();i++){
         const chip=chips.nth(i);
         await chip.scrollIntoViewIfNeeded();
         const box=await chip.evaluate(el=>{
           const r=el.getBoundingClientRect();
           const hits=[.18,.5,.82].flatMap(fy=>[.18,.5,.82].map(fx=>{
             const owner=document.elementFromPoint(r.left+r.width*fx,r.top+r.height*fy);
             return owner===el||el.contains(owner);
           }));
           return {key:el.dataset.focusKey,width:r.width,height:r.height,
             nineUnobstructed:hits.every(Boolean)};
         });
         measured.push(box);
       }
       assert.ok(measured.every(v=>v.width>=44&&v.height>=44&&v.nineUnobstructed),
         'Each scrolled-into-view Focus chip needs 44px and unobstructed 3x3 regions: '+
         JSON.stringify(measured));
     }
     if(item.key){
      const chosen=page.locator('.editor-focus-chip[data-focus-key="'+item.key+'"]');
      assert.equal(await chosen.count(),1,'Missing Focus representation for '+item.key);
      await chosen.click();
      const source=allFields.find(f=>f.name===item.key);
      assert.ok(source,'Missing source field');
      const proxy=page.locator('.editor-focus-slider');
      assert.equal(await proxy.isDisabled(),Boolean(source.disabled));
      assert.equal(await proxy.inputValue(),source.value);
      if(item.unavailable){
       assert.match(await page.locator('.editor-focus-help').innerText(),new RegExp(item.unavailable,'i'));
       assert.ok(await page.locator('.editor-focus-step[aria-label="Increase focused parameter"]').isDisabled());
       assert.deepEqual(recipe(page),before,'Focus changed disabled/locked recipe');
      }else{
       await page.locator('.editor-focus-step[aria-label="Increase focused parameter"]').click();
       const after=recipe(page);
       assert.notEqual(after[item.key],before[item.key],'Focus + did not change live field');
       assert.deepEqual(after,normalizeRecipe({...before,[item.key]:after[item.key]}),
         'Focus step changed unrelated recipe fields');
      }
      // Source chip keyboard is roving; Home/End must change the selected chip
      // without changing recipe state or moving focus into hidden All controls.
      if(allFields.length>1){
       await chosen.focus();
       const stable=recipe(page);
       await page.keyboard.press('End');
       assert.equal(await chips.last().getAttribute('aria-pressed'),'true');
       await page.keyboard.press('Home');
       assert.equal(await chips.first().getAttribute('aria-pressed'),'true');
       assert.deepEqual(recipe(page),stable,'Keyboard chip navigation mutated recipe');
      }
     }else{
      assert.equal(await chips.count(),0,'Colour no-slider Focus should not invent parameters');
      assert.match(await page.locator('.editor-focus-help').innerText(),/no sliders/i);
      assert.deepEqual(recipe(page),before);
     }
     const focusedRecipe=recipe(page);
     await page.locator('.editor-focus-all').tap();
     assert.equal(await toggle.getAttribute('aria-pressed'),'false');
     assert.deepEqual(recipe(page),focusedRecipe,'All exit lost Focus edit');
     // Reopening and closing must not accumulate listeners or mutate the saved recipe.
     await toggle.click();
     await page.locator('.editor-focus-all').click();
     assert.deepEqual(recipe(page),focusedRecipe,'Repeated toggle changed recipe');
     assert.deepEqual(jsErrors,[],'Browser runtime errors');
     const observation={viewport,theme,id:item.id,sourceRanges:allFields.length,
       matchedChips:allFields.length,unavailable:item.unavailable||null,
       exactStatePreserved:true,keyboardRovingChecked:allFields.length>1};
     rows.push(observation);
     await page.screenshot({path:join(out,item.id+'-'+theme+'-'+viewport.join('x')+'.png'),
       animations:'disabled'});
     console.log('FOCUS_INDEPENDENT',JSON.stringify(observation));
    }catch(error){
     failures.push({viewport,theme,id:item.id,error:String(error),stack:error.stack,jsErrors});
     await page.screenshot({path:join(out,'failure-'+item.id+'-'+theme+'-'+viewport.join('x')+'.png'),
       animations:'disabled'}).catch(()=>{});
    }finally{await context.close();}
   }
  }
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({rows,failures,
   classification:failures.length?'NOT VERIFIED':'bounded real-browser behaviour verified',
   limitations:['No human A/B preference study','No physical Android or TalkBack',
     'Not every conditional recipe or screen-reader announcement',
     'Action counts and DOM comparisons are not usability scores']},null,2));
 assert.deepEqual(failures,[],'Independent Focus probe produced counterexamples');
 console.log('INDEPENDENT_FOCUS_QA_SUCCESS');
}finally{await browser.close();}
