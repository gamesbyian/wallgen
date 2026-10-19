import {normalizeRecipe} from './model.js';

/**
 * Commit a prepared Draw stroke. Editing an existing saved path preserves
 * layout orientation and composition position exactly, even if those values
 * are dormant for drawn geometry. Importing or drawing a replacement retains
 * the original centered/horizontal defaults, but never changes the camera.
 *
 * The caller still uses the ordinary changeRecipe lock and Undo transaction.
 */
export function appliedDrawnPathRecipe(input,points,anchors=[],corners=[],
  extended=false,preservePosition=false){
  const recipe=normalizeRecipe(input);
  return normalizeRecipe({
    ...recipe,
    customPath:points,
    drawnAnchors:anchors,
    drawnCorners:corners,
    extendDrawnPath:extended,
    structure:'paths',
    geometry:'drawn',
    orientation:preservePosition?recipe.orientation:'horizontal',
    positionX:preservePosition?recipe.positionX:0,
    positionY:preservePosition?recipe.positionY:0
  });
}
