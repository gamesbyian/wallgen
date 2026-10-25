// Inverse-graphics candidate synthesis, not a second scene model.
// The analysis source is bounded by image-path.js; every output is a normal
// editable wallpaper recipe. No source pixels or alleged original seed persist.
import {HUES,PALETTES,COLOR_STORIES,normalizeRecipe,resolveScene,respectSettingLocks} from './model.js';
import {importedAngleDeltaDegrees} from './import-angle-wrap.js';
import {cloneGeometrySnapshot} from './geometry-asset.js';
import {observedHueShapeRecipe} from './image-hue-reconstruction.js';
import {appliedDrawnPathRecipe} from './draw-apply-transaction.js';
import {extractImagePathCandidates,extractImageColourRegions,extractImageShapeCandidates,imagePlacement,pathToWallpaper} from './image-path.js?v=20261023-band-measure1';

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
  const distance=(a,b)=>(Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])+
    Math.abs(a[2]-b[2]))/(3*255);
  // The established 20-spoke, wide-radius centre classifier is validated on
  // production rings, rays and nested fields. The narrower offset probe alone
  // misses production rings (#626 R0): preserve its answer exactly.
  const midpointX=(width-1)/2,midpointY=(height-1)/2;
  const legacyColour=(angle,radius)=>{
    const x=clamp(Math.round(midpointX+Math.cos(angle)*radius),0,width-1);
    const y=clamp(Math.round(midpointY+Math.sin(angle)*radius),0,height-1);
    const at=4*(y*width+x);
    return [data[at],data[at+1],data[at+2]];
  };
  const wideRadius=Math.min(width,height)*.47;
  const centreSamples=Array.from({length:20},(_,i)=>
    [.17,.35,.57,.78].map(t=>legacyColour(i*Math.PI/10,wideRadius*t)));
  let centreRadial=0,centreAngular=0,centreRC=0,centreAC=0;
  for(let i=0;i<centreSamples.length;i++){
    for(let j=1;j<centreSamples[i].length;j++){
      centreRadial+=distance(centreSamples[i][j],centreSamples[i][j-1]);centreRC++;
    }
    for(let j=0;j<centreSamples[i].length;j++){
      centreAngular+=distance(centreSamples[i][j],
        centreSamples[(i+1)%centreSamples.length][j]);centreAC++;
    }
  }
  centreRadial/=Math.max(1,centreRC);
  centreAngular/=Math.max(1,centreAC);
  const centreKind=centreAngular>.11&&centreAngular>centreRadial*1.7?'rays':
    centreRadial>.11&&centreRadial>centreAngular*1.7?'rings':null;
  const centreStrength=centreKind==='rings'?
    centreRadial-centreAngular*1.7:
    centreAngular-centreRadial*1.7;
  // Test displaced centres while retaining the established answer unless
  // an off-centre hypothesis is overwhelmingly more coherent.
  // Test the frame centre first, then a small, fixed set of off-centre
  // hypotheses. These are cheap image reads, not additional renderer trials.
  // Keep a common radius across hypotheses to avoid favoring a smaller crop.
  const radius=Math.min(width,height)*.31;
  const probe=(px,py)=>{
    const cx=(width-1)*px,cy=(height-1)*py;
    const colour=(angle,r)=>{
      const x=clamp(Math.round(cx+Math.cos(angle)*r),0,width-1);
      const y=clamp(Math.round(cy+Math.sin(angle)*r),0,height-1);
      const at=4*(y*width+x);
      return [data[at],data[at+1],data[at+2]];
    };
    const samples=Array.from({length:32},(_,i)=>
      [.23,.42,.65,.90].map(t=>colour(i*Math.PI/16,radius*t)));
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
    const rayStrength=angular-radial*1.7;
    const ringStrength=radial-angular*1.7;
    return {radialVariation:radial,angularVariation:angular,
      kind:rayStrength>.11?'rays':ringStrength>.11?'rings':null,
      strength:Math.max(rayStrength,ringStrength),centerX:px*100,centerY:py*100};
  };
  const centre=probe(.5,.5);
  let best=centre;
  for(const [x,y] of [[.35,.5],[.65,.5],[.5,.35],[.5,.65],
    [.35,.35],[.65,.35],[.35,.65],[.65,.65]]){
    const next=probe(x,y);
    // Require a substantial gain before displacing the centre, especially
    // for nonradial source imagery that happens to have coloured patches.
    if(next.kind&&next.strength>Math.max(.13,best.strength+.045))
      best=next;
  }
  if(centreKind&&!(best.kind===centreKind&&
    (best.centerX!==50||best.centerY!==50)&&
    best.strength>.28&&best.strength>centreStrength*2.5))
    return {kind:centreKind,radialVariation:centreRadial,
      angularVariation:centreAngular,centerX:50,centerY:50};
  return {kind:best.kind,radialVariation:best.radialVariation,
    angularVariation:best.angularVariation,
    centerX:best.kind?best.centerX:50,centerY:best.kind?best.centerY:50};
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

/**
 * Lightweight curvature signal from the shared importer's already extracted
 * arc/contour polylines. No second segmentation or source-image rasterizer.
 * Use only to order hypotheses; measured renderer pixels select the winner.
 */
export function imageCurveSignature(paths,width,height){
  const source=paths.find(p=>p.kind==='arc'&&p.points.length>=6)||
    paths.find(p=>p.kind==='contour'&&p.points.length>=6);
  if(!source)return {kind:null,sharpTurns:0,netTurn:0};
  const vertices=source.points.map(([x,y])=>[x*width,y*height]);
  let sharp=0,net=0,absolute=0,previous=null,turns=0;
  for(let i=1;i<vertices.length;i++){
    const [ax,ay]=vertices[i-1],[bx,by]=vertices[i];
    const dx=bx-ax,dy=by-ay;
    if(Math.hypot(dx,dy)<.5)continue;
    const angle=Math.atan2(dy,dx);
    if(previous!==null){
      const turn=Math.atan2(Math.sin(angle-previous),Math.cos(angle-previous));
      const magnitude=Math.abs(turn);
      if(magnitude>.6)sharp++;
      if(magnitude>.035){net+=turn;absolute+=magnitude;turns++;}
    }
    previous=angle;
  }
  // Importer smoothing intentionally spreads an authored V corner across
  // several samples, so the adjacent-vertex sharpTurns value can be zero
  // even for a double-kink ribbon. Evaluate the SAME already extracted
  // centreline with a wider physical tangent baseline (no new pixel pass).
  const bendPeaks=[];
  if(source.kind==='arc'&&vertices.length>=12){
    // image-path.js may trace either X-ordered or Y-ordered colour centrelines
    // (#630). Measuring every long-baseline bend against X alone discards
    // genuine upright V/S turns, even when the shared path retains them.
    const extent=axis=>Math.max(...vertices.map(p=>p[axis]))-
      Math.min(...vertices.map(p=>p[axis]));
    const dominant=extent(1)>extent(0)*1.25?1:0;
    const station=p=>p[dominant];
    const reach=Math.max(10,(dominant?height:width)*.065);
    const spaced=(dominant?height:width)*.13;
    for(let i=2;i<vertices.length-2;i++){
      let lo=i-1,hi=i+1;
      while(lo>0&&station(vertices[i])-station(vertices[lo])<reach)lo--;
      while(hi<vertices.length-1&&station(vertices[hi])-station(vertices[i])<reach)hi++;
      if(station(vertices[i])-station(vertices[lo])<reach*.8||
        station(vertices[hi])-station(vertices[i])<reach*.8)continue;
      const u=[vertices[i][0]-vertices[lo][0],vertices[i][1]-vertices[lo][1]];
      const v=[vertices[hi][0]-vertices[i][0],vertices[hi][1]-vertices[i][1]];
      const bend=Math.abs(Math.atan2(u[0]*v[1]-u[1]*v[0],
        u[0]*v[0]+u[1]*v[1]));
      if(bend>.38)bendPeaks.push({station:station(vertices[i]),bend});
    }
    bendPeaks.sort((a,b)=>b.bend-a.bend);
    const separated=[];
    for(const peak of bendPeaks){
      if(separated.every(p=>Math.abs(p.station-peak.station)>spaced))
        separated.push(peak);
      if(separated.length>=4)break;
    }
    bendPeaks.length=0;
    bendPeaks.push(...separated);
  }
  const kind=Math.abs(net)>Math.PI*.95?'hairpin':
    sharp>=3&&absolute>1.7?'jagged':
    source.kind==='arc'&&turns>=2?'wave':null;
  return {kind,sharpTurns:sharp,netTurn:net,angularBends:bendPeaks.length};
}

