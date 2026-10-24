#!/usr/bin/env node
// One-shot actual Chromium viewport control and edited PNG acceptance.
// Uses the production UI pointer listeners and canonical worker, not a mock.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {join,resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=join(root,'output','text-drag');
await mkdir(out,{recursive:true});
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html',
  '.json':'application/json','.svg':'image/svg+xml','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{
  try{
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!path.startsWith(root+'/')&&path!==root){res.writeHead(403).end();return;}
    const file=path===root?join(root,'index.html'):path;
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(await readFile(file));
  }catch{res.writeHead(404).end('Not found');}
});
let browser;
try{
  await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:412,height:892},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.editor-tool-card[data-editor-tool="typography"]',{state:'attached'});
  await page.locator('#mobileEdit').click();
  await page.locator('.settings-tab[data-tab="details"]').click();
  await page.locator('.editor-tool-tab[data-editor-tool="typography"]').click();
  await page.locator('[data-text-add]').click();
  await page.locator('[data-text-key="text"]').fill('MOVE MY LETTERS');
  await page.locator('[data-text-key="text"]').blur();
  const getText=()=>page.evaluate(async()=>{
    const {decodeRecipe}=await import('/src/model.js');
    const encoded=new URL(location.href).searchParams.get('r');
    return decodeRecipe(encoded).textOverlays?.[0];
  });
  const initial=await getText();
  assert.equal(initial.x,50);assert.equal(initial.y,50);
  await page.locator('[data-text-move]').click();
  assert.equal(await page.locator('#textDirectDone').isVisible(),true);
  assert.equal(await page.evaluate(()=>document.body.classList.contains('text-direct-active')),true);
  const rect=await page.locator('#preview').boundingBox();
  assert.ok(rect?.width>150&&rect?.height>250);
  const origin={x:rect.x+rect.width*.5,y:rect.y+rect.height*.5};
  await page.mouse.move(origin.x,origin.y);
  await page.mouse.down();
  await page.mouse.move(origin.x+rect.width*.13,origin.y+rect.height*.1,{steps:6});
  const visibleDuringDrag=await page.locator('.text-direct-outline').isVisible();
  assert.equal(visibleDuringDrag,true,'on-canvas guide must be visible during drag');
  await page.mouse.up();
  const moved=await getText();
  assert.ok(Math.abs(moved.x-63)<.5,'X should have followed pointer in final wallpaper frame: '+moved.x);
  assert.ok(Math.abs(moved.y-60)<.5,'Y should have followed pointer in final wallpaper frame: '+moved.y);
  assert.equal(moved.text,initial.text);
  assert.equal(moved.font,initial.font);
  await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false');
  await page.locator('#preview').screenshot({path:join(out,'dragged-rainbow-lettering.png')});
  // Undo should collapse the entire continuous gesture to one recipe step.
  await page.evaluate(()=>document.getElementById('undo').click());
  const undone=await getText();
  assert.equal(undone.x,initial.x);
  assert.equal(undone.y,initial.y);
  // Switch to scattered direct manipulation while armed; no two simultaneous
  // gesture owners are allowed to respond to one pointerdown.
  await page.evaluate(()=>document.getElementById('scatteredMoveOnCanvas').click());
  const exclusive=await page.evaluate(()=>({
    text:document.body.classList.contains('text-direct-active'),
    scattered:document.body.classList.contains('scattered-direct-active')
  }));
  assert.equal(exclusive.text,false);
  assert.equal(exclusive.scattered,true);
  await page.evaluate(()=>document.getElementById('scatteredDirectDone').click());
  const art=await page.evaluate(async()=>{
    const {decodeRecipe}=await import('/src/model.js');
    const {drawWallpaper}=await import('/src/renderer.js');
    const {exportWallpaperInWorker}=await import('/src/render-coordinator.js');
    const recipe=decodeRecipe(new URL(location.href).searchParams.get('r'));
    const make=()=>{const c=document.createElement('canvas');c.width=480;c.height=1040;return c;};
    const a=make(),b=make();
    drawWallpaper(a,recipe);
    const blob=await exportWallpaperInWorker({recipe,width:480,height:1040,timeoutMs:90000});
    const bmp=await createImageBitmap(blob);
    b.getContext('2d').drawImage(bmp,0,0);bmp.close();
    const img=c=>c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,480,1040).data;
    const A=img(a),B=img(b);let changed=0;
    for(let i=0;i<A.length;i++)if(A[i]!==B[i])changed++;
    return {workerReferenceChannelDifferences:changed};
  });
  assert.equal(art.workerReferenceChannelDifferences,0);
  assert.deepEqual(errors,[]);
  const proof={status:'PASS',viewport:'emulated 412x892, not native Pixel',
    original:{x:initial.x,y:initial.y},dragged:{x:moved.x,y:moved.y},
    undoRestored:true,visualGuidePresent:true,directGestureModesExclusive:true,
    browserErrors:errors,art};
  await writeFile(join(out,'report.json'),JSON.stringify(proof,null,2)+'\n');
  console.log('TEXT DIRECT MANIPULATION PROOF '+JSON.stringify(proof));
}finally{await browser?.close();server.close();}
