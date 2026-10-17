import { DESIGN_WIDTH, DESIGN_HEIGHT } from './model.js';

// A camera maps the same infinite logical composition into the fixed wallpaper
// frame. Scaling a previously clipped HTML canvas cannot reveal lost ink.
export function viewCamera(width,height,zoom=1){
  const z=Math.max(.5,Math.min(2.5,Number(zoom)||1));
  const scaleX=width/DESIGN_WIDTH*z,scaleY=height/DESIGN_HEIGHT*z;
  const offsetX=(width-DESIGN_WIDTH*scaleX)/2;
  const offsetY=(height-DESIGN_HEIGHT*scaleY)/2;
  return {
    zoom:z,scaleX,scaleY,offsetX,offsetY,
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
