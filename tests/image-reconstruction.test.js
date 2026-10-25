import test from 'node:test';
import assert from 'node:assert/strict';
import {HUES,COLOR_STORIES,normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';
import {imagePlacement,extractImageColourRegions} from '../src/image-path.js';
import {describeReconstructionImage,reconstructionCandidates,
  rankReconstructionCandidates,compareReconstructionPixels,refineReconstructionCandidate,reconstructionPlacement,
  radialImageSignature,imageStripeAngle,imageCurveSignature,diverseReconstructionCandidates,reconstructionRefinementIndex,
  measuredRainbowRibbonBands,seedMeasuredRibbonControls,measuredCanonicalPalette,coherentWaveOffsetY,coherentVerticalBandOffsetX,coherentExpandedDrawOffsetY,measuredExpandedDrawRegistration,measuredJaggedPixelShift,
  rankReconstructionCandidatesCooperatively,refineReconstructionCandidateCooperatively,
  RECONSTRUCTION_FRAME,RECONSTRUCTION_RENDER_LIMIT} from '../src/image-reconstruction.js';

function colour(hue){
  const h=((hue%360)+360)%360/60,i=Math.floor(h),f=h-i;
  const rgb=[[255,Math.round(255*f),0],[Math.round(255*(1-f)),255,0],
    [0,255,Math.round(255*f)],[0,Math.round(255*(1-f)),255],
    [Math.round(255*f),0,255],[255,0,Math.round(255*(1-f))]];
  return [...rgb[i],255];
}
function raster(width,height,paint){
  const data=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)
    data.set(paint(x,y),4*(y*width+x));
  return {data,width,height};
}
const centers=[[20,32],[65,20],[99,51],[37,110],[94,143],[25,194],[76,222]];
const original=raster(120,260,(x,y)=>{
  for(let i=0;i<7;i++)if(Math.hypot(x-centers[i][0],y-centers[i][1])<10)
    return colour(HUES[i]);
  return [0,0,0,255];
});

test('Seven metadata-free rainbow regions map to portable editable canonical objects',()=>{
  const descriptors=extractImageColourRegions(original,HUES);
  assert.equal(descriptors.regions.length,7);
  assert.equal(describeReconstructionImage(original).sevenColourRegions,true);
  const results=reconstructionCandidates(original,normalizeRecipe({seed:'some-input'}));
  const circles=results.find(x=>x.kind==='regions');
  assert.ok(circles,'separate individual hue regions synthesize a scattered recipe');
  assert.equal(circles.recipe.structure,'regions');
  assert.equal(circles.recipe.regionMode,'scattered');
  assert.equal(circles.recipe.scatteredOverrides.length,7);
  const box=reconstructionPlacement(120,260);
  for(const [index,point] of centers.entries()){
    const found=circles.recipe.scatteredOverrides[index];
    assert.equal(found.index,index);
    assert.ok(Math.abs(found.x-(box.x+point[0]/120*box.width)/600)<.006);
    assert.ok(Math.abs(found.y-(box.y+point[1]/260*box.height)/1300)<.006);
  }
  const restored=decodeRecipe(encodeRecipe(circles.recipe));
  assert.deepEqual(restored,circles.recipe,'existing JSON/PNG recipe transport');
  const scene=resolveScene(restored);
  assert.equal(scene.objects.length,7);
  assert.ok(scene.objects.every(o=>o.circle?.r>0),'ordinary movable circles');
});

// Generate flat colours from the canonical model's own story definition.
// This proves source-mask logic without confusing a synthetic raster with
// independently inspected/current-renderer PNG aesthetic acceptance.
function canonicalColour(index,palette){
  const story=COLOR_STORIES[palette];
  const hue=((HUES[index]+(story.hue?.[index]??0))%360+360)%360;
  const light=(story.light+(story.lights?.[index]??0))/100;
  const saturation=story.sat/100;
  const chroma=(1-Math.abs(2*light-1))*saturation;
  const x=chroma*(1-Math.abs((hue/60)%2-1));
  const m=light-chroma/2;
  const sector=Math.floor(hue/60);
  const channels=[[chroma,x,0],[x,chroma,0],[0,chroma,x],
    [0,x,chroma],[x,0,chroma],[chroma,0,x]][sector];
  return [...channels.map(value=>Math.round((value+m)*255)),255];
}
function paletteSource(palette,{missingHue=-1}={}){
  return raster(140,280,(x,y)=>{
    if(x<6||x>=134||y<6||y>=274)return [0,0,0,255];
    const index=Math.min(6,Math.floor((x-6)*7/128));
    return index===missingHue?[0,0,0,255]:canonicalColour(index,palette);
  });
}
test('clean canonical nonclassic colour stories become bounded appearance hypotheses, not provenance',()=>{
  for(const palette of ['jewel','pastel','earth','twilight']){
    const image=paletteSource(palette),desc=describeReconstructionImage(image);
    assert.equal(desc.colourRegions.length,7,'seven known hue components');
    assert.equal(desc.paletteHypothesis?.palette,palette,
      'a well-separated current palette should be recognized from source appearance');
    const candidates=reconstructionCandidates(image,normalizeRecipe({seed:'no-source-seed'}));
    assert.ok(candidates.length>0&&candidates.length<=RECONSTRUCTION_RENDER_LIMIT);
    assert.ok(candidates.every(candidate=>candidate.recipe.palette===palette));
    assert.ok(candidates.every(candidate=>typeof candidate.uncertainty==='string'&&
      /infer|approx|estimate|uncertain|source|pigment|original/i.test(candidate.uncertainty)));
    assert.deepEqual(decodeRecipe(encodeRecipe(candidates[0].recipe)),candidates[0].recipe,
      'ordinary recipe transport preserves the editable appearance proposal');
    const protectedCandidates=reconstructionCandidates(image,normalizeRecipe({
      seed:'retain-creator-palette',palette:'classic',lockedSettings:['palette']}));
    assert.ok(protectedCandidates.every(candidate=>candidate.recipe.palette==='classic'),
      'canonical palette lock overrides inferred appearance');
  }
});
test('missing or ambiguous pigmentation does not manufacture source palette semantics',()=>{
  assert.equal(measuredCanonicalPalette(
    extractImageColourRegions(paletteSource('jewel',{missingHue:4}),HUES).regions),null);
  assert.equal(describeReconstructionImage(paletteSource('classic')).paletteHypothesis,null);
  // Fully saturated arbitrary HSV pigments are not any canonical HSL story.
  assert.equal(describeReconstructionImage(original).paletteHypothesis,null);
});

test('occluded circular arcs and visible hue precedence recover editable reverse-layer disks',()=>{
 const centres=[[38,58],[53,83],[68,108],[83,133],[77,170],[62,195],[47,220]];
 const radius=22,w=160,h=320;
 // Deliberately independent authored synthetic raster. This is a descriptor
 // test, not production renderer image quality or original scene provenance.
 const image=raster(w,h,(x,y)=>{
   let colourValue=[0,0,0,255];
   for(let i=6;i>=0;i--){
     if(Math.hypot(x-centres[i][0],y-centres[i][1])<=radius)
       colourValue=colour(HUES[i]);
   }
   return colourValue;
 });
 const masks=extractImageColourRegions(image,HUES,{includeRepeatShape:true});
 assert.ok(Array.isArray(masks.circleHints)&&masks.circleHints.length===7);
 masks.circleHints.forEach((hint,i)=>{
   assert.ok(Math.abs(hint.cx*w-centres[i][0])<=2);
   assert.ok(Math.abs(hint.cy*h-centres[i][1])<=2);
   assert.ok(Math.abs(hint.radius*w-radius)<=2);
 });
 assert.deepEqual(masks.inferredCircleLayers?.order,[6,5,4,3,2,1,0],
   'frontmost red is supported by actual visible overlap pixels');
 const desc=describeReconstructionImage(image);
 assert.deepEqual(desc.inferredCircleLayers?.order,[6,5,4,3,2,1,0]);
 const options=reconstructionCandidates(image,normalizeRecipe({seed:'no-source-scene-truth'}));
 assert.ok(options.length<=RECONSTRUCTION_RENDER_LIMIT);
 const candidate=options.find(option=>option.kind==='regions');
 assert.ok(candidate);
 assert.deepEqual(candidate.recipe.scatteredLayerOrder,[6,5,4,3,2,1,0]);
 assert.equal(candidate.recipe.dividerColor,'none');
 assert.equal(candidate.recipe.dividerWidth,0);
 assert.equal(resolveScene(candidate.recipe).objects.length,7);
 assert.ok(/uncertain/.test(candidate.uncertainty));
 const dividerLocked=normalizeRecipe({seed:'preserve-maker-lines',
   structure:'regions',regionMode:'scattered',dividerColor:'white',
   dividerWidth:18,lockedSettings:['dividerColor','dividerWidth']});
 const lockedLines=reconstructionCandidates(image,dividerLocked)
   .find(option=>option.kind==='regions');
 assert.equal(lockedLines?.recipe.dividerColor,'white');
 assert.equal(lockedLines?.recipe.dividerWidth,18);
 assert.deepEqual(decodeRecipe(encodeRecipe(candidate.recipe)),candidate.recipe);
 // Layer order is an editable canonical scene field but currently not a
 // registered lockable setting. Respect the existing *structural* locks
 // rather than pretending an unsupported layer-order lock is enforced.
 const sourceLocked=normalizeRecipe({seed:'locked-overlap',structure:'paths',
   regionMode:'nested',lockedSettings:['structure','regionMode']});
 const protectedOptions=reconstructionCandidates(image,sourceLocked);
 assert.ok(protectedOptions.every(option=>option.kind!=='regions'),
   'a locked non-region scene cannot commit the proposed overlap circles');
});

