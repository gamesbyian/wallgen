// Canonical, resolution-independent source geometry for future Draw node editing.
// Pure module: saved recipe format is unchanged until all consumers migrate.
// Normalized points use the existing 600 × 1300 design coordinate plane.
export const VECTOR_PATH_WIDTH=600;
export const VECTOR_PATH_HEIGHT=1300;
export const VECTOR_PATH_MIN=-2;
export const VECTOR_PATH_MAX=3;
export const VECTOR_PATH_MAX_SEGMENTS=128;
export const VECTOR_PATH_MAX_SAMPLES=4096;
export const VECTOR_NODE_MODES=Object.freeze(['corner','mirrored','aligned','independent']);
const modes=new Set(VECTOR_NODE_MODES);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const point=p=>Array.isArray(p)&&p.length===2&&p.every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=VECTOR_PATH_MIN&&v<=VECTOR_PATH_MAX);
const copy=p=>p.slice();
const idOK=id=>typeof id==='string'&&/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(id);
const metric=(a,b)=>Math.hypot((a[0]-b[0])*VECTOR_PATH_WIDTH,(a[1]-b[1])*VECTOR_PATH_HEIGHT);
const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
const hasKeys=(o,keys)=>Object.keys(o).every(k=>keys.includes(k));
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);

/** Reject malformed/ambiguous geometry instead of silently truncating. */
export function normalizeVectorPath(input){
  if(!record(input)||input.space!=='normalized-design'||typeof input.closed!=='boolean'||
     !record(input.start)||!idOK(input.start.id)||!point(input.start.point)||
     !Array.isArray(input.segments)||input.segments.length<1||
     input.segments.length>VECTOR_PATH_MAX_SEGMENTS||
     !hasKeys(input,['space','closed','start','segments','closing','nodeModes'])||
     !hasKeys(input.start,['id','point']))return null;
  const ids=new Set([input.start.id]);
  const segments=[];
  for(const s of input.segments){
    if(!record(s)||!record(s.to)||!idOK(s.to.id)||ids.has(s.to.id)||
       !point(s.to.point)||!hasKeys(s.to,['id','point']))return null;
    const cubic=s.kind==='cubic';
    if(s.kind!=='line'&&!cubic)return null;
    if(!hasKeys(s,cubic?['kind','to','controlOut','controlIn']:['kind','to'])||
       (cubic&&(!point(s.controlOut)||!point(s.controlIn))))return null;
    ids.add(s.to.id);
    segments.push(cubic?{kind:'cubic',to:{id:s.to.id,point:copy(s.to.point)},
      controlOut:copy(s.controlOut),controlIn:copy(s.controlIn)}:
      {kind:'line',to:{id:s.to.id,point:copy(s.to.point)}});
  }
  if(!input.closed&&input.closing!==undefined)return null;
  if(input.closed&&(!record(input.closing)||
      !['line','cubic'].includes(input.closing.kind)||
      !hasKeys(input.closing,input.closing.kind==='line'?['kind']:['kind','controlOut','controlIn'])||
      (input.closing.kind==='cubic'&&(!point(input.closing.controlOut)||!point(input.closing.controlIn)))))return null;
  const nodeModes={};
  if(input.nodeModes!==undefined){
    if(!record(input.nodeModes)||Object.keys(input.nodeModes).length>ids.size)return null;
    for(const [id,mode] of Object.entries(input.nodeModes)){
      if(!ids.has(id)||!modes.has(mode))return null;
      if(mode!=='independent')nodeModes[id]=mode;
    }
  }
  return {space:'normalized-design',start:{id:input.start.id,point:copy(input.start.point)},
    segments,closed:input.closed,nodeModes,
    ...(input.closed?{closing:input.closing.kind==='line'?{kind:'line'}:{kind:'cubic',
      controlOut:copy(input.closing.controlOut),controlIn:copy(input.closing.controlIn)}}:{})};
}

