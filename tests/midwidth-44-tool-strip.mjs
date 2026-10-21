#!/usr/bin/env node
/** Original 500–790px tall portrait named tools, pinned Focus and Tool dice. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/midwidth-44-tool-strip');
await mkdir(out,{recursive:true});
const baseline=normalizeRecipe({seed:'midwidth-source-44-tool',structure:'paths',
  geometry:'zigzag',shapeFrequency:61,shapeDepth:79,viewZoom:.8,viewPanX:6,
  lockedSettings:[]});
const browser=await chromium.launch({headless:true}),records=[],failures=[];
try{
 for(const [width,height] of [[500,892],[600,892],[790,892],[500,700]])for(const theme of ['cream','dark']){
  const ctx=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,
    reducedMotion:'reduce'});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));page.setDefaultTimeout(19000);
  const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
  try{
   await page.goto(origin+'/?r='+encodeRecipe(baseline),{waitUntil:'domcontentloaded'});
   await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
   await page.reload({waitUntil:'domcontentloaded'});
   assert.deepEqual(current(),baseline);
   await page.locator('#mobileEdit').tap();
   await page.locator('#tab-path').tap();
   await page.locator('.editor-tool-chooser .editor-tool-tab[data-editor-tool="geometry"]').tap();
   const chooser=page.locator('.editor-tool-chooser');
   const focus=chooser.locator('.editor-focus-toggle');
   const reroll=chooser.locator('.editor-tool-reroll:not([hidden])');
   const measures=[];
   const measure=async (name,node)=>{
    const m=await node.evaluate(el=>{
      const r=el.getBoundingClientRect(),row=el.closest('.editor-tool-chooser').getBoundingClientRect();
      const samples=[.18,.5,.82].flatMap(y=>[.18,.5,.82].map(x=>{
        const p=document.elementFromPoint(r.x+r.width*x,r.y+r.height*y);
        return p===el||el.contains(p);
      }));
      return {width:r.width,height:r.height,x:r.x,y:r.y,
        owners:samples.every(Boolean),
        insideRow:r.y>=row.y-1&&r.bottom<=row.bottom+1};
    });
    if(height>=840)assert.ok(m.width>=44&&m.height>=44&&m.owners&&m.insideRow,
      'Source 44px midwidth control blocked/under-sized: '+JSON.stringify({name,width,theme,m}));
    measures.push({name,...m});return m;
   };
   const frameBefore=await page.locator('.wallpaper-frame').boundingBox();
   const rowRect=await chooser.boundingBox();
   if(height>=840)assert.ok(rowRect.height>=44,'Named tool strip still less than 44px');
   await measure('Focus',focus);await measure('Tool scoped randomizer',reroll);
   const toolNodes=chooser.locator('.editor-tool-tab:not([hidden])');
   assert.ok(await toolNodes.count()>=4,'Missing original Path named tools');
   for(let i=0;i<await toolNodes.count();i++){
    const chip=toolNodes.nth(i);
    await chip.scrollIntoViewIfNeeded();
    await chip.evaluate(el=>{
      const rail=el.closest('.editor-tool-chooser');
      const die=rail.querySelector('.editor-tool-reroll:not([hidden])');
      const bounds=el.getBoundingClientRect();
      const left=die.getBoundingClientRect().right+6,right=rail.getBoundingClientRect().right-4;
      if(bounds.left<left)rail.scrollLeft-=left-bounds.left;
      else if(bounds.right>right)rail.scrollLeft+=bounds.right-right;
    });
    await measure('Path tool '+i,chip);
   }
   await chooser.locator('[data-editor-tool="geometry"]').tap();
   // Actual near-edge native finger touches must enter and leave Focus
   // without changing the source recipe, including a disabled-free state.
   const touches=[.18,.5,.82].flatMap(fy=>[.18,.5,.82].map(fx=>({fx,fy})));
   for(const p of touches){
    const a=await focus.boundingBox();
    await focus.tap({position:{x:a.width*p.fx,y:a.height*p.fy}});
    assert.equal(await focus.getAttribute('aria-pressed'),'true',
      'Focus native source edge tap failed');
    assert.deepEqual(current(),baseline,'Focus entry changed wallpaper recipe');
    const b=await focus.boundingBox();
    await focus.tap({position:{x:b.width*p.fx,y:b.height*p.fy}});
    assert.equal(await focus.getAttribute('aria-pressed'),'false',
      'Focus exit source edge tap failed');
    assert.deepEqual(current(),baseline);
   }
   // Scoped Tool actions must preserve original camera/locked fields and
   // remain independently tappable from the pinned Focus control.
   const prior=current();
   await reroll.tap();
   const varied=current();
   assert.equal(varied.viewZoom,prior.viewZoom);assert.equal(varied.viewPanX,prior.viewPanX);
   assert.deepEqual(varied.lockedSettings,prior.lockedSettings);
   if(JSON.stringify(varied)!==JSON.stringify(prior)){
    await page.locator('#undo').tap();
    assert.deepEqual(current(),prior,'Original scoped Tool Undo lost full recipe');
   }
   const frameAfter=await page.locator('.wallpaper-frame').boundingBox();
   assert.ok(Math.abs(frameAfter.height-frameBefore.height)<1,
     '44px named-tool strip stole extra stage geometry after operation');
   const stage=await page.locator('.studio-stage').boundingBox(),
     tray=await page.locator('#mobileDesignSheet').boundingBox();
   assert.ok(stage.y+stage.height<=tray.y+2,'Tool strip covered the artwork');
   assert.deepEqual(errors,[],'Runtime page errors');
   records.push({width,height,theme,measures,sourceFocusEdgePairs:9,
     toolScopedUndo:true,sourceRecipePreserved:true,previewHeight:frameBefore.height});
   await page.screenshot({path:join(out,width+'x'+height+'-'+theme+'.png'),animations:'disabled'});
   console.log('MIDWIDTH_TOOL_STRIP_44_PASS',JSON.stringify(records.at(-1)));
  }catch(error){
   failures.push({width,height,theme,error:String(error),stack:error.stack,errors});
   await page.screenshot({path:join(out,'failure-'+width+'x'+height+'-'+theme+'.png'),
     animations:'disabled'}).catch(()=>{});
  }finally{await ctx.close();}
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({records,failures,
  limits:['other conditional categories','physical Pixel', 'TalkBack','human visual approval',
    'short portrait compact fallback']},null,2));
 assert.deepEqual(failures,[],'Midwidth native named-tool touch counterexamples');
}finally{await browser.close()}
