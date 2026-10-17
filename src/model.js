export const DESIGN_WIDTH = 600;
export const DESIGN_HEIGHT = 1300;
export const OUTPUT_WIDTH = 3024;
export const OUTPUT_HEIGHT = 6552;
export const HUES = [0, 29, 52, 136, 212, 244, 278];
export const NAMES = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Violet'];
export const FAMILIES = ['studio', 'currents', 'fracture', 'confetti', 'deco', 'tapestry', 'signal', 'contour'];
export const GEOMETRIES = ['straight', 'wave', 'zigzag', 'jagged', 'stepped', 'arc', 'contour'];
export const MOTIFS = ['solid', 'dots', 'stars', 'dashes', 'diamonds', 'chevrons', 'hatch', 'checker'];
export const MATERIALS = ['none', 'grain', 'watercolor', 'construction', 'handmade', 'linen', 'canvas', 'denim', 'knit', 'felt', 'corduroy', 'corrugated', 'concrete', 'stucco', 'stone', 'drywall', 'wood-grain', 'vinyl-sheet', 'foil', 'glossy-paper', 'adobe'];
export const BLEND_MODES = ['normal', 'multiply', 'screen', 'overlay', 'soft-light', 'difference'];
export const LIGHTING_MOODS = ['off', 'daylight', 'golden', 'moonlight'];
export const LIGHT_DIRECTIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
export const LOCKABLE_SETTINGS = ['primesOnly','seed','family','orientation','geometry','motif','palette','outline','background','lightingMood','lightDirection','lightStrength','shadowStrength',
  'material','textureCoverage','textureStrength','textureScale','textureRotation','textureBlend',
  'textureLayer2Enabled','material2','textureCoverage2','textureStrength2','textureScale2','textureRotation2','textureBlend2',
  'textureLayer3Enabled','material3','textureCoverage3','textureStrength3','textureScale3','textureRotation3','textureBlend3',
  'textureDisplacement','patternHomogeneity','chaos','stripeWidth','spread','individuality',
  'overridePatternHomogeneity','gap','glow','position'];
export const PALETTES = ['classic', 'electric', 'pastel', 'jewel', 'muted'];
export const TEXTURE_COVERAGES = ['both', 'stripes', 'background'];
export const OUTLINES = ['none', 'hairline', 'white', 'double', 'broken', 'one-side', 'black', 'black-hairline', 'black-double', 'black-broken', 'black-one-side'];

