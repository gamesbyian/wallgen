// Euclidean inward offsets for simple polygons and even-odd collections of rings.
// Signed distances are evaluated analytically against the ORIGINAL edges;
// the zero contour of distance(x,boundary)-inset is reconstructed by marching
// squares. Unlike centroid scaling, this preserves a constant inset distance,
// concavities, round corner joins, topology changes, and disconnected loops.
// The grid resolution bounds geometric approximation error and is independent
// of preview/export bitmap dimensions. Open contours are valid at view bounds.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const sq=(x)=>x*x;

function ringsOf(input){
  if(!Array.isArray(input)||!input.length)return [];
  const source=Array.isArray(input[0])?input:[input];
  return source.map(ring=>{
    const clean=[];
    for(const p of ring){
      if(!finite(p))continue;
      const v={x:p.x,y:p.y};
      const last=clean[clean.length-1];
      if(!last||sq(v.x-last.x)+sq(v.y-last.y)>1e-16)clean.push(v);
    }
    if(clean.length>2){
      const a=clean[0],b=clean[clean.length-1];
      if(sq(a.x-b.x)+sq(a.y-b.y)<1e-16)clean.pop();
    }
    return clean;
  }).filter(r=>r.length>=3);
}
function edgesOf(rings){
  const edges=[];
  for(const ring of rings)for(let i=0;i<ring.length;i++){
    const a=ring[i],b=ring[(i+1)%ring.length];
    const dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy;
    if(len2<=1e-16)continue;
    edges.push({ax:a.x,ay:a.y,bx:b.x,by:b.y,dx,dy,len2,
      length:Math.sqrt(len2),minX:Math.min(a.x,b.x),maxX:Math.max(a.x,b.x),
      minY:Math.min(a.y,b.y),maxY:Math.max(a.y,b.y)});
  }
  return edges;
}
// Standard even-odd fill: multiple input rings may include holes.
export function pointInPolygon(x,y,polygon){
  const rings=ringsOf(polygon);
  let inside=false;
  for(const ring of rings)for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i],b=ring[j];
    if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
}
function signedDistance(x,y,edges){
  let d2=Infinity,inside=false;
  for(const e of edges){
    if((e.ay>y)!==(e.by>y)&&
      x<(e.bx-e.ax)*(y-e.ay)/(e.by-e.ay)+e.ax)inside=!inside;
    const t=clamp(((x-e.ax)*e.dx+(y-e.ay)*e.dy)/e.len2,0,1);
    const px=e.ax+t*e.dx,py=e.ay+t*e.dy;
    const distance=sq(x-px)+sq(y-py);
    if(distance<d2)d2=distance;
  }
  return (inside?1:-1)*Math.sqrt(d2);
}
// A characteristic *distance* rather than a percentage of vertex position.
// This stays meaningful for elongated rectangles, acute wedges, and polygons
// whose centroid lies outside their interior.
export function polygonInsetScale(polygon){
  const rings=ringsOf(polygon);
  const edges=edgesOf(rings);
  if(!edges.length)return 0;
  let area=0,perimeter=0;
  for(const ring of rings){
    let sum=0;
    for(let i=0;i<ring.length;i++){
      const a=ring[i],b=ring[(i+1)%ring.length];
      sum+=a.x*b.y-b.x*a.y;
    }
    area+=Math.abs(sum)/2;
  }
  for(const edge of edges)perimeter+=edge.length;
  return clamp(2*area/Math.max(perimeter,1e-9),0,100);
}
export function polygonInsetContours(polygon,inset,options={}){
  const rings=ringsOf(polygon);
  if(!rings.length||!Number.isFinite(inset)||inset<0)return [];
  if(inset===0)return rings.map(points=>({points,closed:true}));
  const edges=edgesOf(rings);
  if(!edges.length)return [];
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for(const e of edges){
    minX=Math.min(minX,e.minX);maxX=Math.max(maxX,e.maxX);
    minY=Math.min(minY,e.minY);maxY=Math.max(maxY,e.maxY);
  }
  const clip=options.bounds;
  // Rendering's camera bounds are logical coordinates. The inset curve
  // outside the visible frame can be safely omitted, but extra coverage
  // around it prevents unwanted cropped endpoints or dash discontinuities.
  const padding=inset+Math.max(12,options.padding??16);
  if(clip){
    minX=Math.max(minX-padding,clip.left-padding);
    maxX=Math.min(maxX+padding,clip.right+padding);
    minY=Math.max(minY-padding,clip.top-padding);
    maxY=Math.min(maxY+padding,clip.bottom+padding);
  }else{
    minX-=padding;maxX+=padding;minY-=padding;maxY+=padding;
  }
  if(maxX<=minX||maxY<=minY)return [];
  // Logical resolution remains identical for preview and export. The cap
  // prevents a single oversized radial shape from allocating a huge grid.
  let h=clamp(options.resolution??Math.max(1.15,inset/9),.45,6);
  h=Math.max(h,Math.sqrt((maxX-minX)*(maxY-minY)/150000));
  const x0=Math.floor(minX/h)*h-h*.127;
  const y0=Math.floor(minY/h)*h-h*.293;
  const nx=Math.max(1,Math.ceil((maxX-x0)/h));
  const ny=Math.max(1,Math.ceil((maxY-y0)/h));
  // Only cells near polygon edges can contain an inset level set.
  // A capsule around each ORIGINAL edge marks those cells. This avoids
  // evaluating a dense signed-distance field throughout large solid regions.
  const candidates=new Set();
  const radius=inset+3*h;
  function addSpan(j,left,right){
    if(right<x0||left>x0+nx*h)return;
    const lo=clamp(Math.floor((left-x0)/h)-1,0,nx-1);
    const hi=clamp(Math.ceil((right-x0)/h)+1,0,nx-1);
    for(let i=lo;i<=hi;i++)candidates.add(j*nx+i);
  }
  for(const e of edges){
    if(e.maxX+radius<x0||e.minX-radius>x0+nx*h||
       e.maxY+radius<y0||e.minY-radius>y0+ny*h)continue;
    const lo=clamp(Math.floor((e.minY-radius-y0)/h)-1,0,ny-1);
    const hi=clamp(Math.ceil((e.maxY+radius-y0)/h)+1,0,ny-1);
    for(let j=lo;j<=hi;j++){
      const y=y0+(j+.5)*h;
      // Project the horizontal scanline through an inflated segment.
      if(Math.abs(e.dy)>1e-9){
        const cross=e.ax+(y-e.ay)*e.dx/e.dy;
        const spread=radius*e.length/Math.abs(e.dy);
        addSpan(j,Math.max(e.minX-radius,cross-spread),
          Math.min(e.maxX+radius,cross+spread));
      }else if(Math.abs(y-e.ay)<=radius){
        addSpan(j,e.minX-radius,e.maxX+radius);
      }
      // Rounded segment endcaps complete the Euclidean distance capsule.
      for(const p of [{x:e.ax,y:e.ay},{x:e.bx,y:e.by}]){
        const dy=y-p.y;
        if(Math.abs(dy)>radius)continue;
        const reach=Math.sqrt(Math.max(0,radius*radius-dy*dy));
        addSpan(j,p.x-reach,p.x+reach);
      }
    }
  }
  const values=new Map(),adjacency=new Map(),segments=[];
  const value=(i,j)=>{
    const key=j*(nx+1)+i;
    let v=values.get(key);
    if(v===undefined){
      v=signedDistance(x0+i*h,y0+j*h,edges);
      values.set(key,v);
    }
    return v;
  };
  const node=(i,j,edge)=>edge===0?j*nx+i:
    edge===1?nx*ny+j*(nx+1)+i+1:
    edge===2?(j+1)*nx+i:nx*ny+j*(nx+1)+i;
  function record(a,b){
    const k=segments.length;
    segments.push({a,b});
    for(const n of [a,b]){
      if(!adjacency.has(n.key))adjacency.set(n.key,[]);
      adjacency.get(n.key).push(k);
    }
  }
  const threshold=inset+1e-10;
  for(const index of [...candidates].sort((a,b)=>a-b)){
    const i=index%nx,j=Math.floor(index/nx);
    const v=[value(i,j),value(i+1,j),value(i+1,j+1),value(i,j+1)];
    const active=v.map(x=>x>=threshold);
    const pairs=[[0,1],[1,2],[2,3],[3,0]];
    const intersects=[];
    const coords=[[x0+i*h,y0+j*h],[x0+(i+1)*h,y0+j*h],
      [x0+(i+1)*h,y0+(j+1)*h],[x0+i*h,y0+(j+1)*h]];
    for(let edge=0;edge<4;edge++){
      const [a,b]=pairs[edge];
      if(active[a]===active[b])continue;
      const t=clamp((threshold-v[a])/(v[b]-v[a]),0,1);
      intersects.push({edge,key:node(i,j,edge),
        x:coords[a][0]+(coords[b][0]-coords[a][0])*t,
        y:coords[a][1]+(coords[b][1]-coords[a][1])*t});
    }
    if(intersects.length===2){
      record(intersects[0],intersects[1]);
    }else if(intersects.length===4){
      // Ambiguous saddle: the true signed distance at cell centre selects
      // the same topology as the continuous polygon erosion.
      const center=signedDistance(x0+(i+.5)*h,y0+(j+.5)*h,edges)>=threshold;
      const byEdge=new Map(intersects.map(p=>[p.edge,p]));
      const pairing=center===active[0]?[[0,1],[2,3]]:[[0,3],[1,2]];
      for(const [a,b] of pairing)record(byEdge.get(a),byEdge.get(b));
    }
  }
  const used=new Uint8Array(segments.length);
  const contours=[];
  for(let initial=0;initial<segments.length;initial++){
    if(used[initial])continue;
    const first=segments[initial];
    const aLinks=adjacency.get(first.a.key)||[];
    const bLinks=adjacency.get(first.b.key)||[];
    let start=aLinks.length===1?first.a:bLinks.length===1?first.b:first.a;
    let cursor=start.key,current=initial,closed=false;
    const points=[{x:start.x,y:start.y}];
    while(current!==undefined&&!used[current]){
      used[current]=1;
      const seg=segments[current];
      const next=seg.a.key===cursor?seg.b:seg.a;
      points.push({x:next.x,y:next.y});
      cursor=next.key;
      if(cursor===start.key){closed=true;points.pop();break;}
      current=(adjacency.get(cursor)||[]).find(k=>!used[k]);
    }
    if(points.length>=(closed?3:2))contours.push({points,closed});
  }
  return contours;
}
