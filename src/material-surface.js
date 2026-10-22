// Aperiodic, world-space material surfaces for ROYGBIV.
// The visible marks and edge displacement sample the same seeded height field.
// No repeating canvas patterns or pre-baked square tiles: coordinates, not paint
// order or export resolution, determine every mark and every deformation.
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const hash=(x,y,seed)=>{
  let h=(Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^(seed|0))|0;
  h=Math.imul(h^(h>>>13),1274126177);
  return ((h^(h>>>16))>>>0)/4294967296;
};
function valueNoise(x,y,seed){
  const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
  const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
  return mix(mix(hash(ix,iy,seed),hash(ix+1,iy,seed),u),
    mix(hash(ix,iy+1,seed),hash(ix+1,iy+1,seed),u),v)*2-1;
}
function fractal(x,y,seed){
  return valueNoise(x,y,seed)*.56+
    valueNoise(x*2.07+37.1,y*2.07-19.7,seed+83)*.29+
    valueNoise(x*4.31-11.6,y*4.31+23.8,seed+191)*.15;
}
// [field period, ridge pitch, ridge weight, local/rough field weight]
// The relief silhouette and visible surface therefore share composition.
export const MATERIAL_CHARACTER=Object.freeze({
  grain:[7,0,0,.84],watercolor:[69,0,0,.23],
  construction:[10,0,0,.68],handmade:[24,0,0,.63],
  linen:[13,5,.27,.53],canvas:[18,9,.31,.62],
  denim:[12,6,.34,.72],knit:[24,13,.34,.5],
  felt:[9,0,0,.8],corrugated:[30,15,.67,.38],
  concrete:[49,0,0,.56],stucco:[16,0,0,.9],
  stone:[76,0,0,.47],drywall:[27,0,0,.36],
  adobe:[43,0,0,.64], 'wood-grain':[41,10,.56,.52],
  corduroy:[19,9,.66,.45], 'vinyl-sheet':[80,0,0,.20],
  foil:[32,0,0,.77], 'glossy-paper':[95,0,0,.12],
});
export const materialUnit=layer=>.6+1.6*clamp(layer.scale/100,0,1);
function materialParameters(layer){
  return MATERIAL_CHARACTER[layer.material]||MATERIAL_CHARACTER.grain;
}
/** Signed material relief at a point in material-local logical coordinates. */
export function materialHeight(layer,x,y){
  const [period,pitch,ridgeWeight,rough]=materialParameters(layer);
  const unit=materialUnit(layer),p=period*unit,seed=layer.heightSeed|0;
  // Gentle coordinate warping eliminates mechanical grid regularity.
  const warp=fractal(x/(p*6),y/(p*6),seed+411)*p*.85;
  const wx=x+warp,wy=y+fractal(x/(p*6)+27,y/(p*6)-17,seed+419)*p*.85;
  const coarse=fractal(wx/(p*3.3),wy/(p*3.3),seed+23);
  const fine=fractal(wx/p,wy/p,seed+59);
  let ridge=0;
  if(pitch){
    const skew=layer.material==='denim'?(wx+wy)*.707:
      layer.material==='knit'?wx+wy*.18:wx;
    const ribs=Math.sin(skew/(pitch*unit)*TAU+warp/(p*.55));
    ridge=layer.material==='knit'?ribs*Math.sin(wy/(pitch*unit)*TAU):ribs;
    if(layer.material==='linen'||layer.material==='canvas')
      ridge=(ridge+Math.sin((wy+warp*.4)/(pitch*unit*1.12)*TAU))*.5;
  }
  // Full-strength height is controlled by displacement and texture strength,
  // never normalized by total layer weight.
  return clamp((coarse*.57+fine*rough*.58)*(1-ridgeWeight*.55)+ridge*ridgeWeight,
    -1,1);
}
function colour(sign,alpha){
  return 'rgba('+(sign?'255,255,255':'0,0,0')+','+clamp(alpha,0,.75).toFixed(3)+')';
}
function signedStroke(ctx,layer,x,y,alpha){
  const h=materialHeight(layer,x,y);
  ctx.strokeStyle=colour(h>=0,alpha*(.5+Math.abs(h)*.7));
}
function signedFill(ctx,layer,x,y,alpha){
  const h=materialHeight(layer,x,y);
  ctx.fillStyle=colour(h>=0,alpha*(.48+Math.abs(h)*.9));
}
function radial(ctx,layer,x,y,r,opacity){
  const h=materialHeight(layer,x,y),light=h>=0;
  const g=ctx.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,colour(light,opacity*(.45+Math.abs(h)*.8)));
  g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r);
}
function dots(ctx,layer,bounds,step,size,opacity,count=1){
  const seed=layer.heightSeed|0,unit=materialUnit(layer),cell=step*unit;
  const ix0=Math.floor(bounds.left/cell)-1,ix1=Math.ceil(bounds.right/cell)+1;
  const iy0=Math.floor(bounds.top/cell)-1,iy1=Math.ceil(bounds.bottom/cell)+1;
  for(let iy=iy0;iy<=iy1;iy++)for(let ix=ix0;ix<=ix1;ix++){
    for(let k=0;k<count;k++){
      const x=(ix+hash(ix,iy,seed+k*11))*cell;
      const y=(iy+hash(ix,iy,seed+47+k*13))*cell;
      const r=(.23+hash(ix,iy,seed+73+k*17)*.94)*size*unit;
      const h=materialHeight(layer,x,y);
      ctx.fillStyle=colour(h>=0,opacity*(.27+Math.abs(h)*.72)*
        (.36+.64*hash(ix,iy,seed+151+k*19)));
      ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
    }
  }
}
function flecks(ctx,layer,bounds,step,length,opacity,orientation='random'){
  const seed=layer.heightSeed|0,unit=materialUnit(layer),cell=step*unit;
  const ix0=Math.floor(bounds.left/cell)-1,ix1=Math.ceil(bounds.right/cell)+1;
  const iy0=Math.floor(bounds.top/cell)-1,iy1=Math.ceil(bounds.bottom/cell)+1;
  ctx.lineCap='round';
  for(let iy=iy0;iy<=iy1;iy++)for(let ix=ix0;ix<=ix1;ix++){
    const x=(ix+hash(ix,iy,seed+101))*cell;
    const y=(iy+hash(ix,iy,seed+139))*cell;
    const a=(orientation==='vertical'?Math.PI/2:orientation==='horizontal'?0:
      hash(ix,iy,seed+271)*TAU)+(hash(ix,iy,seed+331)-.5)*.47;
    const len=length*unit*(.3+hash(ix,iy,seed+377));
    signedStroke(ctx,layer,x,y,opacity*(.4+.5*hash(ix,iy,seed+407)));
    ctx.lineWidth=.35+hash(ix,iy,seed+457)*.75;
    ctx.beginPath();ctx.moveTo(x,y);
    ctx.lineTo(x+Math.cos(a)*len,y+Math.sin(a)*len);ctx.stroke();
  }
}
function blooms(ctx,layer,bounds,spacing,radius,opacity){
  const seed=layer.heightSeed|0,unit=materialUnit(layer),cell=spacing*unit;
  const ix0=Math.floor(bounds.left/cell)-1,ix1=Math.ceil(bounds.right/cell)+1;
  const iy0=Math.floor(bounds.top/cell)-1,iy1=Math.ceil(bounds.bottom/cell)+1;
  for(let iy=iy0;iy<=iy1;iy++)for(let ix=ix0;ix<=ix1;ix++){
    if(hash(ix,iy,seed+600)<.22)continue;
    const x=(ix+hash(ix,iy,seed+607))*cell;
    const y=(iy+hash(ix,iy,seed+613))*cell;
    const r=radius*unit*(.5+hash(ix,iy,seed+619)*.95);
    radial(ctx,layer,x,y,r,opacity*(.45+hash(ix,iy,seed+631)*.55));
    // Uneven overlapping colour deposition, not a stamp-like ring.
    if(hash(ix,iy,seed+637)>.64)
      radial(ctx,layer,x+r*.28,y-r*.2,r*.49,opacity*.32);
  }
}
function threads(ctx,layer,bounds,gap,opacity,axis='both'){
  const unit=materialUnit(layer),seed=layer.heightSeed|0;
  const step=gap*unit;
  ctx.lineCap='round';
  for(const vertical of [true,false]){
    if(axis==='vertical'&&!vertical||axis==='horizontal'&&vertical)continue;
    const min=vertical?bounds.left:bounds.top,max=vertical?bounds.right:bounds.bottom;
    const alongMin=vertical?bounds.top:bounds.left;
    const alongMax=vertical?bounds.bottom:bounds.right;
    for(let i=Math.floor(min/step)-2;i<=Math.ceil(max/step)+2;i++){
      const base=(i+(hash(i,0,seed+1001)-.5)*.31)*step;
      const width=(.5+hash(i,0,seed+1011)*.85)*unit;
      ctx.lineWidth=width;
      let started=false;
      for(let j=Math.floor(alongMin/13)-1;j<=Math.ceil(alongMax/13)+1;j++){
        const along=j*13;
        const bend=materialHeight(layer,vertical?base:along,vertical?along:base);
        const across=base+bend*step*.28;
        const x=vertical?across:along,y=vertical?along:across;
        const gapMark=hash(i,j,seed+1031)>.988;
        if(gapMark){if(started){ctx.stroke();started=false;}continue;}
        if(!started){
          signedStroke(ctx,layer,x,y,opacity*(.6+hash(i,0,seed+1049)*.45));
          ctx.beginPath();ctx.moveTo(x,y);started=true;
        }else ctx.lineTo(x,y);
      }
      if(started)ctx.stroke();
    }
  }
}
function knitStitches(ctx,layer,bounds){
  const seed=layer.heightSeed|0,unit=materialUnit(layer),step=13*unit;
  const x0=Math.floor(bounds.left/step)-1,x1=Math.ceil(bounds.right/step)+1;
  const y0=Math.floor(bounds.top/step)-1,y1=Math.ceil(bounds.bottom/step)+1;
  ctx.lineWidth=1.5*unit;ctx.lineCap='round';
  for(let iy=y0;iy<=y1;iy++)for(let ix=x0;ix<=x1;ix++){
    if(hash(ix,iy,seed+1231)>.988)continue;
    const jitter=step*.18;
    const x=(ix+.5+(iy%2)*.4)*step+(hash(ix,iy,seed+1249)-.5)*jitter;
    const y=iy*step+(hash(ix,iy,seed+1259)-.5)*jitter;
    const w=step*(.27+hash(ix,iy,seed+1277)*.08),h=step*.52;
    signedStroke(ctx,layer,x,y,.27);
    ctx.beginPath();ctx.moveTo(x-w,y-h);
    ctx.quadraticCurveTo(x-w*1.5,y,x,y+h);
    ctx.quadraticCurveTo(x+w*1.5,y,x+w,y-h);ctx.stroke();
  }
}
function grainLines(ctx,layer,bounds){
  const unit=materialUnit(layer),seed=layer.heightSeed|0,step=10*unit;
  for(let ix=Math.floor(bounds.left/step)-2;ix<=Math.ceil(bounds.right/step)+2;ix++){
    const base=(ix+(hash(ix,0,seed+1601)-.5)*.5)*step;
    ctx.lineWidth=(.45+hash(ix,0,seed+1607)*1.3)*unit;
    let started=false;
    for(let j=Math.floor(bounds.top/7)-2;j<=Math.ceil(bounds.bottom/7)+2;j++){
      const y=j*7,warp=materialHeight(layer,base,y)*7*unit;
      const x=base+warp;
      if(hash(ix,j,seed+1613)>.992){
        if(started){ctx.stroke();started=false;}continue;
      }
      if(!started){signedStroke(ctx,layer,x,y,.18);
        ctx.beginPath();ctx.moveTo(x,y);started=true;
      }else ctx.lineTo(x,y);
    }
    if(started)ctx.stroke();
  }
}
function creaseLines(ctx,layer,bounds,cell,opacity){
  const seed=layer.heightSeed|0,unit=materialUnit(layer),step=cell*unit;
  const ix0=Math.floor(bounds.left/step)-1,ix1=Math.ceil(bounds.right/step)+1;
  const iy0=Math.floor(bounds.top/step)-1,iy1=Math.ceil(bounds.bottom/step)+1;
  ctx.lineCap='round';
  for(let iy=iy0;iy<=iy1;iy++)for(let ix=ix0;ix<=ix1;ix++){
    if(hash(ix,iy,seed+1701)<.32)continue;
    const x=(ix+hash(ix,iy,seed+1709))*step;
    const y=(iy+hash(ix,iy,seed+1717))*step;
    const a=hash(ix,iy,seed+1723)*TAU;
    const length=step*(.21+hash(ix,iy,seed+1733)*.67);
    const dx=Math.cos(a)*length,dy=Math.sin(a)*length;
    const kink=materialHeight(layer,x,y)*length*.22;
    signedStroke(ctx,layer,x,y,opacity);
    ctx.lineWidth=.45+unit*.55*hash(ix,iy,seed+1741);
    ctx.beginPath();ctx.moveTo(x,y);
    ctx.lineTo(x+dx*.5+Math.sin(a)*kink,y+dy*.5-Math.cos(a)*kink);
    ctx.lineTo(x+dx,y+dy);ctx.stroke();
    if(layer.material==='foil'){
      ctx.strokeStyle=colour(true,opacity*.55);
      ctx.lineWidth=.55;
      ctx.beginPath();ctx.moveTo(x+1,y);
      ctx.lineTo(x+dx*.5+Math.sin(a)*kink+1,y+dy*.5-Math.cos(a)*kink);
      ctx.stroke();
    }
  }
}
/**
 * Draw only the visible world-space range; each coordinate's mark is unique.
 * Rendering a larger crop or a high-resolution PNG cannot introduce tile seams.
 * Caller supplies canvas transform mapping material-local coordinates to pixels.
 */
