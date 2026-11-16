// Pigment is a deposited, partially translucent colour field, not a set of
// black/white scratches. Samples live in source artwork coordinates so changing
// export resolution, cropping a crossing replay, or nudging the ink cannot
// randomly redistribute its pigment.
import {DESIGN_WIDTH,DESIGN_HEIGHT,hashString} from './model.js';
import {materialHeight} from './material-surface.js';

export const PIGMENT_STYLES=Object.freeze(['dry-brush','chalk','ink','wash','opaque']);
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const mix=(a,b,t)=>a+(b-a)*t;
function hash(x,y,seed){
  let v=(Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^(seed|0))|0;
  v=Math.imul(v^(v>>>13),1274126177);
  return ((v^(v>>>16))>>>0)/4294967296;
}
function noise(x,y,seed){
  const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
  const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
  return mix(mix(hash(ix,iy,seed),hash(ix+1,iy,seed),u),
    mix(hash(ix,iy+1,seed),hash(ix+1,iy+1,seed),u),v)*2-1;
}
const styleProfile={
  'dry-brush':{loss:.70,pores:.80,streak:1,pool:0},
  chalk:{loss:.74,pores:1,streak:.14,pool:0},
  ink:{loss:.43,pores:.43,streak:.32,pool:.75},
  wash:{loss:.55,pores:.25,streak:.06,pool:1},
  opaque:{loss:.32,pores:.35,streak:.40,pool:.12}
};
export function pigmentCoverage(x,y,seed,settings,material=0,edge=0){
  const strength=clamp(settings.brushRoughness/100);
  if(strength===0)return 1;
  const profile=styleProfile[settings.pigmentStyle]||styleProfile['dry-brush'];
  const scale=5+44*Math.pow(clamp(settings.pigmentGrainScale/100),1.45);
  const stretch=1+clamp(settings.pigmentDirectionality/100)*8*profile.streak;
  const coarse=noise(x/(scale*3.7*stretch),y/(scale*3.1),seed+17);
  const patches=noise(x/(scale*stretch),y/(scale*.64),seed+71);
  const grain=noise(x/(scale*.22*(1+2*profile.streak)),y/(scale*.16),seed+137);
  const pores=noise(x/1.4,y/1.4,seed+239);
  // Coherent missing-pigment areas, irregular deposits and pores coexist.
  const depletion=profile.loss*(.72-.35*coarse-.36*patches-.15*grain);
  let coverage=clamp(1-strength*depletion,0,1);
  const poreCut=clamp((pores-.04)/.88);
  coverage*=1-strength*profile.pores*.76*poreCut;
  // A real substrate changes where pigment settles. No material means no
  // extra paper/cloth noise: this is the independently controllable ink.
  coverage*=1-strength*.24*clamp(material,-1,1);
  if(edge>0){
    const breakup=clamp(settings.pigmentEdgeBreakup/100);
    const ragged=clamp(.24+.67*patches+.28*grain,0,1);
    coverage*=1-strength*breakup*edge*(1-ragged);
    // Waterborne pigment migrates toward a drying boundary.
    if(profile.pool)coverage=mix(coverage,Math.min(1,coverage+strength*.22*profile.pool),
      edge*(1-breakup*.5));
  }
  return clamp(coverage);
}
// Material relief is sampled in the same oriented world frame used by the
// existing surface painter. Background-only layers cannot modify ink deposit.
export function pigmentMaterialSampler(scene){
  const layers=(scene.textureLayers||[]).filter(l=>
    l.coverage!=='background'&&l.material!=='none'&&l.strength>0);
  if(!layers.length)return null;
  const c=Math.cos(scene.angle),s=Math.sin(scene.angle);
  return (x,y)=>{
    let wx=x,wy=y;
    if(scene.structure==='paths'){
      const rx=x*c-y*s,ry=x*s+y*c;
      wx=DESIGN_WIDTH/2+(scene.mirrorHorizontal?-1:1)*
        (scene.centerX-DESIGN_WIDTH/2+rx);
      wy=DESIGN_HEIGHT/2+(scene.mirrorVertical?-1:1)*
        (scene.centerY-DESIGN_HEIGHT/2+ry);
    }
    const dx=wx-DESIGN_WIDTH/2,dy=wy-DESIGN_HEIGHT/2;
    let sum=0,total=0;
    for(const layer of layers){
      const tx=dx*layer.heightCos+dy*layer.heightSin;
      const ty=-dx*layer.heightSin+dy*layer.heightCos;
      sum+=materialHeight(layer,tx,ty)*layer.strength;
      total+=layer.strength;
    }
    return total?sum/total:0;
  };
}
/**
 * Paint one independent source-over ink object. Its RGBA pixels carry true
 * variable coverage, so underlying objects remain visible through thin ink.
 * The clip/path can contain holes and disconnected islands. A shared scratch
 * surface is reused instead of allocating a full-resolution layer per stripe.
 *
 * The 2 samples/source-unit lattice is anchored to integer world coordinates.
 * Main strokes and crossing replays use the same coordinates and seed.
 */
