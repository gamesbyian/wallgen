import {normalizeRecipe} from './model.js';

// A single damaged record must not erase unrelated, valid saved wallpapers.
// Keep partial legacy recipes with a seed: normalisation supplies versioned
// defaults, exactly as it does for older URL and PNG recipes.
export function parseStoredFavorites(raw,limit=60){
  let stored;
  try{stored=JSON.parse(raw||'[]');}catch{return [];}
  if(!Array.isArray(stored))return [];
  const favorites=[];
  // Storage is untrusted. Bound parsing/normalisation work even if an
  // extension or old app version has written a huge malformed collection.
  for(const item of stored.slice(0,limit*5)){
    if(favorites.length>=limit)break;
    if(!item||typeof item!=='object'||Array.isArray(item)||
       typeof item.seed!=='string'||!item.seed.trim())continue;
    try{favorites.push(normalizeRecipe(item));}
    catch{/* A malformed entry cannot poison the whole gallery. */}
  }
  return favorites;
}
