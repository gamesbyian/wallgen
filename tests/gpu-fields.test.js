import test from 'node:test';
import assert from 'node:assert/strict';
import {gpuFieldEligibility,renderMaskedFieldGPU,createMaskedFieldSession,GPU_FIELD_FRAGMENT} from '../src/gpu-fields.js';

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

function fakeGPU(){
  const counters={shaders:0,programs:0,buffers:0,textures:0,
    allocations:0,reuploads:0,draws:0,deleted:0,lost:0};
  let contextLost=false;
  const gl={
    VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,
    ARRAY_BUFFER:5,STATIC_DRAW:6,FLOAT:7,TEXTURE_2D:8,TEXTURE0:9,
    TEXTURE_MIN_FILTER:10,TEXTURE_MAG_FILTER:11,TEXTURE_WRAP_S:12,
    TEXTURE_WRAP_T:13,NEAREST:14,CLAMP_TO_EDGE:15,
    UNPACK_FLIP_Y_WEBGL:16,UNPACK_PREMULTIPLY_ALPHA_WEBGL:17,
    UNPACK_COLORSPACE_CONVERSION_WEBGL:18,NONE:19,RGBA:20,
    UNSIGNED_BYTE:21,RGBA8:26,BLEND:22,SCISSOR_TEST:23,COLOR_BUFFER_BIT:24,
    TRIANGLES:25,NO_ERROR:0,
    createShader(){counters.shaders++;return {};},
    shaderSource(){},compileShader(){},getShaderParameter(){return true;},
    getShaderInfoLog(){return '';},deleteShader(){counters.deleted++;},
    createProgram(){counters.programs++;return {};},
    attachShader(){},linkProgram(){},getProgramParameter(){return true;},
    getProgramInfoLog(){return '';},deleteProgram(){counters.deleted++;},
    createBuffer(){counters.buffers++;return {};},
    bindBuffer(){},bufferData(){},deleteBuffer(){counters.deleted++;},
    createTexture(){counters.textures++;return {};},
    activeTexture(){},bindTexture(){},texParameteri(){},pixelStorei(){},
    texStorage2D(){counters.allocations++;},
    texSubImage2D(){counters.reuploads++;},
    deleteTexture(){counters.deleted++;},
    getError(){return 0;},
    useProgram(){},getAttribLocation(){return 0;},
    enableVertexAttribArray(){},vertexAttribPointer(){},
    getUniformLocation(){return {};},
    uniform1i(){},uniform1f(){},uniform2f(){},uniform3fv(){},
    viewport(){},disable(){},clearColor(){},clear(){},
    drawArrays(){counters.draws++;},isContextLost(){return contextLost;},
    getExtension(){return {loseContext(){counters.lost++;contextLost=true;}}}
  };
  const listeners=new Map();
  const canvas={width:64,height:64,
    getContext(name){return name==='webgl2'?gl:null;},
    addEventListener(name,cb){listeners.set(name,cb);},
    removeEventListener(name){listeners.delete(name);},
  };
  return {counters,canvas,
    fireLoss(){listeners.get('webglcontextlost')?.({preventDefault(){}});},
    fireRestore(){listeners.get('webglcontextrestored')?.({});}};
}
const sessionElement={id:'x',enabled:true,placement:'field',shape:'wave',
  stroke:'solid',type:'line',width:2,color:'white',opacity:1,
  frequency:5,amplitude:.12,phase:0,position:0,colorSlots:[],objectIds:[]};

test('reusable GPU session allocates shader/program/texture exactly once',()=>{
  const mock=fakeGPU();
  const session=createMaskedFieldSession({
    width:64,height:64,canvasFactory:()=>mock.canvas
  });
  assert.equal(session.supported,true);
  assert.equal(session.render(sessionElement).supported,false,'mask required');
  const mutableMask={width:64,height:64};
  assert.equal(session.setMask(mutableMask).supported,true);
  for(const shape of ['straight','wave','zigzag']){
    const result=session.render({...sessionElement,shape});
    assert.equal(result.supported,true);
    assert.equal(result.canvas,mock.canvas);
  }
  assert.deepEqual(session.stats,{maskUploads:1,draws:3,
    disposed:false,contextLost:false});
  assert.equal(mock.counters.shaders,2);
  assert.equal(mock.counters.programs,1);
  assert.equal(mock.counters.textures,1);
  assert.equal(mock.counters.buffers,1);
  assert.equal(mock.counters.draws,3);
  // A mutable Canvas2D source can have new pixels without a new object.
  // Calling setMask must therefore upload the new pixels.
  assert.equal(session.setMask(mutableMask).supported,true);
  assert.equal(mock.counters.allocations,1);
  assert.equal(mock.counters.reuploads,2);
  assert.equal(session.stats.maskUploads,2);
  session.dispose();session.dispose();
  assert.equal(mock.counters.deleted,5);
  assert.equal(mock.counters.lost,1);
  assert.equal(session.render(sessionElement).supported,false);
  assert.equal(session.setMask(mutableMask).supported,false);
  assert.equal(session.stats.disposed,true);
});

test('WebGL context loss rejects further paints and requires explicit recreation',()=>{
  const mock=fakeGPU();
  const session=createMaskedFieldSession({
    width:64,height:64,canvasFactory:()=>mock.canvas
  });
  assert.equal(session.supported,true);
  assert.equal(session.setMask({width:64,height:64}).supported,true);
  mock.fireLoss();mock.fireRestore();
  assert.equal(session.stats.contextLost,true);
  assert.match(session.render(sessionElement).reason,/context lost/);
  assert.match(session.setMask({width:64,height:64}).reason,/context lost/);
  assert.equal(mock.counters.draws,0);
  session.dispose();
});

test('Wrong-size mutable mask and invalid dimensions never draw stale ink',()=>{
  const mock=fakeGPU();
  const session=createMaskedFieldSession({
    width:64,height:64,canvasFactory:()=>mock.canvas
  });
  assert.equal(session.setMask({width:63,height:64}).supported,false);
  assert.equal(session.render(sessionElement).supported,false);
  assert.equal(session.setMask({width:64,height:64}).supported,true);
  assert.equal(session.render(sessionElement,{logicalWidth:0}).supported,false);
  assert.equal(session.render({...sessionElement,shape:'loop'}).supported,false);
  assert.equal(mock.counters.draws,0);
  session.dispose();
  assert.equal(createMaskedFieldSession({width:6000,height:6000}).supported,false);
});