/** Exact line-command import; never infer a curve or closure from endpoint proximity. */
export function vectorPathFromPolyline(points,{closed=false}={}){
  if(!Array.isArray(points)||points.length<2||points.length>VECTOR_PATH_MAX_SEGMENTS+1||
     !points.every(point)||typeof closed!=='boolean')return null;
  return normalizeVectorPath({space:'normalized-design',closed,start:{id:'n0',point:points[0]},
    segments:points.slice(1).map((p,i)=>({kind:'line',to:{id:'n'+(i+1),point:p}})),
    ...(closed?{closing:{kind:'line'}}:{})});
}

function halves(p0,p1,p2,p3){
  const a=lerp(p0,p1,.5),b=lerp(p1,p2,.5),c=lerp(p2,p3,.5);
  const d=lerp(a,b,.5),e=lerp(b,c,.5),m=lerp(d,e,.5);
  return [[p0,a,d,m],[m,e,c,p3]];
}
function flatness(p0,p1,p2,p3){
  const vx=(p3[0]-p0[0])*VECTOR_PATH_WIDTH,vy=(p3[1]-p0[1])*VECTOR_PATH_HEIGHT;
  const l2=vx*vx+vy*vy;
  const dev=p=>{
    const wx=(p[0]-p0[0])*VECTOR_PATH_WIDTH,wy=(p[1]-p0[1])*VECTOR_PATH_HEIGHT;
    const t=clamp(l2?(wx*vx+wy*vy)/l2:0,0,1);
    return Math.hypot(wx-t*vx,wy-t*vy);
  };
  const chord=metric(p0,p3),polygon=metric(p0,p1)+metric(p1,p2)+metric(p2,p3);
  return Math.max(dev(p1),dev(p2),(polygon-chord)*.5);
}

/** Deterministic De Casteljau flattening. Tolerance is in design units;
 * zoom never affects sampling. Fail closed on cap/depth exhaustion. */
export function flattenVectorPath(input,{tolerance=.65,maxSamples=VECTOR_PATH_MAX_SAMPLES,maxDepth=16}={}){
  const path=normalizeVectorPath(input);
  if(!path||!Number.isFinite(tolerance)||tolerance<=0||tolerance>16||
    !Number.isInteger(maxSamples)||maxSamples<2||maxSamples>VECTOR_PATH_MAX_SAMPLES||
    !Number.isInteger(maxDepth)||maxDepth<1||maxDepth>20)return null;
  const samples=[copy(path.start.point)];
  const stationIndices={[path.start.id]:0};
  const sampleParameters=[{segmentIndex:0,t:0}];
  const append=(p,segmentIndex,t)=>{
    if(samples.length>=maxSamples)return false;
    samples.push(copy(p));sampleParameters.push({segmentIndex,t});return true;
  };
  const flattenCubic=(p0,p1,p2,p3,segmentIndex)=>{
    const stack=[{ps:[p0,p1,p2,p3],depth:0,t0:0,t1:1}];
    while(stack.length){
      const {ps,depth,t0,t1}=stack.pop();
      if(flatness(...ps)<=tolerance){
        if(!append(ps[3],segmentIndex,t1))return false;
        continue;
      }
      if(depth>=maxDepth)return false;
      const [left,right]=halves(...ps),mid=(t0+t1)/2;
      stack.push({ps:right,depth:depth+1,t0:mid,t1},
        {ps:left,depth:depth+1,t0,t1:mid});
    }
    return true;
  };
  let previous=path.start.point;
  for(const [index,seg] of path.segments.entries()){
    if(!(seg.kind==='line'?append(seg.to.point,index,1):
      flattenCubic(previous,seg.controlOut,seg.controlIn,seg.to.point,index)))return null;
    stationIndices[seg.to.id]=samples.length-1;
    previous=seg.to.point;
  }
  if(path.closed){
    const last=path.closing;
    if(!(last.kind==='line'?append(path.start.point,path.segments.length,1):
      flattenCubic(previous,last.controlOut,last.controlIn,path.start.point,
        path.segments.length)))return null;
  }
  return {points:samples,stationIndices,sampleParameters,closed:path.closed,
    segments:path.segments.length+(path.closed?1:0)};
}

