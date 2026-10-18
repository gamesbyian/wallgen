import { OUTPUT_WIDTH, OUTPUT_HEIGHT, normalizeRecipe, resolveScene, encodeRecipe, decodeRecipe, newSeed, randomizeAllRecipe, respectSettingLocks, LOCKABLE_SETTINGS } from './model.js';
import { drawWallpaper, presentNudgedArtwork } from './renderer.js';
import { embedPngMetadata, extractPngRecipe, cleanMetadata, METADATA_FIELDS } from './png-metadata.js';
import { installDrawTool } from './draw-path-ui.js?v=20261018-points1';
import { installImagePathTool } from './image-path-ui.js?v=20261018-import1';
import {mountEditor,selectEditorTool} from './editor-layout.js';
import {randomizeScope} from './scoped-random.js';
import {STYLE_PRESETS} from './editor-schema.js';
import {installExplorationHistory} from './exploration-history.js';

const form = document.getElementById('controls');
const preview = document.getElementById('preview');
const seedInput = document.getElementById('seedInput');
const gallery = document.getElementById('gallery');
const notice = document.getElementById('notice');
const favoriteButton = document.getElementById('favorite');
const FAVORITES_KEY = 'wallgen:favorites:v1';
const FIELDS = ['primesOnly','family','composition','repeatCount','repeatSpacing','orientation','reverseStripes','diagonalRotation','mirrorHorizontal','mirrorVertical','geometry','turnRadius','hairpinAngle','loopRadius','loopSweep','geometrySafety','crossingMode','stepCount','chevronSharpness','loopAspect','construction','motif','lineStyle','pathLength','tonalContrast','brushRoughness','dotSize','dotSpacing','endTaper','shapeFrequency','shapeDepth','motifSize','motifFrequency','palette','material','outline','background','lightingMood','lightDirection','lightStrength','shadowStrength','stripeShadowStrength','stripeShadowSoftness','stripeShadowDirection','textureCoverage','textureRotation','textureBlend','textureLayer2Enabled','material2','textureCoverage2','textureStrength2','textureScale2','textureRotation2','textureBlend2','textureLayer3Enabled','material3','textureCoverage3','textureStrength3','textureScale3','textureRotation3','textureBlend3','chaos','stripeWidth','spread','textureStrength','textureScale','textureDisplacement','individuality','patternHomogeneity','overridePatternHomogeneity','gap','outlineBuffer','glow'];
let current = normalizeRecipe();
let currentScene;
const previewLayers={background:null,ink:null,scene:null,key:null};
const settingLockButtons=new Map();
const autos=['family','orientation','geometry','motif','palette','material','outline'];
function artKey(recipe){
  const {positionX,positionY,lockedSettings,primesOnly,
    lightingMood,lightDirection,lightStrength,shadowStrength,
    stripeShadowStrength,stripeShadowSoftness,stripeShadowDirection,...art}=normalizeRecipe(recipe);
  return JSON.stringify(art);
}
let noticeTimer = 0;
let galleryRequestId = 0;
let favorites = readFavorites();
const undoStack=[];
const UNDO_LIMIT=80;
let undoing=false;
function updateUndoButton(){const button=document.getElementById('undo');button.disabled=undoStack.length===0;button.title=undoStack.length?`Undo (${undoStack.length} available)`:'Nothing to undo';}
function checkpoint(next){
  const normalized=normalizeRecipe(next);
  if(!undoing && !sameRecipe(current,normalized)){
    undoStack.push({...current});
    if(undoStack.length>UNDO_LIMIT)undoStack.shift();
  }
  updateUndoButton();
  return normalized;
}
function undo(){
  if(!undoStack.length)return;
  clearTimeout(rangeTimeout);
  const previous=undoStack.pop();
  undoing=true;
  try{changeRecipe(previous,{bypassLocks:true});showNotice('Undid last design change.');}finally{undoing=false;updateUndoButton();}
}

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
  const data={seed:seedInput.value,positionX:current.positionX,positionY:current.positionY,
    viewZoom:current.viewZoom,customPath:current.customPath,drawnAnchors:current.drawnAnchors,drawnCorners:current.drawnCorners};
  for (const key of FIELDS) { const field=form.elements.namedItem(key); data[key]=field.dataset.inactive==='true'?current[key]:(field.type==='checkbox'?field.checked:field.value); }
  return normalizeRecipe(data);
}
function toControls(recipe) {
  current=normalizeRecipe(recipe);
  seedInput.value=current.seed;
  for(const key of FIELDS){
    const field=form.elements.namedItem(key);
    if(field.type==='checkbox')field.checked=current[key]; else field.value=current[key];
    const output=form.querySelector(`output[for="${key}"]`);
    if(output) output.textContent=key==='repeatCount'?String(current[key]):`${current[key]}%`;
    const numeric=form.querySelector(`[data-number-for="${key}"]`);
    if(numeric)numeric.value=current[key];
  }
  syncTextureLayerVisibility();
  syncStripeShadowUI();
  syncDiagonalUI();
  syncSettingLocks();
  syncInactiveSettings();
  const effective=document.getElementById('geometrySafetyStatus');
  if(effective){
    if(!current.geometrySafety)effective.textContent='Unrestricted: intersections, overlaps and cropping permitted';
    else if(['loops','loop','hairpin','drawn'].includes(current.geometry)){
      const safe=resolveScene(current);
      const free=resolveScene({...current,geometrySafety:false});
      const n=3;
      const metric=geometry=>geometry==='loops'?'loopAmplitude':
        geometry==='hairpin'?'turnRadius':
        geometry==='loop'?'loopRadius':null;
      const key=metric(current.geometry);
      if(key){
        const actual=safe.stripes[n][key],requested=free.stripes[n][key];
        effective.textContent=Math.abs(actual-requested)>1?
          `Coherent: effective ${current.geometry} ${actual.toFixed(1)} px · unrestricted ${requested.toFixed(1)} px`:
          'Coherent: no constraint currently required';
      }else{
        const span=scene=>scene.stripes.at(-1).center-scene.stripes[0].center;
        effective.textContent=span(safe)+1<span(free)?
          `Coherent spacing: ${span(safe).toFixed(0)} px · unrestricted ${span(free).toFixed(0)} px`:
          'Coherent: no constraint currently required';
      }
    }else effective.textContent='Coherent: preserve the selected geometry family';
  }
}
/**
 * Inapplicable settings show zero without destroying their saved recipe values.
 * Disabled fields retain their canonical value in current, even when the visible
 * slider thumb/number is temporarily zero.
 */
