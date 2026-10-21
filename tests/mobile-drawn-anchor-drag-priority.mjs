#!/usr/bin/env node
/** Real finger start on selected Drawn anchor must drag anchor, not tangent. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
import {createPointEditor,pointHandles} from '../src/path-point-editor.js';

const url=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/mobile-drawn-anchor-drag');
await mkdir(out,{recursive:true});
const source=normalizeRecipe({
 seed:'source-anchor-versus-tangent-drag',structure:'paths',geometry:'drawn',
 customPath:[[.08,.08],[.11,.20],[.20,.36],[.48,.50],
   [.68,.60],[.80,.77],[.91,.90]],
 drawnAnchors:[3],drawnCorners:[],viewZoom:1,viewPanX:0,viewPanY:0,
 positionX:0,positionY:0
});
const browser=await chromium.launch({headless:true}),rows=[],failures=[];
try{
 for(const width of [320,412])for(const theme of ['cream','dark']){
  const context=await browser.newContext({viewport:{width,height:892},
    isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.setDefaultTimeout(15000);
  page.on('pageerror',e=>errors.push(String(e)));
  const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
  const position=(rect,p)=>({x:rect.x+p[0]*rect.width,y:rect.y+p[1]*rect.height});
  const swipe=async(from,dx,dy)=>{
    const cdp=await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',
      touchPoints:[{x:from.x,y:from.y,id:1}]});
    for(let i=1;i<=8;i++){
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',
        touchPoints:[{x:from.x+dx*i/8,y:from.y+dy*i/8,id:1}]});
      await page.waitForTimeout(16);
    }
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  };
  const begin=async()=>{
    await page.locator('#drawPathToggle').tap();
    await page.locator('#drawEditPoints').tap();
    assert.equal(await page.locator('#drawPathPanel').getAttribute('data-phase'),'anchors');
    const rect=await page.locator('#preview').boundingBox();
    const a=position(rect,source.customPath[3]);
    await page.touchscreen.tap(a.x,a.y);
    assert.ok(await page.locator('#drawCornerPoint').isEnabled(),
      'Touch failed to select original interior anchor');
    return {rect,anchor:a};
  };
  try{
   await page.goto(url+'/?r='+encodeRecipe(source),{waitUntil:'domcontentloaded'});
   await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
   await page.reload({waitUntil:'domcontentloaded'});
   assert.deepEqual(current(),source);
   const first=await begin();
   const intended=18;
   await swipe(first.anchor,intended,0);
   assert.ok(await page.locator('#drawUndoPoint').isEnabled(),
     'Dragging selected anchor did not create local Undo');
   assert.deepEqual(current(),source,'Unapplied finger drag changed saved recipe');
   await page.locator('#drawApply').tap();
   const moved=current(),actual=moved.customPath[3][0]-source.customPath[3][0];
   assert.ok(actual>=intended/first.rect.width*.55,
     'Real touch starting on selected anchor moved tangent instead of anchor: '+
       JSON.stringify({width,theme,actual,expected:intended/first.rect.width,
         anchorBefore:source.customPath[3],anchorAfter:moved.customPath[3],
         neighbourBefore:source.customPath[4],neighbourAfter:moved.customPath[4]}));
   assert.equal(moved.viewZoom,source.viewZoom);
   assert.equal(moved.viewPanX,source.viewPanX);
   assert.equal(moved.viewPanY,source.viewPanY);
   await page.locator('#undo').tap();
   assert.deepEqual(current(),source,'Original Undo failed after source anchor drag');
   // Independent real finger tangent drag: the anchor itself must remain fixed
   // and a neighbouring polyline sample should change before full Undo.
   const second=await begin();
   const editor=createPointEditor(source.customPath,source.drawnAnchors,source.drawnCorners);
   const tangent=pointHandles(editor,3).out;
   const tip=position(second.rect,tangent);
   const separation=Math.hypot(tip.x-second.anchor.x,tip.y-second.anchor.y);
   assert.ok(separation>=6,'Tangent closer than practical anchor exclusion core');
   await swipe(tip,0,-20);
   assert.ok(await page.locator('#drawUndoPoint').isEnabled(),
     'Real tangent drag had no local Undo');
   await page.locator('#drawApply').tap();
   const rotated=current();
   assert.deepEqual(rotated.customPath[3],source.customPath[3],
     'Real tangent drag mistakenly displaced anchor centre');
   assert.notDeepEqual(rotated.customPath,source.customPath,
     'Real tangent drag did not deform adjacent samples');
   await page.locator('#undo').tap();
   assert.deepEqual(current(),source,'Global Undo after tangent drag lost source');
   assert.deepEqual(errors,[]);
   const row={width,theme,anchorMoved:actual,
     tangentSeparation:separation,tangentChangedOnlyNeighbours:true,
     exactUndoTwice:true};
   rows.push(row);
   await page.screenshot({path:join(out,width+'-'+theme+'.png'),animations:'disabled'});
   console.log('DRAWN_NATIVE_ANCHOR_DRAG_PASS',JSON.stringify(row));
  }catch(error){
   failures.push({width,theme,error:String(error),stack:error.stack,pageErrors:errors});
   await page.screenshot({path:join(out,'failure-'+width+'-'+theme+'.png'),
     animations:'disabled'}).catch(()=>{});
  }finally{await context.close();}
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({rows,failures,
  excluded:['crowded multi-anchor gestures','physical Pixel fingers',
    'TalkBack','Android screen-magnifier accessibility']},null,2));
 assert.deepEqual(failures,[]);
}finally{await browser.close()}
