import test from 'node:test';
import assert from 'node:assert/strict';
import {installRotationScrubbers} from '../src/rotation-scrubber.js';

// A lightweight real event-handler harness: the production installer is
// executed, not source-regex inspected or replaced by a second gesture model.
class MockNode {
  constructor(tag='div',doc=null){
    this.tag=tag;this.ownerDocument=doc;this.children=[];
    this.listeners=new Map();this.attributes=new Map();this.dataset={};
    this.style={};this.hidden=false;this.disabled=false;this.value='';
    this.isConnected=true;this.boxVisible=true;
  }
  getClientRects(){return this.boxVisible?[{width:44,height:44}]:[];}
  closest(){return null;}
  addEventListener(type,fn){
    const list=this.listeners.get(type)||[];list.push(fn);
    this.listeners.set(type,list);
  }
  emit(type,data={}){
    for(const fn of this.listeners.get(type)||[])
      fn({target:this,preventDefault(){},stopPropagation(){},...data});
  }
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=[...nodes];}
  setAttribute(name,value){this.attributes.set(name,String(value));}
  removeAttribute(name){this.attributes.delete(name);}
  getAttribute(name){return this.attributes.get(name)??null;}
  focus(){if(this.ownerDocument)this.ownerDocument.activeElement=this;}
  setPointerCapture(id){(this.captures??=new Set()).add(id);}
  releasePointerCapture(id){this.captures?.delete(id);}
}
const find=(root,className)=>{
  if(root.className===className)return root;
  for(const child of root.children){
    const found=find(child,className);if(found)return found;
  }
  return null;
};
const pointer=(pointerId,x,y)=>({pointerId,clientX:x,clientY:y,
  button:0,pointerType:'touch',isPrimary:pointerId===1});

