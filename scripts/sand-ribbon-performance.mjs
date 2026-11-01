#!/usr/bin/env node
// Production ribbon source-art + source-geometry microtiming for triple-layer
// sand filigree. Compare baseline/main results on the SAME Chromium runner.
// Preserve actual source-world coordinates, never fabricate fast preview art.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {normalizeRecipe} from '../src/model.js';

const root=resolve('.'),out=resolve('artifacts/sand-ribbon-performance');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
  try{
    const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=resolve(root,'.'+(name==='/'?'/index.html':name));
    if(!file.startsWith(root+'/')){res.writeHead(403).end();return;}
    res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'})
      .end(await readFile(file));
  }catch{res.writeHead(404).end('not found');}
});
const listen=()=>new Promise((resolve,reject)=>{
  server.once('error',reject);server.listen(0,'127.0.0.1',resolve);
});
const recipe=(geometry,three)=>normalizeRecipe({
  seed:'ribbon-station-performance-'+geometry,
  family:'studio',structure:'paths',geometry,construction:'ribbon',
  motif:'solid',outline:'none',stripeWidth:80,spread:42,
  textureDisplacement:0,
  material:'sand-filigree',textureCoverage:'stripes',
  textureStrength:76,textureScale:42,
  textureLayer2Enabled:three,material2:'sand-filigree',
  textureCoverage2:'stripes',textureStrength2:63,textureScale2:42,
  textureLayer3Enabled:three,material3:'sand-filigree',
  textureCoverage3:'stripes',textureStrength3:58,textureScale3:64,
  lightingMood:'golden',lightDirection:'top-left',lightStrength:72,shadowStrength:68
});
const cases=[
  ['wave-three',recipe('wave',true)],
  ['loops-three',recipe('loops',true)],
  ['wave-one',recipe('wave',false)],
  ['loops-one',recipe('loops',false)],
];
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
await listen();
let browser;
try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:412,height:892},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{
    waitUntil:'domcontentloaded'});
  await mkdir(out,{recursive:true});
  const results=[];
  for(const [name,source] of cases){
    const sample=await page.evaluate(async source=>{
      const {drawWallpaper}=await import('/src/renderer.js');
      const {resolveScene}=await import('/src/model.js');
      const {paintSandRibbonEchoes,sandEchoStyles}=await import('/src/sand-contour-echo.js');
      const {samplePath,ribbonEdge,widthAt}=await import('/src/path-geometry.js');
      const scene=resolveScene(source),stripe=scene.stripes[3];
      const styles=sandEchoStyles(scene);
      if(!stripe||styles.length!==(source.textureLayer2Enabled?3:1))
        throw Error('Sand ribbon benchmark did not resolve expected real layers');
      const canvas=document.createElement('canvas');
      canvas.width=600;canvas.height=1300;
      // Warm up once; still repaint full exact canonical art each measurement.
      drawWallpaper(canvas,source);
      const renderMs=[];
      for(let i=0;i<3;i++){
        const start=performance.now();drawWallpaper(canvas,source);
        renderMs.push(performance.now()-start);
      }
      const png=canvas.toDataURL('image/png');
      const micro=document.createElement('canvas');
      micro.width=600;micro.height=1300;
      const ctx=micro.getContext('2d');
      const geometryMs=[];
      let pathCount=0;
      for(let pass=0;pass<6;pass++){
        ctx.clearRect(0,0,600,1300);
        const start=performance.now();
        for(let repeat=0;repeat<4;repeat++)
          pathCount+=paintSandRibbonEchoes(ctx,stripe,scene.extent,styles,
            (station,side)=>ribbonEdge(stripe,station,scene.extent,side),
            station=>samplePath(stripe,station,scene.extent),
            station=>widthAt(stripe,station,scene.extent));
        geometryMs.push((performance.now()-start)/4);
      }
      return {png,renderMs,geometryMs,styles:styles.length,pathCount};
    },source);
    assert.equal(sample.styles,name.endsWith('three')?3:1);
    assert(sample.pathCount>0);
    const bytes=Buffer.from(sample.png.split(',')[1],'base64');
    assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');
    assert.equal(bytes.readUInt32BE(16),600);assert.equal(bytes.readUInt32BE(20),1300);
    const sha256=createHash('sha256').update(bytes).digest('hex');
    await writeFile(join(out,name+'.png'),bytes);
    results.push({name,sha256,styles:sample.styles,
      pathCount:sample.pathCount,renderMs:sample.renderMs,
      geometryMs:sample.geometryMs,medianRenderMs:median(sample.renderMs),
      medianGeometryMs:median(sample.geometryMs)});
  }
  assert.deepEqual(errors,[]);
  const report={source:process.env.GITHUB_SHA||'local',
    environment:'Linux headless Chromium, no physical Pixel',
    note:'Authentic production wave/loops pixels and geometry samples; measurements are exploratory',
    results};
  await writeFile(join(out,'measurements.json'),JSON.stringify(report,null,2)+'\n');
  console.log('SAND_RIBBON_SOURCE_METRICS',JSON.stringify(report));
}finally{
  await browser?.close();
  await new Promise(done=>server.close(done));
}
