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
      materialFamily:'embroidery',style:['satin','tatami'].includes(raw.style)?raw.style:'satin',
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
  for(const item of treatments||[]){
    if(!item.enabled||item.materialFamily!=='embroidery'||item.target.role!=='fill')continue;
    if(item.target.scope==='all')return item;
    if(item.target.scope==='object'&&item.target.ids.includes(id))return item;
    if(item.target.scope==='palette'&&item.target.colorSlots.includes(colorSlot))return item;
  }
  return null;
}
function stitchInk(ctx,brightness,relief){
  const alpha=(.10+relief/100*.24)*brightness;
  ctx.strokeStyle='rgba(255,255,255,'+alpha.toFixed(3)+')';
}
/** Draw transverse thread ribs along the same tangent/normal path as ribbon geometry.
 * Caller establishes the actual stripe footprint as the active clipping mask.
 */
export function drawRibbonEmbroidery(ctx,stripe,extent,treatment,range=null){
  if(!treatment||!Number.isFinite(extent)||extent<=0)return 0;
  const step=treatment.pitch;
  const interval=Math.max(step,2*extent/2500);
  const start=Math.max(-extent,range?.start??-extent),
    end=Math.min(extent,range?.end??extent);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)return 0;
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
    // Dark underlay and offset bright ridge create a restrained raised cord.
    ctx.beginPath();ctx.moveTo(ax+.55,ay+.55);ctx.lineTo(bx+.55,by+.55);
    ctx.strokeStyle='rgba(0,0,0,.31)';ctx.stroke();
    ctx.beginPath();ctx.moveTo(ax-.42,ay-.42);ctx.lineTo(bx-.42,by-.42);
    stitchInk(ctx,1,treatment.relief);ctx.stroke();
    count++;
  }
  ctx.restore();
  return count;
}
const regionBounds=object=>{
  if(object.circle){const {cx,cy,r}=object.circle;return {left:cx-r,right:cx+r,top:cy-r,bottom:cy+r};}
  const points=(object.rings||[object.vertices]).flat();
  return {left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),
    top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))};
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
  ctx.save();
  ctx.translate((left+right)/2,(top+bottom)/2);
  ctx.rotate((treatment.direction+((height>width)?90:0))*Math.PI/180);
  ctx.lineCap='round';
  ctx.lineWidth=Math.max(.7,Math.min(2.5,treatment.pitch*.25));
  for(let k=-n;k<=n;k++){
    const y=k*treatment.pitch;
    if(Math.abs(y)>diagonal*.7)continue;
    ctx.beginPath();ctx.moveTo(-diagonal*.8,y+.5);ctx.lineTo(diagonal*.8,y+.5);
    ctx.strokeStyle='rgba(0,0,0,.25)';ctx.stroke();
    ctx.beginPath();ctx.moveTo(-diagonal*.8,y-.5);ctx.lineTo(diagonal*.8,y-.5);
    stitchInk(ctx,.82,treatment.relief);ctx.stroke();
  }
  ctx.restore();
  return n*2+1;
}
