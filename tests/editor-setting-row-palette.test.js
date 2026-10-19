import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EDITOR_CATEGORIES} from '../src/editor-schema.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('flat row accent language covers exactly the seven live tool categories',()=>{
  const css=read('editor-setting-rows.css');
  const html=read('index.html');
  const categories=EDITOR_CATEGORIES.map(category=>category.id);
  assert.deepEqual(categories,['layout','path','stripes','details','colour','material','effects']);
  for(const category of categories)
    assert.ok(css.includes('[data-control-category="'+category+'"]'),category);
  for(const kind of ['slider','choice','toggle','colour','rotation'])
    assert.ok(css.includes('[data-control-kind="'+kind+'"]'),kind);
  assert.match(css,/html\[data-theme="cream"\]/);
  assert.match(css,/html\[data-theme="dark"\]/);
  assert.match(css,/input\[data-inactive="true"\]/);
  assert.match(css,/box-shadow:inset 3px 0 0/);
  assert.doesNotMatch(css,/linear-gradient|radial-gradient|conic-gradient/i);
  assert.match(html,/editor-setting-rows\.css\?v=/);
});
test('presentation-only row language never reconstructs source inputs or changes the recipe',()=>{
  const css=read('editor-setting-rows.css');
  const annotation=read('src/editor-control-roles.js');
  assert.match(annotation,/root\.dataset\.controlCategory=category/);
  assert.match(annotation,/root\.dataset\.controlKind=kind/);
  assert.match(annotation,/root\.classList\.add\('editor-setting-row'\)/);
  assert.doesNotMatch(css,/grid-template-columns|height:|width:|padding:|display:|position:|pointer-events/);
  assert.doesNotMatch(css,/\.texture-rotation-field\s*\{/);
});