/** World-coordinate adapter for the existing ribbon and text-path sampling engine. */
export function prepareVectorDrawnPath(input,options){
  const result=flattenVectorPath(input,options);
  if(!result)return null;
  const points=result.points.map(([x,y])=>({x:x*VECTOR_PATH_WIDTH-VECTOR_PATH_WIDTH/2,
    y:y*VECTOR_PATH_HEIGHT-VECTOR_PATH_HEIGHT/2}));
  const lengths=[0];
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i];
    lengths.push(lengths.at(-1)+Math.hypot(b.x-a.x,b.y-a.y));
  }
  if(lengths.at(-1)<=0)return null;
  return {points,lengths,total:lengths.at(-1),closed:result.closed,
    stationIndices:result.stationIndices};
}

/** Exact point on a particular authored line/cubic, including explicit closure. */
export function pointOnVectorSegment(input,index,t){
  const path=normalizeVectorPath(input);
  if(!path||!Number.isInteger(index)||index<0||
      index>=path.segments.length+(path.closed?1:0)||
      !Number.isFinite(t)||t<0||t>1)return null;
  return evaluateNormalizedSegment(path,index,t);
}
function evaluateNormalizedSegment(path,index,t){
  const closing=index===path.segments.length;
  const seg=closing?path.closing:path.segments[index];
  const start=index===0?path.start.point:path.segments[index-1].to.point;
  const end=closing?path.start.point:seg.to.point;
  if(seg.kind==='line')return lerp(start,end,t);
  const q0=lerp(start,seg.controlOut,t),q1=lerp(seg.controlOut,seg.controlIn,t),
    q2=lerp(seg.controlIn,end,t),r0=lerp(q0,q1,t),r1=lerp(q1,q2,t);
  return lerp(r0,r1,t);
}

/** Nearest true authored cubic segment/t for insertion. Disambiguate crossing
 * branches using bounded vector-space samples, then refine the subinterval. */
export function nearestVectorSegment(input,query,options){
  const path=normalizeVectorPath(input);
  if(!path||!Array.isArray(query)||query.length!==2||
    !query.every(n=>Number.isFinite(n)&&Math.abs(n)<100))return null;
  const flat=flattenVectorPath(path,options);
  if(!flat)return null;
  let nearest=null;
  for(let i=1;i<flat.points.length;i++){
    const a=flat.points[i-1],b=flat.points[i],param=flat.sampleParameters[i];
    const previous=flat.sampleParameters[i-1];
    const t0=previous.segmentIndex===param.segmentIndex?previous.t:0;
    const vx=(b[0]-a[0])*VECTOR_PATH_WIDTH,vy=(b[1]-a[1])*VECTOR_PATH_HEIGHT;
    const wx=(query[0]-a[0])*VECTOR_PATH_WIDTH,wy=(query[1]-a[1])*VECTOR_PATH_HEIGHT;
    const u=clamp((wx*vx+wy*vy)/(vx*vx+vy*vy||1),0,1);
    const dist=Math.hypot(wx-u*vx,wy-u*vy);
    if(!nearest||dist<nearest.distance){
      nearest={segmentIndex:param.segmentIndex,t0,t1:param.t,
        estimate:t0+(param.t-t0)*u,distance:dist};
    }
  }
  if(!nearest)return null;
  const index=nearest.segmentIndex;
  const cost=t=>metric(evaluateNormalizedSegment(path,index,t),query);
  let lo=nearest.t0,hi=nearest.t1;
  for(let k=0;k<22;k++){
    const c=hi-(hi-lo)*.6180339887498948,d=lo+(hi-lo)*.6180339887498948;
    if(cost(c)<=cost(d))hi=d;else lo=c;
  }
  const choices=[lo,(lo+hi)/2,hi,nearest.estimate,nearest.t0,nearest.t1];
  let best=null;
  for(const t of choices){
    const distance=cost(t);
    if(!best||distance<best.distanceDesign)best={segmentIndex:index,t,
      point:evaluateNormalizedSegment(path,index,t),distanceDesign:distance};
  }
  return best;
}

