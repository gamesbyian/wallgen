import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeRecipe} from '../src/model.js';
import {describeAgentCapabilities} from '../src/agent-api.js';
import {AYA_SEMANTIC_RULES,buildAyaRecipeHandoff} from '../src/aya-recipe-reference.js';

test('AYA guide is generated from the actual canonical version, bounds, choices and controls',()=>{
  const guide=buildAyaRecipeHandoff({direction:'Seven waves of linen with soft shadows'});
  const capabilities=describeAgentCapabilities();
  for(const key of ['textureRotation','textureRotation2','textureRotation3'])
    assert.deepEqual([capabilities.numeric[key].min,capabilities.numeric[key].max,capabilities.numeric[key].cyclic],[0,359.9,true]);
  assert.match(guide,new RegExp('RecipeVersion: '+capabilities.recipeVersion));
  assert.ok(guide.includes(JSON.stringify(capabilities.numeric,null,2)));
  assert.ok(guide.includes(JSON.stringify(capabilities.choices,null,2)));
  assert.ok(guide.includes(JSON.stringify(normalizeRecipe({}),null,2)));
  for(const category of capabilities.categories)assert.ok(guide.includes(category.label));
  for(const rule of AYA_SEMANTIC_RULES){
    assert.ok(rule.controls.length>=2);
    assert.ok(guide.includes(rule.interaction));
  }
});

test('AYA guide only includes current recipe when explicitly opted in',()=>{
  const recipe=normalizeRecipe({seed:'private-existing-design',structure:'paths',geometry:'wave',stripeWidth:78});
  const first=buildAyaRecipeHandoff({direction:'A quieter version'});
  const second=buildAyaRecipeHandoff({direction:'A quieter version',currentRecipe:recipe});
  assert.ok(!first.includes('private-existing-design'));
  assert.ok(second.includes('private-existing-design'));
  assert.ok(second.includes(JSON.stringify(recipe,null,2)));
  assert.match(second,/preserving every property not targeted/);
});

test('AYA guide has bounded explicit user direction and no silent empty submission',()=>{
  assert.throws(()=>buildAyaRecipeHandoff({direction:''}),/Describe a design/);
  assert.throws(()=>buildAyaRecipeHandoff({direction:'x'.repeat(1601)}),/Describe a design/);
  const prompt='A plum-indigo textile with seven waves';
  assert.ok(buildAyaRecipeHandoff({direction:prompt}).includes(prompt));
});

test('AYA surface is inside existing Files & sharing, has one-screen viewport constraints and normal import route',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const css=readFileSync(new URL('../aya-recipe.css',import.meta.url),'utf8');
  const js=readFileSync(new URL('../src/aya-recipe-handoff.js',import.meta.url),'utf8');
  const metadata=html.indexOf('<div class="export-metadata">');
  const aya=html.indexOf('id="ayaRecipeOpen"');
  const importButton=html.indexOf('id="importRecipePNG"');
  assert.ok(metadata>=0&&aya>metadata&&importButton>aya);
  assert.match(css,/100dvh/);
  assert.match(css,/overflow:hidden/);
  assert.match(css,/min-height:44px/);
  assert.match(html,/assets\/aya-roygbiv\.svg/);
  assert.match(js,/navigator\.canShare/);
  assert.match(js,/navigator\.clipboard/);
  assert.match(js,/dialog\.showModal/);
  assert.ok(!js.includes('localStorage'));
  assert.ok(!js.includes('fetch('));
  assert.ok(!js.includes('XMLHttpRequest'));
});
