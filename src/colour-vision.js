// Pure, offline colour-vision simulation. Does not read or modify recipe state.
// Machado et al. 2009, linear sRGB; severity matrices reproduced with provenance
// and upstream MIT notice in ./colour-vision-matrices.js.
import {MACHADO_MATRICES} from './colour-vision-matrices.js';
import {BRETTEL_TRITAN} from './colour-vision-brettel.js';

export const COLOUR_VISION_MODES=Object.freeze(['original','protan','deutan','tritan']);
const LUT_SIZE=16384;
const decode=new Float64Array(256);
const encode=new Uint8ClampedArray(LUT_SIZE+1);
for(let i=0;i<256;i++){
  const c=i/255;
  decode[i]=c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4;
}
for(let i=0;i<=LUT_SIZE;i++){
  const c=i/LUT_SIZE;
  const v=c<=0.0031308?12.92*c:1.055*c**(1/2.4)-0.055;
  encode[i]=Math.round(Math.min(1,Math.max(0,v))*255);
}

function validate(mode,severity){
  if(!COLOUR_VISION_MODES.includes(mode))throw new RangeError('Unknown colour-vision mode: '+mode);
  if(typeof severity!=='number'||!Number.isFinite(severity)||severity<0||severity>1)
    throw new RangeError('Colour-vision severity must be a finite number from 0 to 1');
}
const clamp01=n=>n<=0?0:n>=1?1:n;
function encodeLinear(n){
  // <= one quantization step away from the exact sRGB transfer function.
  return encode[Math.round(clamp01(n)*LUT_SIZE)];
}
// Tabulated Machado transform exposed for reference validation.
// The tritan image simulation uses Brettel 1997 instead.
export function machadoMatrix(mode,severity=1){
  validate(mode,severity);
  if(mode==='original'||severity===0)return [1,0,0,0,1,0,0,0,1];
  const key=severity*10;
  const lo=Math.min(10,Math.floor(key));
  const hi=Math.min(10,lo+1);
  const t=key-lo;
  const a=MACHADO_MATRICES[mode][lo],b=MACHADO_MATRICES[mode][hi];
  return t===0?a.slice():a.map((v,i)=>v+(b[i]-v)*t);
}
function simulatedLinear(r,g,b,m,mode,severity){
  let transform=m;
  if(mode==='tritan'){
    const {separation,wing1,wing2}=BRETTEL_TRITAN;
    transform=(r*separation[0]+g*separation[1]+b*separation[2])>=0?wing1:wing2;
  }
  const R=r*transform[0]+g*transform[1]+b*transform[2];
  const G=r*transform[3]+g*transform[4]+b*transform[5];
  const B=r*transform[6]+g*transform[7]+b*transform[8];
  if(mode==='tritan'&&severity<1){
    // Tritanopia is Brettel-grounded, intermediate tritanomaly is approximate.
    const remain=1-severity;
    return [R*severity+r*remain,G*severity+g*remain,B*severity+b*remain];
  }
  return [R,G,B];
}
export function simulateRgb(rgb,mode,severity=1){
  const m=machadoMatrix(mode,severity);
  if(!rgb||rgb.length!==3||!Array.from(rgb).every(v=>Number.isInteger(v)&&v>=0&&v<=255))
    throw new RangeError('RGB must contain exactly three 8-bit channels');
  if(mode==='original'||severity===0)return Array.from(rgb);
  const r=decode[rgb[0]],g=decode[rgb[1]],b=decode[rgb[2]];
  return simulatedLinear(r,g,b,m,mode,severity).map(encodeLinear);
}

/**
 * Allocates an isolated, resumable pixel conversion job. processPixels() can
 * run in small batches on the main thread without blocking UI for a full
 * 600x1300 frame, or in one large batch inside a Worker.
 *
 * A job's data is its OWN buffer. The input RGBA and alpha remain unchanged.
 */
export function createColourVisionJob(source,mode,severity=1){
  const m=machadoMatrix(mode,severity);
  const {width,height,data}=source||{};
  if(!Number.isSafeInteger(width)||width<1||!Number.isSafeInteger(height)||height<1||
      width*height>100_000_000||!data||data.length!==width*height*4||
      !(data instanceof Uint8Array||data instanceof Uint8ClampedArray))
    throw new TypeError('Expected positive RGBA ImageData with 8-bit pixels');
  const output=new Uint8ClampedArray(data);
  const result={width,height,data:output};
  const identity=mode==='original'||severity===0;
  const tritan=mode==='tritan';
  const {separation,wing1,wing2}=BRETTEL_TRITAN;
  return {
    result,
    processPixels(start,end){
      if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||
          start<0||end<start||end>width*height)
        throw new RangeError('Invalid pixel range for colour-vision job');
      if(identity)return;
      for(let index=start;index<end;index++){
        const i=index*4;
        const r=decode[data[i]],g=decode[data[i+1]],b=decode[data[i+2]];
        const transform=tritan?
          (r*separation[0]+g*separation[1]+b*separation[2]>=0?wing1:wing2):m;
        let R=r*transform[0]+g*transform[1]+b*transform[2];
        let G=r*transform[3]+g*transform[4]+b*transform[5];
        let B=r*transform[6]+g*transform[7]+b*transform[8];
        if(tritan&&severity<1){
          // Full tritanopia uses Brettel 1997. Partial tritanomaly is a
          // documented approximation, interpolated in linear RGB.
          R=r+(R-r)*severity;
          G=g+(G-g)*severity;
          B=b+(B-b)*severity;
        }
        output[i]=encodeLinear(R);
        output[i+1]=encodeLinear(G);
        output[i+2]=encodeLinear(B);
        // No write to output[i+3] (alpha).
      }
    }
  };
}

/** Complete synchronous conversion, intended for workers/tests. */
export function simulateImageData(source,mode,severity=1){
  const job=createColourVisionJob(source,mode,severity);
  job.processPixels(0,job.result.width*job.result.height);
  return job.result;
}
