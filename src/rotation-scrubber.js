// One touch-first angle inspector for the app's ORIGINAL canonical form fields.
// Geometry is separate; app.js owns preview, commits, Undo and model normalization.
import {ROTATION_FIELD_SPECS,canonicalAngle,
  beginRotationDrag,advanceRotationDrag} from './rotation-gesture.js';

export function installRotationScrubbers({form,onBegin,onPreview,onCommit,onCancel}){
  if(!form||![onBegin,onPreview,onCommit,onCancel].every(x=>typeof x==='function'))
    throw new TypeError('Rotation scrubber requires source controls and transactions');
  const create=(tag,cls,text)=>{
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    if(text!==undefined)node.textContent=text;
    return node;
  };
  const shade=create('div','rotation-scrub-shade');
  shade.hidden=true;
  const panel=create('section','rotation-scrub-panel');
  panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
  panel.setAttribute('aria-label','Precision rotation');
  const header=create('div','rotation-scrub-header');
  const heading=create('strong',null,'Precision rotation');
  const done=create('button','rotation-scrub-close','Done');done.type='button';
  header.append(heading,done);
  const readout=create('output','rotation-scrub-readout','0.0°');
  readout.setAttribute('aria-live','off');
  const pad=create('div','rotation-scrub-pad');
  pad.setAttribute('role','slider');pad.tabIndex=0;
  pad.setAttribute('aria-label','Drag horizontally to adjust angle; drag vertically to change sensitivity');
  const padLabel=create('span',null,'← Drag to rotate →');
  pad.append(padLabel);
  const hint=create('p','rotation-scrub-hint',
    'Down: fine (0.04°/px) · Level: normal (0.45°/px) · Up: fast (1.6°/px)');
  const settings=create('div','rotation-scrub-settings');
  const snapLabel=create('label','rotation-scrub-snap-label','Snap');
  const snap=create('select','rotation-scrub-snap');
  for(const [value,label] of [['0','Free'],['45','45°'],['15','15°']]){
    const option=create('option',null,label);option.value=value;snap.append(option);
  }
  snap.value='45';
  snapLabel.append(snap);
  const entryLabel=create('label','rotation-scrub-entry-label','Exact angle');
  const entry=create('input','rotation-scrub-entry');
  entry.type='number';entry.step='0.1';entry.inputMode='decimal';
  entryLabel.append(entry);
  settings.append(snapLabel,entryLabel);
  const buttons=create('div','rotation-scrub-actions');
  const minus=create('button',null,'−1°');
  const plus=create('button',null,'+1°');
  minus.type=plus.type='button';buttons.append(minus,plus);
  const presets=create('div','rotation-scrub-presets');
  panel.append(header,readout,pad,hint,settings,buttons,presets);
  shade.append(panel);document.body.append(shade);

  let active=null,gesture=null,raf=0,pending=null,previewed=false;
  const read=()=>Number(active?.field?.value);
  const isAvailable=field=>!!field&&!field.disabled&&field.dataset.inactive!=='true';
  const name=key=>key.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/(\d)$/,' layer $1');
  const fmt=(value,spec)=>Number(value).toFixed(spec.step<1?1:0)+'°';
  function syncReadout(value){
    if(!active)return;
    const spec=active.spec;
    const n=canonicalAngle(value,spec);
    readout.textContent=fmt(n,spec);
    entry.value=String(n);
    pad.setAttribute('aria-valuemin',String(spec.min));
    pad.setAttribute('aria-valuemax',String(spec.wrap?spec.max-spec.step:spec.max));
    pad.setAttribute('aria-valuenow',String(n));
    pad.setAttribute('aria-valuetext',fmt(n,spec));
    hint.dataset.speed=gesture?.mode||'normal';
  }
  function flush(){
    if(raf){cancelAnimationFrame(raf);raf=0;}
    if(pending!==null&&active&&gesture){
      const value=pending;pending=null;
      onPreview(active.field,value);
      previewed=true;
    }else pending=null;
  }
  function schedule(value){
    pending=value;
    if(raf)return;
    raf=requestAnimationFrame(()=>{
      raf=0;if(!active||!gesture){pending=null;return;}
      const next=pending;pending=null;
      if(next!==null){onPreview(active.field,next);previewed=true;}
    });
  }
  function finishPointer({cancel=false}={}){
    if(!gesture||!active)return;
    flush();
    const value=canonicalAngle(gesture.state.value,active.spec);
    const before=gesture.before;
    const hasPreview=previewed;
    const pointerId=gesture.pointerId;
    gesture=null;previewed=false;
    try{pad.releasePointerCapture(pointerId);}catch{}
    if(cancel||value===before){
      if(hasPreview)onCancel(active.field);
      syncReadout(read());
      return;
    }
    onCommit(active.field,value);
    syncReadout(read());
  }
  function close(){
    if(!active)return;
    if(gesture)finishPointer({cancel:true});
    if(raf){cancelAnimationFrame(raf);raf=0;}pending=null;
    const focus=active.trigger;
    active=null;shade.hidden=true;
    focus?.focus({preventScroll:true});
  }
  function updatePresetButtons(){
    presets.replaceChildren();
    if(!active)return;
    const {spec}=active;
    const values=spec.wrap?[0,45,90,180,270]:
      spec.min>=240?[240,270,360,450]:
      spec.min>=60?[60,90,135,180]:[-180,-90,-45,0,45,90,180];
    for(const value of values.filter(n=>n>=spec.min&&n<=spec.max).slice(0,7)){
      const b=create('button',null,value+'°');b.type='button';
      b.addEventListener('click',()=>apply(value));
      presets.append(b);
    }
  }
  function open(field,trigger){
    if(!isAvailable(field))return;
    if(active)close();
    const spec=ROTATION_FIELD_SPECS[field.name];
    if(!spec)return;
    active={field,trigger,spec};
    shade.hidden=false;
    heading.textContent='Rotate · '+name(field.name);
    entry.min=String(spec.min);
    entry.max=String(spec.wrap?spec.max-spec.step:spec.max);
    entry.step=String(spec.step);
    syncReadout(read());
    updatePresetButtons();
    pad.focus({preventScroll:true});
  }
  function apply(raw){
    if(!active||gesture||!isAvailable(active.field)||!Number.isFinite(raw))return;
    const field=active.field;
    const target=canonicalAngle(raw,active.spec);
    if(target===read()){syncReadout(target);return;}
    if(onBegin(field)===false)return;
    onPreview(field,target);
    onCommit(field,target);
    syncReadout(read());
  }
  pad.addEventListener('pointerdown',event=>{
    if(!active||gesture||!isAvailable(active.field)||event.button!==0||event.isPrimary===false)return;
    if(onBegin(active.field)===false)return;
    event.preventDefault();
    gesture={pointerId:event.pointerId,before:read(),
      state:beginRotationDrag({value:read(),x:event.clientX,y:event.clientY,snap:Number(snap.value)})};
    previewed=false;
    try{pad.setPointerCapture(event.pointerId);}catch{}
  });
  pad.addEventListener('pointermove',event=>{
    if(!gesture||event.pointerId!==gesture.pointerId)return;
    event.preventDefault();
    gesture.state=advanceRotationDrag(gesture.state,{x:event.clientX,y:event.clientY});
    const value=canonicalAngle(gesture.state.value,active.spec);
    syncReadout(value);
    if(value!==read())schedule(value);
  });
  pad.addEventListener('pointerup',event=>{
    if(!gesture||gesture.pointerId!==event.pointerId)return;
    event.preventDefault();finishPointer();
  });
  pad.addEventListener('pointercancel',event=>{
    if(gesture&&gesture.pointerId===event.pointerId)finishPointer({cancel:true});
  });
  pad.addEventListener('lostpointercapture',()=>{
    if(gesture)finishPointer({cancel:true});
  });
  pad.addEventListener('keydown',event=>{
    const delta=event.key==='ArrowLeft'||event.key==='ArrowDown'?-1:
      event.key==='ArrowRight'||event.key==='ArrowUp'?1:0;
    if(!delta||!active)return;
    event.preventDefault();
    apply(read()+delta*(event.shiftKey?.1:1));
  });
  entry.addEventListener('change',()=>{
    if(!active)return;
    if(entry.value.trim()===''||!Number.isFinite(Number(entry.value))){
      syncReadout(read());return;
    }
    apply(Number(entry.value));
  });
  minus.addEventListener('click',()=>apply(read()-1));
  plus.addEventListener('click',()=>apply(read()+1));
  done.addEventListener('click',close);
  shade.addEventListener('pointerdown',event=>{if(event.target===shade)close();});
  panel.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();return;}
    if(event.key!=='Tab')return;
    const controls=[...panel.querySelectorAll('button,input,select,[tabindex="0"]')]
      .filter(x=>!x.disabled&&!x.hidden);
    if(!controls.length)return;
    const i=controls.indexOf(document.activeElement);
    if(event.shiftKey&&i<=0){event.preventDefault();controls.at(-1).focus();}
    else if(!event.shiftKey&&i===controls.length-1){event.preventDefault();controls[0].focus();}
  });

  const triggers=[];
  for(const [key,spec] of Object.entries(ROTATION_FIELD_SPECS)){
    const field=form.elements.namedItem(key);
    if(!field||!field.matches('input'))continue;
    const host=field.closest('.texture-rotation-field')||field.closest('.lockable-setting');
    if(!host)continue;
    const launch=create('button','rotation-precision-launch','Rotate');
    launch.type='button';launch.dataset.rotationPrecision=key;
    launch.setAttribute('aria-label','Open precise rotation for '+name(key));
    launch.setAttribute('aria-haspopup','dialog');
    launch.addEventListener('click',()=>open(field,launch));
    host.append(launch);
    triggers.push({field,launch});
  }
  function sync(){
    for(const {field,launch} of triggers)launch.disabled=!isAvailable(field);
    if(active&&!isAvailable(active.field))close();
    else if(active&&!gesture)syncReadout(read());
  }
  document.addEventListener('roygbiv-controls-synced',sync);
  document.addEventListener('editor-tool-changed',()=>{if(active)close();});
  sync();
  return {close,sync,get active(){return Boolean(active);}};
}
