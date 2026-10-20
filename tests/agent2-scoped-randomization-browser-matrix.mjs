#!/usr/bin/env node
/**
 * Real browser Agent 2 adversarial scoped variation matrix.
 * Tool and Category Reroll/Vary are original source actions. A full recipe
 * diff is more informative than assertions about resulting preview appearance.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {EDITOR_CATEGORIES,TOOL_LIST} from '../src/editor-schema.js';
import {toolAppliesToScene} from '../src/editor-tool-applicability.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const shard=Number(process.env.AGENT2_SCOPE_SHARD||0);
const shards=Number(process.env.AGENT2_SCOPE_SHARDS||1);
assert.ok(Number.isInteger(shard)&&Number.isInteger(shards)&&shards>0&&
  shard>=0&&shard<shards,'Invalid browser matrix shard');
const out=resolve(process.env.AGENT2_SCOPE_OUT||
  'artifacts/agent2-scope-'+shard);
await mkdir(out,{recursive:true});
const base={
  seed:'agent2-live-scope-non-interference',
  structure:'paths',geometry:'zigzag',construction:'ribbon',motif:'dots',
  lineStyle:'dotted',composition:'repeat',repeatCount:3,
  orientation:'diagonal',diagonalRotation:35,
  radialMode:'pinwheel',rayTwist:44,rayCoverage:83,
  regionMode:'voronoi',regionCount:21,regionJitter:38,regionSides:7,
  dividerColor:'black',dividerWidth:30,
  outline:'double',gap:27,lightingMood:'daylight',
  lightStrength:67,shadowStrength:43,stripeShadowStrength:72,
  stripeShadowSoftness:57,individuality:52,
  palette:'jewel',reverseStripes:true,
  material:'linen',textureStrength:65,
  textureLayer2Enabled:true,material2:'foil',textureStrength2:74,
  textureLayer3Enabled:true,material3:'grain',textureStrength3:55,
  patternHomogeneity:45,viewZoom:.8,viewPanX:11,viewPanY:-12,
  positionX:8,positionY:-10,
  lockedSettings:['palette','shapeDepth','textureStrength2']
};
const scenes=[
  {structure:'paths',construction:'ribbon'},
  {structure:'radial',radialMode:'pinwheel'},
  {structure:'regions',regionMode:'voronoi'},
  {structure:'regions',regionMode:'nested'}
];
const fixtures=[];
for(const mode of ['reroll','vary']){
  for(const tool of TOOL_LIST){
    if(tool.id==='tone')continue; // Legacy Tonal is not user-selectable.
    const scene=scenes.find(options=>
      toolAppliesToScene(tool,{...base,...options}));
    assert.ok(scene,'No reachable tool fixture for '+tool.id);
    fixtures.push({id:'tool-'+tool.id+'-'+mode,type:'tool',
      tool,category:tool.category,mode,scene});
  }
  for(const category of EDITOR_CATEGORIES){
    fixtures.push({id:'category-'+category.id+'-'+mode,type:'category',
      category:category.id,mode,scene:scenes[0]});
  }
}
const negative=[
  {id:'locked-background-only',category:'colour',tool:'canvas',
    locked:['background']},
  {id:'locked-material-finish2',category:'material',tool:'finish2',
    locked:['textureStrength2','textureScale2','textureRotation2']},
  {id:'locked-path-geometry',category:'path',tool:'geometry',
    locked:['geometry','shapeFrequency','shapeDepth']}
];
for(const item of negative)fixtures.push({...item,
  id:'no-op-'+item.id,type:'locked-tool',mode:'reroll',scene:scenes[0]});
const owned=fixtures.filter((_,i)=>i%shards===shard);
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:412,height:892},
  isMobile:true,hasTouch:true,reducedMotion:'reduce'});
const page=await context.newPage();
page.setDefaultTimeout(17500);
const passed=[],failures=[],pageErrors=[];
page.on('pageerror',error=>pageErrors.push(String(error)));
const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
const diff=(before,after)=>Object.keys(before).filter(key=>
  JSON.stringify(before[key])!==JSON.stringify(after[key]));
for(const sample of owned){
  try{
    const overrides=sample.scene||{};
    const source=normalizeRecipe({...base,...overrides,
      seed:'agent2-scope-'+sample.id,
      lockedSettings:sample.type==='locked-tool'?sample.locked:base.lockedSettings});
    await page.goto(origin+'/?r='+encodeRecipe(source),{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.body.classList.contains('mobile-five-nav'));
    assert.deepEqual(current(),source,sample.id+': initial import changed');
    await page.locator('#mobileEdit').click();
    await page.locator('#editorVariationMode').selectOption(sample.mode);
    await page.locator('#editorVariationStrength').selectOption('wild');
    await page.locator('#tab-'+sample.category).click();
    const tab=page.locator('#tab-'+sample.category);
    assert.equal(await tab.getAttribute('aria-selected'),'true');
    const toolId=typeof sample.tool==='string'?sample.tool:sample.tool?.id;
    if(sample.type!=='category'){
      const chip=page.locator('.editor-tool-chooser [data-editor-tool="'+toolId+'"]');
      assert.ok(await chip.isVisible(),sample.id+': tool is not reachable');
      await chip.click();
      assert.equal(await chip.getAttribute('aria-pressed'),'true');
    }
    const button=sample.type==='category'
      ?page.locator('#controls [data-random-category="'+sample.category+'"]')
      :page.locator('#controls [data-random-tool="'+toolId+'"]');
    assert.equal(await button.count(),1,sample.id+': missing actual scoped action');
    assert.ok(await button.isVisible(),sample.id+': scope action hidden');
    assert.ok(await button.isEnabled(),sample.id+': scope action disabled');
    // Tool dice share a horizontally scrollable chooser. Their pre-scroll
    // coordinates may lie behind a clip boundary; reproduce what a genuine
    // Playwright click does before asserting physical centre hitability.
    await button.scrollIntoViewIfNeeded();
    const center=await button.evaluate(el=>{
      const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
      const upper=document.elementFromPoint(x,y);
      return {width:r.width,height:r.height,hit:el===upper||el.contains(upper)};
    });
    assert.ok(center.width>0&&center.height>0&&center.hit,
      sample.id+': non-hittable scoped action '+JSON.stringify(center));
    const before=current();
    const beforeToken=new URL(page.url()).searchParams.get('r');
    await button.click();
    const after=current();
    const changes=diff(before,after);
    const allowed=new Set(sample.type==='category'
      ?EDITOR_CATEGORIES.find(c=>c.id===sample.category).tools.flatMap(t=>t.settings)
      :sample.type==='locked-tool'
        ?TOOL_LIST.find(t=>t.id===sample.tool).settings
        :sample.tool.settings);
    if(sample.category==='details'&&
      (sample.type==='category'||sample.tool.id.startsWith('interior')))
      allowed.add('interiorElements');
    if(allowed.has('material2'))allowed.add('textureLayer2Enabled');
    if(allowed.has('material3'))allowed.add('textureLayer3Enabled');
    assert.deepEqual(changes.filter(k=>!allowed.has(k)),[],
      sample.id+': scope action contaminated an unrelated source value');
    assert.equal(after.seed,before.seed,sample.id+': scoped action changed seed');
    assert.deepEqual(after.lockedSettings,before.lockedSettings,
      sample.id+': scope action changed original locks');
    for(const key of before.lockedSettings)
      assert.deepEqual(after[key],before[key],sample.id+': locked '+key+' changed');
    for(const key of ['positionX','positionY','viewZoom','viewPanX','viewPanY'])
      assert.equal(after[key],before[key],sample.id+': camera/position changed '+key);
    const notice=await page.locator('#studioStatus').textContent();
    if(sample.type==='locked-tool'){
      assert.deepEqual(changes,[],sample.id+': all-locked tool had side effects');
      assert.match(notice,/No unlocked, applicable settings changed/);
      assert.equal(new URL(page.url()).searchParams.get('r'),beforeToken);
    }else if(changes.length===0){
      assert.match(notice,/No unlocked, applicable settings changed/,
        sample.id+': silent/no-op scope action has misleading confirmation');
      assert.equal(new URL(page.url()).searchParams.get('r'),beforeToken);
    }else{
      assert.match(notice,sample.mode==='reroll'?/Rerolled /:/Varied /,
        sample.id+': successful scope action has no global announcement');
      assert.notEqual(new URL(page.url()).searchParams.get('r'),beforeToken);
    }
    const record={id:sample.id,type:sample.type,mode:sample.mode,
      source:sample.category,tool:toolId||null,
      centerHit:!(!center.hit),modified:changes,modifiedCount:changes.length,
      noUnrelatedMutations:true,lockedIntact:true,cameraIntact:true,
      notice};
    passed.push(record);
    console.log('AGENT2_LIVE_SCOPE',JSON.stringify(record));
  }catch(error){
    failures.push({id:sample.id,reason:String(error),stack:error.stack,url:page.url()});
    console.error('AGENT2_LIVE_SCOPE_FAILURE',sample.id,String(error));
    await page.screenshot({path:join(out,'fail-'+sample.id+'.png'),
      animations:'disabled'}).catch(()=>{});
  }
}
failures.push(...pageErrors.map(reason=>({id:'browser-pageerror',reason})));
await writeFile(join(out,'evidence.json'),JSON.stringify({
  classification:failures.length?'NOT VERIFIED':'original source scoped actions',
  total:fixtures.length,shard,shards,assigned:owned.length,verified:passed.length,
  observed:passed,failures,boundaries:['native Android hardware',
    'random outcomes cannot guarantee each eligible setting mutates',
    'rare combination interactions','human optical approval']
},null,2));
await browser.close();
assert.deepEqual(failures,[],'Found scoped source action regression(s)');
assert.equal(passed.length,owned.length);
console.log('AGENT2_LIVE_SCOPE_SUCCESS',passed.length);
