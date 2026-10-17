import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const run=(...args)=>spawnSync(process.execPath,['scripts/render-headless.mjs',...args],{
  encoding:'utf8',timeout:10000,
});
test('headless CLI documents its no-UI recipe interface without needing Playwright',()=>{
  const result=run('--help');
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/--recipe/);
  assert.match(result.stdout,/--set/);
  assert.match(result.stdout,/--width/);
});
test('headless CLI rejects unrecognized flags before requiring Chromium',()=>{
  const result=run('--no-such-option');
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/Unknown option/);
});
test('headless CLI rejects invalid rendering dimensions',()=>{
  const result=run('--width','0');
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/width must be an integer/);
});
