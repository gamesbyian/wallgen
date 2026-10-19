import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';
import {randomizeScope} from '../src/scoped-random.js';
import {normalizeInteriorElements,newInteriorElementId,elementWave,elementApplies,elementInk,polygonStripBounds} from '../src/interior-elements.js';

test('interior stack validates malformed and excessive elements safely',()=>{
  const elements=normalizeInteriorElements(Array.from({length:20},(_,i)=>({
    id:'a',type:i%2?'band':'line',shape:'unknown',width:-12,
    frequency:Infinity,opacity:12,position:-4
  })));
  assert.equal(elements.length,8);
  assert.equal(new Set(elements.map(x=>x.id)).size,8);
  assert.ok(elements.every(x=>x.width>=.15&&x.opacity<=1&&x.position>=-.48));
  assert.ok(elements.every(x=>x.shape==='straight'&&Number.isFinite(x.frequency)));
});

test('interior IDs stay unique under hostile imports and same-tick adds',()=>{
  const originals=[
    {id:'element-2'}, {id:'keep'}, {id:'keep'},
    {id:'element-4'}, {id:'element-4'}, {id:'element-5'}
  ];
  const cleaned=normalizeInteriorElements(originals);
  const ids=cleaned.map(e=>e.id);
  assert.equal(new Set(ids).size,ids.length,
    'index-based duplicate fallback must never collide with a preexisting ID');
  assert.equal(ids[0],'element-2');
  assert.equal(ids[1],'keep');
  assert.deepEqual(normalizeInteriorElements(cleaned).map(e=>e.id),ids,
    'normalization must not keep changing already-repaired identities');
  const first=newInteriorElementId(cleaned,1234);
  const second=newInteriorElementId([...cleaned,{id:first}],1234);
  assert.equal(first,'element-1234');
  assert.equal(second,'element-1234-2');
  const restored=decodeRecipe(encodeRecipe(normalizeRecipe({interiorElements:[
    ...cleaned,{id:first},{id:second}
  ]})));
  assert.equal(new Set(restored.interiorElements.map(e=>e.id)).size,8,
    'new identities and order must survive recipe transport');
});

test('unified objects carry identical decoration specifications in all structures',()=>{
  const interiorElements=[{id:'wave-1',shape:'wave',stroke:'dotted',width:1.5,color:'white'}];
  for(const structure of ['paths','radial','regions']){
    const scene=resolveScene({structure,interiorElements,seed:'universal-decoration'});
    assert.equal(scene.interiorElements.length,1);
    assert.equal(scene.interiorElements[0].shape,'wave');
    assert.ok(scene.objects.length);
    assert.deepEqual(scene,resolveScene({structure,interiorElements,seed:'universal-decoration'}));
  }
});

test('recipes preserve element order and parameters',()=>{
  const recipe=normalizeRecipe({interiorElements:[
    {id:'first',shape:'loop',phase:90,amplitude:.3},
    {id:'second',type:'band',shape:'straight',color:'darker'}
  ]});
  assert.deepEqual(normalizeRecipe(recipe).interiorElements,recipe.interiorElements);
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)).interiorElements,recipe.interiorElements);
  assert.ok(elementWave(recipe.interiorElements[0],.13)<=1);
});

test('decorations can target selected colours and stable object identifiers',()=>{
  const [selected]=normalizeInteriorElements([{id:'scope',colorSlots:[0,2,2,7,-1],
    objectIds:['region-1'],color:'custom',customColor:'#12AB56'}]);
  assert.deepEqual(selected.colorSlots,[0,2]);
  assert.equal(selected.customColor,'#12ab56');
  assert.equal(elementInk(selected),'#12ab56');
  assert.equal(elementApplies(selected,2,'region-1'),true);
  assert.equal(elementApplies(selected,1,'region-1'),false);
  assert.equal(elementApplies(selected,2,'region-0'),false);
});

test('scoped decoration rerolls are reproducible and honour the stack lock',()=>{
  const recipe=normalizeRecipe({seed:'scope-check',
    interiorElements:[{id:'wave',shape:'wave',frequency:7,width:2}]});
  for(const name of ['interior','interior-style','interior-motion','interior-placement','interior-targets']){
    const opts={scope:'tool',name,mode:'reroll',seed:'fixed-selection'};
    const a=randomizeScope(recipe,opts),b=randomizeScope(recipe,opts);
    assert.deepEqual(a.recipe.interiorElements,b.recipe.interiorElements,name);
    assert.ok(a.modified.includes('interiorElements'),name);
    assert.deepEqual(a.recipe.stripes,undefined);
  }
  const locked=normalizeRecipe({...recipe,lockedSettings:['interiorElements']});
  const result=randomizeScope(locked,{scope:'category',name:'details',seed:'fixed-selection'});
  assert.deepEqual(result.recipe.interiorElements,locked.interiorElements);
});

test('contour placement exposes whole cycles while field frequency stays continuous',()=>{
  const [contour,field]=normalizeInteriorElements([
    {id:'closed',placement:'contour',frequency:7.7},
    {id:'field',placement:'field',frequency:7.7}
  ]);
  assert.equal(contour.frequency,8);
  assert.equal(field.frequency,7.7);
  assert.equal(normalizeInteriorElements([{placement:'contour',frequency:.1}])[0].frequency,1);
});

test('visibility strips bound concave and narrow polygons without inventing intersections',()=>{
  const wedge=[
    {x:0,y:0},{x:1000,y:-25},{x:1000,y:25}
  ];
  const center=polygonStripBounds(wedge,-2,2);
  assert.ok(center);
  assert.ok(center.left>=0&&center.right<=1000);
  assert.equal(polygonStripBounds(wedge,100,150),null);
  const bar=[
    {x:0,y:0},{x:100,y:0},{x:100,y:80},{x:70,y:80},
    {x:70,y:30},{x:30,y:30},{x:30,y:80},{x:0,y:80}
  ];
  const bottom=polygonStripBounds(bar,60,65);
  assert.deepEqual(bottom,{left:0,right:100});
  const upper=polygonStripBounds(bar,5,10);
  assert.deepEqual(upper,{left:0,right:100});
  assert.equal(polygonStripBounds([],1,3),null);
});
