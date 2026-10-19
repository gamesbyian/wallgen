import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,encodeRecipe,decodeRecipe,respectSettingLocks} from '../src/model.js';
import {normalizeDrawnPathWithIndexMap,MAX_DRAWN_POINTS,DRAW_COORD_MIN,DRAW_COORD_MAX}
  from '../src/drawn-path.js';

function rng(seed){
  let x=seed>>>0;
  return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};
}
function hostilePath(seed,length){
  const random=rng(seed),points=[];
  for(let i=0;i<length;i++){
    const t=i*.105+seed*.31,osc=.12+random()*.48;
    const p=[.5+Math.sin(t)*osc*3,.5+Math.sin(t*1.79)*osc*2.3];
    if(i%37===8)points.push(['invalid',p[1]]);
    else if(i%43===12)points.push(null);
    else if(i%31===9&&points.length&&Array.isArray(points.at(-1)))
      points.push([...points.at(-1)]); // exact duplicate
    else if(i%29===7&&points.length&&Array.isArray(points.at(-1))){
      const q=points.at(-1);points.push([q[0]+.00002,q[1]-.00002]);
    }else points.push(p);
  }
  return points;
}
test('hostile imported Draw traces are bounded, repeatably canonical and metadata-safe',()=>{
  const lengths=[2,3,5,15,40,95,96,97,99,128,240,500,1199,1200,1201,1400];
  for(let caseIndex=0;caseIndex<96;caseIndex++){
    const count=lengths[caseIndex%lengths.length];
    const input=hostilePath(1949+caseIndex*13,count);
    const rawIndices=[0,1,Math.floor(count/3),Math.floor(count/2),
      count-1,count,count+1,1199,1200,-1,5.5,null];
    const candidate={seed:'adversarial-draw-'+caseIndex,
      structure:'paths',geometry:'drawn',customPath:input,
      drawnAnchors:rawIndices,drawnCorners:rawIndices.slice(2,8),
      extendDrawnPath:caseIndex%2===0,
      viewZoom:caseIndex%3===0?.5:caseIndex%3===1?1:2.5,
      viewPanX:caseIndex%2===0?50:-50,
      viewPanY:caseIndex%2===1?25:-25,
      positionX:caseIndex%2===0?17:-12,
      positionY:caseIndex%2===1?9:-9};
    const canonical=normalizeRecipe(candidate);
    assert.ok(canonical.customPath.length<=MAX_DRAWN_POINTS,caseIndex+' sample cap');
    assert.deepEqual(normalizeRecipe(canonical),canonical,
      caseIndex+' must be idempotent after import normalization');
    assert.deepEqual(decodeRecipe(encodeRecipe(canonical)),canonical,
      caseIndex+' must survive URL and portable recipe transport');
    for(const point of canonical.customPath){
      assert.ok(point.every(n=>Number.isFinite(n)&&n>=DRAW_COORD_MIN&&n<=DRAW_COORD_MAX),
        caseIndex+' cannot store invalid/off-limit coordinate');
    }
    for(const key of ['drawnAnchors','drawnCorners']){
      const indices=canonical[key];
      assert.deepEqual([...new Set(indices)].sort((a,b)=>a-b),indices,
        caseIndex+' '+key+' must remain unique and monotone');
      assert.ok(indices.every(i=>Number.isInteger(i)&&i>=0&&i<canonical.customPath.length),
        caseIndex+' '+key+' indices must refer to final stored samples');
    }
    const withMap=normalizeDrawnPathWithIndexMap(input);
    assert.deepEqual(withMap.points,canonical.customPath,caseIndex+' one geometry source');
    for(let j=1;j<withMap.indexMap.length;j++)
      if(Number.isInteger(withMap.indexMap[j-1])&&
          Number.isInteger(withMap.indexMap[j]))
        assert.ok(withMap.indexMap[j]>=withMap.indexMap[j-1],
          caseIndex+' mapping must preserve traversal order');
  }
});

test('imported malformed anchors cannot bypass a valid source geometry lock',()=>{
  const before=normalizeRecipe({geometry:'drawn',lockedSettings:['geometry'],
    customPath:[[.2,.2],[.4,.5],[.8,.85]],drawnAnchors:[1],drawnCorners:[1],
    viewZoom:.5,viewPanX:25});
  for(let i=0;i<24;i++){
    const candidate=normalizeRecipe({geometry:'drawn',
      customPath:hostilePath(900+i,500),drawnAnchors:[120,390,499],
      drawnCorners:[120,390],extendDrawnPath:true});
    const guarded=respectSettingLocks(before,candidate);
    assert.deepEqual(guarded.customPath,before.customPath);
    assert.deepEqual(guarded.drawnAnchors,before.drawnAnchors);
    assert.deepEqual(guarded.drawnCorners,before.drawnCorners);
    assert.equal(guarded.geometry,before.geometry);
    assert.equal(guarded.extendDrawnPath,before.extendDrawnPath);
  }
});
