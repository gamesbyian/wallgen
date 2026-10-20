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

test('canceled replacement touch restores the visible saved source curve',()=>{
  const f=fixture({seed:'cancel-saved-replacement',structure:'paths',geometry:'drawn',
    customPath:path,positionX:17,positionY:-11,
    viewZoom:.5,viewPanX:24,viewPanY:-12,extendDrawnPath:true});
  try{
    f.nodes.drawPathToggle.click();
    assert.equal(f.nodes.drawPathPanel.dataset.phase,'refine');
    pointer(f.nodes.drawOverlay,'pointerdown',{
      pointerId:91,isPrimary:true,clientX:110,clientY:155});
    pointer(f.nodes.drawOverlay,'pointermove',{
      pointerId:91,isPrimary:true,clientX:155,clientY:275});
    const afterStroke=f.nodes.drawOverlay.canvasCalls.length;
    pointer(f.nodes.drawOverlay,'pointercancel',{
      pointerId:91,isPrimary:true,clientX:155,clientY:275});
    assert.equal(f.nodes.drawPathPanel.dataset.phase,'refine',
      'canceled replacement must restore the original saved preview phase');
    assert.equal(f.nodes.drawEditPoints.hidden,false);
    assert.equal(f.nodes.drawApply.disabled,true,
      'Apply must not silently commit the original saved path as new geometry');
    assert.ok(f.nodes.drawOverlay.canvasCalls.slice(afterStroke)
      .some(op=>op.key==='lineTo'),'saved path must be painted again');
    assert.match(f.nodes.drawPathHint.textContent,/previous path/);
    f.nodes.drawEditPoints.click();
    f.nodes.drawApply.click();
    assert.equal(f.calls.length,1);
    assert.equal(f.calls[0][4],true,'editing restored source retains its nudge');
    assert.deepEqual(f.calls[0][0],f.snap.customPath);
    assert.deepEqual(f.recipe,f.snap);
  }finally{f.cleanup();}
});

test('canceling a replacement touch preserves imported provisional curve and metadata',()=>{
  const f=fixture({seed:'cancel-imported-replacement',structure:'paths',
    geometry:'wave',positionX:14,viewZoom:.75,viewPanX:18});
  const imported={points:path.map(([x,y])=>[x+.1,y-.08]),anchors:[2,4],
    corners:[4]};
  try{
    assert.equal(f.tool.loadPath(imported),true);
    assert.equal(f.nodes.drawPathPanel.dataset.phase,'refine');
    pointer(f.nodes.drawOverlay,'pointerdown',{
      pointerId:92,isPrimary:true,clientX:150,clientY:180});
    pointer(f.nodes.drawOverlay,'pointercancel',{pointerId:92,isPrimary:true});
    assert.equal(f.nodes.drawPathPanel.dataset.phase,'refine');
    assert.equal(f.nodes.drawApply.disabled,false);
    f.nodes.drawApply.click();
    assert.equal(f.calls.length,1);
    assert.deepEqual(f.calls[0].slice(0,3),[
      imported.points,imported.anchors,imported.corners]);
    assert.equal(f.calls[0][4],false,
      'restored import must not pick up the existing wallpaper nudge');
    assert.deepEqual(f.recipe,f.snap);
  }finally{f.cleanup();}
});

test('canceling replacement restores hidden editor history and previous custom controls',()=>{
  const f=fixture({seed:'cancel-hidden-edited-replacement',structure:'paths',
    geometry:'drawn',customPath:path,positionX:9,viewZoom:1.3,viewPanY:10});
  try{
    f.nodes.drawPathToggle.click();
    f.nodes.drawEditPoints.click();selectFirstAnchor(f);arrowRight(f);
    assert.equal(f.nodes.drawUndoPoint.disabled,false);
    f.nodes.drawEditPoints.click();
    pointer(f.nodes.drawOverlay,'pointerdown',{
      pointerId:93,isPrimary:true,clientX:140,clientY:230});
    pointer(f.nodes.drawOverlay,'pointercancel',{pointerId:93,isPrimary:true});
    assert.equal(f.nodes.drawPathPanel.dataset.phase,'refine');
    f.nodes.drawEditPoints.click();
    assert.equal(f.nodes.drawUndoPoint.disabled,false,
      'a canceled attempt is not an intentional new stroke transaction');
    f.nodes.drawUndoPoint.click();
    f.nodes.drawApply.click();
    assert.deepEqual(f.calls[0][0],f.snap.customPath);
    assert.equal(f.calls[0][4],true);
  }finally{f.cleanup();}
});

