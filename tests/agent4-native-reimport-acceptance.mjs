#!/usr/bin/env node
/**
 * Agent 4: original mobile Download -> real 3024x6552 PNG -> original mobile
 * file-input Import -> exact recipe restore -> Undo, with production worker and
 * compatibility main-thread Canvas2D export paths.
 */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {encodeRecipe,decodeRecipe,normalizeRecipe,OUTPUT_WIDTH,OUTPUT_HEIGHT} from '../src/model.js';
import {extractPngRecipe,serializePngRecipe,embedPngMetadata} from '../src/png-metadata.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/agent4-native-reimport');
await mkdir(out,{recursive:true});
const fixtures=[
  {name:'worker-radial',disableWorker:false,
   recipe:normalizeRecipe({
     seed:'a4-native-worker-radial',structure:'radial',radialMode:'pinwheel',
     rayCount:28,rayTwist:57,rayRotation:25,viewZoom:1.27,
     viewPanX:-10,viewPanY:7,material:'none',motif:'solid',
     stripeShadowStrength:0,lightingMood:'off'
   })},
  {name:'worker-large-interior-recipe',disableWorker:false,
   recipe:normalizeRecipe({
     seed:'a4-native-over-64k',structure:'regions',regionMode:'nested',
     regionCount:21,viewZoom:.75,viewPanY:-8,
     material:'none',motif:'solid',lightingMood:'off',
     stripeShadowStrength:0,lockedSettings:['regionMode','interiorElements'],
     interiorElements:Array.from({length:5},(_,j)=>({
       id:'large-ink-'+j,enabled:false,type:'line',
       shape:'wave',placement:'contour',color:'custom',
       customColor:'#22aacc',objectIds:Array.from({length:200},(_,i)=>
         'region-'+j+'-'+String(i).padStart(3,'0')+'-'+
         String(j*200+i).padStart(3,'0').repeat(30).slice(0,82))
     }))
   })},
  {name:'compatibility-paths',disableWorker:true,
   recipe:normalizeRecipe({
     seed:'a4-native-fallback-paths',structure:'paths',geometry:'hairpin',
     turnRadius:68,hairpinAngle:140,viewZoom:.72,viewPanX:12,viewPanY:-9,
     positionX:3,positionY:-4,material:'none',motif:'solid',
     lightingMood:'off',stripeShadowStrength:0,lockedSettings:['geometry']
   })}
];
const browser=await chromium.launch({headless:true});
const observations=[],errors=[];
try{
 for(const fixture of fixtures){
  const context=await browser.newContext({
    viewport:{width:412,height:892},isMobile:true,hasTouch:true,
    acceptDownloads:true,reducedMotion:'reduce'
  });
  if(fixture.disableWorker)await context.addInitScript(()=>{
    Object.defineProperty(window,'Worker',{value:undefined,configurable:true});
    Object.defineProperty(window,'OffscreenCanvas',{value:undefined,configurable:true});
  });
  const page=await context.newPage();
  page.setDefaultTimeout(25000);
  page.on('pageerror',error=>errors.push({fixture:fixture.name,pageerror:String(error)}));
  try{
   if(fixture.name==='worker-large-interior-recipe'){
     // Static hosts may reject an enormous initial GET query before app JS
     // runs. Importing the identical recipe through the original PNG UI is
     // the supported alternative, and the native exporter is tested from
     // precisely that fully restored application state.
     const small=normalizeRecipe({seed:'before-large-native-export'});
     await page.goto(origin+'/?r='+encodeRecipe(small),
       {waitUntil:'domcontentloaded'});
     const tiny=Buffer.from(
       'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/9QAAAABJRU5ErkJggg==','base64');
     const embedded=Buffer.from(embedPngMetadata(tiny,{},
       {recipe:fixture.recipe}));
     await page.locator('#mobileMore').click();
     await page.locator('#importRecipeFile').setInputFiles({
       name:'large-native-export-source.png',mimeType:'image/png',
       buffer:embedded
     });
     await page.waitForFunction(seed=>document.querySelector('#seedInput')
       ?.value===seed,fixture.recipe.seed,{timeout:90000});
     await page.locator('#mobileToolsClose').click();
   }else{
     await page.goto(origin+'/?r='+encodeRecipe(fixture.recipe),
       {waitUntil:'domcontentloaded'});
   }
   assert.deepEqual(decodeRecipe(new URL(page.url()).searchParams.get('r')),
     fixture.recipe);
   const runtime=await page.evaluate(()=>({
     Worker:typeof Worker,OffscreenCanvas:typeof OffscreenCanvas
   }));
   if(fixture.disableWorker)assert.deepEqual(runtime,{
     Worker:'undefined',OffscreenCanvas:'undefined'
   },'Compatibility scenario accidentally used the worker export path');
   else assert.equal(runtime.Worker,'function',
     'Normal Chromium fixture unexpectedly lacks Worker capability');
   const pending=page.waitForEvent('download',{timeout:180000});
   await page.locator('#mobileDownload').click();
   const download=await pending;
   const bytes=await readFile(await download.path());
   assert.deepEqual([...bytes.subarray(0,8)],
     [137,80,78,71,13,10,26,10],'Downloaded file is not PNG');
   assert.equal(bytes.readUInt32BE(16),OUTPUT_WIDTH);
   assert.equal(bytes.readUInt32BE(20),OUTPUT_HEIGHT);
   assert.deepEqual(extractPngRecipe(bytes),fixture.recipe,
     'Native PNG lost source settings');
   if(fixture.name==='worker-large-interior-recipe'){
     const size=Buffer.byteLength(serializePngRecipe(fixture.recipe),'utf8');
     assert.ok(size>65536&&size<1024*1024,
       'Native download fixture does not challenge the 64 KiB reader boundary');
   }
   assert.match(download.suggestedFilename(),/3024x6552\.png$/);

   // The actual downloaded IDAT is decoded in Chromium and compared against
   // the direct production renderer at 300x650. Reject blank/background-only
   // matches, and ignore rapidly varying edge pixels when testing geometry.
   const metrics=await page.evaluate(async({encoded,recipe})=>{
     const image=new Image();
     await new Promise((resolve,reject)=>{
       image.onload=resolve;image.onerror=()=>reject(Error('Native PNG decode failed'));
       image.src='data:image/png;base64,'+encoded;
     });
     const {drawWallpaper}=await import('/src/renderer.js');
     const width=300,height=650;
     const scaled=document.createElement('canvas');
     scaled.width=width;scaled.height=height;
     const scaledContext=scaled.getContext('2d',{willReadFrequently:true});
     scaledContext.drawImage(image,0,0,width,height);
     const native=scaledContext.getImageData(0,0,width,height).data;
     const direct=document.createElement('canvas');
     direct.width=width;direct.height=height;
     drawWallpaper(direct,recipe);
     const reference=direct.getContext('2d',{willReadFrequently:true})
       .getImageData(0,0,width,height).data;
     const channel=(pixels,x,y)=>{
       const i=4*(y*width+x);
       return [pixels[i],pixels[i+1],pixels[i+2]];
     };
     const delta=(a,b)=>Math.max(...a.map((value,i)=>Math.abs(value-b[i])));
     let stable=0,colored=0,mismatched=0,coloredMismatch=0;
     for(let y=10;y<height-10;y+=9)for(let x=10;x<width-10;x+=9){
       const a=channel(reference,x,y),b=channel(native,x,y);
       if([[2,0],[-2,0],[0,2],[0,-2],[2,2],[-2,-2]]
         .some(([dx,dy])=>delta(a,channel(reference,x+dx,y+dy))>8))continue;
       const ink=Math.max(...a)>75&&Math.max(...a)-Math.min(...a)>36;
       stable++;if(ink)colored++;
       if(delta(a,b)>28){mismatched++;if(ink)coloredMismatch++;}
     }
     scaled.width=scaled.height=direct.width=direct.height=0;
     return {decoded:[image.naturalWidth,image.naturalHeight],
       stable,colored,mismatched,coloredMismatch,
       mismatchRatio:stable?mismatched/stable:null,
       coloredMismatchRatio:colored?coloredMismatch/colored:null};
   },{encoded:bytes.toString('base64'),recipe:fixture.recipe});
   assert.deepEqual(metrics.decoded,[OUTPUT_WIDTH,OUTPUT_HEIGHT]);
   assert.ok(metrics.stable>=250&&metrics.colored>=55,
     'Insufficient stable painted pixel witnesses');
   assert.ok(metrics.mismatchRatio<=.05&&metrics.coloredMismatchRatio<=.08,
     'Downloaded PNG pixels diverge from source renderer');

   // Restore from the SAME downloaded native file, not a tiny synthetic PNG.
   const different=normalizeRecipe({seed:'a4-before-native-import',
     structure:'regions',regionMode:'voronoi',viewZoom:.9});
   await page.goto(origin+'/?r='+encodeRecipe(different),
     {waitUntil:'domcontentloaded'});
   await page.locator('#mobileMore').click();
   await page.locator('#importRecipeFile').setInputFiles({
     name:download.suggestedFilename(),mimeType:'image/png',buffer:bytes});
   await page.waitForFunction(seed=>document.querySelector('#seedInput')?.value===seed,
     fixture.recipe.seed,{timeout:90000});
   assert.deepEqual(decodeRecipe(new URL(page.url()).searchParams.get('r')),
     fixture.recipe,'Native file input did not restore all source settings');
   assert.match(await page.locator('#studioStatus').textContent(),
     /Restored original wallpaper settings from PNG recipe/);
   await page.locator('#mobileToolsClose').click();
   await page.locator('#undo').click();
   assert.deepEqual(decodeRecipe(new URL(page.url()).searchParams.get('r')),
     different,'Native import Undo did not restore exact previous design');
   const observation={fixture:fixture.name,compatibility:fixture.disableWorker,
     runtime,filename:download.suggestedFilename(),bytes:bytes.length,
     nativeDimensions:[OUTPUT_WIDTH,OUTPUT_HEIGHT],metrics,
     exactSourceImport:true,undoRestoresPrior:true};
   observations.push(observation);
   console.log('AGENT4_NATIVE_REIMPORT_PASS',JSON.stringify(observation));
   await page.screenshot({path:join(out,fixture.name+'.png'),animations:'disabled'});
  }catch(error){
   // Avoid logging a 100 KB source URL in a Playwright navigation stack.
   const brief=String(error).slice(0,800);
   errors.push({fixture:fixture.name,message:brief,
     stack:String(error.stack||'').slice(0,1200)});
   await page.screenshot({path:join(out,'failure-'+fixture.name+'.png'),
     animations:'disabled'}).catch(()=>{});
  }finally{await context.close();}
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({
   classification:errors.length?'not verified':'real native 3024x6552 export, source file-input reimport and Undo',
   observations,errors,
   limitations:['physical Android OS downloads/picker','all material combinations',
     'foreground pixel tolerance accommodates Canvas2D raster downsampling']
 },null,2));
 assert.deepEqual(errors,[],'Native worker/fallback re-import acceptance failed');
 console.log('AGENT4_NATIVE_REIMPORT_SUCCESS');
}finally{await browser.close();}
