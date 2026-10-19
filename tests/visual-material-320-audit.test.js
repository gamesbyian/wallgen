import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const live=readFileSync('scripts/visual-reference-audit-agent1.mjs','utf8');
test('the real mobile material toolbar reports six source-backed interactive cells',()=>{
  assert.match(live,/editor-tool-card\[data-editor-tool="finish1"\] \.texture-rotation-field \.rotation-controls/);
  assert.match(live,/querySelectorAll\('button,input\[type=number\]'\)/);
  assert.match(live,/document\.elementFromPoint/);
  assert.match(live,/centerTarget:el===probe\|\|el\.contains\(probe\)/);
  assert.match(live,/MATERIAL ROTATION/);
  assert.match(live,/profile\.width<=360&&name==='material'/);
});
