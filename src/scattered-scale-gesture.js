// CSS-screen gesture math only. A radius remains normalized to the
// authored 600-unit plane by the existing scattered override writer.
// Never persist pointer coordinates or CSS pixels in artwork recipes.
const finite=Number.isFinite;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const SCATTERED_SCALE_INTENT_CSS=8;
const finiteXY=p=>p&&finite(p.x)&&finite(p.y);
export function beginScatteredScale({circle,centre,point,minRadius=18}={}){
  if(!circle||!centre||!point||
    ![circle.r,centre.x,centre.y,point.x,point.y,minRadius].every(finite)||
    circle.r<=0||minRadius<0)return null;
  const distance=Math.hypot(point.x-centre.x,point.y-centre.y);
  if(distance<minRadius)return null;
  return {originalRadius:circle.r,radius:circle.r,centre:{...centre},
    startingDistance:distance,start:{...point},moved:false};
}
export function advanceScatteredScale(state,point){
  if(!state||!point||![point.x,point.y].every(finite))return state;
  const distance=Math.hypot(point.x-state.centre.x,point.y-state.centre.y);
  // A user dragging through the centre may shrink to the true minimum.
  // The unchanged starting distance keeps movement continuous and non-accumulating.
  const radius=clamp(state.originalRadius*distance/state.startingDistance,6,720);
  return {...state,radius,moved:
    Math.hypot(point.x-state.start.x,point.y-state.start.y)>=SCATTERED_SCALE_INTENT_CSS&&
    Math.abs(radius-state.originalRadius)>1e-4};
}

// Scale the ORIGINAL immutable region placement around an authored-world pivot.
// Its unchanged pivot is the opposing actual silhouette/circle bounding edge.
// Similarity scaling preserves imported polygon rings, disconnected islands,
// even-odd cutouts and source coordinate units without introducing new fields.
export function anchoredScatteredCircle(original,anchor,radius){
  if(!original||!finiteXY(anchor)||
     ![original.cx,original.cy,original.r,radius].every(finite)||
     original.r<=0)return null;
  const r=clamp(radius,6,720),factor=r/original.r;
  return {cx:anchor.x+(original.cx-anchor.x)*factor,
    cy:anchor.y+(original.cy-anchor.y)*factor,r};
}
// Anchored resizing uses the CSS horizontal distance from the opposite fixed
// edge to the actual detached finger grip. That keeps motion non-accumulating
// even if the shape, canvas or editor grip is away from its nominal centre.
export function beginScatteredAnchoredScale({
  circle,anchor,point,gripX,anchorX,minSpan=24
}={}){
  if(!circle||!finiteXY(anchor)||!finiteXY(point)||
     ![circle.cx,circle.cy,circle.r,gripX,anchorX,minSpan].every(finite)||
     circle.r<=0||minSpan<=0||Math.abs(gripX-anchorX)<minSpan)return null;
  return {originalCircle:{...circle},anchor:{...anchor},start:{...point},
    span:gripX-anchorX,circle:{...circle},moved:false};
}
export function advanceScatteredAnchoredScale(state,point){
  if(!state||!finiteXY(point))return state;
  const next=anchoredScatteredCircle(state.originalCircle,state.anchor,
    state.originalCircle.r*(1+(point.x-state.start.x)/state.span));
  if(!next)return state;
  return {...state,circle:next,moved:
    Math.hypot(point.x-state.start.x,point.y-state.start.y)>=SCATTERED_SCALE_INTENT_CSS&&
    Math.abs(next.r-state.originalCircle.r)>1e-4};
}
