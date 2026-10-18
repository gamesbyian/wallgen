// Canonical information architecture for the ordinary editor and future wizard.
// Every parameter has ONE home. Navigation, scoped variation, and guided steps
// use these definitions rather than maintaining competing control taxonomies.
export const EDITOR_CATEGORIES=[
  {id:'layout',label:'Layout',icon:'▦',tools:[
    {id:'canvas',name:'Canvas structure',settings:['structure']},
    {id:'arrange',name:'Arrangement',settings:['composition','repeatCount','repeatSpacing']},
    {id:'direction',name:'Direction',settings:['orientation','diagonalRotation','mirrorHorizontal','mirrorVertical']},
    {id:'variability',name:'Variation',settings:['chaos']},
  ]},
  {id:'path',label:'Geometry',icon:'⌁',tools:[
    {id:'geometry',name:'Paths',settings:['geometry','shapeFrequency','shapeDepth']},
    {id:'rays',name:'Radial rays',settings:['radialMode','rayCount','rayRotation']},
    {id:'ray-shape',name:'Ray shape',settings:['rayTwist','rayCoverage','rayCore']},
    {id:'origin',name:'Origin',settings:['fieldCenterX','fieldCenterY']},
    {id:'regions',name:'Regions',settings:['regionMode','regionCount','regionJitter','regionSides']},
    {id:'safety',name:'Constraints',settings:['geometrySafety','crossingMode']},
    {id:'turn',name:'Turns',settings:['turnRadius','hairpinAngle']},
    {id:'single-loop',name:'Single loop',settings:['loopRadius','loopSweep']},
    {id:'shape-details',name:'Shape detail',settings:['stepCount','chevronSharpness','loopAspect']},
    {id:'ends',name:'Endpoints',settings:['pathLength','endTaper']},
  ]},
  {id:'stripes',label:'Stripes',icon:'≋',tools:[
    {id:'structure',name:'Structure',settings:['construction','stripeWidth','spread']},
    {id:'outlines',name:'Outlines',settings:['outline','gap','outlineBuffer']},
    {id:'dividers',name:'Dividers',settings:['dividerColor','dividerWidth']},
    {id:'patterns',name:'Patterns',settings:['motif','lineStyle','patternHomogeneity']},
    {id:'marks',name:'Marks',settings:['dotSize','dotSpacing']},
    {id:'motif-scale',name:'Motif scale',settings:['motifSize','motifFrequency']},
    {id:'tone',name:'Band tones',settings:['tonalContrast']},
    {id:'character',name:'Character',settings:['individuality','overridePatternHomogeneity']},
    {id:'shadows',name:'Shadows',settings:['stripeShadowStrength','stripeShadowSoftness','stripeShadowDirection']},
    {id:'glow',name:'Glow',settings:['glow']},
  ]},
  {id:'colour',label:'Colour',icon:'◐',tools:[
    {id:'rainbow',name:'Rainbow',settings:['palette','reverseStripes']},
    {id:'canvas',name:'Background',settings:['background']},
  ]},
  {id:'material',label:'Material',icon:'▧',tools:[
    {id:'layer1',name:'Layer 1',settings:['material','textureCoverage','textureBlend','textureLayer2Enabled']},
    {id:'finish1',name:'Finish 1',settings:['textureStrength','textureScale','textureRotation']},
    {id:'layer2',name:'Layer 2',settings:['material2','textureCoverage2','textureBlend2','textureLayer3Enabled']},
    {id:'finish2',name:'Finish 2',settings:['textureStrength2','textureScale2','textureRotation2']},
    {id:'layer3',name:'Layer 3',settings:['material3','textureCoverage3','textureBlend3']},
    {id:'finish3',name:'Finish 3',settings:['textureStrength3','textureScale3','textureRotation3']},
    {id:'surface',name:'Surface',settings:['textureDisplacement','brushRoughness']},
  ]},
  {id:'effects',label:'Effects',icon:'✦',tools:[
    {id:'lighting',name:'Lighting',settings:['lightingMood','lightDirection','lightStrength','shadowStrength']},
  ]},
];
export const TOOL_LIST=EDITOR_CATEGORIES.flatMap(category=>
  category.tools.map(tool=>({...tool,category:category.id,categoryLabel:category.label})));
export const SETTING_TOOL=Object.fromEntries(TOOL_LIST.flatMap(t=>
  t.settings.map(setting=>[setting,{category:t.category,tool:t.id}])));
export const WIZARD_STEPS=['layout','path','stripes','colour','material','effects'];
export const STYLE_PRESETS={
  studio:{geometry:'straight',motif:'solid',palette:'classic',outline:'white',material:'none',stripeWidth:72},
  currents:{geometry:'wave',motif:'solid',palette:'electric',outline:'hairline',material:'none',stripeWidth:31},
  fracture:{geometry:'jagged',motif:'solid',palette:'electric',outline:'white',material:'grain',stripeWidth:52},
  confetti:{geometry:'wave',motif:'dots',palette:'classic',outline:'none',material:'none',stripeWidth:55},
  deco:{geometry:'arc',motif:'solid',palette:'jewel',outline:'double',material:'none',stripeWidth:51},
  tapestry:{geometry:'wave',motif:'chevrons',palette:'muted',outline:'hairline',material:'linen',stripeWidth:67},
  signal:{geometry:'stepped',motif:'dashes',palette:'electric',outline:'one-side',material:'none',stripeWidth:48},
  contour:{geometry:'contour',motif:'hatch',palette:'pastel',outline:'hairline',material:'handmade',stripeWidth:40},
};
export function validateEditorSchema(keys){
  const counts=new Map();
  for(const tool of TOOL_LIST)for(const key of tool.settings)
    counts.set(key,(counts.get(key)||0)+1);
  const missing=keys.filter(k=>!counts.has(k));
  const duplicated=[...counts].filter(([,n])=>n!==1).map(([k])=>k);
  const unknown=[...counts.keys()].filter(k=>!keys.includes(k));
  return {missing,duplicated,unknown};
}
