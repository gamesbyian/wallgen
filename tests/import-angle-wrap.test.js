import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {importedAngleDeltaDegrees} from '../src/import-angle-wrap.js';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';

const arcError=(got,want)=>Math.abs(((got-want+180)%360+360)%360-180);
test('relative import rotation wraps rather than clamping real 180° overflows',()=>{
  for(const [target,baseline,expected] of [
    [179,-80,-101],[179,-179,-2],[0,179,-179],
    [0,-179,179],[90,-120,-150],[179,0,179],
    [0,180,-180],[359,1,-2],[10,-350,0]
  ]){
    const got=importedAngleDeltaDegrees(target,baseline);
    assert.ok(got>=-180&&got<180,'circular control contract');
    assert.ok(arcError(got,expected)<1e-8,JSON.stringify({target,baseline,got,expected}));
    assert.ok(arcError(baseline+got,target)<1e-8);
  }
  assert.throws(()=>importedAngleDeltaDegrees(Infinity,30),RangeError);
  assert.throws(()=>importedAngleDeltaDegrees(30,NaN),RangeError);
});

test('real seed-resolved diagonal scene matches imported absolute lines across orientation wrap',()=>{
  let negatives=0,crossed=0;
  for(let i=0;i<75;i++){
    const base=normalizeRecipe({seed:'image-direction-'+i,structure:'paths',
      geometry:i%2===0?'straight':'wave',orientation:'diagonal',
      diagonalRotation:0,positionX:13,positionY:-11,viewZoom:.5,
      viewPanX:18,viewPanY:-9});
    const baseline=resolveScene(base).angle*180/Math.PI;
    if(baseline<0)negatives++;
    for(const target of [0,12,90,170,179]){
      if(Math.abs(target-baseline)>180)crossed++;
      const rotation=importedAngleDeltaDegrees(target,baseline);
      const candidate=normalizeRecipe({...base,diagonalRotation:rotation});
      const result=resolveScene(candidate).angle*180/Math.PI;
      assert.ok(arcError(result,target)<1e-7,
        'seed '+i+', '+target+'° source, '+baseline+'° base -> '+result+'°');
      assert.deepEqual([candidate.positionX,candidate.positionY,
        candidate.viewZoom,candidate.viewPanX,candidate.viewPanY],
        [13,-11,.5,18,-9]);
      assert.deepEqual(decodeRecipe(encodeRecipe(candidate)),candidate);
    }
  }
  assert.ok(negatives>0,'the test must exercise genuinely negative seed baselines');
  assert.ok(crossed>0,'the test must cross 180° where the old code silently clipped');
});

test('the real image-to-angle app handler consumes wrapped rotation',()=>{
  const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  assert.match(source,/const baseline=resolveScene\(trial\)\.angle\*180\/Math\.PI/);
  assert.match(source,/diagonalRotation:importedAngleDeltaDegrees\(angle,baseline\)/);
});
