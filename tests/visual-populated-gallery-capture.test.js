import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync('scripts/visual-reference-audit-agent1.mjs','utf8');
test('real generated Explore contact sheets are captured at phone and landscape',()=>{
  assert.match(source,/'explore-populated':'explore'/);
  assert.match(source,/phone-412x892'.*'explore-populated'/);
  assert.match(source,/landscape-700x412'.*'explore-populated'/);
  assert.match(source,/await click\(page,'#batch'\)/);
  assert.match(source,/document\.querySelectorAll\('#gallery \.thumb'\)\.length>=12/);
});
test('thumb canvas clipping is measured separately from preview/tray overlap',()=>{
  assert.match(source,/firstThumbCanvas:rect\('#gallery \.thumb canvas'\)/);
  assert.match(source,/galleryGridOverflowY:/);
  assert.match(source,/Math\.max\(0,canvas\.bottom-grid\.bottom\)/);
  assert.match(source,/measured\.stageOverlap>1/);
});