function inactiveSettingKeys(recipe,scene){
  const inactive=new Set();
  // Decorative motifs have separate size/density knobs; straight geometry
  // never has curve frequency/depth, even when marked with chevrons.
  if(['straight','hairpin','loop','drawn'].includes(scene.geometry))
    inactive.add('shapeFrequency'),inactive.add('shapeDepth');
  if(scene.geometry==='drawn')inactive.add('orientation');
  if(scene.geometry!=='hairpin')inactive.add('turnRadius'),inactive.add('hairpinAngle');
  if(scene.geometry!=='loop')inactive.add('loopRadius'),inactive.add('loopSweep');
  if(!['loop','loops','drawn'].includes(scene.geometry))inactive.add('crossingMode');
  if(scene.geometry!=='stepped')inactive.add('stepCount');
  if(scene.geometry!=='chevron')inactive.add('chevronSharpness');
  if(scene.geometry!=='loops')inactive.add('loopAspect');
  if(recipe.composition!=='repeat')inactive.add('repeatCount'),inactive.add('repeatSpacing');
  if(recipe.composition!=='floating')inactive.add('pathLength');
  if(recipe.construction!=='tonal')inactive.add('tonalContrast');
  if(scene.outline==='none'){
    inactive.add('gap');inactive.add('outlineBuffer');
  }
  if(recipe.construction!=='ribbon'){
    inactive.add('motif');inactive.add('patternHomogeneity');inactive.add('overridePatternHomogeneity');
    inactive.add('motifSize');inactive.add('motifFrequency');
  }else if(scene.motif==='solid'){
    inactive.add('patternHomogeneity');
    inactive.add('motifSize');inactive.add('motifFrequency');
  }
  if(['woven','tonal'].includes(recipe.construction))inactive.add('lineStyle');
  if(recipe.construction==='woven')inactive.add('brushRoughness');
  if((recipe.lineStyle!=='dotted'&&!(recipe.construction==='ribbon'&&scene.motif==='dots'))
      ||recipe.construction==='woven'){
    inactive.add('dotSize');inactive.add('dotSpacing');
  }
  if(scene.orientation!=='diagonal'||scene.geometry==='drawn'){
    for(const key of ['diagonalRotation','mirrorHorizontal','mirrorVertical'])inactive.add(key);
  }
  if(recipe.lightingMood==='off'){
    for(const key of ['lightDirection','lightStrength','shadowStrength'])inactive.add(key);
  }
  for(const suffix of ['','2','3']){
    const layerOn=suffix==='' || (suffix==='2'
      ? recipe.textureLayer2Enabled : recipe.textureLayer3Enabled);
    const material=suffix===''?scene.material:recipe['material'+suffix];
    // Layers 2 and 3 can always be selected, even when switched off.
    // Choosing a material in their own tool enables the layer automatically.
    if(!layerOn || material==='none'){
      for(const base of ['textureCoverage','textureStrength','textureScale','textureRotation','textureBlend'])
        inactive.add(base+suffix);
    }
  }
  // Direction has no effect without an actual lighting contribution.
  if(recipe.lightingMood!=='off' && recipe.lightStrength===0 && recipe.shadowStrength===0)
    inactive.add('lightDirection');
  // With a zero-strength cast shadow, softness and direction cannot be seen.
  if(recipe.stripeShadowStrength===0){
    inactive.add('stripeShadowSoftness');
    inactive.add('stripeShadowDirection');
  }
  // A real material at zero strength can be re-enabled using its strength
  // control; all subordinate appearance knobs are dormant in the meantime.
  for(const suffix of ['','2','3']){
    const layerOn=suffix==='' || (suffix==='2'
      ? recipe.textureLayer2Enabled : recipe.textureLayer3Enabled);
    const material=suffix===''?scene.material:recipe['material'+suffix];
    if(layerOn && material!=='none' && recipe['textureStrength'+suffix]===0){
      for(const base of ['textureCoverage','textureScale','textureRotation','textureBlend'])
        inactive.add(base+suffix);
    }
  }
  if(recipe.individuality===0)inactive.add('overridePatternHomogeneity');
  return inactive;
}
function syncInactiveSettings(){
  const inactive=inactiveSettingKeys(current,currentScene||resolveScene(current));
  for(const key of FIELDS){
    const field=form.elements.namedItem(key);
    if(!field)continue;
    const isInactive=inactive.has(key);
    field.dataset.inactive=isInactive?'true':'false';
    const locked=current.lockedSettings.includes(key);
    field.disabled=isInactive||locked;
    const host=field.closest('.lockable-setting')||field.closest('.texture-rotation-field')||field.closest('label');
    if(host){
      host.classList.toggle('setting-inactive',isInactive);
      for(const el of host.querySelectorAll('.step-button,.slider-number'))el.disabled=isInactive||locked;
    }
    if(field.type==='range'){
      field.value=isInactive?'0':String(current[key]);
      const numeric=form.querySelector('[data-number-for="'+key+'"]');
      if(numeric)numeric.value=isInactive?'0':String(current[key]);
      const output=form.querySelector('output[for="'+key+'"]');
      if(output)output.textContent=(isInactive?'0':current[key])+(key==='repeatCount'?'':'%');
    }else if(field.type==='checkbox'){
      field.checked=isInactive?false:!!current[key];
    }else if(field.tagName==='SELECT'){
      const placeholder=Array.from(field.options).find(option=>option.dataset.inactivePlaceholder==='true');
      if(isInactive){
        if(!placeholder){
          const opt=document.createElement('option');
          opt.value='0';opt.textContent='0 · Inactive';opt.dataset.inactivePlaceholder='true';
          field.add(opt);
        }
        field.value='0';
      }else{
        if(placeholder)placeholder.remove();
        field.value=current[key];
      }
    }else if(field.type==='number'){
      field.value=isInactive?'0':String(current[key]);
    }
    if(key.startsWith('textureRotation') || key==='diagonalRotation'){
      for(const button of document.querySelectorAll('[data-rotate-target="'+key+'"]'))
        button.disabled=isInactive||locked;
    }
  }
  for(const button of document.querySelectorAll('.setting-inactive > .setting-lock')){
    button.disabled=true;
    button.title='Inactive in the current configuration';
  }
  for(const button of document.querySelectorAll('.lockable-setting:not(.setting-inactive) > .setting-lock')){
    button.disabled=false;
  }
}
function syncDiagonalUI(){
  document.getElementById('diagonalSettings').hidden=form.elements.namedItem('orientation').value!=='diagonal';
}
function syncStripeShadowUI(){
  // Shadow strength = 0 is Off. Softness and direction are disabled, but
  // retained so restoring strength restores the previous shadow character.
  document.getElementById('stripeShadowControls').hidden=false;
}
function syncTextureLayerVisibility(){
  // Layer tabs are always present, with 'No texture / smooth' as the
  // inactive state. The two optional flags remain part of saved recipes.
  document.getElementById('textureLayer2Panel').hidden=false;
  document.getElementById('textureLayer3Panel').hidden=false;
}
function syncURL() {
  try {
    const url=new URL(location.href);
    url.searchParams.set('r',encodeRecipe(current));
    history.replaceState(null,'',url);
  } catch { /* Local file previews may prohibit History API. */ }
}
function titleCase(value){return value.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());}
function render(recipe,{scroll=false,bypassLocks=false}={}) {
  const next=bypassLocks?normalizeRecipe(recipe):respectSettingLocks(current,recipe);
  current=checkpoint(next);
  // Primes Only is reflected by its selected control; no transient message.
  const key=artKey(current);
  if(previewLayers.key===key && previewLayers.ink && previewLayers.background){
    // The directional buttons only blit these two cached bitmaps.
    presentNudgedArtwork(preview,previewLayers,current);
    currentScene=previewLayers.scene;
  }else{
    currentScene=drawWallpaper(preview,current,{cache:previewLayers});
    previewLayers.key=key;
    previewLayers.scene=currentScene;
  }
  // The frame always shows the exact resolution-independent export camera.
  const stage=document.querySelector('.studio-stage');
  stage.dataset.viewZoom=String(current.viewZoom);
  stage.dispatchEvent(new CustomEvent('roygbiv-view-zoom-updated',
    {detail:current.viewZoom}));
  stage.dispatchEvent(new CustomEvent('roygbiv-wallpaper-rendered',
    {detail:{background:current.background}}));
  updatePositionStatus();
  showResolvedSelections(currentScene);
  document.getElementById('detailFamily').textContent=titleCase(currentScene.family);
  document.getElementById('detailGeometry').textContent=titleCase(currentScene.geometry);
  document.getElementById('detailMaterial').textContent=titleCase(currentScene.materialSummary);
  favoriteButton.setAttribute('aria-pressed',String(isFavorite(current)));
  // Keep the squat-heart SVG intact; aria-pressed controls its fill.
  drawTool.sync(current);
  imagePathTool.sync(current);
  document.getElementById('favoriteCount').textContent=String(favorites.length);
  syncURL();
  if(scroll) document.querySelector('.workspace-head').scrollIntoView({behavior:'smooth',block:'start'});
}
function changeRecipe(recipe,options={}){
  render(recipe,options);toControls(current);showResolvedSelections(currentScene);
  for(const die of form.querySelectorAll('[data-random-setting]')){
    const field=form.elements.namedItem(die.dataset.randomSetting);
    die.disabled=!field||field.disabled||field.dataset.inactive==='true';
    die.title=die.disabled?'Setting is unavailable or locked':'Randomize only '+die.dataset.randomSetting;
  }
}
document.querySelector('.studio-stage').addEventListener('roygbiv-view-zoom-request',event=>{
  changeRecipe({...current,viewZoom:event.detail});
});
const drawTool=installDrawTool({
  getRecipe:()=>current,
  onNotice:showNotice,
  onApply:(points,anchors=[],corners=[])=>{
    const next=fromControls();
    next.customPath=points;
    next.drawnAnchors=anchors;
    next.drawnCorners=corners;
    next.geometry='drawn';
    next.orientation='horizontal';
    next.positionX=0;
    next.positionY=0;
    changeRecipe(next);
    showNotice('Drawn path applied. Undo restores the previous wallpaper.');
  },
});
const imagePathTool=installImagePathTool({
  getRecipe:()=>current,
  onNotice:showNotice,
  onPath:path=>drawTool.loadPath(path),
  onAngle:angle=>{
    // Rotation is relative to the resolved seed direction, not fixed at 45°.
    const base=fromControls();
    const keys=['orientation','diagonalRotation'];
    if(base.geometry==='drawn')keys.push('geometry');
    if(keys.some(key=>base.lockedSettings.includes(key))){
      showNotice('Unlock Path geometry and Layout direction before applying an angle.');
      return false;
    }
    const geometry=base.geometry==='drawn'?'straight':base.geometry;
    const trial=normalizeRecipe({...base,geometry,orientation:'diagonal',diagonalRotation:0});
    const baseline=resolveScene(trial).angle*180/Math.PI;
    changeRecipe({...base,geometry,orientation:'diagonal',diagonalRotation:angle-baseline});
    showNotice('Detected '+angle+'° line direction applied. Undo restores the previous angle.');
    return true;
  },
});
function updatePositionStatus(){
  const label=document.getElementById('positionStatus');
  const x=current.positionX, y=current.positionY;
  for(const button of document.querySelectorAll('[data-nudge]'))button.disabled=current.lockedSettings.includes('position');
  label.textContent=x===0&&y===0?'Default position':
    `X ${x>0?'+':''}${x}% · Y ${y>0?'+':''}${y}%`;
  const reset=document.querySelector('[data-nudge="reset"]');
  reset.disabled=(x===0&&y===0)||current.lockedSettings.includes('position');
}
const NUDGE_STEP=1;
for(const button of document.querySelectorAll('[data-nudge]')){
  button.addEventListener('click',()=>{
    const direction=button.dataset.nudge;
    const recipe=fromControls();
    if(direction==='reset'){
      recipe.positionX=0;recipe.positionY=0;
    }else{
      const dx=direction==='right'?NUDGE_STEP:direction==='left'?-NUDGE_STEP:0;
      const dy=direction==='down'?NUDGE_STEP:direction==='up'?-NUDGE_STEP:0;
      recipe.positionX=Math.max(-30,Math.min(30,recipe.positionX+dx));
      recipe.positionY=Math.max(-30,Math.min(30,recipe.positionY+dy));
    }
    changeRecipe(recipe);
  });
}

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
const metadataPanel=document.getElementById('metadataPanel');
const metadataToggle=document.getElementById('metadataToggle');
const rememberMetadata=document.getElementById('metadataRemember');
const METADATA_STORE='wallgen:export-metadata:v1';
function metadataValues(){
  return cleanMetadata(Object.fromEntries(METADATA_FIELDS.map(key=>[key,metadataPanel.querySelector('[name="'+key+'"]').value])));
}
function syncMetadataStorage(){
  try{
    if(rememberMetadata.checked)localStorage.setItem(METADATA_STORE,JSON.stringify(metadataValues()));
    else localStorage.removeItem(METADATA_STORE);
  }catch{showNotice('Metadata storage is unavailable in this browser.');}
}
metadataToggle.addEventListener('click',()=>{
  const open=metadataPanel.hidden;
  metadataPanel.hidden=!open;
  metadataToggle.setAttribute('aria-expanded',String(open));
  metadataToggle.textContent=(open?'▾':'▸')+' Edit image metadata';
});
metadataPanel.addEventListener('input',syncMetadataStorage);
rememberMetadata.addEventListener('change',syncMetadataStorage);
document.getElementById('metadataClear').addEventListener('click',()=>{
  for(const key of METADATA_FIELDS){
    metadataPanel.querySelector('[name="'+key+'"]').value=key==='software'?'R.O.Y.G.B.I.V. · Made with ChatGPT':'';
  }
  syncMetadataStorage();
});
try{
  const stored=JSON.parse(localStorage.getItem(METADATA_STORE)||'null');
  if(stored&&typeof stored==='object'){
    const values=cleanMetadata(stored);
    for(const key of METADATA_FIELDS)if(key in values)metadataPanel.querySelector('[name="'+key+'"]').value=values[key];
    rememberMetadata.checked=true;
  }
}catch{}

