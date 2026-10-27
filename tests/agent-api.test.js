import test from 'node:test';
import assert from 'node:assert/strict';
import {
  describeAgentCapabilities, composeAgentRecipe, importAgentRecipe, editAgentRecipe,
  varyAgentRecipe, exploreAgentRecipes, inspectAgentRecipe
} from '../src/agent-api.js';
import { normalizeRecipe, randomizeAllRecipe } from '../src/model.js';

test('agent capabilities come from real editor taxonomy and canonical defaults', () => {
  const description = describeAgentCapabilities();
  assert.deepEqual(description.canvas.native, [3024,6552]);
  assert.equal(description.recipeVersion, normalizeRecipe({}).version);
  assert.ok(description.categories.some(x => x.id === 'path'));
  assert.ok(description.categories.flatMap(x => x.tools).some(x =>
    x.id === 'ends' && x.settings.includes('pathLength')));
  assert.ok(description.choices.material.includes('corduroy'));
  assert.deepEqual(description.choices.background,['black','white']);
  assert.ok(description.choices.textureBlend2.includes('multiply'));
  assert.ok(description.booleans.includes('geometrySafety'));
  assert.ok(description.complexSettings.includes('customPath'));
  assert.deepEqual(description.numeric.stripeWidth, { min: 0, max: 100,
    default: normalizeRecipe({}).stripeWidth });
});

test('agents compose full canonical portable recipes, not a separate format', () => {
  const recipe = composeAgentRecipe({
    style: 'currents', seed: 'rainbow-agent',
    settings: { geometry: 'wave', palette: 'electric', stripeWidth: 52,
      material: 'foil', pathLength: 95 },
    locks: ['palette', 'material']
  });
  assert.deepEqual(recipe, normalizeRecipe(recipe));
  assert.deepEqual(recipe.lockedSettings, ['palette','material']);
  assert.equal(recipe.seed, 'rainbow-agent');
  assert.equal(recipe.pathLength, 95);
  assert.deepEqual(inspectAgentRecipe(recipe).stripeNames,
    ['Red','Orange','Yellow','Green','Blue','Indigo','Violet']);
});

test('invalid or silently normalizing primitive settings fail explicitly', () => {
  assert.throws(() => composeAgentRecipe({settings:{doesNotExist:20}}), /Unknown/);
  assert.throws(() => composeAgentRecipe({settings:{geometry:'nonsense'}}), /Unsupported choice/);
  assert.throws(() => composeAgentRecipe({settings:{stripeWidth:400}}), /Out-of-range/);
  assert.throws(() => composeAgentRecipe({settings:{stripeWidth:Infinity}}), /Out-of-range/);
  assert.throws(() => composeAgentRecipe({settings:{version:4}}), /protected/);
  assert.throws(() => composeAgentRecipe({locks:['not-a-lock']}), /Cannot lock/);
});

test('locked values survive edit/explore; explicit unlock makes a precise revision', () => {
  const original = composeAgentRecipe({
    style: 'studio', seed: 'locked-root',
    settings: { palette: 'jewel', material: 'linen' },
    locks: ['seed','palette','material']
  });
  assert.throws(() => editAgentRecipe(original,
    {settings:{palette:'electric'}}), /locked/);
  const edited = editAgentRecipe(original, {
    settings:{palette:'electric'}, unlock:['palette'], lock:['geometry']
  });
  assert.equal(edited.palette,'electric');
  assert.ok(!edited.lockedSettings.includes('palette'));
  assert.ok(edited.lockedSettings.includes('geometry'));
  assert.deepEqual(original,composeAgentRecipe({
    style: 'studio', seed: 'locked-root',
    settings: { palette: 'jewel', material: 'linen' },
    locks: ['seed','palette','material']
  }));
  const variants = exploreAgentRecipes(original, {
    count: 7, seed: 'batch-1', categories:['colour','material','path']
  });
  assert.equal(variants.length,7);
  for (const item of variants) {
    assert.equal(item.recipe.seed, original.seed);
    assert.equal(item.recipe.palette,original.palette);
    assert.equal(item.recipe.material,original.material);
    assert.deepEqual(item.recipe.lockedSettings,original.lockedSettings);
    assert.deepEqual(item.recipe,normalizeRecipe(item.recipe));
  }
});

test('exploration and scoped agent variations are reproducible from identical inputs', () => {
  const original=composeAgentRecipe({
    style:'fracture', seed:'repeatable', settings:{ chaos:65, stripeWidth:55 }
  });
  const options={ count:5, seed:'repeatable-batch',
    categories:['layout','path','stripes','colour'],strength:'wild' };
  const first=exploreAgentRecipes(original,options);
  assert.deepEqual(first,exploreAgentRecipes(original,options));
  assert.equal(new Set(first.map(x=>JSON.stringify(x.recipe))).size,5);
  const varied=varyAgentRecipe(original,{
    category:'stripes',mode:'reroll',strength:'wild',seed:'same-reroll'
  });
  assert.deepEqual(varied,varyAgentRecipe(original,{
    category:'stripes',mode:'reroll',strength:'wild',seed:'same-reroll'
  }));
  assert.equal(varied.recipe.seed,original.seed);
  assert.ok(!varied.modified.includes('seed'));
  assert.throws(() => varyAgentRecipe(original,{category:'nonexistent'}), /Unknown/);
  assert.throws(() => exploreAgentRecipes(original,{count:13}), /1–12/);
});

test('randomizeAllRecipe optionally accepts a deterministic seed without changing default behavior', () => {
  const a=randomizeAllRecipe({seed:'agent-source-seed'});
  const b=randomizeAllRecipe({seed:'agent-source-seed'});
  assert.deepEqual(a,b);
  assert.equal(a.seed,'agent-source-seed');
  assert.notDeepEqual(randomizeAllRecipe({seed:'different'}),a);
});
