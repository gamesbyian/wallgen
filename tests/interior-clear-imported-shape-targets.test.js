import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeInteriorElements,elementApplies,interiorTargetSummary}
  from '../src/interior-elements.js';
import {normalizeRecipe,respectSettingLocks,encodeRecipe,decodeRecipe} from '../src/model.js';

function recipe(){
  return normalizeRecipe({
    seed:'imported-interior-shape-target-recovery',structure:'regions',
    viewZoom:.5,viewPanX:15,viewPanY:-9,positionX:12,positionY:-7,
    interiorElements:[
      {id:'shape-scoped',type:'line',shape:'loop',width:1.513,
        phase:87.125,opacity:.37,color:'custom',customColor:'#f4d1a2',
        objectIds:['missing-old-shape','one-present-shape'],
        colorSlots:[2,5],enabled:true,placement:'field'},
      {id:'other-element',type:'band',shape:'wave',width:22.137,
        objectIds:['other-shape'],colorSlots:[0],enabled:false}
    ]
  });
}

test('clearing imported shape IDs restores ink only for already selected colour roles',()=>{
  const before=recipe(),active=before.interiorElements[0];
  assert.equal(elementApplies(active,2,'a-fresh-new-shape'),false);
  assert.equal(elementApplies(active,5,'one-present-shape'),true);
  assert.match(interiorTargetSummary(active),/2 selected shapes/);
  const after=normalizeRecipe({...before,interiorElements:
    before.interiorElements.map(e=>e.id===active.id?{...e,objectIds:[]}:e)});
  const cleared=after.interiorElements[0];
  assert.deepEqual(cleared.objectIds,[]);
  assert.deepEqual(cleared.colorSlots,[2,5]);
  for(const role of [0,1,2,3,4,5,6]){
    const selected=role===2||role===5;
    assert.equal(elementApplies(cleared,role,'a-fresh-new-shape'),selected);
    assert.equal(elementApplies(cleared,role,'another-new-shape'),selected);
  }
  assert.equal(interiorTargetSummary(cleared),'Colours: Yellow · Indigo');
  assert.deepEqual(after.interiorElements[1],before.interiorElements[1]);
  for(const key of ['viewZoom','viewPanX','viewPanY','positionX','positionY',
    'seed','structure','geometry','material','palette'])
    assert.deepEqual(after[key],before[key],key);
  assert.deepEqual(decodeRecipe(encodeRecipe(after)),after);
});

test('a locked Interior element stack cannot clear imported targeting',()=>{
  const prior=normalizeRecipe({...recipe(),lockedSettings:['interiorElements']});
  const attempted=respectSettingLocks(prior,{...prior,interiorElements:
    prior.interiorElements.map((e,i)=>i===0?{...e,objectIds:[]}:e)});
  assert.deepEqual(attempted.interiorElements,prior.interiorElements);
  assert.deepEqual(attempted.lockedSettings,prior.lockedSettings);
});

test('source UI exposes a focusable all-shapes recovery button only for shape-restricted elements',()=>{
  const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  assert.match(source,/if\(active\.objectIds\.length\)\{/);
  assert.match(source,/All shapes · clear '\+active\.objectIds\.length\+' selected'/);
  assert.match(source,/clearShapes\.dataset\.interiorFocus='field\.objectIds\.clear'/);
  assert.match(source,/clearShapes\.addEventListener\('click',\(\)=>update\('objectIds',\[\]\)\)/);
  assert.match(source,/if\(stackLocked\)\{[\s\S]*?if\(control!==lock&&control!==choose\)control\.disabled=true/);
  assert.ok(source.includes('resolveInteriorFocusTarget(controls,focused)?.focus'),
    'when the clear-only control disappears, the chooser must receive restored focus');
});
