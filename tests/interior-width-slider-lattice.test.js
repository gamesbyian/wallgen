import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeInteriorElements} from '../src/interior-elements.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

function sliderLattice(value,{min,max,step}){
  const ticks=Math.round((value-min)/step);
  const nearest=+(min+ticks*step).toFixed(8);
  return Math.max(min,Math.min(max,nearest));
}
const nativeWidth={min:.15,max:50,step:.05};

test('Interior line and band defaults are representable as exact native range positions',()=>{
  const [line,band]=normalizeInteriorElements([{type:'line'},{type:'band'}]);
  assert.equal(line.width,1.5);
  assert.equal(band.width,22);
  for(const width of [line.width,band.width,.15,.25,1,2.5,12,35,50]){
    assert.equal(sliderLattice(width,nativeWidth),width,
      'valid source width '+width+' would be silently clamped by the UI');
  }
  const legacyRange={min:.15,max:50,step:.25};
  assert.notEqual(sliderLattice(line.width,legacyRange),line.width);
  assert.notEqual(sliderLattice(band.width,legacyRange),band.width);
});

test('live Interior width control uses the same legal grid for either element type',()=>{
  const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  assert.match(source,/range\(interiorCards\['interior-placement'\],active\.type==='band'\?'Band width %':'Line width','width',\.15,50,\.05\)/);
  assert.match(source,/slider\.step=interiorSliderStep\(active\[key\],min,step\)/);
  assert.match(source,/slider\.value=active\[key\]/);
  assert.match(source,/slider\.addEventListener\('change',\(\)=>update\(key,Number\(slider\.value\)\)\)/);
});

test('changing element type never implicitly changes its stored width from browser snapping',()=>{
  const recipe=normalizeRecipe({seed:'interior-width-lattice',
    interiorElements:[
      {id:'line',type:'line',width:1.5,placement:'field',shape:'wave'},
      {id:'band',type:'band',width:22,placement:'contour',shape:'zigzag'}
    ]});
  for(const element of recipe.interiorElements)
    assert.equal(sliderLattice(element.width,nativeWidth),element.width);
  assert.deepEqual(normalizeRecipe(recipe),recipe);
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
});
