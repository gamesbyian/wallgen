#!/usr/bin/env node
// TEMPORARY PR-only source-art comparison. Delete after inspecting outputs.
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {normalizeRecipe} from '../src/model.js';
import {compoundStitchRecipe} from './compound-stitch-fixture.mjs';

const out=resolve(process.argv[2]||'/tmp/agent2-stack-art');
mkdirSync(out,{recursive:true});
const seed='stitch-art-review-001';
const source={
  seed,family:'studio',structure:'paths',composition:'single',
  construction:'ribbon',lineStyle:'continuous',geometry:'loop',
  orientation:'diagonal',stripeWidth:72,spread:54,chaos:0,
  individuality:0,motif:'solid',palette:'classic',outline:'none',
  background:'black',lightingMood:'off',glow:0,stripeShadowStrength:0
};
const materials={
  material:'linen-organic',textureCoverage:'both',textureStrength:50,
  textureScale:43,textureDisplacement:32,textureRotation:0,
  textureLayer2Enabled:true,material2:'watercolor',textureCoverage2:'background',
  textureStrength2:20,textureScale2:62,textureRotation2:31,
  textureLayer3Enabled:true,material3:'stone',textureCoverage3:'stripes',
  textureStrength3:12,textureScale3:40,textureRotation3:145
};
const thread=style=>[{
  id:'art-stack-thread',enabled:true,materialFamily:'embroidery',style,
  target:{scope:'all',role:'fill',colorSlots:[],ids:[]},
  pitch:5,relief:85,direction:38
}];
const photo=presetId=>({enabled:true,presetId,amount:80});
const plain=normalizeRecipe({...source,...materials});
const chain=normalizeRecipe({...source,...materials,surfaceTreatments:thread('chain')});
const items=[
  ['00-mixed-material',plain],
  ['01-mixed-material-chain',chain],
  ['02-mixed-material-chain-wide-film',normalizeRecipe({
    ...source,...materials,surfaceTreatments:thread('chain'),
    photoLook:photo('film-halation-diffusion')
  })],
  ['03-mixed-material-satin-fibre-digicam',normalizeRecipe({
    ...source,...materials,surfaceTreatments:thread('satin-fibre'),
    photoLook:photo('camera-digicam-signal')
  })],
  ['04-compound-chain-wide-film',normalizeRecipe({
    ...compoundStitchRecipe(seed,'chain'),
    material:'linen-organic',textureCoverage:'stripes',textureStrength:32,
    textureScale:43,textureDisplacement:20,
    photoLook:photo('film-halation-diffusion')
  })]
];
for(const [id,recipe] of items){
  const recipePath=join(out,id+'.recipe.json'),pngPath=join(out,id+'.png');
  writeFileSync(recipePath,JSON.stringify(recipe,null,2)+'\n');
  execFileSync(process.execPath,[
    'scripts/render-headless.mjs','--recipe',recipePath,
    '--width','600','--height','1300','--out',pngPath,
    ...(['02-mixed-material-chain-wide-film',
      '03-mixed-material-satin-fibre-digicam'].includes(id)?
      ['--verify-photo-stream']:[])
  ],{stdio:'inherit',timeout:150000});
}
writeFileSync(join(out,'manifest.json'),JSON.stringify({
  source:'actual current main renderer',seed,width:600,height:1300,
  status:'generated-awaiting-independent-image-review',
  items:items.map(([id,recipe])=>({id,recipe,recipeFile:id+'.recipe.json',imageFile:id+'.png'}))
},null,2)+'\n');
