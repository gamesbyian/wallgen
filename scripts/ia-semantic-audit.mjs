/**
 * ROYGBIV intent / perceptual-effect / workflow graph.
 * Research model, never a source of recipe truth or automated artistic score.
 *
 * node scripts/ia-semantic-audit.mjs --audit
 * node scripts/ia-semantic-audit.mjs --setting scatteredSpacing
 * node scripts/ia-semantic-audit.mjs --goal "give the circles more room"
 * node scripts/ia-semantic-audit.mjs --mode regions:scattered
 * node scripts/ia-semantic-audit.mjs --relationships
 * node scripts/ia-semantic-audit.mjs --json --audit
 *
 * No DOM, browser, dependencies, screenshots or new CI workflow.
 */
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {EDITOR_CATEGORIES} from '../src/editor-schema.js';
import {toolAppliesToScene} from '../src/editor-tool-applicability.js';
import {sourceHomes,candidateHomes,routeTravel} from './ia-structure-evaluate.mjs';

// Cross-cutting VISUAL DOMAINS, independent of both current and proposed menus.
// Format: id | user-facing question | visual impact 0..4 | estimated frequency F/O/S | setting keys.
// These are explanatory modelling attributes, never observed user behaviour.
const DOMAIN_ROWS = "archetype|What kind of picture is this?|4|O|structure,radialMode,regionMode,geometry,construction,scatteredShapeKind\n" +
  "composition|How many groups or objects occupy the frame?|4|F|composition,repeatCount,repeatSpacing,regionCount,rayCount,scatteredCount\n" +
  "orientation|Which direction, reflection and origin?|4|O|orientation,diagonalRotation,mirrorHorizontal,mirrorVertical,rayRotation,fieldCenterX,fieldCenterY\n" +
  "path-form|How do the paths bend or fold?|3|F|shapeFrequency,shapeDepth,chaos,turnRadius,hairpinAngle,loopRadius,loopSweep,stepCount,chevronSharpness,loopAspect,geometrySafety,crossingMode\n" +
  "radial-shape|How do the rays fan, twist and expose background?|4|O|rayTwist,rayCoverage,rayCore\n" +
  "regions|How irregular or angular are cells?|3|O|regionJitter,regionSides\n" +
  "objects|How large, separated and cropped are independent shapes?|4|F|scatteredMinSize,scatteredMaxSize,scatteredVariation,scatteredSpacing,scatteredEdgeCrop,scatteredOverlap\n" +
  "ends|How do open ribbons end or continue?|3|O|pathLength,endTaper,extendDrawnPath\n" +
  "stripe-proportions|How broad and widely separated is the colour ink?|4|F|stripeWidth,spread\n" +
  "marks|What recurring pattern or marks fill a band?|3|F|motif,lineStyle,patternHomogeneity,dotSize,dotSpacing,motifSize,motifFrequency\n" +
  "stripe-character|How different is each coloured band?|3|O|individuality,overridePatternHomogeneity,tonalContrast\n" +
  "boundaries|How visibly are shapes separated?|3|O|outline,gap,outlineBuffer,dividerColor,dividerWidth\n" +
  "palette|What colour relationship and negative space?|4|F|palette,reverseStripes,background\n" +
  "local-light|What is cast or luminous at stripe boundaries?|3|O|stripeShadowStrength,stripeShadowSoftness,stripeShadowDirection,glow\n" +
  "surface-material|What is the physical texture and where is it applied?|3|F|material,textureCoverage,textureBlend,textureStrength,textureScale,textureRotation\n" +
  "surface-second|What does the second surface layer contribute?|3|O|textureLayer2Enabled,material2,textureCoverage2,textureBlend2,textureStrength2,textureScale2,textureRotation2\n" +
  "surface-third|What does the third surface layer contribute?|3|S|textureLayer3Enabled,material3,textureCoverage3,textureBlend3,textureStrength3,textureScale3,textureRotation3\n" +
  "surface-edges|How does pigment or surface material change contours?|3|O|textureDisplacement,brushRoughness\n" +
  "global-light|What overall illumination and shading?|3|O|lightingMood,lightDirection,lightStrength,shadowStrength";
