// Inverse-graphics candidate synthesis, not a second scene model.
// The analysis source is bounded by image-path.js; every output is a normal
// editable wallpaper recipe. No source pixels or alleged original seed persist.
import {HUES,normalizeRecipe} from './model.js';
import {appliedDrawnPathRecipe} from './draw-apply-transaction.js';
import {extractImagePathCandidates,extractImageColourRegions,imagePlacement,pathToWallpaper} from './image-path.js';

const RECONSTRUCTION_WIDTH=96, RECONSTRUCTION_HEIGHT=208;
export const RECONSTRUCTION_RENDER_LIMIT=6;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));

/** Geometry-first analysis. Colour slots carry no claim about source provenance. */
export function describeReconstructionImage(image){
  const colour=extractImageColourRegions(image,HUES);
  const paths=extractImagePathCandidates(image);
  const seven=colour.regions.length===7&&
    colour.regions.every(region=>region.area>=image.width*image.height*.001&&
      region.fillRatio>=.45);
  return {background:colour.background,colourRegions:colour.regions,
    paths:paths.slice(0,4),sevenColourRegions:seven,
    coverage:colour.coverage,dimensions:[image.width,image.height]};
}

function strippedCandidateBase(input,background){
  const base=normalizeRecipe(input);
  // Existing user artwork effects must not masquerade as reconstructed effects.
  // Preserve the user's seed/locks for canonical edit semantics, but start
  // with an explicitly neutral treatment rather than inheriting hidden Photo.
  return {...base,family:'studio',palette:'classic',background,
    material:'none',textureDisplacement:0,textureLayer2Enabled:false,
    textureLayer3Enabled:false,lightingMood:'off',glow:0,
    surfaceTreatments:[],photoLook:{enabled:false},motif:'solid',
    outline:'none',stripeShadowStrength:0,
    viewZoom:1,viewPanX:0,viewPanY:0,positionX:0,positionY:0};
}

/** Return a few independently editable canonical alternatives. */
export function reconstructionCandidates(image,recipe){
  const desc=describeReconstructionImage(image);
  const base=strippedCandidateBase(recipe,desc.background);
  const candidates=[];
  if(desc.sevenColourRegions){
    // Colour slot identity comes from the shared model HUES. Overrides live
    // in normal scattered recipes and can be dragged / undone / exported.
    const placed=imagePlacement(image.width,image.height);
    const overrides=desc.colourRegions.map(region=>({
      index:region.index,
      x:(placed.x+region.cx*placed.width)/600,
      y:(placed.y+region.cy*placed.height)/1300,
      radius:clamp(Math.sqrt(region.area/Math.PI)*placed.width/image.width/600,.01,1.2)
    }));
    candidates.push({kind:'regions',label:'Seven colour regions (editable circles)',
      uncertainty:'Approximates each colour region with a circle; holes, overlaps and fine edges may differ.',
      recipe:normalizeRecipe({...base,structure:'regions',regionMode:'scattered',
        scatteredShapeKind:'circle',scatteredCount:7,
        scatteredOverlap:'overlap',scatteredEdgeCrop:0,scatteredSpacing:0,
        scatteredOverrides:overrides})});
  }
  // Colour-band arcs are usually stronger than generic contours; the same
  // extracted geometry and path transaction already power manual image import.
  const distinct=desc.paths.filter(p=>['arc','line','contour'].includes(p.kind) &&
    p.points.length>=2).slice(0,2);
  for(const path of distinct){
    const mapped=pathToWallpaper(path,image.width,image.height);
    if(!mapped)continue;
    for(const spread of [30,65]){
      const candidate=appliedDrawnPathRecipe({...base,spread,stripeWidth:52,
        composition:'single',construction:'ribbon',chaos:0,
        individuality:0,geometrySafety:true},mapped.points,
      mapped.anchors,mapped.corners,false,false);
      candidates.push({kind:'path',label:path.label+' / spread '+spread,
        uncertainty:'Estimated shared centreline and spacing; individual stripe geometry and materials were not recovered.',
        recipe:candidate});
    }
  }
  return candidates.slice(0,RECONSTRUCTION_RENDER_LIMIT);
}

/** Shape-aware but inexpensive comparison at an explicitly bounded resolution.
 * The caller provides real drawWallpaper pixels; this module never rasterizes
 * recipes or runs independent forward geometry.
 */
export function compareReconstructionPixels(source,rendered){
  if(!source||!rendered||source.width!==rendered.width||
    source.height!==rendered.height||
    source.data?.length!==rendered.data?.length)throw Error('Mismatched reconstruction frames');
  const a=source.data,b=rendered.data;
  let colour=0,mask=0,samples=0;
  for(let i=0;i<a.length;i+=8){
    const brightA=Math.max(a[i],a[i+1],a[i+2]);
    const brightB=Math.max(b[i],b[i+1],b[i+2]);
    // Pair colour distance with ink/negative-space coverage. The latter
    // avoids rewarding blank images for narrow colourful structures.
    colour+=(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+
      Math.abs(a[i+2]-b[i+2]))/(3*255);
    mask+=Math.abs(brightA-brightB)/255;
    samples++;
  }
  return (colour*.75+mask*.25)/Math.max(1,samples);
}

/** One synchronous bounded fit pass. The UI can cancel between revisions.
 * render(candidate,width,height) must call the existing renderer and return
 * ImageData-like pixels at the requested dimensions.
 */
export function rankReconstructionCandidates(candidates,source,render){
  if(!Array.isArray(candidates)||candidates.length>RECONSTRUCTION_RENDER_LIMIT)
    throw Error('Reconstruction render budget exceeded');
  if(source?.width!==RECONSTRUCTION_WIDTH||
    source?.height!==RECONSTRUCTION_HEIGHT)throw Error('Invalid fitting frame');
  const results=[];
  for(const candidate of candidates){
    try{
      const pixels=render(candidate.recipe,RECONSTRUCTION_WIDTH,RECONSTRUCTION_HEIGHT);
      const error=compareReconstructionPixels(source,pixels);
      if(Number.isFinite(error))results.push({...candidate,error});
    }catch(error){
      results.push({...candidate,error:Infinity,
        uncertainty:candidate.uncertainty+' Rendering failed: '+(error?.message||'unknown error')});
    }
  }
  return results.sort((a,b)=>a.error-b.error);
}

export const RECONSTRUCTION_FRAME=Object.freeze({
  width:RECONSTRUCTION_WIDTH,height:RECONSTRUCTION_HEIGHT
});
