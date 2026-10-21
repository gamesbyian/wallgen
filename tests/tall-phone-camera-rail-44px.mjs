#!/usr/bin/env node
/** Tall-phone camera rail 44px native source target and canvas clearance. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/tall-phone-camera-rail-44px');
await mkdir(out,{recursive:true});
const source=normalizeRecipe({seed:'tall-phone-camera-safe-space',
  structure:'paths',geometry:'zigzag',
  viewZoom:.8,viewPanX:10,viewPanY:-5,positionX:4,positionY:-3});
const browser=await chromium.launch({headless:true});
const rows=[];
try{
  for(const width of [320,360,412,499])for(const theme of ['cream','dark']){
    const context=await browser.newContext({viewport:{width,height:892},
      isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.setDefaultTimeout(16000);page.on('pageerror',e=>errors.push(String(e)));
    try{
      await page.goto(origin+'/?r='+encodeRecipe(source),{waitUntil:'domcontentloaded'});
      await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
      await page.reload({waitUntil:'domcontentloaded'});
      const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
      assert.deepEqual(current(),source);
      const rail=page.locator('.mobile-preview-rail-right');
      const selectors=['[data-nudge=up]','[data-nudge=left]','[data-nudge=reset]',
        '[data-nudge=right]','[data-nudge=down]',
        '[data-zoom=in]','[data-zoom=out]','[data-zoom=fit]'];
      const measure=async()=>{
        const sourceRail=await rail.evaluate(el=>{
          const r=el.getBoundingClientRect();
          const frame=document.querySelector('.wallpaper-frame').getBoundingClientRect();
          const stage=document.querySelector('.studio-stage').getBoundingClientRect();
          return {width:r.width,left:r.left,right:r.right,top:r.top,bottom:r.bottom,
            artworkRight:frame.right,frameWidth:frame.width,frameHeight:frame.height,
            stageTop:stage.top,stageBottom:stage.bottom};
        });
        assert.ok(sourceRail.width>=44&&sourceRail.left>=sourceRail.artworkRight-3&&
          sourceRail.frameWidth>=145&&sourceRail.frameHeight>=290,
          'A widened camera rail covered or unduly shrank wallpaper: '+
          JSON.stringify({width,theme,sourceRail}));
        const controls=[];
        for(const selector of selectors){
          const action=rail.locator(selector);
          assert.equal(await action.count(),1,'Source control missing: '+selector);
          const m=await action.evaluate(el=>{
            const r=el.getBoundingClientRect(),rail=el.closest('.mobile-preview-rail-right')
              .getBoundingClientRect();
            const hits=[.18,.5,.82].flatMap(y=>[.18,.5,.82].map(x=>{
              const owner=document.elementFromPoint(r.left+r.width*x,r.top+r.height*y);
              return owner===el||el.contains(owner);
            }));
            return {w:r.width,h:r.height,x:r.left,y:r.top,bottom:r.bottom,
              nineOwn:hits.every(Boolean),insideRail:r.left>=rail.left-1&&
              r.right<=rail.right+1,disabled:el.disabled};
          });
          assert.ok(m.w>=44&&m.h>=44&&m.nineOwn&&m.insideRail,
            'Original camera source hitbox not 44px/unobstructed: '+
            JSON.stringify({width,theme,selector,m}));
          controls.push({selector,...m});
        }
        // Tall source stage has to hold the complete vertical camera rail
        // without a hidden top/bottom gesture target, even while Edit is open.
        assert.ok(controls.every(c=>c.y>=sourceRail.stageTop-1&&
          c.bottom<=sourceRail.stageBottom+1),
          'Camera controls escape real tall-phone stage: '+JSON.stringify(controls));
        // The ordinary persistent fullscreen toggle shares this top-right
        // region in Studio. No 44px camera cell may steal any of its points.
        const toggle=await page.locator('#mobileFullscreenToggle').boundingBox();
        assert.ok(toggle,'Mobile immersive exit/entry vanished from Studio');
        const collisions=controls.filter(c=>
          c.x<toggle.x+toggle.width&&c.x+c.w>toggle.x&&
          c.y<toggle.y+toggle.height&&c.bottom>toggle.y);
        assert.deepEqual(collisions,[],
          'Camera rail collides with the always-visible fullscreen control: '+
          JSON.stringify({toggle,collisions}));
        return {sourceRail,controls,fullscreenToggle:toggle};
      };
      const studio=await measure();
      const only=(before,after,keys,label)=>{
        for(const [key,value] of Object.entries(before))
          if(!keys.includes(key))assert.deepEqual(after[key],value,
            label+' changed unrelated source recipe field '+key);
      };
      let before=current();
      await rail.locator('[data-zoom=out]').tap();
      only(before,current(),['viewZoom'],'Zoom out');
      assert.equal(current().viewZoom,.7);
      before=current();
      await rail.locator('[data-zoom=in]').tap();
      only(before,current(),['viewZoom'],'Zoom in');
      assert.equal(current().viewZoom,.8);
      before=current();
      await rail.locator('[data-nudge=right]').tap();
      only(before,current(),['positionX'],'Nudge right');
      assert.equal(current().positionX,5);
      before=current();
      await rail.locator('[data-nudge=left]').tap();
      only(before,current(),['positionX'],'Nudge left');
      assert.equal(current().positionX,4);
      before=current();
      await rail.locator('[data-nudge=reset]').tap();
      only(before,current(),['positionX','positionY'],'Composition Reset');
      assert.deepEqual([current().positionX,current().positionY],[0,0]);
      before=current();
      await rail.locator('[data-zoom=fit]').tap();
      only(before,current(),['viewZoom','viewPanX','viewPanY'],'Camera Fit');
      assert.deepEqual([current().viewZoom,current().viewPanX,current().viewPanY],[1,0,0]);
      await page.locator('#mobileEdit').tap();
      await page.locator('#tab-path').tap();
      await page.locator('.editor-tool-tab[data-editor-tool=geometry]').tap();
      await page.locator('.editor-focus-toggle').tap();
      const focus=await measure();
      assert.deepEqual(errors,[]);
      rows.push({width,theme,studio,focus,actions:6,
        sourceRecipeIsolation:true,perControlOwners:9,under44:0});
      await page.screenshot({path:join(out,width+'-'+theme+'.png'),animations:'disabled'});
      console.log('TALL_CAMERA_44PX_PASS',JSON.stringify(rows.at(-1)));
    }finally{await context.close()}
  }
  // The short-portrait fallback is intentionally unchanged. Do not force
  // 44px buttons into a stage too short to show all eight native source actions.
  const short=await browser.newContext({viewport:{width:320,height:700},
    isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  try{
    const page=await short.newPage();
    await page.goto(origin+'/?r='+encodeRecipe(source),{waitUntil:'domcontentloaded'});
    const m=await page.locator('.mobile-preview-rail-right [data-zoom=in]')
      .boundingBox();
    assert.ok(m.width>=24&&m.height>=24,
      'Short portrait compact camera controls are no longer usable');
  }finally{await short.close()}
  await writeFile(join(out,'evidence.json'),JSON.stringify({rows,
    unverified:['Physical Pixel Chrome bars/gestures','one-handed thumb accuracy',
      'TalkBack','human aesthetic approval','short-portrait 44px design']},null,2));
}finally{await browser.close()}
