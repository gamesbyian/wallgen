import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene,respectSettingLocks,encodeRecipe,decodeRecipe}
  from '../src/model.js';

const base=()=>normalizeRecipe({seed:'optional-layer-lock',
  material:'linen',textureStrength:40,
  material2:'foil',textureLayer2Enabled:true,textureStrength2:71,
  textureCoverage2:'stripes',textureBlend2:'multiply',textureRotation2:145,
  material3:'stone',textureLayer3Enabled:false,textureStrength3:52,
  textureCoverage3:'background',textureBlend3:'screen',textureRotation3:278,
  viewZoom:.5,viewPanX:31,viewPanY:-16,positionX:11,positionY:-8});
const layerState=r=>({two:r.textureLayer2Enabled,material2:r.material2,
  three:r.textureLayer3Enabled,material3:r.material3});
test('locking each optional layer material also preserves its enabled state',()=>{
  for(const combination of [
    ['material2'],['material3'],['material2','material3']
  ]){
    const current=normalizeRecipe({...base(),lockedSettings:combination});
    const attack={...current,textureLayer2Enabled:false,material2:'none',
      textureLayer3Enabled:true,material3:'none',viewPanX:-11,
      textureRotation2:55,textureRotation3:188};
    const next=respectSettingLocks(current,attack);
    for(const layer of [2,3]){
      const material='material'+layer,enabled='textureLayer'+layer+'Enabled';
      if(combination.includes(material)){
        assert.equal(next[material],current[material],material);
        assert.equal(next[enabled],current[enabled],enabled+' bypassed material lock');
      }else{
        assert.equal(next[material],'none',material+' unlocked');
        assert.equal(next[enabled],layer===3,enabled+' unlocked');
      }
    }
    assert.equal(next.viewPanX,-11,'camera retains independent agency');
    assert.equal(next.textureRotation2,55,'rotation lock is distinct');
    assert.equal(next.textureRotation3,188,'rotation lock is distinct');
    assert.deepEqual(decodeRecipe(encodeRecipe(next)),next);
  }
});
test('locked active layer stays rendered and locked dormant layer stays dormant',()=>{
  const current=normalizeRecipe({...base(),
    lockedSettings:['material2','material3']});
  const before=resolveScene(current).textureLayers.map(layer=>layer.material);
  assert.deepEqual(before,['linen','foil']);
  const after=respectSettingLocks(current,{...current,
    textureLayer2Enabled:false,textureLayer3Enabled:true,
    material2:'grain',material3:'adobe'});
  assert.deepEqual(layerState(after),layerState(current));
  assert.deepEqual(resolveScene(after).textureLayers.map(l=>l.material),before);
  assert.deepEqual(normalizeRecipe(after),after);
});
test('unlocking a material again permits changing both material and enabled flag',()=>{
  const original=base();
  const locked=normalizeRecipe({...original,lockedSettings:['material2','material3']});
  const off=respectSettingLocks(original,{...original,material2:'none',
    textureLayer2Enabled:false,material3:'grain',textureLayer3Enabled:true});
  assert.deepEqual(layerState(off),{two:false,material2:'none',
    three:true,material3:'grain'});
  const attempted=respectSettingLocks(locked,off);
  assert.deepEqual(layerState(attempted),layerState(locked));
  const unlocked=normalizeRecipe({...attempted,lockedSettings:[]});
  const edited=respectSettingLocks(unlocked,off);
  assert.deepEqual(layerState(edited),layerState(off));
});
