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
test('320px Explore keeps all guidance within the short gallery without re-extending the tray',()=>{
  const css=readFileSync('studio-themes.css','utf8');
  const narrow=css.slice(css.lastIndexOf('/* Actual 320×640 Chromium'));
  assert.match(narrow,/@media\(max-width:360px\) and \(max-height:670px\)/);
  assert.match(narrow,/body\.mobile-gallery-open \.gallery-placeholder/);
  assert.match(narrow,/gap:1px;padding:1px 5px/);
  assert.match(narrow,/flex:0 0 20px;height:20px/);
  assert.doesNotMatch(narrow,/--mobile-tray-height:/);
  assert.match(source,/Short-screen gallery empty guidance clipped/);
});