/**
 * Reuse the component covariance and pigment counts already extracted by
 * image-path.js. Seven parallel hue components provide independent physical
 * measurements of ribbon centre-to-centre gap and ink width in source pixels.
 * Ignore loops, sparse/reversed fragments and incoherent external pictures.
 */
export function measuredRainbowRibbonBands(regions,width,height){
  if(!Array.isArray(regions)||regions.length!==7||!Number.isFinite(width)||
    !Number.isFinite(height)||width<12||height<12)return null;
  const complete=regions.filter(r=>r&&r.axisRatio>=4&&r.area>=16&&
    Number.isFinite(r.majorStd)&&r.majorStd>3&&
    Number.isFinite(r.axisAngle)&&Number.isFinite(r.cx)&&Number.isFinite(r.cy));
  let bands=complete;
  if(bands.length!==7){
    // Seven observed hues may contain four complete ribbon spans and three
    // progressively clipped ends. Recover gap/ink estimates from the four
    // intact spans ONLY when the truncated pigments corroborate one axis
    // and the same physical ink width. Ordinary seven-ribbon proof wins first.
    const head=regions.slice(0,4),tail=regions.slice(4);
    const axis=head.map(r=>r?.axisAngle);
    const common=axis.every(Number.isFinite)&&
      axis.every(a=>Math.abs(a-axis[0])<5);
    const wide=head.every(r=>r&&r.axisRatio>=7&&r.area>=16&&
      r.bounds?.[0]<=.04&&r.bounds?.[2]>=.96&&
      Number.isFinite(r.majorStd)&&r.majorStd>10);
    // Every shortened hue must be clipped by the SAME image edge.
    // Mirroring canonical Jagged art reverses only which edge advances.
    // The original seven-axis/ink-width checks and clipped-contour-rhythm
    // gate in image-path.js remain mandatory; never blend partial sides.
    const intactTail=tail.every((r,i)=>r&&r.area>=16&&
      Number.isFinite(r.axisAngle)&&Math.abs(r.axisAngle-axis[0])<=5&&
      Number.isFinite(r.majorStd)&&
      r.majorStd<head[3].majorStd*(1-i*.16));
    const fromLeft=intactTail&&tail.every((r,i)=>
      r.bounds?.[2]>=.96&&r.bounds?.[0]>=.15&&
      r.bounds[0]>(i?tail[i-1].bounds[0]:head[3].bounds[0])+.05);
    const fromRight=intactTail&&tail.every((r,i)=>
      r.bounds?.[0]<=.04&&r.bounds?.[2]<=.85&&
      r.bounds[2]<(i?tail[i-1].bounds[2]:head[3].bounds[2])-.05);
    const truncation=fromLeft||fromRight;
    const widths=regions.map(r=>r?.minorStd);
    const consistentWidth=widths.every(x=>Number.isFinite(x)&&x>2)&&
      Math.max(...widths)/Math.min(...widths)<1.15;
    if(!(common&&wide&&truncation&&consistentWidth))return null;
    bands=head;
  }
  const median=items=>items.slice().sort((a,b)=>a-b)[Math.floor(items.length/2)];
  const orientations=bands.map(r=>r.axisAngle).sort((a,b)=>a-b);
  const angle=median(orientations);
  if(orientations.some(a=>Math.abs(a-angle)>10))return null;
  const radians=angle*Math.PI/180,nx=-Math.sin(radians),ny=Math.cos(radians);
  const centres=bands.map(r=>(r.cx*width)*nx+(r.cy*height)*ny)
    .sort((a,b)=>a-b);
  const distances=centres.slice(1).map((v,i)=>v-centres[i]);
  const gap=median(distances);
  if(gap<3||distances.some(d=>d<gap*.55||d>gap*1.65))return null;
  const widths=bands.map(r=>r.area/(Math.sqrt(12)*r.majorStd));
  const thickness=median(widths);
  if(thickness<2||widths.some(v=>v<thickness*.55||v>thickness*1.8)||
    thickness/gap<.08||thickness/gap>1.5)return null;
  return {angle,centreGapPx:gap,thicknessPx:thickness,
    inkToGapRatio:thickness/gap};
}

/**
 * Invert the *current canonical* scene spacing and fixed-reference-width
 * equations, not an invented parallel-ribbon rasterizer. Source pixels
 * indicate a plausible initial guess; drawWallpaper still chooses by fit.
 */
export function seedMeasuredRibbonControls(recipe,metrics,imageWidth,imageHeight){
  if(!metrics||!Number.isFinite(metrics.centreGapPx)||
    !Number.isFinite(metrics.thicknessPx))return recipe;
  const placement=reconstructionPlacement(imageWidth,imageHeight);
  const scale=placement.width/imageWidth;
  if(!Number.isFinite(scale)||scale<=0)return recipe;
  const angle=metrics.angle*Math.PI/180;
  const span=600*Math.abs(Math.sin(angle))+1300*Math.abs(Math.cos(angle));
  const spreadFactor=(metrics.centreGapPx*scale*6)/span;
  const referenceFactor=.10+.335*Math.pow(56/50,1.5);
  const thicknessFactor=(metrics.thicknessPx*scale*6)/(span*referenceFactor);
  if(!Number.isFinite(spreadFactor)||!Number.isFinite(thicknessFactor)||
    spreadFactor<=.10||thicknessFactor<=.12)return recipe;
  const spread=50*Math.pow((spreadFactor-.10)/.335,2/3);
  const stripeWidth=50*Math.pow((thicknessFactor-.12)/.395,1/1.85);
  // Reject out-of-range estimates rather than hiding clipping of noncanonical
  // input: this is only an optional measured starting guess for geometry.
  if(spread<8||spread>110||stripeWidth<8||stripeWidth>110)return recipe;
  return normalizeRecipe({...recipe,spread:clamp(Math.round(spread),0,100),
    stripeWidth:clamp(Math.round(stripeWidth),0,100)});
}

/**
 * Compare observed hue-mask pigment appearance with this product's CURRENT
 * colour stories. This is a conservative source-only proposal, never an
 * assertion that the original artwork used that palette or was made here.
 * No parallel colour segmentation or extra forward renderer is introduced.
 * Mixed paint, photographs, fading and partial hues should simply fall back
 * to the established classic starting point and explicit uncertainty.
 */
