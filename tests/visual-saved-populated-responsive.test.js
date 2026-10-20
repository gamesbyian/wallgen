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
test('responsive Saved thumbnails derive complete artwork height from reserved gallery space',()=>{
  const css=readFileSync('studio-themes.css','utf8');
  const scoped=css.slice(css.indexOf('/* A mobile gallery loses height'));
  assert.match(scoped,/@media\\(max-width:790px\\) and \\(min-height:671px\\)/);
  assert.match(scoped,/body\\.mobile-gallery-open \\.gallery-grid \\.thumb canvas/);
  assert.ok(scoped.includes('height:clamp(46px,calc(var(--mobile-tray-height) - var(--mobile-gallery-canvas-overhead)),195px)!important'));
  assert.match(scoped,/--mobile-gallery-canvas-overhead:170px/);
  assert.match(scoped,/@media\\(max-width:340px\\) and \\(min-height:671px\\)/);
  assert.match(scoped,/--mobile-gallery-canvas-overhead:197px/);
  assert.match(scoped,/object-fit:contain/);
  assert.match(scoped,/body\\.mobile-gallery-open \\.gallery-grid \\.thumb-caption/);
  assert.doesNotMatch(scoped,/height:132px!important|height:160px!important/);
});
