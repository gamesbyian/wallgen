import test from 'node:test';
import assert from 'node:assert/strict';
import {HUES,normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';
import {extractImageColourRegions,extractVisibleHueCompound} from '../src/image-path.js';
import {observedHueShapeRecipe} from '../src/image-hue-reconstruction.js';

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
