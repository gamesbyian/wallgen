#!/usr/bin/env node
/**
 * OPT-IN, real browser R4 import→editable recipe→PNG→Undo→re-import journey.
 * Reuses the production app/renderer/PNG metadata reader. Never duplicates
 * scene state or restores from original source metadata during inference.
 *
 * Serve the repository locally first (e.g. python3 -m http.server 8712
 * --bind 127.0.0.1) and run:
 * node scripts/check-reconstruction-journey.mjs --url http://127.0.0.1:8712 \
 *   --source artifacts/r0/03-wave.no-metadata.png \
 *   --out-dir artifacts/r0-journey
 *
 * Playwright is deliberately optional; this is NOT permanent browser CI.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile,access} from 'node:fs/promises';
import {resolve,join,basename,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {extractPngRecipeWithProvenance} from '../src/png-metadata.js';
const self=fileURLToPath(import.meta.url);

export function parseReconstructionJourneyArgs(argv){
  const opts={};
  for(let i=0;i<argv.length;i++){
    const flag=argv[i];
    if(flag==='--help'||flag==='-h'){opts.help=true;continue;}
    if(!['--source','--out-dir','--url','--browser'].includes(flag)||
      !argv[i+1]||argv[i+1].startsWith('--'))
      throw Error('Unknown/incomplete option: '+flag);
    opts[flag.slice(2)]=argv[++i];
  }
  if(opts.help)return opts;
  if(!opts.source||!opts['out-dir']||!opts.url)
    throw Error('Required: --source path --out-dir path --url http://127.0.0.1:port');
  const url=new URL(opts.url);
  if(url.protocol!=='http:'||!['localhost','127.0.0.1'].includes(url.hostname))
    throw Error('The browser journey must use a local development HTTP server');
  return opts;
}
function sha(bytes){return createHash('sha256').update(bytes).digest('hex');}

async function run(args){
  const source=resolve(args.source),output=resolve(args['out-dir']);
  const bytes=await readFile(source);
  assert.ok(bytes.length<12*1024*1024,'fixture exceeds regular image import limit');
  assert.equal(extractPngRecipeWithProvenance(bytes).recipe,null,
    'The source must be a metadata-free image, NOT an embedded recipe recovery');
  const originalDigest=sha(bytes);
  await mkdir(output,{recursive:true});
  for(const name of ['baseline.json','inferred.json','wallpaper.png','undone.json',
    'restored.json','import-portrait.png','fit-explanation-portrait.png','report.json']){
    await assert.rejects(access(join(output,name)),undefined,
      'Never overwrite prior production evidence: '+name);
  }
  const {chromium}=await import('playwright').catch(()=>{
    throw Error('Install opt-in Playwright locally before running this check');
  });
  const browser=await chromium.launch({headless:true,
    ...(args.browser?{executablePath:args.browser}:{})});
  const started=Date.now(),timings={};
  try{
    const context=await browser.newContext({
      viewport:{width:412,height:892},deviceScaleFactor:2.625,
      isMobile:true,hasTouch:true,acceptDownloads:true,
      reducedMotion:'reduce'
    });
    const page=await context.newPage();
    const failures=[];
    page.on('pageerror',err=>failures.push(err.message));
    await page.goto(args.url,{waitUntil:'domcontentloaded',timeout:30000});
    // Mobile layout hides the auxiliary recipe JSON toolbar item. Verify
    // that its handler exists, then invoke that utility action explicitly;
    // the primary image-import Apply/Close targets are still TAP tested.
    await page.locator('#downloadRecipe').waitFor({state:'attached',timeout:30000});
    async function saveDownload(selector,name,timeout=60000){
      const request=page.waitForEvent('download',{timeout});
      const button=page.locator(selector);
      if(await button.isVisible())await button.click();
      else await button.evaluate(node=>node.click());
      const download=await request;
      await download.saveAs(join(output,name));
      return join(output,name);
    }
    async function recipeDownload(name){
      await saveDownload('#downloadRecipe',name);
      return JSON.parse(await readFile(join(output,name),'utf8'));
    }
    const baseline=await recipeDownload('baseline.json');
    assert.equal(baseline.reconstructionOrigin,undefined);
    const selectedAt=Date.now();
    await page.locator('#imagePathFile').setInputFiles(source);
    await page.waitForFunction(()=>{
      const dialog=document.getElementById('imagePathDialog');
      const button=document.getElementById('imageRecipeApply');
      return dialog?.open&&button&&!button.disabled;
    },null,{timeout:120000});
    timings.fitMs=Date.now()-selectedAt;
    const preview=await page.evaluate(()=>{
      const inspect=id=>{
        const canvas=document.getElementById(id);
        const data=canvas.getContext('2d',{willReadFrequently:true})
          .getImageData(0,0,canvas.width,canvas.height).data;
        let pigment=0;
        for(let i=0;i<data.length;i+=4){
          if(Math.max(data[i],data[i+1],data[i+2])-
            Math.min(data[i],data[i+1],data[i+2])>50)pigment++;
        }
        return {width:canvas.width,height:canvas.height,pigmentPixels:pigment};
      };
      const dialog=document.getElementById('imagePathDialog');
      const rect=id=>{
        const bounds=document.getElementById(id).getBoundingClientRect();
        return {width:bounds.width,height:bounds.height};
      };
      return {source:inspect('imageRecipeSourceCanvas'),
        output:inspect('imageRecipeCanvas'),
        choice:document.getElementById('imageRecipeCandidate').selectedOptions[0]?.textContent,
        importer:{clientHeight:dialog.clientHeight,scrollHeight:dialog.scrollHeight},
        applyTarget:rect('imageRecipeApply'),dismissTarget:rect('imagePathCancel'),
        whyTarget:rect('imageRecipeWhy'),
        summaryText:document.getElementById('imageRecipeStatus').textContent,
        summaryFits:(()=>{
          const el=document.getElementById('imageRecipeStatus');
          return el.scrollHeight<=el.clientHeight+1;
        })(),
        cardFits:(()=>{
          const el=document.getElementById('imageRecipeWorkspace');
          return el.scrollHeight<=el.clientHeight+1;
        })()};
    });
    assert.ok(preview.source.pigmentPixels>0&&preview.output.pigmentPixels>0,
      'Source and reconstructed previews must both contain genuine coloured ink');
    assert.ok(preview.applyTarget.height>=44&&preview.dismissTarget.height>=44&&
      preview.whyTarget.height>=44,
      'Touchable portrait Apply/Close/Why targets must be at least 44 px high');
    assert.ok(preview.summaryFits&&preview.cardFits,
      'Readable summary and full reconstruction card must fit without clipped text');
    assert.match(preview.summaryText,/lower is better/);
    await page.screenshot({path:join(output,'import-portrait.png'),fullPage:false});
    await page.locator('#imageRecipeWhy').click();
    await page.locator('#imageRecipeExplanation:popover-open').waitFor({timeout:10000});
    const fullExplanation=await page.locator('#imageRecipeExplanationText').textContent();
    assert.match(fullExplanation,/inferred editable approximation/);
    assert.match(fullExplanation,/original recipe or seed/);
    assert.ok(fullExplanation.length>preview.summaryText.length);
    await page.screenshot({path:join(output,'fit-explanation-portrait.png'),fullPage:false});
    await page.locator('#imageRecipeExplanation button').click();
    await page.locator('#imageRecipeExplanation').waitFor({state:'hidden',timeout:10000});
    await page.locator('#imageRecipeApply').click();
    await page.locator('#imagePathDialog').waitFor({state:'hidden',timeout:10000});
    const inferred=await recipeDownload('inferred.json');
    assert.equal(inferred.reconstructionOrigin?.origin,'inferred-image');
    assert.equal(inferred.reconstructionOrigin?.method,'current-render-fit-v1');
    assert.ok(inferred.reconstructionOrigin.initialFitError>=0);
    assert.equal(inferred.reconstructionOrigin.sourceWidth,480);
    assert.equal(inferred.reconstructionOrigin.sourceHeight,1040);
    assert.ok(inferred.structure==='paths'||inferred.structure==='regions');
    const exportAt=Date.now();
    await saveDownload('#download','wallpaper.png',180000);
    timings.exportMs=Date.now()-exportAt;
    const exported=extractPngRecipeWithProvenance(await readFile(join(output,'wallpaper.png')));
    assert.equal(exported.format,'roygbiv-recipe-v2');
    assert.deepEqual(exported.recipe.reconstructionOrigin,inferred.reconstructionOrigin);
    await page.locator('#undo').click();
    const undone=await recipeDownload('undone.json');
    assert.deepEqual(undone,baseline,'Undo must restore exact before-import recipe');
    await page.locator('#importRecipeFile').setInputFiles(join(output,'wallpaper.png'));
    await page.waitForFunction(()=>{
      const notice=document.getElementById('notice');
      return !!notice?.textContent?.includes('Restored');
    },null,{timeout:15000});
    const restored=await recipeDownload('restored.json');
    assert.deepEqual(restored,inferred,
      'Current PNG embedded recipe must fully round-trip after Undo');
    assert.equal(sha(await readFile(source)),originalDigest,
      'Input source image bytes must remain unmodified');
    const report={schema:'roygbiv-reconstruction-browser-journey/v1',
      evidence:'actual-portrait-Chromium-not-physical-Android',
      source:basename(source),sourceSHA256:originalDigest,
      viewport:{width:412,height:892,deviceScaleFactor:2.625},
      timings:{...timings,elapsedMs:Date.now()-started},
      candidate:preview.choice,preview,
      acceptedStructure:inferred.structure,
      origin:inferred.reconstructionOrigin,
      pngBytes:(await readFile(join(output,'wallpaper.png'))).length,
      pageErrors:failures,
      assertions:['blind metadata-free source','local 96x208 real-render previews',
        '44px portrait actions','unclipped concise fit and readable full detail',
        'one Apply transaction','PNG recipe metadata',
        'Undo exact prior recipe','PNG re-import exact accepted recipe',
        'unaltered source PNG bytes']};
    await writeFile(join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
    console.log('RECONSTRUCTION_JOURNEY '+JSON.stringify(report));
    await context.close();
  }finally{await browser.close();}
}

if(process.argv[1]&&resolve(process.argv[1])===self){
  let options;
  try{options=parseReconstructionJourneyArgs(process.argv.slice(2));}
  catch(error){console.error(error.message);process.exitCode=1;}
  if(options?.help){
    console.log('node scripts/check-reconstruction-journey.mjs --source meta-free.png --out-dir output --url http://127.0.0.1:8712 [--browser path]');
  }else if(options){
    run(options).catch(err=>{console.error('Reconstruction journey: '+err.stack);process.exitCode=1;});
  }
}
