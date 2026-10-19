import test from 'node:test';
import assert from 'node:assert/strict';
import {randomizeScope} from '../src/scoped-random.js';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';

const materials=['none','grain','linen','foil','stone'];
const control=name=>({
  tagName:'SELECT',dataset:{inactive:'false'},
  options:materials.map(value=>({value,disabled:false}))
});
const source=()=>normalizeRecipe({seed:'fixed-scoped-material-transaction',
  material:'linen',textureStrength:66,
  material2:'none',textureLayer2Enabled:false,textureStrength2:65,
  material3:'none',textureLayer3Enabled:false,textureStrength3:55,
  viewZoom:.5,viewPanX:24,viewPanY:-14,positionX:9,positionY:-6,
  interiorElements:[{id:'untouched-interior',shape:'loop',colorSlots:[4]}]
});
const change=(recipe,key,seed='material-scoped-fixed')=>randomizeScope(recipe,{
  scope:'setting',name:key,seed,mode:'reroll',control
});

test('rerolling disabled Layer 2/3 material visibly enables the selected texture',()=>{
  const original=source();
  for(const layer of [2,3]){
    const key='material'+layer,enabled='textureLayer'+layer+'Enabled';
    const result=change(original,key);
    const next=result.recipe;
    assert.notEqual(next[key],'none',key+' must select a real material');
    assert.equal(next[enabled],true,enabled+' must follow the material chooser');
    assert.ok(result.modified.includes(key));
    assert.ok(result.modified.includes(enabled),
      'enable change must appear in the modified-key audit');
    const layers=resolveScene(next).textureLayers;
    assert.ok(layers.some(entry=>entry.material===next[key]),
      key+' must contribute to the rendered surface');
    assert.equal(next['textureLayer'+(layer===2?3:2)+'Enabled'],false,
      'unrelated optional layer must remain dormant');
    for(const unchanged of ['viewZoom','viewPanX','viewPanY',
      'positionX','positionY','seed','interiorElements']){
      assert.deepEqual(next[unchanged],original[unchanged],unchanged);
    }
    assert.deepEqual(decodeRecipe(encodeRecipe(next)),next);
  }
});

test('rerolling a live optional finish to No texture disables only that layer',()=>{
  for(const layer of [2,3]){
    const key='material'+layer,enabled='textureLayer'+layer+'Enabled';
    const previous=normalizeRecipe({...source(),[key]:'foil',[enabled]:true});
    const result=change(previous,key);
    const next=result.recipe;
    assert.equal(next[key],'none');
    assert.equal(next[enabled],false);
    assert.ok(result.modified.includes(key)&&result.modified.includes(enabled));
    assert.ok(!resolveScene(next).textureLayers.some(e=>e.material==='foil'),
      'the previously active foil must not be left rendered');
    assert.deepEqual(next.interiorElements,previous.interiorElements);
    assert.deepEqual([next.viewZoom,next.viewPanX,next.viewPanY],
      [previous.viewZoom,previous.viewPanX,previous.viewPanY]);
  }
});

test('material locks prevent both chooser and hidden enable state changes',()=>{
  for(const layer of [2,3]){
    const key='material'+layer,enabled='textureLayer'+layer+'Enabled';
    const current=normalizeRecipe({...source(),[key]:'stone',[enabled]:true,
      lockedSettings:[key]});
    const result=change(current,key);
    assert.deepEqual(result.recipe,current);
    assert.deepEqual(result.modified,[]);
    assert.equal(result.recipe[enabled],true);
  }
});

test('tool-level Layer 2 reroll retains non-target Layer 3 while enabling Layer 2',()=>{
  const current=source();
  const {recipe:next,modified}=randomizeScope(current,{
    scope:'tool',name:'layer2',mode:'reroll',seed:'tool-material-two',
    control
  });
  assert.notEqual(next.material2,'none');
  assert.equal(next.textureLayer2Enabled,true);
  assert.equal(next.textureLayer3Enabled,false);
  assert.equal(next.material3,current.material3);
  assert.ok(modified.includes('material2'));
  assert.ok(modified.includes('textureLayer2Enabled'));
});
