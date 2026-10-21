#!/usr/bin/env node
/** Actual mobile-Chromium source-button bounds and favourite/PNG touch tests. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const output=resolve('artifacts/mobile-preview-shortcut-touch');
await mkdir(output,{recursive:true});
const seed=normalizeRecipe({seed:'preview-shortcut-touch-44',structure:'paths',geometry:'wave'});
const browser=await chromium.launch({headless:true});
const report=[];
try{
  for(const width of [320,412]){
    for(const theme of ['cream','dark']){
      const ctx=await browser.newContext({viewport:{width,height:892},
        hasTouch:true,isMobile:true,acceptDownloads:true,reducedMotion:'reduce'});
      const page=await ctx.newPage();
      const errors=[];page.on('pageerror',e=>errors.push(String(e)));
      page.setDefaultTimeout(20000);
      try{
        await page.goto(origin+'/?r='+encodeRecipe(seed),{waitUntil:'domcontentloaded'});
        await page.evaluate(theme=>localStorage.setItem('roygbiv:studio-theme:v1',theme),theme);
        await page.reload({waitUntil:'domcontentloaded'});
        const ids=['mobileFavorite','mobileDownload'];
        const boxes=[];
        for(const id of ids){
          const button=page.locator('.mobile-preview-rail-left .mobile-five-shortcuts>#'+id);
          assert.ok(await button.isVisible(),'Missing original source button '+id);
          const measure=await button.evaluate(el=>{
            const r=el.getBoundingClientRect(),rail=el.closest('.mobile-preview-rail-left').getBoundingClientRect();
            const points=[.18,.5,.82].flatMap(fy=>[.18,.5,.82].map(fx=>{
              const top=document.elementFromPoint(r.left+r.width*fx,r.top+r.height*fy);
              return top===el||el.contains(top);
            }));
            return {id:el.id,width:r.width,height:r.height,
              withinRail:r.left>=rail.left-1&&r.right<=rail.right+1,
              unobstructed:points.every(Boolean),x:r.x,y:r.y};
          });
          boxes.push(measure);
          assert.ok(measure.width>=44&&measure.height>=44&&
            measure.withinRail&&measure.unobstructed,
            'Actual native quick-action region unusable: '+JSON.stringify(measure));
        }
        const before=decodeRecipe(new URL(page.url()).searchParams.get('r'));
        const preview=await page.locator('.wallpaper-frame').boundingBox();
        await page.locator('#mobileFavorite').tap();
        assert.equal(await page.locator('#favorite').getAttribute('aria-pressed'),'true');
        await page.locator('#mobileFavorite').tap();
        assert.equal(await page.locator('#favorite').getAttribute('aria-pressed'),'false');
        const [download]=await Promise.all([
          page.waitForEvent('download',{timeout:30000}),
          page.locator('#mobileDownload').tap()
        ]);
        assert.match(download.suggestedFilename(),/\.png$/i,
          'Native download shortcut must still export PNG');
        assert.deepEqual(decodeRecipe(new URL(page.url()).searchParams.get('r')),before,
          'Favourites or export mutated the generator recipe');
        const afterPreview=await page.locator('.wallpaper-frame').boundingBox();
        assert.ok(Math.abs(afterPreview.height-preview.height)<1,
          'Larger source hit targets must not shrink wallpaper preview');
        assert.deepEqual(errors,[]);
        report.push({width,theme,boxes,previewHeight:preview.height,
          recipeRoundTrip:true,realPngDownload:true});
        await page.screenshot({path:join(output,width+'-'+theme+'.png'),
          animations:'disabled'});
        console.log('PREVIEW_SHORTCUT_TOUCH_PASS',JSON.stringify(report.at(-1)));
      }finally{await ctx.close()}
    }
  }
  await writeFile(join(output,'evidence.json'),JSON.stringify({
    source:'real mobile Chromium',report,
    exclusions:['physical Android taps','TalkBack','subjective optical approval']
  },null,2));
}finally{await browser.close()}
