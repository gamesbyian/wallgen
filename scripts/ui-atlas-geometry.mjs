/**
 * Pure viewport/ancestor geometry helpers for the screenshot-atlas UI audit.
 * No DOM/browser globals: deliberate scroll clipping is differentiated from
 * non-scrollable clipping and missing viewport visibility.
 */
export function bounds(rect){
  const l=Number(rect.left),t=Number(rect.top),r=Number(rect.right),b=Number(rect.bottom);
  return {left:l,top:t,right:r,bottom:b};
}
export function intersect(a,b){
  return {left:Math.max(a.left,b.left),top:Math.max(a.top,b.top),
    right:Math.min(a.right,b.right),bottom:Math.min(a.bottom,b.bottom)};
}
export function area(r){
  return Math.max(0,r.right-r.left)*Math.max(0,r.bottom-r.top);
}
export function inspectGeometry(rect,viewport,clips=[]){
  const target=bounds(rect);
  const originalArea=area(target);
  if(!originalArea)return {visibleFraction:0,missingPixels:0,offscreen:false,
    clipped:false,scrollClipped:false,clipSources:[]};
  let visible=intersect(target,bounds(viewport));
  let scrollClipped=false;
  const clipSources=[];
  // Each axis can scroll independently, so horizontal chip strips are not
  // mistaken for broken controls while vertically clipped labels still count.
  for(const part of clips){
    const clip=bounds(part.bounds);
    const before={...visible};
    if(part.x){visible.left=Math.max(visible.left,clip.left);
      visible.right=Math.min(visible.right,clip.right);}
    if(part.y){visible.top=Math.max(visible.top,clip.top);
      visible.bottom=Math.min(visible.bottom,clip.bottom);}
    if(area(visible)<area(before)-.5){
      clipSources.push({kind:part.kind,element:part.element});
      if(part.kind==='scroll')scrollClipped=true;
    }
  }
  const fraction=Math.max(0,Math.min(1,area(visible)/originalArea));
  const dx=Math.max(0,visible.left-target.left)+Math.max(0,target.right-visible.right);
  const dy=Math.max(0,visible.top-target.top)+Math.max(0,target.bottom-visible.bottom);
  const missingPixels=Math.round(Math.max(dx,dy));
  const offscreen=area(visible)<1;
  // Report meaningful and non-scrollable action clipping, not a transient
  // 1px font-edge discrepancy at the viewport boundary.
  return {visibleFraction:Math.round(fraction*1000)/1000,missingPixels,
    offscreen,clipped:!scrollClipped&&fraction<.82&&missingPixels>=8,
    scrollClipped,clipSources};
}
