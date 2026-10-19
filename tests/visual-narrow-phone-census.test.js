import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('scripts/visual-reference-audit-agent1.mjs','utf8');
test('real mobile atlas includes minimum and 360px breakpoint in both themes',()=>{
  assert.match(source,/minimum-320x640',width:320,height:640/);
  assert.match(source,/edge-360x740',width:360,height:740/);
  assert.match(source,/minimum-320x640'.*'geometry','material','more','explore','draw'/);
  assert.match(source,/edge-360x740'.*'geometry','material','more','explore','focus'/);
  assert.match(source,/for\(const theme of \['cream','dark'\]\)/);
});
test('narrow phone preview and dock must remain horizontally within the viewport',()=>{
  assert.match(source,/if\(profile\.width<=360\)/);
  assert.match(source,/\['preview',measured\.stage\]/);
  assert.match(source,/\['dock',measured\.dock\]/);
  assert.match(source,/rect\.right>profile\.width\+1/);
  assert.match(source,/errors\.push\(\{key,error\}\)/);
});
