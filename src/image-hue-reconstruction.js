// Optional inverse-graphics proposal using ONLY the canonical hue masks,
// contour walks and the canonical scattered-object/painter model. No source
// pixels, speculative historical seed or external vectorizer is serialized.
import {DESIGN_WIDTH,DESIGN_HEIGHT,HUES,normalizeRecipe,respectSettingLocks}
  from './model.js';
import {extractImageColourRegions,extractVisibleHueCompound} from './image-path.js';
import {GEOMETRY_SNAPSHOT_SCHEMA} from './geometry-asset.js';

/** Converts seven, or an explicitly qualified contiguous first-N subset,
 * of visible pigment masks into independent editable, self-contained rings. Caller supplies the *existing*
 * reconstructionPlacement, so canvas letterboxing remains single-owned.
 * Return null when any slot/shape/lock cannot be represented.
 */
export function observedHueShapeRecipe(image,placement,currentInput,
  {paletteHint='classic',colourAnalysis=null,allowPartial=false}={}){
  const w=image?.width,h=image?.height;
  if(!Number.isInteger(w)||!Number.isInteger(h)||
    w<12||h<12||w*h>650000||image.data?.length!==w*h*4||
    !placement||[placement.x,placement.y,
      placement.width,placement.height].some(v=>!Number.isFinite(v))||
    placement.width<=0||placement.height<=0)return null;
  // Existing reconstruction candidates already computed these exact hue
  // masks through the single shared importer. Accept that ephemeral in-memory
  // analysis, but preserve the standalone helper for independent callers.
  // Never serialize hue masks or allow malformed/incomplete shared evidence
  // to turn tiny anti-aliased flecks into purported editable pigment objects.
  const colours=colourAnalysis??extractImageColourRegions(image,HUES,
    {includeMasks:true});
  const minRegionArea=Math.max(16,Math.floor(w*h*.0008));
  const count=colours?.regions?.length;
  // Source colour slots are 0..N-1: sparse blue-only or red+blue images
  // cannot become two correctly coloured scattered objects. Only the
  // explicitly source-validated compact first-N geometry may use this route.
  const partial=allowPartial===true&&Number.isInteger(count)&&
    count>=2&&count<=6;
  if(!Array.isArray(colours?.masks)||colours.masks.length!==7||
    colours.masks.some(mask=>!(mask instanceof Uint8Array)||
      mask.length!==w*h)||
    !Array.isArray(colours.regions)||(count!==7&&!partial)||
    colours.regions.some((region,index)=>
      region?.index!==index||region.area<minRegionArea||
      (partial&&(region.fillRatio<.48||region.axisRatio>1.9)))||
    !Number.isFinite(colours.coverage)||
    colours.coverage<(partial?.008:.035)||
    colours.coverage>.91||
    !['black','white'].includes(colours.background))return null;
  const items=[];
  for(let index=0;index<count;index++){
    const found=extractVisibleHueCompound(colours.masks[index],w,h);
    // The compact incomplete-colour source signature explicitly requires
    // one substantial connected silhouette per available semantic slot.
    if(!found||(partial&&found.components!==1))return null;
    // A visible silhouette does not identify the source's historical curve,
    // layer ordering, original seed, material or clipped hidden region.
    const x=(placement.x+found.centrePixels[0]*placement.width/w)/DESIGN_WIDTH;
    const y=(placement.y+found.centrePixels[1]*placement.height/h)/DESIGN_HEIGHT;
    const radius=found.radiusPixels*placement.width/w/DESIGN_WIDTH;
    if(!Number.isFinite(radius)||radius<.01||radius>1.2||
      x<-.5||x>1.5||y<-.5||y>1.5)return null;
    items.push({index,x,y,radius,
      shape:{schema:GEOMETRY_SNAPSHOT_SCHEMA,version:1,
        geometry:found.geometry},
      visibleInkPixels:found.visibleInkPixels,
      components:found.components,cropped:found.touchesFrame});
  }
  const original=normalizeRecipe(currentInput||{});
  const candidate=normalizeRecipe({...original,
    // Caller shares the conservative source-visible palette hypothesis.
    // Unknown/ambiguous source colours still fall back to Classic.
    family:'studio',palette:paletteHint,
    // Source-visible shape geometry does not license copying the currently
    // edited wallpaper's private soft/dark Tone into an independent image.
    paletteToneEnabled:false,paletteSaturation:92,paletteLightness:58,
    background:colours.background,
    structure:'regions',regionMode:'scattered',
    // Source-visible hues are indexed in normal ROYGBIV order; stale editor
    // reversal/layer edits cannot imply this source's colour or precedence.
    reverseStripes:false,scatteredLayerOrder:[],
    scatteredShapeKind:'imported',scatteredShape:null,
    scatteredShapeOverrides:items.map(item=>({
      index:item.index,shape:item.shape})),
    scatteredCount:count,scatteredMinSize:0,scatteredMaxSize:75,
    scatteredSpacing:0,scatteredEdgeCrop:0,scatteredOverlap:'overlap',
    scatteredOverrides:items.map(item=>({
      index:item.index,x:item.x,y:item.y,radius:item.radius})),
    dividerColor:'none',dividerWidth:0,
    // A recovered image must not silently inherit the current studio's
    // private materials, Photo pipeline, camera, motifs or other treatments.
    // Existing locks still project through respectSettingLocks below.
    material:'none',material2:'none',material3:'none',
    textureLayer2Enabled:false,textureLayer3Enabled:false,
    textureDisplacement:0,lightingMood:'off',
    glow:0,outline:'none',stripeShadowStrength:0,
    motif:'solid',viewZoom:1,viewPanX:0,viewPanY:0,
    positionX:0,positionY:0,
    surfaceTreatments:[],photoLook:{enabled:false}
  });
  if(candidate.scatteredShapeOverrides?.length!==count||
    candidate.scatteredOverrides?.length!==count)return null;
  const effective=respectSettingLocks(original,candidate);
  if(effective.paletteToneEnabled!==false||
     effective.structure!=='regions'||effective.regionMode!=='scattered'||
    effective.reverseStripes!==false||
    effective.scatteredShapeKind!=='imported'||
    effective.scatteredCount!==count||
    effective.scatteredShapeOverrides?.length!==count||
    effective.scatteredOverrides?.length!==count)return null;
  // If a locked imported shape/placement was projected differently,
  // previewing the ideal would misrepresent Apply: refuse instead.
  if(JSON.stringify(effective.scatteredShapeOverrides)!==
      JSON.stringify(candidate.scatteredShapeOverrides)||
    JSON.stringify(effective.scatteredOverrides)!==
      JSON.stringify(candidate.scatteredOverrides))return null;
  return {recipe:effective,kind:'hue-visible-shapes',
    label:count+' independently editable observed pigment silhouettes',
    uncertainty:(partial?
      'Only the first '+count+' contiguous semantic pigment slots were visibly classified. ':
      '')+
      'These shapes describe only visible source pixels. Hidden or cropped contours, original painter order, seed, palette identity and materials were not recovered.',
    sourceVisibleOnly:true,sourceDimensions:[w,h],
    croppedHueSlots:items.filter(item=>item.cropped).map(item=>item.index),
    componentCounts:items.map(item=>item.components)};
}
