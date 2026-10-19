import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync('mobile-compact.css','utf8');
const sidebar=css.match(/body\.mobile-studio\.mobile-edit-open \.sidebar\{[\s\S]*?\n  \}/)?.[0];
const handle=css.match(/body\.mobile-studio \.mobile-dock-expand\{[\s\S]*?\n  \}/)?.[0];

test('editor drawer leaves exactly a 40px navigation recovery strip',()=>{
  assert.ok(sidebar,'source editor sheet CSS');
  assert.match(sidebar,/width:calc\(100% - 40px\)!important/);
});
test('recovery chevron occupies the reserved strip at a 40 by 45 CSS px target',()=>{
  assert.ok(handle,'recovery handle must exist');
  assert.match(handle,/position:fixed;right:0;bottom:7px/);
  assert.match(handle,/width:40px;height:45px;min-width:40px;min-height:45px/);
  assert.match(css,/body\.mobile-studio\.mobile-edit-open \.mobile-dock-expand\{/);
  assert.doesNotMatch(handle,/pointer-events:none!important/);
});