export function paintMaterial(ctx,layer,bounds){
  if(!MATERIAL_CHARACTER[layer.material])return;
  ctx.save();
  // Broad, irregular material mass under the fine detail. All finishes use
  // the same materialHeight() that governs their stripe-edge relief.
  if(['watercolor','handmade','concrete','stone','adobe','foil','vinyl-sheet',
    'glossy-paper','drywall','stucco'].includes(layer.material))
    blooms(ctx,layer,bounds,
      layer.material==='watercolor'?94:layer.material==='stone'?130:105,
      layer.material==='watercolor'?90:layer.material==='stone'?115:70,
      layer.material==='watercolor'?.19:.13);
  switch(layer.material){
    case 'grain': dots(ctx,layer,bounds,5.3,.65,.37,2);break;
    case 'watercolor':
      dots(ctx,layer,bounds,6,.55,.15,2);
      flecks(ctx,layer,bounds,18,5,.11);break;
    case 'construction':
      dots(ctx,layer,bounds,5,.64,.28,2);
      flecks(ctx,layer,bounds,11,5,.17,'horizontal');break;
    case 'handmade':
      dots(ctx,layer,bounds,8,1.2,.24,2);
      flecks(ctx,layer,bounds,8,14,.28);break;
    case 'linen':
      threads(ctx,layer,bounds,5,.20);
      dots(ctx,layer,bounds,9,.5,.15);break;
    case 'canvas':
      threads(ctx,layer,bounds,9,.27);
      dots(ctx,layer,bounds,7,.7,.13);break;
    case 'denim':
      ctx.save();ctx.rotate(-Math.PI/4);
      // Rotated bounding ranges are generated in the caller's local space;
      // use angled diagonal fibre segments rather than cropping rotated rows.
      ctx.restore();
      flecks(ctx,layer,bounds,5.5,11,.28,'vertical');
      threads(ctx,layer,bounds,11,.14);
      dots(ctx,layer,bounds,9,.5,.15);break;
    case 'knit': knitStitches(ctx,layer,bounds);dots(ctx,layer,bounds,9,.55,.12);break;
    case 'felt':
      dots(ctx,layer,bounds,4,1,.22,2);
      flecks(ctx,layer,bounds,4.5,6,.26);break;
    case 'corrugated':
      threads(ctx,layer,bounds,15,.39,'vertical');
      dots(ctx,layer,bounds,10,.85,.11);break;
    case 'concrete':
      dots(ctx,layer,bounds,6,1.35,.25,2);
      flecks(ctx,layer,bounds,18,11,.09);
      creaseLines(ctx,layer,bounds,120,.08);break;
    case 'stucco':
      dots(ctx,layer,bounds,5.5,1.7,.36,2);
      flecks(ctx,layer,bounds,13,6,.18);break;
    case 'stone':
      dots(ctx,layer,bounds,12,1.2,.15);
      creaseLines(ctx,layer,bounds,74,.16);break;
    case 'drywall':
      dots(ctx,layer,bounds,8,.65,.15);
      flecks(ctx,layer,bounds,19,7,.065);break;
    case 'adobe':
      dots(ctx,layer,bounds,7,1.6,.25);
      flecks(ctx,layer,bounds,10,13,.18);break;
    case 'wood-grain':
      grainLines(ctx,layer,bounds);
      blooms(ctx,layer,bounds,160,42,.07);
      dots(ctx,layer,bounds,13,.5,.08);break;
    case 'corduroy':
      threads(ctx,layer,bounds,9,.39,'vertical');
      flecks(ctx,layer,bounds,7,5,.11,'vertical');break;
    case 'vinyl-sheet':
      dots(ctx,layer,bounds,17,.5,.07);
      flecks(ctx,layer,bounds,46,5,.065);break;
    case 'foil':
      creaseLines(ctx,layer,bounds,32,.30);
      dots(ctx,layer,bounds,8,.6,.12);break;
    case 'glossy-paper':
      dots(ctx,layer,bounds,17,.3,.065);break;
  }
  ctx.restore();
}
