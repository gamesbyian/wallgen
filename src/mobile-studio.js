// This module changes the studio interface only. Wallpaper recipes, saved favourites,
// and the original dark CSS remain untouched and theme-independent.
const THEME_KEY='roygbiv:studio-theme:v1';
const select=document.getElementById('studioTheme');
const meta=document.querySelector('meta[name="theme-color"]');
function setTheme(name){
  const theme=name==='cream'?'cream':'dark';
  document.documentElement.dataset.theme=theme;
  select.value=theme;
  if(meta)meta.content=theme==='cream'?'#f8f3e9':'#08090e';
  try{localStorage.setItem(THEME_KEY,theme);}catch{}
}
let remembered='cream';
try{remembered=localStorage.getItem(THEME_KEY)||'cream';}catch{}
setTheme(remembered);
select.addEventListener('change',()=>setTheme(select.value));

const mobile=window.matchMedia('(max-width:790px)');
const design=document.getElementById('mobileDesignSheet');
const tools=document.getElementById('mobileToolsSheet');
const backstage=document.getElementById('mobileSheetBackdrop');
const gallery=document.querySelector('.workspace>.gallery-section');
const editBtn=document.getElementById('mobileEdit');
const exploreBtn=document.getElementById('mobileExplore');
const moreBtn=document.getElementById('mobileMore');
const favouriteBtn=document.getElementById('mobileFavorite');
const originals=['.composition-positioner','.action-tray','.export-metadata','.secondary-actions','.details-bar']
  .map(sel=>document.querySelector(sel)).filter(Boolean);
const placeholders=originals.map(node=>{
  const mark=document.createComment('Original desktop position');
  node.before(mark);
  return mark;
});
let lastFocus=null;
function moveUtilities(toSheet){
  const content=document.getElementById('mobileToolsContent');
  originals.forEach((node,i)=>{
    if(toSheet)content.append(node);
    else placeholders[i].after(node);
  });
}
function closeSurfaces({restoreFocus=true}={}){
  const wasOpen=document.body.classList.contains('mobile-edit-open')||
    document.body.classList.contains('mobile-gallery-open')||
    document.body.classList.contains('mobile-tools-open');
  document.body.classList.remove('mobile-edit-open','mobile-gallery-open','mobile-tools-open');
  design.removeAttribute('aria-modal');
  design.removeAttribute('role');
  tools.hidden=true;backstage.hidden=true;
  editBtn.setAttribute('aria-expanded','false');
  exploreBtn.setAttribute('aria-expanded','false');
  moreBtn.setAttribute('aria-expanded','false');
  if(wasOpen&&restoreFocus&&lastFocus?.isConnected)lastFocus.focus();
}
function openSurface(type){
  if(!mobile.matches)return;
  const className='mobile-'+type+'-open';
  if(document.body.classList.contains(className)){closeSurfaces();return;}
  closeSurfaces({restoreFocus:false});
  lastFocus=document.activeElement;
  document.body.classList.add(className);
  backstage.hidden=false;
  if(type==='edit'){
    editBtn.setAttribute('aria-expanded','true');
    design.setAttribute('role','dialog');
    design.setAttribute('aria-modal','true');
    document.getElementById('mobileDesignClose').focus();
  }else if(type==='gallery'){
    exploreBtn.setAttribute('aria-expanded','true');
    gallery.setAttribute('tabindex','-1');
    gallery.focus();
  }else{
    moreBtn.setAttribute('aria-expanded','true');
    tools.hidden=false;
    document.getElementById('mobileToolsClose').focus();
  }
}
// A variation selection closes its sheet so the newly loaded wallpaper is visible.
gallery.addEventListener('click',event=>{
  if(event.target.closest('.thumb'))closeSurfaces({restoreFocus:false});
});
editBtn.addEventListener('click',()=>openSurface('edit'));
exploreBtn.addEventListener('click',()=>openSurface('gallery'));
moreBtn.addEventListener('click',()=>openSurface('tools'));
for(const name of ['mobileDesignClose','mobileToolsClose']){
  document.getElementById(name).addEventListener('click',()=>closeSurfaces());
}
backstage.addEventListener('click',()=>closeSurfaces());
document.addEventListener('keydown',event=>{
  if(event.key==='Escape')closeSurfaces();
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
  favouriteBtn.querySelector('span').textContent=chosen?'♥':'♡';
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
