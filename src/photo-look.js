// Shared, opt-in final-picture processor for film and digital-camera inspired looks.
// No external assets, nondeterministic random streams or secondary full-size buffers.
// Version 1 operates in encoded sRGB; linear-light optics are deliberately future work.
export const PHOTO_PRESETS=Object.freeze({
  'film-slide':Object.freeze({family:'film',contrast:1.20,saturation:1.13,shadow:0,highlight:0.07,red:0.014,green:0,blue:-0.014,grain:12,vignette:9}),
  'film-negative':Object.freeze({family:'film',contrast:0.93,saturation:0.87,shadow:0.035,highlight:0.055,red:0.014,green:0.005,blue:-0.012,grain:19,vignette:12}),
  // Exact muted-negative grade and grain, but opt-in shadow floor preservation.
  'film-negative-deepblack':Object.freeze({family:'film',contrast:0.93,saturation:0.87,shadow:0.035,highlight:0.055,red:0.014,green:0.005,blue:-0.012,grain:19,vignette:12}),
  'film-mono':Object.freeze({family:'film',contrast:1.13,saturation:0,shadow:0.009,highlight:0.05,red:0,green:0,blue:0,grain:16,vignette:8}),
  'film-grain-only':Object.freeze({family:'film',contrast:1,saturation:1,shadow:0,highlight:0,red:0,green:0,blue:0,grain:58,vignette:0}),
  'film-halation-only':Object.freeze({family:'film',contrast:1,saturation:1,shadow:0,highlight:0,red:0,green:0,blue:0,grain:0,vignette:0,halation:75}),
  // A separately named wide, optically soft red/orange diffusion treatment.
  // The original narrow halation's pixel recipe remains exactly unchanged.
  'film-halation-diffusion':Object.freeze({family:'film',contrast:1,saturation:1,shadow:0,highlight:0,red:0,green:0,blue:0,grain:0,vignette:0,halation:85}),
  'camera-natural':Object.freeze({family:'camera',contrast:1.055,saturation:1.045,shadow:0.012,highlight:0.06,red:0,green:0,blue:0,grain:2,vignette:2}),
  'camera-hdr':Object.freeze({family:'camera',contrast:1.11,saturation:1.12,shadow:0.055,highlight:0.095,red:0.002,green:0.003,blue:0.002,grain:1,vignette:0}),
  'camera-dslr-optics':Object.freeze({family:'camera',contrast:1.06,saturation:1.025,shadow:0,highlight:0.045,red:0,green:0,blue:0,grain:1,vignette:10}),
  'camera-webcam':Object.freeze({family:'camera',contrast:1.08,saturation:0.78,shadow:0.015,highlight:0.02,red:0.015,green:-0.003,blue:0.005,grain:22,vignette:5}),
  'camera-webcam-signal':Object.freeze({family:'camera',contrast:1.06,saturation:0.84,shadow:0.02,highlight:0.015,red:0.012,green:-0.006,blue:0.008,grain:7,vignette:4}),
  'camera-digicam-signal':Object.freeze({family:'camera',contrast:1.14,saturation:1.22,shadow:0,highlight:-0.025,red:0.012,green:-0.004,blue:-0.009,grain:13,vignette:3}),
  // Opt-in small point-and-shoot flash, entirely separate from existing looks.
  'camera-pocket-flash':Object.freeze({family:'camera',contrast:1.13,saturation:1.11,shadow:0.008,highlight:-0.035,red:0.012,green:0,blue:-0.008,grain:8,vignette:2}),
});
export const PHOTO_PRESET_NAMES=Object.freeze({
  'film-slide':'Slide film inspired',
  'film-negative':'Muted negative print',
  'film-negative-deepblack':'Deep-black negative print (dark backgrounds)',
  'film-mono':'Monochrome print',
  'film-grain-only':'Film grain only (no colour grade)',
  'film-halation-only':'Warm film halation only',
  'film-halation-diffusion':'Wide warm film light diffusion',
  'camera-natural':'Natural digital camera',
  'camera-hdr':'Smartphone HDR inspired',
  'camera-dslr-optics':'Interchangeable-lens digital (simulated)',
  'camera-webcam':'Old webcam colour (early preview)',
  'camera-webcam-signal':'Low-resolution webcam capture (simulated)',
  'camera-digicam-signal':'Early digital compact camera (simulated)',
  'camera-pocket-flash':'Direct-flash point-and-shoot (simulated)',
});
const finite=(x,fallback,min,max)=>{
  const n=Number(x);
  return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;
};
const limits={
  contrast:[0.5,1.8],saturation:[0,1.8],shadow:[-.15,.2],highlight:[-.15,.2],
  red:[-.15,.15],green:[-.15,.15],blue:[-.15,.15],grain:[0,100],vignette:[0,100]
};
// Canonical, expanded parameters survive preset refactoring and travel inside PNG/URLs.
export function normalizePhotoLook(value={}){
  const source=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  const presetId=Object.hasOwn(PHOTO_PRESETS,source.presetId)?source.presetId:'film-slide';
  const preset=PHOTO_PRESETS[presetId];
  const candidate=source.parameters&&typeof source.parameters==='object'?source.parameters:{};
  const parameters=Object.fromEntries(Object.entries(limits).map(([key,[min,max]])=>
    [key,finite(candidate[key],preset[key],min,max)]));
  // Legacy presets preserve their exact serialized parameter sets. Only this
  // new optic has a version-one expanded halation amount in saved PNGs/URLs.
  if(presetId==='film-halation-only'||presetId==='film-halation-diffusion')
    parameters.halation=finite(candidate.halation,preset.halation,0,100);
  return {version:1,enabled:source.enabled===true||source.enabled==='true',
    family:preset.family,presetId,amount:finite(source.amount,75,0,100),parameters};
}
const clampByte=n=>Math.max(0,Math.min(255,Math.round(n)));
const MAX_PHOTO_READBACK_BYTES=2*1024*1024;
const fastHash=s=>{
  let h=2166136261;
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
  return h>>>0;
};
const noiseHash=(x,y,seed)=>{
  let h=seed^Math.imul(x,374761393)^Math.imul(y,668265263);
  h=Math.imul(h^(h>>>13),1274126177);
  return ((h^(h>>>16))>>>0)/4294967296-.5;
};
// Artistic approximation of low-bandwidth virtual camera signals, not a JPEG codec.
// Work in a tiny bounded sensor frame instead of allocating a second 20MP RGBA
// raster. Four source samples per sensor cell temper hard-edge aliasing.
// Neighbouring 2x2 sensor cells share quantized chroma (4:2:0-like sampling).
// Sensor samples are complete BEFORE the destination pixels are changed.
function makeWebcamCapture(data,width,height,variant='webcam',pixelReader=null){
  // Retain webcam-v1 capture settings byte-for-byte for existing saved recipes.
  // The opt-in early digicam gets a finer sensor but punchier, quantized chroma.
  const digicam=variant==='digicam';
  const sensorWidth=Math.min(width,digicam?360:200);
  const sensorHeight=Math.min(height,digicam?650:520,
    Math.max(1,Math.round(sensorWidth*height/width)));
  const chromaWidth=Math.ceil(sensorWidth/2);
  const chromaHeight=Math.ceil(sensorHeight/2);
  const luma=new Float32Array(sensorWidth*sensorHeight);
  const cb=new Float32Array(chromaWidth*chromaHeight);
  const cr=new Float32Array(chromaWidth*chromaHeight);
  const count=new Uint8Array(chromaWidth*chromaHeight);
  for(let y=0;y<sensorHeight;y++)for(let x=0;x<sensorWidth;x++){
    let r=0,g=0,b=0;
    for(const oy of [.25,.75])for(const ox of [.25,.75]){
      const px=Math.min(width-1,Math.floor((x+ox)*width/sensorWidth));
      const py=Math.min(height-1,Math.floor((y+oy)*height/sensorHeight));
      if(pixelReader){
        pixelReader.read(px,py);
        r+=pixelReader.r;g+=pixelReader.g;b+=pixelReader.b;
      }else{
        const at=(py*width+px)*4;
        r+=data[at];g+=data[at+1];b+=data[at+2];
      }
    }
    r/=4;g/=4;b/=4;
    const at=y*sensorWidth+x;
    const luminance=.299*r+.587*g+.114*b;
    luma[at]=luminance;
    const block=(y>>1)*chromaWidth+(x>>1);
    cb[block]+=b-luminance;
    cr[block]+=r-luminance;
    count[block]++;
  }
  const rgb=new Uint8Array(sensorWidth*sensorHeight*3);
  for(let y=0;y<sensorHeight;y++)for(let x=0;x<sensorWidth;x++){
    const at=y*sensorWidth+x;
    const block=(y>>1)*chromaWidth+(x>>1);
    const luminanceStep=digicam?4:6;
    const chromaStep=digicam?20:16;
    const Y=Math.round(luma[at]/luminanceStep)*luminanceStep;
    const Cb=Math.round((cb[block]/count[block])/chromaStep)*chromaStep;
    const Cr=Math.round((cr[block]/count[block])/chromaStep)*chromaStep;
    const r=clampByte(Y+Cr),b=clampByte(Y+Cb);
    const g=clampByte((Y-.299*r-.114*b)/.587);
    rgb[at*3]=r;rgb[at*3+1]=g;rgb[at*3+2]=b;
  }
  return {width:sensorWidth,height:sensorHeight,pixels:rgb};
}

