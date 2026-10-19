import {polygonInsetContours,polygonInsetScale} from './polygon-inset.js';
import {contourBoundaryFrame,decorateInsetContour} from './contour-decoration.js';
// Shared, resolution-independent interior decoration contract for every scene object.
// The geometry adapters choose a natural local coordinate system; ink is clipped
// to the owner shape and never creates an additional rainbow pigment.
export const ELEMENT_TYPES=Object.freeze(['line','band']);
export const ELEMENT_SHAPES=Object.freeze(['straight','wave','zigzag','loop']);
export const ELEMENT_STROKES=Object.freeze(['solid','dashed','dotted']);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const number=(x,f,a,b)=>clamp(Number.isFinite(+x)?+x:f,a,b);
const COLOURS=['white','black','lighter','darker','custom'];
export const RAINBOW_NAMES=Object.freeze(['Red','Orange','Yellow','Green','Blue','Indigo','Violet']);
// One contract for normalized recipe values and native editor slider limits.
// Older and externally supplied recipes can legitimately use the full span.
export const INTERIOR_LIMITS=Object.freeze({
  fieldFrequency:Object.freeze({min:.1,max:100,step:.1}),
  contourFrequency:Object.freeze({min:1,max:30,step:1}),
  phase:Object.freeze({min:-360,max:360,step:1}),
});
export const elementApplies=(e,slot,id)=>
  (!e.colorSlots?.length||e.colorSlots.includes(slot))&&
  (!e.objectIds?.length||e.objectIds.includes(id));
// Unique inside the current stack even if the user taps Add twice within
// one millisecond. Clock time is only a human-readable starting candidate;
// generation randomness and serialized order are never affected.
/** UI selection follows an element's stable recipe ID, not its current
 * position in the ordered stack. Undo, reorder and recipe restore can all
 * replace the array while preserving the selected identity. */
