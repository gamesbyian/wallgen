// Local, non-destructive node editor for a sampled drawn path.
// The source remains the actual 96-point shape until the user changes it:
// entering node mode never re-fits or silently replaces existing geometry.
import {normalizeDrawnPathWithIndexMap,MAX_DRAWN_POINTS} from './drawn-path.js';
const W=600,H=1300;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const copy=p=>p.map(v=>v.slice());
const pixel=(a,b)=>Math.hypot((a[0]-b[0])*W,(a[1]-b[1])*H);
const smooth5=t=>{const x=clamp(t,0,1);return x*x*x*(x*(x*6-15)+10);};
const round=p=>[Math.round(clamp(p[0],-2,3)*1e5)/1e5,
  Math.round(clamp(p[1],-2,3)*1e5)/1e5];
const lengthAlong=points=>{
  const d=[0];
  for(let i=1;i<points.length;i++)d.push(d.at(-1)+pixel(points[i-1],points[i]));
  return d;
};
function deviation(p,a,b){
  const ax=a[0]*W,ay=a[1]*H,bx=b[0]*W,by=b[1]*H;
  const px=p[0]*W,py=p[1]*H,vx=bx-ax,vy=by-ay;
  const t=clamp(((px-ax)*vx+(py-ay)*vy)/(vx*vx+vy*vy||1),0,1);
  return Math.hypot(px-(ax+t*vx),py-(ay+t*vy));
}
// RDP preserves genuine corners. Long, low-curvature arcs also need
// strategically spaced anchors to keep interaction local.
export function chooseAnchorIndices(points,pinned=[]){
  const n=points.length;
  if(n<2)return [];
  const chosen=new Set([0,n-1]);
  function reduce(a,b){
    if(b-a<3)return;
    let best=-1,error=6.5;
    for(let i=a+1;i<b;i++){
      const e=deviation(points[i],points[a],points[b]);
      if(e>error){error=e;best=i;}
    }
    if(best!==-1){chosen.add(best);reduce(a,best);reduce(best,b);}
  }
  reduce(0,n-1);
  for(const i of pinned)if(Number.isInteger(i)&&i>0&&i<n-1)chosen.add(i);
  const arc=lengthAlong(points);
  // Ensure lengthy near-straight spans are editable without micromanaging.
  let anchors=[...chosen].sort((a,b)=>a-b);
  for(let j=0;j<anchors.length-1;j++){
    const a=anchors[j],b=anchors[j+1],segments=Math.ceil((arc[b]-arc[a])/145);
    for(let k=1;k<segments;k++){
      const target=mix(arc[a],arc[b],k/segments);
      let idx=a+1;
      while(idx<b-1&&arc[idx]<target)idx++;
      chosen.add(idx);
    }
  }
  anchors=[...chosen].sort((a,b)=>a-b);
  // Dense source strokes can have a large number of corners. Preserve
  // manually pinned controls, space automatic ones at least 3 samples apart.
  const fixed=new Set([0,n-1,...pinned]);
  const result=[0];
  for(const i of anchors.slice(1,-1)){
    if(fixed.has(i)||i-result.at(-1)>=3)result.push(i);
  }
  if(result.at(-1)!==n-1)result.push(n-1);
  // At most ~18 visible squares for a typical 96-sample stroke. Reduce
  // the least meaningful automatic node, measuring its geometric error
  // against its current neighbours. Explicit user pins are never removed.
  const limit=Math.max(18,fixed.size);
  while(result.length>limit){
    let candidate=-1,least=Infinity;
    for(let j=1;j<result.length-1;j++){
      const i=result[j];
      if(fixed.has(i))continue;
      const error=deviation(points[i],points[result[j-1]],points[result[j+1]]);
      const span=arc[result[j+1]]-arc[result[j-1]];
      const importance=error+span*.01;
      if(importance<least){least=importance;candidate=j;}
    }
    if(candidate<0)break;
    result.splice(candidate,1);
  }
  return result;
}
export function createPointEditor(input,pinned=[],corners=[]){
  // Legacy/sparse imports can lose near-duplicate samples or be resampled
  // down to the 96-point cap. Reindex human-authored constraints in the
  // SAME normalization pass as their curve, exactly like recipe restoration.
  const {points,indexMap}=normalizeDrawnPathWithIndexMap(input);
  if(points.length<2)return null;
  const mapped=indices=>[...new Set((Array.isArray(indices)?indices:[])
    .filter(i=>Number.isInteger(i)&&i>=0)
    .map(i=>indexMap[i])
    .filter(i=>Number.isInteger(i)&&i>=0&&i<points.length))]
    .sort((a,b)=>a-b);
  const reserved=mapped(pinned);
  const cornersIn=mapped(corners);
  const allPins=[...new Set([...reserved,...cornersIn])];
  return {points,anchors:chooseAnchorIndices(points,allPins),
    pinned:new Set(allPins),corners:new Set(cornersIn),selected:-1,changed:new Set()};
}
export function clonePointEditor(e){
  return {points:copy(e.points),anchors:e.anchors.slice(),
    pinned:new Set(e.pinned),corners:new Set(e.corners),
    selected:e.selected,changed:new Set(e.changed)};
}
export function addPointAnchor(e,index){
  if(!Number.isInteger(index)||index<=0||index>=e.points.length-1)return false;
  if(e.anchors.some(i=>Math.abs(i-index)<3))return false;
  e.anchors.push(index);e.anchors.sort((a,b)=>a-b);
  e.pinned.add(index);e.selected=index;
  return true;
}
/** Insert a true control station on an existing segment when an imported
 * sparse path has no interior sample to promote. Preserve every previous
 * world-space coordinate and reindex all user-authored constraints atomically.
 * Dense 96-sample paths still use the original pin-an-existing-point mode. */
