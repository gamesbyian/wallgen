import {finishDrawnPath,DRAW_COORD_MIN,DRAW_COORD_MAX,MAX_DRAWN_POINTS,prepareDrawnPath,pointOnDrawnPath} from './drawn-path.js?v=20261018-extend1';
import {createPointEditor,clonePointEditor,addPointAnchor,deletePointAnchor,
  movePointAnchor,pointAnchorWouldMove,movePointHandle,pointHandles,editablePointHandleSides,
  resmoothPointEdits,insertPointAnchor,
  savedPointAnchors,savedPointCorners} from './path-point-editor.js';
import {drawAuthoringLockReason,drawAuthoringLockMessage} from './path-authoring-locks.js';

/** Match the renderer's world-space camera and *screen-space* composition
 * nudge. Positive viewPanX/Y moves the camera to higher world coordinates,
 * shifting ink and its interactive anchors in the opposite screen direction.
 * New strokes are authored in world coordinates without inheriting the
 * unrelated positionX/Y translation of the currently generated wallpaper. */
export function drawnPathViewportOffset(recipe,showSavedPath=false){
  const zoom=Math.max(.5,Math.min(2.5,Number(recipe?.viewZoom)||1));
  const compositionX=showSavedPath?(Number(recipe?.positionX)||0):0;
  const compositionY=showSavedPath?(Number(recipe?.positionY)||0):0;
  return [(compositionX-zoom*(Number(recipe?.viewPanX)||0))/100,
    (compositionY-zoom*(Number(recipe?.viewPanY)||0))/100];
}

/** Stored Draw geometry remains available when another structure is
 * selected, but only the active Paths scene can be refined as a saved path.
 * A Radial/Regions recipe may carry a dormant customPath for future reuse. */
export function activeSavedDrawnPath(recipe){
  return recipe?.structure==='paths'&&recipe.geometry==='drawn'&&
    Array.isArray(recipe.customPath)&&recipe.customPath.length>=2;
}
/** One saved Draw editor transaction owns the exact curve AND its human
 * authoring constraints. Undo may restore changed pins/corners while keeping
 * identical curve pixels; applying a stale point editor must not erase them. */
export function savedDrawSourceKey(recipe){
  if(!activeSavedDrawnPath(recipe))return null;
  return JSON.stringify([recipe.customPath,recipe.drawnAnchors||[],
    recipe.drawnCorners||[]]);
}
export function savedDrawSourceMatches(sourceKey,recipe){
  return typeof sourceKey==='string'&&sourceKey===savedDrawSourceKey(recipe);
}

