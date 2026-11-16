// Deterministic silhouette treatments shared by ribbon and closed-region painters.
// All distances are in design/world units, never pixels of the current viewport.
// The unstyled case is an exact no-op for historic recipes and render fixtures.
export const EDGE_STYLES=Object.freeze(['straight','scalloped','pinked','wavy','stepped']);
export const EDGE_DIRECTIONS=Object.freeze(['outward','inward','alternating']);
export const STRIPE_EDGE_SIDES=Object.freeze(['both','negative','positive']);
export const STRIPE_EDGE_ALIGNMENTS=Object.freeze(['aligned','staggered','independent']);
const TAU=Math.PI*2;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const fract=n=>n-Math.floor(n);
const smoothstep=t=>t*t*(3-2*t);
export const edgePitch=size=>18+clamp(Number(size)||0,0,100)*1.24;

// A scallop is a rounded, nonnegative lobe, unlike a wave's signed sine.
// It can be mirrored or alternated without changing its period or baseline.
export function edgeWave(style,station,pitch,phase=0,direction='outward'){
  if(style==='straight'||!Number.isFinite(station))return 0;
  const cycle=station/pitch+phase/100;
  const t=fract(cycle);
  let value=0;
  if(style==='scalloped')value=(1-Math.cos(TAU*t))*.5;
  else if(style==='pinked')value=1-Math.abs(2*t-1);
  else if(style==='wavy')value=Math.sin(TAU*t);
  else if(style==='stepped')value=(t>=.25&&t<.75)?1:0;
  if(direction==='inward')value=-value;
  else if(direction==='alternating'&&Math.abs(Math.floor(cycle)%2)===1)value=-value;
  return value;
}

// Both physical ribbon edges are displaced in their actual local normal.
// The local width cap prevents inward scallops from inverting a tapered band.
export function stripeEdgeOffset(stripe,station,side,localWidth){
  const style=stripe.edgeStyle??'straight';
  if(style==='straight'||!stripe.edgeDepth||
    (stripe.edgeSides==='negative'&&side!==-1)||
    (stripe.edgeSides==='positive'&&side!==1))return 0;
  const width=Math.max(0,localWidth);
  const amplitude=width*.44*clamp(stripe.edgeDepth,0,100)/100;
  const period=edgePitch(stripe.edgeSize??50);
  const phase=(stripe.edgePhasePercent??0);
  return side*amplitude*edgeWave(style,station,period,phase,
    stripe.edgeDirection??'outward');
}

