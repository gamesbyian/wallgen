import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeRecipe,encodeRecipe,decodeRecipe,respectSettingLocks} from '../src/model.js';
import {appliedDrawnPathRecipe} from '../src/draw-apply-transaction.js';

const path=[[-.5,.14],[.21,.28],[.55,.59],[1.62,.9]];
const keysUnrelated=[
  'seed','family','palette','material','material2','material3',
  'textureStrength2','textureRotation3','interiorElements','crossingMode',
  'viewZoom','viewPanX','viewPanY','positionX','positionY','orientation',
  'structure','geometry','composition','repeatSpacing','geometrySafety'
];
const fixture=()=>normalizeRecipe({
  seed:'saved-curve-in-diagonal-layout',geometry:'drawn',structure:'paths',
  orientation:'diagonal',diagonalRotation:-37,positionX:18,positionY:-12,
  viewZoom:.5,viewPanX:27,viewPanY:-19,customPath:path,
  drawnAnchors:[1],drawnCorners:[1],extendDrawnPath:true,
  material:'linen',textureLayer3Enabled:true,material3:'foil',
  textureStrength3:90,interiorElements:[{id:'decor',type:'band',
    color:'custom',customColor:'#ba1288',colorSlots:[2,5],enabled:false}]
});

test('saved-path Apply preserves every non-geometry field, including dormant orientation',()=>{
  const original=fixture();
  for(const orientation of ['auto','vertical','diagonal','horizontal']){
    const base=normalizeRecipe({...original,orientation});
    const edited=path.map(p=>p.slice());edited[1][0]+=.04;
    const next=appliedDrawnPathRecipe(base,edited,[1,2],[2],false,true);
    const modified=Object.keys(next).filter(k=>
      JSON.stringify(next[k])!==JSON.stringify(base[k]));
    assert.deepEqual(modified,['customPath','extendDrawnPath','drawnAnchors','drawnCorners'],
      orientation+' must preserve dormant source settings');
    for(const key of keysUnrelated)assert.deepEqual(next[key],base[key],key);
    assert.deepEqual(next.customPath,edited);
    assert.deepEqual(next.drawnAnchors,[1,2]);
    assert.deepEqual(next.drawnCorners,[2]);
    assert.deepEqual(decodeRecipe(encodeRecipe(next)),next);
  }
});

test('new Draw/import intentionally centres the composition without moving the camera',()=>{
  const base=fixture();
  const next=appliedDrawnPathRecipe(base,path,[2],[2],true,false);
  assert.deepEqual([next.positionX,next.positionY],[0,0]);
  assert.equal(next.orientation,'horizontal');
  assert.equal(next.geometry,'drawn');
  assert.equal(next.structure,'paths');
  assert.equal(next.extendDrawnPath,true);
  assert.deepEqual([next.viewZoom,next.viewPanX,next.viewPanY],
    [base.viewZoom,base.viewPanX,base.viewPanY]);
  for(const key of ['seed','palette','material','material3','interiorElements'])
    assert.deepEqual(next[key],base[key]);
});

test('legacy structure change still enters paths when a dormant path is applied',()=>{
  const base=normalizeRecipe({...fixture(),structure:'radial',orientation:'vertical'});
  const next=appliedDrawnPathRecipe(base,path,[],[],false,true);
  assert.equal(next.structure,'paths');
  assert.equal(next.geometry,'drawn');
  assert.equal(next.orientation,'vertical','retained author intent');
  assert.deepEqual([next.positionX,next.positionY],[18,-12]);
  assert.deepEqual([next.viewZoom,next.viewPanX,next.viewPanY],[.5,27,-19]);
});

test('recipe locks remain authoritative after a Draw transaction',()=>{
  const current=normalizeRecipe({...fixture(),lockedSettings:['geometry',
    'orientation','position','extendDrawnPath']});
  const candidate=appliedDrawnPathRecipe({...current,
    lockedSettings:[]},[[.1,.1],[.9,.9]],[1],[],false,false);
  const locked=respectSettingLocks(current,candidate);
  for(const key of ['geometry','orientation','positionX','positionY',
    'customPath','drawnAnchors','drawnCorners','extendDrawnPath'])
    assert.deepEqual(locked[key],current[key],key+' bypassed source lock');
});

test('real app Apply handler delegates to the single source transaction',()=>{
  const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  assert.match(source,/onApply:\(points,anchors=\[\],corners=\[\],extended=false,preservePosition=false\)=>\{\s*const next=appliedDrawnPathRecipe\(fromControls\(\),points,anchors,corners,\s*extended,preservePosition\);\s*changeRecipe\(next\)/);
});