const parseLines=text=>text.trim().split('\n').map(line=>line.split('|'));
export const DOMAINS=Object.freeze(parseLines(DOMAIN_ROWS).map(([id,question,impact,frequency,keys])=>
  Object.freeze({id,question,impact:Number(impact),frequency,keys:Object.freeze(keys.split(','))})));
export const KEY_DOMAINS=Object.freeze(Object.fromEntries(DOMAINS.flatMap(domain=>
  domain.keys.map(key=>[key,domain.id]))));

// Related adjustments are meaningful cross-facet user intentions, not separate
// mutable copies of parameters. A goal can optionally need a non-schema action.
const GOAL_ROWS = "negative-space|more space,gaps,air,breathe,less crowded|stripeWidth,spread,repeatSpacing,background,outlineBuffer|Balance bands against background\n"+
"wild-lines|wild,wavy,dramatic,irregular,bends,chaotic|geometry,shapeFrequency,shapeDepth,chaos,individuality,geometrySafety|Explore energetic paths without lost coherence\n"+
"motif-rhythm|pattern,dots,dashes,small dense marks,rhythm|construction,motif,dotSize,dotSpacing,motifSize,motifFrequency,patternHomogeneity|Control repeated marks and their uniformity\n"+
"weave|crossing,woven,intersecting,layer order|construction,crossingMode,geometrySafety,stripeShadowStrength|Understand and emphasise strand ordering\n"+
"radial-centre|sunburst,pinwheel,off-centre,spiral,rays,hole|radialMode,rayCount,rayTwist,rayCoverage,rayCore,fieldCenterX,fieldCenterY|Tune a radial artwork as one instrument\n"+
"stained-glass|stained glass,regions,tiles,partitions,cells|regionMode,regionCount,regionJitter,dividerColor,dividerWidth|Design cell density and separator emphasis\n"+
"circle-packing|circles,clearance,scatter,scattered,overlap,room,cropped|regionMode,scatteredShapeKind,scatteredCount,scatteredMinSize,scatteredMaxSize,scatteredVariation,scatteredSpacing,scatteredOverlap,scatteredEdgeCrop|Arrange independently generated disks\n"+
"palette-contrast|palette,colours,color,white background,reverse rainbow|palette,reverseStripes,background,outline|Compare colour relationships in context\n"+
"print-fabric|paper,fabric,cloth,printed,textile,material,grain|material,textureCoverage,textureStrength,textureScale,textureBlend,material2,textureStrength2|Build material character with attached adjustments\n"+
"contour-relief|rough texture,distort,contour,edges,pigment|material,textureCoverage,textureStrength,textureDisplacement,brushRoughness|Texture effect depends on actual stripe-applied material\n"+
"luminous|neon,glow,shadow,light,illuminate,bright|glow,stripeShadowStrength,stripeShadowSoftness,stripeShadowDirection,lightingMood,lightStrength,lightDirection|Join global and local lighting effects\n"+
"floating-ribbons|floating,short,ends,taper,length|composition,pathLength,endTaper,stripeWidth,spread|Shape termination belongs beside floating composition\n"+
"restore-shape|saved silhouette,reuse path,import shape,geometry library||Open geometry library, then apply source geometry rather than saved wallpaper\n"+
"edit-object|move one circle,individual shape,resize just one,manual layout||Missing today: individual-scattered-object authoring, distinct from generative distribution\n"+
"inspect-vision|colour blindness,vision comparison,simulate vision||Colour Vision Preview is an inspection overlay, not saved recipe appearance\n"+
"explore-safely|explore variations,keep the colours,undo,lock,reroll||Use seed/locks, Vary and Explore; preserve chosen artwork in Saved";
export const GOALS=Object.freeze(parseLines(GOAL_ROWS).map(([id,terms,keys,purpose])=>Object.freeze({
  id,terms:Object.freeze(terms.split(',')),keys:Object.freeze(keys?keys.split(','):[]),purpose
})));

