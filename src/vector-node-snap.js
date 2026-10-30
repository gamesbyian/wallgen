// Optional node-to-node alignment in CSS INTERACTION space, with authored
// coordinates stored solely in normalized design geometry. Never rasterize
// or quantize a creative coordinate to the current viewport.
const finite=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
export const SNAP_ACQUIRE_CSS=8;
export const SNAP_RELEASE_CSS=14;
export function snapVectorNode(proposal,otherNodes,{project,enabled=false,axis=null,
  previous=null,acquireCss=SNAP_ACQUIRE_CSS,releaseCss=SNAP_RELEASE_CSS}={}){
  const fallback={point:finite(proposal)?proposal.slice():null,locks:{x:null,y:null}};
  if(!enabled||!finite(proposal)||!Array.isArray(otherNodes)||
    typeof project!=='function'||!Number.isFinite(acquireCss)||
    !Number.isFinite(releaseCss)||acquireCss<=0||releaseCss<=acquireCss)
    return fallback;
  let screen;
  try{screen=project(proposal);}catch{return fallback;}
  if(!finite(screen))return fallback;
  const chosen={},point=proposal.slice();
  for(const [dimension,component] of [['x',0],['y',1]]){
    if(axis&&axis!==dimension){chosen[dimension]=null;continue;}
    const old=previous?.[dimension];
    let match=null;
    if(old){
      const candidate=otherNodes.find(n=>n.id===old.id&&finite(n.point));
      if(candidate){
        try{
          const target=project(candidate.point);
          if(finite(target)&&Math.abs(screen[component]-target[component])<=releaseCss)
            match={id:candidate.id,point:candidate.point};
        }catch{/* stale projected source, release it */}
      }
    }
    if(!match){
      let gap=acquireCss;
      for(const candidate of otherNodes){
        if(!candidate||typeof candidate.id!=='string'||!finite(candidate.point))continue;
        let target;try{target=project(candidate.point);}catch{continue;}
        if(!finite(target))continue;
        const delta=Math.abs(screen[component]-target[component]);
        if(delta<gap){gap=delta;match=candidate;}
      }
    }
    chosen[dimension]=match?{id:match.id,value:match.point[component]}:null;
    if(match)point[component]=match.point[component];
  }
  return {point,locks:chosen};
}
