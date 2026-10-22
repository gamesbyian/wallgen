// Pure scene-to-tool visibility policy shared by the live editor and tests.
// A hidden tool keeps its original recipe settings and locks intact.
const PATH_TOOLS=new Set(['geometry','safety','turn','single-loop','shape-details','ends']);
const RADIAL_TOOLS=new Set(['rays','ray-shape','origin']);
const REGION_TOOLS=new Set(['regions','region-detail','origin',
  'scattered-size','scattered-distribution','scattered-edges']);

export function toolAppliesToScene(entry,{structure='paths',regionMode='voronoi',construction='ribbon'}={}){
  if(entry.category==='path'){
    if(structure==='paths')return PATH_TOOLS.has(entry.id);
    if(structure==='radial')return RADIAL_TOOLS.has(entry.id);
    if(!REGION_TOOLS.has(entry.id))return false;
    if(entry.id==='origin')return regionMode==='nested';
    if(entry.id==='region-detail')return regionMode!=='scattered';
    if(entry.id.startsWith('scattered-'))return regionMode==='scattered';
    return true;
  }
  if(entry.category==='stripes')
    return structure==='paths'&&(entry.id!=='tone'||construction==='tonal');
  if(entry.category==='details'){
    if(entry.id==='outlines')return structure==='paths';
    if(entry.id==='dividers')return structure!=='paths';
  }
  if(entry.category==='layout')return entry.id==='structure-mode'||structure==='paths';
  if(entry.category==='material'&&entry.id==='surface')return structure==='paths';
  return true;
}
