#!/usr/bin/env node
// Optical parity oracle: decode already-generated PNGs, never approximate the
// wallpaper painter or use untrusted source-image inferencing.
import {readFile} from 'node:fs/promises';
import {extractPngRecipe} from '../src/png-metadata.js';
import {chromium} from 'playwright';

const [referencePath,workerPath]=process.argv.slice(2);
if(!referencePath||!workerPath)
  throw Error('Usage: node scripts/compare-per-hue-pngs.mjs reference.png worker.png');
const reference=await readFile(referencePath),worker=await readFile(workerPath);
const a=extractPngRecipe(reference),b=extractPngRecipe(worker);
if(!a||!b||JSON.stringify(a)!==JSON.stringify(b)||
  a.scatteredShapeOverrides?.length!==7)
  throw Error('Both PNGs must contain the identical seven-hue portable recipe');
if(reference.length>12*1024*1024||worker.length>12*1024*1024)
  throw Error('Comparison inputs too large');
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:480,height:1040}});
  const result=await page.evaluate(async ({sourceA,sourceB})=>{
    const decode=async encoded=>{
      const blob=new Blob([Uint8Array.from(atob(encoded),
        char=>char.charCodeAt(0))],{type:'image/png'});
      const bitmap=await createImageBitmap(blob);
      const canvas=document.createElement('canvas');
      canvas.width=bitmap.width;canvas.height=bitmap.height;
      const context=canvas.getContext('2d',{willReadFrequently:true});
      context.drawImage(bitmap,0,0);
      bitmap.close();
      return {width:canvas.width,height:canvas.height,
        pixels:context.getImageData(0,0,canvas.width,canvas.height).data};
    };
    const first=await decode(sourceA),second=await decode(sourceB);
    if(first.width!==second.width||first.height!==second.height)
      return {error:'dimension mismatch'};
    let differences=0,ink=0;
    for(let i=0;i<first.pixels.length;i+=4){
      if(first.pixels[i]!==second.pixels[i]||
        first.pixels[i+1]!==second.pixels[i+1]||
        first.pixels[i+2]!==second.pixels[i+2]||
        first.pixels[i+3]!==second.pixels[i+3])differences++;
      if(Math.max(first.pixels[i],first.pixels[i+1],first.pixels[i+2])>55)ink++;
    }
    return {width:first.width,height:first.height,differingPixels:differences,
      visibleInkPixels:ink};
  },{sourceA:reference.toString('base64'),sourceB:worker.toString('base64')});
  if(result.error||result.differingPixels!==0||result.visibleInkPixels<2000)
    throw Error('Exact worker/reference per-hue paint parity failed: '+
      JSON.stringify(result));
  console.log('PER_HUE_PAINTER_PARITY '+JSON.stringify(result));
}finally{await browser.close();}
