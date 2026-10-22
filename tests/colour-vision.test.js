import test from 'node:test';
import assert from 'node:assert/strict';
import {MACHADO_MATRICES} from '../src/colour-vision-matrices.js';
import {COLOUR_VISION_MODES,machadoMatrix,simulateRgb,simulateImageData} from '../src/colour-vision.js';

const identity=[1,0,0,0,1,0,0,0,1];
const image=(width,height,pixels)=>({width,height,data:new Uint8ClampedArray(pixels)});
const grayscale=[0,30,64,128,195,255];
test('supported modes and 33 upstream severity matrices are complete',()=>{
  assert.deepEqual(COLOUR_VISION_MODES,['original','protan','deutan','tritan']);
  for(const mode of ['protan','deutan','tritan']){
    assert.equal(MACHADO_MATRICES[mode].length,11);
    for(const row of MACHADO_MATRICES[mode]) {
      assert.equal(row.length,9);
      assert.ok(row.every(Number.isFinite));
    }
    assert.deepEqual(machadoMatrix(mode,0),identity);
    assert.deepEqual(machadoMatrix(mode,1),MACHADO_MATRICES[mode][10]);
  }
});
test('intermediate severities use matrix interpolation, never pixel blending',()=>{
  for(const mode of ['protan','deutan','tritan']){
    const a=MACHADO_MATRICES[mode][5],b=MACHADO_MATRICES[mode][6];
    const m=machadoMatrix(mode,.55);
    m.forEach((v,i)=>assert.ok(Math.abs(v-(a[i]+b[i])/2)<1e-12));
    for(let step=1;step<10;step++){
      const boundary=step/10,below=machadoMatrix(mode,boundary-1e-8);
      const above=machadoMatrix(mode,boundary+1e-8);
      below.forEach((v,i)=>assert.ok(Math.abs(v-above[i])<1e-6));
    }
  }
});
test('validates type, mode, severity and RGBA geometry strictly',()=>{
  for(const mode of ['unknown',null,'monochrome']) assert.throws(()=>machadoMatrix(mode,1),RangeError);
  for(const s of [-.01,1.01,NaN,Infinity,-Infinity,'1',null]) assert.throws(()=>machadoMatrix('protan',s),RangeError);
  for(const rgb of [[1,2],[-1,0,0],[256,0,0],[1.1,1,1]]) assert.throws(()=>simulateRgb(rgb,'deutan',1),RangeError);
  assert.throws(()=>simulateImageData(image(1,1,[1,2,3]),'protan',1),TypeError);
  assert.throws(()=>simulateImageData(image(0,2,[]),'protan',1),TypeError);
});
test('original and severity zero copy image exactly, without aliasing source',()=>{
  const src=image(2,1,[255,0,20,21,4,8,16,255]);
  for(const [mode,severity] of [['original',1],['protan',0],['deutan',0],['tritan',0]]){
    const result=simulateImageData(src,mode,severity);
    assert.deepEqual(result.data,src.data);
    assert.notStrictEqual(result.data,src.data);
    result.data[0]=1;
    assert.equal(src.data[0],255);
  }
});
test('known canonical Machado protanopia reference: pure linear red',()=>{
  // Reference matrix first column (0.152286, 0.114503, -0.003882).
  // sRGB encoding after clamp gives (109,95,0), not a gamma-space RGB mix.
  assert.deepEqual(simulateRgb([255,0,0],'protan',1),[109,95,0]);
  assert.deepEqual(simulateRgb([0,0,0],'protan',1),[0,0,0]);
  assert.deepEqual(simulateRgb([255,255,255],'protan',1),[255,255,255]);
});
test('neutrals, alpha, shape and input bytes survive every model',()=>{
  const pixels=[];
  for(const v of grayscale)pixels.push(v,v,v,(v*17)%256);
  const src=image(3,2,pixels),initial=new Uint8ClampedArray(src.data);
  for(const mode of ['protan','deutan','tritan']){
    for(const severity of [.1,.55,1]){
      const result=simulateImageData(src,mode,severity);
      assert.equal(result.width,3);assert.equal(result.height,2);
      for(let i=0;i<result.data.length;i+=4){
        assert.equal(result.data[i+3],initial[i+3]);
        assert.ok(Math.abs(result.data[i]-result.data[i+1])<=1);
        assert.ok(Math.abs(result.data[i+1]-result.data[i+2])<=1);
      }
    }
  }
  assert.deepEqual(src.data,initial);
});
test('extreme and saturated colours transform meaningfully and remain finite',()=>{
  const colours=[[255,0,0],[0,255,0],[0,0,255],[255,255,0],[0,255,255],[255,0,255],[12,34,56]];
  for(const mode of ['protan','deutan','tritan']){
    let changed=0;
    for(const rgb of colours){
      const result=simulateRgb(rgb,mode,1);
      assert.ok(result.every(x=>Number.isInteger(x)&&x>=0&&x<=255));
      if(result.some((x,i)=>x!==rgb[i]))changed++;
    }
    assert.ok(changed>=4,mode+' ought to change chromatic distinctions');
  }
});

test('Brettel 1997 tritan separates the two LMS projection wings',()=>{
  // Golden RGB fixtures independently evaluated from libDaltonLens two-plane
  // projection parameters, gamma 2.4 sRGB round-trip, and clamping.
  const examples=[
    [[255,0,0],[255,0,78]],   // first half-plane
    [[0,255,0],[121,233,255]],// second half-plane
    [[0,0,255],[0,98,136]],
    [[255,255,0],[255,238,241]],
    [[0,255,255],[71,248,255]],
    [[255,0,255],[239,102,122]],
    [[128,128,128],[128,128,128]],
  ];
  for(const [rgb,expected] of examples){
    const got=simulateRgb(rgb,'tritan',1);
    got.forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<=1,
      'Brettel tritan '+rgb.join(',')+' channel '+i+' expected '+expected[i]+' got '+v));
  }
  // At 50% severity, interpolation must occur in linear RGB, not sRGB bytes.
  assert.deepEqual(simulateRgb([0,255,0],'tritan',.5),[87,244,198]);
  assert.deepEqual(simulateRgb([0,0,255],'tritan',0),[0,0,255]);
});
