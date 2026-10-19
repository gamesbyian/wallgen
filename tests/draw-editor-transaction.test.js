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
  getContext(){return this.context||(this.context=new Proxy({},{
    get:(_target,key)=>key==='canvas'?this:()=>{}
  }));}
  click(){if(!this.disabled)this.dispatchEvent(new Event('click',{bubbles:true}));}
  focus(){}
  setPointerCapture(){}
  releasePointerCapture(){}
  closest(){return null;}
}
function fixture(recipeInput){
  const recipe=normalizeRecipe(recipeInput),snap=structuredClone(recipe);
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
  const tool=installDrawTool({
    getRecipe:()=>recipe,
    onNotice:message=>{throw Error('Unexpected notice: '+message);},
    onApply:(...args)=>calls.push(args)
  });
  return {
    recipe,snap,nodes,stage,document,calls,tool,
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