// Bounded, high-frequency source-luminance field for an opt-in photographic
// acutance finish. Small gaussian 3x3 blur is subtracted from luminance;
// positive and negative edge residuals are then mixed into all RGB channels
// equally, limiting chromatic fringes. No fake scene depth/RAW sensor data.
// For 19.8 MP exports this uses <=600x1300 authored samples and three bounded
// float arrays, never a second export-sized RGBA buffer. Sample BEFORE grading.
function makeLensAcutanceField(data,width,height,pixelReader=null){
  const fieldWidth=Math.min(600,width);
  const fieldHeight=Math.min(1300,height,
    Math.max(1,Math.round(fieldWidth*height/width)));
  const size=fieldWidth*fieldHeight;
  const original=new Float32Array(size),horizontal=new Float32Array(size);
  const detail=new Float32Array(size);
  for(let y=0;y<fieldHeight;y++)for(let x=0;x<fieldWidth;x++){
    let sum=0;
    for(const dy of [.25,.75])for(const dx of [.25,.75]){
      const px=Math.min(width-1,Math.floor((x+dx)*width/fieldWidth));
      const py=Math.min(height-1,Math.floor((y+dy)*height/fieldHeight));
      if(pixelReader){
        pixelReader.read(px,py);
        sum+=.2126*pixelReader.r+.7152*pixelReader.g+.0722*pixelReader.b;
      }else{
        const i=(py*width+px)*4;
        sum+=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
      }
    }
    original[y*fieldWidth+x]=sum*.25;
  }
  for(let y=0;y<fieldHeight;y++)for(let x=0;x<fieldWidth;x++){
    const at=y*fieldWidth+x;
    horizontal[at]=(original[y*fieldWidth+Math.max(0,x-1)]+
      original[at]*2+original[y*fieldWidth+Math.min(fieldWidth-1,x+1)])*.25;
  }
  for(let y=0;y<fieldHeight;y++)for(let x=0;x<fieldWidth;x++){
    const at=y*fieldWidth+x;
    const blurred=(horizontal[Math.max(0,y-1)*fieldWidth+x]+
      horizontal[at]*2+horizontal[Math.min(fieldHeight-1,y+1)*fieldWidth+x])*.25;
    detail[at]=original[at]-blurred;
  }
  return {width:fieldWidth,height:fieldHeight,detail};
}

