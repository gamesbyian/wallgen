// Pure geometry for finger-drawn paths. Stored coordinates are normalized to
// the 600 x 1300 design plane, independent of the display's size or zoom.
// Imported paths are bounded, finite, compact and safe for deterministic export.
import {interpretStroke} from './stroke-intent.js';

export const PATH_WIDTH=600;
export const PATH_HEIGHT=1300;
export const MAX_DRAWN_POINTS=96;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot((a[0]-b[0])*PATH_WIDTH,(a[1]-b[1])*PATH_HEIGHT);
const interpolate=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
const round=x=>Math.round(x*100000)/100000;
// Extra-frame strokes retain real off-canvas coordinates for natural entry/exit.
export const DRAW_COORD_MIN=-2;
export const DRAW_COORD_MAX=3;

export function normalizeDrawnPath(input){
  if(!Array.isArray(input))return [];
  const points=[];
  for(const point of input.slice(0,1200)){
    if(!Array.isArray(point)||point.length<2)continue;
    const x=Number(point[0]),y=Number(point[1]);
    if(!Number.isFinite(x)||!Number.isFinite(y))continue;
    const next=[round(clamp(x,DRAW_COORD_MIN,DRAW_COORD_MAX)),round(clamp(y,DRAW_COORD_MIN,DRAW_COORD_MAX))];
    if(!points.length||distance(next,points.at(-1))>=.75)points.push(next);
  }
  if(points.length<2)return [];
  const length=points.slice(1).reduce((sum,p,i)=>sum+distance(p,points[i]),0);
  if(length<35)return [];
  // Keep stored and imported paths bounded without truncating their endpoint.
  const reduced=points.length>MAX_DRAWN_POINTS?resamplePath(points,MAX_DRAWN_POINTS):points;
  return reduced.map(([x,y])=>[round(x),round(y)]);
}

export function resamplePath(points,count){
  if(points.length<2)return points.slice();
  const cum=[0];
  for(let i=1;i<points.length;i++)cum.push(cum.at(-1)+distance(points[i-1],points[i]));
  const total=cum.at(-1);
  if(total<=0)return [points[0],points.at(-1)];
  const out=[];
  let j=1;
  for(let i=0;i<count;i++){
    const pos=total*i/(count-1);
    while(j<cum.length-1&&cum[j]<pos)j++;
    const f=clamp((pos-cum[j-1])/(cum[j]-cum[j-1]||1),0,1);
    out.push(interpolate(points[j-1],points[j],f));
  }
  return out;
}

function pointSegmentDistance(p,a,b){
  const x=(p[0]-a[0])*PATH_WIDTH,y=(p[1]-a[1])*PATH_HEIGHT;
  const dx=(b[0]-a[0])*PATH_WIDTH,dy=(b[1]-a[1])*PATH_HEIGHT;
  const t=clamp((x*dx+y*dy)/(dx*dx+dy*dy||1),0,1);
  return Math.hypot(x-t*dx,y-t*dy);
}
export function simplifyPath(points,tolerance=3){
  if(points.length<=2)return points.slice();
  const keep=new Set([0,points.length-1]),stack=[[0,points.length-1]];
  while(stack.length){
    const [a,b]=stack.pop();
    let max=tolerance,index=-1;
    for(let i=a+1;i<b;i++){
      const d=pointSegmentDistance(points[i],points[a],points[b]);
      if(d>max){max=d;index=i;}
    }
    if(index!==-1){keep.add(index);stack.push([a,index],[index,b]);}
  }
  return [...keep].sort((a,b)=>a-b).map(i=>points[i]);
}
function soften(points,rounds){
  let out=points;
  for(let step=0;step<rounds;step++){
    if(out.length<=2)break;
    const next=[out[0]];
    for(let i=1;i<out.length;i++){
      next.push(interpolate(out[i-1],out[i],.25),interpolate(out[i-1],out[i],.75));
    }
    next.push(out.at(-1));
    out=next;
  }
  return out;
}

// Snap intended near-horizontal/vertical/diagonal segments, then soften joins.
// The 11-degree acceptance window prevents arbitrary diagonals from drifting.
function regularize(points){
  if(points.length<3)return points;
  const ends=[points[0]];
  for(let i=1;i<points.length-1;i++){
    const previous=ends.at(-1),p=points[i];
    const dx=(p[0]-previous[0])*PATH_WIDTH,dy=(p[1]-previous[1])*PATH_HEIGHT;
    const angle=Math.atan2(dy,dx),snap=Math.round(angle/(Math.PI/4))*(Math.PI/4);
    const delta=Math.atan2(Math.sin(angle-snap),Math.cos(angle-snap));
    if(Math.abs(delta)<11*Math.PI/180){
      const dist=Math.hypot(dx,dy);
      ends.push([clamp(previous[0]+Math.cos(snap)*dist/PATH_WIDTH,DRAW_COORD_MIN,DRAW_COORD_MAX),
        clamp(previous[1]+Math.sin(snap)*dist/PATH_HEIGHT,DRAW_COORD_MIN,DRAW_COORD_MAX)]);
    }else ends.push(p);
  }
  ends.push(points.at(-1));
  return soften(ends,2);
}

