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
const cubic=(c,t)=>{
  const u=1-t;
  return {
    x:u*u*u*c[0].x+3*u*u*t*c[1].x+3*u*t*t*c[2].x+t*t*t*c[3].x,
    y:u*u*u*c[0].y+3*u*u*t*c[1].y+3*u*t*t*c[2].y+t*t*t*c[3].y
  };
};
const boxesOverlap=(a,b,c,d)=>Math.max(a.x,b.x)>=Math.min(c.x,d.x)&&
  Math.max(c.x,d.x)>=Math.min(a.x,b.x)&&
  Math.max(a.y,b.y)>=Math.min(c.y,d.y)&&
  Math.max(c.y,d.y)>=Math.min(a.y,b.y);
const hull=c=>({
  left:Math.min(...c.map(p=>p.x)),right:Math.max(...c.map(p=>p.x)),
  top:Math.min(...c.map(p=>p.y)),bottom:Math.max(...c.map(p=>p.y))
});
const overlapping=(a,b)=>a.left<=b.right&&b.left<=a.right&&
  a.top<=b.bottom&&b.top<=a.bottom;

/** Two adjacent original links of ONE lane, in exact paint/source order.
 * Cubic curves are sampled to locate *transverse* crossings only. The
 * renderer uses the original cubics for paint; a local lower-yarn tangent
 * gives the minimal shadow footprint. No invented contacts from proximity,
 * parallel overlaps, or separate rows/lanes. Fixed 16 subdivisions and four
 * candidate branch pairs bound work independently of output resolution. */
export function chainLinkContactEvents(previous,current){
  if(!Array.isArray(previous)||!Array.isArray(current)||
      previous.length!==2||current.length!==2||
      ![...previous,...current].every(c=>Array.isArray(c)&&
        c.length===4&&c.every(validPoint)))return [];
  const events=[],steps=16;
  for(let lowerBranch=0;lowerBranch<2;lowerBranch++){
    const lower=previous[lowerBranch],bounds=hull(lower);
    for(let upperBranch=0;upperBranch<2;upperBranch++){
      const upper=current[upperBranch];
      if(!overlapping(bounds,hull(upper)))continue;
      const a=Array.from({length:steps+1},(_,i)=>cubic(lower,i/steps));
      const b=Array.from({length:steps+1},(_,i)=>cubic(upper,i/steps));
      for(let i=0;i<steps;i++)for(let j=0;j<steps;j++){
        if(!boxesOverlap(a[i],a[i+1],b[j],b[j+1]))continue;
        // Source yarn is much finer than the path centreline's default
        // minimum segment product. Keep the same transversality and endpoint
        // semantics while allowing sub-unit cubic tessellation chords.
        const hit=segmentIntersection(a[i],a[i+1],b[j],b[j+1],
          {minimumProduct:1e-8});
        if(!hit||events.some(e=>Math.hypot(e.x-hit.x,e.y-hit.y)<.25))
          continue;
        events.push({x:hit.x,y:hit.y,
          lowerBranch,upperBranch,lowerA:a[i],lowerB:a[i+1]});
        if(events.length===4)return events;
      }
    }
  }
  return events;
}
