import test from 'node:test';
import assert from 'node:assert/strict';
import {HUES,normalizeRecipe} from '../src/model.js';
import {extractImageColourRegions} from '../src/image-path.js';
import {plainlyAchromaticForeground,describeReconstructionImage,
  reconstructionCandidates,RECONSTRUCTION_RENDER_LIMIT}
  from '../src/image-reconstruction.js';

function canvas({pigment=[179,179,179],patch=null,bg=[5,5,8]}={}){
  const width=120,height=260,data=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4;
    const slot=Array.from({length:7},(_,index)=>{
      const x0=14+index%2*58,y0=12+Math.floor(index/2)*61;
      return x>=x0&&x<x0+27&&y>=y0&&y<y0+32;
    }).findIndex(Boolean);
    const ink=slot>=0?(patch?.(slot)??pigment):bg;
    data.set([...ink,255],i);
  }
  return {width,height,data};
}
test('visible neutral foreground fails closed instead of inventing red rainbow ink',()=>{
  const source=canvas(),before=source.data.slice();
  const desc=describeReconstructionImage(source);
  assert.equal(desc.colourRegions.length,0);
  assert.equal(plainlyAchromaticForeground(source,desc.colourRegions),true);
  assert.deepEqual(reconstructionCandidates(source,normalizeRecipe({seed:'current-studio'})),[]);
  assert.deepEqual(source.data,before,'never mutate independent source RGBA');
});

test('source-only achromatic signature does not block low-chroma pastel, dark ink or true rainbow',()=>{
  const pastel=canvas({pigment:[196,161,161]});
  assert.equal(plainlyAchromaticForeground(pastel,[]),false);
  const dark=canvas({pigment:[62,4,4]});
  assert.equal(plainlyAchromaticForeground(dark,[]),false);
  const rainbow=canvas({patch:slot=>{
    const colours=[[255,0,0],[255,128,0],[255,255,0],[0,255,0],
      [0,0,255],[75,0,130],[148,0,211]];
    return colours[slot];
  }});
  const found=extractImageColourRegions(rainbow,HUES);
  assert.ok(found.regions.length>=6, 'the independent chromatic source retains abundant real hue evidence');
  assert.equal(plainlyAchromaticForeground(rainbow,found.regions),false);
  const choices=reconstructionCandidates(rainbow,{seed:'original-source'});
  assert.ok(choices.length>0&&choices.length<=RECONSTRUCTION_RENDER_LIMIT);
});

test('mixed neutral-plus-colour and empty flat fields are not labelled neutral source pigment',()=>{
  const mixed=canvas({patch:slot=>slot===0?[255,0,0]:[179,179,179]});
  const analysis=extractImageColourRegions(mixed,HUES);
  assert.ok(analysis.regions.length>=1,'source has genuinely detected red ink');
  assert.equal(plainlyAchromaticForeground(mixed,analysis.regions),false);
  const allBlack=canvas({pigment:[5,5,8]});
  assert.equal(plainlyAchromaticForeground(allBlack,[]),false);
  const blank=canvas({pigment:[5,5,8],bg:[5,5,8]});
  assert.equal(plainlyAchromaticForeground(blank,[]),false);
});

test('unreliable corners and transparent source never trigger the neutral shortcut',()=>{
  const shifted=canvas();
  shifted.data.set([250,250,250,255],0);
  assert.equal(plainlyAchromaticForeground(shifted,[]),false);
  const transparent=canvas();
  transparent.data[3]=0;
  assert.equal(plainlyAchromaticForeground(transparent,[]),false);
});
