#!/usr/bin/env node
// One-off exact-visible test: original production Worker against a variant
// whose HTTP-served renderer ONLY narrows sand enumerated source coordinates.
// Keep full original overscan dimensions, transform, rasterScale and compositor.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {chromium} from 'playwright';
import {randomizeAllRecipe,normalizeRecipe} from '../src/model.js';

const root=process.cwd(),types={'.html':'text/html','.js':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'};
const original=await readFile(join(root,'src/renderer.js'),'utf8');
const anchor='      paintMaterial(t,layer,{left,right,top,bottom},sandMaterialLighting(scene,layer));';
assert.equal(original.split(anchor).length,2,'Expected unique material stage anchor');
const patch=[
 '      let materialCrop={left,right,top,bottom};',
 "      if(options.cache&&['sand-mandala','sand-beaded','sand-filigree'].includes(layer.material)){",
 '        const sx=canvas.width*(scene.positionX||0)/100;',
 '        const sy=canvas.height*(scene.positionY||0)/100;',
 '        const visible=camera.boundsWithMargin({',
 '          left:Math.max(0,sx),right:Math.max(0,-sx),',
 '          top:Math.max(0,sy),bottom:Math.max(0,-sy)});',
 '        let l=Infinity,r=-Infinity,t=Infinity,b=-Infinity;',
 '        for(const [vx,vy] of [[visible.left,visible.top],[visible.left,visible.bottom],',
 '          [visible.right,visible.top],[visible.right,visible.bottom]]){',
 '          const dx=vx-DESIGN_WIDTH/2,dy=vy-DESIGN_HEIGHT/2;',
 '          const tx=dx*c+dy*sin,ty=-dx*sin+dy*c;',
 '          l=Math.min(l,tx);r=Math.max(r,tx);t=Math.min(t,ty);b=Math.max(b,ty);',
 '        }',
 '        const pad=24;',
 '        materialCrop={left:Math.max(left,l-pad),right:Math.min(right,r+pad),',
 '          top:Math.max(top,t-pad),bottom:Math.min(bottom,b+pad)};',
 '      }',
 '      paintMaterial(t,layer,materialCrop,sandMaterialLighting(scene,layer));'
].join('\n');
const candidate=original.replace(anchor,patch);
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/'){res.writeHead(200,{'content-type':'text/html'})
    .end('<!doctype html><title>Sand crop diagnostic</title>');return;}
  const match=/^\/(base|crop)\/(.+)$/.exec(pathname);
  if(!match){res.writeHead(404).end();return;}
  const file=resolve(root,'./'+match[2]);
  if(!file.startsWith(root+'/')){res.writeHead(403).end();return;}
  const bytes=match[1]==='crop'&&match[2]==='src/renderer.js'?
    candidate:await readFile(file);
  res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream',
    'cache-control':'no-store'}).end(bytes);
 }catch(error){if(!res.headersSent)res.writeHead(404).end(String(error));}
});
const pairFor=i=>[Math.imul(i,0x9e3779b1)>>>0,
 (Math.imul(i+17,0x85ebca6b)^0xa5a5f0f0)>>>0];
