#!/usr/bin/env node
/** Red-first: two close authored anchors must each win their own finger centre. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
import {createPointEditor} from '../src/path-point-editor.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/crowded-drawn-finger-select');
await mkdir(out,{recursive:true});
const source=normalizeRecipe({
 seed:'crowded-native-drawn-anchor-identity',structure:'paths',geometry:'drawn',
 customPath:[[.05,.12],[.20,.27],[.36,.42],[.47,.50],[.482,.50],
  [.495,.50],[.507,.50],[.52,.50],[.65,.63],[.80,.78],[.92,.92]],
 drawnAnchors:[3,7],drawnCorners:[7],
 viewZoom:1,viewPanX:0,viewPanY:0,positionX:0,positionY:0
});
const sourceEditor=createPointEditor(source.customPath,source.drawnAnchors,source.drawnCorners);
assert.ok(sourceEditor.anchors.includes(3)&&sourceEditor.anchors.includes(7),
 'Fixture should contain both independently pinned authored stations');
assert.ok(sourceEditor.corners.has(7)&&!sourceEditor.corners.has(3),
 'Opposite corner states must identify which source anchor is selected');
const browser=await chromium.launch({headless:true}),rows=[],failures=[];
try{
 for(const width of [320,412,499])for(const theme of ['cream','dark']){
  const context=await browser.newContext({viewport:{width,height:892},
    hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.setDefaultTimeout(20000);
  const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
  try{
   await page.goto(origin+'/?r='+encodeRecipe(source),{waitUntil:'domcontentloaded'});
   await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
   await page.reload({waitUntil:'domcontentloaded'});
   assert.deepEqual(current(),source);
   await page.locator('#drawPathToggle').tap();
   await page.locator('#drawEditPoints').tap();
   assert.equal(await page.locator('#drawPathPanel').getAttribute('data-phase'),'anchors');
   const frame=await page.locator('#preview').boundingBox();
   const a={x:frame.x+frame.width*source.customPath[3][0],
      y:frame.y+frame.height*source.customPath[3][1]};
   const b={x:frame.x+frame.width*source.customPath[7][0],
      y:frame.y+frame.height*source.customPath[7][1]};
   const proximity=Math.hypot(a.x-b.x,a.y-b.y);
   assert.ok(proximity>=6&&proximity<17,
     'Fixture must remain distinguishable but within existing handle hit radius: '+proximity);
   const corner=page.locator('#drawCornerPoint');
   for(const [point,expected] of [[a,'Make corner'],[b,'Make smooth'],
     [a,'Make corner'],[b,'Make smooth']]){
     const owner=await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.id,point);
     assert.equal(owner,'drawOverlay','Pointer plane blocked close source anchor');
     await page.touchscreen.tap(point.x,point.y);
     assert.equal(await corner.textContent(),expected,
       'Native finger on close authored anchor chose previous tangent or neighbour: '+
         JSON.stringify({width,theme,proximity,point,expected}));
     assert.ok(await corner.isEnabled());
   }
   await corner.tap();
   assert.equal(await corner.textContent(),'Make corner');
   await page.locator('#drawUndoPoint').tap();
   assert.equal(await corner.textContent(),'Make smooth',
     'Local point Undo lost selected authored corner identity');
   assert.deepEqual(current(),source,'Unapplied close-point editing mutated source');
   await page.screenshot({path:join(out,width+'-'+theme+'.png'),animations:'disabled'});
   await page.locator('#drawCancel').tap();
   assert.deepEqual(current(),source,'Cancel lost exact close-anchor authoring constraints');
   assert.deepEqual(errors,[]);
   const row={width,theme,proximity,selectedBothDirections:true,
     localUndo:true,cancelExactRecipe:true};
   rows.push(row);
   console.log('CROWDED_DRAWN_FINGER_PASS',JSON.stringify(row));
  }catch(error){
   failures.push({width,theme,error:String(error),stack:error.stack,pageErrors:errors});
   await page.screenshot({path:join(out,'failure-'+width+'-'+theme+'.png'),
      animations:'disabled'}).catch(()=>{});
  }finally{await context.close()}
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({rows,failures,
  limitations:['closer than six CSS pixels is intrinsically ambiguous',
    'not physical Pixel fingertips','not magnification/TalkBack/human approval']},null,2));
 assert.deepEqual(failures,[],'Close-point finger selection is not source-correct');
}finally{await browser.close()}
