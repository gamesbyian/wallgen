import test from 'node:test';
import assert from 'node:assert/strict';
import {finishDrawnPath, fairPath, normalizeDrawnPath, prepareDrawnPath, safeDrawnBandSpan, pointOnDrawnPath,
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
test('tight freehand turns shrink rainbow spread instead of inverting ribbon offsets',()=>{
  const curve=prepareDrawnPath([[.25,.12],[.23,.35],[.36,.71],[.56,.84],[.76,.65],[.77,.17]]);
  const limit=safeDrawnBandSpan(curve);
  assert.ok(limit>=44&&limit<260, 'a tight U-turn needs a capped group width');
  const crowded=resolveScene({seed:'narrow-hairpin',geometry:'drawn',spread:100,
    customPath:[[.25,.12],[.23,.35],[.36,.71],[.56,.84],[.76,.65],[.77,.17]]});
  const span=crowded.stripes.at(-1).center-crowded.stripes[0].center;
  assert.ok(span<=limit+1,'scene spread must honor the curve-safe bound');
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

test('spline fairing strongly attenuates wobble while retaining the swept shape',()=>{
  const raw=Array.from({length:220},(_,i)=>{
    const t=i/219;
    return [.09+.82*t,.15+.66*t+.013*Math.sin(i*2.4)];
  });
  const result=finishDrawnPath(raw,'smooth');
  const rawDeviation=raw.reduce((sum,p)=>sum+Math.abs(p[1]-(.15+.66*(p[0]-.09)/.82)),0)/raw.length;
  const smoothDeviation=result.reduce((sum,p)=>sum+Math.abs(p[1]-(.15+.66*(p[0]-.09)/.82)),0)/result.length;
  assert.ok(smoothDeviation<rawDeviation*.65,'finished path should markedly reduce local jitter');
  assert.ok(Math.abs(result[0][0]-raw[0][0])<.0001&&
    Math.abs(result.at(-1)[0]-raw.at(-1)[0])<.0001,'endpoints stay anchored');
});
test('out-of-frame sketch endpoints survive smoothing and recipe normalization',()=>{
  const raw=[[-.42,.14],[-.25,.20],[-.07,.36],[.18,.53],[.53,.75],[1.14,.90]];
  const finished=finishDrawnPath(raw,'smooth');
  assert.ok(finished.length>3&&finished[0][0]<0&&finished.at(-1)[0]>1);
  const recipe=normalizeRecipe({geometry:'drawn',customPath:finished,seed:'off-frame'});
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
  const prepared=prepareDrawnPath(recipe.customPath);
  assert.ok(pointOnDrawnPath(prepared,0).x < -DESIGN_WIDTH/2);
  assert.ok(pointOnDrawnPath(prepared,1).x > DESIGN_WIDTH/2);
  assert.deepEqual(finished,normalizeDrawnPath(finished));
});

test('smoothing strength keeps the old minimum and progressively removes small bends',()=>{
  const raw=Array.from({length:280},(_,i)=>{
    const t=i/279;
    return [.13+.74*t,.22+.56*t+.022*Math.sin(t*Math.PI*8)];
  });
  const old=finishDrawnPath(raw,'smooth');
  const one=finishDrawnPath(raw,'smooth',1);
  const middle=finishDrawnPath(raw,'smooth',3);
  const strong=finishDrawnPath(raw,'smooth',5);
  assert.deepEqual(one,old,'1× must reproduce existing smoothing exactly');
  const drift=points=>points.reduce((total,[x,y])=>
    total+Math.abs(y-(.22+.56*(x-.13)/.74)),0)/points.length;
  assert.ok(drift(middle)<drift(one)*.85,
    '3× should eliminate noticeable mid-frequency waviness');
  assert.ok(drift(strong)<drift(one)*.45,
    '5× should make an approximately straight gesture substantially straighter');
  for(const path of [middle,strong]){
    assert.deepEqual(path[0],one[0]);
    assert.deepEqual(path.at(-1),one.at(-1));
    assert.ok(path.length>=2&&path.length<=MAX_DRAWN_POINTS);
  }
  assert.deepEqual(finishDrawnPath(raw,'smooth',0),one);
  assert.deepEqual(finishDrawnPath(raw,'smooth',20),strong);
  assert.deepEqual(finishDrawnPath(raw,'smooth',NaN),one);
});
test('strong geometric smoothing preserves main loops and off-frame endpoints',()=>{
  const raw=[[-.4,.14],[-.1,.26],[.2,.63],[.48,.82],[.72,.7],[.77,.25],[1.22,.1]];
  for(const power of [1,2,3,4,5]){
    const result=finishDrawnPath(raw,'geometric',power);
    assert.ok(result.length>=2);
    assert.ok(result[0][0]<0&&result.at(-1)[0]>1);
    assert.ok(result.some(p=>p[1]>.68),'deliberate large curve is retained');
    assert.deepEqual(result,finishDrawnPath(raw,'geometric',power));
  }
});
