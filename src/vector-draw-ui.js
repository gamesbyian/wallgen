// Touch-first editor for the CURRENT authoritative v3 vectorPath source.
// The sampled Draw editor remains for v2; this overlay edits cubic controls
// and returns one pure recipe change only when Use is chosen.
import {createVectorEditSession,selectVectorEditNode,beginVectorEdit,
  previewVectorEdit,commitVectorEdit,cancelVectorEdit,
  undoVectorEdit,redoVectorEdit} from './vector-path-edit-session.js';
import {hitVectorEditTarget,vectorNodeTargets} from './vector-node-hit.js';
import {beginAxisDrag,axisConstrainedPoint} from './axis-constrained-drag.js';
import {drawnPathViewportOffset} from './draw-path-ui.js';
import {VECTOR_PATH_MIN,VECTOR_PATH_MAX} from './vector-path-commands.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export function installVectorDrawEditor({getRecipe,onApply,onNotice,
  button,overlay,wallpaper}){
  if(!button||!overlay||!wallpaper||typeof getRecipe!=='function'||
     typeof onApply!=='function')throw Error('Vector editor requires original source and canvas');
  const ctx=overlay.getContext('2d'),studio=document.querySelector('.studio-stage');
  const toolbar=document.createElement('div');
  toolbar.className='vector-draw-tools';toolbar.hidden=true;
  toolbar.setAttribute('role','group');
  toolbar.setAttribute('aria-label','Vector path editing controls');
  const create=(tag,label,cls)=>{
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(label!==undefined)el.textContent=label;
    return el;
  };
  const controls=create('button','Show controls','vector-draw-toggle');
  const use=create('button','Use path','vector-draw-action');
  const cancel=create('button','Cancel','vector-draw-action');
  const undo=create('button','Undo','vector-draw-action');
  const redo=create('button','Redo','vector-draw-action');
  const insert=create('button','Insert node','vector-draw-action');
  const axis=create('button','Lock axis','vector-draw-action');
  const mode=create('select',undefined,'vector-draw-action');
  mode.setAttribute('aria-label','Selected Bézier node type or Delete selected node');
  mode.title='Set the selected node type or Delete node; deletion previews its local curve change and supports Undo';
  for(const [value,label] of [['independent','Independent'],
    ['corner','Corner'],['aligned','Aligned'],['mirrored','Mirrored'],
    ['delete','Delete node (Undo available)']]){
    const option=create('option',label);option.value=value;mode.append(option);
  }
  for(const el of [controls,use,cancel,undo,redo,insert,axis])el.type='button';
  controls.setAttribute('aria-expanded','false');
  insert.setAttribute('aria-pressed','false');
  axis.setAttribute('aria-pressed','false');
  toolbar.append(controls,undo,redo,insert,axis,mode,use,cancel);
  document.body.append(toolbar);
  let active=false,session=null,sourceKey=null,drag=null,insertMode=false,
    axisLock=false,applying=false,serial=0,overlapCycle=0;
  const sourceSignature=()=>JSON.stringify(getRecipe().vectorPath??null);
  function camera(){
    const recipe=getRecipe();
    const zoom=Number(studio?.dataset.viewZoom)||Number(recipe.viewZoom)||1;
    const image=wallpaper.getBoundingClientRect();
    const [ox,oy]=drawnPathViewportOffset(recipe,true);
    const project=p=>[
      image.left+(.5+(p[0]-.5)*zoom+ox)*image.width,
      image.top+(.5+(p[1]-.5)*zoom+oy)*image.height];
    const unproject=screen=>[
      clamp(.5+((screen[0]-image.left)/image.width-.5-ox)/zoom,
        VECTOR_PATH_MIN,VECTOR_PATH_MAX),
      clamp(.5+((screen[1]-image.top)/image.height-.5-oy)/zoom,
        VECTOR_PATH_MIN,VECTOR_PATH_MAX)];
    return {project,unproject};
  }
  function canvasPoint(project,p){
    const [x,y]=project(p),rect=overlay.getBoundingClientRect();
    return [(x-rect.left)*overlay.width/Math.max(rect.width,1),
      (y-rect.top)*overlay.height/Math.max(rect.height,1)];
  }
  function paint(){
    if(!active)return;
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,overlay.width,overlay.height);
    const path=session?.draft;if(!path)return;
    const {project}=camera(),p=p=>canvasPoint(project,p);
    const scale=overlay.width/Math.max(overlay.getBoundingClientRect().width,1);
    const first=p(path.start.point);
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();ctx.moveTo(...first);
    for(const seg of path.segments){
      if(seg.kind==='line')ctx.lineTo(...p(seg.to.point));
      else ctx.bezierCurveTo(...p(seg.controlOut),...p(seg.controlIn),...p(seg.to.point));
    }
    if(path.closed){
      const end=path.closing;
      if(end.kind==='line')ctx.lineTo(...first);
      else ctx.bezierCurveTo(...p(end.controlOut),...p(end.controlIn),...first);
    }
    ctx.strokeStyle='#081825';ctx.lineWidth=7*scale;ctx.stroke();
    ctx.strokeStyle='#c5f7ff';ctx.lineWidth=2.5*scale;ctx.stroke();
    const targets=vectorNodeTargets(path);
    const selected=targets.nodes.find(n=>n.id===session.selectedId);
    if(selected){
      const center=p(selected.point);
      for(const h of targets.handles.filter(h=>h.id===session.selectedId)){
        const pt=p(h.point);
        ctx.beginPath();ctx.moveTo(...center);ctx.lineTo(...pt);
        ctx.strokeStyle='#37c9ed';ctx.lineWidth=1.8*scale;ctx.stroke();
        ctx.beginPath();ctx.arc(pt[0],pt[1],4.5*scale,0,Math.PI*2);
        ctx.fillStyle='#bdefff';ctx.fill();ctx.strokeStyle='#102339';ctx.stroke();
      }
    }
    for(const n of targets.nodes){
      const [x,y]=p(n.point),sel=n.id===session.selectedId,r=(sel?6:4.5)*scale;
      ctx.beginPath();ctx.rect(x-r,y-r,2*r,2*r);
      ctx.fillStyle=sel?'#ffc45b':'#fff';ctx.fill();ctx.strokeStyle='#091e35';
      ctx.lineWidth=2*scale;ctx.stroke();
    }
    ctx.restore();
  }
  function sync(){
    if(!active)return;
    const path=session.path,id=session.selectedId;
    controls.textContent=toolbar.classList.contains('is-collapsed')?
      'Show controls':'Hide controls';
    controls.setAttribute('aria-expanded',
      String(!toolbar.classList.contains('is-collapsed')));
    undo.disabled=!session.undo.length||!!session.tx;
    redo.disabled=!session.redo.length||!!session.tx;
    const selected=path.start.id===id||path.segments.some(s=>s.to.id===id);
    mode.disabled=!selected||!!session.tx;
    mode.value=selected?path.nodeModes[id]||'independent':'independent';
    insert.setAttribute('aria-pressed',String(insertMode));
    axis.setAttribute('aria-pressed',String(axisLock));
    axis.textContent=axisLock?'Axis locked':'Lock axis';
    paint();
  }
  function close({focus=true}={}){
    if(!active)return;
    if(drag){session=cancelVectorEdit(session);drag=null;}
    active=false;session=null;sourceKey=null;insertMode=false;axisLock=false;
    toolbar.hidden=true;overlay.hidden=true;
    button.setAttribute('aria-pressed','false');
    document.body.classList.remove('path-drawing');
    ctx.clearRect(0,0,overlay.width,overlay.height);
    if(focus)button.focus({preventScroll:true});
  }
  function open(){
    if(active){close();return true;}
    const recipe=getRecipe();
    if(!recipe.vectorPath)return false;
    if(recipe.lockedSettings.includes('geometry')){
      onNotice('Unlock Path geometry before editing vector nodes.');return false;
    }
    session=createVectorEditSession(recipe.vectorPath);
    if(!session)return false;
    sourceKey=sourceSignature();active=true;drag=null;overlapCycle=0;
    toolbar.hidden=false;
    toolbar.classList.add('is-collapsed');
    overlay.hidden=false;button.setAttribute('aria-pressed','true');
    document.body.classList.add('path-drawing');
    overlay.setAttribute('aria-label',
      'True Bézier vector editor. Drag square nodes or selected tangent circles, or use arrow keys.');
    sync();
    return true;
  }
  const target=(pointer,cycle=0)=>hitVectorEditTarget(session.draft,pointer,{
    project:camera().project,selectedId:session.selectedId,cycle});
  const nodePoint=id=>{
    const n=vectorNodeTargets(session.path)?.nodes.find(n=>n.id===id);
    return n?.point;
  };
  const handlePoint=(id,side)=>vectorNodeTargets(session.path)?.handles
    .find(h=>h.id===id&&h.side===side)?.point;
  const uniqueId=()=>{
    const ids=new Set(vectorNodeTargets(session.path).nodes.map(n=>n.id));
    let id;
    do{id='vectorNode'+(++serial);}while(ids.has(id));
    return id;
  };
  overlay.addEventListener('pointerdown',event=>{
    if(!active||drag||event.button!==0||event.isPrimary===false)return;
    const at=[event.clientX,event.clientY];
    let hit=target(at);
    if(!hit)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(insertMode&&hit.kind==='segment'){
      const id=uniqueId(),started=beginVectorEdit(session,{
        kind:'insert',segmentIndex:hit.segmentIndex,newId:id});
      const edited=previewVectorEdit(started,{t:hit.t});
      if(edited!==started){session=commitVectorEdit(edited);insertMode=false;}
      sync();return;
    }
    if(hit.kind==='segment')return;
    if(hit.kind==='node'){
      const overlaps=hit.overlaps||[];
      // Repeated taps at a crowded position cycle authored identities.
      if(overlaps.length>1&&session.selectedId===hit.id)overlapCycle++;
      else overlapCycle=0;
      if(overlapCycle&&overlaps.length)hit=target(at,overlapCycle);
    }else overlapCycle=0;
    if(hit.kind==='node')session=selectVectorEditNode(session,hit.id);
    const origin=hit.kind==='node'?nodePoint(hit.id):
      handlePoint(hit.id,hit.side);
    if(!origin){sync();return;}
    const {unproject}=camera(),cursor=unproject(at);
    const offset=[origin[0]-cursor[0],origin[1]-cursor[1]];
    session=beginVectorEdit(session,{kind:hit.kind==='node'?'node':'handle',
      id:hit.id,side:hit.side});
    if(!session.tx){sync();return;}
    drag={pointerId:event.pointerId,kind:hit.kind,id:hit.id,side:hit.side,
      start:at,offset,
      axis:beginAxisDrag(at,origin,axisLock),moved:false};
    try{overlay.setPointerCapture(event.pointerId);}catch{}
    sync();
  },true);
  overlay.addEventListener('pointermove',event=>{
    if(!active||!drag||drag.pointerId!==event.pointerId)return;
    event.preventDefault();event.stopImmediatePropagation();
    const at=[event.clientX,event.clientY],m=distance(at,drag.start);
    if(m<4&&!drag.moved)return;
    drag.moved=true;
    const {unproject}=camera(),raw=unproject(at),candidate=[
      clamp(raw[0]+drag.offset[0],VECTOR_PATH_MIN,VECTOR_PATH_MAX),
      clamp(raw[1]+drag.offset[1],VECTOR_PATH_MIN,VECTOR_PATH_MAX)];
    const constrained=axisConstrainedPoint(drag.axis,at,candidate);
    drag.axis=constrained.state;
    session=previewVectorEdit(session,{point:constrained.point});
    sync();
  },true);
  const finish=(event,cancelled)=>{
    if(!active||!drag||drag.pointerId!==event.pointerId)return;
    event.preventDefault();event.stopImmediatePropagation();
    const current=drag;drag=null;
    try{overlay.releasePointerCapture(current.pointerId);}catch{}
    session=cancelled?cancelVectorEdit(session):commitVectorEdit(session);
    sync();
  };
  overlay.addEventListener('pointerup',e=>finish(e,false),true);
  overlay.addEventListener('pointercancel',e=>finish(e,true),true);
  overlay.addEventListener('lostpointercapture',e=>{
    if(active&&drag&&drag.pointerId===e.pointerId){
      session=cancelVectorEdit(session);drag=null;sync();
    }
  });
  controls.addEventListener('click',()=>{
    toolbar.classList.toggle('is-collapsed');sync();
  });
  undo.addEventListener('click',()=>{session=undoVectorEdit(session);sync();});
  redo.addEventListener('click',()=>{session=redoVectorEdit(session);sync();});
  insert.addEventListener('click',()=>{insertMode=!insertMode;sync();});
  axis.addEventListener('click',()=>{axisLock=!axisLock;sync();});
  function deleteSelectedNode(){
    if(!active||!session?.selectedId||session.tx)return;
    const started=beginVectorEdit(session,{kind:'delete',id:session.selectedId});
    const preview=previewVectorEdit(started);
    if(preview===started){
      session=cancelVectorEdit(started);
      onNotice('A path must retain at least two authored nodes.');
    }else{
      session=commitVectorEdit(preview);
      onNotice('Node removed. Review the changed curve before Use path, or Undo.');
    }
    sync();
  }
  mode.addEventListener('change',()=>{
    if(!active||!session.selectedId)return;
    if(mode.value==='delete'){deleteSelectedNode();return;}
    const start=beginVectorEdit(session,{kind:'mode',id:session.selectedId});
    const draft=previewVectorEdit(start,{mode:mode.value});
    if(draft===start){
      onNotice('This node cannot use that tangent mode without two cubic handles.');
      session=cancelVectorEdit(start);
    }else session=commitVectorEdit(draft);
    sync();
  });
  cancel.addEventListener('click',()=>close());
  use.addEventListener('click',()=>{
    if(!active||drag)return;
    if(sourceSignature()!==sourceKey){
      close();onNotice('Vector source changed during editing; reopen it to avoid overwriting.');
      return;
    }
    applying=true;
    const path=session.path;
    try{onApply(path);close();}finally{applying=false;}
  });
  document.addEventListener('keydown',event=>{
    if(!active||event.target?.closest?.('input,select,textarea'))return;
    if(event.key==='Escape'){
      event.preventDefault();close();return;
    }
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){
      event.preventDefault();session=event.shiftKey?
        redoVectorEdit(session):undoVectorEdit(session);sync();return;
    }
    if((event.key==='Delete'||event.key==='Backspace')&&session.selectedId){
      event.preventDefault();deleteSelectedNode();return;
    }
    if(!session.selectedId||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))
      return;
    event.preventDefault();
    const prev=nodePoint(session.selectedId);if(!prev)return;
    const count=event.shiftKey?10:1;
    const x=prev[0]+(event.key==='ArrowLeft'?-count/600:
      event.key==='ArrowRight'?count/600:0);
    const y=prev[1]+(event.key==='ArrowUp'?-count/1300:
      event.key==='ArrowDown'?count/1300:0);
    const tx=beginVectorEdit(session,{kind:'node',id:session.selectedId});
    session=commitVectorEdit(previewVectorEdit(tx,{point:[
      clamp(x,VECTOR_PATH_MIN,VECTOR_PATH_MAX),
      clamp(y,VECTOR_PATH_MIN,VECTOR_PATH_MAX)]}));
    sync();
  });
  window.addEventListener('resize',()=>{if(active)sync();});
  studio?.addEventListener('roygbiv-view-zoom-updated',()=>{if(active)sync();});
  overlay.parentElement?.addEventListener('roygbiv-preview-zoom',()=>{
    if(active)sync();
  });
  return {open,close,
    sync(recipe){
      if(!active)return;
      if(recipe?.vectorPath&&sourceSignature()===sourceKey&&!recipe.lockedSettings.includes('geometry'))
        {sync();return;}
      if(!applying){close({focus:false});onNotice('Vector editing closed after the source changed or was locked.');}
    },
    get active(){return active;}};
}
