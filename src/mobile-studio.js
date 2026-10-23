import {setIconSource} from './ui-icons.js';
import {installFiveDestinationDock} from './mobile-five-nav.js';
import {installRainbowSliders} from './rainbow-sliders.js';
installRainbowSliders();
// This module changes the studio interface only. Wallpaper recipes, saved favourites,
// and the original dark CSS remain untouched and theme-independent.
const THEME_KEY='roygbiv:studio-theme:v1';
const themeButtons=[...document.querySelectorAll('[data-studio-theme]')];
const meta=document.querySelector('meta[name="theme-color"]');
function setTheme(name){
  const theme=name==='cream'?'cream':'dark';
  document.documentElement.dataset.theme=theme;
  for(const button of themeButtons)button.setAttribute('aria-pressed',String(button.dataset.studioTheme===theme));
  if(meta)meta.content=theme==='cream'?'#f8f3e9':'#08090e';
  try{localStorage.setItem(THEME_KEY,theme);}catch{}
}
let remembered='cream';
try{remembered=localStorage.getItem(THEME_KEY)||'cream';}catch{}
setTheme(remembered);
for(const button of themeButtons)button.addEventListener('click',()=>setTheme(button.dataset.studioTheme));

const mobile=window.matchMedia('(max-width:790px)');
const design=document.getElementById('mobileDesignSheet');
const tools=document.getElementById('mobileToolsSheet');
const backstage=document.getElementById('mobileSheetBackdrop');
const gallery=document.querySelector('.workspace>.gallery-section');
const editBtn=document.getElementById('mobileEdit');
const exploreBtn=document.getElementById('mobileExplore');
const moreBtn=document.getElementById('mobileMore');
const favouriteBtn=document.getElementById('mobileFavorite');
const dismissHandle=document.getElementById('mobileDismissHandle');
const dockExpand=document.getElementById('mobileDockExpand');
const dock=document.getElementById('mobileActionDock');
const editRail=document.getElementById('mobileEditorActionRail');
editRail.addEventListener('click',event=>{
  const proxy=event.target.closest('[data-dock-proxy]');
  if(!proxy)return;
  // Favourite and Save are non-navigational actions: they must never
  // dismiss the editor or move the preview. The recessed dock shortcuts
  // close the sheets, so bypass those wrappers for the edit rail only.
  const direct={mobileFavorite:'favorite',mobileDownload:'download'};
  const original=document.getElementById(direct[proxy.dataset.dockProxy]||proxy.dataset.dockProxy);
  if(original)original.click();
});
function syncRail(){
  const chosen=document.getElementById('favorite').getAttribute('aria-pressed')==='true';
  editRail.querySelector('[data-dock-proxy=mobileFavorite]')
    .setAttribute('aria-pressed',String(chosen));
}

// Group existing source controls without cloning fields, listeners or state.
const moreContent=document.getElementById('mobileToolsContent');
const moreGroups=new Map();
for(const [id,title] of [
  ['generate','Generate'],
  ['export','Files & sharing'],
  ['inspect','Position & info']
]){
  const section=document.createElement('section');
  section.className='mobile-more-group';
  section.setAttribute('aria-labelledby','mobileMoreHeading-'+id);
  const heading=document.createElement('h3');
  heading.id='mobileMoreHeading-'+id;heading.textContent=title;
  const body=document.createElement('div');
  body.className='mobile-more-group-body';
  section.append(heading,body);
  moreContent.append(section);
  moreGroups.set(id,body);
}
moreGroups.get('generate').append(document.getElementById('mobileShuffle'));
// Preserve the original gallery #batch action and its event handler. More
// exposes an honest route to it instead of cloning gallery state or recipes.
const moreBatch=document.createElement('button');
moreBatch.type='button';
moreBatch.className='text-link-button mobile-more-batch';
moreBatch.textContent='Generate 12';
moreBatch.setAttribute('aria-label','Generate 12 wallpapers and open Explore');
moreBatch.addEventListener('click',()=>{
  document.getElementById('batch').click();
  document.getElementById('mobileExplore').click();
});
moreGroups.get('generate').append(moreBatch);
const originalSelectors=['.composition-positioner','.viewport-positioner',
  '.action-tray','.export-metadata','.secondary-actions','.details-bar'];
const originalGroups=['inspect','inspect','generate','export','export','inspect'];
const originals=originalSelectors.map(sel=>{
  const element=document.querySelector(sel);
  if(!element)throw new Error('Missing original More source controls: '+sel);
  return element;
});
const placeholders=originals.map(node=>{
  const mark=document.createComment('Original desktop position');
  node.before(mark);
  return mark;
});
/* Native Tab focus into an overflowed More sheet is not always scrolled
 * into its visible tray, particularly with a sticky header/fixed dock and
 * textarea taller than the CSS scroll-padding budget. A focused source
 * control must be physically visible, not merely focusable in the DOM.
 * Keep original controls, order, and focus intact; only move sheet scroll. */
