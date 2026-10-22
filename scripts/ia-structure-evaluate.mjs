/**
 * Information architecture comparison for ROYGBIV, not a human usability test.
 *
 * Reports an unweighted TREE-TRAVEL PROXY between the known canonical
 * setting locations in the current editor and a hypothetical intention-led
 * structure. No real users, clicks, observed time, confidence or aesthetic
 * success are claimed. The proposed mapping is a hypothesis for tree testing.
 *
 * Usage: node scripts/ia-structure-evaluate.mjs [--json|--markdown]
 * No browser, screenshots, dependencies, GitHub actions or app changes.
 */
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {EDITOR_CATEGORIES} from '../src/editor-schema.js';
import {toolAppliesToScene} from '../src/editor-tool-applicability.js';

const CANDIDATE_ROWS = "Build|Design type|structure\nArrange|Rainbow groups|composition,repeatCount,repeatSpacing\nArrange|Direction and transforms|orientation,diagonalRotation,mirrorHorizontal,mirrorVertical\nForm|Path motion|geometry,shapeFrequency,shapeDepth,chaos,geometrySafety\nForm|Special paths and crossings|turnRadius,hairpinAngle,loopRadius,loopSweep,loopAspect,stepCount,chevronSharpness,crossingMode,pathLength,endTaper,extendDrawnPath\nForm|Stripe proportions|construction,stripeWidth,spread\nForm|Pattern and individuality|motif,lineStyle,patternHomogeneity,dotSize,dotSpacing,motifSize,motifFrequency,individuality,overridePatternHomogeneity\nForm|Radial forms|radialMode,rayCount,rayRotation,rayTwist,rayCoverage,rayCore,fieldCenterX,fieldCenterY\nForm|Regions|regionMode,regionCount,regionJitter,regionSides\nForm|Scattered objects|scatteredShapeKind,scatteredCount,scatteredMinSize,scatteredMaxSize,scatteredVariation,scatteredSpacing,scatteredEdgeCrop,scatteredOverlap\nColour|Palette and contrast|palette,reverseStripes,background,tonalContrast\nFinish|Edges|outline,gap,outlineBuffer,dividerColor,dividerWidth\nFinish|Texture 1|material,textureCoverage,textureBlend,textureStrength,textureScale,textureRotation\nFinish|Texture 2|textureLayer2Enabled,material2,textureCoverage2,textureBlend2,textureStrength2,textureScale2,textureRotation2\nFinish|Texture 3|textureLayer3Enabled,material3,textureCoverage3,textureBlend3,textureStrength3,textureScale3,textureRotation3\nFinish|Pigment and contour|textureDisplacement,brushRoughness\nFinish|Light and glow|lightingMood,lightDirection,lightStrength,shadowStrength,stripeShadowStrength,stripeShadowSoftness,stripeShadowDirection,glow";
const TASK_ROWS = "wilder-paths|paths||Make the rainbow twist and diverge while retaining its original motif|geometry,shapeFrequency,shapeDepth,chaos,individuality\ndotted-pattern|paths||Make smaller, denser dots with less uniformity among the stripes|motif,dotSize,dotSpacing,motifSize,motifFrequency,patternHomogeneity\nrays|radial||Make a twisting radial burst with an obvious empty centre and off-centre origin|radialMode,rayCount,rayTwist,rayCoverage,rayCore,fieldCenterX,fieldCenterY\nregions|regions||Make irregular stained-glass cells with bold separators|regionMode,regionCount,regionJitter,dividerColor,dividerWidth\nfabric|paths||Give the wallpaper two overlapping textile finishes|material,textureCoverage,textureStrength,textureScale,material2,textureBlend2,textureStrength2\nglowing|paths||Get neon glow with a soft local shadow and muted overall light|glow,stripeShadowStrength,stripeShadowSoftness,lightingMood,lightStrength\nstripe-width|paths||Use thicker stripes with larger gaps and understated borders|stripeWidth,spread,outline,gap,outlineBuffer\nfloating|paths||Make shorter separate floating bands, taper ends and adjust distribution|composition,pathLength,endTaper,stripeWidth,spread\ndiagonal|paths||Flip and rotate a diagonal rainbow while adjusting repeated group spacing|composition,repeatCount,repeatSpacing,orientation,diagonalRotation,mirrorHorizontal,mirrorVertical\npalette|paths||Switch to a white background and different colour story with reverse order|palette,background,reverseStripes\ntonal|paths|tonal|Give tonal stripes more contrast without changing the background|construction,tonalContrast,palette,background\ntexture-distortion|paths||Let an applied paper texture visibly disturb stripe contours|material,textureCoverage,textureStrength,textureDisplacement\nnested|regions|nested|Make nested polygon regions around an offset centre|regionMode,regionSides,fieldCenterX,fieldCenterY,dividerWidth\norbits|regions|scattered|Make seven varied rainbow circles, with adjustable spacing and off-frame crop|regionMode,scatteredShapeKind,scatteredCount,scatteredMinSize,scatteredMaxSize,scatteredVariation,scatteredSpacing,scatteredEdgeCrop,scatteredOverlap\nhairpin|paths||Make broad hairpin turns without losing stripe coherence|geometry,turnRadius,hairpinAngle,geometrySafety,crossingMode\nlayered-patterns|paths||Weave patterned stripes using crossings and rainbow repetitions|construction,motif,motifSize,patternHomogeneity,crossingMode,repeatCount,repeatSpacing\ntexture-light|paths||Soften coarse texture and warm the wallpaper lighting|material,textureScale,textureStrength,lightingMood,lightDirection,lightStrength";

