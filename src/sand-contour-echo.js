// Authored-world decorative sand contour echoes. The original region rings,
// ribbon rails and active vector clips remain authoritative. No geometry or
// bitmap field is serialized in the source recipe.
import {sandPitch} from './sand-material.js';
import {polygonInsetContours} from './polygon-inset.js';
import {sandLighting} from './sand-lighting.js';

const finite=Number.isFinite;
const TAU=Math.PI*2;
const MAX_SOURCE_VERTICES=768;
const MAX_CONTOUR_POINTS=24000;

export function sandEchoStyles(scene,lighting=sandLighting(scene)){
  return (scene?.textureLayers||[]).filter(l=>l?.material==='sand-filigree'&&
    l.coverage!=='background'&&finite(l.strength)&&l.strength>0).map(l=>{
    const gauge=sandPitch(l),amount=Math.min(1,l.strength/100);
    return {
      // Two actual metric distances from the *original* source boundary.
      // Material scale is an existing authored-world gauge, never CSS pixels.
      insets:[gauge*2.35,gauge*5.6],
      width:Math.max(.5,Math.min(1.6,gauge*.25)),
      dark:.24*amount,light:.30*amount,lighting,
      seed:l.heightSeed|0
    };
  });
}
function trace(ctx,points,closed,explicit=false){
  if(points.length<2)return null;
  // Only directional outlines need a separate Path2D, so their entire
  // current-path silhouette can be translated without moving source geometry.
  const target=explicit&&typeof Path2D==='function'?new Path2D():ctx;
  if(target===ctx)ctx.beginPath();
  target.moveTo(points[0].x,points[0].y);
  for(let i=1;i<points.length;i++)target.lineTo(points[i].x,points[i].y);
  if(closed)target.closePath();
  return target===ctx?undefined:target;
}
function strokeDeposit(ctx,style,path,inkWidth,depth){
  // Two hairline facets make a shallow furrow without expanding the vector
  // silhouette. Caller supplies an already-clipped Canvas2D drawing context.
  const l=style.lighting;
  const paint=(width,rgb,alpha,shift)=>{
    if(alpha<=0)return;
    ctx.save();
    ctx.lineWidth=width;
    ctx.strokeStyle='rgba('+rgb+','+Math.min(.6,alpha).toFixed(4)+')';
    if(path!==undefined&&l)ctx.translate(l.x*shift,l.y*shift);
    if(path===undefined)ctx.stroke();else ctx.stroke(path);
    ctx.restore();
  };
  paint(inkWidth,l?l.shade:'0,0,0',
    style.dark*(depth===0?1:.72)*(l?l.shadow:1),l?inkWidth*.7:0);
  paint(inkWidth*.48,l?l.high:'255,255,255',
    style.light*(depth===0?.85:1)*(l?l.light:1),l?-inkWidth*.6:0);
}
/** Each polygon offset is measured against the ORIGINAL collection of rings.
 * This uses the existing even-odd Euclidean offset engine, not centroid
 * scaling, so holes expand and narrow necks honestly collapse or split.
 * Bounds are only a viewport culling hint, never a source-geometry change. */
export function paintSandRegionEchoes(ctx,object,styles,bounds=null){
  if(!styles?.length||!object)return 0;
  let count=0;
  ctx.save();ctx.lineJoin='round';ctx.lineCap='butt';
  for(const style of styles){
    for(let depth=0;depth<style.insets.length;depth++){
      const distance=style.insets[depth];
      if(!finite(distance)||distance<=0)continue;
      const width=style.width*(depth===0?1:.83);
      if(object.circle){
        const {cx,cy,r}=object.circle;
        if(![cx,cy,r].every(finite)||r-distance<=width*.55)continue;
        const path=style.lighting&&typeof Path2D==='function'?new Path2D():null;
        const target=path||ctx;
        if(!path)ctx.beginPath();
        target.arc(cx,cy,r-distance,0,TAU);
        strokeDeposit(ctx,style,path||undefined,width,depth);count++;
      }else{
        const rings=object.rings||[object.vertices];
        const vertexCount=rings.reduce((n,ring)=>n+(ring?.length||0),0);
        // Large supplied source vectors are safe and still get the existing
        // fine sand and rim. Do not force expensive 2D inset solving on them
        // until a measured adaptive implementation is available.
        if(vertexCount>MAX_SOURCE_VERTICES||!vertexCount)continue;
        const contours=polygonInsetContours(rings,distance,{
          bounds,resolution:1.5,padding:Math.max(18,distance*2)
        });
        let renderedPoints=0;
        for(const contour of contours){
          if((renderedPoints+=contour.points.length)>MAX_CONTOUR_POINTS)break;
          if(!contour.closed||contour.points.length<3)continue;
          const path=trace(ctx,contour.points,true,!!style.lighting);
          if(path===null)continue;
          strokeDeposit(ctx,style,path,width,depth);count++;
        }
      }
    }
  }
  ctx.restore();return count;
}
/** Trace ribbons at real inward distances, interpolated between the
 * unmodified edge point and the centreline at the SAME source station.
 * Crop windows and crossing replays share the same source station grid.
 * A naturally pinched/tapered cross-section simply has no inner contour.
 * The caller owns stripeFillPath() clipping and crossing branch masks. */
export function paintSandRibbonEchoes(ctx,stripe,extent,styles,
  pointAt,centerAt,widthAtStation,range=null){
  if(!styles?.length||!stripe||!finite(extent)||extent<=0||
     typeof pointAt!=='function'||typeof centerAt!=='function'||
     typeof widthAtStation!=='function')return 0;
  const start=Math.max(stripe.segmentStart??-extent,range?.start??-extent);
  const end=Math.min(stripe.segmentEnd??extent,range?.end??extent);
  if(!finite(start)||!finite(end)||end<=start)return 0;
  const step=3.6,origin=-(stripe.coreExtent??extent);
  const first=Math.ceil((start-origin)/step-1e-9);
  const last=Math.floor((end-origin)/step+1e-9);
  // Explicitly bound path solving for oddly long authored ranges.
  if(last-first>7000)return 0;
  let count=0;
  ctx.save();ctx.lineJoin='round';ctx.lineCap='butt';
  for(const style of styles)for(let depth=0;depth<style.insets.length;depth++){
    const inset=style.insets[depth],inkWidth=style.width*(depth===0?1:.83);
    for(const side of [-1,1]){
      let active=false,path=null;
      const flush=()=>{if(active){strokeDeposit(ctx,style,path||undefined,inkWidth,depth);
        active=false;path=null;count++;}};
      for(let i=first;i<=last;i++){
        const station=origin+i*step;
        const halfWidth=widthAtStation(station)*.5;
        if(!finite(halfWidth)||halfWidth<=inset+inkWidth*.75){
          flush();continue;
        }
        const edge=pointAt(station,side),centre=centerAt(station);
        if(!edge||!centre||![edge.x,edge.y,centre.x,centre.y].every(finite)){
          flush();continue;
        }
        const t=inset/halfWidth;
        const x=edge.x+(centre.x-edge.x)*t;
        const y=edge.y+(centre.y-edge.y)*t;
        if(!active){
          path=style.lighting&&typeof Path2D==='function'?new Path2D():null;
          if(!path)ctx.beginPath();
          (path||ctx).moveTo(x,y);active=true;
        }else (path||ctx).lineTo(x,y);
      }
      flush();
    }
  }
  ctx.restore();return count;
}
