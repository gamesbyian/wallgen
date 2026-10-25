#!/usr/bin/env node
// Opt-in genuine canonical artwork: seven independently shaped ROYGBIV
// objects, with one subtractive hole and one detached island, not SVG mocks.
import {writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {normalizeRecipe,resolveScene} from '../src/model.js';
import {GEOMETRY_SNAPSHOT_SCHEMA} from '../src/geometry-asset.js';

const box=[0,0,100,100];
const polygon=(outer,holes=[],island=null)=>({
  type:'compound-region',space:'asset-local',viewBox:box,
  fillRule:'evenodd',
  components:[{outer,holes},...(island?[{outer:island,holes:[]}]:[])]
});
const specimens=[
  polygon([[10,10],[70,10],[70,90],[10,90]],
    [[[28,36],[50,36],[50,63],[28,63]]],
    [[80,43],[95,43],[95,57],[80,57]]),
  polygon([[50,8],[94,90],[6,90]]),
  polygon([[50,5],[95,37],[78,95],[22,95],[5,37]]),
  polygon([[15,8],[84,8],[94,50],[82,92],[16,92],[6,50]]),
  polygon([[12,16],[88,16],[70,84],[30,84]]),
  polygon([[7,38],[38,7],[92,38],[62,92],[17,80]]),
  polygon([[12,8],[89,8],[89,88],[12,88],[12,58],[40,58],[40,38],[12,38]])
];
export function perHueProofRecipe(){
  const placements=[[.16,.18],[.50,.18],[.84,.18],
    [.16,.49],[.50,.49],[.84,.49],[.50,.80]];
  return normalizeRecipe({
    seed:'per-hue-fidelity-proof-20261025',family:'studio',palette:'classic',
    background:'black',structure:'regions',regionMode:'scattered',
    material:'none',photoLook:{enabled:false},lightingMood:'off',
    stripeShadowStrength:0,glow:0,outline:'none',
    scatteredShapeKind:'imported',scatteredCount:7,
    scatteredMinSize:0,scatteredSpacing:0,scatteredOverlap:'overlap',
    scatteredOverrides:placements.map(([x,y],index)=>
      ({index,x,y,radius:.115})),
    scatteredShapeOverrides:specimens.map((geometry,index)=>({
      index,shape:{schema:GEOMETRY_SNAPSHOT_SCHEMA,version:1,geometry}
    })),dividerColor:'none',dividerWidth:0
  });
}
async function main(){
  const out=resolve(process.argv[2]||'artifacts/per-hue-shapes');
  const recipe=perHueProofRecipe();
  const objects=resolveScene(recipe).objects;
  if(objects.length!==7||objects.some((o,i)=>o.colorIndex!==i||
    !o.rings?.length||o.circle))throw Error('Unexpected canonical per-hue scene');
  await mkdir(out,{recursive:true});
  await writeFile(join(out,'recipe.json'),JSON.stringify(recipe,null,2)+'\n');
  console.log(JSON.stringify({out,objects:objects.map(o=>({id:o.id,
    slot:o.colorIndex,rings:o.rings.length,vertices:o.vertices.length}))}));
}
if(process.argv[1]&&/review-per-hue-shapes\.mjs$/.test(process.argv[1]))
  main().catch(error=>{console.error(error);process.exitCode=1;});