export function paintPigmentedFill(ctx,paint,path,bounds,scene,objectSeed,options={}){
  if(!scene.brushRoughness){paint(ctx);return;}
  const pad=3.5*scene.brushRoughness/100*scene.pigmentEdgeBreakup/100+2;
  const ppu=2;
  const x0=Math.floor((bounds.left-pad)*ppu)/ppu;
  const y0=Math.floor((bounds.top-pad)*ppu)/ppu;
  const x1=Math.ceil((bounds.right+pad)*ppu)/ppu;
  const y1=Math.ceil((bounds.bottom+pad)*ppu)/ppu;
  const w=Math.ceil((x1-x0)*ppu),h=Math.ceil((y1-y0)*ppu);
  // Hostile imported geometry and giant zoom-out bounds must stay bounded.
  // Render the original shape rather than allocating a dangerous bitmap.
  if(!w||!h||w*h>8_000_000||w>12000||h>12000){
    paint(ctx);return;
  }
  const holder=options.scratch||{};
  if(!holder.canvas){
    holder.canvas=options.canvasFactory?options.canvasFactory(w,h):
      typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):
      typeof document!=='undefined'?document.createElement('canvas'):null;
  }
  const surface=holder.canvas;
  if(!surface){paint(ctx);return;}
  if(surface.width!==w)surface.width=w;
  if(surface.height!==h)surface.height=h;
  const t=surface.getContext('2d',{willReadFrequently:true});
  if(!t){paint(ctx);return;}
  t.setTransform(1,0,0,1,0,0);
  t.clearRect(0,0,w,h);
  t.setTransform(ppu,0,0,ppu,-x0*ppu,-y0*ppu);
  // Thin feathered deposits may escape the ideal outline. Fill is drawn
  // after this halo, preserving an intact central paint mask.
  if(path&&scene.pigmentEdgeBreakup){
    t.globalAlpha=.22*scene.brushRoughness/100*
      scene.pigmentEdgeBreakup/100;
    t.strokeStyle=options.colour||'#fff';
    t.lineWidth=pad*1.5;
    t.stroke(path);
    t.globalAlpha=1;
  }
  paint(t);
  const pixels=t.getImageData(0,0,w,h);
  const bytes=pixels.data;
  const original=new Uint8Array(w*h);
  for(let i=0,j=3;i<original.length;i++,j+=4)original[i]=bytes[j];
  const seed=hashString(objectSeed),sampleMaterial=options.material||null;
  const breakup=clamp(scene.pigmentEdgeBreakup/100);
  const radius=Math.max(1,Math.round((1+2.5*breakup)*ppu));
  const fieldSettings=scene;
  for(let iy=0;iy<h;iy++){
    const y=y0+(iy+.5)/ppu;
    for(let ix=0;ix<w;ix++){
      const index=iy*w+ix,base=original[index];
      if(base===0)continue;
      const x=x0+(ix+.5)/ppu;
      let edge=0;
      if(breakup){
        // Four bounded probes detect the actual painted silhouette, including
        // imported region holes. No assumed rectangle or centreline distance.
        if(ix<radius||original[index-radius]<96)edge+=.25;
        if(ix+radius>=w||original[index+radius]<96)edge+=.25;
        if(iy<radius||original[index-radius*w]<96)edge+=.25;
        if(iy+radius>=h||original[index+radius*w]<96)edge+=.25;
      }
      const material=sampleMaterial?sampleMaterial(x,y):0;
      const coverage=pigmentCoverage(x,y,seed,fieldSettings,material,edge);
      bytes[index*4+3]=Math.round(base*coverage);
    }
  }
  t.putImageData(pixels,0,0);
  ctx.drawImage(surface,x0,y0,w/ppu,h/ppu);
}
