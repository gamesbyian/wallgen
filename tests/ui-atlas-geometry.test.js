import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectGeometry,expectedPageScroll,inspectTargetBox} from '../scripts/ui-atlas-geometry.mjs';
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

test('page scrolling of desktop gallery/metadata does not imply missing controls',()=>{
 assert.equal(expectedPageScroll(true,true,[]),true);
 assert.equal(expectedPageScroll(true,true,[{kind:'scroll'}]),true);
 assert.equal(expectedPageScroll(true,true,[{kind:'hidden'}]),false);
 assert.equal(expectedPageScroll(true,false,[]),false);
 assert.equal(expectedPageScroll(false,true,[]),false);
});

test('target-size triage counts fully visible small controls and respects associated label rects',()=>{
  assert.deepEqual(inspectTargetBox({width:42,height:28}),
    {width:42,height:28,under24:false,under44:true});
  assert.deepEqual(inspectTargetBox({width:21,height:41}),
    {width:21,height:41,under24:true,under44:true});
  assert.deepEqual(inspectTargetBox(target(0,0,46,50)),
    {width:46,height:50,under24:false,under44:false});
  assert.deepEqual(inspectTargetBox({width:16,height:16}).under24,true);
});
test('atlas collects touch target boxes independently of screenshot clipping failures',()=>{
  const source=requireSource();
  assert.match(source,/const interactive=el\.matches\('button,input,select,textarea'\)/);
  assert.match(source,/measuredTouchTargets\+\+/);
  assert.match(source,/if\(!geometry\.clipped\)continue/);
  assert.ok(source.indexOf('measuredTouchTargets++')<source.indexOf('if(!geometry.clipped)continue'),
    'touch targets must be counted even when fully visible');
});
function requireSource(){
  return readFileSync(new URL('../scripts/ui-atlas-inspect.mjs',import.meta.url),'utf8');
}
