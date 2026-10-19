import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeInteriorElements,INTERIOR_LIMITS,interiorSliderStep}
  from '../src/interior-elements.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

test('native Interior ranges retain ordinary step increments on canonical lattice values',()=>{
  const cases=[
    [1.5,.15,.05],[22,.15,.05],[50,.15,.05],
    [1,0,.05],[.5,0,.05],[0,0,.05],
    [0,-.48,.02],[.48,-.48,.02],[-.48,-.48,.02],
    [6,INTERIOR_LIMITS.fieldFrequency.min,INTERIOR_LIMITS.fieldFrequency.step],
    [30,INTERIOR_LIMITS.contourFrequency.min,INTERIOR_LIMITS.contourFrequency.step],
    [360,-360,1],[-360,-360,1],[0,-360,1],
  ];
  for(const [value,min,step] of cases){
    assert.equal(interiorSliderStep(value,min,step),String(step),
      JSON.stringify({value,min,step})+' must retain its usual keyboard/pointer step');
  }
});

test('off-lattice but valid source values switch only their native slider to step=any',()=>{
  const nonLattice=[
    [22.137,.15,.05], [.151,.15,.05], [1.512,.15,.05],
    [.37,0,.05], [.675,0,.05],
    [.127,-.48,.02], [-.471,-.48,.02],
    [.123,0,.01], [6.37,.1,.1],
    [87.125,-360,1],
  ];
  for(const [value,min,step] of nonLattice){
    assert.equal(interiorSliderStep(value,min,step),'any',
      JSON.stringify({value,min,step})+' must not silently snap source');
  }
  for(const bad of [NaN,Infinity,-Infinity,'garbage'])
    assert.equal(interiorSliderStep(bad,.15,.05),'any');
});

test('scope-randomized and imported Interior source precision survives editor construction and transport',()=>{
  const input=[
    {id:'fractional-line',type:'line',width:1.512,position:.127,
      amplitude:.123,frequency:6.37,phase:87.125,opacity:.37,
      placement:'field',colorSlots:[1,3]},
    {id:'fractional-band',type:'band',width:22.137,position:-.471,
      amplitude:.109,frequency:13.37,phase:-117.25,opacity:.675,
      placement:'local',enabled:false}
  ];
  const elems=normalizeInteriorElements(input);
  const fields={
    width:[.15,.05],position:[-.48,.02],amplitude:[0,.01],
    frequency:[.1,.1],phase:[-360,1],opacity:[0,.05]
  };
  assert.equal(elems.length,2);
  for(const e of elems){
    for(const [key,[min,step]] of Object.entries(fields)){
      assert.equal(e[key],input.find(x=>x.id===e.id)[key],
        key+' must remain source-normalized to its full fractional precision');
      assert.equal(interiorSliderStep(e[key],min,step),'any',
        e.id+' '+key+' must not be rounded by browser range sanitization');
    }
  }
  const recipe=normalizeRecipe({seed:'off-lattice-interior',interiorElements:elems,
    viewZoom:.5,viewPanX:19,viewPanY:-7,positionX:12,positionY:-9});
  assert.deepEqual(recipe.interiorElements,elems);
  assert.deepEqual(normalizeRecipe(recipe),recipe);
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
});

test('the actual Interior range wires a truthful native step before assigning the value',()=>{
  const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  assert.match(source,/slider\.step=interiorSliderStep\(active\[key\],min,step\);\s*slider\.value=active\[key\]/);
  assert.match(source,/slider\.addEventListener\('change',\(\)=>update\(key,Number\(slider\.value\)\)\)/);
});
