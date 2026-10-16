import test from 'node:test';
import assert from 'node:assert/strict';
import { DESIGN_WIDTH, DESIGN_HEIGHT, OUTPUT_WIDTH, OUTPUT_HEIGHT, HUES, NAMES, FAMILIES, GEOMETRIES, MOTIFS, MATERIALS, OUTLINES, normalizeRecipe, resolveScene, rng, encodeRecipe, decodeRecipe } from '../src/model.js';

test('Pixel 6 Pro export has 210% linear dimensions and unchanged aspect ratio',()=>{
  assert.equal(OUTPUT_WIDTH,1440*2.1);
  assert.equal(OUTPUT_HEIGHT,3120*2.1);
  assert.equal(OUTPUT_WIDTH/OUTPUT_HEIGHT,DESIGN_WIDTH/DESIGN_HEIGHT);
  assert.equal(OUTPUT_WIDTH*OUTPUT_HEIGHT,19813248);
});
test('ROYGBIV invariant, positive widths, strictly ascending stripe positions',()=>{
  for(const family of ['auto',...FAMILIES]){
    for(let i=0;i<100;i++){
      const scene=resolveScene({seed:`${family}-${i}`,family,chaos:100,stripeWidth:100,spread:90,individuality:100});
      assert.equal(scene.stripes.length,7);
      assert.deepEqual(scene.stripes.map(s=>s.name),NAMES);
      assert.equal(HUES.length,7);
      assert.ok(scene.stripes.every(s=>s.width>0 && typeof s.color==='string'));
      for(let j=1;j<7;j++)assert.ok(scene.stripes[j].center>scene.stripes[j-1].center);
    }
  }
});
test('same seed and settings are fully deterministic',()=>{
  const config={seed:'this-is-a-seed',family:'contour',palette:'pastel',material:'linen',orientation:'diagonal',individuality:93};
  assert.deepEqual(resolveScene(config),resolveScene(config));
  assert.deepEqual(Array.from({length:12},(_,i)=>rng(`test-${i}`)()),Array.from({length:12},(_,i)=>rng(`test-${i}`)()));
  assert.notDeepEqual(resolveScene({...config,seed:'another-seed'}).stripes,resolveScene(config).stripes);
});
test('all explicit choices override family suggestions',()=>{
  const recipe={seed:'explicit',family:'tapestry',orientation:'horizontal',geometry:'stepped',motif:'stars',palette:'electric',outline:'broken',material:'felt'};
  const scene=resolveScene(recipe);
  for(const key of ['family','orientation','geometry','motif','palette','outline','material']) assert.equal(scene[key],recipe[key]);
});
test('all families and combinations resolve without invalid styles',()=>{
  for(const family of FAMILIES)for(const geometry of GEOMETRIES)for(const motif of MOTIFS){
    const scene=resolveScene({seed:'matrix',family,geometry,motif});
    assert.ok(GEOMETRIES.includes(scene.geometry));
    assert.ok(MOTIFS.includes(scene.motif));
    assert.ok(MATERIALS.includes(scene.material));
    assert.ok(OUTLINES.includes(scene.outline));
  }
});
test('recipe URL survives Unicode, malformed data is rejected',()=>{
  const recipe=normalizeRecipe({seed:'虹🌈',material:'denim',chaos:99});
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
  assert.equal(decodeRecipe('%notaJSON'),null);
  assert.equal(decodeRecipe('null'),null);
});
test('input normalization handles invalid slider settings and future versions',()=>{
  const recipe=normalizeRecipe({seed:'',geometry:'nonsense',material:'unavailable',chaos:999,stripeWidth:-45,spread:'garbage'});
  assert.equal(recipe.geometry,'auto');assert.equal(recipe.material,'auto');
  assert.equal(recipe.chaos,100);assert.equal(recipe.stripeWidth,0);assert.equal(recipe.spread,56);
  assert.equal(recipe.seed,'rainbow-001');
});


test('backgrounds default to black and white stays in saved recipes',()=>{
  assert.equal(normalizeRecipe({}).background,'black');
  assert.equal(normalizeRecipe({background:'white'}).background,'white');
  assert.equal(resolveScene({seed:'white-test',background:'white',outline:'black'}).background,'white');
  assert.equal(resolveScene({seed:'white-test',background:'white',outline:'black'}).outline,'black');
  assert.equal(decodeRecipe(encodeRecipe({background:'white',outline:'black-double'})).background,'white');
  assert.equal(decodeRecipe(encodeRecipe({background:'white',outline:'black-double'})).outline,'black-double');
  for(const outline of OUTLINES) assert.equal(normalizeRecipe({outline}).outline,outline);
});
