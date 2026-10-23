import { OUTPUT_WIDTH, OUTPUT_HEIGHT, NAMES, normalizeRecipe, resolveScene, encodeRecipe, decodeRecipe, newSeed, randomizeAllRecipe, respectSettingLocks, LOCKABLE_SETTINGS } from './model.js';
import { drawWallpaper, presentNudgedArtwork } from './renderer.js?v=20261022-photo1';
import {normalizePhotoLook,PHOTO_PRESETS} from './photo-look.js';
import {photoPreviewRecipe} from './photo-preview-compare.js';
import {createPreviewCoordinator,createThumbnailQueue,exportWallpaperInWorker,closeFrame} from './render-coordinator.js';
import { embedPngMetadata, extractPngRecipeWithProvenance, cleanMetadata, METADATA_FIELDS } from './png-metadata.js';
import {inspectPngMigration,migratePngMetadataOnly,inspectPngRecipeArchive,archivePngRecipeRecords} from './png-recipe-migration.js';
import { installDrawTool } from './draw-path-ui.js?v=20261018-extend1';
import {appliedDrawnPathRecipe} from './draw-apply-transaction.js';
import { installImagePathTool } from './image-path-ui.js?v=20261023-inferred-source1';
import {importedAngleDeltaDegrees} from './import-angle-wrap.js';
import {pathStructureLockedOutsidePaths} from './path-authoring-locks.js';
import {mountEditor,selectEditorTool,syncEditorStructure} from './editor-layout.js?v=20261022-search-choice1';
import {randomizeScope} from './scoped-random.js';
import {newInteriorElementId,INTERIOR_LIMITS,resolveInteriorSelection,interiorTargetSummary,resolveInteriorFocusTarget,interiorSliderStep} from './interior-elements.js';
import {STYLE_PRESETS,EDITOR_CATEGORIES,TOOL_LIST} from './editor-schema.js?v=20261021-labels1';
import {sourceSettingLabel} from './editor-control-roles.js?v=20261021-labels1';
import {fullSettingName} from './editor-terminology.js';
import {installExplorationHistory} from './exploration-history.js';
import {installGeometryLibraryUI} from './geometry-library-ui.js';
import {RAINBOW_ORBITS,scatteredRadiusRange} from './scattered-composition.js';
import {stripeContourDistortionAvailability} from './editor-effect-availability.js';
import {normalizeScatteredOverrides,effectiveScatteredLayerOrder,moveScatteredLayer} from './scattered-object-edits.js';
import {embroideryObjectChoices,resolveEmbroideryObjectChoice,reconcileEmbroideryObjectOptions} from './embroidery-target-choices.js';
import {scatteredPixelToWorld,scatteredWorldToPixel,pickScatteredRegion,scatteredMoveOverride,clamp as clampScattered} from './scattered-drag.js';
import {cloneGeometrySnapshot} from './geometry-asset.js';
import {parseStoredFavorites} from './favorites-store.js';
import {encodePortableRecipe,decodePortableRecipe,portableShareUrl,portableShareTokenFromLocation,
  MAX_PORTABLE_LINK_CHARS} from './share-recipe.js';
import {iconMarkup,setIconSource,hydrateStaticIcons} from './ui-icons.js';
import {createCreativeRecorder,openUsageStore,USAGE_MODE_KEY} from './creative-recorder.js';
import {installCreativeRecorderUI} from './creative-recorder-ui.js';
import {installCreativeFeedback} from './creative-feedback.js';

const form = document.getElementById('controls');
const preview = document.getElementById('preview');
const seedInput = document.getElementById('seedInput');
const gallery = document.getElementById('gallery');
const notice = document.getElementById('notice');
const studioStatus = document.getElementById('studioStatus');
const favoriteButton = document.getElementById('favorite');
const FAVORITES_KEY = 'wallgen:favorites:v1';
const FIELDS = ['primesOnly','family','structure','radialMode','rayCount','rayRotation','rayTwist','rayCoverage','rayCore','fieldCenterX','fieldCenterY','regionMode','regionCount','regionJitter','regionSides','scatteredCount','scatteredMinSize','scatteredMaxSize','scatteredVariation','scatteredSpacing','scatteredEdgeCrop','scatteredOverlap','scatteredShapeKind','dividerColor','dividerWidth','composition','repeatCount','repeatSpacing','orientation','reverseStripes','diagonalRotation','mirrorHorizontal','mirrorVertical','geometry','turnRadius','hairpinAngle','loopRadius','loopSweep','geometrySafety','extendDrawnPath','crossingMode','stepCount','chevronSharpness','loopAspect','construction','motif','lineStyle','pathLength','tonalContrast','brushRoughness','dotSize','dotSpacing','endTaper','shapeFrequency','shapeDepth','motifSize','motifFrequency','palette','material','outline','background','lightingMood','lightDirection','lightStrength','shadowStrength','stripeShadowStrength','stripeShadowSoftness','stripeShadowDirection','textureCoverage','textureRotation','textureBlend','textureLayer2Enabled','material2','textureCoverage2','textureStrength2','textureScale2','textureRotation2','textureBlend2','textureLayer3Enabled','material3','textureCoverage3','textureStrength3','textureScale3','textureRotation3','textureBlend3','chaos','stripeWidth','spread','textureStrength','textureScale','textureDisplacement','individuality','patternHomogeneity','overridePatternHomogeneity','gap','outlineBuffer','glow'];
let current = normalizeRecipe();
let usageRecorder=null; // Initialized after first render; no default collection.
let usageGitHubSync=null;
let creativeFeedback=null;
let currentScene;
const previewLayers={background:null,ink:null,scene:null,key:null,overhang:null};
let previewWorker=null;
let previewPainted=false;
let settledPreviewTimer=null;
// Compare uses the cached composed artwork and never commits a recipe change.
const photoCompareButton=form.querySelector('[data-photo-compare]');
let photoBeforeActive=false;
const canComparePhoto=()=>Boolean(current.photoLook?.enabled&&
  current.photoLook.amount>0&&previewLayers.key===artKey(current)&&
  previewLayers.background&&previewLayers.ink);
const previewDisplayRecipe=()=>photoPreviewRecipe(current,photoBeforeActive);
function syncPhotoCompareButton(){
  photoCompareButton.disabled=!canComparePhoto();
  photoCompareButton.setAttribute('aria-pressed',String(photoBeforeActive));
  photoCompareButton.textContent=photoBeforeActive?'After':'Before';
  photoCompareButton.title=photoBeforeActive?
    'Show the finished photo effect':'Show the original before photo finishing';
}
const clearSettledPreview=()=>{
  if(settledPreviewTimer!==null)clearTimeout(settledPreviewTimer);
  settledPreviewTimer=null;
};
function releasePreviewLayers(){
  for(const layer of ['background','ink']){
    try{previewLayers[layer]?.close?.();}catch{}
    previewLayers[layer]=null;
  }
  previewLayers.key=null;
}
function previewPresented(){
  syncPhotoCompareButton();
  preview.dataset.renderPending='false';
  preview.removeAttribute('aria-busy');
  preview.dispatchEvent(new CustomEvent('roygbiv-preview-presented',{
    detail:{key:previewLayers.key,worker:!!previewWorker?.enabled}
  }));
}
function mainThreadPreview(){
  releasePreviewLayers();
  currentScene=drawWallpaper(preview,current,{cache:previewLayers});
  previewLayers.key=artKey(current);
  if(photoBeforeActive)presentNudgedArtwork(preview,previewLayers,previewDisplayRecipe());
  previewLayers.scene=currentScene;
  previewPainted=true;
  previewPresented();
}
function startPreviewWorker(){
  if(previewWorker)return previewWorker;
  previewWorker=createPreviewCoordinator({
    onFrame:message=>{
      // The coordinator rejects obsolete revisions, but the underlying
      // recipe may also have changed through Undo or a cached nudge.
      if(message.key!==artKey(current)){closeFrame(message);return;}
      if(message.quality==='interactive'){
        // A worker's reduced-quality frame already has its Photo finish.
        // Keep an active Before view untouched until the settled cached ink arrives.
        if(photoBeforeActive){closeFrame(message);return;}
        // Upscale temporary ink, but never mark a reduced-resolution frame
        // as the definitive, reusable nudge cache.
        const ctx=preview.getContext('2d',{alpha:false});
        ctx.setTransform(1,0,0,1,0,0);
        ctx.drawImage(message.frame,0,0,preview.width,preview.height);
        closeFrame(message);
        preview.dispatchEvent(new CustomEvent('roygbiv-preview-interactive'));
        return;
      }
      releasePreviewLayers();
      previewLayers.background=message.background;
      previewLayers.ink=message.ink;
      previewLayers.overhang=message.overhang;
      previewLayers.key=message.key;
      previewLayers.scene=resolveScene(current);
      presentNudgedArtwork(preview,previewLayers,previewDisplayRecipe());
      previewPresented();
    },
    onFailure:reason=>{
      // Preserve editing and the exact reference renderer if worker startup,
      // 2D context creation, image transfer, or GPU resources fail.
      console.warn('ROYGBIV preview worker fallback:',reason);
      mainThreadPreview();
    }
  });
  return previewWorker;
}
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
let explorationRecipes = null; // Last contact sheet is retained across Saved visits.
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
  try{changeRecipe(previous,{bypassLocks:true,cause:'undo'});showNotice('Undid last design change.');}finally{undoing=false;updateUndoButton();}
}