// Requirements are SOURCE-REVIEWED examples of semantic gates; this is not
// the live disabled policy. src/app.js::inactiveSettingKeys still owns it.
// 'shouldBeInactive' highlights mismatches needing targeted real-world tests.
export const GATES=Object.freeze([
  {keys:['diagonalRotation','mirrorHorizontal','mirrorVertical'],needs:'orientation=diagonal; paths only',source:'src/app.js:inactiveSettingKeys'},
  {keys:['repeatCount','repeatSpacing'],needs:'composition=repeat; paths only',source:'src/app.js:inactiveSettingKeys'},
  {keys:['pathLength'],needs:'composition=floating; paths only',source:'src/app.js:inactiveSettingKeys'},
  {keys:['shapeFrequency','shapeDepth'],needs:'resolved geometry supports bends',source:'src/app.js:inactiveSettingKeys'},
  {keys:['turnRadius','hairpinAngle'],needs:'resolved geometry=hairpin',source:'src/app.js:inactiveSettingKeys'},
  {keys:['loopRadius','loopSweep'],needs:'resolved geometry=loop',source:'src/app.js:inactiveSettingKeys'},
  {keys:['loopAspect'],needs:'resolved geometry=loops',source:'src/app.js:inactiveSettingKeys'},
  {keys:['stepCount'],needs:'resolved geometry=stepped',source:'src/app.js:inactiveSettingKeys'},
  {keys:['chevronSharpness'],needs:'resolved geometry=chevron',source:'src/app.js:inactiveSettingKeys'},
  {keys:['crossingMode'],needs:'resolved geometry=loop/loops/drawn',source:'src/app.js:inactiveSettingKeys'},
  {keys:['scatteredCount','scatteredMinSize','scatteredMaxSize','scatteredVariation','scatteredSpacing','scatteredEdgeCrop','scatteredOverlap','scatteredShapeKind'],needs:'structure=regions AND regionMode=scattered',source:'src/editor-tool-applicability.js and src/app.js'},
  {keys:['scatteredSpacing'],needs:'overlap=separate for visible clearance effect',source:'src/scattered-composition.js:buildScatteredCircles',shouldBeInactive:true},
  {keys:['regionSides'],needs:'structure=regions AND regionMode=nested',source:'src/app.js:inactiveSettingKeys'},
  {keys:['rayTwist'],needs:'radialMode=pinwheel/starburst',source:'src/app.js:inactiveSettingKeys'},
  {keys:['rayCoverage','rayCore'],needs:'radialMode NOT concentric',source:'src/app.js:inactiveSettingKeys'},
  {keys:['motifSize','motifFrequency','patternHomogeneity'],needs:'ribbon and non-solid active motif',source:'src/app.js:inactiveSettingKeys'},
  {keys:['dotSize','dotSpacing'],needs:'active dotted line or dots motif; not woven',source:'src/app.js:inactiveSettingKeys'},
  {keys:['tonalContrast'],needs:'construction=tonal; mode is hidden/disabled in ordinary UI',source:'index.html:construction and src/model.js:randomizeAllRecipe'},
  {keys:['textureDisplacement'],needs:'structure=paths AND active stripe-applied nonzero material',source:'src/renderer.js:displacementForEdge',shouldBeInactive:true},
  {keys:['textureCoverage','textureBlend','textureScale','textureRotation'],needs:'layer 1 has nonzero strength and material',source:'src/app.js:inactiveSettingKeys'},
  {keys:['textureCoverage2','textureBlend2','textureScale2','textureRotation2'],needs:'layer 2 enabled, selected material, nonzero strength',source:'src/app.js:inactiveSettingKeys'},
  {keys:['textureCoverage3','textureBlend3','textureScale3','textureRotation3'],needs:'layer 3 enabled, selected material, nonzero strength',source:'src/app.js:inactiveSettingKeys'},
  {keys:['lightDirection','lightStrength','shadowStrength'],needs:'lightingMood NOT off',source:'src/app.js:inactiveSettingKeys'},
  {keys:['stripeShadowSoftness','stripeShadowDirection'],needs:'stripeShadowStrength > 0',source:'src/app.js:inactiveSettingKeys'},
  {keys:['outlineBuffer','gap'],needs:'outline not none; paths only',source:'src/app.js:inactiveSettingKeys'},
  {keys:['dividerWidth'],needs:'dividerColor not none; regions/radial only',source:'src/app.js:inactiveSettingKeys'}
].map(row=>Object.freeze({...row,keys:Object.freeze(row.keys)})));

