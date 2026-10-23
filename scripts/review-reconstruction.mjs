#!/usr/bin/env node
/**
 * Opt-in R0 inverse-graphics baseline. Generates thirteen actual current
 * production-renderer PNGs and disposable metadata-free twins.
 *
 * node scripts/review-reconstruction.mjs --out-dir artifacts/reconstruction-r0
 * node scripts/review-reconstruction.mjs --list   # no browser/files required
 *
 * Truth is kept separately in .recipe.json and the manifest, NEVER read by
 * the inference UI. This script produces evidence to inspect, not approval.
 */
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {normalizeRecipe} from '../src/model.js';
import {RAINBOW_ORBITS} from '../src/scattered-composition.js';
import {compoundStitchRecipe} from './compound-stitch-fixture.mjs';
import {extractPngRecipe,stripPngDescriptiveMetadata,scanPngChunks} from '../src/png-metadata.js';

const exec=promisify(execFile);
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const renderer=fileURLToPath(new URL('./render-headless.mjs',import.meta.url));
const W=480,H=1040;
const fixed=Object.freeze({
  family:'studio',palette:'classic',background:'black',material:'none',
  motif:'solid',outline:'none',lightingMood:'off',glow:0,chaos:0,
  individuality:0,stripeShadowStrength:0,textureDisplacement:0,
  viewZoom:1,viewPanX:0,viewPanY:0,positionX:0,positionY:0
});
const satin=[{id:'reconstruction-r0-stitch',enabled:true,materialFamily:'embroidery',
  style:'satin-fibre',target:{scope:'all',role:'fill',ids:[],colorSlots:[]},
  pitch:5,relief:85,direction:38}];
export const RECONSTRUCTION_R0_CASES=Object.freeze([
  {id:'01-vertical-straight',goal:'Straight seven-band composition',
    recipe:{structure:'paths',geometry:'straight',orientation:'vertical',spread:52}},
  {id:'02-diagonal-straight',goal:'Diagonal crossing and negative space',
    recipe:{structure:'paths',geometry:'straight',orientation:'diagonal',
      diagonalRotation:24,spread:58,stripeWidth:75}},
  {id:'03-wave',goal:'Curved ribbon with separate pigments',
    recipe:{family:'currents',structure:'paths',geometry:'wave',orientation:'horizontal',
      shapeDepth:70,shapeFrequency:40,spread:70}},
  {id:'04-jagged',goal:'Jagged path with variable stripe edges',
    recipe:{structure:'paths',geometry:'jagged',orientation:'diagonal',
      shapeFrequency:68,shapeDepth:55,spread:50}},
  {id:'05-hairpin',goal:'Hairpin turn, close topology',
    recipe:{structure:'paths',geometry:'hairpin',orientation:'vertical',
      hairpinAngle:135,turnRadius:42,spread:38}},
  {id:'06-loop',goal:'Loop closure and crossing ambiguity',
    recipe:{structure:'paths',geometry:'loop',orientation:'vertical',
      loopRadius:56,loopSweep:355,spread:46}},
  {id:'07-drawn',goal:'Personally authored curved centreline, not exact procedural seed',
    recipe:{structure:'paths',geometry:'drawn',composition:'single',
      customPath:[[.1,.12],[.35,.20],[.74,.35],[.58,.58],[.25,.78],[.82,.91]],
      spread:38,geometrySafety:true}},
  {id:'08-radial-rays',goal:'Sevenfold radial geometry with asymmetry',
    recipe:{structure:'radial',radialMode:'sunburst',rayCount:21,
      rayRotation:35,rayTwist:20,rayCore:12}},
  {id:'09-radial-rings',goal:'Nested radial coloured rings',
    recipe:{structure:'radial',radialMode:'concentric',rayCount:21,
      fieldCenterX:55,fieldCenterY:46}},
  {id:'10-regions-nested',goal:'Nested discrete colour fields, not circles',
    recipe:{structure:'regions',regionMode:'nested',regionCount:14,
      dividerColor:'none',dividerWidth:0}},
  {id:'11-scattered-circles',goal:'Seven independently placed and sized colour circles',
    recipe:{...RAINBOW_ORBITS,seed:'r0-orbits',scatteredOverlap:'overlap',
      scatteredOverrides:[
        {index:0,x:.24,y:.16,radius:.16},
        {index:1,x:.79,y:.22,radius:.115},
        {index:2,x:.43,y:.35,radius:.20},
        {index:3,x:.75,y:.48,radius:.095},
        {index:4,x:.16,y:.62,radius:.14},
        {index:5,x:.60,y:.77,radius:.17},
        {index:6,x:.28,y:.91,radius:.105}]}},
  {id:'12-textured-embroidered',goal:'Material and fibre appearance beyond coarse geometry',
    recipe:{structure:'paths',geometry:'loop',orientation:'diagonal',
      stripeWidth:72,material:'linen-organic',
      textureStrength:48,textureDisplacement:20,
      surfaceTreatments:satin}},
  {id:'13-holed-shape',goal:'Compound shape with hole plus island, independently portable',
    recipe:compoundStitchRecipe('r0-donut-island')}
]);

export function baselineRecipe(item){
  return normalizeRecipe({...fixed,seed:'reconstruction-r0-'+item.id,...item.recipe});
}

export function readBaselineArgs(argv){
  const options={outDir:'artifacts/reconstruction-r0'};
  for(let i=0;i<argv.length;i++){
    const flag=argv[i];
    if(flag==='--help'||flag==='-h'){options.help=true;continue;}
    if(flag==='--list'){options.list=true;continue;}
    if(!['--out-dir','--browser','--only'].includes(flag)||!argv[i+1]||
      argv[i+1].startsWith('--'))throw Error('Unknown or incomplete argument: '+flag);
    options[flag==='--out-dir'?'outDir':'browser']=argv[++i];
  }
  return options;
}

