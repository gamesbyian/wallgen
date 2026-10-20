#!/usr/bin/env node
/**
 * The original source field dies must not lie about applicability on initial
 * URL import, before the first subsequent source change. Safety is explicitly
 * excluded by the model from scoped randomization.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
import {SETTING_TOOL} from '../src/editor-schema.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve(process.env.AGENT2_DIE_OUT||'artifacts/agent2-initial-dice');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const cases=[],failures=[];
const source=normalizeRecipe({
  seed:'agent2-initial-import-dice',structure:'paths',geometry:'loops',
  construction:'ribbon',motif:'dots',lineStyle:'dotted',
  shapeFrequency:61,shapeDepth:75,motifSize:44,
  dotSize:29,outline:'none',gap:27,outlineBuffer:19,
  stripeShadowStrength:0,stripeShadowSoftness:63,
  lightingMood:'daylight',lightStrength:50,shadowStrength:31,
  geometrySafety:true,crossingMode:'over-under',
  lockedSettings:['shapeFrequency','motifSize']
});
const samples=[
  {name:'phone-portrait',viewport:{width:412,height:892}},
  {name:'short-landscape',viewport:{width:700,height:412}}
];
for(const sample of samples){
  const context=await browser.newContext({
    viewport:sample.viewport,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page=await context.newPage();
  page.setDefaultTimeout(15000);
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
  const die=key=>page.locator('#controls [data-random-setting="'+key+'"]');
  const field=key=>page.locator('[data-setting][name="'+key+'"]');
  async function choose(key){
    const tool=SETTING_TOOL[key];assert.ok(tool,'no canonical tool for '+key);
    await page.locator('#tab-'+tool.category).click();
    await page.locator('.editor-tool-chooser [data-editor-tool="'+tool.tool+'"]').click();
  }
  try{
    await page.goto(origin+'/?r='+encodeRecipe(source),{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.body.classList.contains('mobile-five-nav'));
    assert.deepEqual(current(),source,sample.name+': imported source recipe drift');
    const keys={
      shapeFrequency:false,motifSize:false,
      gap:false,outlineBuffer:false,
      stripeShadowSoftness:false,
      geometrySafety:false,crossingMode:true,dotSize:true
    };
    for(const [key,expectedEnabled] of Object.entries(keys)){
      assert.equal(await die(key).count(),1,key+': absent source die');
      assert.equal(await die(key).isEnabled(),expectedEnabled,
        sample.name+': first-import die enabled state incorrect for '+key);
      assert.equal(await field(key).isEnabled(),
        key==='geometrySafety'||expectedEnabled,
        sample.name+': original field mismatches '+key);
    }
    assert.match(await die('geometrySafety').getAttribute('title'),
      /never randomized/i);
    assert.match(await die('geometrySafety').getAttribute('aria-label'),
      /not randomized/i);
    // Ordinary safety remains editable. Its die alone is excluded.
    await page.locator('#mobileEdit').click();
    await choose('geometrySafety');
    const safetyValue=current().geometrySafety;
    await field('geometrySafety').setChecked(!safetyValue);
    assert.equal(current().geometrySafety,!safetyValue);
    assert.ok(await die('geometrySafety').isDisabled());
    await field('geometrySafety').setChecked(safetyValue);
    assert.deepEqual(current(),source,'manual safety round-trip affected source');
    // An available setting die genuinely writes the source, not a decoration.
    await choose('dotSize');
    const before=current();
    await die('dotSize').click();
    const after=current();
    assert.notEqual(after.dotSize,before.dotSize,'active die was inert');
    for(const key of Object.keys(before).filter(k=>k!=='dotSize'))
      assert.deepEqual(after[key],before[key],
        'source die changed unrelated '+key);
    // After an edit, all previously locked/dormant dice stay truthful.
    assert.ok(await die('shapeFrequency').isDisabled());
    assert.ok(await die('gap').isDisabled());
    assert.ok(await die('geometrySafety').isDisabled());
    // Unlock a previously imported lock using the actual source control.
    await choose('shapeFrequency');
    await page.locator('.setting-lock[data-lock-key="shapeFrequency"]').click();
    assert.ok(await die('shapeFrequency').isEnabled(),
      'unlock did not re-enable the source die');
    assert.equal(await field('shapeFrequency').isEnabled(),true);
    // Actual source outline change revives a dormant Gap die and retains 27.
    await choose('outline');
    await field('outline').selectOption('double');
    assert.ok(await die('gap').isEnabled(),
      'original dormant setting die did not re-enable');
    assert.equal(current().gap,source.gap);
    assert.equal(await field('gap').inputValue(),String(source.gap));
    assert.ok(await die('geometrySafety').isDisabled());
    cases.push({variant:sample.name,initial:true,
      lockedFields:['shapeFrequency','motifSize'],
      dormant:['gap','outlineBuffer','stripeShadowSoftness'],
      editorialSafety:true,manualSafetyRoundtrip:true,
      independentDotDie:true,liveUnlockAndReactivation:true});
    console.log('AGENT2_INITIAL_DIE',JSON.stringify(cases.at(-1)));
  }catch(e){
    failures.push({variant:sample.name,error:String(e),stack:e.stack,url:page.url()});
    console.error('AGENT2_INITIAL_DIE_FAILURE',sample.name,String(e));
    await page.screenshot({path:join(out,'failure-'+sample.name+'.png'),
      animations:'disabled'}).catch(()=>{});
  }
  failures.push(...errors.map(error=>({variant:sample.name,error})));
  await context.close();
}
await writeFile(join(out,'evidence.json'),JSON.stringify({verified:cases,
  failures,limits:['OS speech','physical Android','all possible scenes']},null,2));
await browser.close();
assert.deepEqual(failures,[]);
assert.equal(cases.length,2);
console.log('AGENT2_INITIAL_DIE_SUCCESS',cases.length);
