#!/usr/bin/env node
// Opt-in actual Chromium one-shape nesting and native PNG/worker acceptance.
// No physical Pixel, human aesthetic approval or private-art source.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,join,extname} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {normalizeRecipe,resolveScene,decodeRecipe} from '../src/model.js';
import {extractPngRecipe} from '../src/png-metadata.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(process.argv[2]||'artifacts/nested-shape-proof');
await mkdir(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const exec=promisify(execFile);
const cloud=Array.from({length:36},(_,i)=>{
  const t=2*Math.PI*i/36;
  const lobes=1+.19*Math.sin(3*t+.4)+.09*Math.cos(5*t);
  return [180+118*lobes*Math.cos(t),180+70*lobes*Math.sin(t)];
});
const delta=[
  [180,18],[310,330],[228,270],[180,306],[132,270],[50,330]
];
const hole=[[180,135],[198,195],[162,195]];
function fixture(outer,holes=[]){
  return {schema:'roygbiv.geometry-snapshot',version:1,geometry:{
    type:'compound-region',space:'asset-local',fillRule:'evenodd',
    viewBox:[0,0,360,360],components:[{outer,holes}]}};
}
const base={
  seed:'nest-real-chromium-proof',structure:'regions',regionMode:'scattered',
  scatteredShapeKind:'imported',scatteredCount:1,scatteredMinSize:80,
  scatteredMaxSize:100,scatteredVariation:0,scatteredSpacing:0,
  scatteredEdgeCrop:0,dividerColor:'none',dividerWidth:0,
  palette:'classic',background:'black',material:'none',outline:'none',
  glow:0,textureStrength:0,lightingMood:'off'
};
const settings={enabled:true,count:7,objectId:'region-0',
  strokeWidth:2,gap:5,firstInset:3,colourOrder:'forward'};
const designs=[
  {name:'cloud',recipe:normalizeRecipe({...base,scatteredShape:fixture(cloud),
    nestedShapeContours:settings})},
  {name:'delta-hole',recipe:normalizeRecipe({...base,scatteredShape:fixture(delta,[hole]),
    nestedShapeContours:settings})}
];
for(const design of designs){
  const scene=resolveScene(design.recipe);
  assert.equal(scene.objects.length,1);
  assert.equal(scene.objects[0].rings.length,design.name==='cloud'?1:2);
  await writeFile(join(out,design.name+'.json'),JSON.stringify(design.recipe));
}

const types={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.json':'application/json','.woff2':'font/woff2','.ttf':'font/ttf',
  '.svg':'image/svg+xml','.png':'image/png'};
const server=createServer(async(request,response)=>{
  try{
    const local=resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));
    if(local!==root&&!local.startsWith(root+'/')){response.writeHead(403).end();return;}
    const path=local===root?join(root,'index.html'):local;
    response.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(await readFile(path));
  }catch{response.writeHead(404).end('Not Found');}
});
let browser;
try{
  await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok);});
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:412,height:892}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  // Start with an authentic imported compound shape but WITHOUT nesting:
  // the author activates it with the actual product editor action.
  const plain=normalizeRecipe({...base,scatteredShape:fixture(delta,[hole])});
  const url='http://127.0.0.1:'+server.address().port+
    '/?r='+encodeURIComponent(JSON.stringify(plain));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.nested-shape-studio button',{state:'attached'});
  await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
    null,{timeout:80000});
  const outcome=await page.evaluate(()=>{
    const button=document.querySelector('.nested-shape-studio button');
    if(button.disabled)throw new Error('Nested-shape action disabled after importing silhouette');
    button.click(); // native UI handler, no gesture/physical-phone claim
    return {pressed:button.getAttribute('aria-pressed'),
      gapControls:!!document.querySelector('[aria-label="Clear spacing between lines (design pixels)"]')};
  });
  assert.equal(outcome.pressed,'true');
  assert.equal(outcome.gapControls,true);
  await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
    null,{timeout:100000});
  const nestedUrl=await page.evaluate(()=>location.href);
  const saved=decodeRecipe(new URL(nestedUrl).searchParams.get('r'));
  assert.equal(saved.nestedShapeContours.enabled,true);
  assert.equal(saved.nestedShapeContours.count,7);
  assert.equal(saved.scatteredCount,1);
  assert.deepEqual(saved.scatteredShape,plain.scatteredShape,'source vector unchanged on enabling');
  await page.screenshot({path:join(out,'real-412x892-editor.png')});
  await page.evaluate(()=>{
    const details=document.querySelector('.nested-shape-fields');
    details.open=true;
    const field=document.querySelector('[aria-label="Clear spacing between lines (design pixels)"]');
    field.value='7';field.dispatchEvent(new Event('change',{bubbles:true}));
  });
  const changed=decodeRecipe(new URL(await page.evaluate(()=>location.href)).searchParams.get('r'));
  assert.equal(changed.nestedShapeContours.gap,7);
  await page.evaluate(()=>document.getElementById('undo').click());
  const undone=decodeRecipe(new URL(await page.evaluate(()=>location.href)).searchParams.get('r'));
  assert.equal(undone.nestedShapeContours.gap,5);
  await page.evaluate(()=>document.getElementById('undo').click());
  const off=decodeRecipe(new URL(await page.evaluate(()=>location.href)).searchParams.get('r'));
  assert.equal(off.nestedShapeContours,undefined);
  assert.deepEqual(off.scatteredShape,plain.scatteredShape);
  assert.deepEqual(errors,[]);
  const all=[];
  for(const design of designs){
    const sizes=design.name==='delta-hole'?
      [[480,1040],[3024,6552]]:[[480,1040]];
    for(const [w,h] of sizes){
      const paths=[];
      for(const backend of ['reference','worker']){
        const path=join(out,design.name+'-'+w+'-'+backend+'.png');
        const started=Date.now();
        await exec(process.execPath,['scripts/render-headless.mjs','--recipe',
          join(out,design.name+'.json'),'--backend',backend,'--width',
          String(w),'--height',String(h),'--out',path],{
            cwd:root,maxBuffer:8*1024*1024,timeout:150000});
        const time=Date.now()-started;
        paths.push({path,backend,time});
      }
      const original=await readFile(paths[0].path);
      const worker=await readFile(paths[1].path);
      assert.ok(original.equals(worker),'reference/worker encoded PNG parity');
      assert.deepEqual(extractPngRecipe(original),design.recipe);
      const pixels=PNG.sync.read(original);
      assert.deepEqual([pixels.width,pixels.height],[w,h]);
      let ink=0;
      for(let i=0;i<pixels.data.length;i+=4){
        const [r,g,b]=pixels.data.subarray(i,i+3);
        if(Math.max(r,g,b)>55&&Math.max(r,g,b)-Math.min(r,g,b)>25)ink++;
      }
      assert.ok(ink>150,'actual colour ink must appear');
      const report={design:design.name,width:w,height:h,inkPixels:ink,
        equalWorkerReference:true,sha256:hash(original),timesMs:paths.map(p=>p.time)};
      all.push(report);console.log('NESTED_PROOF '+JSON.stringify(report));
    }
  }
  const report={schema:'roygbiv-seven-nesting-optical-v1',
    exactNativeEncodedParity:true,originalSourceGeometryImmutable:true,
    actualBrowserEditAndUndo:true,physicalAndroidTested:false,
    viewport:[412,892],javascriptErrors:errors,images:all};
  await writeFile(join(out,'report.json'),JSON.stringify(report,null,2));
  console.log('NESTED_PROOF_SUMMARY '+JSON.stringify(report));
}finally{
  await browser?.close();
  await new Promise(ok=>server.close(ok));
}
