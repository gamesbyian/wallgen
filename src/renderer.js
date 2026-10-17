import { DESIGN_WIDTH, DESIGN_HEIGHT, resolveScene, rng } from './model.js';
import { samplePath, ribbonEdge, widthAt, noise1D } from './path-geometry.js';

const TAU = Math.PI * 2;
const geometryAt=(x,stripe,extent)=>samplePath(stripe,x,extent).y;
const edgePoint=(x,stripe,extent,side,scene)=>
  ribbonEdge(stripe,x,extent,side,scene?textureHeight(scene,stripe,x,side):0);
const edgeAt=(x,stripe,extent,side,scene)=>edgePoint(x,stripe,extent,side,scene).y;
const spatialGeometry=stripe=>['hairpin','loops'].includes(stripe.sharedGeometry??stripe.geometry);
// A procedural height field makes the actual texture material affect ribbon edges.
// Separate low/high-frequency noise bands evoke fibres, pores, grain and stone.
// This modifies geometry rather than offsetting the colour mask after painting.
const RELIEF_PROFILES={
  none:[0,16,.4], grain:[.50,7,.68], watercolor:[.45,40,.15],
  construction:[.60,13,.53], handmade:[.80,16,.58], corrugated:[.68,19,.82],
  linen:[.52,12,.76], canvas:[.60,17,.78], denim:[.64,10,.84],
  knit:[.72,17,.67], felt:[.90,9,.72], corduroy:[.78,13,.90],
  concrete:[.76,22,.68], stucco:[1,11,.83], stone:[.89,36,.44],
  drywall:[.32,24,.38], 'wood-grain':[.66,30,.91], 'vinyl-sheet':[.23,42,.16],
  foil:[.50,13,.85], 'glossy-paper':[.15,42,.14], adobe:[.95,24,.71],
};
// Material-specific fractal height, evaluated at each *edge* in stripe-local space.
// When all chosen textures are background-only / smooth, a seeded fine-paper grain
// gives this control a usable baseline rather than silently doing nothing.
export function textureHeight(scene,stripe,x,side=0){
  const strength=scene.textureDisplacement/100;
  if(strength<=0)return 0;
  const actual=scene.textureLayers.filter(layer=>layer.coverage!=='background');
  const layers=actual.length?actual:[{
    material:'grain',strength:100,scale:50,heightCos:1,heightSin:0,
    heightSeed:scene.reliefFallbackSeed ?? 17413,
  }];
  let sum=0,total=0;
  const y=stripe.center+side*stripe.width*.5;
  for(const layer of layers){
    const profile=RELIEF_PROFILES[layer.material]||RELIEF_PROFILES.grain;
    const weight=(layer.strength/100)*(.45+.55*profile[0]);
    if(weight<=0)continue;
    const along=x*layer.heightCos+y*layer.heightSin;
    const across=-x*layer.heightSin+y*layer.heightCos;
    const period=Math.max(4,profile[1]*(.55+layer.scale/100*1.6));
    const seed=layer.heightSeed;
    const broad=noise1D((along+x*.12)/(period*3.5),seed);
    const mid=noise1D((along*.7+across*.32)/period,seed+19);
    const fine=noise1D((along*.48+across*.75)/(period*.49),seed+53);
    const height=(broad*.48+mid*.39+fine*.13)*1.65;
    sum+=height*weight;
    total+=weight;
  }
  if(total<=0)return 0;
  // The earlier ~1-3 logical-pixel change was invisible on phone previews.
  // Increase the *bounded* edge relief without permitting the two edges to cross.
  const cap=Math.min(28,stripe.width*.34)*Math.pow(strength,.85);
  const field=sum/total;
  return Math.max(-cap,Math.min(cap,field*cap));
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
  const pitch=Math.max(type==='dotted'?12:26,
    stripe.width*(type==='dotted'?2.15:5.3)*spacingFactor*dotFactor);
  const marks=[];
  const first=Math.max(0,Math.floor((start+extent)/pitch)-1);
  const last=Math.ceil((end+extent)/pitch)+1;
  for(let i=first;i<=last;i++){
    const origin=-extent+i*pitch;
    if(type==='dotted'){
      const x=origin+pitch*.5,radius=Math.min(stripe.width*.43*dotFactor,pitch*.42);
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
  const hit=(t,at,other,low,high)=>t>=0&&t<=1&&other>=low-1e-7&&other<=high+1e-7;
  for(const [side,value,field,other,length] of [
    ['left',0,'x','y',DESIGN_HEIGHT],['right',DESIGN_WIDTH,'x','y',DESIGN_HEIGHT],
    ['top',0,'y','x',DESIGN_WIDTH],['bottom',DESIGN_HEIGHT,'y','x',DESIGN_WIDTH],
  ]){
    if(contacts[side]||Math.abs(q[field]-p[field])<1e-9)continue;
    const t=(value-p[field])/(q[field]-p[field]);
    if(hit(t,null,p[other]+t*(q[other]-p[other]),0,length))contacts[side]=true;
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
  // A returning path legitimately has both ends at the same frame edge.
  // Paired contacts for a hairpin are intentional rather than a lone crop.
  if(spatialGeometry(stripe) && (stripe.sharedGeometry??stripe.geometry)==='hairpin')
    return {contacts:stripeFrameContacts(scene,stripe),balanced:true,hidden:false};
  const contacts=stripeFrameContacts(scene,stripe);
  const balanced=(contacts.left===contacts.right && contacts.top===contacts.bottom);
  if(balanced)return {contacts,balanced:true,hidden:false};
  // Account for borders and glow so even their outermost pixels stay inset.
  const margin=24+scene.glow*.30+scene.gap*.08;
  const inside=x=>endpoints(scene,stripe,x).every(p=>
    p.x>=margin && p.x<=DESIGN_WIDTH-margin &&
    p.y>=margin && p.y<=DESIGN_HEIGHT-margin);
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
    const inside=at.x-radius>=0&&at.x+radius<=DESIGN_WIDTH&&
      at.y-radius>=0&&at.y+radius<=DESIGN_HEIGHT;
    const outside=at.x+radius<0||at.x-radius>DESIGN_WIDTH||
      at.y+radius<0||at.y-radius>DESIGN_HEIGHT;
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
  const inside=minX>=0&&maxX<=DESIGN_WIDTH&&minY>=0&&maxY<=DESIGN_HEIGHT;
  const outside=maxX<0||minX>DESIGN_WIDTH||maxY<0||minY>DESIGN_HEIGHT;
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
function drawBrushWear(ctx,stripe,extent,scene){
  if(!scene.brushRoughness)return;
  const random=rng(scene.seed+':brush:'+stripe.index);
  const strength=scene.brushRoughness/100;
  const n=Math.ceil(18+strength*300);
  const start=stripe.segmentStart??-extent,end=stripe.segmentEnd??extent;
  ctx.save();
  // Wear belongs to the painted mark, never to the adjacent background.
  // In particular, dotted ribbons must not grow free-floating scratches.
  ctx.clip(stripePath(stripe,extent,scene));
  ctx.strokeStyle=scene.background==='white'?'#fff':'#000';
  ctx.lineCap='round';
  for(let i=0;i<n;i++){
    const t=start+(end-start)*random();
    const p=samplePath(stripe,t,extent);
    const half=widthAt(stripe,t,extent)*.38;
    if(half<.4)continue;
    const offset=(random()*2-1)*half;
    const x=p.x+p.nx*offset,y=p.y+p.ny*offset;
    const length=.5+random()*Math.min(13,stripe.width*.6);
    ctx.globalAlpha=(.04+.62*random())*strength;
    ctx.lineWidth=Math.max(.3,Math.min(1.8,stripe.width*.05)*(0.2+random()));
    ctx.beginPath();ctx.moveTo(x,y);
    ctx.lineTo(x+p.tx*length,y+p.ty*length);ctx.stroke();
  }
  ctx.restore();
}
function drawConstruction(ctx,stripe,extent,scene){
  const kind=scene.construction;
  const ribbon=stripePath(stripe,extent,scene);
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
    for(let x=start+step;x<end-step;x+=step){
      const flip=Math.floor((x-start)/step)%2===0?1:-1;
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
  if(motif==='solid'){ctx.fill(stripePath(stripe,extent,scene));return;}
  const random=rng(scene.seed+':motifs:'+stripe.index);
  const step=Math.max(2.5,stripe.width*.42*stripe.patternScale);
  const across=Math.max(1,Math.ceil(stripe.width/(step*.83)));
  const stroke=Math.min(step*.19,Math.max(.55,stripe.width*.14));
  ctx.save();ctx.lineWidth=stroke;ctx.lineCap='round';ctx.lineJoin='round';
  const spacing=motif==='dashes'?step*1.9:motif==='chevrons'?step*1.5:step;
  for(let x=-extent+spacing;x<extent-spacing;x+=spacing){
    for(let j=-across;j<=across;j++){
      if(motif==='checker' && ((Math.round((x+extent)/spacing)+j)&1)!==0)continue;
      const variation=motifVariation(scene,stripe,random);
      const offset=j*step*.82;
      const jitter=scene.intensity*step*.10;
      const xx=x+(Math.abs(j)%2)*spacing*.35+(random()-.5)*jitter;
      const yy=geometryAt(xx,stripe,extent)+offset+(random()-.5)*jitter+textureHeight(scene,stripe,xx,0)*.3;
      const radius=step*.28*variation.scale;
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
  }
  ctx.restore();
}

function textureTile(material,seed,size) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d');
  const rand=rng(`${seed}:material:${material}`);
  const random=(a,b)=>a+(b-a)*rand();
  const specks=(count,min,max,alpha=.22) => {
    for(let i=0;i<count;i++){
      const light=rand()>.47;
      ctx.fillStyle=`rgba(${light?'255,255,255':'0,0,0'},${random(alpha*.12,alpha).toFixed(3)})`;
      const radius=random(min,max);
      ctx.beginPath();ctx.arc(rand()*size,rand()*size,radius,0,TAU);ctx.fill();
    }
  };
  const lines=(gap,colour,linewidth,angle=0)=>{
    ctx.save();ctx.translate(size/2,size/2);ctx.rotate(angle);ctx.strokeStyle=colour;ctx.lineWidth=linewidth;
    for(let x=-size*2;x<size*2;x+=gap){ctx.beginPath();ctx.moveTo(x,-size*2);ctx.lineTo(x,size*2);ctx.stroke();}
    ctx.restore();
  };
  const patches=(count,min,max,alpha=.12)=>{
    for(let i=0;i<count;i++){
      const x=rand()*size,y=rand()*size,r=random(min,max);
      const grad=ctx.createRadialGradient(x,y,0,x,y,r);
      const white=rand()>.5;
      grad.addColorStop(0,`rgba(${white?'255,255,255':'0,0,0'},${random(alpha*.25,alpha).toFixed(3)})`);
      grad.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=grad;ctx.fillRect(x-r,y-r,r*2,r*2);
    }
  };
  const fibres=(count,length=8,alpha=.22)=>{
    for(let i=0;i<count;i++){
      const x=rand()*size,y=rand()*size,a=rand()*Math.PI*2,l=random(1,length);
      ctx.strokeStyle=`rgba(${rand()>.5?'255,255,255':'0,0,0'},${random(alpha*.22,alpha).toFixed(3)})`;
      ctx.lineWidth=random(.25,1);
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);ctx.stroke();
    }
  };
  switch(material){
    case 'grain': specks(size*9,.25,1.7,.43);break;
    case 'watercolor':
      for(let i=0;i<48;i++){
        const x=rand()*size,y=rand()*size,rad=random(size*.04,size*.27);
        const gradient=ctx.createRadialGradient(x,y,0,x,y,rad);
        const light=rand()>.5;
        gradient.addColorStop(0,`rgba(${light?'255,255,255':'0,0,0'},.18)`);
        gradient.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=gradient;ctx.fillRect(x-rad,y-rad,rad*2,rad*2);
      }
      specks(size*7,.2,.9,.18);break;
    case 'construction':
      specks(size*10,.15,1.1,.28);
      for(let i=0;i<size*.7;i++){
        ctx.strokeStyle=`rgba(255,255,255,${random(.07,.22)})`;
        ctx.lineWidth=random(.25,.65);const x=rand()*size,y=rand()*size;
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+random(1,5),y+random(-1.6,1.6));ctx.stroke();
      }
      break;
    case 'handmade':
      specks(size*5,.2,1.6,.26);
      for(let i=0;i<size*.9;i++){
        const x=rand()*size,y=rand()*size;
        ctx.strokeStyle=`rgba(${rand()>.5?'255,255,255':'0,0,0'},${random(.06,.3)})`;
        ctx.lineWidth=random(.3,1.1);
        ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+random(2,7),y+random(-3,3),x+random(5,17),y+random(-6,6));ctx.stroke();
      }
      break;
    case 'linen':
      lines(5,'rgba(0,0,0,.17)',1.3);lines(6,'rgba(255,255,255,.18)',1.3,Math.PI/2);
      specks(size*2,.2,.8,.22);break;
    case 'canvas':
      lines(9,'rgba(0,0,0,.26)',3);lines(9,'rgba(255,255,255,.19)',2.5,Math.PI/2);
      specks(size*2,.3,.9,.17);break;
    case 'denim':
      lines(5,'rgba(0,0,0,.29)',1.7,-Math.PI/4);
      lines(10,'rgba(255,255,255,.18)',1,Math.PI/4);
      specks(size*6,.3,.8,.19);break;
    case 'knit':
      ctx.lineWidth=1.9;
      for(let y=0;y<size+12;y+=12)for(let x=0;x<size+12;x+=12){
        ctx.strokeStyle='rgba(0,0,0,.30)';
        ctx.beginPath();ctx.moveTo(x-4,y-4);ctx.quadraticCurveTo(x-6,y+3,x,y+6);ctx.quadraticCurveTo(x+6,y+3,x+4,y-4);ctx.stroke();
        ctx.strokeStyle='rgba(255,255,255,.14)';ctx.beginPath();ctx.moveTo(x-2,y-3);ctx.quadraticCurveTo(x,y+1,x+2,y-3);ctx.stroke();
      }break;
    case 'felt':
      specks(size*13,.2,1.1,.22);
      for(let i=0;i<size*3;i++){
        const x=rand()*size,y=rand()*size,a=rand()*TAU,l=random(1,5);
        ctx.strokeStyle=`rgba(${rand()>.5?'255,255,255':'0,0,0'},${random(.12,.3)})`;
        ctx.lineWidth=random(.3,.7);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);ctx.stroke();
      }break;
    case 'corrugated':
      lines(15,'rgba(0,0,0,.33)',5.5);lines(15,'rgba(255,255,255,.18)',2.5);
      specks(size*3,.3,1.2,.16);break;
    case 'concrete':
      patches(33,size*.06,size*.23,.18);specks(size*11,.2,1.6,.25);
      fibres(Math.floor(size*.35),14,.09);break;
    case 'stucco':
      specks(size*15,.5,2.4,.36);patches(14,size*.04,size*.13,.13);break;
    case 'stone':
      patches(41,size*.08,size*.28,.22);specks(size*4,.3,1.5,.13);
      ctx.lineWidth=.8;
      for(let i=0;i<Math.floor(size*.13);i++){
        const x=rand()*size,y=rand()*size;
        ctx.strokeStyle=`rgba(0,0,0,${random(.06,.19).toFixed(3)})`;
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+random(-16,16),y+random(-20,20));ctx.stroke();
      }break;
    case 'drywall':
      specks(size*5,.1,.9,.15);patches(9,size*.03,size*.15,.07);
      lines(23,'rgba(255,255,255,.05)',.65,Math.PI/4);break;
    case 'adobe':
      patches(38,size*.07,size*.24,.17);specks(size*8,.4,2.5,.27);
      fibres(Math.floor(size*.75),11,.20);break;
    case 'wood-grain':
      ctx.save();ctx.lineWidth=1.4;
      for(let x=0;x<size;x+=random(6,13)){
        const phase=rand()*TAU;
        ctx.strokeStyle=`rgba(${rand()>.55?'255,255,255':'0,0,0'},${random(.08,.24).toFixed(3)})`;
        ctx.beginPath();
        for(let y=0;y<=size;y+=3){
          const xx=x+Math.sin(y/23+phase)*random(1.1,3.5);
          if(y===0)ctx.moveTo(xx,y);else ctx.lineTo(xx,y);
        }
        ctx.stroke();
      }ctx.restore();patches(8,size*.05,size*.18,.08);break;
    case 'corduroy':
      lines(9,'rgba(0,0,0,.33)',3.3);
      lines(9,'rgba(255,255,255,.23)',1.8);
      fibres(size*2,4,.12);break;
    case 'vinyl-sheet':
      patches(14,size*.07,size*.2,.10);specks(size*2,.1,.6,.09);
      lines(35,'rgba(255,255,255,.07)',1.0,Math.PI/8);break;
    case 'foil':
      lines(14,'rgba(255,255,255,.24)',1.5,Math.PI/4);
      lines(22,'rgba(0,0,0,.23)',1.2,-Math.PI/3);
      patches(38,size*.02,size*.14,.17);break;
    case 'glossy-paper':
      patches(12,size*.08,size*.21,.07);
      lines(39,'rgba(255,255,255,.16)',1.2,Math.PI/6);break;
  }
  return canvas;
}

