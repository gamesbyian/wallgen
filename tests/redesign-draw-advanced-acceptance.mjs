#!/usr/bin/env node
/**
 * Physical browser acceptance for the Draw operations not exercised by the
 * original saved-anchor/freehand journeys: sparse segment insertion, anchor
 * deletion, numeric keyboard movement, local 10x resmooth, point-panel reentry,
 * and actual tangent-handle dragging. All mutations must remain provisional
 * until source Apply; Cancel rolls back exactly.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve(process.env.ROYGBIV_ADVANCED_DRAW_OUT||'artifacts/agent3-advanced-draw');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,
  ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{})});
const results=[],errors=[];
const dense=normalizeRecipe({
  seed:'a3-point-handle-boundaries',structure:'paths',geometry:'drawn',
  customPath:[[.16,.19],[.22,.27],[.27,.34],[.34,.40],[.42,.46],
    [.51,.51],[.59,.56],[.67,.63],[.74,.70],[.81,.78],[.86,.85]],
  drawnAnchors:[5],drawnCorners:[],extendDrawnPath:true,
  viewZoom:1.1,viewPanX:3,viewPanY:-3,positionX:4,positionY:-2
});
const sparse=normalizeRecipe({
  seed:'a3-sparse-point-insert',structure:'paths',geometry:'drawn',
  customPath:[[.25,.30],[.72,.69]],drawnAnchors:[],drawnCorners:[],
  viewZoom:1,viewPanX:0,viewPanY:0,positionX:0,positionY:0,
  extendDrawnPath:true
});
const current=page=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
async function openSaved(page){
  await page.locator('#drawPathToggle').click();
  await page.locator('#drawPathPanel').waitFor({state:'visible'});
  assert.equal(await page.locator('#drawPathPanel').getAttribute('data-phase'),'refine');
  await page.locator('#drawEditPoints').click();
  assert.equal(await page.locator('#drawPathPanel').getAttribute('data-phase'),'anchors');
  assert.ok(await page.locator('#drawOverlay').isVisible());
}
async function tapSourcePointCoordinates(page,point,recipe){
  const g=await page.evaluate(({point,zoom,panX,panY,posX,posY})=>{
    const r=document.getElementById('preview').getBoundingClientRect();
    const x=r.left+r.width*(.5+(point[0]-.5)*zoom+(posX-zoom*panX)/100);
    const y=r.top+r.height*(.5+(point[1]-.5)*zoom+(posY-zoom*panY)/100);
    const hit=document.elementFromPoint(x,y),ov=document.getElementById('drawOverlay');
    return {x,y,hit:hit?.id||hit?.tagName||'',inOverlay:x>=ov.getBoundingClientRect().left&&
      x<=ov.getBoundingClientRect().right&&y>=ov.getBoundingClientRect().top&&
      y<=ov.getBoundingClientRect().bottom};
  },{point,zoom:recipe.viewZoom,panX:recipe.viewPanX,panY:recipe.viewPanY,
    posX:recipe.positionX,posY:recipe.positionY});
  assert.ok(g.inOverlay&&g.hit==='drawOverlay',
    'Visible tangent handle obscured: '+JSON.stringify(g));
  return g;
}
async function tapSourcePoint(page,point,recipe){
  const geometry=await page.evaluate(({point,zoom,panX,panY,posX,posY})=>{
    const r=document.getElementById('preview').getBoundingClientRect();
    const x=r.left+r.width*(.5+(point[0]-.5)*zoom+(posX-zoom*panX)/100);
    const y=r.top+r.height*(.5+(point[1]-.5)*zoom+(posY-zoom*panY)/100);
    const hit=document.elementFromPoint(x,y),ov=document.getElementById('drawOverlay');
    return {x,y,hit:hit?.id||hit?.tagName||'',inOverlay:x>=ov.getBoundingClientRect().left&&
      x<=ov.getBoundingClientRect().right&&y>=ov.getBoundingClientRect().top&&
      y<=ov.getBoundingClientRect().bottom};
  },{point,zoom:recipe.viewZoom,panX:recipe.viewPanX,panY:recipe.viewPanY,
    posX:recipe.positionX,posY:recipe.positionY});
  assert.ok(geometry.inOverlay&&geometry.hit==='drawOverlay',
    'An authored anchor/handle is not physically touchable: '+JSON.stringify(geometry));
  await page.mouse.click(geometry.x,geometry.y);
  return geometry;
}
const readPage=async(page,recipe)=>{
  await page.goto(origin+'/?r='+encodeRecipe(recipe),{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.body.classList.contains('mobile-five-nav'));
  assert.deepEqual(current(page),recipe,'Starting authored path does not match source');
};
function unchangedFields(before,after,label){
  for(const [key,value] of Object.entries(before)){
    if(['customPath','drawnAnchors','drawnCorners'].includes(key))continue;
    assert.deepEqual(after[key],value,label+': unrelated source setting '+key+' was modified');
  }
}
try{
  for(const [width,height] of [[412,892],[700,412]]){
    const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:true,
      reducedMotion:'reduce'});
    page.setDefaultTimeout(7000);
    page.setDefaultNavigationTimeout(14000);
    const trace=step=>console.log('AGENT3_ADVANCED_DRAW_STEP',JSON.stringify({width,height,step}));
    const unexpected=[];
    page.on('pageerror',e=>unexpected.push(String(e)));
    const record={viewport:[width,height],operations:[]};
    try{
      trace('open dense saved curve');
      await readPage(page,dense);
      await openSaved(page);
      await tapSourcePoint(page,dense.customPath[5],dense);
      assert.equal(await page.locator('#drawCornerPoint').isDisabled(),false);
      await page.locator('#drawOverlay').focus();
      await page.keyboard.press('Shift+ArrowRight');
      assert.equal(await page.locator('#drawUndoPoint').isDisabled(),false,
        'Real keyboard point movement must create a local Undo snapshot');
      await page.locator('#drawCornerPoint').click();
      assert.equal(await page.locator('#drawCornerPoint').textContent(),'Make smooth');
      await page.locator('#drawEditPoints').click();
      assert.equal(await page.locator('#drawPathPanel').getAttribute('data-phase'),'refine');
      await page.locator('#drawEditPoints').click();
      assert.equal(await page.locator('#drawCornerPoint').textContent(),'Make smooth',
        'Hide/re-enter point mode lost provisional corner');
      const slider=page.locator('#drawSmoothingStrength');
      await slider.focus();
      await page.keyboard.press('End');
      assert.equal(Number(await slider.inputValue()),10);
      trace('capture actual overlay canvas pixels before 10x Resmooth');
      const overlayPixels=()=>page.evaluate(()=>document.getElementById('drawOverlay').toDataURL('image/png'));
      const beforeResmooth=await overlayPixels();
      await page.locator('#drawResmoothPoints').click();
      const afterResmooth=await overlayPixels();
      trace('10x Resmooth canvas pixels captured');
      assert.notDeepEqual(afterResmooth,beforeResmooth,
        'A visibly kinked 10x local Resmooth did not alter the provisional curve');
      assert.equal(await page.locator('#drawUndoPoint').isDisabled(),false,
        'Genuine local Resmooth failed to register a reversible point edit');
      await page.locator('#drawUndoPoint').click();
      const restoredResmooth=await overlayPixels();
      trace('Undo-after-Resmooth canvas pixels captured');
      assert.deepEqual(restoredResmooth,beforeResmooth,
        'Local point Undo did not restore exact pre-resmooth overlay geometry');
      assert.deepEqual(current(page),dense,'Local resmooth/Undo committed before Apply');
      await page.screenshot({path:join(out,width+'x'+height+'-resmooth-draft.png'),
        animations:'disabled'});
      await page.locator('#drawCancel').click();
      assert.deepEqual(current(page),dense,'Cancel failed to roll back the whole advanced draft');
      trace('10x Resmooth, pixel-exact Undo and Cancel passed');
      record.operations.push('physical anchor; keyboard shift nudge; make corner; Hide/Reenter; 10x local resmooth; Cancel');

      await openSaved(page);
      await tapSourcePoint(page,dense.customPath[5],dense);
      await page.locator('#drawOverlay').focus();
      await page.keyboard.press('Shift+ArrowRight');
      await page.locator('#drawCornerPoint').click();
      assert.deepEqual(current(page),dense,'Provisional point edit leaked into recipe');
      await page.locator('#drawApply').click();
      await page.waitForFunction(()=>document.querySelector('#drawPathPanel').hidden);
      const applied=current(page);
      unchangedFields(dense,applied,'keymove apply');
      assert.ok(applied.drawnAnchors.includes(5)&&applied.drawnCorners.includes(5));
      assert.ok(applied.customPath[5][0]>dense.customPath[5][0]+.005,
        'Actual Shift+ArrowRight did not change world-space path geometry');
      assert.deepEqual(applied.customPath[0],dense.customPath[0],
        'Local point operation moved the source endpoint');
      record.operations.push('Apply committed a changed interior anchor and corner, untouched camera');
      trace('saved path keyboard movement and Apply passed');

      // Actual tangent-handle drag, with an existing broken-corner pin.
      // The canvas draws handle squares at source-projected coordinates.
      // Compute the expected pixel target from the same pure point-editor
      // geometry but issue *real* mouse pointer events through the overlay.
      await openSaved(page);
      await tapSourcePoint(page,applied.customPath[5],applied);
      const tangent=await page.evaluate(async recipe=>{
        const {createPointEditor,pointHandles}=await import('/src/path-point-editor.js');
        const e=createPointEditor(recipe.customPath,recipe.drawnAnchors,recipe.drawnCorners);
        return pointHandles(e,5).out;
      },applied);
      const h=await tapSourcePointCoordinates(page,tangent,applied);
      await page.mouse.move(h.x,h.y);
      await page.mouse.down();
      await page.mouse.move(h.x+18,h.y-12,{steps:12});
      await page.mouse.up();
      assert.equal(await page.locator('#drawUndoPoint').isDisabled(),false,
        'Dragging visible tangent handle did not create point Undo');
      assert.deepEqual(current(page),applied,'Unapplied tangent changed recipe');
      await page.screenshot({path:join(out,width+'x'+height+'-handle-draft.png'),
        animations:'disabled'});
      await page.locator('#drawApply').click();
      const handled=current(page);
      unchangedFields(applied,handled,'tangent handle');
      assert.notDeepEqual(handled.customPath,applied.customPath,
        'Real tangent-handle drag left all authored geometry unchanged');
      assert.deepEqual(handled.customPath[0],applied.customPath[0]);
      assert.deepEqual(handled.customPath.at(-1),applied.customPath.at(-1));
      assert.ok(handled.drawnCorners.includes(5)&&handled.drawnAnchors.includes(5));
      record.operations.push('physical tangent-handle drag; Undo available; Apply changed only local geometry');
      trace('physical tangent drag and Apply passed');

      // A true two-endpoint imported path needs a *new station*, rather
      // than selecting an existing interior sample.
      await readPage(page,sparse);
      await openSaved(page);
      await page.locator('#drawAddPoint').click();
      assert.equal(await page.locator('#drawAddPoint').getAttribute('aria-pressed'),'true');
      await tapSourcePoint(page,[(.25+.72)/2,(.30+.69)/2],sparse);
      assert.equal(await page.locator('#drawAddPoint').getAttribute('aria-pressed'),'false');
      assert.equal(await page.locator('#drawUndoPoint').isDisabled(),false);
      assert.deepEqual(current(page),sparse,'Sparse insertion edited recipe before Apply');
      await page.screenshot({path:join(out,width+'x'+height+'-sparse-anchor.png'),
        animations:'disabled'});
      await page.locator('#drawApply').click();
      await page.waitForFunction(()=>document.querySelector('#drawPathPanel').hidden);
      const inserted=current(page);
      assert.equal(inserted.customPath.length,3,'Sparse insertion did not create a real station');
      assert.deepEqual(inserted.drawnAnchors,[1],'Inserted middle station was not pinned');
      unchangedFields(sparse,inserted,'sparse insertion');
      record.operations.push('real midpoint click inserted a third source station, Apply retained pin');

      await openSaved(page);
      await tapSourcePoint(page,inserted.customPath[1],inserted);
      assert.equal(await page.locator('#drawDeletePoint').isDisabled(),false);
      await page.locator('#drawDeletePoint').click();
      assert.equal(await page.locator('#drawUndoPoint').isDisabled(),false);
      assert.deepEqual(current(page),inserted,'Deleting anchor prematurely committed');
      await page.locator('#drawApply').click();
      const unpinned=current(page);
      assert.equal(unpinned.customPath.length,3,
        'Remove anchor must not silently erase sampled curve station');
      assert.deepEqual(unpinned.drawnAnchors,[],
        'Deleted authoring anchor survived Apply');
      assert.deepEqual(unpinned.customPath,inserted.customPath,
        'Deleting only an anchor rewrote the drawn centreline');
      unchangedFields(inserted,unpinned,'remove anchor');
      record.operations.push('Delete anchor removed human pin but retained exactly the source geometry');
      trace('sparse insertion/deletion and Apply passed');
      assert.deepEqual(unexpected,[],'Browser exceptions in advanced Draw acceptance');
      console.log('AGENT3_ADVANCED_DRAW',JSON.stringify(record));
      results.push(record);
    }catch(e){
      console.error('AGENT3_ADVANCED_DRAW_FAILURE',JSON.stringify({width,height,message:String(e),stack:e.stack}));
      errors.push({viewport:[width,height],message:String(e),stack:e.stack,record,
        pageErrors:unexpected});
      await page.screenshot({path:join(out,'failure-'+width+'x'+height+'.png'),
        animations:'disabled',timeout:4000}).catch(()=>{});
    }finally{await page.close();}
  }
  await writeFile(join(out,'evidence.json'),JSON.stringify({
    classification:errors.length?'NOT VERIFIED':'real advanced Draw interactions verified',
    results,errors,
    exclusions:['OS pointer cancellation requires separate browser qualification',
      'Native Android stylus/handwriting and all constrained viewports unqualified']
  },null,2));
  assert.deepEqual(errors,[],'Actual advanced Draw interactions failed');
  console.log('AGENT3_ADVANCED_DRAW_SUCCESS');
}finally{await browser.close();}
