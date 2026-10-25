#!/usr/bin/env node
// One-shot actual editor+worker proof of grapheme-safe text bounds.
// Chromium viewport is an emulation, not native Android IME evidence.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),
  out=join(root,'output','unicode-grapheme-boundary');
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
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{
   waitUntil:'domcontentloaded'});
 await page.waitForSelector('.editor-tool-card[data-editor-tool="typography"]',{state:'attached'});
 await page.locator('#mobileEdit').click();
 await page.locator('.settings-tab[data-tab="details"]').click();
 await page.locator('.editor-tool-tab[data-editor-tool="typography"]').click();
 await page.locator('[data-text-add]').click();
 const textarea=page.locator('[data-text-key="text"]');
 const recipeText=()=>page.evaluate(async()=>{
   const {decodeRecipe}=await import('/src/model.js');
   return decodeRecipe(new URL(location.href).searchParams.get('r')).textOverlays?.[0]?.text;
 });
 const nearEnd='A'.repeat(158)+'👩‍🔬';
 await textarea.fill(nearEnd);
 assert.equal(await textarea.inputValue(),nearEnd,
   'native textarea must not UTF-16 cut user input prematurely');
 await textarea.blur();
 assert.equal(await recipeText(),'A'.repeat(158),
   'one complete emoji cluster omitted at remaining two codepoints');
 const accent='B'.repeat(158)+'e\u0301';
 await textarea.fill(accent);await textarea.blur();
 assert.equal(await recipeText(),accent,'complete combining mark survives at exactly 160');
 const emojis='🌈'.repeat(160);
 await textarea.fill(emojis);await textarea.blur();
 assert.equal(await recipeText(),emojis,'160 full supplementary emoji codepoints survive');
 const four='one\ntwo\nthree\nfour\nfive';
 await textarea.fill(four);await textarea.blur();
 assert.equal(await recipeText(),'one\ntwo\nthree\nfour');
 // Restore a manageable phrase and check actual production bitmap/export
 // still obey the same canonical recipe and the real Unicode shaper.
 await textarea.fill('🌈 e\u0301 👩‍🔬');await textarea.blur();
 const parity=await page.evaluate(async()=>{
   const {decodeRecipe}=await import('/src/model.js');
   const {drawWallpaper}=await import('/src/renderer.js');
   const {exportWallpaperInWorker}=await import('/src/render-coordinator.js');
   const recipe=decodeRecipe(new URL(location.href).searchParams.get('r'));
   const c=()=>{const x=document.createElement('canvas');x.width=360;x.height=780;return x;};
   const direct=c(),worker=c();drawWallpaper(direct,recipe);
   const png=await exportWallpaperInWorker({recipe,width:360,height:780,timeoutMs:90000});
   const bitmap=await createImageBitmap(png);
   worker.getContext('2d').drawImage(bitmap,0,0);bitmap.close();
   const a=direct.getContext('2d',{willReadFrequently:true}).getImageData(0,0,360,780).data;
   const b=worker.getContext('2d',{willReadFrequently:true}).getImageData(0,0,360,780).data;
   let differences=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])differences++;
   return {differences,bytes:png.size,authoredText:recipe.textOverlays[0].text};
 });
 assert.equal(parity.differences,0);
 assert.equal(parity.authoredText,'🌈 e\u0301 👩‍🔬');
 await page.screenshot({path:join(out,'portrait-unicode-text.png')});
 const preview=await page.locator('#preview').screenshot({type:'png'});
 console.log('GRAPHEME_EDITOR_PNG_BASE64='+preview.toString('base64'));
 assert.deepEqual(errors,[]);
 const report={status:'PASS',viewport:'Chromium 412x892 emulation, not handset',
   nearEndInputLength:nearEnd.length,nearEndSavedCodepoints:158,
   preservedAccent:true,preserved160Emoji:true,boundedFourLines:true,
   parity,browserErrors:errors};
 await writeFile(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log('GRAPHEME CANONICAL BROWSER PROOF '+JSON.stringify(report));
}finally{await browser?.close();server.close();}
