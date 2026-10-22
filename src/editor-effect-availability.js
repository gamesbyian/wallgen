// A presentation-only reflection of the renderer's actual relief prerequisites.
// resolveScene() has already removed disabled, unselected or zero-strength
// layers. textureHeight() samples only layers which apply to the stripes.
// A dormant editor slider must never erase its saved value.
export function stripeContourDistortionAvailability(scene){
  if(scene?.structure!=='paths')
    return {available:false,reason:'Contour distortion applies to path stripes only.'};
  if(!scene.textureLayers?.some(layer=>layer.coverage!=='background'))
    return {available:false,reason:'Choose a texture applied to stripes (not background only) and raise its strength to enable contour distortion.'};
  return {available:true,reason:''};
}
