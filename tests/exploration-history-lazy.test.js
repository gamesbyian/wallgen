import test from 'node:test';
import assert from 'node:assert/strict';
import {installExplorationHistory} from '../src/exploration-history.js';

function mount(renderThumbnail){
  const prior=globalThis.document;
  const created=[];
  class Element {
    constructor(tag){
      this.tag=tag;this.children=[];this.handlers=new Map();
      this.attributes=new Map();this.classList={toggle(){}};
      this.isConnected=true;this.hidden=false;this.textContent='';
    }
    append(...nodes){this.children.push(...nodes);for(const node of nodes)node.isConnected=true;}
    after(){}
    replaceChildren(...nodes){
      for(const old of this.children)old.isConnected=false;
      this.children=nodes;
      for(const node of nodes)node.isConnected=true;
    }
    setAttribute(name,value){this.attributes.set(name,String(value));}
    addEventListener(type,handler){this.handlers.set(type,handler);}
    click(){this.handlers.get('click')?.();}
  }
  const document={
    createElement(tag){const item=new Element(tag);created.push(item);return item;},
    addEventListener(){},
  };
  globalThis.document=document;
  const actions=new Element('div'),chooser=new Element('div');
  const form={
    querySelector(selector){
      if(selector==='.editor-explore-actions')return actions;
      if(selector==='.editor-tool-chooser')return chooser;
      throw Error('Unexpected selector: '+selector);
    },
    classList:{toggle(){}},
  };
  const restored=[];
  const api=installExplorationHistory({
    form,preview:null,getRecipe:()=>null,
    restore:recipe=>restored.push(recipe),
    renderThumbnail,
  });
  const toggle=created.find(item=>item.id==='editorHistoryToggle');
  const panel=created.find(item=>item.id==='editorHistory');
  const strip=created.find(item=>item.className==='editor-history-strip');
  return {api,toggle,panel,strip,restored,
    close(){if(prior===undefined)delete globalThis.document;
      else globalThis.document=prior;}};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));

test('Random archives recipes without painting hidden history thumbnails',async()=>{
  const calls=[];
  const h=mount(async(recipe,width,height)=>{
    calls.push([recipe.seed,width,height]);
    return 'data:image/png;base64,'+recipe.seed;
  });
  try{
    h.api.remember({seed:'first'},'First');
    h.api.remember({seed:'second'},'Second');
    await settle();
    assert.equal(h.api.count(),2);
    assert.deepEqual(calls,[],'Closed history should not compete for render workers');
    h.toggle.click();
    await settle();
    assert.deepEqual(calls,[['second',120,260],['first',120,260]],
      'Only opening history paints real snapshot thumbnails, newest first');
    assert.equal(h.strip.children.length,2);
    assert.equal(h.strip.children[0].children[0].src,'data:image/png;base64,second');
    h.strip.children[1].click();
    assert.deepEqual(h.restored,[{seed:'first'}]);
    assert.equal(h.panel.hidden,true);
  }finally{h.close();}
});

test('Closing history stops further thumbnail jobs; reopen resumes without losing recipes',async()=>{
  const calls=[];let finishFirst;
  const gate=new Promise(resolve=>{finishFirst=resolve;});
  const h=mount(recipe=>{
    calls.push(recipe.seed);
    return calls.length===1?gate:Promise.resolve('data:image/png;base64,'+recipe.seed);
  });
  try{
    for(const seed of ['one','two','three'])h.api.remember({seed},seed);
    h.toggle.click();
    assert.deepEqual(calls,['three']);
    h.toggle.click(); // close while the first thumbnail is in flight
    finishFirst('data:image/png;base64,three');
    await settle();
    assert.deepEqual(calls,['three'],'Closing should not queue hidden thumbnail work');
    h.toggle.click();
    await settle();
    assert.deepEqual(calls,['three','two','one']);
    assert.equal(h.api.count(),3);
  }finally{h.close();}
});

test('Evicted history snapshots never trigger a hidden render, and failures preserve restoration',async()=>{
  const calls=[];
  const h=mount(async recipe=>{
    calls.push(recipe.seed);
    if(recipe.seed==='11')throw Error('Simulated thumbnail failure');
    return 'data:image/png;base64,'+recipe.seed;
  });
  try{
    for(let i=0;i<12;i++)h.api.remember({seed:String(i)},String(i));
    assert.equal(h.api.count(),10);
    assert.deepEqual(calls,[]);
    h.toggle.click();
    await settle();
    assert.equal(calls.length,10);
    assert(!calls.includes('0')&&!calls.includes('1'));
    h.strip.children[0].click();
    assert.deepEqual(h.restored,[{seed:'11'}],
      'A failed thumbnail must never discard the saved design');
  }finally{h.close();}
});
