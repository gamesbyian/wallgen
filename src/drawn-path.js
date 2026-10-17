// Pure geometry for finger-drawn paths. Stored coordinates are normalized to
// the 600 x 1300 design plane, independent of the display's size or zoom.
// Imported paths are bounded, finite, compact and safe for deterministic export.
export const PATH_WIDTH=600;
export const PATH_HEIGHT=1300;
export const MAX_DRAWN_POINTS=96;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot((a[0]-b[0])*PATH_WIDTH,(a[1]-b[1])*PATH_HEIGHT);
const interpolate=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
const round=x=>Math.round(x*100000)/100000;

export function normalizeDrawnPath(input){
  if(!Array.isArray(input))return [];
  const points=[];
  for(const point of input.slice(0,1200)){
    if(!Array.isArray(point)||point.length<2)continue;
    const x=Number(point[0]),y=Number(point[1]);
    if(!Number.isFinite(x)||!Number.isFinite(y))continue;
    const next=[round(clamp(x,0,1)),round(clamp(y,0,1))];
    if(!points.length||distance(next,points.at(-1))>=.75)points.push(next);
  }
  if(points.length<2)return [];
  const length=points.slice(1).reduce((sum,p,i)=>sum+distance(p,points[i]),0);
  if(length<35)return [];
  // Keep stored and imported paths bounded without truncating their endpoint.
  return points.length>MAX_DRAWN_POINTS?resamplePath(points,MAX_DRAWN_POINTS):points;
}

export function resamplePath(points,count){
  if(points.length<2)return points.slice();
  const cum=[0];
  for(let i=1;i<points.length;i++)cum.push(cum.at(-1)+distance(points[i-1],points[i]));
  const total=cum.at(-1);
  if(total<=0)return [points[0],points.at(-1)];
  const out=[];
  let j=1;
  for(let i=0;i<count;i++){
    const pos=total*i/(count-1);
    while(j<cum.length-1&&cum[j]<pos)j++;
    const f=clamp((pos-cum[j-1])/(cum[j]-cum[j-1]||1),0,1);
    out.push(interpolate(points[j-1],points[j],f));
  }
  return out;
}

function pointSegmentDistance(p,a,b){
  const x=(p[0]-a[0])*PATH_WIDTH,y=(p[1]-a[1])*PATH_HEIGHT;
  const dx=(b[0]-a[0])*PATH_WIDTH,dy=(b[1]-a[1])*PATH_HEIGHT;
  const t=clamp((x*dx+y*dy)/(dx*dx+dy*dy||1),0,1);
  return Math.hypot(x-t*dx,y-t*dy);
}
export function simplifyPath(points,tolerance=3){
  if(points.length<=2)return points.slice();
  const keep=new Set([0,points.length-1]),stack=[[0,points.length-1]];
  while(stack.length){
    const [a,b]=stack.pop();
    let max=tolerance,index=-1;
    for(let i=a+1;i<b;i++){
      const d=pointSegmentDistance(points[i],points[a],points[b]);
      if(d>max){max=d;index=i;}
    }
    if(index!==-1){keep.add(index);stack.push([a,index],[index,b]);}
  }
  return [...keep].sort((a,b)=>a-b).map(i=>points[i]);
}
function soften(points,rounds){
  let out=points;
  for(let step=0;step<rounds;step++){
    if(out.length<=2)break;
    const next=[out[0]];
    for(let i=1;i<out.length;i++){
      next.push(interpolate(out[i-1],out[i],.25),interpolate(out[i-1],out[i],.75));
    }
    next.push(out.at(-1));
    out=next;
  }
  return out;
}

// Snap intended near-horizontal/vertical/diagonal segments, then soften joins.
// The 11-degree acceptance window prevents arbitrary diagonals from drifting.
function regularize(points){
  if(points.length<3)return points;
  const ends=[points[0]];
  for(let i=1;i<points.length-1;i++){
    const previous=ends.at(-1),p=points[i];
    const dx=(p[0]-previous[0])*PATH_WIDTH,dy=(p[1]-previous[1])*PATH_HEIGHT;
    const angle=Math.atan2(dy,dx),snap=Math.round(angle/(Math.PI/4))*(Math.PI/4);
    const delta=Math.atan2(Math.sin(angle-snap),Math.cos(angle-snap));
    if(Math.abs(delta)<11*Math.PI/180){
      const dist=Math.hypot(dx,dy);
      ends.push([clamp(previous[0]+Math.cos(snap)*dist/PATH_WIDTH,0,1),
        clamp(previous[1]+Math.sin(snap)*dist/PATH_HEIGHT,0,1)]);
    }else ends.push(p);
  }
  ends.push(points.at(-1));
  return soften(ends,2);
}

export function finishDrawnPath(raw,mode='smooth'){
  if(!Array.isArray(raw)||raw.length<2)return [];
  // Coalesce very dense pointer events before smoothing, with no dependence
  // on actual pointer-event sampling rate.
  const clean=[];
  for(const p of raw.slice(0,8000)){
    if(!Array.isArray(p)||!Number.isFinite(Number(p[0]))||!Number.isFinite(Number(p[1])))continue;
    const next=[clamp(Number(p[0]),0,1),clamp(Number(p[1]),0,1)];
    if(!clean.length||distance(next,clean.at(-1))>=1.5)clean.push(next);
  }
  if(clean.length<2)return [];
  const total=clean.slice(1).reduce((sum,p,i)=>sum+distance(p,clean[i]),0);
  if(total<35)return [];
  const anchors=simplifyPath(clean,mode==='geometric'?12:2.5);
  const shaped=mode==='geometric'?regularize(anchors):soften(anchors,2);
  const points=resamplePath(shaped,Math.max(2,Math.min(MAX_DRAWN_POINTS,Math.ceil(total/8))));
  return normalizeDrawnPath(points);
}

export function prepareDrawnPath(input){
  const stored=normalizeDrawnPath(input);
  if(stored.length<2)return null;
  const points=stored.map(([x,y])=>({x:x*PATH_WIDTH-PATH_WIDTH/2,y:y*PATH_HEIGHT-PATH_HEIGHT/2}));
  const lengths=[0];
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i];
    lengths.push(lengths.at(-1)+Math.hypot(b.x-a.x,b.y-a.y));
  }
  return {points,lengths,total:lengths.at(-1)};
}
export function pointOnDrawnPath(path,u){
  const target=clamp(u,0,1)*path.total,arr=path.lengths;
  let lo=1,hi=arr.length-1;
  while(lo<hi){
    const m=(lo+hi)>>1;
    if(arr[m]<target)lo=m+1;else hi=m;
  }
  const k=lo,a=path.points[k-1],b=path.points[k];
  const t=clamp((target-arr[k-1])/(arr[k]-arr[k-1]||1),0,1);
  return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
}
