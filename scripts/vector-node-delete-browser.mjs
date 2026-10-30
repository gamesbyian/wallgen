#!/usr/bin/env node
// Actual Chrome pointer journey for native v3 Bézier authoring (not a physical
// Android/IME/TalkBack or human tactile usability certification).
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {normalizeRecipe,decodeRecipe,encodeRecipe} from '../src/model.js';
import {pointOnVectorSegment} from '../src/vector-path-commands.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'artifacts/vector-v3-authoring');
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf',
  '.json':'application/json','.png':'image/png'};
const server=createServer(async(req,res)=>{
  try{
    const abs=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
    if(abs!==root&&!abs.startsWith(root+'/')){res.writeHead(403).end();return;}
    const file=abs===root?join(root,'index.html'):abs;
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(await readFile(file));
  }catch{res.writeHead(404).end('Not Found');}
});
const recipe=normalizeRecipe({seed:'v3-direct-authoring',structure:'paths',geometry:'drawn',
  construction:'stroke',spread:28,viewZoom:1,viewPanX:0,viewPanY:0,
  vectorPath:{space:'normalized-design',closed:false,
    start:{id:'start',point:[.13,.2]},segments:[
      {kind:'cubic',to:{id:'bend',point:[.5,.46]},
        controlOut:[.25,.3],controlIn:[.38,.42]},
      {kind:'cubic',to:{id:'finish',point:[.85,.8]},
        controlOut:[.65,.5],controlIn:[.75,.72]}],
    nodeModes:{bend:'aligned'}}});
