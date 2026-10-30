// Find a finger-sized drag target displaced from an authored vector anchor.
// All distances here are CSS *interaction* units after applying the canvas
// bitmap-to-screen scale; the saved point never gains a screen-pixel coordinate.
const finite=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
export const OFFSET_GRIP_RADIUS_CSS=22;
export const OFFSET_GRIP_REACH_CSS=58;
const directions=[
  [1,-1],[-1,-1],[1,1],[-1,1],[1,0],[-1,0],[0,-1],[0,1]
];
export function placeOffsetGrip({anchor,width,height,scale=1,obstacles=[],
  blockedRects=[],reach=OFFSET_GRIP_REACH_CSS,radius=OFFSET_GRIP_RADIUS_CSS}={}){
  if(!finite(anchor)||![width,height,scale,reach,radius].every(Number.isFinite)||
     Math.min(width,height,scale,reach,radius)<=0)return null;
  const pad=(radius+2)*scale,minClearance=(radius+17+2)*scale;
  // A selected node outside the visible canvas must not create a phantom
  // grip on the viewport edge.
  if(anchor[0]<0||anchor[1]<0||anchor[0]>width||anchor[1]>height)return null;
  let best=null;
  for(const [ix,iy] of directions){
    const len=Math.hypot(ix,iy),x=anchor[0]+ix/len*reach*scale,
      y=anchor[1]+iy/len*reach*scale;
    if(x<pad||x>width-pad||y<pad||y>height-pad)continue;
    if(obstacles.some(p=>finite(p)&&Math.hypot(p[0]-x,p[1]-y)<minClearance))
      continue;
    if(blockedRects.some(r=>r&&[r.x,r.y,r.width,r.height].every(Number.isFinite)&&
      x>=r.x-pad&&x<=r.x+r.width+pad&&
      y>=r.y-pad&&y<=r.y+r.height+pad))continue;
    const clearance=obstacles.reduce((nearest,p)=>finite(p)?
      Math.min(nearest,Math.hypot(p[0]-x,p[1]-y)):nearest,Infinity);
    const edge=Math.min(x-pad,width-pad-x,y-pad,height-pad-y);
    // Prefer clear space with slight bias for the top-right handle, while
    // keeping geometry deterministic independent of device pixel density.
    const score=Math.min(clearance,3*minClearance)+Math.min(edge,2*pad)*.15;
    if(best===null||score>best.score)
      best={x,y,score};
  }
  return best?{x:best.x,y:best.y,radius:radius*scale}:null;
}
