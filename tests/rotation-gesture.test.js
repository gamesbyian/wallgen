import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROTATION_FIELD_SPECS,canonicalAngle,magneticAngle,
  beginRotationDrag,advanceRotationDrag,shortestAngularDifference,pointerAngularDelta,
} from '../src/rotation-gesture.js';

test('pointerdown and vertical-only mode changes never alter rotation',()=>{
  const init=beginRotationDrag({value:23.7,x:130,y:90,snap:45});
  assert.equal(init.value,23.7);
  assert.equal(advanceRotationDrag(init,{x:130,y:190}).value,23.7);
  assert.equal(advanceRotationDrag(init,{x:130,y:0}).value,23.7);
});

test('fine, normal and fast all use incremental movement without mode teleport',()=>{
  let s=beginRotationDrag({value:20,x:0,y:100,snap:0});
  s=advanceRotationDrag(s,{x:20,y:100});
  assert.equal(s.value,29);
  s=advanceRotationDrag(s,{x:40,y:160});
  assert.equal(s.mode,'fine');
  assert.ok(Math.abs(s.value-29.8)<1e-9);
  s=advanceRotationDrag(s,{x:60,y:0});
  assert.equal(s.mode,'fast');
  assert.ok(Math.abs(s.value-61.8)<1e-9);
});
test('magnetic snap uses separate enter and release thresholds',()=>{
  let s=magneticAngle(44.5,{interval:45});
  assert.deepEqual(s,{value:45,held:45});
  s=magneticAngle(48.5,{interval:45,held:s.held});
  assert.deepEqual(s,{value:45,held:45});
  s=magneticAngle(49.1,{interval:45,held:s.held});
  assert.deepEqual(s,{value:49.1,held:null});
  assert.deepEqual(magneticAngle(44.5,{interval:0}),{value:44.5,held:null});
});
test('cyclic angles and unconstrained sweeps retain distinct mathematical meanings',()=>{
  const t=ROTATION_FIELD_SPECS.textureRotation;
  assert.equal(canonicalAngle(-.1,t),359.9);
  assert.equal(canonicalAngle(360,t),0);
  assert.equal(canonicalAngle(359.94,t),359.9);
  assert.equal(canonicalAngle(359.96,t),0);
  assert.equal(canonicalAngle(450,ROTATION_FIELD_SPECS.loopSweep),450);
  assert.equal(canonicalAngle(451,ROTATION_FIELD_SPECS.loopSweep),450);
  assert.equal(canonicalAngle(239,ROTATION_FIELD_SPECS.loopSweep),240);
  assert.equal(canonicalAngle(200,ROTATION_FIELD_SPECS.hairpinAngle),180);
  assert.equal(canonicalAngle(-181,ROTATION_FIELD_SPECS.diagonalRotation),-180);
  assert.equal(shortestAngularDifference(179,-179),2);
  assert.equal(shortestAngularDifference(-179,179),-2);
});
test('scrub can cross a seam or multiple revolutions without reversing',()=>{
  let s=beginRotationDrag({value:359.9,x:0,y:0,snap:0});
  s=advanceRotationDrag(s,{x:100,y:-60});
  assert.ok(s.value>360);
  assert.equal(canonicalAngle(s.value,ROTATION_FIELD_SPECS.textureRotation),159.9);
  assert.equal(pointerAngularDelta({x:0,y:1},{x:0,y:-1},{x:0,y:0}),-180);
  assert.equal(pointerAngularDelta({x:-1,y:.01},{x:-1,y:-.01},{x:0,y:0})>0,true);
});