test('live Draw toggle stays unavailable when non-Paths Structure is locked',()=>{
  for(const structure of ['radial','regions']){
    const f=fixture({seed:'structure-lock-'+structure,structure,
      geometry:'wave',customPath:path,lockedSettings:['structure'],
      positionX:15,viewZoom:.5,viewPanX:22});
    try{
      f.tool.sync(f.recipe);
      assert.equal(f.nodes.drawPathToggle.disabled,true,
        'locked non-Paths composition must not expose an applyable Draw action');
      assert.throws(()=>f.tool.loadPath({points:path}),/Unlock Layout structure/,
        'image-derived vector loading must enforce the same source-lock gate');
      assert.equal(f.calls.length,0);
      assert.notEqual(f.nodes.drawPathToggle.getAttribute('aria-pressed'),'true',
        'a rejected import must not activate the editor');
      assert.deepEqual(f.recipe,f.snap);
    }finally{f.cleanup();}
  }
});

test('a Structure lock already on Paths does not block Draw authoring',()=>{
  const f=fixture({seed:'locked-but-paths',structure:'paths',
    geometry:'wave',customPath:path,lockedSettings:['structure'],
    positionX:-11,viewZoom:1.5,viewPanY:14});
  try{
    f.tool.sync(f.recipe);
    assert.equal(f.nodes.drawPathToggle.disabled,false);
    assert.equal(f.tool.loadPath({points:path,anchors:[2],corners:[2]}),true);
    assert.equal(f.nodes.drawPathPanel.dataset.phase,'refine');
    f.nodes.drawApply.click();
    assert.equal(f.calls.length,1);
    assert.equal(f.calls[0][4],false);
    assert.deepEqual(f.recipe,f.snap);
  }finally{f.cleanup();}
});

test('same-position pointer drag does not create a phantom Draw point Undo step',()=>{
  const f=fixture({seed:'noop-pointer-nudge',structure:'paths',geometry:'drawn',
    customPath:path,positionX:12,positionY:-8,viewZoom:1.3,viewPanX:6});
  try{
    f.nodes.drawPathToggle.click();
    f.nodes.drawEditPoints.click();
    const [panX,panY]=drawnPathViewportOffset(f.recipe,true);
    const p=f.recipe.customPath[0],z=f.recipe.viewZoom;
    const clientX=600*(.5+(p[0]-.5)*z+panX);
    const clientY=1300*(.5+(p[1]-.5)*z+panY);
    pointer(f.nodes.drawOverlay,'pointerdown',{pointerId:27,isPrimary:true,clientX,clientY});
    pointer(f.nodes.drawOverlay,'pointermove',{pointerId:27,isPrimary:true,clientX,clientY});
    pointer(f.nodes.drawOverlay,'pointerup',{pointerId:27,isPrimary:true,clientX,clientY});
    assert.equal(f.nodes.drawUndoPoint.disabled,true,
      'no actual movement means no point Undo snapshot');
    f.nodes.drawApply.click();
    assert.equal(f.calls.length,1);
    assert.deepEqual(f.calls[0][0],f.snap.customPath);
    assert.equal(f.calls[0][4],true);
    assert.deepEqual(f.recipe,f.snap);
  }finally{f.cleanup();}
});

test('keyboard arrow at an off-frame clamp edge creates no Undo step',()=>{
  const bounded=[[-2,.34],[-.6,.37],[.35,.44],[.72,.6]];
  const f=fixture({seed:'noop-bounded-arrow',structure:'paths',geometry:'drawn',
    customPath:bounded,viewZoom:.5,viewPanX:9});
  try{
    f.nodes.drawPathToggle.click();
    f.nodes.drawEditPoints.click();
    selectFirstAnchor(f);
    const key=new Event('keydown',{cancelable:true});
    Object.defineProperties(key,{
      key:{value:'ArrowLeft'},shiftKey:{value:false},
      ctrlKey:{value:false},metaKey:{value:false}
    });
    f.document.dispatchEvent(key);
    assert.equal(f.nodes.drawUndoPoint.disabled,true);
    f.nodes.drawApply.click();
    assert.deepEqual(f.calls[0][0],f.snap.customPath);
    assert.deepEqual(f.recipe,f.snap);
  }finally{f.cleanup();}
});

