#!/usr/bin/env node
// Actual Chromium regional embroidery precision rotation acceptance.
// Emulated 320/412 phone, never a physical Pixel or human feel claim.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
const root=process.cwd(),mime={'.html':'text/html','.js':'text/javascript',
  '.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
  try{
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=resolve(root,'.'+(path==='/'?'/index.html':path));
    if(!file.startsWith(root+'/')){res.writeHead(403).end();return;}
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'})
      .end(await readFile(file));
  }catch{res.writeHead(404).end();}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
const results=[];
try{
 browser=await chromium.launch({headless:true,
   ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),
   args:['--no-sandbox']});
 for(const [width,height] of [[320,700],[412,892]]){
   const page=await browser.newPage({viewport:{width,height},hasTouch:true,
     isMobile:true,reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   const initial=normalizeRecipe({seed:'embroider-rotate-'+width,structure:'regions',
     regionMode:'organic',
     surfaceTreatments:[
       {id:'editor-stitches',enabled:true,style:'tatami',target:{scope:'all'},
         pitch:5,relief:65,direction:38},
       {id:'independent',enabled:true,style:'chain',
         target:{scope:'palette',colorSlots:[4]},direction:101}
     ]});
   const recipe=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
   const treatment=id=>recipe().surfaceTreatments.find(t=>t.id===id);
   await page.goto(origin+'/?r='+encodeRecipe(initial),{waitUntil:'domcontentloaded'});
   await page.waitForSelector('[data-embroidery-precision="direction"]',{state:'attached'});
   await page.locator('#mobileEdit').click();
   await page.locator('#tab-material').click();
   await page.locator('.editor-tool-chooser [data-editor-tool="surface"]').click();
   const thread=page.locator('.embroidery-controls');
   if(!(await thread.evaluate(el=>el.open)))await thread.locator('summary').click();
   const trigger=page.locator('[data-embroidery-precision="direction"]');
   assert.equal(await trigger.isVisible(),true);
   console.log('EMBROIDERY_ROTATION_DEBUG',JSON.stringify(await page.evaluate(()=>({
     recipe:decodeURIComponent(new URL(location.href).searchParams.get('r')||'').slice(0,350),
     sourceDisabled:document.querySelector('[name="embroideryDirection"]')?.disabled,
     buttonDisabled:document.querySelector('[data-embroidery-precision]')?.disabled,
     sourceValue:document.querySelector('[name="embroideryDirection"]')?.value,
     target:document.querySelector('[name="embroideryTarget"]')?.value
   }))));
   assert.equal(await trigger.isEnabled(),true);
   const target=await trigger.boundingBox();
   assert.ok(target.width>=44&&target.height>=44,'Embroidery precision hitbox too small');
   await trigger.click();
   assert.equal(treatment('editor-stitches').direction,38);
   const numeric=page.locator('.rotation-scrub-entry');
   await numeric.fill('73.5');await numeric.press('Tab');
   assert.equal(treatment('editor-stitches').direction,73.5);
   assert.equal(treatment('independent').direction,101,'Unrelated treatment changed');
   await mkdir(join(root,'artifacts','embroidery-angle'),{recursive:true});
   await page.screenshot({path:join(root,'artifacts','embroidery-angle',width+'-dialog.png')});
   if(width===412){
     await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
       null,{timeout:45000});
     const parity=await page.evaluate(async()=>{
       const {decodeRecipe}=await import('/src/model.js');
       const {drawWallpaper}=await import('/src/renderer.js');
       const {exportWallpaperInWorker}=await import('/src/render-coordinator.js');
       const recipe=decodeRecipe(new URL(location.href).searchParams.get('r'));
       const compare=async payload=>{
         const make=()=>{const c=document.createElement('canvas');c.width=240;c.height=520;return c;};
         const a=make(),b=make();drawWallpaper(a,payload);
         const blob=await exportWallpaperInWorker({recipe:payload,width:240,height:520,timeoutMs:90000});
         const bitmap=await createImageBitmap(blob);
         b.getContext('2d').drawImage(bitmap,0,0);bitmap.close();
         const data=c=>c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,240,520).data;
         const x=data(a),y=data(b);let differences=0,pixels=0,max=0,total=0;
         for(let i=0;i<x.length;i+=4){
           let changed=false;
           for(let k=0;k<4;k++){
             const delta=Math.abs(x[i+k]-y[i+k]);
             if(delta){differences++;changed=true;total+=delta;max=Math.max(max,delta);}
           }
           if(changed)pixels++;
         }
         return {differences,pixels,max,meanAbsoluteChange:differences?total/differences:0};
       };
       return {
         edited:await compare(recipe),
         noTreatments:await compare({...recipe,surfaceTreatments:[]}),
         originalDirection:await compare({...recipe,surfaceTreatments:
           recipe.surfaceTreatments.map(x=>x.id==='editor-stitches'?{...x,direction:38}:x)})
       };
     });
     console.log('EMBROIDERY_PIXEL_PROBE',JSON.stringify(parity));
   }
   await page.locator('.rotation-scrub-close').click();
   await page.locator('#undo').click();
   assert.equal(treatment('editor-stitches').direction,38,'Exact edit must undo once');
   await trigger.click();
   const pad=page.locator('.rotation-scrub-pad'),box=await pad.boundingBox();
   const x=box.x+box.width/2,y=box.y+box.height/2;
   await page.mouse.move(x,y);await page.mouse.down();
   await page.mouse.move(x+40,y,{steps:7});await page.mouse.up();
   const changed=treatment('editor-stitches').direction;
   assert.ok(changed>38&&changed<90,'Pointer drag did not rotate stitch '+changed);
   await page.locator('.rotation-scrub-close').click();
   await page.locator('#undo').click();
   assert.equal(treatment('editor-stitches').direction,38,'Drag must undo once');
   await page.locator('[name="embroideryTarget"]').selectOption('off');
   assert.equal(await trigger.isDisabled(),true,'Off treatment must disable scrubber');
   await page.locator('[name="embroideryTarget"]').selectOption('all');
   assert.equal(await trigger.isEnabled(),true);
   assert.deepEqual(errors,[]);
   results.push({width,height,dragAngle:changed,ownerTreatmentPreserved:true});
   await page.close();
 }
 await writeFile(join(root,'artifacts','embroidery-angle','proof.json'),
   JSON.stringify({status:'PASS',results},null,2)+'\n');
 console.log('EMBROIDERY_ANGLE_CHROMIUM_PASS',JSON.stringify(results));
}finally{
 await browser?.close();await new Promise(ok=>server.close(ok));
}
