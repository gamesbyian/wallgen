#!/usr/bin/env node
/**
 * Paired real Chromium source acceptance of original vs proposed settled cache
 * Worker. Serve original base and PR source from independent checkouts.
 * Compare transferred raw ImageBitmap pixels, real PNG export bytes and actual
 * worker paint times. No fabricated or patched browser graphics.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {chromium} from 'playwright';
import {randomizeAllRecipe,normalizeRecipe} from '../src/model.js';

const root=process.cwd(),comparison=resolve(root,'comparator-baseline');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/'){res.writeHead(200,{'content-type':'text/html'}).end('<!doctype html><title>Settled Worker source acceptance</title>');return;}
  const match=/^\/(base|candidate)\/(.+)$/.exec(pathname);
  if(!match){res.writeHead(404).end();return;}
  const home=match[1]==='base'?comparison:root;
  const file=resolve(home,'./'+match[2]);
  if(!file.startsWith(home+'/')){res.writeHead(403).end();return;}
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream',
    'cache-control':'no-store'}).end(await readFile(file));
 }catch(error){res.writeHead(404).end(String(error));}
});
const pairFor=i=>[Math.imul(i,0x9e3779b1)>>>0,
  (Math.imul(i+17,0x85ebca6b)^0xa5a5f0f0)>>>0];
const seedFor=pair=>pair.map(n=>n.toString(36)).join('-');
const cases=[
  {label:'sand-background-600x1300',index:126,width:600,height:1300,
    overrides:{textureCoverage:'background'}},
  {label:'sand-background-372x806',index:126,width:372,height:806,
    overrides:{textureCoverage:'background'}},
  {label:'sand-background-nudged',index:126,width:600,height:1300,
    overrides:{textureCoverage:'background',positionX:30,positionY:-30}},
  {label:'sand-background-zoom-rotated',index:126,width:372,height:806,
    overrides:{textureCoverage:'background',textureRotation:37,
      viewZoom:1.35,viewPanX:8,viewPanY:-6}},
  {label:'sand-beaded-background',index:126,width:372,height:806,
    overrides:{material:'sand-beaded',textureCoverage:'background'}},
  {label:'sand-foreground-control',index:126,width:600,height:1300,
    overrides:{textureCoverage:'stripes'}},
  {label:'loops-control',index:94,width:600,height:1300},
  {label:'regions-control',index:240,width:600,height:1300},
].map(({overrides,...entry})=>{
  const recipe=normalizeRecipe({...randomizeAllRecipe({
    seed:seedFor(pairFor(entry.index))}),...overrides});
  return {...entry,recipe};
});
assert.equal(cases[0].recipe.material,'sand-mandala');
assert.equal(cases[0].recipe.rayCount,42);
assert.equal(cases[0].recipe.textureCoverage,'background');
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let browser;
try{
 browser=await chromium.launch({headless:true,
   ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),
   args:['--no-sandbox']});
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
 const measurements=await page.evaluate(async cases=>{
  const versions=['base','candidate'];
  const workers=await Promise.all(versions.map(async version=>{
   const w=new Worker('/'+version+'/src/render-worker.js',{type:'module'});
   let next=0;
   const callbacks=new Map();
   let readyResolve,readyReject;
   const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});
   const readyTimeout=setTimeout(()=>readyReject(Error('Worker not ready '+version)),30000);
   w.addEventListener('message',({data})=>{
    if(data?.type==='ready'){clearTimeout(readyTimeout);readyResolve();return;}
    if(data?.type==='unsupported'){clearTimeout(readyTimeout);readyReject(Error(data.error));return;}
    if(callbacks.has(data?.id))callbacks.get(data.id)(data);
   });
   w.addEventListener('error',e=>readyReject(Error(version+': '+e.message)));
   await ready;
   return {version,worker:w,request(payload){
    return new Promise((resolve,reject)=>{
     const id=++next;
     const timer=setTimeout(()=>{callbacks.delete(id);reject(Error('Worker timeout '+version));},150000);
     callbacks.set(id,data=>{
      clearTimeout(timer);callbacks.delete(id);
      if(data.type==='error')reject(Error(data.error));
      else resolve(data);
     });
     w.postMessage({...payload,id});
    });
   }};
  }));
  const hash=async bytes=>{
   const digest=await crypto.subtle.digest('SHA-256',bytes);
   return [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');
  };
  async function bitmapHash(bitmap){
   const canvas=new OffscreenCanvas(bitmap.width,bitmap.height);
   try{
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(bitmap,0,0);
    return {width:bitmap.width,height:bitmap.height,
      sha256:await hash(ctx.getImageData(0,0,canvas.width,canvas.height).data)};
   }finally{bitmap.close();canvas.width=0;canvas.height=0;}
  }
  const rows=[];
  for(const job of cases){
   const trials=[];
   for(let index=0;index<5;index++){
    const pair={};
    for(const w of (index%2?workers.slice().reverse():workers)){
     const frame=await w.request({type:'preview',key:job.recipe.seed,
       recipe:job.recipe,width:job.width,height:job.height,quality:'settled'});
     if(frame.type!=='frame'||frame.quality!=='settled')
       throw Error('No actual settled Worker: '+job.label);
     pair[w.version]={workerMs:frame.ms,ink:await bitmapHash(frame.ink),
       background:await bitmapHash(frame.background),overhang:frame.overhang};
    }
    if(JSON.stringify(pair.base.ink)!==JSON.stringify(pair.candidate.ink)||
       JSON.stringify(pair.base.background)!==JSON.stringify(pair.candidate.background)||
       JSON.stringify(pair.base.overhang)!==JSON.stringify(pair.candidate.overhang))
      throw Error('Rendered pixels or nudge coverage changed: '+job.label+'/'+index);
    trials.push(pair);
   }
   rows.push({label:job.label,seed:job.recipe.seed,dimensions:[job.width,job.height],
     coverage:job.recipe.textureCoverage,material:job.recipe.material,
     inkSha256:trials[0].base.ink.sha256,
     backgroundSha256:trials[0].base.background.sha256,
     base:trials.map(t=>t.base.workerMs),candidate:trials.map(t=>t.candidate.workerMs)});
  }
  // Export must remain the original painter, not the cache-only path. Check
  // actual native-size PNG bytes across both original and PR render workers.
  const native={};
  for(const w of workers){
   const result=await w.request({type:'export',recipe:cases[0].recipe,
     width:3024,height:6552});
   if(result.type!=='exported'||result.blob?.type!=='image/png')
     throw Error('Native export failed '+w.version);
   const bytes=await result.blob.arrayBuffer();
   native[w.version]={sha256:await hash(bytes),byteLength:bytes.byteLength,
     workerMs:result.ms};
  }
  if(native.base.sha256!==native.candidate.sha256||
     native.base.byteLength!==native.candidate.byteLength)
    throw Error('Native 3024x6552 export PNG bytes changed');
  for(const w of workers)w.worker.terminate();
  return {rows,native};
 },cases);
 assert.deepEqual(errors,[]);
 const median=values=>{const s=values.slice().sort((a,b)=>a-b);return s[Math.floor(s.length/2)];};
 const rows=measurements.rows.map(row=>({
  ...row,
  baseMedianMs:Math.round(median(row.base)),
  candidateMedianMs:Math.round(median(row.candidate)),
  improvementPercent:Math.round(1000*(1-median(row.candidate)/median(row.base)))/10,
  pairedFaster:row.base.filter((n,i)=>row.candidate[i]<n).length,
 }));
 await mkdir(join(root,'artifacts','background-sand-crop-ab'),{recursive:true});
 await writeFile(join(root,'artifacts','background-sand-crop-ab','receipt.json'),
   JSON.stringify({environment:'Actual same-run Linux Chromium OffscreenCanvas workers; separate exact base and PR source, not physical Pixel',rows,native:measurements.native},null,2)+'\n');
 console.log('ROYGBIV_BACKGROUND_SAND_CROP_AB_PASS',JSON.stringify({rows,native:measurements.native}));
}finally{
 await browser?.close();
 await new Promise(done=>server.close(done));
}
