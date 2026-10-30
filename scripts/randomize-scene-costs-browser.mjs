#!/usr/bin/env node
/**
 * Actual production OffscreenCanvas preview worker cost sweep over FIXED
 * Random-generated canonical scenes. Worker message.ms excludes browser
 * bootstrap/transport; enough to locate cost outliers, not user E2E latency.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,join} from 'node:path';
import {chromium} from 'playwright';
const root=process.cwd(),mime={
 '.html':'text/html','.js':'text/javascript','.css':'text/css',
 '.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'
};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const f=resolve(root,'.'+(path==='/'?'/index.html':path));
  if(!f.startsWith(root+'/')){res.writeHead(403).end();return;}
  res.writeHead(200,{'content-type':mime[extname(f)]||'application/octet-stream',
    'cache-control':'no-store'}).end(await readFile(f));
 }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let browser;
try{
  browser=await chromium.launch({headless:true,
    ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:412,height:892}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(async()=>{
    const {randomizeAllRecipe}=await import('/src/model.js');
    const worker=new Worker('/src/render-worker.js',{type:'module'});
    let identifier=0,receiver=null,readyResolve;
    const ready=new Promise((resolve,reject)=>{
      readyResolve=resolve;
      setTimeout(()=>reject(Error('Render worker never became ready')),30000);
    });
    worker.onmessage=({data})=>{
      if(data?.type==='ready'){readyResolve();return;}
      if(data?.type==='unsupported'){readyResolve(Promise.reject(Error(data.error)));return;}
      receiver?.(data);
    };
    await ready;
    const render=(recipe,width,height,quality='interactive')=>new Promise((resolve,reject)=>{
      const id=++identifier;
      const timeout=setTimeout(()=>{
        receiver=null;reject(Error('Timed out '+recipe.seed));
      },45000);
      receiver=message=>{
        if(message.id!==id)return;
        clearTimeout(timeout);receiver=null;
        for(const k of ['frame','ink','background'])message[k]?.close?.();
        if(message.type==='error')reject(Error(message.error));
        else if(message.type==='frame')resolve(message.ms);
        else reject(Error('Unexpected '+message.type));
      };
      worker.postMessage({type:'preview',id,key:recipe.seed,recipe,width,height,quality});
    });
    const rows=[];
    // Explicit stable seed corpus: every run will paint the SAME art.
    // Full-coverage randomizeAll() settings, including the occasional
    // radical texture, regional/scattered geometry or displacement.
    for(let i=0;i<32;i++){
      const seed='random-perf-fixed-'+String(i).padStart(2,'0');
      const recipe=randomizeAllRecipe({seed});
      const ms=await render(recipe,372,806);
      rows.push({
        seed,ms:Math.round(ms),
        structure:recipe.structure,regionMode:recipe.regionMode,
        geometry:recipe.geometry,construction:recipe.construction,
        material:recipe.material,material2:recipe.material2,
        material3:recipe.material3,layer2:recipe.textureLayer2Enabled,
        layer3:recipe.textureLayer3Enabled,
        textureDisplacement:recipe.textureDisplacement,
        surfaceTreatments:recipe.surfaceTreatments?.length||0,
        regionCount:recipe.regionCount,scatteredCount:recipe.scatteredCount,
        rayCount:recipe.rayCount,
        photoLook:recipe.photoLook?.presetId||null
      });
    }
    const slowest=rows.slice().sort((a,b)=>b.ms-a.ms).slice(0,6);
    const repeats=[];
    for(const row of slowest){
      const recipe=randomizeAllRecipe({seed:row.seed});
      repeats.push({
        seed:row.seed,
        interactive:[await render(recipe,372,806),await render(recipe,372,806)].map(Math.round),
        settled:[await render(recipe,600,1300,'settled')].map(Math.round),
      });
    }
    // Diagnostic ablation ONLY. These are NOT proposed visual shortcuts:
    // compare the exact same seed while disabling one expensive subsystem.
    // It identifies where to optimize without changing production pixels.
    const ablation=[];
    for(const row of slowest.slice(0,2)){
      const recipe=randomizeAllRecipe({seed:row.seed});
      const trials=[
        ['unaltered',recipe],
        ['no-material',{...recipe,material:'none',textureStrength:0,
          textureLayer2Enabled:false,textureLayer3Enabled:false}],
        ['no-displacement',{...recipe,textureDisplacement:0}],
        ['no-interior',{...recipe,interiorElements:[]}],
        ['no-outline',{...recipe,outline:'none'}],
        ['simple-path-or-rays',{...recipe,geometry:'straight',
          rayCount:7,radialMode:'spokes'}],
        ['few-rays',{...recipe,rayCount:7}],
        ['solid-motif',{...recipe,motif:'solid'}],
      ];
      const measures=[];
      for(const [label,variant] of trials){
        // Run twice: the second value is a warm-worker measurement. The
        // entire renderer is still exercised on each measurement.
        const times=[await render(variant,372,806),
          await render(variant,372,806)];
        measures.push({label,times:times.map(Math.round)});
      }
      ablation.push({seed:row.seed,recipe:{
        structure:recipe.structure,geometry:recipe.geometry,radialMode:recipe.radialMode,
        rayCount:recipe.rayCount,construction:recipe.construction,
        material:recipe.material,textureStrength:recipe.textureStrength,
        textureDisplacement:recipe.textureDisplacement,motif:recipe.motif,
        outline:recipe.outline,interior:recipe.interiorElements.length,
      },measures});
    }
    worker.terminate();
    return {rows,slowest,repeats,ablation};
  });
  assert.deepEqual(errors,[]);
  assert.equal(result.rows.length,32);
  for(const r of result.rows)assert.ok(Number.isFinite(r.ms)&&r.ms>0);
  await mkdir(join(root,'artifacts','randomize-scene-costs'),{recursive:true});
  await writeFile(join(root,'artifacts','randomize-scene-costs','sample.json'),
    JSON.stringify({environment:'Linux Chromium OffscreenCanvas worker 372x806/600x1300',
      result},null,2)+'\n');
  console.log('RANDOM_RENDER_COST_TOP',JSON.stringify(result.slowest));
  console.log('RANDOM_RENDER_COST_REPEAT',JSON.stringify(result.repeats));
  console.log('RANDOM_RENDER_COST_ABLATION',JSON.stringify(result.ablation));
  console.log('RANDOM_RENDER_COST_MEDIAN',
    [...result.rows].sort((a,b)=>a.ms-b.ms)[Math.floor(result.rows.length/2)].ms);
}finally{
 await browser?.close();await new Promise(done=>server.close(done));
}