test('five separate leading-hue pigment islands recover as five canonical movable circles',()=>{
 const points=[[22,30],[126,54],[58,115],[140,178],[42,246]];
 const partial=raster(180,290,(x,y)=>{
   for(let i=0;i<points.length;i++)
     if(Math.hypot(x-points[i][0],y-points[i][1])<=12)
       return colour(HUES[i]);
   return [0,0,0,255];
 });
 const desc=describeReconstructionImage(partial);
 assert.equal(desc.sevenColourRegions,false);
 assert.equal(desc.incompleteColourRegions,true);
 const candidates=reconstructionCandidates(partial,normalizeRecipe({seed:'partial-artwork'}));
 assert.ok(candidates.length>0&&candidates.length<=RECONSTRUCTION_RENDER_LIMIT);
 const regions=candidates.find(candidate=>candidate.kind==='regions');
 assert.ok(regions,'valid incomplete scene must not disappear because two pigments are absent');
 assert.equal(regions.recipe.scatteredCount,5);
 assert.deepEqual(regions.recipe.scatteredOverrides.map(o=>o.index),[0,1,2,3,4]);
 assert.ok(regions.uncertainty.includes('Missing colours'));
 const scene=resolveScene(regions.recipe);
 assert.equal(scene.objects.length,5);
 assert.deepEqual(scene.objects.map(o=>o.colorIndex),[0,1,2,3,4]);
 assert.deepEqual(decodeRecipe(encodeRecipe(regions.recipe)),regions.recipe);
 const locked=reconstructionCandidates(partial,normalizeRecipe({
   seed:'keep-existing-geometry',structure:'paths',
   lockedSettings:['structure','regionMode']}));
 assert.ok(locked.every(c=>c.kind!=='regions'),
   'no uncommittable region preview may ignore existing creator locks');
});

test('missing middle pigment slots never invent colour order from compact islands',()=>{
 const indices=[0,1,3,4,6],points=[[22,30],[130,50],[60,118],[139,182],[44,244]];
 const noncontiguous=raster(180,290,(x,y)=>{
   for(let i=0;i<points.length;i++)
     if(Math.hypot(x-points[i][0],y-points[i][1])<12)
       return colour(HUES[indices[i]]);
   return [0,0,0,255];
 });
 assert.equal(describeReconstructionImage(noncontiguous).incompleteColourRegions,false);
 assert.ok(reconstructionCandidates(noncontiguous,{}).every(c=>c.kind!=='regions'),
   'do not silently repurpose indigo/violet as an earlier semantic hue slot');
});

test('External opaque graphic provides a truthful editable path, not invented seven colours',()=>{
  const external=raster(160,160,(x,y)=>x>=30&&x<=130&&y>=45&&y<=116?
    [20,35,50,255]:[255,255,255,255]);
  const descriptors=describeReconstructionImage(external);
  assert.equal(descriptors.sevenColourRegions,false);
  const candidates=reconstructionCandidates(external,{seed:'external'});
  assert.ok(candidates.some(c=>c.kind==='path'));
  assert.ok(candidates.every(c=>c.kind!=='regions'));
  assert.ok(candidates.some(c=>c.recipe.geometry==='drawn'));
  assert.ok(candidates.some(c=>c.kind==='shape'),
    'existing compound silhouette extraction is also available as canonical shape');
});

test('Candidate comparison obeys bounded real-render callback and ranks identical pixels first',()=>{
  const w=RECONSTRUCTION_FRAME.width,h=RECONSTRUCTION_FRAME.height;
  const blank=raster(w,h,()=>[0,0,0,255]);
  const white=raster(w,h,()=>[255,255,255,255]);
  assert.equal(compareReconstructionPixels(blank,blank),0);
  assert.ok(compareReconstructionPixels(blank,white)>.9);
  const a={kind:'a',label:'a',recipe:{seed:'good'},uncertainty:'Inferred'};
  const b={kind:'b',label:'b',recipe:{seed:'bad'},uncertainty:'Inferred'};
  let calls=0;
  const ranked=rankReconstructionCandidates([b,a],blank,recipe=>{
    calls++;return recipe.seed==='good'?blank:white;
  });
  assert.equal(calls,2);
  assert.equal(ranked[0].kind,'a');
  assert.equal(ranked[0].error,0);
  assert.throws(()=>rankReconstructionCandidates(Array(RECONSTRUCTION_RENDER_LIMIT+1).fill(a),
    blank,()=>blank),/budget exceeded/);
  assert.throws(()=>compareReconstructionPixels(blank,{width:1,height:1,data:[]}),
    /Mismatched/);
});

test('Blank or monochrome source does not hallucinate rainbow objects',()=>{
  const image=raster(120,240,()=>[0,0,0,255]);
  assert.equal(describeReconstructionImage(image).sevenColourRegions,false);
  assert.equal(reconstructionCandidates(image,{}).length,0);
});


test('full-frame reconstruction fits an existing wallpaper edge-to-edge without changing manual import padding',()=>{
  const padded=imagePlacement(480,1040);
  assert.ok(padded.x>0&&padded.y>0,'manual path import retains safety margin');
  const fitted=reconstructionPlacement(480,1040);
  assert.deepEqual(fitted,{x:0,y:0,width:600,height:1300});
  const letterbox=reconstructionPlacement(600,600);
  assert.equal(letterbox.width,600);
  assert.equal(letterbox.height,600);
  assert.equal(letterbox.y,350);
});


test('elongated seven-colour bands propose editable procedural straight geometry rather than seven discs',()=>{
 const stripe=raster(140,280,(x,y)=>{
   const index=Math.floor(x/20);
   return colour(HUES[Math.min(6,index)]);
 });
 const described=describeReconstructionImage(stripe);
 assert.equal(described.lineDirection,'vertical');
 assert.equal(described.sevenColourRegions,false);
 const options=reconstructionCandidates(stripe,{seed:'straight-example'});
 assert.ok(options.some(x=>x.kind==='straight'), 'offer real procedural orientation');
 assert.equal(options.filter(x=>x.kind==='regions').length,0);
 assert.ok(options.filter(x=>x.kind==='straight').every(x=>
   x.recipe.geometry==='straight'&&x.recipe.orientation==='vertical'));
});

test('single opaque colour compound silhouette becomes a portable snapshot preserving holes and islands',()=>{
 const image=raster(160,180,(x,y)=>{
   const outer=x>=18&&x<=94&&y>=20&&y<=125;
   const hole=x>=39&&x<=65&&y>=53&&y<=83;
   const island=x>=116&&x<=144&&y>=80&&y<=113;
   return outer&&!hole||island?colour(HUES[0]):[0,0,0,255];
 });
 const choices=reconstructionCandidates(image,{seed:'donut-external'});
 const silhouette=choices.find(x=>x.kind==='shape');
 assert.ok(silhouette);
 assert.equal(silhouette.recipe.structure,'regions');
 assert.equal(silhouette.recipe.scatteredCount,1);
 assert.equal(silhouette.recipe.scatteredShape.geometry.components.length,2);
 assert.ok(silhouette.recipe.scatteredShape.geometry.components.some(x=>x.holes.length===1));
 assert.equal(resolveScene(silhouette.recipe).objects[0].rings.length,3);
 assert.deepEqual(decodeRecipe(encodeRecipe(silhouette.recipe)),silhouette.recipe);
});


test('renderer-backed geometric refinement is deterministic, bounded and improves matching',()=>{
  const width=RECONSTRUCTION_FRAME.width,height=RECONSTRUCTION_FRAME.height;
  const black=raster(width,height,()=>[0,0,0,255]);
  const paint=(recipe,w,h)=>{
    const shade=Math.min(255,Math.round(Math.abs(recipe.positionX-8)*20));
    return raster(w,h,()=>[shade,shade,shade,255]);
  };
  const start=normalizeRecipe({seed:'fitter',structure:'paths',geometry:'straight',
    orientation:'vertical',positionX:0,spread:52,chaos:0});
  const current={kind:'straight',label:'straight',recipe:start,
    error:compareReconstructionPixels(black,paint(start,width,height))};
  let paints=0;
  const run=()=>refineReconstructionCandidate(current,black,(recipe,w,h)=>{
    paints++;return paint(recipe,w,h);
  },{maxRenders:10});
  const a=run();const b=run();
  assert.ok(a.error<current.error);
  assert.equal(a.recipe.positionX,8);
  assert.equal(a.error,0);
  assert.deepEqual(a,b);
  assert.equal(paints,20,'exactly two bounded runs');
  assert.equal(a.refinementRenders,10);
  assert.equal(refineReconstructionCandidate({...current,kind:'shape'},black,paint).kind,'shape');
});


test('inferred candidates honor present editor locks before being scored or displayed',()=>{
 const frozen=normalizeRecipe({
   seed:'locked-reconstruction',background:'white',
   structure:'paths',geometry:'straight',orientation:'horizontal',
   lockedSettings:['structure','background','orientation']
 });
 const alternatives=reconstructionCandidates(original,frozen);
 assert.ok(alternatives.every(x=>x.recipe.structure==='paths'));
 assert.ok(alternatives.every(x=>x.recipe.background==='white'));
 assert.ok(alternatives.every(x=>x.recipe.orientation==='horizontal'));
 assert.ok(alternatives.every(x=>x.lockedChanges?.includes('background')));
 assert.ok(alternatives.every(x=>!['regions','shape'].includes(x.kind)));
 const unlocked=reconstructionCandidates(original,{seed:'free'});
 assert.ok(unlocked.some(x=>x.kind==='regions'));
});


test('simple actual-raster ray and concentric fields have opposite radial signatures',()=>{
 const rings=raster(200,200,(x,y)=>{
   const r=Math.hypot(x-99.5,y-99.5);
   return colour(HUES[Math.floor(r/11)%7]);
 });
 const rays=raster(200,200,(x,y)=>{
   const a=(Math.atan2(y-99.5,x-99.5)+Math.PI)/(Math.PI*2);
   return colour(HUES[Math.floor(a*21)%7]);
 });
 const ringSignature=radialImageSignature(rings);
 const raySignature=radialImageSignature(rays);
 assert.equal(ringSignature.kind,'rings');
 assert.equal(raySignature.kind,'rays');
 assert.ok(ringSignature.radialVariation>ringSignature.angularVariation);
 assert.ok(raySignature.angularVariation>raySignature.radialVariation);
 const ringChoices=reconstructionCandidates(rings,{seed:'ring-external'});
 const rayChoices=reconstructionCandidates(rays,{seed:'ray-external'});
 assert.ok(ringChoices.some(x=>x.kind==='radial-rings'));
 assert.ok(ringChoices.some(x=>x.kind==='nested-rings'));
 assert.ok(rayChoices.some(x=>x.kind==='radial-rays'));
 assert.ok(rayChoices.filter(x=>x.kind==='radial-rays')
   .every(x=>x.recipe.structure==='radial'));
});

