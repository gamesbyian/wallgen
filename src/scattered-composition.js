// Independent, deterministic circles in the 600 × 1300 design plane.
// Placement consumes its own namespaced PRNG: palette, texture and camera
// variation never cause the same geometry to move or change diameter.
const W=600,H=1300,TAU=2*Math.PI;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const randomStream=seed=>{let x=hash(seed);return ()=>{
  x=(x+0x6d2b79f5)>>>0;
  let z=Math.imul(x^(x>>>15),1|x);
  z^=z+Math.imul(z^(z>>>7),61|z);
  return ((z^(z>>>14))>>>0)/4294967296;
};};
const between=(r,a,b)=>a+(b-a)*r();
const point=(x,y)=>({x,y});
const POLY_SAMPLES=144;
const rim=(cx,cy,r)=>Array.from({length:POLY_SAMPLES},(_,i)=>{
  const t=TAU*i/POLY_SAMPLES;return point(cx+r*Math.cos(t),cy+r*Math.sin(t));
});
const intersects=(a,b,gap)=>Math.hypot(a.cx-b.cx,a.cy-b.cy)<a.r+b.r+gap-1e-6;
const visibleFraction=({cx,cy,r})=>{
  // Cheap conservative visibility estimate: closest on-frame point must
  // approach the centre, and circle may not sit almost entirely outside.
  const distance=Math.hypot(Math.max(0,-cx,cx-W),Math.max(0,-cy,cy-H));
  return distance<r*.92;
};
const cropped=({cx,cy,r})=>cx-r<0||cx+r>W||cy-r<0||cy+r>H;
const within=({cx,cy,r})=>cx-r>=0&&cx+r<=W&&cy-r>=0&&cy+r<=H;

export const RAINBOW_ORBITS=Object.freeze({
  structure:'regions',regionMode:'scattered',scatteredCount:7,
  scatteredMinSize:10,scatteredMaxSize:83,scatteredVariation:92,
  scatteredSpacing:28,scatteredEdgeCrop:75,scatteredOverlap:'separate',
  palette:'classic',background:'black',material:'none',
  outline:'none',dividerColor:'none',dividerWidth:0,
  lightingMood:'off',glow:0,
});

/**
 * Returns ordinary region objects with an analytic circle for exact painting
 * and sampled vertices only for legacy polygon-aware interior decorations.
 * No renderer ever scales a polygon and mistakes it for a true circle.
 *
 * On unsatisfiable constraints, attempts fewer/lower candidate radii, but
 * never violates the requested minimum, overlap mode or colour semantics.
 * A typed diagnostic and requested/placed counts expose any shortfall.
 */
export function buildScatteredCircles(recipe){
  const count=clamp(Math.round(Number(recipe.scatteredCount)||7),1,70);
  const minPercent=clamp(Number(recipe.scatteredMinSize)||0,0,100);
  const maxPercent=clamp(Number(recipe.scatteredMaxSize)||0,0,100);
  const variation=clamp(Number(recipe.scatteredVariation)||0,0,100)/100;
  const crop=clamp(Number(recipe.scatteredEdgeCrop)||0,0,100)/100;
  const clearance=clamp(Number(recipe.scatteredSpacing)||0,0,100)*.65;
  const overlap=recipe.scatteredOverlap==='overlap';
  const minRadius=8+minPercent*.65;
  const maxRadius=Math.max(minRadius,20+maxPercent*2.12);
  const sizeRng=randomStream(recipe.seed+':scattered-sizes:v1');
  const placementRng=randomStream(recipe.seed+':scattered-positions:v1');
  // Mix radically large and small pieces for the seven-circle archetype.
  // Order by radius during packing, then restore stable colour-index order.
  const requested=Array.from({length:count},(_,i)=>{
    const sample=sizeRng();
    const t=(1-variation)*.5+variation*Math.pow(sample,1.65);
    return {index:i,r:minRadius+(maxRadius-minRadius)*t,tie:sizeRng()};
  }).sort((a,b)=>b.r-a.r||a.tie-b.tie);
  const objects=[];
  // A bounded, user-controlled fraction: the remaining circles stay fully
  // in frame, giving cropped silhouettes meaningful negative-space contrast.
  const mandatoryCrop=Math.min(count,Math.round(count*crop*.55));
  let croppedCount=0;
  const gap=clearance;
  for(const item of requested){
    // The hard cap makes 70-object stress cases finite; use local scale-down
    // instead of changing all previously accepted circles after each trial.
    const radiusStops=[1,.88,.76,.65,.54,.44,.36,.28];
    let chosen=null;
    for(const fraction of radiusStops){
      const radius=Math.max(minRadius,item.r*fraction);
      // Once the requested radius is below the protected min, further
      // passes cannot produce a new result.
      if(chosen)break;
      const mustCrop=croppedCount<mandatoryCrop;
      let best=null,bestScore=-Infinity;
      for(let tryIndex=0;tryIndex<280;tryIndex++){
        const edgeTarget=mustCrop;
        let cx,cy;
        if(edgeTarget){
          const edge=Math.floor(placementRng()*4);
          const penetration=between(placementRng,.13,.82);
          if(edge===0){cx=radius*penetration;cy=between(placementRng,radius,H-radius);}
          else if(edge===1){cx=W-radius*penetration;cy=between(placementRng,radius,H-radius);}
          else if(edge===2){cy=radius*penetration;cx=between(placementRng,radius,W-radius);}
          else {cy=H-radius*penetration;cx=between(placementRng,radius,W-radius);}
        }else{
          // Tall disks with a radius > half canvas width can only succeed
          // when edge cropping is allowed.
          const x0=radius,x1=W-radius,y0=radius,y1=H-radius;
          cx=x0<=x1?between(placementRng,x0,x1):W/2;
          cy=y0<=y1?between(placementRng,y0,y1):H/2;
        }
        const trial={cx,cy,r:radius};
        if(!visibleFraction(trial))continue;
        if(mustCrop&&!cropped(trial))continue;
        if(!edgeTarget&&!within(trial))continue;
        if(!overlap&&objects.some(obj=>intersects(trial,obj.circle,gap)))continue;
        // Choose widely spaced placements, with deterministic tiny noise to
        // avoid geometric lattices and bunching in tall negative space.
        const nearest=objects.length?Math.min(...objects.map(o=>
          Math.hypot(cx-o.circle.cx,cy-o.circle.cy)-radius-o.circle.r)):220;
        const balance=Math.min(cx,W-cx)/W+Math.min(cy,H-cy)/H;
        const score=nearest*.6+balance*28+placementRng()*55;
        if(score>bestScore){best=trial;bestScore=score;}
      }
      if(best)chosen=best;
      if(radius===minRadius)break;
    }
    if(!chosen)continue;
    if(cropped(chosen))croppedCount++;
    objects.push({
      kind:'region',id:'region-'+item.index,colorIndex:item.index%7,
      circle:chosen,vertices:rim(chosen.cx,chosen.cy,chosen.r),
      origin:point(chosen.cx,chosen.cy),
    });
  }
  objects.sort((a,b)=>a.colorIndex-b.colorIndex||
    Number(a.id.slice(7))-Number(b.id.slice(7)));
  const placed=objects.length;
  return {objects,requested:count,placed,
    diagnostic:placed<count?
      'Only '+placed+' of '+count+' circles fit with the selected minimum size and spacing. Reduce size, spacing, or count.':
      null,cropped:croppedCount};
}
