// Named tools replace blind one-control-per-swipe navigation. A horizontal
// gesture advances to the next named tool, while direct chips work immediately.
// The editor occupies a separate reserved tray, leaving all seven visible
// rainbow stripes above it at all times.
import {visibleMobileTools,adjacentVisibleMobileTool,isMobileToolSwipeSurface,matchingSingleTouchEnd,mobileToolSelectionChanged} from './mobile-tool-sequence.js';
import {selectEditorTool} from './editor-layout.js?v=20261023-single-editor1';
const phone=window.matchMedia('(max-width:790px)');
const editor=document.getElementById('mobileDesignSheet');
const count=document.getElementById('mobileSettingPosition');
const handle=document.getElementById('mobileDismissHandle');
const chooser=document.querySelector('.editor-tool-chooser');
let active={category:'layout',tool:'arrange'};
const availableTools=()=>visibleMobileTools(
  chooser.querySelectorAll('[data-editor-tool]'),active.category);
function update(){
  const choices=availableTools(),index=choices.findIndex(t=>t.id===active.tool);
  count.textContent=index<0?'No available tools':
    (index+1)+' / '+choices.length+' · '+choices[index].name;
}
let gesture=null;
document.addEventListener('editor-tool-changed',event=>{
  if(mobileToolSelectionChanged(active,event.detail))gesture=null;
  active=event.detail;update();
});
editor.addEventListener('touchstart',event=>{
  if(!phone.matches||!document.body.classList.contains('mobile-edit-open')||event.touches.length!==1){
    gesture=null;return;
  }
  const t=event.touches[0];
  gesture={id:t.identifier,x:t.clientX,y:t.clientY,
    interactive:!isMobileToolSwipeSurface(event.target)};
},{passive:true});
editor.addEventListener('touchcancel',()=>{gesture=null;},{passive:true});
// A second finger can land outside the sheet, so its touchstart may never
// bubble through the editor. Cancel from the shared window coordinator.
window.addEventListener('touchstart',event=>{
  if(gesture&&event.touches.length!==1)gesture=null;
},{passive:true});
editor.addEventListener('touchend',event=>{
  if(!gesture||!phone.matches||!document.body.classList.contains('mobile-edit-open')){
    gesture=null;return;
  }
  const start=gesture;gesture=null;
  const t=matchingSingleTouchEnd(start.id,event);
  if(!t)return;
  const dx=t.clientX-start.x,dy=t.clientY-start.y;
  if(!start.interactive&&dy>65&&Math.abs(dy)>Math.abs(dx)*1.5){
    if(event.cancelable)event.preventDefault();
    document.getElementById('mobileEdit').click();
    return;
  }
  if(start.interactive||Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy)*1.4)return;
  if(event.cancelable)event.preventDefault();
  // Scene-inapplicable chips are already hidden by the canonical editor.
  // Swiping must not count or select them, or fallback can jump backwards.
  const next=adjacentVisibleMobileTool(availableTools(),active.tool,dx<0?1:-1);
  if(next)selectEditorTool(active.category,next,{source:'swipe'});
},{passive:false});
handle.addEventListener('keydown',event=>{
  if(event.key==='ArrowDown'){event.preventDefault();handle.click();}
});
update();
