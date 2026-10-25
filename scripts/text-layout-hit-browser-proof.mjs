#!/usr/bin/env node
// Real source Chromium pointer/Undo witness for layout-aware text selection.
// The wallpaper is not a mock DOM rendering; actual app canvas listeners own
// pointer capture and transaction integration. Browser is not a physical Pixel.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe} from '../src/model.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'output','text-layout-pick');
await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.json':'application/json','.svg':'image/svg+xml','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{
  try{
    const file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!file.startsWith(root+'/')&&file!==root){res.writeHead(403).end();return;}
    const path=file===root?join(root,'index.html'):file;
    res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(await readFile(path));
  }catch{res.writeHead(404).end('Not Found');}
});
const baseRecipe=normalizeRecipe({seed:'layout-aware-arc-hit',palette:'classic',
  textOverlays:[
    {id:'behind',text:'UNDERLAY',enabled:true,colour:'white',outline:'none',
      font:'modern',size:72,x:50,y:50},
    {id:'hollow',text:'RAINBOW',enabled:true,path:'circle',pathHeight:175,
      font:'modern',size:64,colour:'rainbow-letter',outline:'black',x:50,y:50},
  ]});
let browser;
try{
  await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:412,height:892}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/?r='+
    encodeURIComponent(encodeRecipe(baseRecipe)),{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.editor-tool-card[data-editor-tool="typography"]',
    {state:'attached'});
  await page.locator('#mobileEdit').click();
  await page.locator('.settings-tab[data-tab="details"]').click();
  await page.locator('.editor-tool-tab[data-editor-tool="typography"]').click();
  await page.locator('[data-text-move]').click();
  assert.equal(await page.locator('#textDirectDone').isVisible(),true);
  const getRecipe=()=>page.evaluate(async()=>{
    const {decodeRecipe}=await import('/src/model.js');
    return decodeRecipe(new URL(location.href).searchParams.get('r'));
  });
  const rect=await page.locator('#preview').boundingBox();
  assert.ok(rect&&rect.width>100&&rect.height>200);
  const at=(x,y)=>({x:rect.x+x/600*rect.width,y:rect.y+y/1300*rect.height});
  const center=at(300,650);
  await page.locator('#preview').screenshot({path:join(out,'pre-move-hollow-arc.png')});
  // Centre is deliberately empty within the topmost curved text. The former
  // broad bounding box intercepted it. Actual pointerdown must fall through
  // and move only the visible white UNDERLAY behind the hollow arc.
  await page.mouse.move(center.x,center.y);await page.mouse.down();
  await page.mouse.move(center.x+rect.width*.1,center.y+rect.height*.03,{steps:5});
  await page.mouse.up();
  const moved=await getRecipe(),a=moved.textOverlays;
  const debug=await page.evaluate(async()=>{
    const {decodeRecipe}=await import('/src/model.js');
    const {hitTextAtLayout}=await import('/src/text-path-geometry.js');
    const {typefaceCssFamily}=await import('/src/typography-fonts.js');
    const canvas=document.querySelector('#preview'),ctx=canvas.getContext('2d');
    const current=decodeRecipe(new URL(location.href).searchParams.get('r'));
    const hit=hitTextAtLayout(current.textOverlays,{x:300,y:650},
      (item,text)=>{
        ctx.save();ctx.font='bold '+item.size+'px '+typefaceCssFamily(item.font);
        const w=ctx.measureText(text).width;ctx.restore();return w;
      },{tolerance:20,customPath:current.customPath});
    const rect=canvas.getBoundingClientRect();
    const at=document.elementFromPoint(rect.left+rect.width/2,
      rect.top+rect.height/2);
    return {hit:hit?.id||null,selected:document.querySelector('[data-text-picker]')?.value,
      element:at?.tagName,elementClass:at?.className?.baseVal||at?.className,
      active:document.body.classList.contains('text-direct-active'),
      canvas:rect.toJSON?.()||{width:rect.width,height:rect.height}};
  });
  console.log('LAYOUT_HIT_DIAG '+JSON.stringify({debug,items:a}));
  assert.equal(a.length,2);
  assert.ok(a[0].x>58&&a[0].x<62,'underlying lettering must move from hollow centre');
  assert.equal(a[1].x,50,'curved headline must not consume empty-space tap');
  await page.evaluate(()=>document.getElementById('undo').click());
  const undone=await getRecipe();
  assert.equal(undone.textOverlays[0].x,50,'one Undo must restore the whole underlying-text drag');
  // Pick a real curved glyph station, outside the centre void, and move the
  // topmost curved item without disturbing the underlying anchored X.
  const station=await page.evaluate(async()=>{
    const {decodeRecipe}=await import('/src/model.js');
    const {layoutTextOnPath}=await import('/src/text-path-geometry.js');
    const {typefaceCssFamily}=await import('/src/typography-fonts.js');
    const recipe=decodeRecipe(new URL(location.href).searchParams.get('r'));
    const top=recipe.textOverlays[1];
    const ctx=document.createElement('canvas').getContext('2d');
    ctx.font='bold '+top.size+'px '+typefaceCssFamily(top.font);
    const layout=layoutTextOnPath(top,top.text,s=>ctx.measureText(s).width);
    const glyph=layout.glyphs[1];
    return {x:600*top.x/100+glyph.x,y:1300*top.y/100+glyph.y};
  });
  const realInk=at(station.x,station.y);
  await page.mouse.move(realInk.x,realInk.y);await page.mouse.down();
  await page.mouse.move(realInk.x-rect.width*.08,realInk.y,{steps:6});
  await page.mouse.up();
  const next=await getRecipe();
  assert.equal(next.textOverlays[0].x,50);
  assert.ok(next.textOverlays[1].x<45,'actual curved glyph must select curved object');
  await page.locator('#preview').screenshot({path:join(out,'real-glyph-dragged.png')});
  // The same bitmap inspected by the browser is surfaced for optical review.
  const screenshot=await readFile(join(out,'real-glyph-dragged.png'));
  console.log('LAYOUT_HIT_ART_BASE64='+screenshot.toString('base64'));
  // Actual compositing must still leave saved ink and fresh worker matching.
  const parity=await page.evaluate(async()=>{
    const {decodeRecipe}=await import('/src/model.js');
    const {drawWallpaper}=await import('/src/renderer.js');
    const {exportWallpaperInWorker}=await import('/src/render-coordinator.js');
    const recipe=decodeRecipe(new URL(location.href).searchParams.get('r'));
    const make=()=>{const canvas=document.createElement('canvas');
      canvas.width=360;canvas.height=780;return canvas;};
    const ref=make(),worker=make();drawWallpaper(ref,recipe);
    const blob=await exportWallpaperInWorker({recipe,width:360,height:780,timeoutMs:90000});
    const bitmap=await createImageBitmap(blob);
    worker.getContext('2d').drawImage(bitmap,0,0);bitmap.close();
    const bytes=c=>c.getContext('2d',{willReadFrequently:true})
      .getImageData(0,0,360,780).data;
    const A=bytes(ref),B=bytes(worker);
    let differences=0;for(let i=0;i<A.length;i++)if(A[i]!==B[i])differences++;
    return {differences,pngBytes:blob.size};
  });
  assert.equal(parity.differences,0);
  assert.deepEqual(errors,[]);
  const proof={status:'PASS',viewport:'emulated Chromium 412x892, not physical handset',
    emptyArcCenterPickedBehind:true,
    curvedActualGlyphPickedTop:true,oneUndoRestored:true,
    changes:{bottomAfterFirst:a[0].x,topAfterFirst:a[1].x,topAfterSecond:next.textOverlays[1].x},
    parity,browserErrors:errors};
  await writeFile(join(out,'report.json'),JSON.stringify(proof,null,2)+'\n');
  console.log('TEXT LAYOUT HIT BROWSER PROOF '+JSON.stringify(proof));
}finally{await browser?.close();server.close();}