test('displaced radial centres remain editable hypotheses without changing the renderer budget',()=>{
 const offX=.35,offY=.65,width=200,height=200;
 const rings=raster(width,height,(x,y)=>{
   const r=Math.hypot(x-(width-1)*offX,y-(height-1)*offY);
   return colour(HUES[Math.floor(r/11)%7]);
 });
 const rays=raster(width,height,(x,y)=>{
   const a=(Math.atan2(y-(height-1)*offY,x-(width-1)*offX)+Math.PI)/(Math.PI*2);
   return colour(HUES[Math.floor(a*21)%7]);
 });
 for(const [image,kind,candidateKind] of [
   [rings,'rings','radial-rings'],[rays,'rays','radial-rays']]){
   const signature=radialImageSignature(image);
   assert.equal(signature.kind,kind);
   assert.equal(signature.centerX,35);
   assert.equal(signature.centerY,65);
   const candidates=reconstructionCandidates(image,{seed:'offset-radial'});
   const radial=candidates.filter(x=>x.kind===candidateKind);
   assert.ok(radial.length);
   assert.ok(radial.every(x=>x.recipe.fieldCenterX===35&&
     x.recipe.fieldCenterY===65));
   assert.ok(candidates.length<=RECONSTRUCTION_RENDER_LIMIT);
 }
});

test('PCA recognizes oblique parallel stripes but refuses scattered unrelated centroids',()=>{
 const sloping=Array.from({length:7},(_,i)=>({
   cx:.1+i*.12,cy:.9-i*.10,area:1000
 }));
 const angle=imageStripeAngle(sloping,200,200);
 assert.ok(Number.isFinite(angle)&&angle>10&&angle<170);
 const notAligned=[
   [.15,.15],[.8,.2],[.28,.77],[.78,.8],[.4,.5],[.2,.44],[.7,.51]
 ].map(([cx,cy])=>({cx,cy,area:1000}));
 assert.equal(imageStripeAngle(notAligned,200,200),null);
 assert.equal(imageStripeAngle(sloping.slice(0,3),200,200),null);
});

test('coherent diagonal hue axes survive radial classifier integration without harming rays or circles',()=>{
  const diagonal=raster(160,320,(x,y)=>{
    const along=x+y*.48,slot=Math.floor((along-5)/27);
    return slot>=0&&slot<7&&along-5-slot*27<15?
      colour(HUES[slot]):[0,0,0,255];
  });
  const description=describeReconstructionImage(diagonal);
  assert.ok(description.componentDiagonalAngle>12&&description.componentDiagonalAngle<78);
  assert.equal(description.radial.kind,null,'linear bands must not be radial');
  assert.equal(description.sevenColourRegions,false);
  const fit=reconstructionCandidates(diagonal,{seed:'shared-image-axes'});
  assert.ok(fit.some(x=>x.kind==='straight'&&
    x.recipe.geometry==='straight'&&x.recipe.orientation==='diagonal'));
  assert.equal(fit.filter(x=>x.kind==='straight'&&
    x.recipe.orientation==='diagonal').length,3,
    'all three principal-axis angles remain available before six-render fit');
  assert.ok(fit.some(x=>x.kind==='path'),'retain source path alternative');
  assert.ok(fit.some(x=>x.kind==='jagged'),'retain angular geometry hypothesis');
  assert.ok(!fit.some(x=>x.kind==='regions'),
    'independent circles may not replace a coherent diagonal ribbon set');
  const circles=describeReconstructionImage(original);
  assert.equal(circles.componentDiagonalAngle,null);
  assert.ok(reconstructionCandidates(original,{}).some(x=>x.kind==='regions'));
  const rays=raster(160,320,(x,y)=>{
    const angle=(Math.atan2(y-159.5,x-79.5)+Math.PI)/(Math.PI*2);
    return colour(HUES[Math.floor(angle*21)%7]);
  });
  assert.equal(describeReconstructionImage(rays).radial.kind,'rays');
  assert.ok(reconstructionCandidates(rays,{}).some(x=>x.kind==='radial-rays'));
});


test('cooperative candidate ranking yields per render, matches synchronous scores and honours cancellation',async()=>{
  const w=RECONSTRUCTION_FRAME.width,h=RECONSTRUCTION_FRAME.height;
  const reference=raster(w,h,()=>[0,0,0,255]);
  const choices=[{kind:'bad',recipe:{seed:'bad'},label:'bad',uncertainty:'guess'},
    {kind:'good',recipe:{seed:'good'},label:'good',uncertainty:'guess'}];
  const render=recipe=>raster(w,h,()=>recipe.seed==='good'?
    [0,0,0,255]:[250,250,250,255]);
  const expected=rankReconstructionCandidates(choices,reference,render);
  let yields=0,renders=0;
  const observed=await rankReconstructionCandidatesCooperatively(
    choices,reference,r=>{renders++;return render(r);},
    {yieldControl:async()=>{yields++;}});
  assert.deepEqual(observed,expected);
  assert.equal(renders,2);assert.equal(yields,2);
  let cancelled=false;
  const aborted=await rankReconstructionCandidatesCooperatively(
    choices,reference,()=>{throw Error('must never draw after cancellation');},
    {yieldControl:async()=>{cancelled=true;},isCancelled:()=>cancelled});
  assert.equal(aborted,null);
});
test('cooperative refinement reuses identical bounded parameter trials, and discards stale jobs',async()=>{
  const w=RECONSTRUCTION_FRAME.width,h=RECONSTRUCTION_FRAME.height;
  const source=raster(w,h,()=>[0,0,0,255]);
  const recipe=normalizeRecipe({seed:'cooperative',structure:'paths',
    geometry:'straight',orientation:'vertical',positionX:0,chaos:0});
  const painter=recipe=>raster(w,h,()=>{
    const x=Math.min(255,Math.round(Math.abs(recipe.positionX-8)*15));
    return [x,x,x,255];
  });
  const item={kind:'straight',label:'straight',recipe,
    error:compareReconstructionPixels(source,painter(recipe))};
  const expected=refineReconstructionCandidate(item,source,painter);
  let count=0,frames=0;
  const actual=await refineReconstructionCandidateCooperatively(item,source,
    r=>{count++;return painter(r);},{yieldControl:async()=>{frames++;}});
  assert.deepEqual(actual,expected);
  assert.equal(count,10);assert.equal(frames,10);
  let cancelled=false,renderCalls=0;
  const abandoned=await refineReconstructionCandidateCooperatively(item,source,
    r=>{renderCalls++;return painter(r);},{
      yieldControl:async()=>{cancelled=true;},
      isCancelled:()=>cancelled
    });
  assert.equal(abandoned,null);
  assert.equal(renderCalls,0);
  assert.deepEqual(item.recipe,recipe,'cancel never mutates original current art');
});


test('curvature classifier orders editable procedural hypotheses without replacing the real-render metric',()=>{
  const rasterWidth=200,rasterHeight=200;
  const arc=Array.from({length:36},(_,i)=>{
    const x=i/35;
    return [x,.5+.2*Math.sin(x*Math.PI*2)];
  });
  const wave=imageCurveSignature([{kind:'arc',points:arc}],rasterWidth,rasterHeight);
  assert.equal(wave.kind,'wave');
  const saw=Array.from({length:15},(_,i)=>[i/14,i%2?.3:.7]);
  const jagged=imageCurveSignature([{kind:'contour',points:saw}],rasterWidth,rasterHeight);
  assert.equal(jagged.kind,'jagged');
  const hairpin=[
    [.2,.05],[.2,.18],[.2,.32],[.25,.44],
    [.37,.49],[.51,.48],[.59,.4],[.59,.28],[.59,.15]
  ];
  assert.equal(imageCurveSignature([{kind:'arc',points:hairpin}],200,200).kind,'hairpin');
  assert.equal(imageCurveSignature([],200,200).kind,null);
});

test('wave jagged and hairpin fitted variants stay within ten true-render passes',()=>{
 const w=RECONSTRUCTION_FRAME.width,h=RECONSTRUCTION_FRAME.height;
 const empty=raster(w,h,()=>[0,0,0,255]);
 for(const kind of ['wave','jagged','hairpin']){
   const recipe=normalizeRecipe({seed:'curvature-'+kind,structure:'paths',
     geometry:kind,orientation:kind==='hairpin'?'vertical':'horizontal'});
   let renders=0;
   const candidate={kind,label:kind,recipe,error:.2};
   const fitted=refineReconstructionCandidate(candidate,empty,(r)=>{
     renders++;return raster(w,h,()=>[0,0,0,255]);
   },{maxRenders:10});
   assert.ok(renders<=10);
   assert.equal(fitted.error,0);
   assert.equal(fitted.recipe.geometry,kind);
   assert.ok(fitted.refinementRenders>0);
 }
});


test('six-render candidate selection preserves one independent type before redundant parameter copies',()=>{
 const options=[
  ...[30,40,50].map(n=>({kind:'straight',id:'rotation-'+n})),
  {kind:'loop',id:'loop-a'},{kind:'loop',id:'loop-b'},
  {kind:'wave',id:'wave-a'},{kind:'jagged',id:'jagged-a'},
  {kind:'hairpin',id:'hairpin-a'},
  {kind:'path',id:'manual-trace'}
 ];
 const selection=diverseReconstructionCandidates(options);
 assert.deepEqual(selection.map(x=>x.kind),
   ['straight','loop','wave','jagged','hairpin','path']);
 assert.ok(selection.length<=RECONSTRUCTION_RENDER_LIMIT);
 assert.deepEqual(diverseReconstructionCandidates(options,2).map(x=>x.kind),
   ['straight','loop']);
 assert.throws(()=>diverseReconstructionCandidates(options,100),/budget/);
});

test('curved seven-band import compares a safe Draw fallback with explicit unclamped ribbons',()=>{
  const source=raster(180,330,(x,y)=>{
    const bend=Math.sin(x/17)*8;
    for(let i=0;i<7;i++)if(Math.abs(y-(42+i*34+bend))<8)
      return colour(HUES[i]);
    return [0,0,0,255];
  });
  const desc=describeReconstructionImage(source);
  assert.equal(desc.curve.kind,'wave');
  const candidates=reconstructionCandidates(source,{seed:'not-authenticated'});
  const paths=candidates.filter(c=>c.kind==='path');
  assert.ok(paths.some(c=>c.recipe.geometrySafety===true),
    'conservative working Draw recipe must remain a rankable choice');
  assert.ok(paths.some(c=>c.recipe.geometrySafety===false),
    'wide current-ribbon alternative uses ordinary canonical opt-out');
  assert.ok(candidates.length<=RECONSTRUCTION_RENDER_LIMIT);
  assert.ok(paths.every(c=>c.recipe.geometry==='drawn'&&
    c.recipe.structure==='paths'&&c.recipe.customPath.length>1));
  const locked=reconstructionCandidates(source,normalizeRecipe({
    seed:'locked-current',geometrySafety:true,lockedSettings:['geometrySafety']
  }));
  assert.ok(locked.every(c=>c.recipe.geometrySafety===true),
    'must not bypass a user lock in canonical Apply or preview');
});

