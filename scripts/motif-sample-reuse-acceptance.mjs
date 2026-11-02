#!/usr/bin/env node
/**
 * Exact cross-commit pixel comparison for shared motif path point reuse
 * refactor. Direct Canvas2D and real export Worker are each compared
 * AGAINST THEIR OWN prior main implementation. Existing direct vs worker
 * stitching differences are not conflated with a code regression.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,randomizeAllRecipe} from '../src/model.js';
// Alternate A/B and B/A order to avoid runner warming favouring one version.
// Raised repetitions are opt-in for targeted measurements, not normal CI.
const perfTrials=Math.max(3,Math.min(12,Number(process.env.ROYGBIV_PERF_TRIALS)||3));
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
 ['random-worst-30',randomizeAllRecipe({seed:'random-perf-fixed-30'})],
 ['loop-dashes',normalizeRecipe({seed:'motif-loop-dashes',structure:'paths',
   geometry:'loops',motif:'dashes',motifSize:68,motifFrequency:87,
   material:'wood-grain',textureCoverage:'both',textureStrength:85,
   textureDisplacement:72})],
 ['loop-chevrons',normalizeRecipe({seed:'motif-loop-chevrons',structure:'paths',
   geometry:'loop',motif:'chevrons',material:'linen',textureStrength:80,
   textureCoverage:'stripes',textureDisplacement:48})],
 ['hairpin-stars',normalizeRecipe({seed:'motif-hairpin-stars',structure:'paths',
   geometry:'hairpin',motif:'stars',material:'canvas',textureStrength:65,
   textureCoverage:'both',textureDisplacement:34})],
 ['straight-hatch',normalizeRecipe({seed:'motif-straight-hatch',structure:'paths',
   geometry:'straight',motif:'hatch',material:'felt',textureStrength:65,
   textureCoverage:'both'})],
 ['wave-dots',normalizeRecipe({seed:'motif-wave-dots',structure:'paths',
   geometry:'wave',motif:'dots',material:'concrete',textureStrength:60,
   textureCoverage:'background',textureDisplacement:0})],
 ['zigzag-checker',normalizeRecipe({seed:'motif-zigzag-check',structure:'paths',
   geometry:'zigzag',motif:'checker',material:'wood-grain',textureStrength:80,
   textureCoverage:'both',textureDisplacement:60})],
 ['loop-solid',normalizeRecipe({seed:'motif-loop-solid',structure:'paths',
   geometry:'loop',motif:'solid',material:'felt',textureStrength:80,
   textureCoverage:'both',textureDisplacement:65})],
 ['radial',normalizeRecipe({seed:'motif-radial',structure:'radial',
   radialMode:'concentric',rayCount:56,material:'felt',textureStrength:60,
   textureCoverage:'both'})],
 // Reproducible real-click 42-ray sand long tail, pinned by the E2E harness.
 ['radial-sand-mandala',randomizeAllRecipe({seed:'1pyivby-tpkh85'})],
 // Explicit directional/lighting-off sand controls ensure the shared
 // lattice hash changes neither original facet normals nor unlit colours.
 ['sand-lit-daylight',normalizeRecipe({seed:'hash-facet-lit-daylight',structure:'radial',
   radialMode:'concentric',rayCount:42,material:'sand-mandala',textureStrength:82,
   textureCoverage:'both',lightingMood:'daylight',lightStrength:90,shadowStrength:70})],
 ['sand-lit-moonlight',normalizeRecipe({seed:'hash-facet-lit-moonlight',structure:'paths',
   geometry:'loops',material:'sand-beaded',textureStrength:80,
   textureCoverage:'both',lightingMood:'moonlight',lightStrength:75,shadowStrength:88})],
 ['sand-unlit-filigree',normalizeRecipe({seed:'hash-facet-unlit-filigree',structure:'regions',
   regionMode:'organic',regionCount:14,material:'sand-filigree',textureStrength:80,
   textureCoverage:'both',lightingMood:'off'})],
 ['regions',normalizeRecipe({seed:'motif-regions',structure:'regions',
   regionMode:'organic',regionCount:14,material:'grain',textureStrength:70})],
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
 // Comparable production interactive-worker paint durations, excluding
 // Worker boot and PNG encoding. Each painter is a real OffscreenCanvas job,
 // with repeated A/B trials and identical canonical recipes.
 const speed=await page.evaluate(async ({cases,trials})=>{
   const workers={};
   for(const version of ['base','candidate']){
     const worker=new Worker('/'+version+'/src/render-worker.js',{type:'module'});
     let pending=null;
     const ready=new Promise((resolve,reject)=>{
       const timeout=setTimeout(()=>reject(Error('Worker not ready: '+version)),30000);
       worker.onmessage=({data})=>{
         if(data.type==='ready'){clearTimeout(timeout);resolve();return;}
         if(data.type==='unsupported'){clearTimeout(timeout);reject(Error(data.error));return;}
         pending?.(data);
       };
     });
     await ready;
     workers[version]={worker,run:recipe=>new Promise((resolve,reject)=>{
       const id=(workers[version].id=(workers[version].id||0)+1);
       const timeout=setTimeout(()=>reject(Error('Paint stalled '+version)),45000);
       pending=null;
       workers[version].pending=data=>{
         if(data.id!==id)return;
         clearTimeout(timeout);workers[version].pending=null;
         for(const k of ['frame','ink','background'])data[k]?.close?.();
         if(data.type==='error')reject(Error(data.error));
         else resolve(Math.round(data.ms));
       };
       worker.postMessage({type:'preview',id,key:recipe.seed,quality:'interactive',
         width:372,height:806,recipe});
     })};
     // Keep receiver tied to the version's mutable pending handler.
     worker.onmessage=({data})=>{
       if(data.type==='ready')return;
       workers[version].pending?.(data);
     };
   }
   const output=[];
   for(const input of cases.filter(x=>['random-worst-30','loop-dashes','loop-chevrons',
     'hairpin-stars','zigzag-checker','radial-sand-mandala',
     'sand-lit-daylight','sand-unlit-filigree'].includes(x.name))){
     const times={base:[],candidate:[]};
     for(let trial=0;trial<trials;trial++){
       const order=trial%2===0?['base','candidate']:['candidate','base'];
       for(const version of order)
         times[version].push(await workers[version].run(input.recipe));
     }
     output.push({name:input.name,times});
   }
   workers.base.worker.terminate();workers.candidate.worker.terminate();
   return output;
 },{cases:specs,trials:perfTrials});
 // An actual native-resolution PNG encode is a separate fidelity gate.
 // Compare the real production export Worker output at 3024x6552, but do
 // not claim the Linux runner verifies Pixel 6 Pro memory/thermal behavior.
 const native=await page.evaluate(async recipe=>{
   const outcome={};
   const hex=buffer=>[...new Uint8Array(buffer)]
     .map(x=>x.toString(16).padStart(2,'0')).join('');
   for(const version of ['base','candidate']){
     const {exportWallpaperInWorker}=await import('/'+version+'/src/render-coordinator.js');
     const blob=await exportWallpaperInWorker({
       recipe,width:3024,height:6552,timeoutMs:150000
     });
     const bytes=await blob.arrayBuffer();
     outcome[version]={sha256:hex(await crypto.subtle.digest('SHA-256',bytes)),
       size:bytes.byteLength};
   }
   return outcome;
 },specs.find(x=>x.name==='random-worst-30').recipe);
 assert.deepEqual(native.base,native.candidate,
   'Native-resolution 3024x6552 worker PNG no longer matches current main');
 await mkdir(join(root,'artifacts','motif-samples'),{recursive:true});
 await writeFile(join(root,'artifacts','motif-samples','pixel-proof.json'),
   JSON.stringify({environment:'Linux Chromium 240x520 exact raw pixels; 372x806 worker timings; 3024x6552 worker PNG SHA',
     results,speed,native},null,2)+'\n');
 console.log('MOTIF_SAMPLE_REUSE_EXACT_PIXELS_PASS',JSON.stringify(
   results.map(x=>({name:x.name,direct:x.direct.identical,worker:x.worker.identical}))));
 console.log('MOTIF_SAMPLE_REUSE_WORKER_TIMES',JSON.stringify(speed));
 console.log('MOTIF_SAMPLE_REUSE_NATIVE_IDENTICAL',JSON.stringify(native));
}finally{
 await browser?.close();await new Promise(done=>server.close(done));
}