export function measuredCanonicalPalette(regions){
  if(!Array.isArray(regions)||regions.length!==7)return null;
  const ordered=Array.from({length:7},(_,index)=>
    regions.find(region=>region?.index===index));
  if(ordered.some(region=>!region||region.area<16||
    !Array.isArray(region.meanRGB)||region.meanRGB.length!==3||
    region.meanRGB.some(value=>!Number.isFinite(value)||value<0||value>255)))
    return null;
  const observed=ordered.map(region=>{
    const [r,g,b]=region.meanRGB.map(value=>value/255);
    const hi=Math.max(r,g,b),lo=Math.min(r,g,b),delta=hi-lo;
    const light=(hi+lo)/2;
    const sat=delta/(1-Math.abs(2*light-1)||1);
    let hue=0;
    if(delta>0){
      if(hi===r)hue=((g-b)/delta)%6;
      else if(hi===g)hue=(b-r)/delta+2;
      else hue=(r-g)/delta+4;
    }
    return {hue:(hue*60+360)%360,sat:sat*100,light:light*100};
  });
  // In muted, textured or photographed sources, apparent hue and lightness
  // can disagree with every canonical colour story. Reject rather than
  // assigning an implausible palette to seven coincidental hue components.
  const ranked=PALETTES.map(palette=>{
    const story=COLOR_STORIES[palette];
    const perHue=observed.map((swatch,index)=>{
      const expected=(HUES[index]+(story.hue?.[index]??0)+360)%360;
      const delta=Math.abs(swatch.hue-expected);
      const hueError=Math.min(delta,360-delta)/12;
      const satError=Math.abs(swatch.sat-story.sat)/18;
      const lightError=Math.abs(
        swatch.light-story.light-(story.lights?.[index]??0))/13;
      return hueError+satError+lightError;
    });
    return {palette,error:perHue.reduce((sum,v)=>sum+v,0)/7,
      worst:Math.max(...perHue)};
  }).sort((a,b)=>a.error-b.error);
  const [best,next]=ranked;
  const classic=ranked.find(item=>item.palette==='classic');
  // Classic remains the noncommittal fallback. HSL stories that are too
  // similar to distinguish do not warrant a source-provenance claim.
  if(best.palette==='classic'||best.error>1||best.worst>2.1||
    classic.error-best.error<.65||next.error-best.error<.2)return null;
  return {palette:best.palette,appearanceError:best.error,
    classicAppearanceError:classic.error};
}

