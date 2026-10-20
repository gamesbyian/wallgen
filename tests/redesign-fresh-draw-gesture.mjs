#!/usr/bin/env node
/**
 * Real Chromium freehand Draw acceptance. Starts in Sketch, sends actual
 * pointer events through the overlay, changes interpretation, then verifies
 * Cancel rollback and a second successful Apply. No DOM-dispatched stroke.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const url=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const dir=resolve(process.env.ROYGBIV_FRESH_DRAW_OUT||
  'artifacts/agent3-fresh-draw');
await mkdir(dir,{recursive:true});
const initial=normalizeRecipe({seed:'a3-real-freehand-10x',structure:'paths',
  geometry:'zigzag',customPath:[],viewZoom:1,viewPanX:0,viewPanY:0,
  positionX:0,positionY:0,extendDrawnPath:false});
const browser=await chromium.launch({headless:true});
const checks=[],errors=[];
try{
  for(const [width,height] of [[412,892],[700,412]]){
    const page=await browser.newPage({viewport:{width,height},isMobile:true,
      hasTouch:true,reducedMotion:'reduce'});
    page.setDefaultTimeout(17000);
    const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
    const record={viewport:[width,height],steps:[]};
    const pageErrors=[];
    page.on('pageerror',e=>pageErrors.push(String(e)));
    const begin=async()=>{
      await page.locator('#drawPathToggle').click();
      await page.locator('#drawPathPanel').waitFor({state:'visible'});
      assert.equal(await page.locator('#drawPathPanel').getAttribute('data-phase'),
        'sketch','Fresh path must enter actual Sketch stage');
      assert.ok(await page.locator('#drawOverlay').isVisible());
    };
    const stroke=async()=>{
      const p=await page.locator('#preview').boundingBox();
      assert.ok(p&&p.width>25&&p.height>75,'Unusable real wallpaper pointer area');
      const at=(x,y)=>[p.x+x*p.width,p.y+y*p.height];
      const [startX,startY]=at(.21,.24);
      const [endX,endY]=at(.80,.77);
      const hit=await page.evaluate(([x,y])=>{
        const node=document.elementFromPoint(x,y);
        return {id:node?.id||'',className:node?.className||''};
      },[startX,startY]);
      assert.equal(hit.id,'drawOverlay',
        'Wallpaper stroke start obscured by other source controls: '+JSON.stringify(hit));
      await page.mouse.move(startX,startY);
      await page.mouse.down();
      for(let k=1;k<=24;k++){
        const t=k/24;
        await page.mouse.move(startX+(endX-startX)*t,
          startY+(endY-startY)*(t+.065*Math.sin(t*Math.PI*2)));
      }
      await page.mouse.up();
      await page.waitForFunction(()=>document.querySelector('#drawPathPanel')?.dataset.phase==='refine');
      assert.equal(await page.locator('#drawApply').isEnabled(),true);
      assert.equal(await page.locator('#drawSmooth').isEnabled(),true);
      assert.equal(await page.locator('#drawGeometric').isEnabled(),true);
    };
    try{
      await page.goto(url+'/?r='+encodeRecipe(initial),{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.body.classList.contains('mobile-five-nav'));
      const baseline=current();
      await begin();
      await stroke();
      const slider=page.locator('#drawSmoothingStrength');
      await slider.focus();
      await page.keyboard.press('End');
      assert.equal(Number(await slider.inputValue()),10);
      assert.equal((await page.locator('#drawSmoothingValue').textContent()).trim(),'10.0×');
      await page.locator('#drawGeometric').click();
      assert.equal(await page.locator('#drawGeometric').getAttribute('aria-pressed'),'true');
      await page.locator('#drawSmooth').click();
      assert.equal(await page.locator('#drawSmooth').getAttribute('aria-pressed'),'true');
      assert.deepEqual(current(),baseline,'Unapplied freehand stroke changed recipe');
      await page.screenshot({path:join(dir,width+'x'+height+'-interpreted.png'),
        animations:'disabled'});
      await page.locator('#drawCancel').click();
      assert.equal(await page.locator('#drawPathPanel').isVisible(),false);
      assert.deepEqual(current(),baseline,'Cancel failed to roll back freehand Draw');
      record.steps.push('actual drawn stroke, geometric→smooth, 10x and Cancel rollback');

      await begin();
      await stroke();
      // Real Draw again must discard the provisional curve (not the recipe)
      // and restore a genuinely blank Sketch state before replacing it.
      await page.locator('#drawAgain').click();
      assert.equal(await page.locator('#drawPathPanel').getAttribute('data-phase'),
        'sketch','Draw again did not reset back to Sketch');
      assert.equal(await page.locator('#drawApply').isDisabled(),true,
        'Draw again left stale interpreted geometry Apply-able');
      assert.deepEqual(current(),baseline,'Draw again mutated the saved recipe');
      record.steps.push('Draw again erased only the provisional interpretation');
      // Prove the *continuous* new-stroke sequence: Sketch -> Interpret ->
      // Edit actual first anchor -> Apply. High-strength (10x) interpretation
      // may deliberately reposition endpoints, so start a fresh 1x path
      // here to independently locate the original pointer-down endpoint.
      await slider.focus();
      await page.keyboard.press('Home');
      assert.equal(Number(await slider.inputValue()),1);
      await stroke();
      await page.locator('#drawEditPoints').click();
      assert.equal(await page.locator('#drawPathPanel').getAttribute('data-phase'),
        'anchors','Interpret did not enter the actual point editor');
      const rect=await page.locator('#preview').boundingBox();
      assert.ok(rect);
      const start=[rect.x+rect.width*.21,rect.y+rect.height*.24];
      const target=await page.evaluate(([x,y])=>
        document.elementFromPoint(x,y)?.id||'',start);
      assert.equal(target,'drawOverlay','First freshly drawn anchor is obscured');
      await page.mouse.click(...start);
      assert.equal(await page.locator('#drawDeletePoint').isDisabled(),true,
        'An original endpoint must be non-deletable');
      await page.locator('#drawOverlay').focus();
      await page.keyboard.press('Shift+ArrowRight');
      assert.equal(await page.locator('#drawUndoPoint').isDisabled(),false,
        'Freshly interpreted point movement must be locally undoable');
      assert.deepEqual(current(),baseline,
        'An unpublished fresh-stroke anchor edit contaminated source recipe');
      record.steps.push('continuous Draw -> Interpret -> Edit first anchor, source unchanged before Apply');
      await page.locator('#drawExtendPath').check();
      assert.equal(await page.locator('#drawExtendPath').isChecked(),true);
      await page.locator('#drawApply').click();
      await page.waitForFunction(()=>document.querySelector('#drawPathPanel').hidden);
      const applied=current();
      assert.equal(applied.seed,baseline.seed);
      assert.equal(applied.geometry,'drawn');
      assert.equal(applied.structure,'paths');
      assert.ok(applied.customPath.length>=4,'Actual pointer path did not persist');
      assert.ok(applied.customPath[0][0]>.215,
        'New path Apply did not preserve the manually moved first anchor');
      assert.equal(applied.extendDrawnPath,true);
      for(const name of ['viewZoom','viewPanX','viewPanY','positionX','positionY'])
        assert.equal(applied[name],baseline[name],name+' contaminated by Draw');
      assert.deepEqual(pageErrors,[],'Uncaught app browser errors');
      record.steps.push('new actual stroke, extension enabled, source Apply persisted');
      record.result={points:applied.customPath.length,extension:applied.extendDrawnPath,
        unchangedCamera:true};
      console.log('AGENT3_FRESH_DRAW',JSON.stringify(record));
      checks.push(record);
    }catch(error){
      errors.push({viewport:[width,height],error:String(error),stack:error.stack,record,
        pageErrors});
      await page.screenshot({path:join(dir,'failure-'+width+'x'+height+'.png'),
        animations:'disabled'}).catch(()=>{});
    }finally{await page.close();}
  }
  await writeFile(join(dir,'evidence.json'),JSON.stringify({
    classification:errors.length?'not verified':'actual freehand drawing and interpretation verified',
    limitations:['No native Pixel handwriting or pen pressure acceptance',
      'This is a bounded simple open stroke, not complete weave/intersection geometry'],
    checks,errors
  },null,2));
  assert.deepEqual(errors,[],'Real freehand Draw acceptance failures');
  console.log('AGENT3_FRESH_DRAW_SUCCESS');
}finally{await browser.close();}
