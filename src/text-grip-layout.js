// Editor-only 44px compact text controls. All station and viewport math is
// CSS-pixel geometry, never part of the canonical wallpaper recipe/painter.
const finite=x=>Number.isFinite(x);
const shortest=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function compactTextGripLayout({
  canvasWidth,canvasHeight,centreX,centreY,frameWidth,frameHeight,
  rotation=0,buttonSize=44
}){
  const values=[canvasWidth,canvasHeight,centreX,centreY,frameWidth,
    frameHeight,rotation,buttonSize];
  if(values.some(v=>!finite(v))||canvasWidth<=0||canvasHeight<=0||
    frameWidth<=0||frameHeight<=0||buttonSize<20)throw Error('Invalid compact text grip dimensions');
  const hw=frameWidth/2,hh=frameHeight/2;
  const reach=buttonSize/2+24; // a full grip radius plus ink-clearance
  const angle=rotation*Math.PI/180;
  const cos=Math.cos(angle),sin=Math.sin(angle);
  const local=(x,y)=>({x,y});
  const rotations=[
    local(0,-hh-reach),local(0,hh+reach),
    local(-hw-reach,0),local(hw+reach,0),
    local(-hw-reach,-hh-reach),local(hw+reach,-hh-reach),
    local(-hw-reach,hh+reach),local(hw+reach,hh+reach)
  ];
  const scales=[
    local(hw+reach,hh+reach),local(-hw-reach,hh+reach),
    local(hw+reach,-hh-reach),local(-hw-reach,-hh-reach),
    local(hw+reach*2,0),local(-hw-reach*2,0),
    local(0,hh+reach*2),local(0,-hh-reach*2)
  ];
  const project=p=>({x:centreX+p.x*cos-p.y*sin,
    y:centreY+p.x*sin+p.y*cos});
  const radius=buttonSize/2;
  const margin=p=>Math.min(p.x-radius,canvasWidth-radius-p.x,
    p.y-radius,canvasHeight-radius-p.y);
  let chosen=null,closest=-Infinity;
  for(let i=0;i<rotations.length;i++)for(let j=0;j<scales.length;j++){
    const rotate=project(rotations[i]),scale=project(scales[j]);
    const separation=shortest(rotate,scale);
    if(separation<buttonSize+4)continue;
    const clearance=Math.min(margin(rotate),margin(scale));
    // Candidate order favors familiar above / bottom-right handles when safe.
    // Prefer any two *fully reachable* buttons over a prettier clipped pair.
    if(clearance>=0)
      return {rotate:toCss(rotations[i],hw,hh,radius),
        scale:toCss(scales[j],hw,hh,radius),
        separation,edgeClearance:clearance,reachable:true};
    const score=clearance*100-i*8-j;
    if(score>closest){closest=score;chosen={rotate:rotations[i],
      scale:scales[j],separation,edgeClearance:clearance};}
  }
  if(!chosen)throw Error('Unable to separate compact text grips');
  return {rotate:toCss(chosen.rotate,hw,hh,radius),
    scale:toCss(chosen.scale,hw,hh,radius),
    separation:chosen.separation,edgeClearance:chosen.edgeClearance,
    reachable:false};
}
function toCss(point,hw,hh,radius){
  return {left:hw+point.x-radius,top:hh+point.y-radius};
}
