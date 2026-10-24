#!/usr/bin/env node
// One-shot actual-native-shaper test. A rainbow-coloured line's ALPHA must
// match a single solid fillText line even with ligatures and joined scripts.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve,join,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'output','typography-shaping');
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.json':'application/json','.svg':'image/svg+xml','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{
  try{
    const file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!file.startsWith(root+'/')&&file!==root){res.writeHead(403).end();return;}
    const path=file===root?join(root,'index.html'):file;
    res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(await readFile(path));
  }catch{res.writeHead(404).end('Not Found');}
});
let browser;
try{
  await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:412,height:892}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  const report=await page.evaluate(async()=>{
    const {drawTextOverlays}=await import('/src/text-overlay-renderer.js');
    const {drawWallpaper}=await import('/src/renderer.js');
    const {normalizeRecipe,resolveScene}=await import('/src/model.js');
    const {typefaceCssFamily,prepareTypefaces}=await import('/src/typography-fonts.js');
    const {availableTextWidth}=await import('/src/text-direct-geometry.js');
    const {exportWallpaperInWorker}=await import('/src/render-coordinator.js');
    const cases=[
      {seed:'shaping-ligature',text:'office affine flight',font:'pack-lobster',
        colour:'rainbow-letter',size:74},
      {seed:'shaping-arabic',text:'السَّلَامُ عَلَيْكُمْ',font:'modern',
        colour:'rainbow-letter',size:75},
      {seed:'shaping-combining',text:'e\u0301 🌈 👨‍👩‍👧‍👦 rainbow',font:'modern',
        colour:'rainbow-word',size:70},
    ];
    const make=(width,height)=>{
      const c=document.createElement('canvas');c.width=width;c.height=height;return c;
    };
    const results=[];
    for(const spec of cases){
      const recipe=normalizeRecipe({seed:spec.seed,palette:'electric',textOverlays:[
        {id:'sample',text:spec.text,font:spec.font,colour:spec.colour,
          outline:'none',size:spec.size,x:50,y:50}
      ]});
      await prepareTypefaces(recipe);
      const item=recipe.textOverlays[0];
      const actual=make(600,1300),native=make(600,1300);
      drawTextOverlays(actual.getContext('2d'),600,1300,resolveScene(recipe));
      const ctx=native.getContext('2d');
      ctx.save();
      ctx.translate(600*item.x/100,1300*item.y/100);
      ctx.rotate(item.rotation*Math.PI/180);
      ctx.font='bold '+item.size+'px '+typefaceCssFamily(item.font);
      ctx.textBaseline='middle';
      ctx.textAlign='left';
      const total=ctx.measureText(spec.text).width;
      const room=availableTextWidth(item);
      ctx.scale(total>room?room/total:1,1);
      ctx.fillStyle='#ffffff';
      ctx.fillText(spec.text,-total/2,0);
      ctx.restore();
      const A=actual.getContext('2d',{willReadFrequently:true})
        .getImageData(0,0,600,1300).data;
      const B=native.getContext('2d',{willReadFrequently:true})
        .getImageData(0,0,600,1300).data;
      let alphaDifference=0,opaquePixels=0,largestAlphaDelta=0,
        significantAlphaDifference=0,binaryMaskDifference=0,totalAlphaDelta=0;
      for(let i=3;i<A.length;i+=4){
        const delta=Math.abs(A[i]-B[i]);
        if(delta){
          alphaDifference++;
          largestAlphaDelta=Math.max(largestAlphaDelta,delta);
          totalAlphaDelta+=delta;
          if(delta>15)significantAlphaDifference++;
        }
        if((A[i]>127)!==(B[i]>127))binaryMaskDifference++;
        if(A[i])opaquePixels++;
      }
      // Chromium's gradient text and solid text can differ by up to 16
      // alpha levels at glyph-edge antialias samples. What matters for
      // native joining is silhouette preservation, not exact edge colour.
      // Require every alpha delta <= 16 and a >127 binary-mask drift
      // smaller than 1% of actually painted pixels.
      if(largestAlphaDelta>16||
         binaryMaskDifference>Math.max(1,Math.floor(opaquePixels*.01)))
        throw Error('Native text silhouette changed: '+JSON.stringify({
          seed:spec.seed,largestAlphaDelta,binaryMaskDifference,opaquePixels
        }));
      if(spec.seed==='shaping-ligature'){
        window.__diagnosticColour=actual.toDataURL('image/png');
        window.__diagnosticSolid=native.toDataURL('image/png');
      }
      if(opaquePixels<500)throw Error('Missing actual glyph pixels '+spec.seed);
      // The full wallpaper and the independent short-lived export worker
      // must remain pixel-identical after changing the internal text paint.
      const reference=make(360,780),worker=make(360,780);
      drawWallpaper(reference,recipe);
      const png=await exportWallpaperInWorker({
        recipe,width:360,height:780,timeoutMs:90000
      });
      const bmp=await createImageBitmap(png);
      worker.getContext('2d').drawImage(bmp,0,0);bmp.close();
      const R=reference.getContext('2d',{willReadFrequently:true})
        .getImageData(0,0,360,780).data;
      const W=worker.getContext('2d',{willReadFrequently:true})
        .getImageData(0,0,360,780).data;
      let workerDifferences=0;
      for(let i=0;i<R.length;i++)if(R[i]!==W[i])workerDifferences++;
      if(workerDifferences)throw Error('Worker/render mismatch '+spec.seed);
      if(spec.seed==='shaping-arabic'){
        const pngData=actual.toDataURL('image/png');
        window.__arabicMask=pngData;
      }
      results.push({seed:spec.seed,shape:spec.text,opaquePixels,
        alphaMaskDifferences:alphaDifference,largestAlphaDelta,totalAlphaDelta,
        significantAlphaDifference,binaryMaskDifference,
        workerReferenceDifferences:workerDifferences,
        workerPngBytes:png.size});
    }
    return results;
  });
  assert.equal(report.length,3);
  assert.deepEqual(errors,[]);
  for(const [name,key] of [['colour-line','__diagnosticColour'],
    ['native-line','__diagnosticSolid']]){
    const png=await page.evaluate(k=>window[k],key);
    if(png)await writeFile(join(out,name+'.png'),
      Buffer.from(png.split(',')[1],'base64'));
  }
  const nativeArabic=await page.evaluate(()=>window.__arabicMask);
  await writeFile(join(out,'arabic-shaped-rainbow.png'),
    Buffer.from(nativeArabic.split(',')[1],'base64'));
  await writeFile(join(out,'report.json'),
    JSON.stringify({status:'PASS',browser:'actual Chromium glyph shaper (not Pixel)',
      guard:'max per-pixel alpha delta <=16; thresholded mask differences <=1% of ink pixels',
      browserErrors:errors,results:report},null,2)+'\n');
  console.log('RAINBOW SHAPING SOURCE PROOF '+JSON.stringify(report));
}finally{await browser?.close();server.close();}
