import {prepareLocalFonts,localFontsReady,isLocalFontId,fontFamilyForId} from './local-fonts.js';
import {prepareBundledFonts,bundledFontsReady,isBundledFontId,bundledFontFamily} from './bundled-fonts.js';
import {TEXT_FONTS} from './text-overlays.js';

// One canonical font readiness boundary for worker, direct render,
// thumbnail and exports. No second text rasterizer or ad-hoc DOM overlay.
export const typefacesReady=recipe=>localFontsReady(recipe)&&bundledFontsReady(recipe);
export async function prepareTypefaces(recipe){
  await Promise.all([prepareLocalFonts(recipe),prepareBundledFonts(recipe)]);
}
export function typefaceCssFamily(id){
  if(isLocalFontId(id))return '"'+fontFamilyForId(id)+'"';
  if(isBundledFontId(id))return '"'+bundledFontFamily(id)+'"';
  return TEXT_FONTS[id]||TEXT_FONTS.bold;
}
export const recipeHasCustomTypefaces=recipe=>
  (recipe?.textOverlays||[]).some(item=>item.enabled!==false&&item.text&&
    (isLocalFontId(item.font)||isBundledFontId(item.font)));
