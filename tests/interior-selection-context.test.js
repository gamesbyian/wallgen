import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveInteriorSelection} from '../src/interior-elements.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('stable interior element IDs win over obsolete list indices',()=>{
  const elements=[{id:'first'},{id:'second'},{id:'third'}];
  assert.equal(resolveInteriorSelection(elements,'second',0),1);
  assert.equal(resolveInteriorSelection([...elements].reverse(),'second',0),1);
  assert.equal(resolveInteriorSelection(elements,'removed',2),2);
});

test('each secondary editor shares the selected original element',()=>{
  const app=read('src/app.js');
  assert.match(app,/for\(const \[id,card\] of Object.entries\(interiorCards\)\)/);
  assert.match(app,/if\(id==='interior'\)continue/);
  assert.match(app,/switcher.dataset.interiorSwitcher='true'/);
  assert.match(app,/switcher.dataset.interiorFocus='context.'\+id\+'.choose'/);
  assert.match(app,/selectedInteriorId=items\[selectedInterior\]\?\.id\?\?null/);
  assert.match(app,/syncInteriorUI\(\);/);
  assert.doesNotMatch(app,/document.createElement\('input'\).*interiorSwitcher/);
  assert.match(app,/!control.hasAttribute\('data-interior-switcher'\)/);
});

test('source focus and fixed card height remain explicit',()=>{
  const app=read('src/app.js');
  const css=read('detail-controls.css');
  assert.match(app,/resolveInteriorFocusTarget\(controls,focused\)\?\.focus/);
  assert.match(css,/interior-selection-context/);
  assert.match(css,/min-height:27px;height:27px/);
  assert.doesNotMatch(css.slice(css.indexOf('A compact, synchronized element selector')),
    /overflow-y:\s*auto|overflow:\s*scroll/);
});