function readFavorites() {
  try {return parseStoredFavorites(localStorage.getItem(FAVORITES_KEY));}
  catch {return [];} // Storage access can be denied independently of parsing.
}
let sessionOnlyFavorites=false;
function syncFavoriteIndicators(){
  const selected=isFavorite(current);
  favoriteButton.setAttribute('aria-pressed',String(selected));
  favoriteButton.setAttribute('aria-label',selected?'Remove from favourites':'Add to favourites');
  favoriteButton.title=selected?'Remove from favourites':'Add to favourites';
  setIconSource(favoriteButton,selected?'favourite-filled':'favourite');
  document.getElementById('favoriteCount').textContent=String(favorites.length);
}
function reconcileFavoritesFromStorage(){
  // Never erase a session-only favourite when storage writes were denied.
  // An external storage event explicitly supersedes that temporary state.
  if(sessionOnlyFavorites)return false;
  let saved;
  try{saved=parseStoredFavorites(localStorage.getItem(FAVORITES_KEY));}
  catch{return false;}
  if(JSON.stringify(saved)===JSON.stringify(favorites))return false;
  favorites=saved;
  syncFavoriteIndicators();
  return true;
}
function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY,JSON.stringify(favorites));
    sessionOnlyFavorites=false;
  }catch{
    sessionOnlyFavorites=true;
    showNotice('Browser storage unavailable; favourites last for this visit.');
  }
}
// Storage events can arrive during an asynchronous thumbnail contact sheet;
// its final paint independently reconciles the current shared storage state.
window.addEventListener('storage',event=>{
  if(event.key!==FAVORITES_KEY&&event.key!==null)return;
  sessionOnlyFavorites=false;
  if(reconcileFavoritesFromStorage()&&gallery.dataset.view==='saved')void showSaved();
});
window.addEventListener('focus',()=>{
  if(reconcileFavoritesFromStorage()&&gallery.dataset.view==='saved')void showSaved();
});
function sameRecipe(a,b){return JSON.stringify(normalizeRecipe(a))===JSON.stringify(normalizeRecipe(b));}
function isFavorite(recipe){return favorites.some(item=>sameRecipe(item,recipe));}
function showNotice(message){
  notice.textContent=message;
  if(studioStatus){
    studioStatus.textContent=message;
    studioStatus.classList.add('is-visible');
  }
  clearTimeout(noticeTimer);
  noticeTimer=setTimeout(()=>{
    if(notice.textContent===message)notice.textContent='';
    if(studioStatus?.textContent===message){
      studioStatus.textContent='';
      studioStatus.classList.remove('is-visible');
    }
  },5500);
}
function syncPhotoSecondarySlot(presetId){
  // Exactly one secondary slider is visible: keep the compact phone tray's
  // two-column geometry while letting the chosen optical look be adjusted.
  const active=['film-halation-only','film-halation-diffusion'].includes(presetId);
  form.querySelector('[data-photo-secondary="grain"]').hidden=active;
  form.querySelector('[data-photo-secondary="halation"]').hidden=!active;
}
function fromControls() {
  const data={seed:seedInput.value,positionX:current.positionX,positionY:current.positionY,
    viewZoom:current.viewZoom,viewPanX:current.viewPanX,viewPanY:current.viewPanY,
    customPath:current.customPath,drawnAnchors:current.drawnAnchors,drawnCorners:current.drawnCorners,interiorElements:current.interiorElements,
    scatteredShape:current.scatteredShape,scatteredOverrides:current.scatteredOverrides,
    scatteredLayerOrder:current.scatteredLayerOrder};
  for (const key of FIELDS) { const field=form.elements.namedItem(key); data[key]=field.dataset.inactive==='true'?current[key]:(field.type==='checkbox'?field.checked:field.value); }
  // A single nested recipe travels in links, saved designs, PNG and workers.
  // Do not add an Off-only Photo key to untouched legacy recipes.
  const prior=current.photoLook;
  const presetId=form.elements.namedItem('photoPresetId').value;
  const samePreset=prior?.presetId===presetId;
  const photo=normalizePhotoLook({
    enabled:form.elements.namedItem('photoEnabled').checked,
    presetId,amount:form.elements.namedItem('photoAmount').value,
    parameters:{...(samePreset?prior.parameters:{}),
      grain:Number(form.elements.namedItem('photoGrain').value),
      ...(['film-halation-only','film-halation-diffusion'].includes(presetId)?{
        halation:Number(form.elements.namedItem('photoHalation').value)}:{})},
  });
  if(prior||photo.enabled||presetId!=='film-slide'||photo.amount!==75||
    photo.parameters.grain!==PHOTO_PRESETS['film-slide'].grain)data.photoLook=photo;
  // Treat editor stitches as one managed assignment; preserve externally
  // authored object-specific assignments instead of flattening them.
  const otherTreatments=(current.surfaceTreatments||[])
    .filter(item=>item.id!=='editor-stitches');
  const target=form.elements.namedItem('embroideryTarget').value;
  const regionAngleField=form.elements.namedItem('embroideryDirection');
  const savedThread=current.surfaceTreatments?.find(item=>item.id==='editor-stitches');
  const regionAngle=regionAngleField.value.trim()===''?
    (savedThread?.direction??38):Number(regionAngleField.value);
  if(target!=='off'){
    otherTreatments.unshift({
      id:'editor-stitches',enabled:true,materialFamily:'embroidery',
      style:form.elements.namedItem('embroideryStyle').value,
      target:target==='all'?{scope:'all',role:'fill',colorSlots:[],ids:[]}:
        target==='object'?{scope:'object',role:'fill',colorSlots:[],
          ids:[form.elements.namedItem('embroideryObjectId').value].filter(Boolean)}:
        {scope:'palette',role:'fill',colorSlots:[Number(target)],ids:[]},
      pitch:Number(form.elements.namedItem('embroideryPitch').value),
      relief:Number(form.elements.namedItem('embroideryRelief').value),
      direction:regionAngle,
    });
  }
  if(current.surfaceTreatments||otherTreatments.length)
    data.surfaceTreatments=otherTreatments;
  return normalizeRecipe(data);
}
function syncScopedSettingDice(){
  // The form's first URL import calls toControls() directly, not
  // changeRecipe(). Keep each miniature die truthful from the first paint,
  // even when the source slider is already locked or dormant. Safety is an
  // editorial guardrail: randomizeScope intentionally NEVER flips it.
  for(const die of form.querySelectorAll('[data-random-setting]')){
    const key=die.dataset.randomSetting;
    const field=form.elements.namedItem(key);
    const editorial=key==='geometrySafety';
    const unavailable=!field||field.disabled||field.dataset.inactive==='true';
    die.disabled=editorial||unavailable;
    if(editorial){
      die.title='Safety is never randomized. Change Constraints manually.';
      die.setAttribute('aria-label','Safety is not randomized; adjust Constraints manually');
    }else{
      const mode=document.getElementById('editorVariationMode')?.value;
      die.title=unavailable?'Setting is unavailable or locked':
        (mode==='vary'?'Vary':'Reroll')+' only '+
          fullSettingName(key,sourceSettingLabel(field,key));
    }
  }
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
  const photo=normalizePhotoLook(current.photoLook);
  form.elements.namedItem('photoEnabled').checked=photo.enabled;
  form.elements.namedItem('photoPresetId').value=photo.presetId;
  for(const [name,value] of [['photoAmount',photo.amount],['photoGrain',photo.parameters.grain],
    ['photoHalation',photo.parameters.halation??PHOTO_PRESETS['film-halation-only'].halation]]){
    form.elements.namedItem(name).value=String(value);
    const numeric=form.querySelector('[data-number-for="'+name+'"]');
    if(numeric)numeric.value=String(value);
  }
  syncPhotoSecondarySlot(photo.presetId);
  if(!photo.enabled||photo.amount===0)photoBeforeActive=false;
  syncPhotoCompareButton();
  const stitch=current.surfaceTreatments?.find(item=>item.id==='editor-stitches'&&item.enabled);
  const selected=stitch?.target.scope==='all'?'all':
    stitch?.target.scope==='object'?'object':
    stitch?.target.scope==='palette'&&stitch.target.colorSlots.length===1?
      String(stitch.target.colorSlots[0]):'off';
  const objectField=form.querySelector('.embroidery-object-picker');
  const objectSelect=form.elements.namedItem('embroideryObjectId');
  const choices=embroideryObjectChoices(currentScene||resolveScene(current));
  const requested=stitch?.target.scope==='object'?stitch.target.ids[0]:objectSelect.value;
  const {selected:objectId,options:objectChoices}=
    resolveEmbroideryObjectChoice(choices,requested);
  reconcileEmbroideryObjectOptions(objectSelect,objectChoices,objectId);
  objectField.hidden=selected!=='object';
  const targetSelect=form.elements.namedItem('embroideryTarget');
  const byObject=targetSelect.querySelector('option[value="object"]');
  if(byObject)byObject.disabled=!choices.length&&selected!=='object';
  targetSelect.value=selected;
  form.elements.namedItem('embroideryStyle').value=stitch?.style??'satin';
  const regionAngleInput=form.elements.namedItem('embroideryDirection');
  regionAngleInput.value=String(stitch?.direction??38);
  regionAngleInput.disabled=current.structure==='paths';
  regionAngleInput.title=regionAngleInput.disabled?
    'Region stitch angle applies to circles and regions, not path-following ribbons':
    'Turn the regional stitch direction in degrees';
  const threadSummary=form.querySelector('.thread-treatment-summary');
  if(threadSummary)threadSummary.textContent=selected==='off'?'Off':
    selected==='all'?'All colours':selected==='object'?
      'One object · '+(objectChoices.find(choice=>choice.id===objectId)?.label||'unavailable'):
      NAMES[Number(selected)];
  for(const [name,value] of [['embroideryPitch',stitch?.pitch??5],['embroideryRelief',stitch?.relief??65]]){
    form.elements.namedItem(name).value=String(value);
    const numeric=form.querySelector('[data-number-for="'+name+'"]');
    if(numeric)numeric.value=String(value);
  }
  syncTextureLayerVisibility();
  syncStripeShadowUI();
  syncDiagonalUI();
  syncSettingLocks();
  syncInactiveSettings();
  syncScopedSettingDice();
  syncEditorStructure(current.structure,current.regionMode,current.construction);
  const useShape=document.getElementById('chooseScatteredShape');
  if(useShape)useShape.hidden=!(current.structure==='regions'&&current.regionMode==='scattered');
  const effective=document.getElementById('geometrySafetyStatus');
  if(effective){
    if(current.structure!=='paths')effective.textContent='Closed regions use connected polygon boundaries';
    else if(!current.geometrySafety)effective.textContent='Unrestricted: intersections, overlaps and cropping permitted';
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
  const paths=recipe.structure==='paths',radial=recipe.structure==='radial',regions=recipe.structure==='regions';
  if(!paths){
    for(const key of ['composition','repeatCount','repeatSpacing','orientation',
      'diagonalRotation','mirrorHorizontal','mirrorVertical','geometry','geometrySafety',
      'crossingMode','turnRadius','hairpinAngle','loopRadius','loopSweep','stepCount',
      'chevronSharpness','loopAspect','shapeFrequency','shapeDepth','pathLength','endTaper',
      'construction','motif','lineStyle','patternHomogeneity','overridePatternHomogeneity',
      'tonalContrast','brushRoughness','dotSize','dotSpacing','motifSize','motifFrequency',
      'stripeWidth','spread','individuality','chaos','outline','gap','outlineBuffer','textureDisplacement'])inactive.add(key);
  }
  if(!radial){
    for(const key of ['radialMode','rayCount','rayRotation','rayTwist','rayCoverage','rayCore'])inactive.add(key);
  }else{
    if(!['pinwheel','starburst'].includes(recipe.radialMode))inactive.add('rayTwist');
    if(recipe.radialMode==='concentric')inactive.add('rayCoverage'),inactive.add('rayCore');
    if(recipe.radialMode==='spokes')inactive.add('rayTwist');
  }
  if(!regions){
    for(const key of ['regionMode','regionCount','regionJitter','regionSides','scatteredCount','scatteredMinSize','scatteredMaxSize','scatteredVariation','scatteredSpacing','scatteredEdgeCrop','scatteredOverlap','scatteredShapeKind'])inactive.add(key);
  }else{
    if(recipe.regionMode!=='nested')inactive.add('regionSides');
    if(recipe.regionMode==='nested'||recipe.regionMode==='scattered')inactive.add('regionJitter');
    if(recipe.regionMode==='scattered'){
      inactive.add('regionCount');
      // The packing algorithm explicitly ignores clearance when overlap is
      // allowed. Visually disable its slider, retaining the saved preference.
      if(recipe.scatteredOverlap==='overlap')inactive.add('scatteredSpacing');
    }
    else for(const key of ['scatteredCount','scatteredMinSize','scatteredMaxSize','scatteredVariation','scatteredSpacing','scatteredEdgeCrop','scatteredOverlap','scatteredShapeKind'])inactive.add(key);
  }
  if(!(radial||(regions&&recipe.regionMode==='nested'))){
    inactive.add('fieldCenterX');inactive.add('fieldCenterY');
  }
  if(paths){inactive.add('dividerColor');inactive.add('dividerWidth');}
  else if(recipe.dividerColor==='none')inactive.add('dividerWidth');
  // The renderer samples relief only from effective layers applied to stripes.
  // Use resolveScene's filtered layers so optional/zero-strength/background-only
  // materials never leave an apparently functional but inert slider.
  if(!stripeContourDistortionAvailability(scene).available)
    inactive.add('textureDisplacement');
  // Decorative motifs have separate size/density knobs; straight geometry
  // never has curve frequency/depth, even when marked with chevrons.
  if(['straight','hairpin','loop','drawn'].includes(scene.geometry))
    inactive.add('shapeFrequency'),inactive.add('shapeDepth');
  if(scene.geometry==='drawn')inactive.add('orientation');
  else inactive.add('extendDrawnPath');
  if(recipe.composition==='floating')inactive.add('extendDrawnPath');
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
  const scene=currentScene||resolveScene(current);
  const inactive=inactiveSettingKeys(current,scene);
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
      // A native range clamps an attempted zero to its minimum (7 for
      // region/ray counts). Temporarily expand only the inactive control's
      // visual range; restore its exact authored minimum on reactivation.
      // This is presentation-only: current[key] and the serialized recipe
      // retain their actual value throughout the inactive interval.
      if(isInactive && Number(field.min)>0){
        if(field.dataset.activeMin===undefined)
          field.dataset.activeMin=field.getAttribute('min')||'';
        field.min='0';
      }else if(!isInactive && field.dataset.activeMin!==undefined){
        if(field.dataset.activeMin)field.min=field.dataset.activeMin;
        else field.removeAttribute('min');
        delete field.dataset.activeMin;
      }
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
  // Explain the otherwise surprising zero value without changing the recipe.
  const distortion=form.elements.namedItem('textureDisplacement');
  if(distortion){
    const state=stripeContourDistortionAvailability(scene);
    const field=distortion.closest('label');
    let reason=document.getElementById('contourDistortionRequirement');
    if(field){
      if(!reason){
        reason=document.createElement('p');
        reason.id='contourDistortionRequirement';
        reason.className='editor-effect-gate';
      }
      if(reason.previousElementSibling!==field)field.after(reason);
      reason.textContent=state.reason;
      reason.hidden=state.available||current.structure!=='paths';
      if(reason.hidden)distortion.removeAttribute('aria-describedby');
      else distortion.setAttribute('aria-describedby',reason.id);
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
let retainedPortableToken=null,retainedPortableRecipe=null;
function syncURL() {
  try {
    const url=new URL(location.href);
    if(retainedPortableToken&&retainedPortableRecipe&&
       sameRecipe(current,retainedPortableRecipe)){
      // A self-contained compact link must not immediately rewrite its
      // fragment as a giant query the static host might reject.
      url.searchParams.delete('r');
      url.hash='s='+retainedPortableToken;
    }else{
      retainedPortableToken=retainedPortableRecipe=null;
      if(portableShareTokenFromLocation(url))url.hash='';
      url.searchParams.set('r',encodeRecipe(current));
    }
    history.replaceState(null,'',url);
  } catch { /* Local file previews may prohibit History API. */ }
}
function titleCase(value){return value.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());}
function render(recipe,{scroll=false,bypassLocks=false,interactive=false,cause='edit',record=true}={}) {
  const next=bypassLocks?normalizeRecipe(recipe):respectSettingLocks(current,recipe);
  const previous=current;
  current=checkpoint(next);
  if(record)usageRecorder?.transition(previous,current,{cause,context:{
    category:document.querySelector('.settings-tab[aria-selected="true"]')?.dataset.tab||null
  }});
  // Primes Only is reflected by its selected control; no transient message.
  const key=artKey(current);
  currentScene=resolveScene(current);
  const scatterStatus=document.getElementById('scatteredStatus');
  if(scatterStatus){
    const missing=current.structure==='regions'&&current.regionMode==='scattered'?
      current.scatteredCount-currentScene.objects.length:0;
    const noAsset=current.structure==='regions'&&current.regionMode==='scattered'&&
      current.scatteredShapeKind==='imported'&&!current.scatteredShape;
    scatterStatus.textContent=noAsset?'Showing temporary circles, not an imported silhouette. Choose a saved shape in Regions.':
      missing>0?'Only '+currentScene.objects.length+' of '+current.scatteredCount+
      ' shapes fit. Reduce size or spacing, or allow overlaps.':'';
    scatterStatus.hidden=!missing&&!noAsset;
  }
  const inScatter=current.structure==='regions'&&current.regionMode==='scattered';
  const missingSilhouette=inScatter&&current.scatteredShapeKind==='imported'&&!current.scatteredShape;
  const sourceHint=document.getElementById('scatteredSourceNotice');
  if(sourceHint){
    sourceHint.hidden=!missingSilhouette;
    sourceHint.textContent=missingSilhouette?
      'Circles are placeholders. Choose a saved silhouette to replace them.':'';
  }
  const sizeHint=document.getElementById('scatteredSizeRangeStatus');
  if(sizeHint){
    const range=inScatter?scatteredRadiusRange(current):null;
    sizeHint.textContent=range?.collapsed?
      'Smallest size is setting the effective maximum. Lower Smallest or raise Largest for variety.':
      range?.countCapped?
        'With this many shapes, Largest size is capped to keep placement feasible.':'';
    sizeHint.hidden=!sizeHint.textContent;
  }
  if(previewLayers.key===key && previewLayers.ink && previewLayers.background){
    clearSettledPreview();
    // Nudge and compositor-only changes remain immediate, even while an
    // older, expensive worker paint is winding down.
    previewWorker?.invalidate();
    presentNudgedArtwork(preview,previewLayers,previewDisplayRecipe());
    previewPresented();
  }else{
    clearSettledPreview();
    const scale=interactive?.62:1;
    const width=interactive?Math.max(160,Math.round(preview.width*scale)):preview.width;
    const height=interactive?Math.max(340,Math.round(preview.height*scale)):preview.height;
    if(previewPainted&&startPreviewWorker().request(current,key,width,height,
      {quality:interactive?'interactive':'settled'})){
      // Keep the last complete wallpaper visible while the newest request
      // renders, then settle at the exact screen resolution after dragging.
      preview.dataset.renderPending='true';
      preview.setAttribute('aria-busy','true');
      if(interactive)settledPreviewTimer=setTimeout(()=>{
        settledPreviewTimer=null;
        if(previewWorker?.enabled&&artKey(current)===key)
          previewWorker.request(current,key,preview.width,preview.height,
            {quality:'settled'});
      },170);
    }else mainThreadPreview();
  }
  // The frame always shows the exact resolution-independent export camera.
  const stage=document.querySelector('.studio-stage');
  stage.dataset.viewZoom=String(current.viewZoom);
  stage.dataset.viewPanX=String(current.viewPanX);
  stage.dataset.viewPanY=String(current.viewPanY);
  stage.dispatchEvent(new CustomEvent('roygbiv-view-zoom-updated',
    {detail:current.viewZoom}));
  stage.dispatchEvent(new CustomEvent('roygbiv-wallpaper-rendered',
    {detail:{background:current.background}}));
  updatePositionStatus();
  updateViewPanStatus();
  showResolvedSelections(currentScene);
  document.getElementById('detailFamily').textContent=titleCase(currentScene.family);
  document.getElementById('detailGeometry').textContent=titleCase(currentScene.structure==='paths'?
    currentScene.geometry:currentScene.structure==='radial'?currentScene.radialMode:currentScene.regionMode);
  document.getElementById('detailMaterial').textContent=titleCase(currentScene.materialSummary);
  favoriteButton.setAttribute('aria-pressed',String(isFavorite(current)));
  favoriteButton.setAttribute('aria-label',isFavorite(current)?'Remove from favourites':'Add to favourites');
  favoriteButton.title=isFavorite(current)?'Remove from favourites':'Add to favourites';
  setIconSource(favoriteButton,isFavorite(current)?'favourite-filled':'favourite');
  drawTool.sync(current);
  imagePathTool.sync(current);
  document.getElementById('favoriteCount').textContent=String(favorites.length);
  syncURL();
  if(scroll) document.querySelector('.workspace-head').scrollIntoView({behavior:'smooth',block:'start'});
}
function changeRecipe(recipe,options={}){
  if(pendingControlFrame){cancelAnimationFrame(pendingControlFrame);pendingControlFrame=0;}
  render(recipe,options);toControls(current);showResolvedSelections(currentScene);
  syncScatteredObjectEditor();
  const elementState=JSON.stringify([current.interiorElements,
    current.lockedSettings.includes('interiorElements')]);
  if(elementState!==lastInteriorState)syncInteriorUI();
  // Other inspectors (notably the optional Focus slider) share the ORIGINAL
  // form fields. Undo, randomize and import can rewrite them without a
  // bubbling native input/change event, so announce settled source state
  // after every recipe-driven form sync.
  document.dispatchEvent(new Event('roygbiv-controls-synced'));
}
document.querySelector('.studio-stage').addEventListener('roygbiv-view-zoom-request',event=>{
  changeRecipe({...current,viewZoom:event.detail});
});
// Fit restores the canonical centered camera, without altering the distinct
// composition nudge. The original zoom +/- event retains its scalar contract.
document.querySelector('.studio-stage').addEventListener('roygbiv-view-fit-request',()=>{
  changeRecipe({...current,viewZoom:1,viewPanX:0,viewPanY:0});
});
const drawTool=installDrawTool({
  getRecipe:()=>current,
  onNotice:showNotice,
  onApply:(points,anchors=[],corners=[],extended=false,preservePosition=false)=>{
    const next=appliedDrawnPathRecipe(fromControls(),points,anchors,corners,
      extended,preservePosition);
    changeRecipe(next);
    showNotice('Drawn path applied. Undo restores the previous wallpaper.');
  },
});
function applyImportedShape(geometry){
  if((current.lockedSettings.includes('structure')&&current.structure!=='regions')||
    (current.lockedSettings.includes('regionMode')&&current.regionMode!=='scattered')||
    (current.lockedSettings.includes('scatteredShapeKind')&&current.scatteredShapeKind!=='imported')){
    showNotice('Unlock structure, region layout and shape source before using a saved silhouette.');
    return false;
  }
  changeRecipe({...current,structure:'regions',regionMode:'scattered',
    scatteredShapeKind:'imported',scatteredShape:cloneGeometrySnapshot(geometry)});
  return true;
}
const imagePathTool=installImagePathTool({
  getRecipe:()=>current,
  onNotice:showNotice,
  onPath:path=>drawTool.loadPath(path),
  onShape:applyImportedShape,
  onRender:(recipe,canvas)=>drawWallpaper(canvas,recipe),
  onRecipe:(candidate,description)=>{
    // Exactly one standard Undo transaction. Locks are respected, including
    // otherwise dormant settings that the candidate wants to change.
    const effective=respectSettingLocks(current,candidate);
    const blocked=Object.keys(candidate).filter(key=>
      current.lockedSettings.includes(key)&&
      JSON.stringify(effective[key])!==JSON.stringify(candidate[key]));
    const inferred=normalizeRecipe({...candidate,reconstructionOrigin:{
      origin:'inferred-image',method:'current-render-fit-v1',
      candidateKind:description.kind,sourceWidth:description.sourceWidth,
      sourceHeight:description.sourceHeight,initialFitError:description.error
    }});
    changeRecipe(inferred,{cause:'image-reconstruction'});
    showNotice('Applied inferred '+description.kind+
      ' recipe (initial render error '+Number(description.error).toFixed(3)+
      '). This does not recover the original image settings. Undo restores the prior design.'+
      ((description.lockedChanges?.length||blocked.length)?
        ' Locked settings preserved: '+(description.lockedChanges||blocked).join(', ')+'.':''));
    return true;
  },
  onAngle:angle=>{
    // Rotation is relative to the resolved seed direction, not fixed at 45°.
    const base=fromControls();
    const keys=['orientation','diagonalRotation'];
    if(base.geometry==='drawn')keys.push('geometry');
    if(keys.some(key=>base.lockedSettings.includes(key))||
      pathStructureLockedOutsidePaths(base)){
      showNotice('Unlock Layout structure, direction and any affected path geometry before applying an angle.');
      return false;
    }
    const geometry=base.geometry==='drawn'?'straight':base.geometry;
    const trial=normalizeRecipe({...base,geometry,orientation:'diagonal',diagonalRotation:0});
    const baseline=resolveScene(trial).angle*180/Math.PI;
    changeRecipe({...base,structure:'paths',geometry,orientation:'diagonal',
      diagonalRotation:importedAngleDeltaDegrees(angle,baseline)});
    showNotice('Detected '+angle+'° line direction applied. Undo restores the previous angle.');
    return true;
  },
});
// The library only stores geometry; using a saved path delegates to the
// existing recipe and Undo transaction, while saving does not change artwork.
const geometryLibrary=installGeometryLibraryUI({
  getRecipe:()=>current,
  onNotice:showNotice,
  downloadBlob,
  applyShape:applyImportedShape,
  applyPath:({points,anchors=[],corners=[]})=>{
    if(current.lockedSettings.includes('geometry')||
      pathStructureLockedOutsidePaths(current)){
      showNotice('Unlock Path geometry or Layout structure before using a saved path.');
      return false;
    }
    const next=appliedDrawnPathRecipe(fromControls(),points,anchors,corners,false,false);
    changeRecipe(next);
    return true;
  }
});

const useScatteredShape=document.createElement('button');
useScatteredShape.type='button';useScatteredShape.id='chooseScatteredShape';
useScatteredShape.className='button button-outline scattered-preset';
useScatteredShape.textContent='Choose saved silhouette…';
document.querySelector('.editor-tool-card[data-editor-tool="regions"]')?.append(useScatteredShape);
useScatteredShape.addEventListener('click',()=>{void geometryLibrary.open({filterKind:'shape'});});
useScatteredShape.hidden=current.structure!=='regions'||current.regionMode!=='scattered';
function updatePositionStatus(){
  const label=document.getElementById('positionStatus');
  const x=current.positionX, y=current.positionY;
  for(const button of document.querySelectorAll('[data-nudge]'))button.disabled=current.lockedSettings.includes('position');
  label.textContent=x===0&&y===0?'Default position':
    `X ${x>0?'+':''}${x}% · Y ${y>0?'+':''}${y}%`;
  const reset=document.querySelector('[data-nudge="reset"]');
  reset.disabled=(x===0&&y===0)||current.lockedSettings.includes('position');
}
function updateViewPanStatus(){
  const label=document.getElementById('viewPanStatus');
  if(!label)return;
  const x=current.viewPanX,y=current.viewPanY;
  label.textContent=x===0&&y===0?'Centered frame':
    `Frame X ${x>0?'+':''}${x}% · Y ${y>0?'+':''}${y}%`;
  for(const button of document.querySelectorAll('[data-view-pan]')){
    const direction=button.dataset.viewPan;
    button.disabled=direction==='reset'?(x===0&&y===0):
      direction==='left'?x<=-50:direction==='right'?x>=50:
      direction==='up'?y<=-50:y>=50;
  }
}
const VIEW_PAN_STEP=5;
for(const button of document.querySelectorAll('[data-view-pan]')){
  button.addEventListener('click',()=>{
    const dir=button.dataset.viewPan;
    const recipe=fromControls();
    if(dir==='reset'){recipe.viewPanX=0;recipe.viewPanY=0;}
    else{
      const dx=dir==='right'?VIEW_PAN_STEP:dir==='left'?-VIEW_PAN_STEP:0;
      const dy=dir==='down'?VIEW_PAN_STEP:dir==='up'?-VIEW_PAN_STEP:0;
      recipe.viewPanX=Math.max(-50,Math.min(50,recipe.viewPanX+dx));
      recipe.viewPanY=Math.max(-50,Math.min(50,recipe.viewPanY+dy));
    }
    changeRecipe(recipe);
  });
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
  // Saved contains the live #favoriteCount status element. Replacing its
  // innerHTML during thumbnail loading used to delete that element; a second
  // storage event then threw during count refresh and left stale Saved cards.
  // Keep the original DOM/accessible count mounted even while the action is busy.
  if(button.id==='showFavorites'){
    button.setAttribute('aria-busy',String(busy));
    return;
  }
  if(busy){button.dataset.previous=button.innerHTML;button.textContent=label;}
  else if(button.dataset.previous){button.innerHTML=button.dataset.previous;delete button.dataset.previous;}
}
const metadataPanel=document.getElementById('metadataPanel');
const metadataToggle=document.getElementById('metadataToggle');
const rememberMetadata=document.getElementById('metadataRemember');
const METADATA_STORE='wallgen:export-metadata:v1';
// Archive surgery in More: this does not mutate the editor, its Undo stack,
// the displayed wallpaper, the current recipe or the export metadata fields.
const migrationToggle=document.getElementById('migrateRecipeToggle');
const migrationPanel=document.getElementById('migrateRecipePanel');
const migrationFile=document.getElementById('migrateRecipeFile');
const migrationStatus=document.getElementById('migrateRecipeStatus');
const migrationDownload=document.getElementById('migrateRecipeDownload');
const migrationReportDownload=document.getElementById('migrateRecipeReport');
const migrationArchiveDownload=document.getElementById('migrateRecipeArchive');
let migrationCandidate=null,migrationArchiveSource=null,migrationInspection=null,migrationFileName=null,migrationRevision=0;
migrationToggle.addEventListener('click',()=>{
  migrationPanel.hidden=!migrationPanel.hidden;
  migrationToggle.setAttribute('aria-expanded',String(!migrationPanel.hidden));
  migrationToggle.textContent=(migrationPanel.hidden?'▸':'▾')+' Update recipe inside existing PNG';
  if(!migrationPanel.hidden)migrationFile.focus({preventScroll:true});
});
migrationFile.addEventListener('change',async()=>{
  const selected=migrationFile.files?.[0],rev=++migrationRevision;
  migrationCandidate=null;migrationArchiveSource=null;migrationInspection=null;migrationFileName=null;
  migrationDownload.disabled=true;migrationReportDownload.disabled=true;
  migrationArchiveDownload.disabled=true;
  if(!selected){migrationStatus.textContent='No PNG selected.';return;}
  migrationStatus.textContent='Inspecting '+selected.name+'…';
  if(selected.size>150*1024*1024){
    migrationStatus.textContent='PNG exceeds the 150 MB inspection limit.';return;
  }
  let bytes;
  try{
    bytes=new Uint8Array(await selected.arrayBuffer());
    if(rev!==migrationRevision)return;
    const report=inspectPngMigration(bytes);
    migrationInspection=report;migrationFileName=selected.name;
    migrationReportDownload.disabled=false;
    if(report.recordCount>0){migrationArchiveSource=bytes;migrationArchiveDownload.disabled=false;}
    const summary=report.width+' × '+report.height+' · '+
      (report.detectedFormat||'unknown recipe format')+' · '+report.recordCount+' recipe record(s). ';
    migrationStatus.textContent=report.safe?
      summary+'Safe to update. Original pixels and unrelated metadata will be preserved.':
      summary+'Update unavailable: '+(report.reason||'Unsupported recipe')+'. '+
      (report.unknownKeys.length?'Unknown keys: '+report.unknownKeys.slice(0,5).join(', ')+'. ':'')+
      'The original PNG remains untouched.';
    if(report.safe){migrationCandidate=bytes;migrationDownload.disabled=false;}
  }catch(error){
    if(rev!==migrationRevision)return;
    const reason=String(error.message||error);
    // An unreadable historical recipe need not mean its exact source bytes
    // are lost. Gate archival by the PNG container CRCs, not by JSON.parse.
    if(bytes){
      try{
        const archive=inspectPngRecipeArchive(bytes);
        if(archive.recordCount){
          migrationArchiveSource=bytes;migrationFileName=selected.name;
          migrationArchiveDownload.disabled=false;
          migrationInspection={...archive,safe:false,detectedFormat:null,
            reason:'Recipe cannot be interpreted: '+reason,unknownKeys:[],
            coercedKeys:[],synthesizedKeys:[],warnings:[
              'Exact-byte backup remains available without parsing or changing the PNG']};
          migrationReportDownload.disabled=false;
          migrationStatus.textContent='Recipe update unavailable: '+reason+
            '. Save original recipe records (exact bytes) to preserve the historical metadata.';
          return;
        }
      }catch{
        // Damaged PNG framing/CRC or archival limits must not masquerade
        // as a recoverable recipe. Keep the source file unchanged.
      }
    }
    migrationStatus.textContent='Could not inspect PNG: '+reason;
  }
});
migrationDownload.addEventListener('click',async()=>{
  if(!migrationCandidate||!migrationInspection?.safe)return;
  migrationDownload.disabled=true;
  migrationStatus.textContent='Verifying all original PNG image and metadata chunks…';
  const revision=migrationRevision;
  await new Promise(resolve=>requestAnimationFrame(resolve));
  if(revision!==migrationRevision)return;
  try{
    const {png,report}=migratePngMetadataOnly(migrationCandidate);
    if(revision!==migrationRevision)return;
    const stem=safeFilename((migrationFileName||'wallpaper').replace(/\.png$/i,''));
    downloadBlob(new Blob([png],{type:'image/png'}),stem+'-recipe-updated.png');
    migrationInspection=report;
    migrationStatus.textContent='Downloaded updated recipe. '+
      report.preservedChunks+' non-recipe chunks preserved byte-for-byte, including image data.';
  }catch(error){
    migrationStatus.textContent='No PNG written: '+String(error.message||error);
  }finally{if(revision===migrationRevision)migrationDownload.disabled=!migrationCandidate;}
});
migrationArchiveDownload.addEventListener('click',async()=>{
  if(!migrationArchiveSource||!migrationInspection?.recordCount)return;
  const revision=migrationRevision;
  migrationArchiveDownload.disabled=true;
  migrationStatus.textContent='Preserving exact original recipe chunks as a separate JSON archive…';
  await new Promise(resolve=>requestAnimationFrame(resolve));
  if(revision!==migrationRevision)return;
  try{
    const bundle=archivePngRecipeRecords(migrationArchiveSource);
    if(revision!==migrationRevision)return;
    const filename=safeFilename((migrationFileName||'wallpaper').replace(/\.png$/i,''));
    const payload=JSON.stringify({sourceFile:migrationFileName,...bundle},null,2)+'\n';
    downloadBlob(new Blob([payload],{type:'application/json'}),
      filename+'-original-recipe-records.json');
    migrationStatus.textContent='Saved '+bundle.recordCount+
      ' original recipe chunk(s) with exact metadata bytes. The PNG is unchanged.';
  }catch(error){
    migrationStatus.textContent='Could not archive original recipe records: '+String(error.message||error);
  }finally{
    if(revision===migrationRevision)
      migrationArchiveDownload.disabled=!migrationArchiveSource;
  }
});
migrationReportDownload.addEventListener('click',()=>{
  if(!migrationInspection)return;
  const bytes=JSON.stringify(migrationInspection,null,2)+'\n';
  downloadBlob(new Blob([bytes],{type:'application/json'}),
    safeFilename((migrationFileName||'wallpaper').replace(/\.png$/i,''))+'-recipe-migration-report.json');
});

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
  if(open)requestAnimationFrame(()=>{
    const tray=document.getElementById('mobileToolsSheet');
    // The expanded form must be visible within the local More scroller.
    if(!tray.hidden && window.matchMedia('(max-width:790px)').matches)
      metadataPanel.querySelector('.metadata-heading')?.scrollIntoView({block:'nearest',behavior:'instant'});
  });
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
  // Commit an in-flight slider frame before taking the export snapshot.
  // Metadata and artwork describe the state at the user's click, even if
  // further controls are changed during PNG encoding.
  if(pendingControlFrame){
    cancelAnimationFrame(pendingControlFrame);
    pendingControlFrame=0;
    updateControlsFromInputs();
  }
  const snapshot=normalizeRecipe(current);
  const exportId=crypto.randomUUID();
  const targetEpisodeId=usageRecorder?.episodeId||null;
  usageRecorder?.action('export_requested',snapshot,{exportId,targetEpisodeId});
  const metadata=metadataValues();
  const button=document.getElementById('download');
  setBusy(button,true,'Rendering 19.8 MP…');
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  let big;
  try {
    let blob;
    if(typeof Worker==='function'&&typeof OffscreenCanvas==='function'){
      try{
        // A separate worker prevents full-resolution PNG generation from
        // starving the interactive preview queue.
        blob=await exportWallpaperInWorker({
          recipe:snapshot,width:OUTPUT_WIDTH,height:OUTPUT_HEIGHT
        });
      }catch(error){
        console.warn('ROYGBIV worker export fallback:',error);
        // An interrupted, unsupported or failed worker can still use the
        // established reference exporter. The user retains a real PNG.
        showNotice('Trying compatibility export…');
      }
    }
    if(!blob){
      big=document.createElement('canvas');
      big.width=OUTPUT_WIDTH;big.height=OUTPUT_HEIGHT;
      drawWallpaper(big,snapshot);
      blob=await new Promise((resolve,reject)=>big.toBlob(
        b=>b?resolve(b):reject(new Error('PNG encoding failed')),'image/png'));
    }
    const result=new Blob([embedPngMetadata(await blob.arrayBuffer(),metadata,{recipe:snapshot})],
      {type:'image/png'});
    downloadBlob(result,`roygbiv-${safeFilename(snapshot.seed)}-${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}.png`);
    usageRecorder?.action('download_initiated',snapshot,{exportId,targetEpisodeId});
    creativeFeedback?.showExport({exportId,targetEpisodeId});
    void usageGitHubSync?.syncNow(); // Back up after exports, never block PNG save.
    showNotice(`Exported the framed ${Math.round(snapshot.viewZoom*100)}% view at ${OUTPUT_WIDTH} × ${OUTPUT_HEIGHT}, with recipe metadata.`);
  }catch(error){usageRecorder?.action('export_failed',snapshot,{exportId,targetEpisodeId});console.error(error);showNotice(`Export failed: ${error.message}`);}
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
    // JSON exported by Save recipe is a first-class import, using the same
    // original file input and history transaction as embedded PNG recipes.
    // Never silently reset the design when a random JSON document is chosen.
    const isJSON=/\.json$/i.test(file.name)||file.type==='application/json';
    const limit=isJSON?10*1024*1024:150*1024*1024;
    if(file.size>limit)throw Error(isJSON?
      'JSON exceeds the 10 MB import limit':'PNG exceeds the 150 MB import limit');
    let recipe,historicalInterpretation=false;
    if(isJSON){
      let raw;
      try{raw=JSON.parse(await file.text());}
      catch{throw Error('Invalid JSON recipe syntax');}
      if(!raw||Array.isArray(raw)||typeof raw!=='object'||
        typeof raw.seed!=='string'||!raw.seed.trim()||
        !['paths','radial','regions'].includes(raw.structure))
        throw Error('JSON must contain a wallpaper recipe with seed and structure');
      recipe=normalizeRecipe(raw);
    }else{
      const recovered=extractPngRecipeWithProvenance(await file.arrayBuffer());
      recipe=recovered.recipe;
      if(!recipe)throw Error('This PNG has no R.O.Y.G.B.I.V. recipe metadata');
      historicalInterpretation=recovered.format!=='roygbiv-recipe-v2'||
        recovered.normalizedFieldsChanged||recovered.recordCount>1;
    }
    changeRecipe(recipe,{bypassLocks:true});
    showNotice(isJSON?'Restored wallpaper settings from JSON recipe.':
      historicalInterpretation?
        'Restored historical PNG settings through the current generator. Artwork may differ from the saved image; retain the original PNG.':
        'Restored PNG recipe settings. Rendering may differ across app versions.');
  }catch(error){showNotice('Cannot restore design: '+error.message);}
});

