#!/usr/bin/env node
/**
 * Seeded exploratory real-browser Focus adversary.
 * Repeated actual clicks and native keyboard edits with invariant checking
 * after every transition. The seed makes every discovered counterexample
 * reproducible. This is not a human unscripted preference evaluation.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/independent-focus-exploratory');
await mkdir(out,{recursive:true});
const cases=[
 {id:'path-portrait',viewport:[412,892],theme:'cream',seed:0x1984a31,
  recipe:{seed:'explore-qa-path',structure:'paths',geometry:'wave',material:'linen'}},
 {id:'radial-short',viewport:[700,412],theme:'dark',seed:0x82a393b,
  recipe:{seed:'explore-qa-radial',structure:'radial',radialMode:'pinwheel',material:'grain'}},
 {id:'regions-portrait',viewport:[412,892],theme:'dark',seed:0x09fc972,
  recipe:{seed:'explore-qa-regions',structure:'regions',regionMode:'voronoi',material:'linen'}}
];
const browser=await chromium.launch({headless:true});
const outcomes=[],failures=[];
const current=p=>decodeRecipe(new URL(p.url()).searchParams.get('r'));
function rng(seed){
 let x=seed>>>0;
 return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};
}
const sample=(list,next)=>list[Math.floor(next()*list.length)];
async function inventory(page){
 return page.evaluate(()=>{
  const form=document.getElementById('controls');
  const active=form.classList.contains('editor-focus-active');
  const card=document.querySelector('.editor-tool-card:not([hidden])');
  const fields=card?[...card.querySelectorAll('input[type=range][name]')]
   .filter(el=>!el.closest('[hidden]'))
   .map(el=>({key:el.name,value:el.value,disabled:el.disabled,
    inactive:el.dataset.inactive==='true',
    locked:!!el.closest('.lockable-setting')?.querySelector('.setting-lock.is-locked')})):[];
  const chips=[...document.querySelectorAll('.editor-focus-chip[data-focus-key]')]
   .map(el=>({key:el.dataset.focusKey,pressed:el.getAttribute('aria-pressed')==='true'}));
  const slider=document.querySelector('.editor-focus-slider');
  const row=document.querySelector('.editor-focus-slider-row');
  const focusLock=document.querySelector('.editor-focus-lock');
  const category=document.querySelector('.settings-tab[aria-selected=true]')?.dataset.tab||'';
  const tool=document.querySelector('.editor-tool-tab[aria-pressed=true]')?.dataset.editorTool||'';
  return {active,fields,chips,slider:{value:slider?.value,disabled:slider?.disabled,
    name:slider?.getAttribute('aria-label')},rowHidden:row?.hidden,
    category,tool,focusLock:{
      hidden:focusLock?.hidden,disabled:focusLock?.disabled,
      pressed:focusLock?.getAttribute('aria-pressed')==='true'},
    focusHelp:document.querySelector('.editor-focus-help')?.textContent||''};
 });
}
function assertInventory(info,where){
 if(!info.active)return;
 assert.deepEqual(info.chips.map(x=>x.key),info.fields.map(x=>x.key),
   where+' chips not exact original source range inventory');
 if(!info.fields.length){
  assert.equal(info.rowHidden,true,where+' phantom Focus slider');
  assert.match(info.focusHelp,/no sliders/i);
  return;
 }
 const selected=info.chips.filter(x=>x.pressed);
 assert.equal(selected.length,1,where+' expected exactly one pressed chip');
 const source=info.fields.find(x=>x.key===selected[0].key);
 assert.ok(source,where+' selected source detached');
 assert.equal(info.slider.value,source.value,where+' selected slider source value stale');
 assert.equal(info.slider.disabled,
   source.disabled||source.inactive||source.locked,
   where+' Focus disabled state disagrees with original');
 assert.ok(info.slider.name?.trim(),where+' missing accessible slider name');
 assert.equal(info.rowHidden,false);
 if(info.slider.disabled)assert.match(info.focusHelp,/locked|inactive|unavailable/i);
}
try{
 for(const item of cases){
  const [width,height]=item.viewport;
  const context=await browser.newContext({viewport:{width,height},
   isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page=await context.newPage();page.setDefaultTimeout(16000);
  const next=rng(item.seed),history=[],runtimeErrors=[];
  page.on('pageerror',e=>runtimeErrors.push(String(e)));
  let step=0;
  const counts={category:0,tool:0,toggle:0,chip:0,edit:0,lock:0,
   all:0,skipped:0},record={scene:item.id,seed:item.seed,viewport:item.viewport,
   theme:item.theme,steps:55,counts,history};
  try{
   await page.goto(origin+'/?r='+encodeRecipe(normalizeRecipe(item.recipe)),
    {waitUntil:'domcontentloaded'});
   await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),item.theme);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('#mobileEdit').click();
   // A reproducible range-bearing preflight prevents seeded random walks
   // from spending all their time in legitimate sliderless tools. It is
   // explicitly recorded separately from the following 55 random actions.
   const guidedTool=item.id.startsWith('path')?'geometry':
     item.id.startsWith('radial')?'rays':'regions';
   await page.locator('#tab-path').click();counts.category++;
   await page.locator('.editor-tool-chooser .editor-tool-tab[data-editor-tool="'+guidedTool+'"]').click();
   counts.tool++;
   await page.locator('.editor-focus-toggle').click();counts.toggle++;
   const guidedInventory=await inventory(page);
   assertInventory(guidedInventory,item.id+' guided Focus preflight');
   const eligible=guidedInventory.fields.filter(x=>!x.disabled&&!x.inactive&&!x.locked);
   assert.ok(eligible.length,'No original source range for guided '+guidedTool);
   const guidedKey=eligible[0].key;
   for(let k=0;k<2;k++){
    await page.locator('.editor-focus-chip[data-focus-key="'+guidedKey+'"]').click();
    counts.chip++;
   }
   const initialGuided=current(page);
   const proxy=page.locator('.editor-focus-slider');
   await proxy.focus();await page.keyboard.press('ArrowRight');counts.edit++;
   assert.notDeepEqual(current(page),initialGuided,'Guided native Focus adjustment did not commit');
   const lock=page.locator('.editor-focus-lock');
   if(await lock.isVisible()&&await lock.isEnabled()){
    await lock.click();counts.lock++;
    assert.equal(await proxy.isDisabled(),true,'Guided Lock failed to disable its original source');
    await lock.click();counts.lock++;
    assert.equal(await proxy.isEnabled(),true,'Guided Unlock failed to restore its source');
   }
   await proxy.focus();await page.keyboard.press('ArrowLeft');counts.edit++;
   assert.deepEqual(current(page),initialGuided,'Guided native reverse failed');
   await page.locator('.editor-focus-all').click();counts.all++;
   assertInventory(await inventory(page),item.id+' guided exit');
   history.push({step:'guided',action:'real Path '+guidedTool+
     ' Focus ArrowRight/Lock/Unlock/ArrowLeft/All',
    category:'path',tool:guidedTool,focused:false,changed:false});
   for(step=0;step<55;step++){
    const where=item.id+' step '+step;
    const before=current(page),state=await inventory(page);
    assertInventory(state,where+' pre');
    const choice=next();let action='skipped',mutating=false;
    if(choice<.2){
     const eligible=await page.locator('.settings-tab[data-tab]').evaluateAll(els=>
      els.filter(el=>!el.disabled&&el.getAttribute('aria-disabled')!=='true'&&
        el.getBoundingClientRect().width>0).map(el=>el.dataset.tab));
     if(eligible.length){
      const category=sample(eligible,next);
      await page.locator('#tab-'+category).click();
      action='category '+category;counts.category++;
     }
    }else if(choice<.41){
     const tools=await page.locator('.editor-tool-chooser .editor-tool-tab')
      .evaluateAll(els=>els.filter(el=>!el.hidden&&!el.disabled&&
       el.getBoundingClientRect().width>0)
       .map(el=>({category:el.dataset.category,tool:el.dataset.editorTool})));
     if(tools.length){
      const tool=sample(tools,next);
      await page.locator('.editor-tool-chooser .editor-tool-tab[data-category="'+
       tool.category+'"][data-editor-tool="'+tool.tool+'"]').click();
      action='tool '+tool.category+'/'+tool.tool;counts.tool++;
     }
    }else if(choice<.56){
     await page.locator('.editor-focus-toggle').click();
     action='toggle Focus';counts.toggle++;
    }else if(choice<.70&&state.active){
     if(state.chips.length){
      const chip=sample(state.chips,next);
      await page.locator('.editor-focus-chip[data-focus-key="'+chip.key+'"]').click();
      action='chip '+chip.key;counts.chip++;
     }
    }else if(choice<.87&&state.active&&!state.rowHidden&&!state.slider.disabled){
     const useKeyboard=next()<.5;
     if(useKeyboard){
      await page.locator('.editor-focus-slider').focus();
      await page.keyboard.press(next()<.5?'ArrowRight':'ArrowLeft');
     }else{
      const direction=next()<.5?'Increase':'Decrease';
      await page.locator('.editor-focus-step[aria-label="'+direction+' focused parameter"]').click();
     }
     action=useKeyboard?'native Focus arrow':'Focus source step';mutating=true;counts.edit++;
    }else if(choice<.95&&state.active&&!state.rowHidden&&
      !state.focusLock.hidden&&!state.focusLock.disabled&&
      await page.locator('.editor-focus-lock').isVisible()){
     // A sliderless tool hides the entire Focus range row, but the
     // descendant Lock node itself may still have hidden=false. Never
     // manufacture an inaccessible user action against that subtree.
     await page.locator('.editor-focus-lock').click();
     action='source lock/unlock';mutating=true;counts.lock++;
    }else if(state.active){
     await page.locator('.editor-focus-all').click();
     action='return All';counts.all++;
    }
    if(action==='skipped')counts.skipped++;
    const after=current(page),post=await inventory(page);
    assertInventory(post,where+' '+action);
    if(!mutating)assert.deepEqual(after,before,where+' navigation changed recipe');
    assert.deepEqual(after,normalizeRecipe(after),where+' invalid normalized recipe');
    assert.deepEqual(runtimeErrors,[],where+' page error');
    history.push({step,action,category:post.category,tool:post.tool,
     focused:post.active,changed:JSON.stringify(before)!==JSON.stringify(after)});
    if(step===20||step===40)
     await page.screenshot({path:join(out,item.id+'-'+step+'.png'),animations:'disabled'});
   }
   outcomes.push(record);
   await page.screenshot({path:join(out,item.id+'-final.png'),animations:'disabled'});
   console.log('INDEPENDENT_FOCUS_EXPLORATORY',JSON.stringify({
    scene:item.id,seed:item.seed,steps:55,counts}));
  }catch(e){
   failures.push({scene:item.id,step,error:String(e),stack:e.stack,
    lastActions:history.slice(-15),runtimeErrors});
   await page.screenshot({path:join(out,'failure-'+item.id+'-'+step+'.png'),
    animations:'disabled'}).catch(()=>{});
  }finally{await context.close();}
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({outcomes,failures,
  classification:failures.length?'NOT VERIFIED':'bounded seeded exploratory browser checks',
  limitations:['Pseudorandom deterministic exploration is not human unscripted review',
   'No native phone, OS screen-reader speech or human A/B preference']},null,2));
 assert.deepEqual(failures,[],'Seeded Focus adversarial browser exploration failed');
 assert.equal(outcomes.length,3);
 const totals=outcomes.reduce((acc,e)=>{
  for(const [k,v] of Object.entries(e.counts))acc[k]=(acc[k]||0)+v;return acc;},{});
 assert.ok(totals.category>=10&&totals.tool>=10&&totals.toggle>=10&&
  totals.edit>=6&&totals.chip>=6&&totals.lock>=2,
  'Exploratory action mix insufficient for a meaningful stateful witness: '+JSON.stringify(totals));
 console.log('INDEPENDENT_FOCUS_EXPLORATORY_SUCCESS',JSON.stringify(totals));
}finally{await browser.close();}
