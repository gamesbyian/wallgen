#!/usr/bin/env node
// Real Chromium browser source acceptance. Synthetic composition events are
// not physical Android input or native IME/TalkBack confirmation.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'artifacts/agent3-664-ime-draft');
await mkdir(out,{recursive:true});
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript',
  '.json':'application/json','.ttf':'font/ttf','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const candidate=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(candidate!==root&&!candidate.startsWith(root+'/')){res.writeHead(403).end();return;}
  const path=candidate===root?join(root,'index.html'):candidate;
  res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream',
    'Cache-Control':'no-store'}).end(await readFile(path));
 }catch{res.writeHead(404).end('Missing');}
});
const seeded=normalizeRecipe({seed:'composition-draft-acceptance',structure:'paths',
  textOverlays:[{id:'text-1',text:'START',enabled:true,font:'bold',
    colour:'rainbow-letter',size:68,x:50,y:50}]});
const reports=[],browserErrors=[];
let browser;
try{
 await new Promise((ok,bad)=>{
  server.once('error',bad);server.listen(0,'127.0.0.1',ok);
 });
 const url='http://127.0.0.1:'+server.address().port+'/?r='+encodeRecipe(seeded);
 browser=await chromium.launch({headless:true});
 for(const [width,height] of [[320,700],[412,892]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,
   isMobile:true,acceptDownloads:true,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.setDefaultTimeout(30000);
  const recipe=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
  const field=page.locator('[data-text-key="text"]');
  try{
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.locator('#mobileEdit').tap();
   await page.locator('#tab-details').tap();
   await page.locator('.editor-tool-chooser [data-editor-tool="typography"]').tap();
   assert.equal(await field.inputValue(),'START');
   await field.focus();
   await field.press('End');
   await page.keyboard.insertText(' ADD');
   assert.equal(await field.inputValue(),'START ADD');
   assert.equal(recipe().textOverlays[0].text,'START','change must not commit mid-entry');
   await page.evaluate(()=>document.dispatchEvent(new Event('roygbiv-controls-synced')));
   assert.equal(await field.inputValue(),'START ADD',
     'background recipe sync clobbered focused uncommitted typing');
   assert.equal(await field.evaluate(el=>document.activeElement===el),true,
     'background control sync stole typing focus');
   await field.press('Tab');
   assert.equal(recipe().textOverlays[0].text,'START ADD',
     'blur/change did not commit a single complete edit');
   // DOM composition is synthetic. Its purpose is to reject a deterministic
   // text-input rewrite during an app control-sync, not certify Android IME.
   await field.focus();
   await field.evaluate(el=>{
     el.dispatchEvent(new CompositionEvent('compositionstart',
       {bubbles:true,data:''}));
     el.value='START ADD café';
     el.dispatchEvent(new InputEvent('input',
       {bubbles:true,inputType:'insertCompositionText',
        data:'café',isComposing:true}));
     el.dispatchEvent(new CompositionEvent('compositionupdate',
       {bubbles:true,data:'café'}));
   });
   assert.equal(recipe().textOverlays[0].text,'START ADD');
   await page.evaluate(()=>document.dispatchEvent(new Event('roygbiv-controls-synced')));
   assert.equal(await field.inputValue(),'START ADD café',
     'background sync clobbered simulated in-flight composition');
   await field.evaluate(el=>{
     el.dispatchEvent(new CompositionEvent('compositionend',
       {bubbles:true,data:'café'}));
     el.dispatchEvent(new Event('change',{bubbles:true}));
   });
   assert.equal(recipe().textOverlays[0].text,'START ADD café',
     'finished composition was not committed as complete Unicode text');
   assert.deepEqual(errors,[]);
   await page.screenshot({path:join(out,width+'x'+height+'.png')});
   const report={viewport:[width,height],focusRetained:true,
     uncommittedDraftPreserved:true,syntheticCompositionPreserved:true,
     singleChangeCommit:true,unicodeCodepoints:'START ADD café',
     browserErrors:0,physicalAndroid:'NOT TESTED',
     nativeIme:'NOT TESTED',talkBack:'NOT TESTED'};
   reports.push(report);
   console.log('AGENT3_IME_DRAFT_PASS '+JSON.stringify(report));
  }catch(error){
   await page.screenshot({path:join(out,'failure-'+width+'.png')}).catch(()=>{});
   throw new Error(width+'x'+height+': '+error.stack);
  }finally{await context.close();}
 }
 await writeFile(join(out,'report.json'),JSON.stringify(reports,null,2));
}finally{
 if(browser)await browser.close();
 await new Promise(ok=>server.close(ok));
}