test('straight seven-band imports do not relax curvature safety speculatively',()=>{
  const flat=raster(180,330,(x,y)=>{
    for(let i=0;i<7;i++)if(Math.abs(y-(42+i*34))<8)
      return colour(HUES[i]);
    return [0,0,0,255];
  });
  const candidates=reconstructionCandidates(flat,{seed:'straight'});
  assert.ok(candidates.every(c=>c.recipe.geometrySafety!==false));
});


test('only one structural challenger gets the ten-render budget when initial Draw is poor',()=>{
 const path={kind:'path',label:'narrow Draw',error:.206};
 const wave={kind:'wave',label:'wide Wave',error:.315};
 const jagged={kind:'jagged',label:'Jagged',error:.327};
 assert.equal(reconstructionRefinementIndex([path,wave,jagged]),1);
 assert.equal(reconstructionRefinementIndex([
   {kind:'path',error:.252},{kind:'straight',error:.274},
   {kind:'jagged',error:.280},{kind:'wave',error:.295}]),2);
 assert.equal(reconstructionRefinementIndex([{kind:'loop',error:.054},wave]),0);
 assert.equal(reconstructionRefinementIndex([{kind:'path',error:.04},wave]),0);
 assert.equal(reconstructionRefinementIndex([]),-1);
 const reference=raster(RECONSTRUCTION_FRAME.width,RECONSTRUCTION_FRAME.height,
   ()=>[0,0,0,255]);
 const original=normalizeRecipe({structure:'paths',geometry:'wave',
   orientation:'horizontal',positionY:0});
 const initial={...wave,recipe:original};
 let calls=0;
 const improved=refineReconstructionCandidate(initial,reference,(candidate,w,h)=>{
   calls++;
   const delta=Math.min(255,Math.abs(candidate.positionY+25)*10);
   return raster(w,h,()=>[delta,delta,delta,255]);
 });
 assert.equal(improved.recipe.positionY,-25);
 assert.equal(improved.error,0);
 assert.equal(calls,10,'same budget, not ten per candidate');
 assert.equal(improved.refinementRenders,10);
 assert.equal([path,improved].sort((a,b)=>a.error-b.error)[0].kind,'wave');
});


test('actual seven-pigment geometry inversion seeds canonical Wave spacing and width',()=>{
 const bands=Array.from({length:7},(_,index)=>({
   index,area:28*Math.sqrt(12)*80,cx:138/277,cy:(48+index*65)/600,
   axisAngle:0,axisRatio:9,majorStd:80
 }));
 const metrics=measuredRainbowRibbonBands(bands,277,600);
 assert.ok(metrics);
 assert.ok(Math.abs(metrics.centreGapPx-65)<.001);
 assert.ok(Math.abs(metrics.thicknessPx-28)<.001);
 const defaultWave=normalizeRecipe({geometry:'wave',structure:'paths',
   orientation:'horizontal',stripeWidth:65,spread:65});
 const estimated=seedMeasuredRibbonControls(defaultWave,metrics,277,600);
 assert.ok(estimated.spread>=69&&estimated.spread<=72);
 assert.ok(estimated.stripeWidth>=52&&estimated.stripeWidth<=56);
 assert.equal(estimated.geometry,'wave');
 assert.equal(estimated.structure,'paths');
 const reverted=seedMeasuredRibbonControls(defaultWave,null,277,600);
 assert.deepEqual(reverted,defaultWave);
});

test('shared hue extractor reports longitudinal dispersion once and rejects unrelated dots',()=>{
 const image=raster(220,420,(x,y)=>{
   const index=Math.floor(y/60);
   return index<7&&y%60<25?colour(HUES[index]):[0,0,0,255];
 });
 const values=extractImageColourRegions(image,HUES);
 assert.equal(values.regions.length,7);
 assert.ok(values.regions.every(r=>r.majorStd>20&&r.minorStd>0));
 const metrics=measuredRainbowRibbonBands(values.regions,image.width,image.height);
 assert.ok(metrics&&metrics.thicknessPx>20&&metrics.thicknessPx<27);
 assert.ok(metrics.centreGapPx>=59&&metrics.centreGapPx<=61);
 assert.equal(measuredRainbowRibbonBands(
   extractImageColourRegions(original,HUES).regions,120,260),null);
 const modified=values.regions.map((r,i)=>i===2?
   {...r,axisAngle:55}:r);
 assert.equal(measuredRainbowRibbonBands(modified,image.width,image.height),null);
});


test('seven matching hue centroids recover a rigid Wave displacement, not crooked or missing pigments',async()=>{
 const w=RECONSTRUCTION_FRAME.width,h=RECONSTRUCTION_FRAME.height;
 const stripeImage=(offset=0,oneExtra=0)=>raster(w,h,(x,y)=>{
   for(let i=0;i<7;i++){
     const top=14+i*23+offset+(i===4?oneExtra:0);
     if(y>=top&&y<top+6)return colour(HUES[i]);
   }
   return [0,0,0,255];
 });
 const source=stripeImage();
 const displaced=stripeImage(15);
 assert.equal(coherentWaveOffsetY(source,displaced),-7);
 assert.equal(reconstructionRefinementIndex([
   {kind:'path',error:.206789},
   {kind:'jagged',error:.25869},
   {kind:'wave',error:.347079,waveOffsetY:-7}
 ]),2,'measured rigid Wave shift gets one bounded fitting budget first');
 assert.equal(reconstructionRefinementIndex([
   {kind:'path',error:.206789},
   {kind:'jagged',error:.25869},
   {kind:'wave',error:.347079}
 ]),1,'without a measured shift use ordinary lowest-error challenger');
 assert.equal(coherentWaveOffsetY(source,stripeImage(15,14)),null,
   'independent colour movement must not masquerade as whole-art translation');
 assert.equal(coherentWaveOffsetY(source,raster(w,h,()=>[0,0,0,255])),null);
 const wave=normalizeRecipe({seed:'aligned-wave-test',structure:'paths',
   geometry:'wave',positionY:0});
 const candidate={kind:'wave',label:'Wave',uncertainty:'fit trial',recipe:wave};
 const painter=recipe=>{
   const dy=15+Math.round(recipe.positionY*h/100);
   return stripeImage(dy);
 };
 const ranked=rankReconstructionCandidates([candidate],source,painter)[0];
 assert.equal(ranked.waveOffsetY,-7);
 const fitted=refineReconstructionCandidate(ranked,source,painter);
 assert.equal(fitted.recipe.positionY,-7);
 assert.equal(fitted.error,0);
 assert.ok(fitted.refinementRenders<=10);
 const yields=[];
 const cooperative=(await rankReconstructionCandidatesCooperatively([candidate],
   source,painter,{yieldControl:async()=>yields.push('coarse')}))[0];
 assert.equal(cooperative.waveOffsetY,-7);
 const asyncFitted=await refineReconstructionCandidateCooperatively(
   cooperative,source,painter,{yieldControl:async()=>yields.push('fit')});
 assert.deepEqual(asyncFitted,fitted);
 assert.equal(yields.length,1+fitted.refinementRenders);
});

test('refinement never previews locked settings including composite Position, even with a measured Wave offset',async()=>{
 const width=RECONSTRUCTION_FRAME.width,height=RECONSTRUCTION_FRAME.height;
 const source=raster(width,height,()=>[0,0,0,255]);
 const recipe=normalizeRecipe({
   seed:'protected-wave',structure:'paths',geometry:'wave',orientation:'horizontal',
   spread:61,stripeWidth:73,positionX:11,positionY:-7,
   lockedSettings:['position','spread','stripeWidth','shapeDepth','shapeFrequency']
 });
 assert.ok(recipe.lockedSettings.includes('position'));
 const candidate={kind:'wave',recipe,label:'Protected wave',error:.6,waveOffsetY:-15};
 let paints=0;
 const render=()=>{paints++;return raster(width,height,()=>[0,0,0,255]);};
 const synchronous=refineReconstructionCandidate(candidate,source,render);
 assert.equal(paints,0,'all three wave trial fields are locked, do not render impossible previews');
 assert.equal(synchronous.refinementRenders,0);
 assert.deepEqual(synchronous.recipe,recipe,'no protected field may move');
 let yields=0;
 const cooperative=await refineReconstructionCandidateCooperatively(candidate,source,
   render,{yieldControl:async()=>{yields++;}});
 assert.deepEqual(cooperative,synchronous);
 assert.equal(yields,0);
 assert.equal(paints,0);
});

test('direct and composite locks remain applied across every partially unlocked real-render fit trial',async()=>{
 const width=RECONSTRUCTION_FRAME.width,height=RECONSTRUCTION_FRAME.height;
 const source=raster(width,height,()=>[0,0,0,255]);
 const recipe=normalizeRecipe({seed:'protected-hairpin',structure:'paths',geometry:'hairpin',
   turnRadius:51,hairpinAngle:135,positionX:13,positionY:-9,stripeWidth:77,
   lockedSettings:['position','stripeWidth']});
 const candidates=[];
 const painter=next=>{
   candidates.push(next);
   return raster(width,height,()=>[0,0,0,255]);
 };
 const item={kind:'hairpin',recipe,label:'hairpin with locked camera',error:.5};
 const synchronous=refineReconstructionCandidate(item,source,painter);
 assert.ok(candidates.length>0&&candidates.length<=10);
 for(const tested of candidates){
   assert.equal(tested.positionX,recipe.positionX);
   assert.equal(tested.positionY,recipe.positionY);
   assert.equal(tested.stripeWidth,recipe.stripeWidth);
   assert.deepEqual(tested.lockedSettings,recipe.lockedSettings);
 }
 assert.equal(synchronous.recipe.positionX,recipe.positionX);
 assert.equal(synchronous.recipe.positionY,recipe.positionY);
 assert.equal(synchronous.recipe.stripeWidth,recipe.stripeWidth);
 const cooperative=await refineReconstructionCandidateCooperatively(item,source,
   ()=>raster(width,height,()=>[0,0,0,255]));
 assert.deepEqual(cooperative,synchronous,'same canonical locked fit in browser and R0');
});