let pendingControlFrame=0;
function updateControlsFromInputs({interactive=false}={}){
  syncDiagonalUI();
  changeRecipe(fromControls(),{interactive});
}
function queueControlUpdate(){
  if(pendingControlFrame)cancelAnimationFrame(pendingControlFrame);
  pendingControlFrame=requestAnimationFrame(()=>{
    pendingControlFrame=0;
    updateControlsFromInputs({interactive:true});
  });
}

for(const slider of form.querySelectorAll('input[type="range"]')){
  const row=document.createElement('span');row.className='stepper';
  const accessibleName=fullSettingName(slider.name,sourceSettingLabel(slider,slider.name));
  const minus=document.createElement('button');minus.type='button';minus.className='step-button';minus.innerHTML=iconMarkup('minus');minus.setAttribute('aria-label','Decrease '+accessibleName);
  const plus=document.createElement('button');plus.type='button';plus.className='step-button';plus.innerHTML=iconMarkup('plus');plus.setAttribute('aria-label','Increase '+accessibleName);
  const numeric=document.createElement('input');
  numeric.type='number';numeric.className='slider-number';numeric.min=slider.min;numeric.max=slider.max;
  numeric.step=slider.step||'1';numeric.value=slider.value;numeric.dataset.numberFor=slider.name;
  const degreeControls=['diagonalRotation','hairpinAngle','loopSweep','rayRotation','rayTwist'];
  const countControls=['rayCount','regionCount','regionSides','stepCount'];
  const unit=degreeControls.includes(slider.name)?' in degrees':
    countControls.includes(slider.name)?'':' percentage';
  numeric.setAttribute('aria-label',accessibleName+unit);
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
  locked:iconMarkup('lock'),
  unlocked:iconMarkup('unlock'),
};
function syncSettingLocks(){
  const locked=new Set(current.lockedSettings);
  for(const [key,buttons] of settingLockButtons){
    for(const button of buttons){
      button.innerHTML=locked.has(key)?LOCK_ICON.locked:LOCK_ICON.unlocked;
      button.setAttribute('aria-pressed',String(locked.has(key)));
      button.setAttribute('aria-label',(locked.has(key)?'Unlock ':'Lock ')+
        fullSettingName(key,sourceSettingLabel(form.elements.namedItem(key),key)));
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
// Source-linked guidance lives beside the controls it describes. It does not
// change the saved recipe, geometry or layout outside the relevant card.
for(const [id,tool] of [['scatteredSourceNotice','regions'],
  ['scatteredSizeRangeStatus','scattered-size']]){
  const card=document.querySelector('.editor-tool-card[data-editor-tool="'+tool+'"]');
  const hint=document.createElement('p');
  hint.id=id;hint.hidden=true;hint.className='scattered-effective-hint';
  hint.setAttribute('role','note');
  card?.append(hint);
}
// Contextual preset, without growing the navigation. All affected values stay
// ordinary editable settings, and locked fields remain protected.
const regionTool=document.querySelector('.editor-tool-card[data-editor-tool="regions"]');
const rainbowOrbitButton=document.createElement('button');
rainbowOrbitButton.type='button';rainbowOrbitButton.id='rainbowOrbitsPreset';
rainbowOrbitButton.className='button button-outline scattered-preset';
rainbowOrbitButton.textContent='Try Rainbow Orbits';
rainbowOrbitButton.title='Seven varied rainbow circles with black negative space';
regionTool?.append(rainbowOrbitButton);
rainbowOrbitButton.addEventListener('click',()=>{
  const proposal=normalizeRecipe({...current,...RAINBOW_ORBITS,scatteredOverrides:[],scatteredLayerOrder:[]});
  const next=respectSettingLocks(current,proposal);
  if(next.structure!=='regions'||next.regionMode!=='scattered'){
    showNotice('Unlock Canvas structure and Region layout to apply Rainbow Orbits.');
    return;
  }
  changeRecipe(next);
  selectEditorTool('path','scattered-size');
  showNotice('Rainbow Orbits selected. Adjust count, size, spacing and edge cropping.');
});
// A compact, contextual *per-circle* inspector. Manual offsets live in the
// recipe so Undo, favourites, PNG metadata, links and headless render agree.
const orbitEditor=document.createElement('section');
orbitEditor.id='scatteredObjectEditor';
orbitEditor.className='scattered-object-editor';
orbitEditor.hidden=true;
const orbitTitle=document.createElement('strong');
orbitTitle.textContent='Edit one circle';
orbitEditor.append(orbitTitle);
const orbitPicker=document.createElement('select');
orbitPicker.id='scatteredObjectPicker';
orbitPicker.setAttribute('aria-label','Circle to edit');
orbitEditor.append(orbitPicker);
const orbitCommands=document.createElement('div');
orbitCommands.className='scattered-object-commands';
for(const [action,label,accessible] of [
  ['left','←','Move circle left'],['up','↑','Move circle up'],
  ['down','↓','Move circle down'],['right','→','Move circle right'],
  ['smaller','−','Make selected circle smaller'],['larger','+','Make selected circle larger'],
  ['reset','Reset','Restore automatic position and size for this circle']]){
  const button=document.createElement('button');
  button.type='button';button.dataset.orbitAction=action;
  button.textContent=label;button.setAttribute('aria-label',accessible);
  orbitCommands.append(button);
}
orbitEditor.append(orbitCommands);
const orbitLayers=document.createElement('div');
orbitLayers.className='scattered-layer-actions';
for(const [action,label] of [['back','Move behind'],['front','Move in front']]){
  const button=document.createElement('button');
  button.type='button';button.dataset.orbitLayer=action;
  button.textContent=label;
  button.setAttribute('aria-label',label+' by one paint layer');
  orbitLayers.append(button);
}
orbitEditor.append(orbitLayers);
const orbitNote=document.createElement('small');
orbitNote.className='scattered-object-note';
orbitNote.setAttribute('aria-live','polite');
orbitEditor.append(orbitNote);
const moveOnCanvas=document.createElement('button');
moveOnCanvas.type='button';
moveOnCanvas.id='scatteredMoveOnCanvas';
moveOnCanvas.className='button button-outline scattered-preset';
moveOnCanvas.textContent='Move shapes on canvas';
moveOnCanvas.setAttribute('aria-pressed','false');
moveOnCanvas.title='Tap and drag a circle or silhouette on the wallpaper, then Done';
orbitEditor.append(moveOnCanvas);
document.querySelector('.editor-tool-card[data-editor-tool="scattered-edges"]')
  ?.append(orbitEditor);

// Direct manipulation is opt-in: normal preview taps, app navigation, Draw,
// and camera controls are otherwise completely unchanged. Only pointerup
// commits a recipe, making the whole drag ONE Undo step.
let scatteredDirectActive=false,scatteredDirectDrag=null;
const scatteredDirectOutline=document.createElement('div');
scatteredDirectOutline.id='scatteredDirectOutline';
scatteredDirectOutline.className='scattered-direct-outline';
scatteredDirectOutline.hidden=true;
document.querySelector('.wallpaper-surface')?.append(scatteredDirectOutline);
const scatteredDirectDone=document.createElement('button');
scatteredDirectDone.type='button';
scatteredDirectDone.id='scatteredDirectDone';
scatteredDirectDone.textContent='Done moving';
scatteredDirectDone.hidden=true;
document.querySelector('.studio-stage')?.append(scatteredDirectDone);
function setScatteredDirectActive(next){
  scatteredDirectActive=!!next;
  scatteredDirectDrag=null;
  document.body.classList.toggle('scattered-direct-active',scatteredDirectActive);
  moveOnCanvas.setAttribute('aria-pressed',String(scatteredDirectActive));
  moveOnCanvas.textContent=scatteredDirectActive?'Stop moving shapes':'Move shapes on canvas';
  scatteredDirectDone.hidden=!scatteredDirectActive;
  if(scatteredDirectActive)syncScatteredDirectOutline();
  else scatteredDirectOutline.hidden=true;
}
function pixelFromPointer(event){
  const rect=preview.getBoundingClientRect();
  return {x:(event.clientX-rect.left)*preview.width/Math.max(rect.width,1),
    y:(event.clientY-rect.top)*preview.height/Math.max(rect.height,1)};
}
function syncScatteredDirectOutline(temporaryCircle=null){
  if(!scatteredDirectActive){scatteredDirectOutline.hidden=true;return;}
  const id=Number(orbitPicker.value);
  const object=currentScene?.objects?.find(o=>o.id==='region-'+id);
  const circle=temporaryCircle||object?.circle||object?.editCircle;
  if(!circle){scatteredDirectOutline.hidden=true;return;}
  const pixel=scatteredWorldToPixel(current,preview.width,preview.height,circle.cx,circle.cy);
  const canvasRect=preview.getBoundingClientRect();
  const surfaceRect=preview.closest('.wallpaper-surface').getBoundingClientRect();
  const scaleX=canvasRect.width/preview.width,scaleY=canvasRect.height/preview.height;
  const radiusX=circle.r*pixel.radiusScaleX*scaleX;
  const radiusY=circle.r*pixel.radiusScaleY*scaleY;
  scatteredDirectOutline.style.left=(canvasRect.left-surfaceRect.left+pixel.x*scaleX-radiusX)+'px';
  scatteredDirectOutline.style.top=(canvasRect.top-surfaceRect.top+pixel.y*scaleY-radiusY)+'px';
  scatteredDirectOutline.style.width=(radiusX*2)+'px';
  scatteredDirectOutline.style.height=(radiusY*2)+'px';
  scatteredDirectOutline.hidden=false;
}
moveOnCanvas.addEventListener('click',()=>{
  if(!scatteredDirectActive && document.body.classList.contains('mobile-edit-open'))
    document.getElementById('mobileDismissHandle')?.click();
  setScatteredDirectActive(!scatteredDirectActive);
});
scatteredDirectDone.addEventListener('click',()=>setScatteredDirectActive(false));
preview.addEventListener('pointerdown',event=>{
  if(!scatteredDirectActive||scatteredDirectDrag||event.button!==0)return;
  const rect=preview.getBoundingClientRect();
  const pos=pixelFromPointer(event);
  const world=scatteredPixelToWorld(current,preview.width,preview.height,pos.x,pos.y);
  const projection=scatteredWorldToPixel(current,preview.width,preview.height,world.x,world.y);
  const tolerance=14*preview.width/Math.max(rect.width,1)/projection.radiusScaleX;
  const object=pickScatteredRegion(currentScene?.objects,world,tolerance);
  if(!object)return;
  event.preventDefault();event.stopPropagation();
  const circle=object.circle||object.editCircle;
  if(!circle)return;
  const index=Number(object.id.slice(7));
  orbitPicker.value=String(index);
  syncScatteredObjectEditor();
  scatteredDirectDrag={pointerId:event.pointerId,index,
    startWorld:world,circle:{...circle},current:{...circle},moved:false};
  try{preview.setPointerCapture(event.pointerId);}catch{}
});
preview.addEventListener('pointermove',event=>{
  const drag=scatteredDirectDrag;
  if(!scatteredDirectActive||!drag||drag.pointerId!==event.pointerId)return;
  event.preventDefault();event.stopPropagation();
  const pos=pixelFromPointer(event);
  const world=scatteredPixelToWorld(current,preview.width,preview.height,pos.x,pos.y);
  const cx=clampScattered(drag.circle.cx+world.x-drag.startWorld.x,-300,900);
  const cy=clampScattered(drag.circle.cy+world.y-drag.startWorld.y,-650,1950);
  drag.current={...drag.circle,cx,cy};
  drag.moved=Math.hypot(cx-drag.circle.cx,cy-drag.circle.cy)>.9;
  syncScatteredDirectOutline(drag.current);
});
preview.addEventListener('pointerup',event=>{
  const drag=scatteredDirectDrag;
  if(!drag||drag.pointerId!==event.pointerId)return;
  event.preventDefault();event.stopPropagation();
  scatteredDirectDrag=null;
  try{preview.releasePointerCapture(event.pointerId);}catch{}
  if(drag.moved){
    const overrides=scatteredMoveOverride(current,drag.index,drag.circle,
      {x:drag.current.cx,y:drag.current.cy});
    changeRecipe({...current,scatteredOverrides:overrides});
  }
  syncScatteredDirectOutline();
});
preview.addEventListener('pointercancel',event=>{
  if(!scatteredDirectDrag||scatteredDirectDrag.pointerId!==event.pointerId)return;
  scatteredDirectDrag=null;
  syncScatteredDirectOutline(); // Cancellation leaves recipe untouched.
});
window.addEventListener('resize',()=>{if(scatteredDirectActive)syncScatteredDirectOutline();});
window.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&scatteredDirectActive){
    setScatteredDirectActive(false);
    event.preventDefault();
  }
});