export function insertPointAnchor(e,segment,t){
  if(!Number.isInteger(segment)||segment<0||segment>=e.points.length-1||
    e.points.length>=MAX_DRAWN_POINTS||!Number.isFinite(t)||t<=.05||t>=.95)return false;
  const a=e.points[segment],b=e.points[segment+1];
  const point=round([mix(a[0],b[0],t),mix(a[1],b[1],t)]);
  if(pixel(point,a)<1||pixel(point,b)<1)return false;
  const index=segment+1;
  e.points.splice(index,0,point);
  const shift=i=>i>=index?i+1:i;
  e.anchors=e.anchors.map(shift);
  e.pinned=new Set([...e.pinned].map(shift));
  e.corners=new Set([...e.corners].map(shift));
  e.changed=new Set([...e.changed].map(shift));
  if(e.selected>=index)e.selected++;
  e.anchors.push(index);
  e.anchors.sort((x,y)=>x-y);
  e.pinned.add(index);
  e.selected=index;
  return true;
}
export function deletePointAnchor(e,index){
  if(index<=0||index>=e.points.length-1||!e.anchors.includes(index))return false;
  e.anchors=e.anchors.filter(i=>i!==index);
  e.pinned.delete(index);e.corners.delete(index);
  // Deleting a once-moved anchor must not leave an obsolete resmoothing
  // marker that will later address another unrelated span.
  e.changed.delete(index);
  e.selected=-1;
  return true;
}
function neighbours(e,index){
  const at=e.anchors.indexOf(index);
  if(at<0)throw Error('Not an editable anchor');
  return [e.anchors[Math.max(0,at-1)],e.anchors[Math.min(e.anchors.length-1,at+1)]];
}
// A compactly supported C2 bell moves the point exactly, and goes to zero
// WITH zero tangent at adjacent anchors. Unrelated samples never move.
export function movePointAnchor(e,index,to,start=e.points){
  const [lo,hi]=neighbours(e,index);
  const arc=lengthAlong(start),delta=[to[0]-start[index][0],to[1]-start[index][1]];
  const result=copy(start);
  for(let i=lo;i<=hi;i++){
    const fraction=i===index?1:i<index?
      (arc[i]-arc[lo])/(arc[index]-arc[lo]||1):
      (arc[hi]-arc[i])/(arc[hi]-arc[index]||1);
    const w=smooth5(fraction);
    result[i]=round([start[i][0]+delta[0]*w,start[i][1]+delta[1]*w]);
  }
  e.points=result;e.pinned.add(index);e.changed.add(index);e.selected=index;
  return result;
}
/** A free endpoint has exactly one adjacent editable tangent.
 * The other apparent handle has no geometric effect and must stay inert. */
