/** Optional, source-preserving, one-parameter-at-a-time adjustment surface.
 * Never owns recipe state. The canonical form controls stay in the DOM and
 * retain all lock, inactive, history, variation and export handlers.
 */
export function focusEligible(field){
  if(!field||field.tagName!=='INPUT'||field.type!=='range'||!field.name)return false;
  return !field.closest('[hidden]')&&!field.disabled;
}
export function adjustedValue(field,delta){
  const min=Number(field.min),max=Number(field.max),step=Number(field.step)||1;
  const next=Math.min(max,Math.max(min,Number(field.value)+delta*step));
  return String(Number((min+Math.round((next-min)/step)*step).toFixed(7)));
}
const create=(tag,className,text)=>{
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(text!==undefined)node.textContent=text;
  return node;
};
export function installFocusedAdjustments({form,chooser}){
  if(!form||!chooser)throw new TypeError('Real editor form and tool chooser required');
  const toggle=create('button','editor-tool-tab editor-focus-toggle','Focus');
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
  const output=create('output','editor-focus-value');output.setAttribute('aria-live','off');
  row.append(minus,slider,plus,output);
  const help=create('p','editor-focus-help');
  help.setAttribute('role','status');help.setAttribute('aria-live','polite');
  panel.append(heading,chips,row,help);
  chooser.after(panel);

  const mobile=matchMedia('(max-width:790px)');
  let active=false,original=null,available=[];
  function sourceLabel(field){
    const explicit=field.closest('label')?.querySelector('span')?.textContent||
      field.closest('label')?.textContent;
    return (explicit?.trim().replace(/\\s+/g,' ').slice(0,35)||
      field.name.replace(/([a-z])([A-Z])/g,'$1 $2')).trim();
  }
  function isInactive(field){
    return field.dataset.inactive==='true'||field.disabled||
      field.closest('.lockable-setting')?.querySelector('.setting-lock.is-locked')!==null;
  }
  function sync(){
    if(!active||!original)return;
    slider.min=original.min;slider.max=original.max;slider.step=original.step||'1';
    slider.value=original.value;
    const color=original.style.getPropertyValue('--roygbiv-slider-color');
    if(color)slider.style.setProperty('--roygbiv-slider-color',color);
    const disabled=isInactive(original);
    slider.disabled=disabled;minus.disabled=disabled;plus.disabled=disabled;
    slider.setAttribute('aria-label',sourceLabel(original));
    output.textContent=String(original.value);
    help.textContent=disabled?'Setting inactive or locked. Use All controls to change its availability.':
      'Changes the original setting; all other values and locks remain unchanged.';
  }
  function choose(field){
    original=field;
    for(const chip of chips.querySelectorAll('button'))
      chip.setAttribute('aria-pressed',String(chip.dataset.focusKey===field.name));
    sync();
  }
  function refresh(){
    if(!active)return;
    const card=document.querySelector('.editor-tool-card:not([hidden])');
    available=card?[...card.querySelectorAll('input[type=range][name]')].filter(focusEligible):[];
    chips.replaceChildren();
    if(!available.length){
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
  function setActive(next){
    if(next&&!mobile.matches)return;
    active=Boolean(next);
    form.classList.toggle('editor-focus-active',active);
    panel.hidden=!active;
    toggle.setAttribute('aria-pressed',String(active));
    toggle.setAttribute('aria-label',active?'Focused mode on. Return to All controls':'Open focused single-slider adjustment mode');
    if(active)refresh();
    else original=null;
    document.dispatchEvent(new CustomEvent('editor-focus-changed',{detail:{active}}));
    if(!active)toggle.focus({preventScroll:true});
  }
  toggle.addEventListener('click',()=>setActive(!active));
  all.addEventListener('click',()=>setActive(false));
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
  document.addEventListener('editor-tool-changed',refresh);
  mobile.addEventListener('change',event=>{if(!event.matches)setActive(false);});
  return {get active(){return active;},close:()=>setActive(false)};
}
