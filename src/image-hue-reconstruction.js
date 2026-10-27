// Optional inverse-graphics proposal using ONLY the canonical hue masks,
// contour walks and the canonical scattered-object/painter model. No source
// pixels, speculative historical seed or external vectorizer is serialized.
import {DESIGN_WIDTH,DESIGN_HEIGHT,HUES,normalizeRecipe,respectSettingLocks}
  from './model.js';
import {extractImageColourRegions,extractVisibleHueCompound} from './image-path.js';
import {GEOMETRY_SNAPSHOT_SCHEMA,normalizeCompoundRegion} from './geometry-asset.js';

// Bounded source-pixel AA correction. The source-visible loops are traced at
// importer resolution, while the inverse painter scores their Canvas2D
// rasterization at 96×208. Real source-vs-paint optical measurements show a
// 1px edge halo and support a 0.2-source-pixel contour inset on the currently
// representable high-contrast seven-hue scene. Not a global shape resize.
// Lower-resolution standalone callers receive proportionately less offset.
const SOURCE_VISIBLE_ANTI_ALIAS_INSET_PX=0.2;
const SOURCE_VISIBLE_MICROSTAIR_STRENGTH=0.5;

// The source's pigment masks already classify all seven hues. Only sample
// adjacent *same-hue* interior pixels to detect observed material/texture
// variation, not a new palette or segmentation. Ignore sparse/skinny contours
// where anti-aliased source borders swamp any interior-material evidence.
// Sample every other row/column to keep this bounded on phone import.
function substantialInteriorPigmentVariation(image,masks){
  const w=image.width,h=image.height,data=image.data;
  let pairs=0,varied=0;
  for(let y=1;y<h-1;y+=2)for(let x=1;x<w-2;x+=2){
    const pixel=y*w+x;
    for(const mask of masks){
      if(!mask[pixel]||!mask[pixel+1])continue;
      pairs++;
      const i=pixel*4;
      const meanChange=(Math.abs(data[i]-data[i+4])+
        Math.abs(data[i+1]-data[i+5])+
        Math.abs(data[i+2]-data[i+6]))/3;
      if(meanChange>2.5)varied++;
      break;
    }
  }
  // Source variation is meaningful only with enough same-colour interior;
  // thin anti-aliased Draw paths cannot be called a textured canvas from a
  // few boundary pixels. No claim about actual historical materials.
  return pairs>=w*h*.05&&varied/pairs>.45;
}

/**
 * Calibrate only the short pixel-grid staircase corners introduced when
 * source hue masks are traced as asset-local line segments. Deliberate larger
 * shape corners remain unchanged. The already-normalized real compound ring
 * structure (outer/holes/islands) stays the only polygon and validation owner.
 * This is a source-observation adapter, never a headless/worker-only effect.
 */
export function smoothSourceVisibleMicrostairs(found,w,h,{strength=.5}={}){
  if(!found?.geometry?.components?.length||
    !Number.isInteger(w)||!Number.isInteger(h)||w<12||h<12||
    !Number.isFinite(strength)||strength<0||strength>.5)
    throw new RangeError('Invalid bounded source-visible contour smoothing');
  if(strength===0)return found;
  const geometry=found.geometry,[,,vw,vh]=geometry.viewBox;
  const centreX=vw/2,centreY=vh/2;
  const minX=found.centrePixels[0]-centreX;
  const minY=found.centrePixels[1]-centreY;
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const smooth=ring=>ring.map((point,index)=>{
    const before=ring[(index+ring.length-1)%ring.length],
      after=ring[(index+1)%ring.length];
    const a=Math.hypot(point[0]-before[0],point[1]-before[1]);
    const b=Math.hypot(after[0]-point[0],after[1]-point[1]);
    // The short/short-or-moderate grid steps describe raster staircase
    // facets; a genuine long straight/angled user shape stays deliberately
    // sharp. Never move an observed source-frame crop boundary.
    if(!(Math.min(a,b)<1.5&&Math.max(a,b)<12))return point;
    const px=minX+point[0],py=minY+point[1];
    if(px<=.04||px>=w-.04||py<=.04||py>=h-.04)return point;
    const dx=clamp(((before[0]+after[0])/2-point[0])*strength,-.65,.65);
    const dy=clamp(((before[1]+after[1])/2-point[1])*strength,-.65,.65);
    return [clamp(point[0]+dx,0,vw),clamp(point[1]+dy,0,vh)];
  });
  try{
    const next=normalizeCompoundRegion({...geometry,
      components:geometry.components.map(c=>({
        ...c,outer:smooth(c.outer),holes:c.holes.map(smooth)
      }))});
    const vertices=next.components.flatMap(c=>[...c.outer,...c.holes.flat()]);
    const radiusPixels=Math.max(1,...vertices.map(([x,y])=>
      Math.hypot(x-centreX,y-centreY)));
    return {...found,geometry:next,radiusPixels};
  }catch{return found;} // A 1px neck/crossing cannot license missing ink.
}

