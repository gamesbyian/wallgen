import { DESIGN_WIDTH, DESIGN_HEIGHT } from './model.js';

// A camera maps the same infinite logical composition into the fixed wallpaper
// frame. Scaling a previously clipped HTML canvas cannot reveal lost ink.
export function viewCamera(width,height,zoom=1,{panX=0,panY=0}={}){
  const z=Math.max(.5,Math.min(2.5,Number(zoom)||1));
  const scaleX=width/DESIGN_WIDTH*z,scaleY=height/DESIGN_HEIGHT*z;
  const percentage=value=>Number.isFinite(Number(value))
    ?Math.max(-50,Math.min(50,Number(value))):0;
  // Positive pan moves the camera toward greater world coordinates; the
  // displayed composition moves in the opposite screen direction. Camera
  // bounds are resolution invariant, unlike a translated clipped bitmap.
  const shiftX=DESIGN_WIDTH*percentage(panX)/100;
  const shiftY=DESIGN_HEIGHT*percentage(panY)/100;
  const offsetX=(width-DESIGN_WIDTH*scaleX)/2-shiftX*scaleX;
  const offsetY=(height-DESIGN_HEIGHT*scaleY)/2-shiftY*scaleY;
  return {
    zoom:z,scaleX,scaleY,offsetX,offsetY,shiftX,shiftY,
    viewBounds:{
      left:-offsetX/scaleX,top:-offsetY/scaleY,
      right:(width-offsetX)/scaleX,bottom:(height-offsetY)/scaleY,
    },
    boundsWithMargin(margin){
      return {
        left:(-margin.left-offsetX)/scaleX,
        right:(width+margin.right-offsetX)/scaleX,
        top:(-margin.top-offsetY)/scaleY,
        bottom:(height+margin.bottom-offsetY)/scaleY,
      };
    },
  };
}
