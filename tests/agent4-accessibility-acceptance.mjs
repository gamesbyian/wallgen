#!/usr/bin/env node
/** Agent 4: real focus, hitboxes, labels, selected contrast and motion audit. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';

const out=resolve('artifacts/agent4-accessibility');
await mkdir(out,{recursive:true});
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const rgb=color=>{
  const values=color.match(/[\d.]+/g)?.map(Number);
  if(!values||values.length<3)throw Error('Cannot parse colour '+color);
  return values.slice(0,3).map(v=>{
    v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
  }).reduce((sum,channel,i)=>sum+channel*[.2126,.7152,.0722][i],0);
};
const contrast=(a,b)=>{
  const x=rgb(a),y=rgb(b);
  return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
};
const browser=await chromium.launch({headless:true});
const observations=[],errors=[];
try{
 for(const [width,height] of [[320,700],[412,892],[700,412]]){
  for(const theme of ['cream','dark']){
   const context=await browser.newContext({viewport:{width,height},isMobile:true,
     hasTouch:true,reducedMotion:'reduce'});
   const page=await context.newPage();
   page.setDefaultTimeout(14000);
   page.on('pageerror',e=>errors.push({viewport:[width,height],theme,message:String(e)}));
   try{
    await page.goto(origin,{waitUntil:'domcontentloaded'});
    await page.evaluate(theme=>localStorage.setItem('roygbiv:studio-theme:v1',theme),theme);
    await page.reload({waitUntil:'domcontentloaded'});
    assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),theme);
    const names=['mobileStudio','mobileEdit','mobileExplore','mobileSaved','mobileMore'];
    const dock=await page.evaluate(ids=>ids.map(id=>{
      const el=document.getElementById(id),rect=el.getBoundingClientRect(),
        x=rect.left+rect.width/2,y=rect.top+rect.height/2,
        top=document.elementFromPoint(x,y);
      return {id,accessibleName:el.getAttribute('aria-label')||el.textContent.trim(),
        width:rect.width,height:rect.height,
        hit:top===el||el.contains(top),isVisible:rect.width>0&&rect.height>0,
        expanded:el.getAttribute('aria-expanded')};
    }),names);
    for(const control of dock){
      assert.ok(control.isVisible&&control.hit,control.id+' is covered');
      assert.ok(control.width>=40&&control.height>=40,
        control.id+' falls below 40px destination touch target');
      assert.ok(control.accessibleName,control.id+' is unnamed');
    }
    // Real keyboard activation, not dispatchEvent('click') or a forced click.
    await page.locator('#mobileMore').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#mobileMore').getAttribute('aria-current'),'page');
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'mobileToolsClose');
    const measured=await page.evaluate(()=>{
      const control=document.getElementById('mobileMore'),
        status=document.getElementById('studioStatus');
      return {selectedColour:getComputedStyle(control).color,
        selectedBackground:getComputedStyle(control).backgroundColor,
        toastColour:getComputedStyle(status).color,
        toastBackground:getComputedStyle(status).backgroundColor,
        toastTransition:getComputedStyle(status).transitionDuration,
        toastSemantics:{role:status.getAttribute('role'),
          live:status.getAttribute('aria-live'),atomic:status.getAttribute('aria-atomic')}};
    });
    const selectedContrast=contrast(measured.selectedColour,measured.selectedBackground);
    const toastContrast=contrast(measured.toastColour,measured.toastBackground);
    assert.ok(selectedContrast>=4.5,'Selected More label contrast '+selectedContrast);
    assert.ok(toastContrast>=4.5,'Global status label contrast '+toastContrast);
    assert.equal(measured.toastTransition,'0s',
      'Reduced motion must disable global status fade');
    assert.deepEqual(measured.toastSemantics,{role:'status',live:'polite',atomic:'true'});
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'mobileMore',
      'Closing More must return keyboard focus');
    await page.locator('#mobileSaved').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#mobileSaved').getAttribute('aria-current'),'page');
    assert.match(await page.locator('#gallery').innerText(),/Nothing saved yet/,
      'Keyboard Saved must expose the empty gallery');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'mobileSaved');
    await page.locator('#mobileExplore').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#mobileExplore').getAttribute('aria-current'),'page');
    assert.match(await page.locator('#gallery').innerText(),/blank contact sheet/,
      'Keyboard Explore must expose its distinct empty state');
    await page.screenshot({path:join(out,theme+'-'+width+'x'+height+'.png'),
      animations:'disabled'});
    observations.push({viewport:[width,height],theme,dock,
      selectedContrast,toastContrast,toastTransition:measured.toastTransition,
      keyboard:['More','Escape','Saved','Escape','Explore'],
      focusReturned:true,selectedStatus:true});
    console.log('AGENT4_A11Y_MEASURED',JSON.stringify(observations.at(-1)));
   }catch(e){
    errors.push({viewport:[width,height],theme,message:String(e),stack:e.stack});
    await page.screenshot({path:join(out,'failure-'+theme+'-'+width+'x'+height+'.png'),
      animations:'disabled'}).catch(()=>{});
   }finally{await context.close();}
  }
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({
   classification:errors.length?'not verified':'real Chromium keyboard/touch/contrast/reduced-motion',
   observations,errors,limitations:['not OS screen-reader speech or WCAG global contrast',
    'does not certify every dynamic control','not native touch hardware']
 },null,2));
 assert.deepEqual(errors,[],'Keyboard, touch and contrast browser audit failed');
 console.log('AGENT4_A11Y_SUCCESS');
}finally{await browser.close();}
