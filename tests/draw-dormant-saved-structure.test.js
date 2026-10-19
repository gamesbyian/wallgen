import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {activeSavedDrawnPath} from '../src/draw-path-ui.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const points=[[.22,.18],[.45,.48],[.78,.85]];
const base=()=>normalizeRecipe({structure:'paths',geometry:'drawn',
  seed:'dormant-saved-draw-fixture',customPath:points,
  drawnAnchors:[1],drawnCorners:[1],positionX:9,positionY:-13,
  viewZoom:.75,viewPanX:16,viewPanY:-7});

test('saved geometry is editable only while its scene actually uses Paths/Drawn',()=>{
  const scene=base();
  assert.equal(activeSavedDrawnPath(scene),true);
  const dormantRadial=normalizeRecipe({...scene,structure:'radial'});
  const dormantRegions=normalizeRecipe({...scene,structure:'regions'});
  const dormantOtherGeometry=normalizeRecipe({...scene,geometry:'wave'});
  for(const source of [dormantRadial,dormantRegions,dormantOtherGeometry]){
    assert.equal(activeSavedDrawnPath(source),false);
    assert.deepEqual(source.customPath,scene.customPath,
      'dormant geometry must be retained, not destroyed');
    assert.deepEqual(source.drawnAnchors,scene.drawnAnchors);
    assert.deepEqual(source.drawnCorners,scene.drawnCorners);
    assert.deepEqual([source.viewZoom,source.viewPanX,source.viewPanY],
      [scene.viewZoom,scene.viewPanX,scene.viewPanY]);
    assert.deepEqual(decodeRecipe(encodeRecipe(source)),source);
  }
  assert.equal(activeSavedDrawnPath(normalizeRecipe({...dormantRadial,
    structure:'paths'})),true);
  assert.equal(activeSavedDrawnPath(normalizeRecipe({...dormantRegions,
    structure:'paths'})),true);
  assert.equal(activeSavedDrawnPath(normalizeRecipe({...dormantOtherGeometry,
    geometry:'drawn'})),true);
});

test('incomplete or invalid stored path never presents an editable saved curve',()=>{
  assert.equal(activeSavedDrawnPath(null),false);
  assert.equal(activeSavedDrawnPath({structure:'paths',geometry:'drawn'}),false);
  assert.equal(activeSavedDrawnPath({structure:'paths',geometry:'drawn',
    customPath:[]}),false);
  assert.equal(activeSavedDrawnPath({structure:'paths',geometry:'drawn',
    customPath:[[.2,.2]]}),false);
  assert.equal(activeSavedDrawnPath({structure:'paths',geometry:'straight',
    customPath:points}),false);
});

test('the real Draw lifecycle uses the same applicability rule for Show and Edit',()=>{
  const code=readFileSync(new URL('../src/draw-path-ui.js',import.meta.url),'utf8');
  assert.match(code,/editButton\.hidden=!active\|\|\(!editing&&ready\.length<2&&\s*!activeSavedDrawnPath\(savedPath\)\)/);
  assert.match(code,/if\(activeSavedDrawnPath\(getRecipe\(\)\)\)\{/);
  assert.match(code,/const source=getRecipe\(\),saved=activeSavedDrawnPath\(source\);/);
  assert.match(code,/if\(ready\.length<2&&saved\)editingSavedPath=true/);
});
