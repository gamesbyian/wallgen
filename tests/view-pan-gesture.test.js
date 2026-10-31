import test from 'node:test';
import assert from 'node:assert/strict';
import {beginViewPan,advanceViewPan,beginViewPinch,
  advanceViewPinch,viewPinchPreview} from '../src/view-pan-gesture.js';
import {viewCamera} from '../src/view-camera.js';
import {normalizeRecipe} from '../src/model.js';
function make(zoom=1,x=0,y=0){
 return beginViewPan({recipe:{viewZoom:zoom,viewPanX:x,viewPanY:y},
   point:{x:100,y:200},viewport:{width:300,height:650}});
}
test('viewport-only drag moves camera opposite to view pan with no jump',()=>{
 const start=make();
 assert.deepEqual([start.panX,start.panY],[0,0]);
 const next=advanceViewPan(start,{x:130,y:265});
 assert.deepEqual([next.panX,next.panY],[-10,-10]);
 assert.deepEqual([next.displacementX,next.displacementY],[30,65]);
 const before=viewCamera(300,650,1,{panX:0,panY:0});
 const after=viewCamera(300,650,1,{panX:next.panX,panY:next.panY});
 assert.equal(after.offsetX-before.offsetX,30);
 assert.equal(after.offsetY-before.offsetY,65);
 assert.deepEqual([start.panX,start.panY],[0,0]);
});
test('zoom gain is mathematically inverse and saved framing is resolution independent',()=>{
 const double=advanceViewPan(make(2),{x:130,y:265});
 assert.deepEqual([double.panX,double.panY],[-5,-5]);
 assert.deepEqual([double.displacementX,double.displacementY],[30,65]);
 const original=normalizeRecipe({viewZoom:2,viewPanX:0,viewPanY:0,
   positionX:11,positionY:-7});
 const changed=normalizeRecipe({...original,viewPanX:double.panX,viewPanY:double.panY});
 assert.equal(changed.positionX,original.positionX);
 assert.equal(changed.positionY,original.positionY);
 assert.equal(changed.viewZoom,original.viewZoom);
});
test('pan clamps at canonical 50%, preview respects clamp, and invalid samples are inert',()=>{
 const s=make(1,48,-49);
 const next=advanceViewPan(s,{x:5,y:275});
 assert.deepEqual([next.panX,next.panY],[50,-50]);
 assert.deepEqual([next.displacementX,next.displacementY],[-6,6.5]);
 assert.equal(advanceViewPan(s,{x:NaN,y:1}),s);
 assert.equal(beginViewPan({recipe:{viewZoom:0,viewPanX:0,viewPanY:0},
   point:{x:0,y:0},viewport:{width:300,height:650}}),null);
 assert.equal(advanceViewPan(s,{x:101,y:201}).moved,false);
});

const viewport={width:300,height:650};
test('two-finger zoom is normalized and anchored at the exact finger midpoint',()=>{
 const start=beginViewPinch({recipe:{viewZoom:1,viewPanX:0,viewPanY:0},
   first:{x:100,y:325},second:{x:200,y:325},viewport});
 assert.equal(start.zoom,1);
 const next=advanceViewPinch(start,{x:50,y:325},{x:250,y:325});
 assert.deepEqual([next.zoom,next.panX,next.panY],[2,0,0]);
 assert.equal(next.moved,true);
 assert.deepEqual(viewPinchPreview({viewZoom:1,viewPanX:0,viewPanY:0},
   next,viewport),{scale:2,x:0,y:0});
});
test('pinch maintains an off-centre world anchor while moving midpoint',()=>{
 const original={viewZoom:1.2,viewPanX:5,viewPanY:-8};
 const first={x:50,y:200},second={x:150,y:200};
 const state=beginViewPinch({recipe:original,first,second,viewport});
 const next=advanceViewPinch(state,{x:80,y:245},{x:240,y:245});
 const before=viewCamera(300,650,original.viewZoom,
   {panX:original.viewPanX,panY:original.viewPanY});
 const after=viewCamera(300,650,next.zoom,
   {panX:next.panX,panY:next.panY});
 const midpoint={x:100,y:200},newMidpoint={x:160,y:245};
 const world={x:(midpoint.x-before.offsetX)/before.scaleX,
   y:(midpoint.y-before.offsetY)/before.scaleY};
 assert.ok(Math.abs(after.offsetX+world.x*after.scaleX-newMidpoint.x)<.4);
 assert.ok(Math.abs(after.offsetY+world.y*after.scaleY-newMidpoint.y)<.4);
 const preview=viewPinchPreview(original,next,viewport);
 // Transform the original pixels around CSS centre, as the browser does.
 assert.ok(Math.abs((midpoint.x-150)*preview.scale+150+preview.x-
   newMidpoint.x)<.4);
 assert.ok(Math.abs((midpoint.y-325)*preview.scale+325+preview.y-
   newMidpoint.y)<.4);
});
test('pinch safely bounds zoom and pan, rejects invalid touches and leaves art unchanged',()=>{
 const source=normalizeRecipe({viewZoom:1,viewPanX:0,viewPanY:0,
   positionX:13,positionY:-7,seed:'pinch-world-anchor'});
 const state=beginViewPinch({recipe:source,
   first:{x:100,y:325},second:{x:200,y:325},viewport});
 const huge=advanceViewPinch(state,{x:-300,y:325},{x:500,y:325});
 assert.equal(huge.zoom,2.5);
 assert.equal(advanceViewPinch(state,{x:NaN,y:0},{x:200,y:0}),state);
 assert.equal(beginViewPinch({recipe:source,first:{x:10,y:10},
   second:{x:20,y:20},viewport}),null);
 const normalized=normalizeRecipe({...source,viewZoom:huge.zoom,
   viewPanX:huge.panX,viewPanY:huge.panY});
 assert.equal(normalized.positionX,source.positionX);
 assert.equal(normalized.positionY,source.positionY);
 assert.equal(normalized.viewZoom,2.5);
 assert.equal(viewPinchPreview(source,{zoom:0,panX:0,panY:0},viewport),null);
});
test('frame UI contains two-pointer rollback and one atomic camera commit',async()=>{
 const {readFileSync}=await import('node:fs');
 const ui=readFileSync(new URL('../src/view-pan-ui.js',import.meta.url),'utf8');
 assert.match(ui,/pinch\.ids\.includes\(event\.pointerId\)/);
 assert.match(ui,/clearGesture\(\); \/\/ One finger lifting ends/);
 assert.match(ui,/viewZoom:state\.zoom,\s*viewPanX:state\.panX,viewPanY:state\.panY/);
 assert.match(ui,/preview\.style\.touchAction=active\?'none':originalTouchAction/);
 assert.match(ui,/pinch&&pinch\.original!==getRecipe\(\)/);
});
