#!/usr/bin/env node
// Opt-in genuine Chromium journey for the touch-first rotation inspector.
// Run from repository root with Chrome and installed Playwright; physical
// Android/TalkBack acceptance is deliberately outside this proof.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve,extname,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const root=process.cwd(),mime={
 '.html':'text/html','.js':'text/javascript','.css':'text/css',
 '.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.png':'image/png'};
const server=createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+'/')){res.writeHead(403).end();return;}
  try{res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'}).end(readFileSync(file));}
  catch{res.writeHead(404).end();}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
const chrome=process.env.CHROME_BIN||'/usr/bin/google-chrome';
let browser;
const failures=[];
try{
 browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
 for(const width of [320,412]){
   const page=await browser.newPage({viewport:{width,height:width===320?700:892},
     isMobile:true,hasTouch:true,reducedMotion:'reduce'});
   page.on('pageerror',err=>failures.push(String(err)));
   const initial=normalizeRecipe({seed:'rotation-touch-journey',structure:'paths',
     orientation:'diagonal',geometry:'straight',material:'linen',
     textureStrength:70,textureRotation:17.5});
   const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
   await page.goto(base+'/?r='+encodeRecipe(initial),{waitUntil:'domcontentloaded'});
   await page.waitForSelector('[data-rotation-precision="textureRotation"]',{state:'attached'});
   await page.locator('#mobileEdit').click();
   await page.locator('#tab-material').click();
   await page.locator('[data-editor-tool="finish1"]').click();
   const trigger=page.locator('[data-rotation-precision="textureRotation"]');
   assert.equal(await trigger.isVisible(),true);
   const tbox=await trigger.boundingBox();
   assert.ok(tbox.height>=44&&tbox.width>=44,'Precision entry lacks 44px target at '+width);
   await trigger.click();
   const dialog=page.locator('.rotation-scrub-panel');
   assert.equal(await dialog.isVisible(),true);
   assert.equal(current().textureRotation,17.5,'Opening changed the source recipe');
   const pad=page.locator('.rotation-scrub-pad');
   const box=await pad.boundingBox();
   const x=box.x+box.width/2,y=box.y+box.height/2;
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.up();
   assert.equal(current().textureRotation,17.5,'Touch without moving changed angle');
   await page.mouse.move(x,y);await page.mouse.down();
   await page.mouse.move(x+65,y,{steps:8});await page.mouse.up();
   const changed=current().textureRotation;
   assert.ok(changed>17.5&&changed<90,'Horizontal drag did not update texture rotation: '+changed);
   await page.locator('.rotation-scrub-close').click();
   await page.locator('#undo').click();
   assert.equal(current().textureRotation,17.5,'One Undo did not undo complete drag');
   await trigger.click();
   const value=page.locator('.rotation-scrub-entry');
   await value.fill('359.9');await value.press('Tab');
   assert.equal(current().textureRotation,359.9,'Exact numeric rotation was not canonical');
   await page.locator('.rotation-scrub-close').click();
   await page.locator('#undo').click();
   assert.equal(current().textureRotation,17.5,'Numeric edit did not create one Undo');
   const lock=page.locator('.editor-tool-card[data-editor-tool="finish1"] .texture-rotation-field .setting-lock');
   await lock.click();
   assert.equal(await trigger.isDisabled(),true,'Locked field kept its precision entry');
   await lock.click();
   assert.equal(await trigger.isEnabled(),true);
   mkdirSync(join(root,'artifacts','rotation-touch'),{recursive:true});
   await page.screenshot({path:join(root,'artifacts','rotation-touch',width+'.png'),fullPage:false});
   await page.close();
 }
 assert.deepEqual(failures,[],'Unexpected page exceptions');
 console.log('ROTATION_TOUCH_CHROMIUM_PASS 320x700 and 412x892');
}finally{
 await browser?.close();await new Promise(ok=>server.close(ok));
}
