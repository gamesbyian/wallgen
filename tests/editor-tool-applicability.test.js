import test from 'node:test';
import assert from 'node:assert/strict';
import {TOOL_LIST,EDITOR_CATEGORIES} from '../src/editor-schema.js';
import {toolAppliesToScene} from '../src/editor-tool-applicability.js';

const visible=(structure,regionMode='voronoi',construction='ribbon')=>
  TOOL_LIST.filter(tool=>toolAppliesToScene(tool,{structure,regionMode,construction}))
    .map(tool=>tool.id);

test('scene policy preserves every tool in its source schema',()=>{
  assert.equal(TOOL_LIST.length,40);
  assert.equal(EDITOR_CATEGORIES.length,7);
  for(const structure of ['paths','radial','regions']){
    const tools=visible(structure);
    assert.ok(tools.includes('structure-mode'));
    assert.ok(tools.includes('rainbow'));
    assert.ok(tools.includes('layer1'));
    assert.equal(tools.length,new Set(tools).size);
    assert.ok(tools.every(id=>TOOL_LIST.some(tool=>tool.id===id)));
  }
});
test('path-specific tools and shape settings appear only in path scenes',()=>{
  const paths=visible('paths'),radial=visible('radial'),regions=visible('regions');
  for(const id of ['geometry','safety','turn','single-loop','shape-details','ends','outlines','surface','structure'])
    assert.ok(paths.includes(id),id);
  for(const id of ['geometry','safety','turn','single-loop','shape-details','ends','outlines','surface','structure']){
    assert.ok(!radial.includes(id),'radial '+id);
    assert.ok(!regions.includes(id),'regions '+id);
  }
  assert.ok(radial.includes('rays'));
  assert.ok(radial.includes('ray-shape'));
  assert.ok(!regions.includes('rays'));
  assert.ok(regions.includes('regions'));
  assert.ok(regions.includes('dividers'));
  assert.ok(radial.includes('dividers'));
  assert.ok(!paths.includes('dividers'));
});
test('origin only appears for nested regions; band tones only for tonal paths',()=>{
  assert.ok(visible('radial').includes('origin'));
  assert.ok(!visible('regions','voronoi').includes('origin'));
  assert.ok(visible('regions','nested').includes('origin'));
  assert.ok(!visible('paths','voronoi','ribbon').includes('tone'));
  assert.ok(visible('paths','voronoi','tonal').includes('tone'));
  assert.ok(!visible('radial','nested','tonal').includes('tone'));
});
