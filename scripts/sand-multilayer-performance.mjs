#!/usr/bin/env node
// Reusable exact-art 3-layer sand performance study. Compare the JSON output
// between two source revisions under the same Chromium install/runner.
// This is never a Pixel thermals, material quality or universal speed claim.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {compoundStitchRecipe} from './compound-stitch-fixture.mjs';
import {normalizeRecipe} from '../src/model.js';

const root=resolve('.'),out=resolve('artifacts/sand-layer-performance');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
  '.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
  try{
    const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=resolve(root,'.'+(name==='/'?'/index.html':name));
    if(!file.startsWith(root+'/')){res.writeHead(403).end();return;}
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'})
      .end(await readFile(file));
  }catch{res.writeHead(404).end('not found');}
});
const listen=()=>new Promise((ok,fail)=>{
  server.once('error',fail);server.listen(0,'127.0.0.1',ok);
});
const three=(material,scales=[37,37,37])=>normalizeRecipe({
  ...compoundStitchRecipe('sand-layer-perf-source'),
  material,textureCoverage:'stripes',textureStrength:65,
  textureScale:scales[0],textureLayer2Enabled:true,material2:material,
  textureCoverage2:'stripes',textureStrength2:58,textureScale2:scales[1],
  textureLayer3Enabled:true,material3:material,textureCoverage3:'stripes',
  textureStrength3:52,textureScale3:scales[2],
  lightingMood:'golden',lightDirection:'top-left',
  lightStrength:65,shadowStrength:65
});
const scenarios=[
  ['beads-three',three('sand-beaded')],
  ['filigree-three-same',three('sand-filigree')],
  ['filigree-three-different',three('sand-filigree',[18,50,83])],
  ['beads-one',normalizeRecipe({...three('sand-beaded'),
    textureLayer2Enabled:false,textureLayer3Enabled:false})],
  ['filigree-one',normalizeRecipe({...three('sand-filigree'),
    textureLayer2Enabled:false,textureLayer3Enabled:false})],
];
await listen();
let browser;
try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:412,height:892},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',
    {waitUntil:'domcontentloaded'});
  await mkdir(out,{recursive:true});
  const result=[];
  for(const [name,recipe] of scenarios){
    const sample=await page.evaluate(async recipe=>{
      const {drawWallpaper}=await import('/src/renderer.js');
      const {resolveScene}=await import('/src/model.js');
      const {sandBeadStyles,paintSandRegionBeads}=await import('/src/sand-beads.js');
      const {sandEchoStyles,paintSandRegionEchoes}=await import('/src/sand-contour-echo.js');
      const scene=resolveScene(recipe),object=scene.objects.find(o=>o.kind==='region');
      if(!object||!object.rings||object.rings.length!==3)
        throw Error('Benchmark lost real imported compound rings and island');
      const canvas=document.createElement('canvas');
      canvas.width=600;canvas.height=1300;
      // Real complete production painter; warm the browser before sampling.
      drawWallpaper(canvas,recipe);
      const renderMs=[];
      for(let i=0;i<3;i++){
        const start=performance.now();
        drawWallpaper(canvas,recipe);
        renderMs.push(performance.now()-start);
      }
      const png=canvas.toDataURL('image/png');
      // Isolate only the known redundant source-geometry work. Retain genuine
      // source rings/styles, the real painters and original Canvas2D commands.
      const painter=recipe.material==='sand-beaded'?paintSandRegionBeads:paintSandRegionEchoes;
      const styles=recipe.material==='sand-beaded'?sandBeadStyles(scene):sandEchoStyles(scene);
      const bounds={left:0,top:0,right:600,bottom:1300};
      const micro=document.createElement('canvas');
      micro.width=600;micro.height=1300;
      const ctx=micro.getContext('2d');
      const times=[];
      for(let pass=0;pass<6;pass++){
        ctx.clearRect(0,0,600,1300);
        const start=performance.now();
        for(let i=0;i<5;i++)painter(ctx,object,styles,bounds);
        times.push((performance.now()-start)/5);
      }
      return {png,renderMs,geometryMs:times,styles:styles.length,
        rings:object.rings.length,material:recipe.material};
    },recipe);
    const bytes=Buffer.from(sample.png.slice(sample.png.indexOf(',')+1),'base64');
    assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');
    assert.equal(bytes.readUInt32BE(16),600);assert.equal(bytes.readUInt32BE(20),1300);
    assert.equal(sample.rings,3);
    const sha256=createHash('sha256').update(bytes).digest('hex');
    await writeFile(join(out,name+'.png'),bytes);
    result.push({name,sha256,pngBytes:bytes.length,styles:sample.styles,
      renderMs:sample.renderMs,geometryMs:sample.geometryMs,
      medianRenderMs:[...sample.renderMs].sort((a,b)=>a-b)[1],
      medianGeometryMs:[...sample.geometryMs].sort((a,b)=>a-b)[3]});
  }
  assert.deepEqual(errors,[]);
  const report={source:process.env.GITHUB_SHA||'local',chromium:'Linux headless',
    note:'Same-source rendered PNG and timed Canvas2D routines; not a Pixel 6 Pro benchmark',
    results:result};
  await writeFile(join(out,'measurements.json'),JSON.stringify(report,null,2)+'\n');
  console.log('SAND_LAYER_PERFORMANCE',JSON.stringify(report));
}finally{
  await browser?.close();await new Promise(done=>server.close(done));
}
