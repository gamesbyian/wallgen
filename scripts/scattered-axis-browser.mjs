#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe,resolveScene} from '../src/model.js';
import {RAINBOW_ORBITS} from '../src/scattered-composition.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=join(root,'artifacts/scattered-axis');
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
  page.on('pageerror',e=>errors.push(String(e)));
  page.setDefaultTimeout(20000);
  try{
   await page.goto('http://127.0.0.1:'+server.address().port+'/?r='+encodeRecipe(initial),
     {waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
     null,{timeout:85000});
   assert.deepEqual(recipe(page),initial);
   await page.evaluate(()=>document.getElementById('scatteredMoveOnCanvas').click());
   const button=page.locator('#scatteredDirectAxis');
   await button.waitFor({state:'visible'});
   const hit=await button.boundingBox();
   assert.ok(hit&&hit.width>=44&&hit.height>=44,'44 CSS px axis toggle');
   await button.click();
   assert.equal(await button.getAttribute('aria-pressed'),'true');
   const point=await page.evaluate(async()=>{
    const {decodeRecipe,resolveScene}=await import('/src/model.js');
    const {scatteredWorldToPixel}=await import('/src/scattered-drag.js');
    const current=decodeRecipe(new URL(location.href).searchParams.get('r'));
    const canvas=document.getElementById('preview'),rect=canvas.getBoundingClientRect();
    for(const object of resolveScene(current).objects){
     if(!object.circle)continue;
     const p=scatteredWorldToPixel(current,canvas.width,canvas.height,
       object.circle.cx,object.circle.cy);
     const x=rect.left+p.x*rect.width/canvas.width,
       y=rect.top+p.y*rect.height/canvas.height;
     if(x>rect.left+42&&x<rect.right-42&&y>rect.top+75&&y<rect.bottom-80)
       return {x,y};
    }
    return null;
   });
   assert.ok(point,'need a visible circle inside the canvas');
   const move=async(dx,dy)=>{
    await page.mouse.move(point.x,point.y);await page.mouse.down();
    await page.mouse.move(point.x+dx,point.y+dy,{steps:12});
    await page.mouse.up();
    return {value:recipe(page),index:await page.evaluate(()=>
      Number(document.getElementById('scatteredObjectPicker').value))};
   };
   const check=(edited,axis)=>{
    const initialCircle=resolveScene(initial).objects
      .find(o=>o.id==='region-'+edited.index)?.circle;
    const item=edited.value.scatteredOverrides.find(o=>o.index===edited.index);
    assert.ok(initialCircle&&item,'shape must have a saved vector override');
    const dx=Math.abs(item.x-initialCircle.cx/600);
    const dy=Math.abs(item.y-initialCircle.cy/1300);
    if(axis==='x')assert.ok(dx>.0001&&dy<.000002,'horizontal must freeze Y');
    if(axis==='y')assert.ok(dy>.0001&&dx<.000002,'vertical must freeze X');
    if(axis==='free')assert.ok(dx>.0001&&dy>.0001,'free drag changes X and Y');
   };
   check(await move(64,12),'x');
   await page.evaluate(()=>document.getElementById('undo').click());
   assert.deepEqual(recipe(page),initial,'horizontal Undo');
   check(await move(10,65),'y');
   await page.evaluate(()=>document.getElementById('undo').click());
   assert.deepEqual(recipe(page),initial,'vertical Undo');
   await button.click();
   assert.equal(await button.getAttribute('aria-pressed'),'false');
   check(await move(50,40),'free');
   await page.evaluate(()=>document.getElementById('undo').click());
   assert.deepEqual(recipe(page),initial,'free drag Undo');
   await button.click();
   await page.evaluate(()=>document.getElementById('preview')
     .addEventListener('pointerdown',e=>window.__axisPid=e.pointerId,{once:true}));
   await page.mouse.move(point.x,point.y);await page.mouse.down();
   await page.mouse.move(point.x+62,point.y+10,{steps:9});
   await page.evaluate(()=>{
    const el=document.getElementById('preview');
    if(!el.hasPointerCapture(window.__axisPid))
      throw Error('real pointer capture missing');
    el.releasePointerCapture(window.__axisPid);
   });
   await page.mouse.up();
   assert.deepEqual(recipe(page),initial,'lost capture must cancel source change');
   await page.screenshot({path:join(output,width+'x'+height+'.png'),animations:'disabled'});
   report.push({viewport:[width,height],axis44:true,horizontal:true,vertical:true,
     free:true,undo:true,captureCancel:true});
  }finally{await page.close();}
 }
 assert.deepEqual(errors,[]);
 await writeFile(join(output,'report.json'),JSON.stringify(report,null,2));
 console.log('SCATTERED_AXIS_BROWSER_PASS '+JSON.stringify(report));
}finally{
 await browser?.close();
 await new Promise(resolve=>server.close(resolve));
}
