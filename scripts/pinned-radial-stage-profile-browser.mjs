#!/usr/bin/env node
/**
 * One-off diagnostic: attribute the 42-ray Random scene's real settled Worker
 * cost to source stages, without altering the committed production renderer.
 * Instrumentation is applied ONLY to the HTTP-served /instrumented/ modules;
 * /base/ serves the untouched bytes from this same exact checkout.
 *
 * For every pair, demand identical raw bitmap SHA-256 for both settled layers.
 * Timings are exploratory Linux Chromium wall-clock worker measurements, not
 * physical Android/Pixel timings or evidence of a product speedup.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {chromium} from 'playwright';
import {randomizeAllRecipe} from '../src/model.js';

const root=process.cwd();
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'};
function replaceOne(source,needle,replacement){
  assert.equal(source.split(needle).length,2,'Expected one precise diagnostic anchor: '+needle);
  return source.replace(needle,replacement);
}
let renderer=await readFile(join(root,'src/renderer.js'),'utf8');
renderer=replaceOne(renderer,
  'export function drawWallpaper(canvas, recipe, options={}) {\n  const scene=resolveScene(recipe);',
  'export function drawWallpaper(canvas, recipe, options={}) {\n'+
  '  const trace=options.profile;\n'+
  '  const mark=trace?phase=>trace.marks.push([phase,performance.now()]):null;\n'+
  "  mark?.('start');\n"+
  '  const scene=resolveScene(recipe);\n'+
  "  mark?.('scene');");
renderer=replaceOne(renderer,
  '  g.setTransform(scaleX,0,0,scaleY,\n    margin.left+offsetX,margin.top+offsetY);\n  if(scene.structure===',
  '  g.setTransform(scaleX,0,0,scaleY,\n    margin.left+offsetX,margin.top+offsetY);\n'+
  "  mark?.('setup');\n  if(scene.structure===");
renderer=replaceOne(renderer,
  '  }else drawRegionObjects(g,scene);\n  // One scratch buffer',
  "  }else drawRegionObjects(g,scene);\n  mark?.('geometry');\n  // One scratch buffer");
renderer=replaceOne(renderer,
  '      paintMaterial(t,layer,{left,right,top,bottom},sandMaterialLighting(scene,layer));',
  "      const materialStart=trace?performance.now():0;\n"+
  '      paintMaterial(t,layer,{left,right,top,bottom},sandMaterialLighting(scene,layer));\n'+
  "      if(trace)trace.materials.push({material:layer.material,ms:performance.now()-materialStart});");
renderer=replaceOne(renderer,
  '  // Background stays fixed. The immutable ink now has transparent overscan:',
  "  mark?.('materials-and-blending');\n"+
  '  // Background stays fixed. The immutable ink now has transparent overscan:');
renderer=replaceOne(renderer,
  '  return scene;\n  }finally{\n    materialPaintFactors.delete(scene);',
  "  mark?.('finished-composite');\n"+
  '  return scene;\n  }finally{\n    materialPaintFactors.delete(scene);');

let workerSource=await readFile(join(root,'src/render-worker.js'),'utf8');
workerSource=replaceOne(workerSource,
  '  const start=performance.now();',
  '  const start=performance.now();\n  const profile=data?.profile?{marks:[],materials:[]}:null;');
workerSource=replaceOne(workerSource,
  '      drawWallpaper(surface,recipe,{cache,skipPhoto:true});',
  '      drawWallpaper(surface,recipe,{cache,skipPhoto:true,profile});');
workerSource=replaceOne(workerSource,
  '          overhang:cache.overhang,ms:performance.now()-start},',
  '          overhang:cache.overhang,profile,ms:performance.now()-start},');

const server=createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(pathname==='/'){
      res.writeHead(200,{'content-type':'text/html','cache-control':'no-store'})
        .end('<!doctype html><title>Isolated original-worker paint profile</title>');
      return;
    }
    const match=/^\/(base|instrumented)\/(.+)$/.exec(pathname);
    if(!match){res.writeHead(404).end();return;}
    const relative=match[2],filename=resolve(root,'./'+relative);
    if(!filename.startsWith(root+'/')){res.writeHead(403).end();return;}
    const body=match[1]==='instrumented'&&relative==='src/renderer.js'?renderer:
      match[1]==='instrumented'&&relative==='src/render-worker.js'?workerSource:
        await readFile(filename);
    res.writeHead(200,{'content-type':mime[extname(filename)]||'application/octet-stream',
      'cache-control':'no-store'}).end(body);
  }catch(error){
    res.writeHead(404).end(String(error));
  }
});
const pairFor=i=>[Math.imul(i,0x9e3779b1)>>>0,
  (Math.imul(i+17,0x85ebca6b)^0xa5a5f0f0)>>>0];
const seedFor=pair=>pair.map(n=>n.toString(36)).join('-');
function scene(label,index,test){
  const seed=seedFor(pairFor(index)),recipe=randomizeAllRecipe({seed});
  assert.ok(test(recipe),'Canonical Random recipe changed: '+label);
  return {label,index,seed,recipe};
}
const scenes=[
  scene('radial-sand-42',126,r=>r.structure==='radial'&&r.rayCount===42&&r.material==='sand-mandala'),
  scene('textured-loops',94,r=>r.structure==='paths'&&r.geometry==='loops'&&r.material!=='none'),
  scene('14-plus-regions',240,r=>r.structure==='regions'&&r.regionCount>=14),
];
const jobs=[
  {scene:scenes[0],width:600,height:1300},
  {scene:scenes[0],width:372,height:806},
  {scene:scenes[1],width:600,height:1300},
  {scene:scenes[2],width:600,height:1300},
];
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let browser;
try{
  browser=await chromium.launch({headless:true,
    ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),
    args:['--no-sandbox']});
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(async jobs=>{
    const workers=await Promise.all(['base','instrumented'].map(async version=>{
      const w=new Worker('/'+version+'/src/render-worker.js',{type:'module'});
      let nextId=0;
      const callbacks=new Map();
      let readyResolve,readyReject;
      const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});
      const readyTimeout=setTimeout(()=>readyReject(Error('Worker bootstrap timeout: '+version)),30000);
      w.addEventListener('message',({data})=>{
        if(data?.type==='ready'){clearTimeout(readyTimeout);readyResolve();return;}
        if(data?.type==='unsupported'){
          clearTimeout(readyTimeout);readyReject(Error(String(data.error)));return;
        }
        if(callbacks.has(data?.id))callbacks.get(data.id)(data);
      });
      w.addEventListener('error',e=>readyReject(Error(version+': '+e.message)));
      await ready;
      return {version,worker:w,render(recipe,width,height){
        return new Promise((resolve,reject)=>{
          const id=++nextId;
          const timeout=setTimeout(()=>{
            callbacks.delete(id);reject(Error('Timed out '+version+'/'+recipe.seed));
          },90000);
          callbacks.set(id,data=>{
            callbacks.delete(id);clearTimeout(timeout);
            if(data.type==='error')reject(Error(String(data.error)));
            else if(data.type==='frame'&&data.quality==='settled')resolve(data);
            else reject(Error('Unexpected worker reply: '+data.type));
          });
          w.postMessage({type:'preview',id,key:recipe.seed,recipe,width,height,
            quality:'settled',profile:version==='instrumented'});
        });
      }};
    }));
    async function checksum(bitmap){
      const c=new OffscreenCanvas(bitmap.width,bitmap.height);
      try{
        const ctx=c.getContext('2d',{willReadFrequently:true});
        ctx.drawImage(bitmap,0,0);
        const bytes=ctx.getImageData(0,0,c.width,c.height).data;
        const digest=await crypto.subtle.digest('SHA-256',bytes);
        return {width:c.width,height:c.height,sha256:Array.from(new Uint8Array(digest),
          b=>b.toString(16).padStart(2,'0')).join('')};
      }finally{
        bitmap.close();c.width=0;c.height=0;
      }
    }
    const output=[];
    for(const item of jobs){
      const trials=[];
      for(let i=0;i<6;i++){
        // Alternate draw order to limit warming bias across sources.
        const order=i%2?workers.slice().reverse():workers;
        const pair={};
        for(const w of order){
          const frame=await w.render(item.scene.recipe,item.width,item.height);
          const background=await checksum(frame.background);
          const ink=await checksum(frame.ink);
          pair[w.version]={workerMs:frame.ms,profile:frame.profile||null,
            overhang:frame.overhang,background,ink};
        }
        if(JSON.stringify(pair.base.background)!==JSON.stringify(pair.instrumented.background)||
          JSON.stringify(pair.base.ink)!==JSON.stringify(pair.instrumented.ink))
          throw Error('Actual settled bitmap pixels diverged: '+item.scene.label+
            ' '+item.width+'x'+item.height+' trial '+i);
        if(!pair.instrumented.profile?.marks?.length)
          throw Error('Missing real worker stage profile');
        trials.push(pair);
      }
      output.push({label:item.scene.label,seed:item.scene.seed,
        width:item.width,height:item.height,
        rayCount:item.scene.recipe.rayCount,regionCount:item.scene.recipe.regionCount,
        material:item.scene.recipe.material,
        trials});
    }
    for(const w of workers)w.worker.terminate();
    return output;
  },jobs);
  assert.deepEqual(errors,[]);
  const median=xs=>{const s=xs.slice().sort((a,b)=>a-b);return (s[2]+s[3])/2;};
  const report=result.map(item=>{
    const samples=item.trials;
    const stages=samples.map(x=>{
      const marks=x.instrumented.profile.marks;
      const durations={};
      for(let i=1;i<marks.length;i++)
        durations[marks[i][0]]=marks[i][1]-marks[i-1][1];
      durations.materialPaint=x.instrumented.profile.materials.reduce((sum,x)=>sum+x.ms,0);
      return durations;
    });
    const keys=Object.keys(stages[0]);
    return {scene:item.label,size:[item.width,item.height],seed:item.seed,
      materials:item.trials[0].instrumented.profile.materials.map(x=>x.material),
      bitmapSha256:{ink:item.trials[0].base.ink.sha256,
        background:item.trials[0].base.background.sha256},
      workerMs:{base:item.trials.map(x=>Math.round(x.base.workerMs)),
        instrumented:item.trials.map(x=>Math.round(x.instrumented.workerMs))},
      medianStagesMs:Object.fromEntries(keys.map(k=>[k,
        Math.round(median(stages.map(s=>s[k]))*10)/10])),
    };
  });
  await mkdir(join(root,'artifacts','pinned-radial-stage-profile'),{recursive:true});
  await writeFile(join(root,'artifacts','pinned-radial-stage-profile','result.json'),
    JSON.stringify({environment:'Actual Linux Chromium settled OffscreenCanvas Worker; instrumentation served only from /instrumented/, paired source-identical pixels',report,raw:result},null,2)+'\n');
  console.log('PINNED_RADIAL_STAGE_PROFILE',JSON.stringify(report));
}finally{
  await browser?.close();
  await new Promise(done=>server.close(done));
}
