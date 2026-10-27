#!/usr/bin/env node
// Opt-in true production Chromium 3024×6552 export/recipe parity for the
// actual current-model source-inferred 7-hue Hairpin and Loop polygon scenes.
// Disposable research-only playwright/pngjs deps; not default CI or phone QA.
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';
import {normalizeRecipe,resolveScene,OUTPUT_WIDTH,OUTPUT_HEIGHT}
  from '../src/model.js';
import {extractPngRecipe} from '../src/png-metadata.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(process.argv[2]||'artifacts/contour-hairpin-loop-fullres');
const exec=promisify(execFile);
const cases=['05-hairpin','06-loop'];
const run=async(script,args)=>{
  const path=join(root,'scripts',script);
  const {stdout}=await exec(process.execPath,[path,...args],{
    cwd:root,maxBuffer:16*1024*1024,timeout:6*60*1000});
  const lines=stdout.trim().split('\n');
  const last=lines.at(-1);
  console.log('PRODUCTION_COMMAND '+script+' '+last.slice(0,250));
};
const sha256=data=>createHash('sha256').update(data).digest('hex');
await mkdir(out,{recursive:true});
await run('review-reconstruction.mjs',['--out-dir',out,
  '--only',cases.join(',')]);
const originals=new Map;
for(const id of cases)originals.set(id,sha256(await readFile(
  join(out,id+'.no-metadata.png'))));
await run('evaluate-reconstruction-r0.mjs',['--dir',out,
  '--save-best-recipe']);
const evaluation=JSON.parse(await readFile(join(out,'evaluation.json'),'utf8'));
assert.equal(evaluation.samples.length,cases.length);
const records=[];
for(const id of cases){
  const evaluated=evaluation.samples.find(x=>x.id===id);
  assert.ok(evaluated&&Number.isFinite(evaluated.bestError));
  assert.equal(evaluated.bestKind,'hue-visible-shapes',
    'full-resolution proof must exercise the actual corrected source shapes');
  const data=JSON.parse(await readFile(
    join(out,id+'.r0-best-inferred.recipe.json'),'utf8'));
  const recipe=normalizeRecipe(data.recipe??data);
  assert.equal(recipe.structure,'regions');
  assert.equal(recipe.regionMode,'scattered');
  assert.equal(recipe.scatteredShapeKind,'imported');
  assert.equal(recipe.scatteredShapeOverrides.length,7);
  const resolved=resolveScene(recipe);
  assert.equal(resolved.objects.length,7);
  assert.deepEqual(resolved.objects.map(x=>x.colorIndex),
    [0,1,2,3,4,5,6]);
  const renders={};
  for(const backend of ['reference','worker']){
    const file=join(out,id+'.full-'+backend+'.png');
    await run('render-headless.mjs',['--recipe',
      join(out,id+'.r0-best-inferred.recipe.json'),
      '--width',String(OUTPUT_WIDTH),'--height',String(OUTPUT_HEIGHT),
      '--backend',backend,'--out',file]);
    const buf=await readFile(file);
    assert.deepEqual(extractPngRecipe(buf),recipe,
      'embedded native-size PNG recipe must recover canonical geometry');
    const png=PNG.sync.read(buf);
    assert.equal(png.width,OUTPUT_WIDTH);
    assert.equal(png.height,OUTPUT_HEIGHT);
    renders[backend]={pixels:png.data,
      encodedBytes:buf.length,pngSha256:sha256(buf)};
  }
  const a=renders.reference.pixels,b=renders.worker.pixels;
  assert.equal(a.length,OUTPUT_WIDTH*OUTPUT_HEIGHT*4);
  assert.equal(b.length,a.length);
  let differingPixelChannels=0,firstDifference=-1;
  for(let i=0;i<a.length;i++)if(a[i]!==b[i]){
    differingPixelChannels++;if(firstDifference<0)firstDifference=i;
  }
  assert.equal(differingPixelChannels,0,
    'actual full-resolution worker/reference RGBA differ at channel '+firstDifference);
  assert.equal(sha256(await readFile(join(out,id+'.no-metadata.png'))),
    originals.get(id),'untouched original source PNG bytes');
  const record={id,bestKind:evaluated.bestKind,
    fitScore96x208:evaluated.bestError,
    fullWidth:OUTPUT_WIDTH,fullHeight:OUTPUT_HEIGHT,
    fullPixels:OUTPUT_WIDTH*OUTPUT_HEIGHT,
    sevenEditableHueObjects:true,
    sourceSha256:originals.get(id),
    nativePngRecipeRoundTrip:true,
    workerAndReferenceDifferingPixelChannels:0,
    nativeReferencePngBytes:renders.reference.encodedBytes,
    nativeWorkerPngBytes:renders.worker.encodedBytes,
    nativeReferencePngSha256:renders.reference.pngSha256,
    nativeWorkerPngSha256:renders.worker.pngSha256};
  records.push(record);
  console.log('CONTOUR_FULLRES_PARITY '+JSON.stringify(record));
}
const report={schema:'roygbiv-source-contour-fullres-parity/v1',
  status:'real-headless-Chromium-current-renderer-not-physical-device',
  cases:records,
  totalPixelsCompared:cases.length*OUTPUT_WIDTH*OUTPUT_HEIGHT,
  workerReferenceParity:true,sourceUnchanged:true,
  sourceOriginalRecipeNotInferred:true};
await writeFile(join(out,'fullres-parity-report.json'),
  JSON.stringify(report,null,2)+'\n');
console.log('CONTOUR_FULLRES_SUMMARY '+JSON.stringify({
  cases:report.cases.length,totalPixelsCompared:report.totalPixelsCompared,
  workerReferenceParity:true,nativeRecipeRoundTrip:true}));
