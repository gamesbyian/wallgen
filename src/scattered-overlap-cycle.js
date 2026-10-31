// Source-independent tapping arbitration. CSS pixels and time exist only in
// ephemeral editor state, never a wallpaper recipe or cached raster.
const finite=Number.isFinite;
function keyOf(hits){return hits.map(item=>item.id).join('|');}
export function continuesScatteredTapCycle(previous,hits,point,now,
  {distance=24,windowMs=1200}={}){
  if(!previous||!hits?.length||!point||
     ![point.x,point.y,now,distance,windowMs].every(finite)||
     distance<0||windowMs<0)return false;
  return previous.key===keyOf(hits)&&
    now>=previous.time&&now-previous.time<=windowMs&&
    Math.hypot(point.x-previous.x,point.y-previous.y)<=distance&&
    hits.some(item=>item.id===previous.selectedId);
}
/** Call on pointerup without movement only. A repeated tap selects the
 * next hit *underneath*, wrapping to the frontmost after the bottommost.
 * Holding and dragging the previous selection remains possible. */
export function advanceScatteredTapCycle(previous,hits,point,now){
  if(!hits?.length||!point||![point.x,point.y,now].every(finite))
    return {selected:null,state:null};
  const repeated=continuesScatteredTapCycle(previous,hits,point,now);
  const old=repeated?hits.findIndex(item=>item.id===previous.selectedId):-1;
  const index=(old+1)%hits.length;
  const selected=hits[index];
  return {selected,state:{key:keyOf(hits),selectedId:selected.id,
    x:point.x,y:point.y,time:now}};
}
