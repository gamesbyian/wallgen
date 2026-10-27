#!/usr/bin/env node
// Opt-in actual renderer comparison of source-blind imported image fitting.
// A prior Interior Elements stack must not decorate independent source ink.
// Keeps original source bytes unchanged, all artifacts local and explicit.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {PNG} from 'pngjs';
import {normalizeRecipe,HUES} from '../src/model.js';
import {observedHueShapeRecipe} from '../src/image-hue-reconstruction.js';
import {reconstructionCandidates} from '../src/image-reconstruction.js';
import {extractPngRecipe} from '../src/png-metadata.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(process.argv[2]||'artifacts/reconstruction-interior-state');
const exec=promisify(execFile);
await mkdir(out,{recursive:true});
const width=240,height=520,source=new Uint8ClampedArray(width*height*4);
for(let i=0;i<width*height;i++)source[i*4+3]=255;
function rgb(hue){
  const sector=(hue%360)/60,part=255*(1-Math.abs(sector%2-1));
  if(sector<1)return [255,part,0];
  if(sector<2)return [part,255,0];
  if(sector<3)return [0,255,part];
  if(sector<4)return [0,part,255];
  if(sector<5)return [part,0,255];
  return [255,0,part];
}
for(let n=0;n<7;n++){
  const x0=22+(n%3)*76,y0=28+Math.floor(n/3)*162,c=rgb(HUES[n]);
  for(let y=y0;y<y0+55;y++)for(let x=x0;x<x0+33;x++){
    if(n===0&&x>x0+9&&x<x0+22&&y>y0+16&&y<y0+37)continue;
    const at=(y*width+x)*4;
    for(let k=0;k<3;k++)source[at+k]=c[k];
  }
  if(n===0)for(let y=y0+17;y<y0+22;y++)for(let x=x0+39;x<x0+46;x++)
    source.set([255,0,0],(y*width+x)*4);
}
const snapshot=source.slice(),image={data:source,width,height};
const clean=normalizeRecipe({seed:'interior-state-independent',structure:'regions',regionMode:'scattered'});
const prior=normalizeRecipe({...clean,interiorElements:[{
  id:'unrelated-white-outline',enabled:true,type:'line',shape:'straight',
  stroke:'solid',color:'white',placement:'contour',opacity:1,width:6,
  position:0
}]});
const placement={x:0,y:0,width:600,height:1300};
const directClean=observedHueShapeRecipe(image,placement,clean);
const directPolluted=observedHueShapeRecipe(image,placement,prior);
assert.ok(directClean&&directPolluted,'valid seven visible source pigments');
assert.deepEqual(directPolluted.recipe,directClean.recipe);
assert.deepEqual(directPolluted.recipe.interiorElements,[],'stale Elements must be absent');
const sourceCandidates=reconstructionCandidates(image,prior);
assert.ok(sourceCandidates.length>0&&sourceCandidates.length<=6);
assert.ok(sourceCandidates.every(c=>c.recipe.interiorElements.length===0));
assert.deepEqual(image.data,snapshot);
const counterfactual=normalizeRecipe({...directClean.recipe,
  interiorElements:prior.interiorElements});
const recipes=[
  ['clean',directClean.recipe],
  ['previously-decorated',directPolluted.recipe],
  ['old-contaminated-counterfactual',counterfactual]
];
const sourcePng=new PNG({width,height});
sourcePng.data.set(source);
await writeFile(join(out,'unchanged-source.png'),PNG.sync.write(sourcePng));
const pngs=[];
for(const [name,recipe] of recipes){
  const recipePath=join(out,name+'.json'),pngPath=join(out,name+'.png');
  await writeFile(recipePath,JSON.stringify(recipe));
  const args=['scripts/render-headless.mjs','--recipe',recipePath,
    '--backend','reference','--width','480','--height','1040','--out',pngPath];
  if(process.env.ROYGBIV_CHROMIUM_EXECUTABLE)
    args.push('--browser',process.env.ROYGBIV_CHROMIUM_EXECUTABLE);
  await exec(process.execPath,args,{cwd:root,maxBuffer:1e6,timeout:120000});
  const data=await readFile(pngPath);
  assert.deepEqual(extractPngRecipe(data),recipe);
  pngs.push({name,recipe,png:PNG.sync.read(data),data});
}
assert.ok(pngs[0].data.equals(pngs[1].data),
  'same source renders identically regardless of previous Interior Elements');
assert.ok(!pngs[0].data.equals(pngs[2].data),
  'counterfactual old white Interior treatment visibly alters source pixels');
let altered=0,first=-1;
for(let i=0;i<pngs[0].png.data.length;i+=4){
  const a=pngs[0].png.data,b=pngs[2].png.data;
  if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2]){
    altered++;if(first<0)first=i/4;
  }
}
assert.ok(altered>100,'inherited white Interior must be visibly substantial');
function sheet(items){
  const w=240,h=520,canvas=new PNG({width:w*items.length,height:h});
  canvas.data.fill(0);
  for(let i=0;i<items.length;i++)for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const p=items[i],src=(2*y*p.width+2*x)*4,
      dst=(y*canvas.width+i*w+x)*4;
    for(let c=0;c<4;c++)canvas.data[dst+c]=p.data[src+c];
  }
  return PNG.sync.write(canvas);
}
const board=sheet(pngs.map(x=>x.png));
await writeFile(join(out,'real-painter-clean-polluted-counterfactual.png'),board);
const report={schema:'roygbiv-reconstruction-interior-state/v1',
  sourceWidth:width,sourceHeight:height,
  sourceBytesUnchanged:true,exactCleanPollutedEncodedPng:true,
  candidateCount:sourceCandidates.length,candidateBudget:6,
  staleCounterfactualChangedRgbPixels:altered,firstDifferentPixel:first,
  oldInteriorActuallyVisible:true,sourceImageIsIndependentSynthetic:true,
  physicalPixelTested:false};
await writeFile(join(out,'report.json'),JSON.stringify(report,null,2));
console.log('RECON_INTERIOR_SOURCE_PROOF '+JSON.stringify(report));
console.log('RECON_INTERIOR_SOURCE_IMAGE '+board.toString('base64'));
