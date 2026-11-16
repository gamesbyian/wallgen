import test from 'node:test';
import assert from 'node:assert/strict';
import {placeFloatingInterval} from '../src/floating-inset-placement.js';
import {resolveScene} from '../src/model.js';
import {balanceStripeEnds} from '../src/renderer.js';
import {toolAppliesToScene} from '../src/editor-tool-applicability.js';

const close=(a,b,label)=>assert.ok(Math.abs(a-b)<1e-7,
  `${label}: ${a} vs ${b}`);
test('changing transverse safe interval does not shift a feasible longitudinal station',()=>{
  for(const preferredCentre of [-55,0,48]){
    const centres=[];
    for(const [a,b] of [[-250,250],[-205,250],[-250,210]]){
      const interval=placeFloatingInterval(a,b,.3,preferredCentre);
      assert.equal(interval.clamped,false);
      centres.push((interval.start+interval.end)/2);
      assert.ok(interval.start>=a&&interval.end<=b);
    }
    centres.forEach(v=>close(v,preferredCentre,'floating centre'));
  }
});
test('real canvas bounds override an impossible fixed floating station',()=>{
  const result=placeFloatingInterval(-90,100,.8,750);
  assert.equal(result.clamped,true);
  close(result.end,100,'right canvas boundary');
  assert.equal(placeFloatingInterval(4,4,.7).clamped,true);
});
test('inset stripes expose an eligible tool, other compositions never do',()=>{
  const tool={category:'stripes',id:'inset'};
  assert.equal(toolAppliesToScene(tool,{structure:'paths',composition:'floating'}),true);
  assert.equal(toolAppliesToScene(tool,{structure:'paths',composition:'single'}),false);
  assert.equal(toolAppliesToScene(tool,{structure:'radial',composition:'floating'}),false);
});
test('seeded floating stripe stations stay put across spread changes where safe',()=>{
  let compared=0;
  const base={seed:'neon-inset-station-regression',structure:'paths',
    composition:'floating',insetAlignment:'independent',
    geometry:'straight',orientation:'vertical',pathLength:25,individuality:80,
    stripeWidth:27};
  const inspect=spread=>{
    const scene=resolveScene({...base,spread});
    return scene.stripes.map(original=>{
      const stripe={...original};
      balanceStripeEnds(scene,stripe,false);
      return stripe.hidden?null:{
        centre:(stripe.segmentStart+stripe.segmentEnd)/2,
        clamped:stripe.floatingStationClamped
      };
    });
  };
  const first=inspect(33),second=inspect(66);
  first.forEach((a,i)=>{
    const b=second[i];
    if(a&&b&&!a.clamped&&!b.clamped){
      compared++;
      close(a.centre,b.centre,'spread cannot shift a floating station');
    }
  });
  assert.ok(compared>=1,'expected a stripe with sufficient canvas clearance');
});