export function resolveInteriorSelection(items,selectedId,fallbackIndex=0){
  if(!Array.isArray(items)||!items.length)return 0;
  if(selectedId!==null&&selectedId!==undefined){
    const matching=items.findIndex(e=>e?.id===selectedId);
    if(matching>=0)return matching;
  }
  const index=Number.isInteger(fallbackIndex)?fallbackIndex:0;
  return Math.max(0,Math.min(index,items.length-1));
}
export function newInteriorElementId(items,now=Date.now()){
  const used=new Set((Array.isArray(items)?items:[]).map(e=>String(e?.id??'')));
  const stamp=Number.isFinite(Number(now))?Math.max(0,Math.trunc(Number(now))):Date.now();
  const base='element-'+stamp;
  let id=base,suffix=2;
  while(used.has(id))id=base+'-'+suffix++;
  return id;
}
export function normalizeInteriorElements(input){
  if(!Array.isArray(input))return [];
  const seen=new Set();
  return input.slice(0,8).map((raw,i)=>{
    const e=raw&&typeof raw==='object'?raw:{};
    let id=String(e.id??'element-'+i).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,48)||'element-'+i;
    if(seen.has(id)){
      // An imported user ID may already be equal to the simple index
      // fallback (element-2, etc.). Probe until truly unused, rather than
      // merely replacing one duplicate with another.
      const base='element-'+i;
      id=base;
      let suffix=2;
      while(seen.has(id))id=base+'-'+suffix++;
    }
    seen.add(id);
    return {
      id,enabled:e.enabled!==false,
      type:ELEMENT_TYPES.includes(e.type)?e.type:'line',
      shape:ELEMENT_SHAPES.includes(e.shape)?e.shape:'straight',
      stroke:ELEMENT_STROKES.includes(e.stroke)?e.stroke:'solid',
      color:COLOURS.includes(e.color)?e.color:'white',
      customColor:/^#[0-9a-f]{6}$/i.test(e.customColor)?e.customColor.toLowerCase():'#ffffff',
      colorSlots:Array.isArray(e.colorSlots)?[...new Set(e.colorSlots.filter(x=>Number.isInteger(x)&&x>=0&&x<7))]:[],
      objectIds:Array.isArray(e.objectIds)?[...new Set(e.objectIds.filter(x=>typeof x==='string'&&x.length<100))].slice(0,200):[],
      // Lines use logical design pixels; tonal bands use percent of local shape width.
      width:number(e.width,e.type==='band'?22:1.5,.15,50),
      position:number(e.position,0,-.48,.48),
      amplitude:number(e.amplitude,.12,0,.45),
      // Closed contours use whole cycles to meet cleanly at their seams.
      frequency:e.placement==='contour'?Math.round(number(e.frequency,6,
        INTERIOR_LIMITS.contourFrequency.min,INTERIOR_LIMITS.contourFrequency.max)):
        number(e.frequency,6,INTERIOR_LIMITS.fieldFrequency.min,INTERIOR_LIMITS.fieldFrequency.max),
      phase:number(e.phase,0,INTERIOR_LIMITS.phase.min,INTERIOR_LIMITS.phase.max),
      opacity:number(e.opacity,1,0,1),
      placement:['local','field','contour'].includes(e.placement)?e.placement:'local',
    };
  });
}
export function elementInk(e,color){
  if(e.color==='custom')return e.customColor;
  if(e.color==='white')return '#fff';
  if(e.color==='black')return '#000';
  // Palette-derived contrasts preserve the seven semantic colour roles.
  return e.color==='lighter'?'rgba(255,255,255,.48)':'rgba(0,0,0,.48)';
}
export function elementWave(e,t){
  const v=t*2*Math.PI*e.frequency+e.phase*Math.PI/180;
  if(e.shape==='wave')return Math.sin(v);
  if(e.shape==='zigzag')return 2/Math.PI*Math.asin(Math.sin(v));
  if(e.shape==='loop')return Math.sin(v);
  return 0;
}
export function lineDash(ctx,e){
  const width=Math.max(.15,ctx.lineWidth||e.width);
  ctx.setLineDash(e.stroke==='dashed'?[width*4,width*2.5]:
    e.stroke==='dotted'?[.01,width*2.7]:[]);
  ctx.lineCap=e.stroke==='dotted'?'round':'round';
}
// Conservative horizontal extent of a polygon intersecting a strip.
// Waves may shift each scanline up or down: callers widen the strip by the
// full displacement and half the stroke. Restricting horizontal sampling to
// that strip eliminates millions of invisible tessellation points from narrow
// radial rays while retaining correct clipped curves around shape boundaries.
export function polygonStripBounds(vertices,low,high){
  let left=Infinity,right=-Infinity;
  if(!vertices?.length)return null;
  for(let i=0;i<vertices.length;i++){
    const a=vertices[i],b=vertices[(i+1)%vertices.length];
    const minY=Math.min(a.y,b.y),maxY=Math.max(a.y,b.y);
    if(maxY<low||minY>high)continue;
    if(a.y>=low&&a.y<=high){
      left=Math.min(left,a.x);right=Math.max(right,a.x);
    }
    if(b.y>=low&&b.y<=high){
      left=Math.min(left,b.x);right=Math.max(right,b.x);
    }
    for(const y of [low,high]){
      if(y<minY||y>maxY||Math.abs(b.y-a.y)<1e-9)continue;
      const x=a.x+(b.x-a.x)*(y-a.y)/(b.y-a.y);
      left=Math.min(left,x);right=Math.max(right,x);
    }
  }
  return left<=right?{left,right}:null;
}
// For arbitrary closed regions, field strokes are painted in canvas space.
// Their visibility is governed exclusively by the owner's exact shape mask.
export function drawRegionInteriors(ctx,object,elements,structure,renderBounds){
  if(!elements?.length||!object.vertices?.length)return;
  const xs=object.vertices.map(p=>p.x),ys=object.vertices.map(p=>p.y);
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  const cx=(x0+x1)/2,cy=(y0+y1)/2;
  ctx.save();ctx.beginPath();ctx.moveTo(object.vertices[0].x,object.vertices[0].y);
  for(const p of object.vertices.slice(1))ctx.lineTo(p.x,p.y);
  ctx.closePath();ctx.clip();
  // A stack of strokes can share the same geometric insets. Resolve each
  // distance only once per object and render, independent of ink/stroke style.
  const insetCache=new Map();
  let insetScale,contourFrame;
  for(const e of elements){
    if(!e.enabled||!e.opacity||!elementApplies(e,object.colorIndex,object.id))continue;
    ctx.save();ctx.strokeStyle=elementInk(e,object.color);
    ctx.globalAlpha=e.opacity;ctx.lineWidth=e.type==='band'?e.width/100*Math.min(80,Math.max(2,Math.min(x1-x0,y1-y0))):e.width;
    lineDash(ctx,e);ctx.lineJoin='round';
    if(e.placement==='contour'){
      const count=structure==='radial'?3:2;
      const scale=insetScale??(insetScale=polygonInsetScale(object.vertices));
      for(let layer=0;layer<count;layer++){
        // A Euclidean offset in logical design units. Multiple disconnected
        // contours are possible when thin bridges disappear during erosion.
        const distance=scale*(.10+layer*.16+e.position*.09);
        const key=distance.toFixed(8);
        let contours=insetCache.get(key);
        if(!contours){
          contours=polygonInsetContours(object.vertices,distance,
            {bounds:renderBounds,padding:80});
          insetCache.set(key,contours);
        }
        for(const contour of contours){
          const styled=e.shape==='straight'&&e.stroke==='solid'?contour:
            decorateInsetContour(contour,e,distance,
              contourFrame??(contourFrame=contourBoundaryFrame(object.vertices)),ctx.lineWidth);
          if(e.stroke!=='solid')ctx.lineDashOffset=styled.dashOffset??0;
          ctx.beginPath();
          styled.points.forEach((p,i)=>{
            if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
          });
          if(styled.closed)ctx.closePath();
          ctx.stroke();
        }
      }
    }else{
      // All field patterns have stable world-space phase across neighbouring
      // cells; each cell merely reveals its portion of the same continuous ink.
      const ang=structure==='radial'&&e.placement==='local'?
        Math.atan2(cy-(object.origin?.y??650),cx-(object.origin?.x??300)):0;
      // Work in the inverse-rotated *visible camera*, not the enormous
      // region bounding box. A radial wedge can extend 4,200 units beyond
      // the frame, and the old field loop sampled that entire offscreen area
      // once for EVERY region and EVERY element on every setting change.
      const camera=renderBounds||{left:0,top:0,right:600,bottom:1300};
      const bleed=100+e.width*.5+e.amplitude*80;
      const corners=[
        [camera.left,camera.top],[camera.left,camera.bottom],
        [camera.right,camera.top],[camera.right,camera.bottom]
      ];
      const cos=Math.cos(ang),sin=Math.sin(ang);
      const inverse=corners.map(([x,y])=>({
        x:cx+(x-cx)*cos+(y-cy)*sin,
        y:cy-(x-cx)*sin+(y-cy)*cos
      }));
      const left=Math.max(x0-bleed,Math.min(...inverse.map(p=>p.x))-bleed);
      const right=Math.min(x1+bleed,Math.max(...inverse.map(p=>p.x))+bleed);
      const top=Math.max(y0-bleed,Math.min(...inverse.map(p=>p.y))-bleed);
      const bottom=Math.min(y1+bleed,Math.max(...inverse.map(p=>p.y))+bleed);
      if(right<=left||bottom<=top){ctx.restore();continue;}
      ctx.translate(cx,cy);ctx.rotate(ang);ctx.translate(-cx,-cy);
      const period=Math.max(12,160/Math.max(.2,e.frequency));
      const waveElement={...e,frequency:1};
      const scale=Math.max(16,220/e.frequency);
      const step=Math.max(1.5,Math.min(5,scale/12));
      const localPolygon=ang?object.vertices.map(p=>({
        x:cx+(p.x-cx)*cos+(p.y-cy)*sin,
        y:cy-(p.x-cx)*sin+(p.y-cy)*cos
      })):object.vertices;
      const verticalReach=Math.abs(e.position)*period+e.amplitude*80+
        ctx.lineWidth*.5+step*2;
      const horizontalReach=e.shape==='loop'?e.amplitude*80+ctx.lineWidth*.5+step*2:
        ctx.lineWidth*.5+step*2;
      // Anchor every scanline to one world-space lattice. Adjacent polygon
      // masks reveal the same pattern without restarting its vertical phase.
      // Field placement uses one shared world lattice; local placement
      // restarts that lattice around each shape's own centre. Previously
      // these modes were indistinguishable for nonradial regions.
      const anchorY=e.placement==='local'?cy:-2400;
      const anchorX=e.placement==='local'?cx:0;
      const startY=anchorY+Math.floor((top-180-anchorY)/period)*period;
      for(let y=startY;y<=bottom+180;y+=period){
        const strip=polygonStripBounds(localPolygon,
          y-verticalReach,y+verticalReach);
        if(!strip)continue;
        const leftX=Math.max(left-260,strip.left-horizontalReach);
        const rightX=Math.min(right+260,strip.right+horizontalReach);
        if(leftX>=rightX)continue;
        // Quantize stations in world/local coordinates rather than restart
        // the sampling grid independently in each polygon.
        const from=anchorX+Math.floor((leftX-anchorX)/step)*step;
        const to=rightX+step;
        ctx.beginPath();
        if(e.stroke!=='solid')ctx.lineDashOffset=-(from+1760);
        for(let x=from;x<=to;x+=step){
          const t=(x-anchorX+e.phase*3)/scale;
          const displacement=e.amplitude*80*elementWave(waveElement,t);
          const yy=y+e.position*period+displacement;
          const xx=e.shape==='loop'?x+e.amplitude*80*Math.cos(t*2*Math.PI+e.phase*Math.PI/180):x;
          if(x===from)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  ctx.restore();
}
