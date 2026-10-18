import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe,
  STRUCTURES,RADIAL_MODES,REGION_MODES,DIVIDER_MODES} from '../src/model.js';
import {buildCompositionObjects} from '../src/composition-geometry.js';

const everyVertexIsFinite=object=>object.vertices.every(
  point=>Number.isFinite(point.x)&&Number.isFinite(point.y));

test('composition v2 normalizes each structure and its controls',()=>{
  assert.equal(normalizeRecipe({}).version,2);
  assert.deepEqual(STRUCTURES,['paths','radial','regions']);
  assert.equal(normalizeRecipe({structure:'invalid'}).structure,'paths');
  assert.equal(normalizeRecipe({regionCount:-90}).regionCount,7);
  assert.equal(normalizeRecipe({rayCount:900}).rayCount,70);
  assert.equal(normalizeRecipe({regionSides:0}).regionSides,0);
  assert.equal(normalizeRecipe({rayTwist:900}).rayTwist,180);
  for(const structure of STRUCTURES){
    const recipe=normalizeRecipe({structure,seed:'✨ test',fieldCenterX:-50,
      fieldCenterY:150,dividerColor:'white',dividerWidth:73});
    assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
    assert.equal(resolveScene(recipe).structure,structure);
  }
  assert.deepEqual(new Set(DIVIDER_MODES),new Set(['none','background','black','white']));
});

test('legacy path capabilities are preserved inside unified path groups',()=>{
  for(const composition of ['single','repeat','floating']){
    const scene=resolveScene({seed:'legacy-bundles',structure:'paths',
      composition,geometry:'loop',repeatCount:4});
    assert.equal(scene.stripes.length,7);
    assert.equal(scene.objects.length,composition==='repeat'?4:1);
    assert.ok(scene.objects.every(group=>group.kind==='path-group'&&
      group.stripes===scene.stripes&&Number.isFinite(group.offset)));
    assert.deepEqual(scene.objects.map(o=>o.offset),scene.bundleOffsets);
  }
});

test('all radial structures resolve into finite closed regions with seven palette identities',()=>{
  for(const radialMode of RADIAL_MODES)for(const rayCount of [7,14,35,70]){
    const recipe={seed:'radial/'+radialMode+'/'+rayCount,structure:'radial',
      radialMode,rayCount,rayTwist:-150,rayCoverage:37,rayCore:57,
      fieldCenterX:-32,fieldCenterY:142};
    const scene=resolveScene(recipe),again=resolveScene(recipe);
    assert.deepEqual(scene.objects,again.objects);
    assert.equal(scene.objects.length,rayCount);
    assert.ok(scene.objects.every(o=>o.kind==='region'&&o.vertices.length>=3&&
      everyVertexIsFinite(o)&&o.color===scene.stripes[o.colorIndex].color));
    assert.deepEqual(new Set(scene.objects.map(o=>o.colorIndex)),new Set([0,1,2,3,4,5,6]));
  }
});

test('region algorithms produce valid reproducible partitions with seven fixed pigments',()=>{
  for(const regionMode of REGION_MODES)for(const regionCount of [7,21,70]){
    const input={seed:'region/'+regionMode+'/'+regionCount,structure:'regions',
      regionMode,regionCount,regionJitter:86,regionSides:9};
    const a=resolveScene(input),b=resolveScene(input);
    assert.deepEqual(a.objects,b.objects);
    assert.ok(a.objects.length>=7,regionMode);
    assert.ok(a.objects.every(o=>o.kind==='region'&&o.vertices.length>=3&&
      everyVertexIsFinite(o)&&o.color===a.stripes[o.colorIndex].color),regionMode);
    assert.deepEqual(new Set(a.objects.map(o=>o.colorIndex)),new Set([0,1,2,3,4,5,6]));
  }
});

test('palette identity remains stable across shape geometry changes',()=>{
  const base={seed:'identity',structure:'regions',regionMode:'voronoi',palette:'jewel'};
  const original=resolveScene(base);
  for(const regionMode of REGION_MODES){
    const variant=resolveScene({...base,regionMode});
    assert.deepEqual(variant.stripes.map(s=>s.color),original.stripes.map(s=>s.color));
  }
  const reversed=resolveScene({...base,reverseStripes:true});
  assert.deepEqual(reversed.stripes.map(s=>s.name),[...original.stripes.map(s=>s.name)].reverse());
});

test('a recipe roundtrip does not serialize heavy resolved geometry',()=>{
  const recipe=normalizeRecipe({seed:'large',structure:'regions',regionMode:'organic',regionCount:70});
  const encoded=encodeRecipe(recipe);
  assert.equal(encoded.includes('vertices'),false);
  assert.equal(encoded.includes('objects'),false);
  assert.equal(resolveScene(decodeRecipe(encoded)).objects.length,70);
});
