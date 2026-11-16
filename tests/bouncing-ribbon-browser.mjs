#!/usr/bin/env node
// Production Canvas2D/worker PNG evidence for a real bouncing centerline.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {normalizeRecipe} from '../src/model.js';
import {embedPngMetadata,extractPngRecipe} from '../src/png-metadata.js';

const out='artifacts/bouncing-ribbon-browser';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:412,height:892}});
  const errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(process.env.ROYGBIV_URL||'http://127.0.0.1:4173/',
    {waitUntil:'domcontentloaded'});
  const result=await page.evaluate(async()=>{
    const {drawWallpaper}=await import('/src/renderer.js');
    const {exportWallpaperInWorker}=await import('/src/render-coordinator.js');
    const base={
      seed:'bounce-production-proof',structure:'paths',geometry:'scalloped',
      motif:'solid',lineStyle:'continuous',individuality:0,
      background:'white',material:'none',lightingMood:'off',
      lightStrength:0,shadowStrength:0,stripeShadowStrength:0,
      outline:'none',glow:0,textureDisplacement:0
    };
    const width=600,height=1300;
    const paint=(extra,w=width,h=height)=>{
      const canvas=document.createElement('canvas');
      canvas.width=w;canvas.height=h;
      drawWallpaper(canvas,{...base,...extra});
      return {canvas,image:canvas.toDataURL('image/png'),
        data:canvas.getContext('2d',{willReadFrequently:true})
          .getImageData(0,0,w,h).data};
    };
    const low={orientation:'horizontal',construction:'ribbon',stripeWidth:75,
      shapeFrequency:12,shapeDepth:95,startTaper:0,endTaper:0};
    const high={orientation:'diagonal',diagonalRotation:26,
      construction:'stroke',stripeWidth:35,shapeFrequency:88,
      shapeDepth:100,startTaper:35,endTaper:75,viewZoom:.8};
    const lowPaint=paint(low);
    const highPaint=paint(high);
    const zeroPaint=paint({...high,shapeDepth:0});
    let changed=0,coloured=0;
    for(let i=0;i<highPaint.data.length;i+=4){
      if(Math.max(...highPaint.data.subarray(i,i+3))-
        Math.min(...highPaint.data.subarray(i,i+3))>40)coloured++;
      if(Math.max(...[0,1,2].map(k=>Math.abs(
        highPaint.data[i+k]-zeroPaint.data[i+k])))>15)changed++;
    }
    // Reference renderer and production PNG worker must agree on the same
    // centered trajectory, rather than having separate bounce paths.
    const workerBlob=await exportWallpaperInWorker({
      recipe:{...base,...high},width:320,height:700});
    const workerBitmap=await createImageBitmap(workerBlob);
    const workerCanvas=document.createElement('canvas');
    workerCanvas.width=320;workerCanvas.height=700;
    workerCanvas.getContext('2d').drawImage(workerBitmap,0,0);
    const workerPixels=workerCanvas.getContext('2d',
      {willReadFrequently:true}).getImageData(0,0,320,700).data;
    const reference=paint(high,320,700);
    let mismatches=0;
    for(let i=0;i<workerPixels.length;i+=4)
      if(Math.max(...[0,1,2].map(k=>Math.abs(
        workerPixels[i+k]-reference.data[i+k])))>3)mismatches++;
    return {
      selection:document.querySelector('select[name="geometry"] option[value="scalloped"]')?.textContent?.trim(),
      width,height,coloured,changed,
      workerBytes:workerBlob.size,workerPixelMismatches:mismatches,
      workerPixelCount:320*700,
      images:{
        low:lowPaint.image,high:highPaint.image,
        worker:workerCanvas.toDataURL('image/png')
      },
      highRecipe:{...base,...high}
    };
  });
  for(const [name,data] of Object.entries(result.images))
    await writeFile(out+'/'+name+'.png',Buffer.from(data.split(',')[1],'base64'));
  const png=embedPngMetadata(Buffer.from(result.images.high.split(',')[1],'base64'),
    {},{recipe:normalizeRecipe(result.highRecipe)});
  await writeFile(out+'/high-with-recipe.png',png);
  assert.deepEqual(extractPngRecipe(png),normalizeRecipe(result.highRecipe),
    'PNG export must preserve bounce parameters for reimport');
  delete result.images;delete result.highRecipe;
  assert.equal(result.selection,'Bouncing ribbon');
  assert.ok(result.coloured>500,'real rendered preview must contain coloured stripes');
  assert.ok(result.changed>1200,'pronounced bounce must change actual raster pixels');
  assert.ok(result.workerBytes>2500,'worker export must emit nonempty PNG bytes');
  assert.ok(result.workerPixelMismatches/result.workerPixelCount<.01,
    'reference and worker paint must agree on actual bouncing silhouette');
  assert.deepEqual(errors,[],'no browser page exceptions');
  await writeFile(out+'/results.json',JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
}finally{
  await browser.close();
}