/** Geometry-first analysis. Colour slots carry no claim about source provenance. */
export function describeReconstructionImage(image){
  const colour=extractImageColourRegions(image,HUES,{includeRepeatShape:true});
  const paths=extractImagePathCandidates(image);
  const aspect=region=>{
    const [x0,y0,x1,y1]=region.bounds;
    const w=Math.max(1,(x1-x0)*image.width);
    const h=Math.max(1,(y1-y0)*image.height);
    return Math.max(w/h,h/w);
  };
  // The per-hue component principal axes already computed by the shared
  // importer (#581) resolve true diagonal ribbons that centroid-only PCA
  // cannot distinguish from dispersed circles. Keep #584's radial signature
  // as independent stronger topology evidence for rays/rings/nested fields.
  const axes=colour.regions.filter(region=>region.axisRatio>=3.2&&
    Math.abs(region.axisAngle)>=12&&Math.abs(region.axisAngle)<=78);
  const angles=axes.map(region=>region.axisAngle).sort((a,b)=>a-b);
  const median=angles[Math.floor(angles.length/2)];
  const coherent=axes.filter(region=>Math.abs(region.axisAngle-median)<=10);
  const componentDiagonalAngle=coherent.length>=5?Math.abs(median):null;
  // Ordinary scattered objects can repeat the seven semantic colour slots.
  // Preserve all connected islands only for the conservative 2-per-hue case:
  // compact components must resemble disks, not occluded ribbon fragments.
  // The existing 70-object scattered scene already supports this topology.
  const repeatedByHue=Array.from({length:7},(_,index)=>
    colour.componentRegions.filter(region=>region.index===index));
  const repeatedColourRegions=repeatedByHue.every(group=>group.length===2&&
    group.every(region=>region.area>=16&&region.fillRatio>=.48&&
      region.axisRatio<=1.9))?
    Array.from({length:14},(_,i)=>repeatedByHue[i%7][Math.floor(i/7)]):
    null;
  const seven=componentDiagonalAngle===null&&
    colour.componentRegions.length===7&&colour.regions.length===7&&
    colour.regions.every(region=>region.area>=image.width*image.height*.001&&
      region.fillRatio>=.32&&aspect(region)<2.7);
  // A partially populated, compact first-N hue set is already a valid
  // canonical scene of N editable circles. Earlier recognition required all
  // seven pigments and wrongly discarded otherwise straightforward source
  // geometry. Do not assume that arbitrary *missing middle* colour slots,
  // overlapping fragments or elongated occlusions can be represented.
  const incompleteColourRegions=colour.regions.length>=3&&
    colour.regions.length<=6&&
    colour.componentRegions.length===colour.regions.length&&
    componentDiagonalAngle===null&&
    colour.regions.every((region,index)=>region.index===index&&
      region.area>=Math.max(16,image.width*image.height*.001)&&
      region.fillRatio>=.48&&region.axisRatio<=1.9&&aspect(region)<2.3);
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
  const stripeAngle=imageStripeAngle(colour.regions,image.width,image.height);
  const curve=imageCurveSignature(paths,image.width,image.height);
  const ribbonBands=measuredRainbowRibbonBands(colour.regions,image.width,image.height);
  const paletteHypothesis=measuredCanonicalPalette(colour.regions);
  return {background:colour.background,colourRegions:colour.regions,
    paletteHypothesis,
    // Bounding-box crop progression alone can also be produced by unrelated
    // later pigments. A clipped shared stamp must ALSO have independently
    // measured coherent seven-hue ribbon axis, thickness and spacing.
    // Full sevenfold-congruent stamps retain their existing acceptance path.
    repeatShape:colour.repeatShape?.clipped&&!ribbonBands?
      null:colour.repeatShape,
    circleHints:colour.circleHints,
    inferredCircleLayers:colour.inferredCircleLayers,
    repeatedColourRegions,incompleteColourRegions,
    paths:paths.slice(0,6),sevenColourRegions:seven,lineDirection,
    stripeAngle,componentDiagonalAngle,radial,curve,ribbonBands,coverage:colour.coverage,
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

/**
 * First spend the six-render budget on independent editable structures, then
 * fill remaining slots with alternative offsets/spreads. Without this, three
 * diagonal rotations and two loops silently crowd out the jagged hypothesis
 * and even the Draw fallback that users need on unsupported art.
 */
export function diverseReconstructionCandidates(candidates,limit=RECONSTRUCTION_RENDER_LIMIT){
  if(!Array.isArray(candidates)||!Number.isInteger(limit)||limit<0||
    limit>RECONSTRUCTION_RENDER_LIMIT)throw Error('Invalid candidate budget');
  const chosen=[],kinds=new Set(),included=new Set();
  for(const candidate of candidates){
    if(chosen.length===limit)break;
    if(!kinds.has(candidate.kind)){
      chosen.push(candidate);included.add(candidate);kinds.add(candidate.kind);
    }
  }
  for(const candidate of candidates){
    if(chosen.length===limit)break;
    if(!included.has(candidate)){chosen.push(candidate);included.add(candidate);}
  }
  return chosen;
}

/** Return a few independently editable canonical alternatives. */
export function reconstructionCandidates(image,recipe){
  const desc=describeReconstructionImage(image);
  const current=normalizeRecipe(recipe);
  // Prefer a strongly distinguishable *appearance* hypothesis only. The
  // canonical painter still ranks candidate geometry; history is unknown.
  const base={...strippedCandidateBase(current,desc.background),
    palette:desc.paletteHypothesis?.palette??'classic'};
  const candidates=[];
  // Appearance-first per-hue silhouettes are a normal *editable* canonical
  // recipe, but only credible for observed multi-band nonradial geometry.
  // Source contour evidence cannot prove hidden strands or source seed.
  // Preserve the ordinary six initial renderer paints by replacing ONE
  // structurally redundant low-priority hypothesis, never adding a seventh.
  const observedEligible=!desc.radial.kind&&
    !desc.sevenColourRegions&&desc.colourRegions.length===7&&
    (desc.repeatShape?.clipped||
      ['hairpin','loop'].includes(desc.curve.kind)||
      desc.paths.some(path=>path.kind==='contour'&&path.closed));
  const observed=observedEligible?observedHueShapeRecipe(image,
    reconstructionPlacement(image.width,image.height),current):null;
  const includeObserved=prior=>{
    if(!observed)return prior;
    const result=[...prior];
    if(result.length>=RECONSTRUCTION_RENDER_LIMIT){
      let redundant=-1;
      for(let i=result.length-1;i>0;i--){
        if(result.slice(0,i).some(other=>other.kind===result[i].kind&&
          (other.kind!=='path'||
            other.recipe.geometrySafety===result[i].recipe.geometrySafety))){
          redundant=i;break;
        }
      }
      // Keep the first/proven highest-priority hypothesis, safe Draw, and
      // expanded Draw when its independent band geometry is supported.
      const last=result.findLastIndex((candidate,i)=>
        i>0&&candidate.kind!=='path');
      if(redundant>=0)result.splice(redundant,1);
      else if(last>=0)result.splice(last,1);
      else result.pop();
    }
    return [observed,...result].slice(0,RECONSTRUCTION_RENDER_LIMIT);
  };
  if(desc.repeatShape){
    // Seven physically translated copies of one contour are directly
    // expressible as existing portable imported-shape stamps. Preserve
    // independent object moves, scaling, layer editing and canonical colour
    // slots. This avoids the winding Draw normal-offset cusp for sharp Vs,
    // but does not assert source path, original palette or painter order.
    const geometry=desc.repeatShape.geometry;
    const [vx,vy,vw,vh]=geometry.viewBox,ox=vx+vw/2,oy=vy+vh/2;
    let bound=0;
    for(const component of geometry.components)
      for(const ring of [component.outer,...component.holes])
        for(const [x,y] of ring)bound=Math.max(bound,Math.hypot(x-ox,y-oy));
    const placed=reconstructionPlacement(image.width,image.height);
    const radius=bound*placed.width/image.width/600;
    if(radius>=.01&&radius<=1.2){
      const overrides=desc.repeatShape.placements.map(part=>({
        index:part.index,
        x:(placed.x+part.cx*placed.width)/600,
        y:(placed.y+part.cy*placed.height)/1300,
        radius:clamp(radius*part.scale,.01,1.2)
      }));
      candidates.push({kind:'shape-repeats',
        label:desc.repeatShape.clipped?
          'Seven editable partly-cropped hue silhouettes':
          geometry.components.length>1?
            'Seven editable repeated compound silhouettes':
            'Seven congruent editable colour-silhouette stamps',
        uncertainty:desc.repeatShape.clipped?
          'Four exposed source silhouettes are strongly congruent; three visibly progressively cropped colour regions are smaller editable appearances of that same portable stamp. Their missing contours, original spacing, painter order and seed cannot be recovered from the raster.':
          'Seven measured translated hue masks share one portable shape snapshot, including detected holes and detached islands. Each stamp can be moved and resized. Original path, hidden colour variations, painter order, pigments and seed remain uncertain.',
        recipe:normalizeRecipe({...base,structure:'regions',regionMode:'scattered',
          scatteredShapeKind:'imported',scatteredShape:cloneGeometrySnapshot(geometry),
          scatteredCount:7,scatteredOverlap:'overlap',scatteredSpacing:0,
          scatteredEdgeCrop:0,scatteredOverrides:overrides})});
    }
  }
  // Restore the proven #581 diagonal-band hypothesis, *alongside* #584's
  // radial and centroid fitting. Prior #581 actual artwork reached .08583,
  // whereas centroid-only recognition left it at .28408. Respect the same
  // current canonical recipe, locks, renderer and six-candidate budget.
  if(desc.componentDiagonalAngle!==null&&!desc.radial.kind){
    for(const offset of [-10,0,10]){
      const diagonalRotation=clamp(
        Math.round(desc.componentDiagonalAngle+offset),0,85);
      candidates.push({kind:'straight',
        label:'Principal-axis diagonal rainbow bands / '+diagonalRotation+'°',
        uncertainty:'Coherent colour-region axes identify diagonal strips; authored gaps, width, positions, seed and orientation offsets remain inferred.',
        recipe:normalizeRecipe({...base,structure:'paths',geometry:'straight',
          orientation:'diagonal',diagonalRotation,composition:'single',
          construction:'ribbon',chaos:0,individuality:0,
          stripeWidth:75,spread:58})});
    }
  }
  const editableRegions=desc.repeatedColourRegions||
    ((desc.sevenColourRegions||
      (desc.incompleteColourRegions&&!desc.radial.kind))?desc.colourRegions:null);
  if(editableRegions){
    // The canonical scattered painter repeats its seven semantic hues at
    // indices 7–13. Reuse those slots to restore a second island of each
    // pigment; do not claim to resolve overlaps or arbitrary colour orders.
    const repeated=editableRegions.length===14;
    const placed=reconstructionPlacement(image.width,image.height);
    const overrides=editableRegions.map((region,index)=>{
      // When a circle hides part of another, the visible mask centroid/area
      // underestimates its actual disk. Fit only a sufficiently long, clean
      // exterior source-to-background arc; otherwise keep conservative area.
      const measured=!repeated&&desc.circleHints?.[region.index];
      return {
        index:repeated?index:region.index,
        x:(placed.x+(measured?.cx??region.cx)*placed.width)/600,
        y:(placed.y+(measured?.cy??region.cy)*placed.height)/1300,
        radius:measured?
          clamp(measured.radius*placed.width/600,.01,1.2):
          clamp(Math.sqrt(region.area/Math.PI)*placed.width/image.width/600,.01,1.2)
      };
    });
    const partial=editableRegions.length<7;
    candidates.push({kind:'regions',label:repeated?
      'Fourteen editable repeated-colour islands':
      partial?editableRegions.length+' editable incomplete-hue colour islands':
      'Seven colour regions (editable circles)',
      uncertainty:repeated?
        'Two compact regions of each ROYGBIV hue are independently editable circles; true contours, painter order, occlusion and noncanonical pigments remain uncertain.':
        partial?
          'Only a compact initial subset of rainbow hue slots is observed; circles are editable approximations. Missing colours, unseen occlusion, original painter order, palette and seed remain uncertain.':
          (desc.inferredCircleLayers?
            'Exposed circular arcs and source-visible pigment precedence support editable overlapping circles; hidden geometry, original painter order and fine edges remain uncertain.':
            'Approximates each colour region with a circle; holes, overlaps and fine edges may differ.'),
      recipe:normalizeRecipe({...base,structure:'regions',regionMode:'scattered',
        // Inverse art has no evidence for the editor's otherwise-default
        // black cell dividers. On overlapping circles these introduced false
        // dark lens-shaped arcs absent from actual clean source artwork.
        // A creator's real Divider locks still project below.
        dividerColor:'none',dividerWidth:0,
        scatteredShapeKind:'circle',scatteredCount:editableRegions.length,
        scatteredOverlap:'overlap',scatteredEdgeCrop:0,scatteredSpacing:0,
        ...(desc.inferredCircleLayers&&!repeated?
          {scatteredLayerOrder:desc.inferredCircleLayers.order,scatteredMinSize:0}:
          repeated||partial?{scatteredLayerOrder:[],scatteredMinSize:0}:{}),
        scatteredOverrides:overrides})});
  }
  // Long separate colour components describe procedural bands more honestly
  // than a ring of seven giant circles. Keep direct thickness/spacing editing.
  if(desc.lineDirection){
    // For clean full-height vertical source bands, seven hue components
    // actually measure thickness and gap. Invert the same canonical scene
    // equations instead of guessing a fourth arbitrary spread preset.
    if(desc.lineDirection==='vertical'&&desc.ribbonBands&&
      Math.abs(desc.ribbonBands.angle)>=78){
      const measured=seedMeasuredRibbonControls(
        normalizeRecipe({...base,structure:'paths',geometry:'straight',
          orientation:'vertical',composition:'single',construction:'ribbon',
          chaos:0,individuality:0,spread:56,stripeWidth:52}),
        desc.ribbonBands,image.width,image.height);
      candidates.push({kind:'straight',label:'Measured editable vertical rainbow bands',
        uncertainty:'Colour-component widths and centres estimate band spacing; seed/group offset and exact edge treatment are not recovered.',
        recipe:measured});
    }
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
          rayCount,rayRotation,rayCore:10,rayCoverage:100,fieldCenterX:desc.radial.centerX,
          fieldCenterY:desc.radial.centerY,dividerColor:'none',dividerWidth:0})});
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
          fieldCenterX:desc.radial.centerX,fieldCenterY:desc.radial.centerY,regionSides:0})});
    }
  }
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

  // Offer the three existing editable procedural curvature families for
  // nonradial multicolour outlines. The shared importer supplies rough
  // curvature ordering; the existing true renderer, not our signature,
  // decides whether any beats a traced Draw path.
  if(!desc.radial.kind&&!desc.sevenColourRegions&&
    (!desc.lineDirection||desc.paths.some(path=>path.kind==='arc'))&&
    desc.colourRegions.length>=3&&
    desc.paths.some(path=>path.kind==='arc'||path.kind==='contour')){
    const presets=[
      {kind:'wave',label:'Editable flowing wave',
        recipe:{geometry:'wave',orientation:'horizontal',shapeDepth:60,
          shapeFrequency:45,spread:65,stripeWidth:65}},
      {kind:'jagged',label:'Editable angular rainbow',
        recipe:{geometry:'jagged',orientation:'diagonal',shapeDepth:60,
          shapeFrequency:65,spread:55,stripeWidth:65}},
      {kind:'hairpin',label:'Editable hairpin turn',
        recipe:{geometry:'hairpin',orientation:'vertical',hairpinAngle:120,
          turnRadius:50,spread:42,stripeWidth:65}}
    ];
    presets.sort((a,b)=>(b.kind===desc.curve.kind?1:0)-
      (a.kind===desc.curve.kind?1:0));
    for(const preset of presets){
      candidates.push({kind:preset.kind,label:preset.label,
        uncertainty:'Procedural curvature is a fit hypothesis; turning radius, modulation, phase, spacing and seed are not recovered.',
        // Current-image calibration works for oblique Jagged by itself.
        // Horizontal Wave needs both its physically measured gap/width AND
        // the coherent same-hue image registration during forward fitting:
        // either correction in isolation had previously scored worse.
        recipe:desc.ribbonBands&&(
          (preset.kind==='jagged'&&
            Math.abs(desc.ribbonBands.angle)>=12&&
            Math.abs(desc.ribbonBands.angle)<=78)||
          (preset.kind==='wave'&&Math.abs(desc.ribbonBands.angle)<=10))?
          seedMeasuredRibbonControls(
            normalizeRecipe({...base,structure:'paths',composition:'single',
              construction:'ribbon',chaos:0,individuality:0,...preset.recipe}),
            desc.ribbonBands,image.width,image.height):
          normalizeRecipe({...base,structure:'paths',composition:'single',
            construction:'ribbon',chaos:0,individuality:0,...preset.recipe})});
    }
  }

  // Colour-band arcs are usually stronger than generic contours; the same
  // extracted geometry and path transaction already power manual image import.
  const distinct=desc.paths.filter(p=>['arc','line','contour'].includes(p.kind) &&
    p.points.length>=2).slice(0,2);
  for(const path of distinct){
    const mapped=pathToWallpaper(path,image.width,image.height,0);
    if(!mapped)continue;
    // The ordinary safe path stays available. For a diagnosed wavy/jagged
    // seven-colour strip pack, let the renderer also try a full-width path:
    // the shared safeDrawnBandSpan curvature clamp can collapse all seven
    // offsets on importer pixel wiggles. This opt-in candidate deliberately
    // relaxes only its own canonical geometrySafety, never the manual editor.
    const expanded=['wave','jagged'].includes(desc.curve.kind)&&
      desc.colourRegions.length>=5&&!desc.radial.kind;
    for(const spread of [30,65]){
      const geometrySafety=spread===30||!expanded;
      const candidate=appliedDrawnPathRecipe({...base,spread,stripeWidth:52,
        composition:'single',construction:'ribbon',chaos:0,
        individuality:0,geometrySafety},mapped.points,
      mapped.anchors,mapped.corners,false,false);
      candidates.push({kind:'path',
        // Measured from existing source centreline, not from a separate
        // angular image classifier or fabricated canonical geometry.
        ...(geometrySafety?{}:{angularBends:desc.curve.angularBends}),
        label:path.label+' / '+(geometrySafety?'safely spaced':'expanded ribbons')+
          ' / spread '+spread,
        uncertainty:geometrySafety?
          'Estimated centreline and conservative curvature-safe spacing; wide source ribbons may be compressed.':
          'Wider parallel ribbons use the original extracted path without the local curvature clamp; bends can intersect, so accept only after examining the actual candidate preview.',
        recipe:candidate});
    }
  }
  // A preview must depict exactly what Apply can commit. The same canonical
  // lock policy governs both; never rank an uncommittable unlocked ideal.
  const essential=candidate=>['regions','shape','shape-repeats'].includes(candidate.kind)?
    ['structure','regionMode','scatteredShapeKind']:
    candidate.kind==='nested-rings'?['structure','regionMode']:
    candidate.kind==='radial-rays'||candidate.kind==='radial-rings'?
      ['structure','radialMode']:
    candidate.kind==='path'||candidate.kind==='straight'||candidate.kind==='loop'||
    ['wave','jagged','hairpin'].includes(candidate.kind)?
      ['structure','geometry']:['structure'];
  const committable=candidates.map(candidate=>{
    const effective=respectSettingLocks(current,candidate.recipe);
    const blocked=current.lockedSettings.filter(key=>
      JSON.stringify(effective[key])!==JSON.stringify(candidate.recipe[key]));
    const paletteDisclosure=desc.paletteHypothesis?
      ' Source colours resemble the current '+desc.paletteHypothesis.palette+
      ' story; original palette identity, material and processing remain unknown.':'';
    return {...candidate,recipe:effective,lockedChanges:blocked,
      uncertainty:candidate.uncertainty+paletteDisclosure};
  }).filter(candidate=>!essential(candidate).some(key=>
    candidate.lockedChanges.includes(key)));
  // Confirmed by 02-diagonal current-renderer PNG: the third candidate
  // (+10° principal-axis offset) scored .08583. Generic one-per-kind
  // selection silently dropped it and worsened error to .14825. Reserve
  // all three nearby angles, a Jagged alternative, AND both safe/expanded
  // Draw fallbacks when this coherent diagonal geometry is present.
  if(desc.componentDiagonalAngle!==null){
    const angles=committable.filter(c=>c.kind==='straight'&&
      c.recipe.orientation==='diagonal').slice(0,3);
    if(angles.length===3){
      const selected=[...angles];
      // Coherent four-complete/three-clipped silhouette evidence is stronger
      // than a redundant third unrefined straight angle. Preserve two angles,
      // a procedural Jagged and both safe/expanded Draw alternatives within
      // the *same* six initial current-renderer paints.
      if(desc.repeatShape?.clipped&&desc.ribbonBands){
        const stamp=committable.find(c=>c.kind==='shape-repeats');
        if(stamp)selected[0]=stamp;
      }
      const angular=committable.find(c=>c.kind==='jagged');
      if(angular)selected.push(angular);
      for(const path of committable.filter(c=>c.kind==='path')){
        if(selected.length>=RECONSTRUCTION_RENDER_LIMIT)break;
        if(!selected.some(c=>c.kind==='path'&&
          c.recipe.geometrySafety===path.recipe.geometrySafety))
          selected.push(path);
      }
      for(const candidate of diverseReconstructionCandidates(committable)){
        if(selected.length>=RECONSTRUCTION_RENDER_LIMIT)break;
        if(!selected.includes(candidate))selected.push(candidate);
      }
      return includeObserved(selected);
    }
  }
  // Preserve the current conservative Draw candidate as a guaranteed
  // alternative while allowing ONE expanded full-ribbon Draw candidate to
  // compete in exactly the same bounded six-render budget. Only wave/jagged
  // import evidence triggers the reserved second path slot. Never invent a
  // new geometry type or bypass a creator's Geometry safety setting lock.
  if(['wave','jagged'].includes(desc.curve.kind)&&
    desc.colourRegions.length>=5&&!desc.radial.kind){
    const safe=committable.find(c=>c.kind==='path'&&c.recipe.geometrySafety);
    const wide=committable.find(c=>c.kind==='path'&&
      !c.recipe.geometrySafety&&!c.lockedChanges.includes('geometrySafety'));
    if(safe&&wide){
      const procedural=diverseReconstructionCandidates(
        committable.filter(c=>c.kind!=='path'),RECONSTRUCTION_RENDER_LIMIT-2);
      return includeObserved([...procedural,safe,wide]);
    }
  }
  return includeObserved(diverseReconstructionCandidates(committable));
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

