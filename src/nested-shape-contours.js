// Seven true Euclidean offsets of one imported, editable compound region.
// The source silhouette is never rescaled for nesting or stored as raster ink.
import {polygonInsetContours} from './polygon-inset.js';

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const finite=(v,fallback,min,max)=>Number.isFinite(Number(v))?
  clamp(Number(v),min,max):fallback;

export const DEFAULT_NESTED_CONTOURS=Object.freeze({
  enabled:true,objectId:'region-0',count:7,strokeWidth:2,
  gap:5,firstInset:3,colourOrder:'forward',fit:'exact'
});

// The feature is opt-in. Absent on old recipes so legacy images remain pixel-identical.
export function normalizeNestedShapeContours(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
  const objectId=typeof raw.objectId==='string'&&/^region-(?:[0-9]|[1-6][0-9])$/.test(raw.objectId)?
    raw.objectId:'region-0';
  return {
    enabled:raw.enabled!==false,objectId,
    count:Math.round(finite(raw.count,7,1,7)),
    strokeWidth:finite(raw.strokeWidth,2,.5,12),
    gap:finite(raw.gap,5,.5,30),
    firstInset:finite(raw.firstInset,3,0,50),
    colourOrder:raw.colourOrder==='reverse'?'reverse':'forward',
    // Automatic fitting must never silently invent contours or change geometry.
    // Explicit fit currently draws every physically existing requested level.
    fit:'exact',
  };
}

// All seven contours are measured against the ORIGINAL border. Never offset
// a previously quantized offset: accumulated error crowds elongated shapes.
export function nestedContourDistances(settings){
  if(!settings?.enabled)return [];
  const first=settings.firstInset+settings.strokeWidth/2;
  const step=settings.gap+settings.strokeWidth;
  return Array.from({length:settings.count},(_,i)=>first+i*step);
}

/** Pure, render-resolution-independent geometry for reference, worker and PNG.
 * Returns fewer contours, honestly, when a thin region collapses. A single
 * distance may generate disconnected loops or expanding negative-space holes.
 */
export function planNestedShapeContours(rings,settings,options={}){
  if(!settings?.enabled||!Array.isArray(rings)||!rings.length)
    return {levels:[],visibleCount:0,requestedCount:settings?.count??0,collapsed:0};
  const distances=nestedContourDistances(settings);
  const levels=distances.map((distance,index)=>({
    index,distance,
    contours:polygonInsetContours(rings,distance,{
      bounds:options.bounds,padding:options.padding??80,
      // The canonical world-aligned grid is independent of wallpaper output
      // dimensions and camera crop. This slightly refines the default pitch.
      resolution:options.resolution??1.0
    })
  }));
  const visibleCount=levels.filter(level=>level.contours.length>0).length;
  return {levels,visibleCount,requestedCount:levels.length,
    collapsed:levels.length-visibleCount};
}
