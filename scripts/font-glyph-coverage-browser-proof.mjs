#!/usr/bin/env node
// One-shot proof: the ACTUAL editor warns when the selected native-loaded
// bundled/private TTF lacks authored Unicode glyphs, without touching recipes.
// Emulated Chromium portrait is not a physical Android/TalkBack test.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'output','font-glyph-coverage');
await mkdir(out,{recursive:true});
const data=await readFile(join(root,'assets/fonts/bangers.ttf'));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.svg':'image/svg+xml','.json':'application/json','.ttf':'font/ttf'};
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
  const errors=[],remotes=[];
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('request',request=>{
    if(!request.url().startsWith('http://127.0.0.1:'))remotes.push(request.url());
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{
    waitUntil:'domcontentloaded'});
  await page.waitForSelector('.editor-tool-card[data-editor-tool="typography"]',
    {state:'attached'});
  await page.locator('#mobileEdit').click();
  await page.locator('.settings-tab[data-tab="details"]').click();
  await page.locator('.editor-tool-tab[data-editor-tool="typography"]').click();
  await page.locator('[data-text-add]').click();
  const box=page.locator('[data-text-key="text"]');
  const font=page.locator('[data-text-key="font"]');
  const status=page.locator('[data-text-glyph-status]');
  const phrase='HELLO 𠮷 مرحبا';
  await box.fill(phrase);await box.blur();
  await font.selectOption('pack-bangers');
  await page.waitForFunction(()=>document.querySelector('[data-text-glyph-status]')
    ?.textContent?.includes('does not contain'),{timeout:30000});
  const bundledWarning=await status.textContent();
  assert.match(bundledWarning,/U\+20BB7/);
  assert.match(bundledWarning,/browser may substitute glyphs/i);
  const before=await page.evaluate(()=>{
    const params=new URL(location.href).searchParams;
    return params.get('r');
  });
  await page.screenshot({path:join(out,'bundled-missing-glyphs-portrait.png')});
  await box.fill('HELLO');await box.blur();
  await page.waitForFunction(()=>document.querySelector('[data-text-glyph-status]')
    ?.textContent==='',{timeout:15000});
  assert.equal(await status.textContent(),'','supported Latin should not falsely warn');
  // Repeated asynchronous edits must not reassert a warning from old text.
  await box.fill(phrase);await box.blur();
  await font.selectOption('modern');
  await page.waitForTimeout(100);
  assert.equal(await status.textContent(),'','system font has unknown native coverage');
  await page.locator('[data-text-import]').setInputFiles({
    name:'Bangers.ttf',mimeType:'font/ttf',buffer:data
  });
  await page.waitForFunction(()=>/^user-[0-9a-f]{64}$/.test(
    document.querySelector('[data-text-key="font"]')?.value||''),{timeout:30000});
  const privateFontId=await font.inputValue();
  await page.waitForFunction(()=>document.querySelector('[data-text-glyph-status]')
    ?.textContent?.includes('does not contain'),{timeout:30000});
  const privateWarning=await status.textContent();
  assert.match(privateWarning,/U\+20BB7/);
  assert.equal(privateWarning,bundledWarning,
    'same verified font bytes must produce same coverage, regardless of storage');
  const exported=await page.evaluate(async()=>{
    const {decodeRecipe}=await import('/src/model.js');
    const {prepareTypefaces}=await import('/src/typography-fonts.js');
    const {drawWallpaper}=await import('/src/renderer.js');
    const {exportWallpaperInWorker}=await import('/src/render-coordinator.js');
    const recipe=decodeRecipe(new URL(location.href).searchParams.get('r'));
    await prepareTypefaces(recipe);
    const width=360,height=780;
    const make=()=>{const c=document.createElement('canvas');c.width=width;c.height=height;return c;};
    const direct=make(),worker=make();
    drawWallpaper(direct,recipe);
    const png=await exportWallpaperInWorker({recipe,width,height,timeoutMs:90000});
    const bitmap=await createImageBitmap(png);
    worker.getContext('2d').drawImage(bitmap,0,0);bitmap.close();
    const A=direct.getContext('2d',{willReadFrequently:true})
      .getImageData(0,0,width,height).data;
    const B=worker.getContext('2d',{willReadFrequently:true})
      .getImageData(0,0,width,height).data;
    let differingChannels=0;
    for(let i=0;i<A.length;i++)if(A[i]!==B[i])differingChannels++;
    return {differingChannels,pngBytes:png.size,
      text:recipe.textOverlays[0].text,font:recipe.textOverlays[0].font,
      originalFontFilenameNotInRecipe:!JSON.stringify(recipe).includes('Bangers.ttf')};
  });
  assert.equal(exported.differingChannels,0);
  assert.equal(exported.text,phrase);
  assert.equal(exported.font,privateFontId);
  assert.equal(exported.originalFontFilenameNotInRecipe,true);
  assert.deepEqual(errors,[]);
  // The EXISTING app requests its UI Fredoka/Rubik face from Google Fonts.
  // Do not attribute those pre-existing stylesheet/WOFF2 requests to the
  // new glyph checker. It adds no fetch; assert the only external traffic
  // is that known UI font origin, and that none contains authored text.
  const approved=/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//;
  assert.ok(remotes.every(url=>approved.test(url)),
    'Unexpected remote request during font coverage: '+remotes.join(', '));
  assert.ok(remotes.every(url=>!url.includes(encodeURIComponent(phrase))&&
    !url.includes('20BB7')&&!url.includes('مرحبا')),
    'Authored text must never leave in an external URL');
  await page.screenshot({path:join(out,'private-font-warning-portrait.png')});
  const notice412=await status.evaluate(element=>({
    width:element.clientWidth,scrollWidth:element.scrollWidth,
    height:element.clientHeight,scrollHeight:element.scrollHeight
  }));
  assert.ok(notice412.scrollWidth<=notice412.width+1,
    '412px portrait warning must not overflow horizontally');
  await page.setViewportSize({width:320,height:700});
  const notice320=await status.evaluate(element=>({
    width:element.clientWidth,scrollWidth:element.scrollWidth,
    height:element.clientHeight,scrollHeight:element.scrollHeight
  }));
  assert.ok(notice320.scrollWidth<=notice320.width+1,
    '320px portrait warning must wrap rather than overflow');
  await page.screenshot({path:join(out,'private-font-warning-320x700.png')});
  // A small actual DOM screenshot in the job log permits direct optical
  // inspection before merging instead of trusting an unviewed artifact.
  const warningPixels=await status.screenshot({type:'png'});
  console.log('GLYPH_WARNING_PNG_BASE64='+warningPixels.toString('base64'));
  const report={status:'PASS',browser:'real Chromium, 412x892 emulated only',
    tested:'native FontFace load, selected bundled/private font, async control, worker output',
    fontBytes:data.byteLength,privateFontId,bundledWarning,privateWarning,
    oldEncodedRecipePresent:!!before,exported,notice412,notice320,
    errors,remoteRequests:remotes};
  await writeFile(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('GLYPH COVERAGE BROWSER PROOF '+JSON.stringify(report));
}finally{await browser?.close();server.close();}
