#!/usr/bin/env node
/**
 * Actual mobile-sized Chromium Random button acceptance, with reproducible
 * random recipes. This measures click -> real provisional/settled preview,
 * NOT only worker CPU time, and is not physical phone evidence.
 *
 * Run with CHROME_BIN=/usr/bin/google-chrome node scripts/randomize-e2e-fixed-seeds-browser.mjs
 * The harness intercepts only a TWO-element Uint32Array requested from
 * crypto.getRandomValues, which is exactly the source of model.newSeed().
 * The override exists solely in these temporary test browser contexts.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe,randomizeAllRecipe} from '../src/model.js';
import {artKey} from '../src/render-art-key.js';

const root=process.cwd(),comparator=resolve(root,'comparator-baseline');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(request,response)=>{
  try{
    const path=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
    const prefix=path.startsWith('/base/')?'/base/':
      path.startsWith('/candidate/')?'/candidate/':null;
    if(!prefix){response.writeHead(404).end();return;}
    const home=prefix==='/base/'?comparator:root;
    // '/base/' and '/candidate/' are pages, not directories to read.
    // Resolve other static files relative to the matching checkout root.
    const relative=path.slice(prefix.length);
    const filename=resolve(home,'./'+(relative||'index.html'));
    if(!filename.startsWith(home+'/')){response.writeHead(403).end();return;}
    response.writeHead(200,{'content-type':mime[extname(filename)]||'application/octet-stream',
      'cache-control':'no-store'}).end(await readFile(filename));
  }catch{response.writeHead(404).end();}
});
const pairFor=i=>[Math.imul(i,0x9e3779b1)>>>0,
  (Math.imul(i+17,0x85ebca6b)^0xa5a5f0f0)>>>0];
const seedFor=pair=>pair.map(n=>n.toString(36)).join('-');
// Pin the exact genuinely Random-generated source family on every run.
// No app control is changed to force a cheap proxy geometry.
function pinnedSeed(label,index,predicate){
  const pair=pairFor(index),seed=seedFor(pair);
  const recipe=randomizeAllRecipe({seed});
  assert.ok(predicate(recipe),'Pinned Random case changed source family: '+label);
  return {label,index,pair,seed,recipe};
}
const scenes=[
  pinnedSeed('textured-loops',94,r=>r.structure==='paths'&&r.geometry==='loops'&&
    r.material!=='none'&&r.textureDisplacement>20),
  pinnedSeed('radial-rays',126,r=>r.structure==='radial'&&r.rayCount>=28&&
    r.material==='sand-mandala'),
  pinnedSeed('regions',240,r=>r.structure==='regions'&&r.regionCount>=14),
];
const profiles=scenes.map(({label,index,seed,recipe})=>({
  label,index,seed,structure:recipe.structure,geometry:recipe.geometry,
  rayCount:recipe.rayCount,regionCount:recipe.regionCount,
  material:recipe.material,material2:recipe.material2,material3:recipe.material3,
  textureDisplacement:recipe.textureDisplacement,
}));
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port;
let browser;
const results=[];
try{
  browser=await chromium.launch({headless:true,
    ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}) ,
    args:['--no-sandbox']});
  for(const viewport of [{width:320,height:700},{width:412,height:892}]){
    for(const entry of scenes){
      // Reverse order on the second viewport to avoid a systematically
      // warmer candidate. Both sources are loaded on the SAME Chrome runner.
      for(const version of (viewport.width===320?
        ['base','candidate']:['candidate','base'])){
      const page=await browser.newPage({viewport,hasTouch:true,isMobile:true,
        reducedMotion:'reduce',deviceScaleFactor:1});
      const errors=[];page.on('pageerror',error=>errors.push(String(error)));
      await page.addInitScript(()=>{
        // Keep the browser's real CSPRNG for every other array request.
        const original=Crypto.prototype.getRandomValues;
        Crypto.prototype.getRandomValues=function(array){
          const queue=window.__roygbivFixedSeeds;
          if(array instanceof Uint32Array&&array.length===2&&queue?.length){
            const pair=queue.shift();
            array[0]=pair[0];array[1]=pair[1];
            return array;
          }
          return original.call(this,array);
        };
        // Test-only observation of real preview worker requests and replies.
        // The native Worker runs normally, with its original postMessage,
        // scheduling and bitmap transfers. No synthetic messages are sent.
        const NativeWorker=window.Worker;
        window.__roygbivWorkerTimeline=[];
        window.__roygbivWorkerProbeId=0;
        window.Worker=class TracedWorker extends NativeWorker{
          constructor(url,options){
            super(url,options);
            if(!String(url).includes('render-worker.js'))return;
            const workerId=++window.__roygbivWorkerProbeId;
            window.__roygbivWorkerTimeline?.push({kind:'created',
              at:performance.now(),workerId});
            this.addEventListener('message',event=>{
              const msg=event.data;
              if(msg?.type!=='frame'&&msg?.type!=='error')return;
              window.__roygbivWorkerTimeline?.push({
                kind:msg.type==='frame'?'completed':'error',
                at:performance.now(),workerId,id:msg.id,key:msg.key||null,
                quality:msg.quality||null,paintMs:msg.ms??null,
              });
            });
            const originalPost=this.postMessage;
            this.postMessage=function(message,...rest){
              if(message?.type==='preview')
                window.__roygbivWorkerTimeline?.push({
                  kind:'requested',at:performance.now(),workerId,id:message.id,
                  key:message.key||null,quality:message.quality||null,
                });
              return originalPost.call(this,message,...rest);
            };
            const originalTerminate=this.terminate;
            this.terminate=function(...rest){
              window.__roygbivWorkerTimeline?.push({kind:'terminated',
                at:performance.now(),workerId});
              return originalTerminate.call(this,...rest);
            };
          }
        };
        window.__roygbivSeedHarnessReady=true;
      });
      const initial=normalizeRecipe({seed:'e2e-initial-'+entry.label,
        geometry:'straight',material:'grain',textureStrength:30});
      const load=async()=>{
        await page.goto(base+'/'+version+'/?r='+encodeRecipe(initial),{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>
          document.querySelector('#preview')?.dataset.renderPending==='false',
          null,{timeout:90000});
        assert.equal(await page.evaluate(()=>window.__roygbivSeedHarnessReady),true);
      };
      const run=async(pairs)=>{
        await page.evaluate(sourcePairs=>{
          window.__roygbivFixedSeeds=sourcePairs.map(pair=>pair.slice());
          window.__roygbivWorkerTimeline=[];
          const canvas=document.querySelector('#preview');
          const control=document.querySelector('#randomizeAll');
          const receipt={clicks:[],interactive:[],settled:[]};
          control.addEventListener('click',()=>receipt.clicks.push(performance.now()));
          canvas.addEventListener('roygbiv-preview-interactive',event=>
            receipt.interactive.push({ms:performance.now(),key:event.detail?.key||null}));
          canvas.addEventListener('roygbiv-preview-presented',event=>
            receipt.settled.push({ms:performance.now(),key:event.detail?.key,
              worker:event.detail?.worker===true}));
          window.__roygbivClickReceipt=receipt;
        },pairs);
        for(let n=0;n<pairs.length;n++){
          await page.locator('#randomizeAll').click();
          if(n<pairs.length-1)await page.waitForTimeout(110);
        }
        await page.waitForFunction(count=>{
          const r=window.__roygbivClickReceipt;
          return r?.clicks?.length===count&&
            r.settled.some(frame=>frame.ms>=r.clicks[count-1])&&
            document.querySelector('#preview')?.dataset.renderPending==='false';
        },pairs.length,{timeout:120000});
        const receipt=await page.evaluate(()=>({
          ...window.__roygbivClickReceipt,
          remaining:window.__roygbivFixedSeeds.length,
          workerTimeline:window.__roygbivWorkerTimeline||[],
        }));
        const current=decodeRecipe(new URL(page.url()).searchParams.get('r'));
        assert.ok(current,'Random must leave a valid canonical recipe URL');
        const expectedSeed=seedFor(pairs.at(-1));
        assert.equal(current.seed,expectedSeed,'actual Random seed must match injected source');
        assert.equal(receipt.remaining,0,'exactly one newSeed() is required per click');
        assert.equal(receipt.clicks.length,pairs.length);
        const first=receipt.clicks[0],last=receipt.clicks.at(-1);
        const final=receipt.settled.filter(frame=>frame.ms>=last).at(-1);
        assert.ok(final,'the final click must present finished artwork');
        assert.equal(final.key,artKey(current),'presented frame must match final authored art');
        assert.equal(final.worker,true,'real Chromium worker, not main-thread fallback');
        assert.ok(receipt.workerTimeline.some(event=>event.kind==='requested'&&
          event.key===final.key&&event.quality==='settled'),
          'the real worker must be dispatched for the current settled source');
        assert.ok(receipt.workerTimeline.some(event=>event.kind==='completed'&&
          event.key===final.key&&event.quality==='settled'&&
          Number.isFinite(event.paintMs)),
          'the real worker must complete and report its final source paint');
        const interactive=receipt.interactive.filter(frame=>frame.ms>=first);
        const finalCanvasSHA256=await page.evaluate(async()=>{
          const canvas=document.querySelector('#preview');
          const bytes=canvas.getContext('2d',{willReadFrequently:true})
            .getImageData(0,0,canvas.width,canvas.height).data;
          const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
          return [...digest].map(byte=>byte.toString(16).padStart(2,'0')).join('');
        });
        const previewWorkerIds=new Set(receipt.workerTimeline.filter(event=>
          event.kind==='requested').map(event=>event.workerId));
        assert.ok(previewWorkerIds.size>=1&&previewWorkerIds.size<=2,
          'a Random burst can use at most one replacement preview worker');
        return {
          clicks:pairs.length,expectedSeed,finalCanvasSHA256,
          replacementWorkers:Math.max(0,previewWorkerIds.size-1),
          finalStructure:current.structure,
          finalGeometry:current.geometry,worker:final.worker,
          firstInteractiveFromFirstMs:interactive.length?
            Math.round(interactive[0].ms-first):null,
          interactiveFrames:interactive.length,
          finalAfterLastClickMs:Math.round(final.ms-last),
          finalFromFirstClickMs:Math.round(final.ms-first),
          actualClickGaps:receipt.clicks.slice(1).map((time,i)=>
            Math.round(time-receipt.clicks[i])),
          settledFrames:receipt.settled.length,
          // A completed obsolete worker paint can delay the newest frame
          // even when no stale visual frame was ever presented.
          workerTimeline:receipt.workerTimeline.map(event=>({
            ...event,relativeMs:Math.round(event.at-first),
          })),
          settledWorkerPaintMs:receipt.workerTimeline.filter(event=>
            event.kind==='completed'&&event.key===final.key&&
            event.quality==='settled').at(-1)?.paintMs??null,
          obsoleteWorkerCompletionsAfterLastClick:receipt.workerTimeline.filter(
            event=>event.kind==='completed'&&event.at>=last&&
              event.key!==final.key).length,
          obsoleteWorkerWaitAfterLastClickMs:Math.round(Math.max(0,
            ...receipt.workerTimeline.filter(event=>
              event.kind==='completed'&&event.at>=last&&
              event.key!==final.key).map(event=>event.at-last))),
        };
      };
      await load();
      const single=await run([entry.pair]);
      await load();
      // The last of four real Random clicks resolves to the SAME canonical
      // source as the one-click control; the preceding three are disposable.
      const burst=await run([pairFor(16000+entry.index*4),
        pairFor(16001+entry.index*4),pairFor(16002+entry.index*4),entry.pair]);
      assert.deepEqual(errors,[],'unexpected browser exception: '+entry.label);
      assert.equal(single.expectedSeed,burst.expectedSeed,
        'single/burst compare the same final canonical source');
      results.push({version,viewport:viewport.width+'x'+viewport.height,
        case:entry.label,sourceSeed:entry.seed,single,burst,errors});
      await page.close();
      }
    }
  }
  // Every A/B pair must be the same real canonical Random source. The
  // revision/worker checks already run for EACH independently loaded app.
  for(const viewport of ['320x700','412x892'])
    for(const entry of scenes){
      const baseResult=results.find(r=>r.version==='base'&&
        r.viewport===viewport&&r.case===entry.label);
      const candidateResult=results.find(r=>r.version==='candidate'&&
        r.viewport===viewport&&r.case===entry.label);
      assert.ok(baseResult&&candidateResult,'missing source-matched A/B case');
      for(const action of ['single','burst']){
        assert.equal(baseResult[action].expectedSeed,candidateResult[action].expectedSeed,
          'A/B generated different source art');
        assert.equal(baseResult[action].finalCanvasSHA256,
          candidateResult[action].finalCanvasSHA256,
          'A/B must present pixel-identical final real Canvas2D artwork');
      }
      assert.equal(candidateResult.single.replacementWorkers,0,
        'ordinary single Random must not restart an already current worker');
    }
  const evidence={environment:'real Linux Chromium mobile touch viewport; not physical Pixel',
    profiles,results};
  await mkdir(join(root,'artifacts','randomize-preemption-ab'),{recursive:true});
  await writeFile(join(root,'artifacts','randomize-preemption-ab','receipt.json'),
    JSON.stringify(evidence,null,2)+'\n');
  console.log('ROYGBIV_RANDOMIZE_AB_REAL_CLICKS_PASS',JSON.stringify(results.map(r=>({
    version:r.version,viewport:r.viewport,case:r.case,
    singleMs:r.single.finalAfterLastClickMs,
    burstMs:r.burst.finalAfterLastClickMs,
    burstObsoleteWaitMs:r.burst.obsoleteWorkerWaitAfterLastClickMs,
    burstObsoleteCompletions:r.burst.obsoleteWorkerCompletionsAfterLastClick,
    burstReplacementWorkers:r.burst.replacementWorkers,
    singleReplacementWorkers:r.single.replacementWorkers,
    finalCanvasSHA256:r.burst.finalCanvasSHA256,
    singleWorkerPaintMs:r.single.settledWorkerPaintMs,
    burstWorkerPaintMs:r.burst.settledWorkerPaintMs,
  }))));
}finally{
  await browser?.close();
  await new Promise(done=>server.close(done));
}
