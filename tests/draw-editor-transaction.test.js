import test from 'node:test';
import assert from 'node:assert/strict';
import {installDrawTool,drawnPathViewportOffset} from '../src/draw-path-ui.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

// Exercise the installed UI listeners without taking over Agent 3's shared
// Chromium smoke harness. Native EventTargets ensure that consecutive click,
// pointer and key events execute the real Draw implementation.
class Element extends EventTarget {
  constructor(id=''){
    super();
    this.id=id;this.hidden=false;this.disabled=false;this.checked=false;
    this.value='3';this.textContent='';this.dataset={};this.attributes={};
    this.width=600;this.height=1300;
    const classes=new Set();
    this.classList={
      add:name=>classes.add(name),remove:name=>classes.delete(name),
      contains:name=>classes.has(name)
    };
  }
  setAttribute(name,value){this.attributes[name]=String(value);}
  getAttribute(name){return this.attributes[name]??null;}
  getBoundingClientRect(){return {left:0,top:0,width:600,height:1300};}
  getContext(){
    if(!this.canvasCalls)this.canvasCalls=[];
    return this.context||(this.context=new Proxy({},{
      get:(_target,key)=>key==='canvas'?this:(...args)=>{
        this.canvasCalls.push({key,args});
      }
    }));
  }
  click(){if(!this.disabled)this.dispatchEvent(new Event('click',{bubbles:true}));}
  focus(){}
  setPointerCapture(){}
  releasePointerCapture(){}
  closest(){return null;}
}
function fixture(recipeInput,{commitOnApply=false}={}){
  let recipe=normalizeRecipe(recipeInput);
  const snap=structuredClone(recipe);
  const ids=['drawPathToggle','drawPathPanel','drawOverlay','preview','drawPathHint',
    'drawApply','drawSmooth','drawGeometric','drawAgain','drawCancel',
    'drawSmoothingStrength','drawSmoothingValue','drawExtendPath',
    'drawEditPoints','drawAddPoint','drawDeletePoint','drawCornerPoint',
    'drawResmoothPoints','drawUndoPoint'];
  const nodes=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
  nodes.drawSmoothingStrength.value='3';
  nodes.drawUndoPoint.parentElement=new Element('undoContainer');
  const phase=new Element('phase');
  nodes.drawPathPanel.querySelector=selector=>selector==='.draw-phase'?phase:null;
  const stage=new Element('stage');
  stage.dataset.viewZoom=String(recipe.viewZoom);
  nodes.drawOverlay.parentElement=stage;
  const geometryOption=new Element('geometryOption');
  const document=new EventTarget();
  document.getElementById=id=>nodes[id];
  document.querySelector=selector=>selector==='.studio-stage'?stage:
    selector==='[name=geometry] option[value=drawn]'?geometryOption:null;
  document.body=new Element('body');
  const window=new EventTarget();
  const old={document:globalThis.document,window:globalThis.window};
  globalThis.document=document;globalThis.window=window;
  const calls=[];
  let tool;
  tool=installDrawTool({
    getRecipe:()=>recipe,
    onNotice:message=>{throw Error('Unexpected notice: '+message);},
    onApply:(...args)=>{
      calls.push(args);
      if(commitOnApply){
        // Simulate app.js synchronous changeRecipe → drawTool.sync on Apply.
        const [points,anchors,corners,extend]=args;
        recipe=normalizeRecipe({...recipe,customPath:points,
          drawnAnchors:anchors,drawnCorners:corners,extendDrawnPath:extend,
          structure:'paths',geometry:'drawn'});
        tool.sync(recipe);
      }
    }
  });
  return {
    get recipe(){return recipe;},snap,nodes,stage,document,window,calls,tool,
    replaceRecipe(input){
      recipe=normalizeRecipe(input);
      tool.sync(recipe);
    },
    cleanup(){
      tool.close();
      if(old.document===undefined)delete globalThis.document;
      else globalThis.document=old.document;
      if(old.window===undefined)delete globalThis.window;
      else globalThis.window=old.window;
    }
  };
}
const path=[
  [.36,.34],[.4,.37],[.45,.42],[.5,.44],[.54,.49],[.60,.55],[.65,.62]
];
function pointer(target,type,props){
  const event=new Event(type,{cancelable:true});
  for(const [key,value] of Object.entries(props))Object.defineProperty(event,key,{value});
  target.dispatchEvent(event);
}
function selectFirstAnchor(f){
  const [offsetX,offsetY]=drawnPathViewportOffset(f.recipe,true);
  const p=f.recipe.customPath[0],z=f.recipe.viewZoom;
  const clientX=600*(.5+(p[0]-.5)*z+offsetX);
  const clientY=1300*(.5+(p[1]-.5)*z+offsetY);
  pointer(f.nodes.drawOverlay,'pointerdown',{pointerId:4,isPrimary:true,clientX,clientY});
  pointer(f.nodes.drawOverlay,'pointerup',{pointerId:4,isPrimary:true,clientX,clientY});
}
function arrowRight(f){
  const key=new Event('keydown',{cancelable:true});
  Object.defineProperties(key,{
    key:{value:'ArrowRight'},shiftKey:{value:false},ctrlKey:{value:false},metaKey:{value:false}
  });
  f.document.dispatchEvent(key);
}
test('saved-path edit, hide and reopen keeps the composition/camera and the edited geometry',()=>{
  const f=fixture({seed:'saved-path-transaction',geometry:'drawn',structure:'paths',
    customPath:path,positionX:14,positionY:-11,viewZoom:1.3,
    viewPanX:10,viewPanY:-7,extendDrawnPath:true});
  try{
    f.nodes.drawPathToggle.click();
    f.nodes.drawEditPoints.click();
    assert.equal(f.nodes.drawPathPanel.dataset.phase,'anchors');
    selectFirstAnchor(f);
    arrowRight(f);
    f.nodes.drawEditPoints.click(); // Hide points (but retain edits).
    assert.equal(f.nodes.drawPathPanel.dataset.phase,'refine');
    f.nodes.drawEditPoints.click(); // Reopen the SAME saved geometry.
    assert.equal(f.nodes.drawPathPanel.dataset.phase,'anchors');
    f.nodes.drawApply.click();
    assert.equal(f.calls.length,1);
    const [edited,anchors,corners,extended,preservePosition]=f.calls[0];
    assert.equal(preservePosition,true,'editor reopening must retain saved origin');
    assert.equal(extended,true);
    assert.notDeepEqual(edited,f.recipe.customPath,'keyboard anchor change survived reentry');
    const applied=normalizeRecipe({...f.recipe,customPath:edited,
      drawnAnchors:anchors,drawnCorners:corners,extendDrawnPath:extended,
      positionX:preservePosition?f.recipe.positionX:0,
      positionY:preservePosition?f.recipe.positionY:0});
    for(const key of ['positionX','positionY','viewZoom','viewPanX','viewPanY',
      'geometry','orientation','seed','material','material2','material3']){
      assert.deepEqual(applied[key],f.snap[key],key+' changed outside the geometry edit');
    }
    assert.deepEqual(decodeRecipe(encodeRecipe(applied)),applied);
    assert.deepEqual(f.recipe,f.snap,'provisional Draw interaction must not mutate current recipe');
  }finally{f.cleanup();}
});