async function downloadPNG(){
  const button=document.getElementById('download');
  setBusy(button,true,'Rendering 19.8 MP…');
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  let big;
  try {
    big=document.createElement('canvas');big.width=OUTPUT_WIDTH;big.height=OUTPUT_HEIGHT;
    // Same framing recipe as the displayed canvas, independently rendered at
    // 3024 × 6552 rather than exporting a magnified low-resolution screenshot.
    drawWallpaper(big,current);
    const blob=await new Promise((resolve,reject)=>big.toBlob(b=>b?resolve(b):reject(new Error('PNG encoding failed')),'image/png'));
    const metadata=metadataValues();
    const result=new Blob([embedPngMetadata(await blob.arrayBuffer(),metadata,{recipe:current})],
      {type:'image/png'});
    downloadBlob(result,`roygbiv-${safeFilename(current.seed)}-${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}.png`);
    showNotice(`Exported the framed ${Math.round(current.viewZoom*100)}% view at ${OUTPUT_WIDTH} × ${OUTPUT_HEIGHT}, with recipe metadata.`);
  }catch(error){console.error(error);showNotice(`Export failed: ${error.message}`);}
  finally { if(big){big.width=0;big.height=0;}setBusy(button,false); }
}
const importRecipeButton=document.getElementById('importRecipePNG');
const importRecipeFile=document.getElementById('importRecipeFile');
importRecipeButton.addEventListener('click',()=>importRecipeFile.click());
importRecipeFile.addEventListener('change',async()=>{
  const file=importRecipeFile.files?.[0];
  importRecipeFile.value='';
  if(!file)return;
  try{
    if(file.size>150*1024*1024)throw Error('PNG exceeds the 150 MB import limit');
    const recipe=extractPngRecipe(await file.arrayBuffer());
    if(!recipe)throw Error('This PNG has no R.O.Y.G.B.I.V. recipe metadata');
    changeRecipe(recipe,{bypassLocks:true});
    showNotice('Restored original wallpaper settings from PNG recipe.');
  }catch(error){showNotice('Cannot restore design: '+error.message);}
});

