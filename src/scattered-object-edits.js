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


// Back-to-front object IDs. Scene order is independent of pigment identity,
// saved circle geometry, library asset IDs or interaction hit-testing.
// Omitted property means the old natural layer order, with no extra bytes.
export function normalizeScatteredLayerOrder(value){
  if(!Array.isArray(value))return [];
  const seen=new Set(),order=[];
  for(const index of value.slice(0,70)){
    if(!Number.isInteger(index)||index<0||index>=70||seen.has(index))continue;
    seen.add(index);order.push(index);
  }
  return order;
}

export function effectiveScatteredLayerOrder(value,indices){
  const available=[...new Set(indices.filter(i=>Number.isInteger(i)&&i>=0&&i<70))]
    .sort((a,b)=>a-b);
  const exists=new Set(available);
  const explicit=normalizeScatteredLayerOrder(value).filter(i=>exists.has(i));
  const listed=new Set(explicit);
  return [...explicit,...available.filter(i=>!listed.has(i))];
}

/** Move one selected shape by one visible paint layer. Returns null on no-op. */
export function moveScatteredLayer(value,index,direction,available){
  if(direction!==1&&direction!==-1)return null;
  const ordered=effectiveScatteredLayerOrder(value,available);
  const from=ordered.indexOf(index),to=from+direction;
  if(from<0||to<0||to>=ordered.length)return null;
  [ordered[from],ordered[to]]=[ordered[to],ordered[from]];
  // Keep explicitly authored hidden slots from a temporarily smaller count;
  // they are still portable if the creator increases the count later.
  const hidden=normalizeScatteredLayerOrder(value)
    .filter(i=>!ordered.includes(i));
  const full=[...ordered,...hidden];
  return full.every((id,i)=>id===i)?[]:full;
}
