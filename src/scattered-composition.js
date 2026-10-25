import {normalizeScatteredOverrides,effectiveScatteredLayerOrder} from './scattered-object-edits.js';
import {normalizeScatteredShapeOverrides} from './scattered-shape-overrides.js';
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
  seed:'orbits-209',structure:'regions',regionMode:'scattered',scatteredShapeKind:'circle',scatteredCount:7,
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
/** The same effective shape-size limits that placement uses.
 * A high object count can cap the maximum, and Smallest may force the
 * maximum upward. Report these facts without changing authored preferences.
 */
export function scatteredRadiusRange(recipe){
  const count=clamp(Math.round(Number(recipe.scatteredCount)||7),1,70);
  const minPercent=clamp(Number(recipe.scatteredMinSize)||0,0,100);
  const maxPercent=clamp(Number(recipe.scatteredMaxSize)||0,0,100);
  const minRadius=8+minPercent*.65;
  const requestedMax=20+maxPercent*3.4;
  const countCap=count<=10?Infinity:170*Math.sqrt(10/count);
  const maxRadius=Math.max(minRadius,Math.min(requestedMax,countCap));
  return {count,minRadius,maxRadius,
    collapsed:Math.abs(maxRadius-minRadius)<1e-9,
    countCapped:count>10&&requestedMax>countCap};
}
export function buildScatteredCircles(recipe){
  const {count,minRadius,maxRadius}=scatteredRadiusRange(recipe);
  const variation=clamp(Number(recipe.scatteredVariation)||0,0,100)/100;
  const crop=clamp(Number(recipe.scatteredEdgeCrop)||0,0,100)/100;
  const clearance=clamp(Number(recipe.scatteredSpacing)||0,0,100)*.65;
  const overlap=recipe.scatteredOverlap==='overlap';
  const sizeRng=randomStream(recipe.seed+':scattered-sizes:v1');
  const placementRng=randomStream(recipe.seed+':scattered-positions:v1');
  // Mix radically large and small pieces for the seven-circle archetype.
  // Order by radius during packing, then restore stable colour-index order.
  // Stratification guarantees a real range of small and large circles,
  // instead of a seven-sample accident where every radius is similar.
  // Shuffle size ranks independently from pigment slots and placement.
  const ranks=Array.from({length:count},(_,i)=>i);
  for(let i=count-1;i>0;i--){
    const j=Math.floor(sizeRng()*(i+1));
    [ranks[i],ranks[j]]=[ranks[j],ranks[i]];
  }
  const requested=Array.from({length:count},(_,i)=>{
    const sample=(ranks[i]+.15+.7*sizeRng())/count;
    const t=(1-variation)*.5+variation*Math.pow(sample,1.1);
    return {index:i,r:minRadius+(maxRadius-minRadius)*t,tie:sizeRng()};
  }).sort((a,b)=>b.r-a.r||a.tie-b.tie);
  const objects=[];
  // A bounded, user-controlled fraction: the remaining circles stay fully
  // in frame, giving cropped silhouettes meaningful negative-space contrast.
  const mandatoryCrop=Math.min(count,Math.round(count*crop*.55),
    Math.max(1,Math.ceil(Math.sqrt(count))));
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
  // User-authored edits win over procedural packing, without reflowing every
  // other circle. IDs are palette/index slots and survive a seed change.
  // They intentionally may overlap even when generated objects are separate.
  const manual=new Map(normalizeScatteredOverrides(recipe.scatteredOverrides)
    .map(entry=>[entry.index,entry]));
  for(const object of objects){
    const edit=manual.get(Number(object.id.slice(7)));
    if(!edit)continue;
    const cx=edit.x*W,cy=edit.y*H,r=edit.radius*W;
    object.circle={cx,cy,r};
    object.origin=point(cx,cy);
    object.vertices=rim(cx,cy,r);
  }
  if(recipe.scatteredLayerOrder?.length){
    const paintOrder=effectiveScatteredLayerOrder(recipe.scatteredLayerOrder,
      objects.map(o=>Number(o.id.slice(7))));
    const layers=new Map(paintOrder.map((id,i)=>[id,i]));
    objects.sort((a,b)=>layers.get(Number(a.id.slice(7)))-
      layers.get(Number(b.id.slice(7))));
  }
  const placed=objects.length;
  return {objects,requested:count,placed,
    diagnostic:placed<count?
      'Only '+placed+' of '+count+' circles fit with the selected minimum size and spacing. Reduce size, spacing, or count.':
      null,cropped:objects.filter(object=>cropped(object.circle)).length};
}


/**
 * Convert a saved compound silhouette into repeatable, independently placed
 * region stamps. Packing against circumscribed disks is conservative for
 * concave polygons and guarantees separation even before polygon booleans.
 * A complete canonical shape snapshot lives in the wallpaper recipe; there
 * is no lookup into IndexedDB in a render worker or headless export.
 */
export function buildScatteredObjects(recipe){
  const placed=buildScatteredCircles(recipe);
  if(recipe.scatteredShapeKind!=='imported')return placed;
  const shared=recipe.scatteredShape?.geometry;
  const overrideBySlot=new Map(normalizeScatteredShapeOverrides(
    recipe.scatteredShapeOverrides).map(item=>[item.index,item.shape.geometry]));
  if(shared?.type!=='compound-region'&&!overrideBySlot.size)
    return {...placed,objects:[],placed:0,cropped:0,
      diagnostic:'Choose an imported shape from your library.'};
  // Missing per-hue snapshots are omitted, NEVER substituted by circles.
  // The optional shared imported shape still fills unspecific hue slots.
  let absent=0;
  const objects=placed.objects.map(source=>{
    const index=Number(source.id.slice(7));
    const geometry=overrideBySlot.get(index)??shared;
    if(geometry?.type!=='compound-region'||!geometry.components?.length){
      absent++;return null;
    }
    const [vx,vy,vw,vh]=geometry.viewBox;
    const ox=vx+vw/2,oy=vy+vh/2;
    const all=geometry.components.flatMap(component=>
      [component.outer,...component.holes].flat());
    const bound=Math.max(1e-9,...all.map(p=>Math.hypot(p[0]-ox,p[1]-oy)));
    const {cx,cy,r}=source.circle,scale=r/bound;
    const transform=ring=>ring.map(([x,y])=>point(
      cx+(x-ox)*scale,cy+(y-oy)*scale));
    const rings=geometry.components.flatMap(c=>
      [transform(c.outer),...c.holes.map(transform)]);
    return {
      kind:'region',id:source.id,colorIndex:source.colorIndex,
      origin:point(cx,cy),vertices:rings[0],rings,
      editCircle:{cx,cy,r}, // same per-object reposition/resize gestures
      // Compound rings retain subtractive holes and detached islands.
      // No bitmap or private library ID enters the renderer.
    };
  }).filter(Boolean);
  return {...placed,objects,placed:objects.length,
    ...(absent?{diagnostic:'Missing '+absent+
      ' portable imported pigment shape(s); no circles were substituted.'}:{})};
}
