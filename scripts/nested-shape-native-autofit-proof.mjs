#!/usr/bin/env node
// Opt-in native-resolution Auto-fit visual proof for #815. No claim of
// physical Android/Pixel, human artistic approval, or source-image inversion.
// Render through the real reference + worker headless output paths.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {PNG} from 'pngjs';
import {normalizeRecipe,resolveScene} from '../src/model.js';
import {DEFAULT_NESTED_CONTOURS,fitNestedShapeContours,
  planNestedShapeContours} from '../src/nested-shape-contours.js';
import {frameImportedSilhouette} from '../src/nested-shape-framing.js';
import {extractPngRecipe} from '../src/png-metadata.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(process.argv[2]||'artifacts/nested-autofit-native');
await mkdir(out,{recursive:true});
const exec=promisify(execFile);
const sha=buffer=>createHash('sha256').update(buffer).digest('hex');
const radians=(i,n)=>2*Math.PI*i/n;
const make=(viewBox,outer,holes=[])=>({
  schema:'roygbiv.geometry-snapshot',version:1,geometry:{
    type:'compound-region',space:'asset-local',fillRule:'evenodd',
    viewBox,components:[{outer,holes}]
  }
});
const cloud=Array.from({length:52},(_,i)=>{
  const a=radians(i,52),r=1+.18*Math.sin(5*a)+.07*Math.cos(11*a);
  return [300+250*r*Math.cos(a),95+66*r*Math.sin(a)];
});
const ellipse=Array.from({length:88},(_,i)=>{
  const a=radians(i,88);return [310+280*Math.cos(a),70+41*Math.sin(a)];
});
const delta=[
  [180,12],[336,348],[223,260],[180,315],[137,260],[24,348]
];
const triangle=[[180,145],[205,215],[155,215]];
const fixtures=[
  {name:'elongated-cloud',snapshot:make([0,0,600,190],cloud)},
  {name:'skinny-ellipse',snapshot:make([0,0,620,140],ellipse)},
  {name:'delta-with-hole',snapshot:make([0,0,360,360],delta,[triangle])}
];
const base={
  seed:'native-autofit-proof',structure:'regions',regionMode:'scattered',
  scatteredShapeKind:'imported',scatteredCount:1,scatteredMinSize:80,
  scatteredMaxSize:100,scatteredVariation:0,scatteredSpacing:0,
  scatteredEdgeCrop:0,dividerColor:'none',dividerWidth:0,
  palette:'classic',background:'black',material:'none',outline:'none',
  glow:0,textureStrength:0,lightingMood:'off'
};
const WIDTH=3024,HEIGHT=6552;
const browserArgs=process.env.ROYGBIV_CHROMIUM_EXECUTABLE?
  ['--browser',process.env.ROYGBIV_CHROMIUM_EXECUTABLE]:[];