test('saved Draw source does not advertise inactive Smooth or Geometric fit',()=>{
  const f=fixture({seed:'saved-inert-fit-controls',structure:'paths',geometry:'drawn',
    customPath:path,positionX:13,positionY:-7,viewZoom:.5,viewPanX:19});
  try{
    f.nodes.drawPathToggle.click();
    assert.equal(f.nodes.drawPathPanel.dataset.phase,'refine');
    assert.equal(f.nodes.drawSmooth.disabled,true,
      'saved centreline has no original raw samples for a new Smooth fit');
    assert.equal(f.nodes.drawGeometric.disabled,true,
      'Geometric fit must not offer an action that leaves the saved path unchanged');
    assert.equal(f.nodes.drawSmoothingStrength.disabled,true);
    f.nodes.drawEditPoints.click();
    assert.equal(f.nodes.drawSmooth.disabled,true);
    assert.equal(f.nodes.drawGeometric.disabled,true);
    assert.equal(f.nodes.drawSmoothingStrength.disabled,false,
      'the explicit editor Resmooth action still consumes its smoothing strength');
    f.nodes.drawEditPoints.click();
    assert.equal(f.nodes.drawSmoothingStrength.disabled,true);
    assert.equal(f.nodes.drawSmooth.disabled,true);
    f.nodes.drawAgain.click();
    assert.equal(f.nodes.drawPathPanel.dataset.phase,'sketch');
    assert.equal(f.nodes.drawSmooth.disabled,false,'a new sketch can select its fit');
    assert.equal(f.nodes.drawGeometric.disabled,false);
    assert.equal(f.nodes.drawSmoothingStrength.disabled,false);
    assert.deepEqual(f.recipe,f.snap);
  }finally{f.cleanup();}
});

test('an imported provisional curve still offers both usable fit modes',()=>{
  const f=fixture({seed:'imported-fit-controls',structure:'paths',
    geometry:'wave',positionX:14,viewZoom:.75});
  try{
    assert.equal(f.tool.loadPath({points:path,anchors:[2],corners:[2]}),true);
    assert.equal(f.nodes.drawPathPanel.dataset.phase,'refine');
    for(const id of ['drawSmooth','drawGeometric','drawSmoothingStrength'])
      assert.equal(f.nodes[id].disabled,false,id+' should work with imported samples');
    f.nodes.drawCancel.click();
    assert.deepEqual(f.recipe,f.snap);
  }finally{f.cleanup();}
});

test('late extension lock reconciles an open Draw checkbox with authoritative recipe',()=>{
  const f=fixture({seed:'locked-extension-preview',structure:'paths',
    geometry:'drawn',customPath:path,extendDrawnPath:true,
    viewZoom:.5,viewPanX:12,positionY:-8});
  try{
    f.nodes.drawPathToggle.click();
    assert.equal(f.nodes.drawExtendPath.checked,true);
    assert.equal(f.nodes.drawExtendPath.disabled,false);
    // A user's provisional choice stays local while the setting is unlocked.
    f.nodes.drawExtendPath.checked=false;
    f.nodes.drawExtendPath.dispatchEvent(new Event('change'));
    f.tool.sync(f.recipe);
    assert.equal(f.nodes.drawExtendPath.checked,false);
    assert.equal(f.nodes.drawExtendPath.disabled,false);
    // An external Restore/Lock makes the source value authoritative. The
    // disabled checkbox and the overlay must represent that same value.
    const prior=f.nodes.drawOverlay.canvasCalls.length;
    f.recipe.lockedSettings.push('extendDrawnPath');
    f.tool.sync(f.recipe);
    assert.equal(f.nodes.drawExtendPath.checked,true);
    assert.equal(f.nodes.drawExtendPath.disabled,true);
    assert.ok(f.nodes.drawOverlay.canvasCalls.slice(prior)
      .some(op=>op.key==='lineTo'),'the saved curve is repainted under lock');
    f.nodes.drawEditPoints.click();
    f.nodes.drawApply.click();
    assert.equal(f.calls.length,1);
    assert.equal(f.calls[0][3],true,'Apply can only use the now locked extension');
    assert.equal(f.calls[0][4],true);
    assert.equal(f.snap.extendDrawnPath,true);
  }finally{f.cleanup();}
});

