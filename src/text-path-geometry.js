// Bounded local text baselines derived from the same wave/arc sampler as
// rainbow ribbons. Positions are canonical 600x1300 wallpaper units.
// Complex joining scripts keep their native whole-line shaping (straight).
import {pathPosition} from './path-geometry.js';
import {prepareDrawnPath,pointOnDrawnPath} from './drawn-path.js';
import {textGraphemes} from './text-rainbow-shaping.js';
import {availableTextWidth} from './text-direct-geometry.js';
import {DESIGN_WIDTH,DESIGN_HEIGHT} from './model.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Splitting joining or bidirectional runs into glyph paints is incorrect:
// Canvas2D has no shaped-glyph-position API. Refuse curved segmentation and
// retain the original whole-line renderer for these runs.
export function canCurveText(line){
  return !/[\u0590-\u109f\u1700-\u18af\u200c\u200d\u202a-\u202e\u2066-\u2069]/u.test(line);
}
// Reuse the exact canonical Draw stroke rather than inventing a second
// editable spline. Only a normalized recipe customPath may drive this mode.
// The user can continue editing that source path through existing Draw tools.
export function prepareTextFollowPath(item,points){
  if(item.path==='drawn'){
    const path=prepareDrawnPath(points);
    if(!path?.total||path.total<35)return null;
    const mid=pointOnDrawnPath(path,.5);
    return {total:path.total,sample(distance){
      const u=clamp(.5+distance/path.total,0,1);
      const p=pointOnDrawnPath(path,u);
      const a=pointOnDrawnPath(path,clamp(u-2/path.total,0,1));
      const b=pointOnDrawnPath(path,clamp(u+2/path.total,0,1));
      return {x:p.x-mid.x,y:p.y-mid.y,
        angle:Math.atan2(b.y-a.y,b.x-a.x)};
    }};
  }
  if(item.path!=='hairpin'&&item.path!=='loop')return null;
  const radius=clamp(item.pathHeight,30,240);
  const geometry=item.path,extent=600;
  const stripe={geometry,sharedGeometry:geometry,coreExtent:extent,
    turnRadius:radius,hairpinAngle:180,loopRadius:radius,loopSweep:360,
    sharedPhase:0,sharedDisplacement:0};
  // Hairpin's parameter is not uniform arclength. Build a bounded lookup
  // once per paint, and distribute glyph stations by true travelled distance
  // to avoid packing their edges into the turn.
  const count=193,locations=[],distances=[0];
  for(let i=0;i<count;i++){
    const p=pathPosition(stripe,-extent+2*extent*i/(count-1),extent);
    locations.push(p);
    if(i)distances.push(distances.at(-1)+
      Math.hypot(p.x-locations[i-1].x,p.y-locations[i-1].y));
  }
  const total=distances.at(-1);
  if(!Number.isFinite(total)||total<100)return null;
  const at=distance=>{
    const target=clamp(distance,0,total);
    let lo=1,hi=distances.length-1;
    while(lo<hi){
      const m=(lo+hi)>>1;
      if(distances[m]<target)lo=m+1;
      else hi=m;
    }
    const a=locations[lo-1],b=locations[lo];
    const fraction=(target-distances[lo-1])/
      (distances[lo]-distances[lo-1]||1);
    return {x:a.x+(b.x-a.x)*fraction,y:a.y+(b.y-a.y)*fraction};
  };
  const center=at(total/2);
  return {total,sample(distance){
    const d=total/2+distance;
    const p=at(d),a=at(d-2),b=at(d+2);
    return {x:p.x-center.x,y:p.y-center.y,
      angle:Math.atan2(b.y-a.y,b.x-a.x)};
  }};
}
export function textPathStation(item,station,room,prepared){
  if(['drawn','hairpin','loop'].includes(item.path))
    return prepared?.sample(station)||{x:station,y:0,angle:0};
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
export function layoutTextOnPath(item,line,measure,drawnPoints){
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
  const prepared=['drawn','hairpin','loop'].includes(item.path)?
    prepareTextFollowPath(item,drawnPoints):null;
  if(['drawn','hairpin','loop'].includes(item.path)&&!prepared)
    return {supported:false,glyphs:[]};
  const maxArc=item.path==='circle'?
    Math.PI*.92*clamp(item.pathHeight,Math.max(20,item.size*.7),Math.max(20,room/2)):
    prepared?Math.min(room*.97,prepared.total*.9):room;
  const shrink=Math.min(1,maxArc/total);
  let cursor=-total*shrink/2;
  const glyphs=units.map((text,i)=>{
    const advance=widths[i]*shrink;
    const distance=cursor+advance/2;
    cursor+=advance;
    const point=textPathStation(item,distance,room,prepared);
    return {text,index:i,distance,advance,width:widths[i],
      x:point.x,y:point.y,angle:point.angle};
  });
  return {supported:true,glyphs,shrink,total,room};
}

// Pointer picking is a separate operation from the visible editor rectangle.
// That rectangle remains a 44px-handle guide; selection follows the actual
// authored line stations instead of claiming the empty centre of an arc.
// These are deliberately conservative ink-near *advance* bounds, NOT an
// expensive per-pixel glyph raster or a false character-exact ink claim.
export function hitTextAtLayout(items,point,measureFor,{tolerance=0,customPath}={}){
  if(!point||![point.x,point.y].every(Number.isFinite))return null;
  const reach=Math.max(0,Number.isFinite(tolerance)?tolerance:0);
  for(let i=(items?.length||0)-1;i>=0;i--){
    const item=items[i];
    if(!item?.enabled||!item.text||!Number.isFinite(item.size))continue;
    const angle=(item.rotation||0)*Math.PI/180;
    const px=point.x-DESIGN_WIDTH*item.x/100,
      py=point.y-DESIGN_HEIGHT*item.y/100;
    // Undo the object's overall rotation before testing any text stations.
    const x=px*Math.cos(angle)+py*Math.sin(angle);
    const y=-px*Math.sin(angle)+py*Math.cos(angle);
    const lines=item.text.split('\n');
    const leading=item.size*1.17*(1+(item.lineSpacing??0)/100);
    const stroke=item.outline==='none'?0:item.size*item.outlineWidth/100;
    const extra=stroke+reach;
    for(let lineIndex=0;lineIndex<lines.length;lineIndex++){
      const line=lines[lineIndex];
      if(!line.trim())continue;
      const offset=(lineIndex-(lines.length-1)/2)*leading;
      const layout=item.path&&item.path!=='none'?
        layoutTextOnPath(item,line,unit=>measureFor(item,unit),customPath):null;
      if(layout?.supported){
        for(const glyph of layout.glyphs){
          if(!glyph.text.trim())continue; // authored spaces have no ink
          const centerX=glyph.x-Math.sin(glyph.angle)*offset,
            centerY=glyph.y+Math.cos(glyph.angle)*offset;
          const dx=x-centerX,dy=y-centerY,
            ux=dx*Math.cos(glyph.angle)+dy*Math.sin(glyph.angle),
            uy=-dx*Math.sin(glyph.angle)+dy*Math.cos(glyph.angle);
          if(Math.abs(ux)<=glyph.width*layout.shrink/2+extra&&
             Math.abs(uy)<=item.size*.57+extra)return item;
        }
        continue;
      }
      // Straight and unsupported joining/RTL scripts share one native-shaped
      // run. Hit its line, never independently "hit" a joining glyph.
      const total=Math.max(0,Number(measureFor(item,line))||0);
      const width=Math.min(availableTextWidth(item),total);
      if(Math.abs(x)<=width/2+extra&&
         Math.abs(y-offset)<=item.size*.57+extra)return item;
    }
  }
  return null;
}