const parseLines = text => text.trim().split('\n').map(line=>line.split('|'));
export const PROPOSED_GROUPS = Object.freeze(Object.fromEntries(
  [...new Set(parseLines(CANDIDATE_ROWS).map(row=>row[0]))].map(category=>[
    category,Object.freeze(Object.fromEntries(
      parseLines(CANDIDATE_ROWS).filter(row=>row[0]===category)
        .map(([,group,keys])=>[group,Object.freeze(keys.split(','))])
    ))
  ])
));
export const TASKS = Object.freeze(parseLines(TASK_ROWS)
  .map(([id,structure,variant,goal,keys])=>Object.freeze({
    id,structure,variant:variant||null,goal,keys:Object.freeze(keys.split(','))
  })));

export function sourceHomes(categories=EDITOR_CATEGORIES) {
  return categories.flatMap(category=>category.tools.flatMap(tool=>
    tool.settings.map(key=>({key,category:category.id,tool:tool.id,route:[category.label,tool.name]}))));
}
export function candidateHomes(groups=PROPOSED_GROUPS) {
  return Object.entries(groups).flatMap(([category,tools])=>
    Object.entries(tools).flatMap(([tool,keys])=>
      keys.map(key=>({key,category,tool,route:[category,tool]}))));
}
export function auditHomes(source=sourceHomes(),candidate=candidateHomes(),tasks=TASKS){
  const issues=[];
  const inventory=entries=>{
    const map=new Map();
    for(const entry of entries){
      if(map.has(entry.key))issues.push('duplicate home: '+entry.key);
      map.set(entry.key,entry);
    }
    return map;
  };
  const old=inventory(source),newHomes=inventory(candidate);
  for(const key of old.keys())if(!newHomes.has(key))issues.push('missing proposed home: '+key);
  for(const key of newHomes.keys())if(!old.has(key))issues.push('unknown proposed key: '+key);
  for(const task of tasks){
    if(!['paths','radial','regions'].includes(task.structure))
      issues.push('unknown scene structure in '+task.id);
    for(const key of task.keys){
      const home=old.get(key);
      if(!home){issues.push('unknown task key: '+key+' in '+task.id);continue;}
      const regionMode=task.variant==='nested'?'nested':task.variant==='scattered'?'scattered':'voronoi';
      const construction=task.variant==='tonal'?'tonal':'ribbon';
      if(!toolAppliesToScene({category:home.category,id:home.tool},{
        structure:task.structure,regionMode,construction
      }))issues.push('inactive task setting: '+key+' in '+task.id);
    }
  }
  return {valid:issues.length===0,issues,sourceKeys:old.size,candidateKeys:newHomes.size};
}

