// Named tools replace blind one-control-per-swipe navigation. A horizontal
// gesture advances to the next named tool, while direct chips work immediately.
// The editor occupies a separate reserved tray, leaving all seven visible
// rainbow stripes above it at all times.
import {EDITOR_CATEGORIES} from './editor-schema.js';
import {selectEditorTool} from './editor-layout.js';
const phone=window.matchMedia('(max-width:790px)');
const editor=document.getElementById('mobileDesignSheet');
const count=document.getElementById('mobileSettingPosition');
const handle=document.getElementById('mobileDismissHandle');
let active={category:'layout',tool:'arrange'};
function update(){
  const category=EDITOR_CATEGORIES.find(c=>c.id===active.category);
  const index=Math.max(0,category.tools.findIndex(t=>t.id===active.tool));
  count.textContent=(index+1)+' / '+category.tools.length+' · '+category.tools[index].name;
}
document.addEventListener('editor-tool-changed',event=>{active=event.detail;update();});
let gesture=null;
editor.addEventListener('touchstart',event=>{
  if(!phone.matches||!document.body.classList.contains('mobile-edit-open')||event.touches.length!==1){
    gesture=null;return;
  }
  const t=event.touches[0];
  gesture={x:t.clientX,y:t.clientY,interactive:!!event.target.closest(
    'input,select,textarea,button,[contenteditable]')};
},{passive:true});
editor.addEventListener('touchend',event=>{
  if(!gesture||!event.changedTouches.length)return;
  const start=gesture;gesture=null;
  const t=event.changedTouches[0],dx=t.clientX-start.x,dy=t.clientY-start.y;
  if(!start.interactive&&dy>65&&Math.abs(dy)>Math.abs(dx)*1.5){
    if(event.cancelable)event.preventDefault();
    document.getElementById('mobileEdit').click();
    return;
  }
  if(start.interactive||Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy)*1.4)return;
  if(event.cancelable)event.preventDefault();
  const c=EDITOR_CATEGORIES.find(x=>x.id===active.category);
  const i=c.tools.findIndex(x=>x.id===active.tool);
  const next=Math.max(0,Math.min(c.tools.length-1,i+(dx<0?1:-1)));
  if(i!==next)selectEditorTool(c.id,c.tools[next].id);
},{passive:false});
handle.addEventListener('keydown',event=>{
  if(event.key==='ArrowDown'){event.preventDefault();handle.click();}
});
update();
