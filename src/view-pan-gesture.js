// A one-pointer viewport framing transaction. CSS-pixel movement determines
// input gain but saved camera offsets stay percentages of the design plane.
// No image pixels, raster offsets or composition nudge enter the recipe.
import {AXIS_LOCK_THRESHOLD_CSS_PX} from './axis-constrained-drag.js';
const finite=Number.isFinite;
export const VIEW_PAN_INTENT_CSS_PX=AXIS_LOCK_THRESHOLD_CSS_PX;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const round=v=>Math.round(v*10)/10;
export function beginViewPan({recipe,point,viewport}={}){
  if(!recipe||!point||!viewport||
    ![point.x,point.y,viewport.width,viewport.height,
      recipe.viewZoom,recipe.viewPanX,recipe.viewPanY].every(finite)||
    viewport.width<=0||viewport.height<=0||recipe.viewZoom<=0)return null;
  return {origin:{...point},viewport:{...viewport},zoom:recipe.viewZoom,
    startX:recipe.viewPanX,startY:recipe.viewPanY,
    panX:recipe.viewPanX,panY:recipe.viewPanY,
    displacementX:0,displacementY:0,moved:false};
}
export function advanceViewPan(state,point){
  if(!state||!point||![point.x,point.y].every(finite))return state;
  const dx=point.x-state.origin.x,dy=point.y-state.origin.y;
  // Shared touch intent gate: a tiny contact jitter must not write
  // camera history. Subtract the dead zone in the original drag direction so
  // the first accepted sample never teleports the canvas by eight pixels.
  const distance=Math.hypot(dx,dy);
  if(distance<=VIEW_PAN_INTENT_CSS_PX)return {...state,panX:state.startX,
    panY:state.startY,displacementX:0,displacementY:0,moved:false};
  const gain=(distance-VIEW_PAN_INTENT_CSS_PX)/distance;
  const panX=round(clamp(state.startX-100*dx*gain/(state.viewport.width*state.zoom),-50,50));
  const panY=round(clamp(state.startY-100*dy*gain/(state.viewport.height*state.zoom),-50,50));
  // Preview uses the actual clamped camera movement, never unchecked dx/dy.
  const displacementX=-(panX-state.startX)*state.viewport.width*state.zoom/100;
  const displacementY=-(panY-state.startY)*state.viewport.height*state.zoom/100;
  return {...state,panX,panY,displacementX,displacementY,
    moved:panX!==state.startX||panY!==state.startY};
}

const roundZoom=value=>Math.round(value*100)/100;
function midpoint(first,second){
  return {x:(first.x+second.x)/2,y:(first.y+second.y)/2};
}
function validPoint(point){
  return point&&Number.isFinite(point.x)&&Number.isFinite(point.y);
}
/** A camera-only, two-touch transaction. The world point beneath the finger
 * midpoint stays under that midpoint while the touches spread and translate.
 * All input distances are CSS pixels; only zoom/pan enter saved recipes. */
export function beginViewPinch({recipe,first,second,viewport}={}){
  if(!recipe||!validPoint(first)||!validPoint(second)||!viewport||
     ![viewport.width,viewport.height,recipe.viewZoom,
       recipe.viewPanX,recipe.viewPanY].every(finite)||
     viewport.width<=0||viewport.height<=0||recipe.viewZoom<=0)return null;
  const separation=Math.hypot(first.x-second.x,first.y-second.y);
  if(separation<24)return null;
  return {startZoom:recipe.viewZoom,startX:recipe.viewPanX,
    startY:recipe.viewPanY,startCentre:midpoint(first,second),
    startSeparation:separation,viewport:{width:viewport.width,
      height:viewport.height},zoom:recipe.viewZoom,
    panX:recipe.viewPanX,panY:recipe.viewPanY,moved:false};
}
export function advanceViewPinch(state,first,second){
  if(!state||!validPoint(first)||!validPoint(second))return state;
  const separation=Math.hypot(first.x-second.x,first.y-second.y);
  if(!Number.isFinite(separation))return state;
  const centre=midpoint(first,second);
  const zoom=roundZoom(clamp(state.startZoom*separation/state.startSeparation,.5,2.5));
  const w=state.viewport.width,h=state.viewport.height;
  // A fixed world anchor under the initial midpoint is invariant to zoom.
  const panX=round(clamp(state.startX+
    100*(state.startCentre.x/w-.5)/state.startZoom-
    100*(centre.x/w-.5)/zoom,-50,50));
  const panY=round(clamp(state.startY+
    100*(state.startCentre.y/h-.5)/state.startZoom-
    100*(centre.y/h-.5)/zoom,-50,50));
  return {...state,zoom,panX,panY,
    moved:zoom!==state.startZoom||panX!==state.startX||panY!==state.startY};
}
/** Approximate only the transient gesture preview; settle via actual renderer.
 * Transform-origin is the centre of the preview canvas. */
export function viewPinchPreview(original,next,viewport){
  if(!original||!next||!viewport||
    ![original.viewZoom,original.viewPanX,original.viewPanY,
      next.zoom,next.panX,next.panY,viewport.width,viewport.height].every(finite)||
    original.viewZoom<=0||next.zoom<=0||viewport.width<=0||viewport.height<=0)return null;
  return {scale:next.zoom/original.viewZoom,
    x:viewport.width*next.zoom*(original.viewPanX-next.panX)/100,
    y:viewport.height*next.zoom*(original.viewPanY-next.panY)/100};
}
