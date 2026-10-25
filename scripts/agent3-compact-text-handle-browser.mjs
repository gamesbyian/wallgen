#!/usr/bin/env node
// Genuine Chromium check: tiny/one-letter text remains touch-pickable while
// the same 44px rotation and scale handles remain keyboard/touch reachable.
// No physical handset claim.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve,extname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'artifacts/agent3-664-compact-grips');
await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.json':'application/json','.svg':'image/svg+xml','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{
 try{
  const p=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!p.startsWith(root+'/')&&p!==root){res.writeHead(403).end();return;}
  const file=p===root?join(root,'index.html'):p;
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream',
    'Cache-Control':'no-store'}).end(await readFile(file));
 }catch{res.writeHead(404).end('Not Found');}
});
let browser;const records=[];
try{
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
 browser=await chromium.launch({headless:true});
 for(const example of [
  {width:320,height:700,x:50,y:50,rotation:0,name:'320-middle'},
  {width:412,height:892,x:50,y:50,rotation:0,name:'412-middle'},
  {width:412,height:892,x:90,y:90,rotation:0,name:'412-near-right-bottom'},
  {width:412,height:892,x:50,y:4,rotation:0,name:'412-near-top'},
  {width:412,height:892,x:50,y:50,rotation:45,name:'412-rotated'}
 ]){
  const {width,height,x,y,rotation,name}=example;
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.setDefaultTimeout(30000);
  const recipe=normalizeRecipe({seed:'compact-grip-'+name,
    textOverlays:[{id:'tiny',text:'I',enabled:true,
      colour:'white',outline:'black',outlineWidth:5,
      font:'modern',size:36,x,y,rotation}]});
  const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
  try{
   await page.goto('http://127.0.0.1:'+server.address().port+'/?r='+
     encodeURIComponent(encodeRecipe(recipe)),{waitUntil:'domcontentloaded'});
   await page.locator('#mobileEdit').tap();
   await page.locator('.settings-tab[data-tab="details"]').tap();
   await page.locator('.editor-tool-tab[data-editor-tool="typography"]').tap();
   await page.locator('[data-text-move]').tap();
   const preview=await page.locator('#preview').boundingBox();
   assert.ok(preview&&preview.width>100&&preview.height>200);
   const where={x:preview.x+preview.width*x/100,
     y:preview.y+preview.height*y/100};
   const check=await page.evaluate(({where})=>{
     const f=document.querySelector('.text-direct-outline');
     const item=document.elementFromPoint(where.x,where.y);
     const handle=mode=>{
       const el=document.querySelector('[data-text-handle="'+mode+'"]');
       const r=el.getBoundingClientRect();
       const target=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
       return {width:r.width,height:r.height,left:r.left,right:r.right,
         top:r.top,bottom:r.bottom,centerTarget:target?.dataset?.textHandle||null};
     };
     return {classes:f.className,gripsReachable:f.dataset.gripReachable,
       target:item?.tagName,hitHandle:item?.dataset?.textHandle||null,
       scale:handle('scale'),rotate:handle('rotate'),
       active:document.body.classList.contains('text-direct-active')};
   },{where});
   assert.ok(check.classes.includes('text-direct-compact'),'small selection not marked compact');
   assert.equal(check.target,'CANVAS',
     '44px grip still steals a pointer intended for actual tiny text ink');
   assert.equal(check.gripsReachable,'true',
     'compact handles not fully reachable within actual current canvas');
   for(const mode of ['scale','rotate']){
     const box=check[mode];assert.ok(box.width>=43&&box.height>=43,
       mode+' failed 44px touch target acceptance');
     assert.equal(box.centerTarget,mode,
       mode+' grip is occluded by the other grip or scene DOM');
     assert.ok(box.left>=preview.x-1&&box.right<=preview.x+preview.width+1 &&
       box.top>=preview.y-1&&box.bottom<=preview.y+preview.height+1,
       mode+' button is clipped beyond the displayed phone wallpaper');
   }
   const cx=box=>(box.left+box.right)/2,cy=box=>(box.top+box.bottom)/2;
   const separation=Math.hypot(cx(check.scale)-cx(check.rotate),
     cy(check.scale)-cy(check.rotate));
   assert.ok(separation>=48,
     'two circular 44px transform buttons visually overlap: '+separation);
   if(example.name==='412-near-top')
     assert.match(check.classes,/text-direct-rotate-inset/);
   await page.locator('#preview').screenshot({path:join(out,name+'-before.png')});
   if(name.includes('middle')){
     const dx=preview.width*.08;
     await page.mouse.move(where.x,where.y);await page.mouse.down();
     await page.mouse.move(where.x+dx,where.y,{steps:5});await page.mouse.up();
     const updated=current();
     assert.ok(updated.textOverlays[0].x>x+5&&updated.textOverlays[0].x<x+11,
       'actual tiny glyph canvas pointer did not move editable text');
     await page.locator('#undo').evaluate(el=>el.click());
     assert.equal(current().textOverlays[0].x,x,'Undo failed compact glyph move');
     await page.locator('[data-text-handle="scale"]').focus();
     await page.locator('[data-text-handle="scale"]').press('ArrowUp');
     assert.equal(current().textOverlays[0].size,44,
       'preserved accessible 44px scale handle keyboard operation changed');
     await page.locator('#undo').evaluate(el=>el.click());
     assert.equal(current().textOverlays[0].size,36,'Undo failed scale');
     await page.locator('#preview').screenshot({path:join(out,name+'-after.png')});
   }
   assert.deepEqual(errors,[],'uncaught page exceptions');
   records.push({name,width,height,compact:true,pointerHitsInk:true,
     scaleAndRotateTouchable:true,edgeAdjusted:check.classes,
     oneUndo:true,pageErrors:0,physicalAndroid:'NOT TESTED'});
   console.log('AGENT3_COMPACT_HANDLE_PASS '+JSON.stringify(records.at(-1)));
  }catch(err){
   await page.screenshot({path:join(out,name+'-failure.png')}).catch(()=>{});
   throw new Error(name+': '+err.stack);
  }finally{await context.close();}
 }
 await writeFile(join(out,'report.json'),JSON.stringify(records,null,2)+'\n');
}finally{await browser?.close();if(server.listening)await new Promise(r=>server.close(r))}
