import test from 'node:test';
import assert from 'node:assert/strict';
import {finishDrawnPath, normalizeDrawnPath, prepareDrawnPath, pointOnDrawnPath,
  MAX_DRAWN_POINTS} from '../src/drawn-path.js';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe,respectSettingLocks,
  DESIGN_WIDTH,DESIGN_HEIGHT} from '../src/model.js';
import {pathPosition,samplePath,ribbonEdge} from '../src/path-geometry.js';
import {embedPngMetadata,extractPngRecipe} from '../src/png-metadata.js';

const noisy=Array.from({length:250},(_,i)=>[
  .2+.6*i/249,
  .1+.8*i/249+.009*Math.sin(i*2.77)
]);
const gesture=[[.18,.1],[.18,.3],[.22,.55],[.43,.68],[.62,.57],[.63,.32],[.63,.12]];
test('smoothed strokes reduce hand jitter and preserve endpoints',()=>{
  const smooth=finishDrawnPath(noisy);
  assert.ok(smooth.length>10&&smooth.length<=MAX_DRAWN_POINTS);
  assert.ok(Math.abs(smooth[0][0]-noisy[0][0])<.0001);
  assert.ok(Math.abs(smooth.at(-1)[1]-noisy.at(-1)[1])<.025);
  assert.deepEqual(finishDrawnPath(noisy),smooth);
});
test('geometric snapping regularizes near-straight strokes and returns',()=>{
  const raw=Array.from({length:90},(_,i)=>[.12+.78*i/89,.53+.002*Math.sin(i)]);
  const snapped=finishDrawnPath(raw,'geometric');
  assert.ok(snapped.length>=2);
  assert.ok(snapped.every(p=>Math.abs(p[1]-.53)<.008));
  const hairpin=finishDrawnPath(gesture,'geometric');
  const xs=hairpin.map(p=>p[0]);
  assert.ok(hairpin.length>5);
  assert.ok(Math.max(...xs)>Math.min(...xs)+.3);
});
test('invalid, huge and tiny paths are safely rejected or bounded',()=>{
  assert.deepEqual(normalizeDrawnPath([[NaN,0],[Infinity,1]]),[]);
  assert.deepEqual(finishDrawnPath([[.1,.1],[.11,.102]]),[]);
  const huge=Array.from({length:1500},(_,i)=>[i/1499,.5+.3*Math.sin(i/50)]);
  const safe=normalizeDrawnPath(huge);
  assert.ok(safe.length>2&&safe.length<=MAX_DRAWN_POINTS);
  assert.ok(safe.every(([x,y])=>x>=0&&x<=1&&y>=0&&y<=1));
  assert.deepEqual(normalizeDrawnPath(safe),safe);
});
test('prepared path is interpolated by travelled arc length, not X coordinate',()=>{
  const path=prepareDrawnPath([[.25,.2],[.25,.7],[.75,.7]]);
  assert.ok(path.total>600);
  const first=pointOnDrawnPath(path,0),middle=pointOnDrawnPath(path,.5),end=pointOnDrawnPath(path,1);
  assert.equal(first.x,.25*DESIGN_WIDTH-DESIGN_WIDTH/2);
  assert.equal(end.y,.7*DESIGN_HEIGHT-DESIGN_HEIGHT/2);
  assert.ok(middle.y>first.y);
  assert.ok(middle.x<=end.x);
});
test('a hand-drawn path becomes seven normal-offset stripes with unchanged stroke order',()=>{
  const finished=finishDrawnPath(gesture,'smooth');
  const recipe=normalizeRecipe({seed:'doodle-test',customPath:finished,geometry:'drawn',
    orientation:'horizontal',spread:20,individuality:0,chaos:0});
  const scene=resolveScene(recipe);
  assert.equal(scene.geometry,'drawn');
  assert.equal(scene.angle,0);
  assert.equal(scene.stripes.length,7);
  assert.equal(scene.centerX,DESIGN_WIDTH/2);
  assert.equal(scene.centerY,DESIGN_HEIGHT/2);
  const at=scene.stripes.map(s=>samplePath(s,0,scene.extent));
  const normal=at[0];
  const projections=at.map(p=>p.x*normal.nx+p.y*normal.ny);
  assert.ok(projections.every((v,i)=>!i||v>projections[i-1]));
  assert.ok(scene.stripes.every(s=>s.drawnPath.total>300));
  for(const stripe of scene.stripes){
    const edge=ribbonEdge(stripe,scene.extent*.1,scene.extent,1);
    assert.ok(Number.isFinite(edge.x)&&Number.isFinite(edge.y));
  }
});
test('drawn path persists through locks, URLs and seeded scene resolution',()=>{
  const saved=normalizeRecipe({geometry:'drawn',customPath:finishDrawnPath(gesture),
    lockedSettings:['geometry'],construction:'tonal'});
  assert.deepEqual(decodeRecipe(encodeRecipe(saved)),saved);
  assert.deepEqual(resolveScene(saved),resolveScene(saved));
  const changed=respectSettingLocks(saved,{geometry:'wave',customPath:[],seed:'changed'});
  assert.equal(changed.geometry,'drawn');
  assert.deepEqual(changed.customPath,saved.customPath);
  assert.equal(resolveScene({geometry:'drawn',customPath:[]}).geometry,'straight');
});
