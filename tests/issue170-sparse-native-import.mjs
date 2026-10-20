#!/usr/bin/env node
/** Native source PNG-import → sparse Draw insertion → 19.8MP export, issue #170. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe,OUTPUT_WIDTH,OUTPUT_HEIGHT}
  from '../src/model.js';
import {embedPngMetadata,extractPngRecipe} from '../src/png-metadata.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/issue170-native-sparse');
await mkdir(out,{recursive:true});
const tiny=Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/9QAAAABJRU5ErkJggg==','base64');
const imported=normalizeRecipe({
  seed:'issue170-native-import-sparse',structure:'paths',geometry:'drawn',
  material:'none',customPath:[[-.30,.20],[1.30,.80]],
  drawnAnchors:[],drawnCorners:[],extendDrawnPath:true,
  viewZoom:.5,viewPanX:8,viewPanY:-5,positionX:6,positionY:-3
});
const previous=normalizeRecipe({seed:'issue170-before-import',
  structure:'radial',radialMode:'pinwheel'});
const browser=await chromium.launch({headless:true});
const errors=[],observations=[];
try{
  const context=await browser.newContext({viewport:{width:412,height:892},
    isMobile:true,hasTouch:true,reducedMotion:'reduce',acceptDownloads:true});
  const page=await context.newPage();
  page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push({pageError:String(e)}));
  const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
  try{
    await page.goto(origin+'/?r='+encodeRecipe(previous),
      {waitUntil:'domcontentloaded'});
    await page.locator('#mobileMore').click();
    const png=Buffer.from(embedPngMetadata(tiny,{}, {recipe:imported}));
    await page.locator('#importRecipeFile').setInputFiles({
      name:'two-point-imported-drawn.png',mimeType:'image/png',buffer:png
    });
    await page.waitForFunction(seed=>document.querySelector('#seedInput')?.value===seed,
      imported.seed);
    assert.deepEqual(current(),imported,'Real PNG file import changed authored source');
    if(await page.locator('#mobileToolsClose').isVisible())
      await page.locator('#mobileToolsClose').click();
    await page.locator('#drawPathToggle').click();
    await page.locator('#drawPathPanel').waitFor({state:'visible'});
    assert.equal(await page.locator('#drawPathPanel').getAttribute('data-phase'),'refine');
    await page.locator('#drawEditPoints').click();
    assert.equal(await page.locator('#drawPathPanel').getAttribute('data-phase'),'anchors');
    await page.locator('#drawAddPoint').click();
    const projected=await page.evaluate(recipe=>{
      const r=document.getElementById('preview').getBoundingClientRect();
      const center=[(recipe.customPath[0][0]+recipe.customPath[1][0])/2,
        (recipe.customPath[0][1]+recipe.customPath[1][1])/2];
      const x=r.left+r.width*(.5+(center[0]-.5)*recipe.viewZoom+
        (recipe.positionX-recipe.viewZoom*recipe.viewPanX)/100);
      const y=r.top+r.height*(.5+(center[1]-.5)*recipe.viewZoom+
        (recipe.positionY-recipe.viewZoom*recipe.viewPanY)/100);
      const overlay=document.getElementById('drawOverlay');
      const hit=document.elementFromPoint(x,y);
      return {x,y,hit:hit?.id||hit?.tagName,
        overlayHit:hit===overlay||overlay.contains(hit),center};
    },imported);
    assert.equal(projected.overlayHit,true,
      'Off-frame source midpoint is not directly hittable under independent camera');
    await page.mouse.click(projected.x,projected.y);
    assert.equal(await page.locator('#drawUndoPoint').isDisabled(),false,
      'Actual two-point midpoint tap did not produce a reversible edit');
    assert.deepEqual(current(),imported,'Unapplied Draw edit contaminated imported source');
    await page.screenshot({path:join(out,'active-anchor-before-apply.png'),
      animations:'disabled'});
    await page.locator('#drawApply').click();
    await page.waitForFunction(()=>document.querySelector('#drawPathPanel')?.hidden===true);
    const applied=current();
    assert.equal(applied.customPath.length,3,'Source Draw insert did not add station');
    assert.deepEqual(applied.drawnAnchors,[1],'Midpoint not pinned after Apply');
    assert.deepEqual(applied.drawnCorners,[],'Midpoint invented an unwanted corner');
    assert.deepEqual(applied.customPath[0],imported.customPath[0]);
    assert.deepEqual(applied.customPath[2],imported.customPath[1]);
    for(const key of Object.keys(imported).filter(key=>
      !['customPath','drawnAnchors','drawnCorners'].includes(key)))
      assert.deepEqual(applied[key],imported[key],
        'Draw Apply mutated unrelated imported field '+key);
    assert.deepEqual(decodeRecipe(encodeRecipe(applied)),applied,
      'Edited imported recipe lost fidelity on URL round-trip');

    const pending=page.waitForEvent('download',{timeout:180000});
    await page.locator('#mobileDownload').click();
    const file=await pending;
    const bytes=await readFile(await file.path());
    assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);
    assert.equal(bytes.readUInt32BE(16),OUTPUT_WIDTH);
    assert.equal(bytes.readUInt32BE(20),OUTPUT_HEIGHT);
    assert.deepEqual(extractPngRecipe(bytes),applied,
      'Native exported pixels embedded stale pre-Apply Draw metadata');
    await page.screenshot({path:join(out,'after-apply-native-export.png'),
      animations:'disabled'});

    await page.locator('#undo').click();
    assert.deepEqual(current(),imported,
      'Source Undo after native export failed to recover exact two-point import');
    const witness={importedFromRealFileInput:true,sourceCameraAndPositionUnchanged:true,
      projectedMidpoint:projected,insertedPointCount:applied.customPath.length,
      retainedEndpoints:true,pinnedMiddle:true,undoExact:true,
      native:[OUTPUT_WIDTH,OUTPUT_HEIGHT],bytes:bytes.length,
      nativeEmbeddedRecipeExact:true,extendedOffFrame:true};
    observations.push(witness);
    console.log('ISSUE170_SPARSE_NATIVE_IMPORT_EXPORT_PASS',JSON.stringify(witness));
  }catch(e){
    errors.push({message:String(e),stack:e.stack});
    await page.screenshot({path:join(out,'failure.png'),
      animations:'disabled'}).catch(()=>{});
  }finally{await context.close();}
  await writeFile(join(out,'evidence.json'),JSON.stringify({observations,errors,
    excluded:['physical Android picker/OS download','exhaustive paths/render styles']},null,2));
  assert.deepEqual(errors,[],'Actual sparse Draw source PNG import/native export failed');
}finally{await browser.close();}
