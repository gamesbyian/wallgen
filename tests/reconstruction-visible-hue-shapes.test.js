import test from 'node:test';
import assert from 'node:assert/strict';
import {HUES,normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';
import {extractImageColourRegions,extractVisibleHueCompound} from '../src/image-path.js';
import {observedHueShapeRecipe,smoothSourceVisibleMicrostairs}
  from '../src/image-hue-reconstruction.js';
import {reconstructionCandidates,RECONSTRUCTION_RENDER_LIMIT,
  describeReconstructionImage} from '../src/image-reconstruction.js';

function hueRgb(hue){
  const chroma=255,sector=hue/60,partial=chroma*(1-Math.abs(sector%2-1));
  if(sector<1)return [255,partial,0];
  if(sector<2)return [partial,255,0];
  if(sector<3)return [0,255,partial];
  if(sector<4)return [0,partial,255];
  if(sector<5)return [partial,0,255];
  return [255,0,partial];
}
function sevenShapes({omit=-1}={}){
  const w=240,h=520,data=new Uint8ClampedArray(w*h*4);
  for(let p=0;p<w*h;p++)data[p*4+3]=255;
  for(let index=0;index<7;index++){
    if(index===omit)continue;
    const x0=22+index%3*76,y0=28+Math.floor(index/3)*162;
    const rgb=hueRgb(HUES[index]);
    for(let y=y0;y<y0+55;y++)for(let x=x0;x<x0+33;x++){
      if(index===0&&x>x0+9&&x<x0+22&&y>y0+16&&y<y0+37)
        continue; // red hole, not black-filled by another source pigment
      const p=(y*w+x)*4;
      data[p]=rgb[0];data[p+1]=rgb[1];data[p+2]=rgb[2];
    }
    if(index===0){
      for(let y=y0+17;y<y0+22;y++)for(let x=x0+39;x<x0+46;x++){
        const p=(y*w+x)*4;
        data[p]=255;
      }
    }
  }
  return {data,width:w,height:h};
}
const placement={x:0,y:0,width:600,height:1300};
test('visible source hue shapes reuse canonical mask/holes and produce seven independent portable objects',()=>{
  const original=sevenShapes(),bytes=new Uint8ClampedArray(original.data);
  const found=extractImageColourRegions(original,HUES,{includeMasks:true});
  assert.equal(found.regions.length,7);
  const red=extractVisibleHueCompound(found.masks[0],original.width,original.height);
  assert.ok(red);
  assert.equal(red.visibility,'source-visible-only');
  assert.equal(red.geometry.components.length,2);
  assert.equal(red.geometry.components[0].holes.length,1);
  const inferred=observedHueShapeRecipe(original,placement,
    {seed:'anonymous-external-pixels'});
  assert.ok(inferred);
  assert.equal(inferred.kind,'hue-visible-shapes');
  assert.equal(inferred.componentCounts[0],2);
  const recipe=inferred.recipe;
  assert.equal(recipe.scatteredShapeKind,'imported');
  assert.equal(recipe.scatteredShapeOverrides.length,7);
  const scene=resolveScene(recipe);
  assert.equal(scene.objects.length,7);
  assert.deepEqual(scene.objects.map(o=>o.colorIndex),[0,1,2,3,4,5,6]);
  assert.equal(scene.objects[0].rings.length,3);
  assert.ok(scene.objects.every(o=>!o.circle&&o.rings?.length));
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
  assert.deepEqual(original.data,bytes,'source bytes never changed');
});

test('bounded visible pigment AA inset is opt-in, source-safe and preserves holes and crop',()=>{
  const image=sevenShapes();
  const analysed=extractImageColourRegions(image,HUES,{includeMasks:true});
  const mask=analysed.masks[0],unchanged=mask.slice();
  const baseline=extractVisibleHueCompound(mask,image.width,image.height);
  const amount=.2*Math.max(image.width,image.height)/600;
  const adjusted=extractVisibleHueCompound(mask,image.width,image.height,
    {insetPixels:amount});
  assert.ok(adjusted);
  assert.equal(adjusted.insetApplied,true);
  assert.equal(adjusted.components,baseline.components);
  assert.equal(adjusted.geometry.components.length,2);
  assert.equal(adjusted.geometry.components[0].holes.length,1);
  assert.deepEqual(adjusted.centrePixels,baseline.centrePixels);
  assert.notDeepEqual(adjusted.geometry,baseline.geometry,
    'only opt-in sampled contour vertices change');
  assert.deepEqual(mask,unchanged,'never mutate source hue segmentation');
  assert.deepEqual(extractVisibleHueCompound(mask,image.width,image.height),
    baseline,'ordinary manual mask import stays pixel unchanged');
  assert.throws(()=>extractVisibleHueCompound(mask,image.width,image.height,
    {insetPixels:1}),RangeError);
  const standalone=observedHueShapeRecipe(image,placement,{seed:'source'});
  assert.deepEqual(standalone.recipe.scatteredShapeOverrides[0].shape.geometry,
    baseline.geometry,'standalone callers have no measured radial source kind');
  const production=observedHueShapeRecipe(image,placement,{seed:'source'},
    {sourceRadialKind:null});
  const smoothed=smoothSourceVisibleMicrostairs(adjusted,
    image.width,image.height);
  assert.deepEqual(production.recipe.scatteredShapeOverrides[0].shape.geometry,
    smoothed.geometry,
    'canonical 7-hue candidate uses measured AA plus safe microstep smoothing');
  const w=100,h=120,edge=new Uint8Array(w*h);
  for(let y=20;y<100;y++)for(let x=0;x<21;x++)edge[y*w+x]=1;
  const cropped=extractVisibleHueCompound(edge,w,h,{insetPixels:.2});
  assert.ok(cropped);
  assert.equal(cropped.touchesFrame,true);
  assert.equal(cropped.geometry.components[0].outer
    .some(p=>p[0]===0),true,'observed clipped frame boundary remains pinned');
  assert.deepEqual(extractVisibleHueCompound(edge,w,h).centrePixels,
    cropped.centrePixels);
});

test('optical inset refuses source-measured radial rings and variegated interior pigment',()=>{
  const source=sevenShapes();
  const plain=observedHueShapeRecipe(source,placement,{seed:'no-inset'});
  const rings=observedHueShapeRecipe(source,placement,{seed:'no-inset'},
    {sourceRadialKind:'rings'});
  const flat=observedHueShapeRecipe(source,placement,{seed:'no-inset'},
    {sourceRadialKind:null});
  assert.deepEqual(rings.recipe.scatteredShapeOverrides,
    plain.recipe.scatteredShapeOverrides,
    'measured rings preserve historical editable contour geometry');
  assert.notDeepEqual(flat.recipe.scatteredShapeOverrides,
    plain.recipe.scatteredShapeOverrides,
    'solid nonradial seven-hue artwork permits bounded contour calibration');
  const measuredDark=observedHueShapeRecipe(source,placement,{seed:'no-inset'},
    {sourceRadialKind:null,sourceTone:{saturation:90,lightness:25}});
  assert.ok(measuredDark);
  assert.deepEqual(measuredDark.recipe.scatteredShapeOverrides,
    plain.recipe.scatteredShapeOverrides,
    'the existing independently measured dark source tone inhibits flat-bright AA');
  // A real source can show fine textile variations throughout a *large*
  // interior, not simply a handful of antialiased edge pixels. Draw seven
  // broad independent pigment bands with ample measured same-hue interior.
  const width=240,height=520,data=new Uint8ClampedArray(width*height*4);
  for(let i=0;i<width*height;i++)data[i*4+3]=255;
  for(let hue=0;hue<7;hue++){
    const colour=hueRgb(HUES[hue]),top=12+hue*70;
    for(let y=top;y<top+48;y++)for(let x=18;x<222;x++){
      const i=4*(y*width+x);data.set(colour,i);
    }
  }
  const broad={width,height,data};
  const widePlain=observedHueShapeRecipe(broad,placement,{seed:'no-inset'});
  const wideInset=observedHueShapeRecipe(broad,placement,{seed:'no-inset'},
    {sourceRadialKind:null});
  assert.ok(widePlain&&wideInset);
  assert.notDeepEqual(wideInset.recipe.scatteredShapeOverrides,
    widePlain.recipe.scatteredShapeOverrides,
    'ordinary broad flat pigments retain a source-backed AA correction');
  const noisy={...broad,data:broad.data.slice()};
  for(let i=0;i<noisy.data.length;i+=4){
    if(!noisy.data[i]&&!noisy.data[i+1]&&!noisy.data[i+2])continue;
    const x=(i/4)%width,amount=x%2?7:-7;
    for(let c=0;c<3;c++)noisy.data[i+c]=Math.max(0,
      Math.min(255,noisy.data[i+c]+amount));
  }
  const found=extractImageColourRegions(noisy,HUES,{includeMasks:true});
  assert.equal(found.regions.length,7);
  const before=noisy.data.slice();
  const textured=observedHueShapeRecipe(noisy,placement,{seed:'no-inset'},
    {sourceRadialKind:null});
  assert.ok(textured);
  assert.deepEqual(textured.recipe.scatteredShapeOverrides,
    widePlain.recipe.scatteredShapeOverrides,
    'substantial measured same-hue interior variation refuses false flat-ink correction');
  assert.deepEqual(noisy.data,before,'texture gate only reads source bytes');
});

test('bounded microstep smoothing changes traced staircase but protects crop, holes and source bytes',()=>{
  const width=160,height=240,mask=new Uint8Array(width*height);
  for(let y=10;y<224;y++){
    const start=Math.floor(15+y*.32);
    for(let x=start;x<start+12;x++)mask[y*width+x]=1;
  }
  const unchanged=mask.slice();
  const found=extractVisibleHueCompound(mask,width,height,{insetPixels:.2});
  assert.ok(found&&found.geometry.components.length===1);
  const smoothed=smoothSourceVisibleMicrostairs(found,width,height);
  assert.notDeepEqual(smoothed.geometry,found.geometry,
    'source-observed integer staircase is represented by actual local geometry');
  assert.deepEqual(smoothed.centrePixels,found.centrePixels);
  assert.deepEqual(smoothed.geometry.viewBox,found.geometry.viewBox);
  assert.equal(smoothed.geometry.components.length,1);
  assert.equal(smoothed.geometry.components[0].holes.length,0);
  assert.ok(smoothed.radiusPixels>0);
  assert.deepEqual(mask,unchanged,'no segmentation or input source mutation');
  assert.deepEqual(smoothSourceVisibleMicrostairs(found,width,height),smoothed,
    'shape vertex smoothing must be deterministic and re-importable');
  assert.equal(smoothSourceVisibleMicrostairs(found,width,height,
    {strength:0}),found);
  assert.throws(()=>smoothSourceVisibleMicrostairs(found,width,height,
    {strength:2}),RangeError);
  const crop=new Uint8Array(width*height);
  for(let y=20;y<210;y++)for(let x=0;x<Math.floor(13+y*.2);x++)
    crop[y*width+x]=1;
  const original=extractVisibleHueCompound(crop,width,height,{insetPixels:.2});
  const scaled=smoothSourceVisibleMicrostairs(original,width,height);
  assert.ok(scaled);
  assert.equal(scaled.touchesFrame,true);
  assert.ok(scaled.geometry.components[0].outer.some(p=>p[0]===0),
    'observed frame crop remains on actual source boundary');
  const source=sevenShapes();
  const masks=extractImageColourRegions(source,HUES,{includeMasks:true}).masks;
  const box=extractVisibleHueCompound(masks[0],source.width,source.height);
  const boxSmoothed=smoothSourceVisibleMicrostairs(box,source.width,source.height);
  assert.deepEqual(boxSmoothed.geometry.components.map(c=>c.holes.length),
    box.geometry.components.map(c=>c.holes.length),
    'true source hole and detached source island remain distinct');
});

test('neutral and two-hue source artwork never synthesizes a complete seven-pigment scene',()=>{
  const source=sevenShapes(),original=source.data.slice();
  const neutral={...source,data:source.data.slice()};
  for(let i=0;i<neutral.data.length;i+=4){
    if(neutral.data[i]||neutral.data[i+1]||neutral.data[i+2]){
      neutral.data[i]=155;neutral.data[i+1]=155;neutral.data[i+2]=155;
    }
  }
  const muted=extractImageColourRegions(neutral,HUES,{includeMasks:true});
  assert.equal(muted.regions.length,0,'neutral greys cannot prove coloured pigments');
  assert.equal(observedHueShapeRecipe(neutral,placement,{}),null);
  // Author two isolated coloured rectangles directly, not by masking a
  // compound source whose anti-aliased/fleck membership is an unrelated test.
  const w=240,h=520,two={width:w,height:h,
    data:new Uint8ClampedArray(w*h*4)};
  for(let p=0;p<w*h;p++)two.data[p*4+3]=255;
  for(const [x0,y0,rgb] of [
    [35,45,hueRgb(HUES[0])],[145,270,hueRgb(HUES[4])]]){
    for(let y=y0;y<y0+85;y++)for(let x=x0;x<x0+55;x++){
      const at=4*(y*w+x);
      two.data[at]=rgb[0];
      two.data[at+1]=rgb[1];
      two.data[at+2]=rgb[2];
    }
  }
  const analysis=extractImageColourRegions(two,HUES,{includeMasks:true});
  assert.deepEqual(analysis.regions.map(region=>region.index),[0,4]);
  assert.equal(observedHueShapeRecipe(two,placement,{}),null,
    'five unobserved hues cannot be hallucinated from two real ones');
  assert.deepEqual(source.data,original,'source artwork is immutable');
});

test('incomplete hue, contradictory locks and invalid geometry refuse instead of inventing pigment',()=>{
  const incomplete=sevenShapes({omit:3});
  assert.equal(observedHueShapeRecipe(incomplete,placement,{}),null);
  const complete=sevenShapes();
  assert.equal(observedHueShapeRecipe(complete,placement,
    normalizeRecipe({lockedSettings:['structure'],structure:'paths'})),null);
  assert.equal(observedHueShapeRecipe(complete,
    {x:0,y:0,width:0,height:1300},{}),null);
  const mask=new Uint8Array(complete.width*complete.height);
  assert.equal(extractVisibleHueCompound(mask,complete.width,complete.height),null);
  assert.throws(()=>extractVisibleHueCompound(new Uint8Array(12),12,24),RangeError);
});

test('visible geometry is deterministic under repeated analysis and neutral baseline',()=>{
  const image=sevenShapes();
  const before=observedHueShapeRecipe(image,placement,{seed:'same'});
  const after=observedHueShapeRecipe(image,placement,{seed:'same'});
  assert.deepEqual(before,after);
  assert.ok(before.croppedHueSlots.every(i=>i>=0&&i<=6));
  assert.equal(before.uncertainty.includes('source pixels'),true);
});

test('current inverse candidate synthesis never spends more than six paints with per-hue option',()=>{
  const source=sevenShapes();
  const normal=reconstructionCandidates(source,normalizeRecipe({seed:'synthesis'}));
  assert.ok(normal.length<=RECONSTRUCTION_RENDER_LIMIT);
  assert.ok(normal.every(item=>item.recipe&&typeof item.kind==='string'));
  assert.ok(new Set(normal).size===normal.length);
  if(normal.some(item=>item.kind==='hue-visible-shapes')){
    assert.equal(normal[0].kind,'hue-visible-shapes');
    assert.equal(normal[0].recipe.scatteredShapeOverrides.length,7);
    assert.ok(normal.some(item=>item.kind!=='hue-visible-shapes'),
      'source-shape appearance must not crowd out procedural alternatives');
  }
});

test('source-visible shape candidate neutralizes inherited Photo, texture and camera state',()=>{
  const source=sevenShapes();
  const polluted=normalizeRecipe({seed:'wrong-existing-picture',
    material:'stone',textureStrength:95,material2:'foil',
    textureLayer2Enabled:true,material3:'adobe',textureLayer3Enabled:true,
    textureDisplacement:82,photoLook:{enabled:true,amount:80,style:'vintage'},
    positionX:40,positionY:-45,viewZoom:.6,viewPanX:18,viewPanY:30,
    motif:'stars'});
  const result=observedHueShapeRecipe(source,placement,polluted);
  assert.ok(result);
  const r=result.recipe;
  assert.equal(r.material,'none');
  assert.equal(r.textureLayer2Enabled,false);
  assert.equal(r.textureLayer3Enabled,false);
  assert.equal(r.positionX,0);assert.equal(r.positionY,0);
  assert.equal(r.viewZoom,1);assert.equal(r.viewPanX,0);
  assert.equal(r.motif,'solid');
  assert.equal(r.photoLook?.enabled,false);
});

test('four-neighbour extraction preserves diagonal separation and border-connected ink',()=>{
  const width=120,height=120,mask=new Uint8Array(width*height);
  const fill=(x0,y0,x1,y1)=>{
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)
      mask[y*width+x]=1;
  };
  fill(10,10,21,21);
  fill(21,21,32,32); // Diagonal corner contact is not a fourth neighbour.
  fill(0,55,7,77); // Border-connected but separate source-visible island.
  const original=mask.slice();
  const found=extractVisibleHueCompound(mask,width,height);
  assert.ok(found,'all three independent pieces must remain representable');
  assert.equal(found.components,3);
  assert.equal(found.geometry.components.length,3);
  assert.equal(found.touchesFrame,true);
  assert.ok(found.geometry.components.every(component=>component.holes.length===0));
  assert.deepEqual(mask,original,'flood-fill must never mutate source hue pixels');
  assert.deepEqual(extractVisibleHueCompound(mask,width,height),found);
});

