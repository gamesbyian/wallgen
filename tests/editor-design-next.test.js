import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TOOL_LIST} from '../src/editor-schema.js';
import {toolAppliesToScene} from '../src/editor-tool-applicability.js';
import {designTypeNextTool} from '../src/editor-design-next.js';
test('each scene structure has one valid immediate artistic continuation',()=>{
  const options=[
    ['paths','voronoi','geometry'],
    ['radial','voronoi','rays'],
    ['regions','voronoi','regions'],
    ['regions','nested','regions'],
    ['regions','scattered','scattered-size']
  ];
  for(const [structure,regionMode,id] of options){
    const d=designTypeNextTool(structure,regionMode);
    assert.equal(d.category,'path');
    assert.equal(d.tool,id);
    const source=TOOL_LIST.find(t=>t.id===id);
    assert.ok(source,'missing tool '+id);
    assert.equal(toolAppliesToScene(source,{structure,regionMode}),true);
  }
});
test('next action does not change recipe automatically or create phantom fields',()=>{
  const file=readFileSync(new URL('../src/editor-design-next.js',import.meta.url),'utf8');
  const main=readFileSync(new URL('../src/editor-layout.js',import.meta.url),'utf8');
  assert.match(file,/document\.addEventListener\('roygbiv-controls-synced',sync\)/);
  assert.match(file,/button\.addEventListener\('click'/);
  assert.match(file,/select\(category,tool\)/);
  assert.doesNotMatch(file,/changeRecipe|createElement\('input'\)/);
  assert.match(main,/installDesignTypeNext\(\{form,tools,/);
});
