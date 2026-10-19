import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const stylesheet=readFileSync('editor-redesign.css','utf8');
const audit=readFileSync('scripts/visual-reference-audit-agent1.mjs','utf8');
const scope=stylesheet.slice(stylesheet.lastIndexOf('/* Measured at the narrow desktop boundary'));

test('desktop ordinary editor targets are larger than 24px',()=>{
  assert.match(scope,/@media\(min-width:791px\)/);
  assert.match(scope,/\.lockable-setting:not\(\.texture-rotation-field\)>\.editor-setting-die/);
  assert.match(scope,/\.lockable-setting:not\(\.texture-rotation-field\)>\.setting-lock/);
  assert.match(scope,/width:25px;min-width:25px;height:25px;min-height:25px/);
  assert.match(scope,/grid-template-columns:minmax\(0,1fr\) 25px 25px/);
});
test('rotation shortcuts and phone 790px geometry are excluded',()=>{
  assert.ok(scope.startsWith('/* Measured'));
  assert.doesNotMatch(scope,/\.texture-rotation-field\s*>/);
  assert.match(scope,/@media\(min-width:791px\)/);
});
test('real desktop 791px screenshots reject undersized lock/dice controls',()=>{
  assert.match(audit,/profile\.id==='desktop-791x892'&&measured\.undersized24\.length/);
  assert.match(audit,/errors\.push\(\{key,error\}\)/);
});
