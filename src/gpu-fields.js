// Research-only WebGL2 implementation of ROYGBIV's world-anchored solid
// decorative fields. Explicitly NOT a production backend. The unified scene
// still computes real polygon masks and the Canvas2D painter remains canonical.
// This proof of concept tests whether a shader can replace thousands of CPU
// path vertices while preserving the exact owner mask, phase and colour.
import {GPU_PROBE_VERTEX} from './gpu-probe.js';

export const GPU_FIELD_FRAGMENT=`#version 300 es
precision highp float;
uniform sampler2D ownerMask;
uniform vec2 viewport;
uniform vec2 logicalSize;
uniform float frequency;
uniform float amplitude;
uniform float position;
uniform float phaseDegrees;
uniform float strokeWidth;
uniform float inkOpacity;
uniform int shapeCode;
uniform vec3 inkColour;
out vec4 pixel;
const float PI=3.14159265358979323846;
void main(){
  // Canvas2D design space is top-left origin; gl_FragCoord starts bottom-left.
  vec2 p=vec2(gl_FragCoord.x/viewport.x*logicalSize.x,
    (viewport.y-gl_FragCoord.y)/viewport.y*logicalSize.y);
  vec2 maskUV=vec2(gl_FragCoord.x/viewport.x,
    1.0-gl_FragCoord.y/viewport.y);
  float coverage=texture(ownerMask,maskUV).a;
  float period=max(12.0,160.0/max(.2,frequency));
  float wavelength=max(16.0,220.0/frequency);
  float angle=(p.x+phaseDegrees*3.0)/wavelength*2.0*PI+
    phaseDegrees*PI/180.0;
  float oscillation=shapeCode==1?sin(angle):
    shapeCode==2?2.0/PI*asin(sin(angle)):0.0;
  float adjustedY=p.y-position*period-amplitude*80.0*oscillation;
  // The Canvas2D implementation anchors rows at -2400 logical units.
  float grid=adjustedY+2400.0;
  float verticalDistance=abs(fract(grid/period+.5)-.5)*period;
  // Canvas2D strokes are measured normal to the path, not vertically.
  // Account for the tangent of sinusoidal and triangular field waves.
  float steepness=shapeCode==1?
    amplitude*80.0*(2.0*PI/wavelength)*cos(angle):
    shapeCode==2?amplitude*80.0*(4.0/wavelength)*sign(cos(angle)):0.0;
  float distance=verticalDistance*inversesqrt(1.0+steepness*steepness);
  // Smooth coverage of a finite-width line. Derivatives are core in WebGL2.
  float edge=max(.001,fwidth(distance)*.48);
  float line=1.0-smoothstep(
    max(0.0,strokeWidth*.5-edge),strokeWidth*.5+edge,distance);
  float alpha=clamp(coverage*line*inkOpacity,0.0,1.0);
  pixel=vec4(inkColour,alpha);
}`;