// Deterministic, spatial warm halation approximation. The source is sampled
// BEFORE any in-place finishing, on an aspect-matched <=600x1300 authored frame.
// Only bright *luminance* emits glow, not saturated max-channel values. Two
// separable box passes cost O(frame pixels), not O(radius * export pixels).
// This is a perceptual film-inspired effect, not a linear-light optical model.
function makeHalationField(data,width,height,profile='original',pixelReader=null){
  const fieldWidth=Math.min(600,width);
  const fieldHeight=Math.min(1300,height,
    Math.max(1,Math.round(fieldWidth*height/width)));
  const size=fieldWidth*fieldHeight;
  const sources=new Uint8Array(size);
  for(let y=0;y<fieldHeight;y++)for(let x=0;x<fieldWidth;x++){
    let luma=0;
    for(const dy of [.25,.75])for(const dx of [.25,.75]){
      const px=Math.min(width-1,Math.floor((x+dx)*width/fieldWidth));
      const py=Math.min(height-1,Math.floor((y+dy)*height/fieldHeight));
      // The source colour sampling and arithmetic stay identical whether
      // sourced from an in-memory RGBA frame or a bounded Canvas2D row cache.
      // Preserve the original fast direct-buffer branch for callers of
      // processPhotoPixels and older rendered recipes.
      if(pixelReader){
        pixelReader.read(px,py);
        luma+=(.2126*pixelReader.r+.7152*pixelReader.g+
          .0722*pixelReader.b)*.25;
      }else{
        const i=(py*width+px)*4;
        luma+=(.2126*data[i]+.7152*data[i+1]+.0722*data[i+2])*.25;
      }
    }
    // The new diffusion profile admits lower midtone highlights (especially
    // orange) into a broad veil; original's luma gate is frozen for old PNGs.
    sources[y*fieldWidth+x]=Math.round(255*Math.min(1,Math.max(0,
      profile==='diffusion'?(luma-86)/132:(luma-125)/115)));
  }
  // Radius is in authored-world units; smaller canvases scale proportionally.
  const radius=Math.max(1,Math.round(fieldWidth*(profile==='diffusion'?22:9)/600));
  const horizontal=new Float32Array(size);
  const output=new Uint8Array(size);
  const diameter=radius*2+1;
  for(let y=0;y<fieldHeight;y++){
    const row=y*fieldWidth;
    let sum=0;
    for(let k=-radius;k<=radius;k++)
      sum+=sources[row+Math.min(fieldWidth-1,Math.max(0,k))];
    for(let x=0;x<fieldWidth;x++){
      horizontal[row+x]=sum/diameter;
      sum+=sources[row+Math.min(fieldWidth-1,x+radius+1)]-
        sources[row+Math.max(0,x-radius)];
    }
  }
  for(let x=0;x<fieldWidth;x++){
    let sum=0;
    for(let k=-radius;k<=radius;k++)
      sum+=horizontal[Math.min(fieldHeight-1,Math.max(0,k))*fieldWidth+x];
    for(let y=0;y<fieldHeight;y++){
      output[y*fieldWidth+x]=Math.round(sum/diameter);
      sum+=horizontal[Math.min(fieldHeight-1,y+radius+1)*fieldWidth+x]-
        horizontal[Math.max(0,y-radius)*fieldWidth+x];
    }
  }
  return {width:fieldWidth,height:fieldHeight,blurred:output};
}

