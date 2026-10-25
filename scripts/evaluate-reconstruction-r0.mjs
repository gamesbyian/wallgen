#!/usr/bin/env node
/**
 * Opt-in read-only evaluation against actual current-renderer PNGs OR
 * separately authored, metadata-free PNG graphics with no canonical truth.
 * Uses the existing image descriptors, canonical candidate normalizer and
 * drawWallpaper renderer, never constructs a second rasterizer.
 *
 * node scripts/evaluate-reconstruction-r0.mjs --dir artifacts/reconstruction-r0
 * Optional: --browser /usr/bin/chromium
 *
 * Source PNGs must already exist. This script never regenerates or modifies
 * source/metadata-free PNGs, nor reads source recipes during reconstruction.
 * Truth recipes are read AFTER a ranked candidate has been produced.
 */
import {createServer} from 'node:http';
import {readFile,writeFile,access} from 'node:fs/promises';
import {join,resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {extractPngRecipe} from '../src/png-metadata.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const mime={'.js':'text/javascript','.json':'application/json','.css':'text/css'};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
  .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export function readReconstructionEvalArgs(argv){
  const opts={dir:'artifacts/reconstruction-r0'};
  for(let i=0;i<argv.length;i++){
    const key=argv[i];
    if(key==='--alternatives'){opts.alternatives=true;continue;}
    if(key==='--help'||key==='-h'){opts.help=true;continue;}
    if(!['--dir','--browser'].includes(key)||!argv[i+1]||argv[i+1].startsWith('--'))
      throw Error('Unknown/incomplete option '+key);
    opts[key.slice(2)]=argv[++i];
  }
  return opts;
}
function staticServer(){
  return createServer(async(req,res)=>{
    try{
      if(req.url==='/'){res.writeHead(200,{'Content-Type':'text/html',
        'Cache-Control':'no-store'}).end('<!doctype html><title>ROYGBIV R0</title>');return;}
      const target=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
      if(!target.startsWith(root+'/')){res.writeHead(403).end();return;}
      const data=await readFile(target);
      res.writeHead(200,{'Content-Type':mime[extname(target)]||'application/octet-stream',
        'Cache-Control':'no-store'}).end(data);
    }catch{res.writeHead(404).end('Missing');}
  });
}
function pngBytes(dataUri){
  if(!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(dataUri))throw Error('Invalid preview PNG');
  return Buffer.from(dataUri.split(',')[1],'base64');
}

/**
 * R0 production truth and independently authored/owner-provided graphics use
 * the SAME pixel inference. External inputs have no source ROYGBIV recipe:
 * never invent one merely to fill a report table.
 */
export function classifyReconstructionManifest(manifest){
  const external=manifest?.schema==='roygbiv-reconstruction-external/v1';
  if(!external&&manifest?.schema!=='roygbiv-reconstruction-r0/v1')
    throw Error('Unsupported reconstruction manifest');
  if(!Array.isArray(manifest.items)||manifest.items.length<1||
    manifest.items.length>(external?4:22))throw Error('Invalid reconstruction fixture count');
  const ids=new Set(),sources=new Set();
  for(const item of manifest.items){
    if(!item||typeof item.id!=='string'||!/^[-\w]+$/.test(item.id)||
      ids.has(item.id))throw Error('Invalid/duplicate reconstruction fixture id');
    if(typeof item.metadataFree!=='string'||
      !/^[A-Za-z0-9][\w.-]*\.png$/.test(item.metadataFree)||
      sources.has(item.metadataFree))throw Error('Invalid/duplicate PNG filename');
    if(external){
      if(Object.hasOwn(item,'recipeFile')||Object.hasOwn(item,'seed'))
        throw Error('External graphic cannot claim a ROYGBIV source recipe');
    }else if(typeof item.recipeFile!=='string'||
      !/^[\w-]+\.recipe\.json$/.test(item.recipeFile))
      throw Error('Current-art R0 fixture requires a separate truth recipe');
    ids.add(item.id);sources.add(item.metadataFree);
  }
  return {external,items:manifest.items};
}
async function evaluate(opts){
  const dir=resolve(opts.dir);
  const manifest=JSON.parse(await readFile(join(dir,'manifest.json'),'utf8'));
  const {external,items}=classifyReconstructionManifest(manifest);
  // The manifest may name only simple files inside this explicit folder.
  for(const item of items){
    for(const name of external?[item.metadataFree]:
      [item.metadataFree,item.recipeFile])await access(join(dir,name));
  }
  const {chromium}=await import('playwright').catch(()=>{
    throw Error('Playwright required; install locally per README');
  });
  const server=staticServer();
  let browser;
  try{
    await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
    browser=await chromium.launch({headless:true,
      ...(opts.browser?{executablePath:opts.browser}:{})});
    const page=await browser.newPage({viewport:{width:420,height:900}});
    await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
    const results=[];
    for(const item of items){
      const input=new Uint8Array(await readFile(join(dir,item.metadataFree)));
      if(input.length>12*1024*1024)throw Error('Source PNG is too large for image import');
      if(external&&extractPngRecipe(input)!==null)
        throw Error('External input must not contain a ROYGBIV source recipe');
      // Inference only sees image pixels, never this item's recipe.
      const inferred=await page.evaluate(async ({base64,includeAlternatives})=>{
        const {reconstructionCandidates,rankReconstructionCandidates,
          reconstructionPlacement,RECONSTRUCTION_FRAME,
          refineReconstructionCandidate,reconstructionRefinementIndex,
          compareReconstructionPixels}=await import('/src/image-reconstruction.js');
        const {drawWallpaper}=await import('/src/renderer.js');
        const {normalizeRecipe}=await import('/src/model.js');
        const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
        const bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'}));
        const analysis=document.createElement('canvas');
        const scale=Math.min(1,600/Math.max(bitmap.width,bitmap.height));
        analysis.width=Math.max(12,Math.round(bitmap.width*scale));
        analysis.height=Math.max(12,Math.round(bitmap.height*scale));
        const ag=analysis.getContext('2d',{willReadFrequently:true});
        ag.drawImage(bitmap,0,0,analysis.width,analysis.height);
        const source=ag.getImageData(0,0,analysis.width,analysis.height);
        const fit=document.createElement('canvas');
        fit.width=RECONSTRUCTION_FRAME.width;fit.height=RECONSTRUCTION_FRAME.height;
        const fg=fit.getContext('2d',{willReadFrequently:true});
        const p=reconstructionPlacement(bitmap.width,bitmap.height);
        fg.fillStyle='black';fg.fillRect(0,0,fit.width,fit.height);
        fg.drawImage(bitmap,p.x/600*fit.width,p.y/1300*fit.height,
          p.width/600*fit.width,p.height/1300*fit.height);
        const reference=fg.getImageData(0,0,fit.width,fit.height);
        const candidates=reconstructionCandidates(source,normalizeRecipe({seed:'r0-anonymous'}));
        const render=(recipe)=>{
          const canvas=document.createElement('canvas');
          canvas.width=RECONSTRUCTION_FRAME.width;canvas.height=RECONSTRUCTION_FRAME.height;
          drawWallpaper(canvas,recipe);
          return canvas;
        };
        const ranked=rankReconstructionCandidates(candidates,reference,
          recipe=>render(recipe).getContext('2d',{willReadFrequently:true})
            .getImageData(0,0,fit.width,fit.height));
        const prefitAlternatives=ranked.map(item=>({
          kind:item.kind,error:item.error,geometry:item.recipe.geometry,
          positionX:item.recipe.positionX,positionY:item.recipe.positionY,
          spread:item.recipe.spread,stripeWidth:item.recipe.stripeWidth,
          shapeDepth:item.recipe.shapeDepth,shapeFrequency:item.recipe.shapeFrequency,
          jaggedShift:item.jaggedShift??null
        }));
        if(ranked[0]){
          const fitIndex=reconstructionRefinementIndex(ranked);
          ranked[fitIndex]=refineReconstructionCandidate(ranked[fitIndex],reference,
            recipe=>render(recipe).getContext('2d',{willReadFrequently:true})
              .getImageData(0,0,fit.width,fit.height));
          ranked.sort((a,b)=>a.error-b.error);
        }
        const best=ranked[0];
        const preview=best?render(best.recipe):null;
        bitmap.close();
        return {
          prefitAlternatives,
          candidateCount:ranked.length,
          selected:best?{kind:best.kind,label:best.label,error:best.error,
            structure:best.recipe.structure,geometry:best.recipe.geometry,
            recipe:best.recipe,refinementRenders:best.refinementRenders??0,
            waveOffsetY:best.waveOffsetY??null}:null,
          alternatives:ranked.map(x=>({kind:x.kind,label:x.label,error:x.error,
            waveOffsetY:x.waveOffsetY??null,positionY:x.recipe.positionY})),
          sourcePreview:fit.toDataURL('image/png'),
          candidatePreview:preview?.toDataURL('image/png')??null,
          candidateVariants:includeAlternatives?ranked.map((item,i)=>({
            image:render(item.recipe).toDataURL('image/png'),
            label:item.label,error:item.error,kind:item.kind,index:i
          })):[]
        };
      },{base64:Buffer.from(input).toString('base64'),
        includeAlternatives:!!opts.alternatives});
      // External work has NO original ROYGBIV recipe or true-render floor.
      // Only actual current-production PNGs have blinded truth sidecars.
      const truth=external?null:JSON.parse(await readFile(join(dir,item.recipeFile),'utf8'));
      const truthError=truth?await page.evaluate(async ({recipe,reference})=>
{
        const {drawWallpaper}=await import('/src/renderer.js');
        const {compareReconstructionPixels}=await import('/src/image-reconstruction.js');
        const bitmap=await createImageBitmap(await(await fetch(reference)).blob());
        const source=document.createElement('canvas');
        source.width=96;source.height=208;
        source.getContext('2d').drawImage(bitmap,0,0,96,208);
        bitmap.close();
        const truth=document.createElement('canvas');
        truth.width=96;truth.height=208;
        drawWallpaper(truth,recipe);
        return compareReconstructionPixels(
          source.getContext('2d',{willReadFrequently:true}).getImageData(0,0,96,208),
          truth.getContext('2d',{willReadFrequently:true}).getImageData(0,0,96,208));
      },{recipe:truth,reference:inferred.sourcePreview}):null;
      // Do not include truth in the inference phase: appearance match is
      // measured separately from structural/parameter truth below.
      const record={id:item.id,source:item.metadataFree,candidateCount:inferred.candidateCount,
        bestKind:inferred.selected?.kind??null,
        bestError:inferred.selected?.error??null,
        refinementRenders:inferred.selected?.refinementRenders??0,
        trueRecipeRenderError:truthError,
        bestLabel:inferred.selected?.label??null,
        prefitAlternatives:inferred.prefitAlternatives,
        selectedControls:inferred.selected?Object.fromEntries(
          ['positionX','positionY','spread','stripeWidth','shapeDepth','shapeFrequency',
            'turnRadius','hairpinAngle','loopRadius','loopSweep']
            .map(key=>[key,inferred.selected.recipe[key]])):null,
        selectedPositionY:inferred.selected?.recipe.positionY??null,
        selectedWaveOffsetY:inferred.selected?.waveOffsetY??null,
        trueStructure:truth?.structure??null,trueGeometry:truth?.geometry??null,
        recoveredStructure:inferred.selected?.structure??null,
        recoveredGeometry:inferred.selected?.geometry??null,
        // Appearance proposal is never the true recipe or a provenance claim.
        truePalette:truth?.palette??null,
        recoveredPalette:inferred.selected?.recipe.palette??null,
        alternatives:inferred.alternatives,
        ...(opts.alternatives?{variantPreviews:inferred.candidateVariants.map((_,i)=>
          item.id+'.r0-alternative-'+String(i+1).padStart(2,'0')+'.png')}: {})};
      // Report two previews next to each other; no claim of human inspection.
      const first=item.id+'.r0-source-preview.png';
      await writeFile(join(dir,first),pngBytes(inferred.sourcePreview));
      if(inferred.candidatePreview)
        await writeFile(join(dir,item.id+'.r0-best-preview.png'),pngBytes(inferred.candidatePreview));
      for(const [index,variant] of inferred.candidateVariants.entries()){
        await writeFile(join(dir,record.variantPreviews[index]),pngBytes(variant.image));
      }
      results.push(record);
      console.log('R0_EVAL '+JSON.stringify(record));
    }
    const report={schema:external?'roygbiv-reconstruction-external-evaluation/v1':
        'roygbiv-reconstruction-r0-evaluation/v1',
      status:external?'external-source-no-recipe-truth-not-human-reviewed':
        'measured-production-pngs-not-human-reviewed',
      sourceManifest:'manifest.json',samples:results};
    await writeFile(join(dir,'evaluation.json'),JSON.stringify(report,null,2)+'\n');
    const cards=results.map(item=>'<figure><h2>'+esc(item.id)+'</h2><div>'+
      '<img src="'+esc(item.id)+'.r0-source-preview.png" alt="Actual image source">'+
      (item.candidateCount?'<img src="'+esc(item.id)+'.r0-best-preview.png" alt="Recovered current-renderer recipe">':'')+
      '</div><figcaption>Actual source / inferred candidate · best error '+
      esc(item.bestError??'No candidate')+' · structure '+esc(item.trueStructure)+
      ' → '+esc(item.recoveredStructure??'none')+'</figcaption>'+
      (item.variantPreviews?.length?'<details><summary>All evaluated candidates ('+
        item.variantPreviews.length+')</summary><section class="variants">'+
        item.variantPreviews.map((file,i)=>'<figure><img src="'+esc(file)+
          '" alt="Actual candidate '+(i+1)+'">'+
          '<figcaption>'+esc(item.alternatives[i].label)+' · '+
          Number(item.alternatives[i].error).toFixed(4)+'</figcaption></figure>').join('')+
        '</section></details>':'')+'</figure>').join('');
    await writeFile(join(dir,'evaluation.html'),[
      '<!doctype html><html lang="en"><meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width,initial-scale=1">',
      '<title>Reconstruction R0 actual-image evaluation</title>',
      '<style>body{font:14px system-ui;color:#eee;background:#17171d;padding:20px}',
      'figure{display:inline-block;vertical-align:top;width:min(280px,95vw);padding:9px;',
      'background:#292931;border-radius:10px;margin:8px}',
      'figure div{display:flex;gap:6px}img{width:calc(50% - 3px);object-fit:contain}',
      'figcaption{font-size:12px;line-height:1.4}h2{font-size:14px}',
      '.variants{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}',
      '.variants figure{width:auto;margin:0;padding:4px}.variants img{width:100%}',
      '.variants figcaption{overflow-wrap:anywhere}</style>',
      external?'<h1>External-style graphics vs inferred ROYGBIV renderer</h1>':
        '<h1>R0: actual production sources compared with inferred renderer output</h1>',
      '<p>Quantitative code evidence, not artistic or handset approval. This report does not claim',
      external?' recovery of any original ROYGBIV recipe, because these images have none.</p>':
        ' recovery of original seeds or render settings. Candidates were selected before truth was read.</p>',
      cards,'</html>'
    ].join(''));
    console.log('R0_RESULT '+JSON.stringify({count:results.length,
      recovered:results.filter(r=>r.candidateCount>0).length,
      path:join(dir,'evaluation.json')}));
  }finally{
    await browser?.close();
    if(server.listening)await new Promise(resolve=>server.close(resolve));
  }
}
async function main(){
  const opts=readReconstructionEvalArgs(process.argv.slice(2));
  if(opts.help){console.log('node scripts/evaluate-reconstruction-r0.mjs --dir artifacts/reconstruction-r0 [--browser executable] [--alternatives]');return;}
  await evaluate(opts);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main().catch(err=>{console.error('R0 evaluation: '+err.message);process.exitCode=1;});
}
