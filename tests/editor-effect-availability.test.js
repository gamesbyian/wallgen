import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene} from '../src/model.js';
import {stripeContourDistortionAvailability as availability} from '../src/editor-effect-availability.js';

const check=changes=>availability(resolveScene(normalizeRecipe({
  structure:'paths',material:'none',textureDisplacement:60,...changes
})));
test('contour distortion is dormant with no stripe-applied active layer',()=>{
  for(const changes of [
    {},{material:'linen',textureStrength:0},
    {material:'linen',textureStrength:60,textureCoverage:'background'},
    {material:'none',textureLayer2Enabled:true,material2:'grain',textureStrength2:50,textureCoverage2:'background'},
    {material:'grain',textureStrength:20,textureCoverage:'both',structure:'radial'}
  ])assert.equal(check(changes).available,false,JSON.stringify(changes));
});
test('any enabled, nonzero stripe-applied layer enables contour editing',()=>{
  for(const changes of [
    {material:'linen',textureStrength:35,textureCoverage:'stripes'},
    {material:'grain',textureStrength:45,textureCoverage:'both'},
    {textureLayer2Enabled:true,material2:'felt',textureCoverage2:'stripes',textureStrength2:30},
    {textureLayer3Enabled:true,material3:'stone',textureCoverage3:'both',textureStrength3:45},
    {material:'linen',textureStrength:25,textureCoverage:'background',
      textureLayer2Enabled:true,material2:'felt',textureStrength2:60,textureCoverage2:'stripes'}
  ])assert.equal(check(changes).available,true,JSON.stringify(changes));
});
test('disabled optional layers never contribute and their stored value is preserved',()=>{
  const recipe=normalizeRecipe({structure:'paths',textureDisplacement:79,
    material:'none',textureLayer2Enabled:false,
    material2:'linen',textureStrength2:65,textureCoverage2:'both'});
  assert.equal(availability(resolveScene(recipe)).available,false);
  assert.equal(recipe.textureDisplacement,79);
  assert.equal(availability(resolveScene({...recipe,textureLayer2Enabled:true})).available,true);
  assert.equal(recipe.textureDisplacement,79);
});