test('source-visible pigment retains 9–16 genuine islands, refuses 17+ instead of silently dropping them',()=>{
  const width=200,height=200;
  const masked=count=>{
    const pixels=new Uint8Array(width*height);
    for(let index=0;index<count;index++){
      const x0=8+index%5*35,y0=8+Math.floor(index/5)*35;
      for(let y=y0;y<y0+6;y++)for(let x=x0;x<x0+6;x++)
        pixels[y*width+x]=1;
    }
    return pixels;
  };
  const sixteen=extractVisibleHueCompound(masked(16),width,height);
  assert.ok(sixteen);
  assert.equal(sixteen.components,16);
  assert.equal(sixteen.geometry.components.length,16);
  assert.equal(sixteen.visibleInkPixels,16*36);
  assert.equal(sixteen.visibility,'source-visible-only');
  assert.equal(extractVisibleHueCompound(masked(17),width,height),null,
    'overflow refuses rather than issuing a source-completeness claim');
});

test('fragment-heavy hue masks retain the exact eight largest components in source order on ties',()=>{
  const width=360,height=360,islands=225;
  const data=new Uint8ClampedArray(width*height*4);
  for(let p=0;p<width*height;p++)data[p*4+3]=255;
  const stamp=index=>{
    const size=11+index%4;
    const x=4+index%15*24,y=4+Math.floor(index/15)*24;
    for(let yy=y;yy<y+size;yy++)for(let xx=x;xx<x+size;xx++){
      const p=(yy*width+xx)*4;data[p]=255;
    }
    return {index,size,x,y};
  };
  const placements=Array.from({length:islands},(_,i)=>stamp(i));
  const source={data,width,height};
  const bytes=data.slice();
  const found=extractImageColourRegions(source,HUES);
  const expected=placements.slice().sort((a,b)=>b.size-a.size||
    a.index-b.index).slice(0,8);
  assert.equal(found.coverage>0,true);
  assert.equal(found.componentRegions.length,8,
    'shared primary importer retains only its historical eight');
  assert.deepEqual(found.componentRegions.map(region=>region.bounds.slice(0,2)),
    expected.map(({x,y})=>[x/width,y/height]),
    'large late components beat early small ones, stable ties keep earlier islands');
  assert.deepEqual(extractImageColourRegions(source,HUES).componentRegions,
    found.componentRegions,'fragment selection remains deterministic');
  assert.deepEqual(data,bytes,'input pixels remain immutable');
  const pigment=extractImageColourRegions(source,HUES,{includeMasks:true});
  assert.equal(extractVisibleHueCompound(pigment.masks[0],width,height),null,
    'the separate 17th-significant-island sentinel still refuses incomplete geometry');
});

