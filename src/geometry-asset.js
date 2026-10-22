// Portable geometry for reusable artwork. Pure data: no DOM, storage or source image.
// A library item may change; a wallpaper embeds its own normalized geometry copy.
import {normalizeDrawnPathWithIndexMap, DRAW_COORD_MIN, DRAW_COORD_MAX} from './drawn-path.js';

export const GEOMETRY_ASSET_SCHEMA='roygbiv.geometry-asset';
export const GEOMETRY_SNAPSHOT_SCHEMA='roygbiv.geometry-snapshot';
export const GEOMETRY_VERSION=1;
export const MAX_SHAPE_COMPONENTS=32;
export const MAX_SHAPE_RINGS=64;
export const MAX_RING_POINTS=2048;
export const MAX_SHAPE_POINTS=8192;
export const MAX_GEOMETRY_BYTES=1024*1024;
const encoder=new TextEncoder();
const fail=(message)=>{throw new TypeError('Invalid geometry: '+message);};
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const round=n=>{const result=Math.round(n*1e6)/1e6;return Object.is(result,-0)?0:result;};
const distance2=(a,b)=>(a[0]-b[0])**2+(a[1]-b[1])**2;
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const properIndex=(n,limit)=>Number.isInteger(n)&&n>=0&&n<limit;

