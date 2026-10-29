#!/usr/bin/env node
/**
 * Reproducible R3 measurement. Records authentic edit interaction timestamps,
 * worker-preview deliveries and settled frame timing in real Chromium.
 * NOT a hardware Pixel latency claim and not a frame-level screen measurement.
 *
 * Run: CHROME_BIN=/usr/bin/google-chrome node scripts/rotation-latency-browser.mjs
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe} from '../src/model.js';

const root=process.cwd();
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html',
  '.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
  try{
    const raw=new URL(req.url,'http://localhost').pathname;
    const pathname=decodeURIComponent(raw==='/'?'/index.html':raw);
    const file=resolve(root,'.'+pathname);
    if(!file.startsWith(root+'/')){res.writeHead(403).end();return;}
    const body=await readFile(file);
    res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream',
      'cache-control':'no-store'}).end(body);
  }catch{res.writeHead(404).end();}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const url='http://127.0.0.1:'+server.address().port;
let browser;
const scenarios=[
  {name:'single-linen',recipe:{material:'linen',textureCoverage:'both',textureStrength:70,
    textureRotation:13}},
  {name:'three-layers',recipe:{material:'linen',textureCoverage:'both',textureStrength:85,
    textureRotation:13,textureLayer2Enabled:true,material2:'foil',textureStrength2:60,
    textureCoverage2:'stripes',textureRotation2:128,
    textureLayer3Enabled:true,material3:'grain',textureStrength3:75,
    textureCoverage3:'background',textureRotation3:287}},
  {name:'complex-path',recipe:{geometry:'loops',repeatCount:3,
    material:'canvas',textureStrength:80,textureScale:55,textureRotation:13,
    textureDisplacement:50}},
];
function distribution(values){
  const a=[...values].filter(Number.isFinite).sort((x,y)=>x-y);
  if(!a.length)return null;
  return {count:a.length,median:a[Math.floor(a.length/2)],
    p95:a[Math.ceil(a.length*.95)-1],max:a.at(-1)};
}
const results=[];
try{
  browser=await chromium.launch({headless:true,
    ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),
    args:['--no-sandbox']});
  for(const {name,recipe} of scenarios){
    const page=await browser.newPage({viewport:{width:412,height:892},hasTouch:true,
      isMobile:true,reducedMotion:'reduce'});
    const errs=[];page.on('pageerror',error=>errs.push(error.message));
    const value=normalizeRecipe({seed:'rotation-performance-'+name,
      structure:'paths',orientation:'diagonal',...recipe});
    await page.goto(url+'/?r='+encodeRecipe(value),{waitUntil:'domcontentloaded'});
    await page.waitForSelector('[data-rotation-precision="textureRotation"]',{state:'attached'});
    await page.locator('#mobileEdit').click();
    await page.locator('#tab-material').click();
    await page.locator('.editor-tool-chooser [data-editor-tool="layer1"]').click();
    await page.locator('.editor-tool-card[data-editor-tool="layer1"] .material-inspector-tab')
      .filter({hasText:'Finish'}).click();
    await page.locator('[data-rotation-precision="textureRotation"]').click();
    await page.locator('.rotation-scrub-snap').selectOption('0');
    const pad=page.locator('.rotation-scrub-pad');
    const box=await pad.boundingBox();
    assert.ok(box,'Touch scrub area must be visible');
    const x=box.x+box.width/2,y=box.y+box.height/2;
    await page.evaluate(()=>{
      const perf={input:[],interactive:[],settled:[],start:performance.now(),worker:null};
      const pad=document.querySelector('.rotation-scrub-pad');
      const preview=document.querySelector('#preview');
      pad.addEventListener('pointermove',event=>{
        if(event.buttons)perf.input.push(performance.now());
      });
      preview.addEventListener('roygbiv-preview-interactive',()=>{
        perf.interactive.push(performance.now());
      });
      preview.addEventListener('roygbiv-preview-presented',event=>{
        perf.settled.push(performance.now());
        perf.worker=event.detail.worker;
      });
      window.__rotationProfile=perf;
    });
    await page.mouse.move(x,y);await page.mouse.down();
    // Relative motion: 40 source inputs, 0.5°/event neighbourhood.
    // A small cadence avoids flooding the browser's worker mailbox with
    // synthetic zero-duration input events nobody could physically deliver.
    for(let i=1;i<=40;i++){
      await page.mouse.move(x+i*1.8,y);
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
    await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
      null,{timeout:90000});
    await page.waitForTimeout(250);
    const perf=await page.evaluate(()=>window.__rotationProfile);
    const inFrame=perf.interactive.map(t=>{
      const prior=perf.input.filter(p=>p<=t).at(-1);
      return prior===undefined?NaN:t-prior;
    }).filter(Number.isFinite);
    const last=perf.input.at(-1);
    const exact=perf.settled.filter(t=>t>=last);
    const settled=exact.length?exact.at(-1)-last:null;
    results.push({name,worker:perf.worker,inputEvents:perf.input.length,
      interactiveFrames:perf.interactive.length,settledFrames:perf.settled.length,
      firstInteractiveMs:perf.interactive.length?perf.interactive[0]-perf.input[0]:null,
      inputToInteractiveMs:distribution(inFrame),lastInputToSettledMs:settled,
      pageErrors:errs,complete:perf.settled.length>0});
    await page.close();
  }
  for(const result of results){
    assert.equal(result.pageErrors.length,0,'Browser error in '+result.name);
    assert.ok(result.inputEvents>=35,'Missing actual input events for '+result.name);
    assert.ok(result.complete,'Never settled '+result.name);
  }
  await mkdir(join(root,'artifacts','rotation-latency'),{recursive:true});
  await writeFile(join(root,'artifacts','rotation-latency','chromium.json'),
    JSON.stringify({environment:'Linux GitHub runner Chromium 412x892; not physical Pixel',
      results},null,2)+'\n');
  console.log('ROYGBIV_ROTATION_LATENCY',JSON.stringify(results));
}finally{
  await browser?.close();await new Promise(ok=>server.close(ok));
}
