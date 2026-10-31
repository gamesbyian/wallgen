import {DESIGN_WIDTH,DESIGN_HEIGHT} from './model.js';
import {textInkSelectionReach} from './text-overlays.js';
import {textOverlayPaintsInk} from './text-rainbow-shaping.js';
import {typefaceCssFamily} from './typography-fonts.js';
import {compactTextGripLayout} from './text-grip-layout.js';
import {beginPointerRotation,advancePointerRotation} from './rotation-gesture.js';
import {beginAxisDrag,axisConstrainedPoint} from './axis-constrained-drag.js';
import {snapTextAnchor} from './text-anchor-snap.js';
import {designPointFromPointer,dragTextOverlay,
  dragTextTransform,transformTextOverlay,measuredTextBounds,
  measureCanvasText,textGestureOwnsCurrentRecipe} from './text-direct-geometry.js';
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
  const axisButton=document.createElement('button');
  axisButton.type='button';axisButton.id='textDirectAxis';
  axisButton.textContent='Lock axis';axisButton.hidden=true;
  axisButton.setAttribute('aria-pressed','false');
  axisButton.setAttribute('aria-label','Lock text movement to horizontal or vertical');
  axisButton.title='One-thumb text movement: drag 8 CSS px to choose an axis. Hold Shift while dragging to constrain temporarily.';
  stage.append(axisButton);
  let axisLocked=false;
  axisButton.addEventListener('click',()=>{
    axisLocked=!axisLocked;
    axisButton.setAttribute('aria-pressed',String(axisLocked));
    axisButton.textContent=axisLocked?'Axis locked':'Lock axis';
  });
  const snapButton=document.createElement('button');
  snapButton.type='button';snapButton.id='textDirectSnap';
  snapButton.textContent='Snap anchors';snapButton.hidden=true;
  snapButton.setAttribute('aria-pressed','false');
  snapButton.setAttribute('aria-label','Snap text anchors to other visible text and canvas centre');
  snapButton.title='Magnetically align the selected text anchor with other visible text anchors or the wallpaper centre; independent of Lock axis.';
  stage.append(snapButton);
  let snapEnabled=false;
  snapButton.addEventListener('click',()=>{
    snapEnabled=!snapEnabled;
    snapButton.setAttribute('aria-pressed',String(snapEnabled));
    snapButton.textContent=snapEnabled?'Snapping on':'Snap anchors';
  });
  let active=false,drag=null,transformDrag=null;
  const fontContext=canvas.getContext('2d');
  const measure=(item,value,{tracking=false}={})=>
    measureCanvasText(fontContext,
      'bold '+item.size+'px '+typefaceCssFamily(item.font),
      item,value,{tracking});
  function paintOutline(item){
    if(!active||!textOverlayPaintsInk(item)){outline.hidden=true;return;}
    const rect=canvas.getBoundingClientRect();
    const parent=surface.getBoundingClientRect();
    const bounds=measuredTextBounds(item,value=>measure(item,value),
      {nativeTracking:'letterSpacing' in fontContext});
    const extra=textInkSelectionReach(item);
    const x=rect.left-parent.left+rect.width*item.x/100;
    const y=rect.top-parent.top+rect.height*item.y/100;
    outline.style.left=x+'px';
    outline.style.top=y+'px';
    const physicalWidth=(bounds.width+2*extra)*rect.width/DESIGN_WIDTH;
    const physicalHeight=(bounds.height+2*extra)*rect.height/DESIGN_HEIGHT;
    outline.style.width=physicalWidth+'px';
    outline.style.height=physicalHeight+'px';
    // A one-letter object is smaller than either 44px transform button.
    // Preserve the exact same accessible buttons, but place their centres
    // outside authored ink and at least 48px apart in actual canvas CSS
    // pixels, including rotated titles and right/bottom-edge placements.
    const compact=physicalWidth<80&&physicalHeight<100;
    outline.classList.toggle('text-direct-compact',compact);
    if(compact){
      const grip=compactTextGripLayout({
        canvasWidth:rect.width,canvasHeight:rect.height,
        centreX:rect.width*item.x/100,centreY:rect.height*item.y/100,
        frameWidth:physicalWidth,frameHeight:physicalHeight,
        rotation:item.rotation||0
      });
      for(const [handle,xy] of [[handles[0],grip.rotate],[handles[1],grip.scale]]){
        handle.style.left=xy.left+'px';handle.style.top=xy.top+'px';
      }
      outline.dataset.gripReachable=String(grip.reachable);
    }else{
      for(const handle of handles){handle.style.left='';handle.style.top='';}
      delete outline.dataset.gripReachable;
    }
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
    const recipe=getRecipe();
    // Another control, import, lock update or Undo has committed a newer
    // canonical recipe during pointer capture. Drop the abandoned draft;
    // pointerup must not replay the old object over the new edit.
    if(drag&&!textGestureOwnsCurrentRecipe(drag.original,recipe,drag.id))
      drag=null;
    if(transformDrag&&!textGestureOwnsCurrentRecipe(
      transformDrag.original,recipe,transformDrag.id))transformDrag=null;
    // Canvas mover and the Text pane must agree: an invisible, disabled or
    // locked-only collection has no movable ink. Never re-enable this button
    // during a frame redraw after the pane correctly disabled it.
    const movable=(recipe.textOverlays||[]).some(x=>textOverlayPaintsInk(x)&&!x.locked);
    if(!movable){
      setActive(false);
      button.disabled=true;
      return;
    }
    const candidate=(transformDrag?.next||drag?.next||recipe).textOverlays?.find(x=>x.id===selectedId());
    paintOutline(candidate);
    button.disabled=false;
  }
  function setActive(next){
    // Mode dismissal is always a cancellation of provisional pointer edits.
    // Release both owners before clearing state; delayed lost-capture events
    // then observe null and cannot cancel a future independent gesture.
    const oldDrag=drag,oldTransform=transformDrag;
    drag=null;transformDrag=null;
    if(oldDrag){try{canvas.releasePointerCapture(oldDrag.pointerId);}catch{}}
    if(oldTransform){
      const owner=handles.find(h=>h.dataset.textHandle===oldTransform.mode);
      try{owner?.releasePointerCapture(oldTransform.pointerId);}catch{}
    }
    active=Boolean(next);
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
    axisButton.hidden=!active;
    snapButton.hidden=!active;
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
    const item=hitTextAtLayout(current.textOverlays,point,
      (text,value)=>measure(text,value,{tracking:true}),{
      tolerance,customPath:current.vectorPath??current.customPath
    });
    if(!item)return;
    event.preventDefault();event.stopImmediatePropagation();
    onSelect(item.id);
    if(item.locked){onNotice('Unlock this text object to move it.');redraw();return;}
    drag={id:item.id,pointerId:event.pointerId,start:point,
      axisDrag:beginAxisDrag([event.clientX,event.clientY],
        [DESIGN_WIDTH*item.x/100,DESIGN_HEIGHT*item.y/100],
        axisLocked||event.shiftKey),
      snapEnabled,snapLocks:{x:null,y:null},
      original:getRecipe(),next:getRecipe(),moved:false};
    try{canvas.setPointerCapture(event.pointerId);}catch{}
    redraw();
  },true);
  canvas.addEventListener('pointermove',event=>{
    if(!active||!drag||drag.pointerId!==event.pointerId)return;
    event.preventDefault();event.stopImmediatePropagation();
    const point=designPointFromPointer(event,canvas);
    if(!point)return;
    const [x,y]=drag.axisDrag.origin;
    const next=axisConstrainedPoint(drag.axisDrag,
      [event.clientX,event.clientY],
      [x+point.x-drag.start.x,y+point.y-drag.start.y]);
    drag.axisDrag=next.state;
    let anchor=next.point;
    // Reuse the original vector-node 8/14 CSS-pixel hysteresis. The
    // pointerdown snapshot owns guides and enabled state for this gesture.
    if(drag.snapEnabled&&(!drag.axisDrag.enabled||drag.axisDrag.axis)){
      const bounds=canvas.getBoundingClientRect();
      const result=snapTextAnchor(anchor,drag.original.textOverlays,drag.id,
        {cssWidth:bounds.width,cssHeight:bounds.height},{enabled:true,
          axis:drag.axisDrag.enabled?drag.axisDrag.axis:null,
          previous:drag.snapLocks});
      anchor=result.point||anchor;
      drag.snapLocks=result.locks;
    }
    drag.next=dragTextOverlay(drag.original,drag.id,{
      x:anchor[0]-x,y:anchor[1]-y});
    drag.moved=drag.next!==drag.original;
    redraw();
  },true);
  canvas.addEventListener('pointerup',event=>{
    if(!drag||drag.pointerId!==event.pointerId)return;
    event.preventDefault();event.stopImmediatePropagation();
    const finished=drag;drag=null;
    try{canvas.releasePointerCapture(event.pointerId);}catch{}
    if(finished.moved&&textGestureOwnsCurrentRecipe(
      finished.original,getRecipe(),finished.id))
      changeRecipe(finished.next,{cause:'text_move_on_canvas'});
    redraw();
  },true);
  canvas.addEventListener('pointercancel',event=>{
    if(!drag||drag.pointerId!==event.pointerId)return;
    event.stopImmediatePropagation();
    drag=null;redraw(); // Cancellation never commits a partial gesture.
  },true);
  canvas.addEventListener('lostpointercapture',event=>{
    if(!drag||drag.pointerId!==event.pointerId)return;
    drag=null;redraw(); // Never save a move without a genuine pointerup.
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
      const bounds=canvas.getBoundingClientRect();
      const pivot={x:bounds.left+bounds.width*item.x/100,
        y:bounds.top+bounds.height*item.y/100};
      // Rotate by actual CSS pixels around the rendered object, rather than
      // nominal 600x1300 art units. Offset handle grabs have zero initial jump.
      const rotateState=mode==='rotate'?beginPointerRotation({
        value:item.rotation||0,pivot,
        point:{x:event.clientX,y:event.clientY},minRadius:24}):null;
      transformDrag={mode,pointerId:event.pointerId,id,start,rotateState,
        original:getRecipe(),next:getRecipe()};
      try{handle.setPointerCapture(event.pointerId);}catch{}
    });
    handle.addEventListener('pointermove',event=>{
      const state=transformDrag;
      if(!state||state.pointerId!==event.pointerId||state.mode!==mode)return;
      event.preventDefault();event.stopPropagation();
      if(mode==='rotate'){
        state.rotateState=advancePointerRotation(state.rotateState,
          {x:event.clientX,y:event.clientY});
        state.next=transformTextOverlay(state.original,state.id,
          {rotation:state.rotateState.raw});
      }else{
        const point=designPointFromPointer(event,canvas);
        if(!point)return;
        const rect=canvas.getBoundingClientRect();
        state.next=dragTextTransform(state.original,state.id,mode,state.start,point,
          {width:rect.width,height:rect.height});
      }
      redraw();
    });
    handle.addEventListener('pointerup',event=>{
      const state=transformDrag;
      if(!state||state.pointerId!==event.pointerId||state.mode!==mode)return;
      event.preventDefault();event.stopPropagation();
      transformDrag=null;
      try{handle.releasePointerCapture(event.pointerId);}catch{}
      if(state.next!==state.original&&textGestureOwnsCurrentRecipe(
        state.original,getRecipe(),state.id))
        changeRecipe(state.next,{cause:'text_'+mode+'_on_canvas'});
      redraw();
    });
    handle.addEventListener('pointercancel',event=>{
      if(!transformDrag||transformDrag.pointerId!==event.pointerId)return;
      transformDrag=null;redraw();
    });
    handle.addEventListener('lostpointercapture',event=>{
      if(!transformDrag||transformDrag.pointerId!==event.pointerId||
        transformDrag.mode!==mode)return;
      transformDrag=null;redraw(); // Rotate/scale must also fail closed.
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
