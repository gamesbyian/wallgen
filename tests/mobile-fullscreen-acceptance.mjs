#!/usr/bin/env node
/** Real Chromium mobile fullscreen acceptance, distinct from native Android QA. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
const url=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
try{
  for(const width of [320,412,790,791]){
    const context=await browser.newContext({viewport:{width,height:892},hasTouch:true,isMobile:true,
      reducedMotion:'reduce'});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(url,{waitUntil:'domcontentloaded'});
    const btn=page.locator('#mobileFullscreenToggle');
    if(width>790){
      assert.equal(await btn.isVisible(),false);
      await context.close();continue;
    }
    assert.equal(await btn.isVisible(),true);
    const before=page.url();
    const geometry=await btn.evaluate(el=>{
      const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
      const dock=document.querySelector('#mobileActionDock').getBoundingClientRect();
      return {width:r.width,height:r.height,hit:hit===el||el.contains(hit),
        dockTop:dock.top,top:r.top,bottom:r.bottom};
    });
    assert.ok(geometry.width>=44&&geometry.height>=44&&geometry.hit,
      'Fullscreen activation target must be exposed: '+JSON.stringify(geometry));
    assert.ok(geometry.bottom<geometry.dockTop,'Fullscreen overlay must not cover the dock');
    await btn.tap();
    await page.waitForFunction(()=>Boolean(document.fullscreenElement)&&
      document.querySelector('#mobileFullscreenToggle')?.getAttribute('aria-label')==='Exit fullscreen',
      null,{timeout:8000});
    await page.locator('#mobileEdit').click();
    const editor=await page.locator('#mobileDesignSheet').isVisible();
    assert.equal(editor,true);
    const exitHit=await btn.evaluate(el=>{
      const r=el.getBoundingClientRect(),owners=[.2,.5,.8].flatMap(fy=>
        [.2,.5,.8].map(fx=>{
          const owner=document.elementFromPoint(r.left+r.width*fx,r.top+r.height*fy);
          return owner===el||el.contains(owner);
        }));
      return {height:r.height,all:owners.every(Boolean)};
    });
    assert.ok(exitHit.height>=44&&exitHit.all,'Exit must have unobstructed hit region: '+
      JSON.stringify(exitHit));
    await btn.tap();
    await page.waitForFunction(()=>!document.fullscreenElement&&
      document.querySelector('#mobileFullscreenToggle')?.getAttribute('aria-label')==='Enter fullscreen',
      null,{timeout:8000});
    assert.equal(page.url(),before,'Fullscreen enter/exit modified the source recipe URL');
    assert.deepEqual(errors,[]);
    console.log('FULLSCREEN_BROWSER_PASS',JSON.stringify({width,geometry,exitHit}));
    await context.close();
  }
}finally{await browser.close()}
