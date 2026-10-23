// Inverse-graphics candidate synthesis, not a second scene model.
// The analysis source is bounded by image-path.js; every output is a normal
// editable wallpaper recipe. No source pixels or alleged original seed persist.
import {HUES,normalizeRecipe,resolveScene,respectSettingLocks} from './model.js';
import {importedAngleDeltaDegrees} from './import-angle-wrap.js';
import {cloneGeometrySnapshot} from './geometry-asset.js';
import {appliedDrawnPathRecipe} from './draw-apply-transaction.js';
import {extractImagePathCandidates,extractImageColourRegions,extractImageShapeCandidates,imagePlacement,pathToWallpaper} from './image-path.js';

const RECONSTRUCTION_WIDTH=96, RECONSTRUCTION_HEIGHT=208;
// Reconstruction explains the entire imported frame, unlike padded manual
// path extraction. Keep the shared fit/aspect math, including letterboxing.
export const reconstructionPlacement=(width,height)=>imagePlacement(width,height,0);
export const RECONSTRUCTION_RENDER_LIMIT=6;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));

/**
 * Bounded source-image recognition, not a rasterizer or new colour model.
 * At fixed radii/angles compare RGB continuity. Wedges generally preserve
 * colour along each ray; rings preserve it along each circumference.
 * Results are hypotheses for the canonical renderer to accept or reject.
 */
export function radialImageSignature({data,width,height}){
  if(!data||!Number.isInteger(width)||!Number.isInteger(height)||
    width<24||height<24||data.length!==width*height*4||width*height>650000)
    throw Error('Invalid radial analysis image');
  const cx=(width-1)/2,cy=(height-1)/2;
  const maxRadius=Math.min(width,height)*.47;
  const colour=(angle,radius)=>{
    const x=clamp(Math.round(cx+Math.cos(angle)*radius),0,width-1);
    const y=clamp(Math.round(cy+Math.sin(angle)*radius),0,height-1);
    const at=4*(y*width+x);
    return [data[at],data[at+1],data[at+2]];
  };
  const distance=(a,b)=>(Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])+
    Math.abs(a[2]-b[2]))/(3*255);
  const samples=Array.from({length:20},(_,i)=>
    [.17,.35,.57,.78].map(t=>colour(i*Math.PI/10,maxRadius*t)));
  let radial=0,angular=0,rc=0,ac=0;
  for(let i=0;i<samples.length;i++){
    for(let j=1;j<samples[i].length;j++){
      radial+=distance(samples[i][j],samples[i][j-1]);rc++;
    }
    for(let j=0;j<samples[i].length;j++){
      angular+=distance(samples[i][j],samples[(i+1)%samples.length][j]);ac++;
    }
  }
  radial/=Math.max(1,rc);angular/=Math.max(1,ac);
  const kind=angular>.11&&angular>radial*1.7?'rays':
    radial>.11&&radial>angular*1.7?'rings':null;
  return {kind,radialVariation:radial,angularVariation:angular};
}

/** PCA over the shared seven-colour connected-component centroids identifies
 * the tangent of long oblique bands without duplicating Hough extraction. */
export function imageStripeAngle(regions,width,height){
  const points=regions.map(r=>({x:r.cx*width,y:r.cy*height,
    weight:Math.sqrt(Math.max(0,r.area))})).filter(p=>p.weight>0);
  if(points.length<5)return null;
  const sum=points.reduce((a,p)=>a+p.weight,0);
  const meanX=points.reduce((a,p)=>a+p.x*p.weight,0)/sum;
  const meanY=points.reduce((a,p)=>a+p.y*p.weight,0)/sum;
  let xx=0,yy=0,xy=0;
  for(const p of points){
    const x=p.x-meanX,y=p.y-meanY;
    xx+=p.weight*x*x;yy+=p.weight*y*y;xy+=p.weight*x*y;
  }
  xx/=sum;yy/=sum;xy/=sum;
  const major=(xx+yy+Math.hypot(xx-yy,2*xy))/2;
  const minor=(xx+yy-Math.hypot(xx-yy,2*xy))/2;
  if(major<Math.pow(Math.min(width,height)*.12,2)||
    major/Math.max(1,minor)<8)return null;
  const normal=.5*Math.atan2(2*xy,xx-yy);
  return ((normal*180/Math.PI+90)%180+180)%180;
}