test('locked false extension also overrides an uncommitted true preview',()=>{
  const f=fixture({seed:'locked-extension-false',structure:'paths',
    geometry:'drawn',customPath:path,extendDrawnPath:false});
  try{
    f.nodes.drawPathToggle.click();
    f.nodes.drawExtendPath.checked=true;
    f.tool.sync(f.recipe);
    assert.equal(f.nodes.drawExtendPath.checked,true,
      'an unlocked editor draft is not silently discarded on ordinary sync');
    f.recipe.lockedSettings.push('extendDrawnPath');
    f.tool.sync(f.recipe);
    assert.equal(f.nodes.drawExtendPath.checked,false);
    assert.equal(f.nodes.drawExtendPath.disabled,true);
    f.nodes.drawEditPoints.click();f.nodes.drawApply.click();
    assert.equal(f.calls[0][3],false);
  }finally{f.cleanup();}
});

test('Undo that restores only saved anchor metadata invalidates the prior Draw edit',()=>{
  const f=fixture({seed:'metadata-stale-pins',structure:'paths',geometry:'drawn',
    customPath:path,drawnAnchors:[2],drawnCorners:[2],
    viewZoom:1.3,viewPanX:12,positionX:9,positionY:-7});
  try{
    f.nodes.drawPathToggle.click();
    f.nodes.drawEditPoints.click();
    selectFirstAnchor(f);arrowRight(f);
    const restored=normalizeRecipe({...f.recipe,
      drawnAnchors:[3],drawnCorners:[3]});
    assert.deepEqual(restored.customPath,f.recipe.customPath,
      'only authored metadata changed, not a single curve coordinate');
    assert.throws(()=>f.replaceRecipe(restored),/Saved path changed while editing/,
      'stale editor cannot overwrite a restored corner or anchor');
    assert.equal(f.nodes.drawPathPanel.hidden,true);
    assert.equal(f.nodes.drawOverlay.hidden,true);
    assert.equal(f.calls.length,0);
    assert.deepEqual(f.recipe,restored);
  }finally{f.cleanup();}
});

test('a hidden saved editor cannot Apply over newly restored corner-only metadata',()=>{
  const f=fixture({seed:'metadata-stale-hidden',structure:'paths',geometry:'drawn',
    customPath:path,drawnAnchors:[2,4],drawnCorners:[4],
    viewZoom:.5,positionX:11});
  try{
    f.nodes.drawPathToggle.click();
    f.nodes.drawEditPoints.click();
    selectFirstAnchor(f);arrowRight(f);
    f.nodes.drawEditPoints.click();
    assert.equal(f.nodes.drawPathPanel.dataset.phase,'refine');
    const restored=normalizeRecipe({...f.recipe,drawnCorners:[2,4]});
    assert.deepEqual(restored.customPath,f.recipe.customPath);
    assert.throws(()=>f.replaceRecipe(restored),/Saved path changed while editing/);
    assert.equal(f.calls.length,0);
    assert.equal(f.nodes.drawPathPanel.hidden,true);
    assert.deepEqual(f.recipe,restored);
  }finally{f.cleanup();}
});

test('a saved editor still Applies normally when only the camera changed',()=>{
  const f=fixture({seed:'metadata-camera-independent',structure:'paths',
    geometry:'drawn',customPath:path,drawnAnchors:[2],drawnCorners:[2],
    viewZoom:.5,viewPanX:18,material:'linen'},
    {commitOnApply:true});
  try{
    f.nodes.drawPathToggle.click();
    f.nodes.drawEditPoints.click();
    selectFirstAnchor(f);arrowRight(f);
    f.replaceRecipe({...f.recipe,viewZoom:1.5,viewPanX:-8,material:'foil'});
    assert.equal(f.nodes.drawPathPanel.hidden,false);
    f.nodes.drawApply.click();
    assert.equal(f.calls.length,1);
    assert.equal(f.recipe.material,'foil');
    assert.deepEqual([f.recipe.viewZoom,f.recipe.viewPanX],[1.5,-8]);
    assert.notDeepEqual(f.recipe.customPath,path);
  }finally{f.cleanup();}
});

