import test from 'node:test';
import assert from 'node:assert/strict';
import {CROSSING_MODES,segmentIntersection,findPathCrossings,crossingTopIsLater} from '../src/crossing-order.js';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';
import {samplePath} from '../src/path-geometry.js';

test('over under weave are distinct, saved and lockable',()=>{
  assert.deepEqual(CROSSING_MODES,['over','under','weave']);
  assert.equal(normalizeRecipe({}).crossingMode,'over');
  assert.equal(normalizeRecipe({crossingMode:'invalid'}).crossingMode,'over');
  for(const crossingMode of CROSSING_MODES){
    const recipe=normalizeRecipe({crossingMode,lockedSettings:['crossingMode']});
    const roundtrip=decodeRecipe(encodeRecipe(recipe));
    assert.equal(roundtrip.crossingMode,crossingMode);
    assert.ok(roundtrip.lockedSettings.includes('crossingMode'));
    assert.equal(resolveScene(recipe).crossingMode,crossingMode);
  }
});
test('weave alternates by both stripe index and successive crossing',()=>{
  for(let index=0;index<7;index++)for(let crossing=0;crossing<4;crossing++){
    assert.equal(crossingTopIsLater('over',index,crossing),true);
    assert.equal(crossingTopIsLater('under',index,crossing),false);
    assert.equal(crossingTopIsLater('weave',index,crossing),(index+crossing)%2===0);
  }
});
test('segment intersection excludes near-parallel touches and adjacent endpoints',()=>{
  const A={x:0,y:0},B={x:100,y:100},C={x:0,y:100},D={x:100,y:0};
  const hit=segmentIntersection(A,B,C,D);
  assert.ok(hit);assert.equal(hit.x,50);assert.equal(hit.y,50);
  assert.equal(segmentIntersection(A,B,{x:100,y:100},{x:200,y:0}),null);
  assert.equal(segmentIntersection(A,B,{x:0,y:1},{x:100,y:101}),null);
});
test('detector finds two separated visits at a genuine figure-eight intersection',()=>{
  const stripe={segmentStart:-350,segmentEnd:350,width:12,center:0,index:3};
  const sampler=(_,x)=>{
    const t=(x+350)/700*Math.PI*2;
    return {x:170*Math.sin(t),y:115*Math.sin(2*t)};
  };
  const crossings=findPathCrossings(stripe,350,sampler,{step:4});
  assert.ok(crossings.length>=1,'one transverse centreline crossing');
  assert.ok(crossings.every(c=>c.late>c.early));
  assert.ok(crossings.every(c=>c.angle>=.12));
});
test('a plain straight path has no false crossings',()=>{
  const stripe={segmentStart:-300,segmentEnd:300};
  const found=findPathCrossings(stripe,300,(_,x)=>({x,y:0}));
  assert.deepEqual(found,[]);
});
test('over under weave do not change the seven stripe geometries',()=>{
  const input={seed:'stable-crossings',geometry:'loop',loopSweep:440,
    construction:'ribbon',loopRadius:80,individuality:0};
  const standard=resolveScene({...input,crossingMode:'over'});
  for(const crossingMode of ['under','weave']){
    const variant=resolveScene({...input,crossingMode});
    for(let i=0;i<7;i++){
      const t=250;
      assert.deepEqual(samplePath(standard.stripes[i],t,standard.extent),
        samplePath(variant.stripes[i],t,variant.extent));
    }
  }
});
