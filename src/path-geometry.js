import {pointOnDrawnPath} from './drawn-path.js';
// Shared path sampler for every stripe geometry. x is the stable longitudinal
// parameter; its *position* may turn back on itself (hairpins and loops).
// The same samples drive silhouettes, decorations and frame-contact tests.
const TAU=Math.PI*2;
const fract=v=>v-Math.floor(v);
const mix=(a,b,t)=>a+(b-a)*t;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const noise1D=(x,seed)=>{
  const i=Math.floor(x);
  const hash=j=>fract(Math.sin(j*127.1+seed*311.7)*43758.5453)*2-1;
  return mix(hash(i),hash(i+1),fract(x));
};
export const SHAPES=['straight','wave','zigzag','chevron','jagged','stepped','arc','contour','hairpin','loop','loops','drawn'];
export function modulation(x, geometry, phase, period, d, extent,detail={}){
  const t=x/period+phase/TAU;
  if(geometry==='straight')return 0;
  if(geometry==='wave')return d*(Math.sin(t*TAU)*.78+Math.sin(t*TAU*.43+phase)*.22);
  if(geometry==='zigzag')return d*(2*Math.abs(2*fract(t)-1)-1);
  if(geometry==='chevron')return d*(1-2*Math.pow(Math.abs(2*fract(t)-1),.2+.7*(detail.chevronSharpness??50)/100));
  if(geometry==='jagged')return d*(noise1D(x/(period*.33),phase)*.85+.15*Math.sin(t*TAU));
  if(geometry==='stepped'){
    const steps=clamp(Math.round(detail.stepCount??4),1,16);
    return steps===1?d*(fract(t)<.5?-1:1):
      d*(Math.floor(fract(t)*steps)*2/(steps-1)-1);
  }
  if(geometry==='arc'){
    // Arc frequency is curvature frequency: 0 gives a single broad sweep,
    // while higher values produce a train of joined arches.
    const frequency=clamp((detail.shapeFrequency??50)/100,0,1);
    const cycles=.5+12*Math.pow(frequency,1.45);
    const u=x/extent*cycles+phase/TAU;
    // Raised cosine joins successive arches with continuous derivatives;
    // triangular periodic parabola tiles caused unintended sharp cusps.
    return d*Math.cos(u*Math.PI);
  }
  return d*(Math.sin(t*TAU*.42)*.35+Math.sin(t*TAU*.79+phase)*.4+Math.sin(t*TAU*1.33)*.25);
}
export function pathPosition(stripe,x,extent){
  // Zoom expands the station domain. Finite drawn ends remain unless opted in.
  const coreExtent=stripe.coreExtent??extent;
  const g=stripe.sharedGeometry??stripe.geometry;
  if(g==='drawn'&&stripe.drawnPath)
    return pointOnDrawnPath(stripe.drawnPath,(x+coreExtent)/(2*coreExtent),
      {extrapolate:stripe.extendDrawnPath===true,coreExtent});
  if(g==='hairpin'){
    const u=(x+coreExtent)/(2*coreExtent);
    const radius=stripe.turnRadius??190;
    const top=-900,turn=210;
    const theta=clamp(stripe.hairpinAngle??180,60,180)*Math.PI/180;
    const finalAngle=Math.PI-theta;
    let px,py;
    if(u<.42){px=-radius;py=mix(top,turn,u/.42);}
    else if(u<.58){
      const a=Math.PI-theta*(u-.42)/.16;
      px=radius*Math.cos(a);py=turn+radius*Math.sin(a);
    }else{
      // Exit leg continues tangent to the adjustable circular turn, not from
      // a fixed +radius X. 180° reproduces the original returning U path.
      const distance=(u-.58)/.42*(turn-top);
      px=radius*Math.cos(finalAngle)+distance*Math.sin(finalAngle);
      py=turn+radius*Math.sin(finalAngle)-distance*Math.cos(finalAngle);
    }
    // The shared normal makes the seven U's truly nested, including the bend.
    // A small seed-controlled deformation can still act on the entire group.
    const phase=stripe.sharedPhase??0;
    px+=Math.sin(u*TAU*1.6+phase)*Math.min(12,stripe.sharedDisplacement??0)*.3;
    return {x:px,y:py};
  }
  if(g==='loop'){
    // A SINGLE loop, as opposed to the existing repeating 'loops' geometry.
    // Three arc-length stations make the incoming straight, circular turn
    // and outgoing tangent meet with continuous first derivatives. There is
    // no artificial kink at either join or at the circular self-intersection.
    const u=clamp((x+coreExtent)/(2*coreExtent),0,1);
    const radius=stripe.loopRadius??150;
    const sweep=clamp(stripe.loopSweep??360,240,450)*Math.PI/180;
    const circleLength=radius*sweep,approach=900,departure=1070;
    const total=approach+circleLength+departure,position=u*total;
    const cy=-180,firstAngle=Math.PI,finalAngle=firstAngle-sweep;
    let px,py;
    if(position<=approach){
      px=-radius;
      py=cy-(approach-position);
    }else if(position<=approach+circleLength){
      const a=firstAngle-(position-approach)/radius;
      px=radius*Math.cos(a);
      py=cy+radius*Math.sin(a);
    }else{
      const travel=position-approach-circleLength;
      // Derivative of [r cos(a),r sin(a)] as a decreases:
      // tangent = [sin(a),-cos(a)].
      px=radius*Math.cos(finalAngle)+travel*Math.sin(finalAngle);
      py=cy+radius*Math.sin(finalAngle)-travel*Math.cos(finalAngle);
    }
    return {x:px,y:py};
  }
  if(g==='loops'){
    const pitch=stripe.loopPeriod??65;
    const phase=(stripe.sharedPhase??0);
    const angle=x/pitch*TAU+phase;
    const size=stripe.loopAmplitude??13;
    return {x:x-size*2.1*Math.pow(2,((stripe.loopAspect??50)-50)/35)*Math.sin(angle),y:size*Math.cos(angle)};
  }
  const shared=modulation(x,g,stripe.sharedPhase??stripe.phase,
    stripe.sharedPeriod??stripe.period,stripe.sharedDisplacement??stripe.displacement,coreExtent,stripe);
  const individual=modulation(x,stripe.geometry,stripe.phase,stripe.period,stripe.displacement,coreExtent,stripe);
  return {x,y:mix(shared,individual,stripe.parallelMix??1)+(stripe.tilt??0)*x/coreExtent};
}
export function samplePath(stripe,x,extent){
  const p=pathPosition(stripe,x,extent);
  // Drawn recipes store a sampled polyline. A 0.3px centred derivative
  // snaps its normal abruptly at each vertex; a large normal-offset stripe
  // then draws a long sideways spike within that 0.3px interval. Estimate
  // the tangent over a short, symmetric arc instead, without moving the
  // artist's actual centreline or altering non-drawn geometry.
  const g=stripe.sharedGeometry??stripe.geometry;
  const tangentWindow=g==='drawn'?9:0.15;
  const a=pathPosition(stripe,x-tangentWindow,extent),
    b=pathPosition(stripe,x+tangentWindow,extent);
  const dx=b.x-a.x,dy=b.y-a.y;
  const length=Math.hypot(dx,dy)||1;
  const nx=-dy/length,ny=dx/length;
  // Old geometries are horizontally parameterized. For turns, offset in the
  // true normal instead of Y, so all seven ribbons remain parallel in corners.
  // Hairpins and single loops require normal offsets to remain nested.
  // Looped lines deliberately keep seven separate horizontal baselines:
  // offsetting those baselines by a normal that reverses within every loop
  // would splice neighbouring colours into a dense, crossed mesh.
  const turn=['hairpin','loop','drawn'].includes(stripe.sharedGeometry)||
    ['hairpin','loop','drawn'].includes(stripe.geometry);
  return {x:p.x+(turn?nx*stripe.center:0),y:p.y+(turn?ny*stripe.center:stripe.center),
    tx:dx/length,ty:dy/length,nx,ny};
}
export function widthAt(stripe,x,extent){
  // A drawn path keeps the same relief at every saved point when the camera
  // widens or endpoint extrapolation adds stations. Beyond either endpoint,
  // the extension inherits the terminal cross-section instead of widening.
  const drawn=(stripe.sharedGeometry??stripe.geometry)==='drawn';
  const core=drawn?(stripe.coreExtent??extent):extent;
  const t=(drawn?clamp(x,-core,core):x)/core;
  const base=stripe.width*Math.max(.3,1+stripe.taper*
    (Math.sin(t*TAU*1.4+(stripe.edgePhase??stripe.phase))*.7+t*.3));
  const taper=(stripe.endTaper??0)/100;
  if(!taper)return base;
  // Crossing repairs draw a local branch from the ORIGINAL ribbon. Local
  // clipping limits geometry, but must never create new tapered endpoints.
  const start=stripe.taperStart??stripe.segmentStart??-extent,
    end=stripe.taperEnd??stripe.segmentEnd??extent;
  const span=Math.max(1,end-start),distance=Math.min(x-start,end-x);
  const edge=clamp(distance/(Math.max(.001,taper)*span*.45),0,1);
  return base*(.03+.97*edge*edge*(3-2*edge));
}
export function ribbonEdge(stripe,x,extent,side,edgeRelief=0){
  const p=samplePath(stripe,x,extent);
  const distance=side*widthAt(stripe,x,extent)/2+edgeRelief;
  return {x:p.x+p.nx*distance,y:p.y+p.ny*distance};
}
