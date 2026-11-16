import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EDITOR_CATEGORIES,SETTING_TOOL,validateEditorSchema} from '../src/editor-schema.js';
import {scopedKeys} from '../src/scoped-random.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pigmentKeys=['brushRoughness','pigmentStyle','pigmentGrainScale',
  'pigmentEdgeBreakup','pigmentDirectionality'];

test('Pigment has its own Texture tool and Surface keeps distortion only',()=>{
  const texture=EDITOR_CATEGORIES.find(category=>category.id==='material');
  const surface=texture.tools.find(tool=>tool.id==='surface');
  const pigment=texture.tools.find(tool=>tool.id==='pigment');
  assert.ok(pigment);
  assert.deepEqual(surface.settings,['textureDisplacement']);
  assert.deepEqual(pigment.settings,pigmentKeys);
  assert.equal(texture.tools.indexOf(pigment),texture.tools.indexOf(surface)+1);
  for(const key of pigmentKeys)
    assert.deepEqual(SETTING_TOOL[key],{category:'material',tool:'pigment'});
  assert.deepEqual(scopedKeys('tool','pigment'),pigmentKeys);
  assert.deepEqual(scopedKeys('tool','surface'),['textureDisplacement']);
  assert.deepEqual(validateEditorSchema([...new Set(
    EDITOR_CATEGORIES.flatMap(category=>category.tools.flatMap(tool=>tool.settings)))]),
    {missing:[],duplicated:[],unknown:[]});
});

test('Pigment settings reuse exactly one original live control each',()=>{
  const html=read('index.html');
  const layout=read('src/editor-layout.js');
  const stylesheet=read('editor-pigment.css');
  const app=read('src/app.js');
  const swipe=read('src/mobile-swipes.js');
  for(const key of pigmentKeys){
    assert.equal((html.match(new RegExp('name="'+key+'"','g'))||[]).length,1,key);
    assert.equal((html.match(new RegExp('data-setting="'+key+'"','g'))||[]).length,1,key);
  }
  assert.match(layout,/const root=fieldNode\(key\)/);
  assert.match(layout,/appendUnique\(card,root\)/);
  assert.match(html,/editor-pigment\.css\?v=/);
  assert.match(html,/src\/app\.js\?v=20261116-pigment-home1/);
  assert.match(html,/src\/mobile-swipes\.js\?v=20261116-pigment-home1/);
  assert.match(app,/editor-layout\.js\?v=20261116-pigment-home1/);
  assert.match(swipe,/editor-layout\.js\?v=20261116-pigment-home1/);
  assert.match(layout,/editor-schema\.js\?v=20261116-pigment-home1/);
  assert.match(stylesheet,/data-editor-tool="pigment"/);
  assert.match(stylesheet,/grid-template-rows:minmax\(27px,auto\) 35px!important/);
  assert.match(stylesheet,/overflow-y:auto!important/);
  assert.doesNotMatch(stylesheet,/display:contents/);
});
