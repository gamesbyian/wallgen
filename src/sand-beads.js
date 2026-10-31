// Optional geometry-following mineral beads for the *beaded sand* material.
// This is decorative deposition only; source vectors, clips, and layer order
// are owned by the existing renderer, not reconstructed or reserialized here.
import {sandPitch} from './sand-material.js';
import {contourBoundaryFrame} from './contour-decoration.js';
import {sandLighting,sandCapDiffuse} from './sand-lighting.js';

const TAU=Math.PI*2;
const good=v=>Number.isFinite(v);
export function sandBeadStyles(scene,lighting=sandLighting(scene)){ 
  return (scene?.textureLayers||[]).filter(layer=>
    layer?.material==='sand-beaded'&&layer.coverage!=='background'&&
    good(layer.strength)&&layer.strength>0).map(layer=>{
    const gauge=sandPitch(layer),s=Math.min(1,layer.strength/100);
    return {interval:Math.max(6,gauge*3.05),radius:Math.min(4, gauge*.72),
      // Each independent texture layer retains its own seed-stable bead phase.
      phase:(Math.imul(layer.heightSeed|0,2654435761)>>>0)/4294967296,
      shadowAlpha:.28*s,lightAlpha:.44*s,lighting};
  });
}
function drawBead(ctx,x,y,style,maxRadius=Infinity){
  if(!good(x)||!good(y))return;
  const radius=Math.min(style.radius,maxRadius);
  if(radius<=.15)return;
  const light=style.lighting;
  if(!light){
    // Unlit legacy visual remains byte-for-byte unchanged.
    ctx.fillStyle='rgba(0,0,0,'+style.shadowAlpha.toFixed(4)+')';
    ctx.beginPath();ctx.arc(x+radius*.1,y+radius*.12,radius,0,TAU);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,'+style.lightAlpha.toFixed(4)+')';
    ctx.beginPath();ctx.arc(x-radius*.12,y-radius*.17,radius*.71,0,TAU);ctx.fill();
    return;
  }
  // A short *contact* shadow follows the bead's raised footprint away from
  // the lamp. This is deliberately inside the existing authored-ink clip:
  // an edge bead may be truncated by a real cutout, but cannot invent pigment
  // or a floating external shadow over a transparent hole.
  if(light.shadow>0){
    const offset=radius*(.20+.27*light.shadow);
    const opacity=style.shadowAlpha*(.18+.66*light.shadow);
    ctx.fillStyle='rgba('+light.shade+','+opacity.toFixed(4)+')';
    ctx.beginPath();
    if(typeof ctx.ellipse==='function')
      ctx.ellipse(x-light.x*offset,y-light.y*offset,
        radius*.88,radius*.56,Math.atan2(light.y,light.x),0,TAU);
    else ctx.arc(x-light.x*offset,y-light.y*offset,radius*.82,0,TAU);
    ctx.fill();
  }
  // One round cap with an oblique light lobe and a darker trailing perimeter.
  // A gradient occupies only the original bead radius, unlike two translated
  // solid disks whose overlap looks like flat pasted circles. Keep a cheap
  // sub-unit fallback for narrow nested lines and minimal Canvas2D adapters.
  if(radius>=.75&&typeof ctx.createRadialGradient==='function'){
    const facing=sandCapDiffuse(light,light.x*.48,light.y*.48);
    const trailing=sandCapDiffuse(light,-light.x*.72,-light.y*.72);
    const g=ctx.createRadialGradient(x+light.x*radius*.32,
      y+light.y*radius*.32,0,x,y,radius*1.04);
    const shine=style.lightAlpha*light.light*facing;
    const shade=style.shadowAlpha*light.shadow*(1-trailing*.35);
    g.addColorStop(0,'rgba('+light.high+','+(shine*.79).toFixed(4)+')');
    g.addColorStop(.42,'rgba('+light.high+','+(shine*.34).toFixed(4)+')');
    g.addColorStop(.75,'rgba('+light.shade+','+(shade*.12).toFixed(4)+')');
    g.addColorStop(1,'rgba('+light.shade+','+(shade*.57).toFixed(4)+')');
    ctx.fillStyle=g;
    ctx.beginPath();ctx.arc(x,y,radius,0,TAU);ctx.fill();
  }else if(light.light>0){
    // Tiny strokes should stay one small glint, not allocate gradients.
    ctx.fillStyle='rgba('+light.high+','+
      (style.lightAlpha*light.light*.83).toFixed(4)+')';
    ctx.beginPath();ctx.arc(x+light.x*radius*.17,
      y+light.y*radius*.17,radius*.68,0,TAU);ctx.fill();
  }
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
