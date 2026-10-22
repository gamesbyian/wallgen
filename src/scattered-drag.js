// Pure camera math and hit testing for on-canvas manipulation of scattered
// regions. Rendering and recipe normalization stay in the original modules.
import {viewCamera} from './view-camera.js';
import {normalizeScatteredOverrides} from './scattered-object-edits.js';
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function project(recipe,width,height){
  const camera=viewCamera(width,height,recipe.viewZoom,
    {panX:recipe.viewPanX,panY:recipe.viewPanY});
  return {camera,nudgeX:width*(Number(recipe.positionX)||0)/100,
    nudgeY:height*(Number(recipe.positionY)||0)/100};
}
export function scatteredWorldToPixel(recipe,width,height,x,y){
  const {camera,nudgeX,nudgeY}=project(recipe,width,height);
  return {x:camera.offsetX+camera.scaleX*x+nudgeX,
    y:camera.offsetY+camera.scaleY*y+nudgeY,
    radiusScaleX:camera.scaleX,radiusScaleY:camera.scaleY};
}
export function scatteredPixelToWorld(recipe,width,height,x,y){
  const {camera,nudgeX,nudgeY}=project(recipe,width,height);
  return {x:(x-camera.offsetX-nudgeX)/camera.scaleX,
    y:(y-camera.offsetY-nudgeY)/camera.scaleY};
}
const finite=n=>typeof n==='number'&&Number.isFinite(n);
export function pointInRing(point,ring){
  if(!Array.isArray(ring)||ring.length<3)return false;
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i],b=ring[j];
    if(!finite(a?.x)||!finite(a?.y)||!finite(b?.x)||!finite(b?.y))continue;
    if((a.y>point.y)!==(b.y>point.y)&&
      point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
}
export function pickScatteredRegion(objects,point,tolerance=0){
  // Canvas paints later objects above earlier ones: select topmost hit.
  for(const object of [...(objects||[])].reverse()){
    if(object.kind!=='region')continue;
    if(object.circle){
      const {cx,cy,r}=object.circle;
      if(Math.hypot(point.x-cx,point.y-cy)<=r+tolerance)return object;
    }else if(Array.isArray(object.rings)){
      const inside=object.rings.reduce((hit,ring)=>hit!==pointInRing(point,ring),false);
      if(inside)return object; // Even-odd holes and detached islands.
    }
  }
  return null;
}
export function scatteredMoveOverride(recipe,index,circle,world){
  if(!Number.isInteger(index)||index<0||index>=70||
     !circle||!finite(circle.r)||!finite(world?.x)||!finite(world?.y))
    return normalizeScatteredOverrides(recipe.scatteredOverrides);
  const other=normalizeScatteredOverrides(recipe.scatteredOverrides)
    .filter(entry=>entry.index!==index);
  return normalizeScatteredOverrides([...other,{index,
    x:clamp(world.x/600,-.5,1.5),
    y:clamp(world.y/1300,-.5,1.5),
    radius:clamp(circle.r/600,.01,1.2)}]);
}
