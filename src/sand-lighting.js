// One directional light for deposited mineral grains, raised beads and rim
// topology. No second light control, source bitmap, or geometry model.
// Coordinates and magnitudes are logical design units, never output pixels.
const ROOT_HALF=Math.SQRT1_2;
const clamp=v=>Math.min(1,Math.max(0,Number.isFinite(v)?v:0));
const palettes={
  daylight:{high:'255,255,242',shade:'22,28,48'},
  golden:{high:'255,212,154',shade:'49,34,70'},
  moonlight:{high:'177,207,255',shade:'13,23,62'}
};
/** Light x/y point TOWARDS the incoming light in the final unmirrored canvas.
 * Direction names are interpreted exactly as the existing atmosphere pass. */
export function sandLighting(scene){
  const colours=palettes[scene?.lightingMood];
  if(!colours)return null; // preserves existing unlit sand pixels
  const light=clamp((Number(scene.lightStrength)||0)/100);
  const shadow=clamp((Number(scene.shadowStrength)||0)/100);
  if(!light&&!shadow)return null;
  const direction=scene.lightDirection||'top-left';
  const x=(direction.endsWith('right')?1:-1)*ROOT_HALF;
  const y=(direction.startsWith('bottom')?1:-1)*ROOT_HALF;
  return {x,y,light,shadow,...colours};
}
/** Convert final-screen illumination into the local coordinate frame of a
 * geometry/material transform; keep magnitude and colour unchanged. */
export function rotateSandLighting(lighting,angle=0,mirrorX=1,mirrorY=1){
  if(!lighting)return null;
  const c=Math.cos(angle),s=Math.sin(angle);
  const x=lighting.x*mirrorX,y=lighting.y*mirrorY;
  return {...lighting,x:c*x+s*y,y:-s*x+c*y};
}
/** Material is independently rotated in the existing foreground/background
 * surface compositor. Its grains must see the same physical screen light. */
export function sandMaterialLighting(scene,layer){
  const lighting=sandLighting(scene);
  return rotateSandLighting(lighting,(Number(layer?.rotation)||0)*Math.PI/180);
}
/** Ribbon geometry is rotated and optionally mirrored before compositing.
 * Region geometry is already in final artwork world coordinates. */
export function sandRibbonLighting(scene){
  return rotateSandLighting(sandLighting(scene),
    Number(scene?.angle)||0,
    scene?.mirrorHorizontal?-1:1,
    scene?.mirrorVertical?-1:1);
}

/** A unit hemispherical cap normal under the shared world-direction lamp.
 * nx/ny are the slope's horizontal components; the implicit positive z
 * component makes this a raised, opaque mineral surface, not a flat stamp.
 * One fixed elevation gives stable highlights without inventing a second
 * independent UI light or requiring a per-pixel height/ray buffer.
 * The response is geometry only: intensity/mood are applied by the painter. */
export function sandCapDiffuse(lighting,nx,ny){
  if(!lighting||![lighting.x,lighting.y,nx,ny].every(Number.isFinite))return 0;
  const r2=nx*nx+ny*ny;
  const z=Math.sqrt(Math.max(0,1-Math.min(1,r2)));
  const elevation=.68,lateral=Math.sqrt(1-elevation*elevation);
  return clamp(nx*lighting.x*lateral+ny*lighting.y*lateral+z*elevation);
}
