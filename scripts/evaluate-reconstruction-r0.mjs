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
    if(key==='--save-best-recipe'){opts.saveBestRecipe=true;continue;}
    if(key==='--alternatives'){opts.alternatives=true;continue;}
    if(key==='--ink-geometry'){opts.inkGeometry=true;continue;}
    if(key==='--probe-ink-width'){
      opts.inkGeometry=true;opts.probeInkWidth=true;continue;
    }
    if(key==='--probe-ink-channels'){
      opts.inkGeometry=true;opts.probeInkChannels=true;continue;
    }
    if(key==='--probe-local-curve'){
      opts.inkGeometry=true;opts.probeLocalCurve=true;continue;
    }
    if(key==='--hue-visible-shapes'){
      opts.hueVisibleShapes=true;continue;
    }
    if(key==='--source-signature'){
      opts.sourceSignature=true;continue;
    }
    if(key==='--source-state-probe'){
      opts.sourceStateProbe=true;continue;
    }
    if(key==='--profile-hue-masks'){
      opts.profileHueMasks=true;continue;
    }
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
      const inferred=await page.evaluate(async ({base64,includeAlternatives,
        includeInkGeometry,includeWidthProbe,includeChannelProbe,includeLocalCurve,
        includeHueVisibleShapes,includeHueMaskProfile,includeSourceSignature,
        includeSourceStateProbe,caseId})=>{
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
        // Opt-in browser CPU profiling, not part of recipe selection or
        // ordinary image import. Compare the exact *same* candidate operation
        // with and without reuse of the already computed seven source masks.
        let hueMaskProfile=null;
        if(includeHueMaskProfile){
          const {describeReconstructionImage}=await import('/src/image-reconstruction.js');
          const {observedHueShapeRecipe}=await import('/src/image-hue-reconstruction.js');
          const initial=normalizeRecipe({seed:'r0-anonymous'});
          const run=useShared=>{
            const desc=describeReconstructionImage(source,
              {includeColourMasks:useShared});
            const hint=desc.paletteHypothesis?.palette??'classic';
            return observedHueShapeRecipe(source,p,initial,{
              paletteHint:hint,
              ...(useShared?{colourAnalysis:{
                background:desc.background,coverage:desc.coverage,
                regions:desc.colourRegions,masks:desc.sourceHueMasks
              }}:{})
            });
          };
          const independently=run(false),shared=run(true);
          if(JSON.stringify(independently)!==JSON.stringify(shared))
            throw Error('Source pixel semantics changed during CPU comparison');
          // Warm both paths; interleave forward/reverse pairs to reduce the
          // impact of JIT, throttling, cache warmth and one-sided GC.
          for(let i=0;i<2;i++){run(false);run(true);}
          const baselineMs=[],reusedMs=[];
          for(let i=0;i<6;i++){
            const order=i%2?[true,false]:[false,true];
            for(const useShared of order){
              const start=performance.now();
              run(useShared);
              (useShared?reusedMs:baselineMs).push(performance.now()-start);
            }
          }
          const median=values=>{
            const ordered=values.slice().sort((a,b)=>a-b);
            return (ordered[2]+ordered[3])/2;
          };
          const baselineMedianMs=median(baselineMs);
          const reusedMedianMs=median(reusedMs);
          hueMaskProfile={schema:'roygbiv-ephemeral-source-masks-cpu-v1',
            analysisPixels:source.width*source.height,
            baselineMedianMs,reusedMedianMs,
            medianSavedMs:baselineMedianMs-reusedMedianMs,
            medianRatio:baselineMedianMs/Math.max(.000001,reusedMedianMs),
            baselineSamplesMs:baselineMs,reusedSamplesMs:reusedMs,
            sameRecipe:true,eligible:Boolean(shared)};
        }
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
        // Deliberately opt-in source-state probe. The same anonymous source
        // is reconstructed with a polluted *unrelated* maker recipe; compare
        // actual canonical PNG paints, never metadata/truth from the source.
        // Additional probe paints are research-only, outside UX's 6+10 budget.
        let sourceStateProbe=null;
        if(includeSourceStateProbe&&
          ['22-overlapping-reversed-circles','occluded-mixed-seven',
            'one-red-polygon'].includes(caseId)){
          const structural=['hue-visible-shapes','regions','shape','shape-repeats'];
          const sourceCandidate=candidates.find(c=>structural.includes(c.kind));
          if(sourceCandidate){
            const staleShape=candidates.find(c=>c.kind==='hue-visible-shapes')
              ?.recipe.scatteredShapeOverrides?.[1]?.shape??
              candidates.find(c=>c.kind==='shape')?.recipe.scatteredShape??null;
            const staleOrder=[6,5,4,3,2,1,0];
            const staleOverrides=staleShape?[{index:0,shape:staleShape}]:[];
            const unrelated=normalizeRecipe({
              seed:'r0-anonymous',reverseStripes:true,
              scatteredLayerOrder:staleOrder,
              scatteredShapeOverrides:staleOverrides
            });
            const separate=reconstructionCandidates(source,unrelated)
              .find(c=>c.kind===sourceCandidate.kind);
            if(!separate)throw Error('Unrelated state suppressed observed '+caseId);
            const clean=render(sourceCandidate.recipe);
            const independent=render(separate.recipe);
            // Explicit counterfactual of previous inherited scene state.
            // It is not an original artist recipe or a hidden ground truth.
            const inherited=render(normalizeRecipe({
              ...sourceCandidate.recipe,reverseStripes:true,
              scatteredLayerOrder:staleOrder,
              scatteredShapeOverrides:staleOverrides
            }));
            const pixels=canvas=>canvas.getContext('2d',
              {willReadFrequently:true}).getImageData(0,0,fit.width,fit.height);
            const cleanPixels=pixels(clean),independentPixels=pixels(independent);
            const samePixels=cleanPixels.data.every((v,i)=>
              v===independentPixels.data[i]);
            if(!samePixels)throw Error('Unrelated editor state altered '+caseId);
            sourceStateProbe={
              kind:sourceCandidate.kind,
              error:compareReconstructionPixels(reference,cleanPixels),
              pollutedError:compareReconstructionPixels(reference,independentPixels),
              counterfactualPreviousError:compareReconstructionPixels(reference,pixels(inherited)),
              samePixels,paintCalls:3,
              cleanImage:clean.toDataURL('image/png'),
              pollutedImage:independent.toDataURL('image/png'),
              previousImage:inherited.toDataURL('image/png')
            };
          }
        }
        // Reuse this ALREADY painted best-preview canvas; do not spend an
        // additional canonical painter call for diagnostic comparison.
        const inkGeometry=includeInkGeometry&&preview?
          (await import('/src/reconstruction-ink-geometry.js'))
            .compareRainbowInkGeometry(reference,preview.getContext('2d',
              {willReadFrequently:true}).getImageData(0,0,fit.width,fit.height)):
          null;
        // Separate, deliberately opt-in *research* paints; never part of
        // canonical 6+10 search, no saved recipe or changed candidate winner.
        let widthProbe=null;
        if(includeWidthProbe&&inkGeometry&&best&&
          (best.kind==='loop'||best.kind==='hairpin')){
          const {proposeMedialWidthDeltas}=await import('/src/reconstruction-ink-geometry.js');
          const hint=proposeMedialWidthDeltas(inkGeometry,best.recipe.stripeWidth);
          widthProbe={kind:best.kind,baseError:best.error,hint,
            variants:[],bestError:best.error,bestStripeWidth:best.recipe.stripeWidth,
            bestImage:null};
          for(const delta of hint?.deltas||[]){
            const candidate=normalizeRecipe({...best.recipe,
              stripeWidth:best.recipe.stripeWidth+delta});
            if(candidate.stripeWidth===best.recipe.stripeWidth)continue;
            const candidateCanvas=render(candidate);
            const pixels=candidateCanvas.getContext('2d',
              {willReadFrequently:true}).getImageData(0,0,fit.width,fit.height);
            const error=compareReconstructionPixels(reference,pixels);
            widthProbe.variants.push({delta,actualStripeWidth:candidate.stripeWidth,
              error,image:candidateCanvas.toDataURL('image/png')});
            if(error+1e-9<widthProbe.bestError){
              widthProbe.bestError=error;
              widthProbe.bestStripeWidth=candidate.stripeWidth;
              widthProbe.bestImage=candidateCanvas.toDataURL('image/png');
            }
          }
        }
        let channelProbe=null;
        if(includeChannelProbe&&inkGeometry&&best&&
          (best.kind==='hairpin'||best.kind==='loop')){
          const {proposeUpperGapTrials}=await import('/src/reconstruction-ink-geometry.js');
          const hint=proposeUpperGapTrials(inkGeometry,best.kind);
          channelProbe={kind:best.kind,baseError:best.error,hint,
            variants:[],bestError:best.error,bestControls:null,bestImage:null};
          for(const {widthDelta,spreadDelta} of hint?.trials||[]){
            const candidate=normalizeRecipe({...best.recipe,
              stripeWidth:best.recipe.stripeWidth+widthDelta,
              spread:best.recipe.spread+spreadDelta});
            if(candidate.stripeWidth===best.recipe.stripeWidth&&
              candidate.spread===best.recipe.spread)continue;
            const candidateCanvas=render(candidate);
            const pixels=candidateCanvas.getContext('2d',
              {willReadFrequently:true}).getImageData(0,0,fit.width,fit.height);
            const error=compareReconstructionPixels(reference,pixels);
            const controls={stripeWidth:candidate.stripeWidth,spread:candidate.spread};
            channelProbe.variants.push({widthDelta,spreadDelta,controls,error,
              image:candidateCanvas.toDataURL('image/png')});
            if(error+1e-9<channelProbe.bestError){
              channelProbe.bestError=error;
              channelProbe.bestControls=controls;
              channelProbe.bestImage=candidateCanvas.toDataURL('image/png');
            }
          }
        }
        let localCurveProbe=null;
        if(includeLocalCurve&&inkGeometry&&best&&
          (best.kind==='hairpin'||best.kind==='loop')){
          const {localCurveProbeSpecs}=await import('/src/reconstruction-ink-geometry.js');
          const specs=localCurveProbeSpecs(inkGeometry,best.kind,best.recipe);
          localCurveProbe={kind:best.kind,baseError:best.error,
            envelopeResiduals:inkGeometry.envelopeResiduals,
            variants:[],bestError:best.error,bestControls:null,bestImage:null};
          const fields=['stripeWidth','spread','turnRadius','hairpinAngle',
            'loopRadius','positionX','loopSweep'];
          for(const spec of specs){
            const adjustments={};
            for(const field of fields){
              const delta=spec[field+'Delta'];
              if(Number.isFinite(delta))
                adjustments[field]=best.recipe[field]+delta;
            }
            const recipe=normalizeRecipe({...best.recipe,...adjustments});
            if(fields.every(field=>recipe[field]===best.recipe[field]))continue;
            const canvas=render(recipe);
            const pixels=canvas.getContext('2d',
              {willReadFrequently:true}).getImageData(0,0,fit.width,fit.height);
            const score=compareReconstructionPixels(reference,pixels);
            const image=canvas.toDataURL('image/png');
            localCurveProbe.variants.push({label:spec.label,
              controls:Object.fromEntries(fields.filter(field=>
                recipe[field]!==best.recipe[field]).map(field=>[field,recipe[field]])),
              error:score,image});
            if(score+1e-9<localCurveProbe.bestError){
              localCurveProbe.bestError=score;
              localCurveProbe.bestControls=localCurveProbe.variants.at(-1).controls;
              localCurveProbe.bestImage=image;
            }
          }
        }
        let hueVisibleShapes=null;
        if(includeHueVisibleShapes){
          const {observedHueShapeRecipe}=await import('/src/image-hue-reconstruction.js');
          // Research comparison must use the SAME conservative source-only
          // palette evidence as production candidate selection. Never reveal
          // the withheld sidecar recipe to the inverse phase.
          const {describeReconstructionImage}=await import('/src/image-reconstruction.js');
          const sourceDescriptor=describeReconstructionImage(source);
          const palette=sourceDescriptor.paletteHypothesis?.palette??'classic';
          const candidate=observedHueShapeRecipe(source,p,
            normalizeRecipe({seed:'r0-anonymous'}),{
              paletteHint:palette,
              // Same source-only compact first-N gate as production. This
              // explicitly opt-in research paint saves the full-size export
              // recipe without changing normal six-candidate selection.
              allowPartial:sourceDescriptor.incompleteColourRegions
            });
          if(candidate){
            const canvas=render(candidate.recipe);
            const pixels=canvas.getContext('2d',
              {willReadFrequently:true}).getImageData(0,0,fit.width,fit.height);
            hueVisibleShapes={
              kind:candidate.kind,error:compareReconstructionPixels(reference,pixels),
              measuredPalette:palette,
              sourceVisibleOnly:candidate.sourceVisibleOnly,
              uncertainty:candidate.uncertainty,
              componentCounts:candidate.componentCounts,
              croppedHueSlots:candidate.croppedHueSlots,
              recipe:candidate.recipe,image:canvas.toDataURL('image/png')
            };
          }
        }
        // Read-only source descriptors from the authoritative importer.
        // This research receipt never enters candidate selection, ranking,
        // serialized recipes or normally executed image processing.
        let sourceSignature=null;
        if(includeSourceSignature){
          const {describeReconstructionImage}=await import('/src/image-reconstruction.js');
          const d=describeReconstructionImage(source);
          sourceSignature={sevenColourRegions:d.sevenColourRegions,
            regionCount:d.colourRegions.length,
            circleHintCount:d.circleHints?.length??0,
            circleResiduals:d.circleHints?.map(x=>x.residual)??null,
            regionFillRatios:d.colourRegions.map(x=>x.fillRatio),
            regionAxisRatios:d.colourRegions.map(x=>x.axisRatio),
            radialKind:d.radial.kind,
            componentDiagonalAngle:d.componentDiagonalAngle,
            pathKinds:d.paths.map(x=>x.kind),coverage:d.coverage};
        }
        bitmap.close();
        return {
          ...(includeHueMaskProfile?{hueMaskProfile}:{}),
          ...(includeSourceSignature?{sourceSignature}:{}),
          ...(includeSourceStateProbe?{sourceStateProbe}:{}),
          ...(includeHueVisibleShapes?{hueVisibleShapes}:{}),
          ...(includeLocalCurve?{localCurveProbe}:{}),
          ...(includeChannelProbe?{channelProbe}:{}),
          ...(includeWidthProbe?{widthProbe}:{}),
          prefitAlternatives,
          ...(includeInkGeometry?{inkGeometry}:{}),
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
        includeAlternatives:!!opts.alternatives,
        includeInkGeometry:!!opts.inkGeometry,
        includeWidthProbe:!!opts.probeInkWidth,
        includeChannelProbe:!!opts.probeInkChannels,
        includeLocalCurve:!!opts.probeLocalCurve,
        includeHueVisibleShapes:!!opts.hueVisibleShapes,
        includeHueMaskProfile:!!opts.profileHueMasks,
        includeSourceSignature:!!opts.sourceSignature,
        includeSourceStateProbe:!!opts.sourceStateProbe,caseId:item.id});
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
        ...(opts.inkGeometry?{inkGeometry:inferred.inkGeometry}:{}),
        ...(opts.profileHueMasks?{hueMaskProfile:inferred.hueMaskProfile}:{}),
        ...(opts.sourceSignature?{sourceSignature:inferred.sourceSignature}:{}),
        ...(opts.sourceStateProbe?{sourceStateProbe:inferred.sourceStateProbe?{
          ...inferred.sourceStateProbe,
          cleanImage:undefined,pollutedImage:undefined,previousImage:undefined,
          cleanPreview:item.id+'.source-state-clean.png',
          pollutedPreview:item.id+'.source-state-polluted.png',
          counterfactualPreview:item.id+'.source-state-inherited.png'
        }:null}:{}),
        ...(opts.hueVisibleShapes?{hueVisibleShapes:inferred.hueVisibleShapes?{
          ...inferred.hueVisibleShapes,recipe:undefined,image:undefined,
          improved:inferred.hueVisibleShapes.error+1e-9<
            (inferred.selected?.error??Infinity),
          preview:item.id+'.r0-hue-visible.png',
          recipeFile:item.id+'.r0-hue-visible.recipe.json'}:null}:{}),
        ...(opts.probeLocalCurve?{localCurveProbe:inferred.localCurveProbe?{
          ...inferred.localCurveProbe,bestImage:undefined,
          variants:inferred.localCurveProbe.variants.map((trial,i)=>({
            ...trial,image:undefined,
            preview:item.id+'.r0-local-curve-'+(i+1)+'.png'})),
          bestPreview:inferred.localCurveProbe.bestImage?
            item.id+'.r0-local-curve-best.png':null}:null}:{}),
        ...(opts.probeInkChannels?{channelProbe:inferred.channelProbe?{
          ...inferred.channelProbe,bestImage:undefined,
          variants:inferred.channelProbe.variants.map((trial,i)=>({
            ...trial,image:undefined,
            preview:item.id+'.r0-gap-trial-'+(i+1)+'.png'})),
          bestPreview:inferred.channelProbe.bestImage?
            item.id+'.r0-gap-probe-best.png':null}:null}:{}),
        ...(opts.probeInkWidth?{widthProbe:inferred.widthProbe?{
          ...inferred.widthProbe,bestImage:undefined,
          variants:inferred.widthProbe.variants.map((trial,i)=>({
            ...trial,image:undefined,
            preview:item.id+'.r0-width-trial-'+(i+1)+'.png'})),
          bestPreview:inferred.widthProbe.bestImage?
            item.id+'.r0-ink-width-probe.png':null}:null}:{}),
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
      // Research-only source-first portable receipt. Never confuse this
      // selected inferred edit with an original/source-authored recipe.
      if(opts.saveBestRecipe&&inferred.selected)
        await writeFile(join(dir,item.id+'.r0-best-inferred.recipe.json'),
          JSON.stringify(inferred.selected.recipe,null,2)+'\n');
      for(const [index,variant] of inferred.candidateVariants.entries()){
        await writeFile(join(dir,record.variantPreviews[index]),pngBytes(variant.image));
      }
      if(inferred.sourceStateProbe){
        const p=inferred.sourceStateProbe;
        await writeFile(join(dir,item.id+'.source-state-clean.png'),pngBytes(p.cleanImage));
        await writeFile(join(dir,item.id+'.source-state-polluted.png'),pngBytes(p.pollutedImage));
        await writeFile(join(dir,item.id+'.source-state-inherited.png'),pngBytes(p.previousImage));
        console.log('SOURCE_STATE_ACTUAL_PAINTER '+JSON.stringify({
          id:item.id,kind:p.kind,error:p.error,
          pollutedError:p.pollutedError,
          previousError:p.counterfactualPreviousError,samePixels:p.samePixels,
          additionalResearchPaints:p.paintCalls
        }));
      }
      if(inferred.hueVisibleShapes){
        await writeFile(join(dir,item.id+'.r0-hue-visible.png'),
          pngBytes(inferred.hueVisibleShapes.image));
        await writeFile(join(dir,item.id+'.r0-hue-visible.recipe.json'),
          JSON.stringify(inferred.hueVisibleShapes.recipe,null,2)+'\n');
      }
      for(const [i,trial] of (inferred.localCurveProbe?.variants||[]).entries()){
        await writeFile(join(dir,item.id+'.r0-local-curve-'+(i+1)+'.png'),
          pngBytes(trial.image));
      }
      if(inferred.localCurveProbe?.bestImage)
        await writeFile(join(dir,item.id+'.r0-local-curve-best.png'),
          pngBytes(inferred.localCurveProbe.bestImage));
      for(const [i,trial] of (inferred.channelProbe?.variants||[]).entries()){
        await writeFile(join(dir,item.id+'.r0-gap-trial-'+(i+1)+'.png'),
          pngBytes(trial.image));
      }
      if(inferred.channelProbe?.bestImage)
        await writeFile(join(dir,item.id+'.r0-gap-probe-best.png'),
          pngBytes(inferred.channelProbe.bestImage));
      for(const [i,trial] of (inferred.widthProbe?.variants||[]).entries()){
        await writeFile(join(dir,item.id+'.r0-width-trial-'+(i+1)+'.png'),
          pngBytes(trial.image));
      }
      if(inferred.widthProbe?.bestImage){
        await writeFile(join(dir,item.id+'.r0-ink-width-probe.png'),
          pngBytes(inferred.widthProbe.bestImage));
      }
      if(opts.profileHueMasks)
        console.log('HUE_MASK_CPU '+JSON.stringify({id:item.id,...record.hueMaskProfile}));
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
        '</section></details>':'')+
      (item.localCurveProbe?.variants?.length?
        '<details><summary>Opt-in local curve trials ('+
        item.localCurveProbe.variants.length+', research only)</summary>'+
        '<p>Actual source / canonical best shown above. Trials below are true '+
        'painter outputs, not adopted recipes. Lower RGB/ink error is better.</p>'+
        '<section class="variants">'+
        item.localCurveProbe.variants.map((trial,i)=>
          '<figure><img src="'+esc(trial.preview)+
          '" alt="Experimentally painted local curve variant '+(i+1)+'">'+
          '<figcaption>'+esc(trial.label)+' · '+
          Number(trial.error).toFixed(6)+
          (trial.error<item.bestError?' · improves baseline':' · no win')+
          '</figcaption></figure>').join('')+'</section>'+
        '<p>Reference baseline error '+Number(item.bestError).toFixed(6)+
        '</p></details>':'')+'</figure>').join('');
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
  if(opts.help){console.log('node scripts/evaluate-reconstruction-r0.mjs --dir artifacts/reconstruction-r0 [--browser executable] [--alternatives] [--ink-geometry] [--probe-ink-width] [--probe-ink-channels] [--probe-local-curve] [--hue-visible-shapes]');return;}
  await evaluate(opts);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main().catch(err=>{console.error('R0 evaluation: '+err.message);process.exitCode=1;});
}