function drawOutline(ctx,path,stripe,scene) {
  if(scene.outline==='none')return;
  const black=scene.outline.startsWith('black');
  const style=black?(scene.outline==='black'?'white':scene.outline.slice(6)):scene.outline;
  const colour=black?'rgba(0,0,0,.96)':'rgba(255,255,255,.94)';
  const width=style==='hairline'?1.1:style==='double'?3.4:2.1;
  const buffer=scene.gap/100*Math.min(20,stripe.width*.6);
  ctx.save();ctx.lineJoin='round';
  if(style==='broken')ctx.setLineDash([15,10]);
  if(style==='one-side'){
    ctx.strokeStyle=colour;ctx.lineWidth=width;
    ctx.stroke(stripe.lineStyle==='continuous'
      ?traceEdge(stripe,scene.extent,-1,scene):path);
    ctx.restore();return;
  }
  ctx.strokeStyle=colour;ctx.lineWidth=2*(buffer+width);ctx.stroke(path);
  if(buffer>0){ctx.strokeStyle=scene.background==='white'?'#fff':'#000';ctx.lineWidth=2*buffer;ctx.stroke(path);}
  if(style==='double'){ctx.strokeStyle=colour;ctx.lineWidth=.95;ctx.stroke(path);}
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
  if(!recipe.stripeShadowEnabled || recipe.stripeShadowStrength<=0)return null;
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
}

