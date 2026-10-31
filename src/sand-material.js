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
  return 3.3*Math.max(.85,.6+1.6*clamp(Number(layer.scale)||0,0,100)/100);
}
// A single grain is addressed by immutable lattice indices and the material seed.
// Jittered staggered rows avoid the visible square-grid artefact of naive dots.
export function sandGrainAt(layer,ix,iy){
  const pitch=sandPitch(layer),stepY=pitch*.88,seed=layer.heightSeed|0;
  const x=(ix+.5+(iy&1)*.5+(hash(ix,iy,seed,31)-.5)*.46)*pitch;
  const y=(iy+.5+(hash(ix,iy,seed,37)-.5)*.44)*stepY;
  const r=pitch*(.25+hash(ix,iy,seed,41)*.13);
  return {x,y,r,shade:Math.floor(hash(ix,iy,seed,43)*8),
    sparkle:hash(ix,iy,seed,47)>.993,ix,iy};
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
// Tonal, sub-grain mineral facets. The cell lattice is merely a stratification
// index; the visible grains are independently scattered *within* each cell.
// This removes the regular circular polka-dot appearance at high export zoom.
const shadow=Array.from({length:8},(_,i)=>'rgba(0,0,0,'+(.14+i*.017).toFixed(3)+')');
const highlight=Array.from({length:8},(_,i)=>'rgba(255,255,255,'+(.12+(7-i)*.016).toFixed(3)+')');
const glint='rgba(255,255,255,0.29)';
/** Paint matte sub-grains, keeping the shared compositor's authored-world
 * transform, palette ink, alpha, coverage, blend and clip untouched. */
export function paintSandGrains(ctx,layer,bounds){
  const pitch=sandPitch(layer),stepY=pitch*.88,seed=layer.heightSeed|0;
  // Fully include flecks whose parent cell centre is outside the crop.
  const padded={left:bounds.left-pitch,top:bounds.top-pitch,
    right:bounds.right+pitch,bottom:bounds.bottom+pitch};
  forEachSandGrain(layer,padded,g=>{
    for(let k=0;k<6;k++){
      const x=(g.ix+(g.iy&1)*.5+hash(g.ix,g.iy,seed,71+k*17))*pitch;
      const y=(g.iy+hash(g.ix,g.iy,seed,79+k*23))*stepY;
      // All sizes remain logical material units; there are no pixel-based
      // geometry controls and no dependence on preview/export dimensions.
      const diameter=pitch*(.105+.18*hash(g.ix,g.iy,seed,97+k*31));
      const tone=Math.floor(hash(g.ix,g.iy,seed,131+k*29)*8);
      ctx.fillStyle=k%2===0?shadow[tone]:highlight[tone];
      ctx.fillRect(x-diameter*.5,y-diameter*.5,diameter,diameter);
    }
    if(g.sparkle){
      const x=(g.ix+.5+(g.iy&1)*.5)*pitch,y=(g.iy+.5)*stepY;
      ctx.fillStyle=glint;
      ctx.fillRect(x-pitch*.045,y-pitch*.045,pitch*.09,pitch*.09);
    }
  });
}