function updateControlsFromInputs(){
  syncDiagonalUI();
  changeRecipe(fromControls());
}

for(const slider of form.querySelectorAll('input[type="range"]')){
  const row=document.createElement('span');row.className='stepper';
  const minus=document.createElement('button');minus.type='button';minus.className='step-button';minus.textContent='−';minus.setAttribute('aria-label','Decrease '+slider.name);
  const plus=document.createElement('button');plus.type='button';plus.className='step-button';plus.textContent='+';plus.setAttribute('aria-label','Increase '+slider.name);
  const numeric=document.createElement('input');
  numeric.type='number';numeric.className='slider-number';numeric.min=slider.min;numeric.max=slider.max;
  numeric.step=slider.step||'1';numeric.value=slider.value;numeric.dataset.numberFor=slider.name;
  numeric.setAttribute('aria-label',['diagonalRotation','hairpinAngle','loopSweep'].includes(slider.name)?
    slider.name+' in degrees':slider.name+' percentage');
  slider.parentNode.insertBefore(row,slider);row.append(minus,slider,plus,numeric);
  numeric.addEventListener('change',()=>{
    const raw=Number(numeric.value);
    if(numeric.value.trim()==='' || !Number.isFinite(raw)){numeric.value=slider.value;return;}
    const step=Number(slider.step)||1,min=Number(slider.min),max=Number(slider.max);
    slider.value=String(Math.min(max,Math.max(min,Math.round((raw-min)/step)*step+min)));
    numeric.value=slider.value;
    const output=form.querySelector('output[for="'+slider.name+'"]');
    if(output)output.textContent=slider.value+'%';
    clearTimeout(rangeTimeout);
    updateControlsFromInputs();
  });
  for(const [button,delta] of [[minus,-1],[plus,1]]){
    button.addEventListener('click',()=>{
      slider.value=String(Math.max(Number(slider.min),Math.min(Number(slider.max),Number(slider.value)+delta*(Number(slider.step)||1))));
      clearTimeout(rangeTimeout);
      numeric.value=slider.value;
      const output=form.querySelector('output[for="'+slider.name+'"]');if(output)output.textContent=slider.value+'%';
      updateControlsFromInputs();
    });
  }
}
const automaticKeys=autos;
for(const key of automaticKeys){
  const select=form.elements.namedItem(key),hint=document.createElement('small');
  hint.className='resolved-selection';hint.dataset.resolved=key;select.insertAdjacentElement('afterend',hint);
}
function showResolvedSelections(scene){
  for(const key of automaticKeys){
    const select=form.elements.namedItem(key),hint=form.querySelector('[data-resolved="'+key+'"]');
    const auto=select.value==='auto',option=Array.from(select.options).find(o=>o.value===scene[key]);
    const resolvedName=option?.textContent||titleCase(String(scene[key]));
    hint.textContent=auto?'↳ Selected: '+resolvedName:'';
    hint.hidden=!auto;
    // The narrow mobile toolbar has space for a single line. Put the Auto
    // selection inside the native select, not an extra line beneath it.
    if(key==='family'){
      const autoOption=Array.from(select.options).find(o=>o.value==='auto');
      if(autoOption)autoOption.textContent=auto?'Auto · '+resolvedName:'Surprise me';
      select.title=auto?'Starting style: '+resolvedName:'Starting style';
    }
  }
}

