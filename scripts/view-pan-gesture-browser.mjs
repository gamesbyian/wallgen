#!/usr/bin/env node
// Real Chromium one-finger framing acceptance. No design point changes.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
import {RAINBOW_ORBITS} from '../src/scattered-composition.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'artifacts/view-pan-gesture');
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
 '.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2',
 '.ttf':'font/ttf','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(path!==root&&!path.startsWith(root+'/')){res.writeHead(403).end();return;}
  const file=path===root?join(root,'index.html'):path;
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream',
    'Cache-Control':'no-store'}).end(await readFile(file));
 }catch{res.writeHead(404).end('Not Found');}
});
const original=normalizeRecipe({...RAINBOW_ORBITS,
 viewZoom:1.3,viewPanX:0,viewPanY:0,positionX:7,positionY:-5});
const recipe=page=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
let browser;const report=[],errors=[];
try{
 await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes);});
 browser=await chromium.launch({headless:true});
 for(const [width,height] of [[320,700],[412,892]]){
  const page=await browser.newPage({viewport:{width,height},
    isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});
  page.setDefaultTimeout(18000);
  page.on('pageerror',error=>errors.push(String(error)));
  try{
   await page.goto('http://127.0.0.1:'+server.address().port+'/?r='+encodeRecipe(original),
    {waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
    null,{timeout:85000});
   assert.deepEqual(recipe(page),original);
   await page.evaluate(()=>document.querySelector('#viewPanOnCanvas').click());
   assert.equal(await page.locator('body').evaluate(el=>
    el.classList.contains('view-pan-canvas-active')),true);
   const done=page.locator('#viewPanDone');
   assert.ok(await done.isVisible());
   const doneBounds=await done.boundingBox();
   assert.ok(doneBounds.height>=44&&doneBounds.width>=44);
   const canvas=page.locator('#preview'),rect=await canvas.boundingBox();
   const x=rect.x+rect.width*.46,y=rect.y+rect.height*.53;
   const unchanged=page.url();
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.up();
   assert.equal(page.url(),unchanged,'no-op gesture must not create a recipe history entry');
   await page.mouse.move(x,y);await page.mouse.down();
   await page.mouse.move(x+36,y+42,{steps:8});
   assert.ok((await canvas.evaluate(el=>el.style.transform)).includes('translate3d'),
     'bounded temporary preview must follow the actual camera delta');
   await page.mouse.up();
   await page.waitForFunction(before=>location.href!==before,unchanged);
   const moved=recipe(page);
   assert.ok(moved.viewPanX<0&&moved.viewPanY<0,
     'moving wallpaper right/down must point the camera left/up');
   assert.equal(moved.viewZoom,original.viewZoom);
   assert.equal(moved.positionX,original.positionX);
   assert.equal(moved.positionY,original.positionY);
   assert.deepEqual(moved.scatteredOverrides,original.scatteredOverrides);
   assert.equal(await canvas.evaluate(el=>el.style.transform),'',
     'finished gesture may not leave a transformed bitmap');
   await page.evaluate(()=>document.getElementById('undo').click());
   assert.deepEqual(recipe(page),original,'one Undo fully restores camera and artwork');
   await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
     null,{timeout:85000});
   assert.equal(await page.locator('body').evaluate(el=>
     el.classList.contains('view-pan-canvas-active')),true,
     'Undo must not disarm the deliberately armed camera tool');
   const nextRect=await canvas.boundingBox();
   const x2=nextRect.x+nextRect.width*.46,y2=nextRect.y+nextRect.height*.53;
   // Observe pointerdown at document capture. The editor correctly stops
   // immediate propagation on #preview so later same-target listeners
   // cannot steal a claimed gesture.
   await page.evaluate(()=>{
     window.__panEvents=[];
     document.addEventListener('pointerdown',event=>window.__panEvents.push({
       id:event.pointerId,target:event.target.id,primary:event.isPrimary,
       button:event.button
     }),{capture:true,once:true});
   });
   await page.mouse.move(x2,y2);await page.mouse.down();
   const pointer=await page.evaluate(()=>window.__panEvents.at(-1));
   assert.equal(pointer?.target,'preview');
   assert.equal(pointer?.primary,true);
   assert.equal(pointer?.button,0);
   assert.ok(await page.evaluate(id=>
      document.getElementById('preview').hasPointerCapture(id),pointer.id),
     'a second pointer must be genuinely captured after Undo');
   await page.mouse.move(x2+24,y2+35,{steps:5});
   assert.ok((await canvas.evaluate(el=>el.style.transform)).includes('translate3d'),
     'a second genuine gesture must move the provisional camera after Undo');
   await page.evaluate(id=>document.getElementById('preview').releasePointerCapture(id),
      pointer.id);
   await page.mouse.up();
   assert.deepEqual(recipe(page),original,'lost capture must roll back pan');
   assert.equal(await canvas.evaluate(el=>el.style.transform),'');
   await page.evaluate(()=>document.getElementById('scatteredMoveOnCanvas').click());
   assert.equal(await page.locator('body').evaluate(el=>
      el.classList.contains('view-pan-canvas-active')),false,
     'arming scattered shape editor must disarm camera mode');
   await page.evaluate(()=>document.getElementById('scatteredDirectDone').click());
   await page.evaluate(()=>document.querySelector('[data-view-pan="right"]').click());
   assert.equal(recipe(page).viewPanX,5,'existing keyboard/click precision pad still works');
   await page.evaluate(()=>document.getElementById('undo').click());
   assert.deepEqual(recipe(page),original);
   await page.screenshot({path:join(out,width+'x'+height+'.png'),animations:'disabled'});
   report.push({viewport:[width,height],oneThumbPan:true,cameraOnly:true,
     noOpNoHistory:true,oneUndo:true,lostCaptureCancel:true,
     alternateToolDisarms:true,precisionPadPreserved:true});
  }finally{await page.close();}
 }
 assert.deepEqual(errors,[]);
 await writeFile(join(out,'report.json'),JSON.stringify(report,null,2));
 console.log('VIEW_PAN_GESTURE_BROWSER_PASS '+JSON.stringify(report));
}finally{
 await browser?.close();
 await new Promise(resolve=>server.close(resolve));
}
