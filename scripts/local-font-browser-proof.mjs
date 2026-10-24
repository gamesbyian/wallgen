#!/usr/bin/env node
// One-shot real-browser evidence: font parser, IndexedDB, native FontFace in
// DOM and worker, portable recipe references and missing-font refusal.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'output','local-font-proof');
await mkdir(out,{recursive:true});
const fonts=[
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf',
];
let fontBytes;
for(const name of fonts){try{fontBytes=await readFile(name);break;}catch{}}
if(!fontBytes)throw Error('No locally available OS test font. Install fonts-dejavu-core.');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
  try{
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!path.startsWith(root+'/')&&path!==root){res.writeHead(403).end();return;}
    const full=path===root?join(root,'index.html'):path;
    const bytes=await readFile(full);
    res.writeHead(200,{'Content-Type':types[extname(full)]||'application/octet-stream',
      'Cache-Control':'no-store'});res.end(bytes);
  }catch{res.writeHead(404).end('Not found');}
});
let browser;
try{
  await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
  const origin='http://127.0.0.1:'+server.address().port+'/';
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:412,height:892},deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.editor-tool-card[data-editor-tool="typography"]',{state:'attached'});
  await page.locator('#mobileEdit').click();
  await page.locator('.settings-tab[data-tab="details"]').click();
  await page.locator('.editor-tool-tab[data-editor-tool="typography"]').click();
  await page.locator('[data-text-add]').click();
  const text=page.locator('[data-text-key="text"]');
  await text.fill('LOCAL FONT');
  await text.blur();
  await page.locator('[data-text-import]').setInputFiles({
    name:'DejaVuSans.ttf',mimeType:'font/ttf',buffer:fontBytes
  });
  await page.waitForFunction(()=>/^user-[a-f0-9]{64}$/.test(
    document.querySelector('[data-text-key="font"]')?.value||''),{timeout:30000});
  const id=await page.locator('[data-text-key="font"]').inputValue();
  await page.waitForFunction(()=>{
    const preview=document.querySelector('#preview');
    return preview&&preview.dataset.renderPending==='false'&&
      document.querySelector('[data-text-key="font"]')?.value?.startsWith('user-');
  });
  await page.locator('#preview').screenshot({path:join(out,'imported-font-preview.png')});
  const report=await page.evaluate(async()=>{
    const {drawWallpaper}=await import('/src/renderer.js');
    const {normalizeRecipe}=await import('/src/model.js');
    const {exportWallpaperInWorker}=await import('/src/render-coordinator.js');
    const {listLocalFonts,localFontsReady,prepareLocalFonts}=await import('/src/local-fonts.js');
    const entries=await listLocalFonts();
    const url=new URL(location.href);
    const recipe=normalizeRecipe(JSON.parse(decodeURIComponent(url.searchParams.get('r'))));
    const fontId=recipe.textOverlays?.[0]?.font;
    if(!fontId?.startsWith('user-'))throw Error('URL lost imported font reference');
    await prepareLocalFonts(recipe);
    if(!localFontsReady(recipe))throw Error('Private font unavailable after save');
    const make=()=>{const c=document.createElement('canvas');c.width=480;c.height=1040;return c;};
    const a=make(),b=make(),system=make();
    drawWallpaper(a,recipe);
    drawWallpaper(system,{...recipe,textOverlays:recipe.textOverlays.map(t=>({...t,font:'bold'}))});
    const blob=await exportWallpaperInWorker({recipe,width:480,height:1040,timeoutMs:90000});
    const bitmap=await createImageBitmap(blob);
    b.getContext('2d').drawImage(bitmap,0,0);bitmap.close();
    const px=c=>c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,480,1040).data;
    const A=px(a),B=px(b),S=px(system);
    let differences=0,fontDistinct=0;
    for(let i=0;i<A.length;i+=4)for(let j=0;j<3;j++){
      if(A[i+j]!==B[i+j])differences++;
      if(A[i+j]!==S[i+j])fontDistinct++;
    }
    if(differences)throw Error('Worker cannot reproduce local font: '+differences+' channels');
    if(fontDistinct<500)throw Error('Imported font did not differ visibly from system fallback');
    if(JSON.stringify(recipe).includes('DejaVuSans.ttf'))throw Error('Font filename or bytes in recipe');
    return {fontId,records:entries.length,workerChannelDifferences:differences,
      distinctFromPresetChannels:fontDistinct,exportBlobBytes:blob.size};
  });
  assert.equal(report.fontId,id);
  assert.deepEqual(errors,[],errors.join('; '));
  const portable=page.url();
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
    {timeout:30000});
  const restored=await page.evaluate(async()=>{
    const {prepareLocalFonts}=await import('/src/local-fonts.js');
    const {decodeRecipe}=await import('/src/model.js');
    const recipe=decodeRecipe(new URL(location.href).searchParams.get('r'));
    await prepareLocalFonts(recipe);
    return recipe.textOverlays?.[0]?.font;
  });
  assert.equal(restored,id,'Fresh page must reload font from IndexedDB');
  const separate=await browser.newContext({viewport:{width:412,height:892}});
  const foreign=await separate.newPage();
  await foreign.goto(portable,{waitUntil:'domcontentloaded'});
  const missing=await foreign.evaluate(async()=>{
    const {prepareLocalFonts}=await import('/src/local-fonts.js');
    const {decodeRecipe}=await import('/src/model.js');
    const recipe=decodeRecipe(new URL(location.href).searchParams.get('r'));
    try{await prepareLocalFonts(recipe);return null;}
    catch(e){return String(e.message);}
  });
  assert.match(missing,/Missing local font/,missing||'Missing font was silently replaced');
  const proof={status:'PASS',viewport:'emulated 412x892, not native Pixel',
    sameOriginReload:true,isolatedOriginMissingFontRefused:true,missingMessage:missing,
    pageExceptions:errors,art:report};
  await writeFile(join(out,'report.json'),JSON.stringify(proof,null,2)+'\n');
  console.log('LOCAL FONT BROWSER PROOF '+JSON.stringify(proof));
}finally{
  await browser?.close();
  server.close();
}
