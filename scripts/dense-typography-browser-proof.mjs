#!/usr/bin/env node
// Opt-in source Chromium stress of current canonical maximum 8 editable text
// objects, long four-line content, 8 bundled fonts, and a 3024x6552 PNG.
// Runner numbers are measurements on Linux, NOT physical Pixel acceptance.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,OUTPUT_WIDTH,OUTPUT_HEIGHT} from '../src/model.js';
import {extractPngRecipe} from '../src/png-metadata.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'output','dense-typography-stress');
await mkdir(out,{recursive:true});
const files={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.svg':'image/svg+xml','.json':'application/json','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{
 try{
  const file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(!file.startsWith(root+'/')&&file!==root){res.writeHead(403).end();return;}
  const path=file===root?join(root,'index.html'):file;
  res.writeHead(200,{'Content-Type':files[extname(path)]||'application/octet-stream',
   'Cache-Control':'no-store'}).end(await readFile(path));
 }catch{res.writeHead(404).end('Not Found');}
});
const line='RAINBOW COLOURS AND CURVES IN MOTION';
const longText=[line,line,line,line].join('\n');
assert.ok([...longText].length>=140&&[...longText].length<=160);
const modes=['drawn','hairpin','loop','wave','arc','circle','hairpin','drawn'];
const fontIds=['pack-bangers','pack-abrilfatface','pack-pacifico','pack-lobster',
  'pack-bebasneue','pack-righteous','pack-rubikwetpaint','pack-courgette'];
const textOverlays=fontIds.map((font,i)=>({
 id:'dense-'+(i+1),text:longText,font,x:50,y:10+i*11,
 size:40+i%3*5,path:modes[i],pathHeight:90+i*9,
 colour:['rainbow-letter','rainbow-word','rainbow-gradient','white'][i%4],
 outline:['black-white','white-black','black','white'][i%4],outlineWidth:8,
 shadow:i%2?'white':'black',shadowBlur:5+i%3,
 shadowDistance:6+i%6,shadowAngle:[0,45,90,135,180,225,270,315][i],
 lineSpacing:i%3*10,letterSpacing:1.5
}));
const recipe=normalizeRecipe({seed:'dense-eight-typefaces',orientation:'vertical',
 palette:'classic',background:'black',
 customPath:[[.02,.42],[.18,.33],[.39,.51],[.62,.57],[.82,.39],[.98,.47]],
 textOverlays});
assert.equal(recipe.textOverlays.length,8);
assert.ok(recipe.textOverlays.every(x=>x.text.split('\n').length===4));
let browser;
const lifecycle=[];
try{
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
 browser=await chromium.launch({headless:true,args:['--js-flags=--max-old-space-size=4096']});
 const page=await browser.newPage({viewport:{width:412,height:892},
  deviceScaleFactor:1,acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('crash',()=>lifecycle.push('page-crash'));
 browser.on('disconnected',()=>lifecycle.push('browser-disconnect'));
 const url='http://127.0.0.1:'+server.address().port+'/?r='+
  encodeURIComponent(encodeRecipe(recipe));
 const startNavigation=Date.now();
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#preview');
 // Force all eight SHA-pinned bundled faces to load on the main document and
 // ensure the same source recipe then renders through a fresh export worker.
 const measured=await page.evaluate(async()=>{
  const {decodeRecipe}=await import('/src/model.js');
  const {prepareTypefaces,typefacesReady}=await import('/src/typography-fonts.js');
  const {drawWallpaper}=await import('/src/renderer.js');
  const {exportWallpaperInWorker}=await import('/src/render-coordinator.js');
  const recipe=decodeRecipe(new URL(location.href).searchParams.get('r'));
  const begin=performance.now();
  await prepareTypefaces(recipe);
  const fontPrepareMs=performance.now()-begin;
  if(!typefacesReady(recipe))throw Error('One of eight bundled fonts did not load');
  const make=()=>{const c=document.createElement('canvas');c.width=360;c.height=780;return c;};
  const direct=make(),worker=make(),blank=make();
  let t=performance.now();drawWallpaper(direct,recipe);
  const directMs=performance.now()-t;
  drawWallpaper(blank,{...recipe,textOverlays:[]});
  t=performance.now();
  const png=await exportWallpaperInWorker({recipe,width:360,height:780,timeoutMs:120000});
  const workerMs=performance.now()-t;
  const bitmap=await createImageBitmap(png);
  worker.getContext('2d').drawImage(bitmap,0,0);bitmap.close();
  const data=c=>c.getContext('2d',{willReadFrequently:true})
   .getImageData(0,0,360,780).data;
  const A=data(direct),B=data(worker),C=data(blank);
  let diff=0,ink=0;
  for(let i=0;i<A.length;i++){if(A[i]!==B[i])diff++;if(A[i]!==C[i])ink++;}
  window.__denseArt=direct.toDataURL('image/png');
  return {fontPrepareMs,directMs,workerMs,
   workerPngBytes:png.size,differingWorkerChannels:diff,inkChangedChannels:ink};
 });
 assert.equal(measured.differingWorkerChannels,0);
 assert.ok(measured.inkChangedChannels>10000);
 const startupAndPreviewMs=Date.now()-startNavigation;
 const art=await page.evaluate(()=>window.__denseArt);
 await writeFile(join(out,'dense-eight-360x780.png'),Buffer.from(art.split(',')[1],'base64'));
 console.log('DENSE_TEXT_ART_BASE64='+art.split(',')[1]);
 const startDownload=Date.now();
 const wait=page.waitForEvent('download',{timeout:240000});
 await page.evaluate(()=>document.getElementById('download').click());
 const download=await wait;
 const path=join(out,'dense-eight-'+OUTPUT_WIDTH+'x'+OUTPUT_HEIGHT+'.png');
 await download.saveAs(path);
 const exportElapsedMs=Date.now()-startDownload;
 const bytes=await readFile(path);
 assert.equal(bytes.readUInt32BE(16),OUTPUT_WIDTH);
 assert.equal(bytes.readUInt32BE(20),OUTPUT_HEIGHT);
 const recovered=extractPngRecipe(bytes);
 assert.equal(recovered.textOverlays.length,8);
 for(let i=0;i<8;i++){
  assert.equal(recovered.textOverlays[i].font,fontIds[i]);
  assert.equal(recovered.textOverlays[i].path,modes[i]);
  assert.equal(recovered.textOverlays[i].text,longText);
  assert.equal(recovered.textOverlays[i].shadowAngle,textOverlays[i].shadowAngle);
 }
 assert.deepEqual(errors,[]);
 assert.deepEqual(lifecycle,[]);
 const report={status:'PASS',browser:'Actual Linux Chromium, emulated 412x892 only',
  case:'8 canonical text objects, 4 long lines each, 8 licensed faces',
  glyphCodepointsPerObject:[...longText].length,overallCharacters:longText.length*8,
  fullDimensions:[OUTPUT_WIDTH,OUTPUT_HEIGHT],fullPngBytes:bytes.byteLength,
  exportElapsedMs,startupAndPreviewMs,
  ...measured,pageErrors:errors,lifecycle};
 await writeFile(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log('DENSE_TYPOGRAPHY_FULLRES_PROOF '+JSON.stringify(report));
}catch(error){
 await writeFile(join(out,'failure.json'),
  JSON.stringify({error:String(error),lifecycle},null,2)+'\n');
 throw error;
}finally{await browser?.close();server.close();}