/**
 * Pure measured *registration hint*, never a second renderer or a second
 * recipe score. When Jagged geometry already resembles the imported ink but
 * the saved pixel pack is displaced by a few physical pixels, the existing
 * coarse ±20% fit skips right across the solution. Compare at most 13×13
 * small integer translations of the ONE already rendered 96×208 bitmap.
 * Only a conspicuous relative and absolute improvement warrants spending
 * the unchanged ten canonical painter trials on sub-percent Position.
 */
export function measuredJaggedPixelShift(source,rendered){
  if(!source||!rendered||source.width!==RECONSTRUCTION_WIDTH||
    source.height!==RECONSTRUCTION_HEIGHT||
    rendered.width!==source.width||rendered.height!==source.height||
    source.data?.length!==rendered.data?.length)return null;
  const w=source.width,h=source.height,a=source.data,b=rendered.data;
  // Limit work to one quarter of pixels for source registration. The actual
  // reconstruction rank/refinement still scores full sampled render pixels.
  const score=(dx,dy)=>{
    let total=0,samples=0;
    for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2){
      const i=(y*w+x)*4,rx=x-dx,ry=y-dy;
      const valid=rx>=0&&rx<w&&ry>=0&&ry<h;
      const j=valid?(ry*w+rx)*4:-1;
      const ar=a[i],ag=a[i+1],ab=a[i+2];
      const br=valid?b[j]:0,bg=valid?b[j+1]:0,bb=valid?b[j+2]:0;
      const colour=(Math.abs(ar-br)+Math.abs(ag-bg)+
        Math.abs(ab-bb))/(3*255);
      const mask=Math.abs(Math.max(ar,ag,ab)-Math.max(br,bg,bb))/255;
      total+=colour*.75+mask*.25;samples++;
    }
    return total/samples;
  };
  const baseline=score(0,0);
  let best=baseline,dxBest=0,dyBest=0;
  for(let dy=-6;dy<=6;dy++)for(let dx=-6;dx<=6;dx++){
    if(dx===0&&dy===0)continue;
    const error=score(dx,dy);
    if(error+1e-9<best){best=error;dxBest=dx;dyBest=dy;}
  }
  if(baseline-best<.04||best>baseline*.7)return null;
  return {offsetX:Math.round(dxBest*1000/w)/10,
    offsetY:Math.round(dyBest*1000/h)/10,
    measuredPixelGain:Math.round((baseline-best)*1e6)/1e6};
}