test('appearance-first source contours share a separately measured canonical story, not historical provenance',()=>{
  const image=sevenShapes();
  const selected=observedHueShapeRecipe(image,placement,
    normalizeRecipe({seed:'external-pixels'}),{paletteHint:'jewel'});
  assert.ok(selected);
  assert.equal(selected.recipe.palette,'jewel');
  assert.equal(selected.sourceVisibleOnly,true);
  assert.match(selected.uncertainty,/palette identity/);
  const fallback=observedHueShapeRecipe(image,placement,
    normalizeRecipe({seed:'external-pixels'}));
  assert.equal(fallback.recipe.palette,'classic');
  assert.deepEqual(selected.recipe.scatteredShapeOverrides,
    fallback.recipe.scatteredShapeOverrides,'colour hypothesis never changes contours');
  const locked=observedHueShapeRecipe(image,placement,
    normalizeRecipe({palette:'pastel',lockedSettings:['palette']}),
    {paletteHint:'jewel'});
  assert.equal(locked?.recipe.palette,'pastel',
    'source colour guess never circumvents a creator palette lock');
});

test('one shared seven-mask classifier exactly matches the standalone editable shape proposal',()=>{
  const input=sevenShapes();
  const original=Array.from(input.data);
  const plain=describeReconstructionImage(input);
  assert.equal(Object.hasOwn(plain,'sourceHueMasks'),false,
    'normal descriptor does not expose mutable pigment arrays');
  const analysed=describeReconstructionImage(input,{includeColourMasks:true});
  assert.equal(analysed.sourceHueMasks.length,7);
  assert.ok(analysed.sourceHueMasks.every(mask=>
    mask instanceof Uint8Array&&mask.length===input.width*input.height));
  const options={paletteHint:'jewel',sourceRadialKind:analysed.radial.kind};
  const separate=observedHueShapeRecipe(input,placement,
    {seed:'anonymous'},options);
  const shared=observedHueShapeRecipe(input,placement,
    {seed:'anonymous'},{
      ...options,colourAnalysis:{
        masks:analysed.sourceHueMasks,
        regions:analysed.colourRegions,
        coverage:analysed.coverage,
        background:analysed.background
      }
    });
  assert.ok(separate&&shared);
  assert.deepEqual(shared,separate,
    'one segmentation pass gives exactly the same geometry, palette and locks');
  assert.deepEqual(Array.from(input.data),original,
    'source pixels are not modified');
  const sourceCandidate=reconstructionCandidates(input,{seed:'anonymous'});
  if(sourceCandidate[0]?.kind==='hue-visible-shapes')
    assert.deepEqual(sourceCandidate[0].recipe,
      observedHueShapeRecipe(input,placement,{seed:'anonymous'},
        {sourceRadialKind:analysed.radial.kind}).recipe);
});

