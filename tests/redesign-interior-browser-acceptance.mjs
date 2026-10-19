#!/usr/bin/env node
/**
 * Agent 3 adversarial integration for merged Agent 2 Interior implementations.
 * Run against the actual responsive editor, not a simulated DOM / fake input.
 * With app served on :4173: node tests/redesign-interior-browser-acceptance.mjs
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const output=resolve(process.env.ROYGBIV_INTERIOR_OUT||'artifacts/agent3-interior-integration');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({
  viewport:{width:412,height:892},deviceScaleFactor:1,isMobile:true,
  hasTouch:true,reducedMotion:'reduce'
});
const page=await context.newPage();
page.setDefaultTimeout(15000);
const errors=[],observations=[];
page.on('pageerror',error=>errors.push(String(error)));
const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
const selectIndex=async()=>{
  const select=page.locator('.editor-tool-card[data-editor-tool="interior"] .interior-toolbar select');
  const index=Number(await select.inputValue());
  const recipe=current();
  return {index,id:recipe.interiorElements[index]?.id||null};
};
const tool=async(category,name)=>{
  await page.locator('#tab-'+category).click();
  await page.locator('.editor-tool-tab[data-editor-tool="'+name+'"]').click();
  await page.locator('.editor-tool-card[data-editor-tool="'+name+'"]:not([hidden])')
    .waitFor({state:'visible'});
};
const checkMotion=async({frequency,phase,minimum,maximum})=>{
  await tool('details','interior-motion');
  const card=page.locator('.editor-tool-card[data-editor-tool="interior-motion"]');
  const freq=card.locator('input[data-rainbow-key=frequency]');
  const turn=card.locator('input[data-rainbow-key=phase]');
  assert.equal(Number(await freq.inputValue()),frequency,'visible frequency silently clamps recipe');
  assert.equal(Number(await turn.inputValue()),phase,'visible phase silently clamps recipe');
  assert.equal(Number(await freq.getAttribute('min')),minimum);
  assert.equal(Number(await freq.getAttribute('max')),maximum);
  assert.equal(Number(await turn.getAttribute('min')),-360);
  assert.equal(Number(await turn.getAttribute('max')),360);
  return {frequency:Number(await freq.inputValue()),
    phase:Number(await turn.inputValue()),
    frequencyBounds:[minimum,maximum],phaseBounds:[-360,360]};
};
const record=(name,detail)=>{
  observations.push({name,...detail});
  console.log('AGENT3_INTERIOR',name,JSON.stringify(detail));
};
try{
  const initial=normalizeRecipe({
    seed:'agent3-interior-selection-e2e',structure:'paths',
    geometry:'zigzag',viewZoom:.8,
    interiorElements:[
      {id:'first',type:'line',shape:'wave',placement:'local',
        frequency:6,phase:0,color:'white',width:1.25},
      {id:'contour',type:'line',shape:'wave',placement:'contour',
        frequency:30,phase:-360,color:'black',width:1.75},
      {id:'field-max',type:'line',shape:'loop',placement:'field',
        frequency:100,phase:360,color:'custom',customColor:'#cc9900',
        width:2,enabled:true}
    ]
  });
  await page.goto(origin+'/?r='+encodeRecipe(initial),{waitUntil:'domcontentloaded'});
  await page.locator('#mobileActionDock').waitFor({state:'visible'});
  await page.locator('#mobileEdit').click();
  await tool('details','interior');
  const choose=page.locator('.editor-tool-card[data-editor-tool="interior"] .interior-toolbar select');
  await choose.selectOption('2');
  assert.deepEqual(await selectIndex(),{index:2,id:'field-max'});
  const field=await checkMotion({frequency:100,phase:360,minimum:.1,maximum:100});
  await page.screenshot({path:join(output,'field-extreme.png'),animations:'disabled'});
  await tool('details','interior');
  await page.locator('.editor-tool-card[data-editor-tool="interior"] button[aria-label="Move element upward"]').click();
  assert.deepEqual(current().interiorElements.map(x=>x.id),['first','field-max','contour']);
  assert.deepEqual(await selectIndex(),{index:1,id:'field-max'},
    'reorder must select same Interior ID, not whatever occupied moved index');
  await page.locator('#undo').click();
  assert.deepEqual(current().interiorElements.map(x=>x.id),['first','contour','field-max']);
  assert.deepEqual(await selectIndex(),{index:2,id:'field-max'},
    'Undo must follow element ID through restored order');
  record('reorder-undo-preserves-interior-identity',{id:'field-max',indexAfterMove:1,
    indexAfterUndo:2,fieldMotion:field});
  // The other element has contour-specific 1..30 integer frequency, with a
  // legitimate phase of -360. It cannot inherit the field slider bounds.
  await choose.selectOption('1');
  assert.deepEqual(await selectIndex(),{index:1,id:'contour'});
  const contour=await checkMotion({frequency:30,phase:-360,minimum:1,maximum:30});
  await page.screenshot({path:join(output,'contour-extreme.png'),animations:'disabled'});
  record('contour-motion-full-range',{selected:'contour',...contour});
  await tool('details','interior');
  await choose.selectOption('2');
  const toRemove=await selectIndex();
  const beforeCount=current().interiorElements.length;
  await page.locator('.editor-tool-card[data-editor-tool="interior"] .interior-toolbar button')
    .filter({hasText:'Remove'}).click();
  assert.equal(current().interiorElements.length,beforeCount-1);
  const surviving=await selectIndex();
  assert.notEqual(surviving.id,toRemove.id,
    'removed element cannot remain selected with a phantom identity');
  await page.locator('#undo').click();
  assert.equal(current().interiorElements.length,beforeCount);
  assert.deepEqual(current().interiorElements.map(x=>x.id),initial.interiorElements.map(x=>x.id));
  record('remove-undo-recipe-exact',{restored:true,selectionAfterRemoval:surviving});
  assert.deepEqual(errors,[],'uncaught browser errors after Interior navigation');
  await writeFile(join(output,'evidence.json'),JSON.stringify({
    classification:'behavior-verified',viewport:'412x892',head:'CI checked out revision',
    observations,errors
  },null,2));
  console.log('AGENT3_INTERIOR_ACCEPTANCE_SUCCESS');
}catch(error){
  await page.screenshot({path:join(output,'failure.png')}).catch(()=>{});
  await writeFile(join(output,'failure.json'),JSON.stringify({
    classification:'not verified',error:String(error),stack:error.stack,
    currentURL:page.url(),observations,errors
  },null,2));
  throw error;
}finally{
  await context.close();
  await browser.close();
}