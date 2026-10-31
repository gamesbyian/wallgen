// Genuine Chromium/CDP acceptance for interrupted v3 Bézier pointer transactions.
// Run manually: node tests/vector-draw-interruption-browser.mjs
// Source and visual geometry remain normalized; browser sizes are CSS pixels.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,existsSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,extname} from 'node:path';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {normalizeRecipe,encodeRecipe} from '../src/model.js';

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
const recipe=normalizeRecipe({
  seed:'vector-interrupt-browser-20261031',
  structure:'paths',geometry:'drawn',orientation:'horizontal',
  vectorPath:{
    space:'normalized-design',closed:false,
    start:{id:'a',point:[.18,.15]},
    segments:[
      {kind:'cubic',to:{id:'b',point:[.50,.70]},
        controlOut:[.27,.48],controlIn:[.39,.63]},
      {kind:'cubic',to:{id:'c',point:[.84,.88]},
        controlOut:[.62,.81],controlIn:[.75,.83]}
    ],nodeModes:{}
  },
  positionX:0,positionY:0,viewZoom:1,viewPanX:0,viewPanY:0
});
const originalJSON=JSON.stringify(recipe);
const profile=mkdtempSync(join(tmpdir(),'roygbiv-vector-interrupt-'));
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
const currentX=()=>evaluate('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).textOverlays.find(x=>x.id==="moving").x');
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
  await command('Page.enable');await command('Runtime.enable');  const results=[];
  for(const [width,height] of [[320,700],[412,892]]){
    await command('Emulation.setDeviceMetricsOverride',{
      width,height,deviceScaleFactor:1,mobile:true,
      screenWidth:width,screenHeight:height
    });
    await command('Page.navigate',{url:origin+'?r='+encodeRecipe(recipe)});
    await waitFor('document.readyState==="complete" && !!document.getElementById("drawPathToggle")');
    await waitFor('document.body.classList.contains("mobile-studio")');
    assert.deepEqual(await source(),recipe);
    let point;
    for(const action of ['blur','resize','frameZoom','previewZoom','escape']){
      await evaluate('document.getElementById("drawPathToggle").click()');
      await waitFor('document.querySelector(".vector-draw-tools")?.hidden===false');
      await delay(500); // Let the initial async preview/layout settle.
      point=await evaluate('(()=>{const r=document.getElementById("preview").getBoundingClientRect();return {x:r.left+r.width*.5,y:r.top+r.height*.7}})()');
      const hit=await evaluate('document.elementFromPoint('+point.x+','+point.y+')?.id');
      assert.equal(hit,'drawOverlay',
        'The authored Bézier overlay must receive the actual pointer at '+width);
      await dispatch('mouseMoved',point.x,point.y);
      await dispatch('mousePressed',point.x,point.y,1);
      await waitFor('document.querySelector(".vector-draw-tools select")?.disabled===true');
      // A provisional pointerdown is already an active vector transaction.
      // Browser/CDP synthetic held-mouse move can lose capture even with no
      // explicit release or pointercancel. Pure session tests independently
      // prove rollback after a changed cubic preview.
      // Source rerenders also emit a camera event. Equal transforms must
      // preserve the draft, while actual mapping changes must cancel it.
      await evaluate('document.querySelector(".studio-stage").dispatchEvent(new Event("roygbiv-view-zoom-updated"))');
      assert.equal(await evaluate('document.querySelector(".vector-draw-tools select")?.disabled'),true,
        'A no-op zoom notification cannot abort the in-flight node edit');
      if(action==='blur')await evaluate('window.dispatchEvent(new Event("blur"))');
      if(action==='resize')await evaluate('window.dispatchEvent(new Event("resize"))');
      if(action==='frameZoom')await evaluate('(()=>{const s=document.querySelector(".studio-stage");s.dataset.viewZoom="1.4";s.dispatchEvent(new Event("roygbiv-view-zoom-updated"))})()');
      if(action==='previewZoom')await evaluate('(()=>{const canvas=document.getElementById("preview");canvas.style.width="92%";canvas.parentElement.dispatchEvent(new Event("roygbiv-preview-zoom"))})()');
      if(action==='escape')await evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}))');
      // A disabled node-type selector also means "no node selected", so it
      // cannot independently prove transaction cancellation. The definitive
      // check is that Use path succeeds and exports the untouched source.
      if(action==='escape')
        await waitFor('document.querySelector(".vector-draw-tools")?.hidden===true');
      await dispatch('mouseReleased',point.x+24,point.y+12);
      if(action!=='escape'){
        await waitFor('document.querySelector(".vector-draw-tools")?.hidden===false');
        await evaluate('(()=>{const b=[...document.querySelectorAll(".vector-draw-action")].find(el=>el.textContent==="Use path");b.click()})()');
      }
      await waitFor('document.querySelector(".vector-draw-tools")?.hidden===true');
      assert.deepEqual((await source()).vectorPath,recipe.vectorPath,
        'interrupted '+action+' gesture cannot modify authored Bézier nodes');
      if(action==='frameZoom')await evaluate('document.querySelector(".studio-stage").dataset.viewZoom="1"');
      if(action==='previewZoom')await evaluate('document.getElementById("preview").style.width=""');
    }
    assert.equal(jsErrors.length,0,'no uncaught errors');
    results.push({width,height,interruptions:['blur','resize','frameZoom','previewZoom','escape'],
      geometryUnchanged:true,unverified:['physical Pixel','TalkBack']});
    console.log('VECTOR_DRAW_INTERRUPTION_BROWSER_PASS',JSON.stringify(results.at(-1)));
  }

  assert.equal(JSON.stringify(recipe),originalJSON);
  console.log('VECTOR_DRAW_INTERRUPTION_BROWSER_ALL_PASS',JSON.stringify(results));
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
