import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAngleExpression as parse} from '../src/precision-angle-expression.js';
import {canonicalAngle,ROTATION_FIELD_SPECS} from '../src/rotation-gesture.js';
test('negative angle remains absolute, relative inputs explicit',()=>{
  assert.equal(parse('-90',135),-90);
  assert.equal(parse('−90°',135),-90);
  assert.equal(parse('+=15',135),150);
  assert.equal(parse('-=15°',135),120);
  assert.equal(parse('*=2',135),270);
  assert.equal(parse('/=2',135),67.5);
});
test('one-operator arithmetic is safe and vector-angle unit aware',()=>{
  assert.equal(parse('45 + 15°',30),60);
  assert.equal(parse('180/2',3),90);
  assert.equal(parse('2*22.5',3),45);
  assert.equal(parse('45-90',3),-45);
  assert.equal(parse('-.5e2deg',3),-50);
  assert.equal(parse('30 ÷ 2',3),15);
});
test('no eval, unintended units, divide-by-zero or malformed values',()=>{
  for(const expression of ['','+=','-=infinity','45px','15%','Math.random()',
    '1; alert(1)','45+15+2','1/0','/=0','1e999','*=1e999','*=15°',
    '45 rad','45deg+90',' (45) ','1**2','/0'])
    assert.equal(parse(expression,30),null,expression);
  assert.equal(parse('35',NaN),null);
  assert.equal(parse('1'.repeat(65),30),null);
});
test('parsed numbers preserve cyclic and bounded canonical semantics',()=>{
  const wrap=ROTATION_FIELD_SPECS.textureRotation;
  const sweep=ROTATION_FIELD_SPECS.loopSweep;
  assert.equal(canonicalAngle(parse('+=15',350),wrap),5);
  assert.equal(canonicalAngle(parse('+=15',448),sweep),450);
  assert.equal(canonicalAngle(parse('-=100',270),sweep),240);
  assert.equal(canonicalAngle(parse('+=90',120),ROTATION_FIELD_SPECS.hairpinAngle),180);
});
