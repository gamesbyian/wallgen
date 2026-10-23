import { SHAPES } from './path-geometry.js';
import {normalizePhotoLook} from './photo-look.js';
import {normalizeSurfaceTreatments} from './embroidery.js';
import {normalizeCompoundRegion,GEOMETRY_SNAPSHOT_SCHEMA} from './geometry-asset.js';
import {normalizeScatteredOverrides,normalizeScatteredLayerOrder} from './scattered-object-edits.js';
import { normalizeInteriorElements } from './interior-elements.js';
import { STRUCTURES, RADIAL_MODES, REGION_MODES, DIVIDER_MODES, buildCompositionObjects } from './composition-geometry.js';
export { STRUCTURES, RADIAL_MODES, REGION_MODES, DIVIDER_MODES };
import { normalizeDrawnPathWithIndexMap, prepareDrawnPath, safeDrawnBandSpan } from './drawn-path.js';
export const DESIGN_WIDTH = 600;
export const DESIGN_HEIGHT = 1300;
export const OUTPUT_WIDTH = 3024;
export const OUTPUT_HEIGHT = 6552;
export const HUES = [0, 29, 52, 136, 212, 244, 278];
export const NAMES = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Violet'];
export const FAMILIES = ['studio', 'currents', 'fracture', 'confetti', 'deco', 'tapestry', 'signal', 'contour'];
export const GEOMETRIES = SHAPES;
export const COMPOSITIONS = ['single', 'repeat', 'floating'];
export const CONSTRUCTIONS = ['ribbon', 'stroke', 'tonal', 'woven'];
export const LINE_STYLES = ['continuous', 'dotted', 'dashed'];
export const CROSSING_MODES = ['over', 'under', 'weave'];
export const MOTIFS = ['solid', 'dots', 'stars', 'dashes', 'diamonds', 'chevrons', 'hatch', 'checker'];
export const MATERIALS = ['none', 'grain', 'watercolor', 'construction', 'handmade', 'linen', 'linen-soft', 'linen-organic', 'canvas', 'denim', 'knit', 'felt', 'corduroy', 'corrugated', 'concrete', 'stucco', 'stone', 'drywall', 'wood-grain', 'vinyl-sheet', 'foil', 'glossy-paper', 'adobe'];
export const BLEND_MODES = ['normal', 'multiply', 'screen', 'overlay', 'soft-light', 'difference'];
export const LIGHTING_MOODS = ['off', 'daylight', 'golden', 'moonlight'];
export const LIGHT_DIRECTIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
export const LOCKABLE_SETTINGS = ['seed','family','orientation','geometry','motif','palette','outline','background','lightingMood','lightDirection','lightStrength','shadowStrength','stripeShadowStrength','stripeShadowSoftness','stripeShadowDirection',
  'material','textureCoverage','textureStrength','textureScale','textureRotation','textureBlend',
  'material2','textureCoverage2','textureStrength2','textureScale2','textureRotation2','textureBlend2',
  'material3','textureCoverage3','textureStrength3','textureScale3','textureRotation3','textureBlend3',
  'textureDisplacement','patternHomogeneity','chaos','stripeWidth','spread','shapeFrequency','shapeDepth','motifSize','motifFrequency','lineStyle','individuality',
  'overridePatternHomogeneity','gap','outlineBuffer','glow','reverseStripes','diagonalRotation','mirrorHorizontal','mirrorVertical','position',
  'structure','radialMode','rayCount','rayRotation','rayTwist','rayCoverage','rayCore','fieldCenterX','fieldCenterY','regionMode','regionCount','regionJitter','regionSides','scatteredCount','scatteredMinSize','scatteredMaxSize','scatteredVariation','scatteredSpacing','scatteredEdgeCrop','scatteredOverlap','scatteredShapeKind','dividerColor','dividerWidth',
  'composition','repeatCount','repeatSpacing','construction','crossingMode','turnRadius','hairpinAngle','loopRadius','loopSweep','geometrySafety','extendDrawnPath','stepCount','chevronSharpness','loopAspect','pathLength','endTaper','tonalContrast','brushRoughness','dotSize','dotSpacing','interiorElements'];