test('shared pigment descriptor refuses spoofed sparse hues and incorrect masks',()=>{
  const input=sevenShapes();
  const d=describeReconstructionImage(input,{includeColourMasks:true});
  const good={
    masks:d.sourceHueMasks,regions:d.colourRegions,
    background:d.background,coverage:d.coverage
  };
  const propose=colourAnalysis=>observedHueShapeRecipe(input,placement,
    {seed:'unrelated'},{colourAnalysis});
  assert.ok(propose(good));
  const sparse={...good,regions:good.regions.map((r,i)=>
    i===4?{...r,area:1}:r)};
  assert.equal(propose(sparse),null);
  assert.equal(propose({...good,masks:good.masks.slice(1)}),null);
  assert.equal(propose({...good,masks:good.masks.map((m,i)=>
    i===0?new Uint8Array(8):m)}),null);
  assert.equal(propose({...good,background:'unknown'}),null);
});

function twoDistinctFirstHueSilhouettes(){
  // Exactly the canonical 600:1300 aspect, so standalone and normal source
  // placement compare equivalent source pixels without letterboxing offsets.
  const width=180,height=390,data=new Uint8ClampedArray(width*height*4);
  for(let i=0;i<width*height;i++)data[i*4+3]=255;
  for(let y=40;y<125;y++)for(let x=25;x<90;x++){
    // A red connected L-shaped silhouette whose missing corner must remain
    // visibly absent after reconstruction, not be filled by a fitted disk.
    if(x>65&&y>76)continue;
    const i=(y*width+x)*4;data.set(hueRgb(HUES[0]),i);
  }
  for(let y=184;y<274;y++)for(let x=96;x<165;x++){
    // An orange asymmetric clipped-corner polygon, not a round disk.
    if((x<114&&y<204)||(x>150&&y>255))continue;
    const i=(y*width+x)*4;data.set(hueRgb(HUES[1]),i);
  }
  return {width,height,data};
}
test('measured first-two noncircular pigment silhouettes are portable, separately editable canonical shapes',()=>{
  const source=twoDistinctFirstHueSilhouettes(),bytes=source.data.slice();
  const desc=describeReconstructionImage(source);
  assert.deepEqual(desc.colourRegions.map(c=>c.index),[0,1]);
  assert.equal(desc.incompleteColourRegions,true,
    'two first-slot compact source shapes qualify without seven invented pigments');
  const masked=extractImageColourRegions(source,HUES,{includeMasks:true});
  assert.equal(observedHueShapeRecipe(source,placement,{}),null,
    'direct helper retains the original seven-hue contract unless explicitly qualified');
  const direct=observedHueShapeRecipe(source,placement,{seed:'sparse-shapes'},
    {allowPartial:true});
  assert.ok(direct);
  assert.equal(direct.kind,'hue-visible-shapes');
  assert.equal(direct.recipe.scatteredCount,2);
  assert.equal(direct.recipe.scatteredShapeOverrides.length,2);
  assert.equal(direct.recipe.scatteredOverrides.length,2);
  assert.deepEqual(direct.componentCounts,[1,1]);
  const scene=resolveScene(direct.recipe);
  assert.equal(scene.objects.length,2);
  assert.deepEqual(scene.objects.map(o=>o.colorIndex),[0,1]);
  assert.ok(scene.objects.every(o=>o.rings?.length&&!o.circle));
  assert.equal(scene.objects.some(o=>o.vertices.length===144),false,
    'angular source contour must not silently become the sampled circle polygon');
  assert.match(direct.uncertainty,/Only the first 2 contiguous/);
  assert.deepEqual(decodeRecipe(encodeRecipe(direct.recipe)),direct.recipe);
  const candidates=reconstructionCandidates(source,normalizeRecipe({seed:'sparse-shapes'}));
  assert.ok(candidates.length<=RECONSTRUCTION_RENDER_LIMIT);
  assert.equal(candidates[0].kind,'hue-visible-shapes');
  assert.ok(candidates.some(c=>c.kind==='regions'),
    'preserve the ordinary circle approximation for independent true-painter ranking');
  assert.deepEqual(candidates[0].recipe,direct.recipe);
  const shared=observedHueShapeRecipe(source,placement,{seed:'sparse-shapes'},{
    allowPartial:true,colourAnalysis:{
      masks:masked.masks,regions:masked.regions,coverage:masked.coverage,
      background:masked.background
    }
  });
  assert.deepEqual(shared,direct,'shared masks are source-equivalent to standalone');
  assert.deepEqual(source.data,bytes,'uploaded source RGBA is immutable');
});