test('an imported replacement still uses new-path semantics after Hide/Edit points',()=>{
  const f=fixture({geometry:'drawn',customPath:path,positionX:19,positionY:8,
    viewZoom:.5,viewPanX:16,viewPanY:9});
  try{
    assert.equal(f.tool.loadPath({points:path.map(([x,y])=>[x+.1,y-.05]),
      anchors:[2],corners:[2]}),true);
    f.nodes.drawEditPoints.click();
    f.nodes.drawEditPoints.click();
    f.nodes.drawEditPoints.click();
    f.nodes.drawApply.click();
    assert.equal(f.calls.length,1);
    assert.equal(f.calls[0][4],false,
      'an imported replacement must not inherit existing artwork nudge');
    assert.deepEqual(f.recipe,f.snap);
  }finally{f.cleanup();}
});

test('inactive saved geometry is not advertised as editable, and Cancel commits nothing',()=>{
  const f=fixture({geometry:'wave',customPath:path,positionX:-9,viewPanX:17});
  try{
    f.nodes.drawPathToggle.click();
    assert.equal(f.nodes.drawEditPoints.hidden,true,
      'a dormant old customPath is not the active wave geometry');
    f.nodes.drawCancel.click();
    assert.equal(f.calls.length,0);
    assert.deepEqual(f.recipe,f.snap);
  }finally{f.cleanup();}
});

