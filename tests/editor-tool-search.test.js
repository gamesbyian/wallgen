import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TOOL_LIST} from '../src/editor-schema.js';
import {toolAppliesToScene} from '../src/editor-tool-applicability.js';
import {findEditorToolMatch,findEditorSearchHit} from '../src/editor-tool-search.js';
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
  assert.match(js,/findEditorSearchHit\(query,TOOL_LIST,options\)/);
  assert.match(js,/applies:tool=>toolApplies\(tools\.get\(tool\.id\)\)/);
  assert.match(js,/That setting is unavailable for the current canvas structure/);
  assert.match(js,/searchStatus\.setAttribute\('role','status'\)/);
  assert.match(css,/\.editor-search-status\[hidden\]/);
  assert.match(css,/position:absolute;z-index:21/);
});

test('a user can find rotation controls by visible accessible words or internal key',()=>{
  const options={applies:()=>true,labelFor:key=>
    key==='textureRotation3'?'Texture layer 3 rotation in degrees':key};
  assert.equal(findEditorToolMatch('layer 3 rotation',TOOL_LIST,options)?.id,'layer3');
  assert.equal(findEditorToolMatch('textureRotation3',TOOL_LIST,options)?.id,'layer3');
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

test('exact settings outrank similarly named tools and carry their canonical home',()=>{
  const matches=(query,scene)=>findEditorSearchHit(query,TOOL_LIST,{
    applies:tool=>toolAppliesToScene(tool,scene),
    labelFor:key=>key==='textureRotation3'?'Texture layer 3 rotation in degrees':
      key==='textureDisplacement'?'Contour distortion':key
  });
  const result=matches('Contour distortion',{structure:'paths'});
  assert.equal(result?.key,'textureDisplacement');
  assert.equal(result.tool.id,'surface');
  assert.equal(matches('textureRotation3',{structure:'paths'})?.tool.id,'finish3');
  assert.equal(matches('Structure',{structure:'paths'})?.key,'structure');
  assert.equal(matches('Radial rays',{structure:'paths'}),null);
  assert.equal(matches('Radial rays',{structure:'radial'})?.kind,'tool');
  assert.equal(matches('   ',{structure:'paths'}),null);
});

test('intent synonyms identify creative outcomes only when their tool is available',()=>{
  const find=(query,scene)=>findEditorSearchHit(query,TOOL_LIST,{
    applies:tool=>toolAppliesToScene(tool,scene)
  });
  assert.equal(find('breathing room',{structure:'paths'})?.key,'spread');
  assert.equal(find('space between circles',{structure:'regions',regionMode:'scattered'})?.key,'scatteredSpacing');
  assert.equal(find('space between circles',{structure:'paths'}),null);
  assert.equal(find('texture changes edges',{structure:'paths'})?.key,'textureDisplacement');
  assert.equal(find('texture changes edges',{structure:'radial'}),null);
  assert.equal(find('neon',{structure:'paths'})?.key,'glow');
});

test('live editor provides visible location and explicit keyboard focus without new fields',()=>{
  const js=readFileSync(new URL('../src/editor-layout.js',import.meta.url),'utf8');
  assert.match(js,/findEditorSearchHit\(query,TOOL_LIST,options\)/);
  assert.match(js,/matchedSearchHit/);
  assert.match(js,/event.key!=='Enter'/);
  assert.match(js,/event.preventDefault\(\); \/\/ Never submit/);
  assert.match(js,/focus\(\{preventScroll:true\}\)/);
});
