// Embroidery has oriented tubular thread surfaces rather than isotropic sand.
// Reuse the global sand/world lamp and its fixed elevation for height-based
// projection, while deriving the visible transverse face from each stitch.
// All offsets are authored design units and are clipped by the owning vector.
import {sandCapDiffuse,sandShadowReach,rotateSandLighting} from './sand-lighting.js';
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export {rotateSandLighting as rotateThreadLighting};
export function threadLightProfile(lighting,ax,ay,bx,by,pitch,relief){
  if(!lighting||![ax,ay,bx,by,pitch,relief,lighting.x,lighting.y]
    .every(Number.isFinite)||pitch<=0)return null;
  const dx=bx-ax,dy=by-ay,length=Math.hypot(dx,dy);
  if(length<.75||!Number.isFinite(length))return null;
  const nx=-dy/length,ny=dx/length;
  const facing=clamp(nx*lighting.x+ny*lighting.y,-1,1);
  const height=Math.min(pitch*.52,pitch*(.1+.32*clamp(relief/100,0,1)));
  const reach=Math.min(pitch*.44,sandShadowReach(height));
  // Normals and specular glint track stitch orientation, not a fixed
  // top-left diagonal. The same lamp elevation projects a bounded, opposing
  // contact shade without moving any authored stitch stations.
  const diffuse=sandCapDiffuse(lighting,nx*.72,ny*.72);
  return {
    side:facing>=0?1:-1,facing,height,reach,
    shadowX:-lighting.x*reach,shadowY:-lighting.y*reach,
    highlightX:lighting.x*reach*.72,highlightY:lighting.y*reach*.72,
    shine:lighting.light*(.45+.55*Math.abs(facing))*(.55+.45*diffuse),
    shade:lighting.shadow,highRgb:lighting.high,shadeRgb:lighting.shade
  };
}
