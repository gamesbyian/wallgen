// E4 chain stitch source topology. These are the very same authored cubics
// traced by the ribbon painter, not raster contours or an invented height map.
// All coordinates are canonical artwork units, independent of camera/export.
import {segmentIntersection} from './crossing-order.js';

const finite=Number.isFinite;
const validPoint=p=>finite(p?.x)&&finite(p?.y)&&
  Math.abs(p.x)<=1e6&&Math.abs(p.y)<=1e6;

export function chainLinkCurves(x,y,tx,ty,nx,ny,half,loft,shift=0){
  if(![x,y,tx,ty,nx,ny,half,loft,shift].every(finite)||
     half<=0||loft<=0)return null;
  const cx=x+nx*shift,cy=y+ny*shift;
  const point=(along,across)=>({x:cx+tx*along+nx*across,
    y:cy+ty*along+ny*across});
  const a=point(-half,0),b=point(half,0);
  const upper1=point(-half*.55,loft),upper2=point(half*.6,loft);
  const lower1=point(half*.6,-loft),lower2=point(-half*.55,-loft);
  const curves=[[a,upper1,upper2,b],[b,lower1,lower2,a]];
  return curves.every(c=>c.every(validPoint))?curves:null;
}

export function traceChainLink(ctx,curves,sx=0,sy=0){
  if(!Array.isArray(curves)||curves.length!==2)return false;
  ctx.beginPath();
  for(let k=0;k<2;k++){
    const [a,b,c,d]=curves[k]||[];
    if(![a,b,c,d].every(validPoint))return false;
    if(k===0)ctx.moveTo(a.x+sx,a.y+sy);
    ctx.bezierCurveTo(b.x+sx,b.y+sy,c.x+sx,c.y+sy,
      d.x+sx,d.y+sy);
  }
  return true;
}
const mid=(a,b)=>({x:(a.x+b.x)*.5,y:(a.y+b.y)*.5});
const splitCubic=c=>{
  const ab=mid(c[0],c[1]),bc=mid(c[1],c[2]),
    cd=mid(c[2],c[3]),abc=mid(ab,bc),bcd=mid(bc,cd),
    centre=mid(abc,bcd);
  return [[c[0],ab,abc,centre],[centre,bcd,cd,c[3]]];
};
const hull=c=>{
  // Conservative control-polygon AABB; the true Bezier cannot escape it.
  let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
  for(const p of c){
    left=Math.min(left,p.x);right=Math.max(right,p.x);
    top=Math.min(top,p.y);bottom=Math.max(bottom,p.y);
  }
  return {left,right,top,bottom};
};
const overlapping=(a,b)=>a.left<=b.right&&b.left<=a.right&&
  a.top<=b.bottom&&b.top<=a.bottom;
const intersectCubics=(lower,upper)=>{
  const found=[];
  // Binary De Casteljau gives the *same original t/16 curve stations* as
  // uniform 16-piece evaluation, but prunes disjoint control hulls before
  // visiting subpairs. Maximum work is finite: 4 subdivision levels,
  // 4^4 leaf tests per original source branch pair.
  const stack=[{a:lower,b:upper,level:0}];
  while(stack.length){
    const {a,b,level}=stack.pop();
    if(!overlapping(hull(a),hull(b)))continue;
    if(level===4){
      const hit=segmentIntersection(a[0],a[3],b[0],b[3],
        {minimumProduct:1e-8});
      if(hit&&!found.some(e=>Math.hypot(e.x-hit.x,e.y-hit.y)<.25))
        found.push({x:hit.x,y:hit.y,lowerA:a[0],lowerB:a[3],
          lowerCurve:a});
      continue;
    }
    const halvesA=splitCubic(a),halvesB=splitCubic(b);
    for(let i=1;i>=0;i--)for(let j=1;j>=0;j--)
      stack.push({a:halvesA[i],b:halvesB[j],level:level+1});
  }
  return found;
};

/** Two adjacent original links of ONE lane, in exact paint/source order.
 * Cubic curves are sampled to locate *transverse* crossings only. The
 * renderer uses the original cubics for paint; a local lower-yarn tangent
 * gives the minimal shadow footprint. No invented contacts from proximity,
 * parallel overlaps, or separate rows/lanes. Four source curve branch pairs
 * and four bounded binary subdivision levels cap work independently of pixels. */
export function chainLinkContactEvents(previous,current){
  if(!Array.isArray(previous)||!Array.isArray(current)||
      previous.length!==2||current.length!==2||
      ![...previous,...current].every(c=>Array.isArray(c)&&
        c.length===4&&c.every(validPoint)))return [];
  const events=[];
  for(let lowerBranch=0;lowerBranch<2;lowerBranch++){
    const lower=previous[lowerBranch],bounds=hull(lower);
    for(let upperBranch=0;upperBranch<2;upperBranch++){
      const upper=current[upperBranch];
      if(!overlapping(bounds,hull(upper)))continue;
      for(const hit of intersectCubics(lower,upper)){
        if(events.some(e=>Math.hypot(e.x-hit.x,e.y-hit.y)<.25))
          continue;
        events.push({...hit,lowerBranch,upperBranch});
        if(events.length===4)return events;
      }
    }
  }
  return events;
}
