// Stripe-local colours and reusable silhouette-masked inset lighting.
// Keep colour math independent of Canvas so previews, workers and exports agree.
export const EFFECT_PLACEMENTS=Object.freeze(['inner','outer','both']);
export const SHADOW_COLOUR_MODES=Object.freeze([
  'original','black','white','stripe','dark-stripe','light-stripe','custom'
]);
export const GLOW_COLOUR_MODES=Object.freeze([
  'stripe','black','white','dark-stripe','light-stripe','custom'
]);
export const normalHex=(input,fallback='#ffffff')=>
  typeof input==='string'&&/^#[0-9a-f]{6}$/i.test(input)?input.toLowerCase():fallback;

export function cssRgb(input){
  const hex=/^#([0-9a-f]{6})$/i.exec(input||'');
  if(hex)return [0,2,4].map(n=>parseInt(hex[1].slice(n,n+2),16));
  const short=/^#([0-9a-f]{3})$/i.exec(input||'');
  if(short)return [...short[1]].map(v=>parseInt(v+v,16));
  const rgb=/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(input||'');
  if(rgb)return rgb.slice(1,4).map(Number);
  const hsl=/^hsla?\(\s*([\d.]+)(?:deg)?[,\s]+([\d.]+)%[,\s]+([\d.]+)%/i.exec(input||'');
  if(hsl){
    const h=((Number(hsl[1])%360)+360)%360/30,s=Number(hsl[2])/100,
      l=Number(hsl[3])/100;
    const a=s*Math.min(l,1-l);
    return [0,8,4].map(n=>{
      const k=(n+h)%12;
      return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))));
    });
  }
  return [0,0,0];
}
export function effectRgb(mode,stripe,custom='#ffffff',invert=false){
  const original=[11,12,21];
  let colour=mode==='original'?original:
    mode==='black'?[0,0,0]:mode==='white'?[255,255,255]:
    mode==='custom'?cssRgb(normalHex(custom)):cssRgb(stripe);
  if(mode==='dark-stripe')colour=colour.map(v=>Math.round(v*.48));
  if(mode==='light-stripe')colour=colour.map(v=>Math.round(v*.48+255*.52));
  return invert?colour.map(v=>255-v):colour;
}
export function effectRgba(mode,stripe,custom,invert,alpha=1){
  const rgb=effectRgb(mode,stripe,custom,invert);
  return `rgba(${rgb.join(',')},${Math.max(0,Math.min(1,alpha)).toFixed(4)})`;
}
// Draw only the shadow from the exterior of the silhouette onto its interior.
// The even-odd inverse contains the *real* contour, including compound holes.
// source-atop also keeps dotted, dashed and textured negative spaces empty.
export function paintInsetEdge(ctx,shape,{colour,blur=0,x=0,y=0,extent=12000,rule='nonzero'}){
  const outer=new Path2D();
  const reach=Math.max(12000,extent*4);
  outer.rect(-reach,-reach,reach*2,reach*2);
  outer.addPath(shape);
  ctx.save();
  ctx.clip(shape,rule);
  ctx.globalCompositeOperation='source-atop';
  ctx.shadowColor=colour;
  ctx.shadowBlur=blur;
  ctx.shadowOffsetX=x;
  ctx.shadowOffsetY=y;
  ctx.fillStyle='#000';
  ctx.fill(outer,'evenodd');
  ctx.restore();
}
