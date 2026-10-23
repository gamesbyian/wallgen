// Investigation-only candidate, deliberately absent from the PNG migration path.
// First-v1 provenance is established by the caller's pinned source/PNG fixtures;
// a v1 envelope alone cannot identify its renderer era.
import {normalizeRecipe as firstV1Normalize} from
  '../docs/recipe-format-history/source-era/v1-37428b/src/model.js';
import {normalizeRecipe as modernNormalize} from '../src/model.js';

const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function firstV1PreviewCandidate(source){
  if(!source||typeof source!=='object'||Array.isArray(source)||
    source.version!==1||!Object.hasOwn(source,'stripeShadowEnabled')||
    !same(firstV1Normalize(source),source))
    throw Error('Parity probe requires a fully normalized, explicit-shadow initial-v1 source fixture');
  const injected={...source,
    // Source-era paths were the only structure. Other current defaults are
    // retained as hypotheses, not assumed to preserve the old painter.
    version:2,structure:'paths',composition:'single',construction:'ribbon',
    stripeShadowStrength:source.stripeShadowEnabled?source.stripeShadowStrength:0};
  const candidate=modernNormalize(injected);
  const older=new Set(Object.keys(source)),newer=new Set(Object.keys(candidate));
  const sourceOnly=[...older].filter(key=>!newer.has(key));
  const modernOnly=[...newer].filter(key=>!older.has(key));
  const alteredShared=[...older].filter(key=>newer.has(key)&&
    !same(source[key],candidate[key])).map(key=>({
      key,sourceValue:source[key],candidateValue:candidate[key]
    }));
  return {
    candidate,
    fieldAudit:{sourceOnly,modernOnly,alteredShared},
    assumptions:['Initial 37428b v1 only; envelope v1 does not date other PNGs',
      'Paths/single/ribbon and modern-only defaults are conjectural',
      'Shadow off -> current strength zero; shadow on retains source strength',
      'Canvas painter, RNG stream and material/output pixel parity unproven'],
    safeForMigration:false,
  };
}