const runs=[],previews=[],crops=[];
function copyPixel(src,sx,sy,dst,dx,dy){
  const si=(sy*src.width+sx)*4,di=(dy*dst.width+dx)*4;
  for(let k=0;k<4;k++)dst.data[di+k]=src.data[si+k];
}
function board(items,{native=false}={}){
  const w=native?420:240,h=native?420:520;
  const output=new PNG({width:w*items.length,height:h,fill:true});
  output.data.fill(0);
  for(let i=0;i<items.length;i++){
    const png=items[i];
    const aspect=png.width/png.height;
    const dstw=Math.min(w,Math.floor(h*aspect));
    const dsth=Math.min(h,Math.floor(w/aspect));
    const xoff=Math.floor((w-dstw)/2),yoff=Math.floor((h-dsth)/2);
    for(let y=0;y<dsth;y++)for(let x=0;x<dstw;x++){
      const sx=Math.min(png.width-1,Math.floor(x*png.width/dstw));
      const sy=Math.min(png.height-1,Math.floor(y*png.height/dsth));
      copyPixel(png,sx,sy,output,i*w+xoff+x,yoff+y);
    }
  }
  return PNG.sync.write(output,{colorType:6});
}
for(const [index,fixture] of fixtures.entries()){
  const original=JSON.stringify(fixture.snapshot);
  const framed=frameImportedSilhouette(fixture.snapshot.geometry);
  assert.ok(framed,fixture.name+' cannot safely frame');
  const initial=normalizeRecipe({...base,seed:base.seed+'-'+index,
    scatteredShape:fixture.snapshot,scatteredOverrides:[framed],
    nestedShapeContours:{...DEFAULT_NESTED_CONTOURS,gap:30}});
  const object=resolveScene(initial).objects.find(o=>o.id==='region-0');
  assert.ok(object?.rings?.length,fixture.name+' has no imported region');
  const fitted=fitNestedShapeContours(object.rings,initial.nestedShapeContours);
  assert.ok(fitted.fitted,fixture.name+': '+fitted.reason);
  const recipe=normalizeRecipe({...initial,nestedShapeContours:fitted.settings});
  const scene=resolveScene(recipe);
  const report=planNestedShapeContours(scene.objects[0].rings,recipe.nestedShapeContours);
  assert.equal(report.visibleCount,7,fixture.name+' missing one of seven levels');
  assert.deepEqual(recipe.scatteredShape,initial.scatteredShape);
  assert.equal(JSON.stringify(fixture.snapshot),original);
  await writeFile(join(out,fixture.name+'.json'),JSON.stringify(recipe,null,2));
  const render=async(width,height,backend)=>{
    const path=join(out,fixture.name+'-'+width+'-'+backend+'.png');
    const args=['scripts/render-headless.mjs','--recipe',
      join(out,fixture.name+'.json'),'--backend',backend,
      '--width',String(width),'--height',String(height),
      '--out',path,...browserArgs];
    const started=performance.now();
    const output=await exec(process.execPath,args,{cwd:root,timeout:240000,
      maxBuffer:8*1024*1024});
    const bytes=await readFile(path);
    assert.deepEqual(extractPngRecipe(bytes),recipe,'metadata roundtrip');
    return {path,bytes,elapsedMs:Math.round(performance.now()-started),
      headlessLog:output.stdout.slice(0,160)};
  };
  const smallRef=await render(480,1040,'reference');
  const smallWorker=await render(480,1040,'worker');
  assert.ok(smallRef.bytes.equals(smallWorker.bytes),
    fixture.name+' preview worker/reference PNGs differ');
  const ref=await render(WIDTH,HEIGHT,'reference');
  const worker=await render(WIDTH,HEIGHT,'worker');
  assert.ok(ref.bytes.equals(worker.bytes),
    fixture.name+' native worker/reference PNGs differ');
  const preview=PNG.sync.read(smallRef.bytes),full=PNG.sync.read(ref.bytes);
  previews.push(preview);
  // Native sharp-corner/pinch art, actual 1:1 source pixels, NOT scaled
  // thumbnail reconstruction: choose the upper central painted artwork
  // for Delta and the centre-right outlines for elongated silhouettes.
  // The Delta's upper tip starts around y=0.29 in this canonical
  // frame. Do not silently archive a black crop as "apex inspection".
  const top=index===2?Math.round(HEIGHT*.29):Math.round(HEIGHT*.46);
  const left=index===2?Math.round(WIDTH*.42):Math.round(WIDTH*.52);
  const crop=new PNG({width:420,height:420});
  for(let y=0;y<420;y++)for(let x=0;x<420;x++)
    copyPixel(full,Math.min(WIDTH-1,left+x),Math.min(HEIGHT-1,top+y),crop,x,y);
  crops.push(crop);
  await writeFile(join(out,fixture.name+'-native-crop.png'),PNG.sync.write(crop));
  // Actual pixel evidence: seven geometric levels aren't enough when
  // low-scale rasterization could erase an entire colour. Classify real
  // high-chroma reference pixels by their nearest canonical ROYGBIV hue.
  const hueTargets=[0,29,52,136,212,244,278];
  const huePixels=Array(7).fill(0);
  const inkHue=(r,g,b)=>{
    const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
    if(d<=65||max<=85)return null;
    let h=0;
    if(max===r)h=((g-b)/d)%6;
    else if(max===g)h=(b-r)/d+2;
    else h=(r-g)/d+4;
    return ((h*60)%360+360)%360;
  };
  for(let i=0;i<preview.data.length;i+=4){
    const h=inkHue(...preview.data.subarray(i,i+3));
    if(h===null)continue;
    const distances=hueTargets.map(target=>
      Math.min(Math.abs(h-target),360-Math.abs(h-target)));
    const best=Math.min(...distances),slot=distances.indexOf(best);
    if(best<=14)huePixels[slot]++;
  }
  assert.ok(huePixels.every(count=>count>30),
    fixture.name+': each of the seven colours must produce actual visible PNG pixels: '+huePixels);
  let cropInk=0;
  for(let i=0;i<crop.data.length;i+=4)
    if(inkHue(...crop.data.subarray(i,i+3))!==null)cropInk++;
  assert.ok(cropInk>70,
    fixture.name+': actual 1:1 native crop missed all painted outline detail');
  const result={
    name:fixture.name,requested:7,visible:report.visibleCount,
    inputGap:30,fittedGap:fitted.settings.gap,
    autoFitChanged:fitted.changed,
    outputWidth:WIDTH,outputHeight:HEIGHT,
    exactNativePngParity:true,exactPreviewPngParity:true,
    sourceSnapshotUnchanged:true,roundTrip:true,
    sha256:sha(ref.bytes),strongChromaticPixels:
      huePixels.reduce((a,b)=>a+b,0),
    independentlyPaintedHueSlots:huePixels.filter(n=>n>30).length,
    previewHuePixels:huePixels,nativeCropInkPixels:cropInk,
    contourComponents:report.levels.map(l=>l.contours.length),
    renderingMs:{previewReference:smallRef.elapsedMs,
      previewWorker:smallWorker.elapsedMs,
      nativeReference:ref.elapsedMs,nativeWorker:worker.elapsedMs}
  };
  assert.ok(result.strongChromaticPixels>100,
    fixture.name+' must have real colour ink');
  runs.push(result);console.log('NESTED_NATIVE_ACCEPT '+JSON.stringify(result));
}
// Surface the TRUE generated thumbnails and native 1:1 contour crops to
// reviewers rather than asking anyone to trust filenames or numeric scores.
// Binary/base64 goes into temporary *manual* workflow logs only, never source
// or automatic CI. Images are additionally archived as PNGs.
const overview=board(previews);
const cropBoard=board(crops,{native:true});
await writeFile(join(out,'whole-art-preview-contact.png'),overview);
await writeFile(join(out,'actual-native-1to1-crop-contact.png'),cropBoard);
await writeFile(join(out,'report.json'),JSON.stringify({
  schema:'roygbiv-nested-native-autofit/v1',
  nativeOutputProducedByRealRenderer:true,
  sourceSavedWithoutMutation:true,
  localFilesOnly:true,physicalPixelTested:false,
  designerJudgement:false,images:runs
},null,2));
console.log('NESTED_NATIVE_PREVIEW_DATA '+overview.toString('base64'));
console.log('NESTED_NATIVE_CROPS_DATA '+cropBoard.toString('base64'));
console.log('NESTED_NATIVE_SUMMARY '+JSON.stringify(runs));
