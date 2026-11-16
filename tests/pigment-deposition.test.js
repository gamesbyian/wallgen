import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,encodeRecipe,decodeRecipe,LOCKABLE_SETTINGS,
  respectSettingLocks,resolveScene,PIGMENT_STYLES} from '../src/model.js';
import {pigmentCoverage,pigmentMaterialSampler,paintPigmentedFill} from '../src/pigment-deposition.js';

const base={brushRoughness:75,pigmentStyle:'dry-brush',pigmentGrainScale:35,
  pigmentEdgeBreakup:45,pigmentDirectionality:60};
const samples=Array.from({length:144},(_,i)=>[
  (i%12)*11.17-58.2,Math.floor(i/12)*17.4-92.7
]);
const average=(opts,material=0,edge=0)=>
  samples.reduce((sum,[x,y])=>sum+pigmentCoverage(x,y,1234,opts,material,edge),0)/samples.length;

test('legacy pigment slider remains inert at zero, regardless of style and material',()=>{
  const recipe=normalizeRecipe({seed:'legacy-pigment-zero'});
  assert.equal(recipe.brushRoughness,0);
  for(const style of PIGMENT_STYLES)assert.equal(
    pigmentCoverage(19.6,-30.3,17,{...recipe,pigmentStyle:style},1,1),1);
  const destination={};
  let renders=0;
  paintPigmentedFill(destination,t=>{assert.equal(t,destination);renders++;},
    null,{left:0,top:0,right:100,bottom:100},recipe,'legacy');
  assert.equal(renders,1);
});

test('pigment presets, continuous grain, direction and edge controls change coverage',()=>{
  const values=PIGMENT_STYLES.map(pigmentStyle=>average({...base,pigmentStyle}));
  assert.equal(new Set(values.map(x=>x.toFixed(5))).size,PIGMENT_STYLES.length);
  assert.ok(values.every(x=>x>0&&x<1),'every preset deposits partially transparent colour');
  assert.notEqual(average({...base,pigmentGrainScale:0}),average({...base,pigmentGrainScale:100}));
  assert.notEqual(average({...base,pigmentDirectionality:0}),average({...base,pigmentDirectionality:100}));
  assert.notEqual(average({...base,pigmentEdgeBreakup:0},0,1),
    average({...base,pigmentEdgeBreakup:100},0,1));
  assert.equal(average({...base,pigmentEdgeBreakup:0},0,1),
    average({...base,pigmentEdgeBreakup:0},0,0));
});

test('roughness strength gradually reveals substrate without affecting another object seed',()=>{
  const faint=average({...base,brushRoughness:15});
  const strong=average({...base,brushRoughness:100});
  assert.ok(faint>strong+.1,{faint,strong});
  assert.ok(average(base,-.8)>average(base,.8),'relief influences pigment uptake');
  const point=[26.7,-88.1];
  const first=pigmentCoverage(...point,999,base,.2,1);
  assert.equal(first,pigmentCoverage(...point,999,{...base},.2,1),
    'sampling is independent of image crop, paint order and rerender');
  assert.notEqual(first,pigmentCoverage(...point,123,base,.2,1),
    'separately seeded objects use independent irregularities');
  for(const [x,y] of samples)
    assert.ok(pigmentCoverage(x,y,555,base,-1,1)>=0&&
      pigmentCoverage(x,y,555,base,1,1)<=1);
});

test('pigment controls normalize, survive sharing, and respect locks',()=>{
  const invalid=normalizeRecipe({pigmentStyle:'lava',pigmentGrainScale:-300,
    pigmentEdgeBreakup:600,pigmentDirectionality:Infinity});
  assert.equal(invalid.pigmentStyle,'dry-brush');
  assert.equal(invalid.pigmentGrainScale,0);
  assert.equal(invalid.pigmentEdgeBreakup,100);
  assert.equal(invalid.pigmentDirectionality,60);
  const authored=normalizeRecipe({...base,lockedSettings:['brushRoughness','pigmentStyle',
    'pigmentGrainScale','pigmentEdgeBreakup','pigmentDirectionality']});
  assert.deepEqual(decodeRecipe(encodeRecipe(authored)),authored);
  for(const key of authored.lockedSettings)assert.ok(LOCKABLE_SETTINGS.includes(key),key);
  const changed=respectSettingLocks(authored,{...authored,pigmentStyle:'wash',brushRoughness:0,
    pigmentGrainScale:0,pigmentEdgeBreakup:0,pigmentDirectionality:0});
  for(const key of authored.lockedSettings)assert.equal(changed[key],authored[key]);
});

test('material response only samples surface layers that actually cover painted objects',()=>{
  const background=resolveScene({material:'linen',textureCoverage:'background',
    textureStrength:100,brushRoughness:60});
  const stripe=resolveScene({material:'linen',textureCoverage:'stripes',
    textureStrength:100,brushRoughness:60});
  assert.equal(pigmentMaterialSampler(background),null);
  const sampler=pigmentMaterialSampler(stripe);
  assert.equal(typeof sampler,'function');
  assert.ok(Number.isFinite(sampler(10,20)));
  assert.equal(sampler(10,20),sampler(10,20));
});

test('unsafe imported bounds degrade to the original fill instead of allocating gigabytes',()=>{
  const recipe=normalizeRecipe({...base});
  let called=0;
  const ctx={};
  paintPigmentedFill(ctx,t=>{assert.equal(t,ctx);called++;},
    null,{left:0,top:0,right:1000000,bottom:1000000},recipe,'giant');
  assert.equal(called,1);
});
