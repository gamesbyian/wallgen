/**
 * One-off full-cache A/B hypothesis: derive conservative movable stripe
 * material bounds from actual painted ink alpha, while preserving full
 * material canvas origin/size and the source-backed real Worker.
 * No production module is edited or imported by this script.
 */
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

const root=process.cwd();
const originalRenderer=await readFile(join(root,'src/renderer.js'),'utf8');
const paintAnchor='      paintMaterial(t,layer,paintBounds,sandMaterialLighting(scene,layer));';
assert.equal(originalRenderer.split(paintAnchor).length,2,'Original single paint anchor changed');
const injected="      if(options.cache&&layer.coverage==='stripes'&&\n        ['sand-mandala','sand-beaded','sand-filigree'].includes(layer.material)){\n        // Conservative pixel-alpha footprint of already-rendered *source ink*.\n        // Keep full material surface geometry/scale/origin unchanged: this is\n        // only a candidate reduction in world-space facet enumeration.\n        const pixels=g.getImageData(0,0,inkWidth,inkHeight).data;\n        let ax0=inkWidth,ay0=inkHeight,ax1=-1,ay1=-1;\n        for(let row=0;row<inkHeight;row++){\n          const rowBase=row*inkWidth*4;\n          for(let col=0;col<inkWidth;col++){\n            if(pixels[rowBase+col*4+3]===0)continue;\n            if(col<ax0)ax0=col;\n            if(col>ax1)ax1=col;\n            if(row<ay0)ay0=row;\n            if(row>ay1)ay1=row;\n          }\n        }\n        if(ax1>=ax0&&ay1>=ay0){\n          // Alpha-mask footprint corners -> original design world -> rotated\n          // material source. Overshoot by 24 authored units for facets,\n          // raster resampling and boundary antialias. No LOD or thin pixels.\n          const xlo=(ax0-margin.left-offsetX)/scaleX;\n          const xhi=(ax1+1-margin.left-offsetX)/scaleX;\n          const ylo=(ay0-margin.top-offsetY)/scaleY;\n          const yhi=(ay1+1-margin.top-offsetY)/scaleY;\n          let l=Infinity,r=-Infinity,u=Infinity,d=-Infinity;\n          for(const [vx,vy] of [[xlo,ylo],[xlo,yhi],[xhi,ylo],[xhi,yhi]]){\n            const dx=vx-DESIGN_WIDTH/2,dy=vy-DESIGN_HEIGHT/2;\n            const tx=dx*c+dy*sin,ty=-dx*sin+dy*c;\n            l=Math.min(l,tx);r=Math.max(r,tx);\n            u=Math.min(u,ty);d=Math.max(d,ty);\n          }\n          const halo=24;\n          paintBounds={left:Math.max(left,l-halo),right:Math.min(right,r+halo),\n            top:Math.max(top,u-halo),bottom:Math.min(bottom,d+halo)};\n          if(paintBounds.right<paintBounds.left||paintBounds.bottom<paintBounds.top)\n            paintBounds={left,right,top,bottom}; // diagnostic fail-safe\n        }\n      }\n";
const candidateRenderer=originalRenderer.replace(paintAnchor,injected+paintAnchor);

const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/'){res.writeHead(200,{'content-type':'text/html'}).end('<!doctype html><title>Settled Worker source acceptance</title>');return;}
  const match=/^\/(base|candidate)\/(.+)$/.exec(pathname);
  if(!match){res.writeHead(404).end();return;}
  const file=resolve(root,'./'+match[2]);
  if(!file.startsWith(root+'/')){res.writeHead(403).end();return;}
  const bytes=match[1]==='candidate'&&match[2]==='src/renderer.js'?
    candidateRenderer:await readFile(file);
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream',
    'cache-control':'no-store'}).end(bytes);
 }catch(error){res.writeHead(404).end(String(error));}
});
const pairFor=i=>[Math.imul(i,0x9e3779b1)>>>0,
  (Math.imul(i+17,0x85ebca6b)^0xa5a5f0f0)>>>0];
const seedFor=pair=>pair.map(n=>n.toString(36)).join('-');
const cases=[
  {label:'sand-stripes-42-ray-600x1300',index:126,width:600,height:1300,
    overrides:{textureCoverage:'stripes'}},
  {label:'sand-stripes-42-ray-372x806',index:126,width:372,height:806,
    overrides:{textureCoverage:'stripes'}},
  {label:'sand-stripes-nudged-rotated',index:126,width:372,height:806,
    overrides:{textureCoverage:'stripes',positionX:30,positionY:-30,
      textureRotation:37}},
  {label:'sand-single-floating-short-loop',index:94,width:600,height:1300,
    overrides:{structure:'paths',geometry:'loop',composition:'floating',
      material:'sand-mandala',textureCoverage:'stripes',
      stripeWidth:15,spread:8,pathLength:25}},
  {label:'sand-two-layer-stripes',index:126,width:372,height:806,
    overrides:{textureCoverage:'stripes',textureLayer2Enabled:true,
      material2:'sand-beaded',textureCoverage2:'stripes',
      textureStrength2:45}},
  {label:'sand-background-control',index:126,width:372,height:806,
    overrides:{textureCoverage:'background'}},
  {label:'loops-control',index:94,width:372,height:806},
  {label:'regions-control',index:240,width:372,height:806},
].map(({overrides,...entry})=>{
  const recipe=normalizeRecipe({...randomizeAllRecipe({
    seed:seedFor(pairFor(entry.index))}),...overrides});
  return {...entry,recipe};
});
assert.equal(cases[0].recipe.material,'sand-mandala');
assert.equal(cases[0].recipe.rayCount,42);
assert.equal(cases[0].recipe.textureCoverage,'stripes');
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
   for(let index=0;index<3;index++){
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
 await mkdir(join(root,'artifacts','sand-stripes-ink-alpha-crop-ab'),{recursive:true});
 await writeFile(join(root,'artifacts','sand-stripes-ink-alpha-crop-ab','receipt.json'),
   JSON.stringify({environment:'Actual source-matched in-memory HTTP candidate versus original production Chromium Worker; source camera crop from true ink alpha; not physical Pixel',rows,native:measurements.native},null,2)+'\n');
 console.log('ROYGBIV_SAND_STRIPES_INK_ALPHA_BOUNDS_AB_PASS',JSON.stringify({rows,native:measurements.native}));
}finally{
 await browser?.close();
 await new Promise(done=>server.close(done));
}
