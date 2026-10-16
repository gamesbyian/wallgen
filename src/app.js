import { OUTPUT_WIDTH, OUTPUT_HEIGHT, normalizeRecipe, resolveScene, encodeRecipe, decodeRecipe, newSeed, randomizeAllRecipe } from './model.js';
import { drawWallpaper } from './renderer.js';

const form = document.getElementById('controls');
const preview = document.getElementById('preview');
const seedInput = document.getElementById('seedInput');
const gallery = document.getElementById('gallery');
const notice = document.getElementById('notice');
const favoriteButton = document.getElementById('favorite');
const FAVORITES_KEY = 'wallgen:favorites:v1';
const FIELDS = ['family','orientation','geometry','motif','palette','material','outline','background','textureCoverage','chaos','stripeWidth','spread','textureStrength','textureScale','individuality','gap','glow'];
let current = normalizeRecipe();
let currentScene;
let noticeTimer = 0;
let galleryRequestId = 0;
let favorites = readFavorites();

function readFavorites() {
  try {
    const data = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    if(!Array.isArray(data)) return [];
    return data.slice(0,60).map(normalizeRecipe);
  } catch { return []; }
}
function saveFavorites() {
  try { localStorage.setItem(FAVORITES_KEY,JSON.stringify(favorites)); } catch { showNotice('Browser storage unavailable; favourites last for this visit.'); }
}
function sameRecipe(a,b){return JSON.stringify(normalizeRecipe(a))===JSON.stringify(normalizeRecipe(b));}
function isFavorite(recipe){return favorites.some(item=>sameRecipe(item,recipe));}
function showNotice(message){
  notice.textContent=message;
  clearTimeout(noticeTimer);
  noticeTimer=setTimeout(()=>{if(notice.textContent===message)notice.textContent='';},5500);
}
function fromControls() {
  const data={seed:seedInput.value};
  for (const key of FIELDS) data[key]=form.elements.namedItem(key).value;
  return normalizeRecipe(data);
}
function toControls(recipe) {
  current=normalizeRecipe(recipe);
  seedInput.value=current.seed;
  for(const key of FIELDS){
    form.elements.namedItem(key).value=current[key];
    const output=form.querySelector(`output[for="${key}"]`);
    if(output) output.textContent=`${current[key]}%`;
  }
}
function syncURL() {
  try {
    const url=new URL(location.href);
    url.searchParams.set('r',encodeRecipe(current));
    history.replaceState(null,'',url);
  } catch { /* Local file previews may prohibit History API. */ }
}
function titleCase(value){return value.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());}
function render(recipe,{scroll=false}={}) {
  current=normalizeRecipe(recipe);
  currentScene=drawWallpaper(preview,current);
  showResolvedSelections(currentScene);
  document.getElementById('detailFamily').textContent=titleCase(currentScene.family);
  document.getElementById('detailGeometry').textContent=titleCase(currentScene.geometry);
  document.getElementById('detailMaterial').textContent=titleCase(currentScene.material);
  favoriteButton.setAttribute('aria-pressed',String(isFavorite(current)));
  favoriteButton.textContent=isFavorite(current)?'♥':'♡';
  document.getElementById('favoriteCount').textContent=String(favorites.length);
  syncURL();
  if(scroll) document.querySelector('.workspace-head').scrollIntoView({behavior:'smooth',block:'start'});
}
function changeRecipe(recipe,options={}){toControls(recipe);render(current,options);}
function downloadBlob(blob,name) {
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a'); link.href=url;link.download=name;
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function safeFilename(seed){return seed.toLowerCase().replace(/[^a-z0-9_-]+/g,'-').slice(0,50)||'wallpaper';}
async function copyText(text) {
  try {await navigator.clipboard.writeText(text);showNotice('Copied to clipboard.');}
  catch {showNotice('Clipboard blocked by browser. Try HTTPS or localhost.');}
}
function setBusy(button,busy,label) {
  button.disabled=busy;
  if(busy){button.dataset.previous=button.innerHTML;button.textContent=label;}
  else if(button.dataset.previous){button.innerHTML=button.dataset.previous;delete button.dataset.previous;}
}
async function downloadPNG(){
  const button=document.getElementById('download');
  setBusy(button,true,'Rendering 19.8 MP…');
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  let big;
  try {
    big=document.createElement('canvas');big.width=OUTPUT_WIDTH;big.height=OUTPUT_HEIGHT;
    drawWallpaper(big,current);
    const blob=await new Promise((resolve,reject)=>big.toBlob(b=>b?resolve(b):reject(new Error('PNG encoding failed')),'image/png'));
    downloadBlob(blob,`wallgen-${safeFilename(current.seed)}-${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}.png`);
    showNotice(`Exported ${OUTPUT_WIDTH} × ${OUTPUT_HEIGHT} PNG.`);
  }catch(error){console.error(error);showNotice(`Export failed: ${error.message}`);}
  finally { if(big){big.width=0;big.height=0;}setBusy(button,false); }
}
function updateControlsFromInputs(){render(fromControls());}

for(const slider of form.querySelectorAll('input[type="range"]')){
  const row=document.createElement('span');row.className='stepper';
  const minus=document.createElement('button');minus.type='button';minus.className='step-button';minus.textContent='−';minus.setAttribute('aria-label','Decrease '+slider.name);
  const plus=document.createElement('button');plus.type='button';plus.className='step-button';plus.textContent='+';plus.setAttribute('aria-label','Increase '+slider.name);
  slider.parentNode.insertBefore(row,slider);row.append(minus,slider,plus);
  for(const [button,delta] of [[minus,-1],[plus,1]]){
    button.addEventListener('click',()=>{
      slider.value=String(Math.max(Number(slider.min),Math.min(Number(slider.max),Number(slider.value)+delta*(Number(slider.step)||1))));
      clearTimeout(rangeTimeout);
      const output=form.querySelector('output[for="'+slider.name+'"]');if(output)output.textContent=slider.value+'%';
      updateControlsFromInputs();
    });
  }
}
const automaticKeys=['family','orientation','geometry','motif','palette','material','outline'];
for(const key of automaticKeys){
  const select=form.elements.namedItem(key),hint=document.createElement('small');
  hint.className='resolved-selection';hint.dataset.resolved=key;select.insertAdjacentElement('afterend',hint);
}
function showResolvedSelections(scene){
  for(const key of automaticKeys){
    const select=form.elements.namedItem(key),hint=form.querySelector('[data-resolved="'+key+'"]');
    const auto=select.value==='auto',option=Array.from(select.options).find(o=>o.value===scene[key]);
    hint.textContent=auto?'↳ Selected: '+(option?.textContent||titleCase(String(scene[key]))):'';
    hint.hidden=!auto;
  }
}

let rangeTimeout;
form.addEventListener('input',event=>{
  const key=event.target.name;
  if(!FIELDS.includes(key))return;
  const output=form.querySelector(`output[for="${key}"]`);
  if(output)output.textContent=`${event.target.value}%`;
  if(event.target.type==='range'){
    clearTimeout(rangeTimeout);
    rangeTimeout=setTimeout(updateControlsFromInputs,60);
  }else updateControlsFromInputs();
});
form.addEventListener('change',()=>{clearTimeout(rangeTimeout);updateControlsFromInputs();});
form.addEventListener('submit',event=>event.preventDefault());
seedInput.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();render(fromControls());}});
document.getElementById('applySeed').addEventListener('click',()=>render(fromControls()));
document.getElementById('randomize').addEventListener('click',()=>changeRecipe({...fromControls(),seed:newSeed()}));
document.getElementById('randomizeAll').addEventListener('click',()=>changeRecipe(randomizeAllRecipe()));
document.getElementById('download').addEventListener('click',downloadPNG);
document.getElementById('copyRecipe').addEventListener('click',()=>copyText(JSON.stringify(current,null,2)));
document.getElementById('copyLink').addEventListener('click',()=>copyText(location.href));
document.getElementById('downloadRecipe').addEventListener('click',()=>downloadBlob(new Blob([JSON.stringify(current,null,2)+'\n'],{type:'application/json'}),`wallgen-${safeFilename(current.seed)}.json`));
favoriteButton.addEventListener('click',()=>{
  if(isFavorite(current)){favorites=favorites.filter(item=>!sameRecipe(item,current));showNotice('Removed from favourites.');}
  else {favorites.unshift({...current});favorites=favorites.slice(0,60);showNotice('Added to favourites.');}
  saveFavorites();render(current);
});

