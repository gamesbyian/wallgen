#!/usr/bin/env node
/**
 * First-v1 vs contemporary *visual* experiment only. No PNG conversion.
 * Repaints the source-era fixture using the immutable 37428b model/renderer
 * and writer. The modern candidate is rendered separately and never embedded
 * into or substituted for the original PNG.
 *
 * python3 -m http.server 4173 --bind 127.0.0.1 &
 * node scripts/review-historical-v1-parity.mjs --out-dir artifacts/v1-parity
 *
 * Optional Playwright/Chromium. Deliberately excluded from check:quick.
 */
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {normalizeRecipe as firstNormalize} from
  '../docs/recipe-format-history/source-era/v1-37428b/src/model.js';
import {embedPngMetadata as firstWriter} from
  '../docs/recipe-format-history/source-era/v1-37428b/src/png-metadata.js';
import {readRawPngRecipe,scanPngChunks} from '../src/png-metadata.js';
import {inspectPngMigration} from '../src/png-recipe-migration.js';
import {firstV1PreviewCandidate} from './historical-v1-preview-candidate.mjs';

const opts={outDir:'artifacts/v1-parity',url:'http://127.0.0.1:4173'};
for(let i=2;i<process.argv.length;i++){
  const flag=process.argv[i];
  if(flag==='--help'||flag==='-h'){
    console.log('node scripts/review-historical-v1-parity.mjs [--out-dir folder] [--url http://127.0.0.1:4173] [--browser Chromium-path]');
    process.exit(0);
  }
  if(!['--out-dir','--url','--browser'].includes(flag)||!process.argv[i+1])
    throw Error('Unknown/incomplete flag '+flag);
  opts[flag==='--out-dir'?'outDir':flag.slice(2)]=process.argv[++i];
}
const manifest=JSON.parse(await readFile(
  new URL('../docs/recipe-format-history/source-era/v1-37428b/SHADOW-IMAGE-GOLDENS.json',import.meta.url),'utf8'));
if(manifest.sourceCommit!=='37428b624e55a0d4526b992bfe6fdf4a01b5f420'||
  manifest.samples.length!==2||manifest.actualIhdr.width!==600||
  manifest.actualIhdr.height!==1300)
  throw Error('Unrecognized first-v1 golden provenance');
const out=resolve(opts.outDir);
await mkdir(out,{recursive:true});
const outputNames=['manifest.json','index.html',
  ...manifest.samples.flatMap(s=>[s.id+'-original-v1.png',s.id+'-modern-PREVIEW.png'])];
for(const file of outputNames){
  try{await access(join(out,file));throw Error('Refusing to replace '+file);}
  catch(e){if(e.code!=='ENOENT')throw e;}
}
const {chromium}=await import('playwright');
const browser=await chromium.launch({headless:true,
  ...(opts.browser?{executablePath:opts.browser}:{})});
