#!/usr/bin/env node
/**
 * Independent browser gate for all three actual Material Finish rotations.
 * Click source-wired −90, −1, +1, +90, reset, and edit numeric values;
 * verify lock gating and whole-recipe isolation, not merely DOM presence.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,normalizeRotation,encodeRecipe,decodeRecipe} from '../src/model.js';
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const output=resolve(process.env.ROYGBIV_MATERIAL_OUT||'artifacts/agent3-material-rotation');
await mkdir(output,{recursive:true});
const scenarios=[
  {name:'phone-paths-three-layers',viewport:{width:412,height:892},
    source:{seed:'a3-material-phone',structure:'paths',construction:'ribbon',
      material:'linen',textureCoverage:'both',textureStrength:78,
      textureRotation:17.5,textureLayer2Enabled:true,material2:'foil',
      textureCoverage2:'background',textureStrength2:62,textureRotation2:72.5,
      textureLayer3Enabled:true,material3:'grain',textureCoverage3:'stripes',
      textureStrength3:44,textureRotation3:307.5}},
  {name:'landscape-radial-three-layers',viewport:{width:700,height:412},
    source:{seed:'a3-material-landscape',structure:'radial',radialMode:'pinwheel',
      rayCount:23,material:'canvas',textureStrength:66,textureRotation:217.5,
      textureLayer2Enabled:true,material2:'linen',textureStrength2:50,
      textureRotation2:23.5,textureLayer3Enabled:true,material3:'foil',
      textureStrength3:84,textureRotation3:299.5}}
];
const browser=await chromium.launch({headless:true});
const evidence=[],errors=[];
try{
  for(const scenario of scenarios){
    const page=await browser.newPage({viewport:scenario.viewport,isMobile:true,
      hasTouch:true,reducedMotion:'reduce'});
    page.setDefaultTimeout(15000);
    const localErrors=[];
    page.on('pageerror',e=>localErrors.push(String(e)));
    const recipe=normalizeRecipe(scenario.source);
    const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
    const record=[];
    try{
      await page.goto(origin+'/?r='+encodeRecipe(recipe),{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.body.classList.contains('mobile-five-nav'));
      await page.locator('#mobileEdit').click();
      await page.locator('#tab-material').click();
      assert.equal(await page.locator('#tab-material').getAttribute('aria-selected'),'true');
      for(let layer=1;layer<=3;layer++){
        const key='textureRotation'+(layer===1?'':layer);
        const finish='finish'+layer;
        const material='material'+(layer===1?'':layer);
        await page.locator('.editor-tool-chooser [data-editor-tool="'+finish+'"]').click();
        const card=page.locator('.editor-tool-card[data-editor-tool="'+finish+'"]');
        assert.equal(await card.isVisible(),true);
        assert.equal(await card.getAttribute('aria-label'),'Finish '+layer+' controls');
        const buttons=card.locator('[data-rotate-target="'+key+'"]');
        assert.equal(await buttons.count(),6,'Layer '+layer+' lost a source rotation shortcut');
        const input=card.locator('input[name="'+key+'"]');
        assert.equal(await input.isVisible(),true);
        assert.equal(await input.isEnabled(),true);
        const operation=[
          {delta:-90},{delta:-1},{delta:1},{delta:90},{set:0}
        ];
        for(const op of operation){
          const selector=op.set!==undefined?'[data-rotate-set="'+op.set+'"]':
            '[data-rotate-delta="'+op.delta+'"]';
          const target=card.locator('[data-rotate-target="'+key+'"]'+selector);
          const access=await target.evaluate(el=>({
            label:el.getAttribute('aria-label'),
            rect:[el.getBoundingClientRect().width,el.getBoundingClientRect().height],
            disabled:el.disabled
          }));
          assert.ok(access.label&&access.rect[0]>=24&&access.rect[1]>=24&&!access.disabled,
            'Source shortcut clipped, nameless or disabled: '+JSON.stringify({layer,op,access}));
          const previous=current();
          await target.click();
          const expected=op.set!==undefined?normalizeRotation(op.set):
            normalizeRotation(previous[key]+op.delta);
          await page.waitForFunction(({key,expected})=>{
            const value=JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('r')))[key];
            return Math.abs(value-expected)<.01;
          },{key,expected});
          assert.deepEqual(current(),{...previous,[key]:expected},
            'Layer '+layer+' shortcut modified an unrelated recipe field');
          assert.equal(Number(await input.inputValue()),expected,
            'Native number input failed to reflect source rotation');
          record.push({layer,operation:op,value:expected});
        }
        const beforeTyped=current();
        await input.fill('137.5');
        await input.press('Tab');
        await page.waitForFunction(({key})=>{
          const value=JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('r')))[key];
          return Math.abs(value-137.5)<.01;
        },{key});
        assert.deepEqual(current(),{...beforeTyped,[key]:137.5},
          'Layer '+layer+' typed rotation changed another setting');
        assert.equal(current()[material],beforeTyped[material],
          'Rotating a layer should not change its texture selection');

        const lock=card.locator('.setting-lock[data-lock-key="'+key+'"]');
        assert.equal(await lock.count(),1,'Missing original per-layer rotation lock');
        await lock.click();
        assert.ok(current().lockedSettings.includes(key));
        assert.equal(await input.isDisabled(),true,'Locked numeric rotation editable');
        assert.deepEqual(await buttons.evaluateAll(els=>els.map(el=>el.disabled)),
          [true,true,true,true,true,true],
          'Rotation shortcut bypasses source setting lock for layer '+layer);
        record.push({layer,lockConfirmed:true});
        await lock.click();
        assert.ok(!current().lockedSettings.includes(key));
        assert.equal(await input.isDisabled(),false);
        assert.deepEqual(await buttons.evaluateAll(els=>els.map(el=>el.disabled)),
          [false,false,false,false,false,false],
          'Unlock did not restore source rotation shortcuts');
        await page.screenshot({path:join(output,scenario.name+'-finish-'+layer+'.png'),
          animations:'disabled'});
      }
      assert.equal(current().textureLayer2Enabled,true);
      assert.equal(current().textureLayer3Enabled,true);
      assert.deepEqual(localErrors,[],'Errors while actually using Material rotations');
      evidence.push({scenario:scenario.name,viewport:scenario.viewport,
        operations:record,sourceKeyIntegrity:true});
      console.log('AGENT3_MATERIAL_ROTATION',JSON.stringify({
        scenario:scenario.name,shortcuts:record.length,
        rotations:[current().textureRotation,current().textureRotation2,current().textureRotation3]
      }));
    }catch(error){
      errors.push({scenario:scenario.name,message:String(error),stack:error.stack});
      await page.screenshot({path:join(output,'failure-'+scenario.name+'.png'),
        animations:'disabled'}).catch(()=>{});
    }finally{await page.close()}
  }
  await writeFile(join(output,'evidence.json'),JSON.stringify({
    classification:errors.length?'not verified':'behavior-verified for covered real material actions',
    limitations:['not all material coverage combinations','not textured pixel parity',
      'not native Android','not equivalent-state canonical visual approval'],
    evidence,errors
  },null,2));
  assert.deepEqual(errors,[],'Three-layer rotation acceptance failures');
  console.log('AGENT3_MATERIAL_ROTATION_SUCCESS');
}finally{await browser.close()}
