#!/usr/bin/env node
// Baseline for the owner's concrete complaint: Random feels sluggish on phone.
// Real Chromium 412x892 interactions and on-screen preview events, not
// physical Pixel timing, visual appraisal or statistically significant runs.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
const root=process.cwd(),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const f=resolve(root,'.'+(path==='/'?'/index.html':path));
  if(!f.startsWith(root+'/')){res.writeHead(403).end();return;}
  res.writeHead(200,{'content-type':mime[extname(f)]||'application/octet-stream',
    'cache-control':'no-store'}).end(await readFile(f));
 }catch{res.writeHead(404).end();}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
const cases=[
 {label:'basic',recipe:{seed:'random-latency-basic',structure:'paths',geometry:'wave',
   material:'grain',textureStrength:40}},
 {label:'three-material',recipe:{seed:'random-latency-heavy',structure:'paths',
   geometry:'loops',material:'linen',textureStrength:85,
   textureLayer2Enabled:true,material2:'foil',textureStrength2:65,
   textureLayer3Enabled:true,material3:'canvas',textureStrength3:75}},
 {label:'regions',recipe:{seed:'random-latency-regions',structure:'regions',
   regionMode:'organic',regionCount:14,material:'linen',textureStrength:80}},
];
let browser;
const results=[];
try{
 browser=await chromium.launch({headless:true,
   ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),args:['--no-sandbox']});
 for(const entry of cases){
  const page=await browser.newPage({viewport:{width:412,height:892},hasTouch:true,
    isMobile:true,reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const start=normalizeRecipe(entry.recipe);
  await page.goto(base+'/?r='+encodeRecipe(start),{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
    null,{timeout:60000});
  const run=async (count,interval)=>{
   await page.evaluate(()=>{
     const target=document.querySelector('#randomizeAll'),canvas=document.querySelector('#preview');
     const record={inputs:[],interactive:[],settled:[],worker:null};
     target.addEventListener('click',()=>record.inputs.push(performance.now()));
     canvas.addEventListener('roygbiv-preview-interactive',()=>record.interactive.push(performance.now()));
     canvas.addEventListener('roygbiv-preview-presented',event=>{
       record.settled.push(performance.now());record.worker=event.detail.worker;
     });
     window.__randomizeLatency=record;
   });
   const prior=decodeRecipe(new URL(page.url()).searchParams.get('r'));
   for(let n=0;n<count;n++){
     await page.locator('#randomizeAll').click();
     if(n<count-1)await page.waitForTimeout(interval);
   }
   await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
     null,{timeout:90000});
   await page.waitForTimeout(200);
   const r=await page.evaluate(()=>window.__randomizeLatency);
   const now=decodeRecipe(new URL(page.url()).searchParams.get('r'));
   assert.notEqual(prior.seed,now.seed,'Random action did not modify canonical seed');
   assert.ok(r.inputs.length>=count,'Click events missing');
   assert.ok(r.settled.length>=1,'No settled exact preview');
   const first=r.inputs[0],last=r.inputs.at(-1);
   const interactive=r.interactive.filter(t=>t>=first);
   const settled=r.settled.filter(t=>t>=last);
   return {clicks:count,worker:r.worker,inputMs:r.inputs.length,
     firstInteractiveMs:interactive.length?Math.round(interactive[0]-first):null,
     interimFrames:interactive.length,
     settleAfterLastClickMs:settled.length?Math.round(settled.at(-1)-last):null,
     totalFromFirstMs:Math.round(settled.at(-1)-first)};
  };
  const single=await run(1,0);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
    null,{timeout:60000});
  const burst=await run(4,110);
  results.push({scenario:entry.label,single,burst,errors});
  await page.close();
 }
 for(const r of results){
  assert.deepEqual(r.errors,[],'Unexpected browser errors in '+r.scenario);
  assert.ok(r.single.settleAfterLastClickMs!==null&&r.burst.settleAfterLastClickMs!==null);
 }
 await mkdir(join(root,'artifacts','randomize-latency'),{recursive:true});
 await writeFile(join(root,'artifacts','randomize-latency','baseline.json'),
   JSON.stringify({environment:'single Linux Chromium 412x892 run; no physical Pixel',
     results},null,2)+'\n');
 console.log('ROYGBIV_RANDOMIZE_LATENCY_BASELINE',JSON.stringify(results));
}finally{
 await browser?.close();await new Promise(ok=>server.close(ok));
}
