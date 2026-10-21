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
    if(width===320){
      const install=await page.evaluate(async()=>{
        const manifestURL=document.querySelector('link[rel=manifest]')?.href;
        if(!manifestURL)return null;
        const response=await fetch(manifestURL);
        const config=await response.json();
        const icons=await Promise.all(config.icons
          .filter(icon=>['192x192','512x512'].includes(icon.sizes))
          .map(async icon=>({
            size:icon.sizes,
            status:(await fetch(new URL(icon.src,manifestURL))).status
          })));
        return {id:config.id,display:config.display,icons};
      });
      assert.equal(install?.id,'./');
      assert.equal(install?.display,'standalone');
      assert.deepEqual(install.icons.map(i=>i.size),['192x192','512x512']);
      assert.ok(install.icons.every(i=>i.status===200),
        'Chrome installation icon URLs must serve actual assets: '+JSON.stringify(install));
    }
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
    const studioExit=await btn.evaluate(el=>{
      const action=el.getBoundingClientRect();
      const theme=document.querySelector('.theme-switcher').getBoundingClientRect();
      const header=document.querySelector('.masthead').getBoundingClientRect();
      return {buttonTop:action.top,headerBottom:header.bottom,
        intersectsTheme:action.left<theme.right&&action.right>theme.left&&
          action.top<theme.bottom&&action.bottom>theme.top};
    });
    assert.ok(!studioExit.intersectsTheme&&studioExit.buttonTop>=studioExit.headerBottom-3,
      'Fullscreen Studio exit cannot intercept masthead/theme touch controls: '+
      JSON.stringify(studioExit));
    // "Always visible" also includes the real Explore, Saved and More
    // destinations. A high z-index is not proof of pointer accessibility.
    for(const destination of ['mobileExplore','mobileSaved','mobileMore','mobileStudio']){
      await page.locator('#'+destination).tap();
      await page.waitForFunction(id=>
        document.getElementById(id)?.getAttribute('aria-current')==='page',
      destination);
      const reachable=await btn.evaluate(el=>{
        const r=el.getBoundingClientRect();
        const samples=[.18,.5,.82].flatMap(fy=>[.18,.5,.82].map(fx=>{
          const owner=document.elementFromPoint(r.left+r.width*fx,r.top+r.height*fy);
          return owner===el||el.contains(owner);
        }));
        return {width:r.width,height:r.height,unobstructed:samples.every(Boolean),
          visible:!el.hidden&&r.width>0&&r.height>0};
      });
      assert.ok(reachable.visible&&reachable.width>=44&&reachable.height>=44&&
        reachable.unobstructed,
        'Fullscreen exit obstructed by '+destination+': '+JSON.stringify(reachable));
    }
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
    if(width===320||width===412){
      // An importer opened by the real FILE input uses showModal() (top layer),
      // which would otherwise cover a BODY-fixed fullscreen exit. It must
      // reparent the SAME native control into the dialog without adding
      // vertical height, stealing Close, or stranding keyboard focus.
      const fixture='<svg xmlns="http://www.w3.org/2000/svg" width="300" height="500">'+
        '<rect width="300" height="500" fill="white"/>'+
        '<path d="M15 450 L270 45" stroke="black" stroke-width="9"/></svg>';
      await page.locator('#imagePathFile').setInputFiles({
        name:'fullscreen-modal-line.svg',mimeType:'image/svg+xml',
        buffer:Buffer.from(fixture)
      });
      await page.locator('#imagePathDialog[open]').waitFor({state:'visible'});
      await page.waitForFunction(()=>
        Boolean(document.querySelector('#imagePathDialog .image-path-top>#mobileFullscreenToggle')));
      const modalExit=await btn.evaluate(el=>{
        const r=el.getBoundingClientRect(),head=el.closest('.image-path-top');
        const close=head.querySelector('#imagePathCancel').getBoundingClientRect();
        const hits=[.18,.5,.82].flatMap(fy=>[.18,.5,.82].map(fx=>{
          const own=document.elementFromPoint(r.left+r.width*fx,r.top+r.height*fy);
          return own===el||el.contains(own);
        }));
        return {withinModal:el.closest('dialog')?.open===true,
          width:r.width,height:r.height,ninePoints:hits.every(Boolean),
          noCloseOverlap:r.right<=close.left||r.left>=close.right||
            r.bottom<=close.top||r.top>=close.bottom,
          modalHeight:el.closest('dialog').getBoundingClientRect().height};
      });
      assert.ok(modalExit.withinModal&&modalExit.width>=44&&
        modalExit.height>=44&&modalExit.ninePoints&&modalExit.noCloseOverlap,
        'Native modal must retain a usable, separate fullscreen exit: '+
        JSON.stringify(modalExit));
      await btn.focus();
      assert.equal(await page.evaluate(()=>document.activeElement?.id),
        'mobileFullscreenToggle','Fullscreen exit must be in modal keyboard focus');
      await btn.tap();
      await page.waitForFunction(()=>!document.fullscreenElement&&
        document.getElementById('imagePathDialog')?.open);
      await page.locator('#imagePathCancel').tap();
      await page.waitForFunction(()=>!document.getElementById('imagePathDialog')?.open&&
        document.getElementById('mobileFullscreenToggle')?.previousElementSibling?.id==='mobileDockExpand');
      await btn.tap();
      await page.waitForFunction(()=>Boolean(document.fullscreenElement)&&
        document.getElementById('mobileFullscreenToggle')?.getAttribute('aria-label')==='Exit fullscreen');
      console.log('MODAL_FULLSCREEN_EXIT_PASS',JSON.stringify({width,modalExit}));
    }
    if(width===412){
      // Fullscreen must retain its EXIT affordance even if the viewport
      // crosses into the desktop CSS breakpoint during device rotation.
      await page.setViewportSize({width:900,height:412});
      await page.waitForFunction(()=>window.innerWidth>=791);
      assert.equal(await btn.isVisible(),true,'Rotating fullscreen hid the exit action');
      assert.equal(await btn.getAttribute('aria-label'),'Exit fullscreen');
      await btn.tap();
    }else{
      await btn.tap();
    }
    await page.waitForFunction(()=>!document.fullscreenElement,null,{timeout:8000});
    if(width===412){
      // After landscape exit the viewport is desktop-width: the *entry*
      // button should disappear; only fullscreen exit must persist on resize.
      await page.waitForFunction(()=>
        document.querySelector('#mobileFullscreenToggle')?.hidden===true);
    }else{
      await page.waitForFunction(()=>
        document.querySelector('#mobileFullscreenToggle')?.getAttribute('aria-label')==='Enter fullscreen');
    }
    assert.equal(page.url(),before,'Fullscreen enter/exit modified the source recipe URL');
    assert.deepEqual(errors,[]);
    console.log('FULLSCREEN_BROWSER_PASS',JSON.stringify({width,geometry,exitHit}));
    await context.close();
  }
}finally{await browser.close()}
