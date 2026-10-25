#!/usr/bin/env node
// Independent source-app user journey: opted-in double outlines, shadow angle
// keyboard control, undo and visible production PNG. Chromium touch emulation
// is NOT native Android IME, actual Pixel, TalkBack or handset memory evidence.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {dirname,resolve,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
import {extractPngRecipe} from '../src/png-metadata.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'artifacts/agent3-664-effects');
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml',
 '.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{
 try{
  const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(path!==root&&!path.startsWith(root+'/')){res.writeHead(403).end();return;}
  const file=path===root?join(root,'index.html'):path;
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream',
   'Cache-Control':'no-store'}).end(await readFile(file));
 }catch{res.writeHead(404).end('Missing');}
});
const base=normalizeRecipe({
 seed:'agent3-real-shadow-outline-journey',structure:'paths',
 geometry:'wave',orientation:'horizontal',background:'white',
 textOverlays:[{id:'text-proof',text:'R.O.Y.G.B.I.V.',font:'bold',
  colour:'rainbow-letter',outline:'none',size:70,x:50,y:50,path:'wave',pathHeight:65}]
});
let browser;
const all=[];
try{
 await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
 browser=await chromium.launch({headless:true});
 for(const [width,height] of [[320,700],[412,892]]){
  const context=await browser.newContext({viewport:{width,height},
   isMobile:true,hasTouch:true,acceptDownloads:true,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[],remotes=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',req=>{
   if(req.url().startsWith('https://api.github.com/'))remotes.push(req.url());
  });
  page.setDefaultTimeout(30000);
  const item=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'))?.textOverlays[0];
  const recipe=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
  try{
   await page.goto('http://127.0.0.1:'+server.address().port+
    '/?r='+encodeRecipe(base),{waitUntil:'domcontentloaded'});
   await page.locator('#mobileEdit').tap();
   await page.locator('#tab-details').tap();
   await page.locator('.editor-tool-chooser [data-editor-tool="typography"]').tap();
   await page.locator('.text-overlay-advanced > summary').tap();
   await page.locator('.text-overlay-effects > summary').tap();
   const outline=page.locator('[data-text-key="outline"]');
   const shadow=page.locator('[data-text-key="shadow"]');
   const direction=page.locator('[data-text-key="shadowAngle"]');
   assert.equal(await direction.isDisabled(),true,'absent shadow should lock angle control');
   assert.equal(await direction.inputValue(),'45','legacy diagonal must be the displayed default');
   await outline.selectOption('black-white');
   assert.equal(item().outline,'black-white','two-tone outline not committed');
   await shadow.selectOption('white');
   assert.equal(item().shadow,'white','shadow colour choice not committed');
   assert.equal(await direction.isEnabled(),true,'shadow angle failed to unlock');
   await direction.focus();
   await direction.press('Home');
   await direction.press('Tab');
   assert.equal(item().shadowAngle,0,'keyboard 0 degrees not committed');
   // Source Undo must reverse only the last directional edit and restore
   // the canonical implicit legacy diagonal, not zero out the whole shadow.
   await page.locator('#undo').tap();
   assert.equal(item().shadow,'white','Undo unexpectedly removed shadow colour');
   assert.equal(item().shadowAngle,undefined,'Undo did not restore implicit legacy angle');
   assert.equal(await direction.inputValue(),'45','Undo did not restore visible 45° default');
   // The other two-tone direction is a separate canonical option.
   await outline.selectOption('white-black');
   assert.equal(item().outline,'white-black','reverse double-outline option inert');
   await direction.focus();
   await direction.press('End');
   await direction.press('Tab');
   assert.equal(item().shadowAngle,359,'end key direction not canonicalized');
   const saved=recipe();
   await page.locator('#mobileDismissHandle').tap();
   const [download]=await Promise.all([
    page.waitForEvent('download',{timeout:120000}),
    page.locator('#mobileDownload').tap()
   ]);
   assert.match(download.suggestedFilename(),/\.png$/i);
   const png=new Uint8Array(await readFile(await download.path()));
   assert.ok(png.length>100000,'visible PNG output is too small');
   assert.deepEqual(extractPngRecipe(png),saved,
    'visible Studio PNG omitted two-tone or directional canonical attributes');
   assert.deepEqual(errors,[],'app browser exceptions');
   assert.deepEqual(remotes,[],'unconsented API requests');
   await page.screenshot({path:join(out,width+'x'+height+'.png'),animations:'disabled'});
   const receipt={viewport:[width,height],twoToneBothDirections:true,
    implicitDiagonalUndo:true,keyboardAngleHomeAndEnd:true,
    shadowControlDisabledWithoutShadow:true,
    visiblePngExport:true,exportBytes:png.length,
    exactEmbeddedCanonicalRecipe:true,pageErrors:0,unsolicitedRemote:0,
    physicalPixel:'NOT TESTED',nativeIme:'NOT TESTED',
    talkBack:'NOT TESTED',handsetHeap:'NOT TESTED'};
   all.push(receipt);
   console.log('AGENT3_EFFECTS_PORTRAIT_PASS '+JSON.stringify(receipt));
  }catch(e){
   await page.screenshot({path:join(out,'failure-'+width+'.png')}).catch(()=>{});
   throw new Error(width+'x'+height+': '+e.stack);
  }finally{await context.close();}
 }
 await writeFile(join(out,'report.json'),JSON.stringify(all,null,2));
}finally{
 if(browser)await browser.close();
 await new Promise(ok=>server.close(ok));
}
