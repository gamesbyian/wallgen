#!/usr/bin/env node
// Opt-in true-current-painter source/best-fit PNG A/B across R0. No production
// rasterizer, font, cache, source mutation, renderer or inverse ranking code.
// Requires disposable pngjs (installed only in the one-shot workflow).
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {PNG} from 'pngjs';
import {compareReconstructionPixels} from '../src/image-reconstruction.js';
const [newDir,oldDir]=process.argv.slice(2).map(p=>resolve(p));
if(!newDir||!oldDir)throw Error('Provide both current-contour and legacy dirs');
const json=async file=>JSON.parse(await readFile(file,'utf8'));
const image=async file=>{
  const png=PNG.sync.read(await readFile(file));
  return {width:png.width,height:png.height,data:png.data};
};
const equal=(a,b)=>a.width===b.width&&a.height===b.height&&
  a.data.length===b.data.length&&a.data.every((x,i)=>x===b.data[i]);
const modern=await json(join(newDir,'evaluation.json'));
const legacy=await json(join(oldDir,'evaluation.json'));
const previous=new Map(legacy.samples.map(x=>[x.id,x]));
const results=[];
for(const item of modern.samples){
  const before=previous.get(item.id);
  if(!before)throw Error('Missing legacy source control '+item.id);
  const file=item.id+'.r0-source-preview.png';
  const fresh=await image(join(newDir,file));
  const original=await image(join(oldDir,file));
  if(!equal(fresh,original))throw Error('Mutated source pixels '+item.id);
  const hadCandidate=Boolean(before.candidateCount);
  const hasCandidate=Boolean(item.candidateCount);
  let report={id:item.id,sameSourcePixels:true,
    legacyCandidateCount:before.candidateCount,
    insetCandidateCount:item.candidateCount,
    legacyKind:before.bestKind,insetKind:item.bestKind};
  if(hadCandidate&&hasCandidate){
    const a=await image(join(newDir,item.id+'.r0-best-preview.png'));
    const b=await image(join(oldDir,item.id+'.r0-best-preview.png'));
    if(a.width!==96||a.height!==208||b.width!==96||b.height!==208)
      throw Error('Wrong scoring frame');
    const currentScore=compareReconstructionPixels(fresh,a);
    const previousScore=compareReconstructionPixels(fresh,b);
    report={...report,fullErrorBefore:previousScore,fullErrorAfter:currentScore,
      scoreDelta:currentScore-previousScore,
      improved:currentScore+1e-9<previousScore,
      worsened:currentScore>previousScore+1e-9,
      fittedPixelIdentical:equal(a,b),
      meanHueIouBefore:before.inkGeometry?.meanIoU??null,
      meanHueIouAfter:item.inkGeometry?.meanIoU??null};
  }else if(hadCandidate&&!hasCandidate){
    report={...report,worsened:true,lostAutoCandidate:true};
  }else{
    report={...report,worsened:false,unchangedNoCandidate:true};
  }
  results.push(report);
  console.log('SOURCE_CONTOUR_AB '+JSON.stringify(report));
}
if(results.length!==legacy.samples.length)throw Error('Dropped source control');
const summary={schema:'roygbiv-visible-hue-contour-AA-ab/v1',
  provenance:'actual current renderer, same 22 metadata-free sources, source recipe never seen during inverse fitting',
  total:results.length,
  eligible:results.filter(x=>x.fullErrorBefore!==undefined).length,
  improved:results.filter(x=>x.improved).length,
  worsened:results.filter(x=>x.worsened).length,
  sameFitted:results.filter(x=>x.fittedPixelIdentical).length,
  unchangedNoCandidate:results.filter(x=>x.unchangedNoCandidate).length,
  entries:results};
await writeFile(join(newDir,'contour-inset-ab.json'),
  JSON.stringify(summary,null,2)+'\n');
console.log('SOURCE_CONTOUR_AB_SUMMARY '+JSON.stringify({
  total:summary.total,eligible:summary.eligible,improved:summary.improved,
  worsened:summary.worsened,sameFitted:summary.sameFitted,
  unchangedNoCandidate:summary.unchangedNoCandidate}));
if(summary.worsened)throw Error('New contour proposal causes '+summary.worsened+
  ' observed R0 regression(s). Refine evidence gate before shipping.');
