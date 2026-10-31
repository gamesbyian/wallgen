// CSS-screen gesture math only. A radius remains normalized to the
// authored 600-unit plane by the existing scattered override writer.
// Never persist pointer coordinates or CSS pixels in artwork recipes.
const finite=Number.isFinite;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function beginScatteredScale({circle,centre,point,minRadius=18}={}){
  if(!circle||!centre||!point||
    ![circle.r,centre.x,centre.y,point.x,point.y,minRadius].every(finite)||
    circle.r<=0||minRadius<0)return null;
  const distance=Math.hypot(point.x-centre.x,point.y-centre.y);
  if(distance<minRadius)return null;
  return {originalRadius:circle.r,radius:circle.r,centre:{...centre},
    startingDistance:distance,moved:false};
}
export function advanceScatteredScale(state,point){
  if(!state||!point||![point.x,point.y].every(finite))return state;
  const distance=Math.hypot(point.x-state.centre.x,point.y-state.centre.y);
  // A user dragging through the centre may shrink to the true minimum.
  // The unchanged starting distance keeps movement continuous and non-accumulating.
  const radius=clamp(state.originalRadius*distance/state.startingDistance,6,720);
  return {...state,radius,moved:Math.abs(radius-state.originalRadius)>1e-4};
}
