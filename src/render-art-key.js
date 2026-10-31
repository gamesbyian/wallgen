// Only physically lit material marks need the source artwork repainted when
// global Lighting controls change. Other designs retain the instant
// compositor-only preview path for directional ambient / silhouette changes.
import {normalizeRecipe} from './model.js';
export const hasDirectionalSand=(recipe)=>{
  const active=(material,strength,enabled)=>enabled&&
    typeof material==='string'&&material.startsWith('sand-')&&
    Number(strength)>0;
  return active(recipe.material,recipe.textureStrength,true)||
    active(recipe.material2,recipe.textureStrength2,recipe.textureLayer2Enabled)||
    active(recipe.material3,recipe.textureStrength3,recipe.textureLayer3Enabled);
};
export function artKey(input){
  const recipe=normalizeRecipe(input);
  const {positionX,positionY,lockedSettings,primesOnly,
    lightingMood,lightDirection,lightStrength,shadowStrength,
    stripeShadowStrength,stripeShadowSoftness,stripeShadowDirection,...art}=recipe;
  // The exact same key is used for worker response freshness, nudge cache,
  // and photo comparison. Repaint only if these lighting settings can alter
  // the immutable source ink or material background.
  if(hasDirectionalSand(recipe))
    Object.assign(art,{lightingMood,lightDirection,lightStrength,shadowStrength});
  return JSON.stringify(art);
}
