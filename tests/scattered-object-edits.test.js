import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRecipe, encodeRecipe, decodeRecipe, resolveScene } from '../src/model.js';
import { RAINBOW_ORBITS, buildScatteredObjects } from '../src/scattered-composition.js';
import { normalizeScatteredOverrides } from '../src/scattered-object-edits.js';
import { GEOMETRY_SNAPSHOT_SCHEMA } from '../src/geometry-asset.js';

test('bounded manual transforms are canonical, sorted and reject malformed input', () => {
  assert.deepEqual(normalizeScatteredOverrides([null,{index:-1,x:0,y:0,radius:.2},
    {index:4,x:Infinity,y:0,radius:.2},{index:2,x:5,y:-2,radius:0},
    {index:1,x:.4,y:.6,radius:.22},{index:1,x:.123456789,y:.5,radius:.333333333}]), [
    {index:1,x:.123457,y:.5,radius:.333333},
    {index:2,x:1.5,y:-.5,radius:.01}
  ]);
  assert.deepEqual(normalizeScatteredOverrides({index:1,x:0,y:0,radius:.2}),[]);
});

test('the unchanged default recipe has no added serialization field', () => {
  const old=normalizeRecipe(RAINBOW_ORBITS);
  assert.equal(Object.hasOwn(old,'scatteredOverrides'),false);
  assert.deepEqual(decodeRecipe(encodeRecipe(old)),old);
});

test('moving and resizing one circle leaves every other seeded circle alone', () => {
  const base=normalizeRecipe(RAINBOW_ORBITS);
  const before=resolveScene(base).objects;
  assert.ok(before.length>=2,'the seeded preset supplies multiple objects');
  const chosen=before[0],index=Number(chosen.id.slice(7));
  const edit={index,x:.25,y:.72,radius:.12};
  const afterRecipe=normalizeRecipe({...base,scatteredOverrides:[edit]});
  const after=resolveScene(afterRecipe).objects;
  const moved=after.find(o=>o.id===chosen.id);
  assert.deepEqual(moved.circle,{cx:150,cy:936,r:72});
  assert.deepEqual(after.filter(o=>o.id!==chosen.id),before.filter(o=>o.id!==chosen.id),
    'one manual edit must never reshuffle the other circle positions or colours');
  assert.deepEqual(decodeRecipe(encodeRecipe(afterRecipe)),afterRecipe,
    'manual edits must survive saved/share/PNG recipe transport');
  const reset=normalizeRecipe({...afterRecipe,scatteredOverrides:[]});
  assert.deepEqual(resolveScene(reset).objects,before);
  assert.equal(Object.hasOwn(reset,'scatteredOverrides'),false);
});

test('imported silhouette stamps inherit individual transforms but keep compound shape painting', () => {
  const square={schema:GEOMETRY_SNAPSHOT_SCHEMA,version:1,geometry:{
    type:'compound-region',space:'asset-local',viewBox:[0,0,100,100],
    fillRule:'evenodd',components:[{outer:[[0,0],[100,0],[100,100],[0,100]],holes:[]}]
  }};
  const recipe=normalizeRecipe({...RAINBOW_ORBITS,scatteredShapeKind:'imported',
    scatteredShape:square,scatteredOverrides:[{index:0,x:.7,y:.33,radius:.17}]});
  const scene=buildScatteredObjects(recipe);
  const stamp=scene.objects.find(o=>o.id==='region-0');
  assert.ok(stamp,'first shape is present');
  assert.equal(stamp.circle,undefined,'renderer must draw compound paths, never its bounding disk');
  assert.equal(stamp.editCircle.cx,420);
  assert.equal(stamp.editCircle.cy,429);
  assert.ok(Math.abs(stamp.editCircle.r-102)<1e-9,
    'the transformed radius is stable to sub-pixel floating-point precision');
  assert.ok(stamp.rings[0].length>=4);
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
});
