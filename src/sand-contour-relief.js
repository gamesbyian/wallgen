// Sand is deposited INSIDE existing vector paths; this module never modifies
// source contours, scene geometry, object masks, or the independent grain field.
import {sandPitch} from './sand-material.js';
import {sandLighting,sandDepositHeight,sandShadowReach} from './sand-lighting.js';

const finite=v=>typeof v==='number'&&Number.isFinite(v);
const opacity=n=>'rgba('+n+')';

/** Only sand on foreground ink creates a contour rim. Background materials
 * never transform an unrelated foreground's shape. Source layer order is kept. */
export function sandRimStyles(scene,lighting=sandLighting(scene)){
  return (scene?.textureLayers||[])
    .filter(layer=>(layer?.material==='sand-mandala'||layer?.material==='sand-beaded'||layer?.material==='sand-filigree')&&
      layer.coverage!=='background'&&finite(layer.strength)&&layer.strength>0)
    .map(layer=>{
      const gauge=sandPitch(layer),strength=Math.min(1,layer.strength/100);
      return {
        gauge,
        height:sandDepositHeight(gauge,strength,'rim'),
        darkWidth:gauge*1.85,
        lightWidth:gauge*.42,
        darkAlpha:.16*strength,
        lightAlpha:.12*strength,lighting,
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
    const paint=(width,shade,alpha,lighting=null,shift=0)=>{
      if(!finite(width)||width<=0||!finite(alpha)||alpha<=0)return;
      ctx.lineWidth=width;
      ctx.strokeStyle=opacity(shade+','+Math.min(.4,alpha).toFixed(4));
      ctx.save();
      // Path2D geometry lives in original source coordinates. Translate the
      // virtual contact profile, never the original authoring path or clip.
      // The current-path fallback has no transformable Path2D and retains the
      // neutral rim until explicitly converted by its geometry owner.
      if(lighting&&paths.every(Boolean))
        ctx.translate(lighting.x*shift,lighting.y*shift);
      for(const path of paths) { if(path)ctx.stroke(path);else ctx.stroke();drawn++; }
      ctx.restore();
    };
    const l=style.lighting;
    if(l){
      // A raised ridge casts its contact shade AWAY from the incoming light.
      // The previous rim offsets were backwards relative to bead caps and the
      // existing narrow-stroke glints. Both shifts now use one analytic height
      // profile and the shared fixed-elevation lamp; clipping still owns ink.
      const reach=sandShadowReach(style.height||0);
      paint(style.darkWidth,l.shade,style.darkAlpha*l.shadow,l,-reach);
      paint(style.lightWidth,l.high,style.lightAlpha*l.light,l,reach*.72);
    }else{
      paint(style.darkWidth,'0,0,0',style.darkAlpha);
      paint(style.lightWidth,'255,255,255',style.lightAlpha);
    }
  }
  ctx.restore();
  return drawn;
}
/** Very narrow coloured strokes (e.g. the seven metric nested outlines)
 * cannot host a broad inward ridge. An interior specular thread adds relief
 * without widening the original footprint or bridging intentional gaps. */
/** The inner coloured trace is a strict Minkowski subset of the original
 * round-joined stroke: the centreline offset plus the inset trace radius is
 * at most half the original source width, even at bends and sharp tips.
 * These are authored-world widths, not device or export pixels. */
export function sandStrokeGlintFootprint(originalWidth){
  if(!finite(originalWidth)||originalWidth<=0)return null;
  const width=Math.min(originalWidth*.24,.75);
  return {width,offset:(originalWidth-width)*.34};
}
/** Very narrow coloured strokes cannot host a broad raised sand rim. With
 * world lighting, put an inset highlight on the lamp-facing half and a short
 * contact shade on the opposite half. The optional source Path2D is necessary
 * because translating a Canvas current path after construction does not
 * reliably move its geometry. No widened silhouette or pseudo-stroke mask.
 * Unlit rendering retains the historical white centreline exactly. */
export function paintSandStrokeGlint(ctx,originalWidth,styles,sourcePath=null){
  if(!styles?.length)return false;
  const footprint=sandStrokeGlintFootprint(originalWidth);
  if(!footprint)return false;
  const l=styles.find(s=>s?.lighting)?.lighting;
  const unlitAlpha=Math.min(.18,styles.reduce((n,s)=>n+(s.lightAlpha||0)*.55,0));
  if(!l||!sourcePath){
    if(unlitAlpha<=0)return false;
    ctx.save();ctx.lineCap='butt';ctx.lineJoin='round';
    ctx.lineWidth=footprint.width;
    ctx.strokeStyle='rgba(255,255,255,'+unlitAlpha.toFixed(4)+')';
    ctx.stroke();ctx.restore();return true;
  }
  const highlight=Math.min(.18,styles.reduce((n,s)=>
    n+(s.lightAlpha||0)*(s.lighting?.light||0)*.55,0));
  const shade=Math.min(.18,styles.reduce((n,s)=>
    n+(s.darkAlpha||0)*(s.lighting?.shadow||0)*.32,0));
  if(!highlight&&!shade)return false;
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  ctx.lineWidth=footprint.width;
  const paint=(rgb,alpha,side)=>{
    if(alpha<=0)return;
    ctx.save();
    ctx.translate(l.x*side*footprint.offset,l.y*side*footprint.offset);
    ctx.strokeStyle='rgba('+rgb+','+alpha.toFixed(4)+')';
    ctx.stroke(sourcePath);
    ctx.restore();
  };
  paint(l.shade,shade,-1);
  paint(l.high,highlight,1);
  ctx.restore();
  return true;
}
