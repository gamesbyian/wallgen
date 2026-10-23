// Browser-independent geometry extraction from an RGBA raster.
// No network calls, AI model, or image data is retained in wallpaper recipes.
import {normalizeDrawnPath, resamplePath, simplifyPath} from './drawn-path.js';
import {normalizeCompoundRegion} from './geometry-asset.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const average=a=>a.reduce((s,x)=>s+x,0)/Math.max(a.length,1);
const pixelIndex=(x,y,w)=>(y*w+x);
function backgroundColour(data,w,h){
  const channels=[[],[],[]],step=Math.max(1,Math.floor(Math.min(w,h)/80));
  const sample=(x,y)=>{const i=4*pixelIndex(x,y,w);if(data[i+3]<80)return;
    for(let c=0;c<3;c++)channels[c].push(data[i+c]);};
  for(let x=0;x<w;x+=step){sample(x,0);sample(x,h-1);}
  for(let y=0;y<h;y+=step){sample(0,y);sample(w-1,y);}
  return channels.map(a=>a.length?(a.sort((a,b)=>a-b)[Math.floor(a.length/2)]):255);
}
function components(mask,w,h,minArea){
  const seen=new Uint8Array(w*h),result=[],stack=[];
  for(let start=0;start<mask.length;start++){
    if(!mask[start]||seen[start])continue;
    seen[start]=1;stack.push(start);
    const members=[];let minX=w,maxX=0,minY=h,maxY=0;
    while(stack.length){
      const p=stack.pop(),x=p%w,y=(p/w)|0;
      members.push(p);minX=Math.min(minX,x);maxX=Math.max(maxX,x);
      minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      for(const n of [x>0?p-1:-1,x<w-1?p+1:-1,y>0?p-w:-1,y<h-1?p+w:-1]){
        if(n>=0&&mask[n]&&!seen[n]){seen[n]=1;stack.push(n);}
      }
    }
    if(members.length>=minArea)result.push({members,minX,maxX,minY,maxY,area:members.length});
  }
  return result.sort((a,b)=>b.area-a.area).slice(0,8);
}
// Trace exposed pixel edges, preserving concavities (unlike radial silhouettes).
function contour(component,w,h){
  const occupied=new Set(component.members),edges=new Map();
  function add(x1,y1,x2,y2){
    const key=y1*(w+1)+x1,next=y2*(w+1)+x2;
    if(!edges.has(key))edges.set(key,[]);
    edges.get(key).push(next);
  }
  for(const p of component.members){
    const x=p%w,y=(p/w)|0;
    if(y===0||!occupied.has(p-w))add(x,y,x+1,y);
    if(x===w-1||!occupied.has(p+1))add(x+1,y,x+1,y+1);
    if(y===h-1||!occupied.has(p+w))add(x+1,y+1,x,y+1);
    if(x===0||!occupied.has(p-1))add(x,y+1,x,y);
  }
  let best=[];
  // Multiple loops can occur when a region contains holes.
  while(edges.size){
    const start=edges.keys().next().value,loop=[],visited=new Set();
    let current=start;
    while(edges.has(current)&&!visited.has(current)){
      visited.add(current);
      loop.push([current%(w+1),Math.floor(current/(w+1))]);
      const next=edges.get(current).pop();
      if(!edges.get(current).length)edges.delete(current);
      current=next;
      if(current===start)break;
    }
    if(current===start&&loop.length>best.length)best=loop;
  }
  if(best.length<12)return [];
  // Downsample a large boundary BEFORE RDP to keep contour fitting responsive.
  const sampled=best.length>2500?
    resamplePixelPolyline([...best,best[0]],2500):[...best,best[0]];
  const simplified=simplifyPixels(sampled,Math.max(1.1,Math.min(w,h)*.005));
  return simplified.map(([x,y])=>[x/w,y/h]);
}
function segmentDistance(p,a,b){
  const vx=b[0]-a[0],vy=b[1]-a[1];
  const t=clamp(((p[0]-a[0])*vx+(p[1]-a[1])*vy)/(vx*vx+vy*vy||1),0,1);
  return Math.hypot(p[0]-a[0]-t*vx,p[1]-a[1]-t*vy);
}
function simplifyPixels(points,tolerance){
  const keep=new Set([0,points.length-1]),stack=[[0,points.length-1]];
  while(stack.length){
    const [a,b]=stack.pop();let error=tolerance,best=-1;
    for(let i=a+1;i<b;i++){const e=segmentDistance(points[i],points[a],points[b]);
      if(e>error){error=e;best=i;}}
    if(best!==-1){keep.add(best);stack.push([a,best],[best,b]);}
  }
  return [...keep].sort((a,b)=>a-b).map(i=>points[i]);
}
function resamplePixelPolyline(points,count){
  const lengths=[0];for(let i=1;i<points.length;i++)
    lengths.push(lengths.at(-1)+dist(points[i-1],points[i]));
  const total=lengths.at(-1),out=[];let j=1;
  for(let i=0;i<count;i++){
    const t=total*i/(count-1);
    while(j<lengths.length-1&&lengths[j]<t)j++;
    const ratio=clamp((t-lengths[j-1])/(lengths[j]-lengths[j-1]||1),0,1);
    out.push(points[j-1].map((v,c)=>v+(points[j][c]-v)*ratio));
  }
  return out;
}
function colourCentreline(component,w,h){
  if(component.maxX-component.minX<w*.14)return [];
  const buckets=Array.from({length:w},()=>[]);
  for(const i of component.members)buckets[i%w].push((i/w)|0);
  const line=[];
  for(let x=component.minX;x<=component.maxX;x++){
    if(buckets[x].length<3)continue;
    const ys=buckets[x].sort((a,b)=>a-b);
    // Midrange resists asymmetric noise better than mean on wide colour bands.
    line.push([x/w,(ys[Math.floor(ys.length*.10)]+ys[Math.floor(ys.length*.90)])/(2*h)]);
  }
  if(line.length<Math.max(12,w*.08))return [];
  // Light moving-average filtering cleans pixel staircases without global circle fitting.
  const filtered=line.map((p,i)=>{
    let sum=0,n=0;
    for(let j=Math.max(0,i-4);j<=Math.min(line.length-1,i+4);j++){sum+=line[j][1];n++;}
    return [p[0],sum/n];
  });
  return filtered.filter((_,i)=>i%3===0||i===filtered.length-1);
}
function dominantLines(data,w,h){
  const points=[];
  for(let y=2;y<h-2;y+=2)for(let x=2;x<w-2;x+=2){
    const lum=(a,b)=>{const i=4*(b*w+a);return (.2126*data[i]+.7152*data[i+1]+.0722*data[i+2])*(data[i+3]/255);};
    const gx=lum(x+1,y)-lum(x-1,y),gy=lum(x,y+1)-lum(x,y-1);
    if(Math.hypot(gx,gy)>52)points.push([x,y]);
  }
  if(points.length<24)return [];
  const diagonal=Math.ceil(Math.hypot(w,h)),rhoStep=3,rhoBins=Math.ceil(2*diagonal/rhoStep)+1;
  const bins=new Uint16Array(90*rhoBins);
  const trig=Array.from({length:90},(_,t)=>[Math.cos(t*Math.PI/90),Math.sin(t*Math.PI/90)]);
  for(const [x,y] of points)for(let t=0;t<90;t++){
    const rho=Math.round((x*trig[t][0]+y*trig[t][1]+diagonal)/rhoStep);
    bins[t*rhoBins+rho]++;
  }
  const peaks=[];
  for(let t=0;t<90;t++)for(let r=0;r<rhoBins;r++){
    const votes=bins[t*rhoBins+r];
    if(votes>=Math.max(18,Math.min(w,h)*.09))peaks.push({t,r,votes});
  }
  peaks.sort((a,b)=>b.votes-a.votes);
  const selected=[];
  for(const peak of peaks){
    const theta=peak.t*Math.PI/90,rho=peak.r*rhoStep-diagonal,
      nx=Math.cos(theta),ny=Math.sin(theta),vx=-ny,vy=nx;
    if(selected.some(p=>{const dt=Math.abs(p.theta-theta);
      return (Math.min(dt,Math.PI-dt)<7*Math.PI/180&&Math.abs(p.rho-rho)<12);}))continue;
    const projections=[];
    for(const [x,y] of points){
      if(Math.abs(x*nx+y*ny-rho)<2.8)projections.push(x*vx+y*vy);
    }
    projections.sort((a,b)=>a-b);
    if(projections.length<20)continue;
    const start=projections[Math.floor(projections.length*.03)],
      end=projections[Math.floor(projections.length*.97)];
    if(end-start<Math.max(35,Math.min(w,h)*.2))continue;
    const a=[(rho*nx+start*vx)/w,(rho*ny+start*vy)/h],
      b=[(rho*nx+end*vx)/w,(rho*ny+end*vy)/h];
    const angle=Math.round((Math.atan2(b[1]*h-a[1]*h,b[0]*w-a[0]*w)*180/Math.PI+180)%180);
    selected.push({theta,rho,candidate:{kind:'line',label:'Line '+angle+'°',points:[a,b],
      score:peak.votes,angle}});
    if(selected.length===5)break;
  }
  return selected.map(s=>s.candidate);
}
export function extractImagePathCandidates({data,width:w,height:h}){
  if(!data||!Number.isInteger(w)||!Number.isInteger(h)||w<12||h<12||
    data.length!==w*h*4||w*h>650000)throw new Error('Unsupported analysis image size');
  const bg=backgroundColour(data,w,h),silhouette=new Uint8Array(w*h),
    colourful=new Uint8Array(w*h);
  for(let p=0;p<w*h;p++){
    const i=p*4,r=data[i],g=data[i+1],b=data[i+2],alpha=data[i+3];
    if(alpha<64)continue;
    const deviation=Math.hypot(r-bg[0],g-bg[1],b-bg[2]);
    const max=Math.max(r,g,b),min=Math.min(r,g,b),saturation=(max-min)/Math.max(max,1);
    // Transparent background is considered outside the silhouette.
    if(deviation>53||alpha<230&&alpha>64)silhouette[p]=1;
    if(deviation>48&&saturation>.32&&max-min>60)colourful[p]=1;
  }
  const minArea=Math.max(30,Math.floor(w*h*.0015)),result=[];
  const colourRegions=components(colourful,w,h,minArea);
  for(const region of colourRegions.slice(0,2)){
    const p=colourCentreline(region,w,h);
    if(p.length>=12&&region.maxX-region.minX>w*.2)
      result.push({kind:'arc',label:'Colour-band centreline',points:p,
        score:region.area*1.3,closed:false});
  }
  const regions=components(silhouette,w,h,minArea);
  for(const region of regions.slice(0,3)){
    if(region.area>w*h*.72)continue;
    const path=contour(region,w,h);
    if(path.length>=4)result.push({kind:'contour',
      label:'Shape outline',points:path,score:region.area,closed:true});
  }
  result.push(...dominantLines(data,w,h));
  // Expose distinct candidates; don't bury the most useful line among duplicate contours.
  return result.slice(0,10).map((r,i)=>({...r,id:'candidate-'+i}));
}
// Map source-image coordinates into the same upright logical wallpaper plane
// shown in the picker. Aspect ratio is preserved and nothing is cropped.
export function imagePlacement(width,height,margin=.06){
  const scale=Math.min(600*(1-2*margin)/width,1300*(1-2*margin)/height);
  const drawWidth=width*scale,drawHeight=height*scale;
  return {x:(600-drawWidth)/2,y:(1300-drawHeight)/2,width:drawWidth,height:drawHeight};
}
export function pathToWallpaper(candidate,width,height,margin=.06){
  // Ordinary Path imports keep protective padding; full-frame image fitting
  // opts into zero inset without creating a second coordinate mapper.
  const box=imagePlacement(width,height,margin);
  const points=candidate.points.map(([x,y])=>[(box.x+x*box.width)/600,(box.y+y*box.height)/1300]);
  // Densify straight and closed paths before storage so no implicit smoothing
  // changes intentional contour corners in prepareDrawnPath.
  const pts=points.length<25?resamplePath(points,Math.min(96,Math.max(24,points.length*8))):points;
  const normalized=normalizeDrawnPath(pts);
  if(normalized.length<2)return null;
  const corners=[];
  if(candidate.kind==='contour'){
    for(let i=2;i<normalized.length-2;i++){
      const a=normalized[i-2],b=normalized[i],c=normalized[i+2];
      const ux=(b[0]-a[0])*600,uy=(b[1]-a[1])*1300,
        vx=(c[0]-b[0])*600,vy=(c[1]-b[1])*1300;
      const turn=Math.abs(Math.atan2(ux*vy-uy*vx,ux*vx+uy*vy));
      if(turn>.5&&corners.every(j=>i-j>2))corners.push(i);
    }
  }
  return {points:normalized,anchors:corners,corners};
}


