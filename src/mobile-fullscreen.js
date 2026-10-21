/**
 * Mobile immersive mode. Browsers require a transient user gesture to
 * request fullscreen; never silently hijack unrelated edit/navigation taps.
 * Installed manifest standalone mode independently removes browser chrome.
 */
// Attach after the fixed editor recovery button, not in the five-way dock
// or the source setting-card roving-focus groups. Keep the historical static
// HTML ID snapshot intact; this is presentation-only dynamic UI.
const button=document.createElement('button');
button.type='button';
button.id='mobileFullscreenToggle';
button.className='mobile-fullscreen-toggle';
button.hidden=true;
button.setAttribute('aria-label','Enter fullscreen');
button.title='Enter fullscreen';
button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path class="fullscreen-enter-glyph" d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>'+
  '<path class="fullscreen-exit-glyph" d="M3 8h5V3M21 8h-5V3M3 16h5v5M21 16h-5v5"/>'+
  '</svg>';
(document.getElementById('mobileDockExpand')||document.body.lastElementChild)?.after(button);
const compact=window.matchMedia('(max-width:790px)');
const supported=Boolean(document.documentElement.requestFullscreen&&document.exitFullscreen);
const live=()=>Boolean(document.fullscreenElement);
function sync(){
  if(!button)return;
  const available=supported&&(compact.matches||live());
  button.hidden=!available;
  if(!available)return;
  const entered=live();
  button.setAttribute('aria-label',entered?'Exit fullscreen':'Enter fullscreen');
  button.title=entered?'Exit fullscreen':'Enter fullscreen';
  button.setAttribute('aria-pressed',String(entered));
}
if(button){
  button.addEventListener('click',()=>{
    if(!supported||(!compact.matches&&!live()))return;
    // Call requestFullscreen directly in the activating handler. Awaiting a
    // preliminary promise or using setTimeout would lose transient activation.
    const action=live()?document.exitFullscreen():
      document.documentElement.requestFullscreen({navigationUI:'hide'});
    Promise.resolve(action).catch(()=>{
      sync();
      // A denied browser permission cannot make a hidden/reserved overlay.
      // Keep the button available for a deliberate later attempt.
    });
  });
  document.addEventListener('fullscreenchange',sync);
  document.addEventListener('fullscreenerror',sync);
  if(compact.addEventListener)compact.addEventListener('change',sync);
  else compact.addListener(sync);
  sync();
}
