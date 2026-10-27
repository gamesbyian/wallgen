#!/usr/bin/env node
// One-shot production UI/real Chromium acceptance for focused text drafts
// across Undo with identical caption IDs. Does not fake native IME hardware.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const dir=join(root,'artifacts','text-replaced-draft-browser');
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html',
  '.json':'application/json','.svg':'image/svg+xml','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{
  try{
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
    if(path!==root&&!path.startsWith(root+'/')){res.writeHead(403).end();return;}
    const file=path===root?join(root,'index.html'):path;
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(await readFile(file));
  }catch{res.writeHead(404).end('Not Found');}
});
let browser;
try{
  const {chromium}=await import('playwright');
  await mkdir(dir,{recursive:true});
  await new Promise((resolve,reject)=>{
    server.once('error',reject);server.listen(0,'127.0.0.1',resolve);
  });
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:412,height:892},
    deviceScaleFactor:1,reducedMotion:'reduce'});
  const pageErrors=[];page.on('pageerror',err=>pageErrors.push(err.message));
  const base='http://127.0.0.1:'+server.address().port+'/';
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.locator('#mobileEdit').click();
  await page.locator('.settings-tab[data-tab="details"]').click();
  await page.locator('.editor-tool-tab[data-editor-tool="typography"]').click();
  await page.locator('[data-text-add]').click();
  const input=page.locator('[data-text-key="text"]');
  await input.fill('FIRST WORDS');
  await input.blur();
  const readState=()=>page.evaluate(async()=>{
    const {decodeRecipe}=await import('/src/model.js');
    const recipe=decodeRecipe(new URL(location.href).searchParams.get('r'));
    const textarea=document.querySelector('[data-text-key="text"]');
    return {caption:recipe.textOverlays?.[0]?.text,
      id:recipe.textOverlays?.[0]?.id,
      wordsField:textarea?.value,
      focussed:document.activeElement===textarea};
  });
  const first=await readState();
  assert.equal(first.caption,'FIRST WORDS');
  assert.equal(first.wordsField,'FIRST WORDS');
  await input.fill('SECOND WORDS');
  await input.blur();
  const changed=await readState();
  assert.equal(changed.caption,'SECOND WORDS');
  assert.equal(changed.id,first.id);
  await input.fill('STALE UNCOMMITTED DRAFT');
  const drafting=await readState();
  assert.equal(drafting.caption,'SECOND WORDS',
    'draft text must not write the model until change/blur');
  assert.equal(drafting.wordsField,'STALE UNCOMMITTED DRAFT');
  assert.equal(drafting.focussed,true);
  // The real app Undo handler restores the earlier text object under the
  // SAME public text-1 ID while the focused textarea is still a draft.
  await page.evaluate(()=>document.getElementById('undo').click());
  const restored=await readState();
  assert.equal(restored.id,first.id);
  assert.equal(restored.caption,'FIRST WORDS');
  assert.equal(restored.wordsField,'FIRST WORDS',
    'new owner must replace stale focused draft even with identical ID');
  await input.blur();
  const afterBlur=await readState();
  assert.equal(afterBlur.caption,'FIRST WORDS',
    'late blur must not replay old-draft words onto restored design');
  assert.deepEqual(pageErrors,[]);
  await page.waitForFunction(()=>
    document.querySelector('#preview')?.dataset.renderPending==='false',
    {timeout:60000});
  await page.locator('#preview').screenshot({
    path:join(dir,'restored-text-after-focused-undo.png')});
  const report={status:'PASS',
    viewport:'Chromium emulated portrait 412x892; not physical Android IME',
    stableId:first.id,first:first.caption,changed:changed.caption,
    focusedDraft:drafting.wordsField,restoredModel:restored.caption,
    restoredInput:restored.wordsField,afterBlur:afterBlur.caption,
    browserErrors:pageErrors};
  await writeFile(join(dir,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('TEXT_FOCUSED_REPLACEMENT_CHROMIUM '+JSON.stringify(report));
}finally{await browser?.close();server.close();}
