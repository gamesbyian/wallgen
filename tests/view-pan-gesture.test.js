import test from 'node:test';
import assert from 'node:assert/strict';
import {beginViewPan,advanceViewPan} from '../src/view-pan-gesture.js';
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
