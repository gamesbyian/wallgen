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
// Boundary-distance hit assistance for an imported vector silhouette. The
// painter's even-odd fill remains authoritative; this is a transient pointer
// target only, and must never create painted or serialized geometry.
function nearRingEdge(point,ring,reachSquared){
  if(!Array.isArray(ring)||ring.length<3)return false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[j],b=ring[i];
    if(!finite(a?.x)||!finite(a?.y)||!finite(b?.x)||!finite(b?.y))continue;
    const dx=b.x-a.x,dy=b.y-a.y,lengthSquared=dx*dx+dy*dy;
    const t=lengthSquared>0?clamp(((point.x-a.x)*dx+(point.y-a.y)*dy)/lengthSquared,0,1):0;
    const x=point.x-a.x-t*dx,y=point.y-a.y-t*dy;
    if(x*x+y*y<=reachSquared)return true;
  }
  return false;
}
/** All intersected painted regions, frontmost first. The caller decides
 * whether to pick immediately or cycle; never alter scene/paint order. */
export function hitScatteredRegions(objects,point,tolerance=0){
  if(!finite(point?.x)||!finite(point?.y)||!Array.isArray(objects))return [];
  const hits=[];
  // Current painter draws the last scene object last, above earlier layers.
  for(let i=objects.length-1;i>=0;i--){
    const object=objects[i];
    if(object?.kind!=='region')continue;
    let inside=false;
    if(object.circle){
      const {cx,cy,r}=object.circle;
      inside=finite(cx)&&finite(cy)&&finite(r)&&r>=0&&
        Math.hypot(point.x-cx,point.y-cy)<=r+Math.max(0,tolerance);
    }else if(Array.isArray(object.rings)){
      // Exactly the existing even-odd semantics, retaining real compound
      // holes and disconnected islands. No raster hit map is introduced.
      inside=object.rings.reduce((hit,ring)=>hit!==pointInRing(point,ring),false);
      // The circular editor already offers a finger-sized outer reach.
      // Give irregular silhouettes the same courtesy near OUTER edges,
      // without making a genuine cutout/hole or overlapping even-odd void
      // selectable. Points contained by any ring are not outer-edge taps.
      const reach=finite(tolerance)?Math.max(0,tolerance):0;
      if(!inside&&reach>0&&!object.rings.some(ring=>pointInRing(point,ring)))
        inside=object.rings.some(ring=>nearRingEdge(point,ring,reach*reach));
    }
    if(inside)hits.push(object);
  }
  return hits;
}
export function pickScatteredRegion(objects,point,tolerance=0){
  return hitScatteredRegions(objects,point,tolerance)[0]||null;
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

// The immutable normalized recipe object identifies the exact transaction
// incarnation. An Undo that recreates identical values still revokes an older
// pointer owner. Selection is checked independently because a picker may
// change without replacing the recipe at all.
export function scatteredGestureOwnsCurrentRecipe(gesture,recipe,selectedIndex){
  return !!recipe&&typeof recipe==='object'&&
    gesture?.original===recipe&&Number.isInteger(gesture.index)&&
    Number.isInteger(selectedIndex)&&gesture.index===selectedIndex;
}
