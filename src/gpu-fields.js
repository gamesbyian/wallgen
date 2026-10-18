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
  // A pixel-footprint coverage estimate, rather than a smoothstep falloff.
  // smoothstep made neighbouring pixels nearly opaque at a thin 1.7 px
  // Canvas2D stroke, falsely doubling full-coverage samples. A linear box
  // estimate behaves closer to Canvas2D's integrated pixel alpha.
  float footprint=max(.001,fwidth(distance));
  float line=clamp((strokeWidth*.5+footprint*.5-distance)/footprint,0.0,1.0);
  float alpha=clamp(coverage*line*inkOpacity,0.0,1.0);
  pixel=vec4(inkColour,alpha);
}`;

// A single-pass source-over compositor for up to eight ordered field layers.
// It writes straight RGBA, not a framebuffer blend's premultiplied RGB. This
// avoids repeated GPU readbacks or intermediate textures between elements.
export const GPU_FIELD_STACK_FRAGMENT=`#version 300 es
precision highp float;
uniform sampler2D ownerMask;
uniform vec2 viewport;
uniform vec2 logicalSize;
uniform int fieldCount;
uniform vec4 fieldGeometry[8]; // frequency, amplitude, position, phase
uniform vec4 fieldInk[8];      // RGB, opacity
uniform vec2 fieldStyle[8];    // stroke width, shape code
out vec4 pixel;
const float PI=3.14159265358979323846;
void main(){
  vec2 p=vec2(gl_FragCoord.x/viewport.x*logicalSize.x,
    (viewport.y-gl_FragCoord.y)/viewport.y*logicalSize.y);
  float coverage=texture(ownerMask,vec2(gl_FragCoord.x/viewport.x,
    1.0-gl_FragCoord.y/viewport.y)).a;
  vec3 accumulated=vec3(0.0);
  float accumulatedAlpha=0.0;
  for(int i=0;i<8;i++){
    if(i>=fieldCount)break;
    float frequency=fieldGeometry[i].x;
    float amplitude=fieldGeometry[i].y;
    float position=fieldGeometry[i].z;
    float phaseDegrees=fieldGeometry[i].w;
    float strokeWidth=fieldStyle[i].x;
    int shapeCode=int(fieldStyle[i].y+.5);
    float period=max(12.0,160.0/max(.2,frequency));
    float wavelength=max(16.0,220.0/frequency);
    float angle=(p.x+phaseDegrees*3.0)/wavelength*2.0*PI+
      phaseDegrees*PI/180.0;
    float oscillation=shapeCode==1?sin(angle):
      shapeCode==2?2.0/PI*asin(sin(angle)):0.0;
    float adjustedY=p.y-position*period-amplitude*80.0*oscillation;
    float grid=adjustedY+2400.0;
    float verticalDistance=abs(fract(grid/period+.5)-.5)*period;
    float steepness=shapeCode==1?
      amplitude*80.0*(2.0*PI/wavelength)*cos(angle):
      shapeCode==2?amplitude*80.0*(4.0/wavelength)*sign(cos(angle)):0.0;
    float distance=verticalDistance*inversesqrt(1.0+steepness*steepness);
    float footprint=max(.001,fwidth(distance));
    float line=clamp((strokeWidth*.5+footprint*.5-distance)/footprint,0.0,1.0);
    float alpha=clamp(coverage*line*fieldInk[i].a,0.0,1.0);
    accumulated=fieldInk[i].rgb*alpha+accumulated*(1.0-alpha);
    accumulatedAlpha=alpha+accumulatedAlpha*(1.0-alpha);
  }
  pixel=vec4(accumulatedAlpha>0.0?
    accumulated/accumulatedAlpha:vec3(0.0),accumulatedAlpha);
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
const validSurface=(width,height,maxPixels=2_500_000)=>
  Number.isInteger(width)&&Number.isInteger(height)&&width>0&&height>0&&
  width*height<=maxPixels;

// An isolated, reusable research backend. This is NOT wired into production:
// ROI for mask uploads / GPU readback remains to be established. One mask can
// be uploaded once, then many different ink styles can be rendered with the
// same program, buffer, texture and context. Call dispose() after use.
export function createMaskedFieldSession({
  width,height,canvasFactory,maxPixels=2_500_000,
}={}){
  if(!validSurface(width,height,maxPixels))
    return {supported:false,reason:'Mask dimensions outside experimental budget'};
  const canvas=canvasFactory?.(width,height)||
    (typeof OffscreenCanvas==='function'?new OffscreenCanvas(width,height):null);
  if(!canvas)return {supported:false,reason:'OffscreenCanvas unavailable'};
  let gl,vertex,fragment,program,buffer,texture,stackFragment,stackProgram;
  let closed=false,lost=false,maskReady=false,uploads=0,draws=0;
  const contextLost=event=>{
    event?.preventDefault?.();
    lost=true;
    maskReady=false;
  };
  const contextRestored=()=>{
    // WebGL objects are invalid after restoration. Caller explicitly creates
    // a fresh session; no invisible autoretry and no stale texture reuse.
    lost=true;maskReady=false;
  };
  const unusable=()=>closed?'GPU session disposed':
    lost||gl?.isContextLost?.()?'WebGL2 context lost':null;
  const release=()=>{
    if(closed)return;
    closed=true;maskReady=false;
    canvas.removeEventListener?.('webglcontextlost',contextLost);
    canvas.removeEventListener?.('webglcontextrestored',contextRestored);
    if(gl){
      try{
        if(texture)gl.deleteTexture(texture);
        if(buffer)gl.deleteBuffer(buffer);
        if(program)gl.deleteProgram(program);
        if(stackProgram)gl.deleteProgram(stackProgram);
        if(stackFragment)gl.deleteShader(stackFragment);
        if(fragment)gl.deleteShader(fragment);
        if(vertex)gl.deleteShader(vertex);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }catch{}
    }
    try{canvas.width=0;canvas.height=0;}catch{}
    gl=null;texture=null;buffer=null;program=null;vertex=null;fragment=null;
    stackProgram=null;stackFragment=null;
  };
  const status=reason=>({supported:false,reason});
  try{
    if(!canvas.getContext)return status('WebGL2 unavailable');
    gl=canvas.getContext('webgl2',{alpha:true,antialias:false,
      premultipliedAlpha:false,preserveDrawingBuffer:true,
      depth:false,stencil:false,powerPreference:'low-power'});
    if(!gl)return status('WebGL2 unavailable');
    canvas.addEventListener?.('webglcontextlost',contextLost);
    canvas.addEventListener?.('webglcontextrestored',contextRestored);
    vertex=shader(gl,gl.VERTEX_SHADER,GPU_PROBE_VERTEX);
    fragment=shader(gl,gl.FRAGMENT_SHADER,GPU_FIELD_FRAGMENT);
    program=gl.createProgram();
    if(!program)throw Error('WebGL2 program allocation failed');
    gl.attachShader(program,vertex);gl.attachShader(program,fragment);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))
      throw Error('WebGL2 shader link failed: '+gl.getProgramInfoLog(program));
    buffer=gl.createBuffer();
    if(!buffer)throw Error('WebGL2 buffer allocation failed');
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([
      -1,-1,1,-1,-1,1,-1,1,1,-1,1,1,
    ]),gl.STATIC_DRAW);
    texture=gl.createTexture();
    if(!texture)throw Error('WebGL2 texture allocation failed');
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);
    // WebGL2 immutable one-level texture storage avoids repeated allocation
    // and driver-side mip-map guessing. Only pixels change between masks.
    gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA8,width,height);
    if(gl.getError()!==gl.NO_ERROR)throw Error('WebGL2 session initialization failed');
    return {
      supported:true,canvas,
      // Each setMask() call denotes new mask pixels even if the *same*
      // mutable Canvas2D object is supplied. Never cache based on identity:
      // input drawing can change without object identity changing.
      setMask(mask){
        const failure=unusable();
        if(failure)return status(failure);
        if(!mask||mask.width!==width||mask.height!==height)
          return status('Mask dimensions do not match session');
        try{
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D,texture);
          gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,mask);
          const error=gl.getError();
          if(error!==gl.NO_ERROR)throw Error('Mask upload failed: 0x'+error.toString(16));
          maskReady=true;uploads++;
          return {supported:true};
        }catch(error){
          maskReady=false;
          return status(String(error?.message||error));
        }
      },
      render(element,{logicalWidth=600,logicalHeight=1300}={}){
        const failure=unusable();
        if(failure)return status(failure);
        if(!maskReady)return status('Upload a mask before rendering');
        if(!gpuFieldEligibility(element))
          return status('Unsupported decorative field');
        if(!Number.isFinite(logicalWidth)||!Number.isFinite(logicalHeight)||
           logicalWidth<=0||logicalHeight<=0)
          return status('Invalid logical dimensions');
        const colour=rgbaOf(element);
        if(!colour)return status('Invalid custom ink colour');
        try{
          gl.useProgram(program);
          gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
          const loc=gl.getAttribLocation(program,'position');
          if(loc<0)throw Error('Vertex position attribute missing');
          gl.enableVertexAttribArray(loc);
          gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D,texture);
          gl.uniform1i(gl.getUniformLocation(program,'ownerMask'),0);
          gl.uniform2f(gl.getUniformLocation(program,'viewport'),width,height);
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
          gl.viewport(0,0,width,height);
          gl.disable(gl.BLEND);gl.disable(gl.SCISSOR_TEST);
          gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
          gl.drawArrays(gl.TRIANGLES,0,6);
          const error=gl.getError();
          if(error!==gl.NO_ERROR)throw Error('WebGL2 draw failed: 0x'+error.toString(16));
          draws++;
          return {supported:true,canvas};
        }catch(error){
          return status(String(error?.message||error));
        }
      },
      // All eligible layers share the same source mask and compositor.
      // The entire stack is drawn in ONE fragment pass: no GL blending,
      // intermediary readback or per-layer mask transfer is required.
      renderMany(elements,{logicalWidth=600,logicalHeight=1300}={}){
        const failure=unusable();
        if(failure)return status(failure);
        if(!maskReady)return status('Upload a mask before rendering');
        if(!Array.isArray(elements)||elements.length<1||elements.length>8)
          return status('GPU field stack must contain between 1 and 8 layers');
        if(!Number.isFinite(logicalWidth)||!Number.isFinite(logicalHeight)||
           logicalWidth<=0||logicalHeight<=0)
          return status('Invalid logical dimensions');
        if(elements.some(e=>!gpuFieldEligibility(e)||!rgbaOf(e)))
          return status('GPU field stack contains unsupported decoration');
        try{
          // Lazily compile the more complex stack program only if used.
          if(!stackProgram){
            const candidateShader=shader(gl,gl.FRAGMENT_SHADER,GPU_FIELD_STACK_FRAGMENT);
            const candidateProgram=gl.createProgram();
            if(!candidateProgram){
              gl.deleteShader(candidateShader);
              throw Error('WebGL2 stack program allocation failed');
            }
            try{
              gl.attachShader(candidateProgram,vertex);
              gl.attachShader(candidateProgram,candidateShader);
              gl.linkProgram(candidateProgram);
              if(!gl.getProgramParameter(candidateProgram,gl.LINK_STATUS))
                throw Error('WebGL2 stack shader link: '+gl.getProgramInfoLog(candidateProgram));
            }catch(error){
              gl.deleteProgram(candidateProgram);
              gl.deleteShader(candidateShader);
              throw error;
            }
            stackProgram=candidateProgram;
            stackFragment=candidateShader;
          }
          const geometry=new Float32Array(8*4);
          const inks=new Float32Array(8*4);
          const styles=new Float32Array(8*2);
          elements.forEach((e,i)=>{
            geometry.set([e.frequency,e.amplitude,e.position,e.phase],i*4);
            inks.set([...rgbaOf(e),e.opacity],i*4);
            styles.set([e.width,SHAPES[e.shape]],i*2);
          });
          gl.useProgram(stackProgram);
          gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
          const loc=gl.getAttribLocation(stackProgram,'position');
          if(loc<0)throw Error('Stack vertex position attribute missing');
          gl.enableVertexAttribArray(loc);
          gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D,texture);
          gl.uniform1i(gl.getUniformLocation(stackProgram,'ownerMask'),0);
          gl.uniform2f(gl.getUniformLocation(stackProgram,'viewport'),width,height);
          gl.uniform2f(gl.getUniformLocation(stackProgram,'logicalSize'),
            logicalWidth,logicalHeight);
          gl.uniform1i(gl.getUniformLocation(stackProgram,'fieldCount'),elements.length);
          gl.uniform4fv(gl.getUniformLocation(stackProgram,'fieldGeometry[0]'),geometry);
          gl.uniform4fv(gl.getUniformLocation(stackProgram,'fieldInk[0]'),inks);
          gl.uniform2fv(gl.getUniformLocation(stackProgram,'fieldStyle[0]'),styles);
          gl.viewport(0,0,width,height);
          gl.disable(gl.BLEND);gl.disable(gl.SCISSOR_TEST);
          gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
          gl.drawArrays(gl.TRIANGLES,0,6);
          const error=gl.getError();
          if(error!==gl.NO_ERROR)throw Error('WebGL2 stack draw: 0x'+error.toString(16));
          draws++;
          return {supported:true,canvas};
        }catch(error){
          return status(String(error?.message||error));
        }
      },
      get stats(){return {maskUploads:uploads,draws,disposed:closed,contextLost:lost};},
      dispose:release,
    };
  }catch(error){
    const reason=String(error?.message||error);
    release();
    return status(reason);
  }
}

// Compatibility adapter for the earlier one-shot proof. Production is still
// worker Canvas2D. Reusable callers should use createMaskedFieldSession().
export function renderMaskedFieldGPU({
  mask,element,logicalWidth=600,logicalHeight=1300,canvasFactory,
}={}){
  if(!gpuFieldEligibility(element))
    return {supported:false,reason:'Unsupported decorative field'};
  if(!mask||!validSurface(mask.width,mask.height))
    return {supported:false,reason:'Mask dimensions outside experimental budget'};
  if(!rgbaOf(element))
    return {supported:false,reason:'Invalid custom ink colour'};
  const session=createMaskedFieldSession({
    width:mask.width,height:mask.height,canvasFactory
  });
  if(!session.supported)return session;
  const uploaded=session.setMask(mask);
  if(!uploaded.supported){session.dispose();return uploaded;}
  const drawn=session.render(element,{logicalWidth,logicalHeight});
  if(!drawn.supported){session.dispose();return drawn;}
  return {supported:true,canvas:session.canvas,release:session.dispose,
    note:'Experimental reusable shader over Canvas2D mask; not production'};
}
