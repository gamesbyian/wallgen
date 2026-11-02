// One touch-first angle inspector for the app's ORIGINAL canonical form fields.
// Geometry is separate; app.js owns preview, commits, Undo and model normalization.
import {ROTATION_FIELD_SPECS,canonicalAngle,
  beginRotationDrag,advanceRotationDrag,ROTATION_SCRUB_INTENT_CSS_PX,
  rotationKeyboardTarget} from './rotation-gesture.js';
import {parseAngleExpression} from './precision-angle-expression.js';

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
  pad.setAttribute('aria-label','Rotation angle. Drag horizontally or use arrow keys to adjust.'); 
  pad.setAttribute('aria-description',
    'Shift and arrow keys use the finest available step. Page Up and Down change by 10 degrees. Home and End go to the allowed limits. Drag vertically to change sensitivity.');
  const padLabel=create('span',null,'← Drag to rotate →');
  pad.append(padLabel);
  const hint=create('p','rotation-scrub-hint');
  const speedStatus=create('strong','rotation-scrub-speed','Normal · 0.45°/px');
  speedStatus.setAttribute('role','status');
  speedStatus.setAttribute('aria-live','polite');
  hint.append(speedStatus,create('span',null,
    'Drag down for fine movement · up for fast movement'));
  const settings=create('div','rotation-scrub-settings');
  const snapLabel=create('label','rotation-scrub-snap-label','Snap');
  const snap=create('select','rotation-scrub-snap');
  for(const [value,label] of [['0','Free'],['45','45°'],['15','15°'],['10','10°']]){
    const option=create('option',null,label);option.value=value;snap.append(option);
  }
  snap.value='45';
  snapLabel.append(snap);
  const entryLabel=create('label','rotation-scrub-entry-label','Exact angle');
  const entry=create('input','rotation-scrub-entry');
  entry.type='text';entry.inputMode='text';entry.autocomplete='off';entry.spellcheck=false;
  entry.placeholder='45°, +=15, 45+15';
  entry.title='Exact degrees, or relative +=15, -=15, *=2, /=2; simple arithmetic such as 45+15';
  entry.setAttribute('aria-description',entry.title);
  entryLabel.append(entry);
  settings.append(snapLabel,entryLabel);
  const buttons=create('div','rotation-scrub-actions');
  const minus90=create('button',null,'−90°');
  const minus=create('button',null,'−1°');
  const plus=create('button',null,'+1°');
  const plus90=create('button',null,'+90°');
  for(const b of [minus90,minus,plus,plus90])b.type='button';
  buttons.append(minus90,minus,plus,plus90);
  const presets=create('div','rotation-scrub-presets');
  panel.append(header,readout,pad,hint,settings,buttons,presets);
  shade.append(panel);document.body.append(shade);

  let active=null,gesture=null,raf=0,pending=null,previewed=false;
  const read=()=>Number(active?.field?.value);
  const isAvailable=field=>!!field&&!field.disabled&&field.dataset.inactive!=='true';
  const names=Object.freeze({
    textureRotation:'Texture layer 1',
    textureRotation2:'Texture layer 2',
    textureRotation3:'Texture layer 3',
    diagonalRotation:'Diagonal orientation',
    rayRotation:'Ray orientation',
    rayTwist:'Ray twist',
    hairpinAngle:'Hairpin turn',
    loopSweep:'Loop sweep',
    textRotation:'Selected text object',
    textShadowAngle:'Selected text shadow',
    embroideryDirection:'Region stitches',
  });
  const name=key=>names[key]||key;
  const fmt=(value,spec)=>Number(value).toFixed(spec.step<1?1:0)+'°';
  function syncReadout(value,forceInput=false){
    if(!active)return;
    const spec=active.spec;
    const n=canonicalAngle(value,spec);
    readout.textContent=fmt(n,spec);
    // App/worker sync must not erase a partially typed expression.
    if(forceInput||document.activeElement!==entry)entry.value=String(n);
    pad.setAttribute('aria-valuemin',String(spec.min));
    pad.setAttribute('aria-valuemax',String(spec.wrap?spec.max-spec.step:spec.max));
    pad.setAttribute('aria-valuenow',String(n));
    pad.setAttribute('aria-valuetext',fmt(n,spec));
    // The gesture mode lives on its pure state, not the pointer owner.
    // Update the visible/accessible feedback only on mode changes, avoiding
    // per-frame status announcements and unrelated render work.
    const mode=gesture?.state?.mode||'normal';
    if(hint.dataset.speed!==mode){
      hint.dataset.speed=mode;
      speedStatus.textContent={
        fine:'Fine · 0.04°/px',normal:'Normal · 0.45°/px',
        fast:'Fast · 1.6°/px'
      }[mode];
    }
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
    if(cancel){
      if(raf){cancelAnimationFrame(raf);raf=0;}
      pending=null;
    }else flush();
    const value=canonicalAngle(gesture.state.value,active.spec);
    const before=gesture.before;
    const hasPreview=previewed;
    const pointerId=gesture.pointerId;
    gesture=null;previewed=false;
    try{pad.releasePointerCapture(pointerId);}catch{}
    if(cancel||value===before){
      onCancel(active.field);
      syncReadout(read());
      return;
    }
    onCommit(active.field,value);
    syncReadout(read());
  }
  function focusAfterClose(trigger){
    // ARIA dialog guidance: return focus to its invoker if still visible,
    // otherwise choose the next meaningful control in the current workflow.
    // Tool/category changes can hide the invoker without removing its node.
    const visible=element=>element&&element.isConnected&&!element.disabled&&
      !element.hidden&&element.getClientRects().length>0&&
      !element.closest('[hidden],[inert],[aria-hidden="true"]');
    const candidates=[trigger];
    if(document.body.classList.contains('mobile-studio'))
      candidates.push(document.getElementById('mobileEdit'));
    candidates.push(
      document.querySelector('.editor-tool-chooser [data-editor-tool][aria-pressed="true"]'),
      document.querySelector('.settings-tab[aria-selected="true"]'));
    const destination=candidates.find(visible);
    destination?.focus({preventScroll:true});
  }
  function close(){
    if(!active)return;
    if(gesture)finishPointer({cancel:true});
    if(raf){cancelAnimationFrame(raf);raf=0;}pending=null;
    const focus=active.trigger;
    active=null;shade.hidden=true;
    focusAfterClose(focus);
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
    active={field,trigger,spec,
      category:document.querySelector('.settings-tab[aria-selected="true"]')?.dataset.tab,
      tool:document.querySelector('.editor-tool-chooser [data-editor-tool][aria-pressed="true"]')?.dataset.editorTool
    };
    shade.hidden=false;
    heading.textContent='Rotate · '+name(field.name);
    entry.removeAttribute('aria-invalid');
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
    // If another finger enters the scrub surface, the original gesture
    // becomes ambiguous. Roll back rather than committing a stray angle.
    if(gesture&&event.pointerType==='touch'&&event.pointerId!==gesture.pointerId){
      finishPointer({cancel:true});return;
    }
    if(!active||gesture||!isAvailable(active.field)||event.button!==0||event.isPrimary===false)return;
    if(onBegin(active.field)===false)return;
    event.preventDefault();
    gesture={pointerId:event.pointerId,before:read(),
      state:beginRotationDrag({value:read(),x:event.clientX,y:event.clientY,
        snap:Number(snap.value),intent:ROTATION_SCRUB_INTENT_CSS_PX})};
    previewed=false;
    try{pad.setPointerCapture(event.pointerId);}catch{}
  });
  pad.addEventListener('pointermove',event=>{
    if(!gesture||event.pointerId!==gesture.pointerId)return;
    event.preventDefault();
    gesture.state=advanceRotationDrag(gesture.state,{x:event.clientX,y:event.clientY});
    if(!active.spec.wrap){
      // Avoid latent overshoot: reversing at a bounded sweep or turn limit
      // must immediately move the control back inside the legal interval.
      gesture.state.raw=Math.max(active.spec.min,
        Math.min(active.spec.max,gesture.state.raw));
      gesture.state.value=Math.max(active.spec.min,
        Math.min(active.spec.max,gesture.state.value));
    }
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
  pad.addEventListener('lostpointercapture',event=>{
    // A delayed loss belonging to an old pointer must not cancel the new one.
    if(gesture&&gesture.pointerId===event.pointerId)
      finishPointer({cancel:true});
  });
  const cancelTransient=()=>{if(gesture)finishPointer({cancel:true});};
  for(const type of ['blur','pagehide','resize'])
    window.addEventListener(type,cancelTransient);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)cancelTransient();
  });
  pad.addEventListener('keydown',event=>{
    if(!active||gesture)return;
    const target=rotationKeyboardTarget(read(),active.spec,event);
    if(target===null)return;
    event.preventDefault();
    apply(target);
  });
  entry.addEventListener('input',()=>entry.removeAttribute('aria-invalid'));
  entry.addEventListener('change',()=>{
    if(!active)return;
    const target=parseAngleExpression(entry.value,read());
    if(target===null){
      // Invalid input neither silently changes the current angle nor creates
      // an Undo snapshot. Keep the expression visible for correction.
      entry.setAttribute('aria-invalid','true');return;
    }
    entry.removeAttribute('aria-invalid');
    apply(target);syncReadout(read(),true);
  });
  minus90.addEventListener('click',()=>apply(read()-90));
  minus.addEventListener('click',()=>apply(read()-1));
  plus.addEventListener('click',()=>apply(read()+1));
  plus90.addEventListener('click',()=>apply(read()+90));
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
    launch.setAttribute('aria-label','Open precise angle adjustment for '+name(key));
    launch.setAttribute('aria-haspopup','dialog');
    launch.addEventListener('click',()=>open(field,launch));
    host.append(launch);
    triggers.push({field,launch});
  }
  function sync(){
    for(const {field,launch} of triggers){
      launch.disabled=!isAvailable(field);
      const spec=ROTATION_FIELD_SPECS[field.name];
      const action=['hairpinAngle','loopSweep'].includes(field.name)?'Angle':'Rotate';
      launch.textContent=action+' '+fmt(Number(field.value),spec);
    }
    if(active&&!isAvailable(active.field))close();
    else if(active&&!gesture)syncReadout(read());
  }
  document.addEventListener('roygbiv-controls-synced',sync);
  // The editor re-emits its selection on every recipe sync, even when it is
  // the SAME tool. Never cancel pointer capture on those redundant events.
  document.addEventListener('editor-tool-changed',event=>{
    if(!active)return;
    if(event.detail?.category!==active.category||event.detail?.tool!==active.tool)
      close();
  });
  sync();
  return {close,sync,
    openExternal:(field,trigger)=>open(field,trigger),
    get active(){return Boolean(active);}};
}
