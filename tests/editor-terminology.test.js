import test from 'node:test';
import assert from 'node:assert/strict';
import {EDITOR_CATEGORIES,TOOL_LIST,SETTING_TOOL,validateEditorSchema} from '../src/editor-schema.js';
import {FULL_SETTING_LABELS,fullSettingName,legacyCategoryAliases,
  legacyToolAliases,legacySettingAliases} from '../src/editor-terminology.js';
import {findEditorToolMatch} from '../src/editor-tool-search.js';

test('names-only migration retains seven canonical categories, forty tool IDs and all settings',()=>{
  assert.deepEqual(EDITOR_CATEGORIES.map(c=>c.label),
    ['Layout','Path','Stripes','Details','Colour','Texture','Light']);
  assert.equal(TOOL_LIST.length,40);
  const keys=Object.keys(SETTING_TOOL);
  assert.equal(keys.length,87);
  assert.deepEqual(validateEditorSchema(keys),{missing:[],duplicated:[],unknown:[]});
  assert.ok(keys.includes('textureDisplacement'));
  assert.ok(keys.includes('textureLayer2Enabled')&&keys.includes('textureLayer3Enabled'));
  for(const tool of TOOL_LIST)assert.ok(tool.id&&tool.category&&tool.name);
});

test('short visible names still give each layered texture and light setting a distinct accessible name',()=>{
  for(const [key,name] of [
    ['textureStrength','Texture layer 1 strength'],
    ['textureStrength2','Texture layer 2 strength'],
    ['textureStrength3','Texture layer 3 strength'],
    ['textureScale2','Texture layer 2 scale'],
    ['textureRotation3','Texture layer 3 rotation'],
    ['textureCoverage2','Texture layer 2 coverage'],
    ['textureDisplacement','Texture-driven contour distortion'],
    ['stripeShadowStrength','Stripe shadow strength'],
    ['lightStrength','Light intensity'],
    ['shadowStrength','Canvas shading'],
  ])assert.equal(fullSettingName(key),name);
  assert.equal(new Set(['textureStrength','textureStrength2','textureStrength3']
    .map(key=>FULL_SETTING_LABELS[key])).size,3);
});

test('old search terms remain functional without coupling saved recipe keys to text',()=>{
  const opts={
    labelFor:key=>fullSettingName(key),
    aliasesForCategory:legacyCategoryAliases,
    aliasesForTool:legacyToolAliases,
    aliasesForSetting:legacySettingAliases,
  };
  for(const [query,id] of [
    ['Canvas structure','structure-mode'],['Design type','structure-mode'],
    ['Element motion','interior-motion'],['Wave','interior-motion'],
    ['Colour story','rainbow'],['Palette','rainbow'],
    ['Texture displacement','surface'],['Contour distortion','surface'],
    ['Pattern homogeneity','patterns'],['Pattern uniformity','patterns'],
    ['Region complexity','regions'],['Region count','regions'],
    ['Centre clearance','ray-shape'],['Centre gap','ray-shape'],
    ['Material','layer1'],['Texture','layer1'],
    ['Character','character'],['Stripe individuality','character'],
  ]){
    const found=findEditorToolMatch(query,TOOL_LIST,opts);
    assert.equal(found?.id,id,query);
  }
});
