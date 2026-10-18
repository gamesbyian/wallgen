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
export const elementApplies=(e,slot,id)=>
  (!e.colorSlots?.length||e.colorSlots.includes(slot))&&
  (!e.objectIds?.length||e.objectIds.includes(id));
export function normalizeInteriorElements(input){
  if(!Array.isArray(input))return [];
  const seen=new Set();
  return input.slice(0,8).map((raw,i)=>{
    const e=raw&&typeof raw==='object'?raw:{};
    let id=String(e.id??'element-'+i).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,48)||'element-'+i;
    if(seen.has(id))id='element-'+i;seen.add(id);
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
      frequency:e.placement==='contour'?Math.round(number(e.frequency,6,1,30)):
        number(e.frequency,6,.1,100),
      phase:number(e.phase,0,-360,360),
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
      // Anchor every scanline to one world-space lattice. Adjacent polygon
      // masks reveal the same pattern without restarting its vertical phase.
      const anchorY=-2400;
      const startY=anchorY+Math.floor((top-180-anchorY)/period)*period;
      for(let y=startY;y<=bottom+180;y+=period){
        ctx.beginPath();
        const from=left-260,to=right+260;
        if(e.stroke!=='solid')ctx.lineDashOffset=-(from+1760);
        for(let x=from;x<=to;x+=step){
          const t=(x+e.phase*3)/scale;
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
