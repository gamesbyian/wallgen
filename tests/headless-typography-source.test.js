import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeRecipe} from '../src/model.js';

test('headless reference/Photo evaluator prepares pack fonts before synchronous painting',()=>{
 const headless=readFileSync(new URL('../scripts/render-headless.mjs',import.meta.url),'utf8');
 const preps=(headless.match(/await prepareTypefaces\(recipe\)/g)||[]).length;
 assert.equal(preps,2,'both ordinary and Photo proof paths preload fonts');
 assert.match(headless,/import\('\/src\/typography-fonts\.js'\)/);
 assert.match(headless,/\.ttf':'font\/ttf'/);
});
test('full-resolution typography fixture is canonical with separate packed faces',()=>{
 const sample=JSON.parse(readFileSync(new URL('./fixtures/typography-full-resolution.json',
   import.meta.url),'utf8'));
 const scene=normalizeRecipe(sample);
 assert.equal(scene.textOverlays.length,2);
 assert.equal(scene.textOverlays[0].font,'pack-bangers');
 assert.equal(scene.textOverlays[1].font,'pack-courgette');
 assert.equal(JSON.stringify(normalizeRecipe(scene)),JSON.stringify(scene));
});
