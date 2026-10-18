// Decorative waves, zigzags, and loops on metric polygon insets.
// Coordinates are tied to the original *uncropped* polygon boundary instead
// of the first contour sample. This keeps phase stable across zoom, nudging,
// camera cropping, and marching-squares loop reordering.
const TAU=Math.PI*2;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
function canonicalRing(raw){
  const points=[];
  for(const p of raw){
    if(!finite(p))continue;
    const last=points.at(-1);
    if(last&&Math.hypot(last.x-p.x,last.y-p.y)<1e-8)continue;
    points.push({x:p.x,y:p.y});
  }
  if(points.length>2&&Math.hypot(points[0].x-points.at(-1).x,
    points[0].y-points.at(-1).y)<1e-8)points.pop();
  if(points.length<3)return null;
  let area2=0;
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length];
    area2+=a.x*b.y-b.x*a.y;
  }
  if(area2<0)points.reverse();
  let start=0;
  for(let i=1;i<points.length;i++){
    if(points[i].y<points[start].y||
       (points[i].y===points[start].y&&points[i].x<points[start].x))
      start=i;
  }
  return [...points.slice(start),...points.slice(0,start)];
}
export function contourBoundaryFrame(polygon){
  if(!Array.isArray(polygon)||!polygon.length)return [];
  const rings=(Array.isArray(polygon[0])?polygon:[polygon])
    .map(canonicalRing).filter(Boolean)
    .sort((a,b)=>a[0].y-b[0].y||a[0].x-b[0].x);
  return rings.map((ring,ringIndex)=>{
    let length=0;
    const edges=[];
    for(let i=0;i<ring.length;i++){
      const a=ring[i],b=ring[(i+1)%ring.length];
      const dx=b.x-a.x,dy=b.y-a.y;
      const segmentLength=Math.hypot(dx,dy);
      if(segmentLength<1e-8)continue;
      edges.push({x:a.x,y:a.y,dx,dy,len2:segmentLength*segmentLength,
        length:segmentLength,start:length});
      length+=segmentLength;
    }
    return {ringIndex,length,edges};
  }).filter(r=>r.length>1e-8);
}
function nearestSource(point,frame){
  let best=null,score=Infinity;
  for(const ring of frame)for(const edge of ring.edges){
    const t=clamp(((point.x-edge.x)*edge.dx+(point.y-edge.y)*edge.dy)/
      edge.len2,0,1);
    const x=edge.x+t*edge.dx,y=edge.y+t*edge.dy;
    const dx=point.x-x,dy=point.y-y,d2=dx*dx+dy*dy;
    if(d2<score){
      score=d2;
      best={x,y,dx,dy,station:edge.start+t*edge.length,
        ringLength:ring.length,ringIndex:ring.ringIndex};
    }
  }
  return best;
}
export function decorateInsetContour(contour,element,inset,frame,strokeWidth=1){
  const original=contour?.points??[];
  if(!original.length||!frame?.length)return {points:original,closed:!!contour?.closed,dashOffset:0};
  // Insets themselves are untouched: only the decorative ink moves.
  // Leave a margin for ink thickness and marching-grid approximation.
  const maximum=Math.max(0,inset-strokeWidth*.5-1);
  const amplitude=Math.min(maximum*.8,
    (Number(element.amplitude)||0)*Math.min(24,Math.max(7,inset*2)));
  const cycles=Math.max(1,Math.round(Number(element.frequency)||1));
  const phase=(Number(element.phase)||0)*Math.PI/180;
  const shape=element.shape;
  let dashOffset=0;
  const points=original.map((p,i)=>{
    const nearest=nearestSource(p,frame);
    if(!nearest)return {x:p.x,y:p.y};
    if(i===0)dashOffset=-nearest.station;
    if(shape==='straight'||amplitude<=0)return {x:p.x,y:p.y};
    const angle=TAU*cycles*nearest.station/nearest.ringLength+phase;
    const wave=shape==='zigzag'?2/Math.PI*Math.asin(Math.sin(angle)):Math.sin(angle);
    const normalLength=Math.hypot(nearest.dx,nearest.dy);
    if(normalLength<1e-8)return {x:p.x,y:p.y};
    const nx=nearest.dx/normalLength,ny=nearest.dy/normalLength;
    const tangent=shape==='loop'?Math.cos(angle)*amplitude:0;
    return {
      x:p.x+nx*wave*amplitude-ny*tangent,
      y:p.y+ny*wave*amplitude+nx*tangent,
    };
  });
  return {points,closed:!!contour.closed,dashOffset};
}
