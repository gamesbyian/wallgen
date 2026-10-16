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
  return stripe.width * Math.max(0.3, 1 + stripe.taper * (Math.sin(t*TAU*1.4 + stripe.phase)*.7 + t*.3));
}
function geometryAt(x,stripe,extent) { return stripe.center + displacement(x,stripe,extent); }
function stripePath(stripe, extent) {
  const path = new Path2D();
  const count = 500;
  for (let i=0;i<=count;i++) {
    const x = -extent + 2*extent*i/count;
    const y = geometryAt(x,stripe,extent) - widthAt(x,stripe,extent)/2;
    if(i===0) path.moveTo(x,y); else path.lineTo(x,y);
  }
  for(let i=count;i>=0;i--) {
    const x = -extent + 2*extent*i/count;
    path.lineTo(x,geometryAt(x,stripe,extent)+widthAt(x,stripe,extent)/2);
  }
  path.closePath();
  return path;
}
function traceEdge(stripe, extent, side) {
  const path=new Path2D();
  for(let i=0;i<=500;i++){
    const x=-extent+2*extent*i/500;
    const y=geometryAt(x,stripe,extent)+side*widthAt(x,stripe,extent)/2;
    if(i===0) path.moveTo(x,y); else path.lineTo(x,y);
  }
  return path;
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
function fillMotif(ctx,stripe,extent,scene) {
  const motif=stripe.motif;
  if(motif==='solid') {ctx.fill(stripePath(stripe,extent));return;}
  const path=stripePath(stripe,extent);
  ctx.save(); ctx.clip(path);
  const r=rng(`${scene.seed}:motifs:${stripe.index}`);
  const step=Math.max(11, stripe.width*.40*stripe.patternScale);
  const across=Math.max(1,Math.ceil(stripe.width/(step*.80)));
  const minX=-extent, maxX=extent;
  if(motif==='hatch') {
    ctx.lineWidth=Math.max(2,step*.23);
    for(let x=minX-stripe.width*2;x<maxX+stripe.width*2;x+=step*.75){
      for(let offset=-stripe.width*2;offset<stripe.width*2;offset+=step*1.15){
        ctx.beginPath();ctx.moveTo(x, stripe.center+offset);ctx.lineTo(x+stripe.width*1.3,stripe.center+offset-stripe.width*1.3);ctx.stroke();
      }
    }
  } else if(motif==='chevrons') {
    ctx.lineWidth=Math.max(2,step*.23);
    for(let x=minX;x<maxX;x+=step*1.8){
      for(let j=-across;j<=across;j++){
        const y=stripe.center+j*step*.9;
        ctx.beginPath();ctx.moveTo(x-step*.5,y-step*.36);ctx.lineTo(x,y+step*.25);ctx.lineTo(x+step*.5,y-step*.36);ctx.stroke();
      }
    }
  } else if(motif==='dashes'){
    ctx.lineWidth=Math.min(stripe.width*.55,step*.70); ctx.lineCap='round';
    for(let x=minX;x<maxX;x+=step*2.15){
      for(let j=-across;j<=across;j++){
        const y=stripe.center+j*step*.9;
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+step*1.25,y);ctx.stroke();
      }
    }
  } else {
    for(let x=minX; x<maxX; x+=step){
      for(let j=-across-1;j<=across+1;j++){
        const row=j, y=stripe.center+j*step*.9;
        const xx=x+(Math.abs(j)%2)*step*.5;
        const jitter=scene.intensity * step * .13;
        const px=xx+(r()-.5)*jitter, py=y+(r()-.5)*jitter;
        const rad=step*.32*(.8+r()*.35);
        if(motif==='dots') {ctx.beginPath();ctx.arc(px,py,rad,0,TAU);ctx.fill();}
        else if(motif==='stars')stampStar(ctx,px,py,rad*1.2);
        else if(motif==='diamonds') {ctx.beginPath();ctx.moveTo(px,py-rad);ctx.lineTo(px+rad,py);ctx.lineTo(px,py+rad);ctx.lineTo(px-rad,py);ctx.closePath();ctx.fill();}
        else if(motif==='checker' && ((Math.round((x-minX)/step)+j)&1)===0) ctx.fillRect(px-rad,py-rad,rad*2,rad*2);
      }
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
    const path=stripePath(stripe,scene.extent);
    if(scene.glow>0){
      g.save();g.shadowColor=stripe.color;g.shadowBlur=scene.glow/100*32;g.globalAlpha=.70;
      g.fillStyle=stripe.color;g.fill(path);g.restore();
    }
    drawOutline(g,path,stripe,scene);
    g.fillStyle=stripe.color;g.strokeStyle=stripe.color;
    fillMotif(g,stripe,scene.extent,scene);
  }
  if(scene.material!=='none' && scene.textureStrength>0) {
    const tileSize=Math.max(32,Math.round(110*(.45+scene.textureScale/100*1.75)));
    const tile=textureTile(scene.material,scene.seed,tileSize);
    g.save();g.globalCompositeOperation='source-atop';
    g.globalAlpha=scene.textureStrength/100;
    g.fillStyle=g.createPattern(tile,'repeat');
    g.fillRect(-scene.extent,-scene.extent,scene.extent*2,scene.extent*2);
    g.restore();
  }
  ctx.fillStyle=scene.background==='white'?'#fff':'#000';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(ink,0,0);
  return scene;
}
