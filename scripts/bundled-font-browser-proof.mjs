#!/usr/bin/env node
// Limited actual-source Chromium proof, executed once, not an always-on gate.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {dirname,resolve,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=join(root,'output','bundled-typefaces');
await mkdir(output,{recursive:true});
const types={'.js':'text/javascript','.css':'text/css','.json':'application/json',
  '.html':'text/html','.ttf':'font/ttf','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
  try{
    const file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!file.startsWith(root+'/')&&file!==root){res.writeHead(403).end();return;}
    const chosen=file===root?join(root,'index.html'):file;
    res.writeHead(200,{'Content-Type':types[extname(chosen)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(await readFile(chosen));
  }catch{res.writeHead(404).end('Not found');}
});
let browser;
try{
  await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:412,height:892},deviceScaleFactor:1});
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e.message)));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.editor-tool-card[data-editor-tool="typography"]',{state:'attached'});
  await page.locator('#mobileEdit').click();
  await page.locator('.settings-tab[data-tab="details"]').click();
  await page.locator('.editor-tool-tab[data-editor-tool="typography"]').click();
  await page.locator('[data-text-add]').click();
  await page.locator('[data-text-key="text"]').fill('TYPE PARADE');
  await page.locator('[data-text-key="text"]').blur();
  const select=page.locator('[data-text-key="font"]');
  const bundledOptions=await select.locator('option[value^="pack-"]').count();
  assert.equal(bundledOptions,27);
  await select.selectOption('pack-bangers');
  await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false');
  await page.locator('#preview').screenshot({path:join(output,'poster-bangers-preview.png')});

  const result=await page.evaluate(async()=>{
    const {drawWallpaper}=await import('/src/renderer.js');
    const {normalizeRecipe}=await import('/src/model.js');
    const {prepareTypefaces,typefacesReady}=await import('/src/typography-fonts.js');
    const {BUNDLED_FONTS}=await import('/src/bundled-fonts.js');
    const {exportWallpaperInWorker}=await import('/src/render-coordinator.js');
    const fontIds=['pack-bangers','pack-pacifico','pack-cinzel',
      'pack-pressstart2p','pack-rubikwetpaint','pack-bungeeshade'];
    const make=()=>{const c=document.createElement('canvas');c.width=360;c.height=780;return c;};
    const pixels=c=>c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,360,780).data;
    const evidence=[];
    for(const font of fontIds){
      const recipe=normalizeRecipe({seed:'bundle-'+font,orientation:'diagonal',
        textOverlays:[{id:'one',text:'RAINBOW\nTYPE',font,colour:'rainbow-letter',
          size:76,x:50,y:45,outline:'black',outlineWidth:7}]});
      await prepareTypefaces(recipe);
      if(!typefacesReady(recipe))throw Error('Font never became ready: '+font);
      const a=make(),b=make(),defaultFace=make();
      drawWallpaper(a,recipe);
      drawWallpaper(defaultFace,{...recipe,textOverlays:recipe.textOverlays
        .map(item=>({...item,font:'modern'}))});
      const workerBlob=await exportWallpaperInWorker({recipe,width:360,height:780,timeoutMs:90000});
      const bitmap=await createImageBitmap(workerBlob);
      b.getContext('2d').drawImage(bitmap,0,0);bitmap.close();
      const A=pixels(a),B=pixels(b),C=pixels(defaultFace);
      let workerDiff=0,presetDiff=0;
      for(let i=0;i<A.length;i+=4)for(let c=0;c<3;c++){
        if(A[i+c]!==B[i+c])workerDiff++;
        if(A[i+c]!==C[i+c])presetDiff++;
      }
      if(workerDiff)throw Error(font+' worker/refer mismatched '+workerDiff+' RGB channels');
      if(presetDiff<300)throw Error(font+' appears to be fallback font, not bundled face');
      evidence.push({id:font,workerRgbDifferences:workerDiff,
        distinctPresetRgbChannels:presetDiff});
    }
    // All 27 must load from their checked bytes into the native main-thread
    // FontFaceSet even when this small proof renders only six larger PNGs.
    const all=Object.keys(BUNDLED_FONTS);
    for(const font of all)await prepareTypefaces({textOverlays:[{font,text:'READY'}]});
    return {bundleFaces:all.length,renderedFaces:evidence.length,rendered:evidence};
  });
  assert.equal(result.bundleFaces,27);
  assert.deepEqual(pageErrors,[]);
  const proof={status:'PASS',viewport:'emulated Chromium 412x892, not Pixel',
    chooserBundledOptions:bundledOptions,pageErrors,results:result};
  await writeFile(join(output,'report.json'),JSON.stringify(proof,null,2)+'\n');
  console.log('BUNDLED FONT SOURCE PROOF '+JSON.stringify(proof));
}finally{await browser?.close();server.close();}
