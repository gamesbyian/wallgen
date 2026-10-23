// Inverse-graphics candidate synthesis, not a second scene model.
// The analysis source is bounded by image-path.js; every output is a normal
// editable wallpaper recipe. No source pixels or alleged original seed persist.
import {HUES,normalizeRecipe,resolveScene,respectSettingLocks} from './model.js';
import {importedAngleDeltaDegrees} from './import-angle-wrap.js';
import {cloneGeometrySnapshot} from './geometry-asset.js';
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
  const kind=Math.abs(net)>Math.PI*.95?'hairpin':
    sharp>=3&&absolute>1.7?'jagged':
    source.kind==='arc'&&turns>=2?'wave':null;
  return {kind,sharpTurns:sharp,netTurn:net};
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
  const bands=regions.filter(r=>r&&r.axisRatio>=4&&r.area>=16&&
    Number.isFinite(r.majorStd)&&r.majorStd>3&&
    Number.isFinite(r.axisAngle)&&Number.isFinite(r.cx)&&Number.isFinite(r.cy));
  if(bands.length!==7)return null;
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
  const seven=componentDiagonalAngle===null&&colour.regions.length===7&&
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
  const stripeAngle=imageStripeAngle(colour.regions,image.width,image.height);
  const curve=imageCurveSignature(paths,image.width,image.height);
  const ribbonBands=measuredRainbowRibbonBands(colour.regions,image.width,image.height);
  return {background:colour.background,colourRegions:colour.regions,
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
  const base=strippedCandidateBase(current,desc.background);
  const candidates=[];
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
        // Real R0 cross-validation: this physical seed improved Jagged
        // .20459→.16565 but degraded Wave. Keep Wave's measured better
        // preexisting start until a separate phase/offset estimator wins.
        recipe:preset.kind==='jagged'&&desc.curve.kind==='jagged'?
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
  const essential=candidate=>candidate.kind==='regions'||candidate.kind==='shape'?
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
    return {...candidate,recipe:effective,lockedChanges:blocked};
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
      return selected;
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
      return [...procedural,safe,wide];
    }
  }
  return diverseReconstructionCandidates(committable);
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
  return candidate.kind==='straight'?[
    [candidate.recipe.orientation==='horizontal'?'positionY':'positionX',[-8,-4,4,8]],
    ['spread',[-16,-8,8,16]],['stripeWidth',[-15,15]]
  ]:candidate.kind==='loop'?[
    ['positionX',[-6,6]],['positionY',[-6,6]],
    ['loopRadius',[-10,10]],['spread',[-10,10]],['stripeWidth',[-15,15]]
  ]:candidate.kind==='wave'?[
    ['positionY',[-25,-15,15,25]],['spread',[-18,18]],
    ['stripeWidth',[-25,-15,15,25]]
  ]:candidate.kind==='jagged'?[
    ['positionX',[-20,20]],['positionY',[-20,20]],
    ['spread',[-15,15]],['stripeWidth',[-25,-10,10,25]]
  ]:candidate.kind==='hairpin'?[
    ['turnRadius',[-15,15]],['hairpinAngle',[-25,25]],
    ['spread',[-10,10]],['positionX',[-7,7]],['positionY',[-7,7]]
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
  if(!candidate||!['straight','loop','wave','jagged','hairpin','radial-rays','radial-rings','nested-rings']
    .includes(candidate.kind)||!Number.isFinite(candidate.error))return false;
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
      const recipe=normalizeRecipe({...best.recipe,[field]:origin+delta});
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
