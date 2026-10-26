#!/usr/bin/env node
// Opt-in real-browser acceptance for the canonical gesture transaction guard.
// Uses the live app, actual pointer capture, controls, recipe and worker.
// Does not claim physical Pixel, TalkBack, IME or simultaneous human input.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'artifacts','text-gesture-transaction-browser');
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript',
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
  await mkdir(out,{recursive:true});
  await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok);});
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:412,height:892},
    deviceScaleFactor:1,reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  const base='http://127.0.0.1:'+server.address().port+'/';
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.editor-tool-card[data-editor-tool="typography"]',
    {state:'attached'});
  await page.locator('#mobileEdit').click();
  await page.locator('.settings-tab[data-tab="details"]').click();
  await page.locator('.editor-tool-tab[data-editor-tool="typography"]').click();
  await page.locator('[data-text-add]').click();
  await page.locator('[data-text-key="text"]').fill('PROTECT MY EDIT');
  await page.locator('[data-text-key="text"]').blur();
  const recipe=()=>page.evaluate(async()=>{
    const {decodeRecipe}=await import('/src/model.js');
    return decodeRecipe(new URL(location.href).searchParams.get('r'));
  });
  const original=await recipe();
  assert.equal(original.textOverlays?.[0]?.text,'PROTECT MY EDIT');
  await page.locator('[data-text-move]').click();
  assert.equal(await page.locator('#textDirectDone').isVisible(),true);
  const canvas=page.locator('#preview');
  const rect=await canvas.boundingBox();
  assert.ok(rect?.width>150&&rect?.height>250,'Visible portrait wallpaper canvas required');
  const at=item=>({x:rect.x+rect.width*(item.x/100),
    y:rect.y+rect.height*(item.y/100)});
  const initial=at(original.textOverlays[0]);
  await page.mouse.move(initial.x,initial.y);
  await page.mouse.down();
  await page.mouse.move(initial.x+rect.width*.13,
    initial.y+rect.height*.08,{steps:6});
  await page.mouse.up();
  const moved=await recipe();
  assert.ok(Math.abs(moved.textOverlays[0].x-original.textOverlays[0].x-13)<1,
    'Normal completed text drag must still commit one changed X');
  assert.ok(Math.abs(moved.textOverlays[0].y-original.textOverlays[0].y-8)<1,
    'Normal completed text drag must still commit one changed Y');
  const movedAt=at(moved.textOverlays[0]);
  await page.mouse.move(movedAt.x,movedAt.y);
  await page.mouse.down();
  await page.mouse.move(movedAt.x-rect.width*.08,
    movedAt.y-rect.height*.04,{steps:4});
  // A real source-owned app event performs a different canonical transaction
  // while pointer capture is still active. The stale text draft must lose.
  await page.evaluate(()=>document.querySelector('.studio-stage')
    .dispatchEvent(new CustomEvent('roygbiv-view-zoom-request',{detail:1.2})));
  const afterZoom=await recipe();
  assert.equal(afterZoom.viewZoom,1.2,'Zoom request did not change live recipe');
  assert.equal(afterZoom.textOverlays[0].x,moved.textOverlays[0].x,
    'Transient drag must not have committed before pointerup');
  await page.mouse.up();
  const released=await recipe();
  assert.deepEqual(released,afterZoom,
    'Pointerup after another transaction must not overwrite camera or artwork');
  assert.deepEqual(errors,[],'Page must not report uncaught errors');
  const output=await page.evaluate(async()=>{
    const {decodeRecipe}=await import('/src/model.js');
    const {drawWallpaper}=await import('/src/renderer.js');
    const {exportWallpaperInWorker}=await import('/src/render-coordinator.js');
    const current=decodeRecipe(new URL(location.href).searchParams.get('r'));
    const mk=()=>{const canvas=document.createElement('canvas');
      canvas.width=480;canvas.height=1040;return canvas;};
    const ref=mk(),worker=mk();
    drawWallpaper(ref,current);
    const blob=await exportWallpaperInWorker({recipe:current,
      width:480,height:1040,timeoutMs:120000});
    const bmp=await createImageBitmap(blob);
    worker.getContext('2d').drawImage(bmp,0,0);bmp.close();
    const pixel=c=>c.getContext('2d',{willReadFrequently:true})
      .getImageData(0,0,c.width,c.height).data;
    const a=pixel(ref),b=pixel(worker);
    let different=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])different++;
    return {workerReferenceDifferentChannels:different,
      sourcePng:ref.toDataURL('image/png'),workerPngBytes:blob.size};
  });
  assert.equal(output.workerReferenceDifferentChannels,0);
  await writeFile(join(out,'preserved-text-wallpaper.png'),
    Buffer.from(output.sourcePng.split(',')[1],'base64'));
  const report={status:'PASS',viewport:'headless Chromium emulated 412x892; NOT Pixel hardware',
    initialAnchor:{x:original.textOverlays[0].x,y:original.textOverlays[0].y},
    committedAnchor:{x:moved.textOverlays[0].x,y:moved.textOverlays[0].y},
    retainedAfterInterveningZoom:{x:released.textOverlays[0].x,
      y:released.textOverlays[0].y,viewZoom:released.viewZoom},
    pointerupPreservedNewerTransaction:true,
    referenceWorkerDifferentChannels:output.workerReferenceDifferentChannels,
    workerPngBytes:output.workerPngBytes,browserErrors:errors};
  await writeFile(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('TEXT_GESTURE_TRANSACTION_CHROMIUM '+JSON.stringify(report));
}finally{await browser?.close();server.close();}
