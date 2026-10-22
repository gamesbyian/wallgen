import test from 'node:test';
import assert from 'node:assert/strict';
import {installImagePathTool} from '../src/image-path-ui.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

class Stub extends EventTarget{
  constructor(id=''){
    super();this.id=id;this.value='';this.disabled=false;this.open=false;
    this.dataset={};this.textContent='';this.clicks=0;
  }
  click(){
    if(this.disabled)return;
    this.clicks++;
    this.dispatchEvent(new Event('click'));
  }
  getContext(){return {clearRect(){},fillRect(){}};}
  querySelector(){return new Stub('phase');}
  showModal(){this.open=true;}
  close(){this.open=false;this.dispatchEvent(new Event('close'));}
}
function fixture(input){
  let recipe=normalizeRecipe(input);
  const original=structuredClone(recipe),notices=[];
  const ids=['importPathToggle','imagePathFile','imagePathDialog',
    'imagePathCanvas','imagePathCandidate','imagePathStatus','imagePathApply',
    'imagePathShape','imagePathAngle','imagePathAnother','imagePathCancel'];
  const nodes=Object.fromEntries(ids.map(id=>[id,new Stub(id)]));
  const old=globalThis.document;
  globalThis.document={getElementById:id=>nodes[id]};
  const tool=installImagePathTool({
    getRecipe:()=>recipe,
    onNotice:message=>notices.push(message),
    onPath:()=>{throw Error('Rejected import must never enter Draw');},
    onAngle:()=>{throw Error('Rejected import must never change angle');},
  });
  return {nodes,notices,original,tool,
    setRecipe:next=>{recipe=normalizeRecipe(next);tool.sync(recipe);},
    get recipe(){return recipe;},
    cleanup(){
      if(old===undefined)delete globalThis.document;
      else globalThis.document=old;
    }};
}

test('late lock rejection clears native file field so the same image can be selected again',()=>{
  const f=fixture({seed:'locked-file-retry',structure:'paths',geometry:'wave',
    viewZoom:.5,viewPanX:22,positionX:11,positionY:-7});
  try{
    const {imagePathFile:file,imagePathDialog:dialog,
      importPathToggle:launch}=f.nodes;
    file.value='the-same-image.png';
    file.files=[{name:'the-same-image.png',type:'image/png',size:1200}];
    f.setRecipe({...f.recipe,structure:'regions',lockedSettings:['structure']});
    assert.equal(launch.disabled,true);
    file.dispatchEvent(new Event('change'));
    assert.equal(file.value,'',
      'blocked load must not suppress the next native change event for this file');
    assert.equal(file.clicks,0);
    assert.equal(dialog.open,false);
    assert.match(f.notices.at(-1),/Unlock Layout structure/);
    f.setRecipe({...f.recipe,lockedSettings:[]});
    assert.equal(launch.disabled,false);
    launch.click();
    assert.equal(file.clicks,1,'an unlocked picker can select the same image again');
    assert.deepEqual(decodeRecipe(encodeRecipe(f.recipe)),f.recipe);
  }finally{f.cleanup();}
});

test('an already-open import dialog cannot launch Choose another under a new lock',()=>{
  const f=fixture({seed:'locked-repick-dialog',structure:'paths',geometry:'straight'});
  try{
    const {imagePathDialog:dialog,imagePathAnother:another,
      imagePathFile:file,importPathToggle:launch}=f.nodes;
    dialog.open=true; // An asynchronous old candidate may still be visible.
    f.setRecipe({...f.recipe,structure:'radial',lockedSettings:['structure']});
    assert.equal(dialog.open,true);
    assert.equal(f.nodes.imagePathApply.disabled,true);
    assert.equal(f.nodes.imagePathAngle.disabled,true);
    assert.equal(another.disabled,true,
      'the open modal must not invite a file picker forbidden by its new lock');
    another.click();
    assert.equal(file.clicks,0);
    assert.match(f.nodes.imagePathStatus.textContent,/Unlock Layout structure/,
      'a disabled modal action must explain the lock without a fake click');
    f.setRecipe({...f.recipe,structure:'paths'});
    assert.equal(another.disabled,false,
      'unlock restores file picker without forcing dialog close');
    assert.equal(f.nodes.imagePathApply.disabled,true,
      'no candidate has been analyzed yet');
    another.click();
    assert.equal(file.clicks,1);
    assert.equal(launch.disabled,false);
    assert.deepEqual(f.recipe.customPath,f.original.customPath);
  }finally{f.cleanup();}
});

test('Geometry lock has the same retry semantics without disabling unrelated source history',()=>{
  const f=fixture({seed:'geometry-lock-image',structure:'paths',
    geometry:'drawn',customPath:[[.1,.2],[.6,.7]]});
  try{
    const file=f.nodes.imagePathFile;
    file.value='vector.svg';
    file.files=[{name:'vector.svg',type:'image/svg+xml',size:1024}];
    f.setRecipe({...f.recipe,lockedSettings:['geometry']});
    file.dispatchEvent(new Event('change'));
    assert.equal(file.value,'');
    assert.match(f.notices.at(-1),/Unlock Path geometry/);
    assert.deepEqual(f.recipe.customPath,f.original.customPath);
    assert.equal(f.nodes.importPathToggle.disabled,true);
  }finally{f.cleanup();}
});
