#!/usr/bin/env node
/**
 * Agent 2, runtime negative-state / More capability acceptance.
 * Uses real Chromium clicks, browser file inputs, clipboard, download, DOM
 * state and URL recipes; a source inventory alone cannot pass this gate.
 *
 * Local: npm install --no-save playwright@1.56.1 serve@14.2.5
 *        npx serve . -l 4173
 *        node tests/redesign-controls-conditional-acceptance.mjs
 */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve(process.env.ROYGBIV_CONTROLS_OUT||'artifacts/agent2-controls');
await mkdir(out,{recursive:true});
const baseline=normalizeRecipe({
  seed:'agent2-controls-baseline',structure:'paths',geometry:'zigzag',
  shapeFrequency:61,shapeDepth:79,orientation:'diagonal',
  diagonalRotation:27,mirrorHorizontal:true,material:'linen',
  textureLayer2Enabled:true,material2:'foil',textureStrength2:77,
  textureRotation2:133.5,lockedSettings:['textureRotation2'],
  viewZoom:.8,viewPanX:10,positionX:-3,
  interiorElements:[{id:'agent2-ink',type:'line',shape:'wave',
    placement:'field',frequency:12,color:'custom',customColor:'#26a2d6',
    colorSlots:[0,3,6],enabled:true}]
});
const imported=normalizeRecipe({
  ...baseline,seed:'agent2-json-restored',structure:'regions',
  regionMode:'nested',regionSides:8,regionCount:21,
  textureLayer3Enabled:true,material3:'construction',
  textureStrength3:84,viewPanY:-15
});
const browser=await chromium.launch({headless:true});
const cases=[],errors=[];
const context=await browser.newContext({
  viewport:{width:412,height:892},hasTouch:true,isMobile:true,
  reducedMotion:'reduce',acceptDownloads:true
});
await context.grantPermissions(['clipboard-read','clipboard-write'],{origin});
const page=await context.newPage();
page.setDefaultTimeout(16000);
page.on('pageerror',error=>errors.push(String(error)));
const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
function record(id,data){cases.push({id,...data});console.log('AGENT2_CONTROLS',id,JSON.stringify(data))}
async function status(regex){
  await page.waitForFunction(source=>new RegExp(source).test(
    document.getElementById('studioStatus')?.textContent||''),regex.source);
  const accessible=await page.locator('#studioStatus').textContent();
  assert.match(accessible,regex);
  assert.equal(await page.locator('#notice').textContent(),accessible,
    'Source notice and persistent global status diverged');
  return accessible;
}
async function nav(id){
  await page.locator('#'+id).click();
  await page.waitForFunction(key=>document.getElementById(key)
    ?.getAttribute('aria-current')==='page',id);
}
async function hit(selector){
  const loc=page.locator(selector);
  assert.equal(await loc.count(),1,'Missing/duplicate source control: '+selector);
  await loc.scrollIntoViewIfNeeded();
  const measurement=await loc.evaluate(el=>{
    const box=el.getBoundingClientRect();
    const x=box.left+box.width/2,y=box.top+box.height/2;
    const top=document.elementFromPoint(x,y);
    const style=getComputedStyle(el);
    return {width:box.width,height:box.height,
      visible:style.visibility!=='hidden'&&style.display!=='none'&&
        !el.closest('[hidden],[inert]'),enabled:!el.disabled,
      hit:top===el||el.contains(top),
      label:el.getAttribute('aria-label')||el.labels?.[0]?.textContent?.trim()||
        el.innerText?.trim()||el.title||''};
  });
  assert.ok(measurement.visible&&measurement.enabled&&measurement.hit,
    selector+' failed source clickability: '+JSON.stringify(measurement));
  assert.ok(measurement.label,selector+' has no descriptive name');
  return measurement;
}
try{
  await page.goto(origin+'/?r='+encodeRecipe(baseline),{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.body.classList.contains('mobile-five-nav'));
  assert.deepEqual(current(),baseline);
  const semantics=await page.locator('#studioStatus').evaluate(el=>({
    role:el.getAttribute('role'),live:el.getAttribute('aria-live'),
    atomic:el.getAttribute('aria-atomic')
  }));
  assert.deepEqual(semantics,{role:'status',live:'polite',atomic:'true'});
  const mutations=await page.evaluate(()=>{
    const observed=[];
    const el=document.getElementById('studioStatus');
    const observer=new MutationObserver(()=>observed.push(el.textContent));
    observer.observe(el,{childList:true,characterData:true,subtree:true});
    window.__agent2StatusEvents=observed;
    return true;
  });
  assert.ok(mutations);

  // Studio must expose unchanged quick actions, and its five destination
  // siblings must not be mistaken for the three relocated source buttons.
  for(const id of ['mobileStudio','mobileEdit','mobileExplore','mobileSaved','mobileMore'])
    await hit('#'+id);
  for(const id of ['mobileFavorite','mobileDownload','randomizeAll','drawPathToggle'])
    await hit('#'+id);
  await nav('mobileEdit');
  assert.equal(await page.locator('#mobileActionDock').evaluate(el=>el.inert),true,
    'The off-screen dock remained operable during Edit');
  await page.locator('#tab-path').click();
  await page.locator('.editor-tool-chooser [data-editor-tool="geometry"]').click();
  const shape=page.locator('.editor-tool-card[data-editor-tool="geometry"] [name="shapeFrequency"]');
  const depth=page.locator('.editor-tool-card[data-editor-tool="geometry"] [name="shapeDepth"]');
  assert.equal(await shape.inputValue(),'61');
  assert.equal(await depth.inputValue(),'79');
  const geometry=page.locator('.editor-tool-card[data-editor-tool="geometry"] [name="geometry"]');
  await geometry.selectOption('straight');
  assert.equal(current().geometry,'straight');
  assert.equal(current().shapeFrequency,61,'Dormant frequency destroyed');
  assert.equal(current().shapeDepth,79,'Dormant depth destroyed');
  assert.equal(await shape.inputValue(),'0');
  assert.equal(await depth.inputValue(),'0');
  assert.ok(await shape.isDisabled()&&await depth.isDisabled());
  const inactive=await shape.evaluate(el=>({
    row:el.closest('.lockable-setting')?.classList.contains('setting-inactive'),
    lockDisabled:el.closest('.lockable-setting')?.querySelector('.setting-lock')?.disabled,
    stepDisabled:[...el.closest('.lockable-setting').querySelectorAll(
      '.step-button,.slider-number')].every(n=>n.disabled)
  }));
  assert.deepEqual(inactive,{row:true,lockDisabled:true,stepDisabled:true});
  await geometry.selectOption('zigzag');
  assert.equal(await shape.inputValue(),'61');
  assert.equal(await depth.inputValue(),'79');
  assert.ok(await shape.isEnabled()&&await depth.isEnabled());
  await page.locator('.editor-tool-card[data-editor-tool="geometry"] .setting-lock[data-lock-key="shapeFrequency"]').click();
  assert.equal(await shape.isDisabled(),true,'Locked live field was editable');
  assert.equal(current().shapeFrequency,61);
  assert.ok(current().lockedSettings.includes('shapeFrequency'));
  await page.locator('.editor-tool-card[data-editor-tool="geometry"] .setting-lock[data-lock-key="shapeFrequency"]').click();
  assert.ok(await shape.isEnabled());
  assert.ok(!current().lockedSettings.includes('shapeFrequency'));
  // Every geometry which suppresses curvature must present truthful zero
  // values AND disabled source locks without discarding stored tuning. Test
  // transitions separately, since stale DOM state can survive a switch.
  for(const dormantGeometry of ['straight','hairpin','loop','drawn']){
    await geometry.selectOption(dormantGeometry);
    assert.equal(current().geometry,dormantGeometry);
    assert.equal(current().shapeFrequency,61);
    assert.equal(current().shapeDepth,79);
    assert.equal(await shape.inputValue(),'0');
    assert.equal(await depth.inputValue(),'0');
    assert.ok(await shape.isDisabled()&&await depth.isDisabled());
    for(const key of ['shapeFrequency','shapeDepth']){
      const field=page.locator('.editor-tool-card[data-editor-tool="geometry"] '+
        '[name="'+key+'"]');
      assert.equal(await field.count(),1,dormantGeometry+': missing '+key+' field');
      const lockDisabled=await field.evaluate(el=>
        el.closest('.lockable-setting')?.querySelector('.setting-lock')?.disabled);
      assert.equal(lockDisabled,true,
        dormantGeometry+': dormant '+key+' lock was operable');
    }
    await geometry.selectOption('zigzag');
    assert.equal(await shape.inputValue(),'61');
    assert.equal(await depth.inputValue(),'79');
    assert.ok(await shape.isEnabled()&&await depth.isEnabled());
  }
  record('all-four-dormant-geometry-modes',{
    disabledModes:['straight','hairpin','loop','drawn'],
    preservedSourceValues:[61,79],zeroDisplay:true,
    dormantLocksDisabled:true,restoredAfterEveryTransition:true});
  record('path-inactive-and-lock-cycle',{sourceValues:[61,79],
    visibleDormantValues:[0,0],dormantLockDisabled:true,
    revived:true,lockPreservesRecipe:true});
  // The optional Focus plate must be able to lock AND unlock its current
  // original setting. A disabled contextual setting must not accidentally
  // expose a live lock toggle.
  await page.locator('.editor-focus-toggle').click();
  await page.locator('.editor-focus-chip[data-focus-key="shapeFrequency"]').click();
  const focusLock=page.locator('.editor-focus-lock');
  await hit('.editor-focus-lock');
  assert.equal(await focusLock.getAttribute('aria-pressed'),'false');
  await focusLock.click();
  assert.equal(await focusLock.getAttribute('aria-pressed'),'true');
  assert.ok(current().lockedSettings.includes('shapeFrequency'));
  assert.equal(await page.locator('.editor-focus-slider').isDisabled(),true);
  assert.match(await page.locator('.editor-focus-help').textContent(),/locked/i);
  await focusLock.click();
  assert.equal(await focusLock.getAttribute('aria-pressed'),'false');
  assert.ok(!current().lockedSettings.includes('shapeFrequency'));
  assert.equal(await page.locator('.editor-focus-slider').isEnabled(),true);
  await page.locator('.editor-focus-all').click();
  await geometry.selectOption('straight');
  await page.locator('.editor-focus-toggle').click();
  await page.locator('.editor-focus-chip[data-focus-key="shapeFrequency"]').click();
  assert.equal(await focusLock.isDisabled(),true);
  assert.match(await page.locator('.editor-focus-help').textContent(),/inactive/i);
  assert.equal(await page.locator('.editor-focus-slider').isDisabled(),true);
  await page.locator('.editor-focus-all').click();
  await geometry.selectOption('zigzag');
  record('optional-focus-source-lock',{delegatedOriginalSource:true,
    lockAndUnlock:true,dormantLockBlocked:true,recipePreserved:true});

  await page.locator('#mobileDismissHandle').click();
  assert.equal(await page.locator('#mobileActionDock').evaluate(el=>el.inert),false);
  await nav('mobileSaved');
  assert.equal(await page.locator('#gallery').getAttribute('data-view'),'saved');
  assert.equal(await page.locator('#gallery .thumb').count(),0);
  await nav('mobileExplore');
  assert.equal(await page.locator('#gallery').getAttribute('data-view'),'explore');
  await hit('#batch');
  record('five-destinations-and-empty-gallery',{studio:true,edit:true,
    explore:true,saved:true,emptyState:true,offscreenDockInert:true});

  await nav('mobileMore');
  // Phone More is scrollable, so each original source action must be measured
  // after scrolling into view. Do not treat an offscreen rect as a blocked tap.
  // Guard two portrait widths, independent hit ownership, and existing scroll.
  const moreHitCells=[];
  for(const width of [320,412]){
    await page.setViewportSize({width,height:892});
    const entries=page.locator(
      '#mobileToolsContent .mobile-more-group-body>.secondary-actions button,'+
      '#mobileToolsContent .mobile-more-group-body>.export-metadata>button');
    const count=await entries.count();
    assert.ok(count>=4,'Grouped More lost visible original actions: '+count);
    for(let i=0;i<count;i++){
      const node=entries.nth(i);
      if(!await node.isVisible())continue;
      await node.scrollIntoViewIfNeeded();
      const box=await node.evaluate(el=>{
        const r=el.getBoundingClientRect();
        const probes=[.18,.5,.82].flatMap(y=>[.18,.5,.82].map(x=>{
          const top=document.elementFromPoint(r.left+r.width*x,r.top+r.height*y);
          return top===el||el.contains(top);
        }));
        return {id:el.id||el.textContent.trim().slice(0,32),
          width:r.width,height:r.height,visible:probes.every(Boolean)};
      });
      assert.ok(box.width>=44&&box.height>=44&&box.visible,
        'More source action has a blocked/sub-44 touch cell: '+JSON.stringify({width,box}));
      moreHitCells.push({viewport:width,...box});
    }
  }
  record('more-original-action-touch-cells',{sampled:moreHitCells.length,moreHitCells});
  const groups=await page.locator('#mobileToolsContent > .mobile-more-group').evaluateAll(nodes=>
    nodes.map(el=>({title:el.querySelector('h3')?.textContent,
      children:[...el.querySelectorAll('button,input')].map(x=>x.id||x.className)})));
  assert.deepEqual(groups.map(x=>x.title),
    ['Create & seed','Import, export & share','Position & design details']);
  for(const id of ['seedInput','applySeed','randomize','download','importRecipePNG',
    'metadataToggle','copyLink','copyRecipe','downloadRecipe','mobileShuffle'])
    await hit('#'+id);
  // More's source-backed Shuffle action must have an actual finger-sized cell,
  // not merely a large parent while a different button intercepts corners.
  const shuffle=await page.locator('#mobileShuffle').evaluate(el=>{
    const r=el.getBoundingClientRect();
    const hits=[.18,.5,.82].flatMap(fy=>[.18,.5,.82].map(fx=>{
      const top=document.elementFromPoint(r.left+r.width*fx,r.top+r.height*fy);
      return top===el||el.contains(top);
    }));
    return {width:r.width,height:r.height,nineUnobstructed:hits.every(Boolean)};
  });
  assert.ok(shuffle.width>=44&&shuffle.height>=44&&shuffle.nineUnobstructed,
    'More Shuffle has no independent 44px source hit target: '+JSON.stringify(shuffle));
  record('more-shuffle-native-touch-region',{shuffle});
  const batchHit=await hit('.mobile-more-batch');
  record('more-groups-hit-tests',{groups,batchHit});

  // A lock in the More seed group must block the field and its Apply action,
  // without blocking the unlock control.
  const seedLock=page.locator('#mobileToolsSheet [data-lock-key="seed"]');
  await seedLock.click();
  assert.ok(await page.locator('#seedInput').isDisabled());
  assert.ok(await page.locator('#applySeed').isDisabled());
  assert.deepEqual(current().seed,baseline.seed);
  await seedLock.click();
  assert.ok(await page.locator('#seedInput').isEnabled());
  await page.locator('#seedInput').fill('agent2-live-seed-from-more');
  await page.locator('#applySeed').click();
  assert.equal(current().seed,'agent2-live-seed-from-more');
  record('seed-lock-and-apply',{lockedDisabled:true,unlockedApply:true,
    changedOnlyOnActivation:true});

  await page.locator('#metadataToggle').click();
  assert.equal(await page.locator('#metadataToggle').getAttribute('aria-expanded'),'true');
  await hit('#metadataClear');
  const title=page.locator('#metadataPanel [name="title"]');
  await title.fill('Agent 2 real metadata');
  await page.locator('#metadataRemember').check();
  assert.ok((await page.evaluate(()=>
    localStorage.getItem('wallgen:export-metadata:v1')))?.includes('Agent 2 real metadata'));
  await page.locator('#metadataClear').click();
  assert.equal(await title.inputValue(),'');
  await page.locator('#metadataRemember').uncheck();
  await page.locator('#metadataToggle').click();
  assert.equal(await page.locator('#metadataPanel').isVisible(),false);
  record('metadata-expansion-and-memory',{expandedAndCollapsed:true,
    persistedAndCleared:true,sourceIdentity:true});

  const sourceBeforeInvalid=current();
  const file=page.locator('#importRecipeFile');
  const accepted=await file.getAttribute('accept');
  assert.match(accepted,/\.png/);assert.match(accepted,/\.json/);
  for(const testCase of [
    {name:'syntax',data:'{',pattern:/Invalid JSON recipe syntax/},
    {name:'wrong-shape',data:JSON.stringify({hello:'world'}),
      pattern:/JSON must contain a wallpaper recipe with seed and structure/}
  ]){
    await file.setInputFiles({name:testCase.name+'.json',
      mimeType:'application/json',buffer:Buffer.from(testCase.data)});
    const visible=await status(/Cannot restore design:/);
    assert.match(visible,testCase.pattern);
    assert.deepEqual(current(),sourceBeforeInvalid,
      'Invalid JSON file modified the recipe or Undo source');
    assert.equal(await file.inputValue(),'','Bad JSON should permit immediate retry');
  }
  const beforeJSON=current();
  await file.setInputFiles({name:'restore.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(imported))});
  await page.waitForFunction(seed=>
    document.getElementById('seedInput').value===seed,imported.seed);
  assert.deepEqual(current(),imported,
    'JSON import did not round-trip all normalized controls and locks');
  await status(/Restored wallpaper settings from JSON recipe/);
  assert.equal(await page.locator('#mobileMore').getAttribute('aria-current'),'page');
  record('json-import-errors-recovery',{rejected:['malformed','nonrecipe'],
    inputReset:true,recipeUnchangedOnError:true,restoredSeed:imported.seed,
    exactRecipe:true,beforeSeed:beforeJSON.seed});

  // Conditionals after import: the source scene, not stale editor widgets,
  // drives structure applicability and source lock state.
  await page.locator('#mobileToolsClose').click();
  await nav('mobileEdit');
  assert.equal(await page.locator('#tab-stripes').isDisabled(),true,
    'Paths-only Shapes must be disabled in Nested Regions');
  await page.locator('#tab-material').click();
  await page.locator('.editor-tool-chooser [data-editor-tool="finish2"]').click();
  const lockedRotation=page.locator(
    '.editor-tool-card[data-editor-tool="finish2"] [name="textureRotation2"]');
  assert.ok(await lockedRotation.isDisabled(),'Imported layer lock not applied');
  assert.equal(current().textureRotation2,133.5);
  record('regions-and-imported-material-locks',{shapesDisabled:true,
    savedRotation:133.5,rotationLocked:true});

  await page.locator('#mobileDismissHandle').click();
  await nav('mobileMore');
  await page.locator('#copyRecipe').click();
  await status(/Copied to clipboard/);
  assert.deepEqual(JSON.parse(await page.evaluate(()=>navigator.clipboard.readText())),current());
  await page.locator('#copyRecipe').click();
  await status(/Copied to clipboard/);
  await page.locator('#copyLink').click();
  await status(/Copied to clipboard/);
  const url=await page.evaluate(()=>navigator.clipboard.readText());
  assert.deepEqual(decodeRecipe(new URL(url).searchParams.get('r')),current());
  const downloadEvent=page.waitForEvent('download');
  await page.locator('#downloadRecipe').click();
  const downloaded=await downloadEvent;
  const json=JSON.parse(await readFile(await downloaded.path(),'utf8'));
  assert.deepEqual(normalizeRecipe(json),current());
  const observed=await page.evaluate(()=>window.__agent2StatusEvents);
  const copies=observed.filter(x=>x==='Copied to clipboard.').length;
  assert.ok(copies>=3,'Repeat clipboard actions did not update live region');
  record('status-copy-share-download',{semantics,repeatedCopyMutations:copies,
    shareExact:true,downloadExact:true,noticeMirrorsStudio:true});

  // New More batch route must trigger the ORIGINAL #batch (not another
  // generator implementation), navigate to the right destination and
  // preserve the same contact sheet across Saved and Explore.
  await page.locator('.mobile-more-batch').click();
  await page.waitForFunction(()=>document.querySelector('#gallery')
    ?.dataset.view==='explore'&&document.querySelectorAll('#gallery .thumb').length===12,
    null,{timeout:24000});
  const seeds=await page.locator('#gallery .thumb').evaluateAll(nodes=>
    nodes.map(el=>el.dataset.recipeSeed));
  assert.equal(new Set(seeds).size,12);
  assert.equal(await page.locator('#mobileExplore').getAttribute('aria-current'),'page');
  await nav('mobileSaved');
  assert.equal(await page.locator('#gallery .thumb').count(),0);
  await nav('mobileExplore');
  await page.waitForFunction(()=>document.querySelectorAll('#gallery .thumb').length===12);
  assert.deepEqual(await page.locator('#gallery .thumb').evaluateAll(nodes=>
    nodes.map(el=>el.dataset.recipeSeed)),seeds);
  assert.deepEqual(current(),imported,
    'Batch output corrupted the active imported source recipe');
  record('more-batch-through-original-explore',{generated:12,unique:12,
    savedEmpty:true,preservedSheet:true,unchangedActiveRecipe:true});
  await page.screenshot({path:join(out,'batch-explore.png'),animations:'disabled'});
  // Independently reload full serialized recipes across radial, region and
  // lighting contexts. This checks the REAL source form's displayed values,
  // disabled state and preserved URL recipe, not a source-code expectation.
  const sourceCensus=[];
  const crossFamilyCases=[
    {name:'radial-spokes',overrides:{structure:'radial',radialMode:'spokes',
      rayTwist:38,rayCoverage:76,rayCore:42},dormant:['rayTwist'],
      active:['rayCoverage','rayCore']},
    {name:'radial-pinwheel',overrides:{structure:'radial',radialMode:'pinwheel',
      rayTwist:38,rayCoverage:76},dormant:[],active:['rayTwist','rayCoverage']},
    {name:'radial-concentric',overrides:{structure:'radial',radialMode:'concentric',
      rayTwist:38,rayCoverage:76,rayCore:42},
      dormant:['rayTwist','rayCoverage','rayCore'],active:[]},
    {name:'regions-nested',overrides:{structure:'regions',regionMode:'nested',
      regionSides:8,regionJitter:45},dormant:['regionJitter'],active:['regionSides']},
    {name:'regions-voronoi',overrides:{structure:'regions',regionMode:'voronoi',
      regionSides:8,regionJitter:45},dormant:['regionSides'],active:['regionJitter']},
    {name:'lighting-off',overrides:{lightingMood:'off',lightDirection:'top-right',
      lightStrength:68,shadowStrength:47},
      dormant:['lightDirection','lightStrength','shadowStrength'],active:[]},
    {name:'lighting-zero',overrides:{lightingMood:'daylight',lightDirection:'top-right',
      lightStrength:0,shadowStrength:0},dormant:['lightDirection'],
      active:['lightStrength','shadowStrength']},
    {name:'layer2-disabled',overrides:{textureLayer2Enabled:false,
      material2:'foil',textureStrength2:77,lockedSettings:[]},
      dormant:['textureStrength2','textureScale2','textureRotation2'],active:[]},
    {name:'layer2-enabled',overrides:{textureLayer2Enabled:true,
      material2:'foil',textureStrength2:77,lockedSettings:[]},
      dormant:[],active:['textureStrength2','textureScale2','textureRotation2']},
    {name:'layer2-zero-strength',overrides:{textureLayer2Enabled:true,
      material2:'foil',textureStrength2:0,lockedSettings:[]},
      dormant:['textureScale2','textureRotation2'],active:['textureStrength2']},
    {name:'layer3-disabled',overrides:{textureLayer3Enabled:false,
      material3:'construction',textureStrength3:84,lockedSettings:[]},
      dormant:['textureStrength3','textureScale3','textureRotation3'],active:[]},
    {name:'layer3-zero-strength',overrides:{textureLayer3Enabled:true,
      material3:'construction',textureStrength3:0,lockedSettings:[]},
      dormant:['textureScale3','textureRotation3'],active:['textureStrength3']},
    {name:'orientation-horizontal',overrides:{orientation:'horizontal',
      diagonalRotation:27,mirrorHorizontal:true,mirrorVertical:true,
      lockedSettings:[]},
      dormant:['diagonalRotation','mirrorHorizontal','mirrorVertical'],active:[]},
    {name:'orientation-diagonal',overrides:{orientation:'diagonal',
      diagonalRotation:27,mirrorHorizontal:true,mirrorVertical:true,
      lockedSettings:[]},
      dormant:[],active:['diagonalRotation','mirrorHorizontal','mirrorVertical']},
    {name:'stripe-shadow-zero',overrides:{stripeShadowStrength:0,
      stripeShadowSoftness:81,lockedSettings:[]},
      dormant:['stripeShadowSoftness','stripeShadowDirection'],
      active:['stripeShadowStrength']},
    {name:'repeat-off',overrides:{composition:'single',repeatCount:4,
      repeatSpacing:68,lockedSettings:[]},
      dormant:['repeatCount','repeatSpacing'],active:[]},
    {name:'repeat-on',overrides:{composition:'repeat',repeatCount:4,
      repeatSpacing:68,lockedSettings:[]},
      dormant:[],active:['repeatCount','repeatSpacing']},
    {name:'construction-tonal',overrides:{construction:'tonal',
      tonalContrast:68,lineStyle:'continuous',lockedSettings:[]},
      dormant:['motif','motifSize','lineStyle','dotSize','dotSpacing'],
      active:['tonalContrast']},
    {name:'construction-woven',overrides:{construction:'woven',
      motif:'dots',lineStyle:'dotted',brushRoughness:57,lockedSettings:[]},
      dormant:['lineStyle','dotSize','dotSpacing','brushRoughness','motifSize'],active:[]},
    {name:'ribbon-dots',overrides:{construction:'ribbon',motif:'dots',
      lineStyle:'continuous',lockedSettings:[]},dormant:['tonalContrast'],
      active:['motifSize','motifFrequency','dotSize','dotSpacing']},
    {name:'ribbon-solid',overrides:{construction:'ribbon',motif:'solid',
      lockedSettings:[]},dormant:['motifSize','motifFrequency','patternHomogeneity'],
      active:['motif']},
    {name:'stroke-dotted',overrides:{construction:'stroke',lineStyle:'dotted',
      lockedSettings:[]},dormant:['motifSize','motifFrequency'],
      active:['dotSize','dotSpacing']},
    {name:'no-outline',overrides:{outline:'none',gap:17,outlineBuffer:11,
      lockedSettings:[]},dormant:['gap','outlineBuffer'],active:['outline']},
    {name:'outline-double',overrides:{outline:'double',gap:17,outlineBuffer:11,
      lockedSettings:[]},dormant:[],active:['gap','outlineBuffer']},
    {name:'no-divider',overrides:{structure:'regions',dividerColor:'none',
      dividerWidth:27,lockedSettings:[]},dormant:['dividerWidth'],active:['dividerColor']},
    {name:'active-divider',overrides:{structure:'regions',
      dividerColor:'background',dividerWidth:27,lockedSettings:[]},
      dormant:[],active:['dividerWidth']},
    {name:'floating',overrides:{composition:'floating',pathLength:79,
      lockedSettings:[]},dormant:['repeatCount','repeatSpacing'],active:['pathLength']},
    {name:'individuality-zero',overrides:{individuality:0,
      overridePatternHomogeneity:77,lockedSettings:[]},
      dormant:['overridePatternHomogeneity'],active:['individuality']},
    {name:'individuality-positive',overrides:{individuality:63,
      overridePatternHomogeneity:77,lockedSettings:[]},
      dormant:[],active:['overridePatternHomogeneity']}
  ];
  for(const scenario of crossFamilyCases){
    const source=normalizeRecipe({...baseline,...scenario.overrides,
      seed:'agent2-'+scenario.name});
    await page.goto(origin+'/?r='+encodeRecipe(source),{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.body.classList.contains('mobile-five-nav'));
    assert.deepEqual(current(),source,scenario.name+': source URL changed');
    for(const key of scenario.dormant){
      const field=page.locator('#controls [name="'+key+'"]');
      assert.equal(await field.count(),1,scenario.name+': missing '+key);
      assert.equal(await field.isDisabled(),true,scenario.name+': inactive '+key+' editable');
      assert.equal(await field.getAttribute('data-inactive'),'true');
      if(await field.getAttribute('type')==='range')
        assert.equal(await field.inputValue(),'0',scenario.name+': dormant '+key+' not zero');
      const lock=await field.evaluate(el=>el.closest('.lockable-setting')
        ?.querySelector('.setting-lock')?.disabled);
      if(lock!==undefined)assert.equal(lock,true,scenario.name+': dormant lock enabled');
      assert.equal(current()[key],source[key],scenario.name+': dormant recipe lost '+key);
    }
    for(const key of scenario.active){
      const field=page.locator('#controls [name="'+key+'"]');
      assert.equal(await field.count(),1,scenario.name+': missing live '+key);
      assert.equal(await field.isDisabled(),false,scenario.name+': live '+key+' disabled');
      assert.equal(await field.getAttribute('data-inactive'),'false');
    }
    const census=await page.locator('[data-setting]').evaluateAll(nodes=>
      nodes.map(el=>({
        name:el.dataset.setting,insideSourceForm:el.closest('form')?.id==='controls',
        formOwner:el.form?.id||null,inactive:el.dataset.inactive==='true',
        flag:el.dataset.inactive,disabled:el.disabled,
        kind:el.type,tag:el.tagName,value:el.value,checked:el.checked,
        hasDormantOption:!!el.querySelector?.('option[data-inactive-placeholder]'),
        rowDormant:el.closest('.lockable-setting')?.classList.contains('setting-inactive'),
        lockDisabled:el.closest('.lockable-setting')?.querySelector('.setting-lock')?.disabled
      })));
    assert.equal(census.length,87,scenario.name+': original source count; '+
      JSON.stringify(census.map(x=>x.name)));
    assert.equal(new Set(census.map(x=>x.name)).size,87,
      scenario.name+': duplicate original source key');
    for(const field of census){
      assert.ok(['true','false'].includes(field.flag),
        scenario.name+': missing source state '+field.name);
      assert.equal(field.disabled,
        field.inactive||source.lockedSettings.includes(field.name),
        scenario.name+': source disabled mismatch '+field.name);
      if(!field.inactive)continue;
      if(['range','number'].includes(field.kind))
        assert.equal(field.value,'0',scenario.name+': dormant value '+field.name);
      if(field.tag==='SELECT'){
        assert.equal(field.value,'0',scenario.name+': dormant select '+field.name);
        assert.ok(field.hasDormantOption,scenario.name+': no inactive select explanation '+field.name);
      }
      if(field.kind==='checkbox')
        assert.equal(field.checked,false,scenario.name+': dormant checkbox '+field.name);
      if(field.rowDormant!==undefined)
        assert.equal(field.rowDormant,true,scenario.name+': inactive row '+field.name);
      if(field.lockDisabled!==undefined)
        assert.equal(field.lockDisabled,true,scenario.name+': inactive lock '+field.name);
    }
    sourceCensus.push({scenario:scenario.name,
      outsideForm:census.filter(x=>!x.insideSourceForm).map(x=>({key:x.name,form:x.formOwner})),
      active:census.filter(x=>!x.inactive).map(x=>x.name),
      inactive:census.filter(x=>x.inactive).map(x=>x.name)});
    record('conditional-'+scenario.name,{dormant:scenario.dormant,
      active:scenario.active,retainedRecipe:true});
  }
  // A positive-minimum range must not retain the temporary inactive zero
  // boundary after its scene becomes applicable again.
  const regionsCount=page.locator('#controls [name="regionCount"]');
  assert.equal(await regionsCount.inputValue(),'0');
  assert.equal(await regionsCount.getAttribute('min'),'0');
  await nav('mobileEdit');
  await page.locator('#tab-layout').click();
  await page.locator('.editor-tool-chooser [data-editor-tool="structure-mode"]').click();
  await page.locator('#controls [name="structure"]').selectOption('regions');
  assert.equal(current().structure,'regions');
  assert.equal(await regionsCount.getAttribute('min'),'7');
  assert.equal(await regionsCount.inputValue(),String(current().regionCount));
  await page.locator('#controls [name="structure"]').selectOption('paths');
  assert.equal(await regionsCount.inputValue(),'0');
  assert.equal(await regionsCount.getAttribute('min'),'0');
  await page.locator('#tab-path').click();
  await page.locator('.editor-tool-chooser [data-editor-tool="geometry"]').click();
  const editableGeometry=page.locator('#controls [name="geometry"]');
  for(const scenario of [
    {geometry:'hairpin',key:'hairpinAngle',min:'60'},
    {geometry:'loop',key:'loopSweep',min:'240'},
    {geometry:'stepped',key:'stepCount',min:'1'}
  ]){
    const field=page.locator('#controls [name="'+scenario.key+'"]');
    assert.equal(await field.getAttribute('min'),'0',
      scenario.key+': must start with honest dormant zero');
    await editableGeometry.selectOption(scenario.geometry);
    assert.equal(await field.getAttribute('min'),scenario.min,
      scenario.key+': authored minimum did not return');
    assert.equal(await field.inputValue(),String(current()[scenario.key]),
      scenario.key+': active source value not restored');
    await editableGeometry.selectOption('zigzag');
    assert.equal(await field.getAttribute('min'),'0');
    assert.equal(await field.inputValue(),'0');
  }
  record('positive-minimum-range-restoration',{inactiveMinimum:0,
    activeMinimum:7,storedCount:current().regionCount,
    structureTransitions:['paths','regions','paths']});
  assert.deepEqual(errors,[],'Runtime JavaScript errors');
  await writeFile(join(out,'evidence.json'),JSON.stringify({
    classification:'live Chromium pointer/clipboard/file/download/conditional-state acceptance',
    viewport:[412,892],sourceBranch:'agent2-controls-state-fidelity-20261019',
    semantics,cases,errors,
    originalSourceCensus:{
      fixtureCount:sourceCensus.length,expectedSourceFields:87,
      fixtures:sourceCensus,
      bothActiveAndInactiveKeys:[...new Set(sourceCensus.flatMap(x=>x.active))]
        .filter(key=>sourceCensus.some(x=>x.inactive.includes(key))).sort()
    },
    scope:['five destinations','More grouped operations and batch handoff',
      'valid/invalid JSON recipe import','inactive zero state and lock restoration',
      'source-independent gallery persistence','live global status repetition'],
    exclusions:['native Android screen reader','all eighty-seven conditional input permutations',
      'all twelve plates visual approval','arbitrary third-party JSON recipe formats',
      'PNG rendered foreground pixel parity']
  },null,2));
  console.log('AGENT2_CONTROLS_ACCEPTANCE_SUCCESS');
}catch(error){
  errors.push(String(error));
  await page.screenshot({path:join(out,'failure.png'),animations:'disabled'}).catch(()=>{});
  await writeFile(join(out,'failure.json'),JSON.stringify({
    classification:'NOT VERIFIED',error:String(error),stack:error.stack,
    cases,errors,url:page.url()
  },null,2));
  throw error;
}finally{await context.close();await browser.close();}