test('partly observed hues refuse missing semantic slots and protected scattered-count edits',()=>{
  const source=twoDistinctFirstHueSilhouettes();
  const changed={...source,data:source.data.slice()};
  // Change only orange pixels into blue, producing [0,4] with absent
  // intermediate pigments, never a two-red/two-orange invented candidate.
  for(let i=0;i<changed.data.length;i+=4)
    if(changed.data[i]===255&&changed.data[i+1]>0){
      const b=hueRgb(HUES[4]);changed.data.set(b,i);
    }
  assert.deepEqual(extractImageColourRegions(changed,HUES).regions.map(r=>r.index),[0,4]);
  assert.equal(observedHueShapeRecipe(changed,placement,{},{allowPartial:true}),null);
  assert.equal(reconstructionCandidates(changed,{}).length,0);
  const protectedCount=normalizeRecipe({seed:'sparse-shapes',
    scatteredCount:7,lockedSettings:['scatteredCount']});
  assert.equal(observedHueShapeRecipe(source,placement,protectedCount,
    {allowPartial:true}),null,
    'a locked seven-object scene cannot pretend to apply a two-object preview');
  assert.ok(!reconstructionCandidates(source,protectedCount)
    .some(c=>c.kind==='hue-visible-shapes'));
  const protectedGeometry=normalizeRecipe({seed:'sparse-shapes',
    scatteredShapeKind:'circle',lockedSettings:['scatteredShapeOverrides'],
    scatteredShapeOverrides:[]});
  assert.equal(observedHueShapeRecipe(source,placement,protectedGeometry,
    {allowPartial:true}),null,
    'a protected empty shape list cannot be replaced by source-derived geometry');
});

