// Real Chromium smoke test of the mobile experience, without a Playwright dependency.
// Run: node tests/browser-smoke.mjs
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,existsSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,extname} from 'node:path';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';

const cwd=process.cwd();
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser']
  .find(p=>p&&existsSync(p));
if(!chrome)throw Error('Chromium/Google Chrome executable required for mobile smoke test');
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript',
  '.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
const server=createServer((req,res)=>{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const resolved=resolve(cwd,'.'+(path==='/'?'/index.html':path));
  if(!resolved.startsWith(cwd+'/')&&!resolved.endsWith('/index.html')){res.writeHead(403).end();return;}
  try{const bytes=readFileSync(resolved);
    res.writeHead(200,{'Content-Type':mime[extname(resolved)]||'application/octet-stream'});
    res.end(bytes);
  }catch{res.writeHead(404).end();}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const url='http://127.0.0.1:'+server.address().port+'/';
const profile=mkdtempSync(join(tmpdir(),'roygbiv-chrome-'));
const proc=spawn(chrome,['--headless=new','--no-sandbox','--disable-dev-shm-usage',
  '--disable-gpu','--hide-scrollbars','--remote-debugging-port=0',
  '--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
let ws,seq=0;const pending=new Map();
function command(method,params={}){
  return new Promise((ok,bad)=>{
    const id=++seq;pending.set(id,{ok,bad});
    ws.send(JSON.stringify({id,method,params}));
  });
}
const evaluate=async expression=>{
  const r=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error('Browser JS: '+JSON.stringify(r.exceptionDetails).slice(0,900));
  return r.result?.value;
};
async function waitFor(expr,timeout=12000){
  const start=Date.now();
  while(Date.now()-start<timeout){
    if(await evaluate(expr))return;
    await delay(160);
  }
  throw Error('Browser wait expired: '+expr);
}
try{
  let port;
  for(let n=0;n<100;n++){
    const p=join(profile,'DevToolsActivePort');
    if(existsSync(p)){port=Number(readFileSync(p,'utf8').split('\n')[0]);break;}
    if(proc.exitCode!==null)throw Error('Chromium exited before opening debugger');
    await delay(100);
  }
  if(!port)throw Error('Chromium DevTools did not open');
  const targets=await (await fetch('http://127.0.0.1:'+port+'/json')).json();
  const page=targets.find(t=>t.type==='page');
  if(!page)throw Error('Missing Chromium page target');
  ws=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((ok,bad)=>{
    ws.addEventListener('open',ok,{once:true});
    ws.addEventListener('error',bad,{once:true});
  });
  ws.addEventListener('message',event=>{
    const m=JSON.parse(event.data);
    if(!m.id||!pending.has(m.id))return;
    const t=pending.get(m.id);pending.delete(m.id);
    if(m.error)t.bad(new Error(JSON.stringify(m.error)));else t.ok(m.result);
  });
  await command('Page.enable');
  await command('Runtime.enable');
  await command('Emulation.setDeviceMetricsOverride',{
    width:412,height:915,deviceScaleFactor:1,mobile:true,
    screenWidth:412,screenHeight:915,
  });
  await command('Page.navigate',{url});
  await waitFor('document.readyState==="complete"&&document.body.classList.contains("mobile-studio")');
  await delay(400);
  const phone=await evaluate(`(()=>{
    const box=sel=>{const r=document.querySelector(sel).getBoundingClientRect();
      return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};
    return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,
      scrollHeight:document.documentElement.scrollHeight,
      preview:box('.wallpaper-frame'),dock:box('.mobile-dock'),header:box('.masthead'),
      theme:document.documentElement.dataset.theme,
      settingsHidden:getComputedStyle(document.querySelector('.sidebar')).transform!=='none'};
  })()`);
  console.log('PHONE_LAYOUT_METRICS',JSON.stringify(phone));
  assert.equal(phone.width,412);
  assert.equal(phone.theme,'cream');
  assert.ok(phone.scrollWidth<=412,'no sideways viewport overflow');
  assert.ok(phone.scrollHeight<=915,'no full-page vertical scrolling');
  assert.ok(phone.preview.height>phone.height*.57,'the wallpaper should dominate the screen');
  assert.ok(phone.dock.y>=phone.preview.bottom-16,'dock should sit below the preview');
  assert.ok(phone.dock.bottom<=915,'dock should be fully visible');
  await evaluate('document.getElementById("mobileEdit").click()');
  await waitFor('document.body.classList.contains("mobile-edit-open") && document.querySelector(".sidebar").getBoundingClientRect().top < innerHeight');
  const editor=await evaluate(`(()=>({
    open:document.body.classList.contains('mobile-edit-open'),
    visible:document.querySelector('.sidebar').getBoundingClientRect().top<innerHeight,
    tabs:[...document.querySelectorAll('.settings-tab')].map(x=>x.textContent.trim())
  }))()`);
  assert.ok(editor.open&&editor.visible);
  assert.equal(editor.tabs.length,4);
  await evaluate(`(()=>{const theme=document.getElementById('studioTheme');
    theme.value='dark';theme.dispatchEvent(new Event('change',{bubbles:true}))})()`);
  assert.equal(await evaluate('document.documentElement.dataset.theme'),'dark');
  await evaluate('document.getElementById("mobileDesignClose").click()');
  await evaluate('document.getElementById("mobileMore").click()');
  const tools=await evaluate(`(()=>({
    open:document.body.classList.contains('mobile-tools-open'),
    seed:!!document.querySelector('#mobileToolsContent #seedInput'),
    metadata:!!document.querySelector('#mobileToolsContent #metadataToggle'),
    nudge:!!document.querySelector('#mobileToolsContent .nudge-pad'),
    copy:!!document.querySelector('#mobileToolsContent #copyLink'),
    undo:!!document.querySelector('#mobileToolsContent #undo')
  }))()`);
  assert.ok(Object.values(tools).every(Boolean),'mobile tools should expose all legacy utilities');
  await evaluate('document.getElementById("mobileToolsClose").click()');
  await evaluate('document.getElementById("mobileExplore").click()');
  assert.ok(await evaluate('document.body.classList.contains("mobile-gallery-open")'));
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".workspace>.gallery-section")).display'),'flex');
  await evaluate('document.getElementById("mobileExplore").click()');
  assert.ok(!await evaluate('document.body.classList.contains("mobile-gallery-open")'));
  await command('Emulation.setDeviceMetricsOverride',{
    width:1280,height:900,deviceScaleFactor:1,mobile:false,
    screenWidth:1280,screenHeight:900,
  });
  await waitFor('!document.body.classList.contains("mobile-studio")');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".mobile-dock")).display'),'none');
  assert.equal(await evaluate('document.documentElement.dataset.theme'),'dark');
  console.log('Browser smoke passed: phone viewport, sheets, gallery, theme and desktop restoration.');
}finally{
  try{ws?.close()}catch{}
  for(const {bad} of pending.values())bad(new Error('Browser ended'));
  proc.kill('SIGTERM');
  server.close();
  // Chromium writes cache entries while exiting. Never mask a browser assertion
  // with a racing temporary-directory cleanup error.
  await Promise.race([
    new Promise(resolve=>proc.once('exit',resolve)),
    delay(2200),
  ]);
  try{rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:180});}
  catch(e){console.warn('Temporary Chrome profile cleanup:',e.message);}
}