test('seven coherent vertical hue strips reveal rigid X offset within existing straight fit budget',async()=>{
 const w=RECONSTRUCTION_FRAME.width,h=RECONSTRUCTION_FRAME.height;
 const image=(offset=0,oneShift=0)=>raster(w,h,(x,y)=>{
   for(let i=0;i<7;i++){
     const start=5+i*12+offset+(i===4?oneShift:0);
     if(x>=start&&x<start+4)return colour(HUES[i]);
   }
   return [0,0,0,255];
 });
 const source=image(0),shifted=image(5);
 assert.equal(coherentVerticalBandOffsetX(source,shifted),-5);
 assert.equal(coherentVerticalBandOffsetX(source,image(5,12)),null);
 assert.equal(coherentVerticalBandOffsetX(source,raster(w,h,()=>[0,0,0,255])),null);
 const recipe=normalizeRecipe({seed:'source-registered-straight',geometry:'straight',
   structure:'paths',orientation:'vertical',positionX:0});
 const candidate={kind:'straight',label:'Vertical ribbons',
   recipe,uncertainty:'Measured source',error:.3};
 const render=r=>image(5+Math.round(r.positionX*w/100));
 const ranked=rankReconstructionCandidates([candidate],source,render)[0];
 assert.equal(ranked.bandOffsetX,-5);
 const fitted=refineReconstructionCandidate(ranked,source,render);
 assert.equal(fitted.recipe.positionX,-5);
 assert.equal(fitted.error,0);
 assert.ok(fitted.refinementRenders<=10);
 const cooperative=(await rankReconstructionCandidatesCooperatively(
   [candidate],source,render))[0];
 assert.equal(cooperative.bandOffsetX,-5);
 assert.deepEqual(await refineReconstructionCandidateCooperatively(
   cooperative,source,render),fitted);
});

test('a protected X/Y Position prevents measured vertical offset fitting from rendering impossible candidates',()=>{
 const width=RECONSTRUCTION_FRAME.width,height=RECONSTRUCTION_FRAME.height;
 const source=raster(width,height,()=>[0,0,0,255]);
 const recipe=normalizeRecipe({structure:'paths',geometry:'straight',
   orientation:'vertical',positionX:11,positionY:-9,lockedSettings:['position']});
 const calls=[];
 const fitted=refineReconstructionCandidate({
   kind:'straight',recipe,error:.5,label:'locked vertical',bandOffsetX:-5
 },source,r=>{
   calls.push(r);
   return raster(width,height,()=>[0,0,0,255]);
 });
 assert.ok(calls.length>0);
 assert.ok(calls.every(r=>r.positionX===11&&r.positionY===-9));
 assert.equal(fitted.recipe.positionX,11);
 assert.equal(fitted.recipe.positionY,-9);
});


test('measured Wave refinement spends fixed renderer budget on genuine contour controls, preserving locks and optional Y registration',async()=>{
 const w=RECONSTRUCTION_FRAME.width,h=RECONSTRUCTION_FRAME.height;
 const source=raster(w,h,()=>[0,0,0,255]);
 const recipe=normalizeRecipe({seed:'wave-profile-probe',structure:'paths',
   geometry:'wave',orientation:'horizontal',shapeDepth:60,shapeFrequency:45,
   positionY:0,spread:70,stripeWidth:63,
   lockedSettings:['spread','stripeWidth']});
 const input={kind:'wave',label:'Wave',recipe,error:.8,waveOffsetY:-7};
 const seen=[];
 const painter=next=>{
   seen.push(next);
   const deviation=Math.abs(next.shapeDepth-72)+
     Math.abs(next.shapeFrequency-33)+
     Math.abs(next.positionY+7);
   const v=Math.min(255,Math.round(deviation*5));
   return raster(w,h,()=>[v,v,v,255]);
 };
 const result=refineReconstructionCandidate(input,source,painter);
 assert.ok(seen.length<=10&&seen.length>=6);
 assert.ok(seen.every(r=>r.spread===70&&r.stripeWidth===63));
 assert.equal(result.recipe.positionY,-7);
 assert.equal(result.recipe.shapeDepth,72);
 assert.equal(result.recipe.shapeFrequency,33);
 assert.equal(result.error,0);
 const asyncResult=await refineReconstructionCandidateCooperatively(input,source,painter);
 assert.deepEqual(asyncResult,result);
 assert.ok(result.refinementRenders<=10);
});


test('expanded Draw seven-hue Y registration earns one bounded fit without displacing the conservative fallback',async()=>{
 const w=RECONSTRUCTION_FRAME.width,h=RECONSTRUCTION_FRAME.height;
 const bands=(shift=0,rogue=0,thickness=7)=>raster(w,h,(x,y)=>{
   for(let i=0;i<7;i++){
     const top=10+i*24+shift+(i===4?rogue:0);
     if(y>=top&&y<top+thickness)return colour(HUES[i]);
   }
   return [0,0,0,255];
 });
 const source=bands(),shifted=bands(13);
 assert.equal(coherentExpandedDrawOffsetY(source,shifted),-6);
 assert.equal(coherentExpandedDrawOffsetY(source,bands(13,13)),null,
   'disparate hue motion must never imply global translation');
 assert.equal(coherentExpandedDrawOffsetY(source,
   raster(w,h,()=>[0,0,0,255])),null);
 const wide=normalizeRecipe({seed:'wide-draw',structure:'paths',geometry:'drawn',
   geometrySafety:false,spread:65,stripeWidth:52,positionY:0});
 const safe=normalizeRecipe({...wide,geometrySafety:true});
 const painter=r=>bands(13+Math.round(r.positionY*h/100),0,
   r.geometrySafety?2:7);
 const ranked=rankReconstructionCandidates([
   {kind:'path',label:'safe',recipe:safe,uncertainty:'inferred'},
   {kind:'path',label:'wide',recipe:wide,uncertainty:'inferred'}
 ],source,painter);
 const detected=ranked.find(c=>!c.recipe.geometrySafety);
 assert.equal(detected.drawOffsetY,-6);
 assert.equal(ranked.find(c=>c.recipe.geometrySafety).drawOffsetY,undefined,
   'safe candidate is kept outside the speculative registration pass');
 assert.equal(reconstructionRefinementIndex([
   {kind:'path',error:.192433,recipe:safe},
   {...detected,error:.226618}
 ]),1,'displaced wider Draw is given the one shared fitting budget');
 const fit=refineReconstructionCandidate(detected,source,painter);
 assert.equal(fit.recipe.positionY,-6);
 assert.ok(fit.error<detected.error&&fit.error<.05,
   'integer canonical position controls reduce true-render mismatch, not a guessed winner');
 assert.ok(fit.refinementRenders<=10);
 const asyncFit=await refineReconstructionCandidateCooperatively(detected,source,
   painter,{yieldControl:async()=>{}});
 assert.deepEqual(asyncFit,fit,'sync and cancellable paths share trial sequence');
 assert.deepEqual(refineReconstructionCandidate(ranked.find(c=>
   c.recipe.geometrySafety),source,painter),
   ranked.find(c=>c.recipe.geometrySafety),
   'the conservative fallback is never needlessly mutated');
 assert.equal(reconstructionRefinementIndex([
   {kind:'path',error:.192433,recipe:safe},
   {...detected,error:.60}
 ]),0,'an implausibly poor wide initial candidate gets no budget');
});

test('expanded Draw registration honours umbrella and direct setting locks and cancellable execution',async()=>{
 const w=RECONSTRUCTION_FRAME.width,h=RECONSTRUCTION_FRAME.height;
 const source=raster(w,h,()=>[0,0,0,255]);
 const recipe=normalizeRecipe({seed:'protected-wide',structure:'paths',
   geometry:'drawn',geometrySafety:false,positionX:12,positionY:-8,
   spread:61,stripeWidth:69,
   lockedSettings:['position','spread','stripeWidth']});
 const candidate={kind:'path',label:'locked wide',recipe,error:.3,drawOffsetY:-6};
 let paints=0;
 const painter=()=>{paints++;return source;};
 const result=refineReconstructionCandidate(candidate,source,painter);
 assert.equal(paints,0);
 assert.equal(result.refinementRenders,0);
 assert.deepEqual(result.recipe,recipe);
 const synced=await refineReconstructionCandidateCooperatively(candidate,source,painter);
 assert.deepEqual(synced,result);
 assert.equal(paints,0);
 const partial=normalizeRecipe({...recipe,lockedSettings:['position','stripeWidth']});
 const visited=[];
 const fitted=refineReconstructionCandidate({...candidate,recipe:partial},
   source,next=>{visited.push(next);return source;});
 assert.ok(visited.length>0&&visited.length<=10);
 assert.ok(visited.every(next=>next.positionX===12&&next.positionY===-8&&
   next.stripeWidth===69));
 let cancelled=false,afterCancel=0;
 const halted=await refineReconstructionCandidateCooperatively(
   {...candidate,recipe:partial},source,()=>{afterCancel++;return source;},
   {yieldControl:async()=>{cancelled=true;},isCancelled:()=>cancelled});
 assert.equal(halted,null);
 assert.equal(afterCancel,0);
});

test('actual seven-colour gap drift becomes canonical wide Draw spread followed by whole-pack Y correction',async()=>{
 const w=RECONSTRUCTION_FRAME.width,h=RECONSTRUCTION_FRAME.height;
 const stripes=(centre,gap,width=8)=>raster(w,h,(x,y)=>{
   for(let i=0;i<7;i++){
     const y0=centre+(i-3)*gap;
     if(y>=y0&&y<y0+width)return colour(HUES[i]);
   }
   return [0,0,0,255];
 });
 const source=stripes(90,24);
 const initial=stripes(100,12);
 const estimated=measuredExpandedDrawRegistration(source,initial);
 assert.ok(estimated,'seven ordered hues retain a coherent linear spacing mismatch');
 assert.ok(estimated.gapRatio>1.9&&estimated.gapRatio<2.1);
 assert.equal(estimated.offsetY,-5);
 const wide=normalizeRecipe({structure:'paths',geometry:'drawn',
   geometrySafety:false,spread:65,stripeWidth:52,positionY:0});
 const painter=r=>stripes(100+Math.round(r.positionY*h/100),
   Math.round(12+(r.spread-65)*12/35));
 const candidate=rankReconstructionCandidates(
   [{kind:'path',label:'measured wide',recipe:wide,uncertainty:'inferred'}],
   source,painter)[0];
 assert.ok(candidate.drawGapRatio>1.9);
 const fitted=refineReconstructionCandidate(candidate,source,painter);
 assert.ok(fitted.refinementRenders<=10);
 assert.ok(fitted.error<=candidate.error,
   'fit accepts only a strictly improved real pixel score');
 assert.ok([65,100].includes(fitted.recipe.spread)||fitted.recipe.spread>65,
   'canonical fit may reject a physical gap proposal if source pixels score worse');
 assert.deepEqual(await refineReconstructionCandidateCooperatively(
   candidate,source,painter),fitted);
 assert.equal(reconstructionRefinementIndex([
   {kind:'path',label:'safe Draw',recipe:normalizeRecipe({...wide,geometrySafety:true}),
     error:.192433},
   {...candidate,error:.226618},
   {kind:'wave',error:.36,waveOffsetY:-4}
 ]),2,'smooth source retains known coherent Wave registration');
 assert.equal(reconstructionRefinementIndex([
   {kind:'path',error:.192433,recipe:normalizeRecipe({...wide,geometrySafety:true})},
   {...candidate,error:.226618,angularBends:2},
   {kind:'wave',error:.36,waveOffsetY:-4}
 ]),1,'independently measured two angular turns justify the wide Draw budget');
});

