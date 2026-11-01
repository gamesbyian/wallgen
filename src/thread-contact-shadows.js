// Source-topology embroidery: a contact shade is allowed only where an
// actual later satin stitch crosses a previously painted lower satin stitch.
// The owning renderer's full ribbon mask remains active; this pass clips
// *again* to the lower stitch capsule, never to the open coloured substrate.
// Over/Under/Weave policy is owned by the renderer. Only default "over" is
// currently eligible; other z policies must not manufacture contact shadows.
import {samplePath,widthAt} from './path-geometry.js';
import {threadCrossingGraph} from './thread-crossings.js';
import {threadLightProfile} from './thread-lighting.js';

const finite=Number.isFinite;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
/** Pure full-original-source plan. Never make one from a crossing replay's
 * cropped station range: it would lose the original lower/upper relationship.
 * This slice supports actual satin/satin-soft ribbon segments only; chain
 * cubics, fibres and region rows need separate topology-specific models. */
export function planSatinThreadContacts(stripe,extent,treatment,lighting){
  if(!stripe||!treatment||!lighting||!finite(extent)||extent<=0||
    !finite(treatment.pitch)||treatment.pitch<=0||
    !['satin','satin-soft'].includes(treatment.style)||
    !finite(lighting.shadow)||lighting.shadow<=0)return null;
  // Initial optical scope is truly returning/self-crossing ribbons. Normal
  // straight, wave and hairpin surfaces retain their existing fast lighting
  // path rather than building a 2,500-station candidate graph every redraw.
  const geometry=stripe.sharedGeometry??stripe.geometry;
  if(!['loop','loops','drawn'].includes(geometry))return null;
  const step=treatment.pitch,interval=Math.max(step,2*extent/2500);
  // Use the original visible source station span, including exact authored
  // floating/drawn truncations. A clipped-away invisible stitch cannot cast
  // a contact shadow onto otherwise visible yarn.
  const start=Math.max(-extent,stripe.segmentStart??-extent);
  const end=Math.min(extent,stripe.segmentEnd??extent);
  if(!finite(start)||!finite(end)||end<start)return null;
  const first=Math.max(0,Math.ceil((start+extent)/interval-1e-9));
  const last=Math.min(2500,Math.floor((end+extent)/interval+1e-9));
  const inkWidth=clamp(step*.26,.7,2.5);
  const segments=[];
  for(let i=first;i<=last;i++){
    const station=-extent+i*interval;
    const p=samplePath(stripe,station,extent);
    const w=widthAt(stripe,station,extent)*.485;
    if(!finite(w)||w<=0||
      ![p.x,p.y,p.nx,p.ny].every(finite))continue;
    const a={x:p.x-p.nx*w,y:p.y-p.ny*w},
      b={x:p.x+p.nx*w,y:p.y+p.ny*w};
    if(![a.x,a.y,b.x,b.y].every(finite))continue;
    segments.push({id:'satin-'+i,owner:'source-ribbon',
      course:'satin',sourceIndex:i,station,start:a,end:b,width:inkWidth});
  }
  try{
    const events=threadCrossingGraph(segments);
    // Shadows are addressed by the ORIGINAL station index rather than the
    // compacted segment-array index (invalid-width stations are skipped).
    const byStation=new Map();
    for(const hit of events){
      const top=segments[hit.aboveIndex],bottom=segments[hit.belowIndex];
      if(!top||!bottom||top.sourceIndex<=bottom.sourceIndex)continue;
      if(!byStation.has(top.sourceIndex))byStation.set(top.sourceIndex,[]);
      byStation.get(top.sourceIndex).push({hit,top,bottom});
    }
    return {byStation,segments,contacts:events.length};
  }catch(error){
    // An imported or extreme source can be too dense for the fixed work
    // budget. Fall back to the established lit embroidery rather than break
    // all wallpaper rendering or silently truncate a contact graph.
    if(error instanceof RangeError)return null;
    throw error;
  }
}
/** Trace the real lower yarn's round-capped source-width footprint.
 * Its two semicircles project forward/back along the stitch tangent. Keep
 * this as a Canvas2D vector path rather than a pixel buffer, screen-unit
 * approximation, rectangular clip or ellipse wider than the original yarn.
 * Caller owns ctx.save/clip and the full original colour-region/ribbon clip. */