function createCard(recipe,index) {
  const scene=resolveScene(recipe);
  const card=document.createElement('button');card.className='thumb';card.type='button';
  card.title=`Open variation ${index+1}`;
  const canvas=document.createElement('canvas');canvas.width=240;canvas.height=520;
  card.append(canvas);
  const name=document.createElement('span');name.className='thumb-caption';name.textContent=titleCase(scene.family);
  const sub=document.createElement('span');sub.className='thumb-sub';sub.textContent=`${titleCase(scene.material)} · ${scene.orientation}`;
  card.append(name,sub);
  card.addEventListener('click',()=>changeRecipe(recipe,{scroll:true}));
  drawWallpaper(canvas,recipe);
  return card;
}
async function showGallery(recipes,button){
  const requestId=++galleryRequestId;
  gallery.replaceChildren();
  if(!recipes.length){gallery.innerHTML='<div class="gallery-placeholder">Nothing saved yet.<br><span>Find something you love, then tap the heart.</span></div>';return;}
  if(button)setBusy(button,true,'Generating…');
  try {
    for(let i=0;i<recipes.length;i++){
      if(requestId!==galleryRequestId)break;
      await new Promise(resolve=>requestAnimationFrame(resolve));
      gallery.append(createCard(recipes[i],i));
    }
  }finally{if(button)setBusy(button,false);}
}
document.getElementById('batch').addEventListener('click',async()=>{
  const base=fromControls();
  const recipes=Array.from({length:12},()=>normalizeRecipe({...base,seed:newSeed()}));
  await showGallery(recipes,document.getElementById('batch'));
});
document.getElementById('showFavorites').addEventListener('click',()=>showGallery(favorites,document.getElementById('showFavorites')));

const query=new URLSearchParams(location.search).get('r');
const loaded=query?decodeRecipe(query):null;
toControls(loaded||current);
render(current);
