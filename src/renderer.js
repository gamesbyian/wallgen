import { DESIGN_WIDTH, DESIGN_HEIGHT, resolveScene, rng, NAMES } from './model.js';
import { samplePath, ribbonEdge, widthAt, noise1D } from './path-geometry.js';
import {drawRegionInteriors,elementInk,elementWave,lineDash,elementApplies} from './interior-elements.js';
import { viewCamera } from './view-camera.js';
import {findPathCrossings,crossingTopIsLater,crossingBranchClip} from './crossing-order.js';
import {materialHeight,paintMaterial} from './material-surface.js';
import {applyPhotoFinish} from './photo-look.js';
import {matchingEmbroidery,drawRibbonEmbroidery,drawRegionEmbroidery} from './embroidery.js';

const TAU = Math.PI * 2;
const geometryAt=(x,stripe,extent)=>samplePath(stripe,x,extent).y;
const edgePoint=(x,stripe,extent,side,scene)=>
  ribbonEdge(stripe,x,extent,side,scene?textureHeight(scene,stripe,x,side):0);
const edgeAt=(x,stripe,extent,side,scene)=>edgePoint(x,stripe,extent,side,scene).y;
const spatialGeometry=stripe=>['hairpin','loop','loops','drawn'].includes(stripe.sharedGeometry??stripe.geometry);
// Sample the same material height field used to paint each visible texture.
// The sample point is transformed from ribbon space to the material's world-
// anchored coordinates, so pan/zoom/export do not move the relief pattern.
export function textureHeight(scene,stripe,x,side=0){
  if(!scene.textureDisplacement)return 0;
  const layers=scene.textureLayers.filter(layer=>layer.coverage!=='background');
  if(!layers.length)return 0;
  const p=samplePath(stripe,x,scene.extent);
  const distance=side*widthAt(stripe,x,scene.extent)*.5;
  const localX=p.x+p.nx*distance,localY=p.y+p.ny*distance;
  const c=Math.cos(scene.angle),s=Math.sin(scene.angle);
  const rx=localX*c-localY*s,ry=localX*s+localY*c;
  // Mirror is applied to the entire stripe layer, before texture compositing.
  const wx=DESIGN_WIDTH/2+(scene.mirrorHorizontal?-1:1)*
    (scene.centerX-DESIGN_WIDTH/2+rx);
  const wy=DESIGN_HEIGHT/2+(scene.mirrorVertical?-1:1)*
    (scene.centerY-DESIGN_HEIGHT/2+ry);
  let field=0;
  for(const layer of layers){
    const dx=wx-DESIGN_WIDTH/2,dy=wy-DESIGN_HEIGHT/2;
    const tx=dx*layer.heightCos+dy*layer.heightSin;
    const ty=-dx*layer.heightSin+dy*layer.heightCos;
    // Do NOT divide by sum of strengths. A 10% layer must induce much less
    // relief than the same layer at 100%, and inactive layers contribute zero.
    field+=materialHeight(layer,tx,ty)*(layer.strength/100);
  }
  const cap=Math.min(28,stripe.width*.34)*
    Math.pow(scene.textureDisplacement/100,.85);
  return Math.max(-cap,Math.min(cap,field*cap*1.5));
}
// This is an independent line rendering style, NOT the dot/dash motif.
// Marks are anchored to the full unnudged ribbon so nudging and overscan
// cannot change their spacing or introduce discontinuities.
const lineMarksCache=new WeakMap();
export function stripeLineMarks(stripe,extent){
  if((stripe.lineStyle||'continuous')==='continuous')return null;
  const start=stripe.segmentStart??-extent,end=stripe.segmentEnd??extent;
  const type=stripe.lineStyle;
  const dotFactor=0.4+(stripe.dotSize??50)/100*1.2;
  const spacingFactor=.55+(stripe.dotSpacing??50)/100*1.35;
  const pitch=type==='dotted'&&stripe.dotPitch ?
    stripe.dotPitch : Math.max(type==='dotted'?12:26,
      stripe.width*(type==='dotted'?2.15:5.3)*spacingFactor*dotFactor);
  const marks=[];
  const originBase=-(stripe.coreExtent??extent);
  const first=Math.floor((start-originBase)/pitch)-1;
  const last=Math.ceil((end-originBase)/pitch)+1;
  for(let i=first;i<=last;i++){
    const origin=originBase+i*pitch;
    if(type==='dotted'){
      const x=origin+pitch*.5,radius=Math.min(
        stripe.dotRadius??(stripe.width*.43*dotFactor),pitch*.43);
      if(x-radius>=start && x+radius<=end)marks.push({type:'dot',x,radius});
    }else{
      const from=Math.max(start,origin+pitch*.08);
      const to=Math.min(end,origin+pitch*.64);
      if(to-from>1)marks.push({type:'dash',start:from,end:to});
    }
  }
  return marks;
}
function cachedLineMarks(stripe,extent){
  const existing=lineMarksCache.get(stripe);
  if(existing?.extent===extent&&existing.start===(stripe.segmentStart??-extent)
    &&existing.end===(stripe.segmentEnd??extent))return existing.marks;
  const marks=stripeLineMarks(stripe,extent);
  lineMarksCache.set(stripe,{extent,start:stripe.segmentStart??-extent,end:stripe.segmentEnd??extent,marks});
  return marks;
}
function traceStripeSegment(path,stripe,extent,scene,start,end){
  const count=Math.max(12,Math.ceil((end-start)/3));
  for(let i=0;i<=count;i++){
    const x=start+(end-start)*i/count,p=edgePoint(x,stripe,extent,-1,scene);
    if(i===0)path.moveTo(p.x,p.y);else path.lineTo(p.x,p.y);
  }
  for(let i=count;i>=0;i--){
    const x=start+(end-start)*i/count;
    const p=edgePoint(x,stripe,extent,1,scene);
    path.lineTo(p.x,p.y);
  }
  path.closePath();
}
function stripePath(stripe,extent,scene){
  const path=new Path2D();
  const marks=cachedLineMarks(stripe,extent);
  if(marks){
    for(const mark of marks){
      if(mark.type==='dash')traceStripeSegment(path,stripe,extent,scene,mark.start,mark.end);
      else {
        const p=samplePath(stripe,mark.x,extent);
        path.moveTo(p.x+mark.radius,p.y);
        path.arc(p.x,p.y,mark.radius,0,TAU);
      }
    }
  }else{
    const start=stripe.segmentStart??-extent,end=stripe.segmentEnd??extent;
    // The original continuous fill is unchanged for existing saved recipes.
    const count=Math.max(500,Math.ceil((end-start)/3));
    for(let i=0;i<=count;i++){
      const x=start+(end-start)*i/count,p=edgePoint(x,stripe,extent,-1,scene);
      if(i===0)path.moveTo(p.x,p.y);else path.lineTo(p.x,p.y);
    }
    for(let i=count;i>=0;i--){
      const x=start+(end-start)*i/count;
      const p=edgePoint(x,stripe,extent,1,scene);
      path.lineTo(p.x,p.y);
    }
    path.closePath();
  }
  return path;
}
// Fill an actual ribbon as the union of short, oriented cross-section cells.
// The conventional single outline is fine for monotonic ribbons, but a loop
// which curls beyond 360 degrees can retrace its own arc. Filling the entire
// closed strip as one polygon can then cancel or invert at the return, leaving
// triangular holes and teeth. Adjacent quads do not have that winding defect.
// Keep the original contour for drawing the *outer* outline, never stroke
// these internal cell boundaries.
export function stripeFillPath(stripe,extent,scene,Path=Path2D){
  if(!spatialGeometry(stripe)||(stripe.lineStyle||'continuous')!=='continuous')
    return stripePath(stripe,extent,scene);
  const path=new Path();
  const start=stripe.segmentStart??-extent,end=stripe.segmentEnd??extent;
  const count=Math.max(32,Math.ceil((end-start)/2.5));
  let previous=null;
  for(let i=0;i<=count;i++){
    const x=start+(end-start)*i/count;
    const pair=[edgePoint(x,stripe,extent,-1,scene),
      edgePoint(x,stripe,extent,1,scene)];
    if(previous){
      const corners=[previous[0],pair[0],pair[1],previous[1]];
      const a=corners[0],b=corners[1],c=corners[2];
      const signed=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
      if(Math.abs(signed)>1e-10){
        if(signed<0)corners.reverse();
        path.moveTo(corners[0].x,corners[0].y);
        for(let j=1;j<4;j++)path.lineTo(corners[j].x,corners[j].y);
        path.closePath();
      }
    }
    previous=pair;
  }
  return path;
}
function traceEdge(stripe, extent, side, scene) {
  const path=new Path2D();
  const start=stripe.segmentStart??-extent, end=stripe.segmentEnd??extent;
  const count=Math.max(500,Math.ceil((end-start)/3));
  for(let i=0;i<=count;i++){
    const x=start+(end-start)*i/count;
    const p=edgePoint(x,stripe,extent,side,scene);
    if(i===0) path.moveTo(p.x,p.y); else path.lineTo(p.x,p.y);
  }
  return path;
}
// A stripe may either meet BOTH opposed frame edges, or NEITHER.
// When an irregular path exits via unmatched sides, place its two physical
// ends safely inside the frame instead of leaving a one-sided crop.
function ribbonPoint(scene,x,y) {
  const co=Math.cos(scene.angle), si=Math.sin(scene.angle);
  const px=scene.centerX+x*co-y*si,py=scene.centerY+x*si+y*co;
  // Frame contacts/caps must use the same reflected coordinates as painting.
  return {x:scene.mirrorHorizontal?DESIGN_WIDTH-px:px,
    y:scene.mirrorVertical?DESIGN_HEIGHT-py:py};
}
function endpoints(scene,stripe,x) {
  const low=edgePoint(x,stripe,scene.extent,-1,scene),high=edgePoint(x,stripe,scene.extent,1,scene);
  return [ribbonPoint(scene,low.x,low.y),ribbonPoint(scene,high.x,high.y)];
}
function contactSegment(scene,contacts,p,q) {
  const f=scene.viewBounds||{left:0,right:DESIGN_WIDTH,top:0,bottom:DESIGN_HEIGHT};
  const hit=(t,other,low,high)=>t>=0&&t<=1&&other>=low-1e-7&&other<=high+1e-7;
  for(const [side,value,field,other,low,high] of [
    ['left',f.left,'x','y',f.top,f.bottom],['right',f.right,'x','y',f.top,f.bottom],
    ['top',f.top,'y','x',f.left,f.right],['bottom',f.bottom,'y','x',f.left,f.right],
  ]){
    if(contacts[side]||Math.abs(q[field]-p[field])<1e-9)continue;
    const t=(value-p[field])/(q[field]-p[field]);
    if(hit(t,p[other]+t*(q[other]-p[other]),low,high))contacts[side]=true;
  }
}
export function stripeFrameContacts(scene,stripe) {
  const contacts={left:false,right:false,top:false,bottom:false};
  const n=480;
  const start=stripe.segmentStart??-scene.extent;
  const end=stripe.segmentEnd??scene.extent;
  let previous=endpoints(scene,stripe,start);
  for(let i=1;i<=n;i++){
    const current=endpoints(scene,stripe,start+(end-start)*i/n);
    contactSegment(scene,contacts,previous[0],current[0]);
    contactSegment(scene,contacts,previous[1],current[1]);
    contactSegment(scene,contacts,current[0],current[1]);
    previous=current;
  }
  return contacts;
}
export function balanceStripeEnds(scene,stripe) {
  // A user trace is intentionally bounded by the input surface. Let its seven
  // normal-offset ribbons clip naturally instead of recapping the sketch.
  if((stripe.sharedGeometry??stripe.geometry)==='drawn')
    return {contacts:{left:false,right:false,top:false,bottom:false},
      balanced:true,hidden:false};
  // A returning path legitimately has both ends at the same frame edge.
  // Paired returns and crossings for hairpins and single loops are
  // intentional, rather than one-sided cropping mistakes.
  const floating=scene.composition==='floating';
  if(!floating && spatialGeometry(stripe) && ['hairpin','loop'].includes(stripe.sharedGeometry??stripe.geometry))
    return {contacts:stripeFrameContacts(scene,stripe),balanced:true,hidden:false};
  const contacts=stripeFrameContacts(scene,stripe);
  const balanced=(contacts.left===contacts.right && contacts.top===contacts.bottom);
  if(balanced&&!floating)return {contacts,balanced:true,hidden:false};
  // Account for borders and glow so even their outermost pixels stay inset.
  const margin=24+scene.glow*.30+scene.gap*.14+scene.outlineBuffer*.14;
  const f=scene.viewBounds||{left:0,right:DESIGN_WIDTH,top:0,bottom:DESIGN_HEIGHT};
  const inside=x=>endpoints(scene,stripe,x).every(p=>
    p.x>=f.left+margin && p.x<=f.right-margin &&
    p.y>=f.top+margin && p.y<=f.bottom-margin);
  const samples=640;
  let start=null,bestStart=null,bestEnd=null;
  for(let i=0;i<=samples;i++){
    const x=-scene.extent+2*scene.extent*i/samples;
    const yes=inside(x);
    if(yes && start===null)start=x;
    if((!yes || i===samples)&&start!==null){
      const end=yes?x:-scene.extent+2*scene.extent*(i-1)/samples;
      if(bestStart===null||end-start>bestEnd-bestStart){bestStart=start;bestEnd=end;}
      start=null;
    }
  }
  if(bestStart===null || bestEnd-bestStart<8){
    stripe.hidden=true;
    return {contacts,balanced:false,hidden:true};
  }
  if(floating){
    const random=rng(scene.seed+':floating-ends:'+stripe.index);
    const amount=(.18+.78*scene.pathLength/100)*
      (1-random()*scene.individuality/100*.24);
    const length=(bestEnd-bestStart)*amount;
    const free=(bestEnd-bestStart)-length;
    const centre=(bestStart+bestEnd)*.5+(random()-.5)*free*.7;
    bestStart=centre-length*.5;
    bestEnd=centre+length*.5;
  }
  stripe.segmentStart=bestStart;
  stripe.segmentEnd=bestEnd;
  return {contacts,balanced:false,hidden:false,start:bestStart,end:bestEnd};
}
function stampStar(ctx,x,y,r,points=5) {
  ctx.beginPath();
  for(let k=0;k<2*points;k++){
    const a=-Math.PI/2 + k*Math.PI/points;
    const radius=k%2 ? r*.42 : r;
    if(k===0)ctx.moveTo(x+Math.cos(a)*radius,y+Math.sin(a)*radius);
    else ctx.lineTo(x+Math.cos(a)*radius,y+Math.sin(a)*radius);
  }
  ctx.closePath(); ctx.fill();
}
/**
 * Validate the entire geometric footprint before drawing a motif.
 * No path clipping: a mark is either entirely within the stripe and canvas,
 * or completely absent. Multiple x samples protect curved/jagged edges.
 */
