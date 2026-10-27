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

// A true offset of a CLOSED imported region cannot end abruptly in the
// middle of the polygon. The marching-squares candidate frontier can,
 // however, leave a short open chain near a topology pinch. Only a genuinely
// camera-cropped chain whose BOTH ends touch the bounded contour envelope
// is eligible. This prevents visible line-cap dots in native-size wallpapers.
function validContour(contour,distance,settings,options){
  const points=contour.points;
  if(points.length<2)return false;
  const length=points.reduce((total,p,i)=>i?
    total+Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y):0,0)+
    (contour.closed?Math.hypot(points[0].x-points.at(-1).x,
      points[0].y-points.at(-1).y):0);
  // Tiny final erosion islands are mathematical remnants but not readable
  // outlined design elements. A stable minimum length prevents bright dots.
  if(length<Math.max(8,settings.strokeWidth*5))return false;
  if(contour.closed)return true;
  const bounds=options.bounds;
  if(!bounds)return false;
  const padding=distance+Math.max(12,options.padding??80);
  const tol=3*(options.resolution??1)+2;
  const near=p=>Math.abs(p.x-(bounds.left-padding))<=tol||
    Math.abs(p.x-(bounds.right+padding))<=tol||
    Math.abs(p.y-(bounds.top-padding))<=tol||
    Math.abs(p.y-(bounds.bottom+padding))<=tol;
  return near(points[0])&&near(points.at(-1));
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
    }).filter(contour=>validContour(contour,distance,settings,options))
  }));
  const visibleCount=levels.filter(level=>level.contours.length>0).length;
  return {levels,visibleCount,requestedCount:levels.length,
    collapsed:levels.length-visibleCount};
}


// An explicit one-click fit. This adjusts the existing *authored* dimensions;
// it never rescales the source polygon, changes the offset definition, or
// silently varies gap with camera/export resolution. Fewer than the requested
// number of surviving levels is a refusal, not a successful auto-fit.
export function fitNestedShapeContours(rings,settings,options={}){
  const unchanged={settings:{...settings},fitted:false,changed:false,
    reason:'No imported silhouette to fit.'};
  if(!settings?.enabled||!Array.isArray(rings)||!rings.length)return unchanged;
  const vertices=(Array.isArray(rings[0])?rings:[rings]).flat();
  if(vertices.length<3||vertices.some(p=>
    !Number.isFinite(p?.x)||!Number.isFinite(p?.y)))return unchanged;
  const x=vertices.map(p=>p.x),y=vertices.map(p=>p.y);
  const halfSpan=Math.min(Math.max(...x)-Math.min(...x),
    Math.max(...y)-Math.min(...y))/2;
  // Skip costly contour evaluation when the last inset demonstrably cannot
  // fit in the shape's bounding box; the bound is necessary, not sufficient.
  const survives=proposal=>{
    const last=nestedContourDistances(proposal).at(-1);
    if(last>=halfSpan)return false;
    const report=planNestedShapeContours(rings,proposal,{
      resolution:options.resolution??1.0,padding:options.padding??80
    });
    return report.visibleCount===proposal.count;
  };
  const current={...settings};
  if(survives(current))return {settings:current,fitted:true,changed:false,
    reason:'All requested levels already fit.'};
  let candidate={...current};
  // Clear gap first, then outer margin, only then sacrifice stroke legibility.
  // Each step retains the maximum half-pixel increment verified to fit.
  for(const [key,min] of [['gap',.5],['firstInset',0],['strokeWidth',.5]]){
    if(key==='gap'&&candidate.count===1)continue;
    const maximum=candidate[key];
    if(maximum<=min)continue;
    const smallest={...candidate,[key]:min};
    if(!survives(smallest)){
      candidate=smallest;continue;
    }
    let lo=min,hi=maximum;
    for(let i=0;i<8;i++){
      const mid=(lo+hi)/2;
      if(survives({...candidate,[key]:mid}))lo=mid;
      else hi=mid;
    }
    const rounded=Math.max(min,Math.floor((lo+1e-9)*2)/2);
    const fitted={...candidate,[key]:rounded};
    if(survives(fitted))
      return {settings:fitted,fitted:true,changed:true,
        reason:'Spacing fitted to surviving geometric contour levels.'};
    // An unusual non-monotonic topology should never result in a false
    // success. The minimum was independently checked above.
    return {settings:smallest,fitted:true,changed:true,
      reason:'Used minimum spacing to preserve every contour level.'};
  }
  // A silhouette may physically be thinner than seven minimum-width lines.
  // Return the original authoring values so a failed action never changes art.
  return {...unchanged,reason:'This silhouette is too narrow for '+settings.count+
    ' outlines even at minimum width and spacing. Enlarge the shape or reduce the line count.'};
}