test('long-baseline bends recognize authored V corners after shared importer smoothing, not gentle waves',()=>{
 const angular=[];
 for(let x=0;x<=240;x+=3){
   const y=x<=78?36+x*.37:x<=153?65-(x-78)*.36:38+(x-153)*.43;
   angular.push([x/240,y/240]);
 }
 // Nine-station smoothing approximates the image importer's low-pass.
 const smooth=angular.map(([x],i)=>{
   let y=0,n=0;
   for(let j=Math.max(0,i-4);j<=Math.min(angular.length-1,i+4);j++){
     y+=angular[j][1];n++;
   }
   return [x,y/n];
 });
 const result=imageCurveSignature([{kind:'arc',points:smooth}],240,240);
 assert.ok(result.angularBends>=2,'two zig corners should survive a smoothed centreline');
 const gentle=Array.from({length:81},(_,i)=>{
   const x=i/80;return [x,.35+.035*Math.sin(x*Math.PI*2)];
 });
 const wave=imageCurveSignature([{kind:'arc',points:gentle}],240,240);
 assert.equal(wave.angularBends,0,'a gentle flowing curve is not an angular V');
});


test('expanded Draw X-axis registration fits upright seven-colour bands with unchanged budget',async()=>{
 const w=RECONSTRUCTION_FRAME.width,h=RECONSTRUCTION_FRAME.height;
 const bands=(shift=0,rogue=0)=>raster(w,h,(x,y)=>{
   for(let i=0;i<7;i++){
     const left=8+i*11+shift+(i===4?rogue:0);
     if(x>=left&&x<left+5)return colour(HUES[i]);
   }
   return [0,0,0,255];
 });
 const source=bands(),translated=bands(8);
 const registration=measuredExpandedDrawRegistration(source,translated);
 assert.equal(registration?.offsetX,-8);
 assert.ok(Math.abs(registration.gapRatio-1)<1e-9);
 assert.equal(coherentExpandedDrawOffsetY(source,translated),null,
   'horizontal registration should remain explicitly Y-only');
 assert.equal(measuredExpandedDrawRegistration(source,bands(8,11)),null,
   'a disconnected per-hue displacement does not authorize a rigid X fit');
 const wide=normalizeRecipe({seed:'upright-draw',structure:'paths',
   geometry:'drawn',geometrySafety:false,spread:65,stripeWidth:52,positionX:0});
 const painter=recipe=>bands(8+Math.round(recipe.positionX*w/100));
 const ranked=rankReconstructionCandidates([
   {kind:'path',label:'expanded upright Draw',recipe:wide,uncertainty:'inferred'}
 ],source,painter);
 assert.equal(ranked[0].drawOffsetX,-8);
 assert.equal(ranked[0].drawOffsetY,undefined);
 const fit=refineReconstructionCandidate(ranked[0],source,painter);
 assert.equal(fit.recipe.positionX,-8);
 assert.equal(fit.error,0);
 assert.ok(fit.refinementRenders<=10);
 assert.deepEqual(await refineReconstructionCandidateCooperatively(
   ranked[0],source,painter),fit);
 const safe=normalizeRecipe({...wide,geometrySafety:true});
 assert.equal(reconstructionRefinementIndex([
   {kind:'path',recipe:safe,error:.19},
   {...ranked[0],error:.22,angularBends:2,drawGapRatio:1.5}
 ]),1,'one registered upright challenger can use the shared refinement slot');
 const locked=normalizeRecipe({...wide,
   lockedSettings:['position','spread','stripeWidth']});
 let calls=0;
 const lockedResult=refineReconstructionCandidate({...ranked[0],recipe:locked},
   source,()=>{calls++;return source;});
 assert.equal(calls,0);
 assert.equal(lockedResult.refinementRenders,0);
 assert.equal(lockedResult.recipe.positionX,0);
});


test('long-baseline angular recognition follows upright Y-ordered centreline without inventing smooth-wave corners',()=>{
 const angular=[];
 for(let y=0;y<=240;y+=3){
   const x=y<=78?36+y*.37:y<=153?65-(y-78)*.36:38+(y-153)*.43;
   angular.push([x/240,y/240]);
 }
 const smoothed=angular.map(([,y],i)=>{
   let x=0,n=0;
   for(let j=Math.max(0,i-4);j<=Math.min(angular.length-1,i+4);j++){
     x+=angular[j][0];n++;
   }
   return [x/n,y];
 });
 const signature=imageCurveSignature([{kind:'arc',points:smoothed}],240,240);
 assert.ok(signature.angularBends>=2,
   'dominant-axis tracing should retain two real upright V corners');
 const flowing=Array.from({length:81},(_,i)=>{
   const y=i/80;return [.35+.035*Math.sin(y*Math.PI*2),y];
 });
 assert.equal(imageCurveSignature([{kind:'arc',points:flowing}],240,240).angularBends,0);
});


test('two compact islands per hue use fourteen ordinary editable canonical circles',()=>{
 const sites=Array.from({length:14},(_,i)=>[
   18+(i%4)*27,20+Math.floor(i/4)*58
 ]);
 const painted=(elongate=false)=>raster(120,260,(x,y)=>{
   for(const [i,[cx,cy]] of sites.entries()){
     const inside=elongate&&i===7?
       Math.abs(x-cx)<=2&&Math.abs(y-cy)<=18:
       Math.hypot(x-cx,y-cy)<=6;
     if(inside)return colour(HUES[i%7]);
   }
   return [0,0,0,255];
 });
 const source=painted();
 const colours=extractImageColourRegions(source,HUES);
 assert.equal(colours.regions.length,7,'existing primary per-hue descriptors remain intact');
 assert.equal(colours.componentRegions.length,14);
 const desc=describeReconstructionImage(source);
 assert.equal(desc.sevenColourRegions,false,
   'largest-only segmentation must not collapse fourteen islands into seven');
 assert.equal(desc.repeatedColourRegions.length,14);
 const choices=reconstructionCandidates(source,normalizeRecipe({seed:'two-orbits'}));
 assert.ok(choices.length<=RECONSTRUCTION_RENDER_LIMIT);
 const circles=choices.find(choice=>choice.kind==='regions');
 assert.ok(circles,'the existing scattered painter can express repeated hue slots');
 assert.equal(circles.recipe.scatteredCount,14);
 assert.equal(circles.recipe.scatteredOverrides.length,14);
 const box=reconstructionPlacement(120,260);
 for(const [index,[x,y]] of sites.entries()){
   const actual=circles.recipe.scatteredOverrides[index];
   assert.equal(actual.index,index);
   assert.ok(Math.abs(actual.x-(box.x+x*box.width/120)/600)<.006);
   assert.ok(Math.abs(actual.y-(box.y+y*box.height/260)/1300)<.006);
 }
 const restored=decodeRecipe(encodeRecipe(circles.recipe));
 assert.deepEqual(restored,circles.recipe);
 assert.equal(resolveScene(restored).objects.length,14);
 const irregular=describeReconstructionImage(painted(true));
 assert.equal(irregular.repeatedColourRegions,null,
   'an elongated fragment cannot be misrepresented as a confidently repeated disk');
});


test('congruent seven-hue angular silhouettes become seven editable shared portable shape stamps',()=>{
 const width=200,height=250;
 const source=raster(width,height,(x,y)=>{
   const bend=x<100?x*.16:(200-x)*.16;
   for(let i=0;i<7;i++)
     if(Math.abs(y-(16+i*30+bend))<=4)return colour(HUES[i]);
   return [0,0,0,255];
 });
 assert.equal(extractImageColourRegions(source,HUES).repeatShape,undefined,
   'normal painter-registration extraction must not do expensive contour work');
 const desc=describeReconstructionImage(source);
 assert.ok(desc.repeatShape?.geometry?.components.length===1,
   'the measured repeated contour uses the existing imported shape snapshot');
 assert.ok(desc.repeatShape.minOverlap>.76);
 const candidates=reconstructionCandidates(source,normalizeRecipe({seed:'measured-stamps'}));
 assert.ok(candidates.length<=RECONSTRUCTION_RENDER_LIMIT);
 const stamp=candidates.find(c=>c.kind==='shape-repeats');
 assert.ok(stamp,'genuine repeated shapes are offered among the six trials');
 assert.equal(stamp.recipe.structure,'regions');
 assert.equal(stamp.recipe.regionMode,'scattered');
 assert.equal(stamp.recipe.scatteredCount,7);
 assert.equal(stamp.recipe.scatteredOverrides.length,7);
 assert.equal(stamp.recipe.scatteredShapeKind,'imported');
 assert.equal(resolveScene(stamp.recipe).objects.length,7);
 assert.deepEqual(decodeRecipe(encodeRecipe(stamp.recipe)),stamp.recipe);
 assert.ok(stamp.recipe.scatteredShape.geometry.components[0].outer.length>=4);
 const ambiguous=raster(width,height,(x,y)=>{
   const bend=x<100?x*.16:(200-x)*.16;
   for(let i=0;i<7;i++){
     const malformed=i===4?16*Math.sin(x/18):0;
     if(Math.abs(y-(16+i*30+bend+malformed))<=4)return colour(HUES[i]);
   }
   return [0,0,0,255];
 });
 assert.equal(describeReconstructionImage(ambiguous).repeatShape,null,
   'one unrelated wave must not be asserted as a translated exact common shape');
});


