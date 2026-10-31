// Genuine two-size Chromium/CDP pointer acceptance for fixed-edge shape resize.
// Run manually: node tests/scattered-edge-scale-browser.mjs
// Source and visual geometry remain normalized; browser sizes are CSS pixels.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,existsSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,extname} from 'node:path';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {normalizeRecipe,encodeRecipe} from '../src/model.js';
import {RAINBOW_ORBITS} from '../src/scattered-composition.js';

const root=process.cwd();
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser']
  .find(path=>path&&existsSync(path));
if(!chrome)throw Error('Google Chrome/Chromium required for genuine pointer acceptance');
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript',
  '.png':'image/png','.svg':'image/svg+xml','.json':'application/json',
  '.woff2':'font/woff2','.ttf':'font/ttf'};
const server=createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!file.startsWith(root+'/')&&!file.endsWith('/index.html')){
    res.writeHead(403).end();return;
  }
  try{
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});
    res.end(readFileSync(file));
  }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port+'/';
const recipe=normalizeRecipe({...RAINBOW_ORBITS,seed:'edge-scale-browser-20261031',
  scatteredCount:1,scatteredOverlap:'overlap',scatteredOverrides:[
    {index:0,x:.3,y:.43,radius:.08}
  ],viewZoom:1,viewPanX:0,viewPanY:0,positionX:0,positionY:0});
const originalJSON=JSON.stringify(recipe);
const profile=mkdtempSync(join(tmpdir(),'roygbiv-edge-scale-'));
const proc=spawn(chrome,['--headless=new','--no-sandbox','--disable-dev-shm-usage',
  '--disable-gpu','--remote-debugging-port=0','--user-data-dir='+profile,
  'about:blank'],{stdio:['ignore','ignore','pipe']});
