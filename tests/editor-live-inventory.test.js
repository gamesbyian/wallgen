import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EDITOR_CATEGORIES,TOOL_LIST,validateEditorSchema} from '../src/editor-schema.js';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sourceNames=[...html.matchAll(/\bname="([^"]+)"/g)].map(match=>match[1]);
const count=name=>sourceNames.filter(value=>value===name).length;

test('every source-backed named editor setting remains present exactly once',()=>{
  const keys=TOOL_LIST.flatMap(tool=>tool.settings);
  assert.equal(EDITOR_CATEGORIES.length,7);
  assert.equal(TOOL_LIST.length,40,'redesign must not silently drop a named tool');
  assert.equal(new Set(TOOL_LIST.map(tool=>tool.id)).size,40);
  assert.equal(new Set(keys).size,keys.length,'a source field cannot have two tool homes');
  assert.deepEqual(validateEditorSchema([...new Set(keys)]),
    {missing:[],duplicated:[],unknown:[]});
  for(const key of keys)
    assert.equal(count(key),1,key+' must have one canonical source form input');
});

test('source-backed exceptional fields keep their stable form identities',()=>{
  for(const key of ['family','primesOnly','textureLayer2Enabled',
    'textureLayer3Enabled'])
    assert.equal(count(key),1,key+' source input identity changed');
  for(const category of EDITOR_CATEGORIES){
    assert.ok(category.tools.length>0,category.id+' has no reachable tool');
    assert.ok(category.id&&category.label&&category.icon);
    for(const tool of category.tools)
      assert.ok(tool.id&&tool.name&&Array.isArray(tool.settings));
  }
});