// The freehand overlay is also the optional point editor: one shared camera,
// one source of path geometry and one save/undo transaction.
export function installDrawTool({getRecipe,onApply,onNotice}){
  const byId=id=>document.getElementById(id);
  const button=byId('drawPathToggle'),panel=byId('drawPathPanel');
  const overlay=byId('drawOverlay'),wallpaper=byId('preview');
  const hint=byId('drawPathHint'),apply=byId('drawApply');
  const phase=panel.querySelector('.draw-phase');
  const smooth=byId('drawSmooth'),geometric=byId('drawGeometric');
  const again=byId('drawAgain'),cancel=byId('drawCancel');
  const power=byId('drawSmoothingStrength'),powerLabel=byId('drawSmoothingValue');
  const extend=byId('drawExtendPath');
  const editButton=byId('drawEditPoints'),addButton=byId('drawAddPoint');
  const deleteButton=byId('drawDeletePoint'),cornerButton=byId('drawCornerPoint');
  const reSmooth=byId('drawResmoothPoints'),pointUndo=byId('drawUndoPoint');
  const geometryOption=document.querySelector('[name=geometry] option[value=drawn]');
  const ctx=overlay.getContext('2d');
  let active=false,pointer=null,raw=[],ready=[],importedSource=[],fit='smooth',editing=false;
  let editor=null,pendingPins=[],pendingCorners=[],adding=false,drag=null,history=[];
  let editingSavedPath=false,showingSavedPath=false;
  let savedSourcePath=null,applying=false,interruptedStroke=null;
  const cameraPan=()=>drawnPathViewportOffset(getRecipe(),
    showingSavedPath||editingSavedPath);
  // A saved curve has not entered provisional ready/raw state yet. Reframing
  // must render that visible source too, rather than clearing the overlay.
  // Authoring new points still takes precedence over the old saved geometry.
  const visiblePoints=()=>editing?editor?.points||[]:
    ready.length?ready:raw.length?raw:
    showingSavedPath&&activeSavedDrawnPath(getRecipe())?getRecipe().customPath:[];

  // Convert between the design's normalized coordinates and the full stage,
  // whose preview may be zoomed and letterboxed inside the editing overlay.
  function stageMapping(){
    const stage=overlay.getBoundingClientRect(),image=wallpaper.getBoundingClientRect();
    const zoom=Number(document.querySelector('.studio-stage').dataset.viewZoom)||1;
    const [panX,panY]=cameraPan();
    return {
      x:x=>(image.left+(.5+(x-.5)*zoom+panX)*image.width-stage.left)*overlay.width/stage.width,
      y:y=>(image.top+(.5+(y-.5)*zoom+panY)*image.height-stage.top)*overlay.height/stage.height,
      scale:overlay.width/Math.max(stage.width,1)
    };
  }
  function position(event){
    const rect=wallpaper.getBoundingClientRect();
    const zoom=Number(document.querySelector('.studio-stage').dataset.viewZoom)||1;
    const [panX,panY]=cameraPan();
    return [
      Math.max(DRAW_COORD_MIN,Math.min(DRAW_COORD_MAX,
        .5+((event.clientX-rect.left)/rect.width-.5-panX)/zoom)),
      Math.max(DRAW_COORD_MIN,Math.min(DRAW_COORD_MAX,
        .5+((event.clientY-rect.top)/rect.height-.5-panY)/zoom))
    ];
  }
  const project=(m,p)=>[m.x(p[0]),m.y(p[1])];
  const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  function draw(points){
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,overlay.width,overlay.height);
    if(points.length<2)return;
    const m=stageMapping();
    ctx.lineJoin='round';ctx.lineCap='round';
    if(extend.checked){
      const prepared=prepareDrawnPath(points);
      if(prepared&&!prepared.closed){
        const norm=p=>[(p.x+300)/600,(p.y+650)/1300];
        ctx.save();ctx.strokeStyle='#8de8f6';ctx.lineWidth=1.8*m.scale;
        ctx.setLineDash([8*m.scale,6*m.scale]);
        for(const [u,tip] of [[-1,prepared.points[0]],[2,prepared.points.at(-1)]]){
          const outer=pointOnDrawnPath(prepared,u,{extrapolate:true});
          const a=project(m,norm(tip)),b=project(m,norm(outer));
          ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
        }
        ctx.restore();
      }
    }
    for(const [colour,width] of [['#11131b',10],['#fff4a8',5]]){
      ctx.strokeStyle=colour;ctx.lineWidth=width*m.scale;
      ctx.beginPath();
      points.forEach((point,i)=>{
        const [x,y]=project(m,point);
        if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      });
      ctx.stroke();
    }
    if(!editing||!editor)return;
    const radius=4.5*m.scale;
    if(editor.selected!==-1){
      const at=editor.points[editor.selected],handles=pointHandles(editor,editor.selected);
      const origin=project(m,at);
      ctx.strokeStyle='#58d8ff';ctx.lineWidth=1.5*m.scale;
      for(const side of editablePointHandleSides(editor,editor.selected)){
        const h=project(m,handles[side]);
        ctx.beginPath();ctx.moveTo(...origin);ctx.lineTo(...h);ctx.stroke();
        ctx.fillStyle='#d6f5ff';ctx.beginPath();
        ctx.arc(h[0],h[1],3.8*m.scale,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#0b3753';ctx.stroke();
      }
    }
    for(const i of editor.anchors){
      const [x,y]=project(m,editor.points[i]);
      const selected=i===editor.selected;
      ctx.fillStyle=selected?'#ffb943':editor.pinned.has(i)?'#5ef0e3':'#fff';
      ctx.strokeStyle='#21243a';ctx.lineWidth=2*m.scale;
      const r=selected?radius*1.4:radius;
      ctx.fillRect(x-r,y-r,r*2,r*2);
      ctx.strokeRect(x-r,y-r,r*2,r*2);
    }
  }
  function syncPointControls(){
    const savedPath=getRecipe();
    editButton.hidden=!active||(!editing&&ready.length<2&&
      !activeSavedDrawnPath(savedPath));
    editButton.setAttribute('aria-pressed',String(editing));
    editButton.textContent=editing?'Hide points':'Edit points';
    const available=editing&&editor?.selected!==-1;
    addButton.hidden=deleteButton.hidden=cornerButton.hidden=reSmooth.hidden=pointUndo.hidden=!editing;
    addButton.setAttribute('aria-pressed',String(adding));
    deleteButton.disabled=!available||editor.selected===0||editor.selected===editor.points.length-1;
    cornerButton.disabled=!available||editor.selected===0||
      editor.selected===editor.points.length-1;
    cornerButton.textContent=available&&editor.corners.has(editor.selected)?'Make smooth':'Make corner';
    reSmooth.disabled=!available;
    pointUndo.disabled=history.length===0;
    pointUndo.parentElement.hidden=!editing;
    // Fit selectors work only on provisional raw/imported samples. A saved
    // centreline has no raw source to refit, so choosing Smooth/Geometric or
    // changing strength here previously appeared to act but did nothing.
    // The explicit point-editor Resmooth action remains available.
    // A saved path OR an already hand-edited provisional path no longer
    // has raw/imported samples to refit. After Edit points -> Hide points,
    // the authoritative ready curve remains but Smooth/Geometric would
    // otherwise claim to work while setFit silently does nothing.
    const noRefitSource=(showingSavedPath||ready.length>=2)&&
      raw.length<2&&importedSource.length<2;
    smooth.disabled=geometric.disabled=editing||noRefitSource;
    power.disabled=noRefitSource&&!editing;
    apply.disabled=(editing?editor?.points.length:ready.length)<2;
    // The UI follows the existing authoritative path state. This is not a
    // new workflow engine; no recipe data or pointer state is duplicated.
    const step=editing?'anchors':
      ready.length>=2||showingSavedPath?'refine':'sketch';
    panel.dataset.phase=step;
    phase.textContent=step==='anchors'?'Edit points':step==='refine'?'Refine':'Sketch';
  }
  function setFit(mode){
    fit=mode;
    smooth.setAttribute('aria-pressed',String(fit==='smooth'));
    geometric.setAttribute('aria-pressed',String(fit==='geometric'));
    if(editing)return;
    if(raw.length>=2||importedSource.length>=2){
      ready=finishDrawnPath(raw.length>=2?raw:importedSource,fit,Number(power.value));
      pendingPins=[];pendingCorners=[];
      if(ready.length>=2){
        draw(ready);
        hint.textContent=fit==='geometric'?
          'Straightened and rounded. Use this path or refine its points.':
          'Smoothed at '+power.value+'×. Use this path or refine its points.';
      }
    }
    syncPointControls();
  }
  function reset(){
    pointer=null;drag=null;interruptedStroke=null;
    raw=[];ready=[];importedSource=[];pendingPins=[];pendingCorners=[];
    editor=null;editing=false;adding=false;history=[];
    editingSavedPath=false;showingSavedPath=false;
    savedSourcePath=null;
    draw([]);syncPointControls();
    hint.textContent='Draw anywhere on the preview, including beyond the frame.';
  }
  function stop(){
    active=false;reset();overlay.hidden=true;panel.hidden=true;
    button.setAttribute('aria-pressed','false');
    document.body.classList.remove('path-drawing');
  }
  function start(){
    const blocked=drawAuthoringLockReason(getRecipe());
    if(blocked){
      onNotice(drawAuthoringLockMessage(blocked));
      return;
    }
    if(document.body.classList.contains('mobile-edit-open'))
      byId('mobileDismissHandle').click();
    active=true;reset();setFit('smooth');
    extend.checked=!!getRecipe().extendDrawnPath;
    extend.disabled=getRecipe().lockedSettings.includes('extendDrawnPath');
    overlay.hidden=false;panel.hidden=false;
    button.setAttribute('aria-pressed','true');
    document.body.classList.add('path-drawing');
    if(activeSavedDrawnPath(getRecipe())){
      showingSavedPath=true;
      hint.textContent='Draw a replacement, or tap Edit points to refine this path.';
      draw(getRecipe().customPath);
    }
    syncPointControls();
  }
  function editPoints(){
    if(!editing){
      const source=getRecipe(),saved=activeSavedDrawnPath(source);
      const existing=ready.length>=2?ready:saved?source.customPath:[];
      if(existing.length<2)return;
      // Editing a saved path remains one transaction even if its controls
      // are hidden and reopened. A second entry must not turn an existing
      // path into a replacement and silently zero composition position.
      if(ready.length<2&&saved){
        editingSavedPath=true;
        savedSourcePath=savedDrawSourceKey(source);
      }
      const pins=ready.length>=2?pendingPins:getRecipe().drawnAnchors;
      const corners=ready.length>=2?pendingCorners:getRecipe().drawnCorners;
      // Hiding control squares is presentation only. If the same draft is
      // reopened, retain its actual editor and Undo history, not a new
      // approximation of the already-edited points.
      if(!editor){
        editor=createPointEditor(existing,pins,corners);
        history=[];
      }
      if(!editor)return;
      ready=editor.points.map(p=>p.slice());editing=true;adding=false;
      overlay.focus({preventScroll:true});
      hint.textContent='Drag squares or tangent handles. Add a point if needed.';
    }else{
      ready=editor.points.map(p=>p.slice());
      pendingPins=savedPointAnchors(editor);
      pendingCorners=savedPointCorners(editor);
      // No longer re-run the original raw stroke after manual corrections.
      // Hiding anchors keeps the edited geometry authoritative until redraw.
      raw=[];importedSource=[];
      editing=false;adding=false;
      hint.textContent='Edited path retained. Apply it or return to Edit points.';
    }
    syncPointControls();draw(ready);
  }
  const pushUndo=()=>{if(history.length>=40)history.shift();history.push(clonePointEditor(editor));};
  const settle=()=>{
    if(!editor)return;
    resmoothPointEdits(editor,Number(power.value));
    editor.changed.clear();
    ready=editor.points.map(p=>p.slice());
    pendingPins=savedPointAnchors(editor);
    pendingCorners=savedPointCorners(editor);
    syncPointControls();draw(ready);
  };
  function nearestHit(event){
    if(!editor)return null;
    const m=stageMapping();
    const px=overlay.getBoundingClientRect(),mouse=[
      (event.clientX-px.left)*overlay.width/px.width,
      (event.clientY-px.top)*overlay.height/px.height
    ];
    const radius=17*m.scale;
    if(editor.selected!==-1){
      // On narrow phones the inferred tangent tips can lie inside the full
      // 17 CSS px pointer tolerance around the selected square. Handle-first
      // hit testing then steals a drag started precisely on the anchor.
      // Keep a small six-pixel *anchor centre* core before trying tangents;
      // the original larger tangent radius remains outside that core.
      const selected=editor.selected,at=editor.points[selected];
      if(distance(mouse,project(m,at))<=6*m.scale)
        return {type:'anchor',index:selected,at};
      const handles=pointHandles(editor,editor.selected);
      for(const side of editablePointHandleSides(editor,editor.selected)){
        if(distance(mouse,project(m,handles[side]))<=radius)
          return {type:'handle',index:editor.selected,side,at:handles[side]};
      }
    }
    let best=null,least=radius;
    for(const i of editor.anchors){
      const d=distance(mouse,project(m,editor.points[i]));
      if(d<least){least=d;best={type:'anchor',index:i,at:editor.points[i]};}
    }
    if(best)return best;
    if(adding){
      least=22*m.scale;
      for(let i=1;i<editor.points.length-1;i++){
        if(editor.anchors.some(anchor=>Math.abs(anchor-i)<3))continue;
        const d=distance(mouse,project(m,editor.points[i]));
        if(d<least){least=d;best={type:'add',index:i};}
      }
      if(best)return best;
      // A legitimate imported line can consist of just two endpoints:
      // there is no interior sample to select. Project segments into the
      // same zoomed, panned screen space as normal anchor hit-testing.
      // Inserting on the original segment preserves its world geometry.
      if(editor.points.length<MAX_DRAWN_POINTS){
        for(let i=0;i<editor.points.length-1;i++){
          const a=project(m,editor.points[i]),b=project(m,editor.points[i+1]);
          const vx=b[0]-a[0],vy=b[1]-a[1],len2=vx*vx+vy*vy;
          if(len2<=0)continue;
          const t=Math.max(0,Math.min(1,
            ((mouse[0]-a[0])*vx+(mouse[1]-a[1])*vy)/len2));
          if(t<=.05||t>=.95)continue;
          const d=distance(mouse,[a[0]+vx*t,a[1]+vy*t]);
          if(d<least){least=d;best={type:'insert',index:i,t};}
        }
      }
    }
    return best;
  }
  function append(event){
    const coalesced=event.getCoalescedEvents?.();
    for(const sample of coalesced?.length?coalesced:[event]){
      const p=position(sample),prior=raw.at(-1);
      if(!prior||Math.hypot((p[0]-prior[0])*600,(p[1]-prior[1])*1300)>=1.3)
        raw.push(p);
    }
    if(raw.length>5000)raw=raw.filter((_,i)=>i%2===0);
    draw(raw);
  }
  overlay.addEventListener('pointerdown',event=>{
    if(!active||pointer!==null||event.isPrimary===false)return;
    event.preventDefault();event.stopPropagation();
    if(editing){
      const hit=nearestHit(event);
      if(!hit){editor.selected=-1;draw(editor.points);syncPointControls();return;}
      if(hit.type==='add'||hit.type==='insert'){
        pushUndo();
        const added=hit.type==='add'?addPointAnchor(editor,hit.index):
          insertPointAnchor(editor,hit.index,hit.t);
        if(!added)history.pop();
        if(added){
          ready=editor.points.map(p=>p.slice());
          pendingPins=savedPointAnchors(editor);
          pendingCorners=savedPointCorners(editor);
        }
        adding=false;draw(editor.points);syncPointControls();
        return;
      }
      editor.selected=hit.index;
      pointer=event.pointerId;
      const start=clonePointEditor(editor),mouse=position(event);
      drag={hit,start,moved:false,
        offset:[hit.at[0]-mouse[0],hit.at[1]-mouse[1]],
        handles:pointHandles(editor,hit.index)};
      try{overlay.setPointerCapture(pointer);}catch{}
      syncPointControls();draw(editor.points);
      return;
    }
    // A browser may cancel a touch when orientation changes, the OS steals
    // the gesture or scrolling wins. Keep the previous uncommitted draft until
    // this replacement stroke actually finishes. Cancellation is not Erase.
    interruptedStroke={
      raw,ready,importedSource,pendingPins,pendingCorners,editor,history,
      showingSavedPath,editingSavedPath,savedSourcePath
    };
    pointer=event.pointerId;raw=[];ready=[];importedSource=[];pendingPins=[];pendingCorners=[];apply.disabled=true;
    // A replacement stroke is a new transaction, unlike merely hiding handles.
    editor=null;history=[];adding=false;
    showingSavedPath=false;editingSavedPath=false;savedSourcePath=null;
    append(event);
    try{overlay.setPointerCapture(pointer);}catch{}
    hint.textContent='Keep drawing. Lift your finger to finish.';
    panel.dataset.phase='sketch';phase.textContent='Sketch';
  });
  overlay.addEventListener('pointermove',event=>{
    if(pointer!==event.pointerId)return;
    event.preventDefault();event.stopPropagation();
    if(editing&&drag){
      const pos=position(event),to=[
        Math.max(DRAW_COORD_MIN,Math.min(DRAW_COORD_MAX,pos[0]+drag.offset[0])),
        Math.max(DRAW_COORD_MIN,Math.min(DRAW_COORD_MAX,pos[1]+drag.offset[1]))
      ];
      if(!drag.moved){
        const changed=drag.hit.type==='anchor'?
          pointAnchorWouldMove(editor,drag.hit.index,to,drag.start.points):
          Math.abs(to[0]-drag.hit.at[0])>=.00001||
          Math.abs(to[1]-drag.hit.at[1])>=.00001;
        if(!changed)return;
        pushUndo();drag.moved=true;
      }
      if(drag.hit.type==='anchor')
        movePointAnchor(editor,drag.hit.index,to,drag.start.points);
      else movePointHandle(editor,drag.hit.index,drag.hit.side,to,
        drag.start.points,drag.handles);
      draw(editor.points);return;
    }
    append(event);
  });
  overlay.addEventListener('pointerup',event=>{
    if(pointer!==event.pointerId)return;
    event.preventDefault();event.stopPropagation();
    if(!editing)append(event);
    pointer=null;
    try{overlay.releasePointerCapture(event.pointerId);}catch{}
    if(editing){if(drag?.moved)settle();drag=null;return;}
    setFit(fit);
    interruptedStroke=null;
    if(ready.length<2)hint.textContent='That was too short. Draw a longer path.';
  });
  overlay.addEventListener('pointercancel',event=>{
    if(pointer!==event.pointerId)return;
    event.preventDefault();pointer=null;
    if(editing&&drag){
      if(drag.moved){editor=drag.start;history.pop();}
      drag=null;draw(editor.points);syncPointControls();
    }else{
      const previous=interruptedStroke;
      interruptedStroke=null;
      if(previous){
        ({raw,ready,importedSource,pendingPins,pendingCorners,editor,history,
          showingSavedPath,editingSavedPath,savedSourcePath}=previous);
        syncPointControls();draw(visiblePoints());
        hint.textContent=ready.length>=2||showingSavedPath?
          'Stroke interrupted. Your previous path is still here.':
          'Stroke interrupted. Draw again.';
      }else{
        reset();
        hint.textContent='Stroke interrupted. Draw again.';
      }
    }
  });
  overlay.addEventListener('click',event=>{if(active){event.preventDefault();event.stopPropagation();}});
  button.addEventListener('click',()=>active?stop():start());
  window.addEventListener('resize',()=>{
    if(active)draw(visiblePoints());
  });
  overlay.parentElement.addEventListener('roygbiv-preview-zoom',()=>{
    if(active)draw(visiblePoints());
  });
  smooth.addEventListener('click',()=>setFit('smooth'));
  geometric.addEventListener('click',()=>setFit('geometric'));
  extend.addEventListener('change',()=>{if(active)draw(visiblePoints());});
  document.querySelector('.studio-stage').addEventListener('roygbiv-view-zoom-updated',()=>{
    if(active)draw(visiblePoints());
  });
  power.addEventListener('input',()=>{
    powerLabel.textContent=Number(power.value).toFixed(1)+'×';
    if(!editing)setFit(fit);
  });
  editButton.addEventListener('click',editPoints);
  addButton.addEventListener('click',()=>{
    if(!editing)return;
    adding=!adding;
    hint.textContent=adding?'Tap the drawn line where a new anchor is needed.':
      'Drag a square to adjust the curve.';
    syncPointControls();
  });
  deleteButton.addEventListener('click',()=>{
    if(!editing||editor.selected===-1)return;
    pushUndo();deletePointAnchor(editor,editor.selected);
    syncPointControls();draw(editor.points);
  });
  cornerButton.addEventListener('click',()=>{
    if(!editing||editor.selected===-1)return;
    pushUndo();
    const index=editor.selected;
    if(editor.corners.has(index))editor.corners.delete(index);
    else editor.corners.add(index);
    editor.pinned.add(index);
    syncPointControls();draw(editor.points);
  });
  reSmooth.addEventListener('click',()=>{
    if(!editing||editor.selected===-1)return;
    // A two-node imported line or already-fair straight span has no
    // interior samples that fairing can change. Only real curve changes
    // deserve an Undo snapshot and a new authored transaction.
    const trial=clonePointEditor(editor);
    trial.changed.add(trial.selected);
    resmoothPointEdits(trial,Number(power.value));
    if(trial.points.every((p,i)=>p[0]===editor.points[i][0]&&
      p[1]===editor.points[i][1]))return;
    pushUndo();
    editor=trial;
    editor.changed.clear();
    ready=editor.points.map(p=>p.slice());
    pendingPins=savedPointAnchors(editor);
    pendingCorners=savedPointCorners(editor);
    syncPointControls();draw(ready);
  });
  pointUndo.addEventListener('click',()=>{
    if(!editing||!history.length)return;
    editor=history.pop();ready=editor.points.slice();
    syncPointControls();draw(editor.points);
  });
  again.addEventListener('click',reset);
  cancel.addEventListener('click',stop);
  apply.addEventListener('click',()=>{
    if(!active)return;
    const points=editing?editor.points:ready;
    if(points.length<2)return;
    const pins=editing?savedPointAnchors(editor):pendingPins;
    const corners=editing?savedPointCorners(editor):pendingCorners;
    // The real onApply synchronously updates the recipe and calls sync().
    // That intentional commit must not look like an unrelated Undo/restore.
    applying=true;
    try{onApply(points,pins,corners,extend.checked,editingSavedPath);}
    finally{applying=false;stop();}
  });
  document.addEventListener('keydown',event=>{
    if(!active)return;
    if(event.key==='Escape'){event.preventDefault();stop();return;}
    if(!editing||event.target?.closest?.('input,select,textarea'))return;
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){
      event.preventDefault();pointUndo.click();return;
    }
    if(editor.selected!==-1&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)){
      event.preventDefault();
      const p=editor.points[editor.selected].slice(),amount=event.shiftKey?10:1;
      if(event.key==='ArrowUp')p[1]-=amount/1300;
      if(event.key==='ArrowDown')p[1]+=amount/1300;
      if(event.key==='ArrowLeft')p[0]-=amount/600;
      if(event.key==='ArrowRight')p[0]+=amount/600;
      if(!pointAnchorWouldMove(editor,editor.selected,p))return;
      pushUndo();movePointAnchor(editor,editor.selected,p);settle();
    }else if(editor.selected!==-1&&['Delete','Backspace'].includes(event.key)){
      event.preventDefault();deleteButton.click();
    }
  });
  return {
    // Imported geometry enters the exact same provisional preview, point
    // editor, undo and onApply transaction as a finger-drawn curve.
    loadPath(imported){
      if(active)stop();
      start();
      if(!active)return false;
      ready=imported.points.map(p=>p.slice());
      showingSavedPath=false;editingSavedPath=false;
      importedSource=ready.map(p=>p.slice());
      raw=[];pendingPins=[...(imported.anchors||[])];
      pendingCorners=[...(imported.corners||[])];
      hint.textContent='Imported path ready. Edit points or choose Use path.';
      syncPointControls();draw(ready);
      return true;
    },
    sync(recipe){
      geometryOption.disabled=recipe.customPath.length<2;
      button.disabled=!!drawAuthoringLockReason(recipe);
      if(active){
        const locked=recipe.lockedSettings.includes('extendDrawnPath');
        if(locked&&extend.checked!==recipe.extendDrawnPath){
          // A newly locked setting is authoritative even during an open
          // draft. Keep the preview and disabled checkbox aligned with what
          // Apply is actually allowed to preserve.
          extend.checked=recipe.extendDrawnPath;
          draw(visiblePoints());
        }
        extend.disabled=locked;
      }
      if(active&&button.disabled){stop();return;}
      if(active&&!applying&&editingSavedPath&&
        !savedDrawSourceMatches(savedSourcePath,recipe)){
        // Source geometry was replaced by Undo/import/history during editing.
        // A stale provisional curve must not overwrite the newly loaded one.
        stop();
        onNotice('Saved path changed while editing. Reopen Draw to edit the restored path.');
        return;
      }
      if(active&&!editing&&raw.length===0&&ready.length===0){
        // Undo, import, or another source-driven recipe transition can change
        // which path is actually visible while this optional overlay is open.
        // Refresh its source identity rather than presenting dormant geometry.
        showingSavedPath=activeSavedDrawnPath(recipe);
        syncPointControls();
        draw(visiblePoints());
      }
    },
    close:stop,
  };
}
