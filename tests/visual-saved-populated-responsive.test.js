import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync('scripts/visual-reference-audit-agent1.mjs','utf8');
test('four native mobile viewports include real populated Saved in both themes',()=>{
  assert.match(source,/'saved-populated':'explore'/);
  for(const id of ['minimum-320x640','edge-360x740','phone-412x892','landscape-700x412']){
    const row=source.split('\n').find(line=>line.includes("id:'"+id+"'"));
    assert.ok(row?.includes("'saved-populated'"),id);
    assert.ok(row.indexOf("'saved-populated'")>row.indexOf("'saved-empty'"),id);
  }
  assert.match(source,/for\(const theme of \['cream','dark'\]\)/);
});
test('Saved cards are produced by the original heart/navigation handlers, not fixture fabrication',()=>{
  assert.match(source,/await click\(page,'#mobileFavorite'\)/);
  assert.match(source,/await click\(page,'#mobileSaved'\)/);
  assert.match(source,/dataset\.view==='saved'/);
  assert.match(source,/localStorage\.getItem\('wallgen:favorites:v1'\)/);
  assert.match(source,/Saved: '\+JSON\.stringify\(capture\)/);
});
test('Saved wallpaper and actual caption must remain wholly inside visible gallery',()=>{
  assert.match(source,/canvas\.bottom>clip\.bottom\+1/);
  assert.match(source,/caption\.bottom>clip\.bottom\+1/);
  assert.match(source,/card\.right>clip\.right\+1/);
  assert.match(source,/capture\.count!==1\|\|capture\.stored!==1/);
});
