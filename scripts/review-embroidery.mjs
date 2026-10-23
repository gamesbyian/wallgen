#!/usr/bin/env node
/**
 * Seven real production-rendered ROYGBIV embroidery comparisons, opt-in.
 * Three identical ribbon recipes (plain/satin/running) and four matching
 * scattered-region recipes (plain/tatami/running/single region targeted).
 * No screenshot CI and no artificial optical scores.
 *
 * node scripts/review-embroidery.mjs --out-dir artifacts/embroidery-review
 */
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {access,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {normalizeRecipe,resolveScene} from '../src/model.js';
import {compoundStitchRecipe} from './compound-stitch-fixture.mjs';

const exec=promisify(execFile);
const renderer=fileURLToPath(new URL('./render-headless.mjs',import.meta.url));
const root=resolve(dirname(renderer),'..');
const base=Object.freeze({
  seed:'stitch-art-review-001',family:'studio',palette:'classic',
  background:'black',motif:'solid',outline:'none',lightingMood:'off',
  material:'linen-soft',textureCoverage:'both',textureStrength:24,
  textureDisplacement:0,glow:0,stripeShadowStrength:0,
});
const ribbon=Object.freeze({
  structure:'paths',composition:'single',construction:'ribbon',
  lineStyle:'continuous',geometry:'loop',orientation:'diagonal',
  stripeWidth:72,spread:54,chaos:0,individuality:0
});
const region=Object.freeze({
  structure:'regions',regionMode:'scattered',scatteredShapeKind:'circle',
  scatteredCount:14,scatteredMinSize:16,scatteredMaxSize:55,
  scatteredOverlap:25,scatteredEdgeCrop:15
});
const cases=Object.freeze([
  {id:'00-ribbon-plain',name:'Loop ribbon · no stitches',scene:'ribbon'},
  {id:'01-ribbon-satin',name:'Loop ribbon · satin ribs',scene:'ribbon',style:'satin'},
  {id:'02-ribbon-running',name:'Loop ribbon · running seams',scene:'ribbon',style:'running'},
  {id:'03-regions-plain',name:'Scattered circles · no stitches',scene:'region'},
  {id:'04-regions-tatami',name:'Scattered circles · tatami',scene:'region',style:'tatami'},
  {id:'05-regions-running',name:'Scattered circles · running',scene:'region',style:'running'},
  {id:'06-one-region',name:'One authored circle · satin',scene:'region',
    style:'satin',targetId:'region-3'}
]);
const options=argv=>{
  const result={outDir:'artifacts/embroidery-review',seed:base.seed};
  for(let i=0;i<argv.length;i++){
    const flag=argv[i];
    if(flag==='--help'||flag==='-h'){result.help=true;continue;}
    if(flag==='--focus-soft-satin'){result.focusSoftSatin=true;continue;}
    if(flag==='--focus-compound'){result.focusCompound=true;continue;}
    if(flag==='--focus-chain'){result.focusChain=true;continue;}
    if(!['--out-dir','--seed','--browser'].includes(flag)||!argv[i+1]||
      argv[i+1].startsWith('--'))throw Error('Unknown or incomplete option '+flag);
    result[flag==='--out-dir'?'outDir':flag.slice(2)]=argv[++i];
  }
  return result;
};
const escapeHtml=value=>String(value).replace(/&/g,'&amp;')
  .replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function makeRecipe(study,seed){
  if(study.scene==='compound')return compoundStitchRecipe(seed,study.style);
  const treatment=study.style?[{
    id:'art-review-thread',enabled:true,style:study.style,materialFamily:'embroidery',
    target:study.targetId?{scope:'object',role:'fill',ids:[study.targetId],colorSlots:[]}:
      {scope:'all',role:'fill',ids:[],colorSlots:[]},
    pitch:5,relief:85,direction:38
  }]:null;
  const recipe=normalizeRecipe({...base,
    ...(study.scene==='ribbon'?ribbon:region),seed,
    ...(treatment?{surfaceTreatments:treatment}:{})
  });
  if(study.targetId&&!resolveScene(recipe).objects.some(object=>object.id===study.targetId))
    throw Error('Study target ID is not in scene: '+study.targetId);
  return recipe;
}
async function main(){
  const opts=options(process.argv.slice(2));
  if(opts.help){
    console.log('node scripts/review-embroidery.mjs [--out-dir folder] [--seed text] [--browser Chromium-path] [--focus-soft-satin|--focus-compound|--focus-chain]');
    return;
  }
  if(Number(!!opts.focusSoftSatin)+Number(!!opts.focusCompound)+
    Number(!!opts.focusChain)>1)
    throw Error('Choose only one focused embroidery review');
  const out=resolve(opts.outDir);
  const studies=opts.focusChain?[
    cases[0],{id:'10-ribbon-chain',name:'Loop ribbon · linked chain',scene:'ribbon',style:'chain'},
    cases[3],{id:'11-region-chain',name:'Scattered circles · linked chain',scene:'region',style:'chain'}
  ]:opts.focusCompound?[
    {id:'08-compound-plain',name:'Imported donut and island · plain',scene:'compound'},
    {id:'09-compound-tatami',name:'Imported donut and island · tatami',scene:'compound',style:'tatami'}
  ]:opts.focusSoftSatin?
    [cases[0],cases[1],{id:'07-ribbon-soft-satin',
      name:'Loop ribbon · soft satin',scene:'ribbon',style:'satin-soft'}]:cases;
  await mkdir(out,{recursive:true});
  // Never overwrite a user-reviewed comparison or a previous attempt.
  for(const file of ['index.html','manifest.json',
    ...studies.flatMap(study=>[study.id+'.png',study.id+'.recipe.json'])]){
    try{await access(join(out,file));throw Error('Review output exists: '+file);}
    catch(error){if(error.code!=='ENOENT')throw error;}
  }
  const records=[];
  for(const study of studies){
    const recipe=makeRecipe(study,opts.seed);
    const recipeFile=study.id+'.recipe.json';
    const imageFile=study.id+'.png';
    await writeFile(join(out,recipeFile),JSON.stringify(recipe,null,2)+'\n');
    const args=['--recipe',join(out,recipeFile),
      '--width','600','--height','1300','--out',join(out,imageFile)];
    if(opts.browser)args.push('--browser',opts.browser);
    const result=await exec(process.execPath,[renderer,...args],{
      cwd:root,timeout:180000,maxBuffer:1024*1024
    });
    if(!result.stdout.includes('"file"'))
      throw Error('Production renderer did not confirm output: '+study.id);
    records.push({...study,recipeFile,imageFile,recipe});
    console.log(study.id+': '+join(out,imageFile));
  }
  const figures=records.map(item=>'<figure><img src="'+escapeHtml(item.imageFile)+
    '" alt="'+escapeHtml(item.name)+'"><figcaption><b>'+escapeHtml(item.name)+
    '</b><span>'+escapeHtml(item.style||'Off')+'</span></figcaption></figure>').join('');
  const html=[
    '<!doctype html><html lang="en"><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>ROYGBIV embroidered artwork review</title>',
    '<style>body{background:#191a1c;color:#f5f5f5;font:14px system-ui,sans-serif;',
    'margin:0;padding:22px}h1{font-size:22px}p{max-width:78ch;line-height:1.5}',
    '.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px}',
    'figure{padding:8px;background:#2b2d30;border-radius:12px;margin:0}',
    'img{width:100%;display:block;border-radius:8px}',
    'figcaption{padding:8px 4px;display:grid;gap:4px}figcaption span{opacity:.72}</style>',
    '<h1>Embroidery · '+records.length+' production-rendered pictures</h1>',
    '<p>Within each scene group, only embroidery style and targeting differ.',
    ' Inspect path-following station continuity at loop crossings, region stitch',
    ' gaps, visible weave, clipping at circular edges, background preservation and',
    ' whether single-object targeting leaves every other colour untreated.',
    ' This is an opt-in artwork review, not CI or a claim of physical realism.',
    ' Embedded PNG recipes match the adjacent JSON sidecars.</p>',
    '<main class="gallery">',figures,'</main></html>',
  ].join('');
  await writeFile(join(out,'index.html'),html);
  await writeFile(join(out,'manifest.json'),JSON.stringify({
    schema:'roygbiv-embroidery-art-review/v1',
    comparison:opts.focusChain?'linked-chain-four':
      opts.focusCompound?'imported-compound-hole':
      opts.focusSoftSatin?'soft-satin-versus-legacy':'seven-stitch-styles',
    status:'produced-awaiting-actual-visual-review',
    width:600,height:1300,seed:opts.seed,base,ribbon,region,items:records
  },null,2)+'\n');
  console.log('Inspect '+join(out,'index.html'));
}
main().catch(error=>{console.error('Embroidery review: '+error.message);process.exitCode=1;});
