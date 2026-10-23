import {samplePath,widthAt} from './path-geometry.js';

// Surface roles are addressed by authored object IDs or semantic ROYGBIV
// colour slots. This optional array is never inferred from legacy textures.
const bounds=(value,fallback,min,max)=>{
  const n=Number(value);
  return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;
};
export function normalizeSurfaceTreatments(input){
  if(!Array.isArray(input))return [];
  const seen=new Set(),out=[];
  for(const raw of input.slice(0,32)){
    if(!raw||typeof raw!=='object')continue;
    const id=String(raw.id||'').trim().slice(0,72);
    if(!/^[a-zA-Z0-9_-]{1,72}$/.test(id)||seen.has(id))continue;
    seen.add(id);
    const src=raw.target&&typeof raw.target==='object'?raw.target:{};
    const scope=['all','palette','object'].includes(src.scope)?src.scope:'palette';
    const colorSlots=[...new Set((Array.isArray(src.colorSlots)?src.colorSlots:[])
      .filter(i=>Number.isInteger(i)&&i>=0&&i<7))].slice(0,7);
    const ids=[...new Set((Array.isArray(src.ids)?src.ids:[])
      .filter(i=>typeof i==='string'&&/^[a-zA-Z0-9_\/-]{1,84}$/.test(i)))].slice(0,16);
    out.push({
      id,enabled:raw.enabled===true||raw.enabled==='true',
      materialFamily:'embroidery',style:['satin','satin-soft','tatami','running','chain','satin-fibre','tatami-fibre'].includes(raw.style)?raw.style:'satin',
      target:{scope,role:'fill',colorSlots,ids},
      pitch:bounds(raw.pitch,5,2,16),relief:bounds(raw.relief,65,0,100),
      direction:bounds(raw.direction,38,-180,180),
    });
    if(out.length===12)break;
  }
  return out;
}
export function matchingEmbroidery(treatments,{id,colorSlot,role='fill'}={}){
  if(role!=='fill')return null;
  // A specific authored object wins over its colour group, which wins over
  // the blanket fill. Equal-scope ties retain their saved order. Otherwise an
  // editor-owned "All" layer could silently mask precise imported assignments.
  let best=null,priority=0;
  for(const item of treatments||[]){
    if(!item.enabled||item.materialFamily!=='embroidery'||item.target.role!=='fill')continue;
    const match=item.target.scope==='object'&&item.target.ids.includes(id)?3:
      item.target.scope==='palette'&&item.target.colorSlots.includes(colorSlot)?2:
      item.target.scope==='all'?1:0;
    if(match>priority){best=item;priority=match;}
  }
  return best;
}
function stitchInk(ctx,brightness,relief){
  const alpha=(.10+relief/100*.24)*brightness;
  ctx.strokeStyle='rgba(255,255,255,'+alpha.toFixed(3)+')';
}
// Two curved thread spans close into a linked oval. The link is an actual
// cubic path rather than a dashed straight stroke. Adjacent links meet at
// exactly the same globally anchored ends, with the following loop visually
// trapping its predecessor. Coordinates are supplied by the existing
// tangent/normal of a path, or the region's rotated local coordinate frame.
// Two restrained offset strokes suggest depth without recolouring the ink.
function chainLink(ctx,x,y,tx,ty,nx,ny,half,loft,relief){
  const loop=(shift)=>{
    const cx=x+nx*shift,cy=y+ny*shift;
    const point=(along,across)=>[cx+tx*along+nx*across,
      cy+ty*along+ny*across];
    const a=point(-half,0),b=point(half,0);
    const upper1=point(-half*.55,loft),upper2=point(half*.6,loft);
    const lower1=point(half*.6,-loft),lower2=point(-half*.55,-loft);
    ctx.beginPath();ctx.moveTo(...a);
    ctx.bezierCurveTo(...upper1,...upper2,...b);
    ctx.bezierCurveTo(...lower1,...lower2,...a);
  };
  loop(.42);ctx.strokeStyle='rgba(0,0,0,.20)';ctx.stroke();
  loop(-.3);stitchInk(ctx,.68,relief);ctx.stroke();
}
// Opt-in fibre appearance. An underlaid dark edge, two thin strands and a
// softly interrupted glint respond to the *actual stitch direction*. Since
// the coloured fill stays exposed between filaments, a saturated ribbon does
// not turn into opaque grey hatching. Every stroke is clipped by the caller's
// original ribbon/compound path, including holes and detached islands.
// All phase values are lattice indices, so crossing replays paint identically.
function fibreSpan(ctx,ax,ay,bx,by,pitch,relief,phase){
  const dx=bx-ax,dy=by-ay,length=Math.hypot(dx,dy);
  if(!Number.isFinite(length)||length<.75)return;
  const nx=-dy/length,ny=dx/length,depth=relief/100;
  const light=(nx-ny)/Math.SQRT2; // stable upper-left grazing illumination
  const side=light>=0?1:-1;
  const underlay=.03+depth*.085;
  const strand=.028+depth*.075;
  const highlight=(.025+depth*.10)*(.55+.45*Math.abs(light));
  const offset=Math.min(.64,Math.max(.25,pitch*.105));
  const path=(sx,sy,ex,ey)=>{
    ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();
  };
  // Shallow underlay first; it belongs to this one stitch and does not shade
  // adjacent unstitched ink or the substrate outside the clipped surface.
  ctx.lineWidth=Math.min(3.2,Math.max(.8,pitch*.32));
  ctx.strokeStyle='rgba(0,0,0,'+underlay.toFixed(3)+')';
  path(ax+nx*.35+.18,ay+ny*.35+.18,bx+nx*.35+.18,by+ny*.35+.18);
  ctx.lineWidth=Math.min(.9,Math.max(.4,pitch*.115));
  ctx.strokeStyle='rgba(0,0,0,'+strand.toFixed(3)+')';
  path(ax-nx*offset*side,ay-ny*offset*side,
    bx-nx*offset*side,by-ny*offset*side);
  ctx.strokeStyle='rgba(255,255,255,'+highlight.toFixed(3)+')';
  path(ax+nx*offset*side,ay+ny*offset*side,
    bx+nx*offset*side,by+ny*offset*side);
  // Fibre twists interrupt specular reflection. Never use per-render RNG:
  // alternate the glint position on the original world-space stitch lattice.
  const start=(phase&1)? .13:.44,end=Math.min(.95,start+.32);
  ctx.lineWidth=Math.min(.65,Math.max(.32,pitch*.085));
  ctx.strokeStyle='rgba(255,255,255,'+(highlight*.65).toFixed(3)+')';
  path(ax+dx*start+nx*offset*.4*side,ay+dy*start+ny*offset*.4*side,
    ax+dx*end+nx*offset*.4*side,ay+dy*end+ny*offset*.4*side);
}
/** Draw transverse thread ribs along the same tangent/normal path as ribbon geometry.
 * Caller establishes the actual stripe footprint as the active clipping mask.
 */