function syncScatteredObjectEditor(){
  const root=document.getElementById('scatteredObjectEditor');
  if(!root)return; // First render can precede mountEditor().
  const objects=currentScene?.objects?.filter(o=>o.circle||o.editCircle)||[];
  const active=current.structure==='regions'&&
    current.regionMode==='scattered'&&objects.length>0;
  root.hidden=!active;
  if(!active&&scatteredDirectActive)setScatteredDirectActive(false);
  root.querySelector('strong').textContent=current.scatteredShapeKind==='imported'?
    'Edit one shape':'Edit one circle';
  if(!active)return;
  const key=current.scatteredShapeKind+':'+objects.map(o=>o.id).join('|');
  const picker=root.querySelector('select');
  if(root.dataset.members!==key){
    const before=picker.value;
    picker.replaceChildren();
    for(const object of objects){
      const index=Number(object.id.slice(7));
      const option=document.createElement('option');
      option.value=String(index);
      option.textContent=NAMES[index%7]+' · '+
        (current.scatteredShapeKind==='imported'?'Shape ':'Circle ')+(index+1);
      picker.append(option);
    }
    if([...picker.options].some(o=>o.value===before))picker.value=before;
    root.dataset.members=key;
  }
  const index=Number(picker.value);
  const object=objects.find(o=>o.id==='region-'+index);
  const circle=object?.circle||object?.editCircle;
  const customized=normalizeScatteredOverrides(current.scatteredOverrides)
    .some(o=>o.index===index);
  root.querySelector('[data-orbit-action="reset"]').disabled=!customized;
  const order=effectiveScatteredLayerOrder(current.scatteredLayerOrder,
    objects.map(o=>Number(o.id.slice(7))));
  const layer=order.indexOf(index);
  orbitLayers.querySelector('[data-orbit-layer="back"]').disabled=layer<=0;
  orbitLayers.querySelector('[data-orbit-layer="front"]').disabled=layer>=order.length-1;
  root.querySelector('.scattered-object-note').textContent=circle?
    (customized?'Manually positioned · ':'Seeded position · ')+
    'X '+Math.round(circle.cx)+
    ' · Y '+Math.round(circle.cy)+
    ' · Radius '+Math.round(circle.r)+
    ' · Layer '+(layer+1)+' of '+order.length:'No shape selected';
  if(scatteredDirectActive&&!scatteredDirectDrag)syncScatteredDirectOutline();
}
orbitPicker.addEventListener('change',syncScatteredObjectEditor);
orbitLayers.addEventListener('click',event=>{
  const button=event.target.closest('button[data-orbit-layer]');
  if(!button||button.disabled)return;
  const index=Number(orbitPicker.value);
  const available=(currentScene?.objects||[])
    .filter(o=>o.circle||o.editCircle).map(o=>Number(o.id.slice(7)));
  const order=moveScatteredLayer(current.scatteredLayerOrder,index,
    button.dataset.orbitLayer==='front'?1:-1,available);
  if(order===null)return;
  changeRecipe({...current,scatteredLayerOrder:order});
});
orbitCommands.addEventListener('click',event=>{
  const button=event.target.closest('button[data-orbit-action]');
  if(!button)return;
  const index=Number(orbitPicker.value);
  const object=currentScene?.objects?.find(o=>o.id==='region-'+index);
  const circle=object?.circle||object?.editCircle;
  if(!circle)return;
  const action=button.dataset.orbitAction;
  const next=normalizeScatteredOverrides(current.scatteredOverrides)
    .filter(o=>o.index!==index);
  if(action!=='reset'){
    const {cx,cy,r}=circle;
    const dx=action==='left'?-18:action==='right'?18:0;
    const dy=action==='up'?-18:action==='down'?18:0;
    const dr=action==='smaller'?-12:action==='larger'?12:0;
    const limit=(value,min,max)=>Math.max(min,Math.min(max,value));
    next.push({index,
      x:limit((cx+dx)/600,-.5,1.5),
      y:limit((cy+dy)/1300,-.5,1.5),
      radius:limit((r+dr)/600,.01,1.2)});
  }
  changeRecipe({...current,scatteredOverrides:next});
});

