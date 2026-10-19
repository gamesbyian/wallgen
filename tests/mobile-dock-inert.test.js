import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('hidden mobile Edit dock is inert but restored on exit',()=>{
  const js=readFileSync(new URL('../src/mobile-studio.js',import.meta.url),'utf8');
  assert.match(js,/dock\.setAttribute\('aria-hidden','true'\);\s*\/\/ Hidden controls must not remain keyboard-reachable\.[\s\S]*?dock\.inert=true/);
  assert.match(js,/dock\.removeAttribute\('aria-hidden'\);\s*dock\.inert=false/);
  assert.match(js,/dockExpand\.setAttribute\('aria-expanded','false'\)/);
  assert.match(js,/dismissHandle\.focus\(\{preventScroll:true\}\)/);
});
