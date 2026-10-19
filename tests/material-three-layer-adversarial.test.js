import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeRecipe,resolveScene,normalizeRotation,encodeRecipe,decodeRecipe,
  respectSettingLocks,BLEND_MODES,TEXTURE_COVERAGES} from '../src/model.js';

const base=()=>normalizeRecipe({seed:'independent-material-three-layer',
  material:'linen',textureStrength:68,textureScale:31,textureRotation:359.5,
  textureCoverage:'both',textureBlend:'overlay',
  textureLayer2Enabled:true,material2:'stone',textureStrength2:52,
  textureScale2:44,textureRotation2:359.5,textureCoverage2:'stripes',
  textureBlend2:'multiply',
  textureLayer3Enabled:true,material3:'foil',textureStrength3:82,
  textureScale3:73,textureRotation3:359.5,textureCoverage3:'background',
  textureBlend3:'screen',viewZoom:.75,viewPanX:15,viewPanY:-10,
  positionX:8,positionY:-3});
const subset=x=>({
  material:x.material,strength:x.strength,scale:x.scale,
  rotation:x.rotation,coverage:x.coverage,blend:x.blend
});
const sceneLayers=recipe=>resolveScene(recipe).textureLayers.map(subset);
test('three independent surface layers contribute the exact serialized finish stack',()=>{
  const recipe=base(),layers=sceneLayers(recipe);
  assert.deepEqual(layers,[
    {material:'linen',strength:68,scale:31,rotation:359.5,coverage:'both',blend:'overlay'},
    {material:'stone',strength:52,scale:44,rotation:359.5,coverage:'stripes',blend:'multiply'},
    {material:'foil',strength:82,scale:73,rotation:359.5,coverage:'background',blend:'screen'}
  ]);
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
  for(const key of ['viewZoom','viewPanX','viewPanY','positionX','positionY'])
    assert.equal(decodeRecipe(encodeRecipe(recipe))[key],recipe[key]);
});

test('all five rotation actions preserve other keys and wrap independently in every layer',()=>{
  const recipe=base();
  for(const suffix of ['','2','3']){
    const key='textureRotation'+suffix;
    for(const [action,expected] of [
      [{delta:-90},269.5],[{delta:-1},358.5],[{set:0},0],
      [{delta:1},.5],[{delta:90},89.5]
    ]){
      const next=normalizeRecipe({...recipe,
        [key]:'set' in action?action.set:recipe[key]+action.delta});
      assert.equal(next[key],expected,key+' '+JSON.stringify(action));
      for(const other of Object.keys(recipe).filter(k=>k!==key))
        assert.deepEqual(next[other],recipe[other],key+' changed unrelated '+other);
      assert.deepEqual(sceneLayers(next).map(l=>l.rotation),
        ['', '2', '3'].map(s=>s===suffix?expected:recipe['textureRotation'+s]));
      assert.deepEqual(decodeRecipe(encodeRecipe(next)),next);
    }
    assert.equal(normalizeRotation(-.5),359.5);
  }
});

test('every coverage/blend choice is layer-local; dormant strengths and layers restore exactly',()=>{
  const recipe=base();
  for(const suffix of ['','2','3']){
    const index=suffix===''?0:Number(suffix)-1;
    for(const coverage of TEXTURE_COVERAGES)for(const blend of BLEND_MODES){
      const next=normalizeRecipe({...recipe,
        ['textureCoverage'+suffix]:coverage,['textureBlend'+suffix]:blend});
      assert.equal(sceneLayers(next)[index].coverage,coverage);
      assert.equal(sceneLayers(next)[index].blend,blend);
      assert.equal(sceneLayers(next).length,3);
      for(const other of [0,1,2].filter(i=>i!==index))
        assert.deepEqual(sceneLayers(next)[other],sceneLayers(recipe)[other]);
    }
  }
  const off2=normalizeRecipe({...recipe,textureLayer2Enabled:false});
  assert.deepEqual(sceneLayers(off2),[sceneLayers(recipe)[0],sceneLayers(recipe)[2]]);
  assert.equal(off2.textureRotation2,recipe.textureRotation2);
  assert.equal(off2.textureCoverage2,recipe.textureCoverage2);
  assert.equal(off2.textureBlend2,recipe.textureBlend2);
  assert.equal(off2.textureStrength2,recipe.textureStrength2);
  assert.equal(off2.textureScale2,recipe.textureScale2);
  const zero3=normalizeRecipe({...off2,textureStrength3:0});
  assert.deepEqual(sceneLayers(zero3),[sceneLayers(recipe)[0]]);
  assert.deepEqual(sceneLayers(normalizeRecipe({...off2,textureLayer2Enabled:true})),
    sceneLayers(recipe));
  assert.deepEqual(sceneLayers(normalizeRecipe({...zero3,textureStrength3:82,
    textureLayer2Enabled:true})),sceneLayers(recipe));
  const threeWithoutTwo=normalizeRecipe({...recipe,textureLayer2Enabled:false,
    textureLayer3Enabled:true,material3:'foil'});
  assert.deepEqual(sceneLayers(threeWithoutTwo).map(x=>x.material),['linen','foil']);
});

test('locks guard source values while other layer knobs and camera remain editable',()=>{
  const recipe=normalizeRecipe({...base(),
    lockedSettings:['material2','textureStrength2','textureScale3',
      'textureRotation3','textureCoverage','textureBlend2']});
  const attempted=respectSettingLocks(recipe,{...recipe,
    material2:'grain',textureStrength2:0,textureScale3:0,
    textureRotation3:33,textureCoverage:'background',textureBlend2:'screen',
    textureBlend:'difference',viewPanX:22,positionY:9});
  for(const key of recipe.lockedSettings)
    assert.deepEqual(attempted[key],recipe[key],'locked key '+key+' was changed');
  assert.equal(attempted.textureBlend,'difference');
  assert.equal(attempted.viewPanX,22);
  assert.equal(attempted.positionY,9);
  assert.deepEqual(decodeRecipe(encodeRecipe(attempted)),attempted);
});

test('three live material cards retain all five distinct source rotation controls',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  for(const key of ['textureRotation','textureRotation2','textureRotation3']){
    for(const delta of [-90,-1,1,90]){
      const fragment='data-rotate-target="'+key+'" data-rotate-delta="'+delta+'"';
      assert.equal(html.split(fragment).length-1,1,fragment);
    }
    const reset='data-rotate-target="'+key+'" data-rotate-set="0"';
    assert.equal(html.split(reset).length-1,1,reset);
    assert.equal(html.split('name="'+key+'"').length-1,1,key);
    assert.match(html,new RegExp('name="'+key+'"[^>]*step="0[.]1"'));
  }
  assert.match(app,/recipe\[key\]=button\.dataset\.rotateSet!==undefined/);
  assert.match(app,/changeRecipe\(recipe\)/);
  assert.match(app,/button\.disabled=isInactive\|\|locked/);
});