/**
 * A coherent seven-band image often differs from the first wave render by
 * a rigid vertical translation. Use the ALREADY shared hue components to
 * measure each colour's displacement in the same 96x208 scoring frame;
 * require seven matching pigments and near-identical offsets to avoid
 * shifting unrelated external artwork or a distorted/cropped composition.
 *
 * This is a hint for the NEXT ordinary drawWallpaper trial, not a new
 * renderer, source pixel storage or a claim of original setting recovery.
 */
function coherentHueOffset(source,rendered,axis){
  if(!source||!rendered||source.width!==rendered.width||
    source.height!==rendered.height)return null;
  const a=extractImageColourRegions(source,HUES).regions;
  const b=extractImageColourRegions(rendered,HUES).regions;
  if(a.length!==7||b.length!==7)return null;
  const offsets=[];
  for(let i=0;i<7;i++){
    const s=a.find(r=>r.index===i),r=b.find(v=>v.index===i);
    if(!s||!r||s.area<16||r.area<16)return null;
    offsets.push((s[axis]-r[axis])*100);
  }
  const sorted=offsets.sort((a,b)=>a-b),median=sorted[3];
  if(sorted[6]-sorted[0]>4||Math.abs(median)<1||
    Math.abs(median)>30)return null;
  return Math.round(median);
}
export const coherentWaveOffsetY=(source,rendered)=>
  coherentHueOffset(source,rendered,'cy');
export const coherentVerticalBandOffsetX=(source,rendered)=>
  coherentHueOffset(source,rendered,'cx');
// An existing expanded canonical Draw ribbon can have the correct topology
// but be collectively displaced. Only seven coherent pigment translations
// qualify; a rough single-path silhouette must not drive global movement.
/**
 * A bent ribbon pack need not be rigidly displaced: an underestimated gap
 * produces a LINEAR drift from red to violet. Measure that drift using the
 * SAME existing seven-pigment connected components. Reject missing/reordered
 * hues, occlusion and irregular neighbouring gaps; this evidence warrants a
 * gap-and-centre fit only, not an assertion about the original Draw stroke.
 */
