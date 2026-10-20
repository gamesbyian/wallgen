#!/usr/bin/env node
/**
 * Agent 4 independent adversarial gallery test: intentionally damaged local
 * storage, legacy partial favourites, real visible gallery navigation, reload,
 * rapid Explore/Saved switches, painting, keyboard restore and recovery.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/agent4-gallery');
await mkdir(out,{recursive:true});
const key='wallgen:favorites:v1';
const baseline=normalizeRecipe({seed:'agent4-baseline'});
const complete=normalizeRecipe({seed:'agent4-favourite-complete',structure:'regions',
  regionMode:'nested',regionCount:21,viewZoom:.75,viewPanX:10,
  material:'linen',lockedSettings:['material'],
  interiorElements:[{id:'agent4-ink',type:'line',shape:'wave',
    color:'custom',customColor:'#22bb88',placement:'contour',width:2.5}]});
const partial=normalizeRecipe({seed:'agent4-legacy-partial'});
const corrupt=[null,{seed:''},complete,[],17,{seed:'agent4-legacy-partial'},
  'not a recipe',{geometry:'zigzag'},false];

const browser=await chromium.launch({headless:true});
const evidence=[],errors=[];
try{
 for(const [width,height] of [[412,892],[700,412]]){
  const context=await browser.newContext({
    viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page=await context.newPage();
  page.setDefaultTimeout(20000);
  page.on('pageerror',error=>errors.push(String(error)));
  const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
  try{
    await page.goto(origin+'/?r='+encodeRecipe(baseline),{waitUntil:'domcontentloaded'});
    await page.evaluate(([key,value])=>localStorage.setItem(key,JSON.stringify(value)),
      [key,corrupt]);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#mobileSaved').click();
    await page.waitForFunction(()=>document.querySelector('#gallery')?.dataset.view==='saved'
      && document.querySelectorAll('#gallery .thumb').length===2
      && document.querySelector('#gallery').getAttribute('aria-busy')!=='true');
    const initial=await page.locator('#gallery .thumb').evaluateAll(cards=>cards.map(c=>({
      seed:c.dataset.recipeSeed,
      firstChild:c.firstElementChild?.tagName,
      title:c.getAttribute('title'),
      text:c.textContent,
      dimensions:[c.querySelector('canvas')?.width,c.querySelector('canvas')?.height]
    })));
    assert.deepEqual(initial.map(item=>item.seed),
      [complete.seed,partial.seed],'Corrupt neighbour poisoned valid Saved entries');
    for(const item of initial){
      assert.equal(item.firstChild,'CANVAS','Saved must remain image-first');
      assert.deepEqual(item.dimensions,[240,520]);
      assert.ok(item.title&&item.text,'Image-first card needs usable accessible name/caption');
    }
    await page.waitForFunction(()=>[...document.querySelectorAll('#gallery .thumb canvas')]
      .every(canvas=>canvas.getContext('2d').getImageData(0,0,1,1).data[3]>0),
      null,{timeout:90000});
    await page.screenshot({path:join(out,'saved-corrupt-recovered-'+width+'x'+height+'.png'),
      animations:'disabled'});

    await page.locator('#mobileExplore').click();
    assert.equal(await page.locator('#gallery .thumb').count(),0,
      'New Explore must start independent of preexisting Saved');
    await page.locator('#batch').click();
    await page.waitForFunction(()=>document.querySelectorAll('#gallery .thumb').length===12
      && document.querySelector('#gallery').getAttribute('aria-busy')!=='true',
      null,{timeout:90000});
    const explore=await page.locator('#gallery .thumb').evaluateAll(cards=>
      cards.map(card=>card.dataset.recipeSeed));
    assert.equal(new Set(explore).size,12);
    // Race each pending gallery refresh against a destination change. A stale
    // request must never append a Saved card to an Explore contact sheet.
    for(let i=0;i<4;i++){
      await page.locator('#mobileSaved').click();
      await page.locator('#mobileExplore').click();
    }
    await page.waitForFunction(()=>document.querySelectorAll('#gallery .thumb').length===12
      && document.querySelector('#gallery').getAttribute('aria-busy')!=='true',
      null,{timeout:90000});
    assert.deepEqual(await page.locator('#gallery .thumb').evaluateAll(cards=>
      cards.map(card=>card.dataset.recipeSeed)),explore);
    // Seeded exploratory state-machine walk: unscripted-by-scenario sequence,
    // but precisely replayable when a failure is reported. It includes
    // repeated taps on an already active destination, which close that sheet.
    let prng=0xa4110;
    const walk=[];
    for(let step=0;step<12;step++){
      prng=(Math.imul(prng,1664525)+1013904223)>>>0;
      const target=['mobileStudio','mobileSaved','mobileExplore'][prng%3];
      await page.locator('#'+target).click();
      const mode=await page.evaluate(()=>
        document.querySelector('#mobileActionDock [aria-current="page"]')?.id);
      walk.push({step,target,mode});
      if(mode==='mobileSaved'||mode==='mobileExplore'){
        const expected=mode==='mobileSaved'?
          [complete.seed,partial.seed]:explore;
        await page.waitForFunction(value=>
          document.querySelectorAll('#gallery .thumb').length===value.length &&
          document.querySelector('#gallery').getAttribute('aria-busy')!=='true',
          expected,{timeout:90000});
        assert.deepEqual(await page.locator('#gallery .thumb').evaluateAll(cards=>
          cards.map(card=>card.dataset.recipeSeed)),expected,
          'Stale gallery entries after exploratory action '+JSON.stringify(walk.at(-1)));
      }
    }
    await page.locator('#mobileStudio').click();
    await page.locator('#mobileSaved').click();
    await page.waitForFunction(()=>document.querySelectorAll('#gallery .thumb').length===2
      && document.querySelector('#gallery').getAttribute('aria-busy')!=='true');
    const restored=page.locator('#gallery .thumb').first();
    await restored.focus();
    await page.keyboard.press('Enter');
    assert.deepEqual(current(),complete,'Saved keyboard restoration must be exact');
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'mobileStudio',
      'Restoring must not strand focus in a hidden gallery');

    await page.locator('#mobileFavorite').click();
    assert.equal(await page.locator('#favorite').getAttribute('aria-pressed'),'false');
    const stored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
    assert.deepEqual(stored.map(item=>item.seed),[partial.seed],
      'Removing one recovered favourite should not retain malformed entries');
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#mobileSaved').click();
    await page.waitForFunction(()=>document.querySelectorAll('#gallery .thumb').length===1
      && document.querySelector('#gallery').getAttribute('aria-busy')!=='true');
    assert.deepEqual(await page.locator('#gallery .thumb').evaluateAll(cards=>
      cards.map(c=>c.dataset.recipeSeed)),[partial.seed]);
    await page.locator('#gallery .thumb').click();
    assert.deepEqual(current(),partial,
      'Partial legacy Saved record must restore canonical defaults after reload');
    evidence.push({viewport:[width,height],recovered:initial.map(item=>item.seed),
      savedCanvasFirst:true,painted:true,exploreCount:12,raceSwitches:8,exploratoryActions:walk,
      keyboardRestore:true,exactRecipe:true,reloadPersistence:true,
      corruptedEntriesPrunedOnNextSave:true});
    console.log('AGENT4_GALLERY_VERIFIED',JSON.stringify(evidence.at(-1)));
  }catch(error){
    errors.push({viewport:[width,height],message:String(error),stack:error.stack});
    await page.screenshot({path:join(out,'failure-'+width+'x'+height+'.png'),
      animations:'disabled'}).catch(()=>{});
  }finally{await context.close();}
 }
 // Storage can reject writes (private mode, disabled storage, quota).
 // Session-only favourites must remain usable without suggesting persistence.
 {
  const context=await browser.newContext({viewport:{width:412,height:892},
    isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await context.addInitScript(()=>{
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
      if(key==='wallgen:favorites:v1')
        throw new DOMException('Storage quota unavailable','QuotaExceededError');
      return original.call(this,key,value);
    };
  });
  const page=await context.newPage();
  try{
    await page.goto(origin+'/?r='+encodeRecipe(baseline),{waitUntil:'domcontentloaded'});
    await page.locator('#mobileFavorite').click();
    assert.match(await page.locator('#studioStatus').textContent(),
      /Browser storage unavailable; favourites last for this visit/);
    await page.locator('#mobileSaved').click();
    await page.waitForFunction(()=>document.querySelectorAll('#gallery .thumb').length===1
      && document.querySelector('#gallery').getAttribute('aria-busy')!=='true');
    assert.equal(await page.locator('#gallery .thumb').first().getAttribute('data-recipe-seed'),
      baseline.seed);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#mobileSaved').click();
    await page.waitForFunction(()=>document.querySelector('#gallery')?.dataset.view==='saved'
      && document.querySelector('#gallery').getAttribute('aria-busy')!=='true');
    assert.equal(await page.locator('#gallery .thumb').count(),0,
      'Storage write denial must not fabricate persistence after reload');
    evidence.push({name:'blocked-storage',temporaryFavorite:true,
      accessibleWarning:true,reloadShowsEmpty:true});
  }catch(e){
    errors.push({name:'blocked-storage',message:String(e),stack:e.stack});
    await page.screenshot({path:join(out,'failure-blocked-storage.png'),
      animations:'disabled'}).catch(()=>{});
  }finally{await context.close();}
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({
   classification:errors.length?'not verified':'real Chromium gallery and storage recovery',
   evidence,errors,limitations:['no physical Android','session Explore not persisted across reload by design',
     'not all possible saved-data corruption','no screen-reader speech test']
 },null,2));
 assert.deepEqual(errors,[],'Adversarial gallery acceptance failed');
 console.log('AGENT4_GALLERY_SUCCESS');
}finally{await browser.close();}
