import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('app and portrait gesture navigator import one identical stateful editor layout URL',()=>{
  const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  const mobile=readFileSync(new URL('../src/mobile-swipes.js',import.meta.url),'utf8');
  const spec=(source)=>[...source.matchAll(/from '([^']*editor-layout\.js[^']*)'/g)]
    .map(match=>match[1]);
  assert.deepEqual(spec(app),spec(mobile),
    'Separate URLs, including differing ?v query strings, instantiate separate editor tools maps');
  assert.equal(spec(app).length,1);
  assert.match(spec(app)[0],/single-editor1/);
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.ok(html.includes('src/app.js?v=20261024-text-overlays1'));
  // The independently cache-busted app entry may evolve without changing
  // the shared editor-layout module identity (enforced above).
  assert.match(html,/src\/mobile-swipes\.js\?v=20261023-single-editor1/);
});