// One unobtrusive lock control is added beside every editable setting.
function makeSettingLock(key,host){
  const button=document.createElement('button');
  button.type='button';button.className='setting-lock';button.dataset.lockKey=key;
  button.addEventListener('click',event=>{
    event.preventDefault();event.stopPropagation();
    const next={...current,lockedSettings:[...current.lockedSettings],lockedResolved:{...current.lockedResolved}};
    const locked=next.lockedSettings.includes(key);
    if(locked){
      next.lockedSettings=next.lockedSettings.filter(k=>k!==key);
      delete next.lockedResolved[key];
    }else{
      next.lockedSettings.push(key);
      if(autos.includes(key)&&current[key]==='auto'){
        next.lockedResolved[key]=currentScene[key];
      }
    }
    changeRecipe(next,{bypassLocks:true});
  });
  host.append(button);
  if(!settingLockButtons.has(key))settingLockButtons.set(key,[]);
  settingLockButtons.get(key).push(button);
}
function installSettingLocks(){
  for(const key of FIELDS){
    // Prime mode is an ephemeral randomization modifier, not a design lock.
    if(key==='primesOnly'||key==='textureLayer2Enabled'||key==='textureLayer3Enabled')continue;
    const field=form.elements.namedItem(key);
    const label=field.closest('label');
    if(label){
      const wrapper=document.createElement('div');wrapper.className='lockable-setting';
      label.parentNode.insertBefore(wrapper,label);
      wrapper.append(label);
      makeSettingLock(key,wrapper);
    }else{
      const rotation=field.closest('.texture-rotation-field');
      if(rotation){rotation.classList.add('lockable-setting');makeSettingLock(key,rotation);}
    }
  }
  const seedGroup=seedInput.closest('.seed-group');
  const seedRow=document.createElement('div');seedRow.className='seed-lock-row';
  seedGroup.parentNode.insertBefore(seedRow,seedGroup);seedRow.append(seedGroup);
  makeSettingLock('seed',seedRow);
  makeSettingLock('position',document.querySelector('.positioner-description'));
}
const LOCK_ICON={
  locked:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
  // Keep the shackle attached at the left hinge and rotate it clearly away.
  unlocked:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" transform="rotate(-48 8 10)"/></svg>',
};
function syncSettingLocks(){
  const locked=new Set(current.lockedSettings);
  for(const [key,buttons] of settingLockButtons){
    for(const button of buttons){
      button.innerHTML=locked.has(key)?LOCK_ICON.locked:LOCK_ICON.unlocked;
      button.setAttribute('aria-pressed',String(locked.has(key)));
      button.setAttribute('aria-label',(locked.has(key)?'Unlock ':'Lock ')+key);
      button.title=locked.has(key)?'Locked. Click to allow changes.':'Unlocked. Click to protect this setting.';
      button.classList.toggle('is-locked',locked.has(key));
    }
    if(key==='position')continue;
    const field=key==='seed'?seedInput:form.elements.namedItem(key);
    if(!field)continue;
    field.disabled=locked.has(key);
    if(key==='seed')document.getElementById('applySeed').disabled=locked.has(key);
    if(field.type==='range'){
      const wrapper=field.closest('.lockable-setting');
      if(wrapper){
        for(const el of wrapper.querySelectorAll('.step-button,.slider-number'))el.disabled=locked.has(key);
      }
    }
    if(key.startsWith('textureLayer')&&key.endsWith('Enabled')){
      const n=key.includes('2')?'2':'3';
      document.getElementById('addTextureLayer'+n).disabled=locked.has(key);
      document.getElementById('removeTextureLayer'+n).disabled=locked.has(key);
    }
    if(key.startsWith('textureRotation')){
      for(const btn of document.querySelectorAll('[data-rotate-target="'+key+'"]'))btn.disabled=locked.has(key);
    }
  }
  for(const button of document.querySelectorAll('[data-nudge]')){
    button.disabled=locked.has('position') || (button.dataset.nudge==='reset' && current.positionX===0 && current.positionY===0);
  }
}
installSettingLocks();
const editor=mountEditor();
const explorationHistory=installExplorationHistory({
  form,preview,getRecipe:()=>current,
  restore:recipe=>changeRecipe(recipe,{bypassLocks:true}),
});