export function motifFits(stripe,scene,x,y,halfX,halfY,extent=scene.extent) {
  if(stripe.hidden || x-halfX < (stripe.segmentStart??-extent) || x+halfX > (stripe.segmentEnd??extent)) return false;
  const margin=.12;
  if(spatialGeometry(stripe)){
    const p=samplePath(stripe,x,extent);
    const transverse=y-p.y;
    if(Math.abs(transverse)+Math.max(halfX,halfY)>=widthAt(stripe,x,extent)/2)return false;
    const at=ribbonPoint(scene,p.x+p.nx*transverse,p.y+p.ny*transverse);
    const bounds=scene.renderBounds||{left:0,top:0,right:DESIGN_WIDTH,bottom:DESIGN_HEIGHT};
    const radius=Math.max(halfX,halfY);
    const f=scene.viewBounds||{left:0,right:DESIGN_WIDTH,top:0,bottom:DESIGN_HEIGHT};
    const inside=at.x-radius>=f.left&&at.x+radius<=f.right&&
      at.y-radius>=f.top&&at.y+radius<=f.bottom;
    const outside=at.x+radius<f.left||at.x-radius>f.right||
      at.y+radius<f.top||at.y-radius>f.bottom;
    return (inside||outside)&&at.x-radius>=bounds.left&&at.x+radius<=bounds.right&&
      at.y-radius>=bounds.top&&at.y+radius<=bounds.bottom;
  }
  for(let i=0;i<=8;i++){
    const testX=x-halfX+halfX*i/4;
    const low=edgeAt(testX,stripe,extent,-1,scene);
    const high=edgeAt(testX,stripe,extent,1,scene);
    if(y-halfY < low+margin || y+halfY > high-margin) return false;
  }
  const styleMarks=cachedLineMarks(stripe,extent);
  if(styleMarks){
    const fits=styleMarks.some(mark=>{
      if(mark.type==='dash')return x-halfX>=mark.start && x+halfX<=mark.end;
      for(const xx of [x-halfX,x+halfX])for(const yy of [y-halfY,y+halfY]){
        const dy=yy-geometryAt(mark.x,stripe,extent);
        if((xx-mark.x)**2+dy**2>(mark.radius-.12)**2)return false;
      }
      return true;
    });
    if(!fits)return false;
  }
  // Do not crop individual marks at the original frame boundary, preserving
  // the pre-nudge design exactly. Additional *whole* marks may be rendered
  // beyond that frame so that moving the already painted image reveals ink.
  const a=scene.angle, cos=Math.cos(a), sin=Math.sin(a);
  const bounds=scene.renderBounds||{left:0,top:0,right:DESIGN_WIDTH,bottom:DESIGN_HEIGHT};
  const points=[];
  for(const dx of [-halfX,halfX])for(const dy of [-halfY,halfY]){
    const rawX=scene.centerX+(x+dx)*cos-(y+dy)*sin;
    const rawY=scene.centerY+(x+dx)*sin+(y+dy)*cos;
    const px=scene.mirrorHorizontal?DESIGN_WIDTH-rawX:rawX;
    const py=scene.mirrorVertical?DESIGN_HEIGHT-rawY:rawY;
    if(px<bounds.left||px>bounds.right||py<bounds.top||py>bounds.bottom)return false;
    points.push({x:px,y:py});
  }
  const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x));
  const minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
  const f=scene.viewBounds||{left:0,right:DESIGN_WIDTH,top:0,bottom:DESIGN_HEIGHT};
  const inside=minX>=f.left&&maxX<=f.right&&minY>=f.top&&maxY<=f.bottom;
  const outside=maxX<f.left||minX>f.right||maxY<f.top||minY>f.bottom;
  return inside||outside;
}
/**
 * Homogeneity is 100 for identical motifs. Optional stripe override adds
 * deterministic per-stripe differences without changing the motif type.
 */
