import {normalizeRecipe,respectSettingLocks} from './model.js';

// Reconciliation belongs at Apply time, not at source-image analysis time:
// the creator may have changed locks while the candidate was being painted.
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function prepareReconstructionApply(currentInput,candidateInput,description){
  const current=normalizeRecipe(currentInput);
  const candidate=normalizeRecipe(candidateInput);
  const safe=respectSettingLocks(current,candidate);
  const lockedChanges=current.lockedSettings.filter(key=>{
    if(key==='position')
      return !same(safe.positionX,candidate.positionX)||
        !same(safe.positionY,candidate.positionY);
    if(key==='geometry')
      return ['geometry','customPath','drawnAnchors','drawnCorners','extendDrawnPath']
        .some(field=>!same(safe[field],candidate[field]));
    if(key==='material2')
      return !same(safe.material2,candidate.material2)||
        !same(safe.textureLayer2Enabled,candidate.textureLayer2Enabled);
    if(key==='material3')
      return !same(safe.material3,candidate.material3)||
        !same(safe.textureLayer3Enabled,candidate.textureLayer3Enabled);
    return !same(safe[key],candidate[key]);
  });
  return {
    recipe:normalizeRecipe({...safe,reconstructionOrigin:{
      origin:'inferred-image',method:'current-render-fit-v1',
      candidateKind:description.kind,
      sourceWidth:description.sourceWidth,
      sourceHeight:description.sourceHeight,
      initialFitError:description.error
    }}),
    lockedChanges
  };
}
