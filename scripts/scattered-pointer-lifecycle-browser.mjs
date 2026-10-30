#!/usr/bin/env node
// Source-integrated pointer ownership acceptance: no stale drag after
// lostpointercapture, no secondary-pointer hijack, and one Undo for real move.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,join,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
import {RAINBOW_ORBITS} from '../src/scattered-composition.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'artifacts/scattered-pointer-lifecycle');
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
const initial=normalizeRecipe(RAINBOW_ORBITS);
const drawn=normalizeRecipe({seed:'draw-pointer-release',structure:'paths',
  geometry:'drawn',customPath:[[.12,.14],[.20,.25],[.28,.32],[.36,.42],
    [.44,.48],[.51,.51],[.59,.55],[.67,.62],[.73,.71],[.82,.79],[.88,.87]],
  drawnAnchors:[5],drawnCorners:[],viewZoom:1,viewPanX:0,viewPanY:0,
  positionX:0,positionY:0,extendDrawnPath:false});
const current=page=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
let browser;const report=[],errors=[];
try{
  await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes);});
  browser=await chromium.launch({headless:true});
  for(const [width,height] of [[320,700],[412,892]]){
    const page=await browser.newPage({viewport:{width,height},isMobile:true,
      hasTouch:true,reducedMotion:'reduce',deviceScaleFactor:1});
    page.setDefaultTimeout(18000);
    page.on('pageerror',err=>errors.push(String(err)));
    try{
      await page.goto('http://127.0.0.1:'+server.address().port+'/?r='+encodeRecipe(initial),
        {waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
        null,{timeout:85000});
      assert.deepEqual(current(page),initial);
      await page.evaluate(()=>document.getElementById('scatteredMoveOnCanvas').click());
      assert.equal(await page.evaluate(()=>document.body.classList.contains('scattered-direct-active')),true);
      const selected=await page.evaluate(async()=>{
        const {decodeRecipe,resolveScene}=await import('/src/model.js');
        const {scatteredWorldToPixel,pickScatteredRegion}=await import('/src/scattered-drag.js');
        const recipe=decodeRecipe(new URL(location.href).searchParams.get('r'));
        const objects=resolveScene(recipe).objects;
        const canvas=document.getElementById('preview'),rect=canvas.getBoundingClientRect();
        for(const object of objects.slice().reverse()){
          if(!object.circle)continue;
          const circle=object.circle;
          const pt=scatteredWorldToPixel(recipe,canvas.width,canvas.height,circle.cx,circle.cy);
          const x=rect.left+pt.x*rect.width/canvas.width;
          const y=rect.top+pt.y*rect.height/canvas.height;
          if(x<rect.left+32||x>rect.right-32||y<rect.top+32||y>rect.bottom-32)continue;
          if(pickScatteredRegion(objects,{x:circle.cx,y:circle.cy})?.id!==object.id)continue;
          return {x,y,id:object.id};
        }
        return null;
      });
      assert.ok(selected,'need a topmost, visible authored circle centre');
      await page.evaluate(()=>document.getElementById('preview').addEventListener('pointerdown',
        e=>{window.__scatterTestPointer=e.pointerId;},{once:true}));
      await page.mouse.move(selected.x,selected.y);
      await page.mouse.down();
      const pointer=await page.evaluate(()=>{
        const canvas=document.getElementById('preview');
        return {id:window.__scatterTestPointer,
          captured:canvas.hasPointerCapture(window.__scatterTestPointer)};
      });
      assert.ok(pointer.captured,'first direct drag must own the real pointer');
      await page.mouse.move(selected.x+23,selected.y+14,{steps:5});
      await page.evaluate(id=>document.getElementById('preview').releasePointerCapture(id),pointer.id);
      await page.waitForFunction(id=>!document.getElementById('preview').hasPointerCapture(id),
        pointer.id);
      await page.mouse.up();
      assert.deepEqual(current(page),initial,
        'lost capture must discard the unfinished move rather than commit a stale drag');
      // A synthetic nonprimary pointer must not capture a drag or block the next real one.
      await page.evaluate(({x,y})=>{
        const canvas=document.getElementById('preview');
        canvas.dispatchEvent(new PointerEvent('pointerdown',{
          bubbles:true,pointerId:567,isPrimary:false,button:0,clientX:x,clientY:y}));
      },selected);
      await page.mouse.move(selected.x,selected.y);
      await page.mouse.down();
      await page.mouse.move(selected.x+25,selected.y+17,{steps:6});
      await page.mouse.up();
      await page.waitForFunction(()=>new URL(location.href).searchParams.get('r')!==null);
      const moved=current(page);
      assert.notDeepEqual(moved,initial,'next genuine drag should recover and commit');
      assert.ok(moved.scatteredOverrides?.length>=1);
      await page.evaluate(()=>document.getElementById('undo').click());
      assert.deepEqual(current(page),initial,'one Undo must reverse the real drag');
      await page.screenshot({path:join(out,width+'x'+height+'-scattered.png'),animations:'disabled'});
      // v2 sampled Draw shares the same canvas-pointer lifecycle. Exercise
      // real drawn-anchor move, force capture loss, then Apply the unchanged
      // canonical source. This replaces the old stale EventTarget fixture.
      await page.goto('http://127.0.0.1:'+server.address().port+'/?r='+encodeRecipe(drawn),
        {waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
        null,{timeout:85000});
      assert.deepEqual(current(page),drawn);
      await page.locator('#drawPathToggle').click();
      await page.locator('#drawEditPoints').click();
      assert.equal(await page.locator('#drawPathPanel').getAttribute('data-phase'),'anchors');
      const rect=await page.locator('#preview').boundingBox();
      const anchor=drawn.customPath[5],x=rect.x+anchor[0]*rect.width,
        y=rect.y+anchor[1]*rect.height;
      assert.equal(await page.evaluate(pt=>document.elementFromPoint(pt.x,pt.y)?.id,{x,y}),
        'drawOverlay','sampled anchor must be unobstructed');
      await page.mouse.click(x,y);
      assert.equal(await page.locator('#drawUndoPoint').isDisabled(),true);
      await page.evaluate(()=>document.addEventListener('pointerdown',event=>{
        window.__lostDrawPointer=event.pointerId;
      },{once:true,capture:true}));
      await page.mouse.move(x,y);await page.mouse.down();
      const dragId=await page.evaluate(()=>window.__lostDrawPointer);
      assert.equal(typeof dragId,'number');
      await page.mouse.move(x+31,y+18,{steps:7});
      await page.evaluate(id=>{
        const overlay=document.getElementById('drawOverlay');
        assertCapture(overlay,id);
        function assertCapture(el,pointerId){
          if(!el.hasPointerCapture(pointerId))throw Error('Draw must own actual pointer');
        }
        overlay.releasePointerCapture(id);
      },dragId);
      await page.mouse.up();
      assert.equal(await page.locator('#drawUndoPoint').isDisabled(),true,
        'capture loss must discard pending v2 point history');
      const panel=page.locator('#drawPathPanel'),minimize=page.locator('.draw-panel-minimize');
      if(await panel.getAttribute('data-controls-collapsed')==='true')
        await minimize.click();
      await panel.locator('#drawApply').click();
      assert.deepEqual(current(page),drawn,
        'v2 Draw Apply after forced capture loss must preserve exact source recipe');
      await page.screenshot({path:join(out,width+'x'+height+'-draw-v2.png'),animations:'disabled'});
      report.push({viewport:[width,height],captureCancelled:true,
        nonprimaryIgnored:true,nextMoveCommits:true,undoRestores:true,
        legacyDrawLostCaptureCancel:true});
    }finally{await page.close();}
  }
  assert.deepEqual(errors,[]);
  await writeFile(join(out,'report.json'),JSON.stringify(report,null,2));
  console.log('SCATTERED_POINTER_LIFECYCLE_PASS '+JSON.stringify(report));
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
