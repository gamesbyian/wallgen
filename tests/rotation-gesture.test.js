import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROTATION_FIELD_SPECS,canonicalAngle,magneticAngle,
  beginRotationDrag,advanceRotationDrag,ROTATION_SCRUB_INTENT_CSS_PX,
  rotationKeyboardTarget,
  shortestAngularDifference,pointerAngularDelta,
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

test('touch scrubber ignores settling jitter and crosses its intent boundary continuously',()=>{
  assert.equal(ROTATION_SCRUB_INTENT_CSS_PX,8);
  const start=beginRotationDrag({value:20,x:100,y:100,snap:0,
    intent:ROTATION_SCRUB_INTENT_CSS_PX});
  for(const dx of [-8,-4,0,2,7,8]){
    const sample=advanceRotationDrag(start,{x:100+dx,y:100});
    assert.equal(sample.value,20,'contact jitter must never create an edit');
    assert.equal(sample.engaged,false);
  }
  let next=advanceRotationDrag(start,{x:109,y:100});
  assert.ok(Math.abs(next.value-20.45)<1e-9,
    'the first sample moves only the distance beyond the intent band');
  assert.equal(next.engaged,true);
  next=advanceRotationDrag(next,{x:119,y:100});
  assert.ok(Math.abs(next.value-24.95)<1e-9);
  const fine=advanceRotationDrag(next,{x:119,y:160});
  assert.equal(fine.value,next.value,'vertical-only fine selection never teleports');
  const adjusted=advanceRotationDrag(fine,{x:129,y:160});
  assert.ok(Math.abs(adjusted.value-25.35)<1e-9);
  const back=advanceRotationDrag(adjusted,{x:119,y:160});
  assert.ok(Math.abs(back.value-next.value)<1e-9,
    'reversing after fine selection returns by incremental movement');
  const verticalFirst=advanceRotationDrag(start,{x:100,y:170});
  assert.equal(verticalFirst.engaged,false,
    'speed switching alone does not arm the horizontal scrubber');
  assert.equal(advanceRotationDrag(verticalFirst,{x:106,y:170}).value,20);
  const fineStart=advanceRotationDrag(verticalFirst,{x:109,y:170});
  assert.ok(Math.abs(fineStart.value-20.04)<1e-9);
  assert.throws(()=>beginRotationDrag({value:0,x:0,y:0,intent:-1}),TypeError);
});

test('precision angle slider keys cover APG Home/End/Page and valid property steps',()=>{
  const t=ROTATION_FIELD_SPECS.textureRotation,
    s=ROTATION_FIELD_SPECS.loopSweep,
    i=ROTATION_FIELD_SPECS.diagonalRotation;
  const key=(value,spec,name,other={})=>
    rotationKeyboardTarget(value,spec,{key:name,...other});
  assert.equal(key(12.3,t,'Home'),0);
  assert.equal(key(12.3,t,'End'),359.9,
    'cyclic end is last real angle, never wrapped back to zero');
  assert.equal(key(12.3,t,'PageUp'),22.3);
  assert.equal(key(12.3,t,'PageDown'),2.3);
  assert.equal(key(359.9,t,'PageUp'),9.9,
    'page keys honor original cyclic semantics');
  assert.equal(key(20,t,'ArrowUp',{shiftKey:true}),20.1);
  assert.equal(key(20,t,'ArrowLeft'),19);
  assert.equal(key(20,t,'ArrowDown'),19);
  assert.equal(key(20,t,'ArrowRight'),21);
  assert.equal(key(20,t,'ArrowRight',{shiftKey:true}),20.1);
  assert.equal(key(20,i,'ArrowRight',{shiftKey:true}),21,
    'Shift must not silently do nothing on whole-degree controls');
  assert.equal(key(180,i,'ArrowRight'),180,
    'bounded orientation clamps at its legal maximum');
  assert.equal(key(360,s,'Home'),240);
  assert.equal(key(360,s,'End'),450,
    '450-degree sweep remains distinct from 90 degrees');
  assert.equal(key(449,s,'PageUp'),450);
  assert.equal(key(241,s,'PageDown'),240);
  for(const name of ['Tab','Space','Escape','KeyA']){
    assert.equal(key(20,t,name),null,'unowned keys remain untouched');
  }
  for(const mods of [{ctrlKey:true},{metaKey:true},{altKey:true}]){
    assert.equal(key(20,t,'ArrowLeft',mods),null,
      'browser modifier shortcuts remain untouched');
  }
  assert.equal(key(NaN,t,'Home'),null);
  assert.equal(key(20,null,'Home'),null);
});
