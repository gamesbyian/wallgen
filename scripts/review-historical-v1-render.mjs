#!/usr/bin/env node
/**
 * Exactly two original 2026-10-17 ROYGBIV renderer outputs (off/on shadow),
 * generated inside Chromium from pinned, UNCHANGED historical source.
 * No modern normalizeRecipe, render adapter, PNG writer or visual migration.
 *
 * python3 -m http.server 4173 --bind 127.0.0.1 &
 * node scripts/review-historical-v1-render.mjs --out-dir artifacts/v1-shadow-golden
 *
 * Requires locally installed Playwright/Chromium; never runs in standard CI.
 */
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {normalizeRecipe as v1Normalize} from '../docs/recipe-format-history/source-era/v1-37428b/src/model.js';
import {embedPngMetadata as v1PngWriter} from '../docs/recipe-format-history/source-era/v1-37428b/src/png-metadata.js';
import {readRawPngRecipe,scanPngChunks} from '../src/png-metadata.js';
import {inspectPngMigration} from '../src/png-recipe-migration.js';

const opts={outDir:'artifacts/v1-shadow-golden',url:'http://127.0.0.1:4173'};
for(let i=2;i<process.argv.length;i++){
  const key=process.argv[i];
  if(key==='--help'||key==='-h'){
    console.log('node scripts/review-historical-v1-render.mjs [--out-dir folder] [--url http://127.0.0.1:4173] [--browser Chromium-path]');
    process.exit(0);
  }
  if(!['--out-dir','--url','--browser'].includes(key)||!process.argv[i+1])
    throw Error('Unknown or incomplete argument '+key);
  opts[key==='--out-dir'?'outDir':key.slice(2)]=process.argv[++i];
}
const cases=[
  {id:'v1-shadow-off',shadow:false},
  {id:'v1-shadow-on',shadow:true}
];
const source=Object.freeze({
  seed:'historical-v1-shadow-image-001',family:'studio',
  orientation:'diagonal',geometry:'wave',motif:'solid',palette:'classic',
  outline:'none',material:'none',background:'black',lightingMood:'off',
  stripeWidth:75,spread:56,chaos:23,individuality:0,
  stripeShadowStrength:45,stripeShadowSoftness:55
});
const out=resolve(opts.outDir);
await mkdir(out,{recursive:true});
for(const file of ['manifest.json','index.html',
  ...cases.flatMap(c=>[c.id+'.png',c.id+'.recipe.json'])]){
  try{await access(join(out,file));throw Error('Output exists: '+file);}
  catch(error){if(error.code!=='ENOENT')throw error;}
}
const {chromium}=await import('playwright');
const browser=await chromium.launch({headless:true,
  ...(opts.browser?{executablePath:opts.browser}:{})});
const reports=[];
try{
  const page=await browser.newPage({viewport:{width:700,height:1400},
    deviceScaleFactor:1,reducedMotion:'reduce'});
  await page.goto(opts.url,{waitUntil:'domcontentloaded',timeout:20000});
  for(const item of cases){
    const original={...source,stripeShadowEnabled:item.shadow};
    const normalized=v1Normalize(original);
    // Import the v1 renderer and model in the *browser*, from the archived
    // source directory. The canvas is 600x1300 but v1 writer (truthfully for
    // its era) reports 3024x6552 native output in JSON.
    const rendered=await page.evaluate(async raw=>{
      const model=await import('/docs/recipe-format-history/source-era/v1-37428b/src/model.js');
      const renderer=await import('/docs/recipe-format-history/source-era/v1-37428b/src/renderer.js');
      const canvas=document.createElement('canvas');
      canvas.width=600;canvas.height=1300;
      renderer.drawWallpaper(canvas,model.normalizeRecipe(raw));
      return {dataUrl:canvas.toDataURL('image/png'),width:canvas.width,height:canvas.height};
    },original);
    const png=Buffer.from(rendered.dataUrl.split(',')[1],'base64');
    const historic=v1PngWriter(png,{}, {recipe:original});
    const parsed=readRawPngRecipe(historic);
    if(parsed.selected?.format!=='roygbiv-recipe-v1'||
      JSON.stringify(parsed.selected.rawRecipe)!==JSON.stringify(normalized)||
      parsed.width!==600||parsed.height!==1300||
      inspectPngMigration(historic).safe)
      throw Error('Historical provenance or migration-refusal mismatch: '+item.id);
    const image=item.id+'.png',recipe=item.id+'.recipe.json';
    await writeFile(join(out,image),historic);
    await writeFile(join(out,recipe),JSON.stringify(normalized,null,2)+'\n');
    const chunks=scanPngChunks(historic).chunks.filter(x=>x.type==='IDAT');
    reports.push({...item,image,recipe,bytes:historic.length,
      ihdr:{width:parsed.width,height:parsed.height},
      originalEnvelopeOutput:parsed.selected.envelope.output,
      idatSha256:createHash('sha256').update(Buffer.concat(chunks.map(x=>Buffer.from(x.data)))).digest('hex'),
      rendererGitBlobSha:'5c12b7c505e7044db6a6ca04ddd31938ffd7f05b'});
    console.log(item.id+': '+join(out,image));
  }
  await page.close();
}finally{await browser.close();}
const html='<!doctype html><html lang="en"><meta charset="utf-8">'+
  '<meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<title>Original ROYGBIV PNG v1 painter, Oct 17 2026</title>'+
  '<style>body{font:14px system-ui;background:#171717;color:#fafafa;padding:18px}'+
  'main{display:flex;flex-wrap:wrap;gap:16px}img{width:260px;max-width:42vw}'+
  'figure{margin:0}figcaption{padding:8px}</style>'+
  '<h1>Authentic first-v1 painter, same art with original shadow off/on</h1>'+
  '<p>Only exact first-v1 model, renderer and exporter were used. These are 600x1300 previews,'+
  ' not image-parity proof for every saved v1 wallpaper, and NOT modern metadata migrations.</p>'+
  '<main>'+reports.map(item=>'<figure><img src="'+item.image+'" alt="'+item.id+'"><figcaption>'+
    item.id+'</figcaption></figure>').join('')+'</main></html>';
await writeFile(join(out,'index.html'),html);
await writeFile(join(out,'manifest.json'),JSON.stringify({
  schema:'roygbiv-source-era-png-v1-render-proof/v1',
  sourceCommit:'37428b624e55a0d4526b992bfe6fdf4a01b5f420',
  engine:'original renderer + original model + original PNG exporter',
  status:'actual-original-v1-browser-render; no modern visual equivalence established',
  source,width:600,height:1300,reports
},null,2)+'\n');
console.log('Inspect '+join(out,'index.html'));
