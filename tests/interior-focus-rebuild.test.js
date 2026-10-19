import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveInteriorFocusTarget} from '../src/interior-elements.js';

const control=(key,disabled=false)=>({dataset:{interiorFocus:key},disabled});
test('Interior card redraw restores the actual live equivalent of its focused control',()=>{
  const old=control('field.frequency');
  const current=[control('manager.choose'),control('field.frequency'),control('field.opacity')];
  const selected=resolveInteriorFocusTarget(current,old.dataset.interiorFocus);
  assert.equal(selected,current[1]);
  assert.notEqual(selected,old,'never return a stale removed node');
  for(const key of ['field.width','field.frequency','field.phase','field.opacity',
    'field.color','field.customColor','colour.0','colour.4','field.type',
    'field.enabled','manager.lock','manager.remove','manager.up','manager.down']){
    const controls=[control('manager.choose'),control(key)];
    assert.equal(resolveInteriorFocusTarget(controls,key),controls.at(-1),key);
  }
});

test('locked, removed and empty-stack controls fall back only to enabled navigation',()=>{
  const choose=control('manager.choose'),add=control('manager.add');
  assert.equal(resolveInteriorFocusTarget([choose,add,control('field.frequency',true)],
    'field.frequency'),choose);
  assert.equal(resolveInteriorFocusTarget([control('manager.choose',true),add],
    'manager.remove'),add,'removing final element must leave focus on Add');
  assert.equal(resolveInteriorFocusTarget([control('manager.choose',true),
    control('manager.add',true)],'field.frequency'),null);
  assert.equal(resolveInteriorFocusTarget([choose],null),null);
  assert.equal(resolveInteriorFocusTarget([],undefined),null);
  assert.equal(resolveInteriorFocusTarget(null,'field.width'),null);
});

test('selected Interior control input and output target markers survive card replacement',()=>{
  const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  assert.match(app,/card\.contains\(document\.activeElement\)/,
    'focus capture must be limited to Interior editor, never steal unrelated keyboard focus');
  assert.match(app,/document\.activeElement\?\.dataset\?\.interiorFocus/);
  assert.match(app,/resolveInteriorFocusTarget\(controls,focused\)\?\.focus\(\{preventScroll:true\}\)/);
  assert.match(app,/control\.dataset\.interiorFocus='field\.'\+key/);
  assert.match(app,/slider\.dataset\.interiorFocus='field\.'\+key/);
  assert.match(app,/checkbox\.dataset\.interiorFocus='colour\.'\+i/);
  for(const name of ['manager.choose','manager.add','manager.remove',
    'manager.up','manager.down','manager.lock','field.enabled',
    'field.type','field.customColor'])
    assert.ok(app.includes("dataset.interiorFocus='"+name+"'"),name);
  assert.match(app,/if\(!items\.length\)\{[\s\S]*?restoreFocus\(\);\s*return;/);
  assert.match(app,/if\(stackLocked\)\{[\s\S]*?\}\s*restoreFocus\(\);\s*\}\s*syncInteriorUI\(\)/);
  assert.match(app,/const elementState=JSON\.stringify\(\[current\.interiorElements/);
  assert.match(app,/if\(elementState!==lastInteriorState\)syncInteriorUI\(\)/);
});
