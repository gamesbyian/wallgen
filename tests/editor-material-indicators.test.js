import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {materialLayerState} from '../src/editor-material-indicators.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('material status distinguishes no texture, disabled layer, auto and zero strength',()=>{
  assert.equal(materialLayerState({material:'none',enabled:true,strength:50}),'off');
  assert.equal(materialLayerState({material:'linen',enabled:false,strength:70}),'off');
  assert.equal(materialLayerState({material:'auto',enabled:true,strength:55}),'auto');
  assert.equal(materialLayerState({material:'concrete',enabled:true,strength:45}),'on');
  assert.equal(materialLayerState({material:'foil',enabled:true,strength:0}),'zero');
});
test('status presentation binds real fields, includes all three chips and all source sync pathways',()=>{
  const src=read('src/editor-material-indicators.js');
  const editor=read('src/editor-layout.js');
  const css=read('editor-material-status.css');
  assert.match(src,/textureLayer2Enabled/);
  assert.match(src,/textureLayer3Enabled/);
  assert.match(src,/textureStrength3/);
  assert.match(src,/chip\.dataset\.materialState=state/);
  assert.match(src,/chip\.setAttribute\('aria-label',label\)/);
  assert.match(src,/document\.addEventListener\('roygbiv-controls-synced',update\)/);
  assert.match(editor,/installMaterialLayerIndicators\(\{form,tools\}\)/);
  for(const state of ['off','auto','on','zero'])
    assert.ok(css.includes('[data-material-state="'+state+'"]'),state);
  assert.doesNotMatch(css,/linear-gradient|radial-gradient|conic-gradient/i);
  assert.doesNotMatch(css,/grid-template-columns|height:|width:|padding:/);
});
