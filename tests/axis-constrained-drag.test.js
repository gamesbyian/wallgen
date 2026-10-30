import test from 'node:test';
import assert from 'node:assert/strict';
import {beginAxisDrag,axisConstrainedPoint,AXIS_LOCK_THRESHOLD_CSS_PX}
  from '../src/axis-constrained-drag.js';

test('free mode forwards vector-space candidates without guessing units',()=>{
  const s=beginAxisDrag([100,200],[.24,.91]);
  assert.deepEqual(axisConstrainedPoint(s,[135,220],[.27,.87]).point,[.27,.87]);
  assert.equal(s.axis,null);
});
test('initial contact and sub-threshold motion do not move the selected anchor',()=>{
  const s=beginAxisDrag([100,200],[.24,.91],true);
  assert.deepEqual(axisConstrainedPoint(s,[100,200],[.24,.91]).point,[.24,.91]);
  const p=axisConstrainedPoint(s,[107,200],[.5,.3]);
  assert.deepEqual(p.point,[.24,.91]);
  assert.equal(p.state.axis,null);
  assert.equal(AXIS_LOCK_THRESHOLD_CSS_PX,8);
});
test('horizontal constraint uses screen motion, preserves normalized vertical coordinate',()=>{
  const start=beginAxisDrag([100,200],[.24,.91],true);
  const moved=axisConstrainedPoint(start,[110,203],[.27,.87]);
  assert.equal(moved.state.axis,'x');
  assert.deepEqual(moved.point,[.27,.91]);
  const reversed=axisConstrainedPoint(moved.state,[96,290],[.20,.44]);
  assert.equal(reversed.state.axis,'x','axis must not flip when direction changes');
  assert.deepEqual(reversed.point,[.20,.91]);
});
test('vertical constraint is independent of art proportions and zoom',()=>{
  const start=beginAxisDrag([100,200],[.24,.91],true);
  const a=axisConstrainedPoint(start,[102,217],[.28,.85]);
  assert.equal(a.state.axis,'y');
  assert.deepEqual(a.point,[.24,.85]);
  const b=axisConstrainedPoint(a.state,[140,230],[.35,.82]);
  assert.deepEqual(b.point,[.24,.82]);
});
test('each new gesture has independent constraints; disabled mode is unchanged',()=>{
  const first=axisConstrainedPoint(beginAxisDrag([0,0],[.5,.5],true),[12,2],[.6,.6]);
  const second=axisConstrainedPoint(beginAxisDrag([0,0],[.5,.5],true),[2,12],[.6,.6]);
  assert.deepEqual(first.point,[.6,.5]);
  assert.deepEqual(second.point,[.5,.6]);
  assert.deepEqual(axisConstrainedPoint(beginAxisDrag([0,0],[.5,.5],false),[2,12],[.6,.6]).point,[.6,.6]);
});