// Non-scalar controls, destinations, workflows and holes in one shared registry.
export const WORKFLOWS=Object.freeze([
  {id:'studio',status:'available',kind:'destination',intent:'see full wallpaper',entry:'mobileStudio',changes:'view only'},
  {id:'edit',status:'available',kind:'destination',intent:'adjust recipe settings',entry:'mobileEdit',changes:'recipe'},
  {id:'explore',status:'available',kind:'destination',intent:'compare generated alternatives',entry:'mobileExplore; batch=12',changes:'recipe on selection'},
  {id:'saved',status:'available',kind:'destination',intent:'reopen favourite wallpapers',entry:'mobileSaved',changes:'recipe on selection'},
  {id:'more',status:'available',kind:'destination',intent:'utilities and metadata',entry:'mobileMore',changes:'mixed'},
  {id:'vary',status:'available',kind:'global/locally-scoped action',intent:'explore a nearby design or reroll a single setting/tool/category',entry:'editorVariationMode and scope dice',changes:'recipe'},
  {id:'seed',status:'available',kind:'reproducibility',intent:'regenerate a specific procedural result',entry:'seedInput / applySeed / new variation',changes:'recipe'},
  {id:'locks-undo',status:'available',kind:'protection and recovery',intent:'preserve interesting attributes and reverse edits',entry:'setting locks / Undo',changes:'recipe'},
  {id:'draw-path',status:'available',kind:'geometry authoring',intent:'draw and refine an open path',entry:'drawPathToggle',changes:'recipe'},
  {id:'image-path',status:'available',kind:'geometry import',intent:'extract a path or silhouette from image',entry:'importPathToggle',changes:'recipe'},
  {id:'geometry-library',status:'available',kind:'asset retrieval',intent:'reuse saved path/shape source',entry:'My shapes & paths (More and source tools)',changes:'asset or recipe'},
  {id:'orbit-preset',status:'available',kind:'preset',intent:'create seven differently sized coloured circles',entry:'rainbowOrbitsPreset',changes:'recipe'},
  {id:'vision',status:'available',kind:'inspection',intent:'simulate common colour-vision differences',entry:'visionPreviewToggle in desktop canvas / mobile More',changes:'display only'},
  {id:'camera',status:'available',kind:'framing',intent:'position artwork vs move world frame vs zoom',entry:'artwork nudge / viewport positioner / zoom Fit',changes:'mixed: frame is exported; preview zoom distinct'},
  {id:'safe-area',status:'available',kind:'inspection',intent:'see mobile safe area guide',entry:'mobileBleed',changes:'display only'},
  {id:'export',status:'available',kind:'file/transport',intent:'export PNG with optional metadata, JSON recipe or share link',entry:'download, metadata, copyLink, downloadRecipe',changes:'file only'},
  {id:'direct-object-edit',status:'missing',kind:'geometry authoring',intent:'select one scattered object and adjust its own position/size',entry:'no implemented direct object inspector',changes:'future recipe per-object overrides'},
  {id:'mixed-object-assets',status:'missing',kind:'geometry authoring',intent:'combine differently shaped library assets in one scattered scene',entry:'single scatteredShapeKind and shared scatteredShape snapshot',changes:'future mixed-instance model'},
  {id:'goal-search',status:'missing',kind:'navigation',intent:'find controls by visual goal in ordinary language',entry:'current search matches literal tool/setting names and legacy aliases',changes:'navigation only'},
  {id:'linked-adjustments',status:'missing',kind:'navigation',intent:'jump straight from a control to its strongest creative neighbours',entry:'current tool/card navigation',changes:'navigation only'},
  {id:'library-management',status:'partial',kind:'asset management',intent:'reorganise, rename and preview/manage saved reusable geometry',entry:'library browse, search, save, delete, export/import; no full direct object editor',changes:'asset'}
].map(row=>Object.freeze(row)));

