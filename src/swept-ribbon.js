// Winding-safe swept ribbons for centerlines whose tight curvature makes
// independently normal-offset boundaries overlap or fold over themselves.
// Every primitive is positively wound, so one nonzero Canvas fill is the
// geometric union: no per-segment alpha blending or antialiasing seams.
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});

// Convex hull prevents a crossed normal-offset quadrilateral from becoming
// a bow-tie. Only four vertices are considered in each short segment.
function convexHull(points){
  const sorted=[...points].sort((a,b)=>a.x-b.x||a.y-b.y);
  const lower=[],upper=[];
  for(const p of sorted){
    while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=1e-10)
      lower.pop();
    lower.push(p);
  }
  for(let i=sorted.length-1;i>=0;i--){
    const p=sorted[i];
    while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=1e-10)
      upper.pop();
    upper.push(p);
  }
  lower.pop();upper.pop();
  return lower.concat(upper);
}
function addPolygon(path,points){
  const hull=convexHull(points);
  if(hull.length<3)return;
  path.moveTo(hull[0].x,hull[0].y);
  for(let i=1;i<hull.length;i++)path.lineTo(hull[i].x,hull[i].y);
  path.closePath();
}
function angleBetween(a,b){
  const ax=a.positive.x-a.negative.x,ay=a.positive.y-a.negative.y;
  const bx=b.positive.x-b.negative.x,by=b.positive.y-b.negative.y;
  return Math.abs(Math.atan2(ax*by-ay*bx,ax*bx+ay*by));
}
function makeSection(station,sample){
  const {negative,positive}=sample(station);
  const center=midpoint(negative,positive);
  return {station,negative,positive,center,
    radius:distance(negative,positive)/2};
}

// A union of short swept cross-sections approximates the offset envelope
// without requiring an (often invalid) globally closed offset outline.
// Curvature-dependent round contact disks seal the inward normal fold.
// Smooth regions retain their exact two edge treatments: disks are used
// only where the local stroke radius threatens to exceed curvature radius.
export function sweptRibbonPath({start,end,pitch,sample,Path}){
  const path=new Path();
  if(!(end>start))return path;
  const step=Math.min(2.5,pitch/85);
  const count=Math.max(32,Math.ceil((end-start)/step));
  const sections=[];
  let previous=makeSection(start,sample);
  sections.push(previous);
  const subdivide=(a,b,depth)=>{
    if(depth<5&&b.station-a.station>.12&&angleBetween(a,b)>.14){
      const middle=makeSection((a.station+b.station)/2,sample);
      subdivide(a,middle,depth+1);
      subdivide(middle,b,depth+1);
    }else sections.push(b);
  };
  for(let i=1;i<=count;i++){
    const next=makeSection(start+(end-start)*i/count,sample);
    subdivide(previous,next,0);
    previous=next;
  }
  const round=new Set();
  for(let i=1;i<sections.length;i++){
    const a=sections[i-1],b=sections[i];
    addPolygon(path,[a.negative,b.negative,b.positive,a.positive]);
    const turn=angleBetween(a,b);
    const travel=distance(a.center,b.center);
    // The dimensionless product r*kappa predicts a normal-offset fold.
    // A small safety margin lets the caps overlap before the fold appears.
    if(Math.max(a.radius,b.radius)*turn/Math.max(travel,.01)>.55){
      round.add(i-1);round.add(i);
    }
  }
  for(const i of round){
    const s=sections[i];
    if(s.radius>1e-7){
      path.moveTo(s.center.x+s.radius,s.center.y);
      path.arc(s.center.x,s.center.y,s.radius,0,2*Math.PI);
      path.closePath();
    }
  }
  return path;
}
