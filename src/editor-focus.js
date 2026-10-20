/** Optional, source-preserving, one-parameter-at-a-time adjustment surface.
 * Never owns recipe state. The canonical form controls stay in the DOM and
 * retain all lock, inactive, history, variation and export handlers.
 */
export function focusEligible(field){
  if(!field||field.tagName!=='INPUT'||field.type!=='range'||!field.name)return false;
  // Include disabled/inactive sliders as *explained* chips; only the shared
  // adjustment itself becomes disabled. Otherwise Focus silently omits state.
  return !field.closest('[hidden]');
}
export function adjustedValue(field,delta){
  const min=Number(field.min),max=Number(field.max),step=Number(field.step)||1;
  const next=Math.min(max,Math.max(min,Number(field.value)+delta*step));
  return String(Number((min+Math.round((next-min)/step)*step).toFixed(7)));
}
// Distinguish a recipe-disabled field from a user lock. Both remain visible
// and selectable in Focus, but the explanation must identify the actual gate.
export function focusUnavailableReason({inactive=false,locked=false,disabled=false}={}){
  if(locked)return 'This setting is locked. Open All controls to unlock it.';
  if(inactive)return 'This setting is inactive for the current design. Open All controls to change the settings that enable it.';
  if(disabled)return 'This setting is temporarily unavailable. Open All controls to inspect it.';
  return '';
}
export function focusChipDestination(key,index,count){
  if(!Number.isInteger(index)||!Number.isInteger(count)||count<1||index<0||index>=count)return -1;
  if(key==='ArrowRight')return (index+1)%count;
  if(key==='ArrowLeft')return (index+count-1)%count;
  if(key==='Home')return 0;
  if(key==='End')return count-1;
  return -1;
}
const create=(tag,className,text)=>{
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(text!==undefined)node.textContent=text;
  return node;
};
export function installFocusedAdjustments({form,chooser}){
  if(!form||!chooser)throw new TypeError('Real editor form and tool chooser required');
  const toggle=create('button','editor-focus-toggle','Focus');
  toggle.type='button';toggle.setAttribute('aria-pressed','false');
  toggle.setAttribute('aria-controls','editorFocusPanel');
  toggle.title='Optional single-slider Focus view; all existing controls remain available';
  toggle.setAttribute('aria-label','Open focused single-slider adjustment mode');
  chooser.prepend(toggle);

  const panel=create('section','editor-focus-panel');panel.id='editorFocusPanel';
  panel.hidden=true;panel.setAttribute('aria-label','Focused editor adjustment');
  const heading=create('div','editor-focus-heading');
  const title=create('strong',null,'Focus · one control at a time');
  const all=create('button','editor-focus-all','All controls');
  all.type='button';all.setAttribute('aria-label','Return to all editor controls');
  heading.append(title,all);
  const chips=create('div','editor-focus-chips');
  chips.setAttribute('role','group');chips.setAttribute('aria-label','Choose a parameter');
  const row=create('div','editor-focus-slider-row');
  const minus=create('button','editor-focus-step','−');
  minus.type='button';minus.setAttribute('aria-label','Decrease focused parameter');
  const slider=create('input','editor-focus-slider');slider.type='range';
  slider.setAttribute('aria-label','Focused parameter adjustment');
  const plus=create('button','editor-focus-step','+');
  plus.type='button';plus.setAttribute('aria-label','Increase focused parameter');
  const lock=create('button','editor-focus-lock');
  lock.type='button';lock.textContent='Lock';
  lock.setAttribute('aria-label','Lock focused parameter');
  lock.setAttribute('aria-pressed','false');
  const output=create('output','editor-focus-value');output.setAttribute('aria-live','off');
  // Keep + as the last button in DOM order: existing keyboard/browser
  // stepping semantics rely on that identity. CSS places Lock beside it.
  row.append(minus,slider,lock,plus,output);
  const help=create('p','editor-focus-help');
  help.setAttribute('role','status');help.setAttribute('aria-live','polite');
  panel.append(heading,chips,row,help);
  chooser.after(panel);

  const mobile=matchMedia('(max-width:790px)');
  let active=false,original=null,available=[];
  function sourceLabel(field){
    const explicit=field.closest('label')?.querySelector('span')?.textContent||
      field.closest('label')?.textContent;
    return (explicit?.trim().replace(/\s+/g,' ').slice(0,35)||
      field.name.replace(/([a-z])([A-Z])/g,'$1 $2')).trim();
  }
  function unavailableReason(field){
    return focusUnavailableReason({
      inactive:field.dataset.inactive==='true',
      locked:Boolean(field.closest('.lockable-setting')?.querySelector('.setting-lock.is-locked')),
      disabled:field.disabled
    });
  }
  function isInactive(field){return Boolean(unavailableReason(field));}
  function sync(){
    if(!active||!original)return;
    slider.min=original.min;slider.max=original.max;slider.step=original.step||'1';
    slider.value=original.value;
    const color=original.style.getPropertyValue('--roygbiv-slider-color');
    if(color)slider.style.setProperty('--roygbiv-slider-color',color);
    else slider.style.removeProperty('--roygbiv-slider-color');
    const disabled=isInactive(original);
    slider.disabled=disabled;minus.disabled=disabled;plus.disabled=disabled;
    // This secondary button delegates to the ORIGINAL setting lock. Inactive
    // settings stay locked out, while explicitly locked live settings can be
    // unlocked without abandoning Focus or inventing a new recipe mutation.
    const sourceLock=original.closest('.lockable-setting')?.querySelector('.setting-lock');
    const locked=sourceLock?.getAttribute('aria-pressed')==='true';
    lock.hidden=!sourceLock;
    lock.disabled=!sourceLock||sourceLock.disabled;
    lock.textContent=locked?'Unlock':'Lock';
    lock.setAttribute('aria-label',(locked?'Unlock ':'Lock ')+sourceLabel(original));
    lock.setAttribute('aria-pressed',String(locked));
    slider.setAttribute('aria-label',sourceLabel(original));
    output.textContent=String(original.value);
    help.textContent=disabled?unavailableReason(original):
      'Changes the original setting; all other values and locks remain unchanged.';
  }
  function choose(field){
    original=field;
    for(const chip of chips.querySelectorAll('button')){
      const selected=chip.dataset.focusKey===field.name;
      chip.setAttribute('aria-pressed',String(selected));
      chip.tabIndex=selected?0:-1;
    }
    sync();
  }
  // Focus parameter chips use one Tab stop. Arrow navigation stays within
  // the real sliders offered by the active tool, including disabled sources.
  chips.addEventListener('keydown',event=>{
    const current=event.target.closest('button[data-focus-key]');
    if(!current||!chips.contains(current))return;
    const all=[...chips.querySelectorAll('button[data-focus-key]')];
    const index=all.indexOf(current);
    if(index<0)return;
    const destination=focusChipDestination(event.key,index,all.length);
    if(destination<0)return;
    const next=all[destination];
    const source=available.find(field=>field.name===next.dataset.focusKey);
    if(!source)return;
    event.preventDefault();
    choose(source);
    next.focus({preventScroll:true});
    next.scrollIntoView({block:'nearest',inline:'nearest'});
  });
  function refresh(){
    if(!active)return;
    const card=document.querySelector('.editor-tool-card:not([hidden])');
    available=card?[...card.querySelectorAll('input[type=range][name]')].filter(focusEligible):[];
    const empty=available.length===0;
    form.classList.toggle('editor-focus-empty',empty);
    chips.hidden=empty;
    chips.replaceChildren();
    if(empty){
      original=null;row.hidden=true;help.textContent='This tool has no sliders. Choose All controls for its other settings.';
      return;
    }
    row.hidden=false;
    for(const field of available){
      const chip=create('button','editor-focus-chip',sourceLabel(field));
      chip.type='button';chip.dataset.focusKey=field.name;
      chip.addEventListener('click',()=>choose(field));
      chips.append(chip);
    }
    choose(available.includes(original)?original:available[0]);
  }
  function setActive(next,{responsive=false}={}){
    if(next&&!mobile.matches)return;
    // A desktop breakpoint change also occurs when Focus was never opened.
    // In that case there is no Focus destination to restore, and the source
    // must leave the user's existing keyboard focus alone.
    if(!next&&!active)return;
    const previousFocus=document.activeElement;
    const recoverKeyboard=responsive&&active&&(
      previousFocus===document.body||panel.contains(previousFocus)||previousFocus===toggle);
    const sourceForRestore=original;
    active=Boolean(next);
    form.classList.toggle('editor-focus-active',active);
    panel.hidden=!active;
    toggle.setAttribute('aria-pressed',String(active));
    toggle.setAttribute('aria-label',active?'Focused mode on. Return to All controls':'Open focused single-slider adjustment mode');
    if(active)refresh();
    else {
      original=null;
      form.classList.remove('editor-focus-empty');
      chips.hidden=false;
    }
    document.dispatchEvent(new CustomEvent('editor-focus-changed',{detail:{active}}));
    if(!active&&responsive&&recoverKeyboard){
      // The Focus toggle becomes display:none at 791px. Restore the original
      // enabled range control in the now-visible All inspector; if it is
      // inactive/locked, use the real selected tool rather than a dead slider.
      const target=sourceForRestore&&!sourceForRestore.disabled?sourceForRestore:
        chooser.querySelector('.editor-tool-tab[aria-pressed="true"]')||
        form.querySelector('.settings-tab[aria-selected="true"]');
      if(target?.isConnected){
        target.scrollIntoView({block:'nearest',inline:'nearest'});
        target.focus({preventScroll:true});
      }
    }else if(!active&&!responsive)toggle.focus({preventScroll:true});
  }
  toggle.addEventListener('click',()=>setActive(!active));
  all.addEventListener('click',()=>setActive(false));
  lock.addEventListener('click',()=>{
    if(!active||!original)return;
    const sourceLock=original.closest('.lockable-setting')?.querySelector('.setting-lock');
    if(sourceLock&&!sourceLock.disabled)sourceLock.click();
  });
  const apply=(next,commit)=>{
    if(!active||!original||isInactive(original))return;
    original.value=next;
    original.dispatchEvent(new Event('input',{bubbles:true}));
    if(commit)original.dispatchEvent(new Event('change',{bubbles:true}));
    sync();
  };
  slider.addEventListener('input',()=>apply(slider.value,false));
  slider.addEventListener('change',()=>apply(slider.value,true));
  for(const [button,direction] of [[minus,-1],[plus,1]])
    button.addEventListener('click',()=>apply(adjustedValue(original,direction),true));
  form.addEventListener('change',event=>{
    if(active&&event.target!==slider)queueMicrotask(sync);
  });
  // The regular form change event does not cover Undo, seed randomization,
  // imported recipes or lock changes. Those operations call changeRecipe()
  // which synchronizes the original controls and emits this source-state
  // notification. The Focus surface follows rather than caching old values.
  document.addEventListener('roygbiv-controls-synced',sync);
  document.addEventListener('editor-tool-changed',refresh);
  mobile.addEventListener('change',event=>{if(!event.matches)setActive(false,{responsive:true});});
  return {get active(){return active;},close:()=>setActive(false)};
}
