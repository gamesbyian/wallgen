#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {dirname,resolve,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'output','text-transform');
await mkdir(out,{recursive:true});
const types={'.js':'text/javascript','.css':'text/css','.json':'application/json',
  '.html':'text/html','.ttf':'font/ttf','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
  try{
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!path.startsWith(root+'/')&&path!==root){res.writeHead(403).end();return;}
    const name=path===root?join(root,'index.html'):path;
    res.writeHead(200,{'Content-Type':types[extname(name)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(await readFile(name));
  }catch{res.writeHead(404).end('Not found');}
});
let browser;
try{
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:412,height:892},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.editor-tool-card[data-editor-tool="typography"]',{state:'attached'});
  await page.locator('#mobileEdit').click();
  await page.locator('.settings-tab[data-tab="details"]').click();
  await page.locator('.editor-tool-tab[data-editor-tool="typography"]').click();
  await page.locator('[data-text-add]').click();
  await page.locator('[data-text-key="text"]').fill('TYPE IN MOTION');
  await page.locator('[data-text-key="text"]').blur();
  await page.locator('[data-text-move]').click();
  const selected=async()=>page.evaluate(async()=>{
    const {decodeRecipe}=await import('/src/model.js');
    return decodeRecipe(new URL(location.href).searchParams.get('r')).textOverlays[0];
  });
  const initial=await selected();
  const rotate=page.locator('[data-text-handle="rotate"]');
  const scale=page.locator('[data-text-handle="scale"]');
  assert.equal(await rotate.isVisible(),true);
  assert.equal(await scale.isVisible(),true);
  const rotateBox=await rotate.boundingBox();
  assert.ok(rotateBox&&rotateBox.width>=43&&rotateBox.height>=43);
  const wallpaperBox=await page.locator('#preview').boundingBox();
  const initialScaleBox=await scale.boundingBox();
  assert.ok(initialScaleBox.x>=wallpaperBox.x-2&&
    initialScaleBox.x+initialScaleBox.width<=wallpaperBox.x+wallpaperBox.width+2,
    '44px scale touch target must stay inside the wide wallpaper, not half offscreen');
  assert.equal(await rotate.getAttribute('aria-label')!==null,true);
  const from={x:rotateBox.x+rotateBox.width/2,y:rotateBox.y+rotateBox.height/2};
  await page.mouse.move(from.x,from.y);
  await page.mouse.down();
  await page.mouse.move(from.x+55,from.y+14,{steps:6});
  await page.mouse.up();
  const rotated=await selected();
  assert.ok(Math.abs(rotated.rotation)>8,'rotate drag did not change canonical rotation');
  assert.equal(rotated.size,initial.size);
  await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false');
  await page.locator('#preview').screenshot({path:join(out,'rotated-wallpaper.png')});
  await page.evaluate(()=>document.getElementById('undo').click());
  assert.equal((await selected()).rotation,initial.rotation,'rotate drag must undo in one step');

  const scaleBox=await scale.boundingBox();
  assert.ok(scaleBox&&scaleBox.width>=43&&scaleBox.height>=43);
  const start={x:scaleBox.x+scaleBox.width/2,y:scaleBox.y+scaleBox.height/2};
  await page.mouse.move(start.x,start.y);
  await page.mouse.down();
  await page.mouse.move(start.x+36,start.y+55,{steps:6});
  await page.mouse.up();
  const scaled=await selected();
  assert.ok(scaled.size>initial.size+4,'scale drag did not change canonical size');
  assert.equal(scaled.rotation,initial.rotation);
  await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false');
  await page.locator('#preview').screenshot({path:join(out,'scaled-wallpaper.png')});
  await page.evaluate(()=>document.getElementById('undo').click());
  assert.equal((await selected()).size,initial.size,'scale drag must undo in one step');
  // Keyboard reachable handles offer precise directional stepping.
  await rotate.focus();
  await rotate.press('ArrowRight');
  assert.equal((await selected()).rotation,initial.rotation+15);
  await page.evaluate(()=>document.getElementById('undo').click());
  assert.equal((await selected()).rotation,initial.rotation);
  await scale.focus();
  await scale.press('ArrowUp');
  assert.equal((await selected()).size,initial.size+8);
  await page.evaluate(()=>document.getElementById('undo').click());
  assert.equal((await selected()).size,initial.size);
  const workerProof=await page.evaluate(async()=>{
    const {decodeRecipe}=await import('/src/model.js');
    const {drawWallpaper}=await import('/src/renderer.js');
    const {exportWallpaperInWorker}=await import('/src/render-coordinator.js');
    const recipe=decodeRecipe(new URL(location.href).searchParams.get('r'));
    const make=()=>{const c=document.createElement('canvas');c.width=360;c.height=780;return c;};
    const a=make(),b=make();
    drawWallpaper(a,recipe);
    const png=await exportWallpaperInWorker({recipe,width:360,height:780,timeoutMs:90000});
    const img=await createImageBitmap(png);
    b.getContext('2d').drawImage(img,0,0);img.close();
    const p=c=>c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,360,780).data;
    const A=p(a),B=p(b);
    let diffs=0;for(let i=0;i<A.length;i++)if(A[i]!==B[i])diffs++;
    return {workerReferenceChannelDifferences:diffs};
  });
  assert.equal(workerProof.workerReferenceChannelDifferences,0);
  assert.deepEqual(errors,[]);
  const proof={status:'PASS',browser:'Chromium emulated 412×892, not real Android',
    original:{size:initial.size,rotation:initial.rotation},
    pointer:{scaledSize:scaled.size,rotatedDegrees:rotated.rotation},
    bothHandleTargetsAtLeast44px:true,
    rotateAndScaleDragEachOneUndo:true,
    keyboardArrowStepsAndUndo:true,
    pageErrors:errors,workerProof};
  await writeFile(join(out,'report.json'),JSON.stringify(proof,null,2)+'\n');
  console.log('TEXT TRANSFORM ACTUAL BROWSER PROOF '+JSON.stringify(proof));
}finally{await browser?.close();server.close();}
