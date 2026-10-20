import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DRAWINGS_E} from '../src/ui-icon-drawings-e.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Smooth Path before-curve contrast follows cream and dark theme foreground',()=>{
  const icon=read('assets/icons/roygbiv/smooth-path.svg');
  const guide='stroke="currentColor" opacity=".68" stroke-dasharray="3 3"';
  assert.ok(icon.includes(guide),'standalone angular before-curve uses themed guide');
  assert.ok(DRAWINGS_E['smooth-path'].includes(guide),'inline glyph retains same guide');
  assert.doesNotMatch(icon,/#BBB2BE/);
  assert.match(icon,/stroke="#BB64ED"/);
  assert.match(icon,/fill="#FFE25B"/);
});

test('exact offline 68-glyph review matrix carries the same unwired Smooth Path art',()=>{
  const fixture=read('assets/icons/roygbiv/state-matrix.html');
  const match=fixture.match(/<script id="icon-inventory" type="application\/json">([\s\S]*?)<\/script>/);
  assert.ok(match,'matrix must retain serialized source state');
  const data=JSON.parse(match[1]);
  assert.equal(data.drawings['smooth-path'],DRAWINGS_E['smooth-path']);
  assert.match(fixture,/\.dark \.sample\{background:#242331;color:#f6eff7/);
  assert.match(fixture,/\.state\.disabled \.sample\{opacity:\.45/);
});
