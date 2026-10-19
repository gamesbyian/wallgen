import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DRAWINGS_E} from '../src/ui-icon-drawings-e.js';
const source=name=>readFileSync(new URL('../assets/icons/roygbiv/'+name+'.svg',import.meta.url),'utf8');
test('essential anchor and extension-frame guidance inherits both theme foregrounds',()=>{
  const required=[
    ['anchor-points','stroke-dasharray="2.5 3" stroke="currentColor"'],
    ['extend-path','rx="2" stroke="currentColor" stroke-dasharray="3 3"']
  ];
  for(const [name,detail] of required){
    assert.ok(source(name).includes(detail),name+' standalone asset');
    assert.ok(DRAWINGS_E[name].includes(detail),name+' production inline drawing');
    assert.ok(!source(name).includes('stroke="#18151F"'),name+' has near-black dependent detail');
  }
});
test('core accents and disabled state remain controlled outside the SVGs',()=>{
  assert.match(source('anchor-points'),/stroke="#53AAFF"/);
  assert.match(source('extend-path'),/stroke="#FF474E"/);
  const fixture=readFileSync(new URL('../assets/icons/roygbiv/state-matrix.html',import.meta.url),'utf8');
  assert.match(fixture,/\.state\.disabled \.sample\{opacity:\.45/);
  assert.match(fixture,/\.dark \.sample\{background:#242331;color:#f6eff7/);
});
