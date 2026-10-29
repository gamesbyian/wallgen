#!/usr/bin/env node
/* Real Chrome inspector integration for selected text and shadow angles.
 * Emulated phone interaction, not physical Android/IME/TalkBack acceptance. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
const root=process.cwd(),mime={'.js':'text/javascript','.css':'text/css',
  '.html':'text/html','.json':'application/json','.svg':'image/svg+xml',
  '.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
  try{
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=resolve(root,'.'+(path==='/'?'/index.html':path));
    if(!file.startsWith(root+'/')){res.writeHead(403).end();return;}
    res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'})
      .end(await readFile(file));
  }catch{res.writeHead(404).end();}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
let browser;
const report=[];
try{
 browser=await chromium.launch({headless:true,
   ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),
   args:['--no-sandbox']});
 for(const [width,height] of [[320,700],[412,892]]){
   const page=await browser.newPage({viewport:{width,height},hasTouch:true,
     isMobile:true,reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
   const initial=normalizeRecipe({seed:'precision-text-angle-'+width,structure:'paths'});
   await page.goto(base+'/?r='+encodeRecipe(initial),{waitUntil:'domcontentloaded'});
   await page.waitForSelector('.editor-tool-card[data-editor-tool="typography"]',{state:'attached'});
   await page.locator('#mobileEdit').click();
   await page.locator('.settings-tab[data-tab="details"]').click();
   await page.locator('.editor-tool-chooser [data-editor-tool="typography"]').click();
   await page.locator('[data-text-add]').click();
   await page.locator('[data-text-key="text"]').fill('ANGLE');
   await page.locator('[data-text-key="text"]').blur();
   await page.locator('.text-overlay-advanced > summary').click();
   const angle=page.locator('[data-text-precision="rotation"]');
   assert.equal(await angle.isEnabled(),true);
   assert.ok((await angle.boundingBox()).height>=44,'Text rotation entry below 44px');
   await angle.click();
   assert.equal(await page.locator('.rotation-scrub-panel').isVisible(),true);
   assert.equal(current().textOverlays[0].rotation,0);
   const exact=page.locator('.rotation-scrub-entry');
   await exact.fill('87');await exact.press('Tab');
   assert.equal(current().textOverlays[0].rotation,87);
   await page.locator('.rotation-scrub-close').click();
   await page.locator('#undo').click();
   assert.equal(current().textOverlays[0].rotation,0,'Exact text rotation must create one Undo');
   await angle.click();
   const pad=page.locator('.rotation-scrub-pad');
   const box=await pad.boundingBox();const x=box.x+box.width/2,y=box.y+box.height/2;
   await page.mouse.move(x,y);await page.mouse.down();
   await page.mouse.move(x+62,y,{steps:9});await page.mouse.up();
   const moved=current().textOverlays[0].rotation;
   assert.ok(moved>0&&moved<=45,'Text rotation did not follow gesture '+moved);
   await page.locator('.rotation-scrub-close').click();
   await page.locator('#undo').click();
   assert.equal(current().textOverlays[0].rotation,0,'Text drag must be one Undo');
   await page.locator('.text-overlay-effects > summary').click();
   const shadowAngle=page.locator('[data-text-precision="shadowAngle"]');
   assert.equal(await shadowAngle.isDisabled(),true,'Shadow angle must be gated when disabled');
   await page.locator('[data-text-key="shadow"]').selectOption('black');
   assert.equal(await shadowAngle.isEnabled(),true);
   await shadowAngle.click();
   await exact.fill('359');await exact.press('Tab');
   assert.equal(current().textOverlays[0].shadowAngle,359);
   await page.locator('.rotation-scrub-close').click();
   await page.locator('#undo').click();
   assert.equal(current().textOverlays[0].shadowAngle??45,45,
     'Shadow-angle exact entry must be one Undo');
   const firstId=current().textOverlays[0].id;
   await page.locator('[data-text-add]').click();
   const ids=current().textOverlays.map(item=>item.id);
   assert.equal(ids.length,2);
   assert.ok(ids.includes(firstId));
   await page.locator('.text-overlay-advanced > summary').evaluate(el=>{if(!el.parentElement.open)el.click();});
   await angle.click();
   await page.locator('[data-text-picker]').selectOption(firstId);
   await page.waitForFunction(()=>document.querySelector('.rotation-scrub-shade')?.hidden===true);
   assert.equal(current().textOverlays.length,2,'Dialog selection change corrupted text list');
   assert.deepEqual(errors,[]);
   await mkdir(join(root,'artifacts','precision-text'),{recursive:true});
   await page.screenshot({path:join(root,'artifacts','precision-text',width+'.png')});
   report.push({width,height,gestureRotation:moved,shadowChecked:true,errors:errors.length});
   await page.close();
 }
 await writeFile(join(root,'artifacts','precision-text','proof.json'),
   JSON.stringify({status:'PASS',report},null,2)+'\n');
 console.log('TEXT_PRECISION_CHROMIUM_PASS',JSON.stringify(report));
}finally{
 await browser?.close();await new Promise(ok=>server.close(ok));
}
