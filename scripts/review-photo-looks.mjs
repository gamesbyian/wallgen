#!/usr/bin/env node
/**
 * Seven intentionally chosen production-rendered Photo comparisons.
 * Manual art review only: NOT a CI matrix, screenshot factory or benchmark.
 * Requires the same opt-in Playwright/Chromium as render-headless.mjs.
 *
 * node scripts/review-photo-looks.mjs --out-dir artifacts/photo-review
 */
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {access,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {normalizeRecipe} from '../src/model.js';

const exec=promisify(execFile);
const renderer=fileURLToPath(new URL('./render-headless.mjs',import.meta.url));
const root=resolve(dirname(renderer),'..');
const base=Object.freeze({
  family:'studio',structure:'paths',orientation:'diagonal',geometry:'wave',
  motif:'solid',outline:'none',palette:'classic',background:'black',
  stripeWidth:68,spread:68,chaos:24,individuality:10,
  material:'none',textureStrength:0,textureLayer2Enabled:false,
  textureLayer3Enabled:false,glow:0,lightingMood:'off',
  stripeShadowStrength:0
});
const cases=Object.freeze([
  {id:'00-original',name:'Untreated original',presetId:null},
  {id:'01-slide',name:'Slide-film colour',presetId:'film-slide',amount:85},
  {id:'02-muted-print',name:'Muted negative print',presetId:'film-negative',amount:85},
  {id:'03-grain-only',name:'Film grain only',presetId:'film-grain-only',
    amount:100,parameters:{grain:75}},
  {id:'04-warm-halation',name:'Warm halation only',presetId:'film-halation-only',
    amount:100,parameters:{grain:0,halation:100}},
  {id:'05-smartphone-hdr',name:'Smartphone HDR inspired',presetId:'camera-hdr',amount:85},
  {id:'06-webcam-signal',name:'Low-resolution webcam capture',
    presetId:'camera-webcam-signal',amount:95,parameters:{grain:5}},
]);
function args(argv){
  const values={outDir:'artifacts/photo-review',seed:'photo-review-001'};
  for(let i=0;i<argv.length;i++){
    const key=argv[i];
    if(key==='--help'||key==='-h'){values.help=true;continue;}
    if(!['--out-dir','--seed','--browser'].includes(key)||!argv[i+1]||
      argv[i+1].startsWith('--'))throw Error('Unknown or missing option '+key);
    values[key==='--out-dir'?'outDir':key.slice(2)]=argv[++i];
  }
  return values;
}
function safe(value){
  return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
async function main(){
  const opts=args(process.argv.slice(2));
  if(opts.help){
    console.log('Usage: node scripts/review-photo-looks.mjs [--out-dir folder] [--seed text] [--browser Chromium-path]');
    return;
  }
  const out=resolve(opts.outDir);
  await mkdir(out,{recursive:true});
  for(const file of ['index.html','manifest.json',
    ...cases.flatMap(c=>[c.id+'.png',c.id+'.recipe.json'])]){
    try{
      await access(join(out,file));
      throw Error('Review output already exists: '+file+'. Use a new --out-dir.');
    }catch(error){if(error.code!=='ENOENT')throw error;}
  }
  const records=[];
  for(const study of cases){
    const recipe=normalizeRecipe({...base,seed:opts.seed,
      ...(study.presetId?{photoLook:{enabled:true,presetId:study.presetId,
        amount:study.amount,parameters:study.parameters||{}}}:{})
    });
    const recipeFile=study.id+'.recipe.json';
    const imageFile=study.id+'.png';
    const source=join(out,recipeFile),image=join(out,imageFile);
    // Send EXACT serialized source to the production renderer and keep it
    // next to its output. Never approximate it with hand-written --set flags.
    await writeFile(source,JSON.stringify(recipe,null,2)+'\n');
    const flags=['--recipe',source,'--width','600','--height','1300','--out',image];
    if(opts.browser)flags.push('--browser',opts.browser);
    const result=await exec(process.execPath,[renderer,...flags],{
      cwd:root,maxBuffer:1024*1024,timeout:180000
    });
    if(!result.stdout.includes('"file"'))
      throw Error('Headless renderer did not confirm PNG: '+study.id);
    records.push({...study,imageFile,recipeFile,recipe});
    console.log(study.id+': '+image);
  }
  const gallery=records.map(record=>'<figure><img src="'+safe(record.imageFile)+
    '" alt="'+safe(record.name)+'"><figcaption><b>'+safe(record.name)+
    '</b><span>'+safe(record.presetId||'no Photo look')+'</span></figcaption></figure>').join('');
  const html=[
    '<!doctype html><html lang="en"><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>ROYGBIV Photo treatment review</title>',
    '<style>body{font:14px system-ui,sans-serif;background:#19191e;color:#f6edf8;',
    'margin:0;padding:22px}h1{font-size:22px}p{max-width:75ch;line-height:1.5}',
    '.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));',
    'gap:15px}figure{margin:0;padding:8px;background:#282833;border-radius:12px}',
    'img{width:100%;display:block;border-radius:8px}',
    'figcaption{padding:8px 4px;display:grid;gap:4px}',
    'figcaption span{opacity:.78;font-size:12px}</style>',
    '<h1>Photo finishing · seven-image production review</h1>',
    '<p>Seven real ROYGBIV wallpapers (600 × 1300), one seed and identical base geometry.',
    ' Compare every Photo finish against the untreated original. Inspect edge glow around',
    ' yellow/green ribbons, grain scale, crushed blacks, HDR overprocessing, webcam',
    ' resolution/chroma loss and colour identity. This is not an automatic aesthetic score.',
    ' Every PNG includes its exact matching stored recipe.</p>',
    '<main class="gallery">',gallery,'</main></html>',
  ].join('');
  await writeFile(join(out,'index.html'),html);
  await writeFile(join(out,'manifest.json'),JSON.stringify({
    schema:'roygbiv-photo-art-review/v1',status:'produced-awaiting-human-review',
    seed:opts.seed,width:600,height:1300,base,items:records
  },null,2)+'\n');
  console.log('Open '+join(out,'index.html')+' to examine the pictures.');
}
main().catch(error=>{console.error('Photo review: '+error.message);process.exitCode=1;});