// Evenly sampled Gaussian fairing damps high-frequency wobble in both axes,
// rather than merely cutting corners. Retain the original endpoints exactly.
export function fairPath(points,{radius=5,sigma=2.6,passes=2}={}){
  if(points.length<4)return points.map(p=>p.slice());
  let current=points.map(p=>p.slice());
  const weights=Array.from({length:2*radius+1},(_,k)=>
    Math.exp(-.5*((k-radius)/sigma)**2));
  for(let pass=0;pass<passes;pass++){
    const next=current.map((p,i)=>{
      if(i===0||i===current.length-1)return p.slice();
      let x=0,y=0,total=0;
      for(let k=-radius;k<=radius;k++){
        const j=clamp(i+k,0,current.length-1),w=weights[k+radius];
        x+=current[j][0]*w;y+=current[j][1]*w;total+=w;
      }
      return [x/total,y/total];
    });
    current=next;
  }
  return current;
}

// Centripetal Catmull-Rom yields curved but locally stable interpolation:
// close control points cannot generate giant overshooting handles.
function catmullPoint(a,b,c,d,t){
  const dt=(p,q)=>Math.max(.00001,Math.sqrt(Math.sqrt(
    ((q[0]-p[0])*PATH_WIDTH)**2+((q[1]-p[1])*PATH_HEIGHT)**2)));
  const t0=0,t1=dt(a,b),t2=t1+dt(b,c),t3=t2+dt(c,d);
  const u=t1+(t2-t1)*t;
  const blend=(p,q,l,r)=>interpolate(p,q,(u-l)/(r-l||1));
  const a1=blend(a,b,t0,t1),a2=blend(b,c,t1,t2),a3=blend(c,d,t2,t3);
  const b1=blend(a1,a2,t0,t2),b2=blend(a2,a3,t1,t3);
  return blend(b1,b2,t1,t2);
}
export function curveThrough(points){
  if(points.length<3)return points.map(p=>p.slice());
  const out=[points[0].slice()];
  for(let i=0;i<points.length-1;i++){
    const a=points[Math.max(i-1,0)],b=points[i],
      c=points[i+1],d=points[Math.min(i+2,points.length-1)];
    const segments=Math.max(2,Math.ceil(distance(b,c)/9));
    for(let j=1;j<=segments;j++)
      out.push(j===segments?c.slice():catmullPoint(a,b,c,d,j/segments));
  }
  return out;
}

