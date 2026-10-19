import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('base Studio, lighting and shadow surfaces use flat colours exclusively',()=>{
  const css=read('styles.css');
  assert.doesNotMatch(css,/\b(?:linear|radial|conic)-gradient\s*\(/i);
  for(const [selector,colour] of [
    ['studio-stage','#171924'],
    ['button-rainbow','#f29d8b'],
    ['lighting-subsection','#232132'],
    ['lighting-icon','#705683'],
    ['stripe-shadow-section','#242633']
  ])assert.ok(css.includes('background:'+colour),selector);
  assert.match(css,/\.studio-stage:before\{[^}]*background-image:none/);
  assert.match(read('index.html'),/styles\.css\?v=20261019-baseflat1/);
});
test('unrelated scrollbar fade masks and procedural wallpaper remain owned elsewhere',()=>{
  const css=read('ui-audit-fixes.css');
  assert.match(css,/mask-image:linear-gradient\(to right,/);
  assert.doesNotMatch(read('styles.css'),/mask-image/);
});
