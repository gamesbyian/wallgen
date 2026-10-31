// Genuine two-size Chromium/CDP pointer cancellation acceptance for selected scattered regions.
// Run manually: node tests/scattered-gesture-ownership-browser.mjs
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
const recipe=normalizeRecipe({...RAINBOW_ORBITS,seed:'scattered-ownership-browser-20261031',
  scatteredCount:2,scatteredOverlap:'overlap',scatteredOverrides:[
    {index:0,x:.3,y:.43,radius:.08},
    {index:1,x:.7,y:.7,radius:.08}
  ],viewZoom:1,viewPanX:0,viewPanY:0,positionX:0,positionY:0});
const originalJSON=JSON.stringify(recipe);
const profile=mkdtempSync(join(tmpdir(),'roygbiv-scattered-owner-'));
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
  const grip=()=>evaluate('(()=>{const e=document.getElementById("scatteredDirectScale"),r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,hidden:e.hidden,width:r.width,height:r.height}})()');
  const picker=()=>evaluate('document.getElementById("scatteredObjectPicker").value');
  const choose=async value=>evaluate('(()=>{const el=document.getElementById("scatteredObjectPicker");el.value="'+value+'";el.dispatchEvent(new Event("change",{bubbles:true}))})()');
  const begin=async(from,to)=>{
    await dispatch('mouseMoved',from.x,from.y);
    await dispatch('mousePressed',from.x,from.y,1);
    await dispatch('mouseMoved',(from.x+to.x)/2,(from.y+to.y)/2,1);
    await dispatch('mouseMoved',to.x,to.y,1);
  };
  const release=async to=>dispatch('mouseReleased',to.x,to.y);
  for(const [width,height] of [[320,700],[412,892]]){
    await command('Emulation.setDeviceMetricsOverride',{width,height,
      deviceScaleFactor:1,mobile:true,screenWidth:width,screenHeight:height});
    await command('Page.navigate',{url:origin+'?r='+encodeRecipe(recipe)});
    await waitFor('document.readyState==="complete" && !!document.getElementById("scatteredMoveOnCanvas")');
    await waitFor('document.body.classList.contains("mobile-studio")');
    assert.deepEqual(await source(),recipe);
    await evaluate('document.getElementById("scatteredMoveOnCanvas").click()');
    await waitFor('!document.getElementById("scatteredDirectScale").hidden');
    assert.equal(await picker(),'0');
    let g=await grip();assert.ok(g.width>=44&&g.height>=44&&!g.hidden);
    let target={x:g.x+28,y:g.y};
    await begin(g,target);
    await choose(1);
    assert.equal(await picker(),'1','picker changed despite active capture');
    await release(target);
    assert.deepEqual(await source(),recipe,'interrupted scale cannot commit old object');
    await choose(0);
    const rect=await css(),start=world(rect,180,559);
    target={x:start.x+30,y:start.y};
    await begin(start,target);
    await choose(1);
    await release(target);
    assert.deepEqual(await source(),recipe,'interrupted move cannot commit after selector changes');
    await choose(0);
    g=await grip();target={x:g.x+30,y:g.y};
    await begin(g,target);
    await evaluate('window.dispatchEvent(new Event("blur"))');
    await release(target);
    assert.deepEqual(await source(),recipe,'blur invalidates active scale');
    g=await grip();target={x:g.x+30,y:g.y};
    await begin(g,target);
    await evaluate('window.dispatchEvent(new Event("resize"))');
    await release(target);
    assert.deepEqual(await source(),recipe,'resize invalidates active scale');
    g=await grip();target={x:g.x+35,y:g.y};
    await drag({x:g.x,y:g.y},target);
    await waitFor('Math.abs(JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).scatteredOverrides.find(e=>e.index===0).radius-.08)>.003');
    assert.equal(await evaluate('document.getElementById("undo").disabled'),false);
    await evaluate('document.getElementById("undo").click()');
    await waitFor('Math.abs(JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).scatteredOverrides.find(e=>e.index===0).radius-.08)<.000001');
    assert.deepEqual(await source(),recipe,'valid gesture still has one Undo');
    assert.equal(jsErrors.length,0,'no browser exceptions');
    const result={width,height,pickerScaleCancel:true,pickerMoveCancel:true,
      blurCancel:true,resizeCancel:true,validScaleUndo:true,
      notTested:['physical Pixel','TalkBack']};
    results.push(result);
    console.log('SCATTERED_OWNER_BROWSER_PASS',JSON.stringify(result));
  }
  assert.equal(JSON.stringify(recipe),originalJSON);
  console.log('SCATTERED_OWNER_BROWSER_ALL_PASS',JSON.stringify(results));
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
