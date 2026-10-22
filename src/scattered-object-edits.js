// Portable per-object adjustments for scattered scenes. Non-empty edits are
// embedded in the wallpaper recipe, never looked up from local library state.
// Normalized x/y reference the full 600x1300 art plane; radius references 600.
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const round=v=>Math.round(v*1e6)/1e6;

export function normalizeScatteredOverrides(value){
  if(!Array.isArray(value))return [];
  const found=new Map();
  // Bounded recipe size and explicit object keys: hostile/old recipes remain inert.
  for(const raw of value.slice(0,70)){
    if(!raw||typeof raw!=='object'||Array.isArray(raw))continue;
    const {index,x,y,radius}=raw;
    if(!Number.isInteger(index)||index<0||index>=70||
      !finite(x)||!finite(y)||!finite(radius))continue;
    found.set(index,{index,x:round(clamp(x,-.5,1.5)),
      y:round(clamp(y,-.5,1.5)),radius:round(clamp(radius,.01,1.2))});
  }
  return [...found.values()].sort((a,b)=>a.index-b.index);
}
