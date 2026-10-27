/**
 * Agent-facing operations. This module has no model vendor or file-system dependencies:
 * the ordinary recipe, editor taxonomy and scoped-randomizer remain authoritative.
 */
import {
  normalizeRecipe, resolveScene, LOCKABLE_SETTINGS, FAMILIES, GEOMETRIES,
  PALETTES, MATERIALS, OUTLINES, MOTIFS, COMPOSITIONS, CONSTRUCTIONS,
  CROSSING_MODES, LIGHTING_MOODS, LINE_STYLES, rng
} from './model.js';
import { STYLE_PRESETS, EDITOR_CATEGORIES, TOOL_LIST, SETTING_TOOL } from './editor-schema.js';
import { randomizeScope, scopedKeys } from './scoped-random.js';

const OPTIONAL_KEYS = [
  'textOverlays', 'photoLook', 'surfaceTreatments', 'nestedShapeContours',
  'scatteredOverrides', 'scatteredShapeOverrides', 'scatteredLayerOrder'
];
const UNWRITABLE = new Set(['version', 'lockedResolved', 'reconstructionOrigin']);
const BASE = normalizeRecipe({});
const SETTINGS = new Set([...Object.keys(BASE), ...OPTIONAL_KEYS].filter(key =>
  key !== 'seed' && key !== 'lockedSettings' && !UNWRITABLE.has(key)
));
const CATEGORIES = new Set(EDITOR_CATEGORIES.map(category => category.id));
const ENUMS = {
  family: FAMILIES, geometry: ['auto', ...GEOMETRIES],
  palette: ['auto', ...PALETTES], material: ['auto', ...MATERIALS],
  outline: ['auto', ...OUTLINES], motif: ['auto', ...MOTIFS],
  orientation: ['auto', 'vertical', 'horizontal', 'diagonal'],
  composition: COMPOSITIONS, construction: CONSTRUCTIONS,
  crossingMode: CROSSING_MODES, lightingMood: LIGHTING_MOODS,
  lineStyle: LINE_STYLES
};
const STRENGTHS = new Set(['gentle', 'moderate', 'wild']);
const MODES = new Set(['vary', 'reroll']);
const MAX_INPUT_BYTES = 128 * 1024;
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);

function boundedObject(object, label) {
  if (!object || typeof object !== 'object' || Array.isArray(object))
    throw new TypeError(label + ' must be an object');
  if (JSON.stringify(object).length > MAX_INPUT_BYTES)
    throw new RangeError(label + ' exceeds 128 KiB');
  return object;
}

function validatedSettings(settings = {}, base = BASE) {
  boundedObject(settings, 'settings');
  for (const [key, value] of Object.entries(settings)) {
    if (!SETTINGS.has(key)) throw new RangeError('Unknown or protected setting: ' + key);
    if (value === null || typeof value === 'function')
      throw new TypeError('Unsupported value for ' + key);
    // Check each setting independently so a valid edit cannot be silently lost
    // because the canonical normalizer supplied a fallback/default.
    const candidate = normalizeRecipe({ ...base, [key]: value });
    const normalized = candidate[key];
    if (normalized === undefined)
      throw new RangeError('Unsupported setting or value: ' + key);
    if (typeof value === 'number' && (!Number.isFinite(value) || normalized !== value))
      throw new RangeError('Out-of-range or non-canonical numeric value for ' + key + ': ' + value);
    if (typeof value === 'boolean' && normalized !== value)
      throw new RangeError('Unsupported boolean value for ' + key);
    if (typeof value === 'string' && normalized !== value)
      throw new RangeError('Unsupported choice for ' + key + ': ' + value);
  }
  return settings;
}

function checkedLocks(locks) {
  if (!Array.isArray(locks)) throw new TypeError('locks must be an array');
  for (const key of locks) {
    if (!LOCKABLE_SETTINGS.includes(key)) throw new RangeError('Cannot lock setting: ' + key);
  }
  return [...new Set(locks)];
}

export function describeAgentCapabilities() {
  const keys = [...SETTINGS].sort();
  const numeric = Object.fromEntries(keys.filter(key => typeof BASE[key] === 'number')
    .map(key => {
      const min = normalizeRecipe({ [key]: -1e9 })[key];
      const max = normalizeRecipe({ [key]: 1e9 })[key];
      return [key, { min, max, default: BASE[key] }];
    }));
  return {
    name: 'ROYGBIV', recipeVersion: BASE.version,
    canvas: { design: [600,1300], native: [3024,6552] },
    styles: Object.keys(STYLE_PRESETS),
    categories: EDITOR_CATEGORIES.map(({ id, label, tools }) => ({
      id, label, tools: tools.map(({ id, name, settings }) => ({ id, name, settings }))
    })),
    choices: ENUMS, numeric, otherSettings: keys.filter(key =>
      !(key in numeric) && !(key in ENUMS)),
    lockable: LOCKABLE_SETTINGS,
    notes: [
      'The agent interprets artistic language into canonical controls; no separate prompt-to-image model is run.',
      'All renders use production ROYGBIV pixels; previews are not final-resolution exports.',
      'Exact selected tool and category IDs are discoverable above.',
      'Unknown, protected or invalid primitive setting values fail explicitly.',
      'Locked settings are never changed by exploration.'
    ]
  };
}