// An immutable, portable random stream. No Math.random() inside the render pipeline.
export function hashString(input) {
  let h = 2166136261;
  for (const char of String(input)) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function rng(seed) {
  let a = hashString(seed);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (random, choices) => choices[Math.floor(random() * choices.length)];
const between = (random, min, max) => min + random() * (max - min);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const finiteRange = (value, fallback, min, max) => clamp(Number.isFinite(+value) ? +value : fallback, min, max);
export const normalizeRotation = (value, fallback = 0) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return ((Math.round(number * 10) / 10) % 360 + 360) % 360;
};
const materialChoice = (value, fallback = 'none') => value === 'courduroy' ? 'corduroy' : MATERIALS.includes(value) ? value : fallback;
const coverageChoice = (value) => TEXTURE_COVERAGES.includes(value) ? value : 'both';
const blendChoice = (value) => BLEND_MODES.includes(value) ? value : 'normal';
const AUTO_CHOICES = {
  family:FAMILIES, orientation:['vertical','horizontal','diagonal'],
  geometry:GEOMETRIES, motif:MOTIFS, palette:PALETTES,
  material:MATERIALS, outline:OUTLINES,
};

export function normalizeRecipe(input = {}) {
  const readChoice = (key, allowed) => allowed.includes(input[key]) ? input[key] : 'auto';
  const seed = String(input.seed ?? 'rainbow-001').trim().slice(0, 90) || 'rainbow-001';
  return {
    version: 1,
    seed,
    primesOnly: input.primesOnly === true || input.primesOnly === 'true',
    lockedSettings: LOCKABLE_SETTINGS.filter(key=>Array.isArray(input.lockedSettings) && input.lockedSettings.includes(key)),
    lockedResolved: Object.fromEntries(Object.entries(AUTO_CHOICES)
      .filter(([key, choices])=>Array.isArray(input.lockedSettings) &&
        input.lockedSettings.includes(key) && choices.includes(input.lockedResolved?.[key]))
      .map(([key])=>[key,input.lockedResolved[key]])),
    family: readChoice('family', FAMILIES),
    orientation: readChoice('orientation', ['vertical', 'horizontal', 'diagonal']),
    geometry: readChoice('geometry', GEOMETRIES),
    motif: readChoice('motif', MOTIFS),
    palette: readChoice('palette', PALETTES),
    material: readChoice('material', MATERIALS),
    textureCoverage: TEXTURE_COVERAGES.includes(input.textureCoverage) ? input.textureCoverage : 'both',
    outline: readChoice('outline', OUTLINES),
    background: input.background === 'white' ? 'white' : 'black',
    lightingMood: LIGHTING_MOODS.includes(input.lightingMood) ? input.lightingMood : 'off',
    lightDirection: LIGHT_DIRECTIONS.includes(input.lightDirection) ? input.lightDirection : 'top-left',
    lightStrength: finiteRange(input.lightStrength, 45, 0, 100),
    shadowStrength: finiteRange(input.shadowStrength, 28, 0, 100),
    chaos: finiteRange(input.chaos, 36, 0, 100),
    stripeWidth: finiteRange(input.stripeWidth, 52, 0, 100),
    textureDisplacement: finiteRange(input.textureDisplacement, 0, 0, 100),
    spread: finiteRange(input.spread, 56, 0, 100),
    textureStrength: finiteRange(input.textureStrength, 52, 0, 100),
    textureScale: finiteRange(input.textureScale, 50, 0, 100),
    textureRotation: normalizeRotation(input.textureRotation),
    textureBlend: blendChoice(input.textureBlend),
    textureLayer2Enabled: input.textureLayer2Enabled === true || input.textureLayer2Enabled === 'true',
    material2: materialChoice(input.material2, 'none'),
    textureStrength2: finiteRange(input.textureStrength2, 40, 0, 100),
    textureScale2: finiteRange(input.textureScale2, 50, 0, 100),
    textureRotation2: normalizeRotation(input.textureRotation2),
    textureCoverage2: coverageChoice(input.textureCoverage2),
    textureBlend2: blendChoice(input.textureBlend2),
    textureLayer3Enabled: (input.textureLayer2Enabled === true || input.textureLayer2Enabled === 'true') && (input.textureLayer3Enabled === true || input.textureLayer3Enabled === 'true'),
    material3: materialChoice(input.material3, 'none'),
    textureStrength3: finiteRange(input.textureStrength3, 30, 0, 100),
    textureScale3: finiteRange(input.textureScale3, 50, 0, 100),
    textureRotation3: normalizeRotation(input.textureRotation3),
    textureCoverage3: coverageChoice(input.textureCoverage3),
    textureBlend3: blendChoice(input.textureBlend3),
    individuality: finiteRange(input.individuality, 34, 0, 100),
    patternHomogeneity: finiteRange(input.patternHomogeneity, 100, 0, 100),
    overridePatternHomogeneity: input.overridePatternHomogeneity === true || input.overridePatternHomogeneity === 'true',
    gap: finiteRange(input.gap, 28, 0, 100),
    glow: finiteRange(input.glow, 0, 0, 100),
    positionX: finiteRange(input.positionX, 0, -30, 30),
    positionY: finiteRange(input.positionY, 0, -30, 30),
  };
}

const PROFILES = {
  studio:   { geometry: 'straight', motif: 'solid', palette: 'classic', outline: 'white', material: 'none', width: 0.9 },
  currents: { geometry: 'wave', motif: 'solid', palette: 'electric', outline: 'hairline', material: 'none', width: 0.38 },
  fracture: { geometry: 'jagged', motif: 'solid', palette: 'electric', outline: 'white', material: 'grain', width: 0.65 },
  confetti: { geometry: 'wave', motif: 'dots', palette: 'classic', outline: 'none', material: 'none', width: 0.68 },
  deco: { geometry: 'arc', motif: 'solid', palette: 'jewel', outline: 'double', material: 'none', width: 0.64 },
  tapestry: { geometry: 'wave', motif: 'chevrons', palette: 'muted', outline: 'hairline', material: 'linen', width: 0.84 },
  signal: { geometry: 'stepped', motif: 'dashes', palette: 'electric', outline: 'one-side', material: 'none', width: 0.60 },
  contour: { geometry: 'contour', motif: 'hatch', palette: 'pastel', outline: 'hairline', material: 'handmade', width: 0.5 },
};

function paletteHsl(hue, palette, r) {
  const settings = {
    classic: [92, 58], electric: [100, 62], pastel: [75, 79], jewel: [84, 39], muted: [51, 58],
  }[palette];
  const h = ((hue + between(r, -3, 3)) % 360 + 360) % 360;
  return `hsl(${h.toFixed(1)} ${settings[0]}% ${settings[1]}%)`;
}

// Turns a saved recipe into a deterministic scene specification, independent of resolution.
export function resolveScene(recipeInput) {
  const recipe = normalizeRecipe(recipeInput);
  const random = rng(recipe.seed);
  const keepAuto=(key,value)=>recipe.lockedSettings.includes(key) &&
    recipe[key]==='auto' && AUTO_CHOICES[key]?.includes(recipe.lockedResolved[key]) ? recipe.lockedResolved[key] : value;
  const family = keepAuto('family',recipe.family === 'auto' ? pick(random, FAMILIES) : recipe.family);
  const profile = PROFILES[family];
  const orientation = keepAuto('orientation',recipe.orientation === 'auto' ? pick(random, ['vertical', 'vertical', 'diagonal', 'horizontal']) : recipe.orientation);
  const geometry = keepAuto('geometry',recipe.geometry === 'auto' ? profile.geometry : recipe.geometry);
  const motif = keepAuto('motif',recipe.motif === 'auto' ? profile.motif : recipe.motif);
  const palette = keepAuto('palette',recipe.palette === 'auto' ? profile.palette : recipe.palette);
  const material = keepAuto('material',recipe.material === 'auto' ? profile.material : recipe.material);
  const outline = keepAuto('outline',recipe.outline === 'auto' ? profile.outline : recipe.outline);
  const chaos = recipe.chaos / 100;
  const individuality = recipe.individuality / 100;
  let angle = orientation === 'vertical' ? Math.PI / 2 : orientation === 'horizontal' ? 0 : (pick(random, [-1, 1]) * between(random, 0.30, 1.08));
  angle += between(random, -0.18, 0.18) * chaos;
  const span = DESIGN_WIDTH * Math.abs(Math.sin(angle)) + DESIGN_HEIGHT * Math.abs(Math.cos(angle));
  const spread = span * (0.17 + 0.53 * recipe.spread / 100);
  const center = between(random, -1, 1) * span * 0.09;
  // A shared master path keeps the seven stripes parallel at individuality=0.
  // Independent path phase, period, tilt and edge profile grow with individuality.
  const commonPhase=between(random,0,Math.PI*2);
  const commonPeriod=between(random,145,530);
  const commonEdgePhase=between(random,0,Math.PI*2);
  const commonTaper=between(random,0,0.28)*chaos;
  const weights = Array.from({length:6}, () => between(random, 1 - chaos * .46, 1 + chaos * .46));
  const sum = weights.reduce((a,b) => a+b,0);
  const positions = [-spread/2];
  for (const weight of weights) positions.push(positions.at(-1) + spread * weight / sum);
  const avg = spread / 6;
  // Stripe width and path roughness have their own fixed reference scale.
  // Changing spread changes only centre-to-centre positions, not ribbon width.
  const referenceSpread=span*(0.17+0.53*.56);
  const referenceAvg=referenceSpread/6;
  const commonDisplacement=referenceAvg*.22*(.3+.7*chaos);
  const widthFactor = (0.12 + 0.79 * recipe.stripeWidth / 100) * profile.width;
  const stripes = positions.map((position, i) => {
    const r = rng(`${recipe.seed}:stripe:${i}`);
    // Derive the reference gaps from the *weights*, not floating-point
    // differences of spread-dependent positions. Width is bit-for-bit fixed.
    const leftGap = i ? referenceSpread*weights[i-1]/sum : referenceAvg;
    const rightGap = i < 6 ? referenceSpread*weights[i]/sum : referenceAvg;
    const width = Math.min(leftGap,rightGap)*widthFactor*between(r,1-chaos*.35,1+chaos*.35);
    const individualGeometry = individuality > .25 && r() < (individuality-.25)*1.15 ? pick(r, GEOMETRIES) : geometry;
    // Motif, palette and material belong to the whole seven-stripe design.
    // Individuality is geometric only. Pattern changes are never selected here.
    const displacement = Math.min(referenceAvg * .32, width * .7 + referenceAvg * .08) * (.3 + .7*chaos);
    const phase=between(r,0,Math.PI*2);
    const period=between(r,145,530);
    return {
      name: NAMES[i], index:i, color: paletteHsl(HUES[i], palette, r), center: position + center,
      width: Math.max(width, 1.5), geometry: individualGeometry, motif,
      phase, period, displacement,
      sharedGeometry:geometry, sharedPhase:commonPhase, sharedPeriod:commonPeriod,
      sharedDisplacement:commonDisplacement, parallelMix:individuality,
      tilt:between(r,-referenceAvg*.8,referenceAvg*.8)*individuality*(.25+.75*chaos),
      edgePhase:commonEdgePhase+(phase-commonEdgePhase)*individuality,
      taper:commonTaper+(between(r,.04,.36)*(.25+.75*chaos)-commonTaper)*individuality,
      segments:10+Math.floor(r()*17),
      patternScale:between(r,.7,1.25), patternPhase:r()*120,
      jitterSeed:`${recipe.seed}-noise-${i}`,
    };
  });
  const textureLayers = [
    {material, strength:recipe.textureStrength, scale:recipe.textureScale, rotation:recipe.textureRotation,
      coverage:recipe.textureCoverage, blend:recipe.textureBlend, seed:recipe.seed+':texture:1', heightSeed:hashString(recipe.seed+':texture:1')},
    ...(recipe.textureLayer2Enabled ? [{material:recipe.material2, strength:recipe.textureStrength2, scale:recipe.textureScale2,
      rotation:recipe.textureRotation2, coverage:recipe.textureCoverage2, blend:recipe.textureBlend2,
      seed:recipe.seed+':texture:2', heightSeed:hashString(recipe.seed+':texture:2')}] : []),
    ...(recipe.textureLayer2Enabled && recipe.textureLayer3Enabled ? [{material:recipe.material3, strength:recipe.textureStrength3,
      scale:recipe.textureScale3, rotation:recipe.textureRotation3, coverage:recipe.textureCoverage3,
      blend:recipe.textureBlend3, seed:recipe.seed+':texture:3', heightSeed:hashString(recipe.seed+':texture:3')}] : []),
  ].filter(layer=>layer.material!=='none' && layer.strength>0);
  for(const layer of textureLayers){
    const radians=layer.rotation*Math.PI/180;
    layer.heightCos=Math.cos(radians);
    layer.heightSin=Math.sin(radians);
  }
  const materialSummary=textureLayers.length ? textureLayers.map(layer=>layer.material).join(' + ') : 'none';
  return {
    ...recipe, family, orientation, geometry, motif, palette, material, materialSummary, textureLayers, outline, background: recipe.background, angle, span,
    stripes, intensity: chaos, width: avg, extent: Math.hypot(DESIGN_WIDTH, DESIGN_HEIGHT) * 1.35,
    // These positions are the canonical, unnudged geometry. Pan is applied only
    // when compositing the finished stripe ink, never while solving/capping it.
    centerX: DESIGN_WIDTH / 2 + between(random, -1, 1) * DESIGN_WIDTH * 0.055,
    centerY: DESIGN_HEIGHT / 2 + between(random, -1, 1) * DESIGN_HEIGHT * 0.065,
  };
}

/** Preserve all locked controls, including seed and the two-axis position. */
export function respectSettingLocks(currentInput, nextInput) {
  const current=normalizeRecipe(currentInput);
  const next=normalizeRecipe(nextInput);
  const locked=new Set(current.lockedSettings);
  for(const key of locked) {
    if(key==='position') {next.positionX=current.positionX;next.positionY=current.positionY;}
    else next[key]=current[key];
  }
  next.lockedSettings=[...current.lockedSettings];
  next.lockedResolved={...current.lockedResolved};
  return normalizeRecipe(next);
}
export function encodeRecipe(recipe) {
  return encodeURIComponent(JSON.stringify(normalizeRecipe(recipe)));
}
export function decodeRecipe(encoded) {
  try { return normalizeRecipe(JSON.parse(decodeURIComponent(encoded))); }
  catch { return null; }
}
export function newSeed() {
  const data = new Uint32Array(2);
  crypto.getRandomValues(data);
  return Array.from(data, n => n.toString(36)).join('-');
}

/** Prime-valued random choices apply to numeric percentages and layer angles.
 * A locked non-prime value remains untouched: the lock always takes precedence.
 */
export const PRIME_PERCENTAGES = Object.freeze(Array.from({length:101},(_,i)=>i).filter(isPrime));
export const PRIME_ROTATIONS = Object.freeze(Array.from({length:360},(_,i)=>i).filter(isPrime));
export function isPrime(n) {
  if(!Number.isInteger(n)||n<2)return false;
  for(let d=2;d*d<=n;d++)if(n%d===0)return false;
  return true;
}
/** Independently randomize every unlocked control; primeOnly restricts numeric draws. */
export function randomizeAllRecipe({primesOnly=false}={}) {
  const seed=newSeed();
  const r=rng(seed+':randomize-all');
  const any=choices=>pick(r,choices);
  const percent=()=>primesOnly?any(PRIME_PERCENTAGES):Math.floor(r()*101);
  const degrees=()=>primesOnly?any(PRIME_ROTATIONS):Math.floor(r()*360);
  return normalizeRecipe({
    seed, primesOnly, family:any(FAMILIES), orientation:any(['vertical','horizontal','diagonal']),
    geometry:any(GEOMETRIES), motif:any(MOTIFS), palette:any(PALETTES),
    material:any(MATERIALS), textureCoverage:any(TEXTURE_COVERAGES), textureRotation:degrees(), textureBlend:any(BLEND_MODES),
    textureLayer2Enabled:r()>.45, material2:any(MATERIALS), textureStrength2:percent(), textureScale2:percent(),
    textureRotation2:degrees(), textureCoverage2:any(TEXTURE_COVERAGES), textureBlend2:any(BLEND_MODES),
    textureLayer3Enabled:r()>.65, material3:any(MATERIALS), textureStrength3:percent(), textureScale3:percent(),
    textureRotation3:degrees(), textureCoverage3:any(TEXTURE_COVERAGES), textureBlend3:any(BLEND_MODES),
    outline:any(OUTLINES), background:any(['black','white']),
    lightingMood:any(LIGHTING_MOODS),lightDirection:any(LIGHT_DIRECTIONS),
    lightStrength:percent(),shadowStrength:percent(),
    chaos:percent(), stripeWidth:percent(), spread:percent(),
    textureStrength:percent(), textureScale:percent(), textureDisplacement:percent(), individuality:percent(),
    patternHomogeneity:percent(), overridePatternHomogeneity:r()>.5,
    gap:percent(), glow:percent(), positionX:0, positionY:0,
  });
}
