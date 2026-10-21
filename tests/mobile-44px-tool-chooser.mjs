#!/usr/bin/env node
/** Verify 44px tool strip and pinned Focus/Tool from real Chromium source. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/44px-pinned-tool-chooser');
await mkdir(out,{recursive:true});
const initial=normalizeRecipe({seed:'narrow-44-tool-row',structure:'paths',
  geometry:'zigzag',shapeFrequency:61,shapeDepth:79,lockedSettings:[]});
const browser=await chromium.launch({headless:true}),observations=[];
try{
 for(const width of [320,360,412]){
  for(const theme of ['cream','dark']){
   const context=await browser.newContext({viewport:{width,height:892},
    isMobile:true,hasTouch:true,reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[];
   page.setDefaultTimeout(18000);
   page.on('pageerror',e=>errors.push(String(e)));
   try{
    await page.goto(origin+'/?r='+encodeRecipe(initial),{waitUntil:'domcontentloaded'});
    await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#mobileEdit').tap();
    await page.locator('#tab-path').tap();
    await page.locator('.editor-tool-tab[data-editor-tool="geometry"]').tap();
    const recipe=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
    const pointChecks=async loc=>loc.evaluate(el=>{
      const r=el.getBoundingClientRect();
      const hits=[.18,.5,.82].flatMap(fy=>[.18,.5,.82].map(fx=>{
        const o=document.elementFromPoint(r.left+r.width*fx,r.top+r.height*fy);
        return o===el||el.contains(o);
      }));
      return {width:r.width,height:r.height,nineUnobstructed:hits.every(Boolean),
        x:r.x,y:r.y};
    });
    const chooser=page.locator('.editor-tool-chooser');
    const entry=page.locator('.editor-focus-toggle');
    const reroll=page.locator('.editor-tool-chooser>.editor-tool-reroll:not([hidden])');
    const entryBox=await pointChecks(entry),rerollBox=await pointChecks(reroll);
    const row=await chooser.boundingBox();
    assert.ok(row.height>=44&&entryBox.width>=44&&entryBox.height>=44&&
      rerollBox.width>=44&&rerollBox.height>=44&&
      entryBox.nineUnobstructed&&rerollBox.nineUnobstructed,
      'Pinned native 44px buttons invalid: '+JSON.stringify({row,entryBox,rerollBox}));
    const tools=page.locator('.editor-tool-chooser>.editor-tool-tab:not([hidden])');
    const n=await tools.count();
    assert.ok(n>=3,'Path category lost original named tools');
    const chips=[];
    for(let i=0;i<n;i++){
      const chip=tools.nth(i);
      // Browser-native keyboard focus / scrollIntoView can centre a chip
      // behind sticky siblings. Honour the pinned controls as a real reserved
      // pointer lane and prove this particular source tab becomes reachable.
      await chip.scrollIntoViewIfNeeded();
      await chip.evaluate(el=>{
        const rail=el.closest('.editor-tool-chooser');
        const blocker=rail.querySelector('.editor-tool-reroll:not([hidden])');
        const before=el.getBoundingClientRect();
        const left=blocker.getBoundingClientRect().right+6;
        const right=rail.getBoundingClientRect().right-3;
        if(before.left<left)rail.scrollLeft-=left-before.left;
        else if(before.right>right)rail.scrollLeft+=before.right-right;
      });
      const b=await pointChecks(chip);
      assert.ok(b.width>=44&&b.height>=44&&b.nineUnobstructed,
        'Source named-tool tab not finger-sized or overlapped: '+JSON.stringify({i,b}));
      chips.push({...b,key:await chip.getAttribute('data-editor-tool')});
    }
    // Restore geometry after chip scrolling; use real clicks/taps to prove
    // source controls, not just CSS pseudo targets.
    await page.locator('.editor-tool-tab[data-editor-tool="geometry"]').tap();
    const active=await entry.getAttribute('aria-pressed');
    assert.equal(active,'false','All must remain the default');
    const positions=[.18,.5,.82].flatMap(fy=>[.18,.5,.82].map(fx=>({fx,fy})));
    for(const point of positions){
      const box=await entry.boundingBox();
      await entry.tap({position:{x:box.width*point.fx,y:box.height*point.fy}});
      assert.equal(await entry.getAttribute('aria-pressed'),'true');
      assert.deepEqual(recipe(),initial,'Focus entry mutated source recipe');
      const help=await page.locator('.editor-focus-help').boundingBox();
      const panel=await page.locator('.editor-focus-panel').boundingBox();
      assert.ok(help.y+help.height<=panel.y+panel.height+1,
        'Focus help clipped by 44px chooser: '+JSON.stringify({width,theme,help,panel}));
      const back=await entry.boundingBox();
      await entry.tap({position:{x:back.width*point.fx,y:back.height*point.fy}});
      assert.equal(await entry.getAttribute('aria-pressed'),'false');
      assert.deepEqual(recipe(),initial,'Focus exit mutated source recipe');
    }
    await page.locator('#tab-colour').tap();
    await page.locator('.editor-tool-tab[data-editor-tool="rainbow"]').tap();
    await entry.tap();
    assert.equal(await entry.getAttribute('aria-pressed'),'true');
    const emptyHelp=await page.locator('.editor-focus-help').boundingBox();
    const emptyPanel=await page.locator('.editor-focus-panel').boundingBox();
    assert.ok(emptyHelp.y+emptyHelp.height<=emptyPanel.y+emptyPanel.height+1,
      'Sliderless Focus help clipped: '+JSON.stringify({width,theme,emptyHelp,emptyPanel}));
    await entry.tap();
    assert.deepEqual(recipe(),initial,'Colour Focus transition mutated source recipe');
    const stage=await page.locator('.studio-stage').boundingBox();
    const tray=await page.locator('#mobileDesignSheet').boundingBox();
    assert.ok(stage.y+stage.height<=tray.y+2,'Chooser intersects preview');
    assert.deepEqual(errors,[]);
    const observation={width,theme,entry:entryBox,reroll:rerollBox,chipCount:n,
      chips,focusRoundTrips:positions.length,stageHeight:stage.height,
      fullTrayHeight:tray.height,sourceRecipeUnchanged:true};
    observations.push(observation);
    await page.screenshot({path:join(out,width+'-'+theme+'.png'),animations:'disabled'});
    console.log('TOOL_CHOOSER_44PX_PASS',JSON.stringify(observation));
   }finally{await context.close()}
  }
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({observations,
  exclusions:['physical mobile hand', 'TalkBack', 'human aesthetic review',
    'actual browser chrome heights and font scaling']},null,2));
}finally{await browser.close()}
