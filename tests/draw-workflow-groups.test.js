import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('drawing workflow groups retain all real source buttons and anchor controls',()=>{
  const html=read('index.html');
  const ids=['drawSmooth','drawGeometric','drawEditPoints','drawAgain',
    'drawApply','drawCancel','drawAddPoint','drawDeletePoint',
    'drawCornerPoint','drawResmoothPoints','drawUndoPoint',
    'drawSmoothingStrength','drawExtendPath'];
  for(const id of ids)
    assert.equal([...html.matchAll(new RegExp('id="'+id+'"','g'))].length,1,id);
  for(const group of ['draw-fit-group','draw-refine-group','draw-finish-group'])
    assert.match(html,new RegExp('class="'+group+'" role="group"'));
  assert.match(html,/class="draw-phase" aria-hidden="true"/);
  assert.match(html,/id="drawPathHint" aria-live="polite"/);
  assert.match(html,/id="drawOverlay"[^>]+hidden/);
});
test('draw phase is derived from authoritative live path state only',()=>{
  const js=read('src/draw-path-ui.js');
  assert.match(js,/const step=editing\?'anchors':/);
  assert.match(js,/ready\.length>=2\|\|showingSavedPath\?'refine':'sketch'/);
  assert.match(js,/panel\.dataset\.phase=step/);
  assert.match(js,/phase\.textContent=step==='anchors'\?'Edit points'/);
  assert.match(js,/apply\.disabled=\(editing\?editor\?\.points\.length:ready\.length\)<2/);
  assert.match(js,/onApply\(/);
});
test('three step styling is flat and does not resize the source camera',()=>{
  const css=read('draw-path.css');
  assert.match(css,/\.draw-fit-group,\.draw-refine-group,\.draw-finish-group/);
  assert.match(css,/\.draw-finish-group\{grid-column:1\/-1/);
  const addition=css.slice(css.indexOf('A compact three-step authoring tool'),css.indexOf('.draw-point-controls{width:100%'));
  assert.ok(addition.includes('.draw-path-intro'));
  assert.doesNotMatch(addition,/linear-gradient|radial-gradient|conic-gradient/);
  assert.doesNotMatch(addition,/#drawOverlay|\.wallpaper-frame|\.studio-stage/);
  assert.match(css,/background:#15141f;border:1px solid #a6729f/);
  assert.doesNotMatch(css,/background:rgba\(15,15,25,\.94\)/);
});
