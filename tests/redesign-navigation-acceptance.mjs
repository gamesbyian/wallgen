#!/usr/bin/env node
/**
 * Independent agent-3 acceptance. Runs in a REAL Chromium page: navigation,
 * hit testing, gallery races, favourites, Undo, clipboard/download and PNG
 * file import. It deliberately does not touch the shared browser-smoke file.
 *
 * npm install --no-save playwright@1.56.1 serve@14.2.5
 * npx serve . -l 4173
 * node tests/redesign-navigation-acceptance.mjs
 */
import assert from 'node:assert/strict';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe, encodeRecipe, decodeRecipe} from '../src/model.js';
import {embedPngMetadata} from '../src/png-metadata.js';

const origin=process.env.ROYGBIV_URL || 'http://127.0.0.1:4173';
const out=resolve(process.env.ROYGBIV_ACCEPTANCE_OUT || 'artifacts/agent3-acceptance');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({
  viewport:{width:412,height:892},deviceScaleFactor:1,isMobile:true,
  hasTouch:true,acceptDownloads:true,reducedMotion:'reduce'
});
await context.grantPermissions(['clipboard-read','clipboard-write'],{origin:new URL(origin).origin});
const page=await context.newPage();
page.setDefaultTimeout(12000);
const errors=[],observations=[];
page.on('pageerror',error=>errors.push(String(error)));
const record=(name,data)=>{observations.push({name,...data});console.log('AGENT3_ACCEPTANCE',name,JSON.stringify(data));};
const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
const screenshot=async name=>page.screenshot({path:join(out,name+'.png'),animations:'disabled'});
const go=async id=>{
  // The five-destination dock is deliberately inert while Edit is open.
  // Use its visible, source-wired action rail rather than bypassing inertness.
  const editing=await page.evaluate(()=>
    document.body.classList.contains('mobile-edit-open'));
  const selector=editing&&id==='mobileMore'?
    '[data-dock-proxy="mobileMore"]':'#'+id;
  await page.locator(selector).click();
  await page.waitForFunction(id=>document.querySelector('#'+id)?.getAttribute('aria-current')==='page',id);
};
const state=()=>page.evaluate(()=>({
  mode:document.querySelector('#gallery')?.dataset.view,
  busy:document.querySelector('#gallery')?.getAttribute('aria-busy'),
  seeds:[...document.querySelectorAll('#gallery .thumb')].map(n=>n.dataset.recipeSeed),
  current:document.querySelector('#mobileActionDock [aria-current=page]')?.id,
  destination:document.body.className
}));
async function hit(selector){
  const loc=page.locator(selector);
  assert.equal(await loc.count(),1,'Source control must exist exactly once: '+selector);
  await loc.scrollIntoViewIfNeeded({timeout:4500});
  const v=await loc.evaluate(el=>{
    const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
    const top=document.elementFromPoint(x,y);
    return {width:r.width,height:r.height,x,y,
      visible:getComputedStyle(el).visibility!=='hidden',
      enabled:!el.disabled,
      hit:top===el||el.contains(top),
      label:el.getAttribute('aria-label')||el.labels?.[0]?.textContent?.trim()||
        el.innerText?.trim()||el.title||'',
      viewport:[innerWidth,innerHeight]};
  });
  assert.ok(v.visible&&v.enabled&&v.hit&&v.width>=24&&v.height>=24,
    'More control cannot be directly hit: '+selector+' '+JSON.stringify(v));
  assert.ok(v.label,'Source control lacks an accessible/visible label: '+selector);
  return v;
}

