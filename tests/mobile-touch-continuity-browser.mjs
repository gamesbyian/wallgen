#!/usr/bin/env node
// Genuine Chromium production-DOM integration for Focus and mobile navigation.
// Synthetic TouchEvents are explicitly labeled; native CDP touches live in
// rotation-scrubber-browser.mjs. This is NOT physical Android/TalkBack evidence.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/touch-continuity-browser');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const observations=[],errors=[];
try {
  for (const [width,height] of [[320,700],[412,892]]) {
    const context=await browser.newContext({
      viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion:'reduce'
    });
    const page=await context.newPage();
    page.setDefaultTimeout(18000);
    const pageErrors=[];
    page.on('pageerror',e=>pageErrors.push(String(e)));
    try {
      const radial=normalizeRecipe({seed:'continuity-native-dom-radial',
        structure:'radial',radialMode:'rays',rayCount:9,lockedSettings:[]});
      await page.goto(origin+'/?r='+encodeRecipe(radial),{waitUntil:'domcontentloaded'});
      await page.locator('#mobileEdit').tap();
      await page.locator('#tab-path').tap();
      const tool=()=>page.locator('.editor-tool-chooser [data-editor-tool][aria-pressed="true"]')
        .first().getAttribute('data-editor-tool');
      assert.equal(await tool(),'rays');
      // TouchEvent objects are created by Chromium and delivered to the real
      // mounted editor/window listeners. They are not OS touch injection.
      await page.evaluate(()=>{
        const sheet=document.getElementById('mobileDesignSheet');
        const rect=sheet.getBoundingClientRect();
        const y=rect.top+rect.height/2;
        const startX=rect.right-20,endX=rect.left+20;
        const touch=(id,x,target=sheet)=>new Touch({
          identifier:id,target,clientX:x,clientY:y,
          screenX:x,screenY:y,pageX:x,pageY:y
        });
        const emit=(target,type,touches,changed)=>target.dispatchEvent(
          new TouchEvent(type,{touches,targetTouches:target===sheet?touches:[],
            changedTouches:changed,bubbles:true,cancelable:true}));
        window.__continuityTouch={
          begin(id){const t=touch(id,startX);emit(sheet,'touchstart',[t],[t]);},
          end(id){const t=touch(id,endX);emit(sheet,'touchend',[],[t]);},
          otherFinger(id){const t1=touch(id,startX);
            const outside=touch(id+1,startX,document.body);
            emit(window,'touchstart',[t1,outside],[outside]);},
          wrongEnd(id){const t=touch(id+1,endX);emit(sheet,'touchend',[],[t]);}
        };
      });
      await page.evaluate(()=>{window.__continuityTouch.begin(21);
        window.__continuityTouch.otherFinger(21);
        window.__continuityTouch.end(21);});
      assert.equal(await tool(),'rays',
        'a second touch outside the sheet must cancel navigation');
      await page.evaluate(()=>{window.__continuityTouch.begin(31);
        window.__continuityTouch.wrongEnd(31);});
      assert.equal(await tool(),'rays','another finger cannot finish an armed swipe');
      await page.evaluate(()=>window.__continuityTouch.begin(41));
      await page.locator('.editor-tool-chooser [data-editor-tool="ray-shape"]').click();
      await page.evaluate(()=>window.__continuityTouch.end(41));
      assert.equal(await tool(),'ray-shape',
        'the former swipe must not advance after direct tool selection');
      await page.locator('.editor-tool-chooser [data-editor-tool="rays"]').click();
      await page.evaluate(()=>{
        window.__continuityTouch.begin(51);
        document.dispatchEvent(new CustomEvent('editor-tool-changed',{
          detail:{category:'path',tool:'rays'}}));
        window.__continuityTouch.end(51);
      });
      assert.equal(await tool(),'ray-shape',
        'routine same-tool source sync must not cancel a valid swipe');
      assert.deepEqual(decodeRecipe(new URL(page.url()).searchParams.get('r')),radial,
        'sheet touch navigation must not write wallpaper recipe');

      const paths=normalizeRecipe({seed:'continuity-focus-rebinding',
        structure:'paths',geometry:'wave',shapeDepth:48,shapeFrequency:22,
        lockedSettings:[]});
      await page.goto(origin+'/?r='+encodeRecipe(paths),{waitUntil:'domcontentloaded'});
      await page.locator('#mobileEdit').tap();
      await page.locator('#tab-path').tap();
      await page.locator('.editor-tool-chooser [data-editor-tool="geometry"]').click();
      await page.locator('.editor-focus-toggle').click();
      const chips=page.locator('.editor-focus-chip[data-focus-key]');
      assert.ok(await chips.count()>=2,'Need distinct source ranges to verify identity');
      const selected=chips.last();
      await selected.click();
      const key=await selected.getAttribute('data-focus-key');
      assert.equal(await selected.getAttribute('aria-pressed'),'true');
      await page.evaluate(key=>{
        const chip=document.querySelector('.editor-focus-chip[data-focus-key="'+key+'"]');
        window.__focusedContinuityChip=chip;
        const source=document.querySelector('.editor-tool-card:not([hidden]) input[type=range][name="'+key+'"]');
        if(!source)throw Error('Selected source range was not found');
        const replacement=source.cloneNode(true);
        replacement.value=source.value;
        source.replaceWith(replacement);
        document.dispatchEvent(new CustomEvent('editor-tool-changed',{
          detail:{category:'path',tool:'geometry'}}));
      },key);
      const focus=await page.evaluate(key=>{
        const chip=document.querySelector('.editor-focus-chip[data-focus-key="'+key+'"]');
        const proxy=document.querySelector('.editor-focus-slider');
        const source=document.querySelector('.editor-tool-card:not([hidden]) input[type=range][name="'+key+'"]');
        return {sameChip:chip===window.__focusedContinuityChip,
          selected:chip?.getAttribute('aria-pressed')==='true',
          proxyValue:proxy?.value,sourceValue:source?.value,
          named:source?.name,connected:chip?.isConnected};
      },key);
      assert.equal(focus.sameChip,true,'same-tool refresh replaced focused chip');
      assert.equal(focus.selected,true,'rebuilt source silently reset selected Focus parameter');
      assert.equal(focus.connected,true);
      assert.equal(focus.proxyValue,focus.sourceValue,'Focus bound to a detached source input');
      assert.equal(focus.named,key);
      assert.deepEqual(pageErrors,[],'browser runtime errors');
      observations.push({viewport:[width,height],multiTouchOutsideSafe:true,
        wrongFingerSafe:true,toolSwitchSafe:true,sameToolSyncPreserved:true,
        focusKey:key,focusRebound:true,recipePreserved:true,
        touchEvidence:'Chromium-mounted synthetic TouchEvents',
        focusEvidence:'Chromium live DOM source-input replacement',
        physicalPixel:'NOT TESTED',talkBack:'NOT TESTED'});
      await page.screenshot({path:join(out,width+'x'+height+'.png'),
        animations:'disabled'});
      console.log('TOUCH_CONTINUITY_CHROMIUM_PASS '+JSON.stringify(observations.at(-1)));
    } catch(e) {
      errors.push({viewport:[width,height],error:String(e),stack:e.stack,pageErrors});
      await page.screenshot({path:join(out,'failure-'+width+'x'+height+'.png')})
        .catch(()=>{});
    } finally {await context.close();}
  }
  await writeFile(join(out,'evidence.json'),JSON.stringify({
    classification:errors.length?'NOT VERIFIED':'Chromium DOM integration verified',
    observations,errors,limitations:[
      'TouchEvents are synthetic browser input, not physical Android touch',
      'Focus source replacement is a controlled DOM integration seam',
      'No Android IME, native TalkBack or tactile judgement'
    ]
  },null,2));
  assert.deepEqual(errors,[],'Mobile continuity browser integration failures');
  console.log('TOUCH_CONTINUITY_CHROMIUM_SUCCESS');
} finally {await browser.close();}
