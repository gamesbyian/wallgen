import test from 'node:test';
import assert from 'node:assert/strict';
import {HUES,normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
import {describeReconstructionImage,plainlyUnsupportedDarkPigments,
  measuredSourceDarkTone,reconstructionCandidates,RECONSTRUCTION_RENDER_LIMIT}
  from '../src/image-reconstruction.js';

function hsl(h,s,l){
  const sat=s/100,light=l/100;
  const chroma=(1-Math.abs(2*light-1))*sat;
  const z=chroma*(1-Math.abs(((h/60)%2)-1));
  const m=light-chroma/2;
  const map=[[chroma,z,0],[z,chroma,0],[0,chroma,z],
    [0,z,chroma],[z,0,chroma],[chroma,0,z]];
  return [...map[Math.floor(h/60)].map(n=>Math.round((n+m)*255)),255];
}
const points=[[25,28],[91,28],[25,90],[91,90],[25,153],[91,153],[57,217]];
function pigmentSource(sat=88,light=13){
  const width=120,height=260,data=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    let rgba=[0,0,0,255];
    for(const [i,[cx,cy]] of points.entries())
      if(Math.abs(x-cx)+Math.abs(y-cy)<19){rgba=hsl(HUES[i],sat,light);break;}
    data.set(rgba,4*(y*width+x));
  }
  return {width,height,data};
}
test('seven independent dark-colour silhouettes yield a measured canonical Tone hypothesis',()=>{
  const source=pigmentSource(),original=source.data.slice();
  const signature=describeReconstructionImage(source);
  assert.equal(plainlyUnsupportedDarkPigments(signature),true,
    'the established dark source witness must first qualify');
  const tone=measuredSourceDarkTone(signature);
  assert.ok(tone);
  assert.ok(Math.abs(tone.saturation-88)<=2);
  assert.ok(Math.abs(tone.lightness-13)<=2);
  const candidates=reconstructionCandidates(source,normalizeRecipe({
    seed:'source-does-not-contain-original-recipe'
  }));
  assert.ok(candidates.length>=1&&candidates.length<=RECONSTRUCTION_RENDER_LIMIT);
  const shape=candidates.find(x=>x.kind==='hue-visible-shapes');
  assert.ok(shape,'source-visible individually editable polygons must compete');
  assert.equal(shape.recipe.paletteToneEnabled,true);
  assert.deepEqual([shape.recipe.paletteSaturation,shape.recipe.paletteLightness],
    [tone.saturation,tone.lightness]);
  assert.equal(shape.recipe.scatteredShapeOverrides.length,7);
  assert.equal(shape.recipe.scatteredCount,7);
  assert.deepEqual(decodeRecipe(encodeRecipe(shape.recipe)),shape.recipe);
  assert.deepEqual(source.data,original,'never change imported source pixels');
});

test('matching source-measured dark Tone locks preserve editable seven-pigment silhouettes',()=>{
  const source=pigmentSource();
  const tone=measuredSourceDarkTone(describeReconstructionImage(source));
  assert.ok(tone);
  const locked=normalizeRecipe({
    seed:'matching-locked-dark-source',
    paletteToneEnabled:true,
    paletteSaturation:tone.saturation,
    paletteLightness:tone.lightness,
    lockedSettings:['paletteToneEnabled','paletteSaturation','paletteLightness']
  });
  const choices=reconstructionCandidates(source,locked);
  const observed=choices.find(candidate=>candidate.kind==='hue-visible-shapes');
  assert.ok(observed,
    'matching creator Tone locks cannot veto independently observed editable ink');
  assert.equal(observed.recipe.paletteToneEnabled,true);
  assert.equal(observed.recipe.paletteSaturation,tone.saturation);
  assert.equal(observed.recipe.paletteLightness,tone.lightness);
  assert.equal(observed.recipe.scatteredShapeOverrides.length,7);
  assert.deepEqual(observed.recipe.lockedSettings,locked.lockedSettings);
  assert.deepEqual(decodeRecipe(encodeRecipe(observed.recipe)),observed.recipe);
});

test('creator lock against the required source Tone fails closed without false colour',()=>{
  const source=pigmentSource();
  for(const lock of ['paletteToneEnabled','paletteSaturation','paletteLightness']){
    const current=normalizeRecipe({
      seed:'dark-locked',paletteToneEnabled:false,paletteSaturation:92,
      paletteLightness:58,lockedSettings:[lock]
    });
    const choices=reconstructionCandidates(source,current);
    assert.deepEqual(choices,[],'uncommittable source Tone must refuse for '+lock);
  }
});

test('a soft source remains unsupported rather than wrongly using dark-tone source masks',()=>{
  const soft=pigmentSource(23,70);
  const measured=measuredSourceDarkTone(describeReconstructionImage(soft));
  assert.equal(measured,null);
  assert.deepEqual(reconstructionCandidates(soft,{seed:'soft-cannot-be-inferred'}),[]);
});

test('mixed dark and bright pigments are not assigned an imaginary uniform dark tone',()=>{
  const dark=pigmentSource();
  const bright=pigmentSource(90,58);
  const mixed={...dark,data:dark.data.slice()};
  for(let y=0;y<mixed.height;y++)for(let x=0;x<mixed.width;x++){
    if(x>75&&y<65){
      const i=4*(y*mixed.width+x);
      mixed.data.set(bright.data.slice(i,i+4),i);
    }
  }
  assert.equal(measuredSourceDarkTone(describeReconstructionImage(mixed)),null);
});
