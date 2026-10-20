import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeRecipe,respectSettingLocks,resolveScene,encodeRecipe,decodeRecipe}
  from '../src/model.js';
import {drawAuthoringLockReason,drawAuthoringLockMessage,
  pathStructureLockedOutsidePaths} from '../src/path-authoring-locks.js';

const saved=[[.1,.1],[.35,.48],[.6,.77],[.9,.9]];
const example=(structure,locks)=>normalizeRecipe({structure,geometry:'wave',
  lockedSettings:locks,customPath:saved,
  viewZoom:.5,viewPanX:22,viewPanY:-11,positionX:9,positionY:-7});

test('a structure lock outside Paths blocks both Draw and image-path import',()=>{
  for(const structure of ['radial','regions']){
    const source=example(structure,['structure']);
    assert.equal(pathStructureLockedOutsidePaths(source),true);
    assert.equal(drawAuthoringLockReason(source),'structure');
    assert.match(drawAuthoringLockMessage(drawAuthoringLockReason(source)),
      /Unlock Layout structure/);
    const failed=respectSettingLocks(source,{...source,structure:'paths',
      geometry:'drawn',customPath:saved});
    assert.equal(failed.structure,structure,'lock blocks conversion to visible Paths');
    assert.equal(failed.geometry,'drawn','the old UI could silently store dormant geometry');
    assert.equal(resolveScene(failed).structure,structure);
    assert.deepEqual(decodeRecipe(encodeRecipe(source)),source);
  }
});

test('a locked Paths structure still permits drawn centreline edits',()=>{
  const current=example('paths',['structure']);
  assert.equal(pathStructureLockedOutsidePaths(current),false);
  assert.equal(drawAuthoringLockReason(current),null);
  assert.equal(drawAuthoringLockReason({...current,geometry:'drawn'}),null);
  assert.equal(drawAuthoringLockReason({...current,lockedSettings:['geometry']}),'geometry');
  assert.equal(drawAuthoringLockReason({...current,lockedSettings:['structure','geometry']}),'geometry');
  assert.equal(drawAuthoringLockReason(example('regions',[])),null);
  assert.equal(drawAuthoringLockReason(example('radial',[])),null);
});

test('legacy imports with locked non-Paths structure stay intact and reversible',()=>{
  const existing=normalizeRecipe({...example('regions',['structure']),
    geometry:'drawn',drawnAnchors:[1,2],drawnCorners:[2],
    extendDrawnPath:true,interiorElements:[{id:'stable',type:'band',
      shape:'wave',colorSlots:[0,4],enabled:false}]});
  assert.equal(drawAuthoringLockReason(existing),'structure');
  assert.deepEqual(normalizeRecipe(existing),existing);
  const unlocked=normalizeRecipe({...existing,lockedSettings:[]});
  assert.equal(drawAuthoringLockReason(unlocked),null);
  const intoPaths=normalizeRecipe({...unlocked,structure:'paths'});
  assert.equal(drawAuthoringLockReason(intoPaths),null);
  assert.deepEqual(intoPaths.customPath,existing.customPath);
  assert.deepEqual(intoPaths.drawnAnchors,existing.drawnAnchors);
  assert.deepEqual(intoPaths.drawnCorners,existing.drawnCorners);
  assert.deepEqual(decodeRecipe(encodeRecipe(intoPaths)),intoPaths);
});

test('real entry, lock-sync, async image Apply and detected angle all enforce the gate',()=>{
  const draw=readFileSync(new URL('../src/draw-path-ui.js',import.meta.url),'utf8');
  const image=readFileSync(new URL('../src/image-path-ui.js',import.meta.url),'utf8');
  const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  assert.match(draw,/const blocked=drawAuthoringLockReason\(getRecipe\(\)\)/);
  assert.match(draw,/button\.disabled=!!drawAuthoringLockReason\(recipe\)/);
  assert.match(image,/launch\.disabled=!!drawAuthoringLockReason\(recipe\)/);
  const gateCalls=image.match(/drawAuthoringLockReason\(getRecipe\(\)\)/g)||[];
  assert.equal(gateCalls.length,4,
    'image selection launch, async load, Choose another and actual Apply each recheck locks');
  assert.match(image,/status\.textContent=drawAuthoringLockMessage\(blocked\)/);
  assert.match(app,/pathStructureLockedOutsidePaths\(base\)/,
    'detected angle cannot claim success on a locked Radial or Regions scene');
});