export function measuredExpandedDrawRegistration(source,rendered){
  if(!source||!rendered||source.width!==rendered.width||
    source.height!==rendered.height)return null;
  const a=extractImageColourRegions(source,HUES).regions;
  const b=extractImageColourRegions(rendered,HUES).regions;
  if(a.length!==7||b.length!==7)return null;
  const ordered=regions=>Array.from({length:7},(_,index)=>
    regions.find(r=>r.index===index));
  const original=ordered(a),candidate=ordered(b);
  if(original.some(r=>!r||r.area<16)||candidate.some(r=>!r||r.area<16))
    return null;
  const median=values=>values.slice().sort((x,y)=>x-y)[Math.floor(values.length/2)];
  // The same seven source and actual-render component centroids also support
  // upright Draw bands, whose rainbow order separates along X rather than Y.
  // Prefer the previously validated Y fit whenever both axes are coherent.
  const measure=axis=>{
    const gaps=regions=>regions.slice(1).map((r,i)=>r[axis]-regions[i][axis]);
    const src=gaps(original),fit=gaps(candidate);
    const srcGap=median(src),fitGap=median(fit);
    // Matching SIGN matters: reversed hue order is not a rigidly registered
    // ribbon stack. Signed gaps admit both left-to-right and right-to-left.
    if(Math.abs(srcGap)<.012||Math.abs(fitGap)<.012||srcGap*fitGap<=0||
      src.some(x=>Math.abs(x-srcGap)>Math.abs(srcGap)*.23)||
      fit.some(x=>Math.abs(x-fitGap)>Math.abs(fitGap)*.23))return null;
    const gapRatio=srcGap/fitGap;
    if(!Number.isFinite(gapRatio)||gapRatio<.75||gapRatio>3.25)return null;
    const offset=Math.round((original[3][axis]-candidate[3][axis])*100);
    if(Math.abs(offset)>50)return null;
    return axis==='cx'?{offsetX:offset,gapRatio}:{offsetY:offset,gapRatio};
  };
  return measure('cy')??measure('cx');
}
export const coherentExpandedDrawOffsetY=(source,rendered)=>
  measuredExpandedDrawRegistration(source,rendered)?.offsetY??null;

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
      if(Number.isFinite(error)){
        const loopInkRatio=candidate.kind==='loop'&&
          candidate.recipe.background==='black'?(()=>{
            const a=extractImageColourRegions(source,HUES);
            const b=extractImageColourRegions(pixels,HUES);
            return a.regions.length===7&&b.regions.length===7&&b.coverage>.05?
              a.coverage/b.coverage:null;
          })():null;
        const waveOffsetY=candidate.kind==='wave'?
          coherentWaveOffsetY(source,pixels):null;
        const bandOffsetX=candidate.kind==='straight'&&
          candidate.recipe.orientation==='vertical'?
          coherentVerticalBandOffsetX(source,pixels):null;
        const jaggedShift=candidate.kind==='jagged'&&
          candidate.recipe.background==='black'?
          measuredJaggedPixelShift(source,pixels):null;
        const drawRegistration=candidate.kind==='path'&&
          candidate.recipe.geometry==='drawn'&&
          candidate.recipe.geometrySafety===false?
          measuredExpandedDrawRegistration(source,pixels):null;
        results.push({...candidate,error,
          ...(Number.isFinite(loopInkRatio)?{loopInkRatio}:{}) ,
          ...(jaggedShift?{jaggedShift}:{}),
          ...(waveOffsetY!==null?{waveOffsetY}:{}),
          ...(bandOffsetX!==null?{bandOffsetX}:{}),
          ...(drawRegistration?{
            ...(Number.isFinite(drawRegistration.offsetY)?
              {drawOffsetY:drawRegistration.offsetY}:{}),
            ...(Number.isFinite(drawRegistration.offsetX)?
              {drawOffsetX:drawRegistration.offsetX}:{}),
            drawGapRatio:drawRegistration.gapRatio}:{})});
      }
    }catch(error){
      results.push({...candidate,error:Infinity,
        uncertainty:candidate.uncertainty+' Rendering failed: '+(error?.message||'unknown error')});
    }
  }
  return results.sort((a,b)=>a.error-b.error);
}

/**
 * The best initial Draw trace may paint only a thin line where the source
 * contains seven widely separated ribbons. One structurally credible curve
 * gets the SAME single ten-render search budget when Draw error is high.
 * The original best remains eligible unless the challenger actually wins.
 */
