#!/usr/bin/env node
// Real two-portrait Chromium: text axis lock is a touch/UI state, not artwork.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=join(root,'artifacts/text-axis');
await mkdir(output,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
 '.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2',
 '.ttf':'font/ttf','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(path!==root&&!path.startsWith(root+'/')){res.writeHead(403).end();return;}
  res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream',
   'Cache-Control':'no-store'}).end(await readFile(path===root?join(root,'index.html'):path));
 }catch{res.writeHead(404).end('Not Found');}
});
const report=[],errors=[];
let browser;
try{
 await new Promise((ok,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',ok);});
 browser=await chromium.launch({headless:true});
 for(const [width,height] of [[320,700],[412,892]]){
  const page=await browser.newPage({viewport:{width,height},
    deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(String(e)));
  page.setDefaultTimeout(20000);
  try{
   await page.goto('http://127.0.0.1:'+server.address().port+'/',
     {waitUntil:'domcontentloaded'});
   await page.waitForSelector('.editor-tool-card[data-editor-tool="typography"]',{state:'attached'});
   await page.locator('#mobileEdit').click();
   await page.locator('.settings-tab[data-tab="details"]').click();
   await page.locator('.editor-tool-tab[data-editor-tool="typography"]').click();
   await page.locator('[data-text-add]').click();
   await page.locator('[data-text-key="text"]').fill('VECTOR AXIS');
   await page.locator('[data-text-key="text"]').blur();
   const recipe=()=>page.evaluate(async()=>{
    const {decodeRecipe}=await import('/src/model.js');
    return decodeRecipe(new URL(location.href).searchParams.get('r'));
   });
   const original=await recipe(),first=original.textOverlays[0];
   assert.equal(first.text,'VECTOR AXIS');
   await page.locator('[data-text-move]').click();
   const button=page.locator('#textDirectAxis');
   await button.waitFor({state:'visible'});
   const b=await button.boundingBox();
   assert.ok(b&&b.width>=44&&b.height>=44,'full 44 CSS px text axis toggle');
   assert.ok(b.x>=0&&b.x+b.width<=width,'toggle remains reachable at this portrait width');
   const rect=await page.locator('#preview').boundingBox();
   assert.ok(rect?.width>140&&rect?.height>250);
   const anchor={x:rect.x+rect.width*first.x/100,
     y:rect.y+rect.height*first.y/100};
   const move=async(dx,dy)=>{
    await page.mouse.move(anchor.x,anchor.y);await page.mouse.down();
    await page.mouse.move(anchor.x+rect.width*dx,
      anchor.y+rect.height*dy,{steps:12});
    await page.mouse.up();
    return (await recipe()).textOverlays[0];
   };
   await button.click();
   assert.equal(await button.getAttribute('aria-pressed'),'true');
   let result=await move(.13,.012);
   assert.ok(result.x>first.x+10&&result.y===first.y,
     'horizontal drag must freeze authored Y');
   await page.evaluate(()=>document.getElementById('undo').click());
   assert.deepEqual(await recipe(),original,'horizontal gesture commits one Undo');
   result=await move(.014,.13);
   assert.ok(result.y>first.y+10&&result.x===first.x,
     'vertical drag must freeze authored X');
   await page.evaluate(()=>document.getElementById('undo').click());
   assert.deepEqual(await recipe(),original,'vertical gesture commits one Undo');
   await button.click();
   assert.equal(await button.getAttribute('aria-pressed'),'false');
   result=await move(.11,.09);
   assert.ok(result.x>first.x+8&&result.y>first.y+7,
     'unlocked movement must update both authored coordinates');
   await page.evaluate(()=>document.getElementById('undo').click());
   assert.deepEqual(await recipe(),original,'free movement one Undo');
   await page.evaluate(()=>document.addEventListener('pointerdown',
     e=>{window.__textAxisPid=e.pointerId;},{capture:true,once:true}));
   await button.click();
   await page.mouse.move(anchor.x,anchor.y);await page.mouse.down();
   await page.mouse.move(anchor.x+rect.width*.14,anchor.y+8,{steps:10});
   await page.evaluate(()=>{
    const el=document.getElementById('preview');
    if(!el.hasPointerCapture(window.__textAxisPid))throw Error('missing captured pointer');
    el.releasePointerCapture(window.__textAxisPid);
   });
   await page.mouse.up();
   assert.deepEqual(await recipe(),original,'lost capture cancels axis-locked text move');
   await page.screenshot({path:join(output,width+'x'+height+'.png'),animations:'disabled'});
   report.push({viewport:[width,height],axis44:true,horizontal:true,vertical:true,
     free:true,undo:true,cancel:true});
  }finally{await page.close();}
 }
 assert.deepEqual(errors,[]);
 await writeFile(join(output,'report.json'),JSON.stringify(report,null,2));
 console.log('TEXT_AXIS_BROWSER_PASS '+JSON.stringify(report));
}finally{
 await browser?.close();
 await new Promise(done=>server.close(done));
}
