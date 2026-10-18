// Resolution-independent geometry producers for ROYGBIV's unified scene.
// All generated shapes are ordinary closed regions. Colours refer to one of
// seven semantic palette slots, independent of the number of visible objects.
export const STRUCTURES=Object.freeze(['paths','radial','regions']);
export const RADIAL_MODES=Object.freeze(['sunburst','starburst','pinwheel','spokes','concentric']);
export const REGION_MODES=Object.freeze(['voronoi','organic','facets','blocks','nested']);
export const DIVIDER_MODES=Object.freeze(['none','background','black','white']);
const W=600,H=1300,TAU=2*Math.PI;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const lerp=(a,b,t)=>a+(b-a)*t;
const point=(x,y)=>({x,y});
const hexHash=(n)=>{let x=n|0;x=Math.imul(x^(x>>>16),0x7feb352d);x=Math.imul(x^(x>>>15),0x846ca68b);return ((x^(x>>>16))>>>0)/4294967296;};
const hashString=(s)=>{let n=2166136261;for(const c of String(s)){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;};
const stream=(seed)=>{let n=hashString(seed);return ()=>hexHash(n++);};
const region=(vertices,index)=>({kind:'region',vertices,colorIndex:index%7});
const perimeter=(cx,cy,rx,ry,sides,rotation=0)=>{
  const count=sides>=3?sides:144;
  return Array.from({length:count},(_,i)=>{
    const a=TAU*i/count+rotation-Math.PI/2;
    return point(cx+Math.cos(a)*rx,cy+Math.sin(a)*ry);
  });
};
const center=(r)=>point(W*(r.fieldCenterX/100),H*(r.fieldCenterY/100));

// A radial wedge has independently sampled concentric edges. This produces
// correct pinwheels and shared boundaries without crossing or raster seams.
// Coverage below 100 deliberately exposes the black/white negative space.
function radialWedges(r){
  const result=[],origin=center(r),count=r.rayCount;
  const outer=4200,inner=r.rayCore*2.8;
  const coverage=clamp(r.rayCoverage/100,0.03,1);
  const twist=r.rayTwist*Math.PI/180;
  const base=r.rayRotation*Math.PI/180;
  const sweep=TAU/count;
  for(let i=0;i<count;i++){
    const sequence=[...Array.from({length:33},(_,j)=>lerp(inner,outer,j/32))];
    const vertices=[];
    const angle=(radius,side)=>{
      // Normalize deformation to the visible wallpaper, rather than the
      // intentionally enormous overscan radius, so the shape is perceptible.
      const u=clamp(radius/Math.hypot(W,H),0,1);
      const spiral=(r.radialMode==='pinwheel'?1:r.radialMode==='starburst'?.28:0)*twist*u;
      const jag=r.radialMode==='starburst'?Math.sin(u*Math.PI*3+i*2.39996)*sweep*.10*u:0;
      return base+(i+.5+side*coverage*.5)*sweep+spiral+jag;
    };
    for(const radius of sequence){
      const a=angle(radius,-1);
      vertices.push(point(origin.x+radius*Math.cos(a),origin.y+radius*Math.sin(a)));
    }
    for(let j=sequence.length-1;j>=0;j--){
      const radius=sequence[j],a=angle(radius,1);
      vertices.push(point(origin.x+radius*Math.cos(a),origin.y+radius*Math.sin(a)));
    }
    result.push(region(vertices,i));
  }
  return result;
}
function nested(r,radial=false){
  const count=radial?r.rayCount:r.regionCount;
  const p=center(r),sides=radial?0:r.regionSides;
  const rotation=(radial?r.rayRotation:0)*Math.PI/180;
  const result=[];
  // Largest first so each progressively smaller shape reveals its outer ring.
  for(let i=0;i<count;i++){
    const size=(count-i)/(count+.3);
    // The outer silhouette should meet the screen edge, so all seven
    // nested pigments remain visible at the default centre.
    const radius=780;
    result.push(region(perimeter(p.x,p.y,radius*size,radius*size,sides,rotation),
      radial?i:i));
  }
  return result;
}
function spokes(r){
  // Parallel-sided radial strips preserve background between seven-colour
  // rays, unlike the tessellating wedges of the sunburst.
  const p=center(r),result=[];
  for(let i=0;i<r.rayCount;i++){
    const a=r.rayRotation*Math.PI/180+(i+.5)*TAU/r.rayCount;
    const vx=Math.cos(a),vy=Math.sin(a),nx=-vy,ny=vx;
    const start=r.rayCore*2.8,end=4000;
    const width=3+(r.rayCoverage/100)*Math.max(12,95*7/r.rayCount);
    const b=width/2;
    result.push(region([
      point(p.x+vx*start+nx*b*.35,p.y+vy*start+ny*b*.35),
      point(p.x+vx*end+nx*b,p.y+vy*end+ny*b),
      point(p.x+vx*end-nx*b,p.y+vy*end-ny*b),
      point(p.x+vx*start-nx*b*.35,p.y+vy*start-ny*b*.35),
    ],i));
  }
  return result;
}
function clipHalfPlane(poly,mx,my,dx,dy){
  if(!poly.length)return [];
  const signed=p=>(p.x-mx)*dx+(p.y-my)*dy;
  const result=[];
  for(let j=0;j<poly.length;j++){
    const a=poly[j],b=poly[(j+1)%poly.length];
    const va=signed(a),vb=signed(b),ina=va<=1e-7,inb=vb<=1e-7;
    if(ina)result.push(a);
    if(ina!==inb){
      const t=clamp(va/(va-vb),0,1);
      result.push(point(lerp(a.x,b.x,t),lerp(a.y,b.y,t)));
    }
  }
  return result;
}
function voronoi(r,organic=false){
  const random=stream(r.seed+':cells'),n=r.regionCount;
  // Grid-centred seeds keep seven hues spread across the frame.
  const cols=Math.max(2,Math.round(Math.sqrt(n*W/H)));
  const rows=Math.ceil(n/cols),sites=[];
  for(let i=0;i<n;i++){
    const col=i%cols,row=Math.floor(i/cols);
    const jitter=r.regionJitter/100;
    sites.push(point(
      W*(col+.5+(random()-.5)*.85*jitter)/cols,
      H*(row+.5+(random()-.5)*.85*jitter)/rows));
  }
  const domain=[point(-1400,-2000),point(2000,-2000),point(2000,3300),point(-1400,3300)];
  const distort=r.regionJitter/100*(organic?72:0);
  // Shared coordinate warp keeps adjacent cells edge-consistent, including
  // their tessellated intermediate samples.
  const warp=p=>point(
    p.x+distort*(Math.sin(p.y*.0068+1.1)*.65+Math.sin(p.x*.011+p.y*.003)*.35),
    p.y+distort*(Math.cos(p.x*.009+2.1)*.60+Math.sin(p.y*.013-p.x*.004)*.4));
  const shapes=[];
  for(let i=0;i<n;i++){
    let poly=domain;
    for(let j=0;j<n&&poly.length;j++)if(i!==j){
      const a=sites[i],b=sites[j];
      poly=clipHalfPlane(poly,(a.x+b.x)/2,(a.y+b.y)/2,b.x-a.x,b.y-a.y);
    }
    if(poly.length<3)continue;
    if(organic){
      const curved=[];
      for(let j=0;j<poly.length;j++){
        const a=poly[j],b=poly[(j+1)%poly.length];
        const count=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/24));
        for(let k=0;k<count;k++)curved.push(warp(point(lerp(a.x,b.x,k/count),lerp(a.y,b.y,k/count))));
      }
      poly=curved;
    }
    shapes.push(region(poly,i));
  }
  return shapes;
}
function facets(r){
  const random=stream(r.seed+':facets');
  const nx=Math.max(2,Math.round(Math.sqrt(r.regionCount*W/H)));
  const ny=Math.max(3,Math.ceil(r.regionCount/nx));
  const x0=-90,y0=-190,w=780,h=1680;
  const grid=Array.from({length:ny+1},(_,row)=>Array.from({length:nx+1},(_,col)=>{
    const jitter=r.regionJitter/100*.40;
    return point(x0+(col+(random()-.5)*jitter)*(w/nx),
      y0+(row+(random()-.5)*jitter)*(h/ny));
  }));
  const result=[];let index=0;
  for(let row=0;row<ny;row++)for(let col=0;col<nx;col++){
    const a=grid[row][col],b=grid[row][col+1],c=grid[row+1][col],d=grid[row+1][col+1];
    result.push(region([a,b,d],index++),region([a,d,c],index++));
  }
  return result;
}
function blocks(r){
  const random=stream(r.seed+':blocks');
  const rects=[{x:-45,y:-100,w:690,h:1500}];
  while(rects.length<r.regionCount){
    const eligible=rects.map((v,i)=>({v,i,area:v.w*v.h}))
      .filter(x=>x.v.w>60&&x.v.h>60).sort((a,b)=>b.area-a.area);
    if(!eligible.length)break;
    const chosen=eligible[Math.floor(random()*Math.min(eligible.length,4))];
    const {v,i}=chosen;
    const vertical=v.w/v.h>(W/H)*(0.65+random()*.75);
    const fraction=.5+(random()-.5)*.68*(r.regionJitter/100);
    const a=vertical?{...v,w:v.w*fraction}:{...v,h:v.h*fraction};
    const b=vertical?{...v,x:v.x+a.w,w:v.w-a.w}:{...v,y:v.y+a.h,h:v.h-a.h};
    rects.splice(i,1,a,b);
  }
  return rects.map((v,i)=>region([
    point(v.x,v.y),point(v.x+v.w,v.y),
    point(v.x+v.w,v.y+v.h),point(v.x,v.y+v.h)],i));
}
export function buildCompositionObjects(recipe,colors,stripes,bundleOffsets){
  if(recipe.structure==='paths')
    return bundleOffsets.map((offset,i)=>({kind:'path-group',id:'bundle-'+i,offset,stripes}));
  let shapes=[];
  if(recipe.structure==='radial'){
    shapes=recipe.radialMode==='concentric'?nested(recipe,true):
      recipe.radialMode==='spokes'?spokes(recipe):radialWedges(recipe);
  }else{
    switch(recipe.regionMode){
      case 'organic':shapes=voronoi(recipe,true);break;
      case 'facets':shapes=facets(recipe);break;
      case 'blocks':shapes=blocks(recipe);break;
      case 'nested':shapes=nested(recipe,false);break;
      default:shapes=voronoi(recipe,false);
    }
  }
  return shapes.map((shape,i)=>({...shape,id:'region-'+i,
    color:colors[shape.colorIndex]}));
}
