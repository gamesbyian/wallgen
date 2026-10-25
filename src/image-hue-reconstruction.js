// Optional inverse-graphics proposal using ONLY the canonical hue masks,
// contour walks and the canonical scattered-object/painter model. No source
// pixels, speculative historical seed or external vectorizer is serialized.
import {DESIGN_WIDTH,DESIGN_HEIGHT,HUES,normalizeRecipe,respectSettingLocks}
  from './model.js';
import {extractImageColourRegions,extractVisibleHueCompound} from './image-path.js';
import {GEOMETRY_SNAPSHOT_SCHEMA} from './geometry-asset.js';

/** Converts all seven visible pigment masks into independent editable,
 * self-contained scattered-region rings. Caller supplies the *existing*
 * reconstructionPlacement, so canvas letterboxing remains single-owned.
 * Return null when any slot/shape/lock cannot be represented.
 */
export function observedHueShapeRecipe(image,placement,currentInput){
  const w=image?.width,h=image?.height;
  if(!Number.isInteger(w)||!Number.isInteger(h)||
    w<12||h<12||w*h>650000||image.data?.length!==w*h*4||
    !placement||[placement.x,placement.y,
      placement.width,placement.height].some(v=>!Number.isFinite(v))||
    placement.width<=0||placement.height<=0)return null;
  const colours=extractImageColourRegions(image,HUES,{includeMasks:true});
  if(colours.regions.length!==7||colours.coverage<.035||
    colours.coverage>.91)return null;
  const items=[];
  for(let index=0;index<7;index++){
    const found=extractVisibleHueCompound(colours.masks[index],w,h);
    if(!found)return null;
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
    family:'studio',palette:'classic',
    background:colours.background,
    structure:'regions',regionMode:'scattered',
    scatteredShapeKind:'imported',scatteredShape:null,
    scatteredShapeOverrides:items.map(item=>({
      index:item.index,shape:item.shape})),
    scatteredCount:7,scatteredMinSize:0,scatteredMaxSize:75,
    scatteredSpacing:0,scatteredEdgeCrop:0,scatteredOverlap:'overlap',
    scatteredOverrides:items.map(item=>({
      index:item.index,x:item.x,y:item.y,radius:item.radius})),
    dividerColor:'none',dividerWidth:0,
    material:'none',lightingMood:'off',
    glow:0,outline:'none',stripeShadowStrength:0,
    surfaceTreatments:[],photoLook:{enabled:false}
  });
  if(candidate.scatteredShapeOverrides?.length!==7||
    candidate.scatteredOverrides?.length!==7)return null;
  const effective=respectSettingLocks(original,candidate);
  if(effective.structure!=='regions'||effective.regionMode!=='scattered'||
    effective.scatteredShapeKind!=='imported'||
    effective.scatteredShapeOverrides?.length!==7||
    effective.scatteredOverrides?.length!==7)return null;
  // If a locked imported shape/placement was projected differently,
  // previewing the ideal would misrepresent Apply: refuse instead.
  if(JSON.stringify(effective.scatteredShapeOverrides)!==
      JSON.stringify(candidate.scatteredShapeOverrides)||
    JSON.stringify(effective.scatteredOverrides)!==
      JSON.stringify(candidate.scatteredOverrides))return null;
  return {recipe:effective,kind:'hue-visible-shapes',
    label:'Seven independently editable observed pigment silhouettes',
    uncertainty:'These shapes describe only visible source pixels. Hidden or cropped contours, original painter order, seed, palette identity and materials were not recovered.',
    sourceVisibleOnly:true,sourceDimensions:[w,h],
    croppedHueSlots:items.filter(item=>item.cropped).map(item=>item.index),
    componentCounts:items.map(item=>item.components)};
}
