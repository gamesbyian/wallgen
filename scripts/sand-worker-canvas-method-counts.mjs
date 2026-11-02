#!/usr/bin/env node
/**
 * Diagnostic only: count actual Canvas2D method calls in the production
 * OffscreenCanvas Worker for canonical Random sources. The untouched Worker
 * renders the same recipe before and after in-memory method forwarding;
 * compare both transferred bitmap SHA-256s. Counted timings are intentionally
 * NOT used as performance claims because wrapper overhead is nonzero.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {chromium} from 'playwright';
import {randomizeAllRecipe} from '../src/model.js';

const root=process.cwd(),mime={'.html':'text/html','.js':'text/javascript',
  '.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
  try{
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(path==='/'){res.writeHead(200,{'content-type':'text/html'}).end('<!doctype html><title>Worker Canvas2D methods</title>');return;}
    const file=resolve(root,'.'+path);
    if(!file.startsWith(root+'/')){res.writeHead(403).end();return;}
    const body=await readFile(file);
    res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream',
      'cache-control':'no-store'}).end(body);
  }catch(error){res.writeHead(404).end(String(error));}
});
const pairFor=i=>[Math.imul(i,0x9e3779b1)>>>0,
  (Math.imul(i+17,0x85ebca6b)^0xa5a5f0f0)>>>0];
const seedFor=i=>pairFor(i).map(n=>n.toString(36)).join('-');
const scenes=[
 {label:'sand-600x1300',seed:seedFor(126),w:600,h:1300},
 {label:'sand-372x806',seed:seedFor(126),w:372,h:806},
 {label:'loops-600x1300',seed:seedFor(94),w:600,h:1300},
 {label:'regions-600x1300',seed:seedFor(240),w:600,h:1300},
].map(c=>({...c,recipe:randomizeAllRecipe({seed:c.seed})}));
assert.equal(scenes[0].recipe.material,'sand-mandala');
assert.equal(scenes[0].recipe.rayCount,42);
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let browser;
try{
  browser=await chromium.launch({headless:true,
    ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),
    args:['--no-sandbox']});
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',err=>errors.push(String(err)));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  const workerEvent=page.waitForEvent('worker');
  await page.evaluate(async()=>{
    const worker=new Worker('/src/render-worker.js',{type:'module'});
    const messages=new Map();
    let next=0,readyResolve,readyReject;
    const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});
    worker.addEventListener('message',({data})=>{
      if(data?.type==='ready'){readyResolve();return;}
      if(data?.type==='unsupported'){readyReject(Error(data.error));return;}
      if(messages.has(data?.id))messages.get(data.id)(data);
    });
    worker.addEventListener('error',err=>readyReject(Error(err.message)));
    window.__renderSettled=(recipe,width,height)=>new Promise((resolve,reject)=>{
      const id=++next;
      const timeout=setTimeout(()=>{messages.delete(id);reject(Error('Worker timed out'));},90000);
      messages.set(id,data=>{
        clearTimeout(timeout);messages.delete(id);
        if(data.type==='error')reject(Error(data.error));
        else if(data.type==='frame'&&data.quality==='settled')resolve(data);
        else reject(Error('Unexpected Worker response'));
      });
      worker.postMessage({type:'preview',id,key:recipe.seed,recipe,width,height,quality:'settled'});
    });
    window.__disposeWorker=()=>worker.terminate();
    await ready;
  });
  const actualWorker=await workerEvent;
  async function render(recipe,width,height){
    return page.evaluate(async ({recipe,width,height})=>{
      const frame=await window.__renderSettled(recipe,width,height);
      async function hashBitmap(bitmap){
        const canvas=new OffscreenCanvas(bitmap.width,bitmap.height);
        try{
          const ctx=canvas.getContext('2d',{willReadFrequently:true});
          ctx.drawImage(bitmap,0,0);
          const digest=await crypto.subtle.digest('SHA-256',
            ctx.getImageData(0,0,canvas.width,canvas.height).data);
          return {width:canvas.width,height:canvas.height,
            sha256:Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')};
        }finally{bitmap.close();canvas.width=0;canvas.height=0;}
      }
      return {ms:frame.ms,ink:await hashBitmap(frame.ink),
        background:await hashBitmap(frame.background),overhang:frame.overhang};
    },{recipe,width,height});
  }
  const methods=['fillRect','drawImage','clearRect','fill','stroke','arc',
    'beginPath','rect','clip','moveTo','lineTo','quadraticCurveTo',
    'bezierCurveTo','save','restore','setTransform','translate','scale',
    'rotate','createLinearGradient','createRadialGradient'];
  const results=[];
  for(let i=0;i<scenes.length;i++){
    const entry=scenes[i];
    const original=await render(entry.recipe,entry.w,entry.h);
    if(i===0){
      // Patch the *same Worker realm* after the first native paint. The
      // browser source files and painter algorithms stay byte-for-byte.
      await actualWorker.evaluate(names=>{
        const proto=OffscreenCanvasRenderingContext2D.prototype;
        globalThis.__roygbivCanvasCalls=Object.fromEntries(names.map(name=>[name,0]));
        globalThis.__roygbivResetCalls=()=>{
          for(const name of names)globalThis.__roygbivCanvasCalls[name]=0;
        };
        for(const name of names){
          const native=proto[name];
          if(typeof native!=='function')throw Error('Unsupported Canvas2D method '+name);
          Object.defineProperty(proto,name,{configurable:true,writable:true,value:function(...args){
            globalThis.__roygbivCanvasCalls[name]++;
            return native.apply(this,args);
          }});
        }
      },methods);
    }
    // Reset counters for each source before its counted paint, including the
    // repeated baseline for the second through fourth source.
    await actualWorker.evaluate(()=>globalThis.__roygbivResetCalls());
    const instrumented=await render(entry.recipe,entry.w,entry.h);
    const counts=await actualWorker.evaluate(()=>({...globalThis.__roygbivCanvasCalls}));
    assert.deepEqual(instrumented.ink,original.ink,'Worker ink pixels changed: '+entry.label);
    assert.deepEqual(instrumented.background,original.background,
      'Worker background pixels changed: '+entry.label);
    assert.deepEqual(instrumented.overhang,original.overhang);
    assert.ok(counts.fillRect>0,'No actual Canvas2D fillRect operations');
    results.push({label:entry.label,seed:entry.seed,material:entry.recipe.material,
      rayCount:entry.recipe.rayCount,width:entry.w,height:entry.h,
      baselineWorkerMs:original.ms,instrumentedWorkerMs:instrumented.ms,
      counts,inkSha256:original.ink.sha256,
      backgroundSha256:original.background.sha256});
  }
  await page.evaluate(()=>window.__disposeWorker());
  assert.deepEqual(errors,[]);
  await mkdir(join(root,'artifacts','sand-canvas2d-method-counts'),{recursive:true});
  await writeFile(join(root,'artifacts','sand-canvas2d-method-counts','receipt.json'),
    JSON.stringify({environment:'Actual Chrome production Worker; in-memory API-method counting only, method timings not representative',results},null,2)+'\n');
  console.log('ROYGBIV_SAND_CANVAS_METHOD_COUNTS',JSON.stringify(results));
}finally{
  await browser?.close();
  await new Promise(done=>server.close(done));
}
