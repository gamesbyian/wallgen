#!/usr/bin/env node
/**
 * Agent 2 live negative journeys: lock a source field, make its effect
 * inapplicable through a different *real* control, then revive and unlock it.
 * Never replace the canonical form, bypass the browser, or fill recipe state
 * via JS after navigation.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {SETTING_TOOL} from '../src/editor-schema.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve(process.env.ROYGBIV_LOCK_OUT||'artifacts/agent2-lock-return');
await mkdir(out,{recursive:true});
const initial={
  structure:'paths',construction:'ribbon',motif:'dots',
  geometry:'zigzag',shapeFrequency:61,shapeDepth:79,
  orientation:'diagonal',diagonalRotation:37,composition:'repeat',
  repeatSpacing:46,lightingMood:'daylight',lightStrength:56,shadowStrength:48,
  lightDirection:'top-right',stripeShadowStrength:64,stripeShadowSoftness:57,
  textureLayer2Enabled:true,material2:'foil',textureStrength2:73,
  textureScale2:52,dividerColor:'black',dividerWidth:23,
  individuality:55,overridePatternHomogeneity:true,
  radialMode:'pinwheel',rayTwist:43,regionMode:'nested',regionSides:8,
  lockedSettings:[]
};
const journeys=[
  {id:'path-geometry',dependent:'shapeFrequency',driver:'geometry',
    off:'straight',on:'zigzag'},
  {id:'diagonal',dependent:'diagonalRotation',driver:'orientation',
    off:'horizontal',on:'diagonal'},
  {id:'repeat',dependent:'repeatSpacing',driver:'composition',
    off:'single',on:'repeat'},
  {id:'lighting',dependent:'lightDirection',driver:'lightingMood',
    off:'off',on:'daylight'},
  {id:'shadow',dependent:'stripeShadowSoftness',driver:'stripeShadowStrength',
    off:0,on:64},
  {id:'material-layer2',dependent:'textureScale2',driver:'textureStrength2',
    off:0,on:73},
  {id:'regional-divider',dependent:'dividerWidth',driver:'dividerColor',
    off:'none',on:'black',source:{structure:'regions',regionMode:'voronoi'}},
  {id:'individuality',dependent:'overridePatternHomogeneity',driver:'individuality',
    off:0,on:55},
  {id:'radial-mode',dependent:'rayTwist',driver:'radialMode',
    off:'concentric',on:'pinwheel',source:{structure:'radial'}},
  {id:'nested-regions',dependent:'regionSides',driver:'regionMode',
    off:'voronoi',on:'nested',source:{structure:'regions',regionMode:'nested'}}
];
const browser=await chromium.launch({headless:true});
const cases=[],failures=[];
const variants=[
  {name:'narrow-cream',viewport:{width:320,height:700},theme:'cream'},
  {name:'portrait',viewport:{width:412,height:892},theme:'cream'},
  {name:'transition-before',viewport:{width:499,height:892},theme:'cream'},
  {name:'transition-after-dark',viewport:{width:500,height:892},theme:'dark'},
  {name:'landscape',viewport:{width:700,height:412},theme:'dark'}
];
async function choose(page,key){
  const loc=SETTING_TOOL[key];
  assert.ok(loc,'Missing original tool home for '+key);
  const tab=page.locator('#tab-'+loc.category);
  await tab.click();
  const chip=page.locator('.editor-tool-chooser [data-editor-tool="'+loc.tool+'"]');
  assert.ok(await chip.isVisible(),key+': hidden tool for this source mode');
  await chip.click();
  assert.equal(await chip.getAttribute('aria-pressed'),'true');
  return page.locator('[data-setting][name="'+key+'"]');
}
async function changeDriver(page,field,value){
  const tag=await field.evaluate(el=>el.tagName);
  if(tag==='SELECT'){await field.selectOption(String(value));return;}
  if(await field.getAttribute('type')==='checkbox'){
    await field.setChecked(Boolean(value));return;
  }
  const key=await field.getAttribute('name');
  const numeric=page.locator('.slider-number[data-number-for="'+key+'"]');
  if(await numeric.count()===1){
    await numeric.fill(String(value));
    await numeric.press('Tab');
    return;
  }
  throw Error('No real source driver input for '+key);
}
for(const variant of variants){
  const context=await browser.newContext({
    viewport:variant.viewport,isMobile:true,hasTouch:true,
    reducedMotion:'reduce'
  });
  const page=await context.newPage();
  page.setDefaultTimeout(16000);
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
  for(const journey of journeys){
    try{
      const source=normalizeRecipe({...initial,...journey.source,
        seed:'agent2-negative-'+journey.id+'-'+variant.name});
      await page.goto(origin+'/?r='+encodeRecipe(source),{
        waitUntil:'domcontentloaded'});
      await page.evaluate(theme=>localStorage.setItem('roygbiv:studio-theme:v1',theme),
        variant.theme);
      await page.reload({waitUntil:'domcontentloaded'});
      assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),
        variant.theme);
      await page.waitForFunction(()=>document.body.classList.contains('mobile-five-nav'));
      assert.deepEqual(current(),source);
      await page.locator('#mobileEdit').click();
      const dependent=await choose(page,journey.dependent);
      const original=source[journey.dependent];
      assert.equal(await dependent.getAttribute('data-inactive'),'false');
      assert.ok(await dependent.isEnabled());
      const lock=page.locator('.setting-lock[data-lock-key="'+journey.dependent+'"]');
      assert.equal(await lock.count(),1,journey.id+': original lock missing');
      await lock.click();
      assert.ok(current().lockedSettings.includes(journey.dependent));
      assert.ok(await dependent.isDisabled());
      let driver=await choose(page,journey.driver);
      await changeDriver(page,driver,journey.off);
      assert.equal(current()[journey.driver],journey.off);
      assert.deepEqual(current()[journey.dependent],original,
        journey.id+': dormant transition destroyed stored source value');
      await choose(page,journey.dependent);
      assert.equal(await dependent.getAttribute('data-inactive'),'true');
      assert.equal(await dependent.isDisabled(),true);
      const inactiveSemantics=await dependent.evaluate(el=>{
        const row=el.closest('.lockable-setting');
        const label=el.labels?.[0]?.textContent?.trim()||
          row?.querySelector('label')?.textContent?.trim()||'';
        return {rowInactive:row?.classList.contains('setting-inactive'),
          label,accessibleName:el.getAttribute('aria-label')||label};
      });
      assert.ok(inactiveSemantics.rowInactive,
        journey.id+': zero output not visibly marked inactive');
      assert.ok(inactiveSemantics.accessibleName.length>2,
        journey.id+': disabled original input lost its source label');
      if(await dependent.getAttribute('type')==='checkbox')
        assert.equal(await dependent.isChecked(),false);
      else assert.equal(await dependent.inputValue(),'0',
        journey.id+': visibly dormant original input must be zero');
      assert.equal(await lock.isDisabled(),true,
        journey.id+': locked dormant source must not toggle');
      driver=await choose(page,journey.driver);
      await changeDriver(page,driver,journey.on);
      assert.equal(current()[journey.driver],journey.on);
      assert.deepEqual(current()[journey.dependent],original);
      await choose(page,journey.dependent);
      assert.equal(await dependent.getAttribute('data-inactive'),'false');
      assert.equal(await dependent.isDisabled(),true,
        journey.id+': recovered source lock was forgotten');
      if(await dependent.getAttribute('type')==='checkbox')
        assert.equal(await dependent.isChecked(),Boolean(original),
          journey.id+': restored original checkbox value not displayed');
      else assert.equal(await dependent.inputValue(),String(original),
        journey.id+': restored source value not displayed');
      assert.equal(await lock.isEnabled(),true,
        journey.id+': a revived setting must allow unlocking');
      await lock.click();
      assert.equal(await dependent.isEnabled(),true);
      assert.ok(!current().lockedSettings.includes(journey.dependent));
      assert.deepEqual(current(),source,journey.id+': negative journey failed full recipe return');
      const sample={viewport:variant.name,theme:variant.theme,id:journey.id,
        dependent:journey.dependent,driver:journey.driver,original,off:journey.off,
        sourceLabel:inactiveSemantics.accessibleName,zeroAndDimmed:true,
        lockDuringDormancy:true,sourceRestored:true};
      cases.push(sample);
      console.log('AGENT2_NEGATIVE_LOCK',JSON.stringify(sample));
    }catch(error){
      failures.push({viewport:variant.name,id:journey.id,error:String(error),stack:error.stack});
      await page.screenshot({
        path:join(out,'failure-'+variant.name+'-'+journey.id+'.png'),
        animations:'disabled'}).catch(()=>{});
      console.error('AGENT2_NEGATIVE_LOCK_FAILURE',variant.name,journey.id,String(error));
    }
  }
  assert.deepEqual(errors,[],'Uncaught browser errors at '+variant.name);
  await context.close();
}
await writeFile(join(out,'evidence.json'),JSON.stringify({classification:
  failures.length?'NOT VERIFIED':'real browser active→dormant→active lock round-trips',
  variants,journeys:journeys.length,passed:cases.length,cases,failures,
  exclusions:['all possible scene combinations','native Android',
    'full OS screen-reader testing','unrelated visual aesthetic approval']
},null,2));
await browser.close();
assert.deepEqual(failures,[],'Source lock return action failure');
assert.equal(cases.length,journeys.length*variants.length);
console.log('AGENT2_NEGATIVE_LOCK_RETURN_SUCCESS',cases.length);
