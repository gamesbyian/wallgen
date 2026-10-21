#!/usr/bin/env node
/** Actual native Chromium/touch swatch-row qualification for 320/360px. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve(process.env.ROYGBIV_SWATCH_OUT||'artifacts/narrow-roygbiv-swatch-hitboxes');
await mkdir(out,{recursive:true});
const base=normalizeRecipe({
  seed:'narrow-roygbiv-touch',structure:'radial',radialMode:'pinwheel',
  interiorElements:[{id:'narrow-swatch-probe',type:'line',shape:'loop',
    placement:'field',color:'white',width:1.5,colorSlots:[],enabled:true}]
});
const browser=await chromium.launch({headless:true});
const observations=[];
try{
  for(const width of [320,360]){
    for(const theme of ['cream','dark']){
      const context=await browser.newContext({viewport:{width,height:892},
        isMobile:true,hasTouch:true,reducedMotion:'reduce'});
      const page=await context.newPage();
      page.setDefaultTimeout(12000);
      const errors=[];page.on('pageerror',e=>errors.push(String(e)));
      try{
        await page.goto(origin+'/?r='+encodeRecipe(base),{waitUntil:'domcontentloaded'});
        await page.evaluate(theme=>localStorage.setItem('roygbiv:studio-theme:v1',theme),theme);
        await page.reload({waitUntil:'domcontentloaded'});
        await page.locator('#mobileEdit').tap();
        await page.locator('#tab-details').tap();
        await page.locator('.editor-tool-tab[data-editor-tool="interior-targets"]').tap();
        const card=page.locator('.editor-tool-card[data-editor-tool="interior-targets"]');
        const rail=card.locator('.interior-targets');
        const chips=rail.locator('label.interior-colour-chip');
        assert.equal(await chips.count(),7,'All ROYGBIV colours survive');
        const before=decodeRecipe(new URL(page.url()).searchParams.get('r'));
        const preview=await page.locator('.wallpaper-frame').boundingBox();
        const baseRail=await rail.evaluate(el=>({
          width:el.clientWidth,content:el.scrollWidth,scrollable:getComputedStyle(el).overflowX,
          grid:getComputedStyle(el).gridAutoFlow
        }));
        assert.ok(baseRail.content>baseRail.width+15&&baseRail.scrollable==='auto'&&
          baseRail.grid==='column',
          'Seven genuinely wide swatches must be horizontally scrollable: '+JSON.stringify(baseRail));
        const measured=[];
        for(let i=0;i<7;i++){
          const chip=chips.nth(i);
          await chip.scrollIntoViewIfNeeded();
          await chip.evaluate(el=>el.scrollIntoView({block:'nearest',inline:'center',behavior:'instant'}));
          const box=await chip.evaluate(el=>{
            const r=el.getBoundingClientRect();
            const rail=el.parentElement.getBoundingClientRect();
            const hits=[.18,.5,.82].flatMap(fy=>[.18,.5,.82].map(fx=>{
              const target=document.elementFromPoint(r.left+r.width*fx,r.top+r.height*fy);
              return target===el||el.contains(target);
            }));
            return {name:el.title,width:r.width,height:r.height,
              inside:Math.min(r.right,rail.right)-Math.max(r.left,rail.left)>=r.width-1,
              unobstructed:hits.every(Boolean)};
          });
          measured.push(box);
          assert.ok(box.width>=44&&box.height>=44&&box.inside&&box.unobstructed,
            'Colour '+i+' obstructed after genuine horizontal scroll: '+JSON.stringify(box));
        }
        await chips.last().tap();
        const afterV=decodeRecipe(new URL(page.url()).searchParams.get('r'));
        assert.deepEqual(afterV.interiorElements[0].colorSlots,[0,1,2,3,4,5],
          'Violet tap must change only selected hue scope');
        await chips.first().tap();
        const afterR=decodeRecipe(new URL(page.url()).searchParams.get('r'));
        assert.deepEqual(afterR.interiorElements[0].colorSlots,[1,2,3,4,5]);
        await chips.last().tap();
        await chips.first().tap();
        const recovered=decodeRecipe(new URL(page.url()).searchParams.get('r'));
        assert.deepEqual(recovered,before,'Touch round trip must preserve the complete recipe');
        const afterPreview=await page.locator('.wallpaper-frame').boundingBox();
        assert.ok(Math.abs(afterPreview.height-preview.height)<1,
          'The hit area reflow must not sacrifice preview height');
        assert.deepEqual(errors,[],'No runtime page errors');
        const observation={width,theme,rail:baseRail,measured,
          exactRecipeRoundTrip:true,previewHeight:preview.height};
        observations.push(observation);
        await page.screenshot({path:join(out,width+'-'+theme+'.png'),animations:'disabled'});
        console.log('NARROW_COLOUR_HITBOX_PASS',JSON.stringify(observation));
      }finally{await context.close()}
    }
  }
  await writeFile(join(out,'evidence.json'),JSON.stringify({
    source:'live Chromium actual UI',observations,
    exclusions:['native Pixel 6 Pro thumb precision','TalkBack','human aesthetics']
  },null,2));
}finally{await browser.close()}
