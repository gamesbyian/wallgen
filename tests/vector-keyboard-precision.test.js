import test from 'node:test';
import assert from 'node:assert/strict';
import {vectorKeyboardCommand as command} from '../src/vector-keyboard-precision.js';
import {normalizeVectorPath} from '../src/vector-path-commands.js';
const p=normalizeVectorPath({space:'normalized-design',closed:false,
  start:{id:'start',point:[.2,.2]},
  segments:[{kind:'cubic',to:{id:'bend',point:[.5,.5]},
    controlOut:[.32,.25],controlIn:[.43,.45]},
    {kind:'cubic',to:{id:'end',point:[.8,.8]},
      controlOut:[.62,.55],controlIn:[.72,.7]}],
  nodeModes:{bend:'independent'}});
test('cycle all authored IDs forward/back, including when unselected',()=>{
  assert.deepEqual(command(p,null,{key:']'}),{kind:'select',id:'start'});
  assert.deepEqual(command(p,null,{key:'['}),{kind:'select',id:'end'});
  assert.deepEqual(command(p,'start',{key:']'}),{kind:'select',id:'bend'});
  assert.deepEqual(command(p,'end',{key:']'}),{kind:'select',id:'start'});
  assert.deepEqual(command(p,'start',{key:'['}),{kind:'select',id:'end'});
});
test('plain arrows nudge true node by 1 design unit and Shift by 10',()=>{
  const right=command(p,'bend',{key:'ArrowRight'});
  assert.equal(right.kind,'node');assert.equal(right.id,'bend');
  assert.equal(right.point[0],.5+1/600);
  const up=command(p,'bend',{key:'ArrowUp',shiftKey:true});
  assert.deepEqual(up.point,[.5,.5-10/1300]);
});
test('Alt arrows act on outgoing handle, Alt+Shift on incoming',()=>{
  const out=command(p,'bend',{key:'ArrowLeft',altKey:true});
  assert.deepEqual(out,{kind:'handle',id:'bend',side:'out',
    point:[.62-1/600,.55]});
  const incoming=command(p,'bend',{key:'ArrowDown',altKey:true,shiftKey:true});
  assert.deepEqual(incoming,{kind:'handle',id:'bend',side:'in',
    point:[.43,.45+1/1300]});
});
test('missing real handles and keyboard chords never fabricate geometry',()=>{
  assert.equal(command(p,'start',{key:'ArrowLeft',altKey:true,shiftKey:true}),null);
  assert.equal(command(p,'end',{key:'ArrowRight',altKey:true}),null);
  assert.equal(command(p,'bend',{key:'z',ctrlKey:true}),null);
  assert.equal(command(p,'bend',{key:'ArrowLeft',metaKey:true}),null);
  assert.equal(command(p,'nobody',{key:'ArrowLeft'}),null);
  assert.equal(command(p,'bend',{key:'Space'}),null);
  assert.equal(command(p,'bend',{key:'[',altKey:true}),null);
});
test('finite out-of-bounds updates are clamped and exact source is unchanged',()=>{
  const extreme=normalizeVectorPath({space:'normalized-design',closed:false,
    start:{id:'a',point:[3,3]},segments:[{kind:'line',to:{id:'b',point:[-2,-2]}}]});
  assert.equal(command(extreme,'a',{key:'ArrowRight'}),null);
  const left=command(extreme,'a',{key:'ArrowLeft'});
  assert.equal(left.point[0],3-1/600);
  assert.deepEqual(extreme.start.point,[3,3]);
});