test('precision rotation rolls back interrupted touch work and refuses stale capture loss',()=>{
  const originalDocument=globalThis.document;
  const originalWindow=globalThis.window;
  const originalRaf=globalThis.requestAnimationFrame;
  const originalCancel=globalThis.cancelAnimationFrame;
  const doc=new MockNode('document');
  doc.createElement=tag=>new MockNode(tag,doc);
  doc.body=new MockNode('body',doc);
  doc.querySelector=()=>null;
  const win=new MockNode('window',doc);
  const frames=new Map();let serial=0;
  globalThis.document=doc;globalThis.window=win;
  globalThis.requestAnimationFrame=fn=>{const id=++serial;frames.set(id,fn);return id;};
  globalThis.cancelAnimationFrame=id=>frames.delete(id);
  const paint=()=>{const jobs=[...frames.values()];frames.clear();jobs.forEach(fn=>fn());};
  const host=new MockNode('div',doc);
  const field={name:'textureRotation',value:'30',disabled:false,dataset:{},
    matches:()=>true,closest:()=>host};
  const form={elements:{namedItem:name=>name==='textureRotation'?field:null}};
  const commits=[],previews=[];let cancels=0,before=30;
  try{
    installRotationScrubbers({form,
      onBegin:()=>{before=Number(field.value);return true;},
      onPreview:(_,angle)=>{field.value=String(angle);previews.push(angle);},
      onCommit:(_,angle)=>{field.value=String(angle);commits.push(angle);},
      onCancel:()=>{field.value=String(before);cancels++;}
    });
    assert.equal(host.children.length,1);
    const launch=host.children[0];
    const shade=doc.body.children[0];
    const pad=find(shade,'rotation-scrub-pad');
    assert.ok(pad);
    launch.emit('click');
    assert.equal(shade.hidden,false);
    assert.equal(doc.activeElement,pad);

    pad.emit('pointerdown',pointer(1,100,100));
    pad.emit('pointermove',pointer(1,107,100));
    pad.emit('pointerup',pointer(1,107,100));
    assert.equal(commits.length,0,'7px finger contact must not create an edit');
    assert.equal(Number(field.value),30);

    for(const type of ['blur','pagehide','resize','visibilitychange']){
      doc.hidden=false;
      pad.emit('pointerdown',pointer(1,100,100));
      pad.emit('pointermove',pointer(1,140,100));
      paint();
      assert.notEqual(Number(field.value),30,'live preview must be real before rollback');
      if(type==='visibilitychange'){
        doc.hidden=true;doc.emit(type);
      }else win.emit(type);
      assert.equal(Number(field.value),30,type+' must restore the source value');
      assert.equal(pad.captures.size,0,'cancel must release captured pointer');
      pad.emit('pointerup',pointer(1,140,100));
      assert.equal(commits.length,0,'late release after '+type+' must not commit');
    }
    doc.hidden=false;
    pad.emit('pointerdown',pointer(1,100,100));
    pad.emit('pointermove',pointer(1,140,100));
    pad.emit('pointerdown',{...pointer(2,125,100),isPrimary:false});
    assert.equal(Number(field.value),30,'secondary touch must abort the rotation');
    pad.emit('pointerup',pointer(1,140,100));
    assert.equal(commits.length,0);

    pad.emit('pointerdown',pointer(1,100,100));
    pad.emit('pointermove',pointer(1,130,100));
    pad.emit('lostpointercapture',{pointerId:999});
    assert.equal(pad.captures.has(1),true,
      'a delayed lost-capture notification for another pointer is inert');
    pad.emit('pointerup',pointer(1,130,100));
    assert.equal(commits.length,1,'a subsequent valid movement still commits once');
    assert.ok(Math.abs(commits[0]-39.9)<1e-9,
      '30px displacement subtracts the 8px deadzone before 0.45° gain');
    assert.ok(cancels>=6);
    assert.ok(previews.length>=4);
    assert.equal(frames.size,0,'no provisional preview frame can survive');

    // The actual focusable ARIA slider must honor Home/End/Page and the
    // 0.1-degree shift fine step. No alternative keyboard UI or Undo path.
    const snap=find(shade,'rotation-scrub-snap');
    assert.ok(snap.children.some(option=>option.value==='10'),
      'Illustrator-style 10° magnetic alignment should be offered');
    const commitsBeforeKeys=commits.length;
    pad.emit('keydown',{key:'Home'});
    assert.equal(Number(field.value),0);
    pad.emit('keydown',{key:'End'});
    assert.equal(Number(field.value),359.9);
    pad.emit('keydown',{key:'PageUp'});
    assert.equal(Number(field.value),9.9);
    pad.emit('keydown',{key:'PageDown'});
    assert.equal(Number(field.value),359.9);
    pad.emit('keydown',{key:'ArrowLeft',shiftKey:true});
    assert.equal(Number(field.value),359.8);
    pad.emit('keydown',{key:'ArrowLeft',ctrlKey:true});
    assert.equal(Number(field.value),359.8,
      'browser modifier shortcut must not mutate the recipe');
    assert.equal(commits.length,commitsBeforeKeys+5,
      'each accepted key is one canonical source commit');

    // A current tool switch can remove the triggering control from layout
    // while the modal is still open. Focus must return to a visible entry.
    const mobileEntry=new MockNode('button',doc);
    doc.body.classList={contains:key=>key==='mobile-studio'};
    doc.getElementById=id=>id==='mobileEdit'?mobileEntry:null;
    doc.querySelector=selector=>selector.includes('.settings-tab')?
      {dataset:{tab:'material'}}:selector.includes('.editor-tool-chooser')?
      {dataset:{editorTool:'layer1'}}:null;
    launch.emit('click');
    assert.equal(doc.activeElement,pad);
    launch.boxVisible=false;
    doc.emit('editor-tool-changed',{detail:{category:'layout',tool:'arrange'}});
    assert.equal(shade.hidden,true);
    assert.equal(doc.activeElement,mobileEntry,
      'dialog must never return focus to a now-hidden phone tool');

    // Ordinary Done preserves the invoker focus when it is still visible.
    launch.boxVisible=true;
    launch.emit('click');
    find(shade,'rotation-scrub-close').emit('click');
    assert.equal(doc.activeElement,launch,
      'visible invoker remains the expected focus destination');

    // Desktop returns to the currently selected visible tool on revocation.
    const desktopTool=new MockNode('button',doc);
    desktopTool.dataset.editorTool='layer1';
    doc.body.classList={contains:()=>false};
    doc.querySelector=selector=>selector.startsWith('.settings-tab')?
      {dataset:{tab:'material'}}:selector.startsWith('.editor-tool-chooser')?
      desktopTool:null;
    launch.emit('click');
    launch.boxVisible=false;
    doc.emit('editor-tool-changed',{detail:{category:'layout',tool:'arrange'}});
    assert.equal(doc.activeElement,desktopTool,
      'desktop tool switch must focus the new tool, not a hidden old action');
  }finally{
    if(originalDocument===undefined)delete globalThis.document;
    else globalThis.document=originalDocument;
    if(originalWindow===undefined)delete globalThis.window;
    else globalThis.window=originalWindow;
    if(originalRaf===undefined)delete globalThis.requestAnimationFrame;
    else globalThis.requestAnimationFrame=originalRaf;
    if(originalCancel===undefined)delete globalThis.cancelAnimationFrame;
    else globalThis.cancelAnimationFrame=originalCancel;
  }
});