export const PALETTES = ['classic', 'electric', 'pastel', 'jewel', 'muted', 'sunset', 'candy', 'arctic', 'earth', 'twilight', 'citrus'];
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
const canonicalZero=n=>n===0?0:n;
// JSON, URLs and PNG metadata all represent -0 as 0. Canonical numerical
// recipe state must use the same zero so file transport is truly lossless.
const finiteRange = (value, fallback, min, max) =>
  canonicalZero(clamp(Number.isFinite(+value) ? +value : fallback, min, max));
export const normalizeRotation = (value, fallback = 0) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return ((Math.round(number * 10) / 10) % 360 + 360) % 360;
};
const materialChoice = (value, fallback = 'none') => value === 'courduroy' ? 'corduroy' : MATERIALS.includes(value) ? value : fallback;
const coverageChoice = (value) => TEXTURE_COVERAGES.includes(value) ? value : 'both';
const blendChoice = (value) => BLEND_MODES.includes(value) ? value : 'normal';
// Imported sources are inert unless an explicit, validated, self-contained
// numeric geometry snapshot is present. Never resolve a local library ID in
// the deterministic renderer; malformed legacy/share data degrades safely.
function normalizeShapeSnapshot(input){
  if(!input||input.schema!==GEOMETRY_SNAPSHOT_SCHEMA||input.version!==1)return null;
  try{return {schema:GEOMETRY_SNAPSHOT_SCHEMA,version:1,
    geometry:normalizeCompoundRegion(input.geometry)};}
  catch{return null;}
}
const AUTO_CHOICES = {
  family:FAMILIES, orientation:['vertical','horizontal','diagonal'],
  geometry:GEOMETRIES.filter(x=>x!=='drawn'), motif:MOTIFS, palette:PALETTES,
  material:MATERIALS, outline:OUTLINES,
};