export function motifVariation(scene,stripe,random) {
  const variance=1-scene.patternHomogeneity/100;
  const stripeEffect=scene.overridePatternHomogeneity ? scene.individuality/100 : 0;
  const stripeRandom=rng(scene.seed+':motif-stripe:'+stripe.index);
  const stripeScale=1+(stripeRandom()-.5)*1.0*stripeEffect;
  const stripeAngle=(stripeRandom()-.5)*1.6*stripeEffect;
  const stripeOpacity=1-(stripeRandom()*.45*stripeEffect);
  return {
    scale:Math.max(.28,stripeScale*(1+(random()-.5)*1.1*variance)),
    angle:stripeAngle+(random()-.5)*Math.PI*variance,
    opacity:Math.max(.16,stripeOpacity*(1-random()*.75*variance)),
  };
}
// Tonal fills, woven lattice and pen strokes use the exact same path geometry
// as ribbons, dots and dashes. No independent geometry implementations.
function traceCentre(stripe,extent,offset=0){
  const path=new Path2D();
  const start=stripe.segmentStart??-extent,end=stripe.segmentEnd??extent;
  const n=Math.max(180,Math.ceil((end-start)/2.2));
  for(let i=0;i<=n;i++){
    const p=samplePath(stripe,start+(end-start)*i/n,extent);
    const x=p.x+p.nx*offset*stripe.width,y=p.y+p.ny*offset*stripe.width;
    if(!i)path.moveTo(x,y);else path.lineTo(x,y);
  }
  return path;
}
// Deterministic dry-ink breakup. Marks remain inside the ribbon and use
// the common centreline/normal sampler at every output resolution.
// Dotted/dashed decorations keep a world-station phase when the renderer
// repaints only the front branch of a self-intersection.
function arcLengthUntil(stripe,extent,station){
  const origin=-(stripe.coreExtent??extent),delta=station-origin;
  if(!delta)return 0;
  // Off-frame extrapolation can start before the original path's first
  // station. Keep dash phase anchored to the saved path rather than
  // resetting it at the transition from tangent extension to the stroke.
  const n=Math.max(1,Math.ceil(Math.abs(delta)/4));
  let previous=samplePath(stripe,origin,extent),length=0;
  for(let i=1;i<=n;i++){
    const next=samplePath(stripe,origin+delta*i/n,extent);
    length+=Math.hypot(next.x-previous.x,next.y-previous.y);
    previous=next;
  }
  return Math.sign(delta)*length;
}
// Canvas-field ink shared by all ribbon colours. Unlike local and contour
// lines it does not follow each stripe's centreline, but it is still clipped
// against the true ribbon silhouette by its caller. Bound strokes to the
// visible parametric ribbon envelope instead of constructing a full-wall
// field separately seven times.
function drawPathFieldInk(ctx,stripe,extent,e){
  const start=stripe.segmentStart??-extent,end=stripe.segmentEnd??extent;
  let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
  // Sample the complete original path densely enough to include short
  // jagged/looping turns; a coarse bounding box could silently crop field
  // decorations at precisely the challenging imported/drawn features.
  const samples=Math.max(180,Math.min(2500,Math.ceil((end-start)/2.3)));
  for(let i=0;i<=samples;i++){
    const station=start+(end-start)*i/samples;
    const p=samplePath(stripe,station,extent);
    const half=widthAt(stripe,station,extent)*.5;
    x0=Math.min(x0,p.x-half);x1=Math.max(x1,p.x+half);
    y0=Math.min(y0,p.y-half);y1=Math.max(y1,p.y+half);
  }
  if(!Number.isFinite(x0)||!Number.isFinite(y0))return;
  const period=Math.max(12,160/Math.max(.2,e.frequency));
  const scale=Math.max(16,220/e.frequency);
  const step=Math.max(1.5,Math.min(5,scale/12));
  const pad=e.amplitude*80+ctx.lineWidth*.5+8;
  const startY=-2400+Math.floor((y0-pad+2400)/period)*period;
  const firstX=Math.floor((x0-pad)/step)*step;
  const endX=x1+pad;
  const fieldShape={...e,frequency:1};
  for(let y=startY;y<=y1+pad;y+=period){
    ctx.beginPath();
    if(e.stroke!=='solid')ctx.lineDashOffset=-(firstX+1760);
    for(let x=firstX;x<=endX;x+=step){
      const t=(x+e.phase*3)/scale;
      const yy=y+e.position*period+e.amplitude*80*elementWave(fieldShape,t);
      const xx=e.shape==='loop'?x+e.amplitude*80*
        Math.cos(t*Math.PI*2+e.phase*Math.PI/180):x;
      if(x===firstX)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);
    }
    ctx.stroke();
  }
}
function drawPathInteriors(ctx,stripe,extent,scene){
  if(!scene.interiorElements?.length)return;
  ctx.save();ctx.clip(stripeFillPath(stripe,extent,scene));
  const start=stripe.segmentStart??-extent,end=stripe.segmentEnd??extent;
  for(const e of scene.interiorElements){
    const slot=scene.reverseStripes?6-stripe.index:stripe.index;
    if(!e.enabled||!e.opacity||!elementApplies(e,slot,stripe.objectId))continue;
    ctx.save();ctx.strokeStyle=elementInk(e,stripe.color);
    ctx.globalAlpha=e.opacity;
    ctx.lineWidth=e.type==='band'?Math.max(.15,stripe.width*e.width/100):e.width;
    ctx.lineJoin='round';lineDash(ctx,e);
    if(e.placement==='field'){
      drawPathFieldInk(ctx,stripe,extent,e);
      ctx.restore();continue;
    }
    const path=new Path2D();
    // Camera zoom may extend the painted longitudinal domain, but the
    // interior wave/loop phase is part of the original generated design for
    // ALL path geometries, not just hand-drawn paths.
    const phaseExtent=stripe.coreExtent??extent;
    const n=Math.max(160,Math.ceil((end-start)/2.3));
    for(let i=0;i<=n;i++){
      const station=start+(end-start)*i/n;
      const p=samplePath(stripe,station,extent);
      const width=widthAt(stripe,station,extent);
      const position=e.placement==='contour'?
        (e.position<0?-1:1)*Math.max(0,width*.5-
          Math.max(e.width*.5+1,width*(.06+Math.abs(e.position)*.45))):
        e.position*width;
      const transverse=position+
        e.amplitude*width*elementWave(e,station/Math.max(100,phaseExtent*2));
      const longitudinal=e.shape==='loop'?
        Math.cos(station/Math.max(100,phaseExtent*2)*e.frequency*Math.PI*2+e.phase*Math.PI/180)*e.amplitude*width:0;
      const x=p.x+p.nx*transverse+p.tx*longitudinal;
      const y=p.y+p.ny*transverse+p.ty*longitudinal;
      if(i===0)path.moveTo(x,y);else path.lineTo(x,y);
    }
    if(e.stroke!=='solid')ctx.lineDashOffset=-arcLengthUntil(stripe,extent,start);
    ctx.stroke(path);ctx.restore();
  }
  ctx.restore();
}
function drawBrushWear(ctx,stripe,extent,scene){
  if(!scene.brushRoughness)return;
  const random=rng(scene.seed+':brush:'+stripe.index);
  const strength=scene.brushRoughness/100;
  const n=Math.ceil(18+strength*300);
  const core=stripe.coreExtent??extent;
  const start=Math.max(-core,stripe.segmentStart??-core);
  const end=Math.min(core,stripe.segmentEnd??core);
  const renderStart=stripe.segmentStart??-extent;
  const renderEnd=stripe.segmentEnd??extent;
  ctx.save();
  // Wear belongs to the painted mark, never to the adjacent background.
  // In particular, dotted ribbons must not grow free-floating scratches.
  ctx.clip(stripeFillPath(stripe,extent,scene));
  ctx.strokeStyle=scene.background==='white'?'#fff':'#000';
  ctx.lineCap='round';
  const scratch=(station,random)=>{
    const p=samplePath(stripe,station,extent);
    const half=widthAt(stripe,station,extent)*.38;
    if(half<.4)return;
    const offset=(random()*2-1)*half;
    const x=p.x+p.nx*offset,y=p.y+p.ny*offset;
    const length=.5+random()*Math.min(13,stripe.width*.6);
    ctx.globalAlpha=(.04+.62*random())*strength;
    ctx.lineWidth=Math.max(.3,Math.min(1.8,stripe.width*.05)*(0.2+random()));
    ctx.beginPath();ctx.moveTo(x,y);
    ctx.lineTo(x+p.tx*length,y+p.ty*length);ctx.stroke();
  };
  // Preserve the exact seeded sequence within the original composition.
  // Extending the rendered domain must never reposition its wear scratches.
  if(end>start)for(let i=0;i<n;i++)scratch(start+(end-start)*random(),random);
  const density=n/Math.max(1,end-start);
  for(const [from,to,side] of [
    [renderStart,start,'before'],[end,renderEnd,'after']
  ]){
    if(to<=from)continue;
    const extra=rng(scene.seed+':brush:'+stripe.index+':'+side);
    const count=Math.min(1200,Math.ceil((to-from)*density));
    for(let i=0;i<count;i++)scratch(from+(to-from)*extra(),extra);
  }
  ctx.restore();
}
function drawConstruction(ctx,stripe,extent,scene){
  const kind=scene.construction;
  const ribbon=stripeFillPath(stripe,extent,scene);
  if(kind==='stroke'){
    ctx.fill(ribbon);
    return true;
  }
  if(kind==='tonal'){
    ctx.fill(ribbon);
    const contrast=scene.tonalContrast/100;
    for(const [offset,light,alpha] of [[-.29,true,.23],[0,false,.16],[.27,true,.17]]){
      ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
      ctx.lineWidth=stripe.width*(offset===0?.20:.16);
      ctx.strokeStyle=light?'#fff':'#000';
      ctx.globalAlpha=alpha*contrast;
      ctx.stroke(traceCentre(stripe,extent,offset));
      ctx.restore();
    }
    return true;
  }
  if(kind==='woven'){
    const step=Math.max(12,stripe.width*.54);
    ctx.save();ctx.strokeStyle=stripe.color;
    ctx.lineWidth=Math.max(1.3,stripe.width*.14);
    ctx.lineCap='square';
    const start=stripe.segmentStart??-extent,end=stripe.segmentEnd??extent;
    // Continuous selvedges make the diagonal thread lattice legible, with
    // negative space maintained between each independent crossing.
    ctx.save();ctx.lineWidth=Math.max(1.5,stripe.width*.075);
    ctx.stroke(traceEdge(stripe,extent,-1,scene));
    ctx.stroke(traceEdge(stripe,extent,1,scene));
    ctx.restore();
    const bands=4;
    // Align woven crossings to fixed source stations; zoom only reveals
    // additional threads, never changes previously visible parity.
    const origin=-(stripe.coreExtent??extent);
    const first=Math.floor((start+step-origin)/step);
    const last=Math.ceil((end-step-origin)/step);
    for(let index=first;index<=last;index++){
      const x=origin+index*step;
      if(x<=start||x>=end-step)continue;
      const flip=(index&1)===0?1:-1;
      for(let j=0;j<bands;j++){
        const from=samplePath(stripe,x,extent),to=samplePath(stripe,x+step*.83,extent);
        const o1=-.42+j*.23,o2=o1+flip*.20;
        const a={x:from.x+from.nx*stripe.width*o1,y:from.y+from.ny*stripe.width*o1};
        const b={x:to.x+to.nx*stripe.width*o2,y:to.y+to.ny*stripe.width*o2};
        if(Math.abs(o2)>.49)continue;
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
    }
    ctx.restore();
    return true;
  }
  return false;
}
function fillMotif(ctx,stripe,extent,scene) {
  if(drawConstruction(ctx,stripe,extent,scene))return;
  const motif=stripe.motif;
  if(motif==='solid'){ctx.fill(stripeFillPath(stripe,extent,scene));return;}
  const random=rng(scene.seed+':motifs:'+stripe.index);
  // Motif size and density are independent from centreline geometry.
  // Every motif uses the same two dedicated controls, not curve frequency.
  const motifScale=Math.pow(2,(scene.motifSize-50)/28);
  const motifRate=Math.pow(2,(scene.motifFrequency-50)/27);
  const step=Math.max(1.4,stripe.width*.42*stripe.patternScale*
    (motif==='dots'?1:motifScale));
  const across=Math.max(1,Math.ceil(stripe.width/(step*.83)));
  const stroke=Math.min(step*.19,Math.max(.55,stripe.width*.14));
  ctx.save();ctx.lineWidth=stroke;ctx.lineCap='round';ctx.lineJoin='round';
  const dotSpacingFactor=motif==='dots'?1.8-.95*scene.dotSpacing/100:1;
  const spacing=Math.max(2.5,(motif==='dashes'?step*1.9:motif==='chevrons'?step*1.5:step)*dotSpacingFactor/motifRate);
  const drawColumn=(x,index,random)=>{
    for(let j=-across;j<=across;j++){
      if(motif==='checker' && ((index+1+j)&1)!==0)continue;
      const variation=motifVariation(scene,stripe,random);
      const offset=j*step*.82;
      const jitter=scene.intensity*step*.10;
      const xx=x+(Math.abs(j)%2)*spacing*.35+(random()-.5)*jitter;
      const yy=geometryAt(xx,stripe,extent)+offset+(random()-.5)*jitter+textureHeight(scene,stripe,xx,0)*.3;
      // Large dots are sized relative to the available stripe width, so
      // the maximum remains a visible disc instead of being rejected by the
      // all-or-nothing mark fit test.
      const radius=motif==='dots'?
        stripe.width*(.05+.38*scene.motifSize/100)*
          (.3+.7*scene.dotSize/100)*variation.scale:
        step*.28*variation.scale;
      // Bounds include rotation; never clip a partly visible element.
      let bx=radius,by=radius;
      if(motif==='hatch'){bx=step*.34*variation.scale+stroke/2;by=bx;}
      else if(motif==='chevrons'){bx=step*.39*variation.scale+stroke/2;by=step*.26*variation.scale+stroke/2;}
      else if(motif==='dashes'){bx=step*.53*variation.scale+stroke/2;by=stroke/2;}
      else if(motif==='stars'){bx=radius*1.16;by=radius*1.16;}
      const cs=Math.abs(Math.cos(variation.angle)),sn=Math.abs(Math.sin(variation.angle));
      const halfX=bx*cs+by*sn,halfY=bx*sn+by*cs;
      if(!motifFits(stripe,scene,xx,yy,halfX,halfY,extent))continue;
      ctx.save();
      ctx.globalAlpha=variation.opacity;
      if(spatialGeometry(stripe)){
        const p=samplePath(stripe,xx,extent),offset=yy-p.y;
        ctx.translate(p.x+p.nx*offset,p.y+p.ny*offset);
        ctx.rotate(Math.atan2(p.ty,p.tx)+variation.angle);
      }else{ctx.translate(xx,yy);ctx.rotate(variation.angle);}
      if(motif==='hatch'){
        ctx.beginPath();ctx.moveTo(-step*.34*variation.scale,step*.34*variation.scale);ctx.lineTo(step*.34*variation.scale,-step*.34*variation.scale);ctx.stroke();
      }else if(motif==='chevrons'){
        ctx.beginPath();ctx.moveTo(-step*.39*variation.scale,-step*.25*variation.scale);
        ctx.lineTo(0,step*.26*variation.scale);ctx.lineTo(step*.39*variation.scale,-step*.25*variation.scale);ctx.stroke();
      }else if(motif==='dashes'){
        ctx.beginPath();ctx.moveTo(-step*.53*variation.scale,0);ctx.lineTo(step*.53*variation.scale,0);ctx.stroke();
      }else if(motif==='dots'){
        ctx.beginPath();ctx.arc(0,0,radius,0,TAU);ctx.fill();
      }else if(motif==='stars')stampStar(ctx,0,0,radius*1.16);
      else if(motif==='diamonds'){
        ctx.beginPath();ctx.moveTo(0,-radius);ctx.lineTo(radius,0);ctx.lineTo(0,radius);ctx.lineTo(-radius,0);ctx.closePath();ctx.fill();
      }else if(motif==='checker')ctx.fillRect(-radius,-radius,radius*2,radius*2);
      ctx.restore();
    }
  };
  // Keep motifs rooted in the scene's original station lattice. Newly
  // revealed negative columns use independent random streams so generating
  // them does not reroll pre-existing dots, dashes or other marks.
  const base=-(stripe.coreExtent??extent)+spacing;
  const minIndex=Math.ceil((-extent+spacing-base)/spacing);
  for(let i=minIndex;i<0;i++)
    drawColumn(base+i*spacing,i,rng(scene.seed+':motifs:'+stripe.index+':outside:'+i));
  for(let i=0,x=base;x<extent-spacing;i++,x=base+i*spacing)
    drawColumn(x,i,random);
  ctx.restore();
}

// Canvas creation is the only host-specific dependency in the production
// rasterizer. DOM canvases remain the reference/main-thread backend; the same
// algorithms use OffscreenCanvas inside a dedicated rendering worker.
export function createRenderSurface(width,height,canvasFactory){
  const canvas=canvasFactory?canvasFactory(width,height):
    (typeof document!=='undefined'?document.createElement('canvas'):
      typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(width,height):null);
  if(!canvas)throw new Error('No Canvas2D rendering surface is available');
  canvas.width=width;canvas.height=height;
  return canvas;
}

// Follow a single ribbon edge at an independently controlled OUTWARD
// offset. This keeps one-sided outlines one-sided even with a buffer.
function offsetStripeEdge(stripe,extent,scene,distance){
  const path=new Path2D();
  const start=stripe.segmentStart??-extent,end=stripe.segmentEnd??extent;
  const count=Math.max(500,Math.ceil((end-start)/3));
  for(let i=0;i<=count;i++){
    const x=start+(end-start)*i/count;
    const p=edgePoint(x,stripe,extent,-1,scene);
    const a=edgePoint(Math.max(start,x-1),stripe,extent,-1,scene);
    const b=edgePoint(Math.min(end,x+1),stripe,extent,-1,scene);
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
    // The negative stripe edge is on the negative normal side.
    const px=p.x+dy/len*distance,py=p.y-dx/len*distance;
    if(i===0)path.moveTo(px,py);else path.lineTo(px,py);
  }
  return path;
}
// Pure, inspectable geometry: increasing thickness must never change
// separation, and increasing the buffer must never change thickness.
export function outlineDimensions(stripe,scene){
  const isBlack=scene.outline.startsWith('black');
  const style=isBlack?(scene.outline==='black'?'white':scene.outline.slice(6)):scene.outline;
  const base=style==='hairline'?.55:style==='double'?1.4:1.05;
  return {thickness:base+scene.gap/100*Math.min(
    style==='hairline'?5:20,stripe.width*.60),
  separation:scene.outlineBuffer/100*Math.min(20,stripe.width*.70)};
}
// Open ribbon edges for a locally repaired overpass. Using drawOutline's
// CLOSED silhouette here adds artificial transverse endcaps at the temporary
// branch endpoints; clipped against another path those caps become the tiny
// bars and prongs visible in high-individuality drawn loops.
function drawCrossingOutline(ctx,stripe,scene){
  if(scene.outline==='none')return;
  const black=scene.outline.startsWith('black');
  const style=black?(scene.outline==='black'?'white':scene.outline.slice(6)):scene.outline;
  const colour=black?'rgba(0,0,0,.96)':'rgba(255,255,255,.94)';
  const {thickness:width,separation:buffer}=outlineDimensions(stripe,scene);
  ctx.save();
  ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle=colour;
  if(style==='broken')ctx.setLineDash([15,10]);
  if(style==='one-side'&&stripe.lineStyle==='continuous'){
    ctx.lineWidth=width;
    ctx.stroke(offsetStripeEdge(stripe,scene.extent,scene,buffer+width/2));
  }else{
    const edges=[traceEdge(stripe,scene.extent,-1,scene),
      traceEdge(stripe,scene.extent,1,scene)];
    ctx.lineWidth=2*(buffer+width);
    for(const edge of edges)ctx.stroke(edge);
    if(buffer>0){
      ctx.globalCompositeOperation='destination-out';
      ctx.lineWidth=2*buffer;
      for(const edge of edges)ctx.stroke(edge);
      ctx.globalCompositeOperation='source-over';
    }
  }
  ctx.restore();
}
function drawOutline(ctx,path,stripe,scene) {
  if(scene.outline==='none')return;
  const black=scene.outline.startsWith('black');
  const style=black?(scene.outline==='black'?'white':scene.outline.slice(6)):scene.outline;
  const colour=black?'rgba(0,0,0,.96)':'rgba(255,255,255,.94)';
  // The existing "gap" recipe field is thickness (renamed in the UI).
  // New outlineBuffer independently controls stripe-to-outline distance.
  const {thickness:width,separation:buffer}=outlineDimensions(stripe,scene);
  ctx.save();ctx.lineJoin='round';ctx.strokeStyle=colour;
  if(style==='broken')ctx.setLineDash([15,10]);
  if(style==='one-side'&&stripe.lineStyle==='continuous'){
    ctx.lineWidth=width;
    ctx.stroke(offsetStripeEdge(stripe,scene.extent,scene,buffer+width/2));
    ctx.restore();return;
  }
  // Paint outward from the silhouette by exactly (buffer + width), then
  // restore the physical buffer to the canvas background colour. The stripe
  // fill follows this call. Setting width does not alter the gap; changing
  // the gap does not alter stroke thickness.
  ctx.lineWidth=2*(buffer+width);ctx.stroke(path);
  if(buffer>0){
    // Cut the spacing out of the transparent stripe ink. This reveals the
    // real background (including paper/grain textures), not an opaque painted
    // white/black surrogate that would hide the material beneath.
    ctx.globalCompositeOperation='destination-out';
    ctx.lineWidth=2*buffer;ctx.stroke(path);
    ctx.globalCompositeOperation='source-over';
  }
  if(style==='double'&&buffer===0){
    ctx.strokeStyle=colour;ctx.lineWidth=.95;ctx.stroke(path);
  }
  ctx.restore();
}

// Ambient light and shade are fixed to the *whole canvas*, independent of
// ribbons, their silhouettes, and the cached unlit/nudged composition.
export function applyCanvasAtmosphere(ctx,width,height,recipe){
  if(recipe.lightingMood==='off'||(!recipe.lightStrength&&!recipe.shadowStrength))return;
  const direction=recipe.lightDirection||'top-left';
  const fromRight=direction.endsWith('right');
  const fromBottom=direction.startsWith('bottom');
  const x=fromRight?width:0,y=fromBottom?height:0;
  const farX=width-x,farY=height-y;
  const light=recipe.lightingMood==='golden'?[255,204,133]:
    recipe.lightingMood==='moonlight'?[177,207,255]:[255,255,242];
  const shade=recipe.lightingMood==='golden'?[49,34,70]:
    recipe.lightingMood==='moonlight'?[13,23,62]:[22,28,48];
  const rgba=(rgb,opacity)=>`rgba(${rgb.join(',')},${opacity.toFixed(4)})`;
  ctx.save();
  ctx.setTransform(1,0,0,1,0,0);
  if(recipe.lightStrength>0){
    const glow=ctx.createRadialGradient(x,y,0,x,y,Math.hypot(width,height)*.86);
    glow.addColorStop(0,rgba(light,.38*recipe.lightStrength/100));
    glow.addColorStop(.44,rgba(light,.15*recipe.lightStrength/100));
    glow.addColorStop(1,rgba(light,0));
    ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
  }
  if(recipe.shadowStrength>0){
    const gradient=ctx.createLinearGradient(x,y,farX,farY);
    gradient.addColorStop(0,rgba(shade,0));
    gradient.addColorStop(.35,rgba(shade,.045*recipe.shadowStrength/100));
    gradient.addColorStop(1,rgba(shade,.52*recipe.shadowStrength/100));
    ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
  }
  ctx.restore();
}
// Optional silhouette shadow, composited behind the completed image.
// It is separate from the stationary, whole-canvas atmospheric illumination.
// The cached ink remains immutable, so nudge cannot reshape stripe geometry.
export function stripeShadowParameters(recipe,scale=1){
  if(recipe.stripeShadowStrength<=0)return null;
  const strength=recipe.stripeShadowStrength/100;
  const softness=recipe.stripeShadowSoftness/100;
  const direction=recipe.stripeShadowDirection||'top-left';
  const x=(direction.endsWith('right')?-1:1);
  const y=(direction.startsWith('bottom')?-1:1);
  const distance=5*scale;
  return {
    color:`rgba(11, 12, 21, ${(.65*strength).toFixed(4)})`,
    blur:(1+16*softness)*scale,
    x:x*distance,
    y:y*distance,
  };
}
// Preview caches a full ±30% nudge range once; direct high-resolution exports
// allocate only the margin actually needed by their selected offset.
export function nudgeOverhang(width,height,recipe,cache=false){
  const max=cache?30:0;
  const x=Number(recipe.positionX)||0, y=Number(recipe.positionY)||0;
  return {
    left:Math.ceil(width*(cache?max:Math.max(0,x))/100),
    right:Math.ceil(width*(cache?max:Math.max(0,-x))/100),
    top:Math.ceil(height*(cache?max:Math.max(0,y))/100),
    bottom:Math.ceil(height*(cache?max:Math.max(0,-y))/100),
    width,height,
  };
}
function drawFinishedInk(ctx,ink,recipe,margin={left:0,top:0,width:ink.width,height:ink.height}){
  const dx=margin.width*(recipe.positionX||0)/100-margin.left;
  const dy=margin.height*(recipe.positionY||0)/100-margin.top;
  ctx.save();
  const shadow=stripeShadowParameters(recipe,margin.width/DESIGN_WIDTH);
  if(shadow){
    ctx.shadowColor=shadow.color;
    ctx.shadowBlur=shadow.blur;
    ctx.shadowOffsetX=shadow.x;
    ctx.shadowOffsetY=shadow.y;
  }
  ctx.drawImage(ink,dx,dy);
  ctx.restore();
}
/** Repaint only the two cached bitmaps. No solving, balancing or regeneration. */
export function presentNudgedArtwork(canvas, layers, recipe) {
  if(!layers?.background || !layers?.ink)throw new Error('No original composition to nudge');
  const ctx=canvas.getContext('2d',{alpha:false});
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(layers.background,0,0);
  drawFinishedInk(ctx,layers.ink,recipe,layers.overhang);
  applyCanvasAtmosphere(ctx,canvas.width,canvas.height,recipe);
  applyPhotoFinish(ctx,canvas.width,canvas.height,recipe.photoLook,recipe.seed);
}

// Closed-region objects share the same transparent ink, palette slots,
// material stack, camera, lighting, nudge and export path as ribbon objects.
// No regional generator paints directly: the painter consumes scene.objects.
export function drawRegionObjects(ctx,scene){
  const divider=scene.dividerColor==='background'?scene.background:scene.dividerColor;
  const hasDivider=scene.dividerColor!=='none'&&scene.dividerWidth>0;
  const trace=object=>{
    ctx.beginPath();
    if(object.circle){
      const {cx,cy,r}=object.circle;
      // Exact circle in the design coordinate plane. Export and preview
      // share the same camera mapping without polygonal chord flattening.
      ctx.arc(cx,cy,r,0,2*Math.PI);
    }else{
      // A compound imported silhouette can contain islands and holes.
      // Even-odd filling must use ALL rings in the same Canvas path.
      for(const ring of object.rings||[object.vertices]){
        ctx.moveTo(ring[0].x,ring[0].y);
        for(let i=1;i<ring.length;i++)ctx.lineTo(ring[i].x,ring[i].y);
        ctx.closePath();
      }
    }
  };
  const regions=scene.objects.filter(o=>o.kind==='region'&&o.vertices.length>=3);
  // First paint every fill. A tiny matching stroke closes antialiasing seams
  // where independent floating-point cells meet without a divider.
  for(const object of regions){
    ctx.save();trace(object);
    if(scene.glow>0){
      ctx.shadowColor=object.color;
      ctx.shadowBlur=scene.glow/100*32;
    }
    ctx.fillStyle=object.color;
    if(object.rings)ctx.fill('evenodd');else ctx.fill();
    ctx.shadowBlur=0;
    const stitch=matchingEmbroidery(scene.surfaceTreatments,{id:object.id,colorSlot:object.colorIndex});
    if(stitch){
      ctx.save();
      trace(object);
      ctx.clip(object.rings?'evenodd':'nonzero');
      drawRegionEmbroidery(ctx,object,stitch);
      ctx.restore();
    }
    drawRegionInteriors(ctx,object,scene.interiorElements,scene.structure,scene.renderBounds);
    if(!hasDivider){
      if(stitch)trace(object);
      ctx.strokeStyle=object.color;
      ctx.lineWidth=1;
      ctx.lineJoin='round';
      ctx.stroke();
    }
    ctx.restore();
  }
  // A separate boundary pass prevents a subsequent cell's fill erasing half
  // of its neighbour's divider. Stroke colour is an independent background
  // role, never an eighth rainbow pigment.
  if(hasDivider){
    ctx.save();
    ctx.strokeStyle=divider==='white'?'#fff':'#000';
    ctx.lineWidth=.3+scene.dividerWidth*.24;
    ctx.lineJoin='round';
    for(const object of regions){trace(object);ctx.stroke();}
    ctx.restore();
  }
}

export function drawWallpaper(canvas, recipe, options={}) {
  const scene=resolveScene(recipe);
  const camera=viewCamera(canvas.width,canvas.height,scene.viewZoom,
    {panX:scene.viewPanX,panY:scene.viewPanY});
  // Stripe cap/continuity decisions belong to the authored composition,
  // not the *position* of a viewing window. Keep the baseline (un-panned)
  // camera rectangle for those decisions so moving the frame cannot move
  // strand endpoints, hide a stripe or reroll the visible artwork.
  // The actual panned bounds still control physical render coverage below.
  scene.viewBounds=viewCamera(canvas.width,canvas.height,scene.viewZoom).viewBounds;
  // The domain extends beyond the old frame at zoom-out, so fresh ribbon
  // geometry is painted where a 100%-cropped bitmap contained no pixels.
  scene.coreExtent=scene.extent;
  if(camera.zoom<1)scene.extent/=camera.zoom;
  // Reframing must expose original world ink beyond either edge, especially
  // an extended drawn path. Do not use a translated already-clipped frame.
  scene.extent+=Math.hypot(camera.shiftX,camera.shiftY);
  // The physical reach covers zoom-out corners and the 30% cache overhang.
  // Floating compositions and closed silhouettes deliberately keep their caps.
  const extendOpenPath=scene.geometry==='drawn'&&scene.extendDrawnPath&&
    scene.composition!=='floating'&&!scene.stripes[0]?.drawnPath?.closed;
  if(extendOpenPath){
    const diagonal=Math.hypot(DESIGN_WIDTH,DESIGN_HEIGHT);
    scene.extent=Math.max(scene.extent,scene.coreExtent+
      (2*diagonal+.3*Math.max(DESIGN_WIDTH,DESIGN_HEIGHT))/camera.zoom);
  }
  const ctx=canvas.getContext('2d', { alpha: false });
  if(!ctx) throw new Error('Canvas 2D is not supported by this browser.');
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
  // Draw translucent ink first, apply source-atop material, then place an opaque black
  // layer *behind* it. This preserves truly black negative space at every resolution.
  // alpha:false canvases defeat this layering, so the compositing is done with a
  // separate transparent canvas surface at the target size.
  const margin=nudgeOverhang(canvas.width,canvas.height,scene,!!options.cache);
  const inkWidth=canvas.width+margin.left+margin.right;
  const inkHeight=canvas.height+margin.top+margin.bottom;
  const {scaleX,scaleY,offsetX,offsetY}=camera;
  scene.renderBounds=camera.boundsWithMargin(margin);
  const ink=createRenderSurface(inkWidth,inkHeight,options.canvasFactory);
  const g=ink.getContext('2d');
  if(!g) throw new Error('Canvas ink layer unavailable');
  g.setTransform(scaleX,0,0,scaleY,
    margin.left+offsetX,margin.top+offsetY);
  if(scene.structure==='paths'){
  if(scene.mirrorHorizontal||scene.mirrorVertical){
    g.translate(DESIGN_WIDTH/2,DESIGN_HEIGHT/2);
    g.scale(scene.mirrorHorizontal?-1:1,scene.mirrorVertical?-1:1);
    g.translate(scene.centerX-DESIGN_WIDTH/2,scene.centerY-DESIGN_HEIGHT/2);
  }else g.translate(scene.centerX,scene.centerY);
  g.rotate(scene.angle);
  const crossingBundles=[];
  for(const bundle of scene.objects){
  const bundleOffset=bundle.offset;
  const crossingStripes=[];
  for(const original of bundle.stripes){
    const stripe=scene.bundleOffsets.length===1?{...original}:
      {...original,center:original.center+bundleOffset};
    stripe.objectId=bundle.id+'/stripe-'+original.index;
    stripe.coreExtent=scene.coreExtent;
    if((stripe.sharedGeometry??stripe.geometry)==='drawn'){
      stripe.extendDrawnPath=extendOpenPath;
      stripe.segmentStart=extendOpenPath?-scene.extent:-scene.coreExtent;
      stripe.segmentEnd=extendOpenPath?scene.extent:scene.coreExtent;
    }
    if(['tonal','woven'].includes(scene.construction))stripe.lineStyle='continuous';
    balanceStripeEnds(scene,stripe);
    if(stripe.hidden)continue;
    crossingStripes.push(stripe);
    const path=stripePath(stripe,scene.extent,scene);
    if(scene.glow>0){
      g.save();g.shadowColor=stripe.color;g.shadowBlur=scene.glow/100*32;g.globalAlpha=.70;
      g.fillStyle=stripe.color;g.fill(stripeFillPath(stripe,scene.extent,scene));g.restore();
    }
    drawOutline(g,path,stripe,scene);
    g.fillStyle=stripe.color;g.strokeStyle=stripe.color;
    fillMotif(g,stripe,scene.extent,scene);
    const stitch=matchingEmbroidery(scene.surfaceTreatments,{
      id:stripe.objectId,colorSlot:NAMES.indexOf(stripe.name)});
    if(stitch&&scene.construction==='ribbon'&&scene.lineStyle==='continuous'&&scene.motif==='solid'){
      g.save();g.clip(stripeFillPath(stripe,scene.extent,scene));
      drawRibbonEmbroidery(g,stripe,scene.extent,stitch);
      g.restore();
    }
    if(scene.construction!=='woven')drawBrushWear(g,stripe,scene.extent,scene);
    drawPathInteriors(g,stripe,scene.extent,scene);
  }
  crossingBundles.push(crossingStripes);
  }
  // The basic painter's algorithm paints all seven colours in stripe order.
  // At a physical self-intersection that inadvertently chooses the apparent
  // overpass. Explicit traversal-order decisions now repaint ONLY the selected
  // branch at each crossing, clipped to that branch's actual ribbon envelope.
  // This is done on the SAME finished ink layer before applying texture.
  if(['loop','loops','drawn'].includes(scene.geometry)){
    for(const stripes of crossingBundles){
      const reference=stripes.find(st=>st.index===3)||stripes[Math.floor(stripes.length/2)];
      if(!reference)continue;
      const hits=findPathCrossings(reference,scene.extent,samplePath);
      for(let k=0;k<hits.length;k++){
        const hit=hits[k];
        const pack=Math.max(12,scene.width*7);
        // A shallow crossing has a longer overlap; include enough branch
        // on both sides for its final outline to join continuously.
        const halfLength=Math.max(46,Math.min(310,(pack+24)/(hit.angle||.15)));
        // Repaint only where the two *bundles* physically overlap.
        // Repainting an entire fixed-length segment produced visible square
        // cutoffs on the otherwise continuous ribbons, especially in loops.
        // The other branch's actual union of seven stripe footprints is the
        // natural, seamless occlusion mask. It also preserves negative space.
        // One envelope per crossing branch includes the *spaces between*
        // rainbow stripes. Cutting a separate mask for every underpassing
        // stripe made the overpass into disconnected square checkerboard
        // patches. The envelope is continuous, just like a real woven bundle.
        const widest=Math.max(...stripes.map(st=>st.width));
        const minCenter=Math.min(...stripes.map(st=>st.center));
        const maxCenter=Math.max(...stripes.map(st=>st.center));
        const referenceCenter=reference.center;
        const envelope={...reference,
          width:2*Math.max(
            Math.abs(minCenter-referenceCenter),
            Math.abs(maxCenter-referenceCenter))+widest+12};
        const branchMasks=[hit.early,hit.late].map(station=>
          crossingBranchClip(envelope,scene.extent,station,halfLength,samplePath));
        for(const stripe of stripes){
          const later=crossingTopIsLater(scene.crossingMode,stripe.index,k);
          const station=later?hit.late:hit.early;
          const start=Math.max(stripe.segmentStart??-scene.extent,station-halfLength);
          const end=Math.min(stripe.segmentEnd??scene.extent,station+halfLength);
          if(end<=start)continue;
          // Repaint just this traversal, not the full self-intersecting
          // stripe. Replaying the complete stripe inside a local clip makes
          // the other arm leak through at tight loops (spikes and shards).
          // Only the local segment has matching geometry for this overpass.
          const branch={...stripe,segmentStart:start,segmentEnd:end,
            taperStart:stripe.taperStart??stripe.segmentStart??-scene.extent,
            taperEnd:stripe.taperEnd??stripe.segmentEnd??scene.extent};
          const path=stripePath(branch,scene.extent,scene);
          g.save();
          g.clip(branchMasks[later?0:1]);
          g.clip(crossingBranchClip(branch,scene.extent,station,halfLength,samplePath));
          drawCrossingOutline(g,branch,scene);
          g.fillStyle=stripe.color;g.strokeStyle=stripe.color;
          fillMotif(g,branch,scene.extent,scene);
          drawPathInteriors(g,branch,scene.extent,scene);
          // Brush wear is seeded against the complete ribbon. Sample it
          // from the original path through the local branch mask so a
          // crossing does not suddenly acquire a different grain pattern.
          if(scene.construction!=='woven'){
            g.save();g.clip(path);
            drawBrushWear(g,stripe,scene.extent,scene);
            g.restore();
          }
          g.restore();
        }
      }
    }
  }
  }else drawRegionObjects(g,scene);
  // One scratch buffer is reused for every texture layer and surface.
  // The stripe pass masks against the current ink alpha, so multiply/screen/etc
  // affect the stripe colours without spraying texture into negative space.
  const layers=scene.textureLayers;
  let scratch,s;
  const active=layers.length>0;
  if(active){
    scratch=createRenderSurface(inkWidth,inkHeight,options.canvasFactory);
    s=scratch.getContext('2d');
    if(!s) throw new Error('Texture composite surface unavailable');
  }
  const textured=layer=>{
    s.setTransform(1,0,0,1,0,0);
    s.globalCompositeOperation='source-over';s.globalAlpha=1;
    s.clearRect(0,0,inkWidth,inkHeight);
    const radians=layer.rotation*Math.PI/180;
    const c=Math.cos(radians),sin=Math.sin(radians);
    // Transform only the actual visible crop (+ cached nudge overhang) into
    // material space. Avoid generating enormous offscreen fields at zoom-out.
    const b=scene.renderBounds,points=[
      [b.left,b.top],[b.left,b.bottom],[b.right,b.top],[b.right,b.bottom],
    ];
    let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
    for(const [x,y] of points){
      const dx=x-DESIGN_WIDTH/2,dy=y-DESIGN_HEIGHT/2;
      const tx=dx*c+dy*sin,ty=-dx*sin+dy*c;
      left=Math.min(left,tx);right=Math.max(right,tx);
      top=Math.min(top,ty);bottom=Math.max(bottom,ty);
    }
    // Rasterize the material in stable logical coordinates *before* camera
    // scaling. Otherwise fractional vector strokes are antialiased differently
    // in HTMLCanvas and OffscreenCanvas, shifting worker/export pixels.
    const x0=Math.floor(left)-2,y0=Math.floor(top)-2;
    const w=Math.ceil(right)-x0+2,h=Math.ceil(bottom)-y0+2;
    const targetScale=Math.min(2,Math.max(1,Math.round(Math.max(scaleX,scaleY))));
    const rasterScale=Math.min(targetScale,Math.sqrt(7000000/(w*h)));
    const tw=Math.max(1,Math.ceil(w*rasterScale));
    const th=Math.max(1,Math.ceil(h*rasterScale));
    const surface=createRenderSurface(tw,th,options.canvasFactory);
    const t=surface.getContext('2d');
    if(!t)throw new Error('Material surface unavailable');
    t.setTransform(rasterScale,0,0,rasterScale,-x0*rasterScale,-y0*rasterScale);
    t.globalAlpha=layer.strength/100;
    paintMaterial(t,layer,{left,right,top,bottom});
    s.setTransform(scaleX,0,0,scaleY,margin.left+offsetX,margin.top+offsetY);
    s.translate(DESIGN_WIDTH/2,DESIGN_HEIGHT/2);
    s.rotate(radians);
    s.globalAlpha=1;
    s.drawImage(surface,x0,y0,w,h);
    s.setTransform(1,0,0,1,0,0);s.globalAlpha=1;
  };
  const blend=layer=>layer.blend==='normal'?'source-over':layer.blend;
  ctx.fillStyle=scene.background==='white'?'#fff':'#000';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  for(let i=0;i<layers.length;i++){
    const layer=layers[i];
    if(layer.coverage==='stripes')continue;
    textured(layer);
    ctx.save();ctx.globalCompositeOperation=blend(layer);
    ctx.drawImage(scratch,margin.left,margin.top,canvas.width,canvas.height,0,0,canvas.width,canvas.height);
    ctx.restore();
  }
  for(let i=0;i<layers.length;i++){
    const layer=layers[i];
    if(layer.coverage==='background')continue;
    textured(layer);
    s.save();s.globalCompositeOperation='destination-in';s.drawImage(ink,0,0);s.restore();
    g.save();g.setTransform(1,0,0,1,0,0);
    g.globalCompositeOperation=blend(layer);g.drawImage(scratch,0,0);g.restore();
  }
  // Background stays fixed. The immutable ink now has transparent overscan:
  // stripes that exited the original frame keep going off-frame when nudged.
  // Intentionally inset stripe endpoints are unchanged.
  if(options.cache) {
    const background=createRenderSurface(canvas.width,canvas.height,options.canvasFactory);
    background.getContext('2d').drawImage(canvas,0,0);
    options.cache.background=background;
    options.cache.ink=ink;
    options.cache.overhang=margin;
  }
  drawFinishedInk(ctx,ink,scene,margin);
  applyCanvasAtmosphere(ctx,canvas.width,canvas.height,scene);
  if(!options.skipPhoto)applyPhotoFinish(ctx,canvas.width,canvas.height,scene.photoLook,scene.seed);
  return scene;
}