const pointEqual=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-7;
const validPoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const cleanRing=source=>{
  const ring=[];
  for(const p of source||[]){
    if(!validPoint(p))continue;
    if(!ring.length||!pointEqual(ring.at(-1),p))ring.push({x:p.x,y:p.y});
  }
  if(ring.length>2&&pointEqual(ring[0],ring.at(-1)))ring.pop();
  return ring.length>=3?ring:[];
};
const signedArea=ring=>ring.reduce((sum,p,i)=>{
  const q=ring[(i+1)%ring.length];
  return sum+p.x*q.y-q.x*p.y;
},0)/2;
const insideRing=(point,ring)=>{
  let hit=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i],b=ring[j];
    if((a.y>point.y)!==(b.y>point.y)&&
      point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)hit=!hit;
  }
  return hit;
};
const edgeKey=(a,b)=>{
  const first=`${a.x.toFixed(5)},${a.y.toFixed(5)}`;
  const second=`${b.x.toFixed(5)},${b.y.toFixed(5)}`;
  return first<second?`${first}|${second}`:`${second}|${first}`;
};
const profileSignature=profile=>[
  profile.style,profile.size,profile.depth,profile.phase,profile.direction
].join(':');
const profileFor=(scene,object,overrides)=>{
  const base={
    style:scene.regionEdgeStyle??'straight',
    size:scene.regionEdgeSize??50,
    depth:scene.regionEdgeDepth??50,
    phase:scene.regionEdgePhase??0,
    direction:scene.regionEdgeDirection??'outward'
  };
  return {...base,...(overrides.get(object.id)||{})};
};
const effective=profile=>profile.style!=='straight'&&profile.depth>0;
const regionAmplitude=(depth,extent)=>Math.min(22*clamp(depth,0,100)/100,extent*.23);
const easing=(distance,length,pitch)=>{
  const reach=Math.min(length*.5,pitch*.32);
  return smoothstep(clamp(Math.min(distance,length-distance)/Math.max(1e-8,reach),0,1));
};
function segmentPoints(a,b,profile,{shared,mixed,hole=false,area=1}={}){
  const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
  if(length<1e-8)return [{x:a.x,y:a.y},{x:b.x,y:b.y}];
  const canonical=edgeKey(a,b).startsWith(`${a.x.toFixed(5)},${a.y.toFixed(5)}|`);
  // Shared boundaries are generated in the same canonical direction for both
  // owners, then reversed on the opposite side. No seams or phase reversals.
  const p=canonical?a:b,q=canonical?b:a;
  const tx=(q.x-p.x)/length,ty=(q.y-p.y)/length;
  const pitch=edgePitch(profile.size),amplitude=regionAmplitude(profile.depth,length);
  const steps=Math.max(4,Math.ceil(length/2.6),Math.ceil(length/pitch*18));
  const outwardSign=(area>=0?1:-1)*(hole?-1:1);
  const points=[];
  for(let i=0;i<=steps;i++){
    const t=i/steps,distance=t*length;
    const value=edgeWave(profile.style,distance,pitch,profile.phase,profile.direction);
    const envelope=easing(distance,length,pitch);
    // In a mixed-style shared edge each owner retreats into its own fill.
    // This intentionally reveals background rather than creating z-order
    // overlaps or covering the neighbouring region's decorative teeth.
    let nx=ty,ny=-tx,offset=amplitude*value*envelope;
    if(!shared){
      // For private edges, 'outward' is relative to this actual polygon.
      // Canonical direction may be opposite to the source winding.
      const sign=(canonical?1:-1)*outwardSign;
      nx*=sign;ny*=sign;
      if(mixed)offset=-Math.abs(offset);
    }
    points.push({x:p.x+t*(q.x-p.x)+nx*offset,
      y:p.y+t*(q.y-p.y)+ny*offset});
  }
  return canonical?points:points.reverse();
}
function sampleSegmentRing(ring,profile,sharedEdges,signature,objectId,hole){
  const result=[],area=signedArea(ring);
  for(let i=0;i<ring.length;i++){
    const a=ring[i],b=ring[(i+1)%ring.length],key=edgeKey(a,b);
    const owners=sharedEdges.get(key)||[];
    const shared=owners.length>1&&owners.every(owner=>owner.signature===signature);
    const mixed=owners.some(owner=>owner.id!==objectId&&owner.signature!==signature);
    const points=segmentPoints(a,b,profile,{shared,mixed,hole,area});
    result.push(...points.slice(0,-1));
  }
  return result.length>=3?result:ring;
}
function sampleContinuousRing(ring,profile,hole){
  const pitch=edgePitch(profile.size);
  const points=[];
  let length=0;
  for(let i=0;i<ring.length;i++){
    const a=ring[i],b=ring[(i+1)%ring.length];
    const dx=b.x-a.x,dy=b.y-a.y,segment=Math.hypot(dx,dy);
    const count=Math.max(1,Math.ceil(segment/Math.min(2.8,pitch/18)));
    for(let j=0;j<count;j++){
      const t=j/count;
      points.push({x:a.x+dx*t,y:a.y+dy*t,station:length+segment*t});
    }
    length+=segment;
  }
  if(points.length<3)return ring;
  const xs=ring.map(p=>p.x),ys=ring.map(p=>p.y);
  const extent=Math.min(Math.max(...xs)-Math.min(...xs),
    Math.max(...ys)-Math.min(...ys));
  const amplitude=regionAmplitude(profile.depth,Math.max(0,extent));
  const outwardSign=(signedArea(ring)>=0?1:-1)*(hole?-1:1);
  return points.map((p,i)=>{
    const previous=points[(i+points.length-1)%points.length];
    const next=points[(i+1)%points.length];
    const dx=next.x-previous.x,dy=next.y-previous.y;
    const norm=Math.hypot(dx,dy)||1;
    const wave=edgeWave(profile.style,p.station,pitch,profile.phase,profile.direction);
    return {x:p.x+outwardSign*dy/norm*amplitude*wave,
      y:p.y-outwardSign*dx/norm*amplitude*wave};
  });
}
const circleRing=({cx,cy,r})=>Array.from({length:Math.max(64,Math.ceil(TAU*r/2.5))},(_,i)=>{
  const a=TAU*i/Math.max(64,Math.ceil(TAU*r/2.5));
  return {x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r};
});

