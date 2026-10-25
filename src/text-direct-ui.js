import {DESIGN_WIDTH,DESIGN_HEIGHT} from './model.js';
import {typefaceCssFamily} from './typography-fonts.js';
import {designPointFromPointer,dragTextOverlay,
  dragTextTransform,transformTextOverlay,measuredTextBounds} from './text-direct-geometry.js';
import {hitTextAtLayout} from './text-path-geometry.js';

// Opt-in touch gesture, with the same one-pointerup/one-Undo contract already
// used by scattered-object dragging. Neither guide rectangle nor Done button
// is included in PNGs, screenshots of the raw canvas, or recipe metadata.
export function installTextCanvasMover({
  getRecipe,changeRecipe,selectedId,onSelect,onNotice=()=>{},button
}){
  const canvas=document.getElementById('preview');
  const surface=canvas.closest('.wallpaper-surface');
  const stage=canvas.closest('.studio-stage');
  if(!surface||!stage||!button)throw Error('Text movement requires the canonical wallpaper view');
  const outline=document.createElement('div');
  outline.className='text-direct-outline';
  outline.hidden=true;
  // This contains interactive rotate/scale buttons. Aria-hiding the visual
  // selection frame also hides its descendants from the accessibility tree,
  // even while those buttons remain visible and keyboard-focusable.
  outline.setAttribute('role','group');
  outline.setAttribute('aria-label','Selected text transform controls');
  // Transform handles are real DOM controls, not invisible bitmap hotspots.
  // They remain keyboard-accessible and are never drawn into saved PNGs.
  const handleSpecs=[
    ['rotate','Rotate text. Drag or use left/right arrow keys. Enter rotates clockwise.','↻'],
    ['scale','Scale text. Drag or use up/down arrow keys. Enter enlarges.','⤢'],
  ];
  const handles=handleSpecs.map(([mode,label,glyph])=>{
    const element=document.createElement('button');
    element.type='button';
    element.className='text-direct-handle text-direct-'+mode;
    element.dataset.textHandle=mode;
    element.setAttribute('aria-label',label);
    element.title=label;
    element.textContent=glyph;
    outline.append(element);
    return element;
  });
  surface.append(outline);
  const done=document.createElement('button');
  done.type='button';
  done.id='textDirectDone';
  done.textContent='Done moving text';
  done.hidden=true;
  stage.append(done);
  let active=false,drag=null,transformDrag=null;
  const fontContext=canvas.getContext('2d');
  const measure=(item,value)=>{
    fontContext.save();
    fontContext.font='bold '+item.size+'px '+typefaceCssFamily(item.font);
    const width=fontContext.measureText(value).width;
    fontContext.restore();
    return width;
  };
  function paintOutline(item){
    if(!active||!item){outline.hidden=true;return;}
    const rect=canvas.getBoundingClientRect();
    const parent=surface.getBoundingClientRect();
    const bounds=measuredTextBounds(item,value=>measure(item,value));
    const extra=item.outline==='none'?0:item.size*item.outlineWidth/100;
    const x=rect.left-parent.left+rect.width*item.x/100;
    const y=rect.top-parent.top+rect.height*item.y/100;
    outline.style.left=x+'px';
    outline.style.top=y+'px';
    const physicalWidth=(bounds.width+2*extra)*rect.width/DESIGN_WIDTH;
    const physicalHeight=(bounds.height+2*extra)*rect.height/DESIGN_HEIGHT;
    outline.style.width=physicalWidth+'px';
    outline.style.height=physicalHeight+'px';
    // The standard 44px corner handle can fully cover a one-letter title.
    // Move only genuinely compact text targets outside the frame, choosing
    // inward sides when the wallpaper edge is nearby. The actual canvas
    // pointer handler, 44px controls and one-Undo path remain unchanged.
    const compact=physicalWidth<80&&physicalHeight<100;
    outline.classList.toggle('text-direct-compact',compact);
    outline.classList.toggle('text-direct-scale-left',compact&&
      rect.width*item.x/100+physicalWidth/2+70>rect.width);
    outline.classList.toggle('text-direct-scale-up',compact&&
      rect.height*item.y/100+physicalHeight/2+70>rect.height);
    outline.style.transform='translate(-50%,-50%) rotate('+item.rotation+'deg)';
    const angle=item.rotation*Math.PI/180;
    const halfVerticalReach=(Math.abs(Math.sin(angle))*(bounds.width+2*extra)*
      rect.width/DESIGN_WIDTH+Math.abs(Math.cos(angle))*(bounds.height+2*extra)*
      rect.height/DESIGN_HEIGHT)/2;
    outline.classList.toggle('text-direct-rotate-inset',y-halfVerticalReach<60);
    for(const handle of handles)handle.disabled=!!item.locked;
    outline.hidden=false;
  }
  function redraw(){
    if(!active)return;
    const candidate=(transformDrag?.next||drag?.next||getRecipe()).textOverlays?.find(x=>x.id===selectedId());
    paintOutline(candidate);
    button.disabled=!(getRecipe().textOverlays||[]).some(x=>x.enabled&&x.text);
  }
  function setActive(next){
    active=Boolean(next);
    drag=null;
    transformDrag=null;
    if(active){
      if(document.body.classList.contains('path-drawing')){
        active=false;onNotice('Finish Draw mode before moving text.');
        return;
      }
      // Existing scattered manipulation owns the same canvas and must be
      // deliberately disarmed before a text gesture is accepted.
      const scatteredDone=document.getElementById('scatteredDirectDone');
      if(scatteredDone&&!scatteredDone.hidden)scatteredDone.click();
      if(document.body.classList.contains('mobile-edit-open'))
        document.getElementById('mobileDismissHandle')?.click();
    }
    document.body.classList.toggle('text-direct-active',active);
    button.setAttribute('aria-pressed',String(active));
    button.textContent=active?'Stop moving text':'Move text on wallpaper';
    done.hidden=!active;
    if(!active)outline.hidden=true;
    else redraw();
  }
  button.addEventListener('click',()=>setActive(!active));
  done.addEventListener('click',()=>{setActive(false);document.getElementById('mobileEdit')?.focus({preventScroll:true});});
  canvas.addEventListener('pointerdown',event=>{
    if(!active||drag||transformDrag||event.button!==0||event.isPrimary===false)return;
    const point=designPointFromPointer(event,canvas);
    const rect=canvas.getBoundingClientRect();
    const tolerance=14*DESIGN_WIDTH/Math.max(rect.width,1);
    const current=getRecipe();
    const item=hitTextAtLayout(current.textOverlays,point,measure,{
      tolerance,customPath:current.customPath
    });
    if(!item)return;
    event.preventDefault();event.stopImmediatePropagation();
    onSelect(item.id);
    if(item.locked){onNotice('Unlock this text object to move it.');redraw();return;}
    drag={id:item.id,pointerId:event.pointerId,start:point,
      original:getRecipe(),next:getRecipe(),moved:false};
    try{canvas.setPointerCapture(event.pointerId);}catch{}
    redraw();
  },true);
  canvas.addEventListener('pointermove',event=>{
    if(!active||!drag||drag.pointerId!==event.pointerId)return;
    event.preventDefault();event.stopImmediatePropagation();
    const point=designPointFromPointer(event,canvas);
    if(!point)return;
    drag.next=dragTextOverlay(drag.original,drag.id,{
      x:point.x-drag.start.x,y:point.y-drag.start.y});
    drag.moved=drag.next!==drag.original;
    redraw();
  },true);
  canvas.addEventListener('pointerup',event=>{
    if(!drag||drag.pointerId!==event.pointerId)return;
    event.preventDefault();event.stopImmediatePropagation();
    const finished=drag;drag=null;
    try{canvas.releasePointerCapture(event.pointerId);}catch{}
    if(finished.moved)changeRecipe(finished.next,{cause:'text_move_on_canvas'});
    redraw();
  },true);
  canvas.addEventListener('pointercancel',event=>{
    if(!drag||drag.pointerId!==event.pointerId)return;
    event.stopImmediatePropagation();
    drag=null;redraw(); // Cancellation never commits a partial gesture.
  },true);
  for(const handle of handles){
    const mode=handle.dataset.textHandle;
    handle.addEventListener('pointerdown',event=>{
      if(!active||transformDrag||drag||event.button!==0||event.isPrimary===false)return;
      const id=selectedId();
      const item=getRecipe().textOverlays?.find(x=>x.id===id);
      if(!item||item.locked)return;
      const start=designPointFromPointer(event,canvas);
      if(!start)return;
      event.preventDefault();event.stopPropagation();
      transformDrag={mode,pointerId:event.pointerId,id,start,
        original:getRecipe(),next:getRecipe()};
      try{handle.setPointerCapture(event.pointerId);}catch{}
    });
    handle.addEventListener('pointermove',event=>{
      const state=transformDrag;
      if(!state||state.pointerId!==event.pointerId||state.mode!==mode)return;
      event.preventDefault();event.stopPropagation();
      const point=designPointFromPointer(event,canvas);
      if(!point)return;
      state.next=dragTextTransform(state.original,state.id,mode,state.start,point);
      redraw();
    });
    handle.addEventListener('pointerup',event=>{
      const state=transformDrag;
      if(!state||state.pointerId!==event.pointerId||state.mode!==mode)return;
      event.preventDefault();event.stopPropagation();
      transformDrag=null;
      try{handle.releasePointerCapture(event.pointerId);}catch{}
      if(state.next!==state.original)
        changeRecipe(state.next,{cause:'text_'+mode+'_on_canvas'});
      redraw();
    });
    handle.addEventListener('pointercancel',event=>{
      if(!transformDrag||transformDrag.pointerId!==event.pointerId)return;
      transformDrag=null;redraw();
    });
    // A screen reader or keyboard can use Enter to step the value or arrow
    // keys in both directions. Each keypress stays a single Undo transaction.
    const step=direction=>{
      const id=selectedId(),recipe=getRecipe();
      const item=recipe.textOverlays?.find(x=>x.id===id);
      if(!item||item.locked)return;
      const updated=mode==='scale'?
        transformTextOverlay(recipe,id,{size:item.size+direction*8}):
        transformTextOverlay(recipe,id,{rotation:item.rotation+direction*15});
      if(updated!==recipe)changeRecipe(updated,{cause:'text_'+mode+'_keyboard'});
      redraw();
    };
    handle.addEventListener('click',event=>{
      if(event.detail!==0)return; // Keyboard only: pointerup already owns touch.
      step(1);
    });
    handle.addEventListener('keydown',event=>{
      const negative=mode==='rotate'?'ArrowLeft':'ArrowDown';
      const positive=mode==='rotate'?'ArrowRight':'ArrowUp';
      if(event.key!==negative&&event.key!==positive)return;
      event.preventDefault();event.stopPropagation();
      step(event.key===positive?1:-1);
    });
  }
  window.addEventListener('resize',redraw);
  window.addEventListener('keydown',event=>{
    if(active&&event.key==='Escape'){setActive(false);event.preventDefault();}
  });
  return {
    sync:redraw,
    endCanvasMove:()=>setActive(false),
    get active(){return active;}
  };
}
