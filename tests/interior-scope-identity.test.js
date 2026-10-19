import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('selected interior element count, status and target share the existing scope line',()=>{
  const js=read('src/app.js');
  const css=read('detail-controls.css');
  assert.match(js,/const stackIdentity='Element '\+\(selectedInterior\+1\)\+' of '\+items\.length/);
  assert.match(js,/active\.enabled\?'Enabled':'Hidden'/);
  assert.match(js,/scope\.textContent=stackIdentity\+' · '\+targeting/);
  assert.match(js,/scope\.setAttribute\('aria-label',scope\.textContent\)/);
  assert.match(css,/data-element-visibility="hidden"/);
  assert.doesNotMatch(css,/linear-gradient|radial-gradient|conic-gradient/);
});
