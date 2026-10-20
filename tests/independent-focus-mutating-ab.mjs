#!/usr/bin/env node
/**
 * Independent mutating Focus/All A/B: actual ArrowRight then ArrowLeft on
 * identical source vs Focus ranges. Assert full recipe parity, reversibility,
 * keyboard-visible source controls and no hidden state contamination.
 * Does not imply human preference, AT speech or physical-device approval.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {EDITOR_CATEGORIES} from '../src/editor-schema.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/independent-focus-keyboard-ab');
await mkdir(out,{recursive:true});
const cases=[
 {id:'paths-cream',size:[412,892],theme:'cream',recipe:{
  seed:'focus-mutate-path',structure:'paths',geometry:'wave',
  shapeDepth:43,material:'linen',textureStrength:44}},
 {id:'paths-dark-short',size:[700,412],theme:'dark',recipe:{
  seed:'focus-mutate-short',structure:'paths',geometry:'arc',material:'grain',
  shapeDepth:54,textureStrength:45}},
 {id:'radial-dark',size:[412,892],theme:'dark',recipe:{
  seed:'focus-mutate-radial',structure:'radial',radialMode:'pinwheel',
  rayCount:24,material:'linen'}},
 {id:'regions-cream',size:[412,892],theme:'cream',recipe:{
  seed:'focus-mutate-regions',structure:'regions',regionMode:'voronoi',
  regionCount:17,material:'grain'}},
 {id:'regions-dark-short',size:[700,412],theme:'dark',recipe:{
  seed:'focus-mutate-regions-short',structure:'regions',regionMode:'nested',
  regionCount:11,material:'linen'}}
];
const browser=await chromium.launch({headless:true});
const findings=[],failures=[];
const current=page=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
async function setup(scene){
 const [width,height]=scene.size;
 const context=await browser.newContext({viewport:{width,height},isMobile:true,
   hasTouch:true,reducedMotion:'reduce'});
 const page=await context.newPage();page.setDefaultTimeout(15000);
 const recipe=normalizeRecipe(scene.recipe);
 await page.goto(origin+'/?r='+encodeRecipe(recipe),{waitUntil:'domcontentloaded'});
 await page.evaluate(theme=>localStorage.setItem('roygbiv:studio-theme:v1',theme),scene.theme);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('#mobileEdit').click();
 return {page,context};
}
try{
 for(const scene of cases){
  let lhs,rhs,where='setup';
  const visit={scene:scene.id,viewport:scene.size,theme:scene.theme,
    fields:[],skipped:[],families:{},diffs:[],repairs:0};
  const runtimeErrors=[];
  try{
   lhs=await setup(scene);rhs=await setup(scene);
   const a=lhs.page,b=rhs.page;
   a.on('pageerror',e=>runtimeErrors.push('All: '+String(e)));
   b.on('pageerror',e=>runtimeErrors.push('Focus: '+String(e)));
   assert.deepEqual(current(a),current(b));
   const first=current(a);
   for(const category of EDITOR_CATEGORIES){
    where='category '+category.id;
    if(!(await a.locator('#tab-'+category.id).isEnabled())){
     visit.skipped.push({category:category.id,reason:'disabled category'});continue;
    }
    await a.locator('#tab-'+category.id).click();
    await b.locator('#tab-'+category.id).click();
    let perCategory=0;
    for(const tool of category.tools){
     if(perCategory>=2)break; // Deliberately bounded mutation budget per family.
     where='tool '+category.id+'/'+tool.id;
     const selector='.editor-tool-chooser .editor-tool-tab[data-editor-tool="'+tool.id+'"]';
     const button=a.locator(selector);
     if(await button.count()!==1||!await button.isVisible()||!await button.isEnabled()){
      visit.skipped.push({category:category.id,tool:tool.id,reason:'not applicable'});
      continue;
     }
     await button.click();await b.locator(selector).click();
     const fields=await a.locator('.editor-tool-card:not([hidden]) input[type="range"][name]')
       .evaluateAll(els=>els.filter(el=>!el.closest('[hidden]')&&!el.disabled)
         .map(el=>({key:el.name,value:Number(el.value),
           min:Number(el.min),max:Number(el.max),step:Number(el.step)||1}))
         .filter(el=>Number.isFinite(el.value)&&
           el.value>=el.min+el.step*.75&&el.value<=el.max-el.step*.75));
     if(!fields.length){
       visit.skipped.push({category:category.id,tool:tool.id,
        reason:'no enabled interior-valued range'});continue;
     }
     const sample=fields[0],key=sample.key;
     where='edit '+category.id+'/'+tool.id+'/'+key;
     const before=current(a);
     assert.deepEqual(current(b),before,where+' A/B precondition');
     const originalA=a.locator('.editor-tool-card:not([hidden]) input[type="range"][name="'+key+'"]');
     const originalB=b.locator('.editor-tool-card:not([hidden]) input[type="range"][name="'+key+'"]');
     assert.equal(await originalA.isEnabled(),true);
     assert.equal(await originalB.inputValue(),await originalA.inputValue());
     await b.locator('.editor-focus-toggle').click();
     await b.locator('.editor-focus-chip[data-focus-key="'+key+'"]').click();
     const focused=b.locator('.editor-focus-slider');
     assert.equal(await focused.isEnabled(),true,where+' focus disabled');
     assert.equal(await focused.inputValue(),await originalA.inputValue(),where+' starting value');
     await originalA.focus();await a.keyboard.press('ArrowRight');
     await focused.focus();await b.keyboard.press('ArrowRight');
     // Compare after real native keyboard input/change, not synthetic DOM events.
     const allPlus=current(a),focusPlus=current(b);
     assert.notDeepEqual(allPlus,before,where+' All key caused no recipe edit');
     assert.deepEqual(focusPlus,allPlus,where+' different full recipes after ArrowRight');
     await a.keyboard.press('ArrowLeft');
     await b.keyboard.press('ArrowLeft');
     const allBack=current(a),focusBack=current(b);
     assert.deepEqual(focusBack,allBack,where+' reverse keyboard recipe mismatch');
     assert.deepEqual(allBack,before,where+' source setting failed to reverse');
     await b.locator('.editor-focus-all').click();
     assert.equal(await b.locator('.editor-focus-toggle').getAttribute('aria-pressed'),'false');
     assert.deepEqual(current(b),before,where+' Focus exit changed recipe');
     perCategory++;
     visit.fields.push({category:category.id,tool:tool.id,key,
       before:before[key],increased:allPlus[key],restored:allBack[key]});
    }
    visit.families[category.id]=perCategory;
   }
   assert.ok(visit.fields.length>=5,'Insufficient distinct mutating tool samples');
   assert.deepEqual(current(a),first);
   assert.deepEqual(current(b),first);
   assert.deepEqual(runtimeErrors,[]);
   findings.push(visit);
   await b.screenshot({path:join(out,scene.id+'.png'),animations:'disabled'});
   console.log('INDEPENDENT_FOCUS_MUTATION',JSON.stringify({scene:scene.id,
    edits:visit.fields.length,families:visit.families,skipped:visit.skipped.length}));
  }catch(e){
   failures.push({scene:scene.id,where,error:String(e),stack:e.stack,visit,
     runtimeErrors});
   await rhs?.page.screenshot({path:join(out,'failed-'+scene.id+'.png'),
    animations:'disabled'}).catch(()=>{});
  }finally{await lhs?.context.close();await rhs?.context.close();}
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({findings,failures,
  classification:failures.length?'NOT VERIFIED':'bounded source-vs-Focus keyboard edit parity',
  limitations:['Two-browser Chromium comparison, not human UX preference',
   'Max two mutating source fields per category in five scenes',
   'No real device, assistive-technology speech or all-keyboard cold entry']},null,2));
 assert.deepEqual(failures,[],'Focus versus All keyboard mutation A/B failed');
 assert.equal(findings.length,cases.length);
 console.log('INDEPENDENT_FOCUS_MUTATION_SUCCESS');
}finally{await browser.close();}
