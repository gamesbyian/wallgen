import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('compact text transform grips remain 44px real controls and outside narrow ink',()=>{
 const ui=readFileSync(new URL('../src/text-direct-ui.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../text-overlays.css',import.meta.url),'utf8');
 assert.match(ui,/const compact=physicalWidth<80&&physicalHeight<100/,
   'one-letter text must be distinguished from wide titles');
 for(const state of ['text-direct-compact','text-direct-scale-left','text-direct-scale-up'])
   assert.ok(ui.includes("outline.classList.toggle('"+state+"'"),
     'compact/edge state missing '+state);
 assert.match(css,/\.text-direct-handle\{[^}]*width:44px;height:44px/,
   'small-text adjustment must preserve 44px handle reach');
 assert.match(css,/\.text-direct-outline\.text-direct-compact \.text-direct-scale\{/,
   'compact grip must be outside the editable lettering');
 assert.match(css,/\.text-direct-outline\.text-direct-compact\.text-direct-scale-left\.text-direct-scale-up/,
   'right/bottom clipping must select the matching inward corner');
 assert.match(css,/\.text-direct-outline\.text-direct-compact\.text-direct-rotate-inset/,
   'near-top safety must not put rotate atop tiny glyphs');
 assert.match(ui,/element\.setAttribute\('aria-label',label\)/,
   'keyboard/screen-reader transform descriptions must remain');
 assert.match(ui,/event\.preventDefault\(\);event\.stopImmediatePropagation\(\)/,
   'canvas pointer handling must retain its existing capture guard');
});