function nodeLocation(path,id){
  if(path.start.id===id)return {at:path.start.point,index:-1};
  const index=path.segments.findIndex(s=>s.to.id===id);
  return index<0?null:{at:path.segments[index].to.point,index};
}
const oppositeSide=s=>s==='in'?'out':'in';
const asEuclidean=v=>[v[0]*VECTOR_PATH_WIDTH,v[1]*VECTOR_PATH_HEIGHT];
const fromEuclidean=v=>[v[0]/VECTOR_PATH_WIDTH,v[1]/VECTOR_PATH_HEIGHT];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]];
function handleRef(path,id,side){
  const at=nodeLocation(path,id);
  if(!at||!['in','out'].includes(side))return null;
  const index=at.index;
  if(side==='in'){
    if(index>=0){const s=path.segments[index];return s.kind==='cubic'?{seg:s,key:'controlIn'}:null;}
    if(path.closed&&path.closing.kind==='cubic')return {seg:path.closing,key:'controlIn'};
    return null;
  }
  const next=path.segments[index+1];
  if(next)return next.kind==='cubic'?{seg:next,key:'controlOut'}:null;
  if(path.closed&&path.closing.kind==='cubic')return {seg:path.closing,key:'controlOut'};
  return null;
}
export function moveVectorNode(input,id,next){
  const path=normalizeVectorPath(input);
  if(!path||!point(next)||!idOK(id))return null;
  const p=nodeLocation(path,id);
  if(!p)return null;
  const delta=sub(next,p.at),refs=['in','out'].map(side=>handleRef(path,id,side)).filter(Boolean);
  if(refs.some(({seg,key})=>!point(add(seg[key],delta))))return null;
  for(const {seg,key} of refs)seg[key]=add(seg[key],delta);
  if(p.index<0)path.start.point=copy(next);
  else path.segments[p.index].to.point=copy(next);
  return path;
}

