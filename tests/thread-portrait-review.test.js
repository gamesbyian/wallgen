import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../scripts/review-thread-portrait.mjs',import.meta.url),'utf8');
test('thread portrait review is exactly two targeted screens and not a UI atlas',()=>{
  assert.match(code,/width:412,height:892/);
  assert.match(code,/width:320,height:700/);
  assert.match(code,/data-editor-tool=surface/);
  assert.match(code,/controlBottomClipped/);
  assert.match(code,/anySub44/);
  assert.doesNotMatch(code,/for\(const category of EDITOR_CATEGORIES/);
});
test('thread portrait help does not require browser or web server',()=>{
  const r=spawnSync(process.execPath,
    [new URL('../scripts/review-thread-portrait.mjs',import.meta.url).pathname,'--help'],
    {encoding:'utf8',timeout:10000});
  // Help exits before playwright usage in the executable; help is a simple CLI check.
  assert.equal(r.status,0,r.stderr);
  assert.match(r.stdout,/review-thread-portrait/);
});
