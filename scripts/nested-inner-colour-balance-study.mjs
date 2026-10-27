#!/usr/bin/env node
// Opt-in actual current-production preview comparison, not a shipping
// policy: same source shapes and exact contour engine, two authored gaps.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {PNG} from 'pngjs';
import {normalizeRecipe,resolveScene} from '../src/model.js';
import {DEFAULT_NESTED_CONTOURS,fitNestedShapeContours,planNestedShapeContours}
  from '../src/nested-shape-contours.js';
import {frameImportedSilhouette} from '../src/nested-shape-framing.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(process.argv[2]||'artifacts/nested-inner-balance');
await mkdir(out,{recursive:true});
const exec=promisify(execFile);
const make=(viewBox,outer,holes=[])=>({schema:'roygbiv.geometry-snapshot',
  version:1,geometry:{type:'compound-region',space:'asset-local',
    fillRule:'evenodd',viewBox,components:[{outer,holes}]}});
const ring=(n,fn)=>Array.from({length:n},(_,i)=>fn(i*2*Math.PI/n));
const fixtures=[
  {name:'cloud',shape:make([0,0,600,190],ring(52,a=>{
    const r=1+.18*Math.sin(5*a)+.07*Math.cos(11*a);
    return [300+250*r*Math.cos(a),95+66*r*Math.sin(a)];}))},
  {name:'ellipse',shape:make([0,0,620,140],ring(88,a=>[
    310+280*Math.cos(a),70+41*Math.sin(a)]))},
  {name:'delta',shape:make([0,0,360,360],[
    [180,12],[336,348],[223,260],[180,315],[137,260],[24,348]
  ],[[[180,145],[205,215],[155,215]]])}
];
const base={seed:'inner-balance-study',structure:'regions',
  regionMode:'scattered',scatteredShapeKind:'imported',scatteredCount:1,
  scatteredMinSize:80,scatteredMaxSize:100,scatteredVariation:0,
  scatteredSpacing:0,scatteredEdgeCrop:0,dividerColor:'none',
  dividerWidth:0,palette:'classic',background:'black',material:'none',
  outline:'none',glow:0,textureStrength:0,lightingMood:'off'};
const colors=[0,29,52,136,212,244,278];
function hue(r,g,b){
  const m=Math.max(r,g,b),n=Math.min(r,g,b),d=m-n;
  if(m<=85||d<=65)return null;
  const raw=m===r?(g-b)/d%6:m===g?(b-r)/d+2:(r-g)/d+4;
  return ((raw*60)%360+360)%360;
}
function colourPixels(png){
  const count=Array(7).fill(0);
  for(let i=0;i<png.data.length;i+=4){
    const h=hue(...png.data.subarray(i,i+3));
    if(h===null)continue;
    const d=colors.map(target=>Math.min(Math.abs(h-target),360-Math.abs(h-target)));
    const best=Math.min(...d); if(best<=14)count[d.indexOf(best)]++;
  }
  return count;
}
function contourLength(contour){
  const pts=contour.points;
  let length=0;
  for(let i=1;i<pts.length;i++)
    length+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);
  if(contour.closed&&pts.length>1)length+=Math.hypot(
    pts[0].x-pts.at(-1).x,pts[0].y-pts.at(-1).y);
  return length;
}
const bins=[[],[],[]],reports=[];
for(const [i,fixture] of fixtures.entries()){
  const snapshot=JSON.stringify(fixture.shape);
  const original=normalizeRecipe({...base,seed:base.seed+'-'+i,
    scatteredShape:fixture.shape,
    scatteredOverrides:[frameImportedSilhouette(fixture.shape.geometry)],
    nestedShapeContours:{...DEFAULT_NESTED_CONTOURS,gap:30}});
  const source=resolveScene(original).objects[0];
  const fit=fitNestedShapeContours(source.rings,original.nestedShapeContours);
  assert.ok(fit.fitted,fixture.name+': '+fit.reason);
  const gap=fit.settings.gap;
  const moderate=Math.max(.5,Math.floor(gap*.75*2)/2);
  const tighter=Math.max(.5,Math.floor(gap*.65*2)/2);
  const states=[
    {label:'current-max-survival',settings:fit.settings},
    {label:'moderate-75pct',settings:{...fit.settings,gap:moderate}},
    {label:'tighter-65pct',settings:{...fit.settings,gap:tighter}}
  ];
  for(const [variant,item] of states.entries()){
    const recipe=normalizeRecipe({...original,nestedShapeContours:item.settings});
    const report=planNestedShapeContours(source.rings,recipe.nestedShapeContours);
    assert.equal(report.visibleCount,7,fixture.name+' '+item.label+' must retain 7 levels');
    const lengths=report.levels.map(level=>level.contours
      .reduce((sum,c)=>sum+contourLength(c),0));
    const path=join(out,fixture.name+'-'+item.label+'.png');
    const recipePath=join(out,fixture.name+'-'+item.label+'.json');
    await writeFile(recipePath,JSON.stringify(recipe,null,2));
    const args=['scripts/render-headless.mjs','--recipe',recipePath,
      '--backend','reference','--width','480','--height','1040',
      '--out',path];
    if(process.env.ROYGBIV_CHROMIUM_EXECUTABLE)
      args.push('--browser',process.env.ROYGBIV_CHROMIUM_EXECUTABLE);
    await exec(process.execPath,args,{cwd:root,timeout:120000,maxBuffer:1e6});
    const bytes=await readFile(path),png=PNG.sync.read(bytes);
    bins[variant].push(png);
    const ink=colourPixels(png);
    assert.ok(ink.every(n=>n>20),fixture.name+' '+item.label+' missing visible colour');
    const result={source:fixture.name,variant:item.label,
      gap:item.settings.gap,allSevenVisible:true,
      sourceUnchanged:JSON.stringify(fixture.shape)===snapshot,
      pixelsPerHue:ink,
      violetToRedInkRatio:+(ink[6]/ink[0]).toFixed(4),
      violetToRedContourLengthRatio:+(lengths[6]/lengths[0]).toFixed(4),
      contourComponents:report.levels.map(l=>l.contours.length)};
    reports.push(result);console.log('NESTED_BALANCE '+JSON.stringify(result));
  }
}
function contact(images){
  const width=240*images.length,height=520;
  const canvas=new PNG({width,height});
  canvas.data.fill(0);
  for(const [index,png] of images.entries()){
    for(let y=0;y<520;y++)for(let x=0;x<240;x++){
      const sy=y*2,sx=x*2;
      const dst=(y*width+index*240+x)*4,src=(sy*png.width+sx)*4;
      for(let k=0;k<4;k++)canvas.data[dst+k]=png.data[src+k];
    }
  }
  return PNG.sync.write(canvas);
}
const before=contact(bins[0]),moderate=contact(bins[1]),after=contact(bins[2]);
await writeFile(join(out,'current-contact.png'),before);
await writeFile(join(out,'moderate-contact.png'),moderate);
await writeFile(join(out,'tighter-contact.png'),after);
await writeFile(join(out,'report.json'),JSON.stringify({schema:'roygbiv-ink-balance-study/v1',
  verifiedArtRatherThanInferred:true,noPixelOrHumanClaims:true,reports},null,2));
console.log('NESTED_BALANCE_CURRENT_IMAGE '+before.toString('base64'));
console.log('NESTED_BALANCE_MODERATE_IMAGE '+moderate.toString('base64'));
console.log('NESTED_BALANCE_TIGHTER_IMAGE '+after.toString('base64'));