export function drawRibbonEmbroidery(ctx,stripe,extent,treatment,range=null){
  if(!treatment||!Number.isFinite(extent)||extent<=0)return 0;
  const step=treatment.pitch;
  const gentle=treatment.style==='satin-soft';
  const fibre=treatment.style==='satin-fibre'||treatment.style==='tatami-fibre';
  const interval=Math.max(step,2*extent/2500);
  const start=Math.max(-extent,range?.start??-extent),
    end=Math.min(extent,range?.end??extent);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)return 0;
  if(treatment.style==='chain'){
    // Three rows of interlinked loops. One original-world station lattice
    // serves both full painting and clipped crossing-branch replays.
    const linkStep=Math.max(step*2.8,2*extent/950);
    const firstLink=Math.max(0,Math.ceil((start+extent)/linkStep-1e-9));
    const lastLink=Math.min(950,Math.floor((end+extent)/linkStep+1e-9));
    let count=0;
    ctx.save();
    ctx.lineCap='round';ctx.lineJoin='round';
    ctx.lineWidth=Math.max(.8,Math.min(2,step*.24));
    for(let i=firstLink;i<=lastLink;i++){
      const station=-extent+i*linkStep;
      if(station+linkStep>extent)break;
      const p=samplePath(stripe,station+linkStep*.5,extent);
      const halfWidth=widthAt(stripe,station+linkStep*.5,extent)*.46;
      if(![p.x,p.y,p.tx,p.ty,p.nx,p.ny,halfWidth].every(Number.isFinite)||
        halfWidth<=0)continue;
      const half=linkStep*.51,loft=Math.min(step*.72,half*.62,halfWidth*.48);
      for(const lane of [-.66,0,.66]){
        chainLink(ctx,p.x+p.nx*halfWidth*lane,p.y+p.ny*halfWidth*lane,
          p.tx,p.ty,p.nx,p.ny,half,loft,treatment.relief);
        count++;
      }
    }
    ctx.restore();
    return count;
  }
  if(treatment.style==='running'){
    // Three slender interrupted seams follow the authored centreline, rather
    // than drawing transverse satin ribs. All segments use one immutable
    // station lattice, so crossing branch replay remains exactly in phase.
    const runInterval=Math.max(step*2.6,2*extent/1600);
    const firstRun=Math.max(0,Math.ceil((start+extent)/runInterval-1e-9));
    const lastRun=Math.min(1600,Math.floor((end+extent)/runInterval+1e-9));
    let count=0;
    ctx.save();
    ctx.lineCap='round';
    ctx.lineWidth=Math.max(.7,Math.min(2.2,step*.25));
    for(let i=firstRun;i<=lastRun;i++){
      const station=-extent+i*runInterval;
      const endStation=Math.min(extent,station+runInterval*.64);
      if(endStation-station<.75)continue;
      const a=samplePath(stripe,station,extent);
      const b=samplePath(stripe,endStation,extent);
      const aw=widthAt(stripe,station,extent)*.48;
      const bw=widthAt(stripe,endStation,extent)*.48;
      if(![a.x,a.y,b.x,b.y,a.nx,a.ny,b.nx,b.ny,aw,bw].every(Number.isFinite)||
        aw<=0||bw<=0)continue;
      for(const lane of [-.68,0,.68]){
        const ax=a.x+a.nx*aw*lane,ay=a.y+a.ny*aw*lane;
        const bx=b.x+b.nx*bw*lane,by=b.y+b.ny*bw*lane;
        ctx.beginPath();ctx.moveTo(ax+.48,ay+.48);ctx.lineTo(bx+.48,by+.48);
        ctx.strokeStyle='rgba(0,0,0,.31)';ctx.stroke();
        ctx.beginPath();ctx.moveTo(ax-.38,ay-.38);ctx.lineTo(bx-.38,by-.38);
        stitchInk(ctx,1,treatment.relief);ctx.stroke();
        count++;
      }
    }
    ctx.restore();
    return count;
  }
  // Every segment samples the *same station lattice* as the full ribbon.
  // Self-crossing touch-ups must never restart the stitch phase, nor rewalk
  // 2,500 stations at every intersection. The optional range only changes
  // the number of candidate stations, not their positions or appearance.
  const first=Math.max(0,Math.ceil((start+extent)/interval-1e-9));
  const last=Math.min(2500,Math.floor((end+extent)/interval+1e-9));
  let count=0;
  ctx.save();
  ctx.lineCap='round';
  ctx.lineWidth=Math.max(.7,Math.min(2.5,step*.26));
  for(let i=first;i<=last;i++){
    const station=-extent+i*interval;
    const p=samplePath(stripe,station,extent);
    const w=widthAt(stripe,station,extent)*.485;
    if(!Number.isFinite(w)||w<=0)continue;
    const ax=p.x-p.nx*w,ay=p.y-p.ny*w,bx=p.x+p.nx*w,by=p.y+p.ny*w;
    if(fibre){fibreSpan(ctx,ax,ay,bx,by,step,treatment.relief,i);count++;continue;}
    // Dark underlay and offset bright ridge create a restrained raised cord.
    ctx.beginPath();ctx.moveTo(ax+.55,ay+.55);ctx.lineTo(bx+.55,by+.55);
    ctx.strokeStyle=gentle?'rgba(0,0,0,.11)':'rgba(0,0,0,.31)';ctx.stroke();
    ctx.beginPath();ctx.moveTo(ax-.42,ay-.42);ctx.lineTo(bx-.42,by-.42);
    stitchInk(ctx,gentle?.43:1,treatment.relief);ctx.stroke();
    count++;
  }
  ctx.restore();
  return count;
}
const regionBounds=object=>{
  if(object.circle){const {cx,cy,r}=object.circle;return {left:cx-r,right:cx+r,top:cy-r,bottom:cy+r};}
  // Imported multi-ring silhouettes can have tens of thousands of vertices.
  // Avoid spreading them as function arguments (engine-dependent call limit),
  // copying all coordinates, or treating an empty ring as a real bound.
  let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
  for(const ring of object.rings||[object.vertices]){
    if(!Array.isArray(ring))continue;
    for(const p of ring){
      if(!Number.isFinite(p?.x)||!Number.isFinite(p?.y))
        return {left:NaN,right:NaN,top:NaN,bottom:NaN};
      left=Math.min(left,p.x);right=Math.max(right,p.x);
      top=Math.min(top,p.y);bottom=Math.max(bottom,p.y);
    }
  }
  return {left,right,top,bottom};
};
/** Fill with crossed half-tone rows clipped by the caller's even-odd region
 * path (including holes and disjoint imported islands). No mask allocations.
 */