// Six category tabs control which named tool is shown. Navigation is a view
// preference, independent of the recipe and preview/export geometry. Their selection is a view preference,
// never part of the design recipe and never triggers image regeneration.
const settingsTabs=Array.from(document.querySelectorAll('.settings-tab'));
const TAB_NAMES=settingsTabs.map(button=>button.dataset.tab);
function activateSettingsTab(tabName,{focus=false}={}){
  const name=TAB_NAMES.includes(tabName)?tabName:TAB_NAMES[0];
  for(const button of settingsTabs){
    const active=button.dataset.tab===name;
    button.setAttribute('aria-selected',String(active));
    button.tabIndex=active?0:-1;
    const panel=document.getElementById(button.getAttribute('aria-controls'));
    panel.hidden=!active;
    if(active && focus)button.focus();
  }
  document.dispatchEvent(new CustomEvent('editor-category-change',{detail:name}));
  try{sessionStorage.setItem('wallgen:settings-tab:v2',name);}catch{}
}
for(const button of settingsTabs){
  button.addEventListener('click',()=>activateSettingsTab(button.dataset.tab));
  button.addEventListener('keydown',event=>{
    const index=TAB_NAMES.indexOf(button.dataset.tab);
    let target;
    if(event.key==='ArrowRight')target=TAB_NAMES[(index+1)%TAB_NAMES.length];
    else if(event.key==='ArrowLeft')target=TAB_NAMES[(index-1+TAB_NAMES.length)%TAB_NAMES.length];
    else if(event.key==='Home')target=TAB_NAMES[0];
    else if(event.key==='End')target=TAB_NAMES.at(-1);
    else if(event.key==='ArrowDown' && window.matchMedia('(max-width:790px)').matches)
      target=TAB_NAMES[(index+3)%TAB_NAMES.length];
    else if(event.key==='ArrowUp' && window.matchMedia('(max-width:790px)').matches)
      target=TAB_NAMES[(index+TAB_NAMES.length-3)%TAB_NAMES.length];
    else return;
    event.preventDefault();
    activateSettingsTab(target,{focus:true});
  });
}
let rememberedTab='layout';
try{rememberedTab=sessionStorage.getItem('wallgen:settings-tab:v2')||'layout';}catch{}
activateSettingsTab(rememberedTab);

