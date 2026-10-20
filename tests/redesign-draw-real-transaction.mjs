#!/usr/bin/env node
/**
 * Independent, real Chromium source-control Draw acceptance.
 * Unlike DOM mocks, selection uses projected pixels on the visible overlay.
 * Exercise a saved path's non-destructive edit, Undo, Cancel and Apply.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve(process.env.ROYGBIV_DRAW_TRANSACTION_OUT||
  'artifacts/agent3-draw-transaction');
await mkdir(out,{recursive:true});
const points=[
  [.12,.16],[.19,.30],[.28,.42],[.48,.50],
  [.67,.62],[.79,.75],[.87,.87]
];
const source=normalizeRecipe({
  seed:'a3-draw-real-transaction',structure:'paths',geometry:'drawn',
  customPath:points,drawnAnchors:[3],drawnCorners:[],
  extendDrawnPath:true,viewZoom:1,viewPanX:0,viewPanY:0,
  positionX:0,positionY:0
});
const browser=await chromium.launch({headless:true});
const evidence=[],errors=[];
try{
  for(const [width,height] of [[412,892],[700,412]]){
    const page=await browser.newPage({viewport:{width,height},
      isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    page.setDefaultTimeout(14000);
    const unexpected=[];
    page.on('pageerror',err=>unexpected.push(String(err)));
    const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
    const record={width,height,steps:[],errors:unexpected};
    const open=async()=>{
      await page.locator('#drawPathToggle').click();
      await page.locator('#drawPathPanel').waitFor({state:'visible'});
      assert.equal(await page.locator('#drawPathPanel').getAttribute('data-phase'),
        'refine','Saved curve should enter Refine without replacing source');
      assert.equal(await page.locator('#drawSmooth').isDisabled(),true);
      assert.equal(await page.locator('#drawGeometric').isDisabled(),true);
      assert.equal(await page.locator('#drawEditPoints').isVisible(),true);
      await page.locator('#drawEditPoints').click();
      assert.equal(await page.locator('#drawPathPanel').getAttribute('data-phase'),
        'anchors');
    };
    const selectPinned=async()=>{
      const position=await page.evaluate(p=>{
        const r=document.querySelector('#preview').getBoundingClientRect();
        const overlay=document.querySelector('#drawOverlay').getBoundingClientRect();
        const pos={x:r.left+p[0]*r.width,y:r.top+p[1]*r.height};
        return {...pos,visible:!document.querySelector('#drawOverlay').hidden,
          inOverlay:pos.x>=overlay.left&&pos.x<=overlay.right&&
            pos.y>=overlay.top&&pos.y<=overlay.bottom};
      },source.customPath[3]);
      assert.ok(position.visible&&position.inOverlay,'Projected pinned anchor absent');
      await page.mouse.click(position.x,position.y);
      assert.equal(await page.locator('#drawCornerPoint').isDisabled(),false,
        'Actual overlay anchor click did not select the pinned interior node');
      assert.equal(await page.locator('#drawCornerPoint').textContent(),'Make corner');
    };
    try{
      await page.goto(origin+'/?r='+encodeRecipe(source),{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.body.classList.contains('mobile-five-nav'));
      const initial=current();
      assert.deepEqual(initial.customPath,source.customPath);
      await open();
      await selectPinned();
      await page.locator('#drawCornerPoint').click();
      assert.equal(await page.locator('#drawCornerPoint').textContent(),'Make smooth');
      assert.equal(await page.locator('#drawUndoPoint').isDisabled(),false);
      await page.locator('#drawUndoPoint').click();
      assert.equal(await page.locator('#drawCornerPoint').textContent(),'Make corner');
      assert.equal(await page.locator('#drawUndoPoint').isDisabled(),true);
      record.steps.push('real anchor selection, corner and local point Undo');

      // Set the exact 10x upper endpoint using actual keyboard input.
      const strength=page.locator('#drawSmoothingStrength');
      await strength.focus();
      await page.keyboard.press('End');
      assert.equal(Number(await strength.inputValue()),10);
      assert.equal((await page.locator('#drawSmoothingValue').textContent()).trim(),'10.0×');
      await page.screenshot({path:join(out,width+'x'+height+'-pre-cancel.png'),
        animations:'disabled'});
      assert.deepEqual(current(),initial,'A draft may not mutate the URL recipe');
      await page.locator('#drawCancel').click();
      assert.equal(await page.locator('#drawPathPanel').isVisible(),false);
      assert.deepEqual(current(),initial,'Cancel must leave original saved curve intact');
      record.steps.push('10x range input; Cancel left complete recipe unchanged');

      await open();
      await selectPinned();
      await page.locator('#drawCornerPoint').click();
      assert.deepEqual(current(),initial,'Unapplied corner prematurely changed recipe');
      await page.screenshot({path:join(out,width+'x'+height+'-pre-apply.png'),
        animations:'disabled'});
      await page.locator('#drawApply').click();
      await page.waitForFunction(()=>document.querySelector('#drawPathPanel').hidden);
      const applied=current();
      assert.equal(applied.seed,initial.seed);
      assert.equal(applied.structure,'paths');
      assert.equal(applied.geometry,'drawn');
      assert.deepEqual(applied.customPath,initial.customPath,
        'Corner-only edit must not re-fit or damage original path samples');
      assert.ok(applied.drawnCorners.includes(3),'Interior corner was not saved');
      assert.ok(applied.drawnAnchors.includes(3),'Interior pin was not preserved');
      assert.equal(applied.extendDrawnPath,true);
      for(const key of ['viewZoom','viewPanX','viewPanY','positionX','positionY'])
        assert.equal(applied[key],initial[key],key+' changed from unrelated point edit');
      assert.equal(await page.locator('#drawPathPanel').isVisible(),false);
      record.steps.push('Apply persisted only pinned corner; preserved camera and extension');
      record.result={corners:applied.drawnCorners,anchors:applied.drawnAnchors,
        points:applied.customPath.length,cameraStable:true};
      assert.deepEqual(unexpected,[],'Browser reported an uncaught error');
      console.log('AGENT3_DRAW_TRANSACTION',JSON.stringify(record));
      evidence.push(record);
    }catch(error){
      errors.push({width,height,message:String(error),stack:error.stack,record});
      await page.screenshot({path:join(out,'failure-'+width+'x'+height+'.png'),
        animations:'disabled'}).catch(()=>{});
    }finally{await page.close();}
  }
  await writeFile(join(out,'evidence.json'),JSON.stringify({
    classification:errors.length?'not verified':'real Draw authoring transactions accepted',
    limitations:['Does not certify device touch pressure or physical Pixel Chrome',
      'Does not cover all off-frame intersections or geometry combinations'],
    evidence,errors
  },null,2));
  assert.deepEqual(errors,[],'Independent Draw transaction failures');
  console.log('AGENT3_DRAW_TRANSACTION_SUCCESS');
}finally{await browser.close();}
