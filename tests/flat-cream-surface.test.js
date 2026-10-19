import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('cream Studio and dock use flat colours rather than decorative gradients',()=>{
  const css=readFileSync(new URL('../studio-themes.css',import.meta.url),'utf8');
  assert.doesNotMatch(css,/\b(?:linear|radial|conic)-gradient\s*\(/i);
  assert.match(css,/html\[data-theme="cream"\] \.studio-stage\{\s*background:#fbf6ee/);
  assert.match(css,/html\[data-theme=cream\] \.studio-stage\{background:#fbf6ee\}/);
  assert.match(css,/html\[data-theme=cream\] \.mobile-dock \.mobile-dock-featured\{color:#252336;\s*background:#f3d6e9/);
});