test('every compact contiguous three-through-six hue subset remains editable without filling missing slots',()=>{
  const width=240,height=520,seed='contiguous-first-n';
  for(let count=3;count<=6;count++){
    const data=new Uint8ClampedArray(width*height*4);
    for(let i=0;i<width*height;i++)data[4*i+3]=255;
    for(let hue=0;hue<count;hue++){
      const left=20+(hue%3)*72,top=65+Math.floor(hue/3)*230;
      for(let y=top;y<top+64;y++)for(let x=left;x<left+40;x++){
        // Deliberately angular, compact and connected noncircular polygons.
        if(x<left+10&&y<top+12)continue;
        data.set(hueRgb(HUES[hue]),4*(y*width+x));
      }
    }
    const source={width,height,data},unchanged=data.slice();
    const desc=describeReconstructionImage(source);
    assert.equal(desc.incompleteColourRegions,true,
      'contiguous first-'+count+' source colour signatures are measured');
    assert.deepEqual(desc.colourRegions.map(x=>x.index),
      Array.from({length:count},(_,i)=>i));
    const candidates=reconstructionCandidates(source,{seed});
    assert.ok(candidates.length<=RECONSTRUCTION_RENDER_LIMIT);
    const observed=candidates.find(c=>c.kind==='hue-visible-shapes');
    assert.ok(observed,'all genuinely visible first-'+count+' silhouettes can be selected');
    assert.equal(observed.recipe.scatteredCount,count);
    assert.equal(observed.recipe.scatteredShapeOverrides.length,count);
    assert.deepEqual(observed.recipe.scatteredShapeOverrides.map(x=>x.index),
      Array.from({length:count},(_,i)=>i));
    assert.deepEqual(resolveScene(observed.recipe).objects.map(x=>x.colorIndex),
      Array.from({length:count},(_,i)=>i));
    assert.deepEqual(decodeRecipe(encodeRecipe(observed.recipe)),observed.recipe);
    assert.deepEqual(source.data,unchanged,'do not mutate the original RGB');
  }
});


