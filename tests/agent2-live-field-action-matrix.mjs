#!/usr/bin/env node
/**
 * Agent 2: independent original field action census.
 * This is an ACTION test, not a DOM/source-presence census. Every eligible
 * source field is given a real user edit in Chromium, with URL recipe witness.
 * Separate source-controlled UI covers the two hidden layer-enable flags.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {SETTING_TOOL} from '../src/editor-schema.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve(process.env.ROYGBIV_FIELD_OUT||'artifacts/agent2-field-actions');
await mkdir(out,{recursive:true});
const baseline={
  seed:'agent2-real-control-census',structure:'paths',geometry:'zigzag',
  construction:'ribbon',motif:'dots',lineStyle:'dotted',composition:'repeat',
  repeatCount:3,orientation:'diagonal',diagonalRotation:23,
  mirrorHorizontal:true,mirrorVertical:true,outline:'double',gap:17,
  individuality:55,patternHomogeneity:39,overridePatternHomogeneity:45,
  lightingMood:'daylight',lightDirection:'top-right',lightStrength:65,
  shadowStrength:45,stripeShadowStrength:64,stripeShadowSoftness:53,
  material:'linen',textureStrength:71,textureScale:49,
  textureLayer2Enabled:true,material2:'foil',textureStrength2:73,
  textureLayer3Enabled:true,material3:'grain',textureStrength3:75,
  lockedSettings:[]
};
const sceneForKey=key=>{
  const mode={};
  if(/^(radialMode|ray)/.test(key)||/^fieldCenter/.test(key))
    Object.assign(mode,{structure:'radial',radialMode:'pinwheel'});
  else if(key==='regionSides')
    Object.assign(mode,{structure:'regions',regionMode:'nested'});
  else if(/^region/.test(key)||/^divider/.test(key))
    Object.assign(mode,{structure:'regions',regionMode:'voronoi',dividerColor:'black'});
  else if(['turnRadius','hairpinAngle'].includes(key))
    Object.assign(mode,{geometry:'hairpin'});
  else if(['loopRadius','loopSweep'].includes(key))
    Object.assign(mode,{geometry:'loop'});
  else if(['loopAspect','crossingMode'].includes(key))
    Object.assign(mode,{geometry:'loops'});
  else if(key==='stepCount')
    Object.assign(mode,{geometry:'stepped'});
  else if(key==='chevronSharpness')
    Object.assign(mode,{geometry:'chevron'});
  else if(key==='extendDrawnPath')
    Object.assign(mode,{geometry:'drawn',composition:'single',
      customPath:[{x:-25,y:25},{x:100,y:650},{x:625,y:1210}]});
  else if(key==='pathLength')
    Object.assign(mode,{composition:'floating'});
  return normalizeRecipe({...baseline,...mode});
};
const intentionallySeparate=new Set([
  'tonalContrast' // disabled legacy Tonal construction, never credit as user-operable
]);
// Layer-enable source checkboxes have no data-setting attribute and are
// deliberately controlled by their user-visible material chooser buttons.
const shard=Number(process.env.AGENT2_FIELD_SHARD||0);
const shardCount=Number(process.env.AGENT2_FIELD_SHARDS||1);
assert.ok(Number.isInteger(shard)&&Number.isInteger(shardCount)&&
  shardCount>0&&shard>=0&&shard<shardCount,'Invalid matrix shard');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:412,height:892},
  isMobile:true,hasTouch:true,reducedMotion:'reduce'});
const page=await context.newPage();
page.setDefaultTimeout(15000);
const observations=[],failures=[],pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
function getOriginalFields(){
  return page.locator('#controls [data-setting]').evaluateAll(nodes=>
    nodes.map(el=>({key:el.name,type:el.type,
      id:el.id,source:el.dataset.setting})));
}
async function goToField(key,original){
  const candidate=SETTING_TOOL[key];
  const url=origin+'/?r='+encodeRecipe(original);
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.body.classList.contains('mobile-five-nav'));
  assert.deepEqual(current(),original,key+': imported fixture mutated before user action');
  if(key!=='primesOnly')await page.locator('#mobileEdit').click();
  if(candidate){
    const tab=page.locator('#tab-'+candidate.category);
    assert.ok(await tab.isEnabled(),key+': source category not available');
    await tab.click();
    const chip=page.locator('.editor-tool-chooser [data-editor-tool="'+candidate.tool+'"]');
    assert.ok(await chip.isVisible(),key+': source tool not visible in its fixture');
    await chip.click();
    assert.equal(await chip.getAttribute('aria-pressed'),'true',
      key+': source tool did not become active');
  }
  const field=page.locator('#controls [name="'+key+'"]');
  assert.equal(await field.count(),1,key+': original field not unique');
  assert.ok(await field.isVisible(),key+': original field hidden despite applicable state');
  assert.ok(await field.isEnabled(),key+': original field unexpectedly locked/inactive');
  assert.equal(await field.getAttribute('data-inactive'),'false',
    key+': source field falsely marked dormant');
  await field.scrollIntoViewIfNeeded();
  return field;
}
async function editOriginal(key,field){
  const kind=await field.getAttribute('type');
  if(kind==='checkbox'){
    const old=await field.isChecked();
    await field.setChecked(!old);
    return {action:'checkbox',from:old,to:!old};
  }
  if(kind==='range'){
    const before=Number(await field.inputValue());
    const max=Number(await field.getAttribute('max'));
    const direction=before<max?'Increase':'Decrease';
    const step=page.locator('#controls .step-button[aria-label="'+direction+' '+key+'"]');
    assert.equal(await step.count(),1,key+': source native range stepper missing');
    await step.click();
    return {action:'pointer-step',direction,from:before};
  }
  if(kind==='number'){
    const before=Number(await field.inputValue());
    const max=Number(await field.getAttribute('max')||360);
    const min=Number(await field.getAttribute('min')||-360);
    const next=before+1<=max?before+1:Math.max(min,before-1);
    await field.fill(String(next));
    await field.press('Tab');
    return {action:'numeric-change',from:before,to:next};
  }
  if(await field.evaluate(el=>el.tagName==='SELECT')){
    const initial=await field.inputValue();
    const choices=await field.locator('option').evaluateAll(options=>
      options.filter(o=>!o.disabled&&!o.hidden&&!o.dataset.inactivePlaceholder)
        .map(o=>o.value));
    const next=choices.find(v=>v!==initial);
    assert.ok(next!==undefined,key+': no alternative available in select');
    await field.selectOption(next);
    return {action:'native-select',from:initial,to:next};
  }
  throw Error(key+': unimplemented source input type '+kind);
}
try{
  await page.goto(origin+'/?r='+encodeRecipe(normalizeRecipe(baseline)));
  const inventory=await getOriginalFields();
  assert.equal(inventory.length,87,'Source field count changed; refresh acceptance scope');
  assert.equal(new Set(inventory.map(f=>f.key)).size,87,
    'Duplicate source field identities would invalidate reachability count');
  const assigned=inventory.filter((item,i)=>i%shardCount===shard);
  for(const {key} of assigned){
    if(intentionallySeparate.has(key))continue;
    try{
      const source=sceneForKey(key);
      const field=await goToField(key,source);
      const beforeToken=new URL(page.url()).searchParams.get('r');
      const action=await editOriginal(key,field);
      await page.waitForFunction(token=>
        new URL(location.href).searchParams.get('r')!==token,
        beforeToken,{timeout:7000});
      const after=current();
      assert.notDeepEqual(after[key],source[key],
        key+': user action changed URL but original setting value did not change');
      const changed=Object.keys(source).filter(name=>
        JSON.stringify(after[name])!==JSON.stringify(source[name]));
      assert.ok(changed.includes(key),key+': original property absent from recipe diff');
      // Inspect locks only when this particular original row owns a source lock.
      // Lock actions never stand in for the field's own actual edit.
      const lock=page.locator('#controls .setting-lock[data-lock-key="'+key+'"]');
      let lockCycle='no-visible-source-lock';
      if(await lock.count()===1 && await lock.isVisible() && await lock.isEnabled()){
        await lock.click();
        assert.ok(current().lockedSettings.includes(key),key+': locking did not persist');
        assert.ok(await field.isDisabled(),key+': locked original field still editable');
        await lock.click();
        assert.ok(!current().lockedSettings.includes(key),key+': unlock did not persist');
        // Selection of a geometry/material may make its own row inactive;
        // in that case the field's inactive state remains authoritative.
        if(await field.getAttribute('data-inactive')==='false')
          assert.ok(await field.isEnabled(),key+': unlocked active field disabled');
        lockCycle='verified';
      }
      const item={key,kind:await field.getAttribute('type'),action,
        before:source[key],after:after[key],changedKeys:changed,lockCycle};
      observations.push(item);
      console.log('AGENT2_FIELD_ACTION',JSON.stringify(item));
    }catch(error){
      const failure={key,error:String(error),stack:error.stack,url:page.url()};
      failures.push(failure);
      console.error('AGENT2_FIELD_FAILURE',key,String(error));
      await page.screenshot({path:join(out,'failure-'+key+'.png'),
        animations:'disabled'}).catch(()=>{});
    }
  }
  const tested=observations.map(v=>v.key);
  const outstanding=assigned.map(f=>f.key)
    .filter(key=>!tested.includes(key)&&!intentionallySeparate.has(key));
  const summary={classification:failures.length?'PARTIAL / unverified':
    'actual Chromium source-field action/URL round-trip acceptance',
    originalFields:inventory.length,shard,shardCount,
    assigned:assigned.length,eligible:assigned.filter(f=>!intentionallySeparate.has(f.key)).length,
    verified:tested.length,intentionallySeparate:[...intentionallySeparate],
    exclusions:['Legacy Tonal construction disabled in native selector',
      'layer enable flags are controlled through original layer controls',
      'physical Android gestures and screen reader',
      'source fields outside tested fixture variants',
      'all possible values/combinations'],inventory,observations,outstanding,
    failures,pageErrors};
  await writeFile(join(out,'evidence.json'),JSON.stringify(summary,null,2));
  assert.deepEqual(pageErrors,[],'Uncaught runtime errors');
  assert.deepEqual(failures,[],'Original input action failures');
  assert.deepEqual(outstanding,[],'Some applicable original fields lack action witnesses');
  console.log('AGENT2_FIELD_ACTION_MATRIX_SUCCESS',shard,shardCount,tested.length);
}finally{await page.close();await context.close();await browser.close();}
