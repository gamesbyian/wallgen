#!/usr/bin/env node
// Actual Chromium source-authority journey: lock -> select -> keyboard nudge
// -> Undo -> pointer scale -> Undo -> release/focus, on both small phones.
// No simulated DOM state, fake recipe writer or alternate Undo graph.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe,resolveScene} from '../src/model.js';
import {RAINBOW_ORBITS} from '../src/scattered-composition.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=join(root,'artifacts/scattered-combined-journey');
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
const initial=normalizeRecipe({...RAINBOW_ORBITS,lockedSettings:['palette','regionCount']});
assert.ok(initial.lockedSettings.includes('palette'));
const recipe=page=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
const report=[],errors=[];
let browser;
try{
 await new Promise((resolve,reject)=>{
  server.once('error',reject);server.listen(0,'127.0.0.1',resolve);
 });
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [width,height] of [[320,700],[412,892]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:true,
    hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});
  page.setDefaultTimeout(18000);
  page.on('pageerror',e=>errors.push(String(e)));
  try{
   await page.goto('http://127.0.0.1:'+server.address().port+'/?r='+encodeRecipe(initial),
     {waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>
     document.querySelector('#preview')?.dataset.renderPending==='false',
     null,{timeout:85000});
   assert.deepEqual(recipe(page),initial);
   await page.evaluate(()=>document.getElementById('scatteredMoveOnCanvas').click());
   const selected=await page.evaluate(async()=>{
    const {decodeRecipe,resolveScene}=await import('/src/model.js');
    const {scatteredWorldToPixel}=await import('/src/scattered-drag.js');
    const data=decodeRecipe(new URL(location.href).searchParams.get('r'));
    const canvas=document.getElementById('preview');
    const box=canvas.getBoundingClientRect();
    for(const object of resolveScene(data).objects){
      const circle=object.circle||object.editCircle;
      if(!circle)continue;
      const p=scatteredWorldToPixel(data,canvas.width,canvas.height,
        circle.cx,circle.cy);
      const x=box.left+p.x*box.width/canvas.width;
      const y=box.top+p.y*box.height/canvas.height;
      if(x>box.left+46&&x<box.right-46&&
         y>box.top+55&&y<box.bottom-60){
        const picker=document.querySelector('#scatteredObjectPicker');
        picker.value=object.id.slice(7);
        picker.dispatchEvent(new Event('change',{bubbles:true}));
        return {index:Number(picker.value),x,y,
          sourceX:circle.cx/600,sourceY:circle.cy/1300,radius:circle.r/600};
      }
    }
    return null;
   });
   assert.ok(selected,'must have an accessible in-frame source-backed shape');
   const guide=page.locator('#scatteredDirectOutline');
   await guide.waitFor({state:'visible'});
   await guide.focus();
   assert.equal(await guide.evaluate(el=>document.activeElement===el),true);
   const locked=recipe(page);
   assert.deepEqual(locked,initial,'tool focus/selection cannot edit authored state');
   await page.keyboard.press('ArrowRight');
   const nudged=recipe(page);
   const item=nudged.scatteredOverrides.find(o=>o.index===selected.index);
   assert.ok(item&&Math.abs(item.x-selected.sourceX-.01)<1e-5,
     'real focused keyboard ArrowRight writes exactly 1% authored X');
   assert.ok(Math.abs(item.y-selected.sourceY)<1e-5);
   assert.deepEqual(nudged.lockedSettings,initial.lockedSettings,
     'an unrelated palette lock must survive object editing');
   assert.equal(nudged.palette,initial.palette);
   assert.deepEqual(nudged.scatteredOverrides.filter(o=>o.index!==selected.index),
     initial.scatteredOverrides||[]);
   await page.evaluate(()=>document.getElementById('undo').click());
   assert.deepEqual(recipe(page),initial,'one source Undo must restore keyboard change');
   await page.waitForFunction(()=>
     document.querySelector('#preview')?.dataset.renderPending==='false',
     null,{timeout:85000});
   const grip=page.locator('#scatteredDirectScale');
   await grip.waitFor({state:'visible'});
   const rect=await grip.boundingBox();
   assert.ok(rect&&rect.width>=44&&rect.height>=44,
     'scale grip must expose a 44px actual pointer hit target');
   assert.ok(rect.x>=-1&&rect.y>=-1&&
     rect.x+rect.width<=width+1&&rect.y+rect.height<=height+1,
     'selected grip must be reachable within this phone viewport');
   const x=rect.x+rect.width/2,y=rect.y+rect.height/2;
   await page.mouse.move(x,y);await page.mouse.down();
   await page.mouse.move(x+44,y+22,{steps:8});await page.mouse.up();
   const scaled=recipe(page);
   const changed=scaled.scatteredOverrides.find(o=>o.index===selected.index);
   assert.ok(changed&&Math.abs(changed.radius-selected.radius)>1e-4,
     'actual source radius changes on pointer release');
   assert.equal(scaled.palette,initial.palette);
   assert.deepEqual(scaled.lockedSettings,initial.lockedSettings);
   await page.evaluate(()=>document.getElementById('undo').click());
   assert.deepEqual(recipe(page),initial,
     'one source Undo must restore scale and both unrelated locks');
   await page.waitForFunction(()=>
     document.querySelector('#preview')?.dataset.renderPending==='false',
     null,{timeout:85000});
   await guide.focus();
   await page.keyboard.press('Escape');
   assert.equal(await page.evaluate(()=>
     document.body.classList.contains('scattered-direct-active')),false);
   const focused=await page.evaluate(()=>document.activeElement?.id);
   assert.ok(focused&&focused!=='scatteredDirectOutline'&&
     focused!=='scatteredDirectScale',
     'Escape must restore focus outside the closed editing surface');
   assert.deepEqual(recipe(page),initial);
   await page.screenshot({path:join(output,'scattered-combined-'+width+'.png')});
   report.push({viewport:[width,height],selected:selected.index,
     keyboard:'1% canonical X and one Undo',
     scale:'real pointer and one Undo',
     locks:'palette and regionCount immutable',focused});
  }finally{await page.close();}
 }
 assert.deepEqual(errors,[],'real browser must produce no uncaught page errors');
 await writeFile(join(output,'report.json'),JSON.stringify({report,errors},null,2)+'\n');
 console.log('SCATTERED_COMBINED_CHROMIUM_PASS',JSON.stringify(report));
}finally{
 await browser?.close();
 await new Promise(done=>server.close(done));
}