const reports=[];
try{
  const page=await browser.newPage({viewport:{width:700,height:1400},
    deviceScaleFactor:1,reducedMotion:'reduce'});
  await page.goto(opts.url,{waitUntil:'domcontentloaded',timeout:20000});
  for(const sample of manifest.samples){
    // The original writer takes input normalized with the original model;
    // source-era bytes are never passed through the modern model.
    const original=firstNormalize({...manifest.source,
      stripeShadowEnabled:sample.enabled});
    const preview=firstV1PreviewCandidate(original);
    const result=await page.evaluate(async ({original,candidate})=>{
      const old=await import('/docs/recipe-format-history/source-era/v1-37428b/src/renderer.js');
      const modern=await import('/src/renderer.js');
      const initial=await import('/docs/recipe-format-history/source-era/v1-37428b/src/model.js');
      const current=await import('/src/model.js');
      const paint=(renderer,model,recipe)=>{
        const canvas=document.createElement('canvas');
        canvas.width=600;canvas.height=1300;
        renderer.drawWallpaper(canvas,model.normalizeRecipe(recipe));
        return canvas;
      };
      const oldCanvas=paint(old,initial,original);
      const modernCanvas=paint(modern,current,candidate);
      const a=oldCanvas.getContext('2d').getImageData(0,0,600,1300).data;
      const b=modernCanvas.getContext('2d').getImageData(0,0,600,1300).data;
      let exact=0,diffOver2=0,blackSource=0,blackChanged=0;
      let sum=0,max=0,alphaDifferent=0;
      for(let pixel=0;pixel<600*1300;pixel++){
        const p=pixel*4;
        let channelMax=0;
        for(let channel=0;channel<3;channel++){
          const d=Math.abs(a[p+channel]-b[p+channel]);
          channelMax=Math.max(channelMax,d);sum+=d;max=Math.max(max,d);
        }
        if(channelMax===0)exact++;
        if(channelMax>2)diffOver2++;
        if(a[p]===0&&a[p+1]===0&&a[p+2]===0){
          blackSource++;
          if(channelMax>2)blackChanged++;
        }
        if(a[p+3]!==b[p+3])alphaDifferent++;
      }
      return {
        originalPng:oldCanvas.toDataURL('image/png'),
        previewPng:modernCanvas.toDataURL('image/png'),
        metrics:{pixels:600*1300,exactRgbPixels:exact,pixelsDiffOver2:diffOver2,
          meanAbsRgb:sum/(600*1300*3),maxChannelDifference:max,
          originalBlackPixels:blackSource,originalBlackPixelsDiffOver2:blackChanged,
          alphaDifferentPixels:alphaDifferent}
      };
    },{original,candidate:preview.candidate});
    const originalBytes=Buffer.from(result.originalPng.split(',')[1],'base64');
    const historic=firstWriter(originalBytes,{}, {recipe:original});
    const parsed=readRawPngRecipe(historic);
    if(parsed.selected?.format!=='roygbiv-recipe-v1'||
      JSON.stringify(parsed.selected.rawRecipe)!==JSON.stringify(original)||
      parsed.width!==600||parsed.height!==1300||
      inspectPngMigration(historic).safe)
      throw Error('Original writer/provenance/refusal check failed for '+sample.id);
    const chunks=scanPngChunks(historic).chunks.filter(c=>c.type==='IDAT');
    const idatSha256=createHash('sha256').update(
      Buffer.concat(chunks.map(c=>Buffer.from(c.data)))).digest('hex');
    const originalName=sample.id+'-original-v1.png';
    const previewName=sample.id+'-modern-PREVIEW.png';
    await writeFile(join(out,originalName),historic);
    await writeFile(join(out,previewName),
      Buffer.from(result.previewPng.split(',')[1],'base64'));
    reports.push({id:sample.id,shadowEnabled:sample.enabled,originalName,
      previewName,sourceEraIdatSha256:idatSha256,
      matchesPinnedIdat:idatSha256===sample.idatSha256,
      sourceEraEnvelopeOutput:parsed.selected.envelope.output,
      metrics:result.metrics,fieldAudit:preview.fieldAudit,
      assumptions:preview.assumptions,safeForMigration:false});
    console.log(sample.id+': '+result.metrics.pixelsDiffOver2+
      ' of '+result.metrics.pixels+' pixels differ by >2 RGB; pinned IDAT match: '+
      (idatSha256===sample.idatSha256));
  }
  await page.close();
}finally{await browser.close();}
const report={
  schema:'roygbiv-first-v1-modern-parity-investigation/v1',
  sourceCommit:manifest.sourceCommit,
  status:'VISUAL COMPARISON ONLY; migration intentionally refused',
  browserDifferenceWarning:'Original IDAT hashes are browser-version dependent; mismatches alone do not establish a source modification.',
  conversionAuthorized:false,width:600,height:1300,reports,
};
await writeFile(join(out,'manifest.json'),JSON.stringify(report,null,2)+'\n');
const html='<!doctype html><html lang="en"><meta charset="utf-8">'+
  '<title>First-v1 vs contemporary preview (no conversion)</title>'+
  '<style>body{font:14px system-ui;background:#111;color:white;padding:20px}'+
  'section{display:flex;gap:16px;flex-wrap:wrap}figure{margin:0}img{width:270px;max-width:43vw}'+
  'figcaption{max-width:270px;padding:6px}</style>'+
  '<h1>First-v1 versus modern PREVIEW</h1>'+
  '<p>Different canvases from the same authored fixture. No archived PNG has been migrated. '+
  'Pixel differences and field hypotheses: <a href="manifest.json">manifest</a>.</p>'+
  reports.map(r=>'<h2>'+r.id+'</h2><p>'+r.metrics.pixelsDiffOver2+
    ' / '+r.metrics.pixels+' pixels differ by more than 2 RGB values. Migration refused.</p>'+
    '<section><figure><img src="'+r.originalName+'"><figcaption>Authentic source-era v1 painter and writer</figcaption></figure>'+
    '<figure><img src="'+r.previewName+'"><figcaption>Unproven modern candidate, preview only</figcaption></figure></section>').join('');
await writeFile(join(out,'index.html'),html);
console.log('Inspect '+join(out,'index.html'));
