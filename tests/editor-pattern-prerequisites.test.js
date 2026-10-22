import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PATTERN_PREREQUISITE_TOOLS,patternToolPrerequisite}
  from '../src/editor-pattern-prerequisites.js';
import {SETTING_TOOL} from '../src/editor-schema.js';

test('all conditional tool and setting keys have real source owners',()=>{
  assert.deepEqual(PATTERN_PREREQUISITE_TOOLS.map(e=>e.tool),['marks','motif-scale']);
  for(const entry of PATTERN_PREREQUISITE_TOOLS)
    for(const key of entry.keys)
      assert.deepEqual(SETTING_TOOL[key],{category:'stripes',tool:entry.tool});
});

test('activation paths match actual construction and pattern prerequisites',()=>{
  assert.equal(patternToolPrerequisite('marks',{construction:'ribbon'}).tool,'patterns');
  assert.equal(patternToolPrerequisite('marks',{construction:'stroke'}).tool,'patterns');
  assert.equal(patternToolPrerequisite('marks',{construction:'woven'}).tool,'structure');
  assert.equal(patternToolPrerequisite('motif-scale',{construction:'ribbon',motif:'solid'}).tool,'patterns');
  assert.equal(patternToolPrerequisite('motif-scale',{construction:'stroke'}).tool,'structure');
  assert.equal(patternToolPrerequisite('motif-scale',{construction:'tonal'}).tool,'structure');
  assert.equal(patternToolPrerequisite('geometry'),null);
});

test('hint uses existing source setting dormancy and avoids fake recipe mutations',()=>{
  const s=readFileSync(new URL('../src/editor-pattern-prerequisites.js',import.meta.url),'utf8');
  const ed=readFileSync(new URL('../src/editor-layout.js',import.meta.url),'utf8');
  const css=readFileSync(new URL('../editor-redesign.css',import.meta.url),'utf8');
  assert.match(s,/dataset.inactive==='true'/);
  assert.match(s,/entry.keys.every/);
  assert.match(s,/roygbiv-controls-synced/);
  assert.match(s,/editor-tool-changed/);
  assert.match(s,/select\('stripes',config.tool\)/);
  assert.doesNotMatch(s,/changeRecipe\(|createElement\('input'\)/);
  assert.match(ed,/installPatternPrerequisites\(\{form,tools,/);
  assert.match(css,/editor-pattern-prerequisite\[hidden\]/);
});
