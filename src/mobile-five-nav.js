import {iconMarkup} from './ui-icons.js';

// Opt-in navigation experiment. Preserve the existing source action buttons,
// listeners and identities; moving them never creates recipe-setting proxies.
export function installFiveDestinationDock({openSaved,closeStudio}){
  const dock=document.getElementById('mobileActionDock');
  const explore=document.getElementById('mobileExplore');
  const more=document.getElementById('mobileMore');
  const shuffle=document.getElementById('mobileShuffle');
  const favorite=document.getElementById('mobileFavorite');
  const download=document.getElementById('mobileDownload');
  const moreContent=document.getElementById('mobileToolsContent');
  const stage=document.querySelector('.studio-stage');
  const home=document.createElement('button');
  home.type='button';home.id='mobileStudio';
  home.setAttribute('aria-label','Studio canvas');
  home.setAttribute('aria-controls','preview');
  home.innerHTML='<span aria-hidden="true">'+iconMarkup('home')+'</span><small>Studio</small>';
  const saved=document.createElement('button');
  saved.type='button';saved.id='mobileSaved';
  saved.setAttribute('aria-label','Saved wallpapers');
  saved.setAttribute('aria-controls','gallery');
  saved.setAttribute('aria-expanded','false');
  saved.innerHTML='<span aria-hidden="true">'+iconMarkup('favourite')+'</span><small>Saved</small>';
  dock.prepend(home);
  more.before(saved);

  // The left preview rail already contains the real Randomize form control.
  // Its duplicate dock shortcut remains available in More, while the
  // original Favourite and Download buttons stay one tap from the preview.
  moreContent.prepend(shuffle);
  const shortcuts=document.createElement('div');
  shortcuts.className='mobile-five-shortcuts';
  shortcuts.setAttribute('role','group');
  shortcuts.setAttribute('aria-label','Save or download current artwork');
  // Attach the host before moving either source button: getElementById,
  // original event wiring and favourite status sync must never see a gap.
  stage.append(shortcuts);
  shortcuts.append(favorite,download);
  const mobile=matchMedia('(max-width:790px)');
  // Rails are detached on desktop and reattached on mobile. Keep the same
  // favourite/download source buttons connected across every breakpoint.
  const mountShortcuts=()=>{
    const rail=mobile.matches?stage.querySelector('.mobile-preview-rail-left'):null;
    const destination=rail||stage;
    if(shortcuts.parentElement!==destination)destination.append(shortcuts);
  };
  new MutationObserver(mountShortcuts).observe(stage,{childList:true});
  mobile.addEventListener('change',mountShortcuts);
  mountShortcuts();
  home.addEventListener('click',closeStudio);
  saved.addEventListener('click',openSaved);
  function sync(event){
    const mode=event?.detail?.mode||'studio';
    for(const [button,entry] of [[home,'studio'],
      [document.getElementById('mobileEdit'),'edit'],
      [explore,'explore'],[saved,'saved'],[more,'more']]){
      if(mode===entry)button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
    }
  }
  document.addEventListener('roygbiv-mobile-navigation-changed',sync);
  document.body.classList.add('mobile-five-nav');
  sync({detail:{mode:'studio'}});
  return {home,saved,shortcuts};
}
