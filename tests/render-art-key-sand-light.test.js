import test from 'node:test';
import assert from 'node:assert/strict';
import {artKey,hasDirectionalSand} from '../src/render-art-key.js';
import {normalizeRecipe} from '../src/model.js';
import {readFileSync} from 'node:fs';

const base=normalizeRecipe({seed:'light-cache-evidence',family:'studio',material:'none',
  lightingMood:'off',lightDirection:'top-left',lightStrength:70,shadowStrength:50});
const adjust=(recipe,extra)=>normalizeRecipe({...recipe,...extra});
test('ordinary wallpaper lighting remains an instant cached compositor-only change',()=>{
  const before=artKey(base);
  for(const change of [
    {lightingMood:'daylight'},{lightDirection:'bottom-right'},
    {lightStrength:3},{shadowStrength:98},{stripeShadowStrength:50},
    {stripeShadowDirection:'top-right'},{positionX:12},{positionY:-8}
  ])assert.equal(artKey(adjust(base,change)),before);
  assert.equal(hasDirectionalSand(base),false);
});
test('all active sand layers invalidate source material on lighting changes',()=>{
  for(const suffix of ['', '2','3']){
    const fields=suffix?
      {['material'+suffix]:'sand-filigree',['textureLayer'+suffix+'Enabled']:true,
        ['textureStrength'+suffix]:55}:
      {material:'sand-mandala',textureStrength:65};
    const sand=adjust(base,fields),key=artKey(sand);
    assert.equal(hasDirectionalSand(sand),true);
    for(const change of [{lightingMood:'golden'},
      {lightDirection:'top-right'},{lightStrength:1},{shadowStrength:3}])
      assert.notEqual(artKey(adjust(sand,change)),key);
    assert.equal(artKey(adjust(sand,{positionX:20,positionY:-12})),key);
  }
});
test('disabled / zero-strength sand does not penalize unrelated lighting settings',()=>{
  const disabled=adjust(base,{textureLayer2Enabled:false,material2:'sand-beaded',
    textureStrength2:90});
  assert.equal(hasDirectionalSand(disabled),false);
  assert.equal(artKey(disabled),artKey(adjust(disabled,{lightDirection:'bottom-left'})));
  const empty=adjust(base,{material:'sand-filigree',textureStrength:0,
    textureLayer3Enabled:true,material3:'sand-beaded',textureStrength3:0});
  assert.equal(hasDirectionalSand(empty),false);
  assert.equal(artKey(empty),artKey(adjust(empty,{lightStrength:0})));
});
test('app and worker use the same source-ink material cache key',()=>{
  const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  assert.match(app,/import \{artKey\} from '\.\/render-art-key\.js'/);
  assert.match(app,/previewLayers\.key===key/);
  assert.match(app,/message\.key!==artKey\(current\)/);
});
