import test from 'node:test';
import assert from 'node:assert/strict';
import {beginViewPan,advanceViewPan,VIEW_PAN_INTENT_CSS_PX,beginViewPinch,
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
 assert.deepEqual([next.panX,next.panY],[-8.9,-8.9]);
 assert.deepEqual([next.displacementX,next.displacementY],[26.7,57.85]);
 const before=viewCamera(300,650,1,{panX:0,panY:0});
 const after=viewCamera(300,650,1,{panX:next.panX,panY:next.panY});
 assert.ok(Math.abs(after.offsetX-before.offsetX-26.7)<1e-9);
 assert.ok(Math.abs(after.offsetY-before.offsetY-57.85)<1e-9);
 assert.deepEqual([start.panX,start.panY],[0,0]);
});
test('zoom gain is mathematically inverse and saved framing is resolution independent',()=>{
 const double=advanceViewPan(make(2),{x:130,y:265});
 assert.deepEqual([double.panX,double.panY],[-4.4,-4.4]);
 assert.ok(Math.abs(double.displacementX-26.4)<1e-9);
 assert.ok(Math.abs(double.displacementY-57.2)<1e-9);
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

test('Frame pan requires real touch intent and never jumps at dead-zone exit',()=>{
 assert.equal(VIEW_PAN_INTENT_CSS_PX,8);
 const start=make();
 for(const amount of [1,3,7,8]){
   const noEdit=advanceViewPan(start,{x:100+amount,y:200});
   assert.equal(noEdit.moved,false);
   assert.deepEqual([noEdit.panX,noEdit.panY,noEdit.displacementX,noEdit.displacementY],[0,0,0,0]);
 }
 const first=advanceViewPan(start,{x:109,y:200});
 assert.equal(first.panX,-.3);
 assert.equal(first.moved,true);
 assert.ok(first.displacementX>0&&first.displacementX<2,
   'crossing the intent threshold must not teleport the canvas by eight pixels');
 const farther=advanceViewPan(start,{x:116,y:200});
 assert.ok(farther.displacementX>first.displacementX);
 assert.ok(farther.displacementX<9,
   'gain grows smoothly from the authored source point');
 assert.deepEqual([start.panX,start.panY],[0,0]);
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

import {readFileSync} from 'node:fs';
test('Frame mode Escape and Done restore a visible keyboard entry without a camera edit',()=>{
  const source=readFileSync(new URL('../src/view-pan-ui.js',import.meta.url),'utf8');
  assert.match(source,/const mobile=document\.body\.classList\.contains\('mobile-studio'\)/);
  assert.match(source,/\(mobile\|\|button\)\.focus\(\{preventScroll:true\}\)/);
  assert.match(source,/done\.addEventListener\('keydown',event=>\{/);
  assert.match(source,/event\.preventDefault\(\);event\.stopPropagation\(\);\s*closeAndFocus\(\)/);
  assert.match(source,/done\.addEventListener\('click',closeAndFocus\)/);
  assert.match(source,/window\.addEventListener\('keydown',event=>\{/);
  assert.match(source,/clearGesture\(\);\s*const requested=Boolean\(value\)/,
    'Escape closes frame mode via normal cancellation, not a second camera writer');
});


test('Frame pointer capture rolls back on resize, pagehide and hidden document', async () => {
  const {installViewPanGesture}=await import('../src/view-pan-ui.js');
  const previousDocument=globalThis.document;
  const previousWindow=globalThis.window;
  const makeTarget=()=>({
    style:{touchAction:'auto',transform:'',transformOrigin:''},
    hidden:false,events:new Map(),attributes:new Map(),
    addEventListener(type,listener){
      const list=this.events.get(type)||[];
      list.push(listener);this.events.set(type,list);
    },
    emit(type,data={}){
      for(const listener of this.events.get(type)||[])listener(data);
    },
    setAttribute(key,value){this.attributes.set(key,value);},
    append(child){this.children??=[];this.children.push(child);},
    getBoundingClientRect(){return {left:0,top:0,width:300,height:650};},
    captured:new Set(),
    setPointerCapture(id){this.captured.add(id);},
    releasePointerCapture(id){this.captured.delete(id);},
    focus(){},
  });
  const pointer=(id,x,y)=>({button:0,isPrimary:id===7,
    pointerType:'touch',pointerId:id,clientX:x,clientY:y,
    preventDefault(){},stopImmediatePropagation(){}});
  try{
    for(const eventName of ['resize','pagehide','visibilitychange']){
      const preview=makeTarget(),stage=makeTarget(),host=makeTarget();
      const mockWindow=makeTarget(),mockDocument=makeTarget();
      mockDocument.body={classList:{contains:()=>false,toggle(){}}};
      mockDocument.createElement=()=>makeTarget();
      mockDocument.getElementById=()=>null;
      mockDocument.hidden=false;
      globalThis.window=mockWindow;globalThis.document=mockDocument;
      const original={viewZoom:1,viewPanX:0,viewPanY:0};
      const writes=[];
      installViewPanGesture({getRecipe:()=>original,
        changeRecipe:(value,meta)=>writes.push({value,meta}),preview,stage,host});
      const button=host.children[0];
      button.emit('click');
      assert.equal(button.attributes.get('aria-pressed'),'true');
      preview.emit('pointerdown',pointer(7,100,200));
      preview.emit('pointermove',pointer(7,140,200));
      assert.notEqual(preview.style.transform,'','drag must visibly preview');
      assert(preview.captured.has(7));
      if(eventName==='visibilitychange'){
        mockDocument.hidden=true;
        mockDocument.emit('visibilitychange');
      }else mockWindow.emit(eventName);
      assert.equal(preview.style.transform,'','canceled gesture must roll back its preview');
      assert.equal(preview.captured.size,0,'capture must be released before delayed pointerup');
      preview.emit('pointerup',pointer(7,140,200));
      assert.equal(writes.length,0,eventName+' must not commit a stale pan');
      mockDocument.hidden=false;
      preview.emit('pointerdown',pointer(7,100,200));
      preview.emit('pointermove',pointer(7,130,200));
      preview.emit('pointerup',pointer(7,130,200));
      assert.equal(writes.length,1,'new valid drag should still commit once');
      assert.equal(writes[0].value.viewPanX,-7.3);
      assert.equal(writes[0].meta.cause,'view_pan_on_canvas');
      preview.emit('pointerdown',pointer(7,100,200));
      preview.emit('pointermove',pointer(7,103,200));
      preview.emit('pointerup',pointer(7,103,200));
      assert.equal(writes.length,1,'contact jitter must not append an Undo-worthy camera edit');
      preview.emit('pointerdown',pointer(7,100,200));
      preview.emit('pointerdown',pointer(8,200,200));
      preview.emit('pointermove',pointer(8,250,200));
      assert.match(preview.style.transform,/scale\(1\.5\)/,
        'two-finger pinch should preview a changed zoom');
      assert.deepEqual([...preview.captured].sort(),[7,8]);
      if(eventName==='visibilitychange'){
        mockDocument.hidden=true;
        mockDocument.emit('visibilitychange');
      }else mockWindow.emit(eventName);
      assert.equal(preview.style.transform,'');
      assert.equal(preview.captured.size,0,'both pinch captures must release');
      preview.emit('pointerup',pointer(8,250,200));
      preview.emit('pointerup',pointer(7,100,200));
      assert.equal(writes.length,1,'interrupted pinch must not add a camera edit');
    }
  }finally{
    if(previousDocument===undefined)delete globalThis.document;
    else globalThis.document=previousDocument;
    if(previousWindow===undefined)delete globalThis.window;
    else globalThis.window=previousWindow;
  }
});