const escapeHtml=value=>String(value).replace(/&/g,'&amp;')
  .replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;');

function equalImageChunks(a,b){
  const original=a.filter(chunk=>chunk.type==='IDAT');
  const copied=b.filter(chunk=>chunk.type==='IDAT');
  if(original.length!==copied.length)return false;
  return original.every((chunk,i)=>chunk.raw.length===copied[i].raw.length &&
    chunk.raw.every((value,k)=>value===copied[i].raw[k]));
}

async function generate(options){
  const destination=resolve(options.outDir);
  const selections=options.only?new Set(options.only.split(',').map(s=>s.trim())):null;
  if(selections?.size){
    const known=new Set(RECONSTRUCTION_R0_CASES.map(item=>item.id));
    for(const id of selections)if(!known.has(id))throw Error('Unknown R0 case: '+id);
  }
  const cases=selections?RECONSTRUCTION_R0_CASES.filter(item=>selections.has(item.id)):
    RECONSTRUCTION_R0_CASES;
  const filenames=['index.html','manifest.json',...cases.flatMap(item=>[
    item.id+'.png',item.id+'.no-metadata.png',item.id+'.recipe.json'])];
  // Treat evidence as immutable; any repeat run must choose a different path.
  for(const name of filenames){
    try{await access(join(destination,name));throw Error('Already exists: '+name);}
    catch(error){if(error.code!=='ENOENT')throw error;}
  }
  await mkdir(destination,{recursive:true});
  const records=[];
  for(const item of cases){
    const recipe=baselineRecipe(item),recipeName=item.id+'.recipe.json';
    const original=item.id+'.png',stripped=item.id+'.no-metadata.png';
    const originalPath=join(destination,original);
    await writeFile(join(destination,recipeName),JSON.stringify(recipe,null,2)+'\n');
    const args=['--recipe',join(destination,recipeName),
      '--width',String(W),'--height',String(H),'--out',originalPath];
    if(options.browser)args.push('--browser',options.browser);
    const run=await exec(process.execPath,[renderer,...args],
      {cwd:root,timeout:180000,maxBuffer:1024*1024});
    if(!run.stdout.includes('"file"'))throw Error('Production render was not confirmed: '+item.id);
    const originalBytes=new Uint8Array(await readFile(originalPath));
    const embedded=extractPngRecipe(originalBytes);
    if(JSON.stringify(embedded)!==JSON.stringify(recipe))
      throw Error('Source PNG recipe does not match reference: '+item.id);
    const anonymous=stripPngDescriptiveMetadata(originalBytes);
    if(extractPngRecipe(anonymous)!==null)throw Error('Recipe survived metadata removal');
    const source=scanPngChunks(originalBytes),clean=scanPngChunks(anonymous);
    if(source.width!==clean.width||source.height!==clean.height||
      !equalImageChunks(source.chunks,clean.chunks))
      throw Error('Source and evaluation IDAT differ: '+item.id);
    await writeFile(join(destination,stripped),anonymous);
    records.push({id:item.id,goal:item.goal,original,metadataFree:stripped,
      recipeFile:recipeName,seed:recipe.seed});
    console.log('Produced current source '+item.id+' with unmodified pixel stream');
  }
  const figures=records.map(item=>'<figure><img src="'+escapeHtml(item.metadataFree)+
    '" alt="'+escapeHtml(item.goal)+'"><figcaption><strong>'+escapeHtml(item.id)+
    '</strong><span>'+escapeHtml(item.goal)+'</span></figcaption></figure>').join('');
  const html='<!doctype html><html lang="en"><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>ROYGBIV R0 reconstruction source set</title>'+
    '<style>body{font:14px system-ui;background:#171721;color:#fff;margin:0;padding:22px}'+
    '.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}'+
    'figure{padding:8px;background:#30303b;border-radius:12px;margin:0}img{width:100%;display:block}'+
    'figcaption{display:grid;gap:4px;padding:8px 0}span{opacity:.8}</style>'+
    '<h1>Metadata-free real-render R0 evaluation inputs</h1>'+
    '<p>These images were produced by the current shared renderer. Import the metadata-free copy '+ 
    'into ROYGBIV; compare candidates with the separate source recipe file. '+ 
    'This is an unreviewed baseline, not evidence that recovery is accurate.</p>'+
    '<main class="gallery">'+figures+'</main></html>';
  await writeFile(join(destination,'index.html'),html);
  await writeFile(join(destination,'manifest.json'),JSON.stringify({
    schema:'roygbiv-reconstruction-r0/v1',status:'produced-not-reviewed',
    source:'current-production-renderer',width:W,height:H,
    evaluation:'metadata-free pixel-identical copies; recipe truth separate',
    externalExamples:'not supplied; never invented',
    reconstructionAccuracy:'not measured',items:records
  },null,2)+'\n');
  console.log('Review gallery: '+join(destination,'index.html'));
}

async function main(){
  const opts=readBaselineArgs(process.argv.slice(2));
  if(opts.help){console.log('node scripts/review-reconstruction.mjs [--out-dir path] [--browser Chromium-path] [--list]');return;}
  if(opts.list){for(const item of RECONSTRUCTION_R0_CASES)console.log(item.id+': '+item.goal);return;}
  await generate(opts);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main().catch(error=>{console.error('Reconstruction R0: '+error.message);process.exitCode=1;});
}