test('Re-smooth on a sparse two-node path does not manufacture an Undo snapshot',()=>{
  const segment=[[.16,.2],[.85,.79]];
  const f=fixture({seed:'resmooth-empty-span',structure:'paths',
    geometry:'drawn',customPath:segment,viewZoom:.5,viewPanX:16,
    positionX:11,positionY:-7});
  try{
    f.nodes.drawPathToggle.click();f.nodes.drawEditPoints.click();
    selectFirstAnchor(f);
    assert.equal(f.nodes.drawUndoPoint.disabled,true);
    f.nodes.drawResmoothPoints.click();
    assert.equal(f.nodes.drawUndoPoint.disabled,true,
      'fairing cannot modify a two-node open segment');
    f.nodes.drawApply.click();
    assert.equal(f.calls.length,1);
    assert.deepEqual(f.calls[0][0],f.snap.customPath);
    assert.equal(f.calls[0][4],true);
    assert.deepEqual(f.recipe,f.snap);
  }finally{f.cleanup();}
});

test('Re-smooth on a visibly textured curved path creates exactly one useful Undo',()=>{
  const detailed=Array.from({length:96},(_,i)=>{
    const t=i/95*Math.PI*2;
    return [.5+.27*Math.sin(t),.5+.19*Math.sin(2*t)+.027*Math.sin(27*t)];
  });
  const f=fixture({seed:'resmooth-curvature',structure:'paths',
    geometry:'drawn',customPath:detailed,viewZoom:1.25,
    viewPanX:13,viewPanY:-8,positionX:9});
  try{
    f.nodes.drawPathToggle.click();f.nodes.drawEditPoints.click();
    selectFirstAnchor(f);
    f.nodes.drawResmoothPoints.click();
    assert.equal(f.nodes.drawUndoPoint.disabled,false,
      'real high-frequency bends are legitimately altered by fairing');
    f.nodes.drawApply.click();
    assert.equal(f.calls.length,1);
    assert.notDeepEqual(f.calls[0][0],f.snap.customPath);
    assert.equal(f.calls[0][4],true);
    assert.deepEqual(f.recipe,f.snap);
  }finally{f.cleanup();}
});

test('image-imported two-node path Re-smooth keeps its exact uncommitted geometry',()=>{
  const segment=[[.2,.16],[.81,.83]];
  const f=fixture({seed:'imported-resmooth-noop',structure:'paths',
    geometry:'wave',viewZoom:1.4,viewPanX:12,viewPanY:-10,
    positionX:18,positionY:-12});
  try{
    assert.equal(f.tool.loadPath({points:segment}),true);
    f.nodes.drawEditPoints.click();
    const [panX,panY]=drawnPathViewportOffset(f.recipe,false);
    const [x,y]=segment[0],z=f.recipe.viewZoom;
    const clientX=600*(.5+(x-.5)*z+panX);
    const clientY=1300*(.5+(y-.5)*z+panY);
    pointer(f.nodes.drawOverlay,'pointerdown',{
      pointerId:111,isPrimary:true,clientX,clientY});
    pointer(f.nodes.drawOverlay,'pointerup',{
      pointerId:111,isPrimary:true,clientX,clientY});
    assert.equal(f.nodes.drawResmoothPoints.disabled,false);
    f.nodes.drawResmoothPoints.click();
    assert.equal(f.nodes.drawUndoPoint.disabled,true,
      'imported sparse geometry cannot invent an Undo action');
    f.nodes.drawApply.click();
    assert.equal(f.calls.length,1);
    assert.deepEqual(f.calls[0][0],segment);
    assert.equal(f.calls[0][4],false,
      'imported replacement must not inherit the old source nudge');
    assert.deepEqual(f.recipe,f.snap);
  }finally{f.cleanup();}
});
