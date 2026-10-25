#!/usr/bin/env node
// Targeted actual-source art proof; use only while implementing two-tone ink.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'output','dual-text-outlines');
await mkdir(out,{recursive:true});
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html',
  '.svg':'image/svg+xml','.json':'application/json','.ttf':'font/ttf'};
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
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
 const result=await page.evaluate(async()=>{
  const {drawWallpaper}=await import('/src/renderer.js');
  const {normalizeRecipe,encodeRecipe,decodeRecipe}=await import('/src/model.js');
  const {exportWallpaperInWorker}=await import('/src/render-coordinator.js');
  const cases=[
   {id:'white-inner-native',text:'السَّلَامُ RAINBOW',
    colour:'rainbow-word',outline:'black-white',
    shadow:'black',shadowBlur:5,shadowDistance:7},
   {id:'black-inner-wave',text:'CURVED OUTLINES',path:'wave',pathHeight:80,
    colour:'rainbow-letter',outline:'white-black',
    shadow:'white',shadowBlur:7,shadowDistance:8},
   {id:'white-inner-drawn',text:'FOLLOW A SHAPE',path:'drawn',pathHeight:95,
    colour:'white',outline:'black-white',
    shadow:'black',shadowBlur:5,shadowDistance:8,
    customPath:[[.04,.4],[.24,.3],[.44,.43],[.66,.55],[.88,.41],[.96,.46]]}
  ];
  const size=[480,1040];
  const canvas=()=>{const x=document.createElement('canvas');x.width=size[0];
    x.height=size[1];return x;};
  const rgba=c=>c.getContext('2d',{willReadFrequently:true})
    .getImageData(0,0,size[0],size[1]).data;
  const sheet=document.createElement('canvas');
  sheet.width=size[0]*cases.length;sheet.height=size[1];
  const results=[],saved=[];
  for(const [index,item] of cases.entries()){
   const recipe=normalizeRecipe({seed:'dual-outline-'+item.id,
     background:'black',palette:'classic',orientation:'vertical',
     ...(item.customPath?{customPath:item.customPath}:{}),
     textOverlays:[{id:'ink',font:'modern',size:68,x:50,y:50,
       outlineWidth:13,...item}]});
   const roundTrip=decodeRecipe(encodeRecipe(recipe));
   if(JSON.stringify(roundTrip.textOverlays)!==JSON.stringify(recipe.textOverlays))
     throw Error('Loss of two-tone recipe '+item.id);
   const ref=canvas(),old=canvas(),work=canvas();
   drawWallpaper(ref,recipe);
   drawWallpaper(old,{...recipe,textOverlays:recipe.textOverlays.map(x=>({
     ...x,outline:x.outline==='black-white'?'black':'white'
   }))});
   const raw=rgba(ref),single=rgba(old);
   let distinct=0;for(let i=0;i<raw.length;i++)
     if(raw[i]!==single[i])distinct++;
   if(distinct<500)throw Error('Dual outline visually indistinguishable: '+item.id);
   const png=await exportWallpaperInWorker({recipe,width:size[0],height:size[1],timeoutMs:90000});
   const bitmap=await createImageBitmap(png);
   work.getContext('2d').drawImage(bitmap,0,0);bitmap.close();
   const worker=rgba(work);let differences=0;
   for(let i=0;i<raw.length;i++)if(raw[i]!==worker[i])differences++;
   if(differences)throw Error('Worker drift '+item.id+': '+differences);
   sheet.getContext('2d').drawImage(ref,index*size[0],0);
   saved.push(ref.toDataURL('image/png'));
   results.push({id:item.id,outline:item.outline,differentChannelsVsSingle:distinct,
     differingWorkerChannels:differences,workerBytes:png.size});
   ref.width=0;old.width=0;work.width=0;
  }
  window.__dualSheets=saved;
  window.__dualContact=sheet.toDataURL('image/png');
  return results;
 });
 for(let i=0;i<result.length;i++){
  const encoded=await page.evaluate(i=>window.__dualSheets[i],i);
  await writeFile(join(out,result[i].id+'.png'),Buffer.from(encoded.split(',')[1],'base64'));
 }
 const contact=await page.evaluate(()=>window.__dualContact);
 await writeFile(join(out,'contact.png'),Buffer.from(contact.split(',')[1],'base64'));
 console.log('DUAL_OUTLINE_SOURCE_ART_BASE64='+contact.split(',')[1]);
 assert.deepEqual(errors,[]);
 const proof={status:'PASS',browser:'source Chromium, 412x892 emulation only',
  cases:result,pageErrors:errors};
 await writeFile(join(out,'report.json'),JSON.stringify(proof,null,2)+'\n');
 console.log('DUAL_OUTLINE_BROWSER_PROOF '+JSON.stringify(proof));
}finally{await browser?.close();server.close();}