// Strength 1–5 keeps the previous pipeline unchanged. Beyond 5×, the
// increased fairing is assisted by conservative geometric interpretation:
// a confidently inferred line, level/vertical axis or circular loop can be
// fitted exactly, instead of blurring its intended shape away.
export function finishDrawnPath(raw,mode='smooth',strength=1){
  const power=Number.isFinite(Number(strength))?
    clamp(Number(strength),1,10):1;
  if(!Array.isArray(raw)||raw.length<2)return [];
  // Coalesce very dense pointer events before smoothing, with no dependence
  // on actual pointer-event sampling rate.
  const clean=[];
  for(const p of raw.slice(0,8000)){
    if(!Array.isArray(p)||!Number.isFinite(Number(p[0]))||!Number.isFinite(Number(p[1])))continue;
    const next=[clamp(Number(p[0]),DRAW_COORD_MIN,DRAW_COORD_MAX),clamp(Number(p[1]),DRAW_COORD_MIN,DRAW_COORD_MAX)];
    if(!clean.length||distance(next,clean.at(-1))>=1.5)clean.push(next);
  }
  if(clean.length<2)return [];
  const total=clean.slice(1).reduce((sum,p,i)=>sum+distance(p,clean[i]),0);
  if(total<35)return [];
  // Resample uniformly before fairing so varying pointer-event rates do not
  // alter the smoothing radius. Geometric mode regularizes intentional lines;
  // Smooth mode uses stronger low-frequency curvature fairing.
  const even=resamplePath(clean,Math.min(500,Math.max(8,Math.ceil(total/7))));
  const shaped=mode==='geometric'?
    curveThrough(regularize(simplifyPath(
      fairPath(even,{radius:Math.ceil(3*power),sigma:2.6*power,passes:1}),
      10+(power-1)*7))):
    curveThrough((()=>{
      const fair=fairPath(even,{
        radius:Math.ceil(7*power),sigma:3.2*power,passes:3
      });
      // At 1x retain the exact previous result. At higher strengths,
      // reduce micro-turns to long, fair segments before spline fitting.
      return power===1?fair:simplifyPath(fair,(power-1)*5);
    })());
  let result=shaped;
  if(power>5){
    const interpreted=interpretStroke(even);
    if(interpreted){
      // Gradually converge to mathematically true primitives by 10×.
      // The geometry recognizer sees the original, uniformly sampled stroke,
      // before aggressive Gaussian fairing could erase a small loop.
      const blend=Math.pow((power-5)/5,.8),count=Math.min(500,even.length);
      if(interpreted.weights){
        // Composite gestures have two different visits to every real
        // intersection. Their correction must stay aligned by *stroke index*.
        // Independently arc-length-resampling both fitted and fallback paths
        // shifts circle splice boundaries and creates facing little jags.
        const base=fairPath(even,{
          radius:Math.ceil(10+power*1.3),sigma:6+power*.45,passes:2
        });
        result=base.map((p,i)=>interpolate(p,interpreted.points[i],
          blend*interpreted.weights[i]));
      }else{
        // An entire line or circle is a single global primitive: there is no
        // composite junction and the original full-strength fit is retained.
        const base=resamplePath(shaped,count);
        const intended=resamplePath(interpreted.points,count);
        result=base.map((p,i)=>interpolate(p,intended[i],blend));
      }
    }
  }
  const points=resamplePath(result,Math.max(2,Math.min(MAX_DRAWN_POINTS,Math.ceil(total/9))));
  return normalizeDrawnPath(points);
}

export function prepareDrawnPath(input){
  const stored=normalizeDrawnPath(input);
  if(stored.length<2)return null;
  // Sparse recipe anchors have mathematical corners with zero turn radius.
  // Round these before normal offsets are constructed, just as finger traces
  // are rounded when committed. Dense saved strokes keep their exact samples.
  const shaped=stored.length<20?
    resamplePath(soften(stored,3),MAX_DRAWN_POINTS):stored;
  const points=shaped.map(([x,y])=>({x:x*PATH_WIDTH-PATH_WIDTH/2,y:y*PATH_HEIGHT-PATH_HEIGHT/2}));
  const lengths=[0];
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i];
    lengths.push(lengths.at(-1)+Math.hypot(b.x-a.x,b.y-a.y));
  }
  return {points,lengths,total:lengths.at(-1)};
}
export function pointOnDrawnPath(path,u){
  const target=clamp(u,0,1)*path.total,arr=path.lengths;
  let lo=1,hi=arr.length-1;
  while(lo<hi){
    const m=(lo+hi)>>1;
    if(arr[m]<target)lo=m+1;else hi=m;
  }
  const k=lo,a=path.points[k-1],b=path.points[k];
  const t=clamp((target-arr[k-1])/(arr[k]-arr[k-1]||1),0,1);
  return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
}

/** Bound parallel offsets around tight bends before they can turn inside out.
 * Ignore near-straight vertices, and use a lower percentile to resist single
 * residual touchscreen noise spikes. Units are logical design pixels. */
export function safeDrawnBandSpan(path){
  if(!path)return 120;
  const radii=[];
  const points=path.points;
  for(let i=1;i<points.length-1;i++){
    const a=points[i-1],b=points[i],c=points[i+1];
    const dx1=b.x-a.x,dy1=b.y-a.y,dx2=c.x-b.x,dy2=c.y-b.y;
    const l1=Math.hypot(dx1,dy1),l2=Math.hypot(dx2,dy2);
    if(l1<1||l2<1)continue;
    const cross=Math.abs(dx1*dy2-dy1*dx2);
    const dot=dx1*dx2+dy1*dy2;
    const theta=Math.atan2(cross,dot);
    if(theta<.025)continue;
    radii.push(Math.min(l1,l2)/(2*Math.sin(theta/2)));
  }
  if(!radii.length)return 360;
  radii.sort((a,b)=>a-b);
  // Keep the entire 7-ribbon pack narrower than the useful curvature radius.
  const r=radii[Math.floor((radii.length-1)*.25)];
  // Strongly undercut the minimum useful radius: opposite edges of a seven-
  // stripe bundle must not meet or reverse order at the inside of a U-turn.
  return Math.max(44,Math.min(360,r*.72));
}
