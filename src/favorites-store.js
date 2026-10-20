import {normalizeRecipe} from './model.js';

// A single damaged record must not erase unrelated, valid saved wallpapers.
// Keep partial legacy recipes with a seed: normalisation supplies versioned
// defaults, exactly as it does for older URL and PNG recipes.
export function parseStoredFavorites(raw,limit=60){
  let stored;
  try{stored=JSON.parse(raw||'[]');}catch{return [];}
  if(!Array.isArray(stored))return [];
  const favorites=[],seen=new Set();
  // Storage is untrusted. Bound parsing/normalisation work even if an
  // extension or old app version has written a huge malformed collection.
  for(const item of stored.slice(0,limit*5)){
    if(favorites.length>=limit)break;
    if(!item||typeof item!=='object'||Array.isArray(item)||
       typeof item.seed!=='string'||!item.seed.trim())continue;
    try{
      const recipe=normalizeRecipe(item);
      const signature=JSON.stringify(recipe);
      // Legacy/imported storage can contain repeated objects and differently
      // formatted representations of one normalized wallpaper. Saved is a set
      // of designs; a duplicate must not occupy a second card or count slot.
      if(seen.has(signature))continue;
      seen.add(signature);
      favorites.push(recipe);
    }catch{/* A malformed entry cannot poison the whole gallery. */}
  }
  return favorites;
}
