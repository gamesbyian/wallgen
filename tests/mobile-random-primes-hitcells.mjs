#!/usr/bin/env node
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const url=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/mobile-random-primes-hitcells');
await mkdir(out,{recursive:true});
const base=normalizeRecipe({seed:'random-primes-left-rail-44',primesOnly:false});
const browser=await chromium.launch({headless:true}),observations=[];
try{
 for(const width of [320,412])for(const theme of ['cream','dark']){
  const ctx=await browser.newContext({viewport:{width,height:892},
    isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(String(err)));
  try{
   await page.goto(url+'/?r='+encodeRecipe(base),{waitUntil:'domcontentloaded'});
   await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
   await page.reload({waitUntil:'domcontentloaded'});
   const random=page.locator('.mobile-preview-rail-left #randomizeAll');
   const primes=page.locator('.mobile-preview-rail-left .prime-toggle');
   const names=['Random','Primes only'];
   const metrics=[];
   for(const [i,action] of [random,primes].entries()){
     assert.ok(await action.isVisible(),names[i]+' source action is hidden');
     const m=await action.evaluate(el=>{
       const r=el.getBoundingClientRect(),rail=el.closest('.mobile-preview-rail-left').getBoundingClientRect();
       const points=[.18,.5,.82].flatMap(fy=>[.18,.5,.82].map(fx=>{
         const owner=document.elementFromPoint(r.left+r.width*fx,r.top+r.height*fy);
         return owner===el||el.contains(owner);
       }));
       return {width:r.width,height:r.height,
         withinRail:r.left>=rail.left-1&&r.right<=rail.right+1,
         unobstructed:points.every(Boolean)};
     });
     assert.ok(m.width>=44&&m.height>=44&&m.withinRail&&m.unobstructed,
       names[i]+' does not expose an independent 44px native target: '+JSON.stringify(m));
     metrics.push({...m,action:names[i]});
   }
   const preview=await page.locator('.wallpaper-frame').boundingBox();
   const original=decodeRecipe(new URL(page.url()).searchParams.get('r'));
   await primes.tap();
   const enabled=decodeRecipe(new URL(page.url()).searchParams.get('r'));
   assert.equal(enabled.primesOnly,true,'Primes checkbox must activate through its entire label');
   assert.deepEqual(enabled,normalizeRecipe({...original,primesOnly:true}),
     'Toggling Primes changed unrelated recipe settings');
   await primes.tap();
   assert.deepEqual(decodeRecipe(new URL(page.url()).searchParams.get('r')),original,
     'Primes tap round-trip must preserve exact seed, settings and locks');
   await random.tap();
   const randomized=decodeRecipe(new URL(page.url()).searchParams.get('r'));
   assert.notEqual(randomized.seed,original.seed,'Random button did not generate new recipe');
   const afterPreview=await page.locator('.wallpaper-frame').boundingBox();
   assert.ok(Math.abs(preview.height-afterPreview.height)<1,
     'Larger buttons stole wallpaper preview space');
   assert.deepEqual(errors,[]);
   const evidence={width,theme,metrics,originalSeed:original.seed,
     randomizedSeed:randomized.seed,previewHeight:preview.height,
     primesRoundTrip:true};
   observations.push(evidence);
   await page.screenshot({path:join(out,width+'-'+theme+'.png'),animations:'disabled'});
   console.log('RANDOM_PRIMES_HITBOX_PASS',JSON.stringify(evidence));
  }finally{await ctx.close()}
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({observations,
   exclusions:['physical Android thumb accuracy','TalkBack speech','human approval']},null,2));
}finally{await browser.close()}
