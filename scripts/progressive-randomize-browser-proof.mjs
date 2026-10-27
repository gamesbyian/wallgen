#!/usr/bin/env node
// Opt-in actual Chromium evidence for progressive Randomize preview.
// 412x892 is emulated Chromium, NOT a physical Pixel 6 Pro benchmark.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=join(root,'output','randomize-preview-proof');
await mkdir(output,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.json':'application/json','.svg':'image/svg+xml','.ttf':'font/ttf',
  '.woff2':'font/woff2','.png':'image/png'};
const server=createServer(async(request,response)=>{
  try{
    const file=resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));
    if(file!==root&&!file.startsWith(root+'/')){response.writeHead(403).end();return;}
    const path=file===root?join(root,'index.html'):file;
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
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    window.__previewJobs=[];
    const original=Worker.prototype.postMessage;
    Worker.prototype.postMessage=function(...args){
      const request=args[0];
      if(request?.type==='preview')
        window.__previewJobs.push({id:request.id,key:request.key,quality:request.quality,
          width:request.width,height:request.height,postedAt:performance.now()});
      return original.apply(this,args);
    };
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{
    waitUntil:'domcontentloaded'});
  await page.waitForSelector('#preview');
  await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false');
  await page.waitForTimeout(1200); // Let the one-time preview worker boot.
  await page.evaluate(()=>{
    window.__previewEvents=[];
    const canvas=document.querySelector('#preview');
    for(const [event,phase] of [
      ['roygbiv-preview-interactive','provisional'],
      ['roygbiv-preview-presented','settled']
    ])canvas.addEventListener(event,()=>window.__previewEvents.push({
      phase,at:performance.now(),pending:canvas.dataset.renderPending,
      // The event is emitted by the actual rendered preview canvas.
    }));
  });

  async function exercise(buttonId){
    await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false');
    await page.waitForTimeout(150);
    const start=await page.evaluate(id=>{
      window.__previewEvents.length=0;
      window.__previewJobs.length=0;
      const started=performance.now();
      // Invoke the real button's DOM click handler. This is not proof that
      // a mobile finger can reach or tap the button.
      document.getElementById(id).click();
      return started;
    },buttonId);
    await page.waitForFunction(()=>window.__previewEvents.some(e=>e.phase==='settled')&&
      document.querySelector('#preview')?.dataset.renderPending==='false',null,{timeout:85000});
    const data=await page.evaluate(()=>({
      events:window.__previewEvents.slice(),
      jobs:window.__previewJobs.slice(),
      visibleWidth:document.querySelector('#preview').width,
      visibleHeight:document.querySelector('#preview').height,
    }));
    const provisional=data.events.find(e=>e.phase==='provisional');
    const exact=data.events.find(e=>e.phase==='settled');
    assert.ok(provisional,'must show a provisional bitmap before full-quality settle for '+buttonId);
    assert.ok(exact.at>provisional.at,'full-quality frame must follow provisional for '+buttonId);
    assert.equal(exact.pending,'false');
    assert.ok(data.jobs.some(job=>job.quality==='interactive'),'missing interactive worker request');
    assert.ok(data.jobs.some(job=>job.quality==='settled'),'missing exact worker request');
    const low=data.jobs.find(job=>job.quality==='interactive');
    const full=data.jobs.find(job=>job.quality==='settled');
    assert.ok(low.width<full.width&&low.height<full.height);
    assert.deepEqual([full.width,full.height],[data.visibleWidth,data.visibleHeight]);
    return {action:buttonId,
      provisionalMs:Math.round(provisional.at-start),
      settledMs:Math.round(exact.at-start),
      size:[data.visibleWidth,data.visibleHeight],
      initialSize:[low.width,low.height],
      jobs:data.jobs.map(({id,quality,width,height})=>({id,quality,width,height})),
      events:data.events.map(e=>({phase:e.phase,offsetMs:Math.round(e.at-start)}))};
  }

  const trials=[];
  trials.push(await exercise('randomizeAll'));
  await page.locator('#preview').screenshot({path:join(output,'after-randomize-all.png')});
  trials.push(await exercise('randomize'));
  await page.locator('#preview').screenshot({path:join(output,'after-new-seed.png')});
  assert.deepEqual(errors,[],'unexpected browser page errors');
  const report={status:'PASS',environment:'Linux Chromium, emulated 412x892, NOT Pixel',
    trials,browserErrors:errors};
  await writeFile(join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('ROYGBIV_PROGRESSIVE_RANDOMIZE_BROWSER '+JSON.stringify(report));
}finally{
  await browser?.close();
  server.close();
}
