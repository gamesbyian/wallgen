// Optional geometry-following mineral beads for the *beaded sand* material.
// This is decorative deposition only; source vectors, clips, and layer order
// are owned by the existing renderer, not reconstructed or reserialized here.
import {sandPitch} from './sand-material.js';
import {contourBoundaryFrame} from './contour-decoration.js';

const TAU=Math.PI*2;
const good=v=>Number.isFinite(v);
export function sandBeadStyles(scene){
  return (scene?.textureLayers||[]).filter(layer=>
    layer?.material==='sand-beaded'&&layer.coverage!=='background'&&
    good(layer.strength)&&layer.strength>0).map(layer=>{
    const gauge=sandPitch(layer),s=Math.min(1,layer.strength/100);
    return {interval:Math.max(6,gauge*3.05),radius:Math.min(4, gauge*.72),
      // Each independent texture layer retains its own seed-stable bead phase.
      phase:(Math.imul(layer.heightSeed|0,2654435761)>>>0)/4294967296,
      shadowAlpha:.28*s,lightAlpha:.44*s};
  });
}
function drawBead(ctx,x,y,style,maxRadius=Infinity){
  if(!good(x)||!good(y))return;
  const radius=Math.min(style.radius,maxRadius);
  if(radius<=.15)return;
  ctx.fillStyle='rgba(0,0,0,'+style.shadowAlpha.toFixed(4)+')';
  ctx.beginPath();ctx.arc(x+radius*.1,y+radius*.12,radius,0,TAU);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,'+style.lightAlpha.toFixed(4)+')';
  ctx.beginPath();ctx.arc(x-radius*.12,y-radius*.17,radius*.71,0,TAU);ctx.fill();
}
/** Each frame comes from the shared original source-ring anchoring logic.
 * Distance stations are along real perimeter length (including holes and
 * detached islands); a camera crop cannot change spacing or bead identity. */
export function forEachRingBead(frames,interval,visit,phase=0){
  if(!Array.isArray(frames)||!good(interval)||interval<=0||
    !good(phase)||phase<0||phase>=1||typeof visit!=='function')return;
  for(const frame of frames){
    if(!good(frame.length)||frame.length<interval||!Array.isArray(frame.edges))continue;
    const total=Math.min(1600,Math.max(1,Math.round(frame.length/interval)));
    let edgeIndex=0;
    for(let i=0;i<total;i++){
      const station=frame.length*(i+phase)/total;
      while(edgeIndex+1<frame.edges.length &&
        station>=frame.edges[edgeIndex].start+frame.edges[edgeIndex].length)
        edgeIndex++;
      const e=frame.edges[edgeIndex];
      if(!e||!good(e.length)||e.length<=0)continue;
      const t=(station-e.start)/e.length;
      visit(e.x+e.dx*t,e.y+e.dy*t,frame.ringIndex,i);
    }
  }
}
/** Avoid tracing the same polygon geometry a second way: reuse the already
 * shared contourBoundaryFrame() canonical perimeter and call our bead painter
 * only inside the caller's original even-odd clip. */
export function paintSandRegionBeads(ctx,region,styles){
  if(!styles?.length||!region)return 0;
  const rings=region.rings||[region.vertices];
  let count=0;
  ctx.save();
  for(const style of styles){
    if(region.circle){
      const {cx,cy,r}=region.circle;
      if(![cx,cy,r].every(good)||r<=0)continue;
      const n=Math.min(1600,Math.max(8,Math.round(TAU*r/style.interval)));
      for(let i=0;i<n;i++){
        const a=TAU*(i+style.phase)/n;
        drawBead(ctx,cx+r*Math.cos(a),cy+r*Math.sin(a),style);
        count++;
      }
    }else{
      const frames=contourBoundaryFrame(rings);
      forEachRingBead(frames,style.interval,(x,y)=>{
        drawBead(ctx,x,y,style);count++;
      },style.phase);
    }
  }
  ctx.restore();
  return count;
}
/** For ribbon rails, stations are addressed from the ORIGINAL path origin
 * even when a crossing branch is repainted in a different local window. */
export function forEachRailBead(stripe,extent,style,pointAt,visit,range=null){
  if(!stripe||!style||!good(extent)||extent<=0||
     !good(style.interval)||style.interval<=0||
     typeof pointAt!=='function'||typeof visit!=='function')return;
  const anchor=-(stripe.coreExtent??extent)+(style.phase||0)*style.interval;
  const start=Math.max(stripe.segmentStart??-extent,range?.start??-extent);
  const end=Math.min(stripe.segmentEnd??extent,range?.end??extent);
  if(!good(anchor)||!good(start)||!good(end)||end<start)return;
  const first=Math.ceil((start-anchor)/style.interval-1e-9);
  const last=Math.floor((end-anchor)/style.interval+1e-9);
  // Cap pathological untrusted source ranges without moving the lattice.
  for(let i=first;i<=last&&i<first+4000;i++){
    const station=anchor+i*style.interval;
    for(const side of [-1,1]){
      const point=pointAt(station,side);
      if(point&&good(point.x)&&good(point.y))visit(point.x,point.y,side,i);
    }
  }
}
export function paintSandRibbonBeads(ctx,stripe,extent,styles,pointAt,range=null){
  if(!styles?.length)return 0;
  let count=0;
  ctx.save();
  for(const style of styles)
    forEachRailBead(stripe,extent,style,pointAt,(x,y)=>{
      drawBead(ctx,x,y,style);count++;
    },range);
  ctx.restore();return count;
}
/** Nested linework already has its own physical stroke width and true metric
 * contours. All beads fit entirely within that original stroke footprint. */
export function paintSandNestedBeads(ctx,contour,strokeWidth,styles){
  if(!contour?.closed||!Array.isArray(contour.points)||contour.points.length<3||
    !good(strokeWidth)||strokeWidth<=0||!styles?.length)return 0;
  const frames=contourBoundaryFrame(contour.points);
  let count=0;
  ctx.save();
  for(const style of styles)
    forEachRingBead(frames,style.interval,(x,y)=>{
      drawBead(ctx,x,y,style,strokeWidth*.38);count++;
    },style.phase);
  ctx.restore();return count;
}
