#!/usr/bin/env node
// Opt-in Chromium proof for production composite resource lifetime; no CI screenshot gate.
// Run with: npm install --no-save playwright && node tests/render-surface-lifecycle-browser.mjs
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';

const root=process.cwd();
const types={'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json'};
const server=createServer(async(req,res)=>{
  try{
    const file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!file.startsWith(root+sep))throw Error('outside');
    const bytes=await readFile(file);
    res.writeHead(200,{'Content-Type':types[extname(file)]||'text/plain','Cache-Control':'no-store'});res.end(bytes);
  }catch{res.writeHead(404).end('not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage();
  await page.goto('http://127.0.0.1:'+server.address().port+'/README.md');
  const errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  const sizes=process.env.ROYGBIV_NATIVE_BUDGET==='1'?[[3024,6552]]:[[280,607],[600,1300]];
  for(const [width,height] of sizes){
    const result=await page.evaluate(async({width,height})=>{
      const {drawWallpaper,presentNudgedArtwork}=await import('/src/renderer.js');
      const {normalizeRecipe}=await import('/src/model.js');
      const recipe=normalizeRecipe({
        seed:'agent2-integrity-complex-r3-20261023',
        family:'contour',structure:'paths',geometry:'loops',orientation:'diagonal',
        crossingMode:'weave',motif:'solid',palette:'electric',stripeWidth:66,spread:49,
        individuality:0,shapeDepth:72,shapeFrequency:55,
        material:'linen-organic',textureStrength:50,textureScale:40,
        textureCoverage:'both',textureRotation:31,textureBlend:'normal',
        textureLayer2Enabled:true,material2:'watercolor',textureStrength2:20,
        textureScale2:57,textureRotation2:111,textureCoverage2:'background',
        textureLayer3Enabled:true,material3:'stone',textureStrength3:12,
        textureScale3:46,textureRotation3:233,textureCoverage3:'stripes',
        textureDisplacement:32,
        surfaceTreatments:[
          {id:'chain-review',enabled:true,style:'chain',target:{scope:'palette',colorSlots:[0,1,2]},pitch:5,relief:70},
          {id:'fibre-review',enabled:true,style:'satin-fibre',target:{scope:'palette',colorSlots:[3,4,5,6]},pitch:4,relief:60}
        ],
        lightingMood:'golden',lightStrength:30,shadowStrength:20,stripeShadowStrength:20,
        photoLook:{enabled:true,presetId:'film-halation-diffusion',amount:88}
      });
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
      const made=[];
      const factory=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;made.push(c);return c;};
      const t0=performance.now();
      drawWallpaper(canvas,recipe,{canvasFactory:factory});
      const elapsedMs=Math.round(performance.now()-t0);
      const pixels=made.map(c=>({width:c.width,height:c.height}));
      const pixelArea=pixels.reduce((sum,c)=>sum+c.width*c.height,0);
      const png=canvas.toDataURL('image/png').split(',')[1];
      return {width,height,recipe,elapsedMs,created:made.length,pixels,
        retainedPixels:pixelArea,retainedBackingBytes:pixelArea*4,png};
    },{width,height});
    const png=Buffer.from(result.png,'base64');
    const record={width,height,elapsedMs:result.elapsedMs,created:result.created,
      retainedPixels:result.retainedPixels,retainedBackingBytes:result.retainedBackingBytes,
      surfaces:result.pixels,sha256:createHash('sha256').update(png).digest('hex'),
      pngBytes:png.length,seed:result.recipe.seed,photo:result.recipe.photoLook?.presetId};
    console.log('AGENT2_RENDER_RESOURCE_EVIDENCE '+JSON.stringify(record));
    if(width<=280&&process.env.ROYGBIV_PRINT_IMAGE==='1')
      console.log('AGENT2_ART_PNG_BASE64 '+result.png);
    assert.equal(result.retainedPixels,0,'Temporary renderer Canvas2D backing stores must be released at return');
  }
  assert.deepEqual(errors,[],'No page errors');
}finally{await browser.close();await new Promise(ok=>server.close(ok));}