export const FINDINGS=Object.freeze([
 {id:'C01',type:'observed-code',status:'resolved',priority:'P1',title:'Overlap now marks clearance inactive',keys:['scatteredSpacing','scatteredOverlap'],evidence:'src/scattered-composition.js buildScatteredCircles: gap used only in if(!overlap && intersects); src/app.js inactiveSettingKeys now disables scatteredSpacing for Allow overlaps (#452)',remedy:'Describe clearance as applicable to separate mode only; make it visibly dormant under Allow overlaps or implement a meaningful soft preference.',verify:'one-scene before/after render under both overlap modes'},
 {id:'C02',type:'observed-code',status:'resolved',priority:'P1',title:'Tonal bands now selectable intentionally',keys:['construction','tonalContrast'],evidence:'index.html tonal option selectable after #452; randomizeAllRecipe still deliberately excludes tonal; Band Tones tool remains conditional',remedy:'Explicitly retire as legacy-only with clear imported-recipe access, or deliberately expose a supported tonal construction.',verify:'one manual create/import route and one tonal rendered sample'},
 {id:'C03',type:'observed-code',status:'partly-implemented',priority:'P1',title:'Missing imported silhouettes now identify temporary circle placeholders',keys:['scatteredShapeKind'],evidence:'src/scattered-composition.js retains safe temporary circles without geometry; src/app.js now labels their placeholder role next to the source selector, but still draws circles until a library asset is chosen',remedy:'Use an intentional empty placeholder or visibly marked fallback; do not imply the circles are imported silhouettes.',verify:'toggle source to imported without selecting a library asset'},
 {id:'C04',type:'observed-code',status:'partly-implemented',priority:'P1',title:'Per-object adjustment landed; direct drag remains optional',keys:['scatteredCount','scatteredMinSize','scatteredMaxSize'],evidence:'src/app.js scatteredObjectEditor and src/model.js scatteredOverrides now support selected-object nudge/resize, Undo and recipe persistence via #449; direct pointer drag is not yet implemented',remedy:'Direct selection/reposition/resize with stable object IDs, Undo and recipe snapshots; coordinate with #443.',verify:'move one circle, rerender, save PNG+JSON, restore and undo'},
 {id:'C05',type:'observed-code',status:'resolved',priority:'P2',title:'Effective scatter size limits now get contextual feedback',keys:['scatteredMinSize','scatteredMaxSize'],evidence:'src/scattered-composition.js scatteredRadiusRange supplies the exact packing min/max and cap; src/app.js shows only consequential collapsed/capped states',remedy:'Keep authored values if required for roundtrip; show effective range or constrain compatible values with helpful feedback.',verify:'set minimum greater than maximum; compare effective radii and labels'},
 {id:'C06',type:'observed-code',priority:'P2',title:'Pattern and Dots named tools can remain navigable while all their sliders are dormant',keys:['motifSize','motifFrequency','dotSize','dotSpacing'],evidence:'src/editor-tool-applicability.js keeps Dots/Motif scale tool available for paths; src/app.js inactivates settings for solid/non-dotted modes',remedy:'Offer contextual activating change or defer irrelevant tool chips; preserve dormant recipe values.',verify:'paths with solid motif/continuous line and a chosen pattern-changing action'},
 {id:'C07',type:'observed-code',status:'partly-implemented',priority:'P2',title:'Search now locates exact settings and selected artistic intents',keys:[],evidence:'src/editor-tool-search.js findEditorSearchHit ranks exact settings/aliases and visual-intent synonyms; src/editor-layout.js shows source home and Enter focuses canonical field; multiple-choice result browsing is still future work',remedy:'Rank exact setting vs tool vs synonyms and offer labelled results with active/dormant explanation; deep-link actual field.',verify:'search Structure, Variation, light, paper, more gaps in different modes'},
 {id:'C08',type:'observed-code',status:'resolved',priority:'P2',title:'Texture layers now have coherent Material/Finish inspector views',keys:['material','textureStrength','material2','textureStrength2'],evidence:'src/editor-schema.js now has layer1, layer2 and layer3 as canonical homes; src/editor-material-inspector.js exposes Material/Finish internal views on original source controls',remedy:'One coherent inspector per material, preserving each original input and disabled state.',verify:'choose material, adjust strength/scale, add second layer'},
 {id:'C09',type:'observed-code',status:'partly-implemented',priority:'P2',title:'Interior tools now share a directly switchable selected element',keys:[],evidence:'src/editor-schema.js five dynamic Elements/Style/Wave/Placement/Ink & targets tools; src/app.js syncInteriorUI rebuilds their content for selected object',remedy:'A selected-element inspector with persistent object identity and a compact subflow; not five top-level peers.',verify:'add wavering line in Blue and Indigo only; inspect selection persistence'},
 {id:'C10',type:'observed-code',priority:'P2',title:'Glow, cast shadows and overall Lighting appear under different categories',keys:['glow','stripeShadowStrength','lightingMood'],evidence:'src/editor-schema.js Details/Glow+Shadows and Light/Lighting',remedy:'A common Light context with distinct global and local scopes, or strong cross-links.',verify:'reduce muddy glow while preserving illumination'},
 {id:'C11',type:'observed-code',priority:'P2',title:'The visual category label changes from Path to Geometry but controls remain renderer-scoped',keys:['structure','regionMode'],evidence:'src/editor-layout.js syncEditorStructure renames Path tab and disables Stripes outside Paths; Layout then only exposes Structure',remedy:'Make selection of radial/regions reveal coherent contextual form and distribution panels rather than unrelated empty categories.',verify:'change mode across three structures and trace first next adjustment'},
 {id:'C12',type:'observed-code',status:'partly-implemented',priority:'P2',title:'Contour relief now reflects effective texture; other prereqs merit review',keys:['lightStrength','textureDisplacement','overridePatternHomogeneity'],evidence:'src/app.js now uses stripeContourDistortionAvailability(scene) built from filtered effective texture layers; broader applicability remains in inactiveSettingKeys',remedy:'Centralise complete state/explanation model and show exact current cause for dormancy.',verify:'select no texture, background-only texture, off lighting, zero individuality'},
 {id:'C13',type:'observed-code',status:'resolved',priority:'P2',title:'Tool names distinguish irregularity, stripe differences and Vary',keys:['chaos','individuality'],evidence:'src/editor-schema.js Layout/Irregularity=chaos and Stripes/Stripe differences=individuality; Vary/Reroll remains a separate action and legacy search aliases are retained',remedy:'Use names that distinguish geometric irregularity, stripe differences and generation action.',verify:'blind first-click tasks for vary image vs change stripe character'},
 {id:'C14',type:'observed-code',priority:'P3',title:'Mobile More mixes generation, framing, inspection and transport',keys:[],evidence:'src/mobile-studio.js Generate collects original action tray, Files & sharing collects imports/exports, Position & info includes vision preview',remedy:'Keep five destinations; clarify action labels and put inspection entry next to preview without new destination.',verify:'find colour-vision preview, shape library, Download, framing'},
 {id:'C15',type:'observed-code',priority:'P3',title:'Randomize all never introduces secondary and tertiary texture layers',keys:['textureLayer2Enabled','textureLayer3Enabled'],evidence:'src/model.js randomizeAllRecipe explicitly assigns both false and material2/3=none',remedy:'Decide intentionally if simplicity outweighs discoverability; maybe opt-in richer exploration style, not arbitrary random clutter.',verify:'sample ordinary random generations and user expectations'},
 {id:'C16',type:'design-hypothesis',priority:'P3',title:'The palette permits stories and reversing slots but not direct editing of each rainbow hue',keys:['palette','reverseStripes'],evidence:'src/model.js fixed seven semantic hue roles with palette presets; source UI has no per-slot hue editor',remedy:'Do not assume missing feature; ask whether bespoke pigment selection fits the rainbow-only product premise.',verify:'compare desire for one-colour tweaking versus preset identity'},
 {id:'C17',type:'design-hypothesis',priority:'P3',title:'Procedural arrangement offers limited positive placement constraints',keys:['scatteredSpacing','scatteredEdgeCrop','scatteredVariation'],evidence:'src/scattered-composition.js has randomized packing and clearance but no align-to-grid, focal cluster or negative-space mask setting',remedy:'Treat manual placement as higher priority; consider arrangement rules only when concrete compositions require them.',verify:'attempt intentional focal point with no direct editing'}
].map(row=>Object.freeze({...row,status:row.status||'open',keys:Object.freeze(row.keys)})));