/** Converts seven, or an explicitly qualified contiguous first-N subset,
 * of visible pigment masks into independent editable, self-contained rings. Caller supplies the *existing*
 * reconstructionPlacement, so canvas letterboxing remains single-owned.
 * Return null when any slot/shape/lock cannot be represented.
 */
export function observedHueShapeRecipe(image,placement,currentInput,
  {paletteHint='classic',colourAnalysis=null,allowPartial=false,sourceTone=null,
    sourceRadialKind='unknown'}={}){
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
  // Contour AA is supported only when shared source evidence says these
  // are solid, nonradial seven-pigment silhouettes. Genuine radial rings and
  // variegated/embroidered ink regress when their edges are contracted.
  // Unknown standalone consumers retain their exact original source rings.
  const safeFlatContours=sourceRadialKind===null&&sourceTone===null&&
    count===7&&colours.background==='black'&&
    !substantialInteriorPigmentVariation(image,colours.masks);
  const opticalInset=safeFlatContours?
    Math.min(SOURCE_VISIBLE_ANTI_ALIAS_INSET_PX,
      SOURCE_VISIBLE_ANTI_ALIAS_INSET_PX*Math.max(w,h)/600):0;
  const items=[];
  for(let index=0;index<count;index++){
    let found=extractVisibleHueCompound(colours.masks[index],w,h,
      {insetPixels:opticalInset});
    // Avoid a second source scan/bitmap or font/render path. The same
    // flat/bright/nonradial source-evidence guard also protects any tiny
    // pixel-grid staircase adjustment. Preserve exact original if unsafe.
    if(found&&opticalInset>0&&SOURCE_VISIBLE_MICROSTAIR_STRENGTH>0)
      found=smoothSourceVisibleMicrostairs(found,w,h,
        {strength:SOURCE_VISIBLE_MICROSTAIR_STRENGTH});
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
    // Only an explicitly measured *source* Tone may enable tint here. In
    // particular, a current editor Tone lock that agrees with that measured
    // appearance must not suppress otherwise faithful observed geometry.
    paletteToneEnabled:sourceTone!==null,
    paletteSaturation:sourceTone?.saturation??92,
    paletteLightness:sourceTone?.lightness??58,
    background:colours.background,
    structure:'regions',regionMode:'scattered',
    // Source-visible hues are indexed in normal ROYGBIV order; stale editor
    // reversal/layer edits cannot imply this source's colour or precedence.
    reverseStripes:false,scatteredLayerOrder:[],
    // This independent appearance adapter bypasses strippedCandidateBase.
    // Suppress unobserved previous Nest settings before canonical painting.
    nestedShapeContours:undefined,
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
  if(effective.paletteToneEnabled!==(sourceTone!==null)||
     (sourceTone&&(effective.paletteSaturation!==sourceTone.saturation||
       effective.paletteLightness!==sourceTone.lightness))||
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
