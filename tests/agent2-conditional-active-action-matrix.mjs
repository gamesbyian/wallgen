#!/usr/bin/env node
/**
 * Agent 2: source-dependent LIVE control transitions in responsive Chromium.
 * Complements the 86-field one-mode action census with a reversible action
 * that really activates, retains or deactivates a conditional neighbour.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {SETTING_TOOL} from '../src/editor-schema.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const shard=Number(process.env.AGENT2_CONDITIONAL_SHARD||0);
const count=Number(process.env.AGENT2_CONDITIONAL_SHARDS||1);
assert.ok(Number.isInteger(shard)&&Number.isInteger(count)&&count>0&&
  shard>=0&&shard<count,'Invalid conditional action shard');
const out=resolve(process.env.ROYGBIV_CONDITIONAL_ACTION_OUT||
  'artifacts/agent2-conditional-live-'+shard);
await mkdir(out,{recursive:true});

const base={
  seed:'agent2-conditional-active-actions',structure:'paths',
  geometry:'zigzag',orientation:'diagonal',diagonalRotation:19,
  composition:'repeat',repeatCount:4,repeatSpacing:61,
  construction:'ribbon',motif:'dots',lineStyle:'dotted',
  outline:'double',gap:21,outlineBuffer:11,
  individuality:55,overridePatternHomogeneity:true,
  lightingMood:'daylight',lightDirection:'top-right',lightStrength:65,
  stripeShadowStrength:70,stripeShadowSoftness:52,
  radialMode:'pinwheel',rayTwist:37,rayCoverage:63,rayCount:21,
  regionMode:'voronoi',regionSides:8,regionJitter:41,
  dividerColor:'black',dividerWidth:27,
  material:'linen',textureStrength:79,
  textureLayer2Enabled:true,material2:'foil',textureStrength2:65,textureScale2:71,
  textureLayer3Enabled:true,material3:'construction',textureStrength3:74,
  textureRotation3:131,lockedSettings:[]
};
// Every listed dormant field already has a *non-default or meaningful*
// retained source value. On/off classification comes from the original UI,
// not a duplicate implementation of the model's applicability predicates.
const cases=[
  {id:'radial-spokes-twist-dormant',overrides:{structure:'radial',
    radialMode:'spokes'},active:'rayCoverage',dormant:'rayTwist',activate:false},
  {id:'radial-concentric-twist-dormant',overrides:{structure:'radial',
    radialMode:'concentric'},active:'rayCount',dormant:'rayTwist',activate:false},
  {id:'regions-nested-jitter-dormant',overrides:{structure:'regions',
    regionMode:'nested'},active:'regionSides',dormant:'regionJitter',activate:false},
  {id:'regions-voronoi-sides-dormant',overrides:{structure:'regions',
    regionMode:'voronoi'},active:'regionJitter',dormant:'regionSides',activate:false},
  {id:'lighting-off-to-daylight',overrides:{lightingMood:'off'},
    active:'lightingMood',to:'daylight',dormant:'lightDirection',activate:true},
  {id:'lighting-zero-to-lit',overrides:{lightingMood:'daylight',
    lightStrength:0,shadowStrength:0},active:'lightStrength',
    dormant:'lightDirection',activate:true},
  {id:'layer2-zero-to-live',overrides:{textureLayer2Enabled:true,
    material2:'foil',textureStrength2:0},active:'textureStrength2',
    dormant:'textureScale2',activate:true},
  {id:'layer3-zero-to-live',overrides:{textureLayer3Enabled:true,
    material3:'construction',textureStrength3:0},active:'textureStrength3',
    dormant:'textureRotation3',activate:true},
  {id:'horizontal-to-diagonal',overrides:{orientation:'horizontal'},
    active:'orientation',to:'diagonal',dormant:'diagonalRotation',activate:true},
  {id:'no-outline-to-double',overrides:{outline:'none'},
    active:'outline',to:'double',dormant:'gap',activate:true},
  {id:'no-divider-to-black',overrides:{structure:'regions',
    dividerColor:'none'},active:'dividerColor',to:'black',
    dormant:'dividerWidth',activate:true},
  {id:'single-to-repeat',overrides:{composition:'single'},
    active:'composition',to:'repeat',dormant:'repeatCount',activate:true},
  {id:'woven-to-ribbon',overrides:{construction:'woven',motif:'dots'},
    active:'construction',to:'ribbon',dormant:'motifSize',activate:true},
  {id:'solid-to-dots',overrides:{construction:'ribbon',motif:'solid'},
    active:'motif',to:'dots',dormant:'motifSize',activate:true},
  {id:'individuality-zero-to-positive',overrides:{individuality:0},
    active:'individuality',dormant:'overridePatternHomogeneity',activate:true},
  {id:'shadow-zero-to-live',overrides:{stripeShadowStrength:0},
    active:'stripeShadowStrength',dormant:'stripeShadowSoftness',activate:true}
];
const layouts=[
  {name:'portrait',width:412,height:892},
  {name:'short-landscape',width:700,height:412}
];
const browser=await chromium.launch({headless:true});
const results=[],errors=[];
const owned=cases.map((item,i)=>({...item,index:i})).filter((_,i)=>i%count===shard);
async function pick(page,key){
  const loc=SETTING_TOOL[key];
  assert.ok(loc,key+': no canonical original tool mapping');
  const tab=page.locator('#tab-'+loc.category);
  await tab.click();
  const chip=page.locator('.editor-tool-chooser [data-editor-tool="'+loc.tool+'"]');
  assert.equal(await chip.isVisible(),true,key+': original tool not navigable');
  await chip.click();
  assert.equal(await chip.getAttribute('aria-pressed'),'true');
  const field=page.locator('[data-setting][name="'+key+'"]');
  assert.equal(await field.count(),1,key+': no unique actual source setting');
  return field;
}
async function changeSource(page,field,target){
  const kind=await field.getAttribute('type');
  const name=await field.getAttribute('name');
  if(await field.evaluate(el=>el.tagName)==='SELECT'){
    assert.ok(target!==undefined,name+': target missing for native select');
    const previous=await field.inputValue();
    await field.selectOption(String(target));
    return {kind:'select',previous,target:String(target)};
  }
  if(kind==='range'){
    const before=Number(await field.inputValue());
    const max=Number(await field.getAttribute('max'));
    const forward=before<max;
    // The source range owns its actual minus/plus buttons in the same
    // stepper. Their accessible names are user-facing and may evolve;
    // select by the stable original field rather than a camelCase label.
    const stepper=field.locator('xpath=..');
    const button=stepper.locator('button.step-button').nth(forward?1:0);
    assert.equal(await button.count(),1,name+': missing original numeric step');
    await button.click();
    return {kind:'range',previous:before,forward};
  }
  throw Error(name+': untested conditional native input kind '+kind);
}
async function undoSource(page,field,record){
  if(record.kind==='select')await field.selectOption(record.previous);
  else {
    const button=field.locator('xpath=..').locator('button.step-button').nth(record.forward?0:1);
    await button.click();
  }
}
for(const layout of layouts){
  const context=await browser.newContext({viewport:{
    width:layout.width,height:layout.height},
    isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page=await context.newPage();
  page.setDefaultTimeout(16000);
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
  for(const item of owned){
    const source=normalizeRecipe({...base,...item.overrides,seed:
      'agent2-condition-'+item.id+'-'+layout.name});
    try{
      await page.goto(origin+'/?r='+encodeRecipe(source),{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>
        document.body.classList.contains('mobile-five-nav'));
      assert.deepEqual(current(),source,item.id+': source URL import changed');
      await page.locator('#mobileEdit').click();
      let active=await pick(page,item.active);
      assert.ok(await active.isVisible(),item.id+': source driver hidden');
      assert.ok(await active.isEnabled(),item.id+': active original disabled');
      assert.equal(await active.getAttribute('data-inactive'),'false');
      const dormant=page.locator('[data-setting][name="'+item.dormant+'"]');
      assert.equal(await dormant.count(),1,item.id+': dormant missing');
      assert.ok(await dormant.isDisabled(),item.id+': dormant field editable');
      assert.equal(await dormant.getAttribute('data-inactive'),'true');
      if(await dormant.getAttribute('type')==='checkbox')
        assert.equal(await dormant.isChecked(),false);
      else assert.equal(await dormant.inputValue(),'0',
        item.id+': inactive display must be zero, not original value');
      const dormantLock=page.locator(
        '.setting-lock[data-lock-key="'+item.dormant+'"]');
      if(await dormantLock.count()===1)
        assert.ok(await dormantLock.isDisabled(),item.id+': inactive lock active');
      const retained=source[item.dormant];
      const token=new URL(page.url()).searchParams.get('r');
      const action=await changeSource(page,active,item.to);
      await page.waitForFunction(old=>
        new URL(location.href).searchParams.get('r')!==old,token);
      assert.notDeepEqual(current()[item.active],source[item.active],
        item.id+': genuine original field edit not saved');
      assert.deepEqual(current()[item.dormant],retained,
        item.id+': source edit destroyed stored inactive value');
      assert.equal(await dormant.getAttribute('data-inactive'),
        item.activate?'false':'true',
        item.id+': conditional reactivation diverged from source reality');
      if(item.activate){
        assert.ok(await dormant.isEnabled(),item.id+': revived field still disabled');
        if(await dormant.getAttribute('type')==='checkbox')
          assert.equal(await dormant.isChecked(),Boolean(retained));
        else assert.equal(await dormant.inputValue(),String(retained),
          item.id+': stored original value not restored on reactivation');
      }
      active=await pick(page,item.active);
      await undoSource(page,active,action);
      await page.waitForFunction(token=>
        new URL(location.href).searchParams.get('r')===token,token);
      assert.deepEqual(current(),source,
        item.id+': restoring driver failed full normalized recipe reversibility');
      assert.ok(await dormant.isDisabled(),
        item.id+': dormant field not re-disabled after returning');
      assert.equal(await dormant.getAttribute('data-inactive'),'true');
      const record={id:item.id,layout:layout.name,active:item.active,
        dormant:item.dormant,mode:item.activate?'reenabled':'remained dormant',
        sourceRetained:retained,sourceWasReversible:true,action};
      results.push(record);
      console.log('AGENT2_CONDITIONAL_ACTION',JSON.stringify(record));
    }catch(error){
      const failure={id:item.id,layout:layout.name,
        reason:String(error),stack:error.stack,url:page.url()};
      errors.push(failure);
      console.error('AGENT2_CONDITIONAL_ACTION_FAILURE',
        layout.name,item.id,String(error));
      await page.screenshot({path:join(out,'fail-'+layout.name+'-'+item.id+'.png'),
        animations:'disabled'}).catch(()=>{});
    }
  }
  errors.push(...pageErrors.map(reason=>({layout:layout.name,reason})));
  await context.close();
}
await writeFile(join(out,'evidence.json'),JSON.stringify({
  classification:errors.length?'NOT VERIFIED':'real browser reversible conditional actions',
  shard,count,totalCases:cases.length,assigned:owned.length,
  expected:owned.length*layouts.length,verified:results.length,layouts,
  actions:results,errors,
  boundaries:['all possible mode/value combinations',
    'physical Android Chrome','OS screen-reader speech','human aesthetic signoff']
},null,2));
await browser.close();
assert.deepEqual(errors,[],'Conditional user action defects');
assert.equal(results.length,owned.length*layouts.length);
console.log('AGENT2_CONDITIONAL_ACTION_SUCCESS',results.length);