export function reconstructionRefinementIndex(ranked){
  if(!Array.isArray(ranked)||!ranked.length)return -1;
  const best=ranked[0];
  if(best.kind!=='path'||!Number.isFinite(best.error)||best.error<=.15)return 0;
  // A real seven-hue source/rendered rigid translation is stronger evidence
  // than an arbitrary initial full-frame colour distance. The shifted Wave
  // has not been scored yet, so lend its one real-render fitting budget first.
  const registered=ranked.findIndex((item,index)=>index>0&&
    item.kind==='wave'&&Number.isFinite(item.waveOffsetY)&&
    Number.isFinite(item.error)&&
    item.error<=Math.min(.55,best.error+.20));
  // Preserve the existing safe Draw and all procedural alternatives. When a
  // wider Draw trial demonstrably has the same seven pigments displaced by
  // one amount, give it the ONE already-budgeted refinement opportunity.
  // The actual renderer score still decides whether it overtakes safe Draw.
  const wideDraw=ranked.findIndex((item,index)=>index>0&&
    item.kind==='path'&&item.recipe?.geometry==='drawn'&&
    item.recipe.geometrySafety===false&&
    (Number.isFinite(item.drawOffsetY)||Number.isFinite(item.drawOffsetX))&&
    Number.isFinite(item.error)&&
    item.error<=Math.min(.55,best.error+.14));
  // A coherent nearly doubled pigment gap plus two observed angular bends
  // specifically justifies widening a traced source V. Smooth Wave lacks
  // those abrupt bends: retain its proven Y registration priority otherwise.
  if(wideDraw>=0&&ranked[wideDraw].angularBends>=2&&
    ranked[wideDraw].drawGapRatio>=1.35)return wideDraw;
  if(registered>=0)return registered;
  if(wideDraw>=0)return wideDraw;
  let winner=-1,lowest=Infinity;
  for(let i=1;i<ranked.length;i++){
    const candidate=ranked[i];
    if(!['wave','jagged','hairpin'].includes(candidate.kind)||
      !Number.isFinite(candidate.error)||
      candidate.error>=Math.min(.55,best.error+.16))continue;
    if(candidate.error<lowest){winner=i;lowest=candidate.error;}
  }
  return winner>=0?winner:0;
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
/**
 * The same sequence of canonical candidate recipes powers synchronous Node R0
 * evidence and cooperative browser fitting. The caller returns each actual
 * drawWallpaper comparison score. Coordinate baselines update between fields,
 * not in the middle of an offset sweep.
 */
function refinementFields(candidate){
  return candidate.kind==='path'?[
    // Existing scene width equation is nonlinear; invert its CURRENT spread
    // factor to turn the measured between-hue ratio into an editable guess.
    // Fit separation before group translation so the latter is evaluated
    // against the corrected seven-colour negative space.
    ['spread',(()=>{
      const spread=candidate.recipe.spread;
      const factor=.10+.335*Math.pow(spread/50,1.5);
      const target=clamp(50*Math.pow(Math.max(0,
        (factor*candidate.drawGapRatio-.10)/.335),2/3),0,100);
      const delta=Math.round(target-spread);
      return [delta,Math.round(delta*.75),Math.round(delta*.5),-15];
    })()],
    [Number.isFinite(candidate.drawOffsetX)?'positionX':'positionY',
      (()=>{
        const offset=Number.isFinite(candidate.drawOffsetX)?
          candidate.drawOffsetX:candidate.drawOffsetY;
        return [offset,offset-4,offset+4,offset-8];
      })()],
    ['stripeWidth',[-15,15]]
  ]:candidate.kind==='straight'?[
    [candidate.recipe.orientation==='horizontal'?'positionY':'positionX',
      candidate.recipe.orientation==='vertical'&&Number.isFinite(candidate.bandOffsetX)?
        [candidate.bandOffsetX,candidate.bandOffsetX-4,
          candidate.bandOffsetX+4,candidate.bandOffsetX-8]:
        [-8,-4,4,8]],
    ['spread',[-16,-8,8,16]],['stripeWidth',[-15,15]]
  ]:candidate.kind==='loop'?[
    ['positionX',[-6,6]],['positionY',[-6,6]],
    // Allocate two fine radius probes only when source and first-render
    // pigment coverage match. If ink quantity differs, keep the proven
    // stripe-width probes instead, not a source-blind radius assumption.
    ...(candidate.loopInkRatio>=.90&&candidate.loopInkRatio<=1.06?
      [['loopRadius',[-10,10,-6,6]],['spread',[-10,10]]]:
      [['loopRadius',[-10,10]],['spread',[-10,10]],['stripeWidth',[-15,15]]])
  ]:candidate.kind==='wave'?[
    // The first true-render probe uses the rigid seven-hue centroid offset
    // when measured, then tests its immediate neighbourhood. Otherwise keep
    // the proven static coarse displacement search unchanged.
    ['positionY',Number.isFinite(candidate.waveOffsetY)?
      [candidate.waveOffsetY,candidate.waveOffsetY-4,
        candidate.waveOffsetY+4,candidate.waveOffsetY-10]:
      [-25,-15,15,25]],
    // Once physically measured separation and pigment thickness are close,
    // remaining source differences are contour amplitude and rhythm.
    // Spend exactly the existing ten probes on those editable controls,
    // keeping four position probes for the measured seven-hue Y offset.
    ['shapeDepth',[-12,12]],['shapeFrequency',[-12,12]],
    ['stripeWidth',[-15,15]]
  ]:candidate.kind==='jagged'?(
    candidate.jaggedShift?[
      // Once actual source versus first canonical paint measures a narrow
      // rigid offset, trial the inferred editable position before broad
      // shape guesses. The one 10-render budget and lock semantics stay.
      ['positionY',[candidate.jaggedShift.offsetY,
        candidate.jaggedShift.offsetY-.5,candidate.jaggedShift.offsetY+.5]],
      ['positionX',[candidate.jaggedShift.offsetX,
        candidate.jaggedShift.offsetX-1,candidate.jaggedShift.offsetX+1]],
      ['spread',[-15,15]],['stripeWidth',[-15,15]]
    ]:[
      ['positionX',[-20,20]],['positionY',[-20,20]],
      ['spread',[-15,15]],['stripeWidth',[-25,-10,10,25]]
    ]
  ):candidate.kind==='hairpin'?[
    // A U-turn's departure angle is meaningful only after the U position and
    // ribbon separation have been fitted. Testing angle first locks the
    // greedy scorer into a shallow exit even when a steeper one fits better.
    ['turnRadius',[-15,15]],['spread',[-10,10]],
    ['positionX',[-7,7]],['positionY',[-7,7]],['hairpinAngle',[-25,25]]
  ]:candidate.kind==='radial-rays'?[
    ['rayRotation',[-10,-5,5,10]],['fieldCenterX',[-5,5]],
    ['fieldCenterY',[-5,5]],['rayCore',[-10,10]]
  ]:candidate.kind==='radial-rings'?[
    ['fieldCenterX',[-5,5]],['fieldCenterY',[-5,5]],['rayCount',[-7,7]]
  ]:[
    ['fieldCenterX',[-5,5]],['fieldCenterY',[-5,5]],['regionCount',[-7,7]]
  ];
}
function canRefine(candidate,maxRenders){
  if(!candidate||!['straight','loop','wave','jagged','hairpin','radial-rays','radial-rings','nested-rings','path']
    .includes(candidate.kind)||!Number.isFinite(candidate.error))return false;
  // An unregistered arbitrary Draw outline remains an honest coarse preview,
  // never a ten-render blind search. The safer Draw is always untouched.
  if(candidate.kind==='path'&&
    (candidate.recipe?.geometry!=='drawn'||
      candidate.recipe.geometrySafety!==false||
      !(Number.isFinite(candidate.drawOffsetY)||
        Number.isFinite(candidate.drawOffsetX))))return false;
  if(!Number.isInteger(maxRenders)||maxRenders<0||maxRenders>16)
    throw Error('Invalid reconstruction fitting budget');
  return true;
}
function* refinementTrials(candidate,maxRenders){
  let best=candidate,renders=0;
  for(const [field,deltas] of refinementFields(candidate)){
    const origin=best.recipe[field];
    for(const delta of deltas){
      if(renders>=maxRenders)break;
      // Use the canonical lock owner for every real-render trial, not only
      // coarse candidates. Composite Position protects both X and Y, so a
      // preview cannot be fitted into an arrangement Apply would later reject.
      const recipe=respectSettingLocks(best.recipe,
        normalizeRecipe({...best.recipe,[field]:origin+delta}));
      if(recipe[field]===best.recipe[field])continue;
      const error=yield recipe;
      renders++;
      if(Number.isFinite(error)&&error+1e-9<best.error)
        best={...best,recipe,error,label:candidate.label+' · fitted',
          adjustments:[...(best.adjustments||[]),{field,value:recipe[field]}]};
    }
  }
  return {...best,refinementRenders:renders};
}
function trialError(source,recipe,render){
  try{
    return compareReconstructionPixels(source,
      render(recipe,RECONSTRUCTION_WIDTH,RECONSTRUCTION_HEIGHT));
  }catch{return Infinity;}
}
export function refineReconstructionCandidate(candidate,source,render,{maxRenders=10}={}){
  if(!canRefine(candidate,maxRenders))return candidate;
  const trial=refinementTrials(candidate,maxRenders);
  let step=trial.next();
  while(!step.done)step=trial.next(trialError(source,step.value,render));
  return step.value;
}

/** Yield BEFORE every expensive renderer invocation; a newer import or closed
 * dialog cancels without another render. The scheduler belongs to the UI
 * (requestAnimationFrame) and is injected so Node tests remain deterministic.
 * A cancelled job returns null; no partial candidate set can be committed.
 */
export async function rankReconstructionCandidatesCooperatively(
  candidates,source,render,{yieldControl=async()=>{},isCancelled=()=>false}={}){
  // Keep the exact synchronous contract and shared per-candidate comparator.
  rankReconstructionCandidates([],source,render);
  if(!Array.isArray(candidates)||candidates.length>RECONSTRUCTION_RENDER_LIMIT)
    throw Error('Reconstruction render budget exceeded');
  const results=[];
  for(const candidate of candidates){
    if(isCancelled())return null;
    await yieldControl();
    if(isCancelled())return null;
    results.push(rankReconstructionCandidates([candidate],source,render)[0]);
  }
  return results.sort((a,b)=>a.error-b.error);
}
export async function refineReconstructionCandidateCooperatively(
  candidate,source,render,{maxRenders=10,yieldControl=async()=>{},isCancelled=()=>false}={}){
  if(!canRefine(candidate,maxRenders))return candidate;
  const trial=refinementTrials(candidate,maxRenders);
  let step=trial.next();
  while(!step.done){
    if(isCancelled())return null;
    await yieldControl();
    if(isCancelled())return null;
    step=trial.next(trialError(source,step.value,render));
  }
  return step.value;
}