const seedFor=i=>pairFor(i).map(n=>n.toString(36)).join('-');
const scenes=[
 {label:'sand-600x1300',index:126,w:600,h:1300},
 {label:'sand-372x806',index:126,w:372,h:806},
 {label:'sand-nudge-plus30-minus30',index:126,w:600,h:1300,
  overrides:{positionX:30,positionY:-30}},
 {label:'sand-nudge-minus30-plus30',index:126,w:372,h:806,
  overrides:{positionX:-30,positionY:30}},
 {label:'sand-zoom-pan',index:126,w:600,h:1300,
  overrides:{viewZoom:1.35,viewPanX:8,viewPanY:-6}},
 {label:'sand-beaded',index:126,w:600,h:1300,
  overrides:{material:'sand-beaded'}},
 {label:'sand-multilayer-rotated',index:126,w:372,h:806,
  overrides:{textureLayer2Enabled:true,material2:'sand-filigree',
    textureStrength2:45,textureCoverage2:'both',textureRotation2:37}},
 {label:'loops-600x1300',index:94,w:600,h:1300},
 {label:'regions-600x1300',index:240,w:600,h:1300},
].map(x=>({...x,recipe:normalizeRecipe({
  ...randomizeAllRecipe({seed:seedFor(x.index)}),...x.overrides
})}));
assert.equal(scenes[0].recipe.material,'sand-mandala');
assert.equal(scenes[0].recipe.rayCount,42);
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let browser;
try{
 browser=await chromium.launch({headless:true,
  ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),
  args:['--no-sandbox']});
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
 const results=await page.evaluate(async scenes=>{
  const {presentNudgedArtwork}=await import('/base/src/renderer.js');
  const workers=await Promise.all(['base','crop'].map(async version=>{
   const w=new Worker('/'+version+'/src/render-worker.js',{type:'module'});
   let next=0,yes,no;const pending=new Map();
   const ready=new Promise((resolve,reject)=>{yes=resolve;no=reject;});
   const timeout=setTimeout(()=>no(Error('Worker bootstrap timeout '+version)),30000);
   w.addEventListener('message',({data})=>{
    if(data?.type==='ready'){clearTimeout(timeout);yes();return;}
    if(data?.type==='unsupported'){clearTimeout(timeout);no(Error(data.error));return;}
    if(pending.has(data?.id))pending.get(data.id)(data);
   });
   w.addEventListener('error',e=>no(Error(e.message)));
   await ready;
   return {version,worker:w,request:(recipe,width,height,type='preview')=>
    new Promise((resolve,reject)=>{
     const id=++next;
     const timer=setTimeout(()=>{pending.delete(id);reject(Error('Render timeout '+version));},120000);
     pending.set(id,data=>{
      pending.delete(id);clearTimeout(timer);
      if(data.type==='error')reject(Error(data.error));
      else if(data.type==='frame'||data.type==='exported')resolve(data);
      else reject(Error('Unexpected response '+data.type));
     });
     w.postMessage({type,id,recipe,width,height,key:recipe.seed,quality:'settled'});
    })
   };
  }));
  const hash=async bytes=>{
   const digest=await crypto.subtle.digest('SHA-256',bytes);
   return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
  };
  async function paint(frame,recipe,width,height){
   const c=new OffscreenCanvas(width,height);
   try{
    presentNudgedArtwork(c,{
     background:frame.background,ink:frame.ink,overhang:frame.overhang},recipe);
    return new Uint8ClampedArray(c.getContext('2d').getImageData(
      0,0,width,height).data);
   }finally{c.width=0;c.height=0;}
  }
  const records=[];
  for(const scene of scenes){
   const samples=[];
   for(let i=0;i<(scene.label==='sand-600x1300'||scene.label==='sand-372x806'?5:3);i++){
    const pair={};
    for(const worker of (i%2?workers.slice().reverse():workers)){
     const msg=await worker.request(scene.recipe,scene.w,scene.h);
     if(msg.type!=='frame'||msg.quality!=='settled')throw Error('Missing settled frame');
     const pixels=await paint(msg,scene.recipe,scene.w,scene.h);
     pair[worker.version]={ms:msg.ms,pixels};
     msg.background.close();msg.ink.close();
    }
    const p=pair.base.pixels,q=pair.crop.pixels;
    let changed=0,maxDelta=0,mae=0,alphaChanged=0;
    for(let j=0;j<p.length;j+=4){
     let delta=0;
     for(let k=0;k<3;k++){
      const d=Math.abs(p[j+k]-q[j+k]);
      delta=Math.max(delta,d);mae+=d;
     }
     if(delta)changed++;
     maxDelta=Math.max(maxDelta,delta);
     if(p[j+3]!==q[j+3])alphaChanged++;
    }
    const receipt={i,baseMs:pair.base.ms,cropMs:pair.crop.ms,
      baseSha:await hash(p),cropSha:await hash(q),changed,maxDelta,alphaChanged,
      channelMAE:mae/(scene.w*scene.h*3)};
    samples.push(receipt);
    // Never call non-identical output an optimisation.
    // Keep the exact discrepancy as an actionable negative result.
   }
   records.push({label:scene.label,material:scene.recipe.material,
    width:scene.w,height:scene.h,samples});
  }
  const native={};
  for(const worker of workers){
   const res=await worker.request(scenes[0].recipe,3024,6552,'export');
   if(res.type!=='exported'||res.blob?.type!=='image/png')throw Error('Native export error');
   native[worker.version]={sha:await hash(await res.blob.arrayBuffer()),bytes:res.blob.size};
  }
  workers.forEach(w=>w.worker.terminate());
  if(native.base.sha!==native.crop.sha||native.base.bytes!==native.crop.bytes)
    throw Error('Native export byte mismatch');
  return {records,native};
 },scenes);
 assert.deepEqual(errors,[]);
 const median=xs=>xs.slice().sort((a,b)=>a-b)[2];
 const summary=results.records.map(r=>({label:r.label,material:r.material,
  exact:r.samples.every(s=>!s.changed&&!s.alphaChanged),
  changed:r.samples[0].changed,maxDelta:r.samples[0].maxDelta,
  baseMedianMs:Math.round(median(r.samples.map(s=>s.baseMs))),
  cropMedianMs:Math.round(median(r.samples.map(s=>s.cropMs))),
  originalVisibleSha:r.samples[0].baseSha,candidateVisibleSha:r.samples[0].cropSha}));
 await mkdir(join(root,'artifacts','sand-crop-feasibility'),{recursive:true});
 await writeFile(join(root,'artifacts','sand-crop-feasibility','receipt.json'),
  JSON.stringify({environment:'Actual Chromium OffscreenCanvas Workers, original code vs HTTP-served diagnostic material bounds, same source output size and full overscan',summary,...results},null,2)+'\n');
 console.log('ROYGBIV_SAND_CROP_FEASIBILITY',JSON.stringify({summary,native:results.native}));
}finally{
 await browser?.close();await new Promise(done=>server.close(done));
}
