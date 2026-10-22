import test from 'node:test';
import assert from 'node:assert/strict';
import {buildScatteredCircles,RAINBOW_ORBITS} from '../src/scattered-composition.js';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe,
  respectSettingLocks} from '../src/model.js';
import {validateEditorSchema} from '../src/editor-schema.js';
import {toolAppliesToScene} from '../src/editor-tool-applicability.js';

const hero=normalizeRecipe({...RAINBOW_ORBITS,seed:'rainbow-orbits-001'});
const filled=objects=>objects.map(x=>x.circle);
const cropped=o=>o.cx-o.r<0||o.cy-o.r<0||o.cx+o.r>600||o.cy+o.r>1300;
const intersects=(a,b,spacing)=>Math.hypot(a.cx-b.cx,a.cy-b.cy)<a.r+b.r+spacing-1e-6;

test('Rainbow Orbits is seven real circles with rainbow roles, varied radii and intentional edge crops',()=>{
  const scene=resolveScene(hero);
  assert.equal(scene.structure,'regions');
  assert.equal(scene.regionMode,'scattered');
  assert.equal(scene.objects.length,7);
  assert.deepEqual(scene.objects.map(o=>o.colorIndex),[0,1,2,3,4,5,6]);
  assert.ok(scene.objects.every(o=>o.kind==='region'&&o.circle&&o.vertices.length===144));
  const circles=filled(scene.objects),radii=circles.map(o=>o.r);
  assert.ok(Math.max(...radii)>Math.min(...radii)*2.2,'reference requires radically varied sizes');
  assert.ok(circles.filter(cropped).length>=2,'preset requires at least two clipped circles');
  assert.ok(circles.some(c=>!cropped(c)),'not every circle should be clipped');
  assert.ok(scene.objects.every(o=>o.color&&o.id==='region-'+o.colorIndex));
  for(let i=0;i<circles.length;i++)for(let j=i+1;j<circles.length;j++)
    assert.ok(!intersects(circles[i],circles[j],hero.scatteredSpacing*.65),
      'separate preset contains overlapping circles '+i+'/'+j);
});

test('Same seed and geometry settings reproduce object size/position across camera and palette changes',()=>{
  const orig=resolveScene(hero).objects.map(o=>o.circle);
  const variants=[
    {...hero,viewZoom:.5,viewPanX:25,viewPanY:-17},
    {...hero,positionX:30,positionY:-30,material:'linen'},
    {...hero,palette:'arctic',background:'white',seed:hero.seed}
  ];
  for(const variant of variants)
    assert.deepEqual(resolveScene(variant).objects.map(o=>o.circle),orig);
  assert.notDeepEqual(resolveScene({...hero,seed:'another-seed'}).objects.map(o=>o.circle),orig);
  assert.deepEqual(buildScatteredCircles(hero),buildScatteredCircles(hero));
});

test('Independent object count does not modify legacy seven-step region quantization',()=>{
  for(const count of [1,2,7,11,14,45,70]){
    const recipe=normalizeRecipe({...hero,scatteredCount:count});
    assert.equal(recipe.scatteredCount,count);
    const generated=buildScatteredCircles({...recipe,scatteredOverlap:'overlap'});
    assert.equal(generated.requested,count);
    assert.equal(generated.placed,count,'overlap permits every requested object');
    assert.deepEqual(generated.objects.map(x=>x.colorIndex).sort((a,b)=>a-b),
      Array.from({length:count},(_,i)=>i%7).sort((a,b)=>a-b));
  }
  for(const regionMode of ['voronoi','organic','facets','blocks','nested']){
    const recipe=normalizeRecipe({...hero,regionMode,regionCount:11});
    assert.equal(recipe.regionCount,14,'legacy regions still round to multiples of seven');
    assert.ok(resolveScene(recipe).objects.length>0);
  }
});

test('Unsatisfiable dense separation is reported, never silently converted to overlap',()=>{
  const large=normalizeRecipe({...hero,scatteredCount:70,
    scatteredMinSize:100,scatteredMaxSize:100,scatteredSpacing:100,
    scatteredEdgeCrop:0});
  const result=buildScatteredCircles(large);
  assert.ok(result.placed<result.requested);
  assert.match(result.diagnostic,/Only \d+ of 70 circles fit/);
  const circles=filled(result.objects);
  for(let i=0;i<circles.length;i++)for(let j=i+1;j<circles.length;j++)
    assert.equal(intersects(circles[i],circles[j],large.scatteredSpacing*.65),false);
});

test('Scattered controls are canonical, individually lockable and portable in recipe snapshots',()=>{
  const input=normalizeRecipe({...hero,scatteredCount:17,scatteredMinSize:22,
    scatteredMaxSize:94,scatteredVariation:51,scatteredSpacing:87,
    scatteredEdgeCrop:13,scatteredOverlap:'overlap',
    lockedSettings:['scatteredCount','scatteredOverlap']});
  assert.deepEqual(decodeRecipe(encodeRecipe(input)),input);
  const proposed=normalizeRecipe({...input,scatteredCount:3,scatteredOverlap:'separate',
    scatteredVariation:60});
  const guarded=respectSettingLocks(input,proposed);
  assert.equal(guarded.scatteredCount,17);
  assert.equal(guarded.scatteredOverlap,'overlap');
  assert.equal(guarded.scatteredVariation,60);
  assert.equal(normalizeRecipe({...hero,scatteredCount:3.7}).scatteredCount,4);
  assert.equal(normalizeRecipe({...hero,scatteredCount:1000}).scatteredCount,70);
});

test('Region-specific scattered tools are only visible and actionable in their mode',()=>{
  for(const id of ['scattered-size','scattered-distribution','scattered-edges']){
    assert.equal(toolAppliesToScene({category:'path',id},{structure:'regions',regionMode:'scattered'}),true);
    assert.equal(toolAppliesToScene({category:'path',id},{structure:'regions',regionMode:'voronoi'}),false);
    assert.equal(toolAppliesToScene({category:'path',id},{structure:'paths',regionMode:'scattered'}),false);
  }
  assert.equal(toolAppliesToScene({category:'path',id:'region-detail'},
    {structure:'regions',regionMode:'scattered'}),false);
  assert.deepEqual(validateEditorSchema([
    'regionMode','scatteredCount','scatteredMinSize','scatteredMaxSize',
    'scatteredVariation','scatteredSpacing','scatteredEdgeCrop','scatteredOverlap'
  ]).missing,[]);
});
