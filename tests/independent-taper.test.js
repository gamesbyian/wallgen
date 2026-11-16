import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe,LOCKABLE_SETTINGS,randomizeAllRecipe} from '../src/model.js';
import {widthAt} from '../src/path-geometry.js';
import {EDITOR_CATEGORIES} from '../src/editor-schema.js';

const stripe={width:30,taper:0,edgePhase:0,phase:0,segmentStart:-100,segmentEnd:100};
const w=(startTaper,endTaper,x)=>widthAt({...stripe,startTaper,endTaper},x,100);

test('start and finish tapers affect opposite ends independently',()=>{
  assert.equal(w(0,0,-100),30);
  assert.equal(w(0,0,100),30);
  assert.ok(w(100,0,-100)<1,'start taper narrows only the first endpoint');
  assert.equal(w(100,0,100),30,'finish remains blunt');
  assert.equal(w(0,100,-100),30,'start remains blunt');
  assert.ok(w(0,100,100)<1,'finish taper narrows only the last endpoint');
  assert.equal(w(100,100,0),30,'full width survives between the taper zones');
  assert.ok(w(25,85,-85)>w(85,25,-85),'start strength determines start taper length');
  assert.ok(w(85,25,85)>w(25,85,85),'finish strength determines finish taper length');
});

test('old symmetrical values remain unchanged in recipes and raw stripe geometry',()=>{
  const legacy=normalizeRecipe({endTaper:70});
  assert.equal(legacy.startTaper,70);
  for(const x of [-100,-70,0,70,100])
    assert.equal(widthAt({...stripe,endTaper:70},x,100),w(70,70,x));
  const scene=resolveScene({geometry:'straight',endTaper:70});
  assert.ok(scene.stripes.every(s=>s.startTaper===70&&s.endTaper===70));
});

test('independent taper survives save/load, scene resolution and locks',()=>{
  const recipe=normalizeRecipe({seed:'asymmetric-ends',startTaper:20,endTaper:93,
    lockedSettings:['startTaper','endTaper']});
  const saved=decodeRecipe(encodeRecipe(recipe));
  assert.equal(saved.startTaper,20);
  assert.equal(saved.endTaper,93);
  assert.deepEqual(saved.lockedSettings,['startTaper','endTaper']);
  assert.ok(LOCKABLE_SETTINGS.includes('startTaper'));
  const scene=resolveScene(saved);
  assert.ok(scene.stripes.every(s=>s.startTaper===20&&s.endTaper===93));
  const random=randomizeAllRecipe();
  assert.ok(random.startTaper>=0&&random.startTaper<=100);
  assert.ok(random.endTaper>=0&&random.endTaper<=100);
});

test('new controls share one editor home and appear as distinct live inputs',()=>{
  const ends=EDITOR_CATEGORIES.flatMap(c=>c.tools).find(t=>t.id==='ends');
  assert.ok(ends.settings.includes('startTaper'));
  assert.ok(ends.settings.includes('endTaper'));
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  for(const setting of ['startTaper','endTaper'])
    assert.match(html,new RegExp('name="'+setting+'" data-setting="'+setting+'"'));
});

test('crossing overpass fragments preserve both original taper endpoints',()=>{
  const source={...stripe,startTaper:90,endTaper:20,segmentStart:-800,segmentEnd:800};
  const branch={...source,segmentStart:-100,segmentEnd:100,taperStart:-800,taperEnd:800};
  for(const x of [-100,-50,0,50,100])
    assert.equal(widthAt(branch,x,800),widthAt(source,x,800));
});
