import test from 'node:test';
import assert from 'node:assert/strict';
import {HUES,normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';
import {imagePlacement,extractImageColourRegions} from '../src/image-path.js';
import {describeReconstructionImage,reconstructionCandidates,
  rankReconstructionCandidates,compareReconstructionPixels,refineReconstructionCandidate,reconstructionPlacement,
  radialImageSignature,imageStripeAngle,imageCurveSignature,diverseReconstructionCandidates,reconstructionRefinementIndex,
  measuredRainbowRibbonBands,seedMeasuredRibbonControls,coherentWaveOffsetY,
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
