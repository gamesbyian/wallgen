import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('normal smooth scrolling is disabled only by explicit reduced-motion preference',()=>{
  const css=read('styles.css');
  assert.match(css,/html\{scroll-behavior:smooth\}/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{html\{scroll-behavior:auto\}/);
  assert.match(read('index.html'),/styles\.css\?v=20261019-motion2/);
});
test('mobile shell and dock still reduce their animated transitions',()=>{
  assert.match(read('studio-themes.css'),/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(read('mobile-compact.css'),/@media\(prefers-reduced-motion:reduce\)/);
});
