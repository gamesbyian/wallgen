#!/usr/bin/env node
// Opt-in Chromium source-integrated proof of a displaced anchor grab handle.
// Real browser pointer input, NOT a physical device or human usability test.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'artifacts','offset-path-grip');
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2',
  '.ttf':'font/ttf','.json':'application/json'};
const server=createServer(async(req,res)=>{
  try{
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
    if(path!==root&&!path.startsWith(root+'/')){res.writeHead(403).end();return;}
    const file=path===root?join(root,'index.html'):path;
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(await readFile(file));
  }catch{res.writeHead(404).end('Not Found');}
});
const fixture=normalizeRecipe({seed:'offset-finger-grip-v1',structure:'paths',geometry:'drawn',
  customPath:[[.11,.12],[.18,.22],[.25,.33],[.34,.40],[.43,.47],
    [.51,.51],[.59,.56],[.68,.64],[.75,.71],[.82,.79],[.89,.86]],
  drawnAnchors:[5],drawnCorners:[],extendDrawnPath:false,
  viewZoom:1.15,viewPanX:3,viewPanY:-4,positionX:2,positionY:-1});
const selected=5, current=page=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
let browser;
const results=[];
try{
  await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes);});
  browser=await chromium.launch({headless:true});
  for(const [width,height] of [[320,700],[412,892]]){
    for(const mode of ['free','axis','cancel']){
      const page=await browser.newPage({viewport:{width,height},isMobile:true,
        hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});
      page.setDefaultTimeout(14000);
      const errors=[];page.on('pageerror',error=>errors.push(String(error)));
      try{
        await page.goto('http://127.0.0.1:'+server.address().port+'/?r='+encodeRecipe(fixture),
          {waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
          null,{timeout:80000});
        await page.locator('#drawPathToggle').click();
        await page.locator('#drawEditPoints').click();
        const origin=await page.evaluate(({point,recipe})=>{
          const p=document.getElementById('preview').getBoundingClientRect();
          const offsetX=(recipe.positionX-recipe.viewZoom*recipe.viewPanX)/100,
            offsetY=(recipe.positionY-recipe.viewZoom*recipe.viewPanY)/100;
          return {x:p.left+(.5+(point[0]-.5)*recipe.viewZoom+offsetX)*p.width,
            y:p.top+(.5+(point[1]-.5)*recipe.viewZoom+offsetY)*p.height};
        },{point:fixture.customPath[selected],recipe:fixture});
        const anchorHit=await page.evaluate(p=>{
          const node=document.elementFromPoint(p.x,p.y);
          const rect=el=>{const r=el.getBoundingClientRect();
            return {x:r.x,y:r.y,width:r.width,height:r.height};};
          return {id:node?.id,tag:node?.tagName,cls:String(node?.className||''),
            overlay:rect(document.getElementById('drawOverlay')),
            panel:rect(document.getElementById('drawPathPanel')),point:p};
        },origin);
        console.log('OFFSET_GRIP_ANCHOR_HIT',JSON.stringify({width,height,mode,...anchorHit}));
        assert.equal(anchorHit.id,'drawOverlay',
          'real anchor must remain reachable: '+JSON.stringify(anchorHit));
        await page.mouse.click(origin.x,origin.y);
        assert.equal(await page.locator('#drawUndoPoint').isDisabled(),true);
        const locateGrip=()=>page.evaluate(async({source,index})=>{
          const {createPointEditor,pointHandles,editablePointHandleSides}=
            await import('/src/path-point-editor.js');
          const {placeOffsetGrip}=await import('/src/path-offset-grip.js');
          const editor=createPointEditor(source.customPath,source.drawnAnchors,source.drawnCorners);
          editor.selected=index;
          const overlay=document.getElementById('drawOverlay');
          const bounds=overlay.getBoundingClientRect(),
            stage=document.querySelector('.studio-stage').getBoundingClientRect(),
            image=document.getElementById('preview').getBoundingClientRect(),
            panel=document.getElementById('drawPathPanel').getBoundingClientRect();
          const scale=overlay.width/stage.width,zoom=source.viewZoom;
          const panX=(source.positionX-zoom*source.viewPanX)/100,
            panY=(source.positionY-zoom*source.viewPanY)/100;
          const project=p=>[
            (image.left+(.5+(p[0]-.5)*zoom+panX)*image.width-stage.left)*scale,
            (image.top+(.5+(p[1]-.5)*zoom+panY)*image.height-stage.top)*scale
          ];
          const handles=pointHandles(editor,index);
          const obstacles=editor.anchors.filter(i=>i!==index)
            .map(i=>project(editor.points[i]));
          for(const side of editablePointHandleSides(editor,index))
            obstacles.push(project(handles[side]));
          const grip=placeOffsetGrip({anchor:project(editor.points[index]),
            width:overlay.width,height:overlay.height,scale,obstacles,
            blockedRects:[{x:(panel.left-bounds.left)*scale,y:(panel.top-bounds.top)*scale,
              width:panel.width*scale,height:panel.height*scale}]});
          if(!grip)return null;
          const x=bounds.left+grip.x/scale,y=bounds.top+grip.y/scale;
          return {x,y,radius:grip.radius/scale,hit:document.elementFromPoint(x,y)?.id,
            anchor:project(editor.points[index])};
        },{source:fixture,index:selected});
        let g=await locateGrip();
        assert.ok(g,'offset finger grip needs clear accessible space '+width);
        assert.equal(g.hit,'drawOverlay','offset handle must be genuinely clickable');
        assert.equal(g.radius,22,'large screen-space interactive radius');
        await page.mouse.click(g.x,g.y);
        assert.equal(await page.locator('#drawUndoPoint').isDisabled(),true,
          'grip tap without moving must be inert');
        if(mode==='axis'){
          const panel=page.locator('#drawPathPanel'),
            minimize=page.locator('.draw-panel-minimize');
          if(await panel.getAttribute('data-controls-collapsed')==='true')
            await minimize.click();
          await page.locator('#drawAxisLock').click();
          await minimize.click(); // keep the grip unobscured by the panel
        }
        g=await locateGrip();
        assert.ok(g&&g.hit==='drawOverlay');
        await page.mouse.move(g.x,g.y);
        await page.mouse.down();
        await page.mouse.move(g.x+32,g.y+(mode==='axis'?3:21),{steps:6});
        if(mode==='cancel'){
          await page.evaluate(()=>document.getElementById('drawOverlay').dispatchEvent(
            new PointerEvent('pointercancel',
              {bubbles:true,pointerId:1,pointerType:'touch',isPrimary:true})));
        }
        await page.mouse.up();
        if(mode==='cancel'){
          assert.equal(await page.locator('#drawUndoPoint').isDisabled(),true);
          if(await page.locator('#drawPathPanel')
            .getAttribute('data-controls-collapsed')==='true')
            await page.locator('.draw-panel-minimize').click();
          await page.locator('#drawCancel').click();
          assert.deepEqual(current(page),fixture,'canceled gesture kept source untouched');
        }else{
          assert.equal(await page.locator('#drawUndoPoint').isDisabled(),false);
          assert.deepEqual(current(page),fixture,'unapplied path changes are provisional');
          await page.screenshot({path:join(out,width+'x'+height+'-'+mode+'.png'),
            animations:'disabled'});
          if(await page.locator('#drawPathPanel')
            .getAttribute('data-controls-collapsed')==='true')
            await page.locator('.draw-panel-minimize').click();
          await page.locator('#drawApply').click();
          await page.waitForFunction(before=>{
            try{
              const recipe=JSON.parse(decodeURIComponent(
                new URL(location.href).searchParams.get('r')));
              const p=recipe.customPath[5];return p[0]!==before[0]||p[1]!==before[1];
            }catch{return false;}
          },fixture.customPath[selected],{timeout:12000});
          const actual=current(page),p=actual.customPath[selected],
            before=fixture.customPath[selected];
          assert.ok(p[0]>before[0],'offset drag must translate anchor in vector X');
          if(mode==='axis')assert.equal(p[1],before[1],
            'lock axis should constrain offset drag in vector Y');
          else assert.ok(p[1]>before[1],
            'free offset drag should change both vector axes');
          assert.deepEqual([actual.viewZoom,actual.viewPanX,actual.viewPanY],
            [fixture.viewZoom,fixture.viewPanX,fixture.viewPanY],
            'camera state must remain invariant under offset dragging');
          assert.ok(actual.drawnAnchors.includes(selected));
        }
        assert.deepEqual(errors,[]);
        results.push({viewport:[width,height],mode,gripRadiusCss:22,status:'pass'});
      }finally{await page.close();}
    }
  }
  await writeFile(join(out,'report.json'),JSON.stringify(results,null,2));
  console.log('PATH_OFFSET_GRIP_PASS '+JSON.stringify(results));
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
