#!/usr/bin/env node
/**
 * Source-first Focus entry + sticky tool dice geometry audit.
 * Diagnostic only: don't enlarge the row before proving neighbour relations.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/mobile-focus-entry-strip-geometry');
await mkdir(out,{recursive:true});
const original=normalizeRecipe({seed:'focus-pinned-audit',structure:'paths',
 geometry:'zigzag',shapeFrequency:61,shapeDepth:79,lockedSettings:[]});
const browser=await chromium.launch({headless:true}),observations=[];
try{
 for(const width of [320,412])for(const theme of ['cream','dark']){
  const ctx=await browser.newContext({viewport:{width,height:892},
    hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.setDefaultTimeout(16000);
  try{
   await page.goto(origin+'/?r='+encodeRecipe(original),{waitUntil:'domcontentloaded'});
   await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('#mobileEdit').tap();
   const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
   const counts=[];
   for(const category of ['path','material','colour']){
     const tab=page.locator('#tab-'+category);
     await tab.tap();
     assert.equal(await tab.getAttribute('aria-selected'),'true',
       'Native category source selection failed for '+category);
     assert.deepEqual(current(),original,'Category switch mutated recipe');
     const rect=await tab.evaluate(el=>{
       const r=el.getBoundingClientRect();
       const hits=[.18,.5,.82].flatMap(fy=>[.18,.5,.82].map(fx=>{
         const own=document.elementFromPoint(r.left+r.width*fx,r.top+r.height*fy);
         return own===el||el.contains(own);
       }));
       return {width:r.width,height:r.height,nineOwn:hits.every(Boolean)};
     });
     assert.ok(rect.nineOwn&&rect.width>=24&&rect.height>=24,
       'Category source tab is blocked or below floor: '+JSON.stringify({category,rect}));
     counts.push({category,...rect});
   }
   await page.locator('#tab-path').tap();
   await page.locator('.editor-tool-tab[data-editor-tool="geometry"]').tap();
   const chooser=page.locator('.editor-tool-chooser');
   const entry=page.locator('.editor-focus-toggle');
   const reroll=page.locator('.editor-tool-chooser>.editor-tool-reroll:not([hidden])');
   assert.equal(await entry.getAttribute('aria-pressed'),'false','All is the default');
   assert.ok(await reroll.isVisible(),'Source tool reroll disappeared');
   const geometry=await chooser.evaluate(el=>{
     const a=el.querySelector('.editor-focus-toggle');
     const b=el.querySelector('.editor-tool-reroll:not([hidden])');
     const c=el.querySelector('.editor-tool-tab:not([hidden])');
     const r=element=>{
       const v=element.getBoundingClientRect();
       const probes=[.18,.5,.82].flatMap(fy=>[.18,.5,.82].map(fx=>{
         const own=document.elementFromPoint(v.left+v.width*fx,v.top+v.height*fy);
         return own===element||element.contains(own);
       }));
       return {x:v.x,y:v.y,width:v.width,height:v.height,nineOwn:probes.every(Boolean)};
     };
     const focus=r(a),die=r(b),firstTool=r(c),track=r(el);
     return {focus,die,firstTool,track,
       focusDieGap:Math.max(0,die.x-(focus.x+focus.width)),
       dieToolGap:Math.max(0,firstTool.x-(die.x+die.width)),
       railScrollable:el.scrollWidth>el.clientWidth,
       railMaxScroll:el.scrollWidth-el.clientWidth};
   });
   assert.ok(geometry.focus.width>=24&&geometry.focus.height>=24&&
     geometry.die.width>=24&&geometry.die.height>=24&&geometry.focus.nineOwn&&
     geometry.die.nineOwn,'Pinned Focus/Tool buttons blocked: '+JSON.stringify(geometry));
   const points=[.18,.5,.82].flatMap(fy=>[.18,.5,.82].map(fx=>({fx,fy})));
   for(const point of points){
     const r=await entry.boundingBox();
     await entry.tap({position:{x:r.width*point.fx,y:r.height*point.fy}});
     assert.equal(await entry.getAttribute('aria-pressed'),'true',
       'Native Focus edge tap did not enter optional mode: '+JSON.stringify(point));
     assert.deepEqual(current(),original,'Focus entry changed source recipe');
     const back=await entry.boundingBox();
     await entry.tap({position:{x:back.width*point.fx,y:back.height*point.fy}});
     assert.equal(await entry.getAttribute('aria-pressed'),'false',
       'Native Focus edge tap did not exit optional mode: '+JSON.stringify(point));
     assert.deepEqual(current(),original,'Focus exit changed source recipe');
   }
   const doc=await page.locator('#mobileDesignSheet').boundingBox();
   const stage=await page.locator('.studio-stage').boundingBox();
   assert.ok(stage.y+stage.height<=doc.y+2,
     'Tool chooser obscured source preview: '+JSON.stringify({stage,doc}));
   assert.deepEqual(errors,[]);
   const obs={width,theme,categories:counts,chooser:geometry,
     nineFocusEntryExitPairs:points.length,previewSeparated:true,
     recipePreserved:true,ergonomic44NotClaimed:true};
   observations.push(obs);
   await page.screenshot({path:join(out,width+'-'+theme+'.png'),animations:'disabled'});
   console.log('FOCUS_ENTRY_GEOMETRY_PASS',JSON.stringify(obs));
  }finally{await ctx.close()}
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({observations,
  source:'real native Chromium source taps and elementFromPoint',
  exclusions:['mobile physical thumbs','individual tool chip taps in all categories',
    'every locked category state','human preferences']},null,2));
}finally{await browser.close()}
