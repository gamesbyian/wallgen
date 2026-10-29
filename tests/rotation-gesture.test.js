import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROTATION_FIELD_SPECS,canonicalAngle,magneticAngle,
  beginRotationDrag,advanceRotationDrag,shortestAngularDifference,pointerAngularDelta,
  beginPointerRotation,advancePointerRotation,
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

test('object grip starts at authored orientation and crosses the seam continuously',()=>{
  const pivot={x:100,y:100};
  let s=beginPointerRotation({value:170,pivot,point:{x:0,y:100}});
  assert.equal(s.raw,170,'off-centre pointerdown must not rotate');
  s=advancePointerRotation(s,{x:0,y:101});
  assert.ok(s.raw<170&&s.raw>169,'small counterclockwise motion should be small');
  const before=s.raw;
  s=advancePointerRotation(s,{x:100,y:200});
  assert.ok(s.raw<before-70,'rotating past a quadrant must accumulate');
  // Incremental path may travel beyond a full revolution in a single gesture.
  let long=beginPointerRotation({value:0,pivot:{x:0,y:0},point:{x:40,y:0}});
  for(let cycle=0;cycle<2;cycle++)
    for(let i=1;i<=24;i++){
      const a=(cycle*24+i)*Math.PI/12;
      long=advancePointerRotation(long,{x:40*Math.cos(a),y:40*Math.sin(a)});
    }
  assert.ok(Math.abs(long.raw-720)<.001,'two revolutions should accumulate to 720°');
});
test('near-pivot dead zone drops ambiguous bearings and rearms without jump',()=>{
  let s=beginPointerRotation({value:27,pivot:{x:0,y:0},
    point:{x:50,y:0},minRadius:24});
  s=advancePointerRotation(s,{x:1,y:1});
  assert.equal(s.last,null);
  assert.equal(s.raw,27);
  s=advancePointerRotation(s,{x:-45,y:0});
  assert.equal(s.raw,27,'leaving dead zone only rearms tracking');
  s=advancePointerRotation(s,{x:0,y:-45});
  assert.ok(s.raw>100&&s.raw<130,'motion after rearming should rotate');
});

test('selected text body angle clamps but shadow direction wraps at 360',()=>{
  const {textRotation,textShadowAngle}=ROTATION_FIELD_SPECS;
  assert.equal(canonicalAngle(190,textRotation),180);
  assert.equal(canonicalAngle(-191,textRotation),-180);
  assert.equal(canonicalAngle(359,textShadowAngle),359);
  assert.equal(canonicalAngle(360,textShadowAngle),0);
  assert.equal(canonicalAngle(-1,textShadowAngle),359);
  assert.equal(canonicalAngle(450,ROTATION_FIELD_SPECS.loopSweep),450);
});

test('regional embroidery direction clamps to signed 0.1° without angle wrap',()=>{
  const spec=ROTATION_FIELD_SPECS.embroideryDirection;
  assert.equal(canonicalAngle(37.54,spec),37.5);
  assert.equal(canonicalAngle(37.56,spec),37.6);
  assert.equal(canonicalAngle(-181,spec),-180);
  assert.equal(canonicalAngle(181,spec),180);
  assert.equal(canonicalAngle(180,spec),180);
  assert.equal(canonicalAngle(450,ROTATION_FIELD_SPECS.loopSweep),450);
});
