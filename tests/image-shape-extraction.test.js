import test from 'node:test';
import assert from 'node:assert/strict';
import {extractImageShapeCandidates,extractImagePathCandidates} from '../src/image-path.js';
import {normalizeCompoundRegion,cloneGeometrySnapshot} from '../src/geometry-asset.js';
import {RAINBOW_ORBITS,buildScatteredObjects} from '../src/scattered-composition.js';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';

function raster(width,height,paint){
  const data=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const pixel=paint(x,y),k=4*(y*width+x);
    data.set(pixel,k);
  }
  return {width,height,data};
}
const white=[255,255,255],dark=[12,19,26];
const donut=raster(120,120,(x,y)=>{
  const r=Math.hypot(x-60,y-60);
  return [...white,r<44&&r>19?255:0];
});
const islands=raster(160,130,(x,y)=>{
  const inside=(x>10&&x<40&&y>10&&y<60)||
    (x>80&&x<130&&y>60&&y<95);
  return [...dark,inside?255:0];
});

test('White alpha silhouette preserves empty centre and meaningful closed outer boundary',()=>{
  const shapes=extractImageShapeCandidates(donut);
  assert.equal(shapes.length,1);
  const s=shapes[0].geometry;
  assert.equal(s.components.length,1);
  assert.equal(s.components[0].holes.length,1);
  assert.ok(s.components[0].outer.length>=12);
  assert.ok(s.components[0].holes[0].length>=12);
  assert.deepEqual(normalizeCompoundRegion(s),s);
  assert.deepEqual(extractImageShapeCandidates(donut),shapes,'deterministic analysis');
});

test('Two disjoint marks are one reusable shape with two independent islands',()=>{
  const candidates=extractImageShapeCandidates(islands);
  assert.equal(candidates.length,3,'composite plus each individual component');
  assert.equal(candidates[0].geometry.components.length,2);
  assert.equal(candidates[1].geometry.components.length,1);
  assert.equal(candidates[2].geometry.components.length,1);
  assert.equal(candidates[0].kind,'shape');
});

test('Opaque dark shape on pale background extracts without requiring alpha',()=>{
  const image=raster(110,110,(x,y)=>{
    const inside=x>20&&x<86&&y>19&&y<93;
    return [...(inside?dark:white),255];
  });
  const candidates=extractImageShapeCandidates(image);
  assert.equal(candidates.length,1);
  assert.equal(candidates[0].geometry.components[0].holes.length,0);
  assert.ok(candidates[0].geometry.components[0].outer.length>=4);
});

test('Imported donut is repeated with holes in every object and no local-library lookup',()=>{
  const geometry=extractImageShapeCandidates(donut)[0].geometry;
  const snapshot=cloneGeometrySnapshot(geometry);
  const recipe=normalizeRecipe({...RAINBOW_ORBITS,seed:'donut-wallpaper',
    scatteredShapeKind:'imported',scatteredShape:snapshot});
  const scene=resolveScene(recipe);
  assert.equal(scene.objects.length,7);
  for(const item of scene.objects){
    assert.equal(item.circle,undefined);
    assert.equal(item.kind,'region');
    assert.equal(item.rings.length,2,'outer and subtractive hole');
    assert.equal(item.vertices,item.rings[0]);
    assert.ok(item.rings.every(r=>r.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))));
  }
  const restored=decodeRecipe(encodeRecipe(recipe));
  assert.deepEqual(restored,recipe);
  assert.deepEqual(resolveScene(restored).objects,scene.objects);
  const dormant=normalizeRecipe({...recipe,regionMode:'nested'});
  assert.deepEqual(dormant.scatteredShape,recipe.scatteredShape,
    'mode switch must preserve authored asset source');
  assert.equal(buildScatteredObjects({...recipe,scatteredCount:1}).objects.length,1);
});

test('Missing or invalid imported snapshots fail closed rather than requiring storage',()=>{
  const bad=normalizeRecipe({...RAINBOW_ORBITS,scatteredShapeKind:'imported',
    scatteredShape:{schema:'roygbiv.geometry-snapshot',version:1,
      geometry:{type:'compound-region',space:'asset-local',
        viewBox:[0,0,1,1],fillRule:'evenodd',
        components:[{outer:[[0,0],[1,1],[1,0],[0,1]],holes:[]}]}}});
  assert.equal(bad.scatteredShape,null);
  assert.match(buildScatteredObjects(bad).diagnostic,/Choose an imported shape/);
  const scene=resolveScene(bad);
  assert.ok(scene.objects.every(x=>x.kind==='region'),'graceful legacy fallback');
  assert.deepEqual(extractImageShapeCandidates(raster(40,40,()=>[255,255,255,255])),[],
    'blank white canvas must not create a phantom silhouette');
});

test('Existing path importer remains unmodified by shape candidate extraction',()=>{
  const outline=extractImagePathCandidates(raster(130,160,(x,y)=>{
    const inside=x>30&&x<100&&y>35&&y<125;
    return [...(inside?dark:white),255];
  }));
  assert.ok(outline.some(c=>c.kind==='contour'));
  assert.ok(outline.every(c=>c.kind!=='shape'),
    'path candidate API remains backward compatible');
});
