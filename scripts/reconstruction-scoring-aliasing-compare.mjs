#!/usr/bin/env node
// Disposable research-only scoring A/B on production source-vs-fitted PNGs.
// npm install --no-save pngjs@7; not a runtime dependency or fitting owner.
// Call: node scripts/reconstruction-scoring-aliasing-compare.mjs new-dir old-dir
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {PNG} from 'pngjs';
import {compareReconstructionPixels} from '../src/image-reconstruction.js';
const [newDir,oldDir]=process.argv.slice(2).map(resolve);
if(!newDir||!oldDir)throw Error('Provide new/old evaluation directories');
const readJSON=async p=>JSON.parse(await readFile(p,'utf8'));
const readPng=async p=>{
  const png=PNG.sync.read(await readFile(p));
  return {width:png.width,height:png.height,data:png.data};
};
const compareRGB=(a,b,skip=8)=>{
  if(a.width!==b.width||a.height!==b.height)throw Error('Mismatched images');
  let loss=0,samples=0;
  for(let i=0;i<a.data.length;i+=skip){
    const ar=a.data[i],ag=a.data[i+1],ab=a.data[i+2];
    const br=b.data[i],bg=b.data[i+1],bb=b.data[i+2];
    const rgb=(Math.abs(ar-br)+Math.abs(ag-bg)+Math.abs(ab-bb))/(3*255);
    const ink=Math.abs(Math.max(ar,ag,ab)-Math.max(br,bg,bb))/255;
    loss+=rgb*.75+ink*.25;samples++;
  }
  return loss/Math.max(samples,1);
};
const old=await readJSON(join(oldDir,'evaluation.json'));
const newer=await readJSON(join(newDir,'evaluation.json'));
const oldIndex=new Map(old.samples.map(v=>[v.id,v]));
const results=[];
for(const fresh of newer.samples){
  const prior=oldIndex.get(fresh.id);
  if(!prior||!fresh.candidateCount||!prior.candidateCount)
    throw Error('Missing candidate/control '+fresh.id);
  const name=fresh.id+'.r0-source-preview.png';
  const source=await readPng(join(newDir,name));
  const sourcePrior=await readPng(join(oldDir,name));
  const pixelExact=source.data.length===sourcePrior.data.length&&
    source.data.every((value,i)=>value===sourcePrior.data[i]);
  if(!pixelExact)throw Error('Source pixel changed for '+fresh.id);
  const newFit=await readPng(join(newDir,fresh.id+'.r0-best-preview.png'));
  const oldFit=await readPng(join(oldDir,prior.id+'.r0-best-preview.png'));
  if(source.width!==96||source.height!==208)throw Error('Wrong fit frame');
  const freshFull=compareReconstructionPixels(source,newFit);
  const oldFull=compareReconstructionPixels(source,oldFit);
  // An independent legacy formulation tests the exact original i+=8 loss.
  const freshLegacy=compareRGB(source,newFit,8);
  const oldLegacy=compareRGB(source,oldFit,8);
  if(Math.abs(freshFull-compareRGB(source,newFit,4))>1e-10)
    throw Error('Unexpected production full-pixel scorer implementation');
  const record={id:fresh.id,
    sourceIdentical:true,
    old:{kind:prior.bestKind,legacy:oldLegacy,full:oldFull,
      iou:prior.inkGeometry?.meanIoU??null},
    full:{kind:fresh.bestKind,legacy:freshLegacy,full:freshFull,
      iou:fresh.inkGeometry?.meanIoU??null},
    absoluteFullDifference:freshFull-oldFull,
    improvedFull:freshFull+1e-9<oldFull,
    sameKind:fresh.bestKind===prior.bestKind,
    sameFittedPixels:newFit.data.length===oldFit.data.length&&
      newFit.data.every((value,i)=>value===oldFit.data[i])};
  results.push(record);
  console.log('FULL_FRAME_SCORE_AB '+JSON.stringify(record));
}
if(new Set(results.map(r=>r.id)).size!==newer.samples.length)
  throw Error('Missing source controls');
const report={schema:'roygbiv-inverse-loss-aliased-ab/v1',
  purpose:'two scoring policies, same real sources and painter, not human art signoff',
  total:results.length,
  fullImproved:results.filter(x=>x.improvedFull).length,
  fullWorse:results.filter(x=>x.absoluteFullDifference>1e-9).length,
  sameFittedPixels:results.filter(x=>x.sameFittedPixels).length,
  controls:results};
await writeFile(join(newDir,'scoring-ab.json'),JSON.stringify(report,null,2)+'\n');
console.log('FULL_FRAME_SCORE_AB_SUMMARY '+JSON.stringify({
  total:report.total,fullImproved:report.fullImproved,
  fullWorse:report.fullWorse,sameFittedPixels:report.sameFittedPixels}));
