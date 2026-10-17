import {finishDrawnPath} from './drawn-path.js';

// A temporary transparent overlay captures one physical pointer stroke.
// Only the committed, normalized finished path becomes part of the recipe.
export function installDrawTool({getRecipe,onApply,onNotice}){
  const button=document.getElementById('drawPathToggle');
  const panel=document.getElementById('drawPathPanel');
  const overlay=document.getElementById('drawOverlay');
  const hint=document.getElementById('drawPathHint');
  const apply=document.getElementById('drawApply');
  const smooth=document.getElementById('drawSmooth');
  const geometric=document.getElementById('drawGeometric');
  const again=document.getElementById('drawAgain');
  const cancel=document.getElementById('drawCancel');
  const geometryOption=document.querySelector('[name=geometry] option[value=drawn]');
  const ctx=overlay.getContext('2d');
  let active=false,pointer=null,raw=[],ready=[],fit='smooth';

  function draw(points){
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,overlay.width,overlay.height);
    if(points.length<2)return;
    ctx.lineJoin='round';ctx.lineCap='round';
    for(const [colour,width] of [['#11131b',10],['#fff4a8',5]]){
      ctx.strokeStyle=colour;ctx.lineWidth=width;
      ctx.beginPath();
      points.forEach(([x,y],i)=>{
        if(!i)ctx.moveTo(x*overlay.width,y*overlay.height);
        else ctx.lineTo(x*overlay.width,y*overlay.height);
      });
      ctx.stroke();
    }
  }
  function setFit(mode){
    fit=mode;
    smooth.setAttribute('aria-pressed',String(fit==='smooth'));
    geometric.setAttribute('aria-pressed',String(fit==='geometric'));
    if(raw.length>=2){
      ready=finishDrawnPath(raw,fit);
      apply.disabled=ready.length<2;
      if(ready.length>=2){
        draw(ready);
        hint.textContent=fit==='geometric'?
          'Straightened and rounded. Use this path or redraw.':
          'Smoothed. Use this path or redraw.';
      }
    }
  }
  function reset(){
    pointer=null;raw=[];ready=[];
    apply.disabled=true;draw([]);
    hint.textContent='Draw one continuous line across the wallpaper.';
  }
  function stop(){
    active=false;reset();overlay.hidden=true;panel.hidden=true;
    button.setAttribute('aria-pressed','false');
    document.body.classList.remove('path-drawing');
  }
  function start(){
    if(getRecipe().lockedSettings.includes('geometry')){
      onNotice('Unlock Path geometry before drawing a new path.');
      return;
    }
    // The stage is not editable behind an open phone settings drawer.
    if(document.body.classList.contains('mobile-edit-open'))
      document.getElementById('mobileDismissHandle').click();
    active=true;reset();setFit('smooth');
    overlay.hidden=false;panel.hidden=false;
    button.setAttribute('aria-pressed','true');
    document.body.classList.add('path-drawing');
  }
  const position=event=>{
    // getBoundingClientRect includes the preview-only zoom, CSS scaling,
    // framing and page position. No assumption about device pixel ratio.
    const rect=overlay.getBoundingClientRect();
    return [Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)),
      Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height))];
  };
  function append(event){
    for(const sample of event.getCoalescedEvents?.()||[event]){
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
    pointer=event.pointerId;raw=[];ready=[];apply.disabled=true;
    append(event);
    try{overlay.setPointerCapture(event.pointerId);}catch{}
    hint.textContent='Keep drawing. Lift your finger to finish.';
  });
  overlay.addEventListener('pointermove',event=>{
    if(pointer!==event.pointerId)return;
    event.preventDefault();event.stopPropagation();append(event);
  });
  overlay.addEventListener('pointerup',event=>{
    if(pointer!==event.pointerId)return;
    event.preventDefault();event.stopPropagation();append(event);
    pointer=null;
    try{overlay.releasePointerCapture(event.pointerId);}catch{}
    setFit(fit);
    if(ready.length<2)hint.textContent='That was too short. Draw a longer path.';
  });
  overlay.addEventListener('pointercancel',event=>{
    if(pointer!==event.pointerId)return;
    event.preventDefault();reset();
    hint.textContent='Stroke interrupted. Draw again.';
  });
  overlay.addEventListener('click',event=>{if(active){event.preventDefault();event.stopPropagation();}});
  button.addEventListener('click',()=>active?stop():start());
  smooth.addEventListener('click',()=>setFit('smooth'));
  geometric.addEventListener('click',()=>setFit('geometric'));
  again.addEventListener('click',reset);
  cancel.addEventListener('click',stop);
  apply.addEventListener('click',()=>{
    if(!active||ready.length<2)return;
    onApply(ready);
    stop();
  });
  document.addEventListener('keydown',event=>{
    if(active&&event.key==='Escape'){event.preventDefault();stop();}
  });
  return {
    sync(recipe){
      geometryOption.disabled=recipe.customPath.length<2;
      button.disabled=recipe.lockedSettings.includes('geometry');
      if(active&&button.disabled)stop();
    },
    close:stop,
  };
}
