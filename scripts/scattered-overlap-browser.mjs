#!/usr/bin/env node
// Genuine two-phone selection-cycle acceptance on source-backed circles.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
import {RAINBOW_ORBITS} from '../src/scattered-composition.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'artifacts/scattered-overlap');
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
 '.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2',
 '.ttf':'font/ttf','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(path!==root&&!path.startsWith(root+'/')){res.writeHead(403).end();return;}
  const file=path===root?join(root,'index.html'):path;
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream',
    'Cache-Control':'no-store'}).end(await readFile(file));
 }catch{res.writeHead(404).end('Not Found');}
});
const initial=normalizeRecipe({...RAINBOW_ORBITS,
 scatteredOverrides:[
  {index:0,x:.5,y:.5,radius:.25},
  {index:1,x:.5,y:.5,radius:.18},
  {index:2,x:.5,y:.5,radius:.1}
 ]});
const recipe=page=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
let browser;const errors=[],report=[];
try{
 await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes);});
 browser=await chromium.launch({headless:true});
 for(const [width,height] of [[320,700],[412,892]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:true,
   hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});
  page.setDefaultTimeout(18000);
  page.on('pageerror',e=>errors.push(String(e)));
  try{
   await page.goto('http://127.0.0.1:'+server.address().port+'/?r='+encodeRecipe(initial),
    {waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
    null,{timeout:85000});
   assert.deepEqual(recipe(page),initial);
   await page.evaluate(()=>document.getElementById('scatteredMoveOnCanvas').click());
   const target=await page.evaluate(async()=>{
     const {decodeRecipe,resolveScene}=await import('/src/model.js');
     const {hitScatteredRegions,scatteredWorldToPixel}
       =await import('/src/scattered-drag.js');
     const data=decodeRecipe(new URL(location.href).searchParams.get('r'));
     const canvas=document.getElementById('preview'),r=canvas.getBoundingClientRect();
     const p={x:300,y:650};
     const hits=hitScatteredRegions(resolveScene(data).objects,p);
     const projected=scatteredWorldToPixel(data,canvas.width,canvas.height,p.x,p.y);
     return {ids:hits.map(x=>x.id),x:r.left+projected.x*r.width/canvas.width,
       y:r.top+projected.y*r.height/canvas.height};
   });
   assert.ok(target.ids.length>=2,'two shapes must overlap in editable source geometry');
   assert.ok(target.x>20&&target.x<width-20&&target.y>60&&target.y<height-60,
     'overlap lies on visible unblocked preview');
   const selected=()=>page.evaluate(()=>
     document.querySelector('#scatteredObjectEditor select')?.value);
   await page.mouse.click(target.x,target.y);
   assert.equal(await selected(),target.ids[0].slice(7));
   assert.deepEqual(recipe(page),initial,'selection alone never edits a wallpaper');
   await page.mouse.click(target.x,target.y);
   assert.equal(await selected(),target.ids[1].slice(7),
     'repeat tap must select next painted shape beneath topmost');
   assert.deepEqual(recipe(page),initial);
   const status=await page.evaluate(()=>document.querySelector('#scatteredObjectEditor')
     .textContent);
   assert.match(status,/Overlap: 2 of/);
   // Press-and-drag after cycling must move the previously selected buried
   // shape, rather than jumping back to the topmost paint layer.
   await page.mouse.move(target.x,target.y);await page.mouse.down();
   await page.mouse.move(target.x+25,target.y+18,{steps:7});
   await page.mouse.up();
   const moved=recipe(page);
   const index=Number(target.ids[1].slice(7));
   assert.ok(moved.scatteredOverrides.some(o=>o.index===index));
   const before=initial.scatteredOverrides.find(o=>o.index===index);
   const after=moved.scatteredOverrides.find(o=>o.index===index);
   assert.notDeepEqual(after,before,'buried selection must be the drag target');
   for(const entry of initial.scatteredOverrides.filter(o=>o.index!==index)){
     assert.deepEqual(moved.scatteredOverrides.find(o=>o.index===entry.index),entry,
       'unselected shapes must retain their exact canonical values');
   }
   await page.evaluate(()=>document.getElementById('undo').click());
   assert.deepEqual(recipe(page),initial,'one Undo restores only the moved shape');
   await page.screenshot({path:join(out,width+'x'+height+'.png'),animations:'disabled'});
   report.push({viewport:[width,height],hits:target.ids.length,
     initialTopmost:true,cyclesUnderneath:true,selectionRecipeStable:true,
     buriedShapeDraggable:true,oneUndo:true});
  }finally{await page.close();}
 }
 assert.deepEqual(errors,[]);
 await writeFile(join(out,'report.json'),JSON.stringify(report,null,2));
 console.log('SCATTERED_OVERLAP_BROWSER_PASS '+JSON.stringify(report));
}finally{
 await browser?.close();
 await new Promise(resolve=>server.close(resolve));
}