// Shape extraction shares the source raster, background estimate, components
// and contour edge walk with path extraction, but keeps ALL closed boundary
// rings instead of retaining only the longest stroke per component.
// This adapter cannot return executable SVG, URLs, or source image bytes.
function shapeEdgeLoops(component,w,h){
  const occupied=new Set(component.members),edges=new Map();
  const add=(x1,y1,x2,y2)=>{
    const key=y1*(w+1)+x1,next=y2*(w+1)+x2;
    if(!edges.has(key))edges.set(key,[]);
    edges.get(key).push(next);
  };
  for(const p of component.members){
    const x=p%w,y=(p/w)|0;
    if(y===0||!occupied.has(p-w))add(x,y,x+1,y);
    if(x===w-1||!occupied.has(p+1))add(x+1,y,x+1,y+1);
    if(y===h-1||!occupied.has(p+w))add(x+1,y+1,x,y+1);
    if(x===0||!occupied.has(p-1))add(x,y+1,x,y);
  }
  const loops=[];
  let steps=0;
  while(edges.size&&steps<2*w*h*6){
    const start=edges.keys().next().value;
    const ring=[],visited=new Set();let at=start;
    while(edges.has(at)&&!visited.has(at)){
      visited.add(at);steps++;
      ring.push([at%(w+1),Math.floor(at/(w+1))]);
      const next=edges.get(at).pop();
      if(!edges.get(at).length)edges.delete(at);
      at=next;
      if(at===start)break;
    }
    if(at!==start||ring.length<4)continue;
    const closed=[...ring,ring[0]];
    const reduced=simplifyPixels(closed.length>2000?
      resamplePixelPolyline(closed,2000):closed,Math.max(.6,Math.min(w,h)*.0025));
    if(reduced.length>=4)loops.push(reduced.slice(0,-1));
  }
  return loops;
}
function ringArea(ring){
  return ring.reduce((sum,a,i)=>{
    const b=ring[(i+1)%ring.length];return sum+a[0]*b[1]-a[1]*b[0];
  },0)/2;
}
function silhouetteMask({data,width:w,height:h}){
  if(!data||!Number.isInteger(w)||!Number.isInteger(h)||w<12||h<12||
    data.length!==w*h*4||w*h>650000)throw Error('Unsupported analysis image size');
  const bg=backgroundColour(data,w,h);
  let transparent=0;
  for(let p=0;p<w*h;p++)if(data[4*p+3]<64)transparent++;
  // A transparent-background image declares its own silhouette. This also
  // captures white artwork on transparent pixels, which RGB contrast misses.
  const alphaFirst=transparent>Math.max(4,w*h*.003);
  const mask=new Uint8Array(w*h);
  for(let p=0;p<w*h;p++){
    const i=p*4,a=data[i+3];
    if(a<64)continue;
    const d=Math.hypot(data[i]-bg[0],data[i+1]-bg[1],data[i+2]-bg[2]);
    if(alphaFirst?a>=64:d>53)mask[p]=1;
  }
  return mask;
}
export function extractImageShapeCandidates(image){
  const {width:w,height:h}=image,mask=silhouetteMask(image);
  const regions=components(mask,w,h,Math.max(24,Math.floor(w*h*.001)));
  const parts=[];
  for(const c of regions){
    if(c.area>w*h*.92)continue;
    const loops=shapeEdgeLoops(c,w,h)
      .sort((a,b)=>Math.abs(ringArea(b))-Math.abs(ringArea(a)));
    if(!loops.length)continue;
    const outer=loops[0],holes=loops.slice(1).filter(r=>Math.abs(ringArea(r))>=4);
    parts.push({outer,holes});
  }
  if(!parts.length)return [];
  const result=[];
  // A composite candidate retains separate disconnected islands (e.g. two
  // dots of an i). Individual parts remain independently selectable.
  for(const included of [parts,...parts.map(part=>[part])]){
    if(result.length>=8)break;
    const components=included.map(part=>({outer:part.outer,holes:part.holes}));
    let geometry;
    try{geometry=normalizeCompoundRegion({
      type:'compound-region',space:'asset-local',viewBox:[0,0,w,h],
      components,fillRule:'evenodd'
    });}catch{continue;}
    const outer=included[0].outer;
    result.push({kind:'shape',closed:true,
      label:included.length>1?'All silhouettes ('+included.length+' parts)':
        'Filled silhouette'+(included[0].holes.length?' with holes':''),
      points:outer.map(([x,y])=>[x/w,y/h]),
      geometry,score:included.reduce((n,c)=>n+Math.abs(ringArea(c.outer)),0)});
  }
  // Do not duplicate the composite and individual item if one component.
  return parts.length===1?result.slice(0,1):result;
}


