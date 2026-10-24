#!/usr/bin/env node
// Manual Chromium proxy of native-select Escape ownership, not Android/TalkBack.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
try{
  for(const [width,height] of [[320,700],[412,892]]){
    const context=await browser.newContext({viewport:{width,height},
      isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    page.setDefaultTimeout(20000);
    try{
      await page.goto(origin,{waitUntil:'domcontentloaded'});
      await page.locator('#mobileEdit').tap();
      assert.equal(await page.locator('body').evaluate(el=>
        el.classList.contains('mobile-edit-open')),true);
      const picker=page.locator('#editorVariationMode');
      await picker.click();
      assert.equal(await picker.evaluate(el=>document.activeElement===el),true);
      await page.keyboard.press('Escape');
      const editOpen=await page.locator('body').evaluate(el=>
        el.classList.contains('mobile-edit-open'));
      const selected=await picker.inputValue();
      console.log('AGENT3_NATIVE_SELECT_ESCAPE '+JSON.stringify({
        width,height,editOpen,selected,pageErrors:errors,kind:'Chromium native select click and keyboard Escape',
        physicalPixel:false,androidPicker:false}));
      assert.equal(editOpen,true,
        'Escape from an opened native select should dismiss the picker, not the whole Edit tray');
      assert.deepEqual(errors,[]);
    }finally{await context.close()}
  }
}finally{await browser.close()}
