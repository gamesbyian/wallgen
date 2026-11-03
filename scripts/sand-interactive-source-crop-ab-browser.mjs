#!/usr/bin/env node
/**
 * True pre-change vs production candidate Worker pixel/perf comparison for
 * low-resolution interactive-only floating sand ink-source crop.
 *
 * Baseline app source: comparator-baseline/src/renderer.js and render-worker.js
 * Candidate app source: current src. All other modules identical to current PR.
 * Invoke only via one-shot browser workflow; no synthetic painted bitmaps.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import {randomizeAllRecipe,normalizeRecipe} from '../src/model.js';

const root=process.cwd(),baseRoot=join(root,'comparator-baseline');
const [oldRenderer,oldWorker,newRenderer,newWorker]=await Promise.all([
  readFile(join(baseRoot,'src/renderer.js'),'utf8'),
  readFile(join(baseRoot,'src/render-worker.js'),'utf8'),
  readFile(join(root,'src/renderer.js'),'utf8'),
  readFile(join(root,'src/render-worker.js'),'utf8'),
]);
assert.notEqual(oldRenderer,newRenderer,'Renderer source A/B must actually differ');
assert.notEqual(oldWorker,newWorker,'Worker source A/B must actually differ');
assert(newRenderer.includes('options.previewInkCrop')&&
       newWorker.includes('previewInkCrop:true'),'Actual candidate must enable transient crop');
assert(!oldWorker.includes('previewInkCrop:true'),
  'Baseline Worker must predate interactive crop');
const mime={'.js':'text/javascript','.html':'text/html','.json':'application/json',
  '.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
  try{
    const route=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(route==='/'){res.writeHead(200,{'content-type':'text/html'}).end('<!doctype html><title>Worker true interactive source comparison</title>');return;}
    const match=/^\/(base|candidate)\/(.+)$/.exec(route);
    if(!match){res.writeHead(404).end();return;}
    const rel=match[2],file=resolve(root,'./'+rel);
    if(!file.startsWith(root+'/')){res.writeHead(403).end();return;}
    const bytes=rel==='src/renderer.js'?
      (match[1]==='base'?oldRenderer:newRenderer):
      rel==='src/render-worker.js'?
      (match[1]==='base'?oldWorker:newWorker):await readFile(file);
    res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream',
      'cache-control':'no-store'}).end(bytes);
  }catch(error){console.error('WORKER_SOURCE_HTTP_ERROR',req.url,error.message);
    if(!res.headersSent)res.writeHead(404).end(String(error));}
});
const pairFor=i=>[Math.imul(i,0x9e3779b1)>>>0,
  (Math.imul(i+17,0x85ebca6b)^0xa5a5f0f0)>>>0];
const seedFor=i=>pairFor(i).map(n=>n.toString(36)).join('-');
const cases=[
  {label:'floating-beaded-interactive-320',index:1417,width:320,height:700},
  {label:'floating-beaded-interactive-412',index:1417,width:412,height:892},
  {label:'floating-beaded-rotated-nudged',index:1417,width:412,height:892,
    overrides:{textureRotation:37,positionX:30,positionY:-30}},
  {label:'floating-beaded-dual-sand',index:1417,width:412,height:892,
    overrides:{textureLayer2Enabled:true,material2:'sand-filigree',
      textureCoverage2:'stripes',textureStrength2:45,textureRotation2:37}},
  {label:'floating-both-coverage-control',index:1417,width:412,height:892,
    overrides:{textureCoverage:'both'}},
  {label:'42-ray-background-control',index:126,width:412,height:892},
  {label:'42-ray-stripe-control',index:126,width:372,height:806,
    overrides:{textureCoverage:'stripes'}},
].map(({index,overrides,...entry})=>({
  ...entry,index,recipe:normalizeRecipe({
    ...randomizeAllRecipe({seed:seedFor(index)}),...overrides}),
}));
assert(cases[0].recipe.structure==='paths'&&
  cases[0].recipe.composition==='floating'&&
  cases[0].recipe.material==='sand-beaded'&&
  cases[0].recipe.textureCoverage==='stripes');
assert(cases[5].recipe.structure==='radial'&&cases[5].recipe.rayCount===42);
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let browser;
try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox'],
    ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{})});
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(async cases=>{
    const workers=await Promise.all(['base','candidate'].map(async version=>{
      const worker=new Worker('/'+version+'/src/render-worker.js',{type:'module'});
      let next=0,resolveReady,rejectReady;const pending=new Map();
      const ready=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
      const bootTimeout=setTimeout(()=>rejectReady(Error('Worker not ready '+version)),30000);
      worker.addEventListener('message',({data})=>{
        if(data?.type==='ready'){clearTimeout(bootTimeout);resolveReady();return;}
        if(data?.type==='unsupported'){clearTimeout(bootTimeout);rejectReady(Error(data.error));return;}
        if(pending.has(data?.id))pending.get(data.id)(data);
      });
      worker.addEventListener('error',e=>rejectReady(Error(version+': '+e.message)));
      await ready;
      return {version,worker,request(payload){
        return new Promise((resolve,reject)=>{
          const id=++next;
          const timeout=setTimeout(()=>{pending.delete(id);reject(Error('Worker timed out '+version));},120000);
          pending.set(id,data=>{clearTimeout(timeout);pending.delete(id);
            if(data.type==='error')reject(Error(data.error));else resolve(data);
          });
          worker.postMessage({...payload,id});
        });
      }};
    }));
    async function hashBytes(bytes){
      const digest=await crypto.subtle.digest('SHA-256',bytes);
      return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
    }
    async function bitmapDigest(bitmap){
      const scratch=new OffscreenCanvas(bitmap.width,bitmap.height);
      try{
        const ctx=scratch.getContext('2d',{willReadFrequently:true});
        ctx.drawImage(bitmap,0,0);
        return {size:[bitmap.width,bitmap.height],
          sha256:await hashBytes(ctx.getImageData(0,0,bitmap.width,bitmap.height).data)};
      }finally{bitmap.close();scratch.width=0;scratch.height=0;}
    }
    const rows=[];
    for(const item of cases){
      const samples=[];
      for(let i=0;i<3;i++){
        const paired={};
        for(const w of (i%2?workers.slice().reverse():workers)){
          const frame=await w.request({type:'preview',quality:'interactive',
            recipe:item.recipe,key:item.recipe.seed,width:item.width,height:item.height});
          if(frame.type!=='frame'||frame.quality!=='interactive'||!frame.frame)
            throw Error('Missing genuine interactive frame: '+item.label);
          paired[w.version]={workerMs:frame.ms,image:await bitmapDigest(frame.frame)};
        }
        if(JSON.stringify(paired.base.image)!==JSON.stringify(paired.candidate.image))
          throw Error('Interactive RGBA differs: '+item.label+' pair '+i+
            ' baseline '+JSON.stringify(paired.base.image)+' candidate '+JSON.stringify(paired.candidate.image));
        samples.push(paired);
      }
      rows.push({label:item.label,seed:item.recipe.seed,width:item.width,height:item.height,
        coverage:item.recipe.textureCoverage,structure:item.recipe.structure,
        baseMs:samples.map(s=>s.base.workerMs),
        candidateMs:samples.map(s=>s.candidate.workerMs),
        imageSha256:samples[0].base.image.sha256,
        imageSize:samples[0].base.image.size});
    }
    // Settled already accepted by #1029, but a new Worker-only change must
    // preserve complete immutable cached layers and source nudge overscan.
    const settled={};
    for(const item of [cases[1],cases[5]]){
      const pair={};
      for(const w of workers){
        const frame=await w.request({type:'preview',quality:'settled',
          recipe:item.recipe,key:item.recipe.seed,width:item.width,height:item.height});
        if(frame.type!=='frame'||frame.quality!=='settled')throw Error('Missing settled layer');
        pair[w.version]={ink:await bitmapDigest(frame.ink),
          background:await bitmapDigest(frame.background),overhang:frame.overhang};
      }
      if(JSON.stringify(pair.base)!==JSON.stringify(pair.candidate))
        throw Error('Settled source cache or nudge overhang differs: '+item.label);
      settled[item.label]=pair.base;
    }
    // The preview-only fast path must never leak into native export.
    const native={};
    for(const w of workers){
      const frame=await w.request({type:'export',
        recipe:cases[0].recipe,width:3024,height:6552});
      if(frame.type!=='exported'||frame.blob?.type!=='image/png')
        throw Error('Native export invalid '+w.version);
      const bytes=await frame.blob.arrayBuffer();
      native[w.version]={sha256:await hashBytes(bytes),bytes:bytes.byteLength};
    }
    if(JSON.stringify(native.base)!==JSON.stringify(native.candidate))
      throw Error('Actual native PNG changed after interactive-only optimization');
    for(const w of workers)w.worker.terminate();
    return {rows,settled,native:native.base};
  },cases);
  assert.deepEqual(errors,[]);
  const median=xs=>xs.slice().sort((a,b)=>a-b)[Math.floor(xs.length/2)];
  const summary=result.rows.map(row=>({
    label:row.label,seed:row.seed,dimensions:[row.width,row.height],
    baseMedianMs:Math.round(median(row.baseMs)),
    candidateMedianMs:Math.round(median(row.candidateMs)),
    pairedWins:row.baseMs.filter((v,i)=>row.candidateMs[i]<v).length,
    percent:Math.round(1000*(1-median(row.candidateMs)/median(row.baseMs)))/10,
    exactImageSha256:row.imageSha256,
  }));
  await mkdir(join(root,'artifacts','interactive-sand-source-crop'),{recursive:true});
  await writeFile(join(root,'artifacts','interactive-sand-source-crop','receipt.json'),
    JSON.stringify({environment:'Real paired Chromium OffscreenCanvas Worker, exact old/new Renderer and Worker; not physical Pixel',
      summary,...result},null,2)+'\n');
  console.log('ROYGBIV_INTERACTIVE_SAND_SOURCE_AB_PASS',
    JSON.stringify({summary,native:result.native,settledCases:Object.keys(result.settled)}));
}finally{
  await browser?.close();
  await new Promise(done=>server.close(done));
}
