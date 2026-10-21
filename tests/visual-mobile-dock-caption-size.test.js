import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync('mobile-compact.css','utf8');
const script=readFileSync('scripts/visual-reference-audit-agent1.mjs','utf8');

test('five-destination captions remain readable inside 44px native button targets',()=>{
  assert.match(css,/body\.mobile-studio \.mobile-dock button>small\{font-size:10px;line-height:1\.2\}/);
  assert.match(css,/body\.mobile-studio \.mobile-dock\s*\{\s*height:52px!important/);
  const buttonRule=css.match(/body\.mobile-studio \.mobile-dock button\s*\{([^}]+)\}/)?.[1];
  assert.ok(buttonRule,'Mobile five-way native button CSS rule missing');
  assert.match(buttonRule,/min-height:44px!important;height:44px;max-height:45px/);
});
test('real responsive screenshots reject undersized or clipped dock captions',()=>{
  assert.match(script,/document\.querySelectorAll\('#mobileActionDock>button>small'\)/);
  assert.match(script,/profile\.width<=790&&!profile\.zoom&&measured\.dock\?\.visible/);
  assert.match(script,/item\.fontSize<9\.9/);
  assert.match(script,/item\.label\.bottom>item\.button\.bottom\+1/);
  assert.match(script,/labels\.length!==5\|\|clipped\.length/);
});
