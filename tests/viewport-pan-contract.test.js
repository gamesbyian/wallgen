import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeRecipe,decodeRecipe,encodeRecipe,resolveScene} from '../src/model.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('camera pan is distinct from canonical composition nudge in UI and application',()=>{
  const html=read('index.html'),app=read('src/app.js'),mobile=read('src/mobile-studio.js');
  for(const action of ['up','left','reset','right','down']){
    assert.equal([...html.matchAll(new RegExp('data-view-pan="'+action+'"','g'))].length,1);
    assert.equal([...html.matchAll(new RegExp('data-nudge="'+action+'"','g'))].length,1);
  }
  assert.equal([...html.matchAll(/id="viewPanStatus"/g)].length,1);
  assert.match(html,/MOVE VIEW FRAME/);
  assert.match(html,/MOVE COMPOSITION/);
  assert.match(html,/aria-label="Pan viewport in world coordinates"/);
  assert.match(app,/button\.dataset\.viewPan/);
  assert.match(app,/button\.dataset\.nudge/);
  assert.match(app,/VIEW_PAN_STEP=5/);
  assert.match(app,/NUDGE_STEP=1/);
  assert.match(mobile,/\.composition-positioner','\.viewport-positioner'/);
  assert.match(mobile,/originalGroups=\['inspect','inspect','generate'/);
  assert.match(read('viewport-pan.css'),/\.viewport-positioner \.view-pan-pad/);
});

test('pan round-trips through the same saved recipe as framing and authored artwork',()=>{
  const original=normalizeRecipe({seed:'stored-pan',structure:'paths',
    geometry:'wave',viewZoom:.65,viewPanX:20,viewPanY:-15,
    positionX:-8,positionY:11,material:'linen'});
  const restored=decodeRecipe(encodeRecipe(original));
  assert.deepEqual(original,restored);
  const reset=normalizeRecipe({...original,viewPanX:0,viewPanY:0});
  assert.equal(reset.positionX,-8);assert.equal(reset.positionY,11);
  assert.equal(reset.viewZoom,.65);
  assert.deepEqual(resolveScene(original).stripes,resolveScene(reset).stripes);
  assert.equal(normalizeRecipe({...original,viewPanX:1000}).viewPanX,50);
  assert.equal(normalizeRecipe({...original,viewPanY:-1000}).viewPanY,-50);
});

test('Fit and randomize use the dedicated camera fields while preserving original source',()=>{
  const app=read('src/app.js'),mobile=read('src/mobile-preview-tools.js');
  assert.match(app,/roygbiv-view-fit-request/);
  assert.match(app,/viewZoom:1,viewPanX:0,viewPanY:0/);
  assert.match(app,/viewZoom:current\.viewZoom,viewPanX:current\.viewPanX,viewPanY:current\.viewPanY/);
  assert.match(mobile,/roygbiv-view-fit-request/);
  assert.match(mobile,/stage\.dataset\.viewPanX/);
  assert.match(read('src/renderer.js'),/panX:scene\.viewPanX,panY:scene\.viewPanY/);
});
