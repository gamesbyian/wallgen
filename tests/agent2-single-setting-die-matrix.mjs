#!/usr/bin/env node
/**
 * Every named, user-reachable individual setting die is an original source
 * action. Real Chromium verifies it neither changes another recipe property
 * nor falsely announces a no-op. Separate from setting direct-edit census,
 * Tool/Category scope actions, optional Focus and hidden material switches.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {TOOL_LIST,SETTING_TOOL} from '../src/editor-schema.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const shard=Number(process.env.AGENT2_DIE_MATRIX_SHARD||0);
const shards=Number(process.env.AGENT2_DIE_MATRIX_SHARDS||1);
assert.ok(Number.isInteger(shard)&&Number.isInteger(shards)&&
  shards>0&&shard>=0&&shard<shards,'Invalid source die matrix shard');
const out=resolve(process.env.AGENT2_DIE_MATRIX_OUT||
  'artifacts/agent2-die-matrix-'+shard);
await mkdir(out,{recursive:true});
const base={
  seed:'agent2-individual-dice',structure:'paths',geometry:'zigzag',
  construction:'ribbon',motif:'dots',lineStyle:'dotted',composition:'repeat',
  repeatCount:3,orientation:'diagonal',diagonalRotation:23,
  mirrorHorizontal:true,mirrorVertical:true,outline:'double',gap:17,
  individuality:55,patternHomogeneity:39,overridePatternHomogeneity:45,
  lightingMood:'daylight',lightDirection:'top-right',lightStrength:65,
  shadowStrength:45,stripeShadowStrength:64,stripeShadowSoftness:53,
  material:'linen',textureStrength:71,textureScale:49,
  textureLayer2Enabled:true,material2:'foil',textureStrength2:73,
  textureLayer3Enabled:true,material3:'grain',textureStrength3:75,
  lockedSettings:[],viewZoom:.85,viewPanX:9,viewPanY:-13,
  positionX:7,positionY:-11
};
function sourceForKey(key){
  const scene={};
  if(/^(radialMode|ray)/.test(key)||/^fieldCenter/.test(key))
    Object.assign(scene,{structure:'radial',radialMode:'pinwheel'});
  else if(key==='regionSides')
    Object.assign(scene,{structure:'regions',regionMode:'nested'});
  else if(/^region/.test(key)||/^divider/.test(key))
    Object.assign(scene,{structure:'regions',regionMode:'voronoi',dividerColor:'black'});
  else if(['turnRadius','hairpinAngle'].includes(key))
    Object.assign(scene,{geometry:'hairpin'});
  else if(['loopRadius','loopSweep'].includes(key))
    Object.assign(scene,{geometry:'loop'});
  else if(['loopAspect','crossingMode'].includes(key))
    Object.assign(scene,{geometry:'loops'});
  else if(key==='stepCount')
    Object.assign(scene,{geometry:'stepped'});
  else if(key==='chevronSharpness')
    Object.assign(scene,{geometry:'chevron'});
  else if(key==='extendDrawnPath')
    Object.assign(scene,{geometry:'drawn',composition:'single',
      customPath:[[-.25,.05],[.5,.5],[1.25,.95]]});
  else if(key==='pathLength')
    Object.assign(scene,{composition:'floating'});
  return normalizeRecipe({...base,...scene,seed:'agent2-die-'+key});
}
const excluded=new Set([
  'textureLayer2Enabled','textureLayer3Enabled', // hidden; material is the UI action
  'tonalContrast', // HTML-disabled legacy Tonal construction, cannot open this tool
  'geometrySafety' // editorial constraint, intentionally never randomized
]);
const allKeys=TOOL_LIST.flatMap(t=>t.settings);
assert.equal(allKeys.length,87,'Original schema expected 87 single-home setting names');
assert.equal(new Set(allKeys).size,allKeys.length,
  'Duplicated Tool home makes die matrix witness ambiguous');
const eligible=allKeys.filter(key=>!excluded.has(key));
assert.equal(eligible.length,83,'Source die eligibility policy changed');
const fixtures=eligible.flatMap(key=>['reroll','vary'].map(mode=>
  ({id:key+'-'+mode,key,mode,kind:'live'})));
const lockedKeys=[
  'dotSize','palette','shapeDepth','textureStrength2','rayTwist',
  'regionCount','glow','material2'
];
for(const key of lockedKeys)
  fixtures.push({id:'lock-'+key,key,mode:'reroll',kind:'lock'});
const owned=fixtures.filter((_,i)=>i%shards===shard);
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:412,height:892},
  isMobile:true,hasTouch:true,reducedMotion:'reduce'});
const page=await context.newPage();
page.setDefaultTimeout(16000);
const results=[],failures=[],scriptErrors=[];
page.on('pageerror',e=>scriptErrors.push(String(e)));
const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
const changed=(a,b)=>Object.keys(a).filter(k=>
  JSON.stringify(a[k])!==JSON.stringify(b[k]));
async function open(key){
  const home=SETTING_TOOL[key];assert.ok(home,key+': no actual editor tool');
  await page.locator('#tab-'+home.category).click();
  const chip=page.locator('.editor-tool-chooser [data-editor-tool="'+home.tool+'"]');
  assert.equal(await chip.isVisible(),true,key+': unreachable source Tool');
  await chip.click();
  assert.equal(await chip.getAttribute('aria-pressed'),'true');
  const source=page.locator('[data-setting][name="'+key+'"]');
  const die=page.locator('#controls [data-random-setting="'+key+'"]');
  assert.equal(await source.count(),1,key+': duplicate original field');
  assert.equal(await die.count(),1,key+': duplicate original die');
  assert.ok(await source.isEnabled(),key+': source fixture not applicable');
  assert.ok(await die.isVisible(),key+': live source die hidden');
  return {source,die};
}
for(const item of owned){
  try{
    const original=sourceForKey(item.key);
    await page.goto(origin+'/?r='+encodeRecipe(original),{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.body.classList.contains('mobile-five-nav'));
    assert.deepEqual(current(),original,item.id+': URL import mutated recipe');
    await page.locator('#mobileEdit').click();
    await page.locator('#editorVariationMode').selectOption(item.mode);
    await page.locator('#editorVariationStrength').selectOption('wild');
    const {source,die}=await open(item.key);
    assert.equal(await source.getAttribute('data-inactive'),'false',
      item.id+': source field was inactive');
    assert.ok(await die.isEnabled(),item.id+': active die is disabled');
    if(item.kind==='lock'){
      const lock=page.locator('.setting-lock[data-lock-key="'+item.key+'"]');
      assert.equal(await lock.count(),1,item.id+': original lock absent');
      assert.ok(await lock.isEnabled(),item.id+': original lock unavailable');
      await lock.click();
      assert.ok(current().lockedSettings.includes(item.key));
      assert.ok(await source.isDisabled(),'source field not disabled by lock');
      assert.ok(await die.isDisabled(),'source die bypassed the lock');
      await lock.click();
      assert.ok(await die.isEnabled(),'unlock did not restore original die');
      assert.deepEqual(current(),original,'locking/unlocking changed unrelated source state');
      results.push({id:item.id,kind:item.kind,sourceLock:true,
        dieInitiallyEnabled:true,dieLockedDisabled:true,recovered:true});
      console.log('AGENT2_SETTING_DIE',JSON.stringify(results.at(-1)));
      continue;
    }
    await die.scrollIntoViewIfNeeded();
    const measurement=await die.evaluate(el=>{
      const r=el.getBoundingClientRect();
      const x=r.left+r.width/2,y=r.top+r.height/2;
      const top=document.elementFromPoint(x,y);
      return {width:r.width,height:r.height,
        hit:top===el||el.contains(top)};
    });
    assert.ok(measurement.width>=20&&measurement.height>=20&&measurement.hit,
      item.id+': source die center obstructed '+JSON.stringify(measurement));
    const before=current();
    const oldToken=new URL(page.url()).searchParams.get('r');
    await die.click();
    const after=current();
    const diff=changed(before,after);
    const allowed=new Set([item.key]);
    if(item.key==='material2')allowed.add('textureLayer2Enabled');
    if(item.key==='material3')allowed.add('textureLayer3Enabled');
    assert.deepEqual(diff.filter(k=>!allowed.has(k)),[],
      item.id+': single-setting die mutated another source key');
    assert.deepEqual(after.lockedSettings,before.lockedSettings,
      item.id+': single-setting die touched locks');
    for(const key of ['seed','viewZoom','viewPanX','viewPanY','positionX','positionY'])
      assert.deepEqual(after[key],before[key],item.id+': source framing changed '+key);
    const notice=await page.locator('#studioStatus').textContent();
    if(diff.length){
      assert.match(notice,item.mode==='reroll'?/Rerolled /:/Varied /,
        item.id+': source die falsely announced failure');
      assert.notEqual(new URL(page.url()).searchParams.get('r'),oldToken,
        item.id+': changed source not serialized');
    }else{
      assert.match(notice,/No unlocked, applicable settings changed/,
        item.id+': no-op die falsely announced success');
      assert.equal(new URL(page.url()).searchParams.get('r'),oldToken,
        item.id+': no-op changed the source URL');
    }
    results.push({id:item.id,kind:item.kind,mode:item.mode,
      key:item.key,changed:diff,centerHit:true,truthfulNotice:true,
      seedAndFramingPreserved:true});
    console.log('AGENT2_SETTING_DIE',JSON.stringify(results.at(-1)));
  }catch(error){
    failures.push({id:item.id,error:String(error),stack:error.stack,url:page.url()});
    console.error('AGENT2_SETTING_DIE_FAILURE',item.id,String(error));
    await page.screenshot({path:join(out,'failure-'+item.id+'.png'),
      animations:'disabled'}).catch(()=>{});
  }
}
failures.push(...scriptErrors.map(error=>({id:'browser-error',error})));
await writeFile(join(out,'evidence.json'),JSON.stringify({
  classification:failures.length?'NOT VERIFIED':'source individual die browser action',
  sourceSettingHomes:allKeys.length,eligible:eligible.length,
  excluded:[...excluded],fixtureCount:fixtures.length,
  assigned:owned.length,verified:results.length,shard,shards,
  cases:results,failures,
  boundaries:['unbounded recipe combinations','physical Android and OS AT',
    'human visual approval','Tonal is source-disabled']
},null,2));
await browser.close();
assert.deepEqual(failures,[],'Original individual source die regression');
assert.equal(results.length,owned.length);
console.log('AGENT2_SETTING_DIE_SUCCESS',results.length);