// Keep a small, original-pixel read cache for precomputing a spatial finish.
// Unlike drawImage downscaling, this visits exactly the four authored source
// sample locations per halation cell, preserving the existing source gate and
// seeded halation pixels. The cache never reads the already finished canvas.
function makeBoundedSourcePixelReader(ctx,width,height){
  const rows=Math.max(1,Math.floor(MAX_PHOTO_READBACK_BYTES/(width*4)));
  let start=-1,storedRows=0,buffer=null;
  return {r:0,g:0,b:0,
    read(x,y){
      if(!buffer||y<start||y>=start+storedRows){
        start=Math.floor(y/rows)*rows;
        storedRows=Math.min(rows,height-start);
        buffer=ctx.getImageData(0,start,width,storedRows).data;
      }
      const i=((y-start)*width+x)*4;
      this.r=buffer[i];this.g=buffer[i+1];this.b=buffer[i+2];
    }
  };
}

// A neutral finish must not force a full-size Canvas2D getImageData and
// putImageData on a 19.8 MP export. This checks actual normalized parameters,
// not preset names: authored custom grading still runs, and the low-resolution
// webcam *always* retains its spatial capture operation even with neutral
// tone, grain and vignette.
export function isNeutralPhotoLook(look){
  if(['camera-webcam-signal','camera-digicam-signal','camera-dslr-optics',
      'camera-pocket-flash'].includes(look.presetId))return false;
  const p=look.parameters;
  return p.contrast===1&&p.saturation===1&&p.shadow===0&&p.highlight===0&&
    p.red===0&&p.green===0&&p.blue===0&&p.grain===0&&p.vignette===0&&
    (p.halation===undefined||p.halation===0);
}

