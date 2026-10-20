import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync('scripts/visual-reference-audit-agent1.mjs','utf8');
test('empty Saved is a distinct real browser gallery screen with source-backed navigation',()=>{
  assert.match(source,/'saved-empty':'explore'/);
  for(const profile of ['minimum-320x640','edge-360x740','phone-412x892','landscape-700x412']){
    const row=source.split('\n').find(line=>line.includes("id:'"+profile+"'"));
    assert.ok(row?.includes("'saved-empty'"),profile);
  }
  assert.match(source,/await click\(page,'#mobileSaved'\)/);
  assert.match(source,/dataset\.view==='saved'/);
});
test('the complete actual Saved guidance must lie inside the gallery clip rectangle',()=>{
  assert.match(source,/evidence\.text!=='Nothing saved yet\.'/);
  assert.match(source,/evidence\.instruction\?\.includes\('tap the heart'\)/);
  assert.match(source,/evidence\.hint\.bottom>evidence\.clip\.bottom\+1/);
  assert.match(source,/evidence\.heading\.top<evidence\.clip\.top-1/);
  assert.match(source,/Saved empty-state guidance clipped or incorrect/);
});