export function drawRegionEmbroidery(ctx,object,treatment){
  if(!treatment)return 0;
  const {left,right,top,bottom}=regionBounds(object);
  if(![left,right,top,bottom].every(Number.isFinite))return 0;
  const width=right-left,height=bottom-top;
  const diagonal=Math.hypot(width,height);
  if(diagonal>5000||diagonal<1)return 0;
  const n=Math.min(1000,Math.ceil(diagonal/treatment.pitch));
  // Short interlocking tatami segments follow a stable world-space row lattice.
  // Segment length grows for huge bounds to cap Canvas2D stroke work. The
  // enclosing renderer's even-odd clip handles silhouette islands and holes.
  const tatami=treatment.style==='tatami'||treatment.style==='tatami-fibre';
  const fibre=treatment.style==='satin-fibre'||treatment.style==='tatami-fibre';
  const chain=treatment.style==='chain';
  const gentle=treatment.style==='satin-soft';
  const running=treatment.style==='running';
  const shortRows=tatami||running;
  const segment=Math.max(8,treatment.pitch*(tatami?3.2:2.2),
    diagonal*1.6*(2*n+1)/18000);
  let stitches=0;
  ctx.save();
  ctx.translate((left+right)/2,(top+bottom)/2);
  ctx.rotate((treatment.direction+((height>width)?90:0))*Math.PI/180);
  ctx.lineCap='round';
  ctx.lineWidth=Math.max(.7,Math.min(2.5,treatment.pitch*.25));
  // Chain fills need fewer, distinct loop courses than closely stacked
  // satin rows. Limit total curve work for large imported multi-ring art.
  const chainStride=Math.max(2,Math.ceil((2*n+1)/120));
  const chainRows=Math.ceil((2*n+1)/chainStride);
  const chainStep=Math.max(treatment.pitch*2.8,
    diagonal*1.6*(chainRows+1)/5200);
  for(let k=-n;k<=n;k++){
    const y=k*treatment.pitch;
    if(Math.abs(y)>diagonal*.7)continue;
    if(chain){
      if((k+n)%chainStride!==0)continue;
      const limit=diagonal*.8;
      const index=Math.floor((k+n)/chainStride);
      const offset=(index%2)*chainStep*.5;
      for(let x=-limit+offset;x+chainStep<=limit;x+=chainStep){
        chainLink(ctx,x+chainStep*.5,y,1,0,0,1,
          chainStep*.51,Math.min(treatment.pitch*.74,chainStep*.29),
          treatment.relief);
        stitches++;
      }
    }else if(shortRows){
      const limit=diagonal*.8;
      const period=tatami?3:2;
      const offset=((k%period+period)%period)*segment/period;
      for(let x=-limit-segment+offset;x<limit;x+=segment){
        const a=Math.max(-limit,x+.7),b=Math.min(limit,x+segment-.7);
        if(b-a<1)continue;
        if(fibre){
          fibreSpan(ctx,a,y,b,y,treatment.pitch,treatment.relief,
            k*8191+Math.floor((x+limit+segment)/segment));
          stitches++;continue;
        }
        ctx.beginPath();ctx.moveTo(a,y+.5);ctx.lineTo(b,y+.5);
        ctx.strokeStyle='rgba(0,0,0,.25)';ctx.stroke();
        ctx.beginPath();ctx.moveTo(a,y-.5);ctx.lineTo(b,y-.5);
        stitchInk(ctx,.82,treatment.relief);ctx.stroke();
        stitches++;
      }
    }else{
      if(fibre){
        fibreSpan(ctx,-diagonal*.8,y,diagonal*.8,y,
          treatment.pitch,treatment.relief,k);
        stitches++;continue;
      }
      ctx.beginPath();ctx.moveTo(-diagonal*.8,y+.5);ctx.lineTo(diagonal*.8,y+.5);
      ctx.strokeStyle=gentle?'rgba(0,0,0,.09)':'rgba(0,0,0,.25)';ctx.stroke();
      ctx.beginPath();ctx.moveTo(-diagonal*.8,y-.5);ctx.lineTo(diagonal*.8,y-.5);
      stitchInk(ctx,gentle?.37:.82,treatment.relief);ctx.stroke();
      stitches++;
    }
  }
  ctx.restore();
  return stitches;
}
