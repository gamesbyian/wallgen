// Mobile preview rails use original Randomize/Primes/nudge controls.
// Zoom is preview-only: downloaded pixels and recipe remain unchanged.
const mq=window.matchMedia('(max-width:790px)');
const stage=document.querySelector('.studio-stage');
const toolbar=document.querySelector('#controls .randomize-toolbar');
const nudge=document.querySelector('.composition-positioner .nudge-pad');
const prime=toolbar.querySelector('input[name=primesOnly]');
const image=document.getElementById('preview');
const toolbarMarker=document.createComment('Desktop position: randomize and primes');
const nudgeMarker=document.createComment('Desktop position: composition nudge');
toolbar.before(toolbarMarker);
nudge.before(nudgeMarker);
prime.setAttribute('form','controls'); // Preserve form.elements while reparented.
// The moved checkbox no longer bubbles through <form>. Forward its change so
// app.js updates the actual recipe state before Randomize is pressed.
prime.addEventListener('change',()=>{
  if(mq.matches)document.getElementById('controls')
    .dispatchEvent(new Event('change',{bubbles:true}));
});
const left=document.createElement('div');
left.className='mobile-preview-rail mobile-preview-rail-left';
left.setAttribute('aria-label','Generation shortcuts');
const right=document.createElement('div');
right.className='mobile-preview-rail mobile-preview-rail-right';
right.setAttribute('role','group');
right.setAttribute('aria-label','Move artwork and zoom preview');
const zoomOut=document.createElement('button'),zoomIn=document.createElement('button');
for(const [el,mode,glyph,label] of [
  [zoomIn,'in','+','Zoom preview in'],
  [zoomOut,'out','−','Zoom preview out'],
]){
  el.type='button';el.className='mobile-zoom-button';
  el.dataset.zoom=mode;el.textContent=glyph;el.setAttribute('aria-label',label);
}
const zoomValue=document.createElement('output');
zoomValue.className='mobile-zoom-level';
zoomValue.setAttribute('aria-live','off');
let zoom=1;
function setZoom(next){
  zoom=Math.round(Math.max(.5,Math.min(2.5,next))*100)/100;
  stage.style.setProperty('--mobile-preview-zoom',String(zoom));
  zoomValue.textContent=Math.round(zoom*100)+'%';
  zoomIn.disabled=zoom>=2.5;zoomOut.disabled=zoom<=.5;
  stage.dispatchEvent(new Event('roygbiv-preview-zoom'));
}
zoomIn.addEventListener('click',()=>setZoom(zoom+.10));
zoomOut.addEventListener('click',()=>setZoom(zoom-.10));
const zoomSlot=document.createElement('div');
zoomSlot.className='mobile-zoom-slot';
zoomSlot.append(zoomIn,zoomOut,zoomValue);
function mobile(){
  stage.append(left,right);
  left.append(toolbar);
  right.append(nudge,zoomSlot);
  document.body.classList.add('mobile-preview-tools-ready');
  setZoom(zoom);
}
function desktop(){
  toolbarMarker.after(toolbar);
  nudgeMarker.after(nudge);
  left.remove();right.remove();
  document.body.classList.remove('mobile-preview-tools-ready');
  image.style.removeProperty('transform');
}
function sync(){if(mq.matches)mobile();else desktop();}
mq.addEventListener('change',sync);
sync();
