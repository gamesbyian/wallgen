// CSS-screen magnetic alignment of text anchors. Canonical text geometry
// remains finished-artwork percentages, independent of the viewport camera.
import {DESIGN_WIDTH,DESIGN_HEIGHT} from './model.js';
import {textOverlayPaintsInk} from './text-rainbow-shaping.js';
import {snapVectorNode} from './vector-node-snap.js';
const finitePoint=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
export function snapTextAnchor(proposal,items,movingId,view,
  {enabled=false,axis=null,previous=null}={}){
  const point=finitePoint(proposal)?proposal.slice():null;
  const fallback={point,locks:{x:null,y:null}};
  if(!enabled||!point||!Number.isFinite(view?.cssWidth)||
     !Number.isFinite(view?.cssHeight)||view.cssWidth<=0||view.cssHeight<=0)
    return fallback;
  const guides=[];
  for(const item of Array.isArray(items)?items:[]){
    if(!item||item.id===movingId||typeof item.id!=='string'||
       !textOverlayPaintsInk(item)||!Number.isFinite(item.x)||
       !Number.isFinite(item.y))continue;
    guides.push({id:'text:'+item.id,
      point:[DESIGN_WIDTH*item.x/100,DESIGN_HEIGHT*item.y/100]});
  }
  guides.push({id:'design-centre',point:[DESIGN_WIDTH/2,DESIGN_HEIGHT/2]});
  return snapVectorNode(point,guides,{enabled:true,axis,previous,
    project:p=>[p[0]*view.cssWidth/DESIGN_WIDTH,
      p[1]*view.cssHeight/DESIGN_HEIGHT]});
}
