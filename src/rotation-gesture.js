// Shared touch rotation geometry. No DOM and no recipe ownership.
// Preserves the distinct semantics of cyclic rotations and bounded sweeps.
export const ROTATION_FIELD_SPECS=Object.freeze({
  textureRotation:{min:0,max:360,wrap:true,step:.1},
  textureRotation2:{min:0,max:360,wrap:true,step:.1},
  textureRotation3:{min:0,max:360,wrap:true,step:.1},
  diagonalRotation:{min:-180,max:180,wrap:false,step:1},
  rayRotation:{min:-180,max:180,wrap:false,step:1},
  rayTwist:{min:-180,max:180,wrap:false,step:1},
  hairpinAngle:{min:60,max:180,wrap:false,step:1},
  loopSweep:{min:240,max:450,wrap:false,step:1},
});
const finite=n=>Number.isFinite(n);
export const shortestAngularDifference=(from,to)=>{
  if(!finite(from)||!finite(to))return 0;
  return ((to-from+180)%360+360)%360-180;
};
export function canonicalAngle(raw,spec){
  if(!spec||!finite(raw))throw new TypeError('A finite rotation and a field specification are required');
  const step=spec.step||.1;
  const rounded=Math.round(raw/step)*step;
  if(spec.wrap){
    const period=spec.max-spec.min;
    if(period<=0)throw new RangeError('Invalid cyclic range');
    const wrapped=((rounded-spec.min)%period+period)%period+spec.min;
    return Number(wrapped.toFixed(7));
  }
  return Number(Math.max(spec.min,Math.min(spec.max,rounded)).toFixed(7));
}
export function magneticAngle(raw,{interval=0,held=null,acquire=2,release=4}={}){
  if(!finite(raw)||!finite(interval)||interval<=0)return {value:raw,held:null};
  // held is a RAW, potentially multi-revolution target. Do not wrap it;
  // a 450-degree geometric sweep must remain distinct from a 90-degree angle.
  if(held!==null&&finite(held)&&Math.abs(raw-held)<=release)
    return {value:held,held};
  const candidate=Math.round(raw/interval)*interval;
  if(Math.abs(raw-candidate)<=acquire)return {value:candidate,held:candidate};
  return {value:raw,held:null};
}
export const ROTATION_DRAG_GAINS=Object.freeze({fine:.04,normal:.45,fast:1.6});
export function beginRotationDrag({value,x,y,snap=45}){
  if(![value,x,y].every(finite))throw new TypeError('Rotation drag needs finite start coordinates/value');
  return {raw:value,value,lastX:x,startY:y,held:null,snap};
}
export function advanceRotationDrag(state,{x,y}){
  if(!state||![x,y].every(finite))return state;
  const dy=y-state.startY;
  const mode=dy>=42?'fine':dy<=-42?'fast':'normal';
  const delta=x-state.lastX;
  const raw=state.raw+delta*ROTATION_DRAG_GAINS[mode];
  // A vertical-only sensitivity switch must never change the angle.
  if(delta===0)return {...state,lastX:x,mode};
  const result=magneticAngle(raw,{interval:state.snap,held:state.held});
  return {...state,raw,lastX:x,value:result.value,held:result.held,mode};
}
export function pointerAngularDelta(start,current,pivot){
  if(!start||!current||!pivot)return 0;
  const coords=[start.x,start.y,current.x,current.y,pivot.x,pivot.y];
  if(!coords.every(finite))return 0;
  const a=Math.atan2(start.y-pivot.y,start.x-pivot.x)*180/Math.PI;
  const b=Math.atan2(current.y-pivot.y,current.x-pivot.x)*180/Math.PI;
  return shortestAngularDifference(a,b);
}
