#!/usr/bin/env node
/**
 * Mobile camera rail geometry census plus true source-camera pointer actions.
 * Deliberately diagnostic: a 24px effective control is not a 44px thumb target.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/mobile-camera-rail-touch');
await mkdir(out,{recursive:true});
const source=normalizeRecipe({seed:'camera-rail-ergonomics',structure:'paths',
 geometry:'zigzag',viewZoom:.8,viewPanX:10,viewPanY:-5,
 positionX:4,positionY:-3});
const browser=await chromium.launch({headless:true});
const results=[];
try{
 for(const width of [320,412,499]){
  for(const theme of ['cream','dark']){
   const context=await browser.newContext({viewport:{width,height:892},
     isMobile:true,hasTouch:true,reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[];page.setDefaultTimeout(15000);
   page.on('pageerror',e=>errors.push(String(e)));
   try{
    await page.goto(origin+'/?r='+encodeRecipe(source),{waitUntil:'domcontentloaded'});
    await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.body.classList.contains('mobile-preview-tools-ready'));
    const recipe=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
    assert.deepEqual(recipe(),source);
    const targets=['[data-zoom="in"]','[data-zoom="out"]',
      '[data-zoom="fit"]','[data-nudge="left"]',
      '[data-nudge="right"]','[data-nudge="up"]','[data-nudge="down"]'];
    const measured=[];
    for(const selector of targets){
      const el=page.locator('.mobile-preview-rail-right '+selector);
      assert.equal(await el.count(),1,'Original source camera control missing: '+selector);
      const m=await el.evaluate(el=>{
        const r=el.getBoundingClientRect();
        const rail=el.closest('.mobile-preview-rail-right').getBoundingClientRect();
        const points=[.18,.5,.82].flatMap(fy=>[.18,.5,.82].map(fx=>{
          const owner=document.elementFromPoint(r.left+r.width*fx,r.top+r.height*fy);
          return owner===el||el.contains(owner);
        }));
        return {name:el.getAttribute('aria-label')||el.getAttribute('title')||el.textContent,
          width:r.width,height:r.height,
          x:r.x,y:r.y,
          nineOwners:points.filter(Boolean).length,
          sourceDisabled:el.disabled,
          withinRail:r.left>=rail.left-1&&r.right<=rail.right+1,
          below44:r.width<44||r.height<44};
      });
      assert.ok(m.width>0&&m.height>0,'Source action has no measurable hit box: '+selector);
      measured.push({selector,...m});
    }
    const unchangedExcept=(before,after,allow,claim)=>{
      for(const key of Object.keys(before)){
        if(!allow.includes(key))
          assert.deepEqual(after[key],before[key],claim+' changed '+key);
      }
    };
    let before=recipe();
    await page.locator('.mobile-preview-rail-right [data-zoom="out"]').tap();
    unchangedExcept(before,recipe(),['viewZoom'],'Zoom out');
    assert.equal(recipe().viewZoom,.7);
    before=recipe();
    await page.locator('.mobile-preview-rail-right [data-zoom="in"]').tap();
    unchangedExcept(before,recipe(),['viewZoom'],'Zoom in');
    assert.equal(recipe().viewZoom,.8);
    before=recipe();
    await page.locator('.mobile-preview-rail-right [data-nudge="right"]').tap();
    unchangedExcept(before,recipe(),['positionX'],'Composition right');
    assert.equal(recipe().positionX,5);
    before=recipe();
    await page.locator('.mobile-preview-rail-right [data-nudge="left"]').tap();
    unchangedExcept(before,recipe(),['positionX'],'Composition left');
    assert.equal(recipe().positionX,4);
    before=recipe();
    await page.locator('.mobile-preview-rail-right [data-zoom="fit"]').tap();
    unchangedExcept(before,recipe(),['viewZoom','viewPanX','viewPanY'],'Full camera fit');
    assert.deepEqual([recipe().viewZoom,recipe().viewPanX,recipe().viewPanY],[1,0,0]);
    assert.equal(await page.locator('.mobile-zoom-level').textContent(),'100%');
    assert.deepEqual(errors,[]);
    const o={width,theme,targets:measured,
      under44:measured.filter(x=>x.below44).length,
      blockedSubtargets:measured.filter(x=>x.nineOwners<9).map(x=>x.selector),
      zoomAndCompositionSourceTaps:true,recipeIsolation:true};
    results.push(o);
    await page.screenshot({path:join(out,width+'-'+theme+'.png'),animations:'disabled'});
    console.log('CAMERA_RAIL_TOUCH_AUDIT_PASS',JSON.stringify(o));
   }finally{await context.close()}
  }
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({results,
  classification:'live-source geometry and bounded touchscreen behaviour, not ergonomic approval',
  unverified:['physical Pixel fingertip accuracy','TalkBack speech',
    'motor accessibility','human visual preference']},null,2));
}finally{await browser.close()}
