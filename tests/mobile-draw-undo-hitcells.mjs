#!/usr/bin/env node
/** Original mobile Draw/Undo: independent 44px hit cells and real source taps. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/mobile-draw-undo-hitcells');
await mkdir(out,{recursive:true});
const source=normalizeRecipe({seed:'draw-undo-source-44',structure:'paths',
  geometry:'zigzag',viewZoom:.8,viewPanX:8,viewPanY:-4,positionX:3});
const browser=await chromium.launch({headless:true}),results=[];
try{
  for(const [width,height] of [[320,892],[412,892],[499,892],[320,700]]){
    for(const theme of ['cream','dark']){
      const ctx=await browser.newContext({viewport:{width,height},
        isMobile:true,hasTouch:true,reducedMotion:'reduce'});
      const page=await ctx.newPage(),errors=[];
      page.setDefaultTimeout(18000);
      page.on('pageerror',e=>errors.push(String(e)));
      try{
        await page.goto(origin+'/?r='+encodeRecipe(source),{waitUntil:'domcontentloaded'});
        await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
        await page.reload({waitUntil:'domcontentloaded'});
        const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
        assert.deepEqual(current(),source);
        const preview=await page.locator('.wallpaper-frame').boundingBox();
        const metrics=[];
        for(const id of ['undo','drawPathToggle']){
          const el=page.locator('.mobile-preview-rail-left #'+id);
          assert.ok(await el.isVisible(),'Original source action hidden: '+id);
          const m=await el.evaluate(node=>{
            const r=node.getBoundingClientRect(),rail=node.closest(
              '.mobile-preview-rail-left').getBoundingClientRect();
            const stage=document.querySelector('.studio-stage').getBoundingClientRect();
            const hits=[.18,.5,.82].flatMap(y=>[.18,.5,.82].map(x=>{
              const top=document.elementFromPoint(r.left+r.width*x,r.top+r.height*y);
              return top===node||node.contains(top);
            }));
            return {width:r.width,height:r.height,x:r.x,y:r.y,
              owners:hits,insideRail:r.left>=rail.left-1&&r.right<=rail.right+1,
              insideStage:r.top>=stage.top-1&&r.bottom<=stage.bottom+1};
          });
          assert.ok(m.width>=44&&m.height>=44&&
            m.owners.every(Boolean)&&m.insideRail&&m.insideStage,
            'Source Draw/Undo touch target blocked/under44: '+JSON.stringify({id,width,height,theme,m}));
          metrics.push({id,...m});
        }
        const [undo,draw]=metrics;
        assert.ok(undo.y+undo.height<=draw.y||draw.y+draw.height<=undo.y,
          'Original Undo and Draw source hit cells overlap');
        assert.equal(await page.locator('#undo').isDisabled(),true);
        await page.locator('#drawPathToggle').tap({position:{x:38,y:38}});
        assert.equal(await page.locator('#drawPathPanel').isVisible(),true,
          'Native Draw tap did not enter original authoring UI');
        assert.equal(await page.locator('#drawPathToggle').getAttribute('aria-pressed'),'true');
        assert.deepEqual(current(),source,'Entering Draw changed wallpaper recipe');
        await page.locator('#drawCancel').tap();
        assert.equal(await page.locator('#drawPathPanel').isVisible(),false);
        assert.deepEqual(current(),source,'Cancel changed saved source recipe');
        await page.locator('#randomizeAll').tap();
        assert.notEqual(current().seed,source.seed,'Real Random action had no effect');
        assert.equal(await page.locator('#undo').isEnabled(),true);
        await page.locator('#undo').tap({position:{x:38,y:38}});
        assert.deepEqual(current(),source,
          'Real Undo edge tap did not restore full source recipe');
        assert.equal(await page.locator('#undo').isDisabled(),true);
        const after=await page.locator('.wallpaper-frame').boundingBox();
        assert.ok(Math.abs(after.height-preview.height)<1,
          '44px Draw/Undo hit cells took additional preview space');
        assert.deepEqual(errors,[],'Uncaught source-browser error');
        const row={width,height,theme,metrics,sourceDraw:true,
          undoFullRecipeRestored:true,previewHeight:preview.height};
        results.push(row);
        await page.screenshot({path:join(out,width+'x'+height+'-'+theme+'.png'),
          animations:'disabled'});
        console.log('DRAW_UNDO_44_PASS',JSON.stringify(row));
      }finally{await ctx.close()}
    }
  }
  await writeFile(join(out,'evidence.json'),JSON.stringify({results,
    unverified:['actual Pixel 6 Pro thumb taps','Android TalkBack',
      'human visual approval']},null,2));
}finally{await browser.close()}
