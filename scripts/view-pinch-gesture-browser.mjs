#!/usr/bin/env node
// Genuine Chromium two-touch camera evidence. The canvas gets real CDP touch
// packets, not fabricated PointerEvents. CSS preview is never saved as art.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
import {RAINBOW_ORBITS} from '../src/scattered-composition.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=join(root,'artifacts/view-pinch-gesture');
await mkdir(output,{recursive:true});
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
 viewZoom:1.2,viewPanX:0,viewPanY:0,positionX:9,positionY:-6});
const current=page=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
const report=[],errors=[];
let browser;
try{
 await new Promise((yes,no)=>{server.once('error',no);
   server.listen(0,'127.0.0.1',yes);});
 browser=await chromium.launch({headless:true});
 for(const [width,height] of [[320,700],[412,892]]){
  const page=await browser.newPage({viewport:{width,height},
   isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});
  page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(String(e)));
  const cdp=await page.context().newCDPSession(page);
  const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{
   type,touchPoints:points});
  try{
   await page.goto('http://127.0.0.1:'+server.address().port+'/?r='+encodeRecipe(original),
    {waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
    null,{timeout:85000});
   await page.locator('#viewPanOnCanvas').click();
   assert.equal(await page.locator('#preview').evaluate(el=>el.style.touchAction),'none');
   const rect=await page.locator('#preview').boundingBox();
   const p1={x:rect.x+rect.width*.28,y:rect.y+rect.height*.52,id:1};
   const p2={x:rect.x+rect.width*.72,y:p1.y,id:2};
   const initialURL=page.url();
   // Even an untouched two-finger press is a genuine no-op.
   await touch('touchStart',[p1,p2]);
   await touch('touchEnd',[]);
   assert.equal(page.url(),initialURL);
   await touch('touchStart',[p1,p2]);
   const q1={...p1,x:p1.x-22,y:p1.y+24};
   const q2={...p2,x:p2.x+22,y:p2.y+24};
   await touch('touchMove',[q1,q2]);
   await page.waitForFunction(()=>document.querySelector('#preview')?.style.transform.includes('scale('));
   assert.equal(page.url(),initialURL,'provisional pinch must not save artwork');
   await touch('touchEnd',[]);
   await page.waitForFunction(initial=>location.href!==initial,initialURL);
   const changed=current(page);
   assert.ok(changed.viewZoom>original.viewZoom,
     'separating two fingers zooms in with canonical viewZoom');
   assert.ok(changed.viewPanY<original.viewPanY,
     'moving their centre down moves the camera up');
   assert.equal(changed.positionX,original.positionX);
   assert.equal(changed.positionY,original.positionY);
   assert.deepEqual(changed.scatteredOverrides,original.scatteredOverrides);
   assert.equal(await page.locator('#preview').evaluate(el=>el.style.transform),'');
   await page.locator('#undo').click();
   assert.deepEqual(current(page),original,'pinch and pan commit as one Undo');
   await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
    null,{timeout:85000});
   // Real cancellation after a changing touch packet must never write a draft.
   const rerendered=await page.locator('#preview').boundingBox();
   const a={...p1,x:rerendered.x+rerendered.width*.28,
     y:rerendered.y+rerendered.height*.52};
   const b={...p2,x:rerendered.x+rerendered.width*.72,y:a.y};
   await touch('touchStart',[a,b]);
   await touch('touchMove',[{...a,x:a.x-25},{...b,x:b.x+25}]);
   await page.waitForFunction(()=>document.querySelector('#preview')?.style.transform.includes('scale('));
   await touch('touchCancel',[]);
   assert.deepEqual(current(page),original,'touchcancel rolls back pinch');
   assert.equal(await page.locator('#preview').evaluate(el=>el.style.transform),'');
   await page.locator('#viewPanDone').click();
   assert.notEqual(await page.locator('#preview').evaluate(el=>el.style.touchAction),'none',
     'ordinary touch scrolling must return when the Frame tool exits');
   await page.screenshot({path:join(output,width+'x'+height+'.png'),
    animations:'disabled'});
   report.push({viewport:[width,height],realTwoFingerTouch:true,
    noOpNoHistory:true,anchorZoom:true,panWithPinch:true,cameraOnly:true,
    oneUndo:true,touchCancelRollback:true,frameExitRestoresTouch:true});
  }finally{await cdp.detach();await page.close();}
 }
 assert.deepEqual(errors,[]);
 await writeFile(join(output,'report.json'),JSON.stringify(report,null,2));
 console.log('VIEW_PINCH_BROWSER_PASS '+JSON.stringify(report));
}finally{
 await browser?.close();
 await new Promise(resolve=>server.close(resolve));
}
