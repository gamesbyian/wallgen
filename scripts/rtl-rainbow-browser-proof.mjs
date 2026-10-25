#!/usr/bin/env node
// One-shot production Chromium witness: actual native Arabic/Hebrew shaping,
// intentional RTL hue reversal and direct-vs-worker painter parity.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'output','rtl-rainbow');
await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.json':'application/json','.ttf':'font/ttf','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
  try{
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!path.startsWith(root+'/')&&path!==root){res.writeHead(403).end();return;}
    const file=path===root?join(root,'index.html'):path;
    res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(await readFile(file));
  }catch{res.writeHead(404).end('Not Found');}
});
let browser;
try{
  await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:412,height:892}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{
    waitUntil:'domcontentloaded'});
  const result=await page.evaluate(async()=>{
    const {normalizeRecipe,resolveScene}=await import('/src/model.js');
    const {drawWallpaper}=await import('/src/renderer.js');
    const {drawTextOverlays}=await import('/src/text-overlay-renderer.js');
    const {typefaceCssFamily}=await import('/src/typography-fonts.js');
    const {availableTextWidth}=await import('/src/text-direct-geometry.js');
    const {isSimpleRightToLeft}=await import('/src/text-rainbow-shaping.js');
    const {exportWallpaperInWorker}=await import('/src/render-coordinator.js');
    const cases=[
      {id:'arabic-letter',text:'السَّلَامُ عَلَيْكُمْ',colour:'rainbow-letter',rtl:true},
      {id:'hebrew-word',text:'שלום עולם',colour:'rainbow-word',rtl:true},
      {id:'arabic-word',text:'مرحبا بالعالم',colour:'rainbow-word',rtl:true},
      {id:'mixed-conservative',text:'HELLO שלום',colour:'rainbow-letter',rtl:false},
    ];
    const make=(w,h)=>{
      const canvas=document.createElement('canvas');
      canvas.width=w;canvas.height=h;return canvas;
    };
    const raw=canvas=>canvas.getContext('2d',{willReadFrequently:true})
      .getImageData(0,0,canvas.width,canvas.height).data;
    const results=[],images=[],thumb=make(120*cases.length,260);
    const thumbCtx=thumb.getContext('2d');
    for(const [i,spec] of cases.entries()){
      if(isSimpleRightToLeft(spec.text)!==spec.rtl)
        throw Error('Strong-direction detector incorrect for '+spec.id);
      const recipe=normalizeRecipe({seed:'rtl-native-'+spec.id,palette:'classic',
        textOverlays:[{id:'sample',text:spec.text,colour:spec.colour,
          outline:'none',font:'modern',size:62,x:50,y:50}]});
      const item=recipe.textOverlays[0],scene=resolveScene(recipe);
      const rainbow=make(600,1300),native=make(600,1300);
      drawTextOverlays(rainbow.getContext('2d'),600,1300,scene);
      const ctx=native.getContext('2d');
      ctx.save();
      ctx.translate(600*item.x/100,1300*item.y/100);
      ctx.rotate(item.rotation*Math.PI/180);
      ctx.font='bold '+item.size+'px '+typefaceCssFamily(item.font);
      ctx.textBaseline='middle';ctx.textAlign='left';
      const full=ctx.measureText(item.text).width;
      const room=availableTextWidth(item);
      ctx.scale(full>room?room/full:1,1);
      ctx.fillStyle='#fff';ctx.fillText(item.text,-full/2,0);
      ctx.restore();
      const a=raw(rainbow),b=raw(native);
      let changed=0,ink=0,maskDifferent=0,maxAlphaDelta=0;
      for(let j=3;j<a.length;j+=4){
        if(a[j])ink++;
        if((a[j]>127)!==(b[j]>127))maskDifferent++;
        const delta=Math.abs(a[j]-b[j]);
        if(delta){changed++;maxAlphaDelta=Math.max(maxAlphaDelta,delta);}
      }
      if(ink<1000||maskDifferent>ink*.01||maxAlphaDelta>16)
        throw Error('Native script silhouette drift '+JSON.stringify({
          id:spec.id,ink,maskDifferent,maxAlphaDelta
        }));
      const width=360,height=780,ref=make(width,height),worker=make(width,height);
      drawWallpaper(ref,recipe);
      const blob=await exportWallpaperInWorker({recipe,width,height,timeoutMs:90000});
      const bmp=await createImageBitmap(blob);
      worker.getContext('2d').drawImage(bmp,0,0);bmp.close();
      const x=raw(ref),y=raw(worker);let workerDifferences=0;
      for(let j=0;j<x.length;j++)if(x[j]!==y[j])workerDifferences++;
      if(workerDifferences)throw Error('Worker drift '+spec.id);
      thumbCtx.drawImage(ref,i*120,0,120,260);
      images.push(ref.toDataURL('image/png'));
      results.push({id:spec.id,rtl:spec.rtl,
        nativeInkPixels:ink,alphaDifferencePixels:changed,
        binaryMaskDifference:maskDifferent,maxAlphaDelta,
        workerDifferentChannels:workerDifferences,pngBytes:blob.size});
      ref.width=0;worker.width=0;rainbow.width=0;native.width=0;
    }
    window.__rtlImages=images;
    window.__rtlSheet=thumb.toDataURL('image/png');
    return results;
  });
  for(let i=0;i<result.length;i++){
    const data=await page.evaluate(i=>window.__rtlImages[i],i);
    await writeFile(join(out,result[i].id+'.png'),
      Buffer.from(data.split(',')[1],'base64'));
  }
  const sheet=await page.evaluate(()=>window.__rtlSheet);
  await writeFile(join(out,'rtl-native-wallpaper-sheet.png'),
    Buffer.from(sheet.split(',')[1],'base64'));
  console.log('RTL_WALLPAPER_SHEET_BASE64='+sheet.split(',')[1]);
  assert.deepEqual(errors,[]);
  const proof={status:'PASS',browser:'actual Chromium 412x892 emulated, not Pixel',
    errors,result};
  await writeFile(join(out,'report.json'),JSON.stringify(proof,null,2)+'\n');
  console.log('RTL RAINBOW SHAPING PROOF '+JSON.stringify(proof));
}finally{await browser?.close();server.close();}
