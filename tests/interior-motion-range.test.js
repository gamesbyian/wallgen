import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeInteriorElements,INTERIOR_LIMITS} from '../src/interior-elements.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

test('interior editor limits represent every legal legacy recipe value',()=>{
  assert.deepEqual(INTERIOR_LIMITS.fieldFrequency,{min:.1,max:100,step:.1});
  assert.deepEqual(INTERIOR_LIMITS.contourFrequency,{min:1,max:30,step:1});
  assert.deepEqual(INTERIOR_LIMITS.phase,{min:-360,max:360,step:1});
  const configurations=[
    {id:'max-field',placement:'field',shape:'loop',frequency:100,phase:360},
    {id:'min-local',placement:'local',shape:'wave',frequency:.1,phase:-360},
    {id:'max-contour',placement:'contour',shape:'zigzag',frequency:30,phase:270},
    {id:'min-contour',placement:'contour',shape:'wave',frequency:1,phase:-270}
  ];
  const normalized=normalizeInteriorElements(configurations);
  assert.deepEqual(normalized.map(e=>[e.frequency,e.phase]),
    configurations.map(e=>[e.frequency,e.phase]));
  for(const e of normalized){
    const spec=e.placement==='contour'?
      INTERIOR_LIMITS.contourFrequency:INTERIOR_LIMITS.fieldFrequency;
    assert.ok(e.frequency>=spec.min&&e.frequency<=spec.max,e.id);
    assert.ok(e.phase>=INTERIOR_LIMITS.phase.min&&e.phase<=INTERIOR_LIMITS.phase.max,e.id);
  }
  const recipe=normalizeRecipe({interiorElements:configurations});
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe,
    'valid upper/lower limits must survive portable recipes unchanged');
});
test('out-of-range imported motion is clamped by the unchanged source contract',()=>{
  const [field,contour]=normalizeInteriorElements([
    {placement:'field',frequency:999,phase:450},
    {placement:'contour',frequency:0,phase:-999}
  ]);
  assert.equal(field.frequency,100);
  assert.equal(field.phase,360);
  assert.equal(contour.frequency,1);
  assert.equal(contour.phase,-360);
  assert.equal(normalizeInteriorElements([{placement:'contour',frequency:14.7}])[0].frequency,15);
});
test('motion editor obtains both frequency and phase slider bounds from the normalizer',()=>{
  const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  assert.match(source,/INTERIOR_LIMITS\.contourFrequency:INTERIOR_LIMITS\.fieldFrequency/);
  assert.match(source,/'frequency',frequencyRange\.min,frequencyRange\.max,frequencyRange\.step/);
  assert.match(source,/const phaseRange=INTERIOR_LIMITS\.phase;/);
  assert.match(source,/phaseRange\.min,phaseRange\.max,phaseRange\.step/);
});