// Mutates the supplied pixel array. Destination alpha is never touched.
// The grain grid is anchored in the authored 600x1300 frame, not device pixels.
export function processPhotoPixels(data,width,height,rawLook,seed='rainbow-001',
    {frameHeight=height,rowOffset=0,halationField=null,webcamField=null,lensField=null}={}){
  const look=normalizePhotoLook(rawLook);
  if(!look.enabled||look.amount===0)return data;
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<=0||height<=0||
    data.length!==width*height*4||!Number.isInteger(frameHeight)||
    !Number.isInteger(rowOffset)||rowOffset<0||frameHeight<rowOffset+height)
    throw new RangeError('Invalid photo pixel buffer');
  // Strip processing is exact only for finishes without a source-wide spatial
  // sample field. The remaining modes retain the original whole-frame path.
  if((rowOffset!==0||frameHeight!==height)&&
    ((['camera-webcam-signal','camera-digicam-signal'].includes(look.presetId)&&!webcamField)||
      (look.presetId==='camera-dslr-optics'&&!lensField)||
      (['film-halation-only','film-halation-diffusion'].includes(look.presetId)&&
       look.parameters.halation>0&&!halationField)))
    throw new RangeError('Spatial photo finish requires whole-frame source');
  if(isNeutralPhotoLook(look))return data;
  const p=look.parameters,amount=look.amount/100;
  const table=[p.red,p.green,p.blue].map(shift=>{
    const values=new Float32Array(256);
    for(let v=0;v<256;v++){
      let x=v/255;
      x=(x-.5)*p.contrast+.5+shift;
      x+=p.shadow*Math.pow(1-Math.max(0,Math.min(1,x)),2);
      x-=p.highlight*Math.pow(Math.max(0,Math.min(1,x)-.55),2);
      values[v]=Math.max(0,Math.min(1,x))*255;
    }
    return values;
  });
  const grain=p.grain/100*24, vignette=p.vignette/100;
  // Film grain only is a distinct opt-in effect, not a stronger print grade.
  // Mix fine emulsion speckles and low-frequency density variations in authored
  // coordinates. Keep the old single-scale sampler unchanged for existing
  // recipes: already saved images must not shift when a new preset is added.
  const layeredGrain=look.presetId==='film-grain-only';
  const webcamSignal=['camera-webcam-signal','camera-digicam-signal'].includes(look.presetId)?
    (webcamField||makeWebcamCapture(data,width,height,
      look.presetId==='camera-digicam-signal'?'digicam':'webcam')):null;
  const diffusedHalation=look.presetId==='film-halation-diffusion';
  const halation=(look.presetId==='film-halation-only'||diffusedHalation)&&p.halation>0?
    (halationField||makeHalationField(data,width,height,
      diffusedHalation?'diffusion':'original')):null;
  const lens=look.presetId==='camera-dslr-optics'?
    (lensField||makeLensAcutanceField(data,width,height)):null;
  // No extra image buffer or synthetic scene depth.
  const pocketFlash=look.presetId==='camera-pocket-flash';
  // The deep-black variant deliberately shares the legacy negative's grain
  // identity. Bright source pixels can therefore remain pixel-exactly equal.
  const grainPresetId=look.presetId==='film-negative-deepblack'?
    'film-negative':look.presetId;
  const hash=fastHash(String(seed)+':photo-v1:'+grainPresetId);
  const yScale=1300/frameHeight,xScale=600/width;
  let i=0;
  for(let y=0;y<height;y++){
    const sourceY=y+rowOffset;
    const ny=(sourceY+.5)/frameHeight*2-1;
    const yCell=Math.floor((sourceY+.5)*yScale);
    const signalRow=webcamSignal?
      Math.min(webcamSignal.height-1,Math.floor((sourceY+.5)/frameHeight*webcamSignal.height))*webcamSignal.width:0;
    const haloY=halation?(sourceY+.5)/frameHeight*halation.height-.5:0;
    const hy0=halation?Math.max(0,Math.min(halation.height-1,Math.floor(haloY))):0;
    const hy1=halation?Math.min(halation.height-1,hy0+1):0;
    const hfy=halation?Math.max(0,Math.min(1,haloY-hy0)):0;
    const lensY=lens?(sourceY+.5)/frameHeight*lens.height-.5:0;
    const ly0=lens?Math.max(0,Math.min(lens.height-1,Math.floor(lensY))):0;
    const ly1=lens?Math.min(lens.height-1,ly0+1):0;
    const lfy=lens?Math.max(0,Math.min(1,lensY-ly0)):0;
    for(let x=0;x<width;x++,i+=4){
      const r=data[i],g=data[i+1],b=data[i+2];
      // The cached simulated sensor never reads already graded destination
      // pixels. Other looks use the exact original direct RGB branch.
      const sample=webcamSignal?
        (signalRow+Math.min(webcamSignal.width-1,
          Math.floor((x+.5)/width*webcamSignal.width)))*3:0;
      let R=table[0][webcamSignal?webcamSignal.pixels[sample]:r],
        G=table[1][webcamSignal?webcamSignal.pixels[sample+1]:g],
        B=table[2][webcamSignal?webcamSignal.pixels[sample+2]:b];
      if(pocketFlash){
        // An on-axis small flash is brightest near image center and falls off
        // toward corners. Keep this cheap at full 19.8 MP export resolution.
        const flashX=(x+.5)/width*2-1;
        const radius=Math.min(1,flashX*flashX*.40+ny*ny*.60);
        const exposure=1.27-.38*radius;
        R*=exposure;G*=exposure;B*=exposure;
      }
      const luma=.2126*R+.7152*G+.0722*B;
      R=luma+(R-luma)*p.saturation;
      G=luma+(G-luma)*p.saturation;
      B=luma+(B-luma)*p.saturation;
      if(lens){
        const lensX=(x+.5)/width*lens.width-.5;
        const lx0=Math.max(0,Math.min(lens.width-1,Math.floor(lensX)));
        const lx1=Math.min(lens.width-1,lx0+1);
        const lfx=Math.max(0,Math.min(1,lensX-lx0));
        const top=lens.detail[ly0*lens.width+lx0]*(1-lfx)+
          lens.detail[ly0*lens.width+lx1]*lfx;
        const bottom=lens.detail[ly1*lens.width+lx0]*(1-lfx)+
          lens.detail[ly1*lens.width+lx1]*lfx;
        const highPass=top*(1-lfy)+bottom*lfy;
        // Small threshold avoids sharpening low-level noise; bounded neutral
        // luminance boost improves edge clarity without large colour halos.
        const acutance=Math.sign(highPass)*
          Math.min(18,Math.max(0,Math.abs(highPass)-1.3)*.7);
        R+=acutance;G+=acutance;B+=acutance;
      }
      const nx=(x+.5)/width*2-1;
      // Avoid millions of expensive pow() calls when the selected look has
      // no vignette (grain-only, halation-only, HDR). Nonzero paths unchanged.
      const falloff=vignette?Math.min(1,Math.pow(nx*nx*.7+ny*ny*.7,1.35)):0;
      const dark=1-vignette*falloff*.5;
      const perturb=grain?(
        layeredGrain
          ? (.8*noiseHash(Math.floor((x+.5)*xScale*2.4),Math.floor((sourceY+.5)*yScale*2.4),hash)+
             .2*noiseHash(Math.floor((x+.5)*xScale*.42),Math.floor((sourceY+.5)*yScale*.42),hash^0x9e3779b9))
          : noiseHash(Math.floor((x+.5)*xScale),yCell,hash)
        )*grain*(.65+.35*(1-luma/255)):0;
      let warmSpill=0;
      if(halation){
        const haloX=(x+.5)/width*halation.width-.5;
        const hx0=Math.max(0,Math.min(halation.width-1,Math.floor(haloX)));
        const hx1=Math.min(halation.width-1,hx0+1);
        const hfx=Math.max(0,Math.min(1,haloX-hx0));
        const top=halation.blurred[hy0*halation.width+hx0]*(1-hfx)+
          halation.blurred[hy0*halation.width+hx1]*hfx;
        const bottom=halation.blurred[hy1*halation.width+hx0]*(1-hfx)+
          halation.blurred[hy1*halation.width+hx1]*hfx;
        // Suppress spill in illuminated source pixels: glow belongs just
        // outside the edge, and black pixels need not change far away.
        const originalLuma=.2126*r+.7152*g+.0722*b;
        warmSpill=(top*(1-hfy)+bottom*hfy)/255*
          Math.max(0,1-originalLuma/185)*(p.halation/100);
      }
      // Film negative traditionally lifts the darkest tones to paper grey.
      // This separately named AMOLED-friendly variant leaves true black and
      // very deep near-black intact while keeping exactly the old processing
      // for original source luminance >= 22. No legacy preset changes.
      const shadowMask=look.presetId==='film-negative-deepblack'?
        Math.max(0,Math.min(1,(.2126*r+.7152*g+.0722*b)/22)):1;
      // Exact black represents the wallpaper substrate and cannot reflect
      // a direct flash; avoid lifting it with tone/grain in the opt-in look.
      const flashReflectance=pocketFlash?
        Math.max(0,Math.min(1,(.2126*r+.7152*g+.0722*b)/20)):1;
      const mix=amount*shadowMask*flashReflectance;
      // Wider red-biased photochemical-style diffusion has a clearly readable
      // warm fringe at wallpaper size; narrow halation retains original mix.
      data[i]=clampByte(r+(R*dark+perturb+warmSpill*(diffusedHalation?170:94)-r)*mix);
      data[i+1]=clampByte(g+(G*dark+perturb+warmSpill*(diffusedHalation?44:24)-g)*mix);
      data[i+2]=clampByte(b+(B*dark+perturb+warmSpill*(diffusedHalation?9:5)-b)*mix);
    }
  }
  return data;
}
export function applyPhotoFinish(ctx,width,height,rawLook,seed){
  if(!rawLook?.enabled||Number(rawLook.amount)===0)return false;
  const look=normalizePhotoLook(rawLook);
  if(isNeutralPhotoLook(look))return false;
  // For a preview already smaller than our 2 MiB readback budget, keep the
  // original single Canvas read/write. This avoids a redundant source pass
  // while retaining the exact preexisting spatial algorithms and pixels.
  if(width*height*4<=MAX_PHOTO_READBACK_BYTES){
    const pixels=ctx.getImageData(0,0,width,height);
    processPhotoPixels(pixels.data,width,height,look,seed);
    ctx.putImageData(pixels,0,0);
    return true;
  }
  // Every spatial source sample precedes the first destination write and
  // uses the very same four source pixels and arithmetic as the original
  // full-frame method. Only <=2 MiB of Canvas pixels are read at once;
  // Webcam/Digicam quantization, DSLR acutance and halation fields remain
  // bounded in authored coordinates and use the single Photo composer.
  const halationOn=['film-halation-only','film-halation-diffusion'].includes(look.presetId)&&
    look.parameters.halation>0;
  const signalOn=['camera-webcam-signal','camera-digicam-signal'].includes(look.presetId);
  const lensOn=look.presetId==='camera-dslr-optics';
  const reader=halationOn||signalOn||lensOn?
    makeBoundedSourcePixelReader(ctx,width,height):null;
  const halationField=halationOn?makeHalationField(null,width,height,
    look.presetId==='film-halation-diffusion'?'diffusion':'original',reader):null;
  const webcamField=signalOn?makeWebcamCapture(null,width,height,
    look.presetId==='camera-digicam-signal'?'digicam':'webcam',reader):null;
  const lensField=lensOn?makeLensAcutanceField(null,width,height,reader):null;
  const rows=Math.max(1,Math.floor(MAX_PHOTO_READBACK_BYTES/(width*4)));
  for(let y=0;y<height;y+=rows){
    const h=Math.min(rows,height-y);
    const pixels=ctx.getImageData(0,y,width,h);
    processPhotoPixels(pixels.data,width,h,look,seed,
      {frameHeight:height,rowOffset:y,halationField,webcamField,lensField});
    ctx.putImageData(pixels,0,y);
  }
  return true;
}
