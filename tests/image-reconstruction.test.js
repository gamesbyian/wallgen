import test from 'node:test';
import assert from 'node:assert/strict';
import {HUES,normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';
import {imagePlacement,extractImageColourRegions} from '../src/image-path.js';
import {describeReconstructionImage,reconstructionCandidates,
  rankReconstructionCandidates,compareReconstructionPixels,refineReconstructionCandidate,reconstructionPlacement,
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

test('coherent slanted seven-colour bands are editable procedural diagonals, not circles',()=>{
  const w=160,h=320;
  const bands=raster(w,h,(x,y)=>{
    // Distinct long parallelograms with a common slope, deliberately spanning
    // square-ish bounding boxes that a naive aspect test calls circles.
    const track=x+y*.48;
    const index=Math.floor((track-5)/27);
    return index>=0&&index<7&&track-5-index*27<15?
      colour(HUES[index]):[0,0,0,255];
  });
  const desc=describeReconstructionImage(bands);
  assert.ok(Number.isFinite(desc.diagonalAngle),
    'coherent per-hue covariance should establish diagonal topology');
  assert.ok(desc.diagonalAngle>12&&desc.diagonalAngle<78);
  assert.equal(desc.sevenColourRegions,false);
  const options=reconstructionCandidates(bands,{seed:'diagonal-current'});
  assert.ok(options.some(candidate=>candidate.kind==='straight'&&
    candidate.recipe.orientation==='diagonal'&&
    candidate.recipe.geometry==='straight'),
    'ordinary canonical diagonal procedural scene');
  assert.ok(!options.some(candidate=>candidate.kind==='regions'),
    'slanted bands must not masquerade as detached circles');
  const scattered=describeReconstructionImage(original);
  assert.equal(scattered.diagonalAngle,null,
    'seven genuinely compact coloured circles must remain independent objects');
  assert.ok(reconstructionCandidates(original,{}).some(x=>x.kind==='regions'));
});

test('a multicolour fan reuses canonical radial painter instead of a tiny traced line',()=>{
  const w=160,h=320;
  const image=raster(w,h,(x,y)=>{
    const dx=x-(w-1)/2,dy=y-(h-1)/2;
    if(Math.hypot(dx,dy)<3)return [0,0,0,255];
    const angle=(Math.atan2(dy,dx)+Math.PI)/(2*Math.PI);
    const wedge=Math.floor(angle*21)%21;
    return colour(HUES[wedge%7]);
  });
  const desc=describeReconstructionImage(image);
  assert.ok(desc.radialHueEvidence.angularTransitions>=12);
  assert.equal(desc.radialRays,true);
  assert.equal(desc.sevenColourRegions,false);
  const candidates=reconstructionCandidates(image,{seed:'ray-fan'});
  assert.ok(candidates.some(x=>x.kind==='radial-rays'&&
    x.recipe.structure==='radial'&&x.recipe.radialMode==='sunburst'));
  assert.ok(candidates.every(x=>x.kind!=='regions'),'not seven unrelated discs');
  const circles=describeReconstructionImage(original);
  assert.equal(circles.radialRays,false,'keep scattered circles');
  assert.ok(reconstructionCandidates(original,{}).some(x=>x.kind==='regions'));
});