// Scope-aware exploration. One die changes exactly its setting; a tool die
// changes only that tool; a category die only that category. Locks and dormant
// controls are honoured by the same model shared with a future Wizard Mode.
form.addEventListener('click',event=>{
  const button=event.target.closest('[data-random-setting],[data-random-tool],[data-random-category]');
  if(!button||button.disabled)return;
  event.preventDefault();
  const scope=button.dataset.randomSetting?'setting':
    button.dataset.randomTool?'tool':'category';
  const name=button.dataset.randomSetting||button.dataset.randomTool||button.dataset.randomCategory;
  const mode=document.getElementById('editorVariationMode').value;
  const strength=document.getElementById('editorVariationStrength').value;
  const {recipe,modified}=randomizeScope(current,{
    scope,name,mode,strength,seed:newSeed(),
    control:key=>form.elements.namedItem(key),
  });
  if(!modified.length){showNotice('No unlocked, applicable settings changed.');return;}
  explorationHistory.remember(current,'Before '+name);
  changeRecipe(recipe);
  explorationHistory.remember(current,(mode==='vary'?'Vary ':'Reroll ')+name);
  showNotice((mode==='vary'?'Varied ':'Rerolled ')+name.replace(/-/g,' ')+' ('+modified.length+' settings).');
});
form.addEventListener('change',event=>{
  if(event.target.name!=='family')return;
  const family=event.target.value,defaults=STYLE_PRESETS[family];
  if(!defaults)return;
  // Convert the starting style to inspectable values. It never acts as a
  // hidden multiplier after the player manually edits a field.
  changeRecipe({...current,family,...defaults});
},true);
let rangeTimeout;
form.addEventListener('input',event=>{
  const key=event.target.name;
  if(!FIELDS.includes(key))return;
  const output=form.querySelector(`output[for="${key}"]`);
  if(output)output.textContent=`${event.target.value}%`;
  if(event.target.type==='range'){
    const numeric=form.querySelector(`[data-number-for="${key}"]`);
    if(numeric)numeric.value=event.target.value;
  }
  if(event.target.type==='range'){
    clearTimeout(rangeTimeout);
    rangeTimeout=setTimeout(updateControlsFromInputs,60);
  }else {
    syncTextureLayerVisibility();
    syncStripeShadowUI();
    syncDiagonalUI();
    updateControlsFromInputs();
  }
});
form.addEventListener('change',()=>{clearTimeout(rangeTimeout);updateControlsFromInputs();});
form.addEventListener('submit',event=>event.preventDefault());
seedInput.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();render(fromControls());}});
document.getElementById('applySeed').addEventListener('click',()=>render(fromControls()));
document.getElementById('randomize').addEventListener('click',()=>{
  explorationHistory.remember(current,'Before seed');
  changeRecipe({...fromControls(),seed:newSeed()});
  explorationHistory.remember(current,'New seed');
});
document.getElementById('randomizeAll').addEventListener('click',()=>{
  explorationHistory.remember(current,'Before Random');
  changeRecipe({...randomizeAllRecipe({primesOnly:current.primesOnly}),viewZoom:current.viewZoom,geometrySafety:current.geometrySafety});
  explorationHistory.remember(current,'Random');
});
// Optional material layers activate by selecting an actual material, with
// 'No texture / smooth' acting as their explicit off state.
for(const n of [2,3]){
  form.elements.namedItem('material'+n).addEventListener('change',event=>{
    const next=fromControls();
    const enabled=event.target.value!=='none';
    next['material'+n]=event.target.value;
    next['textureLayer'+n+'Enabled']=enabled;
    // Material 3 may be used while material 2 remains smooth/off.
    changeRecipe(next);
  });
}
for(const button of document.querySelectorAll('[data-rotate-target]')){
  button.addEventListener('click',()=>{
    const recipe=fromControls();
    const key=button.dataset.rotateTarget;
    recipe[key]=button.dataset.rotateSet!==undefined?Number(button.dataset.rotateSet):Number(recipe[key])+Number(button.dataset.rotateDelta);
    changeRecipe(recipe);
  });
}
document.getElementById('undo').addEventListener('click',undo);
document.getElementById('download').addEventListener('click',downloadPNG);
document.getElementById('copyRecipe').addEventListener('click',()=>copyText(JSON.stringify(current,null,2)));
document.getElementById('copyLink').addEventListener('click',()=>copyText(location.href));
document.getElementById('downloadRecipe').addEventListener('click',()=>downloadBlob(new Blob([JSON.stringify(current,null,2)+'\n'],{type:'application/json'}),`roygbiv-${safeFilename(current.seed)}.json`));
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
  const sub=document.createElement('span');sub.className='thumb-sub';sub.textContent=`${titleCase(scene.materialSummary)} · ${scene.orientation}`;
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
