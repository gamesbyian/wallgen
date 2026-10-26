#!/usr/bin/env node
// One-shot opt-in Chromium proof: source-only inverse score, preserved author
// caption in actual PNG and reference/worker parity. This renderer-native
// fixture is NOT independent external artwork or a physical Android test.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {dirname,resolve,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=join(root,'artifacts','reconstruction-caption-source-chromium');
const types={'.js':'text/javascript','.html':'text/html','.css':'text/css',
  '.json':'application/json','.svg':'image/svg+xml','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{
  try{
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
    if(path!==root&&!path.startsWith(root+'/')){res.writeHead(403).end();return;}
    const file=path===root?join(root,'index.html'):path;
    res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(await readFile(file));
  }catch{res.writeHead(404).end('Unavailable');}
});
let browser;
try{
  const {chromium}=await import('playwright');
  await mkdir(output,{recursive:true});
  await new Promise((ok,bad)=>{
    server.once('error',bad);server.listen(0,'127.0.0.1',ok);
  });
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:412,height:892},
    deviceScaleFactor:1,reducedMotion:'reduce'});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',
    {waitUntil:'domcontentloaded'});
  const report=await page.evaluate(async()=>{
    const {normalizeRecipe}=await import('/src/model.js');
    const {drawWallpaper}=await import('/src/renderer.js');
    const {exportWallpaperInWorker}=await import('/src/render-coordinator.js');
    const {reconstructionSourceFitRecipe,rankReconstructionCandidates,
      refineReconstructionCandidateCooperatively,RECONSTRUCTION_FRAME}=await
      import('/src/image-reconstruction.js');
    const ensure=(condition,message)=>{if(!condition)throw Error(message)};
    const create=(w,h)=>{const c=document.createElement('canvas');
      c.width=w;c.height=h;return c;};
    const bytes=canvas=>canvas.getContext('2d',{willReadFrequently:true})
      .getImageData(0,0,canvas.width,canvas.height).data;
    const differences=(a,b)=>{
      const A=bytes(a),B=bytes(b);let different=0;
      ensure(A.length===B.length,'Mismatched frame size');
      for(let i=0;i<A.length;i++)if(A[i]!==B[i])different++;
      return different;
    };
    const base=normalizeRecipe({seed:'one-shot-source-caption-isolation',
      family:'studio',structure:'regions',regionMode:'scattered',
      scatteredCount:7,scatteredShapeKind:'circle',
      palette:'classic',background:'black',
      material:'none',motif:'solid',outline:'none'});
    const authored=normalizeRecipe({...base,textOverlays:[
      {id:'surviving-author-caption',text:'KEEP MY CAPTION',
        x:50,y:51,font:'modern',colour:'white',
        outline:'black',size:84,opacity:1}
    ]});
    const source=create(480,1040),combined=create(480,1040),
      workerCanvas=create(480,1040);
    drawWallpaper(source,base);
    drawWallpaper(combined,authored);
    const textInkChangedChannels=differences(source,combined);
    ensure(textInkChangedChannels>1000,'Caption produced no real ink pixels');
    const reference=create(RECONSTRUCTION_FRAME.width,RECONSTRUCTION_FRAME.height);
    drawWallpaper(reference,base);
    const ref=reference.getContext('2d',{willReadFrequently:true})
      .getImageData(0,0,reference.width,reference.height);
    const candidate={kind:'straight',label:'already exact source renderer geometry',
      uncertainty:'Original seed unknown.',recipe:authored};
    const paints=[];
    const paint=(recipe,w,h)=>{
      ensure(w===reference.width&&h===reference.height,'Wrong source fit size');
      paints.push({textCount:recipe.textOverlays?.length||0,
        kind:recipe.structure});
      const canvas=create(w,h);drawWallpaper(canvas,recipe);
      return canvas.getContext('2d',{willReadFrequently:true})
        .getImageData(0,0,w,h);
    };
    const ranked=rankReconstructionCandidates([candidate],ref,paint);
    ensure(ranked.length===1&&ranked[0].error<1e-12,
      'Preserved pre-existing caption changed the source-only fit error');
    ensure(ranked[0].recipe.textOverlays?.[0]?.text==='KEEP MY CAPTION',
      'Source-only comparison discarded the actual editable caption');
    const refined=await refineReconstructionCandidateCooperatively(
      ranked[0],ref,paint,{maxRenders:2,yieldControl:async()=>{}});
    ensure(refined.recipe.textOverlays?.[0]?.text==='KEEP MY CAPTION',
      'Refinement discarded the authored caption');
    ensure(paints.length>=2&&paints.every(p=>p.textCount===0),
      'One or more inverse source score paints included unrelated text');
    const temporary=reconstructionSourceFitRecipe(authored);
    ensure((temporary.textOverlays||[]).length===0 &&
      authored.textOverlays.length===1,
      'Transient comparison scene mutated the canonical original');
    const workerBlob=await exportWallpaperInWorker({recipe:authored,
      width:480,height:1040,timeoutMs:120000});
    const bmp=await createImageBitmap(workerBlob);
    workerCanvas.getContext('2d').drawImage(bmp,0,0);
    bmp.close();
    const workerMismatch=differences(combined,workerCanvas);
    ensure(workerMismatch===0,'Captioned reference and worker PNG differ');
    window.__captionSource=source.toDataURL('image/png');
    window.__captionCombined=combined.toDataURL('image/png');
    return {label:'current-renderer Chromium source-only scoring witness',
      emulatedViewport:'412x892, not an Android device',
      sourceDimensions:[480,1040],fitDimensions:[reference.width,reference.height],
      initialError:ranked[0].error,refinementRenders:refined.refinementRenders||0,
      sourceFitPaints:paints,captionInkPixelChannelChanges:textInkChangedChannels,
      textPreservedInEditableRecipe:true,
      workerPngBytes:workerBlob.size,referenceWorkerDifferentChannels:workerMismatch};
  });
  assert.deepEqual(errors,[]);
  for(const [key,name] of [
    ['__captionSource','without-existing-caption.png'],
    ['__captionCombined','with-existing-caption.png']
  ]){
    const png=await page.evaluate(key=>window[key],key);
    await writeFile(join(output,name),Buffer.from(png.split(',')[1],'base64'));
  }
  await writeFile(join(output,'report.json'),
    JSON.stringify({status:'PASS',browserErrors:errors,...report},null,2)+'\n');
  console.log('CAPTION_SOURCE_FIT_CHROMIUM '+JSON.stringify(report));
}finally{
  await browser?.close();
  server.close();
}
