// Genuine two-size Chromium keyboard acceptance for selected vector shape outlines.
// Run manually: node tests/scattered-keyboard-nudge-browser.mjs
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
const recipe=normalizeRecipe({...RAINBOW_ORBITS,seed:'keyboard-nudge-browser-20261031',
  scatteredCount:1,scatteredOverlap:'overlap',scatteredOverrides:[
    {index:0,x:.3,y:.43,radius:.08}
  ],viewZoom:1,viewPanX:0,viewPanY:0,positionX:0,positionY:0});
const originalJSON=JSON.stringify(recipe);
const profile=mkdtempSync(join(tmpdir(),'roygbiv-keyboard-nudge-'));
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
  async function arrow(key,modifiers=0){
    const vk={ArrowLeft:37,ArrowUp:38,ArrowRight:39,ArrowDown:40}[key];
    await command('Input.dispatchKeyEvent',{type:'rawKeyDown',key,code:key,
      windowsVirtualKeyCode:vk,nativeVirtualKeyCode:vk,modifiers});
    await command('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,
      windowsVirtualKeyCode:vk,nativeVirtualKeyCode:vk,modifiers});
  }
  async function undoTo(x,y){
    await evaluate('document.getElementById("undo").click()');
    await waitFor('(()=>{const r=JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).scatteredOverrides.find(x=>x.index===0);return Math.abs(r.x-'+x+')<.00001&&Math.abs(r.y-'+y+')<.00001})()');
  }
  for(const [width,height] of [[320,700],[412,892]]){
    await command('Emulation.setDeviceMetricsOverride',{
      width,height,deviceScaleFactor:1,mobile:true,screenWidth:width,screenHeight:height
    });
    await command('Page.navigate',{url:origin+'?r='+encodeRecipe(recipe)});
    await waitFor('document.readyState==="complete" && !!document.getElementById("scatteredMoveOnCanvas")');
    await waitFor('document.body.classList.contains("mobile-studio")');
    assert.deepEqual(await source(),recipe);
    await evaluate('document.getElementById("scatteredMoveOnCanvas").click()');
    await waitFor('!document.getElementById("scatteredDirectOutline").hidden');
    const controls=await evaluate('(()=>["scatteredDirectAxis","scatteredDirectSnap","scatteredDirectPivot","scatteredDirectDone"].map(id=>{const el=document.getElementById(id),r=el.getBoundingClientRect();const x=r.left+r.width/2,y=r.top+r.height/2;return {id,width:r.width,height:r.height,hit:document.elementFromPoint(x,y)===el,hidden:el.hidden}}))()');
    for(const c of controls)assert.ok(!c.hidden&&c.width>=44&&c.height>=44&&c.hit,
      'Obstructed/undersized shape control: '+JSON.stringify(c));
    const guide=await evaluate('(()=>{const el=document.getElementById("scatteredDirectOutline");el.focus();return {focused:document.activeElement===el,tabIndex:el.tabIndex,keys:el.getAttribute("aria-keyshortcuts"),label:el.getAttribute("aria-label"),hidden:el.hidden,rect:(()=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height}})()}})()');
    assert.equal(guide.focused,true,'vector frame can receive real keyboard focus');
    assert.equal(guide.hidden,false);
    assert.equal(guide.tabIndex,0);
    assert.ok(guide.label.includes('Arrow keys')&&guide.keys.includes('ArrowRight'));
    await arrow('ArrowRight');
    await waitFor('Math.abs(JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).scatteredOverrides.find(x=>x.index===0).x-.31)<.00001');
    await arrow('ArrowDown',8); // Shift moves 5 percent of physical artwork height
    await waitFor('Math.abs(JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).scatteredOverrides.find(x=>x.index===0).y-.48)<.00001');
    await arrow('ArrowLeft',2); // Control moves 0.1 percent of artwork width
    await waitFor('Math.abs(JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).scatteredOverrides.find(x=>x.index===0).x-.309)<.00001');
    assert.equal(await evaluate('document.getElementById("undo").disabled'),false);
    await undoTo(.31,.48);
    await undoTo(.31,.43);
    await undoTo(.3,.43);
    assert.deepEqual(await source(),recipe,'one Undo per source-precision key');
    // A different, actual button must retain its own keys, not move the art.
    await evaluate('document.getElementById("scatteredDirectSnap").focus()');
    await arrow('ArrowRight');
    assert.deepEqual(await source(),recipe,'nudge key scoped exclusively to guide');
    await evaluate('document.getElementById("scatteredDirectOutline").focus()');
    const v=await evaluate('(()=>{const g=document.getElementById("scatteredDirectOutline");return document.activeElement===g})()');
    assert.equal(v,true);
    await command('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});
    await command('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});
    await waitFor('!document.body.classList.contains("scattered-direct-active")');
    assert.equal(await evaluate('document.activeElement?.id'),'mobileEdit',
      'mobile dismissal restores the visible editor-entry focus anchor');
    assert.deepEqual(await source(),recipe,'exit does not write art');
    assert.equal(jsErrors.length,0,'uncaught page JS error');
    const item={width,height,controls,sourceNudges:[.31,.48,.309],
      undoOneEach:true,focusReturned:true,notVerified:['physical Pixel','TalkBack']};
    results.push(item);
    console.log('SCATTERED_KEYBOARD_BROWSER_PASS',JSON.stringify(item));
  }
  assert.equal(JSON.stringify(recipe),originalJSON);
  console.log('SCATTERED_KEYBOARD_BROWSER_ALL_PASS',JSON.stringify(results));
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