export function drawWallpaper(canvas, recipe, options={}) {
  const scene=resolveScene(recipe);
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
  const scaleX=canvas.width/DESIGN_WIDTH,scaleY=canvas.height/DESIGN_HEIGHT;
  scene.renderBounds={
    left:-margin.left/scaleX,top:-margin.top/scaleY,
    right:DESIGN_WIDTH+margin.right/scaleX,
    bottom:DESIGN_HEIGHT+margin.bottom/scaleY,
  };
  const ink=document.createElement('canvas');ink.width=inkWidth;ink.height=inkHeight;
  const g=ink.getContext('2d');
  if(!g) throw new Error('Canvas ink layer unavailable');
  g.scale(scaleX,scaleY);
  g.translate(margin.left/scaleX,margin.top/scaleY);
  if(scene.mirrorHorizontal||scene.mirrorVertical){
    g.translate(DESIGN_WIDTH/2,DESIGN_HEIGHT/2);
    g.scale(scene.mirrorHorizontal?-1:1,scene.mirrorVertical?-1:1);
    g.translate(scene.centerX-DESIGN_WIDTH/2,scene.centerY-DESIGN_HEIGHT/2);
  }else g.translate(scene.centerX,scene.centerY);
  g.rotate(scene.angle);
  for(const bundleOffset of scene.bundleOffsets){
  for(const original of scene.stripes){
    const stripe=scene.bundleOffsets.length===1?{...original}:
      {...original,center:original.center+bundleOffset};
    if(['tonal','woven'].includes(scene.construction))stripe.lineStyle='continuous';
    balanceStripeEnds(scene,stripe);
    if(stripe.hidden)continue;
    const path=stripePath(stripe,scene.extent,scene);
    if(scene.glow>0){
      g.save();g.shadowColor=stripe.color;g.shadowBlur=scene.glow/100*32;g.globalAlpha=.70;
      g.fillStyle=stripe.color;g.fill(path);g.restore();
    }
    drawOutline(g,path,stripe,scene);
    g.fillStyle=stripe.color;g.strokeStyle=stripe.color;
    fillMotif(g,stripe,scene.extent,scene);
    if(scene.construction!=='woven')drawBrushWear(g,stripe,scene.extent,scene);
  }
  }
  // One scratch buffer is reused for every texture layer and surface.
  // The stripe pass masks against the current ink alpha, so multiply/screen/etc
  // affect the stripe colours without spraying texture into negative space.
  const layers=scene.textureLayers;
  let scratch,s;
  const active=layers.length>0;
  if(active){
    scratch=document.createElement('canvas');scratch.width=inkWidth;scratch.height=inkHeight;
    s=scratch.getContext('2d');
    if(!s) throw new Error('Texture composite surface unavailable');
  }
  const textured=(layer,tile)=>{
    s.setTransform(1,0,0,1,0,0);
    s.globalCompositeOperation='source-over';s.globalAlpha=1;
    s.clearRect(0,0,inkWidth,inkHeight);
    s.setTransform(scaleX,0,0,scaleY,0,0);
    s.translate(DESIGN_WIDTH/2+margin.left/scaleX,DESIGN_HEIGHT/2+margin.top/scaleY);
    s.rotate(layer.rotation*Math.PI/180);
    s.globalAlpha=layer.strength/100;
    s.fillStyle=s.createPattern(tile,'repeat');
    const reach=Math.hypot(DESIGN_WIDTH,DESIGN_HEIGHT)*1.5;
    s.fillRect(-reach,-reach,2*reach,2*reach);
    s.setTransform(1,0,0,1,0,0);s.globalAlpha=1;
  };
  const blend=(layer)=>layer.blend==='normal'?'source-over':layer.blend;
  const tiles=layers.map(layer=>{
    const tileSize=Math.max(32,Math.round(110*(.45+layer.scale/100*1.75)));
    return textureTile(layer.material,layer.seed,tileSize);
  });
  ctx.fillStyle=scene.background==='white'?'#fff':'#000';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  for(let i=0;i<layers.length;i++){
    const layer=layers[i];
    if(layer.coverage==='stripes')continue;
    textured(layer,tiles[i]);
    ctx.save();ctx.globalCompositeOperation=blend(layer);
    ctx.drawImage(scratch,margin.left,margin.top,canvas.width,canvas.height,0,0,canvas.width,canvas.height);
    ctx.restore();
  }
  for(let i=0;i<layers.length;i++){
    const layer=layers[i];
    if(layer.coverage==='background')continue;
    textured(layer,tiles[i]);
    s.save();s.globalCompositeOperation='destination-in';s.drawImage(ink,0,0);s.restore();
    g.save();g.setTransform(1,0,0,1,0,0);
    g.globalCompositeOperation=blend(layer);g.drawImage(scratch,0,0);g.restore();
  }
  // Background stays fixed. The immutable ink now has transparent overscan:
  // stripes that exited the original frame keep going off-frame when nudged.
  // Intentionally inset stripe endpoints are unchanged.
  if(options.cache) {
    const background=document.createElement('canvas');
    background.width=canvas.width;background.height=canvas.height;
    background.getContext('2d').drawImage(canvas,0,0);
    options.cache.background=background;
    options.cache.ink=ink;
    options.cache.overhang=margin;
  }
  drawFinishedInk(ctx,ink,scene,margin);
  applyCanvasAtmosphere(ctx,canvas.width,canvas.height,scene);
  return scene;
}
