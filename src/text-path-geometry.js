// Bounded local text baselines derived from the same wave/arc sampler as
// rainbow ribbons. Positions are canonical 600x1300 wallpaper units.
// Complex joining scripts keep their native whole-line shaping (straight).
import {pathPosition} from './path-geometry.js';
import {textGraphemes} from './text-rainbow-shaping.js';
import {availableTextWidth} from './text-direct-geometry.js';
export const TEXT_PATHS=Object.freeze(['none','wave','arc','circle']);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Splitting joining or bidirectional runs into glyph paints is incorrect:
// Canvas2D has no shaped-glyph-position API. Refuse curved segmentation and
// retain the original whole-line renderer for these runs.
export function canCurveText(line){
  return !/[\u0590-\u109f\u1700-\u18af\u200c\u200d\u202a-\u202e\u2066-\u2069]/u.test(line);
}
export function textPathStation(item,station,room){
  if(item.path==='circle'){
    const radius=clamp(item.pathHeight,Math.max(20,item.size*.7),Math.max(20,room/2));
    const a=station/radius;
    return {x:radius*Math.sin(a),y:-radius*Math.cos(a),angle:a,radius};
  }
  const geometry=item.path==='arc'?'arc':'wave';
  const amplitude=clamp(item.pathHeight,0,240);
  const stripe={geometry,sharedGeometry:geometry,phase:0,sharedPhase:0,
    period:340,sharedPeriod:340,displacement:amplitude,
    sharedDisplacement:amplitude,shapeFrequency:0,coreExtent:300};
  const sample=x=>pathPosition(stripe,x,300);
  const center=sample(0),p=sample(station);
  const left=sample(station-.5),right=sample(station+.5);
  return {x:p.x-center.x,y:p.y-center.y,
    angle:Math.atan2(right.y-left.y,right.x-left.x)};
}
export function layoutTextOnPath(item,line,measure){
  if(!item||item.path==='none'||!line||!canCurveText(line))
    return {supported:false,glyphs:[]};
  const units=textGraphemes(line);
  if(!units.length)return {supported:false,glyphs:[]};
  const widths=units.map(unit=>{
    const n=Number(measure(unit));
    return Number.isFinite(n)?Math.max(0,n):0;
  });
  const total=widths.reduce((s,n)=>s+n,0);
  if(total<=0)return {supported:false,glyphs:[]};
  const room=availableTextWidth(item);
  const maxArc=item.path==='circle'?
    Math.PI*1.55*clamp(item.pathHeight,Math.max(20,item.size*.7),Math.max(20,room/2)):
    room;
  const shrink=Math.min(1,maxArc/total);
  let cursor=-total*shrink/2;
  const glyphs=units.map((text,i)=>{
    const advance=widths[i]*shrink;
    const distance=cursor+advance/2;
    cursor+=advance;
    const point=textPathStation(item,distance,room);
    return {text,index:i,distance,advance,width:widths[i],
      x:point.x,y:point.y,angle:point.angle};
  });
  return {supported:true,glyphs,shrink,total,room};
}
