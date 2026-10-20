#!/usr/bin/env node
/** Independent Agent 4 actual JSON download / PNG import transport witnesses. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe,
  OUTPUT_WIDTH,OUTPUT_HEIGHT} from '../src/model.js';
import {embedPngMetadata} from '../src/png-metadata.js';
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/agent4-json');
await mkdir(out,{recursive:true});
const tiny=Buffer.from(
 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/9QAAAABJRU5ErkJggg==','base64');
const fixtures=[
 {seed:'a4-paths-weave',structure:'paths',geometry:'drawn',
  customPath:[[-.25,.1],[.4,.45],[1.2,.8]],drawnAnchors:[1],
  crossingMode:'weave',extendDrawnPath:true,viewZoom:.65,viewPanX:15},
 {seed:'a4-paths-straight',structure:'paths',geometry:'straight',
  stripeWidth:77,composition:'repeat',viewPanY:-12,mirrorHorizontal:true},
 {seed:'a4-radial',structure:'radial',radialMode:'pinwheel',
  rayCount:35,rayTwist:95,viewZoom:1.25,viewPanX:-15},
 {seed:'a4-voronoi',structure:'regions',regionMode:'voronoi',
  regionCount:28,regionJitter:72,viewZoom:.75,positionY:9},
 {seed:'a4-nested-three-layers',structure:'regions',regionMode:'nested',
  regionSides:9,material:'linen',textureStrength:60,
  textureLayer2Enabled:true,material2:'foil',textureRotation2:175.5,
  textureLayer3Enabled:true,material3:'denim',textureRotation3:35.5,
  interiorElements:[{id:'a4-line',type:'line',shape:'wave',
    color:'custom',customColor:'#25adbd',placement:'contour'}]},
 {seed:'a4-inactive-tonal',structure:'paths',construction:'tonal',
  tonalContrast:73,lockedSettings:['construction','tonalContrast']}
].map(normalizeRecipe);
const browser=await chromium.launch({headless:true});
const evidence=[],errors=[];
try{
 const context=await browser.newContext({viewport:{width:412,height:892},
   isMobile:true,hasTouch:true,acceptDownloads:true,reducedMotion:'reduce'});
 const page=await context.newPage();
 page.setDefaultTimeout(18000);
 page.on('pageerror',e=>errors.push(String(e)));
 for(const recipe of fixtures){
  try{
   await page.goto(origin+'/?r='+encodeRecipe(recipe),{waitUntil:'domcontentloaded'});
   assert.deepEqual(decodeRecipe(new URL(page.url()).searchParams.get('r')),recipe);
   await page.locator('#mobileMore').click();
   const requested=page.waitForEvent('download');
   await page.locator('#downloadRecipe').click();
   const downloaded=await requested;
   const bytes=await readFile(await downloaded.path());
   const json=JSON.parse(bytes.toString('utf8'));
   assert.deepEqual(json,recipe,'Source Download JSON lost recipe values');
   assert.deepEqual(decodeRecipe(encodeRecipe(json)),recipe,'JSON URL restoration diverged');
   assert.deepEqual(resolveScene(json),resolveScene(recipe),'JSON changed scene');
   assert.match(downloaded.suggestedFilename(),/\.json$/);
   // The PNG import control is exercised with an embedded representation of
   // the exact *real downloaded JSON*, not a hand-assembled replacement recipe.
   // Native 3024x6552 IDAT fidelity is checked separately by the existing
   // real-download browser suite (the 1px fixture proves transport only).
   const png=Buffer.from(embedPngMetadata(tiny,{}, {recipe:json}));
   await page.locator('#importRecipeFile').setInputFiles({
     name:'transport.png',mimeType:'image/png',buffer:png});
   await page.waitForFunction(seed=>document.getElementById('seedInput')?.value===seed,
     recipe.seed);
   assert.deepEqual(decodeRecipe(new URL(page.url()).searchParams.get('r')),recipe,
     'Actual source PNG file-input handler lost JSON-exported design');
   evidence.push({seed:recipe.seed,structure:recipe.structure,
     geometry:recipe.geometry,regionMode:recipe.regionMode,
     bytes:bytes.length,filename:downloaded.suggestedFilename(),
     jsonExact:true,sourcePngImportExact:true,sceneExact:true,
     nativeOutputContract:[OUTPUT_WIDTH,OUTPUT_HEIGHT]});
   console.log('AGENT4_JSON_ROUNDTRIP',JSON.stringify(evidence.at(-1)));
  }catch(e){errors.push({seed:recipe.seed,message:String(e),stack:e.stack});
   await page.screenshot({path:join(out,'failure-'+recipe.seed+'.png'),
     animations:'disabled'}).catch(()=>{});}
 }
 // Older PNG metadata exporters appended a later recipe without deleting
 // their earlier iTXt. Exercise the REAL file-input handler with that legacy
 // shape, not just the pure decoder, and confirm restoration is the last one.
 try{
  const original=normalizeRecipe({seed:'a4-old-png-recipe',structure:'paths',
    geometry:'straight',viewZoom:.7});
  const latest=normalizeRecipe({seed:'a4-latest-png-recipe',structure:'regions',
    regionMode:'nested',viewPanX:13,lockedSettings:['regionMode']});
  const originalPng=Buffer.from(embedPngMetadata(tiny,{}, {recipe:original}));
  const latestPng=Buffer.from(embedPngMetadata(tiny,{}, {recipe:latest}));
  const recipeStart=latestPng.indexOf(Buffer.from('ROYGBIV Recipe'));
  assert.ok(recipeStart>12);
  const chunkStart=recipeStart-8,chunkLength=latestPng.readUInt32BE(chunkStart)+12;
  const newChunk=latestPng.subarray(chunkStart,chunkStart+chunkLength);
  const pngTypeAt=(png,name)=>{
    let at=8;
    while(at+12<=png.length){
      const len=png.readUInt32BE(at);
      if(png.toString('ascii',at+4,at+8)===name)return at;
      at+=len+12;
    }
    throw Error('Missing PNG chunk '+name);
  };
  const iend=pngTypeAt(originalPng,'IEND');
  const legacy=Buffer.concat([originalPng.subarray(0,iend),newChunk,
    originalPng.subarray(iend)]);
  await page.goto(origin+'/?r='+encodeRecipe(original),{waitUntil:'domcontentloaded'});
  await page.locator('#mobileMore').click();
  await page.locator('#importRecipeFile').setInputFiles({
    name:'legacy-double-recipe.png',mimeType:'image/png',buffer:legacy});
  await page.waitForFunction(seed=>document.querySelector('#seedInput')?.value===seed,
    latest.seed);
  assert.deepEqual(decodeRecipe(new URL(page.url()).searchParams.get('r')),latest,
    'Real PNG import used stale first embedded recipe instead of newest valid one');
  assert.match(await page.locator('#studioStatus').textContent(),
    /Restored original wallpaper settings from PNG recipe/);
  evidence.push({seed:latest.seed,kind:'legacy-double-recipe-import',
    newerRecipeRestored:true,sourceFileInput:true});
  console.log('AGENT4_LEGACY_DOUBLE_RECIPE_BROWSER',JSON.stringify(evidence.at(-1)));
 }catch(e){
  errors.push({name:'legacy-double-recipe-import',message:String(e),stack:e.stack});
  await page.screenshot({path:join(out,'failure-legacy-double-recipe.png'),
    animations:'disabled'}).catch(()=>{});
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({
  classification:errors.length?'not verified':'source JSON download and PNG-import round trips',
  evidence,errors,limitations:['transport PNG is a 1x1 codec fixture, not rendered image',
    'native 19.8MP PNG output is tested by separate browser suite',
    'not every material blend / conditional export combination']
 },null,2));
 assert.deepEqual(errors,[],'Real JSON/PNG transport workflow failed');
 console.log('AGENT4_JSON_SUCCESS');
 await context.close();
}finally{await browser.close();}