test('saved overlay redraw survives resize and both zoom event paths without committing',()=>{
  const f=fixture({seed:'saved-frame-redraw',structure:'paths',geometry:'drawn',
    customPath:path,positionX:11,positionY:-8,
    viewZoom:.5,viewPanX:15,viewPanY:-12,extendDrawnPath:true});
  try{
    const overlay=f.nodes.drawOverlay;
    const trace=()=>overlay.canvasCalls||[];
    const assertRedraw=(dispatch,name)=>{
      const before=trace().length;
      dispatch();
      const operations=trace().slice(before);
      assert.ok(operations.some(op=>op.key==='clearRect'),name+' did not clear stale ink');
      assert.ok(operations.some(op=>op.key==='lineTo'),name+' lost saved source stroke');
      assert.equal(f.nodes.drawPathPanel.dataset.phase,'refine');
      assert.deepEqual(f.recipe,f.snap,name+' modified source recipe');
      assert.equal(f.calls.length,0);
    };
    f.nodes.drawPathToggle.click();
    assert.ok(trace().some(op=>op.key==='lineTo'),
      'opening a saved path should draw its original geometry');
    assertRedraw(()=>f.window.dispatchEvent(new Event('resize')),'window resize');
    assertRedraw(()=>f.stage.dispatchEvent(new Event('roygbiv-preview-zoom')),
      'preview resize and zoom');
    assertRedraw(()=>f.stage.dispatchEvent(new Event('roygbiv-view-zoom-updated')),
      'camera zoom / Pan');
    f.nodes.drawExtendPath.checked=false;
    assertRedraw(()=>f.nodes.drawExtendPath.dispatchEvent(new Event('change')),
      'extension toggle');
    f.nodes.drawCancel.click();
    const before=trace().length;
    f.window.dispatchEvent(new Event('resize'));
    assert.equal(trace().length,before,'stopped drawing must not redraw');
  }finally{f.cleanup();}
});

test('after new stroke begins, resizing uses new provisional geometry, not saved source',()=>{
  const f=fixture({geometry:'drawn',customPath:path,viewZoom:1.2,
    positionX:9,viewPanX:4});
  try{
    f.nodes.drawPathToggle.click();
    pointer(f.nodes.drawOverlay,'pointerdown',{
      pointerId:7,isPrimary:true,clientX:210,clientY:300});
    const before=f.nodes.drawOverlay.canvasCalls.length;
    f.window.dispatchEvent(new Event('resize'));
    const recent=f.nodes.drawOverlay.canvasCalls.slice(before);
    assert.ok(recent.some(op=>op.key==='clearRect'));
    assert.ok(!recent.some(op=>op.key==='lineTo'),
      'a one-point provisional stroke must not bring back the previous path');
    pointer(f.nodes.drawOverlay,'pointercancel',{pointerId:7,isPrimary:true});
    f.nodes.drawCancel.click();
    assert.deepEqual(f.recipe,f.snap);
  }finally{f.cleanup();}
});

