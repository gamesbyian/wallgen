import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe,respectSettingLocks} from '../src/model.js';
import {GEOMETRY_SNAPSHOT_SCHEMA} from '../src/geometry-asset.js';
import {normalizeScatteredShapeOverrides} from '../src/scattered-shape-overrides.js';

const rect={type:'compound-region',space:'asset-local',viewBox:[0,0,100,100],
  fillRule:'evenodd',components:[{outer:[[5,5],[95,5],[95,95],[5,95]],
    holes:[[[35,35],[65,35],[65,65],[35,65]]]}]};
const triangle={type:'compound-region',space:'asset-local',viewBox:[0,0,100,100],
  fillRule:'evenodd',components:[{outer:[[50,5],[95,95],[5,95]],holes:[]}]};
const shape=geometry=>({schema:GEOMETRY_SNAPSHOT_SCHEMA,version:1,geometry});
const base={seed:'per-hue-source-proof',structure:'regions',regionMode:'scattered',
  palette:'classic',background:'black',material:'none',
  scatteredShapeKind:'imported',scatteredCount:7,scatteredOverlap:'overlap',
  scatteredSpacing:0,scatteredOverrides:Array.from({length:7},(_,index)=>({
    index,x:.18+index%3*.30,y:.15+Math.floor(index/3)*.33,radius:.085
  })),dividerColor:'none',dividerWidth:0};

test('per-hue geometry preserves independent rings/holes, IDs, palette and exact transport',()=>{
  const recipe=normalizeRecipe({...base,scatteredShapeOverrides:
    Array.from({length:7},(_,index)=>({index,shape:shape(index%2?triangle:rect)}))});
  assert.equal(recipe.scatteredShapeOverrides.length,7);
  const objects=resolveScene(recipe).objects;
  assert.equal(objects.length,7);
  assert.deepEqual(objects.map(o=>o.colorIndex),[0,1,2,3,4,5,6]);
  assert.deepEqual(objects.map(o=>o.rings?.length),[2,1,2,1,2,1,2]);
  assert.deepEqual(objects.map(o=>o.vertices.length),[4,3,4,3,4,3,4]);
  assert.ok(objects.every(o=>!o.circle&&o.editCircle));
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
  assert.deepEqual(resolveScene(decodeRecipe(encodeRecipe(recipe))).objects,objects);
});

test('missing slots never become accidental circles; shared imported shape is fallback',()=>{
  const partial=normalizeRecipe({...base,scatteredShapeOverrides:[{index:0,shape:shape(rect)}]});
  const scene=resolveScene(partial);
  assert.equal(scene.objects.length,1);
  assert.match(scene.diagnostic,/Missing 6 portable imported pigment/);
  const circled=normalizeRecipe({...partial,scatteredShapeKind:'circle'});
  assert.equal(resolveScene(circled).objects.length,7);
  assert.ok(resolveScene(circled).objects.every(o=>o.circle));
  const shared=normalizeRecipe({...partial,scatteredShape:shape(triangle)});
  assert.deepEqual(resolveScene(shared).objects.map(o=>o.rings.length),[2,1,1,1,1,1,1]);
  assert.equal(Object.hasOwn(normalizeRecipe({...base,scatteredShape:shape(rect)}),
    'scatteredShapeOverrides'),false);
});

test('malformed, duplicate, oversized and noncanonical hue override inputs are inert',()=>{
  const malformed={...rect,components:[{outer:[[0,0],[100,100],[0,100],[100,0]],holes:[]}]};
  const oversized={...rect,components:[{outer:Array.from({length:1300},(_,i)=>[
    50+40*Math.cos(2*Math.PI*i/1300),50+40*Math.sin(2*Math.PI*i/1300)
  ]),holes:[]}]};
  const inputs=[{index:0,shape:shape(rect)},{index:0,shape:shape(triangle)},
    {index:1,shape:{schema:'unknown',version:1,geometry:rect}},
    {index:2,shape:shape(malformed)},{index:3,shape:shape(oversized)},
    {index:7,shape:shape(triangle)},{index:4,shape:shape(triangle)}];
  assert.deepEqual(normalizeScatteredShapeOverrides(inputs).map(v=>v.index),[0,4]);
  assert.deepEqual(normalizeScatteredShapeOverrides(null),[]);
});

test('per-hue geometry is opt-in and can be locked without affecting legacy recipes',()=>{
  const current=normalizeRecipe({...base,lockedSettings:['scatteredShapeOverrides'],
    scatteredShapeOverrides:[{index:0,shape:shape(rect)}]});
  const desired=normalizeRecipe({...current,
    scatteredShapeOverrides:[{index:0,shape:shape(triangle)}]});
  assert.deepEqual(respectSettingLocks(current,desired).scatteredShapeOverrides,
    current.scatteredShapeOverrides);
  assert.deepEqual(normalizeRecipe(current),current);
});