test('seven repeated holed compound hue groups preserve two components and a real inner hole',()=>{
 const positions=Array.from({length:7},(_,i)=>[
   [45,105,165][i%3],[45,125,205][Math.floor(i/3)]
 ]);
 const source=raster(210,260,(x,y)=>{
   for(const [i,[cx,cy]] of positions.entries()){
     const square=Math.abs(x-cx)<=11&&Math.abs(y-cy)<=10;
     const hole=Math.abs(x-cx)<=4&&Math.abs(y-cy)<=4;
     const island=x>=cx+16&&x<=cx+22&&Math.abs(y-cy)<=3;
     if((square&&!hole)||island)return colour(HUES[i]);
   }
   return [0,0,0,255];
 });
 const defaultRegions=extractImageColourRegions(source,HUES);
 assert.ok(defaultRegions.componentRegions.length>=7,
   'existing primary pigment-region metrics remain supported');
 const desc=describeReconstructionImage(source);
 assert.ok(desc.repeatShape,'source-only bounded low-area scan retains real satellite islands');
 assert.equal(desc.repeatShape.geometry.components.length,2);
 assert.equal(desc.repeatShape.geometry.components[0].holes.length,1);
 assert.ok(desc.repeatShape.minOverlap>.95);
 const candidates=reconstructionCandidates(source,normalizeRecipe({seed:'compound-duplicates'}));
 assert.ok(candidates.length<=RECONSTRUCTION_RENDER_LIMIT);
 const stamp=candidates.find(candidate=>candidate.kind==='shape-repeats');
 assert.ok(stamp,'genuine compound hue repeats use the existing native stamp scene');
 const scene=resolveScene(stamp.recipe);
 assert.equal(scene.objects.length,7);
 assert.ok(scene.objects.every(o=>o.rings?.length===3),
   'each of seven instances has outer, inner hole and satellite outline');
 assert.deepEqual(decodeRecipe(encodeRecipe(stamp.recipe)),stamp.recipe);
 const implausible=raster(210,260,(x,y)=>{
   for(const [i,[cx,cy]] of positions.entries()){
     const square=Math.abs(x-cx)<=11&&Math.abs(y-cy)<=10;
     const hole=Math.abs(x-cx)<=4&&Math.abs(y-cy)<=4;
     const island=x>=cx+16&&x<=cx+22&&Math.abs(y-cy)<=3;
     if((square&&!hole)||(island&&i!==3))return colour(HUES[i]);
   }
   return [0,0,0,255];
 });
 assert.equal(describeReconstructionImage(implausible).repeatShape,null,
   'missing detached island in one hue must not imply identical source semantics');
});


test('Jagged near-miss uses one real-render measured fine registration instead of oversized 20 percent jumps',async()=>{
 const w=RECONSTRUCTION_FRAME.width,h=RECONSTRUCTION_FRAME.height;
 const shifted=(dx=0,dy=0)=>raster(w,h,(x,y)=>{
   for(let i=0;i<7;i++){
     const band=15+i*23+Math.round(x*.13)+
       Math.round(6*Math.abs(Math.sin(x/14)));
     if(Math.abs(y-band-dy)<3&&x>6+dx&&x<w-5+dx)
       return colour(HUES[i]);
   }
   return [0,0,0,255];
 });
 const source=shifted(),first=shifted(0,3);
 const alignment=measuredJaggedPixelShift(source,first);
 assert.ok(alignment&&alignment.measuredPixelGain>.04);
 assert.ok(alignment.offsetY<0&&Math.abs(alignment.offsetY)<3);
 const recipe=normalizeRecipe({seed:'angular-fine-registration',
   geometry:'jagged',positionX:0,positionY:0,background:'black'});
 const paint=next=>shifted(Math.round(next.positionX*w/100),
   3+Math.round(next.positionY*h/100));
 const ranked=rankReconstructionCandidates([
   {kind:'jagged',label:'Measured Jagged',recipe,uncertainty:'inferred'}
 ],source,paint);
 assert.ok(ranked[0].jaggedShift);
 const best=refineReconstructionCandidate(ranked[0],source,paint);
 assert.ok(best.error<ranked[0].error*.55);
 assert.ok(best.refinementRenders<=10);
 assert.deepEqual(await refineReconstructionCandidateCooperatively(
   ranked[0],source,paint,{yieldControl:async()=>{}}),best);
 const locked=normalizeRecipe({...recipe,lockedSettings:['position']});
 const tried=[];
 const protectedCandidate={...ranked[0],recipe:locked};
 const held=refineReconstructionCandidate(protectedCandidate,source,next=>{
   tried.push(next);return source;});
 assert.ok(tried.length<=10&&tried.every(r=>
   r.positionX===0&&r.positionY===0));
 assert.equal(held.recipe.positionX,0);
 assert.equal(held.recipe.positionY,0);
 const noShift=measuredJaggedPixelShift(source,source);
 assert.equal(noShift,null);
 const unrelated=raster(w,h,(x,y)=>
   x>70&&x<90&&y>40&&y<150?[255,255,255,255]:[0,0,0,255]);
 assert.equal(measuredJaggedPixelShift(source,unrelated),null,
   'unrelated pixel masks do not authorize a fine phase-registration claim');
});

test('clipped coherent Jagged pigments recover their physical gap from four intact ribbon spans',()=>{
 const regions=Array.from({length:7},(_,i)=>({
   index:i,area:i<4?11360:[8000,5600,3100][i-4],
   axisRatio:i<4?13.8:[9.8,6.9,3.8][i-4],
   axisAngle:-46+(i-3)*.12,majorStd:i<4?115:[82,57,32][i-4],
   minorStd:8.35,cx:i<4?.5:[.64,.75,.86][i-4],
   cy:.31+i*.108,
   bounds:i<4?[0,.05+i*.11,1,.59+i*.11]:
     [[.25,.46,1,.85],[.46,.57,1,.86],[.69,.68,1,.86]][i-4]
 }));
 const metrics=measuredRainbowRibbonBands(regions,277,600);
 assert.ok(metrics,'partially clipped source remains a measurable seven-hue system');
 assert.ok(metrics.centreGapPx>40&&metrics.centreGapPx<51);
 assert.ok(metrics.thicknessPx>26&&metrics.thicknessPx<31);
 const defaultGuess=normalizeRecipe({geometry:'jagged',structure:'paths',
   orientation:'diagonal',spread:55,stripeWidth:65});
 const recovered=seedMeasuredRibbonControls(defaultGuess,metrics,277,600);
 assert.ok(recovered.spread<defaultGuess.spread);
 assert.ok(recovered.stripeWidth<defaultGuess.stripeWidth);
 const inconsistent=regions.map((r,i)=>i===6?{...r,minorStd:15}:r);
 assert.equal(measuredRainbowRibbonBands(inconsistent,277,600),null,
   'one unrelated ink width prevents clipped-band extrapolation');
 const disconnected=regions.map((r,i)=>i===5?
   {...r,bounds:[0,.57,1,.86]}:r);
 assert.equal(measuredRainbowRibbonBands(disconnected,277,600),null,
   'truncation must be a progressively cropped same-side family');
 const changedAxis=regions.map((r,i)=>i===4?{...r,axisAngle:-18}:r);
 assert.equal(measuredRainbowRibbonBands(changedAxis,277,600),null,
   'occluded nonparallel pigments must not become a broad ribbon claim');
});

test('U-turn exit angle refines after radius, separation and placement in the same ten paints',async()=>{
 const w=RECONSTRUCTION_FRAME.width,h=RECONSTRUCTION_FRAME.height;
 const source=raster(w,h,()=>[0,0,0,255]);
 const recipe=normalizeRecipe({seed:'turn-and-exit',structure:'paths',
   geometry:'hairpin',turnRadius:50,hairpinAngle:120,spread:42,
   positionX:0,positionY:0});
 const paint=next=>{
   const aligned=next.turnRadius===35&&next.spread===32&&
     next.positionX===7&&next.positionY===7;
   const deviation=Math.abs(next.turnRadius-35)*.3+
     Math.abs(next.spread-32)*.3+
     Math.abs(next.positionX-7)+Math.abs(next.positionY-7)+
     Math.abs(next.hairpinAngle-(aligned?145:120))*.2;
   const v=Math.min(255,Math.round(deviation*2));
   return raster(w,h,()=>[v,v,v,255]);
 };
 const candidate={kind:'hairpin',recipe,label:'editable turn',error:.8};
 let renders=0;
 const fit=refineReconstructionCandidate(candidate,source,next=>{
   renders++;return paint(next);
 });
 assert.equal(renders,10,'one shared bounded ten-render refinement');
 assert.equal(fit.refinementRenders,10);
 assert.equal(fit.recipe.turnRadius,35);
 assert.equal(fit.recipe.spread,32);
 assert.equal(fit.recipe.positionX,7);
 assert.equal(fit.recipe.positionY,7);
 assert.equal(fit.recipe.hairpinAngle,145,
   'the source-compatible steeper exit is evaluated only after alignment');
 assert.equal(fit.error,0);
 assert.deepEqual(await refineReconstructionCandidateCooperatively(
   candidate,source,paint),fit,'cooperative and synchronous trials remain identical');
 const protectedRecipe=normalizeRecipe({...recipe,lockedSettings:['position']});
 const checked=refineReconstructionCandidate({...candidate,recipe:protectedRecipe},
   source,next=>{
     assert.equal(next.positionX,0);assert.equal(next.positionY,0);
     return paint(next);
   });
 assert.equal(checked.recipe.positionX,0);
 assert.equal(checked.recipe.positionY,0);
});

