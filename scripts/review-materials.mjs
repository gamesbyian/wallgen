#!/usr/bin/env node
/**
 * A deliberately small ART review, not a CI matrix.
 * Use the unchanged production headless renderer to produce seven wallpaper
 * PNGs from three materials and two seeds, plus one texture-free control.
 * Requires Playwright + Chromium, as does scripts/render-headless.mjs.
 *
 * node scripts/review-materials.mjs --out-dir artifacts/material-review
 * node scripts/review-materials.mjs --browser /usr/bin/chromium
 */
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir,access,writeFile} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {normalizeRecipe} from '../src/model.js';
const exec=promisify(execFile);
const renderer=fileURLToPath(new URL('./render-headless.mjs',import.meta.url));
const root=resolve(dirname(renderer),'..');
const materialKinds=['watercolor','linen','concrete'];
const seeds=['material-study-rose','material-study-blue'];
const base=Object.freeze({
  family:'studio',structure:'paths',orientation:'diagonal',geometry:'wave',
  motif:'solid',outline:'none',palette:'classic',background:'white',
  textureCoverage:'both',textureScale:43,textureStrength:72,
  textureDisplacement:68,lightingMood:'off'
});
function options(argv){
  const o={outDir:'artifacts/material-review'};
  for(let i=0;i<argv.length;i++){
    const k=argv[i];
    if(k==='--help'){o.help=true;continue;}
    if(k==='--focus-organic'){o.focusOrganic=true;continue;}
    if(!['--out-dir','--browser'].includes(k))throw Error('Unknown argument: '+k);
    if(!argv[i+1]||argv[i+1].startsWith('--'))throw Error('Missing value for '+k);
    o[k==='--out-dir'?'outDir':'browser']=argv[++i];
  }
  return o;
}
const esc=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;')
  .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
async function main(){
  const args=options(process.argv.slice(2));
  if(args.help){
    console.log('node scripts/review-materials.mjs [--out-dir path] [--browser Chromium-path] [--focus-organic]');
    return;
  }
  const out=resolve(args.outDir);
  await mkdir(out,{recursive:true});
  const cases=args.focusOrganic?[
    {id:'linen-original-68',material:'linen',seed:seeds[0]},
    {id:'linen-soft-68',material:'linen-soft',seed:seeds[0]},
    {id:'linen-organic-68',material:'linen-organic',seed:seeds[0]},
    {id:'linen-organic-20',material:'linen-organic',seed:seeds[0],displacement:20},
  ]:[
    {id:'00-no-texture',material:'none',seed:seeds[0]},
    ...materialKinds.flatMap(material=>seeds.map((seed,i)=>({
      id:material+'-'+(i+1),material,seed
    })))
  ];
  // Refuse to overwrite an earlier user's reference comparison.
  for(const c of cases)for(const extension of ['.png','.recipe.json']){
    try{await access(join(out,c.id+extension));
      throw Error('Output exists: '+c.id+extension+'. Use a new --out-dir to preserve it.');
    }catch(e){if(e.code!=='ENOENT')throw e;}
  }
  const records=[];
  for(const c of cases){
    const recipe=normalizeRecipe({...base,
      seed:c.seed,material:c.material,
      ...(c.displacement!==undefined?{textureDisplacement:c.displacement}:{}),
      ...(c.material==='none'?{textureStrength:0,textureDisplacement:0}:{}),
    });
    const png=join(out,c.id+'.png');
    const recipeFile=c.id+'.recipe.json';
    const recipePath=join(out,recipeFile);
    // Pass the EXACT same complete normalized recipe to the painter that
    // appears in our manifest. Command-line --set reconstruction can silently
    // omit a crucial setting (notably material), yielding mislabelled samples.
    await writeFile(recipePath,JSON.stringify(recipe,null,2)+'\n');
    const opts=['--recipe',recipePath,'--width','480','--height','1040',
      '--out',png];
    if(args.browser)opts.push('--browser',args.browser);
    const result=await exec(process.execPath,[renderer,...opts],{
      cwd:root,maxBuffer:1024*1024,timeout:120000
    });
    if(!result.stdout.includes('"file"'))throw Error('Production renderer returned no PNG details: '+c.id);
    records.push({...c,filename:c.id+'.png',recipeFile,recipe});
    console.log(c.id+': '+png);
  }
  const cards=records.map(c=>`<figure><img src="${esc(c.filename)}" alt="${esc(c.material+' texture, '+c.seed)}"><figcaption><b>${esc(c.material)}</b> · ${esc(c.seed)}</figcaption></figure>`).join('');
  const html=`<!doctype html><html lang="en"><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>ROYGBIV seven-sample material review</title>
    <style>body{font:14px system-ui,sans-serif;background:#181820;color:#f8edf8;
      margin:0;padding:24px}h1{font-size:22px}p{max-width:70ch;line-height:1.55}
      .gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px}
      figure{margin:0;background:#282633;padding:8px;border-radius:12px}
      img{width:100%;display:block;border-radius:8px}figcaption{padding:10px 4px}
    </style><h1>Material review · 3 finishes × 2 seeds + bare control</h1>
    <p>These are production-rendered wallpapers (480 × 1040), not simulated swatches.
    Look for regular marks, obvious seams, implausible ridges and whether the two
    seeds feel naturally different. The other recipe controls are identical.
    PNGs include restorable recipe metadata. This is an artistic review, not CI.</p>
    <main class="gallery">${cards}</main></html>`;
  await writeFile(join(out,'index.html'),html);
  await writeFile(join(out,'manifest.json'),JSON.stringify({
    schema:'roygbiv-material-art-review/v1',status:'produced-for-human-review',
    comparison:args.focusOrganic?'four-organic-linen-same-seed':'original-seven',
    width:480,height:1040,controls:base,items:records
  },null,2)+'\n');
  console.log('Review '+join(out,'index.html'));
}
main().catch(e=>{console.error('Material review: '+e.message);process.exitCode=1;});