try{
  const starting=normalizeRecipe({seed:'agent3-navigation-source',structure:'paths',
    geometry:'zigzag',material:'none',viewZoom:.8});
  await page.goto(origin+'/?r='+encodeRecipe(starting),{waitUntil:'domcontentloaded'});
  await page.locator('#mobileActionDock.mobile-dock').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.body.classList.contains('mobile-five-nav'));
  assert.equal(current().seed,starting.seed);
  // Actual five-destination click, not programmatically dispatched events.
  await go('mobileExplore');
  assert.equal((await state()).mode,'explore');
  await hit('#batch');
  await page.locator('#batch').click();
  await page.waitForFunction(()=>document.querySelectorAll('#gallery .thumb').length===12,
    null,{timeout:20000});
  const explore=(await state()).seeds;
  assert.equal(new Set(explore).size,12,'Generate 12 must preserve twelve distinct identities');
  await screenshot('explore-twelve');
  // Open an actual generated thumbnail, not a fabricated recipe object.
  await page.locator('#gallery .thumb').nth(4).click();
  const selected=current();
  assert.equal(selected.seed,explore[4]);
  await page.waitForFunction(()=>!document.body.classList.contains('mobile-gallery-open'));
  await page.locator('#mobileFavorite').click();
  assert.equal(await page.locator('#favorite').getAttribute('aria-pressed'),'true');
  await go('mobileSaved');
  await page.waitForFunction(()=>document.querySelectorAll('#gallery .thumb').length===1);
  assert.deepEqual((await state()).seeds,[selected.seed]);
  await screenshot('saved-one');
  for(let i=0;i<3;i++){
    await go('mobileExplore');
    await page.waitForFunction(()=>document.querySelectorAll('#gallery .thumb').length===12);
    assert.deepEqual((await state()).seeds,explore,
      'Explore identity changed after Save/Explore async navigation cycle '+i);
    await go('mobileSaved');
    await page.waitForFunction(()=>document.querySelectorAll('#gallery .thumb').length===1);
    assert.deepEqual((await state()).seeds,[selected.seed]);
  }
  // Deliberately race gallery enumeration against mode transitions.
  await go('mobileExplore');
  await go('mobileSaved');
  await go('mobileExplore');
  await page.waitForFunction(()=>document.querySelectorAll('#gallery .thumb').length===12);
  assert.deepEqual((await state()).seeds,explore,'Stale async thumbnails leaked into Explore');
  await go('mobileSaved');
  await page.locator('#gallery .thumb').click();
  assert.deepEqual(current(),selected,'Saved restore must retain the entire recipe');
  await go('mobileEdit');
  await page.locator('#tab-colour').click();
  await page.locator('.editor-tool-tab[data-editor-tool="rainbow"]').click();
  const reverse=page.locator('.editor-tool-card[data-editor-tool="rainbow"] [name=reverseStripes]');
  assert.ok(await reverse.isVisible()&&!await reverse.isDisabled());
  await reverse.setChecked(!selected.reverseStripes);
  assert.equal(current().reverseStripes,!selected.reverseStripes);
  assert.equal(current().seed,selected.seed);
  await page.locator('#undo').click();
  assert.deepEqual(current(),selected,'Undo must exactly restore gallery recipe after edit');
  record('explore-saved-restore-edit-undo',{
    contactSheet:explore.length,unique:new Set(explore).size,
    favouriteSeed:selected.seed,repeatedSwitches:8,undoPreserved:true});
  await screenshot('edit-after-undo');

  await go('mobileMore');
  const named={};
  for(const selector of [
    '#seedInput','#applySeed','#randomize','#copyLink','#copyRecipe',
    '#downloadRecipe','#importRecipePNG','#metadataToggle'
  ])named[selector]=await hit(selector);
  record('more-real-hit-tested-controls',{named});
  await page.locator('#metadataToggle').click();
  await page.locator('#metadataPanel').waitFor({state:'visible'});
  assert.equal(await page.locator('#metadataToggle').getAttribute('aria-expanded'),'true');
  assert.ok(await page.locator('#metadataRemember').isVisible(),
    'Metadata memory checkbox must be visible and have a clickable label');
  const metadataTitle=page.locator('#metadataPanel [name=title]');
  await metadataTitle.fill('Agent 3 actual browser metadata');
  await page.locator('#metadataRemember').check();
  const stored=await page.evaluate(()=>localStorage.getItem('wallgen:export-metadata:v1'));
  assert.ok(stored?.includes('Agent 3 actual browser metadata'));
  await page.locator('#metadataClear').click();
  assert.equal(await metadataTitle.inputValue(),'');
  await page.locator('#metadataRemember').uncheck();
  await page.locator('#metadataToggle').click();

  // Clipboard and download come from the actual buttons, not encodeRecipe()
  // alone. The browser is a localhost secure context with clipboard permission.
  await page.locator('#copyRecipe').click();
  const clipboardJSON=JSON.parse(await page.evaluate(()=>navigator.clipboard.readText()));
  assert.deepEqual(normalizeRecipe(clipboardJSON),current());
  const downloadEvent=page.waitForEvent('download');
  await page.locator('#downloadRecipe').click();
  const downloaded=await downloadEvent;
  const exportedJSON=JSON.parse(await readFile(await downloaded.path(),'utf8'));
  assert.deepEqual(normalizeRecipe(exportedJSON),current());
  await page.locator('#copyLink').click();
  const shared=await page.evaluate(()=>navigator.clipboard.readText());
  assert.deepEqual(decodeRecipe(new URL(shared).searchParams.get('r')),current());
  record('more-json-share-and-metadata',{
    metadataRemembered:true,jsonClipboard:true,jsonDownloaded:true,
    shareLink:true,sourceHitTested:Object.keys(named).length});
  await screenshot('more-real-utilities');

  // Real File-input event with a valid PNG recipe chunk. This verifies
  // import UI wiring, hidden complex settings, not only codec unit tests.
  const rich=normalizeRecipe({
    seed:'agent3-png-import-rich',structure:'radial',radialMode:'pinwheel',
    rayCount:28,rayTwist:33,viewZoom:.7,viewPanX:10,viewPanY:-5,
    material:'linen',textureStrength:58,textureLayer2Enabled:false,
    material2:'none',textureLayer3Enabled:true,material3:'foil',
    textureStrength3:65,textureRotation3:143.5,
    interiorElements:[{id:'ink-ring',type:'line',shape:'loop',
      placement:'field',color:'custom',customColor:'#21b5a8',
      colorSlots:[0,3,6],width:2.5,enabled:true}],
    lockedSettings:['rayCount','textureRotation3']
  });
  const barePNG=Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/9QAAAABJRU5ErkJggg==','base64');
  const withRecipe=embedPngMetadata(barePNG,{title:'Agent3 fixture'},{recipe:rich});
  await page.locator('#importRecipeFile').setInputFiles({
    name:'agent3-embedded-recipe.png',mimeType:'image/png',buffer:Buffer.from(withRecipe)
  });
  await page.waitForFunction(()=>document.querySelector('#seedInput').value==='agent3-png-import-rich');
  assert.deepEqual(current(),rich,'Actual PNG import handler damaged a complex recipe');
  const announcement=await page.locator('#studioStatus').textContent();
  assert.match(announcement,/Restored original wallpaper settings from PNG recipe/);
  await page.locator('#mobileStudio').click();
  assert.equal(await page.locator('#mobileStudio').getAttribute('aria-current'),'page');
  record('png-input-roundtrip',{seed:rich.seed,structure:rich.structure,
    materials:[rich.material,rich.material2,rich.material3],
    interiors:rich.interiorElements.length,camera:[rich.viewZoom,rich.viewPanX,rich.viewPanY]});
  await screenshot('studio-import-restored');

  assert.deepEqual(errors,[],'Uncaught errors during browser acceptance');
  await writeFile(join(out,'evidence.json'),JSON.stringify({
    source:'live Chromium / real navigation',classification:'behavior-verified',
    viewport:'412x892',observations,errors
  },null,2));
  console.log('AGENT3_NAVIGATION_ACCEPTANCE_SUCCESS');
}catch(error){
  await screenshot('failure').catch(()=>{});
  await writeFile(join(out,'failure.json'),JSON.stringify({
    classification:'not verified',error:String(error),stack:error.stack,
    url:page.url(),state:await state().catch(()=>null),observations,errors
  },null,2));
  throw error;
}finally{
  await context.close();
  await browser.close();
}