let stderr='',ws,sequence=0;
const pending=new Map(),jsErrors=[];
proc.stderr.on('data',data=>{stderr=(stderr+String(data)).slice(-1500)});
function command(method,params={}){
  return new Promise((resolve,reject)=>{
    const id=++sequence;pending.set(id,{resolve,reject});
    ws.send(JSON.stringify({id,method,params}));
  });
}
async function evaluate(expression){
  const r=await command('Runtime.evaluate',{
    expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error('Browser expression error '+JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
async function waitFor(expression,timeout=20000){
  const start=Date.now();
  while(Date.now()-start<timeout){
    if(await evaluate(expression))return;
    await delay(130);
  }
  throw Error('Timed out waiting for '+expression);
}
const css=()=>evaluate('(()=>{const r=document.getElementById("preview").getBoundingClientRect();return {x:r.left,y:r.top,width:r.width,height:r.height}})()');
const source=()=>evaluate('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r")))');
const currentX=()=>evaluate('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).scatteredOverrides.find(x=>x.index===0).x');
const dispatch=(type,x,y,buttons=0)=>command('Input.dispatchMouseEvent',{
  type,x,y,button:type==='mouseMoved'?'none':'left',buttons,clickCount:1});
async function tap(x,y){
  await dispatch('mouseMoved',x,y);
  await dispatch('mousePressed',x,y,1);
  await dispatch('mouseReleased',x,y);
}
async function drag(from,to){
  await dispatch('mouseMoved',from.x,from.y);
  await dispatch('mousePressed',from.x,from.y,1);
  for(const fraction of [.3,.65,1]){
    const x=from.x+(to.x-from.x)*fraction;
    const y=from.y+(to.y-from.y)*fraction;
    await dispatch('mouseMoved',x,y,1);
  }
  await dispatch('mouseReleased',to.x,to.y);
}
function world(rect,x,y){return {
  x:rect.x+rect.width*x/600,y:rect.y+rect.height*y/1300
}}
try{
  let port;
  for(let i=0;i<200;i++){
    const file=join(profile,'DevToolsActivePort');
    if(existsSync(file)){port=Number(readFileSync(file,'utf8').split('\n')[0]);break;}
    if(proc.exitCode!==null)throw Error('Browser stopped '+stderr);
    await delay(100);
  }
  if(!port)throw Error('No Chromium debugger '+stderr);
  const pages=await(await fetch('http://127.0.0.1:'+port+'/json')).json();
  const page=pages.find(p=>p.type==='page');
  if(!page)throw Error('No Chromium page');
  ws=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{
    ws.addEventListener('open',resolve,{once:true});
    ws.addEventListener('error',reject,{once:true});
  });
  ws.addEventListener('message',e=>{
    const item=JSON.parse(e.data);
    if(item.method==='Runtime.exceptionThrown')jsErrors.push(item.params);
    if(item.id&&pending.has(item.id)){
      const done=pending.get(item.id);pending.delete(item.id);
      if(item.error)done.reject(Error(JSON.stringify(item.error)));
      else done.resolve(item.result);
    }
  });
  await command('Page.enable');await command('Runtime.enable');
  const results=[];
  const scaleGrip=()=>evaluate('(()=>{const b=document.getElementById("scatteredDirectScale"),r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,width:r.width,height:r.height,hidden:b.hidden,hit:document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)===b}})()');
  const circle=()=>evaluate('(()=>{const r=JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).scatteredOverrides.find(x=>x.index===0);return {x:r.x*600,y:r.y*1300,r:r.radius*600}})()');
  for(const [width,height] of [[320,700],[412,892]]){
    await command('Emulation.setDeviceMetricsOverride',{width,height,
      deviceScaleFactor:1,mobile:true,screenWidth:width,screenHeight:height});
    await command('Page.navigate',{url:origin+'?r='+encodeRecipe(recipe)});
    await waitFor('document.readyState==="complete" && !!document.getElementById("scatteredMoveOnCanvas")');
    await waitFor('document.body.classList.contains("mobile-studio")');
    assert.deepEqual(await source(),recipe,'source before entering the tool');
    await evaluate('document.getElementById("scatteredMoveOnCanvas").click()');
    await waitFor('!document.getElementById("scatteredDirectPivot").hidden');
    const controls=await evaluate('(()=>["scatteredDirectAxis","scatteredDirectSnap","scatteredDirectPivot","scatteredDirectDone"].map(id=>{const b=document.getElementById(id),r=b.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;return {id,x,y,width:r.width,height:r.height,hidden:b.hidden,hit:document.elementFromPoint(x,y)===b,pressed:b.getAttribute("aria-pressed")}}))()');
    for(const c of controls)assert.ok(!c.hidden&&c.width>=44&&c.height>=44&&c.hit,
      'Obstructed/small control at '+width+': '+JSON.stringify(c));
    assert.equal(controls[2].pressed,'false');
    const before=await circle(),piv=controls[2];
    await tap(piv.x,piv.y);
    await waitFor('document.getElementById("scatteredDirectPivot").getAttribute("aria-pressed")==="true"');
    assert.deepEqual(await source(),recipe,'transient edge toggle cannot modify recipe');
    let grip=await scaleGrip();
    assert.ok(!grip.hidden&&grip.width>=44&&grip.height>=44&&grip.hit,
      'Edge scale grip must be reachable: '+JSON.stringify(grip));
    await tap(grip.x,grip.y);
    assert.deepEqual(await source(),recipe,'tap without resize creates no Undo or recipe edit');
    // A slight unintentional movement must not cause a history transaction.
    await drag({x:grip.x,y:grip.y},{x:grip.x+3,y:grip.y+3});
    assert.deepEqual(await source(),recipe,'sub-8px jitter must not resize');
    await evaluate('(()=>{window.__edgeEvents=[];const grip=document.getElementById("scatteredDirectScale");for(const name of ["pointerdown","pointermove","pointerup","pointercancel","lostpointercapture","gotpointercapture"])grip.addEventListener(name,e=>{window.__edgeEvents.push({name,where:"grip",x:e.clientX,y:e.clientY,id:e.pointerId,primary:e.isPrimary,captured:grip.hasPointerCapture(e.pointerId),hidden:grip.hidden});if(name==="pointerdown")queueMicrotask(()=>window.__edgeEvents.push({name:"after-pointerdown",captured:grip.hasPointerCapture(e.pointerId)}))},true);for(const name of ["pointerup","pointermove","pointercancel"])document.addEventListener(name,e=>window.__edgeEvents.push({name,where:"document",target:e.target.id,x:e.clientX,y:e.clientY,captured:grip.hasPointerCapture(e.pointerId)}),true)})()');
    console.log('SCATTERED_EDGE_BEFORE',JSON.stringify({width,grip,
      c:await circle(),target:await evaluate('(()=>{const b=document.getElementById("scatteredDirectScale"),r=b.getBoundingClientRect();const a=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {target:a?.id,rect:{left:r.left,top:r.top,width:r.width,height:r.height},pivot:document.getElementById("scatteredDirectPivot").getAttribute("aria-pressed")}})()')}));
    await drag({x:grip.x,y:grip.y},{x:grip.x+35,y:grip.y});
    console.log('SCATTERED_EDGE_AFTER',JSON.stringify({width,
      c:await circle(),data:await evaluate('({events:window.__edgeEvents, note:document.querySelector(".scattered-object-note")?.textContent, pivot:document.getElementById("scatteredDirectPivot").getAttribute("aria-pressed")})')}));
    await waitFor('Math.abs(JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).scatteredOverrides.find(x=>x.index===0).radius-.08)>.003');
    const anchored=await circle();
    assert.ok(anchored.r>before.r,'anchored gesture enlarged the region');
    assert.ok(Math.abs((anchored.x-anchored.r)-(before.x-before.r))<.002,
      'leftmost authored edge must remain fixed: '+JSON.stringify({before,anchored}));
    assert.equal(await evaluate('document.getElementById("undo").disabled'),false);
    await evaluate('document.getElementById("undo").click()');
    await waitFor('Math.abs(JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).scatteredOverrides.find(x=>x.index===0).radius-.08)<.000001');
    assert.deepEqual(await source(),recipe,'one Undo completely restores anchored resize');
    await tap(piv.x,piv.y);
    await waitFor('document.getElementById("scatteredDirectPivot").getAttribute("aria-pressed")==="false"');
    grip=await scaleGrip();
    await drag({x:grip.x,y:grip.y},{x:grip.x+35,y:grip.y});
    await waitFor('Math.abs(JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).scatteredOverrides.find(x=>x.index===0).radius-.08)>.003');
    const centred=await circle();
    assert.ok(centred.r>before.r,'default centre mode scales');
    assert.ok(Math.abs(centred.x-before.x)<.002,'centre mode keeps centre fixed');
    assert.ok(centred.x-centred.r<before.x-before.r,'centre scale does not hold left edge');
    await evaluate('document.getElementById("undo").click()');
    await waitFor('Math.abs(JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).scatteredOverrides.find(x=>x.index===0).radius-.08)<.000001');
    assert.deepEqual(await source(),recipe);
    await tap(piv.x,piv.y);
    await waitFor('document.getElementById("scatteredDirectPivot").getAttribute("aria-pressed")==="true"');
    await evaluate('document.getElementById("scatteredDirectScale").focus()');
    await command('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'ArrowUp',code:'ArrowUp',
      windowsVirtualKeyCode:38,nativeVirtualKeyCode:38});
    await command('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowUp',code:'ArrowUp',
      windowsVirtualKeyCode:38,nativeVirtualKeyCode:38});
    await waitFor('Math.abs(JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).scatteredOverrides.find(x=>x.index===0).radius-.084)<.000001');
    const keyboard=await circle();
    assert.ok(Math.abs((keyboard.x-keyboard.r)-(before.x-before.r))<.002,
      'keyboard also pins edge');
    await evaluate('document.getElementById("undo").click()');
    await waitFor('Math.abs(JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).scatteredOverrides.find(x=>x.index===0).radius-.08)<.000001');
    assert.deepEqual(await source(),recipe);
    assert.equal(jsErrors.length,0,'no uncaught browser JS');
    const item={width,height,anchored,centred,keyboard,pivot:before.x-before.r,
      controls:controls.map(c=>({id:c.id,width:c.width,height:c.height})),
      undoRestored:true,unverified:['physical Pixel','TalkBack']};
    results.push(item);console.log('SCATTERED_EDGE_SCALE_BROWSER_PASS',JSON.stringify(item));
  }
  assert.equal(JSON.stringify(recipe),originalJSON);
  console.log('SCATTERED_EDGE_SCALE_BROWSER_ALL_PASS',JSON.stringify(results));
}finally{
  try{ws?.close()}catch{}
  proc.kill('SIGTERM');
  // A Chromium process may still be flushing its profile after SIGTERM.
  // Follow the already proven production browser-smoke cleanup contract.
  await Promise.race([
    new Promise(resolve=>proc.exitCode!==null?resolve():proc.once('exit',resolve)),
    delay(2200),
  ]);
  await new Promise(resolve=>server.close(resolve));
  try{rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:180});}
  catch(e){console.warn('Temporary Chrome profile cleanup:',e.message);}
}
