#!/usr/bin/env node
// Real Chromium check of native 3024x6552 wallpaper framing against a
// direct 600x1300 render of the same normalized recipe. Never upscale a
// clipped preview and call it a native export.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {extractPngRecipe} from '../src/png-metadata.js';
import {OUTPUT_WIDTH,OUTPUT_HEIGHT,DESIGN_WIDTH,DESIGN_HEIGHT} from '../src/model.js';

const [previewFile,exportFile]=process.argv.slice(2);
assert.ok(previewFile&&exportFile,
  'Usage: node tests/verify-export-geometry.mjs preview.png full-export.png');
const [preview,full]=await Promise.all([readFile(previewFile),readFile(exportFile)]);
for(const [png,width,height,label] of [
  [preview,DESIGN_WIDTH,DESIGN_HEIGHT,'preview'],
  [full,OUTPUT_WIDTH,OUTPUT_HEIGHT,'export']]){
  assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10],label+' signature');
  assert.equal(png.readUInt32BE(16),width,label+' width');
  assert.equal(png.readUInt32BE(20),height,label+' height');
}
const previewRecipe=extractPngRecipe(preview);
const exportRecipe=extractPngRecipe(full);
assert.deepEqual(exportRecipe,previewRecipe,'native PNG silently changed the editable recipe');
assert.equal(exportRecipe.viewZoom,.7,'expect a genuine zoom-out framing fixture');
assert.equal(exportRecipe.material,'none','avoid stochastic textures in geometric pixel acceptance');
let browser;
try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage();
  const metrics=await page.evaluate(async({previewBase64,fullBase64})=>{
    const decode=src=>new Promise((resolve,reject)=>{
      const image=new Image();
      image.onload=()=>resolve(image);
      image.onerror=()=>reject(Error('Could not decode exported PNG'));
      image.src='data:image/png;base64,'+src;
    });
    const [p,e]=await Promise.all([decode(previewBase64),decode(fullBase64)]);
    const getPixels=image=>{
      const canvas=document.createElement('canvas');
      canvas.width=image.width;canvas.height=image.height;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(image,0,0);
      return ctx.getImageData(0,0,canvas.width,canvas.height).data;
    };
    const a=getPixels(p),b=getPixels(e);
    const pixel=(data,w,x,y)=>[...data.slice((y*w+x)*4,(y*w+x)*4+3)];
    const colourDiff=(one,two)=>Math.max(...one.map((v,k)=>Math.abs(v-two[k])));
    let stable=0,foreground=0,disagree=0,foregroundDisagree=0;
    const examples=[];
    for(let y=15;y<p.height-15;y+=13)for(let x=15;x<p.width-15;x+=13){
      const center=pixel(a,p.width,x,y);
      // Ignore antialiased edges, where coverage necessarily depends on
      // output pixel size. Compare only locally flat interior colours.
      if([[3,0],[-3,0],[0,3],[0,-3],[3,3],[-3,-3]].some(([dx,dy])=>
        colourDiff(center,pixel(a,p.width,x+dx,y+dy))>6))continue;
      const px=Math.round((x+.5)*e.width/p.width-.5);
      const py=Math.round((y+.5)*e.height/p.height-.5);
      const rendered=pixel(b,e.width,px,py);
      const mismatch=colourDiff(center,rendered)>12;
      stable++;
      const ink=center.some(channel=>channel>28);
      if(ink)foreground++;
      if(mismatch){
        disagree++;
        if(ink)foregroundDisagree++;
        if(examples.length<8)examples.push({x,y,preview:center,full:rendered});
      }
    }
    return {stable,foreground,disagree,foregroundDisagree,examples};
  },{previewBase64:preview.toString('base64'),fullBase64:full.toString('base64')});
  console.log('NATIVE_WALLPAPER_GEOMETRY',JSON.stringify(metrics));
  assert.ok(metrics.stable>500,'Insufficient stable source points to assess geometry');
  assert.ok(metrics.foreground>100,'Fixture must exercise artwork, not just background');
  assert.ok(metrics.disagree/metrics.stable<.03,
    'Native wallpaper differs materially from preview in stable interiors');
  assert.ok(metrics.foregroundDisagree/metrics.foreground<.03,
    'Native wallpaper changed the coloured artwork geometry');
}finally{await browser?.close();}
