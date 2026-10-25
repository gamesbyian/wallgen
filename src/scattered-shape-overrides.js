// Opt-in portable per-hue compound geometry for the ordinary scattered scene.
// No pixel caches, library lookup, second scene model, or source provenance.
import {normalizeCompoundRegion,GEOMETRY_SNAPSHOT_SCHEMA}
  from './geometry-asset.js';

export const PER_HUE_SHAPE_LIMIT=7;
export const PER_HUE_TOTAL_BYTES=192*1024;
export const PER_HUE_VERTICES_PER_SHAPE=1200;
const bytes=new TextEncoder();

/** Invalid/unsupported user snapshots are inert. The whole per-hue payload is
 * capped independently of the full-size Shape Library's own generous limits.
 * Only first occurrence of each canonical hue slot is accepted.
 */
export function normalizeScatteredShapeOverrides(value){
  if(!Array.isArray(value))return [];
  const seen=new Set(),output=[];
  let size=0;
  for(const item of value.slice(0,70)){
    if(!item||typeof item!=='object'||Array.isArray(item)||
      !Number.isInteger(item.index)||item.index<0||
      item.index>=PER_HUE_SHAPE_LIMIT||seen.has(item.index))continue;
    const input=item.shape;
    if(input?.schema!==GEOMETRY_SNAPSHOT_SCHEMA||
      input?.version!==1||!input.geometry||
      !Array.isArray(input.geometry.components))continue;
    // Refuse grossly oversized rings *before* the quadratic geometric
    // self-crossing validator; no arbitrary JSON copy or script execution.
    const groups=input.geometry.components;
    if(groups.length<1||groups.length>32)continue;
    let vertices=0,valid=true;
    for(const group of groups){
      if(!Array.isArray(group?.outer)||!Array.isArray(group?.holes)||
        group.holes.length>64){valid=false;break;}
      vertices+=group.outer.length;
      for(const ring of group.holes){
        if(!Array.isArray(ring)){valid=false;break;}
        vertices+=ring.length;
      }
      if(vertices>PER_HUE_VERTICES_PER_SHAPE){valid=false;break;}
    }
    if(!valid)continue;
    try{
      const geometry=normalizeCompoundRegion(input.geometry);
      const shape={schema:GEOMETRY_SNAPSHOT_SCHEMA,version:1,geometry};
      const cost=bytes.encode(JSON.stringify(shape)).length;
      if(cost>PER_HUE_TOTAL_BYTES||size+cost>PER_HUE_TOTAL_BYTES)
        continue;
      output.push({index:item.index,shape});
      seen.add(item.index);size+=cost;
    }catch{/* Invalid user geometry must not become a renderer input. */}
  }
  return output.sort((a,b)=>a.index-b.index);
}
