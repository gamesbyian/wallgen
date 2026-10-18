import {finishDrawnPath,DRAW_COORD_MIN,DRAW_COORD_MAX} from './drawn-path.js?v=20261018-intent10';
import {createPointEditor,clonePointEditor,addPointAnchor,deletePointAnchor,
  movePointAnchor,movePointHandle,pointHandles,resmoothPointEdits,
  savedPointAnchors,savedPointCorners} from './path-point-editor.js';

// The freehand overlay is also the optional point editor: one shared camera,
// one source of path geometry and one save/undo transaction.
export function installDrawTool({getRecipe,onApply,onNotice}){
  const byId=id=>document.getElementById(id);
  const button=byId('drawPathToggle'),panel=byId('drawPathPanel');
  const overlay=byId('drawOverlay'),wallpaper=byId('preview');
  const hint=byId('drawPathHint'),apply=byId('drawApply');
  const smooth=byId('drawSmooth'),geometric=byId('drawGeometric');
  const again=byId('drawAgain'),cancel=byId('drawCancel');
  const power=byId('drawSmoothingStrength'),powerLabel=byId('drawSmoothingValue');
  const editButton=byId('drawEditPoints'),addButton=byId('drawAddPoint');
  const deleteButton=byId('drawDeletePoint'),cornerButton=byId('drawCornerPoint');
  const reSmooth=byId('drawResmoothPoints'),pointUndo=byId('drawUndoPoint');
  const geometryOption=document.querySelector('[name=geometry] option[value=drawn]');
  const ctx=overlay.getContext('2d');
  let active=false,pointer=null,raw=[],ready=[],fit='smooth',editing=false;
  let editor=null,pendingPins=[],pendingCorners=[],adding=false,drag=null,history=[];

  // Convert between the design's normalized coordinates and the full stage,
  // whose preview may be zoomed and letterboxed inside the editing overlay.
  function stageMapping(){
    const stage=overlay.getBoundingClientRect(),image=wallpaper.getBoundingClientRect();
    const zoom=Number(document.querySelector('.studio-stage').dataset.viewZoom)||1;
    return {
      x:x=>(image.left+(.5+(x-.5)*zoom)*image.width-stage.left)*overlay.width/stage.width,
      y:y=>(image.top+(.5+(y-.5)*zoom)*image.height-stage.top)*overlay.height/stage.height,
      scale:overlay.width/Math.max(stage.width,1)
    };
  }
  function position(event){
    const rect=wallpaper.getBoundingClientRect();
    const zoom=Number(document.querySelector('.studio-stage').dataset.viewZoom)||1;
    return [
      Math.max(DRAW_COORD_MIN,Math.min(DRAW_COORD_MAX,
        .5+((event.clientX-rect.left)/rect.width-.5)/zoom)),
      Math.max(DRAW_COORD_MIN,Math.min(DRAW_COORD_MAX,
        .5+((event.clientY-rect.top)/rect.height-.5)/zoom))
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
      for(const side of ['in','out']){
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
    editButton.hidden=!active||(!editing&&ready.length<2&&getRecipe().customPath.length<2);
    editButton.setAttribute('aria-pressed',String(editing));
    editButton.textContent=editing?'Hide points':'Edit points';
    const available=editing&&editor?.selected!==-1;
    addButton.hidden=deleteButton.hidden=cornerButton.hidden=reSmooth.hidden=pointUndo.hidden=!editing;
    addButton.setAttribute('aria-pressed',String(adding));
    deleteButton.disabled=!available||editor.selected===0||editor.selected===editor.points.length-1;
    cornerButton.disabled=!available;
    cornerButton.textContent=available&&editor.corners.has(editor.selected)?'Make smooth':'Make corner';
    reSmooth.disabled=!available;
    pointUndo.disabled=history.length===0;
    pointUndo.parentElement.hidden=!editing;
    smooth.disabled=geometric.disabled=editing;
    apply.disabled=(editing?editor?.points.length:ready.length)<2;
  }
  function setFit(mode){
    fit=mode;
    smooth.setAttribute('aria-pressed',String(fit==='smooth'));
    geometric.setAttribute('aria-pressed',String(fit==='geometric'));
    if(editing)return;
    if(raw.length>=2){
      ready=finishDrawnPath(raw,fit,Number(power.value));
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
    pointer=null;drag=null;raw=[];ready=[];pendingPins=[];pendingCorners=[];
    editor=null;editing=false;adding=false;history=[];
    draw([]);syncPointControls();
    hint.textContent='Draw anywhere on the preview, including beyond the frame.';
  }
  function stop(){
    active=false;reset();overlay.hidden=true;panel.hidden=true;
    button.setAttribute('aria-pressed','false');
    document.body.classList.remove('path-drawing');
  }
  function start(){
    if(getRecipe().lockedSettings.includes('geometry')){
      onNotice('Unlock Path geometry before drawing or editing a path.');
      return;
    }
    if(document.body.classList.contains('mobile-edit-open'))
      byId('mobileDismissHandle').click();
    active=true;reset();setFit('smooth');
    overlay.hidden=false;panel.hidden=false;
    button.setAttribute('aria-pressed','true');
    document.body.classList.add('path-drawing');
    if(getRecipe().geometry==='drawn'&&getRecipe().customPath.length>1){
      hint.textContent='Draw a replacement, or tap Edit points to refine this path.';
      draw(getRecipe().customPath);
    }
    syncPointControls();
  }
  function editPoints(){
    if(!editing){
      const existing=ready.length>=2?ready:
        getRecipe().geometry==='drawn'?getRecipe().customPath:[];
      if(existing.length<2)return;
      const pins=ready.length>=2?pendingPins:getRecipe().drawnAnchors;
      const corners=ready.length>=2?pendingCorners:getRecipe().drawnCorners;
      editor=createPointEditor(existing,pins,corners);
      if(!editor)return;
      ready=editor.points.slice();editing=true;adding=false;history=[];
      overlay.focus({preventScroll:true});
      hint.textContent='Drag squares or tangent handles. Add a point if needed.';
    }else{
      ready=editor.points.map(p=>p.slice());
      pendingPins=savedPointAnchors(editor);
      pendingCorners=savedPointCorners(editor);
      // No longer re-run the original raw stroke after manual corrections.
      // Hiding anchors keeps the edited geometry authoritative until redraw.
      raw=[];
      editing=false;editor=null;adding=false;history=[];
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
      const handles=pointHandles(editor,editor.selected);
      for(const side of ['in','out']){
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
        const d=distance(mouse,project(m,editor.points[i]));
        if(d<least){least=d;best={type:'add',index:i};}
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
      if(hit.type==='add'){
        pushUndo();
        if(!addPointAnchor(editor,hit.index))history.pop();
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
    pointer=event.pointerId;raw=[];ready=[];pendingPins=[];pendingCorners=[];apply.disabled=true;
    append(event);
    try{overlay.setPointerCapture(pointer);}catch{}
    hint.textContent='Keep drawing. Lift your finger to finish.';
  });
  overlay.addEventListener('pointermove',event=>{
    if(pointer!==event.pointerId)return;
    event.preventDefault();event.stopPropagation();
    if(editing&&drag){
      const pos=position(event),to=[
        Math.max(DRAW_COORD_MIN,Math.min(DRAW_COORD_MAX,pos[0]+drag.offset[0])),
        Math.max(DRAW_COORD_MIN,Math.min(DRAW_COORD_MAX,pos[1]+drag.offset[1]))
      ];
      if(!drag.moved){pushUndo();drag.moved=true;}
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
    if(ready.length<2)hint.textContent='That was too short. Draw a longer path.';
  });
  overlay.addEventListener('pointercancel',event=>{
    if(pointer!==event.pointerId)return;
    event.preventDefault();pointer=null;
    if(editing&&drag){
      if(drag.moved){editor=drag.start;history.pop();}
      drag=null;draw(editor.points);syncPointControls();
    }else{reset();hint.textContent='Stroke interrupted. Draw again.';}
  });
  overlay.addEventListener('click',event=>{if(active){event.preventDefault();event.stopPropagation();}});
  button.addEventListener('click',()=>active?stop():start());
  window.addEventListener('resize',()=>{
    if(active)draw(editing?editor.points:ready.length?ready:raw);
  });
  overlay.parentElement.addEventListener('roygbiv-preview-zoom',()=>{
    if(active)draw(editing?editor.points:ready.length?ready:raw);
  });
  smooth.addEventListener('click',()=>setFit('smooth'));
  geometric.addEventListener('click',()=>setFit('geometric'));
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
    pushUndo();editor.changed.add(editor.selected);settle();
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
    onApply(points,pins,corners);
    stop();
  });
  document.addEventListener('keydown',event=>{
    if(!active)return;
    if(event.key==='Escape'){event.preventDefault();stop();return;}
    if(!editing||event.target?.closest?.('input,select,textarea'))return;
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){
      event.preventDefault();pointUndo.click();return;
    }
    if(editor.selected!==-1&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)){
      event.preventDefault();pushUndo();
      const p=editor.points[editor.selected].slice(),amount=event.shiftKey?10:1;
      if(event.key==='ArrowUp')p[1]-=amount/1300;
      if(event.key==='ArrowDown')p[1]+=amount/1300;
      if(event.key==='ArrowLeft')p[0]-=amount/600;
      if(event.key==='ArrowRight')p[0]+=amount/600;
      movePointAnchor(editor,editor.selected,p);settle();
    }else if(editor.selected!==-1&&['Delete','Backspace'].includes(event.key)){
      event.preventDefault();deleteButton.click();
    }
  });
  return {
    sync(recipe){
      geometryOption.disabled=recipe.customPath.length<2;
      button.disabled=recipe.lockedSettings.includes('geometry');
      if(active&&button.disabled)stop();
      if(active&&!editing&&raw.length===0&&ready.length===0)
        syncPointControls();
    },
    close:stop,
  };
}
