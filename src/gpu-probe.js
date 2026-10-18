// Research-only WebGL2 feasibility probe. Not imported by production.
// Measures GPU availability and verifies alpha compositing without changing
// ROYGBIV's authoritative Canvas2D renderer or allocating export-sized VRAM.
export const GPU_PROBE_VERTEX=`#version 300 es
in vec2 position;
out vec2 uv;
void main(){
  uv=(position+1.0)*0.5;
  gl_Position=vec4(position,0.0,1.0);
}`;
export const GPU_PROBE_FRAGMENT=`#version 300 es
precision highp float;
in vec2 uv;
uniform vec4 underColour;
uniform vec4 overColour;
out vec4 pixel;
void main(){
  float alpha=overColour.a+underColour.a*(1.0-overColour.a);
  vec3 rgb=alpha>0.0?
    (overColour.rgb*overColour.a+
     underColour.rgb*underColour.a*(1.0-overColour.a))/alpha:vec3(0.0);
  pixel=vec4(rgb,alpha);
}`;
export function alphaOver(under,over){
  const alpha=over[3]+under[3]*(1-over[3]);
  return [
    ...[0,1,2].map(i=>alpha?
      (over[i]*over[3]+under[i]*under[3]*(1-over[3]))/alpha:0),
    alpha,
  ];
}
function shader(gl,kind,source){
  const handle=gl.createShader(kind);
  gl.shaderSource(handle,source);gl.compileShader(handle);
  if(!gl.getShaderParameter(handle,gl.COMPILE_STATUS)){
    const error=gl.getShaderInfoLog(handle);
    gl.deleteShader(handle);throw Error('GPU shader compilation: '+error);
  }
  return handle;
}
export function probeWebGL2({canvasFactory}={}){
  const canvas=canvasFactory?.(4,4)||
    (typeof OffscreenCanvas==='function'?new OffscreenCanvas(4,4):null);
  if(!canvas)return {available:false,reason:'No OffscreenCanvas'};
  const gl=canvas.getContext('webgl2',{
    alpha:true,antialias:false,preserveDrawingBuffer:true,
    depth:false,stencil:false,premultipliedAlpha:false,
    powerPreference:'low-power'
  });
  if(!gl)return {available:false,reason:'WebGL2 context unavailable'};
  let program,vertex,fragment,buffer;
  try{
    vertex=shader(gl,gl.VERTEX_SHADER,GPU_PROBE_VERTEX);
    fragment=shader(gl,gl.FRAGMENT_SHADER,GPU_PROBE_FRAGMENT);
    program=gl.createProgram();gl.attachShader(program,vertex);
    gl.attachShader(program,fragment);gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))
      throw Error('GPU shader linking: '+gl.getProgramInfoLog(program));
    gl.useProgram(program);
    buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([
      -1,-1,1,-1,-1,1,-1,1,1,-1,1,1
    ]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(program,'position');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    const under=[.1,.35,.8,1],over=[1,.2,.1,.5];
    gl.uniform4fv(gl.getUniformLocation(program,'underColour'),under);
    gl.uniform4fv(gl.getUniformLocation(program,'overColour'),over);
    gl.viewport(0,0,4,4);gl.disable(gl.BLEND);
    const start=performance.now();
    gl.drawArrays(gl.TRIANGLES,0,6);
    const rgba=new Uint8Array(4);
    gl.readPixels(2,2,1,1,gl.RGBA,gl.UNSIGNED_BYTE,rgba);
    const milliseconds=performance.now()-start;
    const expected=alphaOver(under,over).map(x=>Math.round(x*255));
    const difference=[...rgba].map((v,i)=>Math.abs(v-expected[i]));
    return {available:true,correct:difference.every(x=>x<=2),
      pixels:[...rgba],expected,difference,
      milliseconds,maxTextureSize:gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxRenderbufferSize:gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      renderer:gl.getParameter(gl.RENDERER),
      webglVersion:gl.getParameter(gl.VERSION),
      note:'Synthetic single-pass probe, not a GPU performance benchmark'};
  }catch(error){
    return {available:true,correct:false,error:String(error?.message||error)};
  }finally{
    if(buffer)gl.deleteBuffer(buffer);
    if(program)gl.deleteProgram(program);
    if(vertex)gl.deleteShader(vertex);
    if(fragment)gl.deleteShader(fragment);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    try{canvas.width=canvas.height=0;}catch{}
  }
}