function checkedText(value,max,fallback){
  if(value===undefined||value===null)return fallback;
  if(typeof value!=='string')fail('metadata text must be a string');
  const clean=value.trim();
  if(clean.length>max)fail('metadata text is too long');
  return clean||fallback;
}
function checkedPoint(value){
  if(!Array.isArray(value)||value.length!==2||!finite(value[0])||!finite(value[1])||
    Math.abs(value[0])>1e6||Math.abs(value[1])>1e6)fail('point is not a finite coordinate pair');
  return [round(value[0]),round(value[1])];
}
function checkedByteLimit(value){
  if(encoder.encode(JSON.stringify(value)).length>MAX_GEOMETRY_BYTES)
    fail('serialized geometry exceeds the 1 MiB limit');
  return value;
}
function area(ring){
  let sum=0;
  for(let i=0;i<ring.length;i++){
    const a=ring[i],b=ring[(i+1)%ring.length];
    sum+=a[0]*b[1]-a[1]*b[0];
  }
  return sum/2;
}
function onSegment(a,b,c){
  return Math.min(a[0],b[0])-1e-9<=c[0]&&c[0]<=Math.max(a[0],b[0])+1e-9&&
    Math.min(a[1],b[1])-1e-9<=c[1]&&c[1]<=Math.max(a[1],b[1])+1e-9;
}
function intersects(a,b,c,d){
  const abC=cross(a,b,c),abD=cross(a,b,d),cdA=cross(c,d,a),cdB=cross(c,d,b);
  if(((abC>1e-9&&abD< -1e-9)||(abC< -1e-9&&abD>1e-9))&&
    ((cdA>1e-9&&cdB< -1e-9)||(cdA< -1e-9&&cdB>1e-9)))return true;
  return (Math.abs(abC)<=1e-9&&onSegment(a,b,c))||
    (Math.abs(abD)<=1e-9&&onSegment(a,b,d))||
    (Math.abs(cdA)<=1e-9&&onSegment(c,d,a))||
    (Math.abs(cdB)<=1e-9&&onSegment(c,d,b));
}
function ringEdgesCross(first,second){
  for(let i=0;i<first.length;i++)for(let j=0;j<second.length;j++)
    if(intersects(first[i],first[(i+1)%first.length],second[j],second[(j+1)%second.length]))
      return true;
  return false;
}
function pointInRing(p,ring){
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i],b=ring[j];
    if(((a[1]>p[1])!==(b[1]>p[1]))&&
      p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
}
function normalizeRing(input,clockwise){
  if(!Array.isArray(input)||input.length<3||input.length>MAX_RING_POINTS+1)
    fail('outline must contain 3..2048 vertices');
  const points=[];
  for(const raw of input){
    const p=checkedPoint(raw);
    if(!points.length||distance2(points.at(-1),p)>1e-12)points.push(p);
  }
  if(points.length>1&&distance2(points[0],points.at(-1))<=1e-12)points.pop();
  if(points.length<3||points.length>MAX_RING_POINTS)fail('outline has too few or too many distinct vertices');
  const signed=area(points);
  if(Math.abs(signed)<1e-7)fail('outline has zero area');
  // A self-crossing outline produces undefined fill and collision semantics.
  for(let i=0;i<points.length;i++)for(let j=i+2;j<points.length;j++){
    if(i===0&&j===points.length-1)continue;
    if(intersects(points[i],points[(i+1)%points.length],
      points[j],points[(j+1)%points.length]))fail('outline crosses itself');
  }
  if((signed<0)!==clockwise)points.reverse();
  // Starting vertex is not meaningful in a closed region. Canonicalize it
  // so different tracing starts produce the same geometry content hash.
  let first=0;
  for(let i=1;i<points.length;i++){
    if(points[i][0]<points[first][0]||
      (points[i][0]===points[first][0]&&points[i][1]<points[first][1]))
      first=i;
  }
  return first?[...points.slice(first),...points.slice(0,first)]:points;
}
function checkedViewBox(value){
  if(!Array.isArray(value)||value.length!==4||!value.every(finite))
    fail('viewBox must have four finite numbers');
  const [x,y,w,h]=value.map(round);
  if(w<=0||h<=0||[x,y,w,h].some(n=>Math.abs(n)>1e6))
    fail('viewBox must have positive bounded dimensions');
  return [x,y,w,h];
}
function withinBox(p,b){
  return p[0]>=b[0]-1e-6&&p[1]>=b[1]-1e-6&&
    p[0]<=b[0]+b[2]+1e-6&&p[1]<=b[1]+b[3]+1e-6;
}
export function normalizeOpenPathGeometry(input){
  if(!object(input)||input.type!=='open-path')fail('expected an open-path');
  if(input.space!=='wallpaper-600x1300')fail('unsupported path coordinate space');
  if(!Array.isArray(input.points)||input.points.length<2||input.points.length>1200)
    fail('path exceeds authoring limits');
  for(const p of input.points){
    if(!Array.isArray(p)||p.length!==2||!p.every(finite)||
      p[0]<DRAW_COORD_MIN||p[0]>DRAW_COORD_MAX||
      p[1]<DRAW_COORD_MIN||p[1]>DRAW_COORD_MAX)fail('invalid path coordinate');
  }
  const {points,indexMap}=normalizeDrawnPathWithIndexMap(input.points);
  if(points.length<2)fail('path is too short');
  const mapped=raw=>{
    if(raw===undefined)return [];
    if(!Array.isArray(raw)||raw.length>96||raw.some(i=>!properIndex(i,input.points.length)))
      fail('invalid path control indices');
    return [...new Set(raw.map(i=>indexMap[i]))].filter(i=>properIndex(i,points.length))
      .sort((a,b)=>a-b);
  };
  const anchors=mapped(input.anchors),corners=mapped(input.corners);
  return checkedByteLimit({type:'open-path',space:'wallpaper-600x1300',points,anchors,corners});
}
export function normalizeCompoundRegion(input){
  if(!object(input)||input.type!=='compound-region')fail('expected a compound-region');
  if(input.space!=='asset-local'||input.fillRule!=='evenodd')fail('unsupported shape space/fill rule');
  const viewBox=checkedViewBox(input.viewBox);
  if(!Array.isArray(input.components)||!input.components.length||
    input.components.length>MAX_SHAPE_COMPONENTS)fail('invalid component count');
  let count=0,ringCount=0;
  const components=input.components.map(component=>{
    if(!object(component)||!Array.isArray(component.holes))fail('invalid component');
    const outer=normalizeRing(component.outer,false);
    count+=outer.length;ringCount++;
    const holes=component.holes.map(raw=>{
      const hole=normalizeRing(raw,true);
      count+=hole.length;ringCount++;
      if(!pointInRing(hole[0],outer)||ringEdgesCross(outer,hole))
        fail('hole must be entirely inside its outer outline');
      return hole;
    });
    for(let i=0;i<holes.length;i++)for(let j=i+1;j<holes.length;j++)
      if(ringEdgesCross(holes[i],holes[j])||
        pointInRing(holes[i][0],holes[j])||pointInRing(holes[j][0],holes[i]))
        fail('holes may not overlap or nest');
    if(count>MAX_SHAPE_POINTS||ringCount>MAX_SHAPE_RINGS)fail('shape is too complex');
    if(![...outer,...holes.flat()].every(p=>withinBox(p,viewBox)))
      fail('shape extends beyond its declared viewBox');
    return {outer,holes};
  });
  return checkedByteLimit({type:'compound-region',space:'asset-local',viewBox,
    components,fillRule:'evenodd'});
}
export function normalizeGeometry(input){
  if(!object(input))fail('geometry must be an object');
  if(input.type==='open-path')return normalizeOpenPathGeometry(input);
  if(input.type==='compound-region')return normalizeCompoundRegion(input);
  return fail('unsupported geometry kind');
}
export function geometryBounds(input){
  const geometry=normalizeGeometry(input);
  const points=geometry.type==='open-path'?geometry.points:
    geometry.components.flatMap(c=>[...c.outer,...c.holes.flat()]);
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const minX=Math.min(...xs),minY=Math.min(...ys),maxX=Math.max(...xs),maxY=Math.max(...ys);
  return {minX,minY,maxX,maxY,width:maxX-minX,height:maxY-minY};
}
export function geometryHashPayload(input){
  return JSON.stringify(normalizeGeometry(input));
}
export async function geometryContentHash(input){
  if(!globalThis.crypto?.subtle)throw new Error('SHA-256 requires Web Crypto');
  const bytes=encoder.encode(geometryHashPayload(input));
  const hash=new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes));
  return 'sha256:'+Array.from(hash,b=>b.toString(16).padStart(2,'0')).join('');
}
export function cloneGeometrySnapshot(input){
  const source=input?.schema===GEOMETRY_SNAPSHOT_SCHEMA?input.geometry:input;
  const geometry=normalizeGeometry(source);
  return {schema:GEOMETRY_SNAPSHOT_SCHEMA,version:GEOMETRY_VERSION,geometry};
}
function dateStamp(value,defaultValue){
  if(value===undefined||value===null)return defaultValue;
  if(typeof value!=='string'||!Number.isFinite(Date.parse(value)))
    fail('invalid timestamp');
  return new Date(value).toISOString();
}
export function normalizeGeometryAsset(input,{idFactory=()=>globalThis.crypto.randomUUID(),
  now=()=>new Date().toISOString()}={}){
  if(!object(input))fail('asset must be an object');
  if(input.schema!==undefined&&input.schema!==GEOMETRY_ASSET_SCHEMA)
    fail('unsupported asset schema');
  if(input.version!==undefined&&input.version!==GEOMETRY_VERSION)
    fail('unsupported asset version');
  const geometry=normalizeGeometry(input.geometry);
  const kind=geometry.type==='open-path'?'path':'shape';
  if(input.kind!==undefined&&input.kind!==kind)fail('asset kind does not match geometry');
  const id=checkedText(input.id,128,'')||idFactory();
  if(typeof id!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(id))
    fail('invalid asset id');
  const revision=input.revision??1;
  if(!Number.isSafeInteger(revision)||revision<1)fail('invalid revision');
  const timestamp=now();
  const createdAt=dateStamp(input.createdAt,timestamp);
  const modifiedAt=dateStamp(input.modifiedAt,createdAt);
  if(Date.parse(modifiedAt)<Date.parse(createdAt))fail('modified date precedes created date');
  const tags=input.tags??[];
  if(!Array.isArray(tags)||tags.length>12)fail('invalid tags');
  const normalizedTags=[...new Set(tags.map(t=>checkedText(t,32,'' )).filter(Boolean))];
  const source=object(input.source)?{
    kind:checkedText(input.source.kind,32,'unknown')
  }:{kind:'unknown'};
  return {schema:GEOMETRY_ASSET_SCHEMA,version:GEOMETRY_VERSION,id,revision,
    kind,name:checkedText(input.name,80,kind==='path'?'Untitled path':'Untitled shape'),
    createdAt,modifiedAt,tags:normalizedTags,geometry,source};
}
export function assetToDrawPath(input){
  const geometry=input?.geometry??input;
  const path=normalizeOpenPathGeometry(geometry);
  return {points:path.points.map(p=>p.slice()),
    anchors:path.anchors.slice(),corners:path.corners.slice()};
}
export function drawPathToGeometry(recipe){
  return normalizeOpenPathGeometry({type:'open-path',space:'wallpaper-600x1300',
    points:recipe?.customPath,anchors:recipe?.drawnAnchors??[],
    corners:recipe?.drawnCorners??[]});
}
