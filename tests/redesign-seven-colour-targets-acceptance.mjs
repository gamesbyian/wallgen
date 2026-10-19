#!/usr/bin/env node
/**
 * Agent 3 independent real browser accessibility+behaviour: seven colour
 * targeting slots, zero-selection guard, custom ink, independent element
 * identity and lock gating. Source UI only, no direct producer calls.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const output=resolve(process.env.ROYGBIV_COLOURS_OUT||'artifacts/agent3-interior-colour-targets');
await mkdir(output,{recursive:true});
const initial=normalizeRecipe({
  seed:'agent3-seven-targets',structure:'radial',radialMode:'pinwheel',
  rayCount:19,viewZoom:.72,viewPanX:12,viewPanY:-6,
  interiorElements:[
    {id:'first-rainbow-line',type:'line',shape:'loop',placement:'field',
      color:'white',width:1.5,colorSlots:[],enabled:true},
    {id:'second-rainbow-line',type:'line',shape:'wave',placement:'contour',
      color:'black',width:2,colorSlots:[0,3,6],enabled:true}
  ]
});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:412,height:892},
  hasTouch:true,isMobile:true,reducedMotion:'reduce'});
page.setDefaultTimeout(13000);
const observations=[],errors=[];
page.on('pageerror',e=>errors.push(String(e)));
const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
const targets=()=>page.locator('.editor-tool-card[data-editor-tool="interior-targets"] .interior-colour-chip input');
async function navigate(tool){
  await page.locator('.editor-tool-chooser [data-editor-tool="'+tool+'"]').click();
  assert.equal(await page.locator('.editor-tool-card[data-editor-tool="'+tool+'"]').isVisible(),true);
}
async function selectElement(index){
  await navigate('interior');
  await page.locator('.editor-tool-card[data-editor-tool="interior"] .interior-toolbar select')
    .selectOption(String(index));
  await navigate('interior-targets');
}
function slots(index){return current().interiorElements[index].colorSlots}
async function assertChips(expected){
  const state=await targets().evaluateAll(nodes=>nodes.map(el=>({
    label:el.getAttribute('aria-label'),checked:el.checked,disabled:el.disabled,
    titled:el.closest('label')?.title
  })));
  assert.deepEqual(state.map(s=>s.label),[
    'Red colour target','Orange colour target','Yellow colour target',
    'Green colour target','Blue colour target','Indigo colour target',
    'Violet colour target'
  ],'All seven named rainbow slots must be present and ordered');
  assert.deepEqual(state.map(s=>s.checked),expected,
    'Visible target chips do not mirror actual source recipe');
  assert.equal(state.every(s=>s.titled&&s.label),true,
    'Colour target chip lost its explicit full accessible name');
  return state;
}
async function evidence(name){
  await page.screenshot({path:join(output,name+'.png'),animations:'disabled'});
  observations.push({name,recipe:current()});
}
try{
  await page.goto(origin+'/?r='+encodeRecipe(initial),{waitUntil:'domcontentloaded'});
  await page.locator('#mobileEdit').click();
  await page.locator('#tab-details').click();
  await selectElement(0);
  assert.equal(await targets().count(),7);
  await assertChips([true,true,true,true,true,true,true]);
  await evidence('initial-all-seven');

  // A colorSlots=[] recipe means "all"; turning one off materializes the
  // remaining six, rather than silently excluding a different hue.
  for(const index of [0,2,4,5,6,3]){
    await targets().nth(index).uncheck();
  }
  assert.deepEqual(slots(0),[1],
    'Six independent pointer unchecks must leave only Orange selected');
  assert.deepEqual(current().interiorElements[1].colorSlots,[0,3,6],
    'Changing first element must not mutate the second element');
  await assertChips([false,true,false,false,false,false,false]);
  await evidence('only-orange');

  // Zero-target state is forbidden: attempting to uncheck the last target
  // must revert visibly and keep the source recipe unchanged.
  const beforeLast=current();
  // click() permits a deliberately rejected uncheck; uncheck() would
  // incorrectly wait for an impossible persistent false state.
  await targets().nth(1).click();
  assert.deepEqual(current(),beforeLast,'Last hue could be silently removed');
  await assertChips([false,true,false,false,false,false,false]);
  observations.push({name:'last-target-guard',guarded:true});

  // Adding every other target returns to the canonical [] all-colours
  // representation, and must repaint checked state for all seven inputs.
  for(const index of [0,2,3,4,5,6])await targets().nth(index).check();
  assert.deepEqual(slots(0),[],'Restoring all seven must normalize to empty colorSlots');
  await assertChips([true,true,true,true,true,true,true]);
  await evidence('all-reselected');

  // An actual live native select and colour input, not model-only assignment.
  const card=page.locator('.editor-tool-card[data-editor-tool="interior-targets"]');
  await card.locator('label').filter({hasText:'Ink'}).locator('select').selectOption('custom');
  const picker=card.locator('input[type="color"]');
  assert.equal(await picker.isDisabled(),false,'Custom ink picker must unlock in custom mode');
  await picker.fill('#42b6e8');
  assert.equal(current().interiorElements[0].color,'custom');
  assert.equal(current().interiorElements[0].customColor,'#42b6e8');
  await evidence('custom-ink');

  // Switching selected element must show its distinct persisted slots,
  // and switching back must restore the first one's unchanged seven slots.
  await selectElement(1);
  await assertChips([true,false,false,true,false,false,true]);
  assert.deepEqual(slots(1),[0,3,6]);
  await evidence('second-element-selective');
  await selectElement(0);
  await assertChips([true,true,true,true,true,true,true]);
  assert.equal(current().interiorElements[0].customColor,'#42b6e8');

  // Locking the whole interior stack must disable all seven targeting
  // controls, while leaving element selection and Unlock available.
  await navigate('interior');
  const lock=page.locator('.editor-tool-card[data-editor-tool="interior"] button')
    .filter({hasText:'Lock all elements'});
  await lock.click();
  assert.ok(current().lockedSettings.includes('interiorElements'));
  await navigate('interior-targets');
  assert.equal((await assertChips([true,true,true,true,true,true,true]))
    .every(s=>s.disabled),true,
    'Locked stack exposed editable colour targets');
  assert.equal(await card.locator('input[type="color"]').isDisabled(),true);
  await evidence('locked-targets');

  await navigate('interior');
  await page.locator('.editor-tool-card[data-editor-tool="interior"] button')
    .filter({hasText:'Unlock all elements'}).click();
  assert.ok(!current().lockedSettings.includes('interiorElements'));
  await navigate('interior-targets');
  assert.equal((await assertChips([true,true,true,true,true,true,true]))
    .some(s=>s.disabled),false);
  assert.deepEqual(current().interiorElements.map(e=>e.id),
    initial.interiorElements.map(e=>e.id),
    'Selection/lock operations changed independent element identities');
  assert.deepEqual(errors,[],'Uncaught browser error');
  await writeFile(join(output,'evidence.json'),JSON.stringify({
    classification:'behavior-verified for tested actual mobile element targeting',
    tested:'all seven named inputs; last-hue guard; full-selection normalization; custom ink; per-ID separation; whole-stack lock',
    exclusions:['native assistive technology speech','all interiors combinations',
      'pixel-level textured export parity','Android physical device'],
    observations,errors
  },null,2));
  console.log('AGENT3_INTERIOR_SEVEN_COLOUR_SUCCESS');
}catch(error){
  await writeFile(join(output,'failure.json'),JSON.stringify({
    classification:'not verified',message:String(error),stack:error.stack,
    currentURL:page.url(),observations,errors
  },null,2));
  await page.screenshot({path:join(output,'failure.png'),animations:'disabled'}).catch(()=>{});
  throw error;
}finally{await browser.close()}
