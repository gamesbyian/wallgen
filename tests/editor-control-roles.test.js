import test from 'node:test';
import assert from 'node:assert/strict';
import {controlKind,annotateEditorSettingRow} from '../src/editor-control-roles.js';
import {EDITOR_CATEGORIES} from '../src/editor-schema.js';
const root=cls=>({
  classList:{contains:x=>cls.includes(x),add:x=>{cls.push(x)}},
  dataset:{}
});
test('classifies all source form control shapes without touching values',()=>{
  for(const [field,expected] of [
    [{tagName:'INPUT',type:'range'},'slider'],
    [{tagName:'INPUT',type:'checkbox'},'toggle'],
    [{tagName:'INPUT',type:'color'},'colour'],
    [{tagName:'SELECT',type:'select-one'},'choice'],
    [{tagName:'INPUT',type:'number'},'number'],
    [{tagName:'TEXTAREA',type:'textarea'},'text']]){
      assert.equal(controlKind(field,root([])),expected);
  }
  assert.equal(controlKind({tagName:'INPUT',type:'number'},root(['texture-rotation-field'])),'rotation');
});
test('annotations leave original control objects and key semantics untouched',()=>{
  const field={type:'range',tagName:'INPUT',value:'32'};
  const node=root([]);
  const ret=annotateEditorSettingRow(node,field,'stripeWidth',{category:'stripes',tool:'structure'});
  assert.equal(ret,node);
  assert.equal(field.value,'32');
  assert.equal(node.dataset.controlKeys,'stripeWidth');
  assert.equal(node.dataset.controlKind,'slider');
  assert.equal(node.dataset.controlCategory,'stripes');
  assert.equal(node.dataset.controlTool,'structure');
  assert.ok(node.classList.contains('editor-setting-row'));
  annotateEditorSettingRow(node,{type:'checkbox',tagName:'INPUT'},'mirrorHorizontal',{category:'stripes',tool:'structure'});
  assert.equal(node.dataset.controlKind,'compound');
  assert.deepEqual(node.dataset.controlKeys.split(' '),['stripeWidth','mirrorHorizontal']);
});
test('all source categories retain canonical identity and named tools',()=>{
  assert.equal(EDITOR_CATEGORIES.length,7);
  assert.equal(EDITOR_CATEGORIES.reduce((n,c)=>n+c.tools.length,0),40);
});