/** All operations are pure: callers own the candidate store and commit history. */
export function composeAgentRecipe({ style = 'studio', seed = 'agent-001', settings = {}, locks = [] } = {}) {
  if (!Object.hasOwn(STYLE_PRESETS, style)) throw new RangeError('Unknown style: ' + style);
  if (typeof seed !== 'string' || seed.trim().length < 1 || seed.length > 90)
    throw new RangeError('seed must be 1–90 characters');
  const merged = { ...STYLE_PRESETS[style], family: style, seed };
  validatedSettings(settings, normalizeRecipe(merged));
  const checked = checkedLocks(locks);
  return normalizeRecipe({ ...merged, ...settings, lockedSettings: checked });
}

export function editAgentRecipe(recipeInput, { settings = {}, lock = [], unlock = [] } = {}) {
  const current = normalizeRecipe(boundedObject(recipeInput, 'recipe'));
  const unlocking = checkedLocks(unlock);
  const locking = checkedLocks(lock);
  validatedSettings(settings, current);
  const stillLocked = current.lockedSettings.filter(key => !unlocking.includes(key));
  for (const key of Object.keys(settings))
    if (stillLocked.includes(key))
      throw new RangeError(key + ' is locked. Explicitly unlock it to edit.');
  const lockedSettings = [...new Set([...stillLocked, ...locking])];
  return normalizeRecipe({ ...current, ...settings, lockedSettings });
}

export function varyAgentRecipe(recipeInput, {
  category = 'path', tool, setting, mode = 'vary',
  strength = 'moderate', seed = 'agent-variation'
} = {}) {
  const current = normalizeRecipe(boundedObject(recipeInput, 'recipe'));
  if (!MODES.has(mode) || !STRENGTHS.has(strength))
    throw new RangeError('Invalid variation mode or strength');
  if (typeof seed !== 'string' || !seed || seed.length > 90)
    throw new RangeError('Invalid variation seed');
  let scope, name;
  if (setting !== undefined) {
    if (!SETTING_TOOL[setting]) throw new RangeError('Unknown scoped setting: ' + setting);
    scope = 'setting'; name = setting;
  } else if (tool !== undefined) {
    if (!TOOL_LIST.some(item => item.id === tool))
      throw new RangeError('Unknown tool: ' + tool);
    scope = 'tool'; name = tool;
  } else {
    if (!CATEGORIES.has(category)) throw new RangeError('Unknown category: ' + category);
    scope = 'category'; name = category;
  }
  const { recipe, modified } = randomizeScope(current, { scope, name, mode, strength, seed });
  return { recipe, modified, scope, name };
}

export function exploreAgentRecipes(recipeInput, {
  count = 4, seed = 'agent-exploration', categories = ['path', 'stripes', 'colour'],
  strength = 'moderate'
} = {}) {
  if (!Number.isInteger(count) || count < 1 || count > 12)
    throw new RangeError('count must be 1–12');
  if (typeof seed !== 'string' || !seed || seed.length > 90)
    throw new RangeError('Invalid exploration seed');
  if (!Array.isArray(categories) || !categories.length ||
      categories.length > 7 || categories.some(c => !CATEGORIES.has(c)))
    throw new RangeError('categories must be a nonempty list of category IDs');
  if (!STRENGTHS.has(strength)) throw new RangeError('Unknown strength');
  const base = normalizeRecipe(boundedObject(recipeInput, 'recipe'));
  const random = rng(seed + ':agent-explore');
  return Array.from({ length: count }, (_, i) => {
    let recipe = base;
    const modified = new Set();
    const variationSeed = seed + ':' + i;
    // Changing the seed is a deliberately selected global exploration operation,
    // not a side-effect of a scoped edit, and an explicit lock always wins.
    if (!base.lockedSettings.includes('seed'))
      recipe = normalizeRecipe({ ...recipe,
        seed: variationSeed.slice(0,90) });
    for (const category of categories) {
      // A distinct deterministic substream per candidate/category.
      const result = varyAgentRecipe(recipe, { category, mode: 'vary',
        strength, seed: (variationSeed + ':' + category).slice(0,90) });
      recipe = result.recipe;
      for (const key of result.modified) modified.add(key);
    }
    return { recipe, modified: [...modified], randomSignature: random() };
  });
}

export function inspectAgentRecipe(recipeInput) {
  const recipe = normalizeRecipe(boundedObject(recipeInput, 'recipe'));
  const scene = resolveScene(recipe);
  return {
    recipeVersion: recipe.version,
    seed: recipe.seed,
    structure: scene.structure,
    geometry: scene.geometry,
    palette: scene.palette,
    numberOfStripes: scene.stripes?.length ?? 0,
    stripeNames: scene.stripes?.map(item => item.name) ?? [],
    lockedSettings: recipe.lockedSettings,
    materials: scene.textureLayers?.map(layer => layer.material) ?? [],
    hasText: Boolean(recipe.textOverlays?.length),
    hasImportedShape: Boolean(recipe.scatteredShape),
    hasInferredImageOrigin: Boolean(recipe.reconstructionOrigin),
    caveat: 'Recipe/scene inspection is structural, not a pixel-level colour, crop or aesthetic audit.'
  };
}