test('small Loop radius corrections recover the centre without extending the real-render budget',async()=>{
 const w=RECONSTRUCTION_FRAME.width,h=RECONSTRUCTION_FRAME.height;
 const reference=raster(w,h,()=>[0,0,0,255]);
 const recipe=normalizeRecipe({seed:'loop-inner-ring',structure:'paths',
   geometry:'loop',loopRadius:56,positionX:0,positionY:0});
 const painter=next=>{
   const v=Math.min(255,Math.round(
     Math.abs(next.positionX-6)*5+Math.abs(next.positionY)*3+
     Math.abs(next.loopRadius-62)*2));
   return raster(w,h,()=>[v,v,v,255]);
 };
 const candidate={kind:'loop',recipe,error:.8,label:'editable loop',
   loopInkRatio:.98};
 let calls=0;
 const best=refineReconstructionCandidate(candidate,reference,next=>{
   calls++;return painter(next);
 });
 assert.equal(calls,10);
 assert.equal(best.recipe.positionX,6);
 assert.equal(best.recipe.loopRadius,62);
 assert.equal(best.error,0);
 assert.deepEqual(await refineReconstructionCandidateCooperatively(
   candidate,reference,painter),best);
 let widthProbes=0,radiusProbes=0;
 const thick=refineReconstructionCandidate({...candidate,loopInkRatio:1.19},
   reference,next=>{
     if(next.stripeWidth!==recipe.stripeWidth)widthProbes++;
     if(next.loopRadius!==recipe.loopRadius)radiusProbes++;
     return painter(next);
   });
 assert.equal(thick.refinementRenders,10);
 assert.ok(widthProbes>0&&radiusProbes>0,
   'mismatched first-render ink retains the original width and radius choices');
});

test('Loop ink agreement comes from the shared original hue masks without additional paints',()=>{
 const w=RECONSTRUCTION_FRAME.width,h=RECONSTRUCTION_FRAME.height;
 const stripes=(start,end)=>raster(w,h,(x,y)=>{
   const index=Math.floor((y-10)/26);
   return index>=0&&index<7&&x>=start&&x<end?
     colour(HUES[index]):[0,0,0,255];
 });
 const source=stripes(12,82),matching=stripes(12,82),narrow=stripes(35,65);
 const recipe=normalizeRecipe({structure:'paths',geometry:'loop',
   background:'black',seed:'ink-agreement'});
 const item={kind:'loop',recipe,label:'circle',uncertainty:'inferred'};
 let renderCalls=0;
 const matched=rankReconstructionCandidates([item],source,()=>{
   renderCalls++;return matching;
 })[0];
 assert.equal(renderCalls,1,'the ink measurement is read-only over the first real render');
 assert.ok(matched.loopInkRatio>.99&&matched.loopInkRatio<1.01);
 const low=rankReconstructionCandidates([item],source,()=>narrow)[0];
 assert.ok(low.loopInkRatio>1.1,
   'a severe ink mismatch must keep original StripeWidth probes');
 const noHues=rankReconstructionCandidates([item],
   raster(w,h,()=>[0,0,0,255]),()=>matching)[0];
 assert.equal(noHues.loopInkRatio,undefined,
   'missing colours never invent a physically measured Loop ratio');
});

test('four intact hue silhouettes and three real ordered crop tails become editable canonical stamps',()=>{
 const source=(bad='')=>raster(220,350,(x,y)=>{
   for(let i=0;i<7;i++){
     const cut=i<4?0:[48,90,133][i-4];
     if(bad==='missing'&&i===6)continue;
     if(x<(bad==='unordered'&&i===5?10:cut))continue;
     const distortion=bad==='unrelated'&&i===2?15*Math.sin(x/6):0;
     const bend=Math.round(.22*x+4*Math.sin(x/(
       bad==='changed-tail-frequency'&&i>=4?9:17))+distortion);
     if(Math.abs(y-(14+i*44+bend))<=5)return colour(HUES[i]);
   }
   return [0,0,0,255];
 });
 const original=source(),untouched=new Uint8ClampedArray(original.data);
 const description=describeReconstructionImage(original);
 assert.equal(description.repeatShape?.clipped,true);
 assert.ok(description.repeatShape.minOverlap>.82);
 assert.equal(description.repeatShape.placements.length,7);
 const candidates=reconstructionCandidates(original,normalizeRecipe({seed:'blind-shape-source'}));
 assert.ok(candidates.length<=RECONSTRUCTION_RENDER_LIMIT);
 const stamps=candidates.find(option=>option.kind==='shape-repeats');
 assert.ok(stamps,'an observable repeated contour belongs among normal six candidates');
 assert.match(stamps.uncertainty,/missing contours/);
 assert.equal(stamps.recipe.scatteredCount,7);
 assert.equal(stamps.recipe.scatteredOverrides.length,7);
 assert.equal(stamps.recipe.scatteredShapeKind,'imported');
 assert.equal(resolveScene(stamps.recipe).objects.length,7);
 assert.deepEqual(decodeRecipe(encodeRecipe(stamps.recipe)),stamps.recipe);
 assert.deepEqual(original.data,untouched,'image inference must never mutate source pixels');
 const locked=reconstructionCandidates(original,normalizeRecipe({
   structure:'paths',regionMode:'nested',lockedSettings:['structure','regionMode']
 }));
 assert.ok(!locked.some(c=>c.kind==='shape-repeats'),
   'canonical object/structure locks prevent impossible Apply previews');
 for(const failure of ['unordered','missing','unrelated','changed-tail-frequency'])
   assert.notEqual(describeReconstructionImage(source(failure)).repeatShape?.clipped,
     true,'never extrapolate unrelated, unordered, or unobserved pigment contours');
});

test('cropped repeated stamps refuse unrelated pigment tails despite identical crop bounds and areas',()=>{
 const painted=unrelated=>raster(220,350,(x,y)=>{
   for(let index=0;index<7;index++){
     const cut=index<4?0:[48,90,133][index-4];
     if(x<cut)continue;
     // Every pigment occupies a single connected 11px-wide ribbon, with
     // exactly the same monotone crop bounds and area in both pictures.
     // Only the final three lose the shared wavy slope in the impostor.
     const bend=index>=4&&unrelated?44:
       Math.round(x*.22+4*Math.sin(x/17));
     if(Math.abs(y-(14+44*index+bend))<=5)return colour(HUES[index]);
   }
   return [0,0,0,255];
 });
 const supported=painted(false),unsupported=painted(true);
 const known=describeReconstructionImage(supported);
 assert.equal(known.repeatShape?.clipped,true);
 assert.ok(known.ribbonBands,'physically coherent source supports stamps');
 const deceptive=describeReconstructionImage(unsupported);
 assert.equal(deceptive.colourRegions.length,7);
 assert.equal(deceptive.ribbonBands,null,
   'tails share crop area/bounds but their perpendicular ink axes disagree');
 assert.equal(deceptive.repeatShape,null,
   'do not infer absent contour equivalence from the first four hues alone');
 assert.ok(!reconstructionCandidates(unsupported,normalizeRecipe({seed:'unrelated-tails'}))
   .some(candidate=>candidate.kind==='shape-repeats'),
   'no unverified seven-copy stamps should consume one of six painter slots');
 assert.ok(reconstructionCandidates(supported,normalizeRecipe({seed:'supported-tails'}))
   .some(candidate=>candidate.kind==='shape-repeats'),
   'genuine full plus cropped ribbons still reach the same canonical path');
});

test('genuine mirrored same-edge Jagged hue truncation is measured and stays canonically editable',()=>{
 const w=220,h=350;
 const original=raster(w,h,(x,y)=>{
   for(let i=0;i<7;i++){
     if(x<(i<4?0:[48,90,133][i-4]))continue;
     if(Math.abs(y-(14+i*44+Math.round(x*.22+4*Math.sin(x/17))))<=5)
       return colour(HUES[i]);
   }
   return [0,0,0,255];
 });
 const mirrored=raster(w,h,(x,y)=>{
   const at=4*(y*w+(w-x-1));
   return Array.from(original.data.subarray(at,at+4));
 });
 const signature=describeReconstructionImage(mirrored);
 assert.ok(signature.ribbonBands,
   'all seven genuine pigment axes and same-width cropped right edges must measure');
 assert.equal(signature.repeatShape?.clipped,true,
   'the shared shape must be corroborated by source contour rhythm');
 const fitted=reconstructionCandidates(mirrored,normalizeRecipe({seed:'mirror'}))
   .find(candidate=>candidate.kind==='shape-repeats');
 assert.ok(fitted,'mirrored source warrants seven separately editable hue stamps');
 assert.equal(fitted.recipe.scatteredCount,7);
 assert.equal(resolveScene(fitted.recipe).objects.length,7);
 assert.deepEqual(decodeRecipe(encodeRecipe(fitted.recipe)),fitted.recipe);
 const distorted=raster(w,h,(x,y)=>{
   for(let i=0;i<7;i++){
     if(x<(i<4?0:[48,90,133][i-4]))continue;
     const period=i<4?17:9;
     if(Math.abs(y-(14+i*44+Math.round(x*.22+4*Math.sin(x/period))))<=5)
       return colour(HUES[i]);
   }
   return [0,0,0,255];
 });
 const unrelated=raster(w,h,(x,y)=>{
   const at=4*(y*w+(w-x-1));
   return Array.from(distorted.data.subarray(at,at+4));
 });
 assert.notEqual(describeReconstructionImage(unrelated).repeatShape?.clipped,true,
   'mirroring cannot infer unobserved, wrong-frequency tail contours');
 assert.ok(!reconstructionCandidates(unrelated,normalizeRecipe({seed:'impostor'}))
   .some(candidate=>candidate.kind==='shape-repeats'));
});

test('mirrored partial ribbon measuring rejects incoherent width, axis and mixed-edge crops',()=>{
 const original=Array.from({length:7},(_,i)=>({
   index:i,area:i<4?11360:[8000,5600,3100][i-4],
   axisRatio:i<4?13.8:[9.8,6.9,3.8][i-4],
   axisAngle:46+(i-3)*.12,majorStd:i<4?115:[82,57,32][i-4],
   minorStd:8.35,cx:i<4?.5:[.64,.75,.86][i-4],cy:.31+i*.108,
   bounds:i<4?[0,.05+i*.11,1,.59+i*.11]:
     [[0,.46,.75,.85],[0,.57,.54,.86],[0,.68,.31,.86]][i-4]
 }));
 assert.ok(measuredRainbowRibbonBands(original,277,600),
   'coherent mirrored seven-colour source supports physical width/spacing');
 const widthMismatch=original.map((r,i)=>i===6?{...r,minorStd:17}:r);
 assert.equal(measuredRainbowRibbonBands(widthMismatch,277,600),null);
 const axisMismatch=original.map((r,i)=>i===5?{...r,axisAngle:10}:r);
 assert.equal(measuredRainbowRibbonBands(axisMismatch,277,600),null);
 const mixed=original.map((r,i)=>i===5?
   {...r,bounds:[.5,.57,1,.86]}:r);
 assert.equal(measuredRainbowRibbonBands(mixed,277,600),null,
   'same-image mixed-side clipping cannot borrow a mirrored source claim');
});

