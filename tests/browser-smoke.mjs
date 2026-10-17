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
  '--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
let chromeErrors='';
proc.stderr.on('data',buffer=>{chromeErrors=(chromeErrors+buffer.toString()).slice(-2400);});
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
  // Shared CI hosts can take longer to cold-start Chromium under load.
  for(let n=0;n<260;n++){
    const p=join(profile,'DevToolsActivePort');
    if(existsSync(p)){port=Number(readFileSync(p,'utf8').split('\n')[0]);break;}
    if(proc.exitCode!==null)throw Error('Chromium exited before opening debugger');
    await delay(100);
  }
  if(!port)throw Error('Chromium DevTools did not open: '+chromeErrors);
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

  const initial=await evaluate('({tabs:document.querySelectorAll(".settings-tab").length,tools:document.querySelectorAll(".editor-tool-card").length,preview:document.querySelector(".wallpaper-frame").getBoundingClientRect().height,scroll:document.documentElement.scrollHeight})');
  assert.equal(initial.tabs,6);
  assert.ok(initial.tools>=18);
  assert.ok(initial.preview>450);
  assert.ok(initial.scroll<=915);
  await evaluate('document.getElementById("mobileEdit").click()');
  await waitFor('document.body.classList.contains("mobile-edit-open")');
  const editor=await evaluate('(()=>{const box=q=>document.querySelector(q).getBoundingClientRect();const s=box(".studio-stage"),p=box(".wallpaper-frame"),t=box(".sidebar");return {separate:s.bottom<=t.top+2,ratio:p.width/p.height,previewHeight:p.height,scrollY:getComputedStyle(document.querySelector(".sidebar")).overflowY,tabs:[...document.querySelectorAll(".settings-tab")].map(b=>b.textContent.trim())}})()');
  console.log('REDESIGN_PHONE_METRICS',JSON.stringify(editor));
  assert.ok(editor.separate,'the panel may not overlap or obscure any stripe');
  assert.ok(editor.previewHeight>260,'the complete frame remains appreciable during edits');
  assert.ok(Math.abs(editor.ratio-600/1300)<.06);
  assert.equal(editor.scrollY,'hidden');
  assert.deepEqual(editor.tabs,['▦ Layout','⌁ Path','≋ Stripes','◐ Colour','▧ Material','✦ Effects']);
  const schema=await evaluate('(async()=>{const m=await import("/src/editor-schema.js");const keys=[...document.querySelectorAll("#controls [data-setting]")].map(x=>x.name).filter(x=>x&&!["family","primesOnly"].includes(x));return {...m.validateEditorSchema([...new Set(keys)]),wizard:m.WIZARD_STEPS,toolCount:m.TOOL_LIST.length}})()');
  console.log('EDITOR_SCHEMA',JSON.stringify(schema));
  assert.deepEqual(schema.missing,[]);
  assert.deepEqual(schema.duplicated,[]);
  assert.deepEqual(schema.unknown,[]);
  assert.equal(schema.wizard.length,6);
  assert.ok(schema.toolCount>=18);
  // Direct navigation, no blind scroll or gallery overlay.
  await evaluate('document.getElementById("tab-stripes").click()');
  await evaluate('document.querySelector("[data-editor-tool=structure]").click()');
  assert.ok(await evaluate('document.querySelector("#panel-stripes .editor-tool-card:not([hidden]) [name=stripeWidth]")!==null'));
  const original=await evaluate('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r")))');
  await evaluate('document.querySelector("[data-random-setting=stripeWidth]").click()');
  await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).stripeWidth!=='+original.stripeWidth);
  const changed=await evaluate('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r")))');
  const changedKeys=Object.keys(changed).filter(k=>JSON.stringify(changed[k])!==JSON.stringify(original[k]));
  assert.deepEqual(changedKeys,['stripeWidth'],'per-setting reroll must change ONLY stripeWidth');
  await evaluate('document.querySelector("[name=stripeWidth]").closest(".lockable-setting").querySelector(".setting-lock").click()');
  assert.ok(await evaluate('document.querySelector("[data-random-setting=stripeWidth]").disabled'));
  const locked=await evaluate('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r")))');
  await evaluate('document.querySelector("[data-random-category]").click()');
  const afterCategory=await evaluate('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r")))');
  assert.equal(afterCategory.stripeWidth,locked.stripeWidth);
  assert.equal(afterCategory.palette,locked.palette);
  assert.equal(afterCategory.seed,locked.seed);
  assert.ok(['construction','spread','motif','lineStyle','dotSize','dotSpacing','individuality'].some(k=>JSON.stringify(afterCategory[k])!==JSON.stringify(locked[k])));
  // Nearby variations are controlled by the same scope and don't reset seed.
  await evaluate('document.getElementById("editorVariationMode").value="vary"');
  await evaluate('document.getElementById("editorVariationStrength").value="gentle"');
  const beforeVary=await evaluate('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r")))');
  await evaluate('document.querySelector("[data-random-tool=structure]").click()');
  const varied=await evaluate('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r")))');
  assert.equal(varied.seed,beforeVary.seed);
  assert.equal(varied.palette,beforeVary.palette);
  assert.equal(varied.stripeWidth,beforeVary.stripeWidth);
  assert.ok(Math.abs(varied.spread-beforeVary.spread)<=7,'gentle variations stay local');
  // A style translates to visible regular settings rather than hidden width.
  await evaluate('(()=>{const f=document.querySelector("[name=family]");f.value="tapestry";f.dispatchEvent(new Event("change",{bubbles:true}))})()');
  const preset=await evaluate('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r")))');
  assert.equal(preset.geometry,'wave');
  assert.equal(preset.motif,'chevrons');
  assert.equal(preset.palette,'muted');
  // Editing from different categories never hides or renumbers stripes.
  for(const id of ['layout','path','stripes','colour','material','effects']){
    await evaluate('document.getElementById("tab-'+id+'").click()');
    const result=await evaluate('(()=>{const p=document.querySelector(".editor-category-panel:not([hidden])");const c=p.querySelector(".editor-tool-card:not([hidden])");const a=c.getBoundingClientRect(),b=document.querySelector(".studio-stage").getBoundingClientRect(),t=document.querySelector(".sidebar").getBoundingClientRect();return {category:p.dataset.category,tool:c.dataset.editorTool,visible:a.width>0&&a.height>0,separate:b.bottom<=t.top+2,scrollY:getComputedStyle(p).overflowY}})()');
    assert.equal(result.category,id);
    assert.ok(result.visible&&result.separate);
    assert.equal(result.scrollY,'hidden');
  }
  await evaluate('document.getElementById("tab-material").click()');
  await evaluate('document.querySelector("[data-editor-tool=layer1]").click()');
  await evaluate('document.getElementById("addTextureLayer2").click()');
  await waitFor('document.getElementById("textureLayer2Panel").hidden===false');
  await evaluate('document.querySelector("[data-editor-tool=layer2]").click()');
  assert.ok(await evaluate('document.querySelector("#panel-material .editor-tool-card:not([hidden]) [name=material2]")!==null'));
  await evaluate('document.getElementById("tab-path").click()');
  await evaluate('document.querySelector("[data-editor-tool=geometry]").click()');
  assert.ok(await evaluate('document.querySelector("#panel-path .editor-tool-card:not([hidden]) [name=geometry]")!==null'));
  // Keep the existing single-checkpoint Undo and complete full-res export.
  await evaluate('document.getElementById("undo").click()');
  assert.ok(await evaluate('document.querySelector(".studio-stage").getBoundingClientRect().bottom<=document.querySelector(".sidebar").getBoundingClientRect().top+2'));
  // Desktop reuses identical form controls; no duplicated settings or hidden panel.
  await command('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false,screenWidth:1280,screenHeight:900});
  await waitFor('!document.body.classList.contains("mobile-studio")');
  assert.ok(await evaluate('document.querySelector("#panel-path [name=geometry]")!==null'));
  assert.ok(await evaluate('document.querySelectorAll(".editor-tool-card").length>=18'));
  console.log('REDESIGN_EXPLORATION_ACCEPTANCE_SUCCESS');
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
