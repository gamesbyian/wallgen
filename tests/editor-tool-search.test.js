import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TOOL_LIST} from '../src/editor-schema.js';
import {toolAppliesToScene} from '../src/editor-tool-applicability.js';
import {findEditorToolMatch} from '../src/editor-tool-search.js';
import {legacyToolAliases} from '../src/editor-terminology.js';

const choose=(query,scene)=>findEditorToolMatch(query,TOOL_LIST,{
  applies:tool=>toolAppliesToScene(tool,scene)
});

test('editor search includes only tools applicable to current canvas structure',()=>{
  assert.equal(choose('Radial rays',{structure:'paths'}),null);
  assert.equal(choose('Radial rays',{structure:'radial'})?.id,'rays');
  assert.equal(choose('Geometry',{structure:'radial'}),null);
  assert.equal(choose('Geometry',{structure:'paths'})?.id,'geometry');
  assert.equal(choose('Region detail',{structure:'regions'})?.id,'region-detail');
  assert.equal(choose('Region detail',{structure:'paths'}),null);
  assert.equal(choose('Origin',{structure:'regions',regionMode:'voronoi'}),null);
  assert.equal(choose('Origin',{structure:'regions',regionMode:'nested'})?.id,'origin');
  assert.equal(choose('Band tones',{structure:'paths',construction:'ribbon'}),null);
  assert.equal(choose('Band tones',{structure:'paths',construction:'tonal'})?.id,'tone');
});
test('editor search matches labels and does not mutate or invent a fallback',()=>{
  const scene={structure:'paths'};
  const options={applies:t=>toolAppliesToScene(t,scene),
    labelFor:key=>key==='shapeDepth'?'Amplitude':key};
  assert.equal(findEditorToolMatch('AMPLITUDE',TOOL_LIST,options)?.id,'geometry');
  assert.equal(findEditorToolMatch('  shape detail   ',TOOL_LIST,options)?.id,'shape-details');
  assert.equal(findEditorToolMatch('does not exist',TOOL_LIST,options),null);
  assert.equal(findEditorToolMatch('',TOOL_LIST,options),null);
  assert.equal(findEditorToolMatch('   ',TOOL_LIST,options),null);
  assert.equal(findEditorToolMatch('Radial rays',TOOL_LIST)?.id,'rays',
    'dormant matches must be distinguishable from absent matches');
});
test('live search reports an inapplicable match rather than selecting an unrelated tool',()=>{
  const js=readFileSync(new URL('../src/editor-layout.js',import.meta.url),'utf8');
  const css=readFileSync(new URL('../editor-redesign.css',import.meta.url),'utf8');
  assert.match(js,/findEditorToolMatch\(query,TOOL_LIST,options\)/);
  assert.match(js,/applies:tool=>toolApplies\(tools\.get\(tool\.id\)\)/);
  assert.match(js,/That setting is unavailable for the current canvas structure/);
  assert.match(js,/searchStatus\.setAttribute\('role','status'\)/);
  assert.match(css,/\.editor-search-status\[hidden\]/);
  assert.match(css,/position:absolute;z-index:21/);
});

test('a user can find rotation controls by visible accessible words or internal key',()=>{
  const options={applies:()=>true,labelFor:key=>
    key==='textureRotation3'?'Texture layer 3 rotation in degrees':key};
  assert.equal(findEditorToolMatch('layer 3 rotation',TOOL_LIST,options)?.id,'finish3');
  assert.equal(findEditorToolMatch('textureRotation3',TOOL_LIST,options)?.id,'finish3');
  const layout=readFileSync(new URL('../src/editor-layout.js',import.meta.url),'utf8');
  assert.match(layout,/const labelFor=key=>sourceSettingLabel\(form\.elements\.namedItem\(key\),key\)/);
});


test('geometric and per-stripe Variation tools have distinct names with legacy search aliases',()=>{
  assert.equal(TOOL_LIST.find(tool=>tool.id==='variability').name,'Irregularity');
  assert.equal(TOOL_LIST.find(tool=>tool.id==='character').name,'Stripe differences');
  const options={aliasesForTool:legacyToolAliases};
  assert.equal(findEditorToolMatch('Controlled chaos',TOOL_LIST,options)?.id,'variability');
  assert.equal(findEditorToolMatch('Stripe variation',TOOL_LIST,options)?.id,'character');
  assert.equal(findEditorToolMatch('Variation',TOOL_LIST,options)?.id,'variability');
});