function ensureMoreFocusedControlVisible(el){
  if(!mobile.matches||tools.hidden||document.activeElement!==el)return;
  const viewport=tools.getBoundingClientRect(),rect=el.getBoundingClientRect();
  const header=tools.querySelector('.mobile-sheet-head');
  const top=Math.min(viewport.bottom-8,
    Math.max(viewport.top,header?.getBoundingClientRect().bottom||viewport.top)+8);
  const bottom=viewport.bottom-8;
  const delta=rect.bottom>bottom?rect.bottom-bottom:
    rect.top<top?rect.top-top:0;
  // A keyboard focus target MUST remain inside the fixed More tray. Instant
  // scroller movement avoids animations racing native Tab focus scrolling.
  if(delta)tools.scrollTo({top:tools.scrollTop+delta,behavior:'instant'});
}
tools.addEventListener('focusin',event=>{
  if(!mobile.matches||tools.hidden)return;
  const el=event.target;
  if(!(el instanceof HTMLElement)||!tools.contains(el))return;
  ensureMoreFocusedControlVisible(el);
  // Chromium can apply its own native focus scroll *after* focusin; recheck
  // against the final painted geometry, without stealing focus or moving
  // any wallpaper/recipe state.
  requestAnimationFrame(()=>ensureMoreFocusedControlVisible(el));
});

