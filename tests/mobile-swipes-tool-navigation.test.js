import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {visibleMobileTools,adjacentVisibleMobileTool} from '../src/mobile-tool-sequence.js';

const chip=(category,id,name,{hidden=false,disabled=false}={})=>({
  dataset:{category,editorTool:id},hidden,disabled,textContent:name,
  querySelector:()=>null
});

test('portrait swipe sequence uses the actual visible canonical chooser, not all static tool definitions',()=>{
  const chips=[
    chip('path','geometry','Geometry',{hidden:true}),
    chip('path','rays','Radial rays'),
    chip('path','ray-shape','Ray detail',{hidden:true}),
    chip('path','origin','Origin'),
    chip('path','regions','Regions',{hidden:true}),
    chip('path','safety','Constraints'),
    chip('path','ends','Endpoints',{disabled:true}),
    chip('stripes','structure','Structure')
  ];
  const choices=visibleMobileTools(chips,'path');
  assert.deepEqual(choices,[
    {id:'rays',name:'Radial rays'},
    {id:'origin',name:'Origin'},
    {id:'safety',name:'Constraints'}
  ]);
  assert.equal(adjacentVisibleMobileTool(choices,'rays',1),'origin');
  assert.equal(adjacentVisibleMobileTool(choices,'origin',1),'safety');
  assert.equal(adjacentVisibleMobileTool(choices,'safety',1),null);
  assert.equal(adjacentVisibleMobileTool(choices,'rays',-1),null);
  assert.equal(adjacentVisibleMobileTool(choices,'safety',-1),'origin');
  assert.equal(adjacentVisibleMobileTool(choices,'geometry',1),null,
    'stale hidden selection is never sent to the canonical tool chooser');
  assert.deepEqual(visibleMobileTools(chips,'stripes'),[
    {id:'structure',name:'Structure'}]);
});

test('tool-name extraction preserves rendered accessible label from icon-bearing chips',()=>{
  const choices=visibleMobileTools([{
    dataset:{category:'material',editorTool:'layer1'},
    hidden:false,disabled:false,textContent:'✺ Layer 1',
    querySelector:()=>({textContent:'Layer 1'})
  }],'material');
  assert.deepEqual(choices,[{id:'layer1',name:'Layer 1'}]);
});

test('touch coordinator and counter share one visible sequence and preserve direct tool selection',()=>{
  const source=readFileSync(new URL('../src/mobile-swipes.js',import.meta.url),'utf8');
  assert.match(source,/const availableTools=\(\)=>visibleMobileTools\(/);
  assert.match(source,/const choices=availableTools\(\),index=choices.findIndex/);
  assert.match(source,/adjacentVisibleMobileTool\(availableTools\(\),active.tool,dx<0\?1:-1\)/);
  assert.match(source,/if\(next\)selectEditorTool\(active.category,next,\{source:'swipe'\}\)/);
  assert.match(source,/document.addEventListener\('editor-tool-changed'/);
  assert.doesNotMatch(source,/EDITOR_CATEGORIES/,
    'there is one owner for scene applicability, not a parallel static swipe taxonomy');
});