test('Hide points and Edit points preserve the complete pending point Undo transaction',()=>{
  const f=fixture({seed:'hide-reopen-undo',structure:'paths',geometry:'drawn',
    customPath:path,positionX:12,positionY:-9,viewZoom:1.3,
    viewPanX:17,viewPanY:-11,extendDrawnPath:true});
  try{
    f.nodes.drawPathToggle.click();
    f.nodes.drawEditPoints.click();
    selectFirstAnchor(f);
    arrowRight(f);
    assert.equal(f.nodes.drawUndoPoint.disabled,false,'a moved node has an Undo snapshot');
    f.nodes.drawEditPoints.click(); // presentation-only Hide points
    assert.equal(f.nodes.drawPathPanel.dataset.phase,'refine');
    f.nodes.drawEditPoints.click(); // same pending transaction
    assert.equal(f.nodes.drawPathPanel.dataset.phase,'anchors');
    assert.equal(f.nodes.drawUndoPoint.disabled,false,
      'hiding the handles must not erase point Undo history');
    f.nodes.drawUndoPoint.click();
    assert.equal(f.nodes.drawUndoPoint.disabled,true,'the one previous change was reverted');
    f.nodes.drawApply.click();
    assert.equal(f.calls.length,1);
    assert.deepEqual(f.calls[0][0],f.recipe.customPath,
      'the original world-space points must be restored exactly');
    assert.equal(f.calls[0][4],true,'saved composition nudge must survive');
    assert.deepEqual(f.recipe,f.snap,'the provisional editor never modified source recipe');
  }finally{f.cleanup();}
});

test('starting a fresh replacement stroke clears the hidden editor and its Undo history',()=>{
  const f=fixture({seed:'hide-replace-undo',structure:'paths',geometry:'drawn',
    customPath:path,positionX:15,viewZoom:.5,viewPanX:19});
  try{
    f.nodes.drawPathToggle.click();
    f.nodes.drawEditPoints.click();
    selectFirstAnchor(f);
    arrowRight(f);
    f.nodes.drawEditPoints.click(); // Hide old point controls
    pointer(f.nodes.drawOverlay,'pointerdown',{
      pointerId:42,isPrimary:true,clientX:100,clientY:230});
    pointer(f.nodes.drawOverlay,'pointermove',{
      pointerId:42,isPrimary:true,clientX:245,clientY:570});
    pointer(f.nodes.drawOverlay,'pointerup',{
      pointerId:42,isPrimary:true,clientX:400,clientY:850});
    assert.equal(f.nodes.drawEditPoints.hidden,false,
      'new long stroke must offer point editing');
    f.nodes.drawEditPoints.click();
    assert.equal(f.nodes.drawPathPanel.dataset.phase,'anchors');
    assert.equal(f.nodes.drawUndoPoint.disabled,true,
      'a replacement stroke must never inherit the previous saved path Undo stack');
    f.nodes.drawApply.click();
    assert.equal(f.calls.length,1);
    assert.equal(f.calls[0][4],false,'new geometry must not inherit saved nudge');
    assert.notDeepEqual(f.calls[0][0],f.recipe.customPath);
    assert.deepEqual(f.recipe,f.snap);
  }finally{f.cleanup();}
});

test('an external Undo/restore with different saved geometry invalidates an open point edit',()=>{
  const f=fixture({seed:'stale-saved-editor',structure:'paths',geometry:'drawn',
    customPath:path,positionX:13,positionY:-9,viewZoom:1.3,viewPanX:16});
  try{
    f.nodes.drawPathToggle.click();
    f.nodes.drawEditPoints.click();
    selectFirstAnchor(f);arrowRight(f);
    const restored=normalizeRecipe({...f.recipe,
      customPath:path.map(([x,y],i)=>i===3?[x+.08,y-.04]:[x,y])});
    assert.throws(()=>f.replaceRecipe(restored),/Saved path changed while editing/,
      'the old provisional editor must not apply over a restored source path');
    assert.equal(f.nodes.drawOverlay.hidden,true);
    assert.equal(f.nodes.drawPathPanel.hidden,true);
    assert.equal(f.calls.length,0,'no stale Apply should have happened');
    assert.deepEqual(f.recipe,restored,'restored geometry remains authoritative');
  }finally{f.cleanup();}
});

