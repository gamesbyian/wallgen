import test from 'node:test';
import assert from 'node:assert/strict';
import {HUES,normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';
import {extractImageColourRegions,extractVisibleHueCompound} from '../src/image-path.js';
import {observedHueShapeRecipe} from '../src/image-hue-reconstruction.js';
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
  const options={paletteHint:'jewel'};
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
      observedHueShapeRecipe(input,placement,{seed:'anonymous'}).recipe);
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
