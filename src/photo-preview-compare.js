// Preview-only substitution for photographic Before/After. Never writes into
// the real recipe, history or PNG metadata and never changes camera framing.
export function photoPreviewRecipe(recipe,showBefore=false){
  if(!showBefore||!recipe?.photoLook?.enabled)return recipe;
  return {...recipe,photoLook:{...recipe.photoLook,enabled:false}};
}
