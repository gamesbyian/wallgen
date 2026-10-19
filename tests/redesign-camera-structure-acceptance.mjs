#!/usr/bin/env node
/**
 * Agent 3 real Chromium camera/composition isolation.
 * Detects the historical zoom-buttons-changing-generation regression.
 * Covers source-controls, not a substitute for full native output parity.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve(process.env.ROYGBIV_CAMERA_OUT||'artifacts/agent3-camera-isolation');
await mkdir(out,{recursive:true});
const scenes=[
  {id:'paths',source:{seed:'a3-camera-paths',structure:'paths',geometry:'zigzag'}},
  {id:'drawn-offframe',source:{seed:'a3-camera-drawn',structure:'paths',
    geometry:'drawn',extendDrawnPath:true,
    customPath:[[-.35,.05],[.15,.35],[.8,.65],[1.3,.95]],
    drawnAnchors:[1,2],drawnCorners:[2],crossingMode:'weave'}},
  {id:'radial',source:{seed:'a3-camera-radial',structure:'radial',
    radialMode:'pinwheel',rayCount:23}},
  {id:'voronoi',source:{seed:'a3-camera-voronoi',structure:'regions',
    regionMode:'voronoi',regionCount:19}},
  {id:'nested',source:{seed:'a3-camera-nested',structure:'regions',
    regionMode:'nested',regionCount:14}}
];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:412,height:892},
  hasTouch:true,isMobile:true,reducedMotion:'reduce'});
page.setDefaultTimeout(16000);
const observations=[],errors=[];
page.on('pageerror',e=>errors.push(String(e)));
const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
async function only(before,changes,label){
  const expected=normalizeRecipe({...before,...changes});
  const actual=current();
  assert.deepEqual(actual,expected,
    label+': camera/nudge action damaged unrelated recipe settings');
  const source=await page.evaluate(()=>({
    zoom:Number(document.querySelector('.studio-stage').dataset.viewZoom),
    panX:Number(document.querySelector('.studio-stage').dataset.viewPanX),
    panY:Number(document.querySelector('.studio-stage').dataset.viewPanY)
  }));
  assert.equal(source.zoom,actual.viewZoom,label+': stage zoom not synced');
  assert.equal(source.panX,actual.viewPanX,label+': stage camera X not synced');
  assert.equal(source.panY,actual.viewPanY,label+': stage camera Y not synced');
  return {label,from:[before.viewZoom,before.viewPanX,before.viewPanY,
      before.positionX,before.positionY],
    to:[actual.viewZoom,actual.viewPanX,actual.viewPanY,
      actual.positionX,actual.positionY]};
}
async function hit(selector){
  const el=page.locator(selector);
  await el.click(); // actual user-facing Playwright pointer action
}
try{
  for(const scenario of scenes){
    const recipe=normalizeRecipe({
      ...scenario.source,viewZoom:.8,viewPanX:10,viewPanY:-5,
      positionX:4,positionY:-3,material:'none'
    });
    await page.goto(origin+'/?r='+encodeRecipe(recipe),{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.body.classList.contains('mobile-preview-tools-ready'));
    assert.deepEqual(current(),recipe,scenario.id+': initial exact source recipe');
    const steps=[];
    let previous=current();
    await hit('.mobile-preview-rail [data-zoom="out"]');
    steps.push(await only(previous,{viewZoom:.7},scenario.id+'/zoom-out'));
    previous=current();
    await hit('.mobile-preview-rail [data-zoom="in"]');
    steps.push(await only(previous,{viewZoom:.8},scenario.id+'/zoom-in'));
    previous=current();
    await hit('.mobile-preview-rail [data-nudge="right"]');
    steps.push(await only(previous,{positionX:5},scenario.id+'/composition-right'));
    previous=current();
    await hit('.mobile-preview-rail [data-nudge="left"]');
    steps.push(await only(previous,{positionX:4},scenario.id+'/composition-left'));

    // The viewport Pan controls live in the More sheet; they must be truly
    // accessible via the named destination rather than scripted dispatch.
    await hit('#mobileMore');
    assert.equal(await page.locator('#mobileMore').getAttribute('aria-current'),'page');
    previous=current();
    await hit('.view-pan-pad [data-view-pan="right"]');
    steps.push(await only(previous,{viewPanX:15},scenario.id+'/view-pan-right'));
    previous=current();
    await hit('.view-pan-pad [data-view-pan="up"]');
    steps.push(await only(previous,{viewPanY:-10},scenario.id+'/view-pan-up'));
    const status=await page.locator('#viewPanStatus').textContent();
    assert.match(status,/Frame X \+15%/,'More status did not describe the rightward camera shift');
    await page.screenshot({path:join(out,scenario.id+'-panned-more.png'),
      animations:'disabled'});
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'mobileMore',
      'Closing More after panning stranded focus');

    previous=current();
    await hit('.mobile-preview-rail [data-zoom="fit"]');
    steps.push(await only(previous,{viewZoom:1,viewPanX:0,viewPanY:0},
      scenario.id+'/full-fit'));
    assert.equal(await page.locator('.mobile-zoom-level').textContent(),'100%',
      scenario.id+': actual zoom rail failed to reflect 100% Fit');
    assert.equal(await page.locator('.mobile-preview-rail [data-zoom="fit"]').isDisabled(),
      true,scenario.id+': Fit should disable only when zoom/pan centered');
    assert.deepEqual(current().customPath,recipe.customPath,
      scenario.id+': camera actions stripped source extended Drawn path');
    await page.screenshot({path:join(out,scenario.id+'-fitted.png'),
      animations:'disabled'});
    observations.push({scenario:scenario.id,steps,
      pathRetained:JSON.stringify(current().customPath)===JSON.stringify(recipe.customPath),
      fitCentered:true});
    console.log('AGENT3_CAMERA_STRUCTURE',JSON.stringify({
      scene:scenario.id,cameraSteps:steps.length,
      final:[current().viewZoom,current().viewPanX,current().viewPanY],
      position:[current().positionX,current().positionY]
    }));
  }
  assert.deepEqual(errors,[],'Uncaught actual UI camera errors');
  await writeFile(join(out,'evidence.json'),JSON.stringify({
    classification:'behavior-verified for five tested source-camera journeys',
    exclusions:['native APK/Android GPU','full exported PNG pixel equality',
      'all conditional structures including legacy Tone','canonical image visual approval'],
    observations,errors
  },null,2));
  console.log('AGENT3_CAMERA_STRUCTURE_SUCCESS');
}catch(error){
  await writeFile(join(out,'failure.json'),JSON.stringify({
    classification:'not verified',message:String(error),stack:error.stack,
    currentURL:page.url(),observations,errors
  },null,2));
  await page.screenshot({path:join(out,'failure.png'),animations:'disabled'}).catch(()=>{});
  throw error;
}finally{await browser.close()}
