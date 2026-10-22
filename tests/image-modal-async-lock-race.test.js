import test from 'node:test';
import assert from 'node:assert/strict';
import {installImagePathTool} from '../src/image-path-ui.js';
import {normalizeRecipe} from '../src/model.js';

class Element extends EventTarget{
  constructor(id=''){
    super();this.id=id;this.dataset={};this.textContent='';
    this.value='';this.disabled=false;this.open=false;this.options=[];
    this.width=600;this.height=1300;
  }
  click(){if(!this.disabled)this.dispatchEvent(new Event('click'));}
  querySelector(){return new Element('phase');}
  showModal(){this.open=true;}
  close(){this.open=false;this.dispatchEvent(new Event('close'));}
  append(option){this.options.push(option);}
  replaceChildren(){this.options=[];}
  getContext(){return {
    clearRect(){},fillRect(){},drawImage(){},beginPath(){},
    moveTo(){},lineTo(){},stroke(){},setLineDash(){}}
  }
}
test('image decode completing after Structure lock does not re-enable invalid modal actions',async()=>{
  const old={document:globalThis.document,Image:globalThis.Image,
    createURL:URL.createObjectURL,revokeURL:URL.revokeObjectURL};
  const ids=['importPathToggle','imagePathFile','imagePathDialog','imagePathCanvas',
    'imagePathCandidate','imagePathStatus','imagePathApply','imagePathShape','imagePathAngle',
    'imagePathAnother','imagePathCancel'];
  const nodes=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
  globalThis.document={
    getElementById:id=>nodes[id],
    createElement:tag=>{
      if(tag!=='canvas')return new Element(tag);
      const canvas=new Element('analysis-canvas');
      canvas.getContext=()=>({
        drawImage(){},
        getImageData(){
          return {data:new Uint8ClampedArray(canvas.width*canvas.height*4).fill(255),
            width:canvas.width,height:canvas.height};
        }
      });
      return canvas;
    }
  };
  let completeDecode;
  globalThis.Image=class{
    constructor(){this.naturalWidth=32;this.naturalHeight=32;}
    decode(){return new Promise(resolve=>{completeDecode=resolve;});}
  };
  URL.createObjectURL=()=> 'blob:agent2-image-lock-race';
  URL.revokeObjectURL=()=>{};
  let recipe=normalizeRecipe({seed:'image-lock-race',structure:'paths',
    geometry:'wave',viewZoom:.5,positionX:13,viewPanY:-9});
  try{
    const tool=installImagePathTool({
      getRecipe:()=>recipe,onNotice:()=>{},
      onPath:()=>{throw Error('a canceled image path must not be imported');},
      onAngle:()=>{throw Error('a canceled image angle must not be used');}
    });
    const file=nodes.imagePathFile,dialog=nodes.imagePathDialog;
    file.files=[{type:'image/png',name:'genuine.png',size:1024}];
    file.value='genuine.png';
    file.dispatchEvent(new Event('change'));
    assert.equal(dialog.open,true);
    assert.equal(dialog.dataset.phase,'analyzing');
    assert.equal(typeof completeDecode,'function');
    recipe=normalizeRecipe({...recipe,structure:'radial',lockedSettings:['structure']});
    tool.sync(recipe);
    assert.equal(nodes.imagePathApply.disabled,true);
    assert.equal(nodes.imagePathAngle.disabled,true);
    assert.equal(nodes.imagePathShape.disabled,true);
    assert.equal(nodes.imagePathAnother.disabled,true);
    completeDecode();
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(dialog.open,true);
    assert.equal(nodes.imagePathApply.disabled,true);
    assert.equal(nodes.imagePathAngle.disabled,true);
    assert.equal(nodes.imagePathAnother.disabled,true,
      'late decode finally must not reenable a locked Choose another');
    assert.match(nodes.imagePathStatus.textContent,/Unlock Layout structure/);
    assert.equal(file.value,'','decode completion should still clear its native input');
    recipe=normalizeRecipe({...recipe,lockedSettings:[]});
    tool.sync(recipe);
    assert.equal(nodes.imagePathAnother.disabled,false,
      'unlock recovers existing dialog actions without another file upload');
    assert.equal(nodes.imagePathApply.disabled,true,
      'a blank white test image contains no usable geometry');
  }finally{
    if(old.document===undefined)delete globalThis.document;
    else globalThis.document=old.document;
    if(old.Image===undefined)delete globalThis.Image;
    else globalThis.Image=old.Image;
    URL.createObjectURL=old.createURL;
    URL.revokeObjectURL=old.revokeURL;
  }
});