test('camera and material changes do not cancel saved edits; successful Apply is not misclassified',()=>{
  const f=fixture({seed:'camera-preserving-saved-editor',structure:'paths',
    geometry:'drawn',customPath:path,positionX:14,positionY:-10,
    viewZoom:1.1,viewPanX:12,viewPanY:-9,material:'linen'},
    {commitOnApply:true});
  try{
    f.nodes.drawPathToggle.click();
    f.nodes.drawEditPoints.click();
    selectFirstAnchor(f);arrowRight(f);
    const camera=normalizeRecipe({...f.recipe,viewZoom:2.2,
      viewPanX:-21,viewPanY:15,material:'foil'});
    f.replaceRecipe(camera);
    assert.equal(f.nodes.drawOverlay.hidden,false,
      'camera/material edits must remain independent of the pending curve');
    assert.equal(f.nodes.drawPathPanel.dataset.phase,'anchors');
    f.nodes.drawApply.click();
    assert.equal(f.calls.length,1);
    assert.equal(f.calls[0][4],true);
    assert.equal(f.nodes.drawOverlay.hidden,true);
    assert.equal(f.recipe.material,'foil');
    assert.deepEqual([f.recipe.viewZoom,f.recipe.viewPanX,f.recipe.viewPanY],
      [2.2,-21,15]);
    assert.notDeepEqual(f.recipe.customPath,path,
      'successful Apply commits the new path through the actual sync guard');
  }finally{f.cleanup();}
});

test('hidden pending saved-path edits invalidate if restore changes the active scene',()=>{
  const f=fixture({seed:'stale-hidden-draw',structure:'paths',geometry:'drawn',
    customPath:path,positionX:11,viewZoom:1.2,viewPanY:9});
  try{
    f.nodes.drawPathToggle.click();
    f.nodes.drawEditPoints.click();
    selectFirstAnchor(f);arrowRight(f);
    f.nodes.drawEditPoints.click(); // Hide handles but retain pending edits.
    assert.equal(f.nodes.drawPathPanel.dataset.phase,'refine');
    const restored=normalizeRecipe({...f.recipe,structure:'radial'});
    assert.throws(()=>f.replaceRecipe(restored),/Saved path changed while editing/,
      'a dormant path is not the source of the newly restored Radial artwork');
    assert.equal(f.nodes.drawOverlay.hidden,true);
    assert.equal(f.calls.length,0);
    assert.deepEqual(f.recipe,restored);
  }finally{f.cleanup();}
});

test('Apply from hidden saved handles commits through source sync, not false stale invalidation',()=>{
  const f=fixture({seed:'apply-hidden-handles',structure:'paths',geometry:'drawn',
    customPath:path,positionX:9,positionY:-7,viewZoom:.75},
    {commitOnApply:true});
  try{
    f.nodes.drawPathToggle.click();
    f.nodes.drawEditPoints.click();
    selectFirstAnchor(f);arrowRight(f);
    f.nodes.drawEditPoints.click();
    assert.equal(f.nodes.drawPathPanel.dataset.phase,'refine');
    f.nodes.drawApply.click();
    assert.equal(f.calls.length,1);
    assert.equal(f.calls[0][4],true,'saved nudge preserved');
    assert.equal(f.nodes.drawOverlay.hidden,true);
    assert.deepEqual([f.recipe.positionX,f.recipe.positionY,f.recipe.viewZoom],
      [9,-7,.75]);
    assert.notDeepEqual(f.recipe.customPath,path);
  }finally{f.cleanup();}
});
