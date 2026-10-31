// Transient authored node hit disambiguation; CSS distances only.
const finite=Number.isFinite;
const key=ids=>ids.slice().sort().join('|');
const validPoint=p=>Array.isArray(p)&&p.length===2&&p.every(finite);
export function continuesVectorTapCycle(previous,ids,at,time){
  return Boolean(previous&&Array.isArray(ids)&&ids.length>1&&
    validPoint(at)&&finite(time)&&previous.stable===key(ids)&&
    ids.includes(previous.selectedId)&&time>=previous.time&&
    time-previous.time<=1200&&
    Math.hypot(at[0]-previous.at[0],at[1]-previous.at[1])<=24);
}
export function vectorTapCycle(previous,ids,at,time){
  if(!Array.isArray(ids)||!ids.length||!validPoint(at)||!finite(time))
    return {selectedId:null,state:null};
  const repeat=continuesVectorTapCycle(previous,ids,at,time);
  const order=repeat?previous.order:ids.slice();
  const index=repeat?order.indexOf(previous.selectedId):-1;
  const selectedId=order[(index+1)%order.length];
  return {selectedId,state:order.length>1?{
    stable:key(order),order,selectedId,at:at.slice(),time
  }:null};
}
