import { DESIGN_WIDTH, DESIGN_HEIGHT, resolveScene, rng } from './model.js';

const TAU = Math.PI * 2;
const fract = (v) => v - Math.floor(v);
const lerp = (a,b,t) => a + (b-a)*t;
const noise1D = (x, seed) => {
  const i = Math.floor(x);
  const hash = j => fract(Math.sin(j * 127.1 + seed * 311.7) * 43758.5453) * 2 - 1;
  return lerp(hash(i), hash(i+1), fract(x));
};
function displacement(x, stripe, extent) {
  const {geometry:g, phase, period, displacement:d} = stripe;
  const t = x / period + phase / TAU;
  if(g === 'straight') return 0;
  if(g === 'wave') return d * (Math.sin(t * TAU) * .78 + Math.sin(t * TAU * .43 + phase) * .22);
  if(g === 'zigzag') return d * (2 * Math.abs(2 * fract(t) - 1) - 1);
  if(g === 'jagged') return d * (noise1D(x / (period * 0.33), phase) * .85 + .15 * Math.sin(t * TAU));
  if(g === 'stepped') return d * (Math.floor(fract(t)*4)/2 - .75);
  if(g === 'arc') return d * (Math.pow(x/extent,2)*3.8 - .6);
  return d * (Math.sin(t*TAU*.42)*.35 + Math.sin(t*TAU*.79+phase)*.4 + Math.sin(t*TAU*1.33)*.25);
}
function widthAt(x,stripe,extent) {
  const t = x / extent;
  return stripe.width * Math.max(0.3, 1 + stripe.taper * (Math.sin(t*TAU*1.4 + (stripe.edgePhase??stripe.phase))*.7 + t*.3));
}
function geometryAt(x,stripe,extent) {
  const shared=displacement(x,{
    geometry:stripe.sharedGeometry??stripe.geometry,
    phase:stripe.sharedPhase??stripe.phase,
    period:stripe.sharedPeriod??stripe.period,
    displacement:stripe.sharedDisplacement??stripe.displacement,
  },extent);
  return stripe.center + lerp(shared,displacement(x,stripe,extent),stripe.parallelMix??1)
    + (stripe.tilt??0)*x/extent;
}
function stripePath(stripe, extent) {
  const path = new Path2D();
  const count = 500;
  const start=stripe.segmentStart??-extent, end=stripe.segmentEnd??extent;
  for (let i=0;i<=count;i++) {
    const x = start + (end-start)*i/count;
    const y = geometryAt(x,stripe,extent) - widthAt(x,stripe,extent)/2;
    if(i===0) path.moveTo(x,y); else path.lineTo(x,y);
  }
  for(let i=count;i>=0;i--) {
    const x = start + (end-start)*i/count;
    path.lineTo(x,geometryAt(x,stripe,extent)+widthAt(x,stripe,extent)/2);
  }
  path.closePath();
  return path;
}
function traceEdge(stripe, extent, side) {
  const path=new Path2D();
  const start=stripe.segmentStart??-extent, end=stripe.segmentEnd??extent;
  for(let i=0;i<=500;i++){
    const x=start+(end-start)*i/500;
    const y=geometryAt(x,stripe,extent)+side*widthAt(x,stripe,extent)/2;
    if(i===0) path.moveTo(x,y); else path.lineTo(x,y);
  }
  return path;
}
// A stripe may either meet BOTH opposed frame edges, or NEITHER.
// When an irregular path exits via unmatched sides, place its two physical
// ends safely inside the frame instead of leaving a one-sided crop.
function ribbonPoint(scene,x,y) {
  const co=Math.cos(scene.angle), si=Math.sin(scene.angle);
  return {x:scene.centerX+x*co-y*si,y:scene.centerY+x*si+y*co};
}
function endpoints(scene,stripe,x) {
  const mid=geometryAt(x,stripe,scene.extent),radius=widthAt(x,stripe,scene.extent)/2;
  return [ribbonPoint(scene,x,mid-radius),ribbonPoint(scene,x,mid+radius)];
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
  for(let i=0;i<=8;i++){
    const testX=x-halfX+halfX*i/4;
    const center=geometryAt(testX,stripe,extent);
    const radius=widthAt(testX,stripe,extent)/2;
    if(y-halfY < center-radius+margin || y+halfY > center+radius-margin) return false;
  }
  // Only complete marks within the actual wallpaper rectangle.
  const a=scene.angle, cos=Math.cos(a), sin=Math.sin(a);
  for(const dx of [-halfX,halfX])for(const dy of [-halfY,halfY]){
    const px=scene.centerX+(x+dx)*cos-(y+dy)*sin;
    const py=scene.centerY+(x+dx)*sin+(y+dy)*cos;
    if(px < 0 || px > DESIGN_WIDTH || py < 0 || py > DESIGN_HEIGHT) return false;
  }
  return true;
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
function fillMotif(ctx,stripe,extent,scene) {
  const motif=stripe.motif;
  if(motif==='solid'){ctx.fill(stripePath(stripe,extent));return;}
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
      const yy=geometryAt(xx,stripe,extent)+offset+(random()-.5)*jitter;
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
      ctx.translate(xx,yy);ctx.rotate(variation.angle);
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
  if(style==='one-side'){ctx.strokeStyle=colour;ctx.lineWidth=width;ctx.stroke(traceEdge(stripe,scene.extent,-1));ctx.restore();return;}
  ctx.strokeStyle=colour;ctx.lineWidth=2*(buffer+width);ctx.stroke(path);
  if(buffer>0){ctx.strokeStyle=scene.background==='white'?'#fff':'#000';ctx.lineWidth=2*buffer;ctx.stroke(path);}
  if(style==='double'){ctx.strokeStyle=colour;ctx.lineWidth=.95;ctx.stroke(path);}
  ctx.restore();
}

export function drawWallpaper(canvas, recipe) {
  const scene=resolveScene(recipe);
  const ctx=canvas.getContext('2d', { alpha: false });
  if(!ctx) throw new Error('Canvas 2D is not supported by this browser.');
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
  // Draw translucent ink first, apply source-atop material, then place an opaque black
  // layer *behind* it. This preserves truly black negative space at every resolution.
  // alpha:false canvases defeat this layering, so the compositing is done with a
  // separate transparent canvas surface at the target size.
  const ink=document.createElement('canvas');ink.width=canvas.width;ink.height=canvas.height;
  const g=ink.getContext('2d');
  if(!g) throw new Error('Canvas ink layer unavailable');
  g.scale(canvas.width/DESIGN_WIDTH,canvas.height/DESIGN_HEIGHT);
  g.translate(scene.centerX,scene.centerY);g.rotate(scene.angle);
  for(const stripe of scene.stripes){
    balanceStripeEnds(scene,stripe);
    if(stripe.hidden)continue;
    const path=stripePath(stripe,scene.extent);
    if(scene.glow>0){
      g.save();g.shadowColor=stripe.color;g.shadowBlur=scene.glow/100*32;g.globalAlpha=.70;
      g.fillStyle=stripe.color;g.fill(path);g.restore();
    }
    drawOutline(g,path,stripe,scene);
    g.fillStyle=stripe.color;g.strokeStyle=stripe.color;
    fillMotif(g,stripe,scene.extent,scene);
  }
  let tile;
  if(scene.material!=='none' && scene.textureStrength>0) {
    const tileSize=Math.max(32,Math.round(110*(.45+scene.textureScale/100*1.75)));
    tile=textureTile(scene.material,scene.seed,tileSize);
    if(scene.textureCoverage!=='background'){
      g.save();g.globalCompositeOperation='source-atop';
      g.globalAlpha=scene.textureStrength/100;
      g.fillStyle=g.createPattern(tile,'repeat');
      g.fillRect(-scene.extent,-scene.extent,scene.extent*2,scene.extent*2);
      g.restore();
    }
  }
  ctx.fillStyle=scene.background==='white'?'#fff':'#000';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  if(tile && scene.textureCoverage!=='stripes'){
    // Background has its own surface, independent of the transparent stripe ink.
    // Draw in logical coordinates so preview and PNG have the same texture scale.
    ctx.save();
    ctx.setTransform(canvas.width/DESIGN_WIDTH,0,0,canvas.height/DESIGN_HEIGHT,0,0);
    ctx.globalAlpha=scene.textureStrength/100;
    ctx.fillStyle=ctx.createPattern(tile,'repeat');
    ctx.fillRect(0,0,DESIGN_WIDTH,DESIGN_HEIGHT);
    ctx.restore();
  }
  ctx.drawImage(ink,0,0);
  return scene;
}