/**
 * Recover rough rainbow-region geometry from the SAME bounded RGBA importer.
 * Hue targets are supplied by the canonical palette owner, avoiding a second
 * seven-colour definition. Components and border background are shared with
 * path/silhouette extraction. Coordinates are source-image normalized.
 */
export function extractImageColourRegions({data,width:w,height:h},hueTargets){
  if(!data||!Number.isInteger(w)||!Number.isInteger(h)||w<12||h<12||
    w*h>650000||data.length!==w*h*4||
    !Array.isArray(hueTargets)||hueTargets.length!==7||
    hueTargets.some(h=>!Number.isFinite(h)))throw Error('Unsupported colour analysis image');
  const bg=backgroundColour(data,w,h);
  const backdrop=(.2126*bg[0]+.7152*bg[1]+.0722*bg[2])>128?'white':'black';
  const masks=hueTargets.map(()=>new Uint8Array(w*h));
  let coloured=0;
  for(let p=0;p<w*h;p++){
    const i=p*4,a=data[i+3],r=data[i],g=data[i+1],b=data[i+2];
    if(a<96)continue;
    const high=Math.max(r,g,b),low=Math.min(r,g,b),delta=high-low;
    if(high<60||delta<55||delta/Math.max(high,1)<.3||
      Math.hypot(r-bg[0],g-bg[1],b-bg[2])<52)continue;
    let hue=0;
    if(delta){
      if(high===r)hue=((g-b)/delta)%6;
      else if(high===g)hue=(b-r)/delta+2;
      else hue=(r-g)/delta+4;
      hue=(hue*60+360)%360;
    }
    let nearest=-1,distance=Infinity;
    for(let k=0;k<7;k++){
      const d=Math.abs(hue-hueTargets[k]);
      const diff=Math.min(d,360-d);
      if(diff<distance){distance=diff;nearest=k;}
    }
    // Broad enough for camera-tinted native art but do not falsely assign
    // monochrome/neutral graphics to the nearest rainbow pigment.
    if(distance>30)continue;
    masks[nearest][p]=1;coloured++;
  }
  const minArea=Math.max(16,Math.floor(w*h*.0008));
  const regions=[];
  for(let index=0;index<7;index++){
    const part=components(masks[index],w,h,minArea)[0];
    if(!part)continue;
    let sx=0,sy=0;
    for(const p of part.members){sx+=p%w;sy+=(p/w)|0;}
    const boxArea=(part.maxX-part.minX+1)*(part.maxY-part.minY+1);
    regions.push({index,area:part.area,
      cx:(sx/part.area+.5)/w,cy:(sy/part.area+.5)/h,
      fillRatio:part.area/Math.max(1,boxArea),
      bounds:[part.minX/w,part.minY/h,(part.maxX+1)/w,(part.maxY+1)/h]});
  }
  return {background:backdrop,backgroundRGB:bg,
    coverage:coloured/(w*h),regions};
}
