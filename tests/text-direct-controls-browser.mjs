// Genuine Chromium/CDP pointer, keyboard and button acceptance for direct text controls.
// Run manually: node tests/text-direct-controls-browser.mjs
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
const recipe=normalizeRecipe({seed:'text-controls-browser-20261031',
  structure:'paths',textOverlays:[
    {id:'moving',text:'MOVE',x:30,y:52,size:60},
    {id:'guide',text:'GUIDE',x:60,y:52,size:60}
  ],viewZoom:1,viewPanX:0,viewPanY:0,positionX:0,positionY:0});
const originalJSON=JSON.stringify(recipe);
const profile=mkdtempSync(join(tmpdir(),'roygbiv-text-direct-'));
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
  await command('Page.enable');await command('Runtime.enable');
  const results=[];
  for(const [width,height] of [[320,700],[412,892]]){
    await command('Emulation.setDeviceMetricsOverride',{
      width,height,deviceScaleFactor:1,mobile:true,screenWidth:width,screenHeight:height
    });
    await command('Page.navigate',{url:origin+'?r='+encodeRecipe(recipe)});
    await waitFor('document.readyState==="complete" && !!document.querySelector("[data-text-move]")');
    await waitFor('document.body.classList.contains("mobile-studio")');
    assert.deepEqual(await source(),recipe,'starting text recipe unchanged');
    await evaluate('document.querySelector("[data-text-move]").click()');
    await waitFor('!document.getElementById("textDirectSnap").hidden');
    const controls=await evaluate('(()=>["textDirectAxis","textDirectSnap","textDirectDone"].map(id=>{const el=document.getElementById(id),r=el.getBoundingClientRect();const x=r.left+r.width/2,y=r.top+r.height/2;const hit=document.elementFromPoint(x,y);return {id,x,y,width:r.width,height:r.height,visible:!el.hidden,hit:hit===el||el.contains(hit),pressed:el.getAttribute("aria-pressed")}}))()');
    for(const c of controls)assert.ok(c.visible&&c.width>=44&&c.height>=44&&c.hit,
      'Text control is obstructed or smaller than 44 CSS px: '+JSON.stringify(c));
    assert.equal(controls[1].pressed,'false');
    await tap(controls[1].x,controls[1].y);
    await waitFor('document.getElementById("textDirectSnap").getAttribute("aria-pressed")==="true"');
    assert.deepEqual(await source(),recipe,'snap toggle is not authored artwork');
    const rect=await css();
    await tap(world(rect,180,676).x,world(rect,180,676).y);
    await waitFor('!document.querySelector(".text-direct-outline").hidden');
    const centreHit=await evaluate('(()=>{const r=document.getElementById("preview").getBoundingClientRect();return document.elementFromPoint(r.left+r.width*.3,r.top+r.height*.52)?.id})()');
    assert.equal(centreHit,'preview',
      '44px transform handles must not intercept the selected text drag centre');
    await drag(world(rect,180,676),world(rect,354,676));
    await waitFor('Math.abs(JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).textOverlays.find(x=>x.id==="moving").x-60)<.001');
    assert.equal(await currentX(),60,'nearby text anchor should align to other visible text');
    await evaluate('document.getElementById("undo").click()');
    await waitFor('Math.abs(JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).textOverlays.find(x=>x.id==="moving").x-30)<.001');
    assert.deepEqual(await source(),recipe,'one Undo restores original text recipe');
    await tap(controls[1].x,controls[1].y);
    await waitFor('document.getElementById("textDirectSnap").getAttribute("aria-pressed")==="false"');
    await drag(world(rect,180,676),world(rect,354,676));
    await waitFor('Math.abs(JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).textOverlays.find(x=>x.id==="moving").x-59)<.001');
    assert.equal(await currentX(),59,'snap disabled means continuous text move');
    await evaluate('document.getElementById("undo").click()');
    await waitFor('Math.abs(JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).textOverlays.find(x=>x.id==="moving").x-30)<.001');
    // The selected-guide group is keyboard reachable; handles keep their own arrows.
    const accessible=await evaluate('(()=>{const el=document.querySelector(".text-direct-outline");el.focus();return {tabIndex:el.tabIndex,label:el.getAttribute("aria-label"),focused:document.activeElement===el}})()');
    assert.equal(accessible.tabIndex,0);
    assert.ok(accessible.focused&&accessible.label.includes('Arrow keys'));
    async function pressArrow(key,modifiers=0){
      const virtual={ArrowLeft:37,ArrowRight:39,ArrowUp:38,ArrowDown:40}[key];
      await command('Input.dispatchKeyEvent',{type:'rawKeyDown',key,code:key,
        windowsVirtualKeyCode:virtual,nativeVirtualKeyCode:virtual,modifiers});
      await command('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,
        windowsVirtualKeyCode:virtual,nativeVirtualKeyCode:virtual,modifiers});
    }
    await pressArrow('ArrowRight');
    await waitFor('Math.abs(JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).textOverlays.find(x=>x.id==="moving").x-31)<.001');
    await pressArrow('ArrowRight',8); // Shift: coarse 5% source movement
    await waitFor('Math.abs(JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).textOverlays.find(x=>x.id==="moving").x-36)<.001');
    await pressArrow('ArrowLeft',2); // Control: fine 0.1% source movement
    await waitFor('Math.abs(JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).textOverlays.find(x=>x.id==="moving").x-35.9)<.001');
    await evaluate('document.getElementById("undo").click()');
    await waitFor('Math.abs(JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).textOverlays.find(x=>x.id==="moving").x-36)<.001');
    await evaluate('document.getElementById("undo").click()');
    await waitFor('Math.abs(JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).textOverlays.find(x=>x.id==="moving").x-31)<.001');
    await evaluate('document.getElementById("undo").click()');
    await waitFor('Math.abs(JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).textOverlays.find(x=>x.id==="moving").x-30)<.001');
    assert.deepEqual(await source(),recipe);
    // The Text object picker can switch selection while pointer capture is
    // held. That must abandon the OLD object's preview and pointer owner.
    const start=world(rect,180,676);
    await dispatch('mouseMoved',start.x,start.y);
    await dispatch('mousePressed',start.x,start.y,1);
    await dispatch('mouseMoved',start.x+34,start.y,1);
    await evaluate('(()=>{const picker=document.querySelector("[data-text-picker]");picker.value="guide";picker.dispatchEvent(new Event("change",{bubbles:true}))})()');
    await dispatch('mouseMoved',start.x+75,start.y,1);
    await dispatch('mouseReleased',start.x+75,start.y);
    assert.deepEqual(await source(),recipe,
      'picker selection change during a captured move must never commit old text');
    // The same rule must apply to a captured scale handle, and no selection
    // change may cause the old operation to modify the newly chosen object.
    await evaluate('(()=>{const picker=document.querySelector("[data-text-picker]");picker.value="moving";picker.dispatchEvent(new Event("change",{bubbles:true}))})()');
    const grip=await evaluate('(()=>{const h=document.querySelector(".text-direct-scale"),r=h.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;const top=document.elementFromPoint(x,y);return {x,y,hit:top===h}})()');
    assert.equal(grip.hit,true,'44px scale handle must be reachable at '+width);
    await dispatch('mouseMoved',grip.x,grip.y);
    await dispatch('mousePressed',grip.x,grip.y,1);
    await dispatch('mouseMoved',grip.x+30,grip.y+30,1);
    await evaluate('(()=>{const picker=document.querySelector("[data-text-picker]");picker.value="guide";picker.dispatchEvent(new Event("change",{bubbles:true}))})()');
    await dispatch('mouseReleased',grip.x+30,grip.y+30);
    assert.deepEqual(await source(),recipe,
      'picker selection change during a captured scale must not commit geometry');
    await evaluate('(()=>{const picker=document.querySelector("[data-text-picker]");picker.value="moving";picker.dispatchEvent(new Event("change",{bubbles:true}))})()');
    // Simulate the browser relinquishing active focus without a matching
    // pointercancel; later pointerup must never commit a ghost drag.
    await dispatch('mouseMoved',start.x,start.y);
    await dispatch('mousePressed',start.x,start.y,1);
    await dispatch('mouseMoved',start.x+40,start.y,1);
    await evaluate('window.dispatchEvent(new Event("blur"))');
    await dispatch('mouseReleased',start.x+40,start.y);
    assert.deepEqual(await source(),recipe,'blur must discard the source draft');
    // A CSS-layout / orientation change invalidates the gesture's screen
    // metric; release after resize must also be a no-op.
    await dispatch('mouseMoved',start.x,start.y);
    await dispatch('mousePressed',start.x,start.y,1);
    await dispatch('mouseMoved',start.x+40,start.y,1);
    await evaluate('window.dispatchEvent(new Event("resize"))');
    await dispatch('mouseReleased',start.x+40,start.y);
    assert.deepEqual(await source(),recipe,'resize must abandon CSS-space draft');
    // Mobile and desktop must dismiss the original on-canvas text tool
    // without the mobile sheet's document Escape handler stealing focus.
    // Test the selected text guide, both transform grips and mode controls.
    const escapeTargets=['.text-direct-outline','.text-direct-scale',
      '.text-direct-rotate','#textDirectAxis','#textDirectSnap','#textDirectDone'];
    for(const selector of escapeTargets){
      await waitFor('document.body.classList.contains("text-direct-active")');
      const active=await evaluate('(()=>{const target=document.querySelector('+JSON.stringify(selector)+');target.focus();return {focused:document.activeElement===target,hidden:target.hidden}})()');
      assert.ok(active.focused&&!active.hidden,
        'Escape target must accept focus: '+selector);
      await command('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'Escape',code:'Escape',
        windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});
      await command('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',
        windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});
      await waitFor('!document.body.classList.contains("text-direct-active")');
      assert.equal(await evaluate('document.activeElement?.id'),'mobileEdit',
        'Escape should restore visible editor entry from '+selector);
      assert.deepEqual(await source(),recipe,
        'Escape from '+selector+' must never edit authored text');
      await evaluate('document.querySelector("[data-text-move]").click()');
      await waitFor('document.body.classList.contains("text-direct-active")');
    }
    assert.equal(jsErrors.length,0,'No uncaught editor errors');
    results.push({width,height,snap:60,free:59,keyboard:[31,36,35.9],
      staleSelectionCancelled:true,blurAndResizeCancelled:true,
      escapeFocusReturned:escapeTargets.length,
      oneUndoEach:true,hitCells:controls.map(c=>({id:c.id,width:c.width,height:c.height})),
      notTested:['physical Pixel','TalkBack']});
    console.log('TEXT_DIRECT_CONTROLS_BROWSER_PASS',JSON.stringify(results.at(-1)));
  }
  assert.equal(JSON.stringify(recipe),originalJSON);
  console.log('TEXT_DIRECT_CONTROLS_BROWSER_ALL_PASS',JSON.stringify(results));
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
