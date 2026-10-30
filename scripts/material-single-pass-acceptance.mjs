#!/usr/bin/env node
/**
 * Exact cross-commit pixel comparison for the shared material single-pass
 * refactor. Main-thread Canvas2D and real export Worker are each compared
 * AGAINST THEIR OWN prior main implementation. Existing direct vs worker
 * stitching differences are not conflated with a code regression.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,randomizeAllRecipe} from '../src/model.js';
const root=process.cwd();
const baseline=resolve(root,'comparator-baseline');
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html',
 '.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/probe'){
    res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'})
      .end('<!doctype html><title>Material one-pass exact pixels</title>');
    return;
  }
  const path=decodeURIComponent(url.pathname);
  const prefix=path.startsWith('/base/')?'/base/':path.startsWith('/candidate/')?'/candidate/':null;
  if(!prefix){res.writeHead(404).end();return;}
  const home=prefix==='/base/'?baseline:root;
  const f=resolve(home,'.'+path.slice(prefix.length-1));
  if(!f.startsWith(home+'/')){res.writeHead(403).end();return;}
  res.writeHead(200,{'Content-Type':mime[extname(f)]||'application/octet-stream'})
    .end(await readFile(f));
 }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const samples=[
 ['wood-both',normalizeRecipe({seed:'material-once-wood',structure:'paths',geometry:'loops',
   material:'wood-grain',textureCoverage:'both',textureStrength:80,textureDisplacement:30})],
 ['radial-felt',normalizeRecipe({seed:'material-once-felt',structure:'radial',
   radialMode:'concentric',rayCount:56,material:'felt',textureStrength:75,
   textureCoverage:'both'})],
 ['mixed-three',normalizeRecipe({seed:'material-once-three',structure:'paths',geometry:'wave',
   material:'linen',textureCoverage:'both',textureStrength:88,
   textureLayer2Enabled:true,material2:'grain',textureCoverage2:'stripes',
   textureStrength2:60,textureBlend2:'multiply',
   textureLayer3Enabled:true,material3:'foil',textureCoverage3:'both',
   textureStrength3:45,textureBlend3:'screen'})],
 ['three-both',normalizeRecipe({seed:'material-three-both',structure:'regions',
   regionMode:'organic',regionCount:14,material:'felt',textureCoverage:'both',
   textureStrength:85,textureLayer2Enabled:true,material2:'watercolor',
   textureCoverage2:'both',textureStrength2:65,textureBlend2:'multiply',
   textureLayer3Enabled:true,material3:'denim',textureCoverage3:'both',
   textureStrength3:50,textureBlend3:'soft-light'})],
 ['background-only',normalizeRecipe({seed:'material-background',structure:'paths',
   geometry:'hairpin',material:'wood-grain',textureCoverage:'background',
   textureStrength:95})],
 ['stripes-only',normalizeRecipe({seed:'material-stripes',structure:'paths',
   geometry:'zigzag',material:'linen-organic',textureCoverage:'stripes',
   textureStrength:95})],
 ['single-grain',normalizeRecipe({seed:'material-grain',structure:'regions',
   regionMode:'nested',regionCount:7,material:'grain',textureCoverage:'both',
   textureStrength:75})],
 ['random-worst-30',randomizeAllRecipe({seed:'random-perf-fixed-30'})],
 ['random-worst-20',randomizeAllRecipe({seed:'random-perf-fixed-20'})],
];
const specs=samples.map(([name,recipe])=>({name,recipe,width:240,height:520}));
let browser;
try{
 browser=await chromium.launch({headless:true,
   ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),
   args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:412,height:892}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(origin+'/probe',{waitUntil:'domcontentloaded'});
 const results=await page.evaluate(async cases=>{
   const outcomes=[];
   const hex=buffer=>[...new Uint8Array(buffer)].map(x=>x.toString(16).padStart(2,'0')).join('');
   const digest=async canvas=>{
     const bytes=canvas.getContext('2d',{willReadFrequently:true})
       .getImageData(0,0,canvas.width,canvas.height).data;
     return hex(await crypto.subtle.digest('SHA-256',bytes));
   };
   const paint=async ({name,recipe,width,height},version,backend)=>{
     const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
     const start=performance.now();
     if(backend==='direct'){
       const {drawWallpaper}=await import('/'+version+'/src/renderer.js');
       drawWallpaper(canvas,recipe);
     }else{
       const {exportWallpaperInWorker}=await import('/'+version+'/src/render-coordinator.js');
       const png=await exportWallpaperInWorker({recipe,width,height,timeoutMs:90000});
       const bitmap=await createImageBitmap(png);
       canvas.getContext('2d').drawImage(bitmap,0,0);
       bitmap.close();
     }
     const ms=performance.now()-start;
     const hash=await digest(canvas);
     return {hash,ms:Math.round(ms)};
   };
   for(const input of cases){
     const item={name:input.name};
     for(const backend of ['direct','worker']){
       const base=await paint(input,'base',backend);
       const candidate=await paint(input,'candidate',backend);
       item[backend]={base,candidate,identical:base.hash===candidate.hash};
     }
     outcomes.push(item);
   }
   return outcomes;
 },specs);
 assert.deepEqual(errors,[]);
 for(const r of results){
   assert.equal(r.direct.identical,true,
     'Direct Canvas pixel regression '+r.name+' '+JSON.stringify(r.direct));
   assert.equal(r.worker.identical,true,
     'Worker Canvas pixel regression '+r.name+' '+JSON.stringify(r.worker));
 }
 await mkdir(join(root,'artifacts','material-once'),{recursive:true});
 await writeFile(join(root,'artifacts','material-once','pixel-proof.json'),
   JSON.stringify({environment:'Linux Chromium 240x520 exact raw image pixel SHA-256',
     results},null,2)+'\n');
 console.log('MATERIAL_ONEPASS_EXACT_PIXELS_PASS',JSON.stringify(
   results.map(x=>({name:x.name,baselineDirectMs:x.direct.base.ms,
     candidateDirectMs:x.direct.candidate.ms,baselineWorkerMs:x.worker.base.ms,
     candidateWorkerMs:x.worker.candidate.ms}))));
}finally{
 await browser?.close();await new Promise(done=>server.close(done));
}
