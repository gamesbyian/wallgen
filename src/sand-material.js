// Deterministic, world-space mineral grains for the existing material compositor.
// Vector paths and masks remain the only source of geometry; no bitmap texture,
// per-pixel saved positions, paint-order RNG or physical particle simulation.
const TAU=Math.PI*2;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function hash(ix,iy,seed,salt){
  let n=Math.imul(ix|0,374761393)^Math.imul(iy|0,668265263)^(seed|0)^Math.imul(salt,2246822519);
  n=Math.imul(n^(n>>>13),1274126177);
  return ((n^(n>>>16))>>>0)/4294967296;
}
// Density and grain gauge are authored-world units, never output or CSS pixels.
// Scale zero is still bounded: no runaway million-particle editor frame.
export function sandPitch(layer){
  return 4.8*Math.max(.85,.6+1.6*clamp(Number(layer.scale)||0,0,100)/100);
}
// A single grain is addressed by immutable lattice indices and the material seed.
// Jittered staggered rows avoid the visible square-grid artefact of naive dots.
export function sandGrainAt(layer,ix,iy){
  const pitch=sandPitch(layer),stepY=pitch*.88,seed=layer.heightSeed|0;
  const x=(ix+.5+(iy&1)*.5+(hash(ix,iy,seed,31)-.5)*.46)*pitch;
  const y=(iy+.5+(hash(ix,iy,seed,37)-.5)*.44)*stepY;
  const r=pitch*(.335+hash(ix,iy,seed,41)*.15);
  return {x,y,r,shade:Math.floor(hash(ix,iy,seed,43)*8),
    sparkle:hash(ix,iy,seed,47)>.954,ix,iy};
}
// Crop-independent enumeration: a partial grain just outside the crop is
// included, while its shape/position never depends on which crop requested it.
export function forEachSandGrain(layer,bounds,visit){
  const pitch=sandPitch(layer),stepY=pitch*.88;
  const ix0=Math.floor(bounds.left/pitch)-2,ix1=Math.ceil(bounds.right/pitch)+2;
  const iy0=Math.floor(bounds.top/stepY)-2,iy1=Math.ceil(bounds.bottom/stepY)+2;
  for(let iy=iy0;iy<=iy1;iy++)for(let ix=ix0;ix<=ix1;ix++){
    const g=sandGrainAt(layer,ix,iy);
    if(g.x+g.r*1.3<bounds.left||g.x-g.r*1.3>bounds.right||
       g.y+g.r*1.3<bounds.top||g.y-g.r*1.3>bounds.bottom)continue;
    visit(g);
  }
}
const shadow=Array.from({length:8},(_,i)=>'rgba(0,0,0,'+(.19+i*.026).toFixed(3)+')');
const highlight=Array.from({length:8},(_,i)=>'rgba(255,255,255,'+(.19+(7-i)*.03).toFixed(3)+')');
const glint='rgba(255,255,255,0.46)';
/** Paint a compact deposit of tiny 2.5D grains; caller already owns alpha,
 * colour, coverage, blend mode and the world-to-canvas transform. */
export function paintSandGrains(ctx,layer,bounds){
  forEachSandGrain(layer,bounds,g=>{
    // Broad dark contact and smaller upper-left light surface make a rounded
    // mineral grain rather than a flat speckle. Saturated fill remains beneath.
    ctx.fillStyle=shadow[g.shade];
    ctx.beginPath();ctx.ellipse(g.x+g.r*.12,g.y+g.r*.16,g.r*1.04,g.r*.93,0,0,TAU);ctx.fill();
    ctx.fillStyle=highlight[g.shade];
    ctx.beginPath();ctx.ellipse(g.x-g.r*.18,g.y-g.r*.22,g.r*.72,g.r*.57,-.16,0,TAU);ctx.fill();
    if(g.sparkle){
      ctx.fillStyle=glint;
      ctx.beginPath();ctx.arc(g.x-g.r*.32,g.y-g.r*.42,g.r*.14,0,TAU);ctx.fill();
    }
  });
}
