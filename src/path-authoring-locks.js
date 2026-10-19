/** Path drawing and image-derived path import always commit a Paths
 * composition. A locked non-Paths structure cannot silently accept dormant
 * geometry while reporting successful visible authoring. A structure already
 * locked to Paths is safe to edit without changing the structure lock. */
export function pathStructureLockedOutsidePaths(recipe){
  return recipe?.structure!=='paths'&&
    recipe?.lockedSettings?.includes('structure')===true;
}
export function drawAuthoringLockReason(recipe){
  if(recipe?.lockedSettings?.includes('geometry'))return 'geometry';
  if(pathStructureLockedOutsidePaths(recipe))return 'structure';
  return null;
}
export function drawAuthoringLockMessage(reason){
  return reason==='structure'?
    'Unlock Layout structure or switch to Paths before drawing or importing a path.':
    'Unlock Path geometry before drawing or importing a path.';
}
