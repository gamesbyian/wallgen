#!/usr/bin/env node
/**
 * Diagnostic only: measure pre-material vector ink alpha occupancy and readback overhead in a source-instrumented real OffscreenCanvas Worker for canonical Random sources. The untouched Worker
 * renders the same recipe before and after in-memory method forwarding;
 * the pinned heavy scene also measures same-size interactive (no overscan)
 * against settled (+30%-per-side immutable nudge overscan) call counts.
 * compare both transferred bitmap SHA-256s. Counted timings are intentionally
 * NOT used as performance claims because wrapper overhead is nonzero.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {chromium} from 'playwright';
import {randomizeAllRecipe,normalizeRecipe} from '../src/model.js';

const root=process.cwd(),mime={'.html':'text/html','.js':'text/javascript',
  '.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'};
const rendererBytes=await readFile(join(root,'src/renderer.js'),'utf8');
const workerBytes=await readFile(join(root,'src/render-worker.js'),'utf8');
const materialAnchor='  const layers=scene.textureLayers;\n  const active=layers.length>0;';
assert.equal(rendererBytes.split(materialAnchor).length,2,'Material stage moved');
const candidateRenderer=rendererBytes.replace(materialAnchor,materialAnchor+"\n  // Diagnostic-only pre-material alpha occupancy of the original vector ink.\n  // Does not draw or modify textures, transforms, caches, or recipes.\n  if(options.cache&&scene.structure==='radial'&&layers.some(layer=>\n      layer.coverage==='stripes'&&\n      ['sand-mandala','sand-beaded','sand-filigree'].includes(layer.material))){\n    const layer=layers.find(layer=>layer.coverage==='stripes'&&\n      ['sand-mandala','sand-beaded','sand-filigree'].includes(layer.material));\n    const start=performance.now();\n    const pixels=g.getImageData(0,0,inkWidth,inkHeight).data;\n    const readMs=performance.now()-start;\n    const r=layer.rotation*Math.PI/180,cos=Math.cos(r),sin=Math.sin(r);\n    const bounds=scene.renderBounds;\n    let l=Infinity,t=Infinity,right=-Infinity,bottom=-Infinity;\n    for(const [x,y] of [[bounds.left,bounds.top],[bounds.right,bounds.top],\n        [bounds.left,bounds.bottom],[bounds.right,bounds.bottom]]){\n      const dx=x-DESIGN_WIDTH/2,dy=y-DESIGN_HEIGHT/2;\n      const sx=dx*cos+dy*sin,sy=-dx*sin+dy*cos;\n      l=Math.min(l,sx);right=Math.max(right,sx);\n      t=Math.min(t,sy);bottom=Math.max(bottom,sy);\n    }\n    const grids=[16,32,64].map(size=>{\n      const ix0=Math.floor(l/size),iy0=Math.floor(t/size);\n      const w=Math.ceil(right/size)-ix0+1,h=Math.ceil(bottom/size)-iy0+1;\n      if(w*h>1000000)throw new Error('Diagnostic occupancy grid exceeded limit');\n      return {size,ix0,iy0,w,h,cells:new Uint8Array(w*h)};\n    });\n    const scanStart=performance.now();\n    let inkPixels=0;\n    for(let py=0;py<inkHeight;py++){\n      const row=py*inkWidth*4;\n      const dy=(py+.5-margin.top-offsetY)/scaleY-DESIGN_HEIGHT/2;\n      for(let px=0;px<inkWidth;px++){\n        if(!pixels[row+px*4+3])continue;\n        inkPixels++;\n        const dx=(px+.5-margin.left-offsetX)/scaleX-DESIGN_WIDTH/2;\n        const sx=dx*cos+dy*sin,sy=-dx*sin+dy*cos;\n        for(const grid of grids){\n          const gx=Math.floor(sx/grid.size)-grid.ix0;\n          const gy=Math.floor(sy/grid.size)-grid.iy0;\n          if(gx>=0&&gy>=0&&gx<grid.w&&gy<grid.h)\n            grid.cells[gy*grid.w+gx]=1;\n        }\n      }\n    }\n    const scanMs=performance.now()-scanStart,dilationStart=performance.now();\n    const sizes=grids.map(grid=>{\n      const before=grid.cells.reduce((acc,cell)=>acc+cell,0);\n      const cover=new Uint8Array(grid.cells.length);\n      // Overconservative 40-world-unit support plus one grid square.\n      // Occupancy fraction is exploratory, NOT a safe render culling mask.\n      const reach=Math.ceil(40/grid.size)+1;\n      for(let yy=0;yy<grid.h;yy++)for(let xx=0;xx<grid.w;xx++){\n        if(!grid.cells[yy*grid.w+xx])continue;\n        for(let y=Math.max(0,yy-reach);y<=Math.min(grid.h-1,yy+reach);y++)\n          for(let x=Math.max(0,xx-reach);x<=Math.min(grid.w-1,xx+reach);x++)\n            cover[y*grid.w+x]=1;\n      }\n      const after=cover.reduce((acc,cell)=>acc+cell,0);\n      return {worldTile:grid.size,grid:[grid.w,grid.h],\n        rawOccupancy:before/grid.cells.length,\n        conservativeOccupancy:after/grid.cells.length,\n        optimisticSkipFraction:1-after/grid.cells.length};\n    });\n    self.__sandOccupancy={readMs,scanMs,dilationMs:performance.now()-dilationStart,\n      totalMs:performance.now()-start,inkPixels,totalInkPixels:inkWidth*inkHeight,sizes};\n  }\n");
const candidateWorker=workerBytes
  .replace('  const start=performance.now();','  const start=performance.now();self.__sandOccupancy=null;')
  .replace('overhang:cache.overhang,ms:performance.now()-start},',
    'overhang:cache.overhang,occupancy:self.__sandOccupancy,ms:performance.now()-start},');
assert.notEqual(candidateRenderer,rendererBytes);
assert.notEqual(candidateWorker,workerBytes);

const server=createServer(async(req,res)=>{
  try{
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(path==='/'){res.writeHead(200,{'content-type':'text/html'}).end('<!doctype html><title>Worker Canvas2D methods</title>');return;}
    const file=resolve(root,'.'+path);
    if(!file.startsWith(root+'/')){res.writeHead(403).end();return;}
    const body=path==='/src/renderer.js'?candidateRenderer:
      path==='/src/render-worker.js'?candidateWorker:await readFile(file);
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
].map(c=>({...c,recipe:normalizeRecipe({...randomizeAllRecipe({seed:c.seed}),
  textureCoverage:'stripes'})}));
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
    window.__renderPreview=(recipe,width,height,quality='settled')=>new Promise((resolve,reject)=>{
      const id=++next;
      const timeout=setTimeout(()=>{messages.delete(id);reject(Error('Worker timed out'));},90000);
      messages.set(id,data=>{
        clearTimeout(timeout);messages.delete(id);
        if(data.type==='error')reject(Error(data.error));
        else if(data.type==='frame'&&data.quality===quality)resolve(data);
        else reject(Error('Unexpected Worker response'));
      });
      worker.postMessage({type:'preview',id,key:recipe.seed,recipe,width,height,quality});
    });
    window.__disposeWorker=()=>worker.terminate();
    await ready;
  });
  const actualWorker=await workerEvent;
  async function render(recipe,width,height,quality='settled'){
    return page.evaluate(async ({recipe,width,height,quality})=>{
      const frame=await window.__renderPreview(recipe,width,height,quality);
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
      if(quality==='interactive')return {ms:frame.ms,frame:await hashBitmap(frame.frame)};
      return {ms:frame.ms,occupancy:frame.occupancy,ink:await hashBitmap(frame.ink),
        background:await hashBitmap(frame.background),overhang:frame.overhang};
    },{recipe,width,height,quality});
  }

  const results=[];
  for(const entry of [scenes[0],scenes[1]]){
    const trials=[];
    for(let k=0;k<2;k++){
      const result=await render(entry.recipe,entry.w,entry.h);
      assert(result.occupancy?.sizes?.length===3,
        'Real pre-material ink occupancy missing from patched Worker: '+
        JSON.stringify(result.occupancy));
      trials.push({workerMs:result.ms,occupancy:result.occupancy,
        inkSha256:result.ink.sha256,backgroundSha256:result.background.sha256,
        overhang:result.overhang});
    }
    assert.equal(trials[0].inkSha256,trials[1].inkSha256,
      'Actual Worker settled ink output not deterministic');
    assert.equal(trials[0].backgroundSha256,trials[1].backgroundSha256,
      'Actual Worker background output not deterministic');
    results.push({label:entry.label,seed:entry.seed,
      resolution:[entry.w,entry.h],trials});
  }
  await page.evaluate(()=>window.__disposeWorker());
  assert.deepEqual(errors,[]);
  await mkdir(join(root,'artifacts','radial-alpha-occupancy'),{recursive:true});
  await writeFile(join(root,'artifacts','radial-alpha-occupancy','receipt.json'),
    JSON.stringify({environment:'Real Chromium OffscreenCanvas Worker, source-instrumented original material stage; not physical Pixel and NOT production culling',results},null,2)+'\n');
  console.log('ROYGBIV_RADIAL_ALPHA_OCCUPANCY',JSON.stringify(results.map(x=>({
    label:x.label,resolution:x.resolution,workerMs:x.trials.map(t=>Math.round(t.workerMs)),
    occupancy:x.trials[0].occupancy}))));
}finally{
  await browser?.close();
  await new Promise(done=>server.close(done));
}
