// A single-use, deliberately strict bridge from historical sampled Draw paths
// to the future canonical vectorPath format. This module has NO live recipe
// effect: callers must explicitly inspect refusal diagnostics before cutover.
// Artwork geometry stays in the existing normalized 600x1300 design space.
import {normalizeDrawnPathWithIndexMap,prepareDrawnPath} from './drawn-path.js';
import {vectorPathFromPolyline,prepareVectorDrawnPath,
  VECTOR_PATH_WIDTH,VECTOR_PATH_HEIGHT} from './vector-path-commands.js';

const world=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const unique=list=>[...new Set(list)].sort((a,b)=>a-b);
const mapped=(value,indexMap,size)=>unique(
  (Array.isArray(value)?value:[])
    .filter(i=>Number.isInteger(i)&&i>=0)
    .map(i=>indexMap[i])
    .filter(i=>Number.isInteger(i)&&i>=0&&i<size));
const refuse=(reason,diagnostics={})=>({ok:false,reason,diagnostics});

/** Source is a legacy recipe or a raw customPath array. This does not alter
 * model.js, JSON/PNG export, or the live Draw editor until an atomic cutover. */
export function upgradeSampledDrawnPath(source){
  const recipe=Array.isArray(source)?{customPath:source}:source;
  if(!recipe||typeof recipe!=='object'||Array.isArray(recipe)||
      !Array.isArray(recipe.customPath))
    return refuse('missing-legacy-path');
  const {points:stored,indexMap}=normalizeDrawnPathWithIndexMap(recipe.customPath);
  if(stored.length<2)return refuse('invalid-or-empty-path');
  const old=prepareDrawnPath(stored);
  if(!old||old.points.length<2||old.total<=0)
    return refuse('degenerate-legacy-path');

  const pins=mapped(recipe.drawnAnchors,indexMap,stored.length);
  const corners=mapped(recipe.drawnCorners,indexMap,stored.length);
  const softened=stored.length<20;
  // The source points may no longer sit on the baked smooth curve.
  // Don't pretend their indices are exact parametric node IDs.
  if(softened&&(pins.length||corners.length))
    return refuse('authored-node-remapping-required',{
      sourceStations:stored.length,preparedStations:old.points.length,
      authoredAnchors:pins.length,authoredCorners:corners.length});

  const first=old.points[0],last=old.points.at(-1);
  const endpointGap=world(first,last);
  // Old renderer inferred 'closed' when the endpoints merely came within
  // six design units. Adding a true closing segment changes the saved art.
  // Refuse those ambiguous cases rather than inventing a new final chord.
  if(old.closed&&endpointGap>1e-8)
    return refuse('inferred-near-closure-requires-review',{
      endpointGapDesign:Math.round(endpointGap*1e6)/1e6,
      sourceStations:stored.length});
  const positions=old.points.map(p=>[
    (p.x+VECTOR_PATH_WIDTH/2)/VECTOR_PATH_WIDTH,
    (p.y+VECTOR_PATH_HEIGHT/2)/VECTOR_PATH_HEIGHT]);
  const closed=old.closed;
  const coordinates=closed?positions.slice(0,-1):positions;
  // All points still constitute the exact piecewise-linear *rendered* path,
  // including any former sparse-stroke softening.
  const vectorPath=vectorPathFromPolyline(coordinates,{closed});
  if(!vectorPath)return refuse('vector-path-limits-exceeded',{
    preparedStations:old.points.length});
  const compiled=prepareVectorDrawnPath(vectorPath);
  if(!compiled||compiled.points.length!==old.points.length)
    return refuse('compiled-topology-mismatch',{
      preparedStations:old.points.length,
      compiledStations:compiled?.points.length||0});

  let maxVertexError=0;
  for(let i=0;i<old.points.length;i++)
    maxVertexError=Math.max(maxVertexError,world(old.points[i],compiled.points[i]));
  const lengthDelta=Math.abs(old.total-compiled.total);
  if(maxVertexError>1e-7||lengthDelta>1e-7)
    return refuse('rendered-geometry-parity-failed',{
      maxVertexErrorDesign:maxVertexError,lengthDeltaDesign:lengthDelta});
  // A duplicated final station on an explicitly closed curve is the same
  // topological node as its first station. Never emit a missing terminal ID.
  const nodeId=i=>closed&&i===old.points.length-1?'n0':'n'+i;
  const authoring={
    protectedNodeIds:[...new Set(pins.map(nodeId))],
    cornerNodeIds:[...new Set(corners.map(nodeId))],
    // Applied only to dense paths where sample order is exactly conserved.
    // For sparse paths this remains empty, since there were no authored pins.
  };
  return {ok:true,vectorPath,authoring,diagnostics:{
    bakedFromSparseStroke:softened,sourceStations:stored.length,
    compiledStations:compiled.points.length,
    maxVertexErrorDesign:maxVertexError,lengthDeltaDesign:lengthDelta,
    explicitClosure:closed,sourceHadNearClosure:old.closed
  }};
}