// Return the ordinary original objects in the default case. Region painters
// must use these resolved vertices for fill, clip, dividers, masks and relief.
export function decorateRegionObjects(objects,scene){
  const regions=objects.filter(object=>object.kind==='region'&&object.vertices?.length>=3);
  const overrides=new Map((scene.regionEdgeOverrides||[]).map(item=>[item.id,item]));
  if((scene.regionEdgeStyle??'straight')==='straight'&&
    ![...overrides.values()].some(item=>effective(item)))return regions;
  const ownerEdges=new Map();
  const profiles=new Map(regions.map(object=>[object.id,profileFor(scene,object,overrides)]));
  // Counting source edges before decoration makes every shared edge exact,
  // independent of paint order or which of its two regions is encountered first.
  for(const object of regions){
    const profile=profiles.get(object.id),signature=profileSignature(profile);
    if(!effective(profile))continue;
    const rings=object.rings||[object.vertices];
    for(const source of rings){
      const ring=cleanRing(source);
      for(let i=0;i<ring.length;i++){
        const key=edgeKey(ring[i],ring[(i+1)%ring.length]);
        if(!ownerEdges.has(key))ownerEdges.set(key,[]);
        ownerEdges.get(key).push({id:object.id,signature});
      }
    }
  }
  // Plain neighbours must also appear in the owner map so a styled cell
  // cannot silently paint over a straight-edged cell's boundary.
  for(const object of regions){
    const profile=profiles.get(object.id);
    if(effective(profile))continue;
    for(const source of object.rings||[object.vertices]){
      const ring=cleanRing(source);
      for(let i=0;i<ring.length;i++){
        const key=edgeKey(ring[i],ring[(i+1)%ring.length]);
        if(!ownerEdges.has(key))ownerEdges.set(key,[]);
        ownerEdges.get(key).push({id:object.id,signature:'straight'});
      }
    }
  }
  return regions.map(object=>{
    const profile=profiles.get(object.id);
    if(!effective(profile))return object;
    const original=object.circle?[circleRing(object.circle)]:
      (object.rings||[object.vertices]).map(cleanRing).filter(r=>r.length>=3);
    if(!original.length)return object;
    const signature=profileSignature(profile);
    const rings=original.map((ring,ringIndex)=>{
      const probe={x:(ring[0].x+ring[1].x)/2,y:(ring[0].y+ring[1].y)/2};
      const containing=original.filter((other,i)=>
        i!==ringIndex&&insideRing(probe,other)).length;
      const hole=containing%2===1;
      const hasShared=ring.some((a,i)=>
        (ownerEdges.get(edgeKey(a,ring[(i+1)%ring.length]))||[]).length>1);
      return hasShared?
        sampleSegmentRing(ring,profile,ownerEdges,signature,object.id,hole):
        sampleContinuousRing(ring,profile,hole);
    });
    return {...object,circle:undefined,vertices:rings[0],
      ...(object.rings?{rings}:{})};
  });
}

export function normalizeRegionEdgeOverrides(value){
  if(!Array.isArray(value))return [];
  const entries=[],seen=new Set();
  for(const item of value){
    if(!item||typeof item!=='object'||typeof item.id!=='string'||
      !/^[a-z0-9:_-]{1,96}$/i.test(item.id)||seen.has(item.id))continue;
    seen.add(item.id);
    const numerical=(key,fallback)=>Number.isFinite(Number(item[key]))?
      clamp(Number(item[key]),0,100):fallback;
    entries.push({id:item.id,
      style:EDGE_STYLES.includes(item.style)?item.style:'straight',
      size:numerical('size',50),depth:numerical('depth',50),
      phase:numerical('phase',0),
      direction:EDGE_DIRECTIONS.includes(item.direction)?item.direction:'outward'});
    if(entries.length===140)break;
  }
  return entries;
}
