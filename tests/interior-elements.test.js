import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';
import {normalizeInteriorElements,elementWave} from '../src/interior-elements.js';

test('interior stack validates malformed and excessive elements safely',()=>{
  const elements=normalizeInteriorElements(Array.from({length:20},(_,i)=>({
    id:'a',type:i%2?'band':'line',shape:'unknown',width:-12,
    frequency:Infinity,opacity:12,position:-4
  })));
  assert.equal(elements.length,8);
  assert.equal(new Set(elements.map(x=>x.id)).size,8);
  assert.ok(elements.every(x=>x.width>=.15&&x.opacity<=1&&x.position>=-.48));
  assert.ok(elements.every(x=>x.shape==='straight'&&Number.isFinite(x.frequency)));
});

test('unified objects carry identical decoration specifications in all structures',()=>{
  const interiorElements=[{id:'wave-1',shape:'wave',stroke:'dotted',width:1.5,color:'white'}];
  for(const structure of ['paths','radial','regions']){
    const scene=resolveScene({structure,interiorElements,seed:'universal-decoration'});
    assert.equal(scene.interiorElements.length,1);
    assert.equal(scene.interiorElements[0].shape,'wave');
    assert.ok(scene.objects.length);
    assert.deepEqual(scene,resolveScene({structure,interiorElements,seed:'universal-decoration'}));
  }
});

test('recipes preserve element order and parameters',()=>{
  const recipe=normalizeRecipe({interiorElements:[
    {id:'first',shape:'loop',phase:90,amplitude:.3},
    {id:'second',type:'band',shape:'straight',color:'darker'}
  ]});
  assert.deepEqual(normalizeRecipe(recipe).interiorElements,recipe.interiorElements);
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)).interiorElements,recipe.interiorElements);
  assert.ok(elementWave(recipe.interiorElements[0],.13)<=1);
});
