#!/usr/bin/env node
// One-shot full-resolution *actual app download* acceptance for private TTF.
// The previous source test proved bundled fonts at 3024×6552, but not a
// short-lived export worker fetching user-font bytes from IndexedDB.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {dirname,resolve,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {extractPngRecipe} from '../src/png-metadata.js';
import {OUTPUT_WIDTH,OUTPUT_HEIGHT,normalizeRecipe,encodeRecipe} from '../src/model.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'output','private-font-19mp');
await mkdir(out,{recursive:true});
let raw;
for(const name of [
 '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
 '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf'
]){
 try{raw=await readFile(name);break;}catch{}
}
if(!raw)throw Error('Install fonts-dejavu-core on worker to test an actual native TTF');
const types={'.js':'text/javascript','.css':'text/css','.html':'text/html',
  '.json':'application/json','.ttf':'font/ttf','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
   const file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
   if(!file.startsWith(root+'/')&&file!==root){res.writeHead(403).end();return;}
   const path=file===root?join(root,'index.html'):file;
   res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream',
     'Cache-Control':'no-store'}).end(await readFile(path));
 }catch{res.writeHead(404).end('Not Found');}
});
let browser;
const lifecycle=[];
try{
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
 browser=await chromium.launch({headless:true,args:['--js-flags=--max-old-space-size=4096']});
 const page=await browser.newPage({viewport:{width:412,height:892},deviceScaleFactor:1,
   acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(String(e.message)));
 page.on('crash',()=>lifecycle.push('page-crashed'));
 page.on('close',()=>lifecycle.push('page-closed'));
 browser.on('disconnected',()=>lifecycle.push('browser-disconnected'));
 const fixture=JSON.parse(await readFile(join(root,'tests/fixtures/typography-full-resolution.json'),'utf8'));
 const baselineRecipe=normalizeRecipe({...fixture,textOverlays:[]});
 const token=encodeRecipe(baselineRecipe);
 await page.goto('http://127.0.0.1:'+server.address().port+'/?r='+encodeURIComponent(token),
   {waitUntil:'domcontentloaded'});

 await page.waitForSelector('.editor-tool-card[data-editor-tool="typography"]',
   {state:'attached'});
 await page.locator('#mobileEdit').click();
 await page.locator('.settings-tab[data-tab="details"]').click();
 await page.locator('.editor-tool-tab[data-editor-tool="typography"]').click();
 await page.locator('[data-text-add]').click();
 await page.locator('[data-text-key="text"]').fill('MY PRIVATE FONT');
 await page.locator('[data-text-key="text"]').blur();
 await page.locator('[data-text-import]').setInputFiles({
   name:'DejaVuSans.ttf',mimeType:'font/ttf',buffer:raw
 });
 await page.waitForFunction(()=>/^user-[a-f0-9]{64}$/.test(
   document.querySelector('[data-text-key="font"]')?.value||''),{timeout:30000});
 const id=await page.locator('[data-text-key="font"]').inputValue();
 await page.waitForFunction(()=>document.querySelector('#preview')
   ?.dataset.renderPending==='false',{timeout:30000});
 const small=await page.evaluate(async()=>{
   const {drawWallpaper}=await import('/src/renderer.js');
   const {decodeRecipe}=await import('/src/model.js');
   const {prepareTypefaces}=await import('/src/typography-fonts.js');
   const recipe=decodeRecipe(new URL(location.href).searchParams.get('r'));
   await prepareTypefaces(recipe);
   const make=()=>{const c=document.createElement('canvas');c.width=360;c.height=780;return c;};
   const a=make(),b=make();
   drawWallpaper(a,recipe);
   drawWallpaper(b,{...recipe,textOverlays:recipe.textOverlays
     .map(item=>({...item,font:'modern'}))});
   const image=c=>c.getContext('2d',{willReadFrequently:true})
     .getImageData(0,0,360,780).data;
   const A=image(a),B=image(b);let changed=0;
   for(let i=0;i<A.length;i++)if(A[i]!==B[i])changed++;
   return {distinctFromSystemFontChannels:changed};
 });
 assert.ok(small.distinctFromSystemFontChannels>500,
   'The original private font must visibly differ from a system fallback');
 const promise=page.waitForEvent('download',{timeout:180000});
 const mobileExport=page.locator('#mobileDownload');
 if(!await mobileExport.isVisible())
   throw Error('Mobile wallpaper Download action is unavailable while editing');
 await mobileExport.click();
 const download=await promise;
 const path=join(out,'private-font-'+OUTPUT_WIDTH+'x'+OUTPUT_HEIGHT+'.png');
 await download.saveAs(path);
 const bytes=await readFile(path);
 assert.equal(bytes.readUInt32BE(16),OUTPUT_WIDTH,'PNG width mismatch');
 assert.equal(bytes.readUInt32BE(20),OUTPUT_HEIGHT,'PNG height mismatch');
 const recipe=extractPngRecipe(bytes);
 assert.equal(recipe.textOverlays.length,1);
 assert.equal(recipe.textOverlays[0].text,'MY PRIVATE FONT');
 assert.equal(recipe.textOverlays[0].font,id);
 assert.ok(!bytes.includes(Buffer.from('DejaVuSans.ttf')),
   'Ordinary PNG must never leak original private font filename');
 // Reopening the saved portable PNG recipe on a fresh browser origin may
 // require the TTF again; the PNG never includes its original private bytes.
 const proof={
   status:'PASS',render:'actual app Download PNG button + short-lived worker',
   viewport:'emulated 412x892 Chromium, not physical Pixel',
   dimensions:[OUTPUT_WIDTH,OUTPUT_HEIGHT],pngBytes:bytes.length,
   privateFontBytes:raw.length,fontSha256Id:id,
   textObjects:recipe.textOverlays.length,privateFontFilenameNotEmbedded:true,
   ...small,pageErrors:errors};
 assert.deepEqual(errors,[]);
 await writeFile(join(out,'report.json'),JSON.stringify(proof,null,2)+'\n');
 console.log('PRIVATE-FONT FULL RES ACTUAL APP PROOF '+JSON.stringify(proof));
}catch(error){
 await writeFile(join(out,'failure-diagnostic.json'),
   JSON.stringify({status:'FAIL',error:String(error),lifecycle},null,2)+'\n');
 throw error;
}finally{await browser?.close();server.close();}
