#!/usr/bin/env node
// One-shot actual Chromium source artwork: screen-space directional text
// shadows, exact legacy diagonal and independent worker PNGs.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'output','directional-text-shadow');
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
 '.json':'application/json','.svg':'image/svg+xml','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{
 try{
  const file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(!file.startsWith(root+'/')&&file!==root){res.writeHead(403).end();return;}
  const path=file===root?join(root,'index.html'):file;
  res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream',
   'Cache-Control':'no-store'}).end(await readFile(path));
 }catch{res.writeHead(404).end('Not Found');}
});
let browser;
try{
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:412,height:892}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
 const result=await page.evaluate(async()=>{
  const {normalizeRecipe}=await import('/src/model.js');
  const {drawWallpaper}=await import('/src/renderer.js');
  const {exportWallpaperInWorker}=await import('/src/render-coordinator.js');
  const angles=[null,0,90,180,270];
  const make=()=>{const c=document.createElement('canvas');c.width=480;c.height=1040;return c;};
  const pixels=c=>c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,480,1040).data;
  const contact=document.createElement('canvas');
  contact.width=240*angles.length;contact.height=520;
  const results=[],sources=[],pix=[];
  for(const [i,angle] of angles.entries()){
   const recipe=normalizeRecipe({seed:'shadow-direction-visual',
    background:'white',palette:'classic',orientation:'horizontal',
    textOverlays:[{id:'direction',text:'RAINBOW',x:50,y:50,size:95,
     font:'modern',colour:'rainbow-letter',outline:'white',outlineWidth:4,
     path:'wave',pathHeight:70,
     shadow:'black',shadowDistance:16,shadowBlur:2,
     ...(angle===null?{}:{shadowAngle:angle})}]});
   const direct=make(),worker=make(),neutral=make();
   drawWallpaper(direct,recipe);
   drawWallpaper(neutral,{...recipe,textOverlays:recipe.textOverlays.map(x=>({
     ...x,shadow:undefined,shadowAngle:undefined,shadowDistance:0,shadowBlur:0
   }))});
   const a=pixels(direct),n=pixels(neutral);
   let shadowChanged=0;
   for(let c=0;c<a.length;c++)if(a[c]!==n[c])shadowChanged++;
   if(shadowChanged<500)throw Error('No visible cast shadow for '+angle);
   const blob=await exportWallpaperInWorker({recipe,width:480,height:1040,timeoutMs:90000});
   const bitmap=await createImageBitmap(blob);
   worker.getContext('2d').drawImage(bitmap,0,0);bitmap.close();
   const b=pixels(worker);let differences=0;
   for(let c=0;c<a.length;c++)if(a[c]!==b[c])differences++;
   if(differences)throw Error('Renderer/worker mismatch angle '+angle);
   contact.getContext('2d').drawImage(direct,i*240,0,240,520);
   pix.push(a.slice());
   sources.push(direct.toDataURL('image/png'));
   results.push({angle:angle===null?'legacy':angle,shadowChangedChannels:shadowChanged,
     workerDifferentChannels:differences,bytes:blob.size});
   direct.width=0;worker.width=0;neutral.width=0;
  }
  // Explicitly authored 45° must recreate the old absent-angle artwork
  // channel-for-channel (not merely a visually approximate shadow).
  const legacy=normalizeRecipe({seed:'shadow-direction-visual',background:'white',
   palette:'classic',orientation:'horizontal',
   textOverlays:[{id:'direction',text:'RAINBOW',x:50,y:50,size:95,
     font:'modern',colour:'rainbow-letter',outline:'white',outlineWidth:4,
     path:'wave',pathHeight:70,shadow:'black',shadowDistance:16,
     shadowBlur:2,shadowAngle:45}]});
  const exact=make();drawWallpaper(exact,legacy);
  const x=pixels(exact),orig=pix[0];let changedLegacy=0;
  for(let c=0;c<x.length;c++)if(x[c]!==orig[c])changedLegacy++;
  if(changedLegacy)throw Error('Explicit 45° altered old shadow pixels');
  for(let i=2;i<pix.length;i++){
   let changed=0;
   for(let c=0;c<pix[i].length;c++)if(pix[i][c]!==pix[1][c])changed++;
   if(changed<500)throw Error('Directions did not visually change: '+angles[i]);
   results[i].changedVsRight=changed;
  }
  window.__shadowSources=sources;
  window.__shadowContact=contact.toDataURL('image/png');
  return {results,changedLegacy};
 });
 for(let i=0;i<result.results.length;i++){
  const encoded=await page.evaluate(i=>window.__shadowSources[i],i);
  await writeFile(join(out,'shadow-'+result.results[i].angle+'.png'),
   Buffer.from(encoded.split(',')[1],'base64'));
 }
 const contact=await page.evaluate(()=>window.__shadowContact);
 await writeFile(join(out,'contact.png'),Buffer.from(contact.split(',')[1],'base64'));
 console.log('SHADOW_DIRECTION_ART_BASE64='+contact.split(',')[1]);
 assert.deepEqual(errors,[]);
 const proof={status:'PASS',viewport:'emulated 412x892 source Chromium, not Android',
  pageErrors:errors,...result};
 await writeFile(join(out,'report.json'),JSON.stringify(proof,null,2)+'\n');
 console.log('SHADOW_DIRECTION_SOURCE_PROOF '+JSON.stringify(proof));
}finally{await browser?.close();server.close();}
