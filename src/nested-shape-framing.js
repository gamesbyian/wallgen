// Author-controlled placement of ONE imported nested silhouette in the
// canonical 600x1300 design plane. This changes the existing scattered-object
// transform only; source vertices, holes, offsets, and camera remain untouched.
import {normalizeScatteredOverrides} from './scattered-object-edits.js';

const WIDTH=600,HEIGHT=1300,MAX_RADIUS=WIDTH*1.2;
export const NESTED_FRAME_MARGINS=Object.freeze({x:42,y:90});

export function frameImportedSilhouette(geometry,margins=NESTED_FRAME_MARGINS){
  if(geometry?.geometry)geometry=geometry.geometry;
  if(geometry?.type!=='compound-region'||!Array.isArray(geometry.components)||
    !Array.isArray(geometry.viewBox)||geometry.viewBox.length!==4)return null;
  const [vx,vy,vw,vh]=geometry.viewBox;
  if(![vx,vy,vw,vh].every(Number.isFinite)||vw<=0||vh<=0)return null;
  if(!Number.isFinite(margins.x)||!Number.isFinite(margins.y)||
     margins.x<0||margins.y<0||margins.x>=WIDTH/2||
     margins.y>=HEIGHT/2)return null;
  const vertices=[];
  for(const component of geometry.components){
    if(!Array.isArray(component.outer)||!Array.isArray(component.holes))return null;
    for(const ring of [component.outer,...component.holes]){
      if(!Array.isArray(ring))return null;
      for(const p of ring){
        if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite))return null;
        vertices.push(p);
      }
    }
  }
  if(vertices.length<3)return null;
  const xs=vertices.map(p=>p[0]),ys=vertices.map(p=>p[1]);
  const x0=Math.min(...xs),x1=Math.max(...xs),
    y0=Math.min(...ys),y1=Math.max(...ys);
  const dx=x1-x0,dy=y1-y0;
  if(dx<=1e-9||dy<=1e-9)return null;
  const ox=vx+vw/2,oy=vy+vh/2;
  const radiusUnit=Math.max(...vertices.map(p=>Math.hypot(p[0]-ox,p[1]-oy)));
  if(!Number.isFinite(radiusUnit)||radiusUnit<=1e-9)return null;
  // Fit the *actual silhouette bounding box*, not the asset's viewBox or
  // the circumscribing placement disk. Preserve the source aspect ratio.
  const scale=Math.min(
    (WIDTH-2*margins.x)/dx,
    (HEIGHT-2*margins.y)/dy,
    MAX_RADIUS/radiusUnit
  );
  if(!Number.isFinite(scale)||scale<=0)return null;
  const cx=WIDTH/2-((x0+x1)/2-ox)*scale;
  const cy=HEIGHT/2-((y0+y1)/2-oy)*scale;
  const normalized=normalizeScatteredOverrides([{
    index:0,x:cx/WIDTH,y:cy/HEIGHT,radius:scale*radiusUnit/WIDTH
  }])[0];
  if(!normalized)return null;
  // Guard against cap/rounding silently moving real geometry outside the
  // advertised safe frame (e.g. padded/off-axis viewBox input).
  const fittedScale=normalized.radius*WIDTH/radiusUnit;
  const left=normalized.x*WIDTH+(x0-ox)*fittedScale;
  const right=normalized.x*WIDTH+(x1-ox)*fittedScale;
  const top=normalized.y*HEIGHT+(y0-oy)*fittedScale;
  const bottom=normalized.y*HEIGHT+(y1-oy)*fittedScale;
  if(left<margins.x-.01||right>WIDTH-margins.x+.01||
     top<margins.y-.01||bottom>HEIGHT-margins.y+.01)return null;
  return normalized;
}


/**
 * Enable Nest on an already imported silhouette. Respect the author's
 * previous object-0 transform if any; otherwise give it the same source-aware
 * framing as My shapes & paths → Nest rainbow. Other pigment-slot edits are
 * carried through unchanged, and all changes remain one normal recipe Undo.
 */
export function frameUnpositionedNestedSilhouette(recipe,geometry){
  const previous=normalizeScatteredOverrides(recipe?.scatteredOverrides);
  if(previous.some(item=>item.index===0))return previous;
  const framed=frameImportedSilhouette(geometry);
  return framed?[...previous,framed].sort((a,b)=>a.index-b.index):previous;
}
