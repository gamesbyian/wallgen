#!/usr/bin/env node
// Actual installed-source Chromium acceptance for the new geometry library.
// No Playwright dependency: use Node 22 and the CI runner's Chrome executable.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {existsSync,readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,extname} from 'node:path';
import {spawn} from 'node:child_process';
import {setTimeout as sleep} from 'node:timers/promises';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const cwd=process.cwd();
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&existsSync(p));
if(!chrome)throw new Error('Real Chromium required for geometry library browser test');
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript',
  '.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server=createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const abs=resolve(cwd,'.'+(pathname==='/'?'/index.html':pathname));
  if(!abs.startsWith(cwd+'/')){res.writeHead(403).end();return;}
  try{res.writeHead(200,{'Content-Type':mime[extname(abs)]||'application/octet-stream'});
    res.end(readFileSync(abs));}
  catch{res.writeHead(404).end();}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const profile=mkdtempSync(join(tmpdir(),'roygbiv-geometry-library-'));
const proc=spawn(chrome,['--headless=new','--no-sandbox','--disable-dev-shm-usage',
  '--disable-gpu','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],
{stdio:['ignore','ignore','pipe']});
let stderr='',ws;
proc.stderr.on('data',b=>{stderr=(stderr+b.toString()).slice(-1500);});
const pending=new Map();let seq=0;
function send(method,params={}){
  return new Promise((resolve,reject)=>{
    const id=++seq;pending.set(id,{resolve,reject});
    ws.send(JSON.stringify({id,method,params}));
  });
}
async function evaluate(expression){
  const reply=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(reply.exceptionDetails)
    throw new Error('Chromium evaluate: '+JSON.stringify(reply.exceptionDetails).slice(0,1300));
  return reply.result?.value;
}
async function until(expression,limit=16000){
  const started=Date.now();
  while(Date.now()-started<limit){
    if(await evaluate(expression))return;
    await sleep(120);
  }
  throw new Error('Chromium timed out waiting for '+expression);
}
try{
  let port=0;
  for(let i=0;i<220;i++){
    const file=join(profile,'DevToolsActivePort');
    if(existsSync(file)){port=Number(readFileSync(file,'utf8').split('\n')[0]);break;}
    if(proc.exitCode!==null)throw new Error('Chrome quit early: '+stderr);
    await sleep(100);
  }
  if(!port)throw new Error('Chrome DevTools unavailable: '+stderr);
  const tabs=await (await fetch('http://127.0.0.1:'+port+'/json')).json();
  const page=tabs.find(t=>t.type==='page');
  ws=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{
    ws.addEventListener('open',resolve,{once:true});
    ws.addEventListener('error',reject,{once:true});
  });
  ws.addEventListener('message',event=>{
    const data=JSON.parse(event.data);
    if(data.method==='Runtime.exceptionThrown')
      process.stderr.write('Browser exception: '+JSON.stringify(data.params).slice(0,1200)+'\n');
    if(!data.id||!pending.has(data.id))return;
    const request=pending.get(data.id);pending.delete(data.id);
    if(data.error)request.reject(new Error(JSON.stringify(data.error)));
    else request.resolve(data.result);
  });
  await send('Page.enable');await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',{
    width:412,height:892,deviceScaleFactor:1,mobile:true,
    screenWidth:412,screenHeight:892});
  const wave=[[-.3,.1],[.24,.35],[.62,.56],[1.3,.9]];
  const start=normalizeRecipe({seed:'geometry-library-browser',structure:'paths',
    geometry:'drawn',customPath:wave,drawnAnchors:[1],drawnCorners:[2]});
  await send('Page.navigate',{url:origin+'/?r='+encodeRecipe(start)});
  await until('document.readyState==="complete" && !!document.getElementById("geometryLibraryToggle")');
  assert.equal(await evaluate('!!window.indexedDB'),true,'Chromium must have IndexedDB');
  await evaluate('document.getElementById("geometryLibraryToggle").click()');
  await until('document.querySelector(".geometry-library-dialog")?.open===true');
  assert.equal(await evaluate('document.querySelector(".geometry-library-save button").disabled'),false);
  await evaluate('(()=>{const d=document.querySelector(".geometry-library-dialog");'+
    'd.querySelector(".geometry-library-save input").value="Browser Wave";'+
    'd.querySelector(".geometry-library-save button").click();})()');
  await until('document.querySelector(".geometry-library-status")?.textContent.includes("Saved Browser Wave")');
  assert.equal(await evaluate('document.querySelectorAll(".geometry-library-item").length'),1);
  await evaluate('document.querySelector(".geometry-library-dialog header button").click()');
  await evaluate('(()=>{const s=document.querySelector("select[name=structure]");'+
    's.value="regions";s.dispatchEvent(new Event("change",{bubbles:true}));})()');
  await until('document.querySelector("select[name=structure]")?.value==="regions"');
  await send('Page.reload',{ignoreCache:true});
  await until('document.readyState==="complete" && !!document.getElementById("geometryLibraryToggle")');
  await evaluate('document.getElementById("geometryLibraryToggle").click()');
  await until('document.querySelector(".geometry-library-item")?.textContent.includes("Browser Wave")');
  assert.equal(await evaluate('document.querySelector(".geometry-library-save button").disabled'),
    true,'Can only save an active drawn path');
  assert.equal(await evaluate('document.querySelectorAll(".geometry-library-item").length'),1,
    'Saved path survived reload and was not merely in JS memory');
  await evaluate('document.querySelector(".geometry-library-item-actions button").click()');
  await until('document.querySelector("select[name=structure]")?.value==="paths" && document.querySelector("select[name=geometry]")?.value==="drawn"');
  await until('document.querySelector(".geometry-library-dialog")?.open===false');
  const restored=await evaluate('new URLSearchParams(location.search).get("r")');
  assert.ok(restored,'Applied path should enter ordinary portable recipe');
  const recipe=decodeRecipe(restored);
  assert.deepEqual(recipe.customPath,start.customPath);
  assert.deepEqual(recipe.drawnAnchors,start.drawnAnchors);
  assert.deepEqual(recipe.drawnCorners,start.drawnCorners);
  // Exercise the real image importer: a WHITE donut on a transparent field
  // would disappear in naïve RGB-based segmentation. Alpha must preserve both
  // the filled silhouette and the true empty centre.
  await evaluate("(async()=>{\n    const canvas=document.createElement('canvas');canvas.width=120;canvas.height=120;\n    const ctx=canvas.getContext('2d');\n    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(60,60,44,0,Math.PI*2);ctx.fill();\n    ctx.globalCompositeOperation='destination-out';\n    ctx.beginPath();ctx.arc(60,60,19,0,Math.PI*2);ctx.fill();\n    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));\n    const dt=new DataTransfer();\n    dt.items.add(new File([blob],'transparent-donut.png',{type:'image/png'}));\n    const input=document.getElementById('imagePathFile');\n    input.files=dt.files;\n    input.dispatchEvent(new Event('change',{bubbles:true}));\n    return true;\n  })()");
  // Image import offers path and silhouette candidates; choose the actual shape.
  await until('Array.from(document.querySelectorAll("#imagePathCandidate option")).some(o=>/filled silhouette/i.test(o.textContent))');
  const choseShape=await evaluate('(()=>{const el=document.getElementById("imagePathCandidate");' +
    'const shape=Array.from(el.options).find(o=>/filled silhouette/i.test(o.textContent));' +
    'if(!shape)return false;el.value=shape.value;' +
    'el.dispatchEvent(new Event("change",{bubbles:true}));return true;})()');
  assert.equal(choseShape,true,'Detected silhouette candidate is selectable');
  await until('document.querySelector("#imagePathShape")?.disabled===false');
  assert.match(await evaluate('document.getElementById("imagePathStatus").textContent'),
    /Fillable silhouette/);
  await evaluate('document.getElementById("imagePathShape").click()');
  await until('document.querySelector("select[name=regionMode]")?.value==="scattered" && document.querySelector("select[name=scatteredShapeKind]")?.value==="imported"');
  const shapeUrl=await evaluate('new URLSearchParams(location.search).get("r")');
  const stamp=decodeRecipe(shapeUrl);
  assert.equal(stamp.scatteredShape.geometry.components[0].holes.length,1);
  assert.equal(stamp.scatteredShapeKind,'imported');
  await evaluate('document.getElementById("geometryLibraryToggle").click()');
  await until('document.querySelector(".geometry-library-dialog")?.open===true');
  assert.equal(await evaluate('document.querySelector(".geometry-library-save button").disabled'),
    false,'Imported silhouette must be saveable independently');
  await evaluate('(()=>{const d=document.querySelector(".geometry-library-dialog");'+
    'd.querySelector(".geometry-library-save input").value="Browser Donut";'+
    'd.querySelector(".geometry-library-save button").click();})()');
  await until('document.querySelector(".geometry-library-status")?.textContent.includes("Saved Browser Donut")');
  await evaluate('document.querySelector(".geometry-library-dialog header button").click()');
  await send('Page.navigate',{url:origin+'/?r='+encodeRecipe(start)});
  await until('document.readyState==="complete" && !!document.getElementById("geometryLibraryToggle")');
  await evaluate('document.getElementById("geometryLibraryToggle").click()');
  await until('Array.from(document.querySelectorAll(".geometry-library-item")).some(x=>x.textContent.includes("Browser Donut"))');
  await evaluate("(()=>{\n    const item=[...document.querySelectorAll('.geometry-library-item')]\n      .find(el=>el.textContent.includes('Browser Donut'));\n    item.querySelector('.geometry-library-item-actions button').click();\n  })()");
  await until('document.querySelector("select[name=scatteredShapeKind]")?.value==="imported"');
  await until('document.getElementById("preview")?.dataset.renderPending==="false"');
  const embedded=decodeRecipe(await evaluate('new URLSearchParams(location.search).get("r")'));
  assert.deepEqual(embedded.scatteredShape,stamp.scatteredShape,
    'Shape must restore from library as an independent recipe copy');
  const stencil=await evaluate("(async()=>{\n    const {resolveScene}=await import('/src/model.js');\n    const {decodeRecipe}=await import('/src/model.js');\n    const recipe=decodeRecipe(new URLSearchParams(location.search).get('r'));\n    const objects=resolveScene(recipe).objects;\n    const canvas=document.getElementById('preview'),ctx=canvas.getContext('2d');\n    const fullyInside=objects.find(o=>{\n      const all=o.rings[0];\n      return all.every(p=>p.x>=1&&p.x<599&&p.y>=1&&p.y<1299);\n    });\n    if(!fullyInside)return {found:false};\n    const ring=fullyInside.rings[0],hole=fullyInside.rings[1];\n    const bounds=points=>{\n      const xs=points.map(p=>p.x),ys=points.map(p=>p.y);\n      return {x:(Math.min(...xs)+Math.max(...xs))/2,\n        y:(Math.min(...ys)+Math.max(...ys))/2,\n        r:(Math.max(...xs)-Math.min(...xs))/2};\n    };\n    const outer=bounds(ring),inner=bounds(hole);\n    const pixel=(x,y)=>Array.from(ctx.getImageData(Math.round(x),Math.round(y),1,1).data);\n    return {found:true,fill:pixel(outer.x+outer.r*.7,outer.y),\n      hole:pixel(inner.x,inner.y)};\n  })()");
  assert.equal(stencil.found,true,'At least one complete silhouette should fit on screen');
  assert.ok(stencil.fill[0]+stencil.fill[1]+stencil.fill[2]>60,
    'Filled ring must be coloured');
  assert.ok(stencil.hole[0]+stencil.hole[1]+stencil.hole[2]<35,
    'Silhouette hole must reveal black background');
  // Cross-tab concurrency behaviour through two independent IndexedDB handles.
  const race=await evaluate('(async()=>{'+
    'const {openGeometryLibrary}=await import("/src/geometry-library-store.js");'+
    'const a=await openGeometryLibrary(),b=await openGeometryLibrary();'+
    'const example={id:"race-example",name:"Original",geometry:{'+
    'type:"open-path",space:"wallpaper-600x1300",points:[[.1,.1],[.7,.9]]}};'+
    'await a.add(example);await b.update("race-example",{name:"Latest"},{ifRevision:1});'+
    'let conflict=false;try{await a.update("race-example",{name:"Stale"},{ifRevision:1});}'+
    'catch(e){conflict=e.code==="conflict";}'+
    'const latest=await a.get("race-example");a.close();b.close();'+
    'return {conflict,revision:latest.revision,name:latest.name};})()');
  assert.deepEqual(race,{conflict:true,revision:2,name:'Latest'});
  console.log('PASS real Chromium library: persistent path, imported donut and hole pixels, source-independent recipe, IDB conflict');
}finally{
  try{ws?.close();}catch{}
  proc.kill('SIGTERM');
  try{await new Promise(resolve=>{if(proc.exitCode!==null)return resolve();
    proc.once('exit',resolve);setTimeout(resolve,2500);});}catch{}
  // Chrome can recreate a profile file for a moment after SIGTERM on CI.
  // An already-passing product assertion must not fail on ephemeral cleanup.
  try{rmSync(profile,{recursive:true,force:true,maxRetries:12,retryDelay:150});}
  catch(e){process.stderr.write('Nonfatal Chromium profile cleanup: '+e.message+'\\n');}
  server.close();
}
