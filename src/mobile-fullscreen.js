/**
 * Mobile immersive mode. Browsers require a transient user gesture to
 * request fullscreen; never silently hijack unrelated edit/navigation taps.
 * Installed manifest standalone mode independently removes browser chrome.
 */
const button=document.getElementById('mobileFullscreenToggle');
const compact=window.matchMedia('(max-width:790px)');
const supported=Boolean(document.documentElement.requestFullscreen&&document.exitFullscreen);
const live=()=>Boolean(document.fullscreenElement);
function sync(){
  if(!button)return;
  const available=compact.matches&&supported;
  button.hidden=!available;
  if(!available)return;
  const entered=live();
  button.setAttribute('aria-label',entered?'Exit fullscreen':'Enter fullscreen');
  button.title=entered?'Exit fullscreen':'Enter fullscreen';
  button.setAttribute('aria-pressed',String(entered));
}
if(button){
  button.addEventListener('click',()=>{
    if(!supported||!compact.matches)return;
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
