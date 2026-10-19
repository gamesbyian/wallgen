import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectGeometry} from '../scripts/ui-atlas-geometry.mjs';
const target=(l,t,r,b)=>({left:l,top:t,right:r,bottom:b});
const viewport=target(0,0,412,892);
test('in-viewport or subpixel clipping does not flood atlas findings',()=>{
 assert.equal(inspectGeometry(target(40,120,120,165),viewport).clipped,false);
 assert.equal(inspectGeometry(target(409,30,415,70),viewport).clipped,false);
});
test('real right-side clipping is actionable and measurable',()=>{
 const result=inspectGeometry(target(385,100,447,142),viewport);
 assert.equal(result.clipped,true);
 assert.equal(result.scrollClipped,false);
 assert.equal(result.missingPixels,35);
 assert.ok(result.visibleFraction>.3&&result.visibleFraction<.5);
});
test('intentional horizontal chooser scrolling is not a clipping defect',()=>{
 const result=inspectGeometry(target(370,130,475,170),viewport,[
   {bounds:target(20,100,400,190),kind:'scroll',x:true,y:false,element:'.editor-tool-chooser'}
 ]);
 assert.equal(result.scrollClipped,true);
 assert.equal(result.clipped,false);
 assert.equal(result.clipSources[0].element,'.editor-tool-chooser');
});
test('hidden card clipping is reportable, independent from scrolling',()=>{
 const result=inspectGeometry(target(20,540,370,625),viewport,[
   {bounds:target(10,500,382,583),kind:'hidden',x:true,y:true,element:'.editor-tool-card'}
 ]);
 assert.equal(result.clipped,true);
 assert.equal(result.scrollClipped,false);
 assert.equal(result.missingPixels,42);
});
test('offscreen fixed action is distinguished from intentionally scrollable list',()=>{
 const clipped=inspectGeometry(target(800,60,842,103),viewport);
 assert.equal(clipped.offscreen,true);
 assert.equal(clipped.clipped,true);
 const scroll=inspectGeometry(target(800,60,842,103),viewport,
   [{bounds:target(10,0,350,180),kind:'scroll',x:true,y:false,element:'.chooser'}]);
 // Entirely offscreen descendants are still intentional when clipped by a
 // known scrollable ancestor, even if viewport intersection is already zero.
 assert.equal(scroll.scrollClipped,true);
 assert.equal(scroll.clipped,false);
});
