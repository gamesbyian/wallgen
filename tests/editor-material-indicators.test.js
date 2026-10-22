import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {materialLayerState} from '../src/editor-material-indicators.js';
import {MATERIAL_LAYER_VIEWS,materialViewForSetting} from '../src/editor-material-inspector.js';
import {EDITOR_CATEGORIES,SETTING_TOOL} from '../src/editor-schema.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('three material objects have one canonical tool each and two compact views',()=>{
  const texture=EDITOR_CATEGORIES.find(category=>category.id==='material');
  assert.deepEqual(texture.tools.map(t=>t.id),['layer1','layer2','layer3','surface']);
  assert.deepEqual(MATERIAL_LAYER_VIEWS.map(x=>x.tool),['layer1','layer2','layer3']);
  for(const entry of MATERIAL_LAYER_VIEWS){
    const keySet=[...entry.material,...entry.finish];
    assert.equal(new Set(keySet).size,6);
    for(const key of keySet){
      assert.deepEqual(materialViewForSetting(key),{
        tool:entry.tool,view:entry.material.includes(key)?'material':'finish'
      });
      assert.equal(SETTING_TOOL[key].tool,entry.tool);
    }
  }
  assert.equal(materialViewForSetting('textureDisplacement'),null);
  assert.equal(materialViewForSetting('palette'),null);
});
test('material states distinguish no texture, disabled layer, auto and zero strength',()=>{
  assert.equal(materialLayerState({material:'none',enabled:true,strength:50}),'off');
  assert.equal(materialLayerState({material:'linen',enabled:false,strength:70}),'off');
  assert.equal(materialLayerState({material:'auto',enabled:true,strength:55}),'auto');
  assert.equal(materialLayerState({material:'concrete',enabled:true,strength:45}),'on');
  assert.equal(materialLayerState({material:'foil',enabled:true,strength:0}),'zero');
});
test('inspector rehomes real DOM controls once, retains source sync and state rails',()=>{
  const editor=read('src/editor-layout.js');
  const inspector=read('src/editor-material-inspector.js');
  const indicator=read('src/editor-material-indicators.js');
  const css=read('editor-material-status.css');
  assert.match(inspector,/const materialNodes=config.material.map\(fieldNode\)/);
  assert.match(inspector,/const finishNodes=config.finish.map\(fieldNode\)/);
  assert.match(inspector,/group.replaceChildren\(nav/);
  assert.doesNotMatch(inspector,/document.createElement\('input'\)/);
  assert.match(inspector,/pane.hidden=!current/);
  assert.match(editor,/installMaterialInspectors\(\{tools,fieldNode\}\)/);
  assert.match(editor,/installMaterialLayerIndicators\(\{form,tools\}\)/);
  assert.match(indicator,/textureLayer2Enabled/);
  assert.match(indicator,/textureLayer3Enabled/);
  assert.match(indicator,/textureStrength3/);
  assert.match(indicator,/chip.dataset.materialState=state/);
  assert.match(indicator,/document.addEventListener\('roygbiv-controls-synced',update\)/);
  assert.match(indicator,/querySelector\('\[data-material-view="finish"\]'\)/);
  for(const state of ['off','auto','on','zero'])
    assert.ok(css.includes('[data-material-state="'+state+'"]'));
});
test('finish explanation is scoped to original layer and not a new switch',()=>{
  const js=read('src/editor-material-indicators.js');
  const css=read('editor-material-status.css');
  const inspectorCSS=read('editor-redesign.css');
  assert.match(js,/note.className='material-finish-help'/);
  assert.match(js,/note.hidden=state!=='off'&&state!=='zero'/);
  assert.match(js,/Choose a texture in Material/);
  assert.match(js,/Strength is 0%/);
  assert.match(css,/material-inspector-pane>\.material-finish-help\[hidden\]/);
  assert.match(inspectorCSS,/material-inspector-pane\[hidden\]/);
  assert.doesNotMatch(js,/document.createElement\('input'\)/);
});
