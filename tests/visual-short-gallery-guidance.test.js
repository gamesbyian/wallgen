import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync('studio-themes.css','utf8');
const browserAudit=readFileSync('scripts/visual-reference-audit-agent1.mjs','utf8');
const short=css.slice(css.lastIndexOf('/* The 165px short-landscape gallery tray'));

test('short-screen empty states adapt inside the existing gallery tray',()=>{
  assert.match(short,/@media\(max-width:790px\) and \(max-height:670px\)/);
  assert.match(short,/body\.mobile-gallery-open \.gallery-placeholder\s*\{\s*min-height:0/);
  assert.match(short,/body\.mobile-gallery-open \.gallery-empty-ribbon\s*\{\s*flex:0 0 34px/);
  assert.match(short,/body\.mobile-gallery-open \.gallery-empty-heading\s*\{/);
  assert.match(short,/body\.mobile-gallery-open \.gallery-placeholder>span\s*\{/);
});
test('live short-screen Explore requires both guidance lines fully visible',()=>{
  assert.match(browserAudit,/profile\.width<=790&&profile\.height<=670&&state\.empty/);
  assert.match(browserAudit,/legibility\.hintBottom>legibility\.clipBottom\+1/);
  assert.match(browserAudit,/Short-screen gallery empty guidance clipped/);
});
