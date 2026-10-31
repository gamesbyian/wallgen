// Sand is deposited INSIDE existing vector paths; this module never modifies
// source contours, scene geometry, object masks, or the independent grain field.
import {sandPitch} from './sand-material.js';

const finite=v=>typeof v==='number'&&Number.isFinite(v);
const opacity=n=>'rgba('+n+')';

/** Only sand on foreground ink creates a contour rim. Background materials
 * never transform an unrelated foreground's shape. Source layer order is kept. */
export function sandRimStyles(scene){
  return (scene?.textureLayers||[])
    .filter(layer=>(layer?.material==='sand-mandala'||layer?.material==='sand-beaded'||layer?.material==='sand-filigree')&&
      layer.coverage!=='background'&&finite(layer.strength)&&layer.strength>0)
    .map(layer=>{
      const gauge=sandPitch(layer),strength=Math.min(1,layer.strength/100);
      return {
        gauge,
        darkWidth:gauge*1.85,
        lightWidth:gauge*.42,
        darkAlpha:.16*strength,
        lightAlpha:.12*strength,
      };
    });
}
/** A raster-only ridge is meaningful only around a filled ribbon, not around
 * sparse stars/checkers or the negative gaps of woven construction. */
export function supportsSandRibbonRim(scene,stripe){
  if(!scene||!stripe||stripe.lineStyle!=='continuous')return false;
  if(scene.construction==='woven')return false;
  return scene.construction==='stroke'||scene.construction==='tonal'||
    stripe.motif==='solid';
}
/** Caller owns the true source clip (including compound even-odd holes and
 * self-crossing branch masks). All strokes are centred on the real boundary:
 * clipping keeps half of the shadow/highlight inward without moving the edge.
 * Use null outlinePaths to stroke the current Canvas2D path. */
export function paintSandContourRim(ctx,outlinePaths,styles){
  if(!styles?.length)return 0;
  const paths=outlinePaths?.length?outlinePaths:[null];
  let drawn=0;
  ctx.save();
  ctx.lineCap='butt';ctx.lineJoin='round';
  for(const style of styles){
    if(!finite(style?.gauge)||style.gauge<=0)continue;
    const paint=(width,shade,alpha)=>{
      if(!finite(width)||width<=0||!finite(alpha)||alpha<=0)return;
      ctx.lineWidth=width;
      ctx.strokeStyle=opacity(shade+','+Math.min(.4,alpha).toFixed(4));
      for(const path of paths) { if(path)ctx.stroke(path);else ctx.stroke();drawn++; }
    };
    paint(style.darkWidth,'0,0,0',style.darkAlpha);
    paint(style.lightWidth,'255,255,255',style.lightAlpha);
  }
  ctx.restore();
  return drawn;
}
/** Very narrow coloured strokes (e.g. the seven metric nested outlines)
 * cannot host a broad inward ridge. An interior specular thread adds relief
 * without widening the original footprint or bridging intentional gaps. */
export function paintSandStrokeGlint(ctx,originalWidth,styles){
  if(!styles?.length||!finite(originalWidth)||originalWidth<=0)return false;
  const alpha=Math.min(.18,styles.reduce((n,s)=>n+(s.lightAlpha||0)*.55,0));
  if(alpha<=0)return false;
  ctx.save();
  ctx.lineCap='butt';ctx.lineJoin='round';
  ctx.lineWidth=Math.min(originalWidth*.24,.75);
  ctx.strokeStyle='rgba(255,255,255,'+alpha.toFixed(4)+')';
  ctx.stroke();
  ctx.restore();
  return true;
}
