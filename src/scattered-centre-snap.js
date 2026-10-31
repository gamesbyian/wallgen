// Adapt the EXISTING node alignment magnet to movable scattered-object
// centres. The source model and its imported compound geometry are unchanged;
// only the pointer proposal is adjusted during an explicitly armed gesture.
import {snapVectorNode} from './vector-node-snap.js';
import {scatteredWorldToPixel} from './scattered-drag.js';

export function snapScatteredCentre(proposal,objects,movingId,recipe,view,
  {enabled=false,axis=null,previous=null}={}){
  const point=Array.isArray(proposal)&&proposal.length===2&&
    proposal.every(Number.isFinite)?proposal.slice():null;
  const fallback={point,locks:{x:null,y:null}};
  if(!enabled||!point||!view||!
    [view.canvasWidth,view.canvasHeight,view.cssWidth,view.cssHeight]
      .every(n=>Number.isFinite(n)&&n>0))return fallback;
  const candidates=[];
  for(const object of objects||[]){
    if(object?.id===movingId||object?.kind!=='region')continue;
    const circle=object.circle||object.editCircle;
    if(!Number.isFinite(circle?.cx)||!Number.isFinite(circle?.cy))continue;
    candidates.push({id:object.id,point:[circle.cx,circle.cy]});
  }
  // The artboard's design centre is stable even when a camera is panned.
  // It is only a guide: never store it as a scene object or recipe field.
  candidates.push({id:'design-centre',point:[300,650]});
  const project=([x,y])=>{
    const p=scatteredWorldToPixel(recipe,view.canvasWidth,view.canvasHeight,x,y);
    return [p.x*view.cssWidth/view.canvasWidth,
      p.y*view.cssHeight/view.canvasHeight];
  };
  return snapVectorNode(point,candidates,{project,enabled:true,axis,previous});
}
