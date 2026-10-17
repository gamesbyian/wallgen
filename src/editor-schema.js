// Canonical information architecture for the ordinary editor and future wizard.
// Every parameter has ONE home. Navigation, scoped variation, and guided steps
// use these definitions rather than maintaining competing control taxonomies.
export const EDITOR_CATEGORIES=[
  {id:'layout',label:'Layout',icon:'▦',tools:[
    {id:'arrange',name:'Arrangement',settings:['composition','repeatCount','repeatSpacing']},
    {id:'direction',name:'Direction',settings:['orientation','diagonalRotation','mirrorHorizontal','mirrorVertical']},
    {id:'variability',name:'Variation',settings:['chaos']},
  ]},
  {id:'path',label:'Path',icon:'⌁',tools:[
    {id:'geometry',name:'Geometry',settings:['geometry','shapeFrequency','shapeDepth','turnRadius','hairpinAngle']},
    {id:'ends',name:'Endpoints',settings:['pathLength','endTaper']},
  ]},
  {id:'stripes',label:'Stripes',icon:'≋',tools:[
    {id:'structure',name:'Structure',settings:['construction','stripeWidth','spread']},
    {id:'marks',name:'Patterns',settings:['motif','lineStyle','dotSize','dotSpacing','patternHomogeneity']},
    {id:'character',name:'Character',settings:['individuality','overridePatternHomogeneity','tonalContrast']},
  ]},
  {id:'colour',label:'Colour',icon:'◐',tools:[
    {id:'rainbow',name:'Rainbow',settings:['palette','reverseStripes']},
    {id:'canvas',name:'Background',settings:['background']},
  ]},
  {id:'material',label:'Material',icon:'▧',tools:[
    {id:'layer1',name:'Layer 1',settings:['material','textureCoverage','textureStrength','textureScale','textureRotation','textureBlend','textureLayer2Enabled']},
    {id:'layer2',name:'Layer 2',settings:['material2','textureCoverage2','textureStrength2','textureScale2','textureRotation2','textureBlend2','textureLayer3Enabled']},
    {id:'layer3',name:'Layer 3',settings:['material3','textureCoverage3','textureStrength3','textureScale3','textureRotation3','textureBlend3']},
    {id:'surface',name:'Surface',settings:['textureDisplacement','brushRoughness']},
  ]},
  {id:'effects',label:'Effects',icon:'✦',tools:[
    {id:'outlines',name:'Outlines',settings:['outline','gap']},
    {id:'lighting',name:'Lighting',settings:['lightingMood','lightDirection','lightStrength','shadowStrength']},
    {id:'shadows',name:'Shadows',settings:['stripeShadowEnabled','stripeShadowStrength','stripeShadowSoftness','stripeShadowDirection']},
    {id:'glow',name:'Glow',settings:['glow']},
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