export function normalizeRecipe(input = {}) {
  const readChoice = (key, allowed) => allowed.includes(input[key]) ? input[key] : 'auto';
  const seed = String(input.seed ?? 'rainbow-001').trim().slice(0, 90) || 'rainbow-001';
  const drawnPath=normalizeDrawnPathWithIndexMap(input.customPath);
  // These are newly normalized snapshots, not the caller's authored arrays.
  // Signed -0 in a Drawn station otherwise survives in memory but disappears
  // from every serialized JSON/URL/PNG recipe, violating exact restoration.
  for(const point of drawnPath.points){
    point[0]=canonicalZero(point[0]);
    point[1]=canonicalZero(point[1]);
  }
  const normalizedInteriors=normalizeInteriorElements(input.interiorElements);
  const scatteredOverrides=normalizeScatteredOverrides(input.scatteredOverrides);
  const scatteredLayerOrder=normalizeScatteredLayerOrder(input.scatteredLayerOrder);
  // Interior numeric controls have the same transport invariant. Normalize
  // only signed zeros, preserving all finite authored values and geometry.
  for(const element of normalizedInteriors)
    for(const key of ['width','position','amplitude','frequency','phase','opacity'])
      element[key]=canonicalZero(element[key]);
  const mappedPathIndices=raw=>[...new Set((Array.isArray(raw)?raw:[])
    .filter(i=>Number.isInteger(i)&&i>=0)
    .map(i=>drawnPath.indexMap[i])
    .filter(i=>Number.isInteger(i)&&i>=0&&i<drawnPath.points.length))]
    .sort((a,b)=>a-b).slice(0,96);
  return {
    version: 2,
    interiorElements:normalizedInteriors,
    // Old recipes have no Photo key, leaving their saved representation and pixels intact.
    ...(input.photoLook?{photoLook:normalizePhotoLook(input.photoLook)}:{}),
    ...(Array.isArray(input.surfaceTreatments)?{surfaceTreatments:normalizeSurfaceTreatments(input.surfaceTreatments)}:{}),
    seed,
    primesOnly: input.primesOnly === true || input.primesOnly === 'true',
    lockedSettings: LOCKABLE_SETTINGS.filter(key=>Array.isArray(input.lockedSettings) && input.lockedSettings.includes(key)),
    lockedResolved: Object.fromEntries(Object.entries(AUTO_CHOICES)
      .filter(([key, choices])=>Array.isArray(input.lockedSettings) &&
        input.lockedSettings.includes(key) && choices.includes(input.lockedResolved?.[key]))
      .map(([key])=>[key,input.lockedResolved[key]])),
    family: readChoice('family', FAMILIES),
    structure: STRUCTURES.includes(input.structure) ? input.structure : 'paths',
    radialMode: RADIAL_MODES.includes(input.radialMode) ? input.radialMode : 'sunburst',
    rayCount: Math.round(finiteRange(input.rayCount, 14, 7, 70)/7)*7,
    rayRotation: finiteRange(input.rayRotation, 0, -180, 180),
    rayTwist: finiteRange(input.rayTwist, 45, -180, 180),
    rayCoverage: finiteRange(input.rayCoverage, 100, 0, 100),
    rayCore: finiteRange(input.rayCore, 0, 0, 100),
    fieldCenterX: finiteRange(input.fieldCenterX, 50, -50, 150),
    fieldCenterY: finiteRange(input.fieldCenterY, 50, -50, 150),
    regionMode: REGION_MODES.includes(input.regionMode) ? input.regionMode : 'voronoi',
    regionCount: Math.round(finiteRange(input.regionCount, 14, 7, 70)/7)*7,
    regionJitter: finiteRange(input.regionJitter, 45, 0, 100),
    regionSides: Math.round(finiteRange(input.regionSides, 0, 0, 12)),
    scatteredCount: Math.round(finiteRange(input.scatteredCount,7,1,70)),
    scatteredMinSize: finiteRange(input.scatteredMinSize,10,0,100),
    scatteredMaxSize: finiteRange(input.scatteredMaxSize,83,0,100),
    scatteredVariation: finiteRange(input.scatteredVariation,92,0,100),
    scatteredSpacing: finiteRange(input.scatteredSpacing,28,0,100),
    scatteredEdgeCrop: finiteRange(input.scatteredEdgeCrop,75,0,100),
    scatteredOverlap: ['separate','overlap'].includes(input.scatteredOverlap)?input.scatteredOverlap:'separate',
    scatteredShapeKind: ['circle','imported'].includes(input.scatteredShapeKind)?input.scatteredShapeKind:'circle',
    scatteredShape:normalizeShapeSnapshot(input.scatteredShape),
    // Preserve legacy recipe serialization exactly when no individual edits exist.
    ...(scatteredOverrides.length?{scatteredOverrides}:{}),
    ...(scatteredLayerOrder.length?{scatteredLayerOrder}:{}),
    dividerColor: DIVIDER_MODES.includes(input.dividerColor) ? input.dividerColor : 'background',
    dividerWidth: finiteRange(input.dividerWidth, 12, 0, 100),
    orientation: readChoice('orientation', ['vertical', 'horizontal', 'diagonal']),
    reverseStripes: input.reverseStripes === true || input.reverseStripes === 'true',
    // Relative degrees: 0 retains legacy seed-selected diagonal angle exactly.
    diagonalRotation: finiteRange(input.diagonalRotation, 0, -180, 180),
    mirrorHorizontal: input.mirrorHorizontal === true || input.mirrorHorizontal === 'true',
    mirrorVertical: input.mirrorVertical === true || input.mirrorVertical === 'true',
    geometry: readChoice('geometry', GEOMETRIES),
    customPath:drawnPath.points,
    extendDrawnPath:input.extendDrawnPath===true||input.extendDrawnPath==='true',
    // User-protected anchors/corners follow the original stroke station
    // through duplicate removal and legacy >96-point resampling.
    drawnAnchors:mappedPathIndices(input.drawnAnchors),
    drawnCorners:mappedPathIndices(input.drawnCorners),
    motif: readChoice('motif', MOTIFS),
    lineStyle: LINE_STYLES.includes(input.lineStyle) ? input.lineStyle : 'continuous',
    composition: COMPOSITIONS.includes(input.composition) ? input.composition : 'single',
    construction: CONSTRUCTIONS.includes(input.construction) ? input.construction : 'ribbon',
    crossingMode: CROSSING_MODES.includes(input.crossingMode)?input.crossingMode:'over',
    repeatCount: Math.round(finiteRange(input.repeatCount, 3, 2, 6)),
    repeatSpacing: finiteRange(input.repeatSpacing, 50, 0, 100),
    turnRadius: finiteRange(input.turnRadius, 50, 0, 100),
    geometrySafety: !(input.geometrySafety===false || input.geometrySafety==='false'),
    hairpinAngle: finiteRange(input.hairpinAngle, 180, 60, 180),
    loopRadius: finiteRange(input.loopRadius, 50, 0, 100),
    loopSweep: finiteRange(input.loopSweep, 360, 240, 450),
    stepCount: Math.round(finiteRange(input.stepCount, 4, 1, 16)),
    chevronSharpness: finiteRange(input.chevronSharpness, 50, 0, 100),
    loopAspect: finiteRange(input.loopAspect, 50, 0, 100),
    endTaper: finiteRange(input.endTaper, 0, 0, 100),
    pathLength: finiteRange(input.pathLength, 65, 0, 100),
    tonalContrast: finiteRange(input.tonalContrast, 50, 0, 100),
    brushRoughness: finiteRange(input.brushRoughness, 0, 0, 100),
    dotSize: finiteRange(input.dotSize, 50, 0, 100),
    dotSpacing: finiteRange(input.dotSpacing, 50, 0, 100),
    shapeFrequency: finiteRange(input.shapeFrequency, 50, 0, 100),
    motifSize: finiteRange(input.motifSize, 50, 0, 100),
    motifFrequency: finiteRange(input.motifFrequency, 50, 0, 100),
    shapeDepth: finiteRange(input.shapeDepth, 50, 0, 100),
    palette: readChoice('palette', PALETTES),
    material: readChoice('material', MATERIALS),
    textureCoverage: TEXTURE_COVERAGES.includes(input.textureCoverage) ? input.textureCoverage : 'both',
    outline: readChoice('outline', OUTLINES),
    background: input.background === 'white' ? 'white' : 'black',
    lightingMood: LIGHTING_MOODS.includes(input.lightingMood) ? input.lightingMood : 'off',
    lightDirection: LIGHT_DIRECTIONS.includes(input.lightDirection) ? input.lightDirection : 'top-left',
    lightStrength: finiteRange(input.lightStrength, 45, 0, 100),
    shadowStrength: finiteRange(input.shadowStrength, 28, 0, 100),
    // Separate opt-in silhouette shadow, independent of ambient canvas lighting.
    stripeShadowStrength: finiteRange(input.stripeShadowStrength, 0, 0, 100),
    stripeShadowSoftness: finiteRange(input.stripeShadowSoftness, 55, 0, 100),
    stripeShadowDirection: LIGHT_DIRECTIONS.includes(input.stripeShadowDirection) ? input.stripeShadowDirection : 'top-left',
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
    textureLayer3Enabled: input.textureLayer3Enabled === true || input.textureLayer3Enabled === 'true',
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
    outlineBuffer: finiteRange(input.outlineBuffer, 0, 0, 100),
    glow: finiteRange(input.glow, 0, 0, 100),
    // Camera framing is part of the artwork and therefore of every saved PNG.
    viewZoom: Math.round(finiteRange(input.viewZoom, 1, .5, 2.5)*100)/100,
    // Camera-only frame pan in percent of the original 600×1300 world.
    // Distinct from positionX/Y, which translate the finished rainbow ink.
    viewPanX: canonicalZero(Math.round(finiteRange(input.viewPanX, 0, -50, 50)*10)/10),
    viewPanY: canonicalZero(Math.round(finiteRange(input.viewPanY, 0, -50, 50)*10)/10),
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

// Every Color Story keeps the seven ordered hues, but alters the entire
// seven-colour harmony rather than simply applying one uniform saturation.
export const COLOR_STORIES = Object.freeze({
  classic: {sat:92,light:58},
  electric: {sat:100,light:62},
  pastel: {sat:75,light:79},
  jewel: {sat:84,light:39},
  muted: {sat:51,light:58},
  sunset: {sat:82,light:59,hue:[-4,-6,-7,-9,-11,-7,-5],lights:[-3,3,7,-6,-7,-7,1]},
  candy: {sat:90,light:69,hue:[-8,-9,-4,-3,-6,-5,12],lights:[3,2,5,-2,-1,0,4]},
  arctic: {sat:70,light:72,hue:[-3,-7,-4,8,-12,-9,-11],lights:[2,0,7,-1,3,-3,1]},
  earth: {sat:55,light:49,hue:[7,5,-3,-23,-28,-12,-9],lights:[3,6,8,-6,-3,-4,1]},
  twilight: {sat:77,light:49,hue:[-9,-4,-2,6,12,9,8],lights:[1,1,9,-4,-2,-1,7]},
  citrus: {sat:90,light:61,hue:[-2,-3,-9,-13,-3,-7,-5],lights:[-1,3,12,1,-3,-4,0]},
});
export function paletteHsl(hue, palette, r) {
  const story=COLOR_STORIES[palette]??COLOR_STORIES.classic;
  const i=HUES.indexOf(hue);
  const h=((hue+(story.hue?.[i]??0)+between(r,-3,3))%360+360)%360;
  const light=Math.max(10,Math.min(90,story.light+(story.lights?.[i]??0)));
  return `hsl(${h.toFixed(1)} ${story.sat}% ${light}%)`;
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
  const selectedGeometry = keepAuto('geometry',recipe.geometry === 'auto' ? profile.geometry : recipe.geometry);
  const geometry = selectedGeometry==='drawn'&&recipe.customPath.length<2?'straight':selectedGeometry;
  const drawnPath=geometry==='drawn'?prepareDrawnPath(recipe.customPath):null;
  const motif = keepAuto('motif',recipe.motif === 'auto' ? profile.motif : recipe.motif);
  const palette = keepAuto('palette',recipe.palette === 'auto' ? profile.palette : recipe.palette);
  const material = keepAuto('material',recipe.material === 'auto' ? profile.material : recipe.material);
  const outline = keepAuto('outline',recipe.outline === 'auto' ? profile.outline : recipe.outline);
  const chaos = recipe.chaos / 100;
  const repeats = recipe.composition === 'repeat' ? recipe.repeatCount : 1;
  const individuality = recipe.individuality / 100;
  let angle = orientation === 'vertical' ? Math.PI / 2 : orientation === 'horizontal' ? 0 : (pick(random, [-1, 1]) * between(random, 0.30, 1.08));
  angle += between(random, -0.18, 0.18) * chaos;
  // Hairpins are defined with upright legs in local coordinates.
  if(['hairpin','loop'].includes(geometry))angle=orientation==='horizontal'?Math.PI/2:orientation==='diagonal'?Math.PI/4:0;
  if(geometry==='loops')angle=orientation==='vertical'?Math.PI/2:orientation==='diagonal'?Math.PI/4:0;
  if(geometry==='drawn')angle=0;
  if(orientation==='diagonal'&&geometry!=='drawn')angle += recipe.diagonalRotation*Math.PI/180;
  const span = ['hairpin','loop','loops','drawn'].includes(geometry) ? DESIGN_WIDTH :
    DESIGN_WIDTH * Math.abs(Math.sin(angle)) + DESIGN_HEIGHT * Math.abs(Math.cos(angle));
  // Wider low/high ends while retaining the familiar 50% midpoint.
  const spreadFactor=value=>.10+.335*Math.pow(value/50,1.5);
  const requestedSpread=span*spreadFactor(recipe.spread)/repeats;
  // A safe circular turn needs clearance on BOTH sides: the innermost
  // offset must not turn its radius negative, and the outermost stripe must
  // still fit inside the target framing. A wide band cannot satisfy both
  // constraints if spread is allowed to consume the whole frame width.
  const loopFrameRadius=DESIGN_WIDTH*.43;
  const loopInnerClearance=28;
  const spread=recipe.geometrySafety&&geometry==='hairpin'?
    Math.min(requestedSpread,DESIGN_WIDTH*.38):
    recipe.geometrySafety&&geometry==='loop'?
      Math.min(requestedSpread,loopFrameRadius-2*loopInnerClearance):
    geometry==='drawn'&&recipe.geometrySafety?
      Math.min(requestedSpread,safeDrawnBandSpan(drawnPath)):requestedSpread;
  const center = geometry==='drawn'?0:between(random, -1, 1) * span * 0.09;
  // A shared master path keeps the seven stripes parallel at individuality=0.
  // Independent path phase, period, tilt and edge profile grow with individuality.
  const commonPhase=between(random,0,Math.PI*2);
  // Neutral midpoint preserves legacy geometry and saved designs.
  // Frequency is perceived as bends per composition: its low end should
  // be one broad gesture and its high end should reach dense, fine motion.
  const commonPeriod=1400*Math.pow(.04,recipe.shapeFrequency/100)*
    between(random,.85,1.15);
  // True zero means no centreline displacement, not a residual half-wave.
  const depthFactor=Math.pow(recipe.shapeDepth/50,1.3);
  const commonEdgePhase=between(random,0,Math.PI*2);
  const commonTaper=between(random,0,0.28)*chaos;
  const weights = Array.from({length:6}, () => between(random, 1 - chaos * .46, 1 + chaos * .46));
  const sum = weights.reduce((a,b) => a+b,0);
  const positions = [-spread/2];
  for (const weight of weights) positions.push(positions.at(-1) + spread * weight / sum);
  const avg = spread / 6;
  // Include the seed-derived group offset, not just half the band's spread.
  // Omitting this offset used to invert the violet/indigo turns even while
  // Preserve stripe coherence was enabled.
  const minimumLoopRadius=Math.max(28,-positions[0]-center+loopInnerClearance);
  const maximumLoopRadius=Math.max(minimumLoopRadius,
    loopFrameRadius-positions[6]-center);
  // Stripe width and path roughness have their own fixed reference scale.
  // Changing spread changes only centre-to-centre positions, not ribbon width.
  const referenceSpread=geometry==='drawn'?spread:span*spreadFactor(56)/repeats;
  const referenceAvg=referenceSpread/6;
  const commonDisplacement=referenceAvg*.22*(.3+.7*chaos)*depthFactor;
  // Starting styles populate explicit settings in the editor. A family must
  // not invisibly multiply the user's manually selected stripe thickness.
  const widthFactor = .12+.395*Math.pow(recipe.stripeWidth/50,1.85);
  const stripes = positions.map((position, i) => {
    const r = rng(`${recipe.seed}:stripe:${i}`);
    // Derive the reference gaps from the *weights*, not floating-point
    // differences of spread-dependent positions. Width is bit-for-bit fixed.
    const leftGap = i ? referenceSpread*weights[i-1]/sum : referenceAvg;
    const rightGap = i < 6 ? referenceSpread*weights[i]/sum : referenceAvg;
    let width = Math.min(leftGap,rightGap)*widthFactor*between(r,1-chaos*.35,1+chaos*.35);
    if(recipe.construction==='stroke')width=Math.max(.35,width*.12);
    // Individuality varies each stripe within its chosen geometry, while
    // preserving the intended shape family even at the extreme endpoint.
    const individualGeometry=geometry;
    // Motif, palette and material belong to the whole seven-stripe design.
    // Individuality is geometric only. Pattern changes are never selected here.
    const displacement = Math.min(referenceAvg * .32, width * .7 + referenceAvg * .08) * (.3 + .7*chaos)*depthFactor;
    const phase=between(r,0,Math.PI*2);
    const period=commonPeriod*between(r,.8,1.2);
    return {
      // Reverse the colour assignment, not the geometry. It keeps all seven
      // ribbon centres sorted and preserves the historic scene on default.
      name: NAMES[recipe.reverseStripes?6-i:i], index:i,
      color: paletteHsl(HUES[recipe.reverseStripes?6-i:i], palette, r), center: position + center,
      width: Math.max(width, recipe.construction==='stroke'?.8:1.5), geometry: individualGeometry,
      motif, lineStyle:recipe.lineStyle, endTaper:recipe.endTaper,
      dotSize:recipe.dotSize,dotSpacing:recipe.dotSpacing,
      // These are shared across the seven colours: a dotted rainbow can form
      // real aligned columns instead of seven independently spaced chains.
      dotPitch:Math.max(18,referenceAvg*(1.3+recipe.dotSpacing/100*1.15)),
      dotRadius:Math.max(2,referenceAvg*(.23+.45*recipe.dotSize/100)*widthFactor*.95),
      drawnPath,
      shapeFrequency:recipe.shapeFrequency,
      stepCount:recipe.stepCount,
      chevronSharpness:recipe.chevronSharpness,
      loopAspect:recipe.loopAspect,
      turnRadius:recipe.geometrySafety?
        Math.min(Math.max(90+recipe.turnRadius*1.35,spread*.56),
          DESIGN_WIDTH*.44-spread/2):
        30+recipe.turnRadius*3.6,
      hairpinAngle:recipe.hairpinAngle,
      // Unlike the repeated 'loops' pattern, this is one continuous circular
      // turn with an approach and a tangent-continuous departure.
      // In coherent mode every radius setting remains active between the
      // smallest nested turn and the largest frame-fitting turn.
      loopRadius:recipe.geometrySafety?
        minimumLoopRadius+(maximumLoopRadius-minimumLoopRadius)*(recipe.loopRadius/100):
        24+280*Math.pow(recipe.loopRadius/100,1.2),
      loopSweep:recipe.loopSweep,
      loopPeriod:200*Math.pow(8/200,recipe.shapeFrequency/100),
      // The safe limit is normalized to the available lane width so the
      // entire slider, rather than its first few percent, remains useful.
      loopAmplitude:recipe.geometrySafety?
        (.15+(Math.max(.6,avg*.66)-.15)*Math.pow(recipe.shapeDepth/100,1.25)):
        .15+110*recipe.shapeDepth/100,
      phase, period, displacement,
      sharedGeometry:geometry, sharedPhase:commonPhase, sharedPeriod:commonPeriod,
      sharedDisplacement:commonDisplacement,
      // Safe mode scales stripe-to-stripe phase drift continuously across
      // the *entire* slider instead of cutting it off at an invisible limit.
      parallelMix:individuality*(recipe.geometrySafety?.45:1),
      tilt:between(r,-referenceAvg*.8,referenceAvg*.8)*individuality*
        (recipe.geometrySafety?.32:1)*(.25+.75*chaos),
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
    ...(recipe.textureLayer3Enabled ? [{material:recipe.material3, strength:recipe.textureStrength3,
      scale:recipe.textureScale3, rotation:recipe.textureRotation3, coverage:recipe.textureCoverage3,
      blend:recipe.textureBlend3, seed:recipe.seed+':texture:3', heightSeed:hashString(recipe.seed+':texture:3')}] : []),
  ].filter(layer=>layer.material!=='none' && layer.strength>0);
  for(const layer of textureLayers){
    const radians=layer.rotation*Math.PI/180;
    layer.heightCos=Math.cos(radians);
    layer.heightSin=Math.sin(radians);
  }
  const materialSummary=textureLayers.length ? textureLayers.map(layer=>layer.material).join(' + ') : 'none';
  const bundleOffsets=Array.from({length:repeats},(_,i)=>
    (i-(repeats-1)/2)*(spread+(12+recipe.repeatSpacing*1.1)));
  // Every layout produces a unified ordered object list; seven colours are
  // semantic palette slots rather than an assumption of seven objects.
  const objects=buildCompositionObjects(recipe,stripes.map(stripe=>stripe.color),stripes,bundleOffsets);
  return {
    ...recipe, family, orientation, geometry, motif, palette, material, materialSummary, textureLayers, outline, background: recipe.background, angle, span,
    // Reflect the entire diagonal ink layer, not its textures or background.
    mirrorHorizontal:orientation==='diagonal' && recipe.mirrorHorizontal,
    mirrorVertical:orientation==='diagonal' && recipe.mirrorVertical,
    stripes, intensity: chaos, width: avg,
    bundleOffsets, objects,
    extent: Math.hypot(DESIGN_WIDTH, DESIGN_HEIGHT) * 1.35,
    reliefFallbackSeed:hashString(recipe.seed+':relief:fine-grain'),
    // These positions are the canonical, unnudged geometry. Pan is applied only
    // when compositing the finished stripe ink, never while solving/capping it.
    centerX: geometry==='drawn'?DESIGN_WIDTH/2:DESIGN_WIDTH / 2 + between(random, -1, 1) * DESIGN_WIDTH * 0.055,
    centerY: geometry==='drawn'?DESIGN_HEIGHT/2:DESIGN_HEIGHT / 2 + between(random, -1, 1) * DESIGN_HEIGHT * 0.065,
  };
}

/** Preserve all locked controls, including seed and the two-axis position. */
export function respectSettingLocks(currentInput, nextInput) {
  const current=normalizeRecipe(currentInput);
  const next=normalizeRecipe(nextInput);
  const locked=new Set(current.lockedSettings);
  for(const key of locked) {
    if(key==='geometry'){
      next.customPath=current.customPath;
      next.drawnAnchors=current.drawnAnchors;
      next.drawnCorners=current.drawnCorners;
      next.extendDrawnPath=current.extendDrawnPath;
    }
    // For optional layers, the material chooser is the sole visible on/off
    // action. Its hidden Enabled flag belongs to the same atomic user lock.
    // Randomize/restore must not leave a locked material silently inactive.
    if(key==='material2')next.textureLayer2Enabled=current.textureLayer2Enabled;
    if(key==='material3')next.textureLayer3Enabled=current.textureLayer3Enabled;
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
    interiorElements:r()<.32?Array.from({length:r()<.32?2:1},(_,i)=>{
      const type=r()<.24?'band':'line';
      return {id:'generated-'+i,type,shape:any(['straight','wave','zigzag','loop']),
      stroke:any(['solid','solid','dashed','dotted']),color:any(['white','black','lighter','darker']),
      width:type==='band'?10+percent()*.35:Math.max(.5,percent()/12),amplitude:percent()*.0035,
      frequency:2+Math.floor(r()*14),phase:Math.floor(r()*361)-180,
      position:(percent()-50)*.007,opacity:.4+r()*.6,
    };}):[],
    structure:any(['paths','paths','radial','regions']),
    radialMode:any(RADIAL_MODES),rayCount:7*(1+Math.floor(r()*10)),
    rayRotation:Math.floor(r()*361)-180,rayTwist:Math.floor(r()*361)-180,
    rayCoverage:percent(),rayCore:percent(),fieldCenterX:percent(),fieldCenterY:percent(),
    regionMode:any(REGION_MODES),regionCount:7*(1+Math.floor(r()*10)),
    regionJitter:percent(),regionSides:Math.floor(r()*13),
    scatteredCount:1+Math.floor(r()*70),scatteredMinSize:percent(),
    scatteredMaxSize:percent(),scatteredVariation:percent(),
    scatteredSpacing:percent(),scatteredEdgeCrop:percent(),
    scatteredOverlap:any(['separate','overlap']),
    scatteredShapeKind:'circle',
    dividerColor:any(DIVIDER_MODES),dividerWidth:percent(),
    geometry:any(GEOMETRIES.filter(x=>x!=='drawn')), motif:any(MOTIFS), palette:any(PALETTES),
    reverseStripes:r()>.5,diagonalRotation:Math.floor(r()*361)-180,
    mirrorHorizontal:r()>.5,mirrorVertical:r()>.5,
    material:any(MATERIALS), textureCoverage:any(TEXTURE_COVERAGES), textureRotation:degrees(), textureBlend:any(BLEND_MODES),
    // Random generation always starts with one texture layer. Players may
    // explicitly opt in to layers 2 and 3 through the existing controls.
    textureLayer2Enabled:false, material2:'none', textureStrength2:percent(), textureScale2:percent(),
    textureRotation2:degrees(), textureCoverage2:any(TEXTURE_COVERAGES), textureBlend2:any(BLEND_MODES),
    textureLayer3Enabled:false, material3:'none', textureStrength3:percent(), textureScale3:percent(),
    textureRotation3:degrees(), textureCoverage3:any(TEXTURE_COVERAGES), textureBlend3:any(BLEND_MODES),
    outline:any(OUTLINES), background:any(['black','white']),
    lightingMood:any(LIGHTING_MOODS),lightDirection:any(LIGHT_DIRECTIONS),
    lightStrength:percent(),shadowStrength:percent(),
    stripeShadowDirection:any(LIGHT_DIRECTIONS),
    stripeShadowStrength:percent(),stripeShadowSoftness:percent(),
    chaos:percent(), stripeWidth:percent(), spread:percent(),
    shapeFrequency:percent(),shapeDepth:percent(),motifSize:percent(),motifFrequency:percent(),lineStyle:any(LINE_STYLES),
    composition:any(COMPOSITIONS),construction:any(CONSTRUCTIONS.filter(x=>x!=='tonal')),crossingMode:any(CROSSING_MODES),
    repeatCount:2+Math.floor(r()*5),repeatSpacing:percent(),
    turnRadius:percent(),loopRadius:percent(),loopSweep:240+Math.floor(r()*211),stepCount:1+Math.floor(r()*16),chevronSharpness:percent(),loopAspect:percent(),pathLength:percent(),endTaper:percent(),
    tonalContrast:percent(),brushRoughness:percent(),dotSize:percent(),dotSpacing:percent(),
    textureStrength:percent(), textureScale:percent(), textureDisplacement:percent(), individuality:percent(),
    patternHomogeneity:percent(), overridePatternHomogeneity:r()>.5,
    gap:percent(), outlineBuffer:percent(), glow:percent(), positionX:0, positionY:0,
  });
}