const scatterStatus=document.createElement('p');
scatterStatus.id='scatteredStatus';scatterStatus.hidden=true;
scatterStatus.className='scattered-diagnostic';scatterStatus.setAttribute('role','status');
document.querySelector('.editor-tool-card[data-editor-tool="scattered-edges"]')
  ?.append(scatterStatus);
// Details controls deliberately live outside the fixed scalar setting schema:
// ordered element objects are a recipe collection, not separately lockable sliders.
const interiorCards=Object.fromEntries(['interior','interior-style','interior-motion','interior-placement','interior-targets']
  .map(id=>[id,document.querySelector('.editor-tool-card[data-editor-tool="'+id+'"]')]));
let selectedInterior=0,selectedInteriorId=null,lastInteriorState='';
function syncInteriorUI(){
  // Every change to an element rebuilds its five editor cards. Preserve the
  // user's focused *logical* control, not the node being removed, so Tab and
  // repeated arrow-key adjustments keep working after changeRecipe().
  const focused=Object.values(interiorCards).some(card=>
    card.contains(document.activeElement))?
    document.activeElement?.dataset?.interiorFocus:null;
  const restoreFocus=()=>{
    if(!focused)return;
    const controls=Object.values(interiorCards).flatMap(card=>
      [...card.querySelectorAll('[data-interior-focus]')]);
    resolveInteriorFocusTarget(controls,focused)?.focus({preventScroll:true});
  };
  lastInteriorState=JSON.stringify([current.interiorElements,
    current.lockedSettings.includes('interiorElements')]);
  const items=current.interiorElements||[];
  for(const card of Object.values(interiorCards))card.replaceChildren();
  const make=(host,tag,label)=>{
    const el=document.createElement(tag);
    if(label!==undefined)el.textContent=label;
    host.append(el);return el;
  };
  const manager=interiorCards.interior;
  const toolbar=make(manager,'div');toolbar.className='interior-toolbar';
  const choose=make(toolbar,'select');
  choose.setAttribute('aria-label','Select interior element');
  choose.dataset.interiorFocus='manager.choose';
  items.forEach((item,i)=>{
    const option=document.createElement('option');
    option.value=String(i);option.textContent=(i+1)+'. '+item.type+' · '+item.shape;
    choose.append(option);
  });
  selectedInterior=resolveInteriorSelection(items,selectedInteriorId,selectedInterior);
  selectedInteriorId=items[selectedInterior]?.id??null;
  choose.value=String(selectedInterior);
  choose.disabled=!items.length;
  choose.addEventListener('change',()=>{
    selectedInterior=Number(choose.value);
    selectedInteriorId=items[selectedInterior]?.id??null;
    syncInteriorUI();
  });
  const add=make(toolbar,'button','+ Add');add.type='button';
  add.dataset.interiorFocus='manager.add';
  add.disabled=items.length>=8;
  add.addEventListener('click',()=>{
    const id=newInteriorElementId(items);
    selectedInterior=items.length;
    selectedInteriorId=id;
    changeRecipe({...current,interiorElements:[...items,{id,type:'line',shape:'wave',color:'white',width:1.5,frequency:6,amplitude:.12}]});
  });
  const remove=make(toolbar,'button','Remove');remove.type='button';remove.disabled=!items.length;
  remove.dataset.interiorFocus='manager.remove';
  remove.addEventListener('click',()=>{
    const remaining=items.filter((_,i)=>i!==Number(choose.value));
    selectedInterior=Math.max(0,selectedInterior-1);
    selectedInteriorId=remaining[selectedInterior]?.id??null;
    changeRecipe({...current,interiorElements:remaining});
  });
  if(!items.length){
    const guidance={
      interior:'No interior elements yet. Use + Add above to create a line.',
      'interior-style':'Add a line or band in Elements to choose its appearance.',
      'interior-motion':'Add an element in Elements to adjust its shape and rhythm.',
      'interior-placement':'Add an element in Elements to place it on the artwork.',
      'interior-targets':'Add an element in Elements to choose which colours or shapes it affects.'
    };
    for(const [id,card] of Object.entries(interiorCards)){
      const message=make(card,'p',guidance[id]);
      message.className='interior-empty-guidance';
      message.setAttribute('role','note');
    }
    restoreFocus();
    return;
  }
  const active=items[selectedInterior];
  // Keep the selected object's identity reachable from every editing tool.
  // These are just views into the existing collection, not five independent
  // copies of its properties. Changing the picker never mutates the recipe.
  for(const [id,card] of Object.entries(interiorCards)){
    if(id==='interior')continue; // Elements already owns its Add/Remove picker.
    const context=make(card,'div');
    context.className='interior-selection-context';
    const label=make(context,'label','Editing');
    const switcher=make(label,'select');
    switcher.dataset.interiorSwitcher='true';
    switcher.dataset.interiorFocus='context.'+id+'.choose';
    switcher.setAttribute('aria-label','Interior element to edit');
    for(const [i,item] of items.entries()){
      const option=document.createElement('option');
      option.value=String(i);
      option.textContent=(i+1)+'. '+item.type+' · '+item.shape+
        (item.enabled?'':' (hidden)');
      switcher.append(option);
    }
    switcher.value=String(selectedInterior);
    switcher.addEventListener('change',()=>{
      selectedInterior=Number(switcher.value);
      selectedInteriorId=items[selectedInterior]?.id??null;
      syncInteriorUI();
    });
  }
  const update=(key,value)=>changeRecipe({...current,interiorElements:
    current.interiorElements.map((e,i)=>i===selectedInterior?{...e,[key]:value}:e)});
  const select=(card,name,key,options)=>{
    const field=make(card,'label',name);
    const control=make(field,'select');
    for(const value of options){
      const opt=document.createElement('option');opt.value=value;opt.textContent=value;control.append(opt);
    }
    control.dataset.interiorFocus='field.'+key;
    control.value=active[key];control.addEventListener('change',()=>update(key,control.value));
  };
  const range=(card,name,key,min,max,step)=>{
    const field=make(card,'label',name+' '+active[key]);
    const slider=make(field,'input');
    slider.type='range';slider.dataset.rainbowKey=key;
    slider.dataset.interiorFocus='field.'+key;
    slider.min=min;slider.max=max;
    slider.step=interiorSliderStep(active[key],min,step);
    slider.value=active[key];
    slider.addEventListener('input',()=>{field.firstChild.textContent=name+' '+slider.value;});
    slider.addEventListener('change',()=>update(key,Number(slider.value)));
    return slider;
  };
  const actions=make(manager,'div');actions.className='interior-actions';
  const up=make(actions,'button');up.type='button';up.innerHTML=iconMarkup('arrow-up');up.title='Move element upward';up.setAttribute('aria-label','Move element upward');
  up.dataset.interiorFocus='manager.up';
  up.disabled=selectedInterior===0;
  up.addEventListener('click',()=>{
    const next=[...current.interiorElements];
    [next[selectedInterior-1],next[selectedInterior]]=[next[selectedInterior],next[selectedInterior-1]];
    selectedInterior--;changeRecipe({...current,interiorElements:next});
  });
  const down=make(actions,'button');down.type='button';down.innerHTML=iconMarkup('arrow-down');down.title='Move element downward';down.setAttribute('aria-label','Move element downward');
  down.dataset.interiorFocus='manager.down';
  down.disabled=selectedInterior>=items.length-1;
  down.addEventListener('click',()=>{
    const next=[...current.interiorElements];
    [next[selectedInterior+1],next[selectedInterior]]=[next[selectedInterior],next[selectedInterior+1]];
    selectedInterior++;changeRecipe({...current,interiorElements:next});
  });
  const stackLocked=current.lockedSettings.includes('interiorElements');
  const lock=make(actions,'button',stackLocked?'Unlock all elements':'Lock all elements');
  lock.type='button';lock.dataset.interiorFocus='manager.lock';
  lock.setAttribute('aria-pressed',String(stackLocked));
  lock.addEventListener('click',()=>{
    const locks=new Set(current.lockedSettings);
    if(locks.has('interiorElements'))locks.delete('interiorElements');
    else locks.add('interiorElements');
    changeRecipe({...current,lockedSettings:[...locks]},{bypassLocks:true});
  });
  const activeRow=make(manager,'label');activeRow.className='interior-toggle';
  const toggle=make(activeRow,'input');toggle.type='checkbox';
  toggle.dataset.interiorFocus='field.enabled';toggle.checked=active.enabled;
  make(activeRow,'span','Enabled');
  toggle.addEventListener('change',()=>update('enabled',toggle.checked));
  const typeField=make(interiorCards['interior-style'],'label','Type');
  const typeSelect=make(typeField,'select');
  for(const kind of ['line','band']){const option=document.createElement('option');option.value=kind;option.textContent=kind;typeSelect.append(option);}
  typeSelect.dataset.interiorFocus='field.type';
  typeSelect.value=active.type;
  typeSelect.addEventListener('change',()=>changeRecipe({...current,interiorElements:
    current.interiorElements.map((e,i)=>i===selectedInterior?{...e,type:typeSelect.value,width:typeSelect.value==='band'?22:1.5}:e)}));
  select(interiorCards['interior-style'],'Shape','shape',['straight','wave','zigzag','loop']);
  select(interiorCards['interior-style'],'Stroke','stroke',['solid','dashed','dotted']);
  select(interiorCards['interior-targets'],'Ink','color',['white','black','lighter','darker','custom']);
  const customLabel=make(interiorCards['interior-targets'],'label','Custom colour');
  const customPicker=make(customLabel,'input');
  customLabel.classList.add('interior-colour-picker');
  customPicker.type='color';customPicker.dataset.interiorFocus='field.customColor';
  customPicker.value=active.customColor;customPicker.disabled=active.color!=='custom';
  customPicker.setAttribute('aria-label','Custom interior ink colour');
  const hexValue=make(customLabel,'output',String(customPicker.value).toUpperCase());
  hexValue.className='colour-hex-value';
  customPicker.addEventListener('input',()=>{hexValue.textContent=customPicker.value.toUpperCase();});
  customPicker.addEventListener('change',()=>update('customColor',customPicker.value));
  const amplitude=range(interiorCards['interior-motion'],'Amplitude',
    'amplitude',0,.45,.01);
  // Native range inputs clamp assigned values to their min/max. Match the
  // normalizer so importing a valid 100-cycle field or ±360° phase cannot
  // silently display a different value or truncate it on interaction.
  const frequencyRange=active.placement==='contour'?
    INTERIOR_LIMITS.contourFrequency:INTERIOR_LIMITS.fieldFrequency;
  const frequency=range(interiorCards['interior-motion'],
    active.placement==='contour'?'Cycles':'Frequency',
    'frequency',frequencyRange.min,frequencyRange.max,frequencyRange.step);
  const phaseRange=INTERIOR_LIMITS.phase;
  const phase=range(interiorCards['interior-motion'],'Phase','phase',
    phaseRange.min,phaseRange.max,phaseRange.step);
  // A straight stroke has no oscillation. Disable its dormant controls,
  // but retain frequency for canvas fields, where it controls line spacing.
  const oscillates=active.shape!=='straight';
  amplitude.disabled=!oscillates;
  phase.disabled=!oscillates;
  frequency.disabled=!oscillates&&active.placement==='contour';
  select(interiorCards['interior-placement'],'Placement','placement',['local','field','contour']);
  range(interiorCards['interior-placement'],'Position','position',-.48,.48,.02);
  // Align the native slider lattice with both valid source defaults:
  // line 1.5px and band 22%. With a .15 minimum, a .25 step silently
  // snapped both values, even though the label displayed the true recipe.
  range(interiorCards['interior-placement'],active.type==='band'?'Band width %':'Line width','width',.15,50,.05);
  range(interiorCards['interior-placement'],'Opacity','opacity',0,1,.05);
  // Make application scope visible on the otherwise sparse Elements card.
  // Selective colour targeting can otherwise look like a broken or cropped
  // stroke when only a few slices of a radial composition are decorated.
  const scope=make(manager,'div');
  scope.className='interior-scope';
  const targeting=interiorTargetSummary(active);
  const stackIdentity='Element '+(selectedInterior+1)+' of '+items.length+
    ' · '+(active.enabled?'Enabled':'Hidden');
  scope.textContent=stackIdentity+' · '+targeting;
  scope.dataset.elementVisibility=active.enabled?'enabled':'hidden';
  scope.title=scope.textContent;
  scope.setAttribute('aria-label',scope.textContent);
  const targetBox=make(interiorCards['interior-targets'],'div');targetBox.className='interior-targets';
  const names=['R','O','Y','G','B','I','V'];
  names.forEach((name,i)=>{
    const label=make(targetBox,'label');label.className='interior-colour-chip';
    const fullName=['Red','Orange','Yellow','Green','Blue','Indigo','Violet'][i];
    label.title=fullName;
    label.setAttribute('aria-label',fullName+' colour target');
    const checkbox=make(label,'input');checkbox.type='checkbox';
    checkbox.dataset.interiorFocus='colour.'+i;
    checkbox.setAttribute('aria-label',fullName+' colour target');
    checkbox.checked=!active.colorSlots.length||active.colorSlots.includes(i);
    make(label,'span',name);
    checkbox.addEventListener('change',()=>{
      const base=active.colorSlots.length?active.colorSlots:[0,1,2,3,4,5,6];
      const next=checkbox.checked?[...new Set([...base,i])]:base.filter(x=>x!==i);
      if(!next.length){syncInteriorUI();return;}
      update('colorSlots',next.length===7?[]:next);
    });
  });
  if(active.objectIds.length){
    // Imported recipes can target specific object IDs. Those IDs may no
    // longer exist after changing Structure, leaving correct ink invisible.
    // Expose the minimal reversible recovery without discarding colour
    // filters or changing the geometry/targeting contract.
    const clearShapes=make(interiorCards['interior-targets'],'button',
      'All shapes · clear '+active.objectIds.length+' selected');
    clearShapes.type='button';
    clearShapes.className='text-link-button';
    clearShapes.dataset.interiorFocus='field.objectIds.clear';
    clearShapes.setAttribute('aria-label',
      'Remove selected shape restrictions; keep colour targeting');
    clearShapes.addEventListener('click',()=>update('objectIds',[]));
  }
  if(stackLocked){
    // A locked element stack is read-only. Leaving these controls enabled
    // while respectSettingLocks silently ignored changes looked like a
    // failed preview refresh. Selection and Unlock remain possible.
    for(const card of Object.values(interiorCards))
      for(const control of card.querySelectorAll('input,select,button'))
        if(control!==lock&&control!==choose&&
          !control.hasAttribute('data-interior-switcher'))control.disabled=true;
  }
  restoreFocus();
}
syncInteriorUI();
// A separate, bounded worker handles thumbnails. Every image is drawn from
// its saved recipe: asynchronous screen presentation cannot corrupt history.
// The small reference-renderer fallback is used only on unsupported devices.
let thumbnailWorker=null;
function getThumbnailWorker(){
  if(!thumbnailWorker)thumbnailWorker=createThumbnailQueue();
  return thumbnailWorker;
}
async function drawThumbnail(canvas,recipe,isRelevant=()=>true){
  const worker=getThumbnailWorker();
  if(worker.enabled){
    try{
      const bitmap=await worker.request(normalizeRecipe(recipe),canvas.width,canvas.height);
      try{
        if(isRelevant())canvas.getContext('2d').drawImage(bitmap,0,0);
      }finally{bitmap.close();}
      return;
    }catch(error){console.warn('ROYGBIV thumbnail worker fallback:',error);}
  }
  if(isRelevant())drawWallpaper(canvas,recipe);
}
async function makeHistoryThumbnail(recipe,width,height){
  const canvas=document.createElement('canvas');
  canvas.width=width;canvas.height=height;
  await drawThumbnail(canvas,recipe);
  const image=canvas.toDataURL('image/jpeg',.57);
  canvas.width=canvas.height=0;
  return image;
}
window.addEventListener('pagehide',()=>{
  previewWorker?.dispose();
  thumbnailWorker?.dispose();
  releasePreviewLayers();
  usageRecorder?.action('hidden_unconfirmed',current);
});

