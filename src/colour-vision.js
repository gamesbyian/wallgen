// Pure, offline colour-vision simulation. Does not read or modify recipe state.
// Machado et al. 2009, linear sRGB; severity matrices reproduced with provenance
// and upstream MIT notice in ./colour-vision-matrices.js.
import {MACHADO_MATRICES} from './colour-vision-matrices.js';

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
export function colourVisionMatrix(mode,severity=1){
  validate(mode,severity);
  if(mode==='original'||severity===0)return [1,0,0,0,1,0,0,0,1];
  const key=severity*10;
  const lo=Math.min(10,Math.floor(key));
  const hi=Math.min(10,lo+1);
  const t=key-lo;
  const a=MACHADO_MATRICES[mode][lo],b=MACHADO_MATRICES[mode][hi];
  return t===0?a.slice():a.map((v,i)=>v+(b[i]-v)*t);
}
export function simulateRgb(rgb,mode,severity=1){
  const m=colourVisionMatrix(mode,severity);
  if(!rgb||rgb.length!==3||!Array.from(rgb).every(v=>Number.isInteger(v)&&v>=0&&v<=255))
    throw new RangeError('RGB must contain exactly three 8-bit channels');
  if(mode==='original'||severity===0)return Array.from(rgb);
  const r=decode[rgb[0]],g=decode[rgb[1]],b=decode[rgb[2]];
  return [
    encodeLinear(r*m[0]+g*m[1]+b*m[2]),
    encodeLinear(r*m[3]+g*m[4]+b*m[5]),
    encodeLinear(r*m[6]+g*m[7]+b*m[8])
  ];
}

/**
 * Operates on a canvas ImageData-like object, returning a newly owned array.
 * The provided pixels, alpha and image geometry are never altered.
 * The consumer may construct ImageData(result.data,result.width,result.height).
 */
export function simulateImageData(source,mode,severity=1){
  const m=colourVisionMatrix(mode,severity);
  const {width,height,data}=source||{};
  if(!Number.isSafeInteger(width)||width<1||!Number.isSafeInteger(height)||height<1||
      width*height>100_000_000||!data||data.length!==width*height*4||
      !(data instanceof Uint8Array||data instanceof Uint8ClampedArray))
    throw new TypeError('Expected positive RGBA ImageData with 8-bit pixels');
  // Explicitly copy even for identity to keep source and result independent.
  const output=new Uint8ClampedArray(data);
  if(mode==='original'||severity===0)return {width,height,data:output};
  for(let i=0;i<output.length;i+=4){
    const r=decode[data[i]],g=decode[data[i+1]],b=decode[data[i+2]];
    output[i]  =encodeLinear(r*m[0]+g*m[1]+b*m[2]);
    output[i+1]=encodeLinear(r*m[3]+g*m[4]+b*m[5]);
    output[i+2]=encodeLinear(r*m[6]+g*m[7]+b*m[8]);
    // Alpha remains copied verbatim. The overlay canvas is never exported.
  }
  return {width,height,data:output};
}
