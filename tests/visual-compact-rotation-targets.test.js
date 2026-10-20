import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync('editor-redesign.css','utf8');
const audit=readFileSync('scripts/visual-reference-audit-agent1.mjs','utf8');
const small=css.slice(css.lastIndexOf('/* At 320–399px'));

test('six native material controls use full-width second row only on 320–399px Edit',()=>{
  assert.match(small,/@media\(max-width:399px\)/);
  assert.match(small,/body\.mobile-studio\.mobile-edit-open \.sidebar/);
  assert.match(small,/grid-template-rows:26px 31px!important/);
  assert.match(small,/grid-column:1\/-1!important;grid-row:2!important/);
  assert.match(small,/\.rotation-controls button\{/);
  assert.match(small,/min-width:25px!important;max-width:none!important/);
  assert.match(small,/input\[type=number\]/);
  assert.match(small,/min-width:45px!important;max-width:45px!important/);
});
test('real 320/360 browser screenshot gate rejects undersized or obstructed rotation controls',()=>{
  assert.match(audit,/profile\.width<=360&&name==='material'/);
  assert.match(audit,/cells\.length!==6\|\|cells\.some/);
  assert.match(audit,/cell\.width<24\|\|cell\.height<24/);
  assert.match(audit,/!cell\.centerTarget/);
  assert.match(audit,/cell\.right>frame\.right\+1/);
});
