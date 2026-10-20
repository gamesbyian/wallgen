#!/usr/bin/env node
/** First desktop pixel and neighbouring native rotation hit-target census. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,normalizeRotation,encodeRecipe,decodeRecipe} from '../src/model.js';
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/material-desktop-hitmatrix');
await mkdir(out,{recursive:true});
const fixture=normalizeRecipe({
  seed:'material-first-desktop-boundary',structure:'paths',geometry:'zigzag',
  material:'linen',textureStrength:55,textureRotation:359.5,
  textureLayer2Enabled:true,material2:'foil',textureStrength2:70,
  textureRotation2:359.5,textureLayer3Enabled:true,material3:'grain',
  textureStrength3:65,textureRotation3:359.5,
  viewZoom:.75,viewPanX:12,viewPanY:-3,positionX:8,positionY:5
});
const browser=await chromium.launch({headless:true});
const evidence=[],errors=[];
try{
  for(const width of [791,1024,1151,1280]){
    for(const theme of ['cream','dark']){
      const context=await browser.newContext({viewport:{width,height:892},
        reducedMotion:'reduce'});
      const page=await context.newPage();
      page.setDefaultTimeout(20000);
      const browserErrors=[];
      page.on('pageerror',e=>browserErrors.push(String(e)));
      const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
      const rec={width,theme,actions:[],sourceRecipeStable:true};
      try{
        await page.goto(origin+'/?r='+encodeRecipe(fixture),{waitUntil:'domcontentloaded'});
        await page.evaluate(theme=>localStorage.setItem('roygbiv:studio-theme:v1',theme),theme);
        await page.reload({waitUntil:'domcontentloaded'});
        assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),theme);
        await page.locator('#tab-material').click();
        for(let layer=1;layer<=3;layer++){
          const suffix=layer===1?'':String(layer);
          const key='textureRotation'+suffix;
          await page.locator('.editor-tool-chooser [data-editor-tool="finish'+layer+'"]').click();
          const card=page.locator('.editor-tool-card[data-editor-tool="finish'+layer+'"]');
          assert.equal(await card.isVisible(),true);
          const input=card.locator('input[name="'+key+'"]');
          assert.equal(await input.count(),1);
          const control=card.locator('[data-rotate-target="'+key+'"]');
          assert.equal(await control.count(),5);
          for(const [action,datum] of [
            ['minus90','[data-rotate-delta="-90"]'],
            ['minus1','[data-rotate-delta="-1"]'],
            ['plus1','[data-rotate-delta="1"]'],
            ['plus90','[data-rotate-delta="90"]'],
            ['reset','[data-rotate-set="0"]']
          ]){
            const button=card.locator('[data-rotate-target="'+key+'"]'+datum);
            await button.scrollIntoViewIfNeeded();
            const box=await button.evaluate(el=>{
              const r=el.getBoundingClientRect(),
                card=el.closest('.editor-tool-card').getBoundingClientRect(),
                top=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
              return {width:r.width,height:r.height,
                withinCard:r.left>=card.left-1&&r.right<=card.right+1,
                hittable:top===el||el.contains(top),
                label:el.getAttribute('aria-label'),disabled:el.disabled};
            });
            assert.ok(box.width>=24&&box.height>=24&&box.withinCard&&
              box.hittable&&box.label&&!box.disabled,
              'Desktop Material shortcut is squeezed/covered: '+
                JSON.stringify({width,theme,layer,action,box}));
            const before=current();
            await button.click();
            const expected=action==='reset'?0:normalizeRotation(before[key]+
              ({minus90:-90,minus1:-1,plus1:1,plus90:90}[action]));
            assert.deepEqual(current(),{...before,[key]:expected},
              'Desktop rotation changed unrelated source settings at '+width);
            assert.equal(Number(await input.inputValue()),expected);
            rec.actions.push({layer,action,box});
          }
          await page.screenshot({path:join(out,theme+'-'+width+'-finish'+layer+'.png'),
            animations:'disabled'});
        }
        assert.equal(current().viewZoom,fixture.viewZoom);
        assert.equal(current().viewPanX,fixture.viewPanX);
        assert.equal(current().viewPanY,fixture.viewPanY);
        assert.deepEqual(browserErrors,[]);
        evidence.push(rec);
        console.log('MATERIAL_DESKTOP_ROTATION_HIT_PASS',JSON.stringify({
          width,theme,operations:rec.actions.length,
          minWidth:Math.min(...rec.actions.map(a=>a.box.width)),allHittable:true
        }));
      }catch(e){
        errors.push({width,theme,error:String(e),stack:e.stack,browserErrors});
        await page.screenshot({path:join(out,'failure-'+theme+'-'+width+'.png'),
          animations:'disabled'}).catch(()=>{});
      }finally{await context.close();}
    }
  }
  await writeFile(join(out,'evidence.json'),JSON.stringify({evidence,errors,
    bounds:'desktop source center-hit 24px minimum, four nearby supported widths',
    exclusions:['aesthetic subjective approval','physical device']},null,2));
  assert.deepEqual(errors,[],'First desktop Material rotation hits failed');
}finally{await browser.close();}