test('seven observed pigment shapes ignore unrelated source-editor palette reversal and layering',()=>{
  const source=sevenShapes(),bytes=source.data.slice();
  const clean=observedHueShapeRecipe(source,placement,{seed:'independent-source'});
  assert.ok(clean);
  const previous=normalizeRecipe({
    seed:'independent-source',reverseStripes:true,
    scatteredLayerOrder:[6,5,4,3,2,1,0],
    scatteredShapeOverrides:[{index:0,shape:clean.recipe.scatteredShapeOverrides[1].shape}]
  });
  const inferred=observedHueShapeRecipe(source,placement,previous);
  assert.ok(inferred,'unlocked unrelated source-editor state is not image evidence');
  assert.deepEqual(inferred.recipe,clean.recipe,
    'source-observed shapes, pigment order and geometry must be independent of stale edits');
  assert.equal(resolveScene(inferred.recipe).stripes[0].name,'Red');
  assert.deepEqual(resolveScene(inferred.recipe).objects.map(o=>o.colorIndex),
    [0,1,2,3,4,5,6]);
  assert.deepEqual(decodeRecipe(encodeRecipe(inferred.recipe)),inferred.recipe);
  const normal=reconstructionCandidates(source,previous);
  assert.ok(normal.length<=RECONSTRUCTION_RENDER_LIMIT);
  assert.equal(normal.find(c=>c.kind==='hue-visible-shapes')?.recipe.reverseStripes,false);
  const protectedSource=normalizeRecipe({
    seed:'independent-source',reverseStripes:true,
    lockedSettings:['reverseStripes']
  });
  assert.equal(observedHueShapeRecipe(source,placement,protectedSource),null,
    'a protected rainbow reversal must not generate a false per-hue source preview');
  assert.ok(!reconstructionCandidates(source,protectedSource)
    .some(c=>c.kind==='hue-visible-shapes'));
  assert.deepEqual(source.data,bytes,'the original imported pixels are never changed');
});
