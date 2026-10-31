#!/usr/bin/env node
// Genuine CSS layout for compound imported silhouette selection guides.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {dirname,resolve,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
import {GEOMETRY_SNAPSHOT_SCHEMA} from '../src/geometry-asset.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=join(root,'artifacts/scattered-selection-guide');
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
const square=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const geometry={type:'compound-region',space:'asset-local',viewBox:[0,0,100,100],
 fillRule:'evenodd',components:[
  {outer:square(5,12,90,21),holes:[square(23,17,10,7)]},
  {outer:square(10,75,12,15),holes:[]}
 ]};
const initial=normalizeRecipe({seed:'selection-bounds-browser',structure:'regions',
  regionMode:'scattered',scatteredShapeKind:'imported',scatteredCount:1,
  scatteredShape:{schema:GEOMETRY_SNAPSHOT_SCHEMA,version:1,geometry},
  scatteredOverrides:[{index:0,x:.5,y:.5,radius:.15}],
  scatteredOverlap:'overlap'});
const report=[],errors=[];let browser;
try{
 await new Promise((ok,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',ok);});
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
   await page.evaluate(()=>document.getElementById('scatteredMoveOnCanvas').click());
   const geometry=await page.evaluate(async()=>{
    const {decodeRecipe,resolveScene}=await import('/src/model.js');
    const {scatteredSelectionBounds}=await import('/src/scattered-selection-bounds.js');
    const {scatteredWorldToPixel}=await import('/src/scattered-drag.js');
    const recipe=decodeRecipe(new URL(location.href).searchParams.get('r'));
    const object=resolveScene(recipe).objects.find(o=>o.id==='region-0');
    const bounds=scatteredSelectionBounds(object);
    const canvas=document.getElementById('preview'),image=canvas.getBoundingClientRect();
    const a=scatteredWorldToPixel(recipe,canvas.width,canvas.height,bounds.minX,bounds.minY);
    const b=scatteredWorldToPixel(recipe,canvas.width,canvas.height,bounds.maxX,bounds.maxY);
    return {bounds,rect:{x:image.left+a.x*image.width/canvas.width,
      y:image.top+a.y*image.height/canvas.height,
      width:(b.x-a.x)*image.width/canvas.width,
      height:(b.y-a.y)*image.height/canvas.height}};
   });
   assert.equal(geometry.bounds.isCompound,true);
   const outline=page.locator('#scatteredDirectOutline');
   assert.equal(await outline.isVisible(),true);
   assert.equal(await outline.evaluate(el=>
     el.classList.contains('scattered-direct-compound')),true);
   const box=await outline.boundingBox();
   for(const field of ['x','y','width','height']){
    assert.ok(Math.abs(box[field]-geometry.rect[field])<1.5,
      'actual '+field+' must track world ring bounds projected into CSS');
   }
   const grip=page.locator('#scatteredDirectScale');
   const gripRect=await grip.boundingBox();
   assert.ok(gripRect?.width>=44&&gripRect?.height>=44);
   assert.ok(gripRect.x>=0&&gripRect.x+44<=width,
     'detached compound scale grip stays on-screen');
   const before=decodeRecipe(new URL(page.url()).searchParams.get('r'));
   assert.deepEqual(before,initial,'selection guide never authors recipe values');
   await page.screenshot({path:join(output,width+'x'+height+'.png'),animations:'disabled'});
   report.push({viewport:[width,height],compoundBounds:true,
     ringProjected:true,grip44:true,sourceUnchanged:true});
  }finally{await page.close();}
 }
 assert.deepEqual(errors,[]);
 await writeFile(join(output,'report.json'),JSON.stringify(report,null,2));
 console.log('SCATTERED_SELECTION_GUIDE_PASS '+JSON.stringify(report));
}finally{
 await browser?.close();await new Promise(done=>server.close(done));
}