export function traceThreadContactCapsule(ctx,a,b,width){
  const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
  if(!Number.isFinite(length)||length<.75||
    !Number.isFinite(width)||width<=0)return false;
  const nx=-dy/length,ny=dx/length,r=width*.5;
  const normal=Math.atan2(ny,nx);
  ctx.beginPath();
  ctx.moveTo(a.x+nx*r,a.y+ny*r);
  ctx.lineTo(b.x+nx*r,b.y+ny*r);
  ctx.arc(b.x,b.y,r,normal,normal-Math.PI,true);
  ctx.lineTo(a.x-nx*r,a.y-ny*r);
  ctx.arc(a.x,a.y,r,normal-Math.PI,normal-2*Math.PI,true);
  ctx.closePath();
  return true;
}
/** Draw at a proven original-station intersection BEFORE its upper stitch.
 * The contact shade is clipped to the *actual round-capped lower yarn*
 * and the renderer's existing original-geometry ink mask; it cannot colour
 * an exposed rectangular corner beyond a stitch endpoint.
 * The upper stitch subsequently paints in unchanged source z order. */
export function paintSatinThreadContacts(ctx,contacts,lighting,pitch,relief){
  if(!Array.isArray(contacts)||!contacts.length||!lighting||
    !finite(lighting.shadow)||lighting.shadow<=0)return 0;
  let painted=0;
  for(const {hit,top,bottom} of contacts){
    const {start:a,end:b,width}=bottom;
    const length=Math.hypot(b.x-a.x,b.y-a.y);
    const profile=threadLightProfile(lighting,top.start.x,top.start.y,
      top.end.x,top.end.y,pitch,relief);
    if(!profile||!finite(length)||length<.75)continue;
    ctx.save();
    if(!traceThreadContactCapsule(ctx,a,b,width)){
      ctx.restore();continue;
    }
    ctx.clip();
    // A local projected soft contact footprint (in authored world units).
    // No Canvas shadowBlur: an unbounded blur would bleed through the mask.
    const radius=clamp(Math.max(width*1.65,pitch*.3),.5,pitch*.65);
    ctx.beginPath();
    ctx.arc(hit.x+profile.shadowX,hit.y+profile.shadowY,radius,0,Math.PI*2);
    ctx.fillStyle='rgba('+profile.shadeRgb+','+
      (.24*profile.shade).toFixed(3)+')';
    ctx.fill();
    ctx.restore();
    painted++;
  }
  return painted;
}


/** Resolve crossing-replay contacts from one COMPLETE original satin graph.
 *
 * The source graph's default ordering always stores early as below and late
 * as above. The original renderer's crossingTopIsLater(mode,stripe,k) is the
 * sole authority for which traversal is physically foreground at this major
 * ribbon junction. Reconcile both facts here without re-solving a cropped
 * segment graph, and reject all contacts unrelated to this one junction.
 *
 * Input coordinates are source design units; this is a transient draw plan,
 * not editable, serialized, raster or viewport geometry.
 */
export function selectSatinReplayContacts(plan,crossing,halfLength,
  topIsLater,sourceWidth){
  const result=new Map();
  if(!plan||!(plan.byStation instanceof Map)||
     !Number.isFinite(crossing?.early)||!Number.isFinite(crossing?.late)||
     !Number.isFinite(crossing?.x)||!Number.isFinite(crossing?.y)||
     !Number.isFinite(halfLength)||halfLength<=0||
     !Number.isFinite(sourceWidth)||sourceWidth<=0||
     typeof topIsLater!=='boolean')return result;
  const radius=Math.max(2,Math.min(96,sourceWidth*.7));
  const radiusSquared=radius*radius;
  const early=crossing.early,late=crossing.late;
  const assigned=(s,station)=>{
    // Both windows can overlap at tight turns. A stitch belongs to the
    // nearest original traversal, with its actual source station preserved.
    if(Math.abs(s-station)>halfLength)return false;
    const other=station===early?late:early;
    return Math.abs(s-station)<Math.abs(s-other);
  };
  for(const batch of plan.byStation.values())for(const item of batch){
    const {hit}=item,first=item.bottom,second=item.top;
    if(!hit||!first||!second||
       !assigned(first.station,early)||!assigned(second.station,late)||
       (hit.x-crossing.x)**2+(hit.y-crossing.y)**2>radiusSquared)continue;
    const top=topIsLater?second:first;
    const bottom=topIsLater?first:second;
    const entry={hit,top,bottom};
    if(!result.has(top.sourceIndex))result.set(top.sourceIndex,[]);
    result.get(top.sourceIndex).push(entry);
  }
  return result;
}
