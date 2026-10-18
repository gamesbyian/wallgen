import test from 'node:test';
import assert from 'node:assert/strict';
import {gpuFieldEligibility,renderMaskedFieldGPU,GPU_FIELD_FRAGMENT} from '../src/gpu-fields.js';

const eligible={id:'stripe-accent',enabled:true,placement:'field',shape:'wave',
  stroke:'solid',type:'line',width:2.25,color:'white',opacity:1,
  frequency:6,amplitude:.15,position:0,phase:35,colorSlots:[],objectIds:[]};

test('GPU eligible path is intentionally a narrow and explicit feature gate',()=>{
  assert.equal(gpuFieldEligibility(eligible),true);
  for(const changes of [
    {stroke:'dashed'},{stroke:'dotted'},{shape:'loop'},
    {placement:'local'},{placement:'contour'},{type:'band'},
    {color:'lighter'},{color:'darker'},{colorSlots:[1]},
    {objectIds:['region-1']},{opacity:0},{enabled:false},
    {frequency:Infinity},{width:0},{amplitude:NaN},
  ])assert.equal(gpuFieldEligibility({...eligible,...changes}),false,
    JSON.stringify(changes));
  for(const shape of ['straight','wave','zigzag'])
    assert.equal(gpuFieldEligibility({...eligible,shape}),true);
});

test('No context or mask yields safe nonproduction fallback',()=>{
  assert.deepEqual(renderMaskedFieldGPU({element:eligible}),{
    supported:false,reason:'Mask dimensions outside experimental budget'
  });
  const mask={width:64,height:64};
  assert.deepEqual(renderMaskedFieldGPU({element:eligible,mask,
    canvasFactory:()=>({getContext:()=>null})}),{
    supported:false,reason:'WebGL2 unavailable'
  });
  assert.equal(renderMaskedFieldGPU({element:eligible,mask:{width:2000,height:2000}}).supported,false);
  assert.equal(renderMaskedFieldGPU({element:{...eligible,shape:'loop'},mask}).supported,false);
  assert.equal(renderMaskedFieldGPU({element:{...eligible,color:'custom',customColor:'nonsense'},mask}).supported,false);
});

test('Research-only shader uses world-space source lattice and source-mask alpha',()=>{
  assert.match(GPU_FIELD_FRAGMENT,/adjustedY\+2400\.0/);
  assert.match(GPU_FIELD_FRAGMENT,/texture\(ownerMask,maskUV\)\.a/);
  assert.match(GPU_FIELD_FRAGMENT,/smoothstep/);
  assert.match(GPU_FIELD_FRAGMENT,/fwidth/);
  assert.match(GPU_FIELD_FRAGMENT,/shapeCode==1/);
});