/** Aligned/mirrored continuity is enforced in Euclidean 600×1300 design units. */
export function moveVectorHandle(input,id,side,next){
  const path=normalizeVectorPath(input);
  if(!path||!point(next)||!idOK(id)||!['in','out'].includes(side))return null;
  const loc=nodeLocation(path,id),ref=handleRef(path,id,side);
  if(!loc||!ref)return null;
  const mode=Object.hasOwn(path.nodeModes,id)?path.nodeModes[id]:'independent';
  const opposite=handleRef(path,id,oppositeSide(side));
  const proposed=[];
  if(opposite&&(mode==='aligned'||mode==='mirrored')){
    const center=asEuclidean(loc.at),v=sub(asEuclidean(next),center),len=Math.hypot(...v);
    const previous=sub(asEuclidean(opposite.seg[opposite.key]),center);
    if(len===0)return null;
    const magnitude=mode==='mirrored'?len:Math.hypot(...previous);
    const other=fromEuclidean(add(center,v.map(x=>-x/len*magnitude)));
    if(!point(other))return null;
    proposed.push({seg:opposite.seg,key:opposite.key,to:other});
  }
  proposed.push({seg:ref.seg,key:ref.key,to:copy(next)});
  for(const p of proposed)p.seg[p.key]=p.to;
  // Pulling a collapsed Corner's handle creates a genuinely independent
  // tangent. Corner and Independent cannot be cosmetic aliases.
  if(mode==='corner'&&metric(loc.at,next)>1e-9)delete path.nodeModes[id];
  return path;
}
export function setVectorNodeMode(input,id,mode){
  const path=normalizeVectorPath(input);
  if(!path||!nodeLocation(path,id)||!modes.has(mode))return null;
  if(mode==='independent')delete path.nodeModes[id];else path.nodeModes[id]=mode;
  const origin=nodeLocation(path,id).at;
  const out=handleRef(path,id,'out'),inp=handleRef(path,id,'in');
  if(mode==='corner'){
    // A real Corner has collapsed cubic tangent controls at the node.
    if(out)out.seg[out.key]=copy(origin);
    if(inp)inp.seg[inp.key]=copy(origin);
    return path;
  }
  // Endpoints and line-to-cubic joins have no opposite tangent to constrain.
  if((mode==='aligned'||mode==='mirrored')&&(!out||!inp))return null;
  if((mode==='aligned'||mode==='mirrored')&&out&&inp){
    let next=out.seg[out.key];
    if(metric(origin,next)<1e-9){
      const prior=inp.seg[inp.key];
      if(metric(origin,prior)>1e-9){
        next=[2*origin[0]-prior[0],2*origin[1]-prior[1]];
      }else{
        // Reopen a collapsed corner using genuine 600x1300 design-space
        // chord direction, not a bounding-box percentage or screen pixel.
        const location=nodeLocation(path,id),i=location.index;
        const prev=i<0?(path.closed?path.segments.at(-1).to.point:null):
          i===0?path.start.point:path.segments[i-1].to.point;
        const following=i<0?path.segments[0].to.point:
          i+1<path.segments.length?path.segments[i+1].to.point:
          path.closed?path.start.point:null;
        if(!prev||!following)return path;
        const v=asEuclidean(sub(following,prev)),len=Math.hypot(...v);
        if(len<1e-8)return null;
        const base=asEuclidean(origin),reach=Math.min(40,Math.max(12,
          Math.min(metric(origin,prev),metric(origin,following))*.35));
        next=fromEuclidean(add(base,v.map(x=>x/len*reach)));
      }
      if(!point(next))return null;
    }
    return moveVectorHandle(path,id,'out',next);
  }
  return path;
}

/** Stable existing IDs; exact De Casteljau splitting preserves cubic shape. */
export function splitVectorSegment(input,index,t,newId){
  const path=normalizeVectorPath(input);
  if(!path||!Number.isInteger(index)||index<0||
     index>=path.segments.length+(path.closed?1:0)||
     !Number.isFinite(t)||t<=0||t>=1||!idOK(newId)||nodeLocation(path,newId)||
     path.segments.length>=VECTOR_PATH_MAX_SEGMENTS)return null;
  const closing=index===path.segments.length;
  const seg=closing?path.closing:path.segments[index];
  const a=index===0?path.start.point:
    path.segments[index-1].to.point;
  const end=closing?path.start.point:seg.to.point;
  if(seg.kind==='line'){
    const middle=lerp(a,end,t);
    if(closing){
      // The former seam's first half becomes a regular segment; the
      // second half remains the explicit closure to the ORIGINAL start ID.
      path.segments.push({kind:'line',to:{id:newId,point:middle}});
    }else{
      path.segments.splice(index,1,{kind:'line',to:{id:newId,point:middle}},seg);
    }
  }else{
    const p0=a,p1=seg.controlOut,p2=seg.controlIn,p3=end;
    const p01=lerp(p0,p1,t),p12=lerp(p1,p2,t),p23=lerp(p2,p3,t);
    const p012=lerp(p01,p12,t),p123=lerp(p12,p23,t),p=lerp(p012,p123,t);
    const first={kind:'cubic',to:{id:newId,point:p},
      controlOut:p01,controlIn:p012};
    if(closing){
      path.segments.push(first);
      path.closing={kind:'cubic',controlOut:p123,controlIn:p23};
    }else{
      path.segments.splice(index,1,first,
        {kind:'cubic',to:seg.to,controlOut:p123,controlIn:p23});
    }
    // Split cubics have collinear true tangents at the new node. Handles
    // remain explicit and editable, including at a closed-path seam.
    path.nodeModes[newId]='aligned';
  }
  return normalizeVectorPath(path);
}
