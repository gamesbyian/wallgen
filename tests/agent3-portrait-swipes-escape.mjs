#!/usr/bin/env node
// One-off Chromium acceptance for #619/#620 only. Not Pixel or human evidence.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const output=resolve('artifacts/agent3-portrait-swipes-escape');
await mkdir(output,{recursive:true});
const recipe=normalizeRecipe({seed:'agent3-visible-swipes-escape',
  structure:'radial',radialMode:'rays',rayCount:9,lockedSettings:[]});
const browser=await chromium.launch({headless:true});
const observations=[];
try{
  for(const [width,height] of [[320,700],[412,892]]){
    const context=await browser.newContext({viewport:{width,height},
      isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    page.setDefaultTimeout(30000);
    try{
      await page.goto(origin+'/?r='+encodeRecipe(recipe),
        {waitUntil:'domcontentloaded'});
      await page.locator('#mobileEdit').tap();
      await page.locator('#tab-path').tap();
      const read=()=>page.evaluate(()=>{
        const chooser=document.querySelector('.editor-tool-chooser');
        const chips=[...chooser.querySelectorAll('[data-editor-tool]')]
          .filter(el=>el.dataset.category==='path'&&!el.hidden&&!el.disabled);
        const selected=chips.find(el=>el.getAttribute('aria-pressed')==='true');
        const position=document.getElementById('mobileSettingPosition').textContent;
        const selectedRect=selected?.getBoundingClientRect();
        const rail=chooser.getBoundingClientRect();
        const pinned=[...chooser.querySelectorAll(
          '.editor-focus-toggle,.editor-tool-reroll:not([hidden])')]
          .filter(el=>getComputedStyle(el).position==='sticky'&&
            getComputedStyle(el).display!=='none');
        const pinnedRight=Math.max(rail.left,...pinned.map(el=>el.getBoundingClientRect().right));
        return {tools:chips.map(el=>({id:el.dataset.editorTool,name:el.textContent.trim()})),
          selected:selected?.dataset.editorTool||null,position,
          selectedVisible:!!selectedRect&&selectedRect.left>=pinnedRight-3&&
            selectedRect.right<=rail.right+3};
      });
      const before=await read();
      assert.ok(before.tools.length>=2,'Need multiple scene-applicable radial tools');
      assert.match(before.position,new RegExp(' / '+before.tools.length+' · '),
        'Counter must represent the actual applicable tool list');
      assert.equal(before.selected,before.tools[0].id,
        'First applicable tool selected after category tap');
      // Dispatch browser-native TouchEvent objects directly at the noninteractive
      // editor surface; this covers the production touch handler and routing.
      await page.evaluate(()=>{
        const sheet=document.getElementById('mobileDesignSheet');
        const rect=sheet.getBoundingClientRect();
        const point=(x)=>new Touch({identifier:1,target:sheet,
          clientX:x,clientY:rect.top+rect.height/2,
          screenX:x,screenY:rect.top+rect.height/2});
        const start=point(rect.right-20),end=point(rect.left+20);
        sheet.dispatchEvent(new TouchEvent('touchstart',{
          touches:[start],targetTouches:[start],changedTouches:[start],
          bubbles:true,cancelable:true}));
        sheet.dispatchEvent(new TouchEvent('touchend',{
          touches:[],targetTouches:[],changedTouches:[end],
          bubbles:true,cancelable:true}));
      });
      const after=await read();
      assert.equal(after.selected,before.tools[1].id,
        'Swipe must advance exactly one actually visible tool');
      assert.ok(after.position.startsWith('2 / '+after.tools.length+' · '),
        'The counter must follow the same canonical selected tool');
      assert.equal(after.selectedVisible,true,
        'Newly swiped tool must be physically visible past sticky actions');
      const search=page.getByRole('button',{name:'Find a setting'});
      await search.tap();
      assert.equal(await page.locator('.editor-search-input').isVisible(),true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.editor-search-input').isVisible(),false,
        'Escape closes only setting search');
      assert.equal(await page.locator('body').evaluate(el=>
        el.classList.contains('mobile-edit-open')),true,
        'Consumed search Escape must not dismiss Edit');
      assert.equal(await search.evaluate(el=>document.activeElement===el),true,
        'Setting search returns keyboard focus to toggle');
      // Open the existing native Activity dialog programmatically while Edit
      // is shown, isolating Escape ownership without inventing a UI route.
      await page.locator('#creativeActivityOpen').evaluate(el=>el.click());
      assert.equal(await page.locator('#creativeActivityDialog').evaluate(el=>el.open),true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('body').evaluate(el=>
        el.classList.contains('mobile-edit-open')),true,
        'Dialog Escape must leave underlying editor intact');
      assert.deepEqual(decodeRecipe(new URL(page.url()).searchParams.get('r')),recipe,
        'Navigation gestures must never mutate wallpaper recipe');
      assert.deepEqual(errors,[],'Page errors during scene-aware gesture acceptance');
      const result={width,height,applicable:before.tools.map(x=>x.id),
        swipedFrom:before.selected,swipedTo:after.selected,
        counter:after.position,selectedVisible:after.selectedVisible,
        searchEscapeKeepsEdit:true,dialogEscapeKeepsEdit:true,
        recipePreserved:true,source:'Chromium synthetic TouchEvent and keyboard',
        physicalPixel:false,humanUse:false};
      observations.push(result);
      await page.screenshot({path:join(output,width+'x'+height+'.png'),
        animations:'disabled'});
      console.log('AGENT3_PORTRAIT_GESTURES_PASS '+JSON.stringify(result));
    }catch(error){
      await page.screenshot({path:join(output,'failure-'+width+'x'+height+'.png')})
        .catch(()=>{});
      throw error;
    }finally{await context.close()}
  }
}finally{await browser.close()}
await writeFile(join(output,'results.json'),JSON.stringify({observations},null,2)+'\n');
