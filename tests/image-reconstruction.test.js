import test from 'node:test';
import assert from 'node:assert/strict';
import {HUES,normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';
import {imagePlacement,extractImageColourRegions} from '../src/image-path.js';
import {describeReconstructionImage,reconstructionCandidates,
  rankReconstructionCandidates,compareReconstructionPixels,refineReconstructionCandidate,reconstructionPlacement,
  radialImageSignature,imageStripeAngle,
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

test('oblique source line detector gives editable diagonal candidate when hue centroids are unreliable',()=>{
  const slant=raster(180,300,(x,y)=>{
    const band=Math.floor((x-y*.42+170)/25);
    return band>=0&&band<7?colour(HUES[band]):[0,0,0,255];
  });
  const d=describeReconstructionImage(slant);
  assert.ok(d.paths.some(p=>p.kind==='line')||d.stripeAngle!==null);
  const candidates=reconstructionCandidates(slant,{seed:'oblique-cropped'});
  assert.ok(candidates.some(c=>c.kind==='straight'&&c.recipe.orientation==='diagonal'),
    'reuse detected oblique edge rather than restricting to free circles');
});
