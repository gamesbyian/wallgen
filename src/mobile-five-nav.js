// Canonical five-destination navigation uses real HTML source action buttons.
export function installFiveDestinationDock({openSaved,closeStudio}){
  const dock=document.getElementById('mobileActionDock');
  const explore=document.getElementById('mobileExplore');
  const more=document.getElementById('mobileMore');
  const shuffle=document.getElementById('mobileShuffle');
  const favorite=document.getElementById('mobileFavorite');
  const download=document.getElementById('mobileDownload');
  const moreContent=document.getElementById('mobileToolsContent');
  const stage=document.querySelector('.studio-stage');
  const home=document.getElementById('mobileStudio');
  const saved=document.getElementById('mobileSaved');
  const shortcuts=document.querySelector('.mobile-five-shortcuts');
  if(!home||!saved||!shortcuts||
     [...dock.children].map(node=>node.id).join(',')!==
       'mobileStudio,mobileEdit,mobileExplore,mobileSaved,mobileMore'||
     shuffle.parentElement!==moreContent||
     !shortcuts.contains(favorite)||!shortcuts.contains(download))
    throw new Error('Five destinations or source quick actions missing from HTML');
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
