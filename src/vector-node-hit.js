// Vector node, handle and segment picking for the forthcoming true-cubic
// Draw editor. Only hit tolerances and pointer projection use CSS pixels.
// Authored point coordinates remain normalized 600 x 1300 design geometry.
import {normalizeVectorPath,flattenVectorPath,pointOnVectorSegment} from './vector-path-commands.js';

const finite=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const out=(id,side,point)=>({kind:'handle',id,side,point});
const node=(id,point)=>({kind:'node',id,point});
const validRadius=(n,max)=>Number.isFinite(n)&&n>0&&n<=max;
const order=(a,b)=>a.distanceCss-b.distanceCss||a.order-b.order;

// Normalize topology once. Each true cubic control belongs to an authored
// node, including the closing cubic whose destination is the START node.
// 'Corner' has collapsed zero-length handles; do not hit a phantom handle.
export function vectorNodeTargets(input){
  const path=normalizeVectorPath(input);
  if(!path)return null;
  const nodes=[node(path.start.id,path.start.point)];
  for(const seg of path.segments)nodes.push(node(seg.to.id,seg.to.point));
  const handles=[];
  for(let i=0;i<path.segments.length;i++){
    const seg=path.segments[i];
    if(seg.kind!=='cubic')continue;
    const start=nodes[i],end=nodes[i+1];
    if(dist(start.point,seg.controlOut)>1e-10&&
        path.nodeModes[start.id]!=='corner')
      handles.push(out(start.id,'out',seg.controlOut));
    if(dist(end.point,seg.controlIn)>1e-10&&
        path.nodeModes[end.id]!=='corner')
      handles.push(out(end.id,'in',seg.controlIn));
  }
  if(path.closed&&path.closing.kind==='cubic'){
    const end=nodes.at(-1),start=nodes[0],last=path.closing;
    if(dist(end.point,last.controlOut)>1e-10&&
        path.nodeModes[end.id]!=='corner')
      handles.push(out(end.id,'out',last.controlOut));
    if(dist(start.point,last.controlIn)>1e-10&&
        path.nodeModes[start.id]!=='corner')
      handles.push(out(start.id,'in',last.controlIn));
  }
  return {nodes,handles,closed:path.closed};
}

/** Pure touch picking. `project` is the ART->CSS transform owned by the
 * viewport; it is never persisted or inferred from raster output dimensions.
 * Node centers win against tangents to avoid stealing another real node.
 * Only selected-node handles are active; all node overlaps can be cycled.
 * An active pointer gesture must freeze its original target at pointerdown.
 */
export function hitVectorEditTarget(input,pointer,{
  project,selectedId=null,cycle=0,nodeRadiusCss=22,
  handleRadiusCss=18,segmentRadiusCss=12,sampleTolerance=.55,
}={}){
  if(!finite(pointer)||typeof project!=='function'||
      !Number.isInteger(cycle)||cycle<0||cycle>10000||
      !validRadius(nodeRadiusCss,100)||!validRadius(handleRadiusCss,100)||
      !validRadius(segmentRadiusCss,100))return null;
  const targets=vectorNodeTargets(input);
  if(!targets)return null;
  const projected=p=>{
    let q;
    try{q=project(p);}catch{return null;}
    return finite(q)?q:null;
  };
  const nodeHits=[];
  for(const [orderIndex,item] of targets.nodes.entries()){
    const pos=projected(item.point);
    if(!pos)continue;
    const distanceCss=dist(pointer,pos);
    if(distanceCss<=nodeRadiusCss)
      nodeHits.push({...item,distanceCss,order:orderIndex});
  }
  if(nodeHits.length){
    nodeHits.sort(order);
    const chosen=nodeHits[cycle%nodeHits.length];
    return {kind:'node',id:chosen.id,point:chosen.point.slice(),
      distanceCss:chosen.distanceCss,overlaps:nodeHits.map(item=>item.id)};
  }
  if(selectedId!==null){
    let nearest=null;
    for(const [orderIndex,item] of targets.handles.entries()){
      if(item.id!==selectedId)continue;
      const pos=projected(item.point);
      if(!pos)continue;
      const distanceCss=dist(pointer,pos);
      if(distanceCss>handleRadiusCss)continue;
      const candidate={...item,distanceCss,order:orderIndex};
      if(!nearest||order(candidate,nearest)<0)nearest=candidate;
    }
    if(nearest)return {kind:'handle',id:nearest.id,side:nearest.side,
      point:nearest.point.slice(),distanceCss:nearest.distanceCss};
  }
  // Screen-space sampled chords choose the branch under the finger. Their
  // segmentIndex and local t refer to *true* cubic segments, so splitting a
  // segment later is exact despite a bounded hit tolerance.
  const flattened=flattenVectorPath(input,{tolerance:sampleTolerance});
  if(!flattened)return null;
  let nearest=null;
  for(let i=1;i<flattened.points.length;i++){
    const prev=projected(flattened.points[i-1]);
    const next=projected(flattened.points[i]);
    if(!prev||!next)continue;
    const vx=next[0]-prev[0],vy=next[1]-prev[1],
      wx=pointer[0]-prev[0],wy=pointer[1]-prev[1];
    const u=clamp((wx*vx+wy*vy)/(vx*vx+vy*vy||1),0,1);
    const distanceCss=Math.hypot(wx-u*vx,wy-u*vy);
    if(distanceCss>segmentRadiusCss)continue;
    const param=flattened.sampleParameters[i],
      previous=flattened.sampleParameters[i-1];
    const t0=previous.segmentIndex===param.segmentIndex?previous.t:0;
    const t=t0+(param.t-t0)*u;
    if(!nearest||distanceCss<nearest.distanceCss)
      nearest={kind:'segment',segmentIndex:param.segmentIndex,t,
        distanceCss};
  }
  if(!nearest)return null;
  // A valid segment hit only suggests where to insert. Keep the control
  // parameter inside the open interval to prevent duplicate endpoint nodes.
  return {...nearest,t:clamp(nearest.t,1e-7,1-1e-7)};
}
