// Embroidery E4: source-authoritative stitch crossing *candidates*.
// This is deliberately geometry only. It does not paint fake contact shadows
// over unstitched fabric, transparent holes or neighbouring rainbow regions.
// The existing source-order painter remains the sole z/clip owner.
import {segmentIntersection} from './crossing-order.js';

const finite=Number.isFinite;
const MAX_STITCH_SEGMENTS=6000;
const MAX_CELL_VISITS=128;
const MAX_PAIR_PROBES=80000;
const MAX_INTERSECTIONS=512;

/** Only actual interior/interior transverse stitch centerline intersections
 * count as crossing contacts. Parallel/coplanar/endpoint touching yarn, close
 * nonintersecting neighbours and separate object owners produce no events.
 * The later source stitch is above by default; a caller-owned original\n * Over/Under/Weave decision may explicitly reverse this. Select a stable
 * crop-window subset of these full-source events for crossing replay.
 *
 * Each segment: {id,owner,course,sourceIndex,station,start:{x,y},
 *                end:{x,y},width}. All coordinates and widths are design
 * units, with no output pixels or serializable recipe geometry. */
export function threadCrossingGraph(segments,{
  cellSize=24,topIsLater=()=>true
}={}){
  if(!Array.isArray(segments)||segments.length>MAX_STITCH_SEGMENTS||
     typeof topIsLater!=='function'||
     !finite(cellSize)||cellSize<8||cellSize>256)
    throw new RangeError('Unbounded embroidery crossing study');
  const grid=new Map(),hits=[];
  let probes=0;
  for(let i=0;i<segments.length;i++){
    const item=segments[i],a=item?.start,b=item?.end;
    if(typeof item?.id!=='string'||!item.id||item.id.length>100||
       typeof item?.owner!=='string'||!item.owner||item.owner.length>100||
       typeof item?.course!=='string'||!item.course||item.course.length>100||
       !Number.isSafeInteger(item.sourceIndex)||!finite(item.station)||
       !finite(a?.x)||!finite(a?.y)||!finite(b?.x)||!finite(b?.y)||
       !finite(item.width)||item.width<=0||item.width>256)
      throw new RangeError('Invalid source stitch crossing geometry');
    const minX=Math.floor(Math.min(a.x,b.x)/cellSize),
      maxX=Math.floor(Math.max(a.x,b.x)/cellSize),
      minY=Math.floor(Math.min(a.y,b.y)/cellSize),
      maxY=Math.floor(Math.max(a.y,b.y)/cellSize);
    const nx=maxX-minX+1,ny=maxY-minY+1;
    if(![minX,maxX,minY,maxY,nx,ny].every(Number.isSafeInteger)||
       nx*ny>MAX_CELL_VISITS)
      throw new RangeError('Stitch segment exceeds safe source-grid budget');
    const keys=[],candidates=new Set();
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
      const key=x+','+y;
      keys.push(key);
      for(const index of grid.get(key)||[])candidates.add(index);
    }
    // Candidate ordering is independent of the hash table insertion pattern,
    // giving stable top/bottom source order across crops and renders.
    for(const j of [...candidates].sort((u,v)=>u-v)){
      const lower=segments[j];
      if(lower.owner!==item.owner||
         (lower.course===item.course&&
          Math.abs(lower.sourceIndex-item.sourceIndex)<=1))continue;
      if(++probes>MAX_PAIR_PROBES)
        throw new RangeError('Excessively dense source stitch crossings');
      const crossing=segmentIntersection(lower.start,lower.end,a,b);
      if(!crossing)continue;
      if(hits.length>=MAX_INTERSECTIONS)
        throw new RangeError('Excessively many source stitch crossings');
      // The renderer owns the user's Over/Under/Weave decision. The default
      // preserves normal painter order; an explicit resolver must supply
      // the canonical crossing decision for flipped or alternating passes.
      // Never silently invent a second colour-based crossing policy.
      const later=topIsLater({earlier:lower,later:item,
        earlierIndex:j,laterIndex:i,point:crossing,graphIndex:hits.length});
      if(typeof later!=='boolean')
        throw new TypeError('Thread crossing hierarchy must be explicit');
      const top=later?item:lower,bottom=later?lower:item;
      hits.push({
        x:crossing.x,y:crossing.y,
        belowId:bottom.id,aboveId:top.id,
        belowIndex:later?j:i,aboveIndex:later?i:j,
        belowStation:bottom.station,aboveStation:top.station,
        belowWidth:bottom.width,aboveWidth:top.width,
        owner:item.owner
      });
    }
    for(const key of keys){
      if(!grid.has(key))grid.set(key,[]);
      grid.get(key).push(i);
    }
  }
  return hits;
}

/** Select a *previously computed full-source* graph for a replay window,
 * using the upper stitch's original longitudinal station. Never solve a new
 * partial topology and accidentally reverse which yarn is over. */
export function threadCrossingsInRange(events,range){
  if(!Array.isArray(events))return [];
  if(!range)return events.slice();
  if(!finite(range.start)||!finite(range.end)||range.end<range.start)
    return [];
  return events.filter(hit=>hit.aboveStation>=range.start&&
    hit.aboveStation<=range.end);
}
