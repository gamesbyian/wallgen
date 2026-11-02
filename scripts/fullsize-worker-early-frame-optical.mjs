#!/usr/bin/env node
/**
 * Optical feasibility gate only: would a real 600x1300 full-size Worker
 * interactive frame be byte-identical to presenting the existing immutable
 * settled cache for the SAME canonical recipe?
 *
 * Both are real production Worker messages, and cached presentation uses the
 * existing presentNudgedArtwork() function on an OffscreenCanvas in Chromium.
 * Report non-equality as a result, not a test harness failure: the experiment
 * is intended to discover if an early-canonical-frame design is actually safe.
 *
 * No app source changes, no synthetic/surrogate imagery, no physical Pixel claim.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {chromium} from 'playwright';
import {randomizeAllRecipe} from '../src/model.js';

const root=process.cwd(),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
  try{
    const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(p==='/'){res.writeHead(200,{'content-type':'text/html'}).end('<!doctype html><title>Full canonical vs settled preview optical proof</title>');return;}
    const file=resolve(root,'.'+p);
    if(!file.startsWith(root+'/')){res.writeHead(403).end();return;}
    const bytes=await readFile(file);
    res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream',
      'cache-control':'no-store'}).end(bytes);
  }catch(e){if(!res.headersSent)res.writeHead(404).end(String(e));}
});
const pairFor=i=>[Math.imul(i,0x9e3779b1)>>>0,
 (Math.imul(i+17,0x85ebca6b)^0xa5a5f0f0)>>>0];
const seedFor=i=>pairFor(i).map(n=>n.toString(36)).join('-');
const seeds=[
 {label:'42-ray-sand',index:126},
 {label:'textured-loops',index:94},
 {label:'14-plus-regions',index:240},
].map(s=>({...s,seed:seedFor(s.index),recipe:randomizeAllRecipe({seed:seedFor(s.index)})}));
assert.equal(seeds[0].recipe.material,'sand-mandala');
assert.equal(seeds[0].recipe.rayCount,42);
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let browser;
try{
 browser=await chromium.launch({headless:true,
   ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),
   args:['--no-sandbox']});
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
 const records=await page.evaluate(async cases=>{
  const {presentNudgedArtwork}=await import('/src/renderer.js');
  const worker=new Worker('/src/render-worker.js',{type:'module'});
  let next=0;
  const pending=new Map();
  let readyResolve,readyReject;
  const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});
  const readyTimer=setTimeout(()=>readyReject(Error('Worker init timeout')),30000);
  worker.addEventListener('error',e=>readyReject(Error(e.message)));
  worker.addEventListener('message',({data})=>{
   if(data?.type==='ready'){clearTimeout(readyTimer);readyResolve();return;}
   if(data?.type==='unsupported'){clearTimeout(readyTimer);readyReject(Error(data.error));return;}
   if(pending.has(data?.id))pending.get(data.id)(data);
  });
  await ready;
  const request=(recipe,width,height,quality)=>new Promise((resolve,reject)=>{
   const id=++next;
   const timeout=setTimeout(()=>{pending.delete(id);reject(Error('Worker paint timeout'));},90000);
   pending.set(id,data=>{
    pending.delete(id);clearTimeout(timeout);
    if(data.type==='error')reject(Error(data.error));
    else if(data.type==='frame'&&data.quality===quality)resolve(data);
    else reject(Error('Unexpected response '+data.type));
   });
   worker.postMessage({type:'preview',id,key:recipe.seed,recipe,width,height,quality});
  });
  const sha=async raw=>{
   const digest=await crypto.subtle.digest('SHA-256',raw);
   return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  };
  async function imageFromBitmap(bitmap){
   const canvas=new OffscreenCanvas(bitmap.width,bitmap.height);
   try{
    const ctx=canvas.getContext('2d',{alpha:false,willReadFrequently:true});
    ctx.drawImage(bitmap,0,0);
    return new Uint8ClampedArray(ctx.getImageData(0,0,canvas.width,canvas.height).data);
   }finally{bitmap.close();canvas.width=0;canvas.height=0;}
  }
  const out=[];
  const width=600,height=1300;
  for(const entry of cases){
   // Three samples for each mode in exactly the same Worker. Time is
   // reported but no cross-order median promises are made.
   const nativeFull=[];
   const cachedFrames=[];
   let directPixels,presentedPixels;
   for(let i=0;i<3;i++){
    const order=i%2?['settled','interactive']:['interactive','settled'];
    const record={};
    for(const quality of order){
     const frame=await request(entry.recipe,width,height,quality);
     record[quality]=frame.ms;
     if(quality==='interactive'){
      const pixels=await imageFromBitmap(frame.frame);
      if(!directPixels)directPixels=pixels;
      else if(await sha(pixels)!==await sha(directPixels))
       throw Error('Direct frame not deterministic: '+entry.label);
     }else{
      const canvas=new OffscreenCanvas(width,height);
      const layers={background:frame.background,ink:frame.ink,overhang:frame.overhang};
      try{
       presentNudgedArtwork(canvas,layers,entry.recipe);
       const pixels=new Uint8ClampedArray(canvas.getContext('2d')
        .getImageData(0,0,width,height).data);
       if(!presentedPixels)presentedPixels=pixels;
       else if(await sha(pixels)!==await sha(presentedPixels))
        throw Error('Settled presentation not deterministic: '+entry.label);
      }finally{
       layers.background.close();layers.ink.close();canvas.width=0;canvas.height=0;
      }
     }
    }
    nativeFull.push(record.interactive);
    cachedFrames.push(record.settled);
   }
   let changed=0,diffSum=0,maxDelta=0,alphaChanges=0;
   const bins={rgbSmall1to2:0,rgb3to8:0,rgb9plus:0};
   for(let i=0;i<directPixels.length;i+=4){
    let maxPixel=0;
    for(let channel=0;channel<3;channel++){
     const d=Math.abs(directPixels[i+channel]-presentedPixels[i+channel]);
     diffSum+=d;maxPixel=Math.max(maxPixel,d);maxDelta=Math.max(maxDelta,d);
    }
    if(directPixels[i+3]!==presentedPixels[i+3])alphaChanges++;
    if(maxPixel){
     changed++;
     if(maxPixel<=2)bins.rgbSmall1to2++;
     else if(maxPixel<=8)bins.rgb3to8++;
     else bins.rgb9plus++;
    }
   }
   out.push({label:entry.label,seed:entry.seed,width,height,material:entry.recipe.material,
    structure:entry.recipe.structure,
    exactPixelEqual:changed===0&&alphaChanges===0,
    directSha256:await sha(directPixels),
    settledPresentedSha256:await sha(presentedPixels),
    changedPixels:changed,pixelCount:width*height,
    changedPercent:Number((changed/(width*height)*100).toFixed(5)),
    channelMeanAbsoluteError:Number((diffSum/(width*height*3)).toFixed(6)),
    maxRgbDelta:maxDelta,alphaChanges,differenceBuckets:bins,
    actualInteractiveWorkerMs:nativeFull,actualSettledWorkerMs:cachedFrames});
  }
  worker.terminate();
  return out;
 },seeds);
 assert.deepEqual(errors,[]);
 assert.equal(records.length,3);
 for(const entry of records)assert.ok(entry.actualInteractiveWorkerMs.length===3 &&
   entry.actualSettledWorkerMs.length===3 &&
   Number.isFinite(entry.changedPercent));
 await mkdir(join(root,'artifacts','fullsize-early-vs-settled'),{recursive:true});
 await writeFile(join(root,'artifacts','fullsize-early-vs-settled','receipt.json'),
   JSON.stringify({environment:'Real production Chromium Worker full-res interactive bitmap vs cached presentation via presentNudgedArtwork() on same 600x1300 recipe; native Android not tested',records},null,2)+'\n');
 console.log('ROYGBIV_FULLSIZE_EARLY_VS_SETTLED_OPTICAL',JSON.stringify(records));
}finally{
 await browser?.close();await new Promise(done=>server.close(done));
}