const SHAPES=Object.freeze({straight:0,wave:1,zigzag:2});
export function gpuFieldEligibility(element){
  if(!element||element.enabled===false||element.opacity<=0)return false;
  return element.placement==='field'&&element.stroke==='solid'&&
    element.type==='line'&&Object.hasOwn(SHAPES,element.shape)&&
    ['white','black','custom'].includes(element.color)&&
    !element.colorSlots?.length&&!element.objectIds?.length&&
    Number.isFinite(element.frequency)&&element.frequency>0&&
    Number.isFinite(element.width)&&element.width>0&&
    Number.isFinite(element.amplitude)&&Number.isFinite(element.position)&&
    Number.isFinite(element.phase)&&Number.isFinite(element.opacity);
}
function rgbaOf(element){
  if(element.color==='white')return [1,1,1];
  if(element.color==='black')return [0,0,0];
  if(!/^#[0-9a-f]{6}$/i.test(element.customColor||''))return null;
  return [1,3,5].map(k=>parseInt(element.customColor.slice(k,k+2),16)/255);
}
function shader(gl,type,source){
  const value=gl.createShader(type);
  if(!value)throw Error('WebGL shader allocation failed');
  gl.shaderSource(value,source);
  gl.compileShader(value);
  if(!gl.getShaderParameter(value,gl.COMPILE_STATUS)){
    const error=gl.getShaderInfoLog(value);
    gl.deleteShader(value);throw Error('WebGL shader compilation failed: '+error);
  }
  return value;
}
export function renderMaskedFieldGPU({
  mask,element,logicalWidth=600,logicalHeight=1300,canvasFactory,
}={}){
  if(!gpuFieldEligibility(element))
    return {supported:false,reason:'Unsupported decorative field'};
  if(!mask||!Number.isInteger(mask.width)||!Number.isInteger(mask.height)||
     mask.width<1||mask.height<1||mask.width*mask.height>2_500_000)
    return {supported:false,reason:'Mask dimensions outside experimental budget'};
  const colour=rgbaOf(element);
  if(!colour)return {supported:false,reason:'Invalid custom ink colour'};
  const canvas=canvasFactory?.(mask.width,mask.height)||
    (typeof OffscreenCanvas==='function'?
      new OffscreenCanvas(mask.width,mask.height):null);
  if(!canvas)return {supported:false,reason:'OffscreenCanvas unavailable'};
  let gl,vertex,fragment,program,buffer,texture;
  const clean=()=>{
    if(!gl)return;
    if(texture)gl.deleteTexture(texture);
    if(buffer)gl.deleteBuffer(buffer);
    if(program)gl.deleteProgram(program);
    if(fragment)gl.deleteShader(fragment);
    if(vertex)gl.deleteShader(vertex);
    try{gl.getExtension('WEBGL_lose_context')?.loseContext();}catch{}
    try{canvas.width=0;canvas.height=0;}catch{}
    gl=null;
  };
  try{
    gl=canvas.getContext('webgl2',{alpha:true,antialias:false,
      premultipliedAlpha:false,preserveDrawingBuffer:true,
      depth:false,stencil:false,powerPreference:'low-power'});
    if(!gl)return {supported:false,reason:'WebGL2 unavailable'};
    vertex=shader(gl,gl.VERTEX_SHADER,GPU_PROBE_VERTEX);
    fragment=shader(gl,gl.FRAGMENT_SHADER,GPU_FIELD_FRAGMENT);
    program=gl.createProgram();
    gl.attachShader(program,vertex);gl.attachShader(program,fragment);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))
      throw Error('WebGL2 shader link failed: '+gl.getProgramInfoLog(program));
    gl.useProgram(program);
    buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([
      -1,-1,1,-1,-1,1,-1,1,1,-1,1,1,1,-1,1,1,
    ]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(program,'position');
    if(loc<0)throw Error('Vertex position attribute missing');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    texture=gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,mask);
    gl.uniform1i(gl.getUniformLocation(program,'ownerMask'),0);
    gl.uniform2f(gl.getUniformLocation(program,'viewport'),
      mask.width,mask.height);
    gl.uniform2f(gl.getUniformLocation(program,'logicalSize'),
      logicalWidth,logicalHeight);
    gl.uniform1f(gl.getUniformLocation(program,'frequency'),element.frequency);
    gl.uniform1f(gl.getUniformLocation(program,'amplitude'),element.amplitude);
    gl.uniform1f(gl.getUniformLocation(program,'position'),element.position);
    gl.uniform1f(gl.getUniformLocation(program,'phaseDegrees'),element.phase);
    gl.uniform1f(gl.getUniformLocation(program,'strokeWidth'),element.width);
    gl.uniform1f(gl.getUniformLocation(program,'inkOpacity'),element.opacity);
    gl.uniform1i(gl.getUniformLocation(program,'shapeCode'),SHAPES[element.shape]);
    gl.uniform3fv(gl.getUniformLocation(program,'inkColour'),colour);
    gl.viewport(0,0,mask.width,mask.height);
    gl.disable(gl.BLEND);gl.disable(gl.SCISSOR_TEST);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES,0,6);
    const err=gl.getError();
    if(err!==gl.NO_ERROR)throw Error('WebGL2 drawing error 0x'+err.toString(16));
    return {supported:true,canvas,release:clean,
      note:'Experimental shader over a Canvas2D mask; not production'};
  }catch(error){
    const reason=String(error?.message||error);
    clean();
    return {supported:false,reason};
  }
}
