// A one-pointer viewport framing transaction. CSS-pixel movement determines
// input gain but saved camera offsets stay percentages of the design plane.
// No image pixels, raster offsets or composition nudge enter the recipe.
const finite=Number.isFinite;
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
  // The pointer must move perceptibly before editing any source value.
  if(Math.hypot(dx,dy)<2)return {...state,panX:state.startX,
    panY:state.startY,displacementX:0,displacementY:0,moved:false};
  const panX=round(clamp(state.startX-100*dx/(state.viewport.width*state.zoom),-50,50));
  const panY=round(clamp(state.startY-100*dy/(state.viewport.height*state.zoom),-50,50));
  // Preview uses the actual clamped camera movement, never unchecked dx/dy.
  const displacementX=-(panX-state.startX)*state.viewport.width*state.zoom/100;
  const displacementY=-(panY-state.startY)*state.viewport.height*state.zoom/100;
  return {...state,panX,panY,displacementX,displacementY,
    moved:panX!==state.startX||panY!==state.startY};
}
