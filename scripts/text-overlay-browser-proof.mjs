#!/usr/bin/env node
// One-shot source-browser acceptance for a new feature, not a permanent CI factory.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {dirname,resolve,extname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=join(root,'output','text-overlays');
await mkdir(output,{recursive:true});
const types={'.js':'text/javascript','.css':'text/css','.json':'application/json',
  '.html':'text/html','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
  try{
    const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const path=resolve(root,'.'+name);
    if(!path.startsWith(root+'/')&&path!==root){res.writeHead(403).end();return;}
    const file=path===root?join(root,'index.html'):path;
    const body=await readFile(file);
    res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream',
      'Cache-Control':'no-store'});
    res.end(body);
  }catch{res.writeHead(404).end('Not found');}
});
let browser;
try{
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:412,height:892},deviceScaleFactor:1});
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.editor-tool-card[data-editor-tool="typography"]',{timeout:30000});
  await page.locator('.settings-tab[data-tab="details"]').click();
  await page.locator('.editor-tool-tab[data-editor-tool="typography"]').click();
  await page.locator('[data-text-add]').click();
  const text=page.locator('[data-text-key="text"]');
  await text.fill('RAINBOW TEST');
  await text.blur();
  assert.equal(await text.inputValue(),'RAINBOW TEST');
  assert.equal(await page.locator('[data-text-picker] option').count(),1);
  const uiState=await page.evaluate(()=>({
    category:document.querySelector('.settings-tab[aria-selected="true"]')?.dataset.tab,
    tool:document.querySelector('.editor-tool-tab[aria-pressed="true"]')?.dataset.editorTool,
    canvas:document.querySelector('#preview')?.getAttribute('aria-busy')||null
  }));
  assert.equal(uiState.category,'details');
  assert.equal(uiState.tool,'typography');
  await page.locator('#preview').screenshot({path:join(output,'portrait-preview.png')});

  const report=await page.evaluate(async()=>{
    const {drawWallpaper,presentNudgedArtwork}=await import('/src/renderer.js');
    const {normalizeRecipe}=await import('/src/model.js');
    const {exportWallpaperInWorker}=await import('/src/render-coordinator.js');
    const variants=[
      {seed:'type-letter',palette:'classic',orientation:'diagonal',textOverlays:[
        {id:'a',text:'RAINBOW',colour:'rainbow-letter',outline:'black',size:82,x:50,y:42}
      ]},
      {seed:'type-word',background:'white',palette:'jewel',reverseStripes:true,
        textOverlays:[{id:'b',text:'EVERY WORD\nA DIFFERENT COLOUR',
        colour:'rainbow-word',font:'editorial',outline:'white',size:55,x:50,y:56}]},
      {seed:'type-photo',photoLook:{enabled:true,presetId:'film-halation-only',amount:48},
        textOverlays:[{id:'c',text:'A LIVING GRADIENT',
        colour:'rainbow-gradient',font:'modern',outline:'black',size:54,x:50,y:75,
        rotation:12}]}
    ];
    const width=600,height=1300;
    const make=()=>{
      const c=document.createElement('canvas');
      c.width=width;c.height=height;return c;
    };
    const pixels=c=>c.getContext('2d',{willReadFrequently:true})
      .getImageData(0,0,width,height).data;
    const compare=(a,b)=>{
      let diffs=0,first=-1,maximum=0;
      for(let i=0;i<a.length;i++){
        const n=Math.abs(a[i]-b[i]);
        if(n){diffs++;if(first<0)first=i;maximum=Math.max(maximum,n);}
      }
      return {diffs,first,maximum,bytes:a.length};
    };
    const results=[];
    for(const raw of variants){
      const recipe=normalizeRecipe(raw);
      const baseline=make(),reference=make(),cached=make(),composed=make(),worker=make();
      drawWallpaper(baseline,normalizeRecipe({...recipe,textOverlays:[]}));
      drawWallpaper(reference,recipe);
      const textImpact=compare(pixels(baseline),pixels(reference));
      if(textImpact.diffs<1000)throw Error('Text did not change actual '+raw.seed+' wallpaper pixels');
      const cache={};
      drawWallpaper(cached,recipe,{cache});
      presentNudgedArtwork(composed,cache,recipe);
      const cachedMatch=compare(pixels(reference),pixels(composed));
      const blob=await exportWallpaperInWorker({recipe,width,height,timeoutMs:90000});
      const bitmap=await createImageBitmap(blob);
      worker.getContext('2d').drawImage(bitmap,0,0);bitmap.close();
      const workerMatch=compare(pixels(reference),pixels(worker));
      const metadata={seed:recipe.seed,changedChannels:textImpact.diffs,
        cacheMatch:cachedMatch,workerMatch,blobBytes:blob.size};
      results.push(metadata);
      if(cachedMatch.diffs)throw Error('Cached compositor differs: '+JSON.stringify(metadata));
      if(workerMatch.diffs)throw Error('Worker text export differs: '+JSON.stringify(metadata));
      if(cache.ink instanceof HTMLCanvasElement){cache.ink.width=0;cache.ink.height=0;}
      if(cache.background instanceof HTMLCanvasElement){cache.background.width=0;cache.background.height=0;}
    }
    return results;
  });
  assert.deepEqual(pageErrors,[],pageErrors.join('; '));
  const proof={status:'PASS',mode:'actual Chromium / Canvas2D / worker',
    viewport:'412x892 emulated (not physical handset)',ui:uiState,
    browserExceptions:pageErrors,art:report};
  await writeFile(join(output,'report.json'),JSON.stringify(proof,null,2)+'\n');
  console.log('TYPOGRAPHY ART PROOF '+JSON.stringify(proof));
}finally{
  await browser?.close();
  server.close();
}
