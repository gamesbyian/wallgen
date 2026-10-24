#!/usr/bin/env node
// One-shot actual Chromium acceptance of explicit portable font packages.
// Two isolated browser profiles: no staged font bytes are shared by default.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {dirname,resolve,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=join(root,'output','portable-fonts');
await mkdir(output,{recursive:true});
const candidates=['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf'];
let actualFont;
for(const f of candidates){try{actualFont=await readFile(f);break;}catch{}}
if(!actualFont)throw Error('Install fonts-dejavu-core for real TTF integration test');
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html',
  '.json':'application/json','.svg':'image/svg+xml','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{
  try{
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!path.startsWith(root+'/')&&path!==root){res.writeHead(403).end();return;}
    const file=path===root?join(root,'index.html'):path;
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(await readFile(file));
  }catch{res.writeHead(404).end('Not found');}
});
let browser;
const openTextTool=async page=>{
  await page.waitForSelector('.editor-tool-card[data-editor-tool="typography"]',
    {state:'attached',timeout:30000});
  await page.locator('#mobileEdit').click();
  await page.locator('.settings-tab[data-tab="details"]').click();
  await page.locator('.editor-tool-tab[data-editor-tool="typography"]').click();
};
try{
  await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
  const origin='http://127.0.0.1:'+server.address().port+'/';
  browser=await chromium.launch({headless:true});
  const first=await browser.newContext({viewport:{width:412,height:892},acceptDownloads:true});
  const source=await first.newPage(),errors=[];
  source.on('pageerror',e=>errors.push('source: '+e.message));
  await source.goto(origin,{waitUntil:'domcontentloaded'});
  await openTextTool(source);
  await source.locator('[data-text-add]').click();
  await source.locator('[data-text-key="text"]').fill('MY RAINBOW');
  await source.locator('[data-text-key="text"]').blur();
  await source.locator('[data-text-import]').setInputFiles({
    name:'DejaVuSans.ttf',mimeType:'font/ttf',buffer:actualFont
  });
  await source.waitForFunction(()=>/^user-[0-9a-f]{64}$/.test(
    document.querySelector('[data-text-key="font"]')?.value||''),{timeout:30000});
  const originalId=await source.locator('[data-text-key="font"]').inputValue();
  const downloadPromise=source.waitForEvent('download',{timeout:30000});
  await source.locator('[data-font-pack-export]').click();
  const download=await downloadPromise;
  assert.match(download.suggestedFilename(),/\.fontpack\.json$/);
  const raw=await readFile(await download.path());
  assert.ok(raw.length>actualFont.length,'package must include the font binary');
  await writeFile(join(output,'actual-fontpack.json'),raw);
  const packageJson=JSON.parse(raw.toString('utf8'));
  assert.equal(packageJson.fonts.length,1);
  assert.equal(packageJson.fonts[0].id,originalId);
  assert.ok(!JSON.stringify(packageJson.recipe).includes('DejaVuSans.ttf'),
    'recipe carries font ID, not private font file');

  // New context is genuinely isolated. Opening the same recipe reference
  // cannot silently use an unrelated local font or a system fallback.
  const isolated=await browser.newContext({viewport:{width:412,height:892}});
  const destination=await isolated.newPage();
  destination.on('pageerror',e=>errors.push('isolated: '+e.message));
  await destination.goto(origin,{waitUntil:'domcontentloaded'});
  await openTextTool(destination);
  // Import a damaged package first: it must not touch the existing canvas or
  // create a half-imported font record.
  const tampered=structuredClone(packageJson);
  tampered.fonts[0].id='user-'+'0'.repeat(64);
  await destination.locator('[data-font-pack-import]').setInputFiles({
    name:'tampered.fontpack.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(tampered))
  });
  await destination.waitForFunction(()=>document.querySelector('[data-font-pack-status]')
    ?.textContent?.includes('Cannot import package'));
  assert.equal(await destination.locator('[data-text-picker] option').count(),0);
  const before=await destination.evaluate(async()=>{
    const {listLocalFonts}=await import('/src/local-fonts.js');
    return (await listLocalFonts()).length;
  });
  assert.equal(before,0,'corrupt package must not persist a single font');

  destination.on('dialog',dialog=>dialog.accept());
  await destination.locator('[data-font-pack-import]').setInputFiles({
    name:'design.fontpack.json',mimeType:'application/json',buffer:raw
  });
  await destination.waitForFunction(()=>document.querySelector('[data-text-key="font"]')
    ?.value?.startsWith('user-'),{timeout:30000});
  assert.equal(await destination.locator('[data-text-key="font"]').inputValue(),originalId);
  await destination.waitForFunction(()=>document.querySelector('#preview')
    ?.dataset.renderPending==='false',{timeout:30000});
  await destination.locator('#preview').screenshot({path:join(output,'restored-portrait.png')});
  const evidence=await destination.evaluate(async()=>{
    const {listLocalFonts,prepareLocalFonts}=await import('/src/local-fonts.js');
    const {drawWallpaper}=await import('/src/renderer.js');
    const {decodeRecipe}=await import('/src/model.js');
    const {exportWallpaperInWorker}=await import('/src/render-coordinator.js');
    const recipe=decodeRecipe(new URL(location.href).searchParams.get('r'));
    await prepareLocalFonts(recipe);
    const make=()=>{const c=document.createElement('canvas');c.width=480;c.height=1040;return c;};
    const a=make(),b=make();
    drawWallpaper(a,recipe);
    const blob=await exportWallpaperInWorker({recipe,width:480,height:1040,timeoutMs:90000});
    const image=await createImageBitmap(blob);
    b.getContext('2d').drawImage(image,0,0);image.close();
    const pixels=c=>c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,480,1040).data;
    const A=pixels(a),B=pixels(b);let mismatchedChannels=0;
    for(let i=0;i<A.length;i++)if(A[i]!==B[i])mismatchedChannels++;
    return {id:recipe.textOverlays?.[0]?.font,
      text:recipe.textOverlays?.[0]?.text,
      savedFontCount:(await listLocalFonts()).length,
      workerReferenceChannelDifferences:mismatchedChannels,bytes:blob.size};
  });
  assert.equal(evidence.id,originalId);
  assert.equal(evidence.text,'MY RAINBOW');
  assert.equal(evidence.savedFontCount,1);
  assert.equal(evidence.workerReferenceChannelDifferences,0);
  await destination.reload({waitUntil:'domcontentloaded'});
  const afterReload=await destination.evaluate(async()=>{
    const {listLocalFonts}=await import('/src/local-fonts.js');
    return (await listLocalFonts()).length;
  });
  assert.equal(afterReload,1);
  assert.deepEqual(errors,[],'browser should not throw page exceptions');
  const result={status:'PASS',browser:'isolated 412x892 Chromium profiles (not physical Pixel)',
    sourcePrivateFontId:originalId,
    packageBytes:raw.length,
    tamperedPackageRejected:true,
    noDatabaseWritesAfterTampering:true,
    explicitHumanApprovalSimulatedByTestDialog:true,
    crossProfileFontAndRecipeRestored:true,
    crossReloadFontAvailable:true,
    browserErrors:errors,art:evidence};
  await writeFile(join(output,'report.json'),JSON.stringify(result,null,2)+'\n');
  console.log('PORTABLE FONT PACKAGE REAL BROWSER PROOF '+JSON.stringify(result));
}finally{await browser?.close();server.close();}
