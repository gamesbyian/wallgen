#!/usr/bin/env node
// Opt-in real Chromium 320x700 saved-library Nest Rainbow user journey.
// Not a physical Pixel/Android or human usability study.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'artifacts/nested-short-portrait');
await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.json':'application/json','.woff2':'font/woff2','.ttf':'font/ttf','.png':'image/png','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
  try{
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(path!==root&&!path.startsWith(root+'/')){res.writeHead(403).end();return;}
    const file=path===root?join(root,'index.html'):path;
    res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(await readFile(file));
  }catch{res.writeHead(404).end('Not Found');}
});
let browser;
try{
  await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok);});
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:320,height:700},hasTouch:true,isMobile:true});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',null,{timeout:80000});
  const original=await page.evaluate(()=>new URL(location.href).searchParams.get('r'));
  const imported=await page.evaluate(async()=>{
    const {openGeometryLibrary}=await import('/src/geometry-library-store.js');
    const {normalizeCompoundRegion}=await import('/src/geometry-asset.js');
    const geometry=normalizeCompoundRegion({
      type:'compound-region',space:'asset-local',fillRule:'evenodd',
      viewBox:[0,0,360,360],components:[{
        outer:[[180,18],[310,330],[228,270],[180,306],[132,270],[50,330]],
        holes:[[[180,135],[198,195],[162,195]]]
      }]
    });
    const db=await openGeometryLibrary();
    const item=await db.add({name:'Starfleet-style Delta QA fixture',geometry,
      source:{kind:'imported'}});
    return {name:item.name,geometry,kind:item.kind};
  });
  assert.equal(imported.kind,'shape');
  // Real mobile dock and native editor route, not direct invocation of the
  // nesting controller hidden in an unrelated category.
  await page.locator('#mobileEdit').click();
  const editVisible=await page.evaluate(()=>!document.querySelector('#mobileDesignSheet').hidden);
  assert.ok(editVisible,'mobile Edit destination must reveal the editor');
  // Path > Regions is deliberately unavailable until the canonical
  // structure is Regions. Exercise that prerequisite through the real UI.
  await page.locator('[data-tab="layout"]').click();
  await page.locator('[name="structure"]').selectOption('regions');
  await page.locator('[data-tab="path"]').click();
  await page.locator('button[data-category="path"][data-editor-tool="regions"]').click();
  const chooser=page.locator('#chooseScatteredShape');
  await chooser.waitFor({state:'visible'});
  const chooserSize=await chooser.evaluate(el=>({
    width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}));
  assert.ok(chooserSize.height>=44&&chooserSize.width>=44,'shape library must have a 44px touch action');
  const beforeNest=await page.evaluate(()=>new URL(location.href).searchParams.get('r'));
  await chooser.click();
  const dialog=page.locator('.geometry-library-dialog');
  await dialog.waitFor({state:'visible'});
  const nested=dialog.getByRole('button',{name:'Nest rainbow'});
  await nested.waitFor({state:'visible'});
  const nestedSize=await nested.evaluate(el=>({
    width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}));
  assert.ok(nestedSize.height>=44&&nestedSize.width>=44,'saved shape must offer 44px Nest rainbow');
  await page.screenshot({path:join(out,'short-320-library-visible.png')});
  await nested.click();
  await page.waitForFunction(()=>!document.querySelector('.geometry-library-dialog')?.open);
  await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
    null,{timeout:80000});
  const applied=await page.evaluate(()=>new URL(location.href).searchParams.get('r'));
  const canonical=await page.evaluate(()=>{
    const data=new URL(location.href).searchParams.get('r');
    const recipe=JSON.parse(decodeURIComponent(data));
    return {recipe,button:document.querySelector('.nested-shape-studio button')?.textContent,
      width:document.documentElement.scrollWidth,viewport:innerWidth,
      activeCategory:document.querySelector('[data-tab="path"]')?.getAttribute('aria-selected')};
  });
  assert.equal(canonical.recipe.nestedShapeContours?.enabled,true);
  assert.equal(canonical.recipe.nestedShapeContours?.count,7);
  assert.equal(canonical.recipe.scatteredShapeKind,'imported');
  assert.equal(canonical.recipe.scatteredCount,1);
  assert.deepEqual(canonical.recipe.scatteredShape.geometry,imported.geometry);
  assert.notEqual(applied,original);
  assert.equal(canonical.activeCategory,'true');
  await page.screenshot({path:join(out,'short-320-nested-art.png')});
  const fields=await page.evaluate(()=>{
    const button=document.querySelector('.nested-shape-studio button');
    const sizes=[button,...document.querySelectorAll('.nested-shape-fields input, .nested-shape-fields select')]
      .map(el=>({name:el.getAttribute('aria-label')||el.textContent,
        width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}));
    return sizes;
  });
  assert.ok(fields.length>=6);
  assert.ok(fields[0].height>=44);
  // Expand native disclosure to measure accessible editable input dimensions.
  await page.locator('.nested-shape-fields summary').click();
  const sizes=await page.evaluate(()=>[...document.querySelectorAll(
    '.nested-shape-fields input,.nested-shape-fields select')].map(el=>({
      name:el.getAttribute('aria-label'),width:el.getBoundingClientRect().width,
      height:el.getBoundingClientRect().height})));
  assert.ok(sizes.every(c=>c.width>=44&&c.height>=44),JSON.stringify(sizes));
  await page.screenshot({path:join(out,'short-320-nested-controls.png')});
  await page.locator('#undo').click();
  await page.waitForFunction(previous=>new URL(location.href).searchParams.get('r')===previous,
    beforeNest,{timeout:20000});
  const reverted=await page.evaluate(()=>new URL(location.href).searchParams.get('r'));
  assert.equal(reverted,beforeNest,'saved-library Nest must be one atomic undo operation');
  assert.deepEqual(errors,[]);
  const report={schema:'roygbiv-nested-shape-short-portrait/v1',viewport:[320,700],
    savedLibraryRealDOM:true,nestButtonTouch: nestedSize,chooserTouch:chooserSize,
    inputs:sizes,oneUndoRestoresRecipe:true,originalVectorUnchanged:true,
    pageExceptions:errors,physicalPixelTested:false};
  await writeFile(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('NESTED_SHORT_PROOF '+JSON.stringify(report));
}finally{
  await browser?.close();
  await new Promise(ok=>server.close(ok));
}