const explorationHistory=installExplorationHistory({
  form,preview,getRecipe:()=>current,
  restore:recipe=>changeRecipe(recipe,{bypassLocks:true}),
  renderThumbnail:makeHistoryThumbnail,
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
  changeRecipe(recipe,{cause:'scoped_'+mode+'_'+scope});
  const label=scope==='setting'?
    fullSettingName(name,sourceSettingLabel(form.elements.namedItem(name),name)):
    scope==='tool'?TOOL_LIST.find(tool=>tool.id===name)?.name:
      EDITOR_CATEGORIES.find(category=>category.id===name)?.label;
  const description=label||name.replace(/-/g,' ');
  explorationHistory.remember(current,(mode==='vary'?'Vary ':'Reroll ')+description);
  showNotice((mode==='vary'?'Varied ':'Rerolled ')+description+
    ' ('+modified.length+' '+(modified.length===1?'setting':'settings')+').');
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
  if(!FIELDS.includes(key)&&!['photoAmount','photoGrain','photoHalation','embroideryPitch','embroideryRelief'].includes(key))return;
  if(event.target.type!=='range')return;
  const output=form.querySelector(`output[for="${key}"]`);
  if(output)output.textContent=`${event.target.value}%`;
  const numeric=form.querySelector(`[data-number-for="${key}"]`);
  if(numeric)numeric.value=event.target.value;
  clearTimeout(rangeTimeout);
  rangeTimeout=setTimeout(queueControlUpdate,75);
});
// Selects and checkboxes fire input followed immediately by change. Handling
// only their change event avoids rendering a recipe twice. A completed choice
// must commit SYNCHRONOUSLY: deferring it to a frame races Favourite, Save,
// Undo and subsequent edits, which could otherwise act on the older artwork.
// Only continuous slider movement is coalesced into a frame.
// The original Primes checkbox is moved to the mobile wallpaper-side rail.
// It retains form ownership through its form attribute, but the native change
// cannot bubble through #controls once the original node is reparented.
// Handle genuine form-owned input changes at document level so both mobile
// and desktop have exactly the same authoritative recipe update.
document.addEventListener('change',event=>{
  if(event.target.form!==form)return;
  if(event.target.name==='photoPresetId'){
    const preset=PHOTO_PRESETS[event.target.value];
    if(preset){
      form.elements.namedItem('photoGrain').value=String(preset.grain);
      form.elements.namedItem('photoHalation').value=
        String(preset.halation??PHOTO_PRESETS['film-halation-only'].halation);
      syncPhotoSecondarySlot(event.target.value);
    }
  }
  if(['photoEnabled','photoPresetId','photoAmount','photoGrain','photoHalation',
      'embroideryTarget','embroideryObjectId','embroideryStyle','embroideryDirection',
      'embroideryPitch','embroideryRelief'].includes(event.target.name)){
    clearTimeout(rangeTimeout);
    updateControlsFromInputs();
    return;
  }
  if(!FIELDS.includes(event.target.name)||event.target.name==='family')return;
  clearTimeout(rangeTimeout);
  updateControlsFromInputs();
});
// Switch the original Light controls and new Photo controls in place. The
// same existing Light destination, short edit tray and DOM inputs are retained.
photoCompareButton.addEventListener('click',()=>{
  if(!canComparePhoto())return;
  photoBeforeActive=!photoBeforeActive;
  presentNudgedArtwork(preview,previewLayers,previewDisplayRecipe());
  syncPhotoCompareButton();
});
const lightHost=form.querySelector('.lighting-subsection');
const photoPaneButtons=[...lightHost.querySelectorAll('[data-photo-pane]')];
for(const button of photoPaneButtons)button.addEventListener('click',()=>{
  const photo=button.dataset.photoPane==='photo';
  for(const node of lightHost.children){
    if(node.classList.contains('control-grid')||node.classList.contains('lighting-help'))
      node.hidden=photo;
  }
  lightHost.querySelector('.photo-controls').hidden=!photo;
  for(const option of photoPaneButtons)
    option.setAttribute('aria-pressed',String(option===button));
});
form.addEventListener('submit',event=>event.preventDefault());
seedInput.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();render(fromControls());}});
document.getElementById('applySeed').addEventListener('click',()=>render(fromControls()));
document.getElementById('randomize').addEventListener('click',()=>{
  explorationHistory.remember(current,'Before seed');
  changeRecipe({...fromControls(),seed:newSeed()},{cause:'seed_reroll'});
  explorationHistory.remember(current,'New seed');
});
document.getElementById('randomizeAll').addEventListener('click',()=>{
  const previous=current;
  explorationHistory.remember(current,'Before Random');
  changeRecipe({...randomizeAllRecipe({primesOnly:current.primesOnly}),
    viewZoom:current.viewZoom,viewPanX:current.viewPanX,viewPanY:current.viewPanY,
    geometrySafety:current.geometrySafety},{record:false,cause:'randomize_all'});
  const retired=usageRecorder?.supersede(previous,current,'randomize_all');
  if(retired)creativeFeedback?.showSuperseded(retired);
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
// Normal links retain their original ?r= format. Larger valid designs are
// compressed using only nondefault canonical fields and placed in a fragment
// that the static hosting server never receives as an HTTP request.
document.getElementById('copyLink').addEventListener('click',async()=>{
  const url=location.href;
  // History API failures can leave a stale, deceptively short URL in the
  // address bar. A link is safe to copy only when it actually restores the
  // current wallpaper, not merely because it falls below a length threshold.
  let currentLink=false;
  if(url.length<=MAX_PORTABLE_LINK_CHARS){
    const ordinary=new URLSearchParams(location.search).get('r');
    const compact=portableShareTokenFromLocation(location);
    currentLink=compact
      ? retainedPortableToken===compact&&retainedPortableRecipe&&
        sameRecipe(current,retainedPortableRecipe)
      : !!ordinary&&!!decodeRecipe(ordinary)&&
        sameRecipe(current,decodeRecipe(ordinary));
  }
  if(currentLink){
    await copyText(url);
    return;
  }
  const snapshot=normalizeRecipe(current);
  try{
    const token=await encodePortableRecipe(snapshot);
    if(!sameRecipe(current,snapshot)){
      showNotice('Design changed while preparing a link. Try Copy Link again.');
      return;
    }
    await copyText(portableShareUrl(location.href,token));
  }catch(error){
    showNotice('Design link is too long to open reliably. Use Save recipe JSON or Download PNG to share this wallpaper. '+error.message);
  }
});
document.getElementById('downloadRecipe').addEventListener('click',()=>{
  usageRecorder?.action('save_recipe_json',current);
  downloadBlob(new Blob([JSON.stringify(current,null,2)+'\n'],{type:'application/json'}),`roygbiv-${safeFilename(current.seed)}.json`);
});
favoriteButton.addEventListener('click',()=>{
  // A local click does not fire a storage event in this tab. Read the latest
  // shared state before mutating it so an intervening remote write survives.
  reconcileFavoritesFromStorage();
  if(isFavorite(current)){favorites=favorites.filter(item=>!sameRecipe(item,current));showNotice('Removed from favourites.');usageRecorder?.action('favorite_removed',current);}
  else {favorites.unshift({...current});favorites=favorites.slice(0,60);showNotice('Added to favourites.');usageRecorder?.action('favorite_added',current);}
  saveFavorites();render(current);
  // Desktop can keep Saved visible while its heart action changes the list.
  // Its cards must refresh without waiting for a non-existent same-tab event.
  if(gallery.dataset.view==='saved')void showSaved();
});

function createCard(recipe,index) {
  const scene=resolveScene(recipe);
  const card=document.createElement('button');card.className='thumb';card.type='button';
  card.dataset.recipeSeed=recipe.seed; // Stable source identity for gallery mode restoration.
  card.title=`Open variation ${index+1}`;
  const canvas=document.createElement('canvas');canvas.width=240;canvas.height=520;
  card.append(canvas);
  const name=document.createElement('span');name.className='thumb-caption';name.textContent=titleCase(scene.family);
  const sub=document.createElement('span');sub.className='thumb-sub';sub.textContent=`${titleCase(scene.materialSummary)} · ${scene.orientation}`;
  card.append(name,sub);
  // Gallery selection restores the complete saved recipe, including its own locks.
  card.addEventListener('click',()=>changeRecipe(recipe,{scroll:true,bypassLocks:true}));
  // Append the card immediately; bitmap rendering happens off the main
  // thread and updates it only while it is still in the active gallery.
  drawThumbnail(canvas,recipe,()=>card.isConnected).catch(error=>
    console.warn('ROYGBIV gallery thumbnail failed:',error));
  return card;
}
const galleryTitle=document.getElementById('galleryTitle');
const galleryDescription=galleryTitle.closest('.gallery-head').querySelector('p');
const exploreDescription=galleryDescription.textContent;
// The seven solid colour ribbons are intentionally decorative. They cannot
// masquerade as generated designs or a tappable gallery item.
const galleryEmptyRibbon='<div class="gallery-empty-ribbon" aria-hidden="true">'+
  '<i></i>'.repeat(7)+'</div>';
const exploreEmpty='<div class="gallery-placeholder">'+galleryEmptyRibbon+
  '<strong class="gallery-empty-heading">A blank contact sheet is an invitation.</strong>'+
  '<span>Generate twelve different directions.</span></div>';
const savedEmpty='<div class="gallery-placeholder">'+galleryEmptyRibbon+
  '<strong class="gallery-empty-heading">Nothing saved yet.</strong>'+
  '<span>Find something you love, then tap the heart.</span></div>';
function setGalleryMode(mode){
  const saved=mode==='saved';
  gallery.dataset.view=saved?'saved':'explore';
  galleryTitle.textContent=saved?'Saved wallpapers':'Explore variations';
  galleryDescription.textContent=saved
    ?'Saved on this device. Your favourites stay here while you explore.'
    :exploreDescription;
  document.dispatchEvent(new CustomEvent('roygbiv-gallery-mode-changed',{
    detail:{mode:gallery.dataset.view}
  }));
}
async function showGallery(recipes,button){
  const requestId=++galleryRequestId;
  gallery.replaceChildren();
  if(!recipes.length){
    gallery.innerHTML=gallery.dataset.view==='saved'?savedEmpty:exploreEmpty;
    gallery.removeAttribute('aria-busy');
    // The empty replacement cancels any prior in-flight contact sheet. Since
    // that superseded request cannot own its finally block any more, retire
    // its busy button here, or the Saved button remains disabled forever.
    if(button?.dataset.galleryRequestId){
      delete button.dataset.galleryRequestId;
      setBusy(button,false);
    }
    return;
  }
  gallery.setAttribute('aria-busy','true');
  if(button){
    // Re-entrant Saved requests can target the same source button. A newer
    // request inherits its original label, rather than saving "Generating…"
    // as the text to restore when the older request is cancelled.
    if(!button.dataset.galleryRequestId)setBusy(button,true,'Generating…');
    button.dataset.galleryRequestId=String(requestId);
  }
  try {
    for(let i=0;i<recipes.length;i++){
      if(requestId!==galleryRequestId)break;
      await new Promise(resolve=>requestAnimationFrame(resolve));
      if(requestId!==galleryRequestId)break;
      gallery.append(createCard(recipes[i],i));
    }
  }finally{
    if(button&&button.dataset.galleryRequestId===String(requestId)){
      delete button.dataset.galleryRequestId;
      setBusy(button,false);
    }
    if(requestId===galleryRequestId){
      gallery.removeAttribute('aria-busy');
      // A later tab write can supersede storage events while the initial
      // async Saved cards are still being built. Never publish those stale
      // thumbnails/counts as the completed gallery.
      if(gallery.dataset.view==='saved'&&reconcileFavoritesFromStorage())
        void showSaved();
    }
  }
}
function showExplore(){
  setGalleryMode('explore');
  if(explorationRecipes)return showGallery(explorationRecipes);
  ++galleryRequestId; // Invalidate any pending Saved thumbnail render.
  gallery.removeAttribute('aria-busy');
  gallery.innerHTML=exploreEmpty;
}
function showSaved(){
  setGalleryMode('saved');
  reconcileFavoritesFromStorage();
  return showGallery(favorites,document.getElementById('showFavorites'));
}
document.getElementById('batch').addEventListener('click',async()=>{
  const base=fromControls();
  explorationRecipes=Array.from({length:12},()=>normalizeRecipe({...base,seed:newSeed()}));
  setGalleryMode('explore');
  await showGallery(explorationRecipes,document.getElementById('batch'));
});
document.getElementById('showFavorites').addEventListener('click',showSaved);
document.addEventListener('roygbiv-gallery-view-request',event=>{
  if(event.detail==='explore')showExplore();
  else if(event.detail==='saved')showSaved();
});

const query=new URLSearchParams(location.search).get('r');
let loaded=query?decodeRecipe(query):null;
const portableToken=portableShareTokenFromLocation(location);
if(portableToken){
  try{
    loaded=await decodePortableRecipe(portableToken);
    retainedPortableToken=portableToken;
    retainedPortableRecipe=loaded;
  }catch(error){
    showNotice('Cannot restore compressed design link: '+error.message);
  }
}
toControls(loaded||current);
// The dynamic interior cards were first mounted against the empty default
// recipe. URL restoration changes current directly through toControls(), not
// changeRecipe(), so refresh the actual collection UI before first paint.
// Otherwise imported stacks show stale selectors until some unrelated edit.
syncInteriorUI();
render(current);
// Start only after the first complete reference frame is visible. This keeps
// initial page load and screenshot restoration deterministic.
startPreviewWorker();

hydrateStaticIcons();

// The first render never waits for tracking. Recording is off unless the
// owner explicitly enabled this locally in an earlier visit.
const usageStore=await openUsageStore();
let usageOptedIn=false;
try{usageOptedIn=localStorage.getItem(USAGE_MODE_KEY)==='local';}catch{}
usageRecorder=createCreativeRecorder({
  store:usageStore,enabled:usageOptedIn,
  onError:error=>console.warn('Local activity storage unavailable:',error)
});
if(usageOptedIn)usageRecorder.recoverPrevious(await usageStore.last());
usageRecorder.start(current);
usageGitHubSync=installCreativeRecorderUI({
  recorder:usageRecorder,getRecipe:()=>current,store:usageStore,
  onStopOrClear:()=>creativeFeedback?.hide()
});
creativeFeedback=installCreativeFeedback({recorder:usageRecorder,getRecipe:()=>current});
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden')
    usageRecorder?.action('hidden_unconfirmed',current);
  else usageRecorder?.action('visible_again',current);
});
for(const eventName of ['editor-category-change','editor-tool-changed',
  'roygbiv-mobile-navigation-changed','roygbiv-gallery-mode-changed']){
  document.addEventListener(eventName,event=>{
    const detail=event.detail;
    // Only route names are recorded; never search text or arbitrary form input.
    const route=typeof detail==='string'?detail:
      typeof detail?.mode==='string'?detail.mode: 'changed';
    usageRecorder?.action('navigation',current,{routeKind:eventName,route:route.slice(0,80)});
  });
}
photoCompareButton.addEventListener('click',()=>
  usageRecorder?.action('photo_compare',current,{before:photoBeforeActive}));

