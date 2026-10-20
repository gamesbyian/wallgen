#!/usr/bin/env node
/**
 * Agent 3: adversarial real mobile file-input import with negative cases.
 * Rejected imports must preserve the current recipe, edit Undo history, and
 * source controls, with an actionable announcement. Then import a valid PNG.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
import {embedPngMetadata} from '../src/png-metadata.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve(process.env.ROYGBIV_IMPORT_NEG_OUT||'artifacts/agent3-negative-png-import');
await mkdir(out,{recursive:true});
const tiny=Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/9QAAAABJRU5ErkJggg==','base64');
const baseline=normalizeRecipe({
  seed:'a3-negative-import-baseline',structure:'regions',regionMode:'nested',
  regionCount:14,regionSides:8,viewZoom:.72,viewPanX:-15,viewPanY:10,
  material:'linen',textureLayer2Enabled:true,material2:'foil',
  textureRotation2:113.5,textureLayer3Enabled:true,material3:'grain',
  textureRotation3:217.5,lockedSettings:['rayCount','textureRotation2'],
  interiorElements:[{id:'a3-target-original',type:'line',shape:'wave',
    placement:'contour',color:'custom',customColor:'#31bfe8',
    colorSlots:[0,3,6],frequency:14,phase:350,width:2.5,enabled:true}]
});
const recovery=normalizeRecipe({
  ...baseline,seed:'a3-valid-recovery-after-errors',
  structure:'radial',radialMode:'pinwheel',rayCount:25,
  textureRotation3:317.5,viewPanX:5,viewPanY:-10
});
const corruptSource=embedPngMetadata(tiny,{},{
  recipe:normalizeRecipe({seed:'a3-negative-import-recipe'})
});
const corrupt=Buffer.from(corruptSource);
const index=corrupt.indexOf('a3-negative-import-recipe');
assert.ok(index>30,'source recipe keyword must be present before damaging its CRC');
corrupt[index]^=1;
const bad=[
  {name:'not-png',buffer:Buffer.from('This is not a wallpaper image'),
    message:/Cannot restore design: Input is not a PNG/},
  {name:'valid-png-no-recipe',buffer:tiny,
    message:/Cannot restore design: This PNG has no R.O.Y.G.B.I.V. recipe metadata/},
  {name:'corrupted-recipe-checksum',buffer:corrupt,
    message:/Cannot restore design: Damaged recipe metadata checksum/},
  {name:'truncated-png-chunk',buffer:Buffer.from(tiny.subarray(0,25)),
    message:/Cannot restore design: (Damaged PNG chunk|This PNG has no R.O.Y.G.B.I.V. recipe metadata)/}
];
const browser=await chromium.launch({headless:true});
const evidence=[],errors=[];
try{
  const context=await browser.newContext({viewport:{width:412,height:892},
    isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page=await context.newPage();
  page.setDefaultTimeout(13000);
  page.on('pageerror',e=>errors.push(String(e)));
  const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
  await page.goto(origin+'/?r='+encodeRecipe(baseline),{waitUntil:'domcontentloaded'});
  assert.deepEqual(current(),baseline);
  await page.locator('#mobileEdit').click();
  await page.locator('#tab-colour').click();
  await page.locator('.editor-tool-chooser [data-editor-tool=rainbow]').click();
  const reverse=page.locator('.editor-tool-card[data-editor-tool=rainbow] [name=reverseStripes]');
  await reverse.setChecked(!baseline.reverseStripes);
  const modified=current();
  assert.equal(modified.reverseStripes,!baseline.reverseStripes);
  // The large dock is inert while Edit is open. Close with the actual
  // visible editor dismiss handle, never a hidden Expand toolbar shortcut.
  await page.locator('#mobileDismissHandle').click();
  await page.locator('#mobileMore').click();
  const file=page.locator('#importRecipeFile');
  const studioStatus=page.locator('#studioStatus');
  for(const item of bad){
    assert.equal(await page.locator('#mobileMore').getAttribute('aria-current'),'page');
    assert.deepEqual(current(),modified,'Unexpected mutation before '+item.name);
    await file.setInputFiles({name:item.name+'.png',mimeType:'image/png',buffer:item.buffer});
    await page.waitForFunction(pattern=>document.getElementById('studioStatus')
      ?.textContent?.startsWith(pattern),'Cannot restore design:');
    const visible=await studioStatus.textContent();
    assert.match(visible,item.message,'Wrong meaningful import error for '+item.name);
    assert.equal(await page.locator('#notice').textContent(),visible,
      'Legacy and accessible Studio notices diverged for '+item.name);
    assert.equal(await file.inputValue(),'',
      'Rejected import did not reset file input for recovery: '+item.name);
    assert.deepEqual(current(),modified,
      'Rejected '+item.name+' import changed wallpaper/camera/material/interior state');
    assert.equal(await page.locator('#undo').isEnabled(),true,
      'Rejected file modified Undo availability');
    evidence.push({name:item.name,announcement:visible,
      preservedSourceRecipe:true,undoAvailable:true,inputReset:true});
    console.log('AGENT3_NEGATIVE_IMPORT',JSON.stringify(evidence.at(-1)));
  }
  // A valid file immediately after multiple errors must still use the same
  // input listener. A prior failure must not poison later imports or locks.
  await file.setInputFiles({
    name:'valid-recovery.png',mimeType:'image/png',
    buffer:Buffer.from(embedPngMetadata(tiny,{title:'Valid after errors'},{recipe:recovery}))
  });
  await page.waitForFunction(seed=>document.getElementById('seedInput').value===seed,
    recovery.seed);
  assert.deepEqual(current(),recovery,'Failed inputs prevented subsequent full recipe restore');
  const success=await studioStatus.textContent();
  assert.match(success,/Restored original wallpaper settings from PNG recipe/);
  assert.equal(await page.locator('#notice').textContent(),success);
  await page.screenshot({path:join(out,'recovered-success.png'),animations:'disabled'});
  evidence.push({name:'valid-after-errors',completeRecipeRestored:true,announcement:success});
  await page.locator('#mobileToolsClose').click();
  await page.locator('#undo').click();
  await page.waitForFunction(seed=>document.getElementById('seedInput').value===seed,
    modified.seed);
  assert.deepEqual(current(),modified,
    'Undo after valid restore must return to the pre-import edited design');
  await page.locator('#undo').click();
  assert.deepEqual(current(),baseline,
    'Negative import events must not insert spurious Undo history steps');
  evidence.push({name:'undo-provenance',restoredEditedAndOriginal:true});
  assert.deepEqual(errors,[],'Uncaught page exceptions during invalid import recovery');
  await writeFile(join(out,'evidence.json'),JSON.stringify({
    classification:'browser-verified rejected import recovery and Undo provenance',
    constraints:['no OS picker automation','no huge 150MB fixture','not native Android',
      'not arbitrary malformed PNG fuzzing or all supported image types'],
    evidence,errors
  },null,2));
  console.log('AGENT3_NEGATIVE_PNG_IMPORT_SUCCESS');
  await context.close();
}catch(error){
  await writeFile(join(out,'failure.json'),JSON.stringify({
    classification:'not verified',message:String(error),stack:error.stack,evidence,errors
  },null,2));
  throw error;
}finally{await browser.close()}
