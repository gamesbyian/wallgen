// Mobile preview rails use the original controls. The framing camera belongs
// to the recipe, so exported full-resolution pixels match the displayed frame.
const mq=window.matchMedia('(max-width:790px)');
const stage=document.querySelector('.studio-stage');
const toolbar=document.querySelector('#controls .randomize-toolbar');
const nudge=document.querySelector('.composition-positioner .nudge-pad');
const prime=toolbar.querySelector('input[name=primesOnly]');
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
let zoom=Number(stage.dataset.viewZoom)||1;
function setZoom(next){
  zoom=Math.round(Math.max(.5,Math.min(2.5,next))*100)/100;
  // Keep the CSS property as an observable zoom level, but never scale
  // already-clipped canvas pixels. The renderer repaints the camera instead.
  stage.style.setProperty('--mobile-preview-zoom',String(zoom));
  zoomValue.textContent=Math.round(zoom*100)+'%';
  zoomIn.disabled=zoom>=2.5;zoomOut.disabled=zoom<=.5;
  stage.dispatchEvent(new Event('roygbiv-preview-zoom'));
}
zoomIn.addEventListener('click',()=>
  stage.dispatchEvent(new CustomEvent('roygbiv-view-zoom-request',
    {detail:Math.round((zoom+.10)*100)/100})));
zoomOut.addEventListener('click',()=>
  stage.dispatchEvent(new CustomEvent('roygbiv-view-zoom-request',
    {detail:Math.round((zoom-.10)*100)/100})));
stage.addEventListener('roygbiv-view-zoom-updated',event=>setZoom(event.detail));
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
}
function sync(){if(mq.matches)mobile();else desktop();}
mq.addEventListener('change',sync);
sync();
