#!/usr/bin/env node
// Opt-in real Chromium app-font-import proof. FontFace.load is gated ONLY to
// deterministically reproduce the pending native-font race; parsing and
// persistence still use the real browser font and IndexedDB implementation.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'artifacts','private-font-superseded-design-browser');
const mime={'.js':'text/javascript','.html':'text/html','.css':'text/css',
  '.json':'application/json','.svg':'image/svg+xml','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{
  try{
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
    if(path!==root&&!path.startsWith(root+'/')){res.writeHead(403).end();return;}
    const target=path===root?join(root,'index.html'):path;
    res.writeHead(200,{'Content-Type':mime[extname(target)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(await readFile(target));
  }catch{res.writeHead(404).end('Unavailable');}
});
let fontBytes;
for(const path of ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf']){
  try{fontBytes=await readFile(path);break;}catch{}
}
if(!fontBytes)throw Error('One-shot proof needs a local test TTF, never a private user font');
let browser;
try{
  const {chromium}=await import('playwright');
  await mkdir(out,{recursive:true});
  await new Promise((ok,no)=>{
    server.once('error',no);server.listen(0,'127.0.0.1',ok);
  });
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:412,height:892},
    deviceScaleFactor:1,reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    const original=FontFace.prototype.load;
    // Preserve actual native font parsing. Defer completion until AFTER
    // the imported JSON has replaced the original text-1 incarnation.
    FontFace.prototype.load=function(...args){
      if(String(this.family).includes('ROYGBIV-Private-')){
        window.__fontLoadPending=true;
        return new Promise((resolve,reject)=>{
          window.__finishPrivateFontLoad=()=>
            Promise.resolve().then(()=>original.apply(this,args)).then(resolve,reject);
        });
      }
      return original.apply(this,args);
    };
  });
  const base='http://127.0.0.1:'+server.address().port+'/';
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.locator('#mobileEdit').click();
  await page.locator('.settings-tab[data-tab="details"]').click();
  await page.locator('.editor-tool-tab[data-editor-tool="typography"]').click();
  await page.locator('[data-text-add]').click();
  const words=page.locator('[data-text-key="text"]');
  await words.fill('SAME AUTHOR WORDS');
  await words.blur();
  const readCurrent=()=>page.evaluate(async()=>{
    const {decodeRecipe}=await import('/src/model.js');
    const current=decodeRecipe(new URL(location.href).searchParams.get('r'));
    const fontStatus=document.querySelector('[data-text-font-status]');
    return {seed:current.seed,caption:current.textOverlays?.[0]?.text,
      id:current.textOverlays?.[0]?.id,
      font:current.textOverlays?.[0]?.font,
      importerDisabled:document.querySelector('[data-text-import]').disabled,
      notice:fontStatus?.textContent};
  });
  const first=await readCurrent();
  assert.equal(first.caption,'SAME AUTHOR WORDS');
  assert.equal(first.id,'text-1');
  assert.ok(typeof first.font==='string'&&first.font.length>0,
    'The source caption must have a real creator-selected face');
  await page.locator('[data-text-import]').setInputFiles({
    name:'QA-LocalTypeface.ttf',mimeType:'font/ttf',buffer:fontBytes
  });
  await page.waitForFunction(()=>window.__fontLoadPending===true&&
    typeof window.__finishPrivateFontLoad==='function',
    null,{timeout:30000});
  const pending=await readCurrent();
  assert.equal(pending.importerDisabled,true,'Private font must really be in-flight');
  assert.equal(pending.font,'modern');
  const replacement={seed:'different-whole-design',structure:'paths',
    geometry:'straight',textOverlays:[
      {id:'text-1',text:'SAME AUTHOR WORDS',font:first.font,x:50,y:50}
    ]};
  // Real file-driven JSON restoration, not direct DOM event emulation.
  await page.locator('#importRecipeFile').setInputFiles({
    name:'new-wallpaper.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(replacement))
  });
  await page.waitForFunction(()=>
    new URL(location.href).searchParams.get('r')!==null&&
    document.querySelector('[data-text-key="text"]')?.value==='SAME AUTHOR WORDS',
    null,{timeout:30000});
  const restored=await readCurrent();
  assert.equal(restored.seed,'different-whole-design');
  assert.equal(restored.id,first.id,'new design intentionally reuses text-1');
  assert.equal(restored.caption,first.caption);
  assert.equal(restored.font,first.font);
  await page.evaluate(()=>window.__finishPrivateFontLoad());
  await page.waitForFunction(()=>document.querySelector('[data-text-import]')
    ?.disabled===false,null,{timeout:30000});
  const settled=await readCurrent();
  assert.equal(settled.seed,replacement.seed);
  assert.equal(settled.font,first.font,
    'old font import must not silently repaint a restored same-ID caption');
  assert.equal(settled.caption,replacement.textOverlays[0].text);
  const savedFonts=await page.evaluate(async()=>{
    const {listLocalFonts}=await import('/src/local-fonts.js');
    return await listLocalFonts();
  });
  assert.ok(savedFonts.some(x=>x.name==='QA-LocalTypeface.ttf'),
    'old font should be safely stored locally for deliberate future selection');
  assert.deepEqual(errors,[]);
  await page.waitForFunction(()=>document.querySelector('#preview')
    ?.dataset.renderPending==='false',null,{timeout:60000});
  await page.locator('#preview').screenshot({
    path:join(out,'restored-same-id-safe-private-font.png')});
  const report={status:'PASS',
    viewport:'Chromium portrait 412x892, artificially gated real native FontFace.load',
    pendingOriginal:{id:first.id,font:first.font,caption:first.caption},
    restoredBeforeCompletion:restored,restoredAfterCompletion:settled,
    locallyStoredFont:true,actualNativeFontLoadReleased:true,
    browserErrors:errors,privateFontBytesUploaded:false};
  await writeFile(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('PRIVATE_FONT_SAME_ID_REPLACEMENT_CHROMIUM '+JSON.stringify(report));
}finally{await browser?.close();server.close();}
