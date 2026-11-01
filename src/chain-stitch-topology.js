// Source-owned chain stitch curves in design units. Geometry is shared by
// the actual cubic Canvas painter and future local yarn-contact intersection
// studies; it is neither a bitmap heightfield nor saved recipe coordinates.
import {segmentIntersection} from './crossing-order.js';

const finite=Number.isFinite;
const STEPS=12,MAX_CONTACTS=4;

/** Exact authored cubic link control points, with the existing three-lane
 * tangent/normal basis. No approximation enters the original Canvas path. */
export function chainLinkCurve(x,y,tx,ty,nx,ny,half,loft,
  shift=0,sx=0,sy=0){
  if(![x,y,tx,ty,nx,ny,half,loft,shift,sx,sy].every(finite)||
    half<=0||loft<0)return null;
  const cx=x+nx*shift+sx,cy=y+ny*shift+sy;
  const point=(along,across)=>[cx+tx*along+nx*across,
    cy+ty*along+ny*across];
  const a=point(-half,0),b=point(half,0);
  const upper1=point(-half*.55,loft),upper2=point(half*.6,loft);
  const lower1=point(half*.6,-loft),lower2=point(-half*.55,-loft);
  return {a,b,upper1,upper2,lower1,lower2};
}
const cubic=(a,b,c,d,t)=>{
  const u=1-t,uu=u*u,tt=t*t;
  return [uu*u*a[0]+3*uu*t*b[0]+3*u*tt*c[0]+tt*t*d[0],
    uu*u*a[1]+3*uu*t*b[1]+3*u*tt*c[1]+tt*t*d[1]];
};
/** Deterministic local curve samples, drawn from the same exact Bézier
 * controls as real links. Twelve subdivisions per half link are bounded,
 * independent of zoom, image output size or browser device pixel ratio. */
export function sampleChainLinkSegments(link){
  if(!link||!['a','b','upper1','upper2','lower1','lower2'].every(k=>
    Array.isArray(link[k])&&link[k].length===2&&link[k].every(finite)))
    return [];
  const curves=[
    [link.a,link.upper1,link.upper2,link.b],
    [link.b,link.lower1,link.lower2,link.a]
  ];
  const segments=[];
  for(let curve=0;curve<2;curve++){
    const ps=curves[curve];
    let previous=cubic(...ps,0);
    for(let i=1;i<=STEPS;i++){
      const now=cubic(...ps,i/STEPS);
      segments.push({start:{x:previous[0],y:previous[1]},
        end:{x:now[0],y:now[1]},curve,subdivision:i-1});
      previous=now;
    }
  }
  return segments;
}
/** Identify actual transverse intersections between TWO successive links
 * in one original yarn lane. Nearby but unconnected ovals, coincident
 * tangencies, repeated visits of one link and other lanes never qualify.
 * Nothing is painted here: the caller must still clip to existing lower
 * yarn ink and preserve original link paint order.
 */
export function chainLinkContacts(previous,current,{width=1.4}={}){
  if(!finite(width)||width<=0||width>8)return [];
  const older=sampleChainLinkSegments(previous),
    later=sampleChainLinkSegments(current);
  if(!older.length||!later.length)return [];
  const contacts=[],distance=Math.max(.35,width*.3);
  for(const bottom of older)for(const top of later){
    // The tiny link endpoint overlap occupies only a fraction of the source
    // oval. Prune spatially before invoking the canonical intersection solver.
    const a=bottom.start,b=bottom.end,c=top.start,d=top.end;
    if(Math.max(a.x,b.x)<Math.min(c.x,d.x)||
       Math.max(c.x,d.x)<Math.min(a.x,b.x)||
       Math.max(a.y,b.y)<Math.min(c.y,d.y)||
       Math.max(c.y,d.y)<Math.min(a.y,b.y))continue;
    const hit=segmentIntersection(a,b,c,d);
    if(!hit)continue;
    if(contacts.some(e=>Math.hypot(e.hit.x-hit.x,e.hit.y-hit.y)<distance))
      continue;
    contacts.push({hit,top:{start:c,end:d,width},
      bottom:{start:a,end:b,width}});
    if(contacts.length>=MAX_CONTACTS)return contacts;
  }
  return contacts;
}
