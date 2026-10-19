#!/usr/bin/env node
/**
 * Independent Agent 3 real Chromium Download-button PNG acceptance.
 * Tests the native file actually delivered by the application, not a synthetic
 * PNG embedded in a test and not the renderer alone.
 */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,OUTPUT_WIDTH,OUTPUT_HEIGHT} from '../src/model.js';
import {extractPngRecipe} from '../src/png-metadata.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve(process.env.ROYGBIV_NATIVE_OUT||'artifacts/agent3-native-download');
await mkdir(out,{recursive:true});
const fixtures=[
  {name:'drawn-extrapolated-native',comparePixels:true,recipe:normalizeRecipe({
    seed:'a3-pixel-drawn',structure:'paths',geometry:'drawn',
    customPath:[[-.2,.18],[.36,.33],[.67,.61],[1.2,.84]],
    drawnAnchors:[1,2],extendDrawnPath:true,
    stripeWidth:92,spread:45,viewZoom:1.12,viewPanX:5,viewPanY:-5,
    material:'none',background:'black'
  })},
  {name:'nested-layered-interior-native',comparePixels:false,recipe:normalizeRecipe({
    seed:'a3-downloaded-nested-native',structure:'regions',regionMode:'nested',
    regionCount:16,regionSides:9,regionJitter:71,viewZoom:.72,
    viewPanX:-15,viewPanY:10,positionX:6,positionY:-3,
    material:'construction',textureStrength:66,textureLayer2Enabled:true,
    material2:'linen',textureStrength2:32,textureRotation2:97.5,
    textureLayer3Enabled:true,material3:'foil',textureStrength3:81,
    textureRotation3:227.5,
    interiorElements:[{id:'a3-contour-native',type:'line',shape:'wave',
      placement:'contour',color:'custom',customColor:'#3ae8bd',
      colorSlots:[0,2,4,6],frequency:24,phase:320,width:2.5,enabled:true}]
  })}
];
const browser=await chromium.launch({headless:true});
const observations=[],errors=[];
try{
  const context=await browser.newContext({
    viewport:{width:412,height:892},isMobile:true,hasTouch:true,
    acceptDownloads:true,reducedMotion:'reduce'
  });
  const page=await context.newPage();
  page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(String(e)));
  for(const fixture of fixtures){
    await page.goto(origin+'/?r='+encodeRecipe(fixture.recipe),{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.body.classList.contains('mobile-five-nav'));
    const encoded=new URL(page.url()).searchParams.get('r');
    assert.ok(encoded,'Browser must retain the live recipe in URL');
    const capture=page.waitForEvent('download',{timeout:180000});
    // Real pointer click on the source-wired compact Download shortcut.
    await page.locator('#mobileDownload').click();
    const download=await capture;
    const name=download.suggestedFilename();
    const bytes=await readFile(await download.path());
    assert.ok(name.includes(fixture.recipe.seed+'-'+OUTPUT_WIDTH+'x'+OUTPUT_HEIGHT),
      'Native download filename unexpectedly changed: '+name);
    assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10],
      'Downloaded file is not a PNG');
    assert.equal(bytes.readUInt32BE(16),OUTPUT_WIDTH,'Downloaded native PNG width');
    assert.equal(bytes.readUInt32BE(20),OUTPUT_HEIGHT,'Downloaded native PNG height');
    assert.deepEqual(extractPngRecipe(bytes),fixture.recipe,
      'Actual native PNG dropped or changed source recipe fields');
    const observation={name:fixture.name,filename:name,bytes:bytes.length,
      dimensions:[OUTPUT_WIDTH,OUTPUT_HEIGHT],embeddedRecipe:true};
    // Compare genuine native downloaded pixels against the main-thread
    // preview renderer, not merely preview vs preview. Textured-material cases
    // are validated for nonempty decoded output and metadata, not exact texture
    // equality because texture paths may use different sampling.
    const metrics=await page.evaluate(async({base64,recipe,comparePixels})=>{
      const {drawWallpaper}=await import('/src/renderer.js');
      const img=new Image();
      await new Promise((resolve,reject)=>{
        img.onload=resolve;img.onerror=()=>reject(Error('Downloaded PNG failed browser decode'));
        img.src='data:image/png;base64,'+base64;
      });
      // This scale was foreground-qualified for the same off-frame Drawn
      // path in the direct world-pixel test; 600x1300/17 missed every narrow
      // painted region even though thousands of background samples matched.
      const width=300,height=650;
      const scaled=document.createElement('canvas');
      scaled.width=width;scaled.height=height;
      const ctx=scaled.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(img,0,0,width,height);
      const downloadPixels=ctx.getImageData(0,0,width,height).data;
      const direct=document.createElement('canvas');
      direct.width=width;direct.height=height;
      drawWallpaper(direct,recipe);
      const original=direct.getContext('2d',{willReadFrequently:true})
        .getImageData(0,0,width,height).data;
      const channel=(data,x,y)=>{
        const i=(y*width+x)*4;return [data[i],data[i+1],data[i+2]];
      };
      const delta=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
      let stable=0,colored=0,mismatch=0,coloredMismatch=0;
      const distinct=new Set(),examples=[];
      for(let y=10;y<height-10;y+=11){
        for(let x=10;x<width-10;x+=11){
          const a=channel(original,x,y),b=channel(downloadPixels,x,y);
          distinct.add(b.map(v=>Math.round(v/24)).join(':'));
          if(!comparePixels)continue;
          if([[2,0],[-2,0],[0,2],[0,-2],[2,2],[-2,-2]]
            .some(([dx,dy])=>delta(a,channel(original,x+dx,y+dy))>8))continue;
          const ink=Math.max(...a)>75&&Math.max(...a)-Math.min(...a)>36;
          stable++;
          if(ink)colored++;
          if(delta(a,b)>28){
            mismatch++;
            if(ink)coloredMismatch++;
            if(examples.length<7)examples.push({x,y,direct:a,native:b});
          }
        }
      }
      scaled.width=scaled.height=direct.width=direct.height=0;
      return {decoded:[img.naturalWidth,img.naturalHeight],
        distinctColorBuckets:distinct.size,stable,colored,mismatch,coloredMismatch,
        mismatchRatio:stable?mismatch/stable:null,
        coloredMismatchRatio:colored?coloredMismatch/colored:null,examples};
    },{base64:bytes.toString('base64'),recipe:fixture.recipe,
      comparePixels:fixture.comparePixels});
    Object.assign(observation,{metrics});
    observations.push(observation);
    console.log('AGENT3_NATIVE_DOWNLOAD_MEASURED',JSON.stringify(observation));
    assert.deepEqual(metrics.decoded,[OUTPUT_WIDTH,OUTPUT_HEIGHT],
      'Native PNG browser-decoded at an unexpected size');
    assert.ok(metrics.distinctColorBuckets>=12,
      'Downloaded native PNG has insufficient image colour variety');
    if(fixture.comparePixels){
      assert.ok(metrics.stable>=300,'Insufficient stable native-vs-preview pixels');
      assert.ok(metrics.colored>=70,'Insufficient painted native-vs-preview pixels');
      assert.ok(metrics.mismatchRatio<=.04,
        'Native PNG artwork disagrees with direct renderer');
      assert.ok(metrics.coloredMismatchRatio<=.06,
        'Native PNG painted foreground geometry disagrees with direct renderer');
    }
    console.log('AGENT3_NATIVE_DOWNLOAD_QUALIFIED',JSON.stringify(observation));
  }
  assert.deepEqual(errors,[],'Uncaught page errors during actual PNG download');
  await writeFile(join(out,'evidence.json'),JSON.stringify({
    classification:'behavior-verified for two tested real native browser downloads',
    exclusions:['physical Android Chrome','OS file-picker integration',
      'exact texture-pixel equality','all recipe variants','canonical visual review'],
    observations,errors
  },null,2));
  console.log('AGENT3_NATIVE_DOWNLOAD_SUCCESS');
  await context.close();
}catch(error){
  await writeFile(join(out,'failure.json'),JSON.stringify({
    classification:'not verified',message:String(error),stack:error.stack,
    observations,errors
  },null,2));
  throw error;
}finally{
  await browser.close();
}
