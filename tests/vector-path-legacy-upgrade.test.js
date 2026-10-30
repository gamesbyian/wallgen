import test from 'node:test';
import assert from 'node:assert/strict';
import {upgradeSampledDrawnPath} from '../src/vector-path-legacy-upgrade.js';
import {prepareDrawnPath} from '../src/drawn-path.js';
import {prepareVectorDrawnPath,normalizeVectorPath} from '../src/vector-path-commands.js';
const compare=(oldPath,newPath)=>{
  const old=prepareDrawnPath(oldPath),fresh=prepareVectorDrawnPath(newPath);
  assert.equal(fresh.points.length,old.points.length);
  assert.equal(fresh.closed,old.closed);
  assert.ok(Math.abs(fresh.total-old.total)<1e-7);
  for(let i=0;i<old.points.length;i++){
    assert.ok(Math.hypot(fresh.points[i].x-old.points[i].x,
      fresh.points[i].y-old.points[i].y)<1e-7,'sample '+i);
  }
};
test('bakes legacy sparse softening into a resolution-independent line graph',()=>{
  const raw=[[.12,.14],[.35,.42],[.68,.32],[.9,.83]];
  const result=upgradeSampledDrawnPath({customPath:raw});
  assert.equal(result.ok,true);
  assert.equal(result.diagnostics.bakedFromSparseStroke,true);
  assert.equal(result.diagnostics.sourceStations,4);
  assert.equal(result.diagnostics.compiledStations,96);
  assert.equal(result.vectorPath.segments.length,95);
  assert.equal(result.vectorPath.closed,false);
  assert.deepEqual(result.authoring,{protectedNodeIds:[],cornerNodeIds:[]});
  compare(raw,result.vectorPath);
});
test('dense line samples remain world-identical and authored index identities survive',()=>{
  const path=Array.from({length:36},(_,i)=>[
    Number((.15+.74*i/35).toFixed(5)),
    Number((.3+.15*Math.sin(i/35*Math.PI*2)).toFixed(5))
  ]);
  const recipe={customPath:path,drawnAnchors:[1,11,35],drawnCorners:[11]};
  const before=JSON.stringify(recipe);
  const result=upgradeSampledDrawnPath(recipe);
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(result.diagnostics.bakedFromSparseStroke,false);
  assert.deepEqual(result.authoring.protectedNodeIds,['n1','n11','n35']);
  assert.deepEqual(result.authoring.cornerNodeIds,['n11']);
  assert.equal(result.vectorPath.segments.length,35);
  compare(path,result.vectorPath);
  assert.equal(JSON.stringify(recipe),before,'original recipe must not mutate');
});
test('explicitly coincident closed endpoints become one start ID and exact closing segment',()=>{
  const path=Array.from({length:30},(_,i)=>[
    Number((.5+.28*Math.cos(2*Math.PI*i/29)).toFixed(5)),
    Number((.5+.22*Math.sin(2*Math.PI*i/29)).toFixed(5))
  ]);
  path[29]=path[0].slice();
  const result=upgradeSampledDrawnPath({
    customPath:path,drawnAnchors:[29,10],drawnCorners:[29]});
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(result.vectorPath.closed,true);
  assert.equal(result.vectorPath.closing.kind,'line');
  assert.equal(result.vectorPath.segments.length,path.length-2);
  assert.ok(result.authoring.protectedNodeIds.includes('n0'));
  assert.ok(result.authoring.cornerNodeIds.includes('n0'));
  assert.ok(!result.authoring.protectedNodeIds.includes('n29'));
  compare(path,result.vectorPath);
});
test('legacy inferred near-closure is explicitly refused, never gets an extra chord',()=>{
  const source={customPath:[[.2,.2],[.8,.2],[.2,.203]]};
  const result=upgradeSampledDrawnPath(source);
  assert.equal(result.ok,false);
  assert.equal(result.reason,'inferred-near-closure-requires-review');
  assert.ok(result.diagnostics.endpointGapDesign>0);
  assert.deepEqual(source.customPath.at(-1),[.2,.203]);
});
test('sparse user-authored corner or protected anchor is refused until remapping exists',()=>{
  for(const constraints of [{drawnAnchors:[1]},{drawnCorners:[2]}]){
    const result=upgradeSampledDrawnPath({customPath:[[.2,.2],[.4,.8],[.8,.6]],...constraints});
    assert.equal(result.ok,false);
    assert.equal(result.reason,'authored-node-remapping-required');
  }
});
test('malformed, degenerate and off-limits inputs fail closed with diagnostics',()=>{
  assert.equal(upgradeSampledDrawnPath({}).reason,'missing-legacy-path');
  assert.equal(upgradeSampledDrawnPath([]).reason,'invalid-or-empty-path');
  assert.equal(upgradeSampledDrawnPath([[Infinity,.3],[.2,.3]]).ok,false);
  assert.equal(upgradeSampledDrawnPath([[.5,.5],[.5,.5]]).ok,false);
  assert.equal(upgradeSampledDrawnPath(null).ok,false);
});
test('ninety-six stations fit the bounded canonical vector graph with no clipping',()=>{
  const path=Array.from({length:96},(_,i)=>[
    Number((-.3+1.4*i/95).toFixed(5)),
    Number((.4+.18*Math.sin(i*.34)).toFixed(5))
  ]);
  const upgraded=upgradeSampledDrawnPath(path);
  assert.equal(upgraded.ok,true,JSON.stringify(upgraded));
  assert.ok(normalizeVectorPath(upgraded.vectorPath));
  compare(path,upgraded.vectorPath);
});
