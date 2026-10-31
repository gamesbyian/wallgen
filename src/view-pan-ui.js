import {beginViewPan,advanceViewPan,beginViewPinch,
  advanceViewPinch,viewPinchPreview} from './view-pan-gesture.js';

// Opt-in preview framing. Existing arrow buttons remain the precision fallback.
// CSS translation is strictly a transient gesture preview: source regeneration
// on commit draws the true camera, never a stretched or cropped bitmap export.
export function installViewPanGesture({getRecipe,changeRecipe,onNotice=()=>{},
  preview,stage,host}){
  if(!preview||!stage||!host||typeof getRecipe!=='function'||
    typeof changeRecipe!=='function')throw Error('Camera pan needs source, canvas and controls');
  const button=document.createElement('button');
  button.type='button';button.id='viewPanOnCanvas';
  button.textContent='Drag or pinch frame';
  button.setAttribute('aria-pressed','false');
  button.setAttribute('aria-label','Drag or pinch the wallpaper to reframe the camera');
  button.title='One-finger pan or two-finger anchored zoom; artwork positions remain unchanged';
  host.append(button);
  const done=document.createElement('button');
  done.type='button';done.id='viewPanDone';done.hidden=true;
  done.textContent='Done reframing';stage.append(done);
  let active=false,drag=null,pinch=null;
  const originalTouchAction=preview.style.touchAction;
  function releasePointer(id){
    try{preview.releasePointerCapture(id);}catch{}
  }
  function clearGesture(){
    const old=drag,oldPinch=pinch;
    drag=null;pinch=null;
    preview.style.transform='';
    preview.style.transformOrigin='';
    if(old)releasePointer(old.pointerId);
    if(oldPinch)for(const id of oldPinch.ids)releasePointer(id);
  }
  const local=(point,rect)=>({x:point.x-rect.left,y:point.y-rect.top});
  function drawPinch(){
    if(!pinch)return;
    const next=pinch.state,view=pinch.viewport;
    const placement=viewPinchPreview(pinch.original,next,view);
    if(!placement)return;
    preview.style.transformOrigin='50% 50%';
    const {scale,x,y}=placement;
    preview.style.transform='translate3d('+x+'px,'+y+'px,0) scale('+scale+')';
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
    preview.style.touchAction=active?'none':originalTouchAction;
    document.body.classList.toggle('view-pan-canvas-active',active);
    button.setAttribute('aria-pressed',String(active));
    button.textContent=active?'Stop reframing':'Drag or pinch frame';
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
    if(!active||event.button!==0)return;
    if(pinch){
      // A third finger invalidates the two-touch interpretation.
      if(event.pointerType==='touch')clearGesture();
      return;
    }
    if(drag){
      if(event.pointerType!=='touch'||drag.pointerType!=='touch'||
          drag.pointerId===event.pointerId)return;
      if(drag.original!==getRecipe()){clearGesture();return;}
      const {rect,original,state}=drag;
      const first=local(drag.current,rect);
      const second=local({x:event.clientX,y:event.clientY},rect);
      // Carry an already-previewed one-finger pan forward without committing
      // it or jumping visually when the second finger lands.
      const staged={...original,viewPanX:state.panX,viewPanY:state.panY};
      const viewport={width:rect.width,height:rect.height};
      const start=beginViewPinch({recipe:staged,first,second,viewport});
      if(!start){clearGesture();return;}
      event.preventDefault();event.stopImmediatePropagation();
      pinch={original,ids:[drag.pointerId,event.pointerId],
        points:[first,second],viewport,state:start,rect};
      drag=null;
      try{preview.setPointerCapture(event.pointerId);}catch{}
      drawPinch();
      return;
    }
    if(event.isPrimary===false)return;
    const rect=preview.getBoundingClientRect(),original=getRecipe();
    const current={x:event.clientX,y:event.clientY};
    const state=beginViewPan({recipe:original,
      point:current,viewport:{width:rect.width,height:rect.height}});
    if(!state)return;
    event.preventDefault();event.stopImmediatePropagation();
    drag={original,state,pointerId:event.pointerId,
      pointerType:event.pointerType,rect,current};
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
