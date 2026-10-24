#!/usr/bin/env node
// Explicitly opt-in, actual current-renderer and fresh-worker PNG witness.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,extname,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'output','text-path');
await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.svg':'image/svg+xml','.json':'application/json','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{
  try{
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!path.startsWith(root+'/')&&path!==root){res.writeHead(403).end();return;}
    const file=path===root?join(root,'index.html'):path;
    res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(await readFile(file));
  }catch{res.writeHead(404).end('Not found');}
});
let browser;
try{
  await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:412,height:892}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  const report=await page.evaluate(async()=>{
    const {drawWallpaper}=await import('/src/renderer.js');
    const {normalizeRecipe}=await import('/src/model.js');
    const {prepareTypefaces}=await import('/src/typography-fonts.js');
    const {exportWallpaperInWorker}=await import('/src/render-coordinator.js');
    const examples=[
      {name:'wave',text:'RAINBOW IN MOTION',path:'wave',pathHeight:65,
        font:'modern',colour:'rainbow-letter',outline:'black',size:62,y:48},
      {name:'arc',text:'OVER THE RAINBOW',path:'arc',pathHeight:105,
        font:'editorial',colour:'rainbow-gradient',outline:'white',size:58,y:53},
      {name:'circle',text:'ROUND AND ROUND',path:'circle',pathHeight:185,
        font:'bold',colour:'rainbow-word',outline:'black',size:55,y:56},
      {name:'joining-fallback',text:'السَّلَامُ عَلَيْكُمْ',path:'wave',pathHeight:70,
        font:'modern',colour:'rainbow-letter',outline:'white',size:70,y:52},
    ];
    const make=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
    const countDiff=(a,b)=>{
      const A=a.getContext('2d',{willReadFrequently:true}).getImageData(0,0,a.width,a.height).data;
      const B=b.getContext('2d',{willReadFrequently:true}).getImageData(0,0,b.width,b.height).data;
      let differences=0;for(let i=0;i<A.length;i++)if(A[i]!==B[i])differences++;
      return differences;
    };
    const results=[],data=[];
    const thumb=make(480,270),tctx=thumb.getContext('2d');
    for(let index=0;index<examples.length;index++){
      const spec=examples[index];
      const recipe=normalizeRecipe({seed:'actual-text-path-'+spec.name,
        orientation:'vertical',palette:'classic',
        textOverlays:[{id:'curved',x:50,enabled:true,...spec}]});
      await prepareTypefaces(recipe);
      const reference=make(480,1040),worker=make(480,1040),blank=make(480,1040);
      drawWallpaper(reference,recipe);
      drawWallpaper(blank,{...recipe,textOverlays:[]});
      const inkChannels=countDiff(reference,blank);
      assert.ok(inkChannels>1000,'No visible curved ink: '+spec.name);
      const blob=await exportWallpaperInWorker({recipe,width:480,height:1040,
        timeoutMs:120000});
      const bmp=await createImageBitmap(blob);
      worker.getContext('2d').drawImage(bmp,0,0);bmp.close();
      const mismatch=countDiff(reference,worker);
      assert.equal(mismatch,0,'Reference/worker output mismatch: '+spec.name);
      if(spec.name==='joining-fallback'){
        const original=make(480,1040);
        drawWallpaper(original,{...recipe,textOverlays:[{...recipe.textOverlays[0],path:undefined}]});
        assert.equal(countDiff(reference,original),0,'Native-shaped fallback changed its pixels');
      }
      const mini=make(120,260);
      mini.getContext('2d').drawImage(reference,0,0,120,260);
      tctx.drawImage(mini,index*120,0);
      data.push(reference.toDataURL('image/png'));
      results.push({name:spec.name,inkChannels,workerPixelChannelDifferences:mismatch,
        workerPngBytes:blob.size,text:spec.text,path:recipe.textOverlays[0].path});
      reference.width=0;worker.width=0;blank.width=0;
    }
    window.__pathArtwork=data;
    window.__pathThumb=thumb.toDataURL('image/png');
    // A genuine 19.8-megapixel exported curved design, decoded in Chromium.
    const high=normalizeRecipe({seed:'full-text-curve',
      textOverlays:[{text:'WAVES IN 4K',path:'wave',pathHeight:70,
      font:'modern',colour:'rainbow-gradient',size:64,outline:'black'}]});
    await prepareTypefaces(high);
    const full=await exportWallpaperInWorker({recipe:high,width:3024,height:6552,
      timeoutMs:180000});
    const bitmap=await createImageBitmap(full);
    const megapixels={width:bitmap.width,height:bitmap.height,bytes:full.size};
    assert.equal(bitmap.width,3024);assert.equal(bitmap.height,6552);
    bitmap.close();
    return {results,megapixels};
  });
  for(let i=0;i<report.results.length;i++){
    const data=await page.evaluate(i=>window.__pathArtwork[i],i);
    await writeFile(join(out,'text-path-'+report.results[i].name+'.png'),
      Buffer.from(data.split(',')[1],'base64'));
  }
  const mosaic=await page.evaluate(()=>window.__pathThumb);
  await writeFile(join(out,'text-path-contact-sheet.png'),
    Buffer.from(mosaic.split(',')[1],'base64'));
  // Allows independent optical review without relying on an unviewed artifact.
  console.log('TEXT_PATH_CONTACT_SHEET_BASE64='+mosaic.split(',')[1]);
  assert.deepEqual(errors,[]);
  const proof={status:'PASS',viewport:'Chromium 412x892 emulated, not real Android',
    browserErrors:errors,...report};
  await writeFile(join(out,'report.json'),JSON.stringify(proof,null,2)+'\n');
  console.log('TEXT PATH PRODUCTION SOURCE PROOF '+JSON.stringify(proof));
}finally{await browser?.close();server.close();}