export function editablePointHandleSides(e,index){
  if(!e?.anchors?.includes(index))return [];
  if(index===0)return ['out'];
  if(index===e.points.length-1)return ['in'];
  return ['in','out'];
}
// Handles are inferred from the current polyline rather than stored as a
// separate approximation. Each is a directional derivative at an anchor.
export function pointHandles(e,index){
  const [lo,hi]=neighbours(e,index),p=e.points[index];
  const a=e.points[Math.max(lo,index-2)],b=e.points[Math.min(hi,index+2)];
  const normalized=(dx,dy)=>{
    const len=Math.hypot(dx,dy)||1;
    return [dx/len,dy/len];
  };
  const smooth=normalized((b[0]-a[0])*W,(b[1]-a[1])*H);
  // Corners have *independent* incoming and outgoing tangents. A selected
  // smooth anchor shares one axis, but a broken anchor must show its two
  // actual side directions and permit independent manipulation.
  const incoming=e.corners.has(index)?
    normalized((p[0]-a[0])*W,(p[1]-a[1])*H):smooth;
  const outgoing=e.corners.has(index)?
    normalized((b[0]-p[0])*W,(b[1]-p[1])*H):smooth;
  const length=Math.min(40,Math.max(12,
    Math.min(pixel(e.points[lo],p)||40,pixel(p,e.points[hi])||40)*.35));
  return {in:round([p[0]-incoming[0]*length/W,p[1]-incoming[1]*length/H]),
    out:round([p[0]+outgoing[0]*length/W,p[1]+outgoing[1]*length/H])};
}
// Cubic Bézier endpoint basis. Dragging a handle changes exactly its adjacent
// span; a smooth handle mirrors the delta onto the other side. Both have zero
// displacement at neighbouring anchors and no edits beyond them.
export function movePointHandle(e,index,side,to,start=e.points,initial=null){
  if(!['in','out'].includes(side))throw Error('Unknown handle');
  const [lo,hi]=neighbours(e,index);
  if((side==='in'&&lo===index)||(side==='out'&&hi===index))
    return e.points; // No adjacent segment and no misleading changed marker.
  const handles=initial||pointHandles({...e,points:start},index);
  const delta=[to[0]-handles[side][0],to[1]-handles[side][1]];
  const arc=lengthAlong(start),result=copy(start);
  const update=(type,d)=>{
    if(type==='out'&&hi!==index){
      for(let i=index+1;i<hi;i++){
        const t=(arc[i]-arc[index])/(arc[hi]-arc[index]||1);
        const weight=3*(1-t)*(1-t)*t;
        result[i][0]+=d[0]*weight;result[i][1]+=d[1]*weight;
      }
    }else if(type==='in'&&lo!==index){
      for(let i=lo+1;i<index;i++){
        const t=(arc[i]-arc[lo])/(arc[index]-arc[lo]||1);
        const weight=3*(1-t)*t*t;
        result[i][0]+=d[0]*weight;result[i][1]+=d[1]*weight;
      }
    }
  };
  update(side,delta);
  if(!e.corners.has(index))update(side==='in'?'out':'in',delta.map(x=>-x));
  e.points=result.map(round);e.pinned.add(index);e.changed.add(index);e.selected=index;
  return e.points;
}
// A local fairing pass affects changed spans and their immediate neighbours,
// while fixed anchors (including the freshly moved one) remain *exactly*
// where placed. Never fit the entire drawing again after a manual edit.
export function resmoothPointEdits(e,strength=3){
  if(!e.changed.size)return e.points;
  const anchors=e.anchors,source=copy(e.points);
  const regions=new Set();
  for(const index of e.changed){
    const slot=anchors.indexOf(index);
    if(slot<0)continue; // Defensive against stale/externally constructed editor state.
    for(let j=Math.max(0,slot-2);j<Math.min(anchors.length-1,slot+2);j++)
      regions.add(j);
  }
  let points=copy(source);
  const amount=clamp(Number(strength)||3,1,10)/10;
  const passes=Math.max(1,Math.round(1+amount*3));
  for(let pass=0;pass<passes;pass++){
    const next=copy(points);
    for(const slot of regions){
      const lo=anchors[slot],hi=anchors[slot+1];
      for(let i=lo+2;i<hi-1;i++){
        const t=(i-lo)/(hi-lo),fade=smooth5(Math.min(t,1-t)*2);
        const factor=.20*amount*fade;
        for(let axis=0;axis<2;axis++){
          next[i][axis]=points[i][axis]*(1-2*factor)+
            (points[i-1][axis]+points[i+1][axis])*factor;
        }
      }
    }
    points=next;
  }
  e.points=points.map(round);
  return e.points;
}
export function savedPointCorners(e){
  return [...e.corners].filter(i=>e.anchors.includes(i)).sort((a,b)=>a-b);
}
export function savedPointAnchors(e){
  return [...e.pinned].filter(i=>e.anchors.includes(i))
    .sort((a,b)=>a-b);
}
