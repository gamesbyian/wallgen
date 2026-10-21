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
    // Test overlap against the *original target*. An offscreen child has
    // zero intersection with the viewport already; comparing intersection
    // areas alone would incorrectly call a scrolled-away chip 'broken'.
    const crosses=(part.x&&(target.left<clip.left-.5||target.right>clip.right+.5))||
      (part.y&&(target.top<clip.top-.5||target.bottom>clip.bottom+.5));
    if(crosses||area(visible)<area(before)-.5){
      clipSources.push({kind:part.kind,element:part.element});
      if(part.kind==='scroll'&&crosses)scrollClipped=true;
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

/** Page-flow captures intentionally show only a scrolled document slice.
 * Offscreen controls outside that slice are not unreachable; only local
 * non-scrollable clipping should be reported in those screenshots. */
export function expectedPageScroll(scrollable,isFlowCapture,clipSources=[]){
  return Boolean(scrollable&&isFlowCapture&&!clipSources.some(c=>c.kind==='hidden'));
}

/**
 * Bounding-box triage for candidate touch targets, not a WCAG verdict:
 * spacing exceptions, painted pseudo-elements and actual pointer hit-tests
 * still require separate qualification.
 */
export function inspectTargetBox(rect){
  const width=Math.max(0,Number(rect.width??Number(rect.right)-Number(rect.left)));
  const height=Math.max(0,Number(rect.height??Number(rect.bottom)-Number(rect.top)));
  return {width:Math.round(width*10)/10,height:Math.round(height*10)/10,
    under24:width<24||height<24,
    under44:width<44||height<44};
}


/**
 * Candidate WCAG 2.2 SC 2.5.8 spacing-exception geometry for one custom target.
 *
 * The input rectangles must represent INDEPENDENT enabled pointer targets,
 * not an input plus its own associated clickable label. For a target under
 * 24x24 CSS px, the 24px-diameter circle centred on its bounding box must
 * not intersect another target, nor the corresponding 24px circle of a
 * different undersized target. Tangency does not count as intersection.
 *
 * Rectangle-only triage is intentionally conservative: rounded paint regions,
 * pseudo-element targets, DOM stacking, equivalents and other exemptions
 * need live browser inspection before a WCAG verdict is possible.
 */
export function inspectTargetSpacing(rect,neighbourRects=[]){
  const size=inspectTargetBox(rect);
  if(!size.under24)return {under24:false,spacingCandidatePass:true,conflictingIndices:[]};
  const own=bounds(rect);
  const cx=(own.left+own.right)/2,cy=(own.top+own.bottom)/2;
  const conflicts=[];
  neighbourRects.forEach((other,index)=>{
    const peer=bounds(other);
    if(!area(peer))return;
    const peerSize=inspectTargetBox(other);
    let squaredDistance;
    if(peerSize.under24){
      const dx=cx-(peer.left+peer.right)/2;
      const dy=cy-(peer.top+peer.bottom)/2;
      // Two radius-12px exclusion circles intersect below 24px centres.
      squaredDistance=dx*dx+dy*dy;
      if(squaredDistance<24*24-1e-9)conflicts.push(index);
    }else{
      // Distance from small circle centre to closest point on another target.
      const nx=Math.max(peer.left,Math.min(cx,peer.right));
      const ny=Math.max(peer.top,Math.min(cy,peer.bottom));
      squaredDistance=(cx-nx)**2+(cy-ny)**2;
      if(squaredDistance<12*12-1e-9)conflicts.push(index);
    }
  });
  return {under24:true,spacingCandidatePass:conflicts.length===0,
    conflictingIndices:conflicts};
}