const current=page=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
const summary=[],pageErrors=[];let browser;
try{
  await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes);});
  browser=await chromium.launch({headless:true});
  for(const [width,height] of [[320,700],[412,892]]){
    const page=await browser.newPage({viewport:{width,height},isMobile:true,
      hasTouch:true,reducedMotion:'reduce',deviceScaleFactor:1});
    page.setDefaultTimeout(18000);
    page.on('pageerror',e=>pageErrors.push(String(e)));
    try{
      await page.goto('http://127.0.0.1:'+server.address().port+'/?r='+encodeRecipe(recipe),
        {waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
        null,{timeout:85000});
      const source=current(page);
      assert.deepEqual(source,recipe);
      const button=page.locator('#drawPathToggle');
      await button.click();
      assert.equal(await page.locator('#drawOverlay').isVisible(),true);
      const toolbar=page.locator('.vector-draw-tools');
      assert.equal(await toolbar.isVisible(),true);
      const toggle=toolbar.locator('.vector-draw-toggle');
      const touch=await toggle.evaluate(el=>{
        const r=el.getBoundingClientRect();
        return {width:r.width,height:r.height,
          hit:document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)===el};
      });
      assert.ok(touch.width>=44&&touch.height>=44&&touch.hit);
      const anchor=await page.locator('#preview').evaluate((canvas)=>{
        const b=canvas.getBoundingClientRect();
        return {x:b.left+.5*b.width,y:b.top+.46*b.height};
      });
      assert.equal(await page.evaluate(a=>document.elementFromPoint(a.x,a.y)?.id,anchor),
        'drawOverlay','true authored anchor needs unobstructed screen access');
      // No-movement selection must never touch the source recipe.
      await page.mouse.click(anchor.x,anchor.y);
      assert.deepEqual(current(page),source);
      await toggle.click();
      const panelMetrics=await toolbar.evaluate(el=>{
        const b=el.getBoundingClientRect();
        const controls=[...el.querySelectorAll('button,select')].map(child=>{
          const r=child.getBoundingClientRect();
          const found=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
          return {text:child.textContent.trim(),width:r.width,height:r.height,
            hit:found===child||child.contains(found),top:r.top,bottom:r.bottom};
        });
        return {box:{top:b.top,bottom:b.bottom,height:b.height},
          scroll:el.scrollHeight>el.clientHeight,controls};
      });
      assert.equal(panelMetrics.scroll,false,'v3 inspector cannot scroll');
      assert.ok(panelMetrics.box.top>=0&&panelMetrics.box.bottom<=height,
        'all controls must fit the mobile viewport');
      assert.ok(panelMetrics.box.height<=112,
        'two 44px control rows plus compact spacing');
      for(const action of panelMetrics.controls)
        assert.ok(action.width>=44&&action.height>=44&&action.hit&&
          action.top>=0&&action.bottom<=height,
          'inaccessible v3 control: '+JSON.stringify(action));
      const undo=toolbar.locator('button',{hasText:'Undo'});
      assert.equal(await undo.isDisabled(),true);
      const mode=toolbar.locator('select.vector-draw-action');
      assert.equal(await mode.inputValue(),'aligned');
      await mode.selectOption('mirrored');
      assert.equal(await undo.isDisabled(),false);
      await undo.click();
      assert.equal(await mode.inputValue(),'aligned');
      // Actual touch drag with controls collapsed, then local Undo.
      await toggle.click();
      await page.mouse.move(anchor.x,anchor.y);
      await page.mouse.down();
      await page.mouse.move(anchor.x+25,anchor.y+18,{steps:7});
      await page.mouse.up();
      await toggle.click();
      assert.equal(await undo.isDisabled(),false);
      await undo.click();
      assert.equal(await undo.isDisabled(),true);
      // Commit the no-op edit: source must be identical.
      await toolbar.locator('button',{hasText:'Use path'}).click();
      assert.deepEqual(current(page),source);
      assert.equal(await page.locator('#drawOverlay').isHidden(),true);
      // Reenter; this time commit actual node movement with a one-step
      // source recipe change and still-exact handle/node IDs.
      await button.click();
      await page.mouse.move(anchor.x,anchor.y);
      await page.mouse.down();
      await page.mouse.move(anchor.x+30,anchor.y+10,{steps:7});
      await page.mouse.up();
      await toggle.click();
      await page.screenshot({path:join(out,width+'x'+height+'-editing.png'),
        animations:'disabled'});
      await toolbar.locator('button',{hasText:'Use path'}).click();
      await page.waitForFunction(original=>{
        try{
          const saved=JSON.parse(decodeURIComponent(new URL(location.href).searchParams.get('r')));
          return saved.vectorPath?.segments?.[0]?.to?.point?.[0]!==original;
        }catch{return false;}
      },source.vectorPath.segments[0].to.point[0],{timeout:17000});
      const applied=current(page);
      assert.equal(applied.version,3);
      assert.equal(applied.vectorPath.segments[0].to.id,'bend');
      assert.ok(applied.vectorPath.segments[0].to.point[0]>
        source.vectorPath.segments[0].to.point[0]);
      assert.equal(applied.customPath.length,0);
      assert.deepEqual([applied.viewZoom,applied.viewPanX,applied.viewPanY],
        [1,0,0]);
      // Cancel another provisional edit and prove that it never changes
      // the saved URL/recipe or the current camera.
      const updated=applied;
      await button.click();
      const changedAnchor=await page.locator('#preview').evaluate((canvas,point)=>{
        const b=canvas.getBoundingClientRect();
        return {x:b.left+point[0]*b.width,y:b.top+point[1]*b.height};
      },updated.vectorPath.segments[0].to.point);
      await page.mouse.move(changedAnchor.x,changedAnchor.y);
      await page.mouse.down();
      await page.mouse.move(changedAnchor.x-19,changedAnchor.y+24,{steps:5});
      await page.mouse.up();
      await toggle.click();
      await toolbar.locator('button',{hasText:'Cancel'}).click();
      assert.deepEqual(current(page),updated);
      const screen=async point=>page.locator('#preview').evaluate((canvas,p)=>{
        const b=canvas.getBoundingClientRect();
        return {x:b.left+p[0]*b.width,y:b.top+p[1]*b.height};
      },point);
      // Selected true cubic tangent must move exact authored control points,
      // unlike the old sampled Draw editor's inferred tangent approximation.
      await button.click();
      await page.mouse.click(changedAnchor.x,changedAnchor.y);
      const handlePoint=updated.vectorPath.segments[1].controlOut;
      const handle=await screen(handlePoint);
      await page.mouse.move(handle.x,handle.y);
      await page.mouse.down();
      await page.mouse.move(handle.x+18,handle.y-12,{steps:6});
      await page.mouse.up();
      await toggle.click();
      assert.equal(await undo.isDisabled(),false);
      await toolbar.locator('button',{hasText:'Use path'}).click();
      await page.waitForFunction(prev=>{
        try{
          const x=JSON.parse(decodeURIComponent(new URL(location.href).searchParams.get('r')));
          return x.vectorPath.segments[1].controlOut[0]!==prev;
        }catch{return false;}
      },updated.vectorPath.segments[1].controlOut[0]);
      const withHandle=current(page);
      assert.equal(withHandle.vectorPath.segments[0].to.id,'bend');
      assert.notDeepEqual(withHandle.vectorPath.segments[1].controlOut,handlePoint);
      // Exact cubic subdivision must add one stable node, with no aliasing
      // back to the obsolete sampled coordinates.
      await button.click();
      await toggle.click();
      await toolbar.locator('button',{hasText:'Insert node'}).click();
      await toggle.click();
      const middle=pointOnVectorSegment(withHandle.vectorPath,0,.5);
      const segmentTouch=await screen(middle);
      assert.equal(await page.evaluate(pt=>document.elementFromPoint(pt.x,pt.y)?.id,
        segmentTouch),'drawOverlay');
      await page.mouse.click(segmentTouch.x,segmentTouch.y);
      await toggle.click();
      assert.equal(await undo.isDisabled(),false);
      await toolbar.locator('button',{hasText:'Use path'}).click();
      await page.waitForFunction(()=> {
        try{
          const x=JSON.parse(decodeURIComponent(new URL(location.href).searchParams.get('r')));
          return x.vectorPath.segments.length===3;
        }catch{return false;}
      });
      const inserted=current(page);
      assert.equal(inserted.vectorPath.segments.length,3);
      assert.match(inserted.vectorPath.segments[0].to.id,/^vectorNode/);
      assert.equal(inserted.vectorPath.segments[1].to.id,'bend');
      assert.equal(inserted.customPath.length,0);
      // Screen-direction axis lock must preserve the actual normalized Y.
      await button.click();
      await toggle.click();
      await toolbar.locator('button',{hasText:'Lock axis'}).click();
      await toggle.click();
      const bend=inserted.vectorPath.segments[1].to.point;
      const bendScreen=await screen(bend);
      await page.mouse.move(bendScreen.x,bendScreen.y);
      await page.mouse.down();
      await page.mouse.move(bendScreen.x+31,bendScreen.y+3,{steps:6});
      await page.mouse.up();
      await toggle.click();
      await toolbar.locator('button',{hasText:'Use path'}).click();
      await page.waitForFunction(prev=>{
        try{
          const x=JSON.parse(decodeURIComponent(new URL(location.href).searchParams.get('r')));
          return x.vectorPath.segments[1].to.point[0]!==prev;
        }catch{return false;}
      },bend[0]);
      const locked=current(page);
      assert.equal(locked.vectorPath.segments[1].to.point[1],bend[1]);
      assert.ok(locked.vectorPath.segments[1].to.point[0]>bend[0]);
      // A user-chosen delete is previewed locally, with Undo preserving
      // the original source, and must fit the existing two-row touch panel.
      await button.click();
      const beforeDelete=locked.vectorPath;
      const bendTouch=await screen(beforeDelete.segments[1].to.point);
      await page.mouse.click(bendTouch.x,bendTouch.y);
      await toggle.click();
      const deleteMode=toolbar.locator('select.vector-draw-action');
      await deleteMode.selectOption('delete');
      assert.equal(await undo.isDisabled(),false);
      assert.deepEqual(current(page),locked,'delete is still provisional');
      await undo.click();
      assert.equal(await undo.isDisabled(),true);
      // Deleting by keyboard uses the same single-action transaction.
      await toggle.click();
      await page.mouse.click(bendTouch.x,bendTouch.y);
      await page.keyboard.press('Delete');
      await toggle.click();
      assert.equal(await undo.isDisabled(),false);
      await page.screenshot({path:join(out,width+'x'+height+'-delete.png'),
        animations:'disabled'});
      await toolbar.locator('button',{hasText:'Use path'}).click();
      await page.waitForFunction(expected=>{
        try{
          const r=JSON.parse(decodeURIComponent(new URL(location.href).searchParams.get('r')));
          return r.vectorPath.segments.length===expected;
        }catch{return false;}
      },beforeDelete.segments.length-1);
      const fewer=current(page);
      assert.equal(fewer.vectorPath.segments.length,beforeDelete.segments.length-1);
      assert.equal(fewer.vectorPath.start.id,beforeDelete.start.id);
      assert.ok(!fewer.vectorPath.segments.some(seg=>seg.to.id==='bend'));
      assert.equal(fewer.vectorPath.closed,beforeDelete.closed);
      assert.equal(fewer.customPath.length,0);
      summary.push({viewport:[width,height],touchTarget:touch,
        sourcePreserved:true,moveSaved:true,cancelRestored:true,
        tangentHandleSaved:true,cubicInserted:true,axisConstrained:true,
        touchDeleteUndone:true,keyboardDeleteSaved:true});
    }finally{await page.close();}
  }
  assert.deepEqual(pageErrors,[]);
  await writeFile(join(out,'report.json'),JSON.stringify(summary,null,2));
  console.log('VECTOR_V3_AUTHORING_PASS '+JSON.stringify(summary));
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
