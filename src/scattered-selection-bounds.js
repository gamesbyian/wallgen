// Selection guide geometry only. Use the existing authored region rings and
// circle/editCircle transform; never derive model bounds from rendered pixels.
// The guide is disposable UI and has no effect on hit testing or export.
const finite=Number.isFinite;
function validCircle(circle){
  return circle&&[circle.cx,circle.cy,circle.r].every(finite)&&circle.r>0;
}
export function scatteredSelectionBounds(object,proposal){
  if(!object||typeof object!=='object')return null;
  const original=object.circle||object.editCircle;
  const current=proposal||original;
  if(!validCircle(original)||!validCircle(current))return null;
  const circleBounds={minX:current.cx-current.r,minY:current.cy-current.r,
    maxX:current.cx+current.r,maxY:current.cy+current.r,isCompound:false};
  if(!object.editCircle||!Array.isArray(object.rings)||!object.rings.length)
    return circleBounds;
  // Imported silhouettes can contain distant islands, concavities and holes.
  // Every ring is already in absolute model-space coordinates, positioned
  // using the very same editCircle that the source override changes.
  const factor=current.r/original.r;
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity,count=0;
  for(const ring of object.rings){
    if(!Array.isArray(ring))return circleBounds;
    for(const point of ring){
      if(!finite(point?.x)||!finite(point?.y))return circleBounds;
      const x=current.cx+(point.x-original.cx)*factor;
      const y=current.cy+(point.y-original.cy)*factor;
      if(!finite(x)||!finite(y))return circleBounds;
      minX=Math.min(minX,x);minY=Math.min(minY,y);
      maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
      count++;
    }
  }
  if(count<3||maxX-minX<=0||maxY-minY<=0)return circleBounds;
  return {minX,minY,maxX,maxY,isCompound:true};
}
