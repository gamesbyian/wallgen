#!/usr/bin/env node
// Temporary-source Chromium journey for proportional scattered-object grips.
// Real browser pointer capture, portable recipe and one-Undo state at 2 phones.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
import {RAINBOW_ORBITS} from '../src/scattered-composition.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=join(root,'artifacts/scattered-scale');
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
const initial=normalizeRecipe(RAINBOW_ORBITS);
const recipe=page=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
const report=[],errors=[];
let browser;
try{
 await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes);});
 browser=await chromium.launch({headless:true});
 for(const [width,height] of [[320,700],[412,892]]){
  const page=await browser.newPage({viewport:{width,height},
    deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  page.on('pageerror',err=>errors.push(String(err)));
  page.setDefaultTimeout(20000);
  try{
   await page.goto('http://127.0.0.1:'+server.address().port+'/?r='+encodeRecipe(initial),
     {waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
     null,{timeout:85000});
   assert.deepEqual(recipe(page),initial);
   await page.evaluate(()=>document.getElementById('scatteredMoveOnCanvas').click());
   const selected=await page.evaluate(async()=>{
    const {decodeRecipe,resolveScene}=await import('/src/model.js');
    const {scatteredWorldToPixel}=await import('/src/scattered-drag.js');
    const data=decodeRecipe(new URL(location.href).searchParams.get('r'));
    const canvas=document.getElementById('preview'),rect=canvas.getBoundingClientRect();
    for(const object of resolveScene(data).objects){
     if(!object.circle)continue;
     const p=scatteredWorldToPixel(data,canvas.width,canvas.height,
       object.circle.cx,object.circle.cy);
     const x=rect.left+p.x*rect.width/canvas.width,
       y=rect.top+p.y*rect.height/canvas.height;
     if(x>rect.left+35&&x<rect.right-35&&y>rect.top+45&&y<rect.bottom-45){
      const picker=document.querySelector('#scatteredObjectEditor select');
      picker.value=object.id.replace('region-','');
      picker.dispatchEvent(new Event('change',{bubbles:true}));
      return {index:Number(picker.value),r:object.circle.r};
     }
    }
    return null;
   });
   assert.ok(selected,'must select a visible object with a bounded scale handle');
   const grip=page.locator('#scatteredDirectScale');
   await grip.waitFor({state:'visible'});
   const bounds=await grip.boundingBox();
   assert.ok(bounds&&Math.abs(bounds.width-44)<.1&&Math.abs(bounds.height-44)<.1,
     'full 44 CSS px scale hit target');
   assert.ok(bounds.x>=-1&&bounds.y>=-1&&
     bounds.x+bounds.width<=width+1&&bounds.y+bounds.height<=height+1,
     'scale grip must remain fully visible in the phone viewport');
   const x=bounds.x+22,y=bounds.y+22;
   await page.mouse.move(x,y);
   await page.mouse.down();
   await page.mouse.move(x+48,y+18,{steps:8});
   await page.mouse.up();
   await page.waitForFunction(()=>new URL(location.href).searchParams.has('r'));
   const changed=recipe(page);
   const edit=changed.scatteredOverrides.find(item=>item.index===selected.index);
   assert.ok(edit&&Math.abs(edit.radius-selected.r/600)>1e-4,
      'actual scale pointerup writes one normalized radius');
   assert.deepEqual(changed.scatteredOverrides.filter(o=>o.index!==selected.index),
     initial.scatteredOverrides||[]);
   await page.evaluate(()=>document.getElementById('undo').click());
   assert.deepEqual(recipe(page),initial,'one Undo restores entire original recipe');
   // Lost capture is a cancellation even if the pointer has moved significantly.
   await page.evaluate(()=>document.getElementById('scatteredDirectScale')
     .addEventListener('pointerdown',e=>window.__scaleTestPointer=e.pointerId,{once:true}));
   const fresh=await grip.boundingBox();
   await page.mouse.move(fresh.x+22,fresh.y+22);await page.mouse.down();
   const pid=await page.evaluate(()=>window.__scaleTestPointer);
   assert.equal(typeof pid,'number');
   await page.mouse.move(fresh.x+70,fresh.y+18,{steps:8});
   await page.evaluate(id=>{
     const el=document.getElementById('scatteredDirectScale');
     if(!el.hasPointerCapture(id))throw Error('scale grip did not capture genuine pointer');
     el.releasePointerCapture(id);
   },pid);
   await page.mouse.up();
   assert.deepEqual(recipe(page),initial,'capture loss must not save an unfinished scale');
   await grip.focus();
   await page.keyboard.press('ArrowUp');
   const keyEdit=recipe(page).scatteredOverrides.find(o=>o.index===selected.index);
   assert.ok(keyEdit&&keyEdit.radius>selected.r/600,
     'keyboard alternative adjusts same radius without an independent model');
   await page.evaluate(()=>document.getElementById('undo').click());
   assert.deepEqual(recipe(page),initial,'keyboard adjustment also provides one Undo');
   await page.screenshot({path:join(output,width+'x'+height+'.png'),animations:'disabled'});
   report.push({viewport:[width,height],grip44:true,withinViewport:true,
     realPointerCommit:true,oneUndo:true,lostCaptureCancel:true,keyboardScale:true});
  }finally{await page.close();}
 }
 assert.deepEqual(errors,[]);
 await writeFile(join(output,'report.json'),JSON.stringify(report,null,2));
 console.log('SCATTERED_SCALE_BROWSER_PASS '+JSON.stringify(report));
}finally{
 await browser?.close();
 await new Promise(resolve=>server.close(resolve));
}
