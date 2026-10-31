#!/usr/bin/env node
// True Chromium overlapping-node selection, not a synthetic hit-only proof.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'artifacts/vector-overlap-cycle');
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
const path={space:'normalized-design',closed:false,
 start:{id:'start',point:[.2,.2]},segments:[
  {kind:'line',to:{id:'a',point:[.5,.46]}},
  {kind:'line',to:{id:'b',point:[.503,.462]}},
  {kind:'line',to:{id:'c',point:[.506,.464]}},
  {kind:'line',to:{id:'finish',point:[.8,.8]}}]};
const initial=normalizeRecipe({seed:'overlap-three',structure:'paths',
 geometry:'drawn',construction:'stroke',vectorPath:path});
const recipe=page=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
const pointFor=(page,point)=>page.locator('#preview').evaluate((canvas,p)=>{
 const box=canvas.getBoundingClientRect();
 return {x:box.left+p[0]*box.width,y:box.top+p[1]*box.height};
},point);
let browser;const report=[],errors=[];
try{
 await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes);});
 browser=await chromium.launch({headless:true});
 for(const [width,height] of [[320,700],[412,892]]){
  const page=await browser.newPage({viewport:{width,height},
   isMobile:true,hasTouch:true,reducedMotion:'reduce',deviceScaleFactor:1});
  page.setDefaultTimeout(20000);
  page.on('pageerror',err=>errors.push(String(err)));
  try{
   await page.goto('http://127.0.0.1:'+server.address().port+'/?r='+encodeRecipe(initial),
    {waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
    null,{timeout:85000});
   const original=recipe(page);
   await page.evaluate(()=>document.getElementById('drawPathToggle').click());
   const overlay=page.locator('#drawOverlay');
   assert.ok(await overlay.isVisible());
   const at=await pointFor(page,[.5,.46]);
   assert.equal(await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.id,at),
    'drawOverlay');
   for(let i=0;i<3;i++)await page.mouse.click(at.x,at.y);
   assert.deepEqual(recipe(page),original,'selection never authors a recipe');
   await page.keyboard.press('ArrowRight');
   const beforeURL=page.url();
   const toolbar=page.locator('.vector-draw-tools');
   await toolbar.locator('.vector-draw-toggle').click();
   await toolbar.locator('button',{hasText:'Use path'}).click();
   await page.waitForFunction(before=>location.href!==before,beforeURL);
   const edited=recipe(page),before=original.vectorPath;
   assert.ok(edited.vectorPath.segments[2].to.point[0]>
     before.segments[2].to.point[0],
    'third stationary tap must expose deepest authored C node');
   assert.deepEqual(edited.vectorPath.segments[0].to.point,before.segments[0].to.point);
   assert.deepEqual(edited.vectorPath.segments[1].to.point,before.segments[1].to.point);
   await page.evaluate(()=>document.getElementById('undo').click());
   assert.deepEqual(recipe(page),original);
   await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
     null,{timeout:85000});
   await page.evaluate(()=>document.getElementById('drawPathToggle').click());
   const tap=await pointFor(page,[.5,.46]);
   await page.mouse.click(tap.x,tap.y);
   await page.mouse.click(tap.x,tap.y);
   // The next pointerdown must drag B, rather than cycling the selection
   // ahead of a genuine movement to C or jumping back to the frontmost A.
   await page.mouse.move(tap.x,tap.y);
   await page.mouse.down();
   await page.mouse.move(tap.x+34,tap.y+12,{steps:8});
   await page.mouse.up();
   await toolbar.locator('.vector-draw-toggle').click();
   await toolbar.locator('button',{hasText:'Use path'}).click();
   const moved=recipe(page);
   assert.ok(moved.vectorPath.segments[1].to.point[0]>
     before.segments[1].to.point[0]+.02,'buried B node remains draggable');
   assert.deepEqual(moved.vectorPath.segments[0].to.point,before.segments[0].to.point);
   assert.deepEqual(moved.vectorPath.segments[2].to.point,before.segments[2].to.point);
   await page.screenshot({path:join(out,width+'x'+height+'.png'),animations:'disabled'});
   report.push({viewport:[width,height],threeNodeCycle:true,
    sourcePreservedOnTap:true,oneUndo:true,buriedDragPreserved:true});
  }finally{await page.close();}
 }
 assert.deepEqual(errors,[]);
 await writeFile(join(out,'report.json'),JSON.stringify(report,null,2));
 console.log('VECTOR_OVERLAP_CYCLE_BROWSER_PASS '+JSON.stringify(report));
}finally{
 await browser?.close();
 await new Promise(resolve=>server.close(resolve));
}