const homeMap=()=>new Map(sourceHomes().map(home=>[home.key,home]));
const candidateMap=()=>new Map(candidateHomes().map(home=>[home.key,home]));
export function inspectSetting(key){
  const home=homeMap().get(key);
  if(!home)return null;
  const domain=DOMAINS.find(group=>group.id===KEY_DOMAINS[key]);
  const activeGoals=GOALS.filter(goal=>goal.keys.includes(key));
  const neighbors=[...new Set(activeGoals.flatMap(goal=>goal.keys))].filter(x=>x!==key);
  return {key,domain:domain?.id,question:domain?.question,impact:domain?.impact,
    estimatedFrequency:domain?.frequency,current:home.route,
    proposed:candidateMap().get(key)?.route,
    gates:GATES.filter(gate=>gate.keys.includes(key)).map(g=>({needs:g.needs,source:g.source,reviewMismatch:!!g.shouldBeInactive})),
    goals:activeGoals.map(goal=>goal.id),
    related:neighbors.map(other=>({key:other,category:homeMap().get(other)?.category})),
    findings:FINDINGS.filter(f=>f.keys.includes(key)).map(f=>f.id)};
}
function words(text){return String(text).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/).filter(Boolean);}
export function findGoals(query,limit=5){
  const input=words(query),phrase=String(query).toLowerCase().trim();
  if(!input.length)return [];
  return GOALS.map(goal=>{
    const matches=goal.terms.map(term=>{
      const tw=words(term);
      return tw.every(word=>input.some(token=>token.startsWith(word)||word.startsWith(token)))?tw.length+2:0;
    });
    const score=Math.max(0,...matches)+(goal.id.replace(/-/g,' ')===phrase?5:0);
    return {goal,score};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,limit)
    .map(({goal,score})=>({...goal,score,settings:goal.keys.map(key=>inspectSetting(key))}));
}
export function sceneTools(structure='paths',regionMode='voronoi',construction='ribbon'){
  return EDITOR_CATEGORIES.map(category=>({
    category:category.label,
    tools:category.tools.filter(tool=>toolAppliesToScene({
      category:category.id,id:tool.id},{structure,regionMode,construction}))
      .map(tool=>({id:tool.id,name:tool.name,keys:tool.settings}))
  }));
}
export function relationshipAudit(){
  const homes=homeMap(),candidate=candidateMap();
  return GOALS.filter(goal=>goal.keys.length).map(goal=>{
    const missing=goal.keys.filter(key=>!homes.has(key));
    const oldCats=[...new Set(goal.keys.map(key=>homes.get(key)?.category).filter(Boolean))];
    const newCats=[...new Set(goal.keys.map(key=>candidate.get(key)?.category).filter(Boolean))];
    return {id:goal.id,keys:goal.keys.length,missing,
      currentCategories:oldCats,proposedCategories:newCats,
      current:missing.length?null:routeTravel(goal.keys,sourceHomes()),
      proposed:missing.length?null:routeTravel(goal.keys,candidateHomes())};
  }).sort((a,b)=>b.currentCategories.length-a.currentCategories.length||
    (b.current?.edges||0)-(a.current?.edges||0));
}
export function audit(){
  const source=sourceHomes(),candidate=candidateHomes();
  const keys=new Set(source.map(x=>x.key)),domainKeys=DOMAINS.flatMap(x=>x.keys);
  const unique=new Set(domainKeys);
  const references=[
    ...GOALS.flatMap(goal=>goal.keys),
    ...GATES.flatMap(gate=>gate.keys),
    ...FINDINGS.flatMap(finding=>finding.keys)
  ];
  const dup=domainKeys.filter((k,i)=>domainKeys.indexOf(k)!==i);
  return {
    status:'SOURCE_INTEGRITY_AND_DECLARED_HYPOTHESES_NOT_A_HUMAN_STUDY',
    inventory:{categories:EDITOR_CATEGORIES.length,tools:source.length?EDITOR_CATEGORIES.reduce((n,c)=>n+c.tools.length,0):0,sourceKeys:keys.size,domainKeys:unique.size,candidateKeys:new Set(candidate.map(x=>x.key)).size,
      domains:DOMAINS.length,goals:GOALS.length,gates:GATES.length,workflows:WORKFLOWS.length,findings:FINDINGS.length},
    errors:[
      ...[...keys].filter(k=>!unique.has(k)).map(k=>'key missing domain: '+k),
      ...[...unique].filter(k=>!keys.has(k)).map(k=>'unknown domain key: '+k),
      ...dup.map(k=>'duplicate domain key: '+k),
      ...[...keys].filter(k=>!candidate.some(c=>c.key===k)).map(k=>'candidate missing key: '+k),
      ...references.filter(k=>!keys.has(k)).map(k=>'broken referenced key: '+k),
      ...GOALS.filter(g=>!g.terms.length).map(g=>'goal without search terms: '+g.id)
    ],
    nonScalarWorkflows:WORKFLOWS.filter(w=>w.kind!=='destination').length,
    absentWorkflowIds:WORKFLOWS.filter(w=>w.status==='missing').map(w=>w.id),
    crossCategoryGoals:relationshipAudit().filter(x=>x.currentCategories.length>1).map(x=>({
      id:x.id,categories:x.currentCategories.length,proposedCategories:x.proposedCategories.length
    })),
    resolvedFindings:FINDINGS.filter(f=>f.status==='resolved').map(f=>f.id),
    byPriority:Object.fromEntries(['P1','P2','P3'].map(p=>[p,FINDINGS.filter(f=>f.priority===p&&f.status!=='resolved').map(f=>f.id)]))
  };
}
export function report(){
  const inventory=audit();
  if(inventory.errors.length)throw new Error(inventory.errors.join('; '));
  const lines=['# ROYGBIV semantic / intent graph audit','','This is code inventory plus an authored causal and workflow model, **not human observation**.','',
    '## Coverage','',
    '- '+inventory.inventory.categories+' categories, '+inventory.inventory.tools+' tools, '+inventory.inventory.sourceKeys+' settings',
    '- '+inventory.inventory.domains+' visual domains; '+inventory.inventory.goals+' artistic goals; '+inventory.inventory.gates+' reviewed prerequisite groups; '+inventory.inventory.workflows+' workflows',
    '- '+inventory.inventory.findings+' findings (source-backed and explicit hypotheses).','',
    '## Creative goals bridging current categories','','| Goal | Current categories | Candidate categories | Current route edges | Candidate route edges |','|---|---:|---:|---:|---:|'];
  for(const goal of relationshipAudit())lines.push('| '+goal.id+' | '+goal.currentCategories.length+' | '+goal.proposedCategories.length+' | '+goal.current.edges+' | '+goal.proposed.edges+' |');
  lines.push('','## Issues to evaluate','','| ID | Priority | Status | Evidence level | Concern |','|---|---|---|---|---|');
  for(const finding of FINDINGS)lines.push('| '+finding.id+' | '+finding.priority+' | '+finding.status+' | '+finding.type+' | '+finding.title+' |');
  return lines.join('\n')+'\n';
}
export function command(argv=process.argv.slice(2)){
  const json=argv.includes('--json');
  const at=flag=>argv.indexOf(flag);
  let result;
  if(at('--setting')>=0)result=inspectSetting(argv[at('--setting')+1]);
  else if(at('--goal')>=0)result=findGoals(argv[at('--goal')+1]||'');
  else if(at('--mode')>=0){
    const [structure,regionMode='voronoi',construction='ribbon']=(argv[at('--mode')+1]||'paths').split(':');
    result=sceneTools(structure,regionMode,construction);
  }else if(at('--relationships')>=0)result=relationshipAudit();
  else if(at('--findings')>=0)result=FINDINGS;
  else if(at('--workflows')>=0)result=WORKFLOWS;
  else result=audit();
  if(argv.includes('--report'))return report();
  return JSON.stringify(result,null,json?2:2)+'\n';
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)
  process.stdout.write(command());
