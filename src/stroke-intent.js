// Shape-aware assistance for high-strength finger strokes.
// Coordinates are normalized to the fixed 600 × 1300 design plane. All error
// measurements are performed in design pixels (not anisotropic normalized X/Y).
// No training data, timing, browser state or non-deterministic inference needed.
const W=600,H=1300,TAU=2*Math.PI;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const pixel=([x,y])=>[x*W,y*H];
const normalize=([x,y])=>[x/W,y/H];
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const interpolate=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
function statistics(points){
  const sum=points.reduce((s,p,i)=>i?s+dist(p,points[i-1]):0,0);
  return {length:sum,chord:dist(points[0],points.at(-1))};
}
function lineCandidate(p){
  if(p.length<5)return null;
  const n=p.length,head=p.slice(0,Math.min(5,n)),
    tail=p.slice(Math.max(0,n-5));
  const average=arr=>arr.reduce((a,b)=>[a[0]+b[0]/arr.length,a[1]+b[1]/arr.length],[0,0]);
  const a=average(head),b=average(tail),dx=b[0]-a[0],dy=b[1]-a[1];
  const length=Math.hypot(dx,dy);
  if(length<48)return null;
  const ux=dx/length,uy=dy/length;
  let squared=0,largest=0;
  for(const [x,y] of p){
    const error=Math.abs((x-a[0])*uy-(y-a[1])*ux);
    squared+=error**2;
    largest=Math.max(largest,error);
  }
  const rms=Math.sqrt(squared/n),travel=statistics(p).length;
  if(rms>Math.min(24,Math.max(7,length*.045))||
     largest>Math.min(58,Math.max(18,length*.10))||
     travel>length*1.8)return null;
  const axis=Math.abs(uy)<.105?'horizontal':Math.abs(ux)<.105?'vertical':'line';
  const mean=average(p);
  // Use short endpoint averages to avoid one bad finger-down/up sample.
  // When a horizontal/vertical intent is clear, make it mathematically exact.
  const endA=axis==='horizontal'?[p[0][0],mean[1]]:
    axis==='vertical'?[mean[0],p[0][1]]:a;
  const endB=axis==='horizontal'?[p.at(-1)[0],mean[1]]:
    axis==='vertical'?[mean[0],p.at(-1)[1]]:b;
  return {kind:axis,points:p.map((_,i)=>
    interpolate(endA,endB,i/(n-1))),error:rms};
}
function circleCandidate(p){
  if(p.length<12)return null;
  const n=p.length,mean=p.reduce((a,q)=>[a[0]+q[0]/n,a[1]+q[1]/n],[0,0]);
  let xx=0,xy=0,yy=0,xz=0,yz=0;
  for(const q of p){
    const x=q[0]-mean[0],y=q[1]-mean[1],z=x*x+y*y;
    xx+=x*x;xy+=x*y;yy+=y*y;xz+=x*z;yz+=y*z;
  }
  const det=xx*yy-xy*xy;
  if(det<1e-6*xx*yy||xx<50||yy<50)return null;
  const cx=(xz*yy-yz*xy)/(2*det)+mean[0],
    cy=(yz*xx-xz*xy)/(2*det)+mean[1];
  const angles=[],radii=[];
  for(const q of p){
    const dx=q[0]-cx,dy=q[1]-cy;
    angles.push(Math.atan2(dy,dx));
    radii.push(Math.hypot(dx,dy));
  }
  const radius=radii.reduce((a,b)=>a+b,0)/n;
  if(radius<25||!Number.isFinite(radius))return null;
  const relativeError=Math.sqrt(radii.reduce((sum,r)=>
    sum+(r-radius)**2,0)/n)/radius;
  if(relativeError>.16)return null;
  const unwrapped=[angles[0]];
  let reversing=0,totalTurn=0;
  for(let i=1;i<n;i++){
    let turn=angles[i]-angles[i-1];
    if(turn>Math.PI)turn-=TAU;
    if(turn< -Math.PI)turn+=TAU;
    if(totalTurn&&turn*totalTurn<0)reversing+=Math.abs(turn);
    totalTurn+=turn;
    unwrapped.push(unwrapped.at(-1)+turn);
  }
  const sweep=unwrapped.at(-1)-unwrapped[0];
  const winding=Math.abs(sweep);
  // Reject shaky near-lines, scribbles that double back, and figure eights.
  if(winding<Math.PI*.56||winding>TAU*2.2||reversing>Math.max(.8,winding*.35))return null;
  const closed=dist(p[0],p.at(-1))<radius*.5;
  const roundTurns=Math.round(winding/TAU);
  const full=closed&&roundTurns>=1&&
    Math.abs(winding-roundTurns*TAU)<.75;
  // For open circular arcs preserve their actual start/end angles.
  // For full loops, close the circle precisely at any smoothness strength=10.
  const finalSweep=full?Math.sign(sweep)*roundTurns*TAU:sweep;
  if(!full&&winding<Math.PI*.72)return null;
  const points=p.map((_,i)=>{
    const theta=unwrapped[0]+finalSweep*i/(n-1);
    return [cx+radius*Math.cos(theta),cy+radius*Math.sin(theta)];
  });
  return {kind:full?'circle':'arc',points,error:relativeError,full};
}
// A single finger gesture can contain a straight lead-in, one or more
// circular loops, and a lead-out. Look for near-returns with a coherent full
// revolution, rather than assuming the entire stroke is one primitive.
function embeddedLoops(p){
  if(p.length<36)return null;
  const result=p.map(q=>q.slice());
  let recognized=0;
  for(let start=0;start<p.length-22;start+=3){
    let minX=p[start][0],maxX=minX,minY=p[start][1],maxY=minY;
    let chosen=null;
    for(let end=start+1;end<Math.min(p.length,start+185);end++){
      const q=p[end];
      minX=Math.min(minX,q[0]);maxX=Math.max(maxX,q[0]);
      minY=Math.min(minY,q[1]);maxY=Math.max(maxY,q[1]);
      if(end-start<20||(end-start)%3)continue;
      const diameter=Math.min(maxX-minX,maxY-minY);
      if(diameter<42)continue;
      const guessedRadius=(maxX-minX+maxY-minY)/4;
      if(dist(p[start],q)>Math.max(18,guessedRadius*.57))continue;
      const candidate=circleCandidate(p.slice(start,end+1));
      if(candidate?.kind==='circle'){
        chosen={end,points:candidate.points};
        break;
      }
    }
    if(!chosen)continue;
    for(let i=start+1;i<chosen.end;i++){
      const edge=clamp(Math.min(i-start,chosen.end-i)/4,0,1);
      result[i]=interpolate(p[i],chosen.points[i-start],edge);
    }
    recognized++;
    start=chosen.end-3;
  }
  return recognized?{kind:'embedded-loops',points:result}:null;
}
function segmentDistance(p,a,b){
  const dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
  const t=clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(length||1),0,1);
  return dist(p,[a[0]+t*dx,a[1]+t*dy]);
}
function simplifyIndices(points,tolerance){
  const selected=new Set([0,points.length-1]),stack=[[0,points.length-1]];
  while(stack.length){
    const [start,end]=stack.pop();
    let max=tolerance,index=-1;
    for(let j=start+1;j<end;j++){
      const d=segmentDistance(points[j],points[start],points[end]);
      if(d>max){max=d;index=j;}
    }
    if(index>0){selected.add(index);stack.push([start,index],[index,end]);}
  }
  return [...selected].sort((a,b)=>a-b);
}
function segmentCandidates(p){
  if(p.length<18)return null;
  const anchors=simplifyIndices(p,12),result=p.map(q=>q.slice());
  let matched=0;
  for(let j=1;j<anchors.length;j++){
    const lo=anchors[j-1],hi=anchors[j];
    if(hi-lo<6)continue;
    const span=p.slice(lo,hi+1),fit=lineCandidate(span);
    if(!fit||dist(p[lo],p[hi])<75)continue;
    // Preserve corner location and continuity: blend each straight leg into
    // its original endpoints over a few samples instead of creating jumps.
    for(let i=lo+1;i<hi;i++){
      const t=(i-lo)/(hi-lo),edge=clamp(Math.min(t,1-t)*8,0,1);
      result[i]=interpolate(p[i],fit.points[i-lo],edge);
    }
    matched++;
  }
  return matched?{kind:'segments',points:result}:null;
}
/** Find strong global geometric intention and cautiously polish local legs.
 * Input/output are evenly distributed samples in normalized wallpaper units.
 * Only called above 5×: the existing 1×–5× behavior remains unchanged. */
export function interpretStroke(points){
  if(!Array.isArray(points)||points.length<5)return null;
  const p=points.map(pixel);
  // A closed shape must be tested as a loop BEFORE line fitting, otherwise
  // its endpoints may appear nearly coincident or its stem may look straight.
  const circle=circleCandidate(p);
  if(circle)return {kind:circle.kind,points:circle.points.map(normalize)};
  const line=lineCandidate(p);
  if(line)return {kind:line.kind,points:line.points.map(normalize)};
  const loops=embeddedLoops(p);
  if(loops)return {kind:loops.kind,points:loops.points.map(normalize)};
  const segments=segmentCandidates(p);
  return segments?{kind:segments.kind,points:segments.points.map(normalize)}:null;
}