/** Fixed initial position: category/tool chooser is unopened inside Edit.
 * The proxy counts abstract up/down hierarchy edges, not real taps, time
 * or user search; unchanged tool cards cost 0 after their first opening.
 */
export function routeTravel(keys,homes){
  const entries=new Map(homes.map(home=>[home.key,home]));
  let previous=[],edges=0,categoryChanges=0,toolChanges=0;
  const visited=new Set();
  for(const key of keys){
    const entry=entries.get(key);
    if(!entry)throw new Error('Unknown route for key '+key);
    const current=entry.route;
    const firstCategory=previous.length>0&&previous[0]!==current[0];
    if(firstCategory)categoryChanges++;
    if(previous.length&&previous.join('/')!==current.join('/'))toolChanges++;
    let common=0;
    while(common<previous.length&&common<current.length&&previous[common]===current[common])common++;
    edges+=previous.length-common+current.length-common;
    visited.add(current[0]);
    previous=current;
  }
  return {edges,categoryChanges,toolChanges,distinctCategories:visited.size};
}
export function evaluate(tasks=TASKS,source=sourceHomes(),candidate=candidateHomes()){
  const audit=auditHomes(source,candidate,tasks);
  if(!audit.valid)throw new Error('Invalid IA evaluation: '+audit.issues.join('; '));
  const cases=tasks.map(task=>({
    ...task,current:routeTravel(task.keys,source),proposed:routeTravel(task.keys,candidate)
  }));
  const total=(key,metric)=>cases.reduce((sum,task)=>sum+task[key][metric],0);
  return {
    kind:'STRUCTURAL_ROUTE_PROXY_NOT_HUMAN_TEST',
    warning:'Hand-authored tasks and candidate groupings. No human first-click, success, time or aesthetic quality observations.',
    inventory:{source:source.length,proposed:candidate.length,taskCount:cases.length},
    totals:{
      current:{edges:total('current','edges'),categoryChanges:total('current','categoryChanges'),toolChanges:total('current','toolChanges')},
      proposed:{edges:total('proposed','edges'),categoryChanges:total('proposed','categoryChanges'),toolChanges:total('proposed','toolChanges')}
    },
    cases
  };
}
export function formatMarkdown(result=evaluate()){
  const lines=[
    '# ROYGBIV information-architecture structural route proxy',
    '',
    '**Important:** '+result.warning,
    '',
    '| Task (natural-language goal) | Current edges | Proposed edges | Current category switches | Proposed category switches |',
    '|---|---:|---:|---:|---:|'
  ];
  for(const task of result.cases)lines.push(
    '| '+task.goal+' | '+task.current.edges+' | '+task.proposed.edges+
    ' | '+task.current.categoryChanges+' | '+task.proposed.categoryChanges+' |'
  );
  lines.push('','**Totals (17 analyst-selected, fixed-order task sequences):** current '+
    result.totals.current.edges+' route edges and '+result.totals.current.categoryChanges+
    ' category switches; proposed '+result.totals.proposed.edges+' route edges and '+
    result.totals.proposed.categoryChanges+' category switches.',
    '',
    'These are algorithmic properties of the two authored trees and fixed sequences. They are *not* observed click counts, seconds saved, human success rate or a recommendation to deploy the proposed tree. A smaller proxy can coexist with worse menu-label findability or weaker artistic flow.',
    '');
  return lines.join('\n');
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  const result=evaluate();
  process.stdout.write(process.argv.includes('--json')?JSON.stringify(result,null,2)+'\n':formatMarkdown(result));
}
