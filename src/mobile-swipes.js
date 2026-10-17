// Phone-only horizontal navigation, separate from rendering and recipe state.
// The original form nodes remain live; no duplicated inputs or settings.
const phone=window.matchMedia('(max-width:790px)');
const editor=document.getElementById('mobileDesignSheet');
const handle=document.getElementById('mobileDismissHandle');
const counter=document.getElementById('mobileSettingPosition');
const tabs=[...document.querySelectorAll('.settings-tab')];
const panels=tabs.map(tab=>document.getElementById(tab.getAttribute('aria-controls')));
const nav=document.querySelector('.settings-tabs');

function activeIndex(){return Math.max(0,tabs.findIndex(tab=>tab.getAttribute('aria-selected')==='true'));}
function activePanel(){return panels[activeIndex()];}
function activeSlides(panel){
  // Ignore nested labels inside lock cards and controls in hidden texture layers.
  const candidates=panel.querySelectorAll(
    '.lockable-setting, .field, .texture-rotation-field, .homogeneity-override, '+
    '.layer-add-lock, .texture-layer-panel-head, .stripe-shadow-switch, .add-texture-layer'
  );
  return [...candidates].filter(el=>{
    if(el.closest('.lockable-setting')!==null&&el.closest('.lockable-setting')!==el)return false;
    if(el.closest('.layer-add-lock')!==null&&el.closest('.layer-add-lock')!==el)return false;
    const r=el.getBoundingClientRect();
    return r.width>24 && r.height>20 && getComputedStyle(el).display!=='contents';
  });
}
function position(){
  if(!phone.matches)return;
  const panel=activePanel(),slides=activeSlides(panel);
  const left=panel.getBoundingClientRect().left;
  let index=slides.length?1:0;
  if(slides.length){
    let best=Infinity;
    for(let i=0;i<slides.length;i++){
      const d=Math.abs(slides[i].getBoundingClientRect().left-left);
      if(d<best){best=d;index=i+1;}
    }
  }
  counter.textContent=index+' / '+slides.length;
}
function visitTab(index,atEnd=false){
  if(!phone.matches||index<0||index>=tabs.length)return;
  tabs[index].click(); // Existing app manages roving tabIndex, session preference and panels.
  requestAnimationFrame(()=>{
    const panel=panels[index];
    panel.scrollTo({left:atEnd?panel.scrollWidth:0,behavior:'instant'});
    position();
  });
}
function begin(e){
  if(!phone.matches||!document.body.classList.contains('mobile-edit-open'))return null;
  if(e.touches.length!==1)return null;
  const t=e.touches[0];
  return {x:t.clientX,y:t.clientY};
}
let started=null;
editor.addEventListener('touchstart',e=>{
  started=begin(e);
},{passive:true});
editor.addEventListener('touchend',e=>{
  if(!started||!phone.matches)return;
  const t=e.changedTouches[0],dx=t.clientX-started.x,dy=t.clientY-started.y;
  started=null;
  // Vertical dismissal is not active on sliders, selects, text fields or
  // buttons: editing gestures always win over navigation gestures.
  if(dy>70 && Math.abs(dx)<Math.abs(dy)*.55 &&
      (!e.target.closest('input, select, textarea, button, [contenteditable]') ||
        e.target.closest('#mobileDismissHandle'))){
    if(e.cancelable)e.preventDefault();
    document.getElementById('mobileEdit').click();
  }
},{passive:false});
let tabSwipe=null;
nav.addEventListener('touchstart',e=>{tabSwipe=begin(e);},{passive:true});
nav.addEventListener('touchend',e=>{
  if(!tabSwipe)return;
  const t=e.changedTouches[0],dx=t.clientX-tabSwipe.x,dy=t.clientY-tabSwipe.y;
  tabSwipe=null;
  if(Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy)*1.3)return;
  if(e.cancelable)e.preventDefault();
  visitTab(activeIndex()+(dx<0?1:-1));
},{passive:false});
for(const [i,panel] of panels.entries()){
  panel.addEventListener('scroll',position,{passive:true});
  let edge=null;
  panel.addEventListener('touchstart',e=>{
    edge=null;
    if(!begin(e)||e.target.closest('input,select,textarea,button,[contenteditable]'))return;
    const start=begin(e);
    edge={...start,left:panel.scrollLeft,
      atStart:panel.scrollLeft<=3,
      atEnd:panel.scrollLeft+panel.clientWidth>=panel.scrollWidth-4};
  },{passive:true});
  panel.addEventListener('touchend',e=>{
    if(!edge)return;
    const t=e.changedTouches[0],dx=t.clientX-edge.x,dy=t.clientY-edge.y;
    const from=edge;edge=null;
    if(Math.abs(dx)<70||Math.abs(dx)<Math.abs(dy)*1.5)return;
    if(dx<0 && from.atEnd && i<tabs.length-1){
      if(e.cancelable)e.preventDefault();visitTab(i+1);
    }else if(dx>0 && from.atStart && i>0){
      if(e.cancelable)e.preventDefault();visitTab(i-1,true);
    }
  },{passive:false});
  panel.addEventListener('keydown',e=>{
    if(e.target!==panel)return;
    const slides=activeSlides(panel);
    const current=Math.max(0,Number(counter.textContent.split('/')[0].trim())-1);
    if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
      e.preventDefault();
      const target=slides[Math.max(0,Math.min(slides.length-1,
        current+(e.key==='ArrowRight'?1:-1)))];
      target?.scrollIntoView({block:'nearest',inline:'start',behavior:'smooth'});
    }
  });
  new MutationObserver(()=>requestAnimationFrame(position))
    .observe(panel,{subtree:true,attributes:true,attributeFilter:['hidden']});
}
for(const tab of tabs){
  tab.addEventListener('click',()=>requestAnimationFrame(()=>{
    activePanel().scrollLeft=0;position();
  }));
}
const resize=new ResizeObserver(position);
for(const panel of panels)resize.observe(panel);
handle.addEventListener('keydown',e=>{
  if(e.key==='ArrowDown'){e.preventDefault();handle.click();}
});
requestAnimationFrame(position);
