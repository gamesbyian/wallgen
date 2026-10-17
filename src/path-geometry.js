// Shared path sampler for every stripe geometry. x is the stable longitudinal
// parameter; its *position* may turn back on itself (hairpins and loops).
// The same samples drive silhouettes, decorations and frame-contact tests.
const TAU=Math.PI*2;
const fract=v=>v-Math.floor(v);
const mix=(a,b,t)=>a+(b-a)*t;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const noise=(x,seed)=>{
  const i=Math.floor(x);
  const hash=j=>fract(Math.sin(j*127.1+seed*311.7)*43758.5453)*2-1;
  return mix(hash(i),hash(i+1),fract(x));
};
export const SHAPES=['straight','wave','zigzag','chevron','jagged','stepped','arc','contour','hairpin','loops'];
export function modulation(x, geometry, phase, period, d, extent){
  const t=x/period+phase/TAU;
  if(geometry==='straight')return 0;
  if(geometry==='wave')return d*(Math.sin(t*TAU)*.78+Math.sin(t*TAU*.43+phase)*.22);
  if(geometry==='zigzag')return d*(2*Math.abs(2*fract(t)-1)-1);
  if(geometry==='chevron')return d*(1-2*Math.pow(Math.abs(2*fract(t)-1),.55));
  if(geometry==='jagged')return d*(noise(x/(period*.33),phase)*.85+.15*Math.sin(t*TAU));
  if(geometry==='stepped')return d*(Math.floor(fract(t)*4)/2-.75);
  if(geometry==='arc')return d*(Math.pow(x/extent,2)*3.8-.6);
  return d*(Math.sin(t*TAU*.42)*.35+Math.sin(t*TAU*.79+phase)*.4+Math.sin(t*TAU*1.33)*.25);
}
export function pathPosition(stripe,x,extent){
  const g=stripe.sharedGeometry??stripe.geometry;
  if(g==='hairpin'){
    const u=clamp((x+extent)/(2*extent),0,1);
    const radius=stripe.turnRadius??190;
    const top=-900,turn=210;
    let px,py;
    if(u<.42){px=-radius;py=mix(top,turn,u/.42);}
    else if(u<.58){
      const a=Math.PI*(1-(u-.42)/.16);
      px=radius*Math.cos(a);py=turn+radius*Math.sin(a);
    }else{px=radius;py=mix(turn,top,(u-.58)/.42);}
    // The shared normal makes the seven U's truly nested, including the bend.
    // A small seed-controlled deformation can still act on the entire group.
    const phase=stripe.sharedPhase??0;
    px+=Math.sin(u*TAU*1.6+phase)*Math.min(12,stripe.sharedDisplacement??0)*.3;
    return {x:px,y:py};
  }
  if(g==='loops'){
    const pitch=stripe.loopPeriod??65;
    const phase=(stripe.sharedPhase??0);
    const angle=x/pitch*TAU+phase;
    const size=stripe.loopAmplitude??13;
    return {x:x-size*2.1*Math.sin(angle),y:size*Math.cos(angle)};
  }
  const shared=modulation(x,g,stripe.sharedPhase??stripe.phase,
    stripe.sharedPeriod??stripe.period,stripe.sharedDisplacement??stripe.displacement,extent);
  const individual=modulation(x,stripe.geometry,stripe.phase,stripe.period,stripe.displacement,extent);
  return {x,y:mix(shared,individual,stripe.parallelMix??1)+(stripe.tilt??0)*x/extent};
}
export function samplePath(stripe,x,extent){
  const p=pathPosition(stripe,x,extent);
  const a=pathPosition(stripe,x-0.15,extent),b=pathPosition(stripe,x+0.15,extent);
  const dx=b.x-a.x,dy=b.y-a.y;
  const length=Math.hypot(dx,dy)||1;
  const nx=-dy/length,ny=dx/length;
  // Old geometries are horizontally parameterized. For turns, offset in the
  // true normal instead of Y, so all seven ribbons remain parallel in corners.
  const turn=(stripe.sharedGeometry==='hairpin'||stripe.sharedGeometry==='loops'||
    stripe.geometry==='hairpin'||stripe.geometry==='loops');
  return {x:p.x+(turn?nx*stripe.center:0),y:p.y+(turn?ny*stripe.center:stripe.center),
    tx:dx/length,ty:dy/length,nx,ny};
}
export function widthAt(stripe,x,extent){
  const t=x/extent;
  const base=stripe.width*Math.max(.3,1+stripe.taper*
    (Math.sin(t*TAU*1.4+(stripe.edgePhase??stripe.phase))*.7+t*.3));
  const taper=(stripe.endTaper??0)/100;
  if(!taper)return base;
  const start=stripe.segmentStart??-extent,end=stripe.segmentEnd??extent;
  const span=Math.max(1,end-start),distance=Math.min(x-start,end-x);
  const edge=clamp(distance/(Math.max(0.1,taper)*span*.45),0,1);
  return base*(.03+.97*edge*edge*(3-2*edge));
}
export function ribbonEdge(stripe,x,extent,side,edgeRelief=0){
  const p=samplePath(stripe,x,extent);
  const distance=side*widthAt(stripe,x,extent)/2+edgeRelief;
  return {x:p.x+p.nx*distance,y:p.y+p.ny*distance};
}
