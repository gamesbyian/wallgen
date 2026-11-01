// Source-lit mineral and authored embroidery marks need repainting when
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
/** Lighting also paints into stitch ink for enabled object/palette/all
 * embroidery. No treatment means the old compositor-only instant path. */
export const hasDirectionalEmbroidery=recipe=>
  Array.isArray(recipe.surfaceTreatments)&&recipe.surfaceTreatments.some(t=>
    t?.enabled===true&&t.materialFamily==='embroidery'&&t.target?.role==='fill');

export function artKey(input){
  const recipe=normalizeRecipe(input);
  const {positionX,positionY,lockedSettings,primesOnly,
    lightingMood,lightDirection,lightStrength,shadowStrength,
    stripeShadowStrength,stripeShadowSoftness,stripeShadowDirection,...art}=recipe;
  // The exact same key is used for worker response freshness, nudge cache,
  // and photo comparison. Repaint only if these lighting settings can alter
  // the immutable source ink or material background.
  if(hasDirectionalSand(recipe)||hasDirectionalEmbroidery(recipe))
    Object.assign(art,{lightingMood,lightDirection,lightStrength,shadowStrength});
  return JSON.stringify(art);
}
