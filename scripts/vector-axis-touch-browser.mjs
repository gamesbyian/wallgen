#!/usr/bin/env node
// Opt-in real Chromium acceptance for the 30 Oct vector-axis Draw tool.
// Browser mouse pointer journeys in touch-capable mobile viewports are not
// physical Pixel 6 Pro, TalkBack, or a human one-thumb usability certificate.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'artifacts','vector-axis-touch');
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2',
  '.ttf':'font/ttf','.json':'application/json'};
const server=createServer(async(req,res)=>{
  try{
    const abs=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(abs!==root&&!abs.startsWith(root+'/')){res.writeHead(403).end();return;}
    const file=abs===root?join(root,'index.html'):abs;
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(await readFile(file));
  }catch{res.writeHead(404).end('Not Found');}
});
const fixture=normalizeRecipe({seed:'touch-axis-30-oct',structure:'paths',geometry:'drawn',
  customPath:[[.12,.14],[.20,.25],[.28,.32],[.36,.42],[.44,.48],
    [.51,.51],[.59,.55],[.67,.62],[.73,.71],[.82,.79],[.88,.87]],
  drawnAnchors:[5],drawnCorners:[],viewZoom:1,viewPanX:0,viewPanY:0,
  positionX:0,positionY:0,extendDrawnPath:false});
const targetIndex=5;
const current=page=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
const records=[];
let browser;
try{
  await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok);});
  browser=await chromium.launch({headless:true});
  for(const [width,height] of [[320,700],[412,892]]){
    for(const mode of ['horizontal','vertical','free','cancel']){
      const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,
        reducedMotion:'reduce',deviceScaleFactor:1});
      page.setDefaultTimeout(12000);
      const errors=[];
      page.on('pageerror',e=>errors.push(String(e)));
      try{
        await page.goto('http://127.0.0.1:'+server.address().port+'/?r='+encodeRecipe(fixture),
          {waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
          null,{timeout:80000});
        assert.deepEqual(current(page),fixture);
        await page.locator('#drawPathToggle').click();
        await page.locator('#drawPathPanel').waitFor({state:'visible'});
        await page.locator('#drawEditPoints').click();
        assert.equal(await page.locator('#drawPathPanel').getAttribute('data-phase'),'anchors');
        // The short portrait panel now deliberately collapses to reveal
        // obscured anchors; reopen it only while changing a tool modifier.
        const panel=page.locator('#drawPathPanel'),
          minimize=page.locator('.draw-panel-minimize');
        if(await panel.getAttribute('data-controls-collapsed')==='true')
          await minimize.click();
        const axis=page.locator('#drawAxisLock');
        assert.equal(await axis.isVisible(),true);
        const size=await axis.evaluate(el=>{
          const r=el.getBoundingClientRect();
          return {width:r.width,height:r.height,pressed:el.getAttribute('aria-pressed')};
        });
        assert.ok(size.width>=44&&size.height>=44,
          'Axis modifier must be accessible at portrait '+width+': '+JSON.stringify(size));
        if(mode!=='free'){
          await axis.click();
          assert.equal(await axis.getAttribute('aria-pressed'),'true');
        }
        if(width===320)await minimize.click();
        const rect=await page.locator('#preview').boundingBox();
        const anchor=fixture.customPath[targetIndex];
        const x=rect.x+anchor[0]*rect.width,y=rect.y+anchor[1]*rect.height;
        const hit=await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.id,{x,y});
        assert.equal(hit,'drawOverlay','selected vector anchor must be touch reachable');
        await page.mouse.click(x,y); // selects an actual authored anchor
        assert.equal(await page.locator('#drawCornerPoint').isDisabled(),false);
        const undo=page.locator('#drawUndoPoint');
        assert.equal(await undo.isDisabled(),true,'selecting alone must not create history');
        await page.mouse.move(x,y);
        await page.mouse.down();
        await page.mouse.up();
        assert.equal(await undo.isDisabled(),true,'no-op pointerdown/up must not create history');
        await page.mouse.move(x,y);
        await page.mouse.down();
        const dx=mode==='vertical'?2:26,dy=mode==='horizontal'?4:29;
        await page.mouse.move(x+dx,y+dy,{steps:4});
        if(mode==='cancel'){
          // Explicit browser-side pointercancel exercises the same rollback
          // listener; this is not a claim about a physical OS gesture steal.
          await page.evaluate(()=>{
            const overlay=document.querySelector('#drawOverlay');
            overlay.dispatchEvent(new PointerEvent('pointercancel',
              {bubbles:true,pointerId:1,pointerType:'touch',isPrimary:true}));
          });
        }
        await page.mouse.up();
        if(mode==='cancel'){
          assert.equal(await undo.isDisabled(),true,
            'canceled drag must not retain a local Undo transaction');
          await page.locator('#drawCancel').click();
          assert.deepEqual(current(page),fixture);
        }else{
          assert.equal(await undo.isDisabled(),false,'real movement must create Undo');
          const filename=width+'x'+height+'-'+mode+'.png';
          await page.screenshot({path:join(out,filename),animations:'disabled'});
          await page.locator('#drawApply').click();
          await page.waitForFunction(v=>{
            try{
              const r=JSON.parse(decodeURIComponent(new URL(location.href).searchParams.get('r')));
              return r.customPath?.[5]&&(r.customPath[5][0]!==v[0]||
                r.customPath[5][1]!==v[1]);
            }catch{return false;}
          },anchor,{timeout:12000});
          const applied=current(page),at=applied.customPath[targetIndex];
          assert.ok(applied.drawnAnchors.includes(targetIndex),
            'edited station remains user-authored in saved recipe');
          if(mode==='horizontal'){
            assert.equal(at[1],anchor[1],'horizontal constraint must preserve vector Y');
            assert.ok(at[0]>anchor[0],'horizontal must change X');
          }else if(mode==='vertical'){
            assert.equal(at[0],anchor[0],'vertical constraint must preserve vector X');
            assert.ok(at[1]>anchor[1],'vertical must change Y');
          }else{
            assert.ok(at[0]>anchor[0]&&at[1]>anchor[1],
              'free mode must retain both movements');
          }
          assert.equal(applied.viewZoom,fixture.viewZoom,
            'art edits must not alter camera zoom');
          assert.equal(applied.viewPanX,fixture.viewPanX);
          assert.equal(applied.viewPanY,fixture.viewPanY);
        }
        assert.deepEqual(errors,[],'uncaught app errors');
        records.push({viewport:[width,height],mode,status:'pass',hitbox:size});
      }finally{await page.close();}
    }
  }
  await writeFile(join(out,'report.json'),JSON.stringify(records,null,2));
  console.log('VECTOR_AXIS_TOUCH_PASS '+JSON.stringify(records));
}finally{
  await browser?.close();
  await new Promise(ok=>server.close(ok));
}
