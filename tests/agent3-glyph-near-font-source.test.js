import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('missing glyph notice is visible by the selected Typeface, not below file import',()=>{
 const s=readFileSync(new URL('../src/text-overlays-ui.js',import.meta.url),'utf8');
 const grid=s.match(/<div class="text-overlay-grid">([\s\S]*?)<\/div>/);
 assert.ok(grid,'normal Text controls need a grid');
 const content=grid[1];
 const face=content.indexOf('data-text-key="font"');
 const colour=content.indexOf('data-text-key="colour"');
 const warning=content.indexOf('data-text-glyph-status');
 const outline=content.indexOf('data-text-key="outline"');
 assert.ok(face>=0&&colour>face&&warning>colour&&outline>warning,
   'warnings should follow face/colour and precede other styling controls');
 assert.equal((s.match(/data-text-glyph-status/g)||[]).length,2,
   'one warning DOM node plus exactly one lookup (no split identity)');
 assert.match(content,/data-text-glyph-status role="status" aria-live="polite"/,
   'screen readers must receive the same real glyph-coverage message');
 const css=readFileSync(new URL('../text-overlays.css',import.meta.url),'utf8');
 assert.match(css,/\.text-overlay-glyph-status\{[^}]*grid-column:1\/-1/,
   'warning must use full source width at 320px');
 assert.match(css,/\.text-overlay-font-status:empty\{display:none\}/,
   'supported glyphs must consume no accidental height');
});
