// Crossing order is based on stroke traversal, never on the coincidental
// order in which the seven rainbow colours happen to be painted.
// Pure intersection finding is usable by Node tests and the browser renderer.
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const delta=(a,b)=>({x:a.x-b.x,y:a.y-b.y});

export const CROSSING_MODES=Object.freeze(['over','under','weave']);

/** Two non-neighbouring path segments cross transversely in the design plane. */
export function segmentIntersection(a,b,c,d){
  const r=delta(b,a),s=delta(d,c),den=cross(r,s);
  const lengths=Math.hypot(r.x,r.y)*Math.hypot(s.x,s.y);
  if(lengths<1||Math.abs(den)/lengths<.12)return null;
  const v=delta(c,a),t=cross(v,s)/den,u=cross(v,r)/den;
  if(t<=.001||t>=.999||u<=.001||u>=.999)return null;
  return {x:a.x+r.x*t,y:a.y+r.y*t,t,u};
}
/** Identify centreline crossing stations in drawing order, once per junction. */
export function findPathCrossings(stripe,extent,sampler,{step=9,maxCrossings=32}={}){
  const first=stripe.segmentStart??-extent,last=stripe.segmentEnd??extent;
  const count=Math.max(32,Math.min(820,Math.ceil((last-first)/step)));
  const points=Array.from({length:count+1},(_,i)=>{
    const parameter=first+(last-first)*i/count;
    const p=sampler(stripe,parameter,extent);
    return {x:p.x,y:p.y,parameter};
  });
  const crossings=[];
  for(let i=0;i<count;i++){
    const a=points[i],b=points[i+1];
    for(let j=i+8;j<count;j++){
      const c=points[j],d=points[j+1];
      if(Math.max(a.x,b.x)<Math.min(c.x,d.x)||
         Math.max(c.x,d.x)<Math.min(a.x,b.x)||
         Math.max(a.y,b.y)<Math.min(c.y,d.y)||
         Math.max(c.y,d.y)<Math.min(a.y,b.y))continue;
      const hit=segmentIntersection(a,b,c,d);
      if(!hit)continue;
      const early=a.parameter+(b.parameter-a.parameter)*hit.t;
      const late=c.parameter+(d.parameter-c.parameter)*hit.u;
      if(Math.abs(late-early)<step*5)continue;
      if(crossings.some(v=>Math.hypot(v.x-hit.x,v.y-hit.y)<step*1.4&&
        Math.abs(v.early-early)<step*2))continue;
      crossings.push({x:hit.x,y:hit.y,early,late,
        angle:Math.abs(cross(delta(b,a),delta(d,c)))/
          (Math.hypot(b.x-a.x,b.y-a.y)*Math.hypot(d.x-c.x,d.y-c.y)||1)});
      if(crossings.length>=maxCrossings)return crossings;
    }
  }
  return crossings;
}
/** The later traversal is OVER, UNDER, or alternating by rainbow index. */
export function crossingTopIsLater(mode,stripeIndex,crossingIndex=0){
  if(mode==='under')return false;
  if(mode==='weave')return (stripeIndex+crossingIndex)%2===0;
  return true;
}
/** Clip region for just ONE local branch of a stripe, preserving its source.
 * Drawing the complete textured/motif stripe through this mask keeps its
 * appearance while changing only the occlusion at the junction.
 */
export function crossingBranchClip(stripe,extent,station,halfLength,sampler,Path=Path2D){
  const path=new Path();
  const lo=Math.max(stripe.segmentStart??-extent,station-halfLength);
  const hi=Math.min(stripe.segmentEnd??extent,station+halfLength);
  // A loop can double back inside this window, especially for inner colours.
  // One perimeter around the WHOLE window forms a self-intersecting polygon:
  // its winding can cancel or expose triangular shards at the turn. Build
  // the area as consistently wound small quads instead. The nonzero fill
  // rule then gives their physical UNION, including at sharp reversals.
  const n=Math.max(16,Math.ceil((hi-lo)/5));
  let previous=null;
  for(let i=0;i<=n;i++){
    const x=lo+(hi-lo)*i/n,p=sampler(stripe,x,extent);
    const w=stripe.width*.5+Math.max(3,Math.min(18,stripe.width*.22));
    const pair=[{x:p.x+p.nx*w,y:p.y+p.ny*w},
      {x:p.x-p.nx*w,y:p.y-p.ny*w}];
    if(previous){
      const corners=[previous[0],pair[0],pair[1],previous[1]];
      const a=corners[0],b=corners[1],c=corners[2];
      const signed=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
      if(Math.abs(signed)>1e-10){
        if(signed<0)corners.reverse();
        path.moveTo(corners[0].x,corners[0].y);
        for(let j=1;j<4;j++)path.lineTo(corners[j].x,corners[j].y);
        path.closePath();
      }
    }
    previous=pair;
  }
  return path;
}