/** Geometry-first analysis. Colour slots carry no claim about source provenance. */
export function describeReconstructionImage(image){
  const colour=extractImageColourRegions(image,HUES);
  const paths=extractImagePathCandidates(image);
  const aspect=region=>{
    const [x0,y0,x1,y1]=region.bounds;
    const w=Math.max(1,(x1-x0)*image.width);
    const h=Math.max(1,(y1-y0)*image.height);
    return Math.max(w/h,h/w);
  };
  const seven=colour.regions.length===7&&
    colour.regions.every(region=>region.area>=image.width*image.height*.001&&
      region.fillRatio>=.32&&aspect(region)<2.7);
  const elongated=colour.regions.filter(region=>aspect(region)>3);
  const vertical=elongated.filter(region=>{
    const [x0,y0,x1,y1]=region.bounds;
    return (y1-y0)*image.height>(x1-x0)*image.width;
  });
  const horizontal=elongated.filter(region=>{
    const [x0,y0,x1,y1]=region.bounds;
    return (x1-x0)*image.width>(y1-y0)*image.height;
  });
  const lineDirection=vertical.length>=5?'vertical':
    horizontal.length>=5?'horizontal':null;
  const radial=radialImageSignature(image);
  const centroidAngle=imageStripeAngle(colour.regions,image.width,image.height);
  // The source importer already computes bounded Hough line hypotheses from
  // actual pixel edges. In oblique full-frame stripes, individual hue bands
  // may be cropped and centroids cease to be collinear: use the strongest
  // existing line detector as a fallback, not another edge scanner.
  const lineCandidates=paths.filter(p=>p.kind==='line'&&
    Number.isFinite(p.angle)&&Number.isFinite(p.score)&&p.score>0);
  const strongest=lineCandidates.sort((a,b)=>b.score-a.score)[0];
  const stripeAngle=centroidAngle??strongest?.angle??null;
  return {background:colour.background,colourRegions:colour.regions,
    paths:paths.slice(0,6),sevenColourRegions:seven,lineDirection,
    stripeAngle,radial,coverage:colour.coverage,
    dimensions:[image.width,image.height]};
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
  const current=normalizeRecipe(recipe);
  const base=strippedCandidateBase(current,desc.background);
  const candidates=[];
  // Collinear rainbow colour centres suggest oblique long bands. Derive the
  // absolute tangent from the source and convert to the existing RELATIVE
  // diagonalRotation convention rather than inventing a new angle field.
  if(!desc.lineDirection&&!desc.radial.kind&&
    desc.stripeAngle!==null&&desc.stripeAngle>10&&desc.stripeAngle<170){
    for(const spread of [45,65]){
      const trial=normalizeRecipe({...base,structure:'paths',geometry:'straight',
        orientation:'diagonal',chaos:0,individuality:0,spread,
        stripeWidth:52,diagonalRotation:0});
      const baseline=resolveScene(trial).angle*180/Math.PI;
      candidates.push({kind:'straight',
        label:'Oblique straight ribbons / spread '+spread,
        uncertainty:'Angle estimated from colour centroids; width, seed offset and palette are fitted approximations.',
        recipe:normalizeRecipe({...trial,
          diagonalRotation:importedAngleDeltaDegrees(desc.stripeAngle,baseline)})});
    }
  }

  if(desc.sevenColourRegions){
    // Colour slot identity comes from the shared model HUES. Overrides live
    // in normal scattered recipes and can be dragged / undone / exported.
    const placed=reconstructionPlacement(image.width,image.height);
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
  // Long separate colour components describe procedural bands more honestly
  // than a ring of seven giant circles. Keep direct thickness/spacing editing.
  if(desc.lineDirection){
    for(const spread of [38,56,74]){
      candidates.push({kind:'straight',label:'Procedural '+desc.lineDirection+
        ' bands / spread '+spread,
        uncertainty:'Fitted orientation and approximate spacing; the original seed, group offset, thickness and palette nuances were not recovered.',
        recipe:normalizeRecipe({...base,structure:'paths',geometry:'straight',
          orientation:desc.lineDirection,composition:'single',
          construction:'ribbon',chaos:0,individuality:0,
          stripeWidth:52,spread})});
    }
  }

  if(desc.radial.kind==='rays'){
    for(const [rayCount,rayRotation] of [[14,0],[21,0],[21,30],[28,0]]){
      candidates.push({kind:'radial-rays',label:'Editable radial wedges / '+
        rayCount+' rays, '+rayRotation+'°',
        uncertainty:'Radial wedge family inferred; core, angle, count and source pigment sequence remain uncertain.',
        recipe:normalizeRecipe({...base,structure:'radial',radialMode:'sunburst',
          rayCount,rayRotation,rayCore:10,rayCoverage:100,fieldCenterX:50,
          fieldCenterY:50,dividerColor:'none',dividerWidth:0})});
    }
  }else if(desc.radial.kind==='rings'){
    for(const spec of [{kind:'radial-rings',structure:'radial',radialMode:'concentric',rayCount:14},
      {kind:'radial-rings',structure:'radial',radialMode:'concentric',rayCount:21},
      {kind:'nested-rings',structure:'regions',regionMode:'nested',regionCount:14},
      {kind:'nested-rings',structure:'regions',regionMode:'nested',regionCount:21}]){
      candidates.push({kind:spec.kind,label:spec.kind==='radial-rings'?
        'Editable concentric rays '+spec.rayCount:'Editable nested regions '+spec.regionCount,
        uncertainty:'Concentric geometry inferred; ring count, centre and painter layer topology may differ.',
        recipe:normalizeRecipe({...base,...spec,dividerColor:'none',dividerWidth:0,
          fieldCenterX:50,fieldCenterY:50,regionSides:0})});
    }
  }
  // A single dominant filled silhouette, including source holes and detached
  // islands, can be represented as ONE portable compound shape. This uses the
  // existing asset snapshot and scattered-region scene, not a bitmap overlay.
  // Reject multicolour scenes to avoid painting a seven-hue drawing as red.
  if(desc.colourRegions.length<=2){
    const shape=extractImageShapeCandidates(image).find(c=>c.geometry?.components?.length);
    if(shape){
      const geometry=shape.geometry;
      const [vx,vy,vw,vh]=geometry.viewBox,ox=vx+vw/2,oy=vy+vh/2;
      const box=reconstructionPlacement(image.width,image.height);
      const sourceRings=geometry.components.flatMap(comp=>[comp.outer,...comp.holes]);
      let maxRadius=0;
      for(const ring of sourceRings)for(const [x,y] of ring)
        maxRadius=Math.max(maxRadius,Math.hypot(x-ox,y-oy));
      const radius=clamp(maxRadius*box.width/image.width/600,.01,1.2);
      if(radius>.01&&radius<=1.2){
        candidates.push({kind:'shape',
          label:'One editable compound silhouette'+
            (sourceRings.length>1?' with preserved holes/islands':''),
          uncertainty:'Recognized geometry is portable and independently editable; pigment remains the first ROYGBIV colour and material/lighting are not inferred.',
          recipe:normalizeRecipe({...base,structure:'regions',regionMode:'scattered',
            scatteredShapeKind:'imported',scatteredShape:cloneGeometrySnapshot(geometry),
            scatteredCount:1,scatteredOverlap:'overlap',scatteredSpacing:0,
            scatteredOverrides:[{index:0,
              x:(box.x+ox*box.width/image.width)/600,
              y:(box.y+oy*box.height/image.height)/1300,
              radius}]})});
      }
    }
  }

  // Closed multi-hue silhouettes can originate from looped rainbow ribbons.
  // A traced *outside contour* is usually a poor centreline: offer genuine
  // editable procedural loops instead of overfitting that boundary.
  if(!desc.lineDirection&&!desc.radial.kind&&desc.colourRegions.length>=3&&
    desc.paths.some(path=>path.kind==='contour'&&path.closed)){
    for(const orientation of ['vertical','diagonal']){
      candidates.push({kind:'loop',label:'Procedural '+orientation+' loop',
        uncertainty:'Recognized closed rainbow topology, but loop radius, seed offsets and crossing/occlusion order remain approximate.',
        recipe:normalizeRecipe({...base,structure:'paths',geometry:'loop',
          orientation,composition:'single',construction:'ribbon',
          chaos:0,individuality:0,loopRadius:56,loopSweep:355,
          spread:46,stripeWidth:52})});
    }
  }

  // Colour-band arcs are usually stronger than generic contours; the same
  // extracted geometry and path transaction already power manual image import.
  const distinct=desc.paths.filter(p=>['arc','line','contour'].includes(p.kind) &&
    p.points.length>=2).slice(0,2);
  for(const path of distinct){
    const mapped=pathToWallpaper(path,image.width,image.height,0);
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
  // A preview must depict exactly what Apply can commit. The same canonical
  // lock policy governs both; never rank an uncommittable unlocked ideal.
  const essential=candidate=>candidate.kind==='regions'||candidate.kind==='shape'?
    ['structure','regionMode','scatteredShapeKind']:
    candidate.kind==='nested-rings'?['structure','regionMode']:
    candidate.kind==='radial-rays'||candidate.kind==='radial-rings'?
      ['structure','radialMode']:
    candidate.kind==='path'||candidate.kind==='straight'||candidate.kind==='loop'?
      ['structure','geometry']:['structure'];
  return candidates.map(candidate=>{
    const effective=respectSettingLocks(current,candidate.recipe);
    const blocked=current.lockedSettings.filter(key=>
      JSON.stringify(effective[key])!==JSON.stringify(candidate.recipe[key]));
    return {...candidate,recipe:effective,lockedChanges:blocked};
  }).filter(candidate=>!essential(candidate).some(key=>
    candidate.lockedChanges.includes(key))).slice(0,RECONSTRUCTION_RENDER_LIMIT);
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


/**
 * Deliberately small, deterministic coarse-to-fine fit using the canonical
 * painter callback. One candidate at a time; never holds multiple raster
 * outputs and cannot exceed the supplied render budget. Useful only after
 * topology selection, not a claim to identify historical parameters.
 */
export function refineReconstructionCandidate(candidate,source,render,{maxRenders=10}={}){
  if(!candidate||!['straight','loop','radial-rays','radial-rings','nested-rings']
    .includes(candidate.kind)||!Number.isFinite(candidate.error))return candidate;
  if(!Number.isInteger(maxRenders)||maxRenders<0||maxRenders>16)
    throw Error('Invalid reconstruction fitting budget');
  let best=candidate,renders=0;
  const fields=candidate.kind==='straight'?[
    [candidate.recipe.orientation==='horizontal'?'positionY':'positionX',[-8,-4,4,8]],
    ['spread',[-16,-8,8,16]],['stripeWidth',[-15,15]]
  ]:candidate.kind==='loop'?[
    ['positionX',[-6,6]],['positionY',[-6,6]],
    ['loopRadius',[-10,10]],['spread',[-10,10]],['stripeWidth',[-15,15]]
  ]:candidate.kind==='radial-rays'?[
    ['rayRotation',[-10,-5,5,10]],['fieldCenterX',[-5,5]],
    ['fieldCenterY',[-5,5]],['rayCore',[-10,10]]
  ]:candidate.kind==='radial-rings'?[
    ['fieldCenterX',[-5,5]],['fieldCenterY',[-5,5]],
    ['rayCount',[-7,7]]
  ]:[
    ['fieldCenterX',[-5,5]],['fieldCenterY',[-5,5]],
    ['regionCount',[-7,7]]
  ];
  for(const [field,deltas] of fields){
    // Compare all deltas to the same coordinate baseline, rather than
    // chasing a newly improved value and skipping the true neighbouring fit.
    const origin=best.recipe[field];
    for(const delta of deltas){
      if(renders>=maxRenders)break;
      const recipe=normalizeRecipe({...best.recipe,[field]:origin+delta});
      if(recipe[field]===best.recipe[field])continue;
      const result=render(recipe,RECONSTRUCTION_WIDTH,RECONSTRUCTION_HEIGHT);
      renders++;
      const error=compareReconstructionPixels(source,result);
      if(error+1e-9<best.error)
        best={...best,recipe,error,label:candidate.label+' · fitted',
          adjustments:[...(best.adjustments||[]),{field,value:recipe[field]}]};
    }
  }
  return {...best,refinementRenders:renders};
}
