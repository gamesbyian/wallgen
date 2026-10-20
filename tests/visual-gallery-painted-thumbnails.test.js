import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync('scripts/visual-reference-audit-agent1.mjs','utf8');
test('asynchronously created gallery canvases cannot count as painted wallpapers',()=>{
  assert.match(source,/const awaitPaintedThumbnails=async\(page,required\)/);
  assert.match(source,/page\.waitForFunction\(count=>/);
  assert.match(source,/cards\.length<count/);
  assert.match(source,/canvas\.getContext\('2d'\)\.getImageData\(0,0,1,1\)\.data\[3\]>0/);
  assert.match(source,/\},required,\{timeout:90000\}\)/);
});
test('Saved image and all twelve Explore images must paint before their real screenshot',()=>{
  const saved=source.slice(source.indexOf("'saved-populated':async"),source.indexOf("'explore-populated':async"));
  const explore=source.slice(source.indexOf("'explore-populated':async"),source.indexOf('  more:async'));
  assert.match(saved,/await awaitPaintedThumbnails\(page,1\)/);
  assert.match(explore,/await awaitPaintedThumbnails\(page,12\)/);
  assert.match(saved,/Saved: '\+JSON\.stringify\(capture\)/);
  assert.match(explore,/document\.querySelectorAll\('#gallery \.thumb'\)\.length>=12/);
});
