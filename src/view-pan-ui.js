import {beginViewPan,advanceViewPan} from './view-pan-gesture.js';

// Opt-in preview framing. Existing arrow buttons remain the precision fallback.
// CSS translation is strictly a transient gesture preview: source regeneration
// on commit draws the true camera, never a stretched or cropped bitmap export.
export function installViewPanGesture({getRecipe,changeRecipe,onNotice=()=>{},
  preview,stage,host}){
  if(!preview||!stage||!host||typeof getRecipe!=='function'||
    typeof changeRecipe!=='function')throw Error('Camera pan needs source, canvas and controls');
  const button=document.createElement('button');
  button.type='button';button.id='viewPanOnCanvas';
  button.textContent='Drag frame on wallpaper';
  button.setAttribute('aria-pressed','false');
  button.setAttribute('aria-label','Drag the wallpaper to reframe the camera');
  button.title='One-finger frame movement; keeps original artwork positions unchanged';
  host.append(button);
  const done=document.createElement('button');
  done.type='button';done.id='viewPanDone';done.hidden=true;
  done.textContent='Done reframing';stage.append(done);
  let active=false,drag=null;
  function clearGesture(){
    const old=drag;drag=null;preview.style.transform='';
    if(old)try{preview.releasePointerCapture(old.pointerId);}catch{}
  }
  function setActive(value){
    clearGesture();
    const requested=Boolean(value);
    if(requested&&document.body.classList.contains('path-drawing')){
      onNotice('Finish Draw mode before reframing the wallpaper.');
      return;
    }
    if(requested){
      document.getElementById('textDirectDone')?.click();
      document.getElementById('scatteredDirectDone')?.click();
      if(document.body.classList.contains('mobile-edit-open'))
        document.getElementById('mobileDismissHandle')?.click();
    }
    active=requested;
    document.body.classList.toggle('view-pan-canvas-active',active);
    button.setAttribute('aria-pressed',String(active));
    button.textContent=active?'Stop dragging frame':'Drag frame on wallpaper';
    done.hidden=!active;
  }
  button.addEventListener('click',()=>setActive(!active));
  done.addEventListener('click',()=>{
    setActive(false);
    const target=button.getClientRects().length?button:
      document.getElementById('mobileEdit');
    target?.focus({preventScroll:true});
  });
  preview.addEventListener('pointerdown',event=>{
    if(!active||drag||event.button!==0||event.isPrimary===false)return;
    const rect=preview.getBoundingClientRect(),original=getRecipe();
    const state=beginViewPan({recipe:original,
      point:{x:event.clientX,y:event.clientY},
      viewport:{width:rect.width,height:rect.height}});
    if(!state)return;
    event.preventDefault();event.stopImmediatePropagation();
    drag={original,state,pointerId:event.pointerId};
    try{preview.setPointerCapture(event.pointerId);}catch{}
  },true);
  preview.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.pointerId)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(drag.original!==getRecipe()){clearGesture();return;}
    drag.state=advanceViewPan(drag.state,{x:event.clientX,y:event.clientY});
    const {displacementX:x,displacementY:y}=drag.state;
    preview.style.transform=x||y?'translate3d('+x+'px,'+y+'px,0)':'';
  },true);
  preview.addEventListener('pointerup',event=>{
    if(!drag||event.pointerId!==drag.pointerId)return;
    event.preventDefault();event.stopImmediatePropagation();
    const {original,state}=drag;
    const valid=active&&original===getRecipe()&&state.moved;
    clearGesture();
    if(valid)changeRecipe({...original,viewPanX:state.panX,viewPanY:state.panY},
      {cause:'view_pan_on_canvas'});
  },true);
  for(const name of ['pointercancel','lostpointercapture']){
    preview.addEventListener(name,event=>{
      if(drag&&event.pointerId===drag.pointerId)clearGesture();
    },true);
  }
  // Switching to another canvas authoring mode disarms framing. These
  // controls retain their original ownership and no two tools consume a
  // pointer in the same frame.
  document.addEventListener('click',event=>{
    if(active&&event.target.closest(
      '#scatteredMoveOnCanvas,[data-text-move],#drawPathToggle,#imagePathToggle'))
      setActive(false);
  });
  window.addEventListener('blur',clearGesture);
  window.addEventListener('keydown',event=>{
    if(active&&event.key==='Escape'){
      event.preventDefault();setActive(false);
    }
  });
  // An unrelated canonical update cancels the provisional camera translation.
  document.addEventListener('roygbiv-controls-synced',()=>{
    if(drag&&drag.original!==getRecipe())clearGesture();
  });
  return {end:()=>setActive(false),get active(){return active;}};
}
