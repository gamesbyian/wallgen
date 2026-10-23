// A tiny explicitly authored imported shape with a donut hole and an island.
// Uses the identical canonical snapshot/scene model as a saved Shape Library
// stamp; no ad-hoc Canvas paint or runtime library lookup.
import {normalizeRecipe,resolveScene} from '../src/model.js';
import {GEOMETRY_SNAPSHOT_SCHEMA} from '../src/geometry-asset.js';

export const COMPOUND_STITCH_GEOMETRY=Object.freeze({
  type:'compound-region',space:'asset-local',viewBox:[0,0,160,100],
  fillRule:'evenodd',
  components:[
    {outer:[[12,12],[98,12],[98,88],[12,88]],
      holes:[[[40,34],[72,34],[72,65],[40,65]]]},
    {outer:[[117,35],[150,35],[150,68],[117,68]],holes:[]}
  ]
});
export function compoundStitchRecipe(seed='compound-thread-proof',style=null){
  const recipe=normalizeRecipe({
    seed,family:'studio',palette:'classic',background:'black',material:'none',
    lightingMood:'off',stripeShadowStrength:0,outline:'none',glow:0,
    structure:'regions',regionMode:'scattered',scatteredShapeKind:'imported',
    scatteredShape:{schema:GEOMETRY_SNAPSHOT_SCHEMA,version:1,
      geometry:COMPOUND_STITCH_GEOMETRY},
    scatteredCount:1,scatteredMinSize:25,scatteredMaxSize:65,
    scatteredVariation:0,scatteredSpacing:0,scatteredOverlap:'separate',
    scatteredEdgeCrop:0,
    scatteredOverrides:[{index:0,x:.5,y:.5,radius:.35}],
    dividerColor:'none',dividerWidth:0,
    ...(style?{surfaceTreatments:[{id:'compound-proof-thread',enabled:true,
      materialFamily:'embroidery',style,
      target:{scope:'object',role:'fill',ids:['region-0'],colorSlots:[]},
      pitch:5,relief:85,direction:28}]}:{})
  });
  const objects=resolveScene(recipe).objects;
  if(objects.length!==1||objects[0].rings?.length!==3)
    throw Error('Compound embroidery reference failed to preserve hole and island');
  return recipe;
}
