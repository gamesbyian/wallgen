#!/usr/bin/env node
// Opt-in production source acceptance. Imports a real private TTF through
// the actual editor, reloads its SHA-only recipe, and exports combined
// curved rainbow/outline/shadow text at native Pixel 6 Pro wallpaper size.
// Browser emulation cannot certify Pixel hardware memory, IME or TalkBack.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {extractPngRecipe} from '../src/png-metadata.js';
import {normalizeRecipe,encodeRecipe,OUTPUT_WIDTH,OUTPUT_HEIGHT} from '../src/model.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'output','typography-fullres-combined');
await mkdir(out,{recursive:true});
let fontBytes;
for(const name of ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
                    '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf']){
  try{fontBytes=await readFile(name);break;}catch{}
}
if(!fontBytes)throw Error('Install an ordinary real TTF (fonts-dejavu-core)');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.svg':'image/svg+xml','.json':'application/json','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{
  try{
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
    if(!path.startsWith(root+'/')&&path!==root){res.writeHead(403).end();return;}
    const file=path===root?join(root,'index.html'):path;
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(await readFile(file));
  }catch{res.writeHead(404).end('Not Found');}
});
let browser;
const lifecycle=[];
try{
  await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
  browser=await chromium.launch({headless:true,
    args:['--js-flags=--max-old-space-size=4096']});
  const page=await browser.newPage({viewport:{width:412,height:892},
    deviceScaleFactor:1,acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  page.on('crash',()=>lifecycle.push('page-crashed'));
  browser.on('disconnected',()=>lifecycle.push('browser-disconnected'));
  const base='http://127.0.0.1:'+server.address().port+'/';
  const seed=normalizeRecipe({seed:'private-curve-shadow-combined',
    orientation:'vertical',palette:'classic',
    textOverlays:[{id:'private-title',text:'RAINBOW CURVES',
      font:'modern',colour:'rainbow-letter',size:62,x:50,y:50,
      path:'wave',pathHeight:68,outline:'black',outlineWidth:7,
      shadow:'white',shadowBlur:7,shadowDistance:10,
      rainbowOffset:2,letterSpacing:2.5}]});
  await page.goto(base+'?r='+encodeURIComponent(encodeRecipe(seed)),
    {waitUntil:'domcontentloaded'});
  await page.waitForSelector('.editor-tool-card[data-editor-tool="typography"]',
    {state:'attached'});
  await page.locator('#mobileEdit').click();
  await page.locator('.settings-tab[data-tab="details"]').click();
  await page.locator('.editor-tool-tab[data-editor-tool="typography"]').click();
  await page.locator('[data-text-import]').setInputFiles({
    name:'PrivateType.ttf',mimeType:'font/ttf',buffer:fontBytes
  });
  await page.waitForFunction(()=>/^user-[a-f0-9]{64}$/.test(
    document.querySelector('[data-text-key="font"]')?.value||''),{timeout:30000});
  const fontId=await page.locator('[data-text-key="font"]').inputValue();
  const recipe=normalizeRecipe({...seed,textOverlays:[{
    ...seed.textOverlays[0],font:fontId
  }]});
  // A full app navigation forces the private font to be retrieved from
  // persisted IndexedDB, including in the fresh export worker.
  await page.goto(base+'?r='+encodeURIComponent(encodeRecipe(recipe)),
    {waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#preview')
    ?.dataset.renderPending==='false',{timeout:60000});
  const state=await page.evaluate(async()=>{
    const {decodeRecipe}=await import('/src/model.js');
    const {listLocalFonts,localFontsReady}=await import('/src/local-fonts.js');
    const current=decodeRecipe(new URL(location.href).searchParams.get('r'));
    return {font:current.textOverlays[0].font,path:current.textOverlays[0].path,
      shadow:current.textOverlays[0].shadow,outline:current.textOverlays[0].outline,
      persisted: (await listLocalFonts()).some(entry=>entry.id===current.textOverlays[0].font),
      ready:localFontsReady(current)};
  });
  assert.equal(state.font,fontId);
  assert.equal(state.path,'wave');assert.equal(state.shadow,'white');
  assert.equal(state.outline,'black');
  assert.equal(state.persisted,true);assert.equal(state.ready,true);
  const small=await page.evaluate(async()=>{
    const {decodeRecipe}=await import('/src/model.js');
    const {drawWallpaper}=await import('/src/renderer.js');
    const {exportWallpaperInWorker}=await import('/src/render-coordinator.js');
    const {prepareTypefaces}=await import('/src/typography-fonts.js');
    const current=decodeRecipe(new URL(location.href).searchParams.get('r'));
    const make=()=>{const c=document.createElement('canvas');
      c.width=480;c.height=1040;return c;};
    const reference=make(),worker=make(),blank=make(),neutral=make(),system=make();
    await prepareTypefaces(current);
    drawWallpaper(reference,current);
    drawWallpaper(blank,{...current,textOverlays:[]});
    drawWallpaper(neutral,{...current,textOverlays:[{
      ...current.textOverlays[0],shadow:undefined,shadowBlur:0,
      shadowDistance:0,outline:'none',rainbowOffset:0}]});
    drawWallpaper(system,{...current,textOverlays:[{
      ...current.textOverlays[0],font:'modern'}]});
    const bitmapData=c=>c.getContext('2d',{willReadFrequently:true})
      .getImageData(0,0,480,1040).data;
    const a=bitmapData(reference),b=bitmapData(blank),
      c=bitmapData(neutral),d=bitmapData(system);
    let visibleInk=0,styledInk=0,fontInk=0;
    for(let i=0;i<a.length;i++){
      if(a[i]!==b[i])visibleInk++;
      if(a[i]!==c[i])styledInk++;
      if(a[i]!==d[i])fontInk++;
    }
    const workerBlob=await exportWallpaperInWorker({
      recipe:current,width:480,height:1040,timeoutMs:120000});
    const bmp=await createImageBitmap(workerBlob);
    worker.getContext('2d').drawImage(bmp,0,0);bmp.close();
    const e=bitmapData(worker);let diff=0;
    for(let i=0;i<a.length;i++)if(a[i]!==e[i])diff++;
    window.__curvedCombinedPreview=reference.toDataURL('image/png');
    return {visibleInk,styledInk,fontInk,directWorkerDifferingChannels:diff,
      workerBytes:workerBlob.size};
  });
  assert.ok(small.visibleInk>1000,'Missing authored curved lettering');
  assert.ok(small.styledInk>1000,'Shadow/outline controls must visibly change ink');
  assert.ok(small.fontInk>1000,'Private TTF must have distinct glyph rendering');
  assert.equal(small.directWorkerDifferingChannels,0);
  const sourceArt=await page.evaluate(()=>window.__curvedCombinedPreview);
  await writeFile(join(out,'private-curved-shadow-480x1040.png'),
    Buffer.from(sourceArt.split(',')[1],'base64'));
  console.log('FULLRES_COMBINED_SOURCE_ART_BASE64='+sourceArt.split(',')[1]);
  const started=Date.now();
  const downloadWait=page.waitForEvent('download',{timeout:240000});
  // Invokes the existing real Download button handler. This is an export
  // path proof, not proof of the button's on-screen phone visibility.
  await page.evaluate(()=>document.getElementById('download').click());
  const download=await downloadWait;
  const saved=join(out,'private-curved-shadow-'+OUTPUT_WIDTH+'x'+OUTPUT_HEIGHT+'.png');
  await download.saveAs(saved);
  const elapsedMs=Date.now()-started;
  const png=await readFile(saved);
  assert.equal(png.readUInt32BE(16),OUTPUT_WIDTH);
  assert.equal(png.readUInt32BE(20),OUTPUT_HEIGHT);
  const embedded=extractPngRecipe(png);
  assert.equal(embedded.textOverlays.length,1);
  const item=embedded.textOverlays[0];
  for(const [key,value] of [
    ['font',fontId],['path','wave'],['shadow','white'],['outline','black'],
    ['colour','rainbow-letter'],['rainbowOffset',2],['letterSpacing',2.5]
  ])assert.equal(item[key],value,'PNG recipe changed '+key);
  assert.ok(!png.includes(Buffer.from('PrivateType.ttf')),
    'Private font filename must never appear in ordinary PNG');
  assert.deepEqual(errors,[]);
  assert.deepEqual(lifecycle,[]);
  const report={status:'PASS',browser:'Headless Chromium at emulated 412x892; NOT a physical Android device',
    exportedBy:'actual installed Download PNG handler',dimensions:[OUTPUT_WIDTH,OUTPUT_HEIGHT],
    outputBytes:png.byteLength,elapsedMs,
    importedPrivateFontBytes:fontBytes.length,shaId:fontId,
    persistentlyLoaded:true,privateFontFilenameExcluded:true,
    savedStyle:{font:item.font,path:item.path,shadow:item.shadow,
      outline:item.outline,letterSpacing:item.letterSpacing},
    ...small,errors,lifecycle};
  await writeFile(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('PRIVATE_CURVE_SHADOW_FULLRES_PROOF '+JSON.stringify(report));
}catch(error){
  await writeFile(join(out,'failure.json'),
    JSON.stringify({error:String(error),lifecycle},null,2)+'\n');
  throw error;
}finally{await browser?.close();server.close();}
