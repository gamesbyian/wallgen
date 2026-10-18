// Real Chromium smoke test of the mobile experience, without a Playwright dependency.
// Run: node tests/browser-smoke.mjs
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,existsSync,mkdtempSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
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
    if(m.method==='Runtime.exceptionThrown')console.log('BROWSER_EXCEPTION',JSON.stringify(m.params).slice(0,1800));
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
  await waitFor('document.querySelectorAll(".settings-tab").length===6',15000);
  await delay(300);

  const initial=await evaluate('({tabs:document.querySelectorAll(".settings-tab").length,tools:document.querySelectorAll(".editor-tool-card").length,preview:document.querySelector(".wallpaper-frame").getBoundingClientRect().height,scroll:document.documentElement.scrollHeight})');
  assert.equal(initial.tabs,6);
  assert.ok(initial.tools>=18);
  assert.ok(initial.preview>450);
  assert.ok(initial.scroll<=915);
  await evaluate('document.getElementById("mobileEdit").click()');
  await waitFor('document.body.classList.contains("mobile-edit-open")');
  const guide=await evaluate(`(()=>{
    const btn=document.getElementById('mobileBleed'),canvas=document.getElementById('preview');
    const f=canvas.getBoundingClientRect();
    const before=document.getElementById('preview').toDataURL();
    btn.click();
    const g=document.getElementById('bleedGuide').getBoundingClientRect();
    const result={pressed:btn.getAttribute('aria-pressed'),hidden:document.getElementById('bleedGuide').hidden,
      ratioW:g.width/f.width,ratioH:g.height/f.height,
      contrast:getComputedStyle(document.getElementById('bleedGuide')).borderTopColor,
      untouched:before===document.getElementById('preview').toDataURL()};
    btn.click();result.off=document.getElementById('bleedGuide').hidden;
    return result;
  })()`);
  console.log('BLEED_GUIDE_CHECK',JSON.stringify(guide));
  assert.equal(guide.pressed,'true');assert.equal(guide.hidden,false);
  assert.ok(Math.abs(guide.ratioW-.9)<.01&&Math.abs(guide.ratioH-.9)<.01);
  assert.ok(guide.untouched&&guide.off,'Bleed is a reversible preview-only outline');
  // Bleed follows background rather than sampling stripe pixels, and the
  // hairline inherits the frame's corner radius.
  for(const background of ['black','white']){
    await evaluate(`(()=>{const select=document.querySelector('[name=background]');select.value=${JSON.stringify(background)};select.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('mobileBleed').click()})()`);
    const state=await evaluate('(()=>{const guide=document.getElementById("bleedGuide"),frame=document.querySelector(".wallpaper-frame");return {colour:getComputedStyle(guide).borderTopColor,radius:getComputedStyle(guide).borderTopLeftRadius,frameRadius:getComputedStyle(frame).borderTopLeftRadius}})()');
    assert.equal(state.colour,background==='black'?'rgb(255, 255, 255)':'rgb(16, 16, 20)');
    assert.equal(state.radius,state.frameRadius);
    assert.ok(parseFloat(state.radius)>0);
    await evaluate('document.getElementById("mobileBleed").click()');
  }
  // The outer frame changes its available height between dock and editor.
  // Bleed must stay centred on the actual canvas in BOTH layouts.
  await evaluate('document.getElementById("mobileBleed").click()');
  const guidePosition=async()=>evaluate(`(()=>{
    const canvas=document.getElementById('preview').getBoundingClientRect();
    const g=document.getElementById('bleedGuide').getBoundingClientRect();
    const x=(g.left-canvas.left)/canvas.width,y=(g.top-canvas.top)/canvas.height;
    return {x,y,w:g.width/canvas.width,h:g.height/canvas.height,
      centerY:(g.top+g.height/2-canvas.top)/canvas.height};
  })()`);
  const expandedGuide=await guidePosition();
  await evaluate('document.getElementById("mobileEdit").click()');
  await waitFor('!document.body.classList.contains("mobile-edit-open")');
  const dockGuide=await guidePosition();
  console.log('BLEED_DOCK_VS_EDIT',JSON.stringify({expandedGuide,dockGuide}));
  for(const state of [expandedGuide,dockGuide]){
    for(const key of ['x','y'])assert.ok(Math.abs(state[key]-.05)<.012,key+' bleed inset');
    for(const key of ['w','h'])assert.ok(Math.abs(state[key]-.9)<.012,key+' bleed extent');
    assert.ok(Math.abs(state.centerY-.5)<.012,'bleed must stay vertically centred');
  }
  await evaluate('document.getElementById("mobileEdit").click()');
  await waitFor('document.body.classList.contains("mobile-edit-open")');
  await evaluate('document.getElementById("mobileBleed").click()');
  // Side-rail Save/Favourite must keep the editor open, unlike navigation.
  const beforeFavorite=await evaluate('document.getElementById("favorite").getAttribute("aria-pressed")');
  await evaluate('document.querySelector("[data-dock-proxy=mobileFavorite]").click()');
  assert.ok(await evaluate('document.body.classList.contains("mobile-edit-open")'));
  assert.notEqual(await evaluate('document.getElementById("favorite").getAttribute("aria-pressed")'),beforeFavorite);
  await evaluate('document.querySelector("[data-dock-proxy=mobileFavorite]").click()');
  assert.ok(await evaluate('document.body.classList.contains("mobile-edit-open")'));
  const saveClicks=await evaluate('(()=>{window.__sideSaveClicks=0;document.getElementById("download").addEventListener("click",()=>window.__sideSaveClicks++);document.querySelector("[data-dock-proxy=mobileDownload]").click();return window.__sideSaveClicks})()');
  assert.equal(saveClicks,1);
  assert.ok(await evaluate('document.body.classList.contains("mobile-edit-open")'));
  await waitFor(`(()=>{
    const rail=document.getElementById('mobileEditorActionRail').getBoundingClientRect();
    const edit=document.getElementById('mobileDesignSheet').getBoundingClientRect();
    return Math.abs(rail.top-edit.top)<3;
  })()`,3000);
  const sideRail=await evaluate(`(()=>{
    const rail=document.getElementById('mobileEditorActionRail').getBoundingClientRect();
    const edit=document.getElementById('mobileDesignSheet').getBoundingClientRect();
    const buttons=[...document.querySelectorAll('#mobileEditorActionRail button')];
    return {height:rail.height,editHeight:edit.height,aligned:Math.abs(rail.top-edit.top)<3,
      visible:buttons.every(b=>b.getBoundingClientRect().height>0),
      actions:buttons.map(b=>b.dataset.dockProxy)};
  })()`);
  console.log('EDITOR_ACTION_RAIL',JSON.stringify(sideRail));
  assert.ok(sideRail.aligned&&Math.abs(sideRail.height-sideRail.editHeight)<3);
  assert.ok(sideRail.visible);
  assert.deepEqual(sideRail.actions,['mobileEdit','mobileExplore','mobileShuffle','mobileFavorite','mobileDownload','mobileMore']);
  const editor=await evaluate('(()=>{const box=q=>document.querySelector(q).getBoundingClientRect();const s=box(".studio-stage"),p=box(".wallpaper-frame"),t=box(".sidebar");return {separate:s.bottom<=t.top+2,ratio:p.width/p.height,previewHeight:p.height,scrollY:getComputedStyle(document.querySelector(".sidebar")).overflowY,tabs:[...document.querySelectorAll(".settings-tab")].map(b=>b.textContent.trim())}})()');
  console.log('REDESIGN_PHONE_METRICS',JSON.stringify(editor));
  assert.ok(editor.separate,'the panel may not overlap or obscure any stripe');
  assert.ok(editor.previewHeight>260,'the complete frame remains appreciable during edits');
  assert.ok(Math.abs(editor.ratio-600/1300)<.06);
  assert.equal(editor.scrollY,'hidden');
  assert.deepEqual(editor.tabs,['▦ Layout','⌁ Path','≋ Stripes','◐ Colour','▧ Material','✦ Effects']);
  const schema=await evaluate('(async()=>{const m=await import("/src/editor-schema.js");const keys=[...document.querySelectorAll("#controls [data-setting]")].map(x=>x.name).filter(x=>x&&!["family","primesOnly"].includes(x));keys.push("textureLayer2Enabled","textureLayer3Enabled");return {...m.validateEditorSchema([...new Set(keys)]),wizard:m.WIZARD_STEPS,toolCount:m.TOOL_LIST.length}})()');
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
  await evaluate('document.getElementById("editorHistoryToggle").click()');
  const history=await evaluate('(()=>{const p=document.getElementById("editorHistory"),b=p.getBoundingClientRect(),s=document.querySelector(".studio-stage").getBoundingClientRect();return {open:!p.hidden,count:p.querySelectorAll(".editor-history-choice").length,images:p.querySelectorAll("img").length,separate:s.bottom<=b.top+4}})()');
  assert.ok(history.open&&history.count>=3&&history.images===history.count&&history.separate,
    'recent variation thumbnails must be usable without covering the artwork');
  await evaluate('document.querySelector("#editorHistory .editor-history-choice").click()');
  assert.ok(await evaluate('document.getElementById("editorHistory").hidden'),
    'choosing an earlier variation closes history and restores the tool');
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
  await evaluate('document.querySelector("[data-editor-tool=layer2]").click()');
  assert.ok(await evaluate('document.querySelector("[name=material2]").disabled===false'));
  await evaluate('(()=>{const el=document.querySelector("[name=material2]");el.value="linen";el.dispatchEvent(new Event("change",{bubbles:true}))})()');
  await waitFor('document.getElementById("textureLayer2Enabled").checked===true');
  assert.ok(await evaluate('document.querySelector("#panel-material .editor-tool-card:not([hidden]) [name=material2]")!==null'));
  await evaluate('document.getElementById("tab-path").click()');
  await evaluate('document.querySelector("[data-editor-tool=geometry]").click()');
  assert.ok(await evaluate('document.querySelector("#panel-path .editor-tool-card:not([hidden]) [name=geometry]")!==null'));
  // The single-loop path is separate from repeated loops and follows the
  // existing hairpin recipe + controls flow.
  await evaluate('(()=>{const el=document.querySelector("[name=geometry]");el.value="loop";el.dispatchEvent(new Event("change",{bubbles:true}));})()');
  await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).geometry==="loop"');
  await evaluate('document.querySelector("[data-editor-tool=single-loop]").click()');
  const loopControls=await evaluate('(()=>({radius:document.querySelector("[name=loopRadius]").disabled,sweep:document.querySelector("[name=loopSweep]").disabled,tool:document.querySelector(".editor-tool-card:not([hidden])").dataset.editorTool,hasRepeated:!!document.querySelector("[name=geometry] option[value=loops]")}))()');
  assert.equal(loopControls.radius,false);
  assert.equal(loopControls.sweep,false);
  assert.equal(loopControls.tool,'single-loop');
  assert.equal(loopControls.hasRepeated,true);
  await evaluate('(()=>{const el=document.querySelector("[name=loopSweep]");el.value="405";el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));})()');
  await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).loopSweep===405');
  const loopGeometry=await evaluate(`(async()=>{const {resolveScene}=await import('/src/model.js');
    const recipe=JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('r')));
    const scene=resolveScene(recipe);
    return {count:scene.stripes.length,geometry:scene.geometry,
      radius:scene.stripes[3].loopRadius,sweep:scene.stripes[3].loopSweep}})()`);
  assert.equal(loopGeometry.count,7);
  assert.equal(loopGeometry.geometry,'loop');
  assert.equal(loopGeometry.sweep,405);
  assert.ok(loopGeometry.radius>0);
  await evaluate('document.querySelector("[data-editor-tool=safety]").click()');
  assert.ok(await evaluate('document.querySelector("[name=geometrySafety]").checked'));
  await evaluate('(()=>{const f=document.querySelector("[name=geometrySafety]");f.checked=false;f.dispatchEvent(new Event("input",{bubbles:true}));f.dispatchEvent(new Event("change",{bubbles:true}));})()');
  await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).geometrySafety===false');
  await evaluate('document.querySelector("[data-random-category=path]").click()');
  assert.equal(await evaluate('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).geometrySafety'),false,
    'randomization may not silently toggle the geometry-safety policy');
  await evaluate('(()=>{const f=document.querySelector("[name=geometrySafety]");f.checked=true;f.dispatchEvent(new Event("change",{bubbles:true}));})()');
  await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).geometrySafety===true');
  // Shadows are now stripe finishing, with zero intensity as the sole Off
  // control. No checkbox takes a separate mobile row or hides the sliders.
  await evaluate('document.getElementById("tab-stripes").click()');
  const stripeToolOrder=await evaluate('Array.from(document.querySelectorAll(".editor-tool-tab")).filter(b=>b.dataset.category==="stripes").map(b=>b.dataset.editorTool)');
  assert.deepEqual(stripeToolOrder,[
    'structure','outlines','patterns','marks','motif-scale','tone','character','shadows','glow']);
  await evaluate('document.querySelector("[data-editor-tool=shadows]").click()');
  const beforeShadow=await evaluate('(()=>{const c=document.querySelector(".editor-tool-card:not([hidden])"),r=c.getBoundingClientRect();return {labels:[...c.querySelectorAll("[name]")].map(n=>n.name),w:r.width,h:r.height,checkbox:!!c.querySelector("[name=stripeShadowEnabled]"),controls:document.getElementById("stripeShadowControls").hidden}})()');
  assert.equal(beforeShadow.checkbox,false);
  assert.equal(beforeShadow.controls,false);
  assert.ok(beforeShadow.labels.includes('stripeShadowStrength'));
  await evaluate('(()=>{const input=document.querySelector("[name=stripeShadowStrength]");input.value="0";input.dispatchEvent(new Event("input",{bubbles:true}));input.dispatchEvent(new Event("change",{bubbles:true}));})()');
  await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).stripeShadowStrength===0');
  const offShadow=await evaluate('(()=>({soft:document.querySelector("[name=stripeShadowSoftness]").disabled,direction:document.querySelector("[name=stripeShadowDirection]").disabled}))()');
  assert.ok(offShadow.soft&&offShadow.direction,'zero shadow intensity makes subordinate controls dormant');
  await evaluate('(()=>{const input=document.querySelector("[name=stripeShadowStrength]");input.value="72";input.dispatchEvent(new Event("input",{bubbles:true}));input.dispatchEvent(new Event("change",{bubbles:true}));})()');
  await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).stripeShadowStrength===72');
  const onShadow=await evaluate('(()=>({soft:document.querySelector("[name=stripeShadowSoftness]").disabled,direction:document.querySelector("[name=stripeShadowDirection]").disabled}))()');
  assert.ok(!onShadow.soft&&!onShadow.direction,'restoring shadow intensity re-enables softness and direction');
  await evaluate('document.getElementById("tab-effects").click()');
  const effectsTools=await evaluate('Array.from(document.querySelectorAll(".editor-tool-tab")).filter(b=>b.dataset.category==="effects").map(b=>b.dataset.editorTool)');
  assert.deepEqual(effectsTools,['lighting'],'Effects retains only the canvas lighting controls');
  // All six categories and their tool cards must fit without internal
  // scrolling or concealing active controls. This is stronger than merely
  // setting overflow:hidden in CSS.
  const fitting=await evaluate('(()=>{const bad=[];for(const b of document.querySelectorAll(".settings-tab")){b.click();const c=b.dataset.tab;for(const chip of document.querySelectorAll(".editor-tool-tab:not([hidden])")){chip.click();const card=document.querySelector(".editor-tool-card:not([hidden])");const box=card.getBoundingClientRect();const names=[];for(const node of card.querySelectorAll("input:not([type=hidden]),select,.add-texture-layer")){if(node.getClientRects().length===0||node.closest("[hidden]"))continue;const r=node.getBoundingClientRect();if(r.top<box.top-3||r.bottom>box.bottom+3||r.left<box.left-3||r.right>box.right+3)names.push(node.name||node.id)}if(names.length)bad.push({tool:chip.dataset.editorTool,controls:names,card:card.clientHeight,scroll:card.scrollHeight,children:[...card.querySelectorAll(".texture-layer-group>* , #textureLayer2Panel>* , #textureLayer3Panel>*")].map(x=>({tag:x.tagName,cls:x.className?.toString().slice(0,45),h:Math.round(x.getBoundingClientRect().height),top:Math.round(x.getBoundingClientRect().top-box.top),display:getComputedStyle(x).display})).filter(x=>x.h>0)});}}return bad})()');
  console.log('ALL_TOOL_FIT_AUDIT',JSON.stringify(fitting));
  assert.deepEqual(fitting,[],'every active tool must fit without scrolling and without cutting controls');
  // Browser zoom changes the effective CSS viewport. Test a normal phone
  // (412 × 915 CSS pixels) and the same physical phone at 67% browser zoom
  // (approximately 615 × 1365 CSS pixels). Both remain below mobile breakpoint.
  const screenshots=join(cwd,'output','editor-layout');
  mkdirSync(screenshots,{recursive:true});
  async function captureUI(name){
    const png=(await command('Page.captureScreenshot',{
      format:'png',captureBeyondViewport:false,fromSurface:true,
    })).data;
    writeFileSync(join(screenshots,name+'.png'),Buffer.from(png,'base64'));
  }
  async function checkEditorZoom(width,height,name){
    await command('Emulation.setDeviceMetricsOverride',{
      width,height,deviceScaleFactor:1,mobile:true,
      screenWidth:width,screenHeight:height,
    });
    await waitFor('document.body.classList.contains("mobile-studio")');
    if(!await evaluate('document.body.classList.contains("mobile-edit-open")'))
      await evaluate('document.getElementById("mobileEdit").click()');
    await evaluate('document.getElementById("tab-material").click()');
    await evaluate('document.querySelector("[data-editor-tool=layer1]").click()');
    await delay(240);
    const bounds=await evaluate(`(()=>{
      const rect=q=>document.querySelector(q).getBoundingClientRect();
      const nav=rect('.settings-tabs'),strip=rect('.editor-tool-chooser');
      const card=rect('.editor-tool-card:not([hidden])');
      const stage=rect('.studio-stage'),tray=rect('.sidebar');
      const categoryBtns=[...document.querySelectorAll('.settings-tabs .settings-tab')];
      const categoryR=categoryBtns.map(e=>e.getBoundingClientRect());
      const toolbar=rect('.editor-explore');
      const toolbarFields=[...document.querySelectorAll('.editor-explore select:not([hidden]),.editor-explore button:not([hidden])')]
        .filter(el=>el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden');
      const fieldR=toolbarFields.map(e=>({name:e.id||e.textContent.trim(),b:e.getBoundingClientRect()}));
      const visible=el=>el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden';
      const overlaps=[];
      for(const row of document.querySelectorAll('.editor-tool-card:not([hidden]) .lockable-setting')){
        if(!visible(row)||row.closest('[hidden]'))continue;
        const die=row.querySelector(':scope > .editor-setting-die');
        const lock=row.querySelector(':scope > .setting-lock');
        if(die&&lock&&visible(die)&&visible(lock)){
          const d=die.getBoundingClientRect(),l=lock.getBoundingClientRect();
          if(d.right>l.left+1&&l.right>d.left+1)
            overlaps.push({name:row.querySelector('[name]')?.name||'',excess:Math.round(d.right-l.left)});
        }
      }
      const categoryDie=document.querySelector('[data-random-category]');
      const categoryText=document.createRange();
      categoryText.selectNodeContents(categoryDie);
      const categoryTextBox=categoryText.getBoundingClientRect();
      const dieBox=categoryDie.getBoundingClientRect();
      const failures=[];
      const allControls=[...document.querySelectorAll('.editor-tool-card:not([hidden]) input:not([type=hidden]),.editor-tool-card:not([hidden]) select,.editor-tool-card:not([hidden]) button')];
      for(const el of allControls){
        if(!visible(el)||el.closest('[hidden]'))continue;
        const b=el.getBoundingClientRect();
        if(b.top<card.top-2||b.bottom>card.bottom+2||b.left<card.left-2||b.right>card.right+2)
          failures.push({control:el.name||el.id||el.textContent.trim().slice(0,16),top:Math.round(b.top-card.top),bottom:Math.round(b.bottom-card.bottom)});
      }
      const chip=document.querySelector('.editor-tool-tab[aria-pressed=true]').getBoundingClientRect();
      return {
        width:innerWidth,height:innerHeight,navPosition:getComputedStyle(document.querySelector('.settings-tabs')).position,
        categoryRows:new Set(categoryR.map(b=>Math.round(b.top))).size,
        categoryWithin:categoryR.every(b=>b.top>=nav.top-2&&b.bottom<=nav.bottom+2),
        categoryBottom:Math.round(nav.bottom),toolTop:Math.round(strip.top),
        toolBottom:Math.round(strip.bottom),cardTop:Math.round(card.top),
        trayTop:Math.round(tray.top),stageBottom:Math.round(stage.bottom),
        cardHeight:Math.round(card.height),cardScrollHeight:document.querySelector('.editor-tool-card:not([hidden])').scrollHeight,
        selectedToolVisible:chip.left>=strip.left-3&&chip.right<=strip.right+3,
        toolbarInside:fieldR.every(({b})=>b.left>=toolbar.left-3&&b.right<=toolbar.right+3&&b.top>=toolbar.top-3&&b.bottom<=toolbar.bottom+3),
        toolbarOutliers:fieldR.filter(({b})=>b.left<toolbar.left-3||b.right>toolbar.right+3||b.top<toolbar.top-3||b.bottom>toolbar.bottom+3).map(({name,b})=>({name,left:Math.round(b.left-toolbar.left),top:Math.round(b.top-toolbar.top),right:Math.round(b.right-toolbar.right),bottom:Math.round(b.bottom-toolbar.bottom)})),
        selectedStyle:document.querySelector('[name=family]').selectedOptions[0].textContent,
        toolbarHeight:Math.round(toolbar.height),failures,overlaps,
        categoryTextOverflow:categoryTextBox.width>dieBox.width+2,
        selectorCount:allControls.filter(visible).length,
      };
    })()`);
    console.log('BROWSER_ZOOM_LAYOUT',name,JSON.stringify(bounds));
    await captureUI(name+'-material');
    assert.equal(bounds.navPosition,'static','category navigation must not stick/overlap');
    assert.equal(bounds.categoryRows,1,'all six categories must occupy one row');
    assert.ok(bounds.categoryWithin,'category labels must remain inside navigation');
    assert.ok(bounds.categoryBottom<=bounds.toolTop+2,'categories may not cover tool navigation');
    assert.ok(bounds.toolBottom<=bounds.cardTop+2,'tool tabs may not overlap controls');
    assert.ok(bounds.stageBottom<=bounds.trayTop+2,'editing controls may not cover the wallpaper');
    assert.ok(bounds.cardHeight>=145,'active tool needs sufficient editing space');
    assert.ok(bounds.selectedToolVisible,'active tool name stays visible in the horizontal rail');
    assert.ok(bounds.toolbarInside,'top-level controls must stay inside their toolbar');
    assert.ok(bounds.selectorCount>=6,'Material tool controls must be present');
    assert.ok(await evaluate('!document.querySelector("[name=material2]").disabled && !document.querySelector(".add-texture-layer")'));
    await evaluate('document.getElementById("tab-material").click()');
    for(const n of [1,2,3]){
      await evaluate('document.querySelector("[data-editor-tool=finish'+n+']").click()');
      const rot=await evaluate('(()=>{const node=document.querySelector(".editor-tool-card:not([hidden]) .texture-rotation-field");const row=node.getBoundingClientRect(),input=node.querySelector("input[type=number]").getBoundingClientRect(),label=node.querySelector("span").getBoundingClientRect();return {row:{top:row.top,bottom:row.bottom},input:{top:input.top,bottom:input.bottom},label:{top:label.top,bottom:label.bottom}}})()');
      assert.ok(rot.input.top>=rot.row.top-2&&rot.input.bottom<=rot.row.bottom+2,
        'Rotation must fit on one line in Finish '+n+' at '+name+': '+JSON.stringify(rot));
      assert.ok(Math.abs((rot.label.top+rot.label.bottom)-(rot.input.top+rot.input.bottom))<12,
        'Rotation label and number must align in Finish '+n+' at '+name);
    }
    await evaluate('document.querySelector("[data-editor-tool=layer1]").click()');
    const noClippedTools=await evaluate(`(()=>{
      const problems=[];
      for(const tab of document.querySelectorAll('.settings-tab')){
        tab.click();
        for(const tool of document.querySelectorAll('.editor-tool-tab:not([hidden])')){
          tool.click();
          const card=document.querySelector('.editor-tool-card:not([hidden])');
          const frame=card.getBoundingClientRect();
          for(const el of card.querySelectorAll('input:not([type=hidden]),select,button')){
            if(!el.getClientRects().length||el.closest('[hidden]'))continue;
            const b=el.getBoundingClientRect();
            if(b.top<frame.top-2||b.bottom>frame.bottom+2||
               b.left<frame.left-2||b.right>frame.right+2)
              problems.push([tab.dataset.tab,tool.dataset.editorTool,el.name||el.id||el.textContent.trim()]);
          }
        }
      }
      return problems;
    })()`);
    assert.deepEqual(noClippedTools,[],
      'no tool may clip any control at '+name);
    const railPosition=await evaluate(`(()=>{
      const r=selector=>document.querySelector(selector).getBoundingClientRect();
      const frame=r('.wallpaper-frame');
      return {leftClear:r('.mobile-preview-rail-left').right<=frame.left+3,
        rightClear:r('.mobile-preview-rail-right').left>=frame.right-3,
        frameHeight:frame.height};
    })()`);
    assert.ok(railPosition.leftClear&&railPosition.rightClear,
      'preview controls must not cover the rainbow at '+name);
    assert.ok(railPosition.frameHeight>200);
    assert.deepEqual(bounds.failures,[],'every active control must fit inside its card');
    assert.deepEqual(bounds.overlaps,[],'dice and locks must never overlap');
    assert.ok(!bounds.categoryTextOverflow,'Category icon text must never overflow its button');
    for(const category of ['path','stripes','colour','layout','effects']){
      await evaluate('document.getElementById("tab-'+category+'").click()');
      const fit=await evaluate(`(()=>{
        const nav=document.querySelector('.settings-tabs').getBoundingClientRect();
        const strip=document.querySelector('.editor-tool-chooser').getBoundingClientRect();
        const card=document.querySelector('.editor-tool-card:not([hidden])').getBoundingClientRect();
        return nav.bottom<=strip.top+2&&strip.bottom<=card.top+2;
      })()`);
      assert.ok(fit,'category '+category+' must not overlap at '+name);
    }
  }
  // No extra add/remove buttons: selecting Smooth turns off a layer while
  // keeping its card available. Layer 3 works the same way.
  await evaluate('(()=>{const el=document.querySelector("[name=material2]");el.value="none";el.dispatchEvent(new Event("change",{bubbles:true}))})()');
  await waitFor('document.getElementById("textureLayer2Enabled").checked===false');
  await evaluate('(()=>{const el=document.querySelector("[name=material3]");el.value="foil";el.dispatchEvent(new Event("change",{bubbles:true}))})()');
  await waitFor('document.getElementById("textureLayer3Enabled").checked===true');
  assert.ok(await evaluate('document.getElementById("textureLayer2Enabled").checked===false'),
    'layer 3 must activate without forcing layer 2 on');
  await evaluate('(()=>{const el=document.querySelector("[name=material3]");el.value="none";el.dispatchEvent(new Event("change",{bubbles:true}))})()');
  await waitFor('document.getElementById("textureLayer3Enabled").checked===false');
  assert.ok(await evaluate('document.getElementById("textureLayer2Panel").hidden===false'));
  assert.ok(await evaluate('document.getElementById("textureLayer3Panel").hidden===false'));
  assert.ok(await evaluate('!document.getElementById("addTextureLayer2")&&!document.getElementById("removeTextureLayer2")'));
  await checkEditorZoom(412,915,'100-percent');
  for(const [category,tool] of [['path','geometry'],['stripes','structure'],['effects','lighting']]){
    await evaluate('document.getElementById("tab-'+category+'").click()');
    await evaluate('document.querySelector("[data-editor-tool='+tool+']").click()');
    await captureUI('100-percent-'+category+'-'+tool);
  }
  await checkEditorZoom(615,1365,'67-percent');
  for(const [category,tool] of [['path','geometry'],['stripes','structure'],['effects','lighting']]){
    await evaluate('document.getElementById("tab-'+category+'").click()');
    await evaluate('document.querySelector("[data-editor-tool='+tool+']").click()');
    await captureUI('67-percent-'+category+'-'+tool);
  }
  await command('Emulation.setDeviceMetricsOverride',{
    width:412,height:915,deviceScaleFactor:1,mobile:true,
    screenWidth:412,screenHeight:915,
  });
  console.log('BROWSER_ZOOM_LAYOUT_ACCEPTANCE_SUCCESS');
  // Render actual ink, not merely normalized parameters, to ensure each
  // Outline slider changes pixels independently on a fixed wallpaper.
  const outlinePixels=await evaluate(`(async()=>{
    const {drawWallpaper}=await import('/src/renderer.js');
    const base={seed:'outline-controls-test',family:'studio',
      background:'black',geometry:'straight',orientation:'vertical',
      composition:'single',construction:'ribbon',motif:'solid',
      material:'none',textureDisplacement:0,chaos:0,individuality:0,
      stripeWidth:68,spread:60,glow:0};
    const render=(outline,gap,outlineBuffer)=>{
      const c=document.createElement('canvas');c.width=230;c.height=500;
      drawWallpaper(c,{...base,outline,gap,outlineBuffer});
      return c.getContext('2d').getImageData(0,0,c.width,c.height).data;
    };
    const differences=(a,b)=>{
      let n=0;for(let i=0;i<a.length;i+=4)
        if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>24)n++;
      return n;
    };
    return ['white','black','one-side'].map(outline=>{
      const first=render(outline,18,0);
      const thick=render(outline,88,0);
      const buffered=render(outline,18,75);
      return {outline,thickness:differences(first,thick),
        buffer:differences(first,buffered)};
    });
  })()`);
  console.log('OUTLINE_PIXEL_DIFFERENCES',JSON.stringify(outlinePixels));
  for(const result of outlinePixels){
    assert.ok(result.thickness>40,'Outline thickness must affect rendered pixels: '+result.outline);
    assert.ok(result.buffer>40,'Outline buffer must affect rendered pixels: '+result.outline);
  }

  // Keep the existing single-checkpoint Undo and complete full-res export.
  await evaluate('document.getElementById("undo").click()');
  await waitFor('document.querySelector(".studio-stage").getBoundingClientRect().bottom<=document.querySelector(".sidebar").getBoundingClientRect().top+2',3000);
  // Desktop reuses identical form controls; no duplicated settings or hidden panel.
  await command('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false,screenWidth:1280,screenHeight:900});
  await waitFor('!document.body.classList.contains("mobile-studio")');
  assert.ok(await evaluate('document.querySelector("#panel-path [name=geometry]")!==null'));
  assert.ok(await evaluate('document.querySelectorAll(".editor-tool-card").length>=18'));
  const extremeDots=await evaluate(`(async()=>{
    const {drawWallpaper}=await import('/src/renderer.js');
    const canvas=document.createElement('canvas');canvas.width=360;canvas.height=780;
    drawWallpaper(canvas,{seed:'extreme-visible-dots',geometry:'straight',
      orientation:'vertical',motif:'dots',construction:'ribbon',outline:'none',
      material:'none',chaos:0,stripeWidth:65,spread:60,
      dotSize:100,dotSpacing:0,motifSize:100,motifFrequency:20});
    const {data}=canvas.getContext('2d').getImageData(0,0,360,780);
    let chromatic=0;
    for(let p=0;p<data.length;p+=4){
      if(Math.max(data[p],data[p+1],data[p+2])-
          Math.min(data[p],data[p+1],data[p+2])>55)chromatic++;
    }
    return chromatic/(360*780);
  })()`);
  console.log('EXTREME_DOT_MOTIF_CHROMATIC_COVERAGE',extremeDots);
  assert.ok(extremeDots>.035,'large dot motifs must remain coloured rather than vanish');
  const strokeAssist=await evaluate(`(async()=>{
    const {finishDrawnPath}=await import('/src/drawn-path.js');
    const slider=document.getElementById('drawSmoothingStrength');
    slider.value='10';slider.dispatchEvent(new Event('input',{bubbles:true}));
    const raw=Array.from({length:130},(_,i)=>{
      const t=i/129;
      return [.11+.78*t,.47+.006*Math.sin(i*.85)];
    });
    const straight=finishDrawnPath(raw,'smooth',10);
    const ys=straight.map(p=>p[1]);
    return {max:slider.max,label:document.getElementById('drawSmoothingValue').textContent,
      result:straight.length,axisError:Math.max(...ys)-Math.min(...ys)};
  })()`);
  assert.equal(strokeAssist.max,'10');
  assert.equal(strokeAssist.label,'10.0×');
  assert.ok(strokeAssist.result>20&&strokeAssist.axisError<.00002,
    'the live browser 10× implementation must recover a perfectly level stroke');
  console.log('TEN_X_DRAWING_ASSIST',JSON.stringify(strokeAssist));
  // Moving a setting between tools must move the original working control,
  // not a decorative duplicate that loses recipe, lock or disabled state.
  const constraintsPlacement=await evaluate(`(()=>{
    const select=document.querySelector('[name=crossingMode]');
    const coherence=document.querySelector('[name=geometrySafety]');
    const card=select?.closest('.editor-tool-card');
    return {category:card?.dataset.category,tool:card?.dataset.editorTool,
      sameCard:card===coherence?.closest('.editor-tool-card'),
      hasStatus:!!card?.querySelector('#geometrySafetyStatus'),
      hasOldTool:!!document.querySelector('[data-editor-tool=crossings]'),
      choices:[...select.options].filter(o=>!o.dataset.inactivePlaceholder).map(o=>o.value)};
  })()`);
  assert.deepEqual(constraintsPlacement,{category:'path',tool:'safety',
    sameCard:true,hasStatus:true,hasOldTool:false,choices:['over','under','weave']});
  // The original user-reported 96-point wallpaper, not an approximated loop.
  // Load the checked-in recipe through the page and exercise the production
  // raster compositor with its thin tonal strokes, max displacement and glow.
  const reportedKnot=await evaluate(`(async()=>{
    const recipe=await (await fetch('/tests/fixtures/drawn-knot-t0b4v5.json')).json();
    const {drawWallpaper}=await import('/src/renderer.js');
    const {resolveScene}=await import('/src/model.js');
    const canvas=document.createElement('canvas');
    canvas.width=240;canvas.height=520;
    drawWallpaper(canvas,recipe);
    const scene=resolveScene(recipe);
    const pixels=canvas.getContext('2d').getImageData(0,0,240,520).data;
    let ink=0;
    for(let i=0;i<pixels.length;i+=4){
      if(Math.max(pixels[i],pixels[i+1],pixels[i+2])>40)ink++;
    }
    return {points:recipe.customPath.length,seed:recipe.seed,ink,
      spread:scene.stripes.at(-1).center-scene.stripes[0].center,
      pngBytes:canvas.toDataURL().length};
  })()`);
  console.log('REPORTED_DRAWN_KNOT_RENDER',JSON.stringify(reportedKnot));
  assert.equal(reportedKnot.points,96);
  assert.equal(reportedKnot.seed,'t0b4v5-ice7lf');
  assert.ok(reportedKnot.spread<80,'reported tight knot needs inner-turn clearance');
  assert.ok(reportedKnot.ink>2000,'reported design must still draw a complete rainbow');
  // Tight-radius transverse crossings previously produced inner-ribbon shards
  // because crossing repairs replayed the entire self-overlapping source.
  // Exercise all depth orderings at a REAL 270° crossing. The >360°
  // coincident retracing case is separately verified by the fill-union test.
  const tightLoopReview=await evaluate(`(async()=>{
    const {drawWallpaper}=await import('/src/renderer.js');
    const base={seed:'crossing-tight-loop',geometry:'loop',loopSweep:270,
      loopRadius:11,geometrySafety:false,spread:88,stripeWidth:45,
      palette:'electric',material:'none',motif:'solid',orientation:'vertical',
      individuality:0,outline:'white'};
    const imgs=[];
    for(const crossingMode of ['over','under','weave']){
      const canvas=document.createElement('canvas');
      canvas.width=240;canvas.height=520;
      drawWallpaper(canvas,{...base,crossingMode});
      imgs.push(canvas.toDataURL());
    }
    return {distinct:new Set(imgs).size,bytes:imgs.map(s=>s.length)};
  })()`);
  assert.equal(tightLoopReview.distinct,3,'tight loop must keep three working crossing choices');
  console.log('TIGHT_LOOP_CROSSING_RENDER',JSON.stringify(tightLoopReview));
  // Browser renders must show three materially different occlusion choices,
  // for a loop and for a hand-drawn crossing. This uses the production canvas
  // renderer, not a mock algorithm or a test-only drawing shortcut.
  const crossingReview=await evaluate(`(async()=>{
    const {drawWallpaper}=await import('/src/renderer.js');
    const {findPathCrossings}=await import('/src/crossing-order.js');
    const {resolveScene}=await import('/src/model.js');
    const {samplePath}=await import('/src/path-geometry.js');
    const contour=Array.from({length:170},(_,i)=>{
      const t=-Math.PI/2+2*Math.PI*i/169;
      return [.5+.34*Math.sin(t),.49+.24*Math.sin(2*t)];
    });
    const cases=[
      {seed:'crossing-loop',geometry:'loop',loopSweep:270,loopRadius:85,
       geometrySafety:false,orientation:'vertical',spread:65},
      {seed:'crossing-drawn',geometry:'drawn',customPath:contour,
       geometrySafety:false,spread:65}
    ];
    const results=[];
    for(const base of cases){
      const scene=resolveScene({...base,crossingMode:'over'});
      const crossings=findPathCrossings(scene.stripes[3],scene.extent,samplePath);
      const images=[];
      for(const crossingMode of ['over','under','weave']){
        const canvas=document.createElement('canvas');
        canvas.width=240;canvas.height=520;
        drawWallpaper(canvas,{...base,crossingMode,palette:'electric',
          material:'none',lightingMood:'off',construction:'ribbon',
          motif:'solid',stripeWidth:75,individuality:0,outline:'white',
          stripeShadowStrength:0,textureDisplacement:0,brushRoughness:0});
        images.push(canvas.toDataURL());
      }
      results.push({geometry:base.geometry,crossings:crossings.length,
        overUnder:images[0]!==images[1],overWeave:images[0]!==images[2],
        underWeave:images[1]!==images[2]});
    }
    return results;
  })()`);
  console.log('CROSSING_ORDER_RENDER_ACCEPTANCE',JSON.stringify(crossingReview));
  for(const item of crossingReview){
    assert.ok(item.crossings>0,item.geometry+' should have a real centreline crossing');
    assert.ok(item.overUnder,item.geometry+' Over and Under must render differently');
    assert.ok(item.overWeave&&item.underWeave,item.geometry+' Weave must be visibly distinct');
  }
  // E2E: edit a saved drawn stroke on the phone canvas using physical pointer
  // events, verify the recipe records a manual anchor and that app Undo works.
  const editableRecipe=JSON.parse(readFileSync(join(cwd,'tests/fixtures/drawn-knot-t0b4v5.json'),'utf8'));
  await command('Page.navigate',{url:url+'?r='+encodeURIComponent(JSON.stringify(editableRecipe))});
  await waitFor('document.readyState==="complete"&&document.querySelector("#drawPathToggle")',15000);
  await waitFor('document.querySelectorAll(".editor-tool-card").length>=18',15000);
  const pointEditorCheck=await evaluate(`(async()=>{
    const {createPointEditor}=await import('/src/path-point-editor.js');
    const recipe=JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('r')));
    const before=JSON.stringify(recipe.customPath);
    const button=document.getElementById('drawPathToggle');
    button.click();
    document.getElementById('drawEditPoints').click();
    const overlay=document.getElementById('drawOverlay');
    const model=createPointEditor(recipe.customPath);
    const index=model.anchors[Math.floor(model.anchors.length/2)];
    const point=model.points[index],frame=document.getElementById('preview').getBoundingClientRect();
    const zoom=Number(document.querySelector('.studio-stage').dataset.viewZoom)||1;
    const x=frame.left+(.5+(point[0]-.5)*zoom)*frame.width;
    const y=frame.top+(.5+(point[1]-.5)*zoom)*frame.height;
    const pointer=(name,clientX,clientY)=>overlay.dispatchEvent(new PointerEvent(name,{
      bubbles:true,cancelable:true,pointerId:42,isPrimary:true,pointerType:'touch',
      clientX,clientY,buttons:name==='pointerup'?0:1
    }));
    pointer('pointerdown',x,y);
    pointer('pointermove',x+13,y-9);
    pointer('pointerup',x+13,y-9);
    const undoAvailable=!document.getElementById('drawUndoPoint').disabled;
    document.getElementById('drawCornerPoint').click();
    document.getElementById('drawApply').click();
    const next=JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('r')));
    const changed=JSON.stringify(next.customPath)!==before;
    const pinned=next.drawnAnchors.length;
    const corners=next.drawnCorners.length;
    document.getElementById('undo').click();
    const restored=JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('r')));
    return {changed,pinned,corners,undoAvailable,restored:JSON.stringify(restored.customPath)===before};
  })()`);
  console.log('LIVE_ANCHOR_EDITOR_ACCEPTANCE',JSON.stringify(pointEditorCheck));
  assert.ok(pointEditorCheck.changed&&pointEditorCheck.pinned>0&&pointEditorCheck.corners>0,
    'dragging a point must modify and pin the selected anchor');
  assert.ok(pointEditorCheck.undoAvailable&&pointEditorCheck.restored,
    'local Undo and wallpaper Undo must both remain usable');
  const fineRotations=await evaluate(`(()=>{
    const selectors=['textureRotation','textureRotation2','textureRotation3'];
    const controls=selectors.map(key=>{
      const field=document.querySelector('[name='+key+']');
      const row=field.closest('.rotation-controls');
      const buttons=[...row.querySelectorAll('[data-rotate-target]')];
      return {key,minus:buttons.some(b=>b.dataset.rotateDelta==='-1'),
        plus:buttons.some(b=>b.dataset.rotateDelta==='1'),
        quarterTurns:buttons.filter(b=>Math.abs(Number(b.dataset.rotateDelta))===90).length,
        reset:buttons.some(b=>b.dataset.rotateSet==='0')};
    });
    const texture=document.querySelector('[name=material]');
    texture.value='construction';texture.dispatchEvent(new Event('change',{bubbles:true}));
    const rotation=document.querySelector('[name=textureRotation]');
    const initial=Number(rotation.value);
    const up=document.querySelector('[data-rotate-target=textureRotation][data-rotate-delta="1"]');
    if(!up.disabled)up.click();
    return {controls,incremented:Number(rotation.value)===initial+1};
  })()`);
  console.log('ROTATION_STEPPER_ACCEPTANCE',JSON.stringify(fineRotations));
  assert.ok(fineRotations.incremented,'rotation step must update the actual recipe field');
  assert.ok(fineRotations.controls.every(v=>v.minus&&v.plus&&v.quarterTurns===2&&v.reset));
  // E2E: a phone-uploaded raster image becomes an editable candidate and a
  // regenerable recipe, never a retained image or an unundoable replacement.
  const imageImport=await evaluate(`(async()=>{
    const original=new URLSearchParams(location.search).get('r');
    const art=document.createElement('canvas');art.width=160;art.height=240;
    const ctx=art.getContext('2d');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,160,240);
    ctx.strokeStyle='#131722';ctx.lineWidth=8;
    ctx.beginPath();ctx.moveTo(25,35);ctx.lineTo(135,180);ctx.stroke();
    const blob=await new Promise(ok=>art.toBlob(ok,'image/png'));
    const dt=new DataTransfer();dt.items.add(new File([blob],'diagonal.png',{type:'image/png'}));
    const file=document.getElementById('imagePathFile');file.files=dt.files;
    file.dispatchEvent(new Event('change',{bubbles:true}));
    return {original,buttonVisible:document.getElementById('importPathToggle')
      .getBoundingClientRect().width>0};
  })()`);
  await waitFor('document.getElementById("imagePathDialog").open && document.getElementById("imagePathCandidate").options.length>0',15000);
  const imageCandidates=await evaluate(`(()=>{
    const select=document.getElementById('imagePathCandidate');
    const labels=[...select.options].map(o=>o.textContent);
    const line=[...select.options].find(o=>o.textContent.includes('Line '));
    if(line){select.value=line.value;select.dispatchEvent(new Event('change',{bubbles:true}));}
    document.getElementById('imagePathApply').click();
    const live=document.getElementById('drawOverlay');
    const ready=!live.hidden&&!document.getElementById('drawApply').disabled;
    if(ready)document.getElementById('drawApply').click();
    const recipe=JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('r')));
    return {labels,ready,closed:!document.getElementById('imagePathDialog').open,
      geometry:recipe.geometry,pathPoints:recipe.customPath.length,
      imageEmbedded:JSON.stringify(recipe).includes('diagonal.png')};
  })()`);
  console.log('IMAGE_IMPORT_PHONE_ACCEPTANCE',JSON.stringify({imageImport,imageCandidates}));
  assert.ok(imageImport.buttonVisible);
  assert.ok(imageCandidates.ready&&imageCandidates.closed);
  assert.ok(imageCandidates.labels.some(v=>v.includes('Line ')));
  assert.equal(imageCandidates.geometry,'drawn');
  assert.ok(imageCandidates.pathPoints>=20&&!imageCandidates.imageEmbedded);
  await evaluate('document.getElementById("undo").click()');
  // No file import should poison future generation or the original undo stack.
  assert.equal(await evaluate('new URLSearchParams(location.search).get("r")'),
    imageImport.original,'Undo must restore the prior complete design');
  // Applying the detected orientation should be exact even though the
  // generator chooses its initial diagonal angle from the wallpaper seed.
  await evaluate(`(async()=>{
    const c=document.createElement('canvas');c.width=160;c.height=240;
    const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,160,240);
    ctx.strokeStyle='#111';ctx.lineWidth=8;
    ctx.beginPath();ctx.moveTo(25,35);ctx.lineTo(135,180);ctx.stroke();
    const blob=await new Promise(ok=>c.toBlob(ok,'image/png'));
    const dt=new DataTransfer();dt.items.add(new File([blob],'orientation.png',{type:'image/png'}));
    const file=document.getElementById('imagePathFile');file.files=dt.files;
    file.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await waitFor('document.getElementById("imagePathDialog").open && !document.getElementById("imagePathAngle").disabled || document.getElementById("imagePathDialog").open && document.getElementById("imagePathCandidate").options.length>1',15000);
  const appliedAngle=await evaluate(`(async()=>{
    const select=document.getElementById('imagePathCandidate');
    const line=[...select.options].find(o=>o.textContent.includes('Line '));
    if(!line)return {missingLine:true};
    select.value=line.value;select.dispatchEvent(new Event('change',{bubbles:true}));
    const expected=Number(line.textContent.match(/Line (\\d+)°/)[1]);
    const enabled=!document.getElementById('imagePathAngle').disabled;
    document.getElementById('imagePathAngle').click();
    const recipe=JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('r')));
    const {resolveScene}=await import('/src/model.js');
    const actual=((resolveScene(recipe).angle*180/Math.PI)%180+180)%180;
    return {expected,actual,enabled,dialogClosed:!document.getElementById('imagePathDialog').open,
      geometry:recipe.geometry,orientation:recipe.orientation};
  })()`);
  console.log('IMAGE_APPLY_ANGLE_ACCEPTANCE',JSON.stringify(appliedAngle));
  assert.ok(appliedAngle.enabled&&appliedAngle.dialogClosed);
  assert.equal(appliedAngle.geometry,'straight');
  assert.equal(appliedAngle.orientation,'diagonal');
  assert.ok(Math.abs(appliedAngle.actual-appliedAngle.expected)<.3,
    'detected orientation must compensate for the seed-resolved base angle');
  await evaluate('document.getElementById("undo").click()');
  assert.equal(await evaluate('new URLSearchParams(location.search).get("r")'),
    imageImport.original,'angle application should also be undoable');
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
