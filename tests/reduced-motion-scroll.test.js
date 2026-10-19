import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('document smooth scrolling yields to reduced-motion preference',()=>{
  const css=read('styles.css');
  assert.match(css,/html\{scroll-behavior:smooth\}/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{html\{scroll-behavior:auto\}\}/);
});
test('existing mobile tray and dock transition preferences remain in place',()=>{
  const shell=read('studio-themes.css'),dock=read('mobile-compact.css');
  assert.match(shell,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(dock,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(dock,/\.mobile-dock-expand/);
  assert.match(read('index.html'),/styles\.css\?v=20261019-motion1/);
});
