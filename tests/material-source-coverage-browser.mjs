#!/usr/bin/env node
/** Browser-source Material coverage/blend and dormant strength, issue #170. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe,resolveScene,
  TEXTURE_COVERAGES,BLEND_MODES} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/material-live-coverage');
await mkdir(out,{recursive:true});
const fixture=normalizeRecipe({
  seed:'material-source-coverage-issue170',structure:'paths',geometry:'zigzag',
  material:'linen',textureStrength:67,textureCoverage:'both',
  textureBlend:'normal',textureRotation:31,
  textureLayer2Enabled:true,material2:'foil',textureStrength2:48,
  textureCoverage2:'stripes',textureBlend2:'multiply',textureRotation2:357.5,
  textureLayer3Enabled:true,material3:'grain',textureStrength3:71,
  textureCoverage3:'background',textureBlend3:'overlay',textureRotation3:42.5,
  viewZoom:.75,viewPanX:12,viewPanY:-6,positionX:8,positionY:-4
});
const layers=recipe=>resolveScene(recipe).textureLayers.map(
  ({material,strength,scale,rotation,coverage,blend})=>
    ({material,strength,scale,rotation,coverage,blend}));
const browser=await chromium.launch({headless:true});
const evidence=[],errors=[];
try{
  for(const viewport of [{width:412,height:892},{width:1024,height:768}]){
    const mobile=viewport.width<=790;
    const context=await browser.newContext({viewport,isMobile:mobile,
      hasTouch:mobile,reducedMotion:'reduce'});
    const page=await context.newPage();
    page.setDefaultTimeout(18000);
    const browserErrors=[];
    page.on('pageerror',e=>browserErrors.push(String(e)));
    const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
    const record={viewport,operations:[],sourceOnly:true};
    const chooseLayer=async n=>{
      await page.locator('.editor-tool-chooser [data-editor-tool="layer'+n+'"]').click();
      const card=page.locator('.editor-tool-card[data-editor-tool="layer'+n+'"]');
      assert.equal(await card.isVisible(),true,'Layer card is hidden '+n);
      return card;
    };
    try{
      await page.goto(origin+'/?r='+encodeRecipe(fixture),{waitUntil:'domcontentloaded'});
      if(mobile)await page.locator('#mobileEdit').click();
      await page.locator('#tab-material').click();
      assert.deepEqual(current(),fixture);
      assert.equal(layers(current()).length,3);

      for(let layer=1;layer<=3;layer++){
        const suffix=layer===1?'':String(layer);
        const card=await chooseLayer(layer);
        for(const [key,property,choices] of [
          ['textureCoverage'+suffix,'coverage',TEXTURE_COVERAGES],
          ['textureBlend'+suffix,'blend',BLEND_MODES]
        ]){
          const select=card.locator('select[name="'+key+'"]');
          assert.equal(await select.count(),1,'Original material selector absent: '+key);
          for(const value of choices){
            const before=current(),beforeLayers=layers(before);
            await select.selectOption(value);
            assert.deepEqual(current(),{...before,[key]:value},
              'Source '+key+' modified another serialized field');
            const afterLayers=layers(current());
            assert.equal(afterLayers.length,3);
            assert.equal(afterLayers[layer-1][property],value);
            for(let other=0;other<3;other++)if(other!==layer-1)
              assert.deepEqual(afterLayers[other],beforeLayers[other],
                'Editing material layer '+layer+' mutated unrelated scene layer '+other);
            assert.equal(current().viewZoom,fixture.viewZoom);
            assert.equal(current().viewPanX,fixture.viewPanX);
            assert.equal(current().viewPanY,fixture.viewPanY);
            record.operations.push({layer,key,value});
          }
        }
        await page.screenshot({path:join(out,viewport.width+'-layer'+layer+'.png'),
          animations:'disabled'});
      }

      // Original source lock must disable an otherwise operable selector,
      // without changing either the saved recipe value or painted layers.
      const two=await chooseLayer(2);
      const coverage=two.locator('select[name="textureCoverage2"]');
      const beforeLock=current();
      await two.locator('.setting-lock[data-lock-key="textureCoverage2"]').click();
      assert.equal(await coverage.isDisabled(),true);
      assert.deepEqual(current(),{...beforeLock,
        lockedSettings:[...beforeLock.lockedSettings,'textureCoverage2']});
      await two.locator('.setting-lock[data-lock-key="textureCoverage2"]').click();
      assert.deepEqual(current(),beforeLock);
      assert.equal(await coverage.isEnabled(),true);
      record.operations.push({lock:'textureCoverage2',reversible:true});

      // A user-adjusted zero-strength texture disappears from the resolved
      // material stack but keeps its source knobs; keyboard End restores it.
      await page.locator('.editor-tool-chooser [data-editor-tool="finish2"]').click();
      const strength=page.locator('.editor-tool-card[data-editor-tool="finish2"] input[name="textureStrength2"]');
      const beforeZero=current(),beforeZeroLayers=layers(beforeZero);
      await strength.focus();
      await page.keyboard.press('Home');
      assert.equal(current().textureStrength2,0);
      assert.deepEqual(layers(current()),[beforeZeroLayers[0],beforeZeroLayers[2]]);
      for(const key of ['material2','textureCoverage2','textureBlend2','textureRotation2'])
        assert.deepEqual(current()[key],beforeZero[key],'Zero strength lost '+key);
      await page.keyboard.press('End');
      assert.equal(current().textureStrength2,100);
      assert.equal(layers(current()).length,3);
      record.operations.push({zeroStrength:true,dormantKnobsPreserved:true});

      // Current product uses a native Material selector and "none" to
      // disable an optional layer, not retired Add/Remove controls.
      await chooseLayer(2);
      const material=page.locator('.editor-tool-card[data-editor-tool="layer2"] select[name="material2"]');
      const beforeOff=current(),beforeOffLayers=layers(beforeOff);
      await material.selectOption('none');
      assert.equal(current().material2,'none');
      assert.equal(current().textureLayer2Enabled,false);
      assert.deepEqual(layers(current()),[beforeOffLayers[0],beforeOffLayers[2]]);
      for(const key of ['textureCoverage2','textureBlend2','textureRotation2','textureStrength2','textureScale2'])
        assert.deepEqual(current()[key],beforeOff[key],
          'Optional layer removal erased dormant saved '+key);
      await material.selectOption(beforeOff.material2);
      assert.deepEqual(current(),beforeOff,'Reactivation changed previously authored layer');
      assert.deepEqual(layers(current()),beforeOffLayers);
      record.operations.push({layer2OffAndRevived:true,exactSource:true});
      assert.deepEqual(browserErrors,[]);
      evidence.push(record);
      console.log('MATERIAL_SOURCE_COVERAGE_PASS',JSON.stringify({
        viewport,actions:record.operations.length,
        coverageModes:TEXTURE_COVERAGES.length,blendModes:BLEND_MODES.length,
        threeIndependentLayers:true,dormantRestored:true
      }));
    }catch(error){
      errors.push({viewport,message:String(error),stack:error.stack,
        browserErrors});
      await page.screenshot({path:join(out,'failure-'+viewport.width+'.png'),
        animations:'disabled'}).catch(()=>{});
    }finally{await context.close();}
  }
  await writeFile(join(out,'evidence.json'),JSON.stringify({evidence,errors,
    qualification:'real Chromium source controls plus resolved material scene',
    exclusions:['native OS controls','human visual signoff','every texture raster combination']},null,2));
  assert.deepEqual(errors,[],'Material original-source coverage/blend browser acceptance failed');
}finally{await browser.close();}