let lastFocus=null;
let galleryDestination='explore';
function announceNavigation(){
  const body=document.body.classList;
  const mode=body.contains('mobile-edit-open')?'edit':
    body.contains('mobile-tools-open')?'more':
    body.contains('mobile-gallery-open')?galleryDestination:'studio';
  document.dispatchEvent(new CustomEvent('roygbiv-mobile-navigation-changed',{detail:{mode}}));
}
function moveUtilities(toSheet){
  originals.forEach((node,i)=>{
    if(toSheet)moreGroups.get(originalGroups[i]).append(node);
    else placeholders[i].after(node);
  });
}
function closeSurfaces({restoreFocus=true}={}){
  const wasOpen=document.body.classList.contains('mobile-edit-open')||
    document.body.classList.contains('mobile-gallery-open')||
    document.body.classList.contains('mobile-tools-open');
  document.body.classList.remove('mobile-edit-open','mobile-edit-compact','mobile-gallery-open','mobile-tools-open');
  design.removeAttribute('aria-modal');
  design.removeAttribute('role');
  tools.hidden=true;backstage.hidden=true;
  dockExpand.setAttribute('aria-expanded','false');
  dock.removeAttribute('aria-hidden');
  dock.inert=false;
  editBtn.setAttribute('aria-expanded','false');
  exploreBtn.setAttribute('aria-expanded','false');
  document.getElementById('mobileSaved')?.setAttribute('aria-expanded','false');
  moreBtn.setAttribute('aria-expanded','false');
  galleryDestination='explore';
  announceNavigation();
  if(wasOpen&&restoreFocus&&lastFocus?.isConnected)lastFocus.focus();
}
function updateEditorDensity(){
  if(!mobile.matches||!document.body.classList.contains('mobile-edit-open')||innerHeight<740){
    document.body.classList.remove('mobile-edit-compact');return;
  }
  const card=document.querySelector('.editor-tool-card:not([hidden])');
  if(!card)return;
  // Only on navigation. Do not resize the preview while a slider changes.
  const children=[...card.children].filter(el=>!el.hidden &&
    getComputedStyle(el).display!=='none'&&!el.classList.contains('editor-tool-header'));
  const short=children.length<=2 &&
    !card.querySelector('.texture-layer-group,.interior-toolbar,.control-grid,.lighting-subsection');
  document.body.classList.toggle('mobile-edit-compact',short);
}
document.addEventListener('editor-tool-changed',updateEditorDensity);
function openSurface(type,galleryMode='explore'){
  if(!mobile.matches)return;
  const className='mobile-'+type+'-open';
  if(document.body.classList.contains(className)&&
    (type!=='gallery'||galleryDestination===galleryMode)){closeSurfaces();return;}
  closeSurfaces({restoreFocus:false});
  lastFocus=document.activeElement;
  document.body.classList.add(className);
  // No backdrop and no aria-modal: the image remains visible and interactive
  // above the tool rail, just as in a photo adjustment editor.
  backstage.hidden=true;
  if(type==='edit'){
    editBtn.setAttribute('aria-expanded','true');
    dockExpand.setAttribute('aria-expanded','false');
    dock.setAttribute('aria-hidden','true');
    // Hidden controls must not remain keyboard-reachable. The separate
    // onscreen expand arrow remains available to leave Edit.
    dock.inert=true;
    design.setAttribute('role','region');
    updateEditorDensity();
    // The dock slides off the right edge, leaving only its accessible
    // expand arrow. Focus stays on the on-screen controls, not the hidden dock.
    dismissHandle.focus({preventScroll:true});
  }else if(type==='gallery'){
    galleryDestination=galleryMode;
    exploreBtn.setAttribute('aria-expanded',String(galleryMode==='explore'));
    document.getElementById('mobileSaved')?.setAttribute('aria-expanded',String(galleryMode==='saved'));
    gallery.setAttribute('tabindex','-1');
    gallery.focus();
  }else{
    moreBtn.setAttribute('aria-expanded','true');
    tools.hidden=false;
    document.getElementById('mobileToolsClose').focus();
  }
  announceNavigation();
}
// A variation selection closes its sheet so the newly loaded wallpaper is visible.
gallery.addEventListener('click',event=>{
  if(!event.target.closest('.thumb'))return;
  closeSurfaces({restoreFocus:false});
  // A gallery choice hides its own focused button via CSS. Hand focus to a
  // visible destination, or keyboard and screen-reader users end up on body
  // without a meaningful continuation target after restoring the design.
  document.getElementById('mobileStudio').focus({preventScroll:true});
});
dismissHandle.addEventListener('click',()=>closeSurfaces());
dockExpand.addEventListener('click',()=>closeSurfaces({restoreFocus:false}));
// Tapping the live image gives the user the full-size preview immediately.
document.querySelector('.studio-stage').addEventListener('click',event=>{
  // The wallpaper itself may dismiss Edit, but the preview-side Randomize,
  // Primes, nudge, and zoom controls must NEVER close the editing tray.
  if(document.body.classList.contains('path-drawing'))return;
  if(event.target.closest('.mobile-preview-rail,button,input,label'))return;
  if(document.body.classList.contains('mobile-edit-open'))closeSurfaces({restoreFocus:false});
});
editBtn.addEventListener('click',()=>openSurface('edit'));
exploreBtn.addEventListener('click',()=>{
  const switchView=!document.body.classList.contains('mobile-gallery-open')||
    galleryDestination!=='explore';
  openSurface('gallery','explore');
  if(switchView)
    document.dispatchEvent(new CustomEvent('roygbiv-gallery-view-request',{detail:'explore'}));
});
moreBtn.addEventListener('click',()=>openSurface('tools'));
for(const name of ['mobileToolsClose']){
  document.getElementById(name).addEventListener('click',()=>closeSurfaces());
}
backstage.addEventListener('click',()=>closeSurfaces());
document.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||event.defaultPrevented)return;
  // Setting search, Draw and other children may already own Escape.
  // An open native dialog also owns its own dismissal; never collapse the
  // underlying editor or shift its focus on the same keyboard gesture.
  if(event.target?.closest?.('dialog[open]'))return;
  closeSurfaces();
});
for(const [mobileId,targetId] of [
  ['mobileShuffle','randomizeAll'],['mobileFavorite','favorite'],['mobileDownload','download']
]){
  document.getElementById(mobileId).addEventListener('click',()=>{
    document.getElementById(targetId).click();
    closeSurfaces({restoreFocus:false});
  });
}
function syncFavorite(){
  const chosen=document.getElementById('favorite').getAttribute('aria-pressed')==='true';
  favouriteBtn.setAttribute('aria-pressed',String(chosen));
  const action=chosen?'Remove from favourites':'Add to favourites';
  favouriteBtn.setAttribute('aria-label',action);
  favouriteBtn.title=action;
  const proxy=editRail.querySelector('[data-dock-proxy=mobileFavorite]');
  proxy.setAttribute('aria-label',action);
  proxy.title=action;
  syncRail();
  setIconSource(favouriteBtn,chosen?'favourite-filled':'favourite');
  setIconSource(editRail.querySelector('[data-dock-proxy=mobileFavorite]'),chosen?'favourite-filled':'favourite');
}
new MutationObserver(syncFavorite).observe(document.getElementById('favorite'),{attributes:true,attributeFilter:['aria-pressed']});
syncFavorite();
function syncViewport(){
  closeSurfaces({restoreFocus:false});
  moveUtilities(mobile.matches);
  document.body.classList.toggle('mobile-studio',mobile.matches);
}
mobile.addEventListener('change',syncViewport);
syncViewport();

// Default mobile navigation. All five destination buttons and three relocated
// quick-action source buttons already exist in HTML before enhancement.
installFiveDestinationDock({
  closeStudio:()=>closeSurfaces({restoreFocus:false}),
  openSaved:()=>{
    const switchView=!document.body.classList.contains('mobile-gallery-open')||
      galleryDestination!=='saved';
    openSurface('gallery','saved');
    if(switchView)
      document.dispatchEvent(new CustomEvent('roygbiv-gallery-view-request',{detail:'saved'}));
  }
});
document.addEventListener('roygbiv-gallery-mode-changed',event=>{
  if(!document.body.classList.contains('mobile-five-nav')||
    !document.body.classList.contains('mobile-gallery-open'))return;
  galleryDestination=event.detail.mode;
  exploreBtn.setAttribute('aria-expanded',String(galleryDestination==='explore'));
  document.getElementById('mobileSaved')?.setAttribute('aria-expanded',String(galleryDestination==='saved'));
  announceNavigation();
});
