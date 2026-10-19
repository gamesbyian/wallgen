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
  await waitFor('document.querySelectorAll(".settings-tab").length===7',15000);
  await waitFor('document.body.classList.contains("mobile-five-nav")&&document.querySelectorAll("#mobileActionDock>button").length===5',15000);
  await delay(300);
  // Actual Chromium media emulation: notifications and disabled/locked affordance
  // changes must not animate when the OS asks for reduced motion.
  await command('Emulation.setEmulatedMedia',{
    features:[{name:'prefers-reduced-motion',value:'reduce'}]
  });
  const reducedMotion=await evaluate(`(()=>{
    const toast=getComputedStyle(document.getElementById('studioStatus'));
    const lock=getComputedStyle(document.querySelector('.setting-lock'));
    return {scroll:getComputedStyle(document.documentElement).scrollBehavior,
      toast:toast.transitionDuration,lock:lock.transitionDuration,
      media:matchMedia('(prefers-reduced-motion: reduce)').matches};
  })()`);
  assert.deepEqual(reducedMotion,{scroll:'auto',toast:'0s',lock:'0s',media:true},
    'reduced-motion preference must remove scrolling, toast and lock transitions');
  await command('Emulation.setEmulatedMedia',{
    features:[{name:'prefers-reduced-motion',value:'no-preference'}]
  });
  const normalMotion=await evaluate(`(()=>{
    const toast=getComputedStyle(document.getElementById('studioStatus'));
    const lock=getComputedStyle(document.querySelector('.setting-lock'));
    return {scroll:getComputedStyle(document.documentElement).scrollBehavior,
      toast:toast.transitionDuration,lock:lock.transitionDuration,
      media:matchMedia('(prefers-reduced-motion: reduce)').matches};
  })()`);
  assert.ok(normalMotion.scroll==='smooth'&&!normalMotion.media&&
    normalMotion.toast!=='0s'&&normalMotion.lock!=='0s',
    'non-reduced UI keeps intentional short feedback transitions');
  console.log('MOBILE_REDUCED_MOTION_CONTRACT',JSON.stringify({reducedMotion,normalMotion}));
  // Inspect the real accessible control semantics, independently of the
  // screenshot atlas and independently of visible icon shape.
  const mobileSemantics=await evaluate(`(()=>{
    const ids=['mobileStudio','mobileEdit','mobileExplore','mobileSaved',
      'mobileShuffle','mobileFavorite','mobileDownload','mobileMore',
      'mobileDockExpand','mobileDismissHandle','drawPathToggle','importPathToggle'];
    const records=ids.map(id=>{
      const el=document.getElementById(id);
      return {id,tag:el?.tagName,label:el?.getAttribute('aria-label')||
        el?.innerText?.trim()||'',disabled:el?.disabled||false,
        ariaControls:el?.getAttribute('aria-controls')||null,
        ariaExpanded:el?.getAttribute('aria-expanded')||null,
        targetExists:el?.getAttribute('aria-controls')?
          !!document.getElementById(el.getAttribute('aria-controls')):true};
    });
    const themes=[...document.querySelectorAll('[data-studio-theme]')].map(el=>({
      theme:el.dataset.studioTheme,label:el.getAttribute('aria-label'),
      pressed:el.getAttribute('aria-pressed'),type:el.getAttribute('type')}));
    return {records,themes};
  })()`);
  assert.equal(mobileSemantics.records.length,12);
  assert.deepEqual(mobileSemantics.records.filter(x=>x.tag!=='BUTTON'||!x.label||
    !x.targetExists),[],'Mobile actions must be named native buttons with valid targets');
  assert.equal(mobileSemantics.themes.length,2);
  assert.deepEqual(mobileSemantics.themes.map(x=>x.theme).sort(),['cream','dark']);
  assert.ok(mobileSemantics.themes.every(x=>x.label&&x.type==='button'&&
    ['true','false'].includes(x.pressed)));
  const declaredExpansions=mobileSemantics.records.filter(x=>x.ariaExpanded!==null);
  assert.ok(declaredExpansions.length>=3);
  assert.ok(declaredExpansions.every(x=>x.ariaControls&&
    ['true','false'].includes(x.ariaExpanded)));
  console.log('MOBILE_ACCESSIBLE_ACTION_CENSUS',JSON.stringify(mobileSemantics));
  // Saved and Explore share the grid but must never share navigation mode.
  // On an empty fresh profile, Saved has its own heading and empty copy;
  // returning via Explore restores the independent exploration view.
  const galleryModes=await evaluate(`(()=>{
    const emptyVisual=()=>{
      const grid=document.getElementById('gallery');
      const placeholder=grid.querySelector('.gallery-placeholder');
      const mark=placeholder?.querySelector('.gallery-empty-ribbon');
      const ribbons=[...mark?.querySelectorAll('i')||[]];
      const rect=placeholder?.getBoundingClientRect();
      return {count:ribbons.length,
        distinct:new Set(ribbons.map(el=>getComputedStyle(el).backgroundColor)).size,
        ariaHidden:mark?.getAttribute('aria-hidden'),
        sourceActionCount:placeholder?.querySelectorAll('button,a,input').length||0,
        fits:!!rect&&rect.left>=-1&&rect.right<=innerWidth+1};
    };
    document.getElementById('showFavorites').click();
    const saved={
      mode:document.getElementById('gallery').dataset.view,
      heading:document.getElementById('galleryTitle').textContent,
      empty:document.querySelector('#gallery .gallery-placeholder')?.textContent,
      visual:emptyVisual()
    };
    document.getElementById('mobileExplore').click();
    const explore={
      mode:document.getElementById('gallery').dataset.view,
      heading:document.getElementById('galleryTitle').textContent,
      empty:document.querySelector('#gallery .gallery-placeholder')?.textContent,
      visual:emptyVisual(),
      open:document.body.classList.contains('mobile-gallery-open')
    };
    document.getElementById('mobileExplore').click();
    return {saved,explore};
  })()`);
  assert.equal(galleryModes.saved.mode,'saved');
  assert.equal(galleryModes.saved.heading,'Saved wallpapers');
  assert.ok(galleryModes.saved.empty?.includes('Nothing saved yet'));
  for(const item of [galleryModes.saved,galleryModes.explore]){
    assert.equal(item.visual.count,7,'empty gallery contains seven flat decorative ribbons');
    assert.equal(item.visual.distinct,7,'all seven rainbow colours must be distinct');
    assert.equal(item.visual.ariaHidden,'true','illustration must not add screen-reader noise');
    assert.equal(item.visual.sourceActionCount,0,'empty illustration must not create fake controls');
    assert.ok(item.visual.fits,'empty gallery decoration stays within visible mobile viewport');
  }
  assert.equal(galleryModes.explore.mode,'explore');
  assert.equal(galleryModes.explore.heading,'Explore variations');
  assert.ok(galleryModes.explore.empty?.includes('Generate twelve'));
  assert.ok(galleryModes.explore.open);


  const atlasUI=await evaluate(`(()=>{
    const cream=document.querySelector('[data-studio-theme=cream]');
    const dark=document.querySelector('[data-studio-theme=dark]');
    dark.click();
    const darkSelected=document.documentElement.dataset.theme==='dark'&&
      dark.getAttribute('aria-pressed')==='true';
    cream.click();
    const creamSelected=document.documentElement.dataset.theme==='cream'&&
      cream.getAttribute('aria-pressed')==='true';
    const flatCreamStage=getComputedStyle(document.querySelector('.studio-stage')).backgroundImage==='none';
    const flatLightingAndShadow=['.lighting-subsection','.lighting-icon','.stripe-shadow-section']
      .every(selector=>{
        const element=document.querySelector(selector);
        return element&&getComputedStyle(element).backgroundImage==='none';
      });
    const colours=[];
    for(const card of document.querySelectorAll('.editor-tool-card')){
      const bars=[...card.querySelectorAll('input[type=range]')];
      if(!bars.length)continue;
      const assigned=bars.map(e=>e.style.getPropertyValue('--roygbiv-slider-color'));
      colours.push({tool:card.dataset.editorTool,count:assigned.length,assigned,
        distinct:new Set(assigned).size===assigned.length});
    }
    const searchToggle=document.querySelector('.editor-search-toggle[aria-label="Find a setting"]');
    searchToggle.click();
    const input=document.querySelector('.editor-search-input');
    input.value='shadow';input.dispatchEvent(new Event('input',{bubbles:true}));
    const selected=document.querySelector('.editor-tool-tab[aria-pressed=true]');
    const rail=document.querySelector('.editor-tool-chooser').getBoundingClientRect();
    const chip=selected.getBoundingClientRect();
    const searchVisible=selected.dataset.editorTool==='shadows' &&
      chip.left>=rail.left-3&&chip.right<=rail.right+3;
    const close=document.querySelector('.editor-search-close');
    const closeVisible=close.getBoundingClientRect().width>15 && !close.hidden;
    close.click();
    const searchClosed=input.hidden&&close.hidden;
    document.getElementById('tab-layout').click();
    const history=document.getElementById('editorHistoryToggle');
    history.click();
    const historyOpen=!document.getElementById('editorHistory').hidden;
    document.querySelector('.editor-history-close').click();
    const historyClosed=document.getElementById('editorHistory').hidden;
    return {darkSelected,creamSelected,flatCreamStage,flatLightingAndShadow,searchVisible,closeVisible,searchClosed,
      historyOpen,historyClosed,colourPanels:colours.length,
      duplicatePanels:colours.filter(x=>!x.distinct)};
  })()`);
  console.log('UI_ATLAS_REGRESSION',JSON.stringify(atlasUI));
  for(const key of ['darkSelected','creamSelected','flatCreamStage','flatLightingAndShadow','searchVisible','closeVisible',
    'searchClosed','historyOpen','historyClosed'])assert.ok(atlasUI[key],key);
  assert.ok(atlasUI.colourPanels>=6,'multiple tool panels have rainbow sliders');
  assert.deepEqual(atlasUI.duplicatePanels,[],'a panel must never repeat a slider colour');

  // Native worker/DOM pixel parity. The worker paints the full production
  // scene; presentation reuses the same cached ink/background compositor as
  // the main-thread fast nudge path. Test clipping, lighting and materials.
  const workerParity=await evaluate(`(async()=>{
    const {drawWallpaper,presentNudgedArtwork}=await import('/src/renderer.js');
    const worker=new Worker('/src/render-worker.js',{type:'module'});
    const received=()=>new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>reject(Error('render worker timeout')),18000);
      worker.onmessage=event=>{
        clearTimeout(timeout);
        if(event.data.type==='error'||event.data.type==='unsupported')
          reject(Error(event.data.error));
        else resolve(event.data);
      };
      worker.onerror=event=>{clearTimeout(timeout);reject(Error(event.message));};
    });
    try{
      const initial=await received();
      if(initial.type!=='ready')throw Error('worker did not initialize');
      const fixtures=[
        {seed:'worker-loop',structure:'paths',geometry:'loop',material:'none',
          lightingMood:'studio',interiorElements:[{id:'accent',shape:'wave',width:1.5}]},
        {seed:'worker-pinwheel',structure:'radial',radialMode:'pinwheel',
          rayCount:14,material:'linen',textureStrength:62,viewZoom:.8,
          dividerColor:'black'},
        {seed:'worker-facets',structure:'regions',regionMode:'facets',
          regionCount:14,material:'none',dividerColor:'white',glow:15,
          interiorElements:[{id:'rings',placement:'contour',width:1.4}]}
      ];
      const results=[];
      for(let i=0;i<fixtures.length;i++){
        const recipe=fixtures[i];
        const reference=document.createElement('canvas');
        reference.width=180;reference.height=390;
        drawWallpaper(reference,recipe);
        worker.postMessage({type:'preview',id:i+1,key:'fixture-'+i,
          width:180,height:390,recipe});
        const response=await received();
        if(response.type!=='frame')throw Error('missing preview frame');
        const output=document.createElement('canvas');
        output.width=180;output.height=390;
        presentNudgedArtwork(output,{
          ink:response.ink,background:response.background,
          overhang:response.overhang
        },recipe);
        const a=reference.getContext('2d').getImageData(0,0,180,390).data;
        const b=output.getContext('2d').getImageData(0,0,180,390).data;
        let differing=0,maxError=0;
        for(let k=0;k<a.length;k++){
          const difference=Math.abs(a[k]-b[k]);
          if(difference>4)differing++;
          if(difference>maxError)maxError=difference;
        }
        response.ink.close();response.background.close();
        results.push({structure:recipe.structure,differing,maxError});
      }
      worker.postMessage({type:'export',id:99,width:180,height:390,
        recipe:fixtures[1]});
      const exported=await received();
      if(exported.type!=='exported'||!exported.blob?.size)
        throw Error('worker PNG export failed');
      const image=await createImageBitmap(exported.blob);
      const png={width:image.width,height:image.height,
        bytes:exported.blob.size};
      image.close();
      return {results,png};
    }finally{worker.terminate();}
  })()`);
  console.log('WORKER_CANVAS_PARITY',JSON.stringify(workerParity));
  assert.ok(workerParity.results.every(r=>r.differing<=100&&r.maxError<=24),
    'OffscreenCanvas must match reference within tight subpixel antialiasing tolerance: '+
    JSON.stringify(workerParity.results));
  assert.equal(workerParity.png.width,180);
  assert.equal(workerParity.png.height,390);
  assert.ok(workerParity.png.bytes>1000);

  // A camera change must reveal a different world rectangle, NOT reroll
  // ribbon widths, motif placements, woven threads or interior phase.
  // Compare identical logical points sampled at 100% and 50% zoom; skip
  // antialiased edges, whose pixel footprints differ between resolutions.
  const cameraZoomParity=await evaluate(`(async()=>{
    const {drawWallpaper}=await import('/src/renderer.js');
    const make=()=>{const canvas=document.createElement('canvas');
      canvas.width=240;canvas.height=520;return canvas;};
    const cases=[
      {seed:'zoom-geometry-proof',structure:'paths',geometry:'zigzag',
        motif:'solid',material:'none',taper:75,spread:65,stripeWidth:66,
        shapeDepth:76},
      {seed:'zoom-dots-proof',structure:'paths',geometry:'straight',
        motif:'dots',material:'none',taper:60,spread:65,stripeWidth:66,
        dotSize:85,dotSpacing:55,motifFrequency:60},
      {seed:'zoom-brush-proof',structure:'paths',geometry:'arc',
        motif:'solid',material:'none',taper:62,spread:65,stripeWidth:67,
        brushRoughness:100},
      {seed:'zoom-woven-proof',structure:'paths',geometry:'straight',
        orientation:'horizontal',palette:'electric',family:'studio',
        motif:'solid',construction:'woven',material:'none',
        taper:50,spread:27,stripeWidth:87},
      {seed:'zoom-decoration-proof',structure:'paths',geometry:'straight',
        orientation:'horizontal',palette:'electric',family:'studio',
        motif:'solid',material:'none',taper:55,spread:34,stripeWidth:92,
        interiorElements:[{id:'zoom-ink',enabled:true,shape:'wave',
          placement:'local',type:'line',stroke:'solid',color:'white',
          width:9,frequency:8,amplitude:.35,position:0,phase:30,opacity:1}]}
    ];
    const results=[];
    for(const recipe of cases){
      const close=make(),wide=make();
      drawWallpaper(close,{...recipe,viewZoom:1});
      drawWallpaper(wide,{...recipe,viewZoom:.5});
      const a=close.getContext('2d').getImageData(0,0,240,520).data;
      const b=wide.getContext('2d').getImageData(0,0,240,520).data;
      const colour=(data,x,y)=>Array.from(data.slice((y*240+x)*4,(y*240+x)*4+3));
      const uniform=(data,x,y)=>{
        const base=colour(data,x,y);
        for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){
          const other=colour(data,x+dx,y+dy);
          if(base.some((value,i)=>Math.abs(value-other[i])>12))return false;
        }
        return true;
      };
      let examined=0,changed=0,ink=0;
      for(let y=132;y<388;y+=3)for(let x=62;x<178;x+=3){
        const ax=2*x-120,ay=2*y-260;
        if(!uniform(a,ax,ay)||!uniform(b,x,y))continue;
        const ca=colour(a,ax,ay),cb=colour(b,x,y);
        examined++;
        if(ca.some((v,i)=>Math.abs(v-cb[i])>24))changed++;
        if(ca.some(v=>v>48))ink++;
      }
      results.push({geometry:recipe.geometry,examined,changed,ink,
        mismatchRatio:examined?changed/examined:1});
    }
    return results;
  })()`);
  console.log('CAMERA_ZOOM_RASTER_PARITY',JSON.stringify(cameraZoomParity));
  assert.ok(cameraZoomParity.every(r=>r.examined>300&&r.ink>100&&r.mismatchRatio<.065),
    'zoom must preserve colours and decoration at shared world points: '+
    JSON.stringify(cameraZoomParity));

  // A true viewport pan must preserve identical world-space pixels across
  // the source renderers. Compare translated points in *fresh* Canvas2D
  // paintings, not scaled screenshots or the cached nudge layer.
  const panWorldParity=await evaluate(`(async()=>{
    const {drawWallpaper}=await import('/src/renderer.js');
    const cases=[
      {seed:'pan-zigzag',structure:'paths',geometry:'zigzag',
        shapeDepth:66,shapeFrequency:58,stripeWidth:82,spread:72},
      {seed:'pan-dots',structure:'paths',geometry:'wave',
        motif:'dots',dotSize:75,dotSpacing:45,stripeWidth:72,spread:68},
      {seed:'pan-radial',structure:'radial',radialMode:'pinwheel',
        rayCount:16,dividerColor:'black'},
      {seed:'pan-regions',structure:'regions',regionMode:'voronoi',
        regionCount:9,dividerColor:'black'}
    ];
    const colour=(data,x,y)=>[...data.slice((y*240+x)*4,(y*240+x)*4+3)];
    const diff=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
    const stable=(data,x,y)=>{
      const centre=colour(data,x,y);
      return [[-2,0],[2,0],[0,-2],[0,2]].every(([dx,dy])=>
        diff(centre,colour(data,x+dx,y+dy))<=8);
    };
    const casesResult=[];
    for(const caseRecipe of cases){
      const recipe={...caseRecipe,viewZoom:1,viewPanX:0,viewPanY:0,
        material:'none',lightingMood:'off',glow:0,brushRoughness:0};
      const make=()=>{const c=document.createElement('canvas');
        c.width=240;c.height=520;return c;};
      const baseline=make(),panned=make();
      drawWallpaper(baseline,recipe);
      drawWallpaper(panned,{...recipe,viewPanX:10,viewPanY:-10});
      const a=baseline.getContext('2d').getImageData(0,0,240,520).data;
      const b=panned.getContext('2d').getImageData(0,0,240,520).data;
      let stableCount=0,ink=0,mismatch=0;
      const examples=[];
      // 10% of 600/1300 source units at 240x520 equals exactly
      // 24px left and 52px down. Identical world points must match.
      for(let y=40;y<449;y+=4)for(let x=31;x<215;x+=4){
        const bx=x-24,by=y+52;
        if(!stable(a,x,y)||!stable(b,bx,by))continue;
        const ca=colour(a,x,y),cb=colour(b,bx,by);
        stableCount++;
        if(ca.some(v=>v>42))ink++;
        if(diff(ca,cb)>15){
          mismatch++;
          if(examples.length<5)examples.push({x,y,ca,cb});
        }
      }
      casesResult.push({structure:caseRecipe.structure,geometry:caseRecipe.geometry||
        caseRecipe.radialMode||caseRecipe.regionMode,
        stable:stableCount,ink,mismatch,
        ratio:stableCount?mismatch/stableCount:1,examples});
    }
    return casesResult;
  })()`);
  console.log('CAMERA_PAN_WORLD_PIXEL_PARITY',JSON.stringify(panWorldParity));
  for(const result of panWorldParity){
    assert.ok(result.stable>200&&result.ink>80,
      'Pan parity needs actual artwork, not background-only evidence: '+
      JSON.stringify(result));
    assert.ok(result.ratio<.04,
      'Camera pan appears to regenerate or clip source world ink: '+
      JSON.stringify(result));
  }

  // Verify real mounted form nodes have semantic component roles, without
  // generating proxies that break locks, undo, disabled states or recipe data.
  const typedRows=await evaluate(`(()=>{
    const named=[...document.querySelectorAll('.editor-setting-row')];
    const keys=named.flatMap(row=>(row.dataset.controlKeys||'').split(' ').filter(Boolean));
    const missing=[...document.querySelectorAll('[data-setting]')].map(el=>el.dataset.setting)
      .filter(k=>!['primesOnly','family','textureLayer2Enabled','textureLayer3Enabled'].includes(k)&&
        !keys.includes(k));
    return {rows:named.length,keys:new Set(keys).size,missing,
      kinds:[...new Set(named.map(row=>row.dataset.controlKind))],
      originalFieldsPreserved:[...keys].every(k=>!!document.querySelector('[name="'+k+'"]'))};
  })()`);
  console.log('EDITOR_TYPED_ROW_CENSUS',JSON.stringify(typedRows));
  assert.ok(typedRows.rows>=70,'expected stable typed UI rows across all tool categories');
  assert.ok(typedRows.keys>=80,'not all canonical source fields assigned typed rows');
  assert.deepEqual(typedRows.missing,[],'a static editor setting lost its source row');
  assert.ok(typedRows.originalFieldsPreserved);
  const typedToggles=await evaluate(`(()=>{
    const keys=['reverseStripes','mirrorHorizontal','mirrorVertical'];
    return keys.map(key=>{
      const field=document.querySelector('[name="'+key+'"]');
      const root=field?.closest('.editor-setting-row');
      return {key,original:field?.type==='checkbox',
        kind:root?.dataset.controlKind,hasKey:root?.dataset.controlKeys?.split(' ').includes(key)};
    });
  })()`);
  assert.deepEqual(typedToggles.filter(x=>!x.original||x.kind!=='toggle'||!x.hasKey),[],
    'Existing reverse/mirror checkbox rows must retain their typed source controls');


    const realGlyphs=await evaluate(`(()=>{
    const icons=[
      ['#mobileEdit','edit-controls'],
      ['#drawPathToggle','draw-path'],
      ['#importPathToggle','import-path'],
      ['#download','export-png'],
      ['#mobileDownload','export-png'],
      ['[data-dock-proxy=mobileDownload]','export-png'],
      ['.mobile-fit-button','fit-canvas'],
    ];
    return icons.map(([selector,expected])=>({selector,expected,
      present:!!document.querySelector(selector+' [data-roygbiv-icon="'+expected+'"]')}));
  })()`);
  console.log('APPROVED_ICON_MAPPING',JSON.stringify(realGlyphs));
  assert.deepEqual(realGlyphs.filter(x=>!x.present),[],
    'Live controls must use the approved family SVG, not generic substitutes');

    // The phone rail's +/- buttons must change the camera, not the recipe.
  const beforeZoom=await evaluate(
    'JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r")))');
  const targetZoom=Math.round(Math.max(.5,beforeZoom.viewZoom-.1)*100)/100;
  assert.ok(targetZoom<beforeZoom.viewZoom,'initial phone zoom has outward room');
  await evaluate('document.querySelector(".mobile-zoom-button[data-zoom=out]").click()');
  await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).viewZoom==='+targetZoom);
  const afterZoom=await evaluate(
    'JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r")))');
  const zoomChanged=Object.keys(beforeZoom).filter(key=>
    JSON.stringify(beforeZoom[key])!==JSON.stringify(afterZoom[key]));
  assert.deepEqual(zoomChanged,['viewZoom'],
    'Zoom-out must never change generated wallpaper settings');
  await waitFor('document.getElementById("preview").dataset.renderPending!=="true"',20000);
  assert.equal(await evaluate('document.querySelector(".mobile-zoom-level").textContent'),
    Math.round(targetZoom*100)+'%');
  await evaluate('document.querySelector(".mobile-zoom-button[data-zoom=in]").click()');
  await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).viewZoom==='+beforeZoom.viewZoom);
  await waitFor('document.getElementById("preview").dataset.renderPending!=="true"',20000);
  const returnedZoom=await evaluate(
    'JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r")))');
  assert.deepEqual(returnedZoom,beforeZoom,
    'Zoom-in must restore exact recipe after camera-only zoom-out');
  // The side Fit action resets framing, and may not move the composition,
  // change generation controls, or hide off-canvas path continuation.
  await evaluate('document.querySelector(".mobile-zoom-button[data-zoom=out]").click()');
  await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).viewZoom==='+targetZoom);
  await evaluate('document.querySelector(".mobile-zoom-button[data-zoom=fit]").click()');
  await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).viewZoom===1');
  const fitted=await evaluate(
    'JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r")))');
  assert.deepEqual(fitted,beforeZoom,'Fit changed artwork instead of framing');
  assert.equal(await evaluate('document.querySelector(".mobile-fit-button").getAttribute("aria-label")'),
    'Fit entire wallpaper (100% framing)');
  assert.equal(await evaluate('document.querySelector(".mobile-fit-button").disabled'),true);
  // Move the CAMERA via its own controls in More. Never invoke data-nudge
  // or mutate the source composition position. The resulting frame is saved.
  await evaluate('document.getElementById("mobileMore").click()');
  await waitFor('document.body.classList.contains("mobile-tools-open")');
  const panUi=await evaluate(`(()=>{
    const area=document.querySelector('.mobile-more-group-body>.viewport-positioner');
    const buttons=[...area?.querySelectorAll('[data-view-pan]')||[]];
    return {inMore:!!area,actions:buttons.map(b=>b.dataset.viewPan),
      labels:buttons.map(b=>b.getAttribute('aria-label')),
      status:area?.querySelector('#viewPanStatus')?.textContent};
  })()`);
  assert.equal(panUi.inMore,true,'mobile Pan must be available in the real More sheet');
  assert.deepEqual(panUi.actions.sort(),['down','left','reset','right','up']);
  assert.ok(panUi.labels.every(Boolean),'viewport Pan actions must have accessible labels');
  assert.equal(panUi.status,'Centered frame');
  await evaluate('document.querySelector("[data-view-pan=right]").click()');
  await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).viewPanX===5');
  const rightPan=await evaluate(
    'JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r")))');
  assert.deepEqual(Object.keys(fitted).filter(key=>
    JSON.stringify(fitted[key])!==JSON.stringify(rightPan[key])),['viewPanX'],
    'Viewport pan must not move any composition or generation setting');
  assert.equal(rightPan.positionX,fitted.positionX);
  assert.equal(rightPan.positionY,fitted.positionY);
  assert.equal(await evaluate('document.querySelector(".mobile-fit-button").disabled'),false,
    'Fit must be available at 100% when the camera is off-center');
  await evaluate('document.querySelector(".mobile-zoom-button[data-zoom=fit]").click()');
  await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).viewPanX===0');
  const resetPan=await evaluate(
    'JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r")))');
  assert.deepEqual(resetPan,fitted,'Fit must restore the centered viewport without changing artwork');
  await evaluate('document.getElementById("mobileMore").click()');
  await waitFor('!document.body.classList.contains("mobile-tools-open")');
  console.log('INDEPENDENT_VIEWPORT_PAN',JSON.stringify({panUi,right:rightPan.viewPanX,reset:resetPan.viewPanX}));
  // Composition nudge remains its own handler and unchanged recipe field.

  await evaluate('document.querySelector("[data-nudge=right]").click()');
  await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).positionX==='+(fitted.positionX+1));
  const nudged=await evaluate(
    'JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r")))');
  assert.deepEqual(Object.keys(fitted).filter(key=>
    JSON.stringify(fitted[key])!==JSON.stringify(nudged[key])),['positionX'],
    'Nudge must change the saved composition position, not the camera');
  await evaluate('document.querySelector("[data-nudge=left]").click()');
  await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).positionX==='+fitted.positionX);
  assert.deepEqual(await evaluate(
    'JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r")))'),
    fitted,'Opposite composition nudge must restore the same saved recipe');



  // The actual application must use a worker after its deterministic initial
  // frame, and settle the correct recipe after rapid edits. A standalone
  // worker parity test alone would miss accidental main-thread fallback.
  await evaluate(`(()=>{
    window.__roygbivWorkerFrames=0;
    document.getElementById('preview').addEventListener('roygbiv-preview-presented',
      event=>{if(event.detail?.worker)window.__roygbivWorkerFrames++;});
    const select=document.querySelector('[name=background]');
    select.value='white';select.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await waitFor('window.__roygbivWorkerFrames>0 && document.getElementById("preview").dataset.renderPending!=="true"',20000);
  await evaluate(`(()=>{
    const select=document.querySelector('[name=background]');
    select.value='black';select.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await waitFor('document.getElementById("preview").dataset.renderPending!=="true"',20000);
  console.log('WORKER_APPLICATION_PREVIEW_READY');

  // Real Chromium raster acceptance: inset contours alter native painted pixels
  // in both regional and radial structures, including a zoomed-out camera.
  const insetRaster=await evaluate(`(async()=>{
    const {drawWallpaper}=await import('/src/renderer.js');
    const modes=[
      {structure:'regions',regionMode:'voronoi',regionCount:7,viewZoom:1},
      {structure:'radial',radialMode:'pinwheel',rayCount:7,viewZoom:.65}
    ];
    const results=[];
    for(const mode of modes){
      const canvas=document.createElement('canvas');
      canvas.width=180;canvas.height=390;
      const plain=()=>drawWallpaper(canvas,{seed:'browser-metric-offset',...mode,
        dividerColor:'none',interiorElements:[]});
      plain();
      const baseline=canvas.getContext('2d').getImageData(0,0,180,390).data.slice();
      drawWallpaper(canvas,{seed:'browser-metric-offset',...mode,
        dividerColor:'none',interiorElements:[{id:'offset',placement:'contour',
          shape:'straight',stroke:'solid',color:'white',width:2}]});
      const painted=canvas.getContext('2d').getImageData(0,0,180,390).data;
      let differing=0;
      for(let i=0;i<painted.length;i+=4)
        if(Math.abs(painted[i]-baseline[i])+Math.abs(painted[i+1]-baseline[i+1])+
          Math.abs(painted[i+2]-baseline[i+2])>20)differing++;
      results.push({structure:mode.structure,differing});
    }
    return results;
  })()`);
  assert.ok(insetRaster.every(x=>x.differing>30),
    'true polygon contour offsets must visibly draw in radial and regional scenes: '+JSON.stringify(insetRaster));
  const contourStyles=await evaluate(`(async()=>{
    const {drawWallpaper}=await import('/src/renderer.js');
    const canvas=document.createElement('canvas');
    canvas.width=300;canvas.height=650;
    const recipe={seed:'metric-inset-styled-art',structure:'regions',regionMode:'facets',
      regionCount:14,viewZoom:.7,dividerColor:'none',material:'none'};
    const pixels=shape=>{
      drawWallpaper(canvas,{...recipe,interiorElements:[{id:'geometry-style',
        placement:'contour',shape,stroke:'solid',color:'white',width:2.5,
        amplitude:.45,frequency:7,opacity:1}]});
      return canvas.getContext('2d').getImageData(0,0,300,650).data.slice();
    };
    const baseline=pixels('straight');
    const results=[];
    for(const shape of ['wave','zigzag','loop']){
      const actual=pixels(shape);
      let changed=0;
      for(let k=0;k<actual.length;k+=4){
        if(Math.abs(actual[k]-baseline[k])+Math.abs(actual[k+1]-baseline[k+1])+
          Math.abs(actual[k+2]-baseline[k+2])>28)changed++;
      }
      results.push({shape,changed});
    }
    return results;
  })()`);
  assert.ok(contourStyles.every(s=>s.changed>45),
    'all selectable contour geometries must change real painted pixels: '+JSON.stringify(contourStyles));
  // Many coloured objects with repeated interior patterns must remain
  // interactive, rather than tessellating an enormous invisible ray field.
  const renderStress=await evaluate(`(async()=>{
    const {drawWallpaper}=await import('/src/renderer.js');
    const canvas=document.createElement('canvas');canvas.width=240;canvas.height=520;
    const elements=Array.from({length:4},(_,i)=>({
      id:'perf-'+i,placement:i%2?'field':'local',
      type:'line',shape:i%2?'wave':'zigzag',stroke:'dotted',
      color:'white',width:2.2,frequency:9,amplitude:.2,phase:i*17
    }));
    const measurements=[];
    for(const mode of [
      {structure:'radial',radialMode:'sunburst',rayCount:70,rayCoverage:100},
      {structure:'regions',regionMode:'blocks',regionCount:70,regionJitter:90}
    ]){
      const start=performance.now();
      drawWallpaper(canvas,{seed:'stress-visible-geometry',...mode,
        material:'none',interiorElements:elements});
      const duration=performance.now()-start;
      const pixels=canvas.getContext('2d').getImageData(0,0,240,520).data;
      measurements.push({structure:mode.structure,duration,
        present:pixels.some((v,i)=>i%4===0&&v>0)});
    }
    return measurements;
  })()`);
  console.log('VISIBLE_DECORATION_RENDER_STRESS',JSON.stringify(renderStress));
  assert.ok(renderStress.every(x=>x.present&&x.duration<12000),
    'dense multi-region decoration should paint within a responsive budget: '+JSON.stringify(renderStress));
  const pathPlacement=await evaluate(`(async()=>{
    const {drawWallpaper}=await import('/src/renderer.js');
    const canvas=document.createElement('canvas');canvas.width=240;canvas.height=520;
    const recipe={seed:'path-interior-placement',structure:'paths',family:'studio',
      geometry:'wave',motif:'solid',material:'none',stripeWidth:65,spread:75,
      interiorElements:[{id:'placement',shape:'wave',type:'line',stroke:'solid',
        width:2,frequency:6,amplitude:.25,color:'white',opacity:1}]};
    const render=placement=>{
      drawWallpaper(canvas,{...recipe,interiorElements:[{
        ...recipe.interiorElements[0],placement
      }]});
      return canvas.getContext('2d').getImageData(0,0,240,520).data.slice();
    };
    const local=render('local'),edge=render('contour'),field=render('field');
    const different=(a,b)=>{
      let changed=0;
      for(let i=0;i<a.length;i+=4)
        if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+
          Math.abs(a[i+2]-b[i+2])>30)changed++;
      return changed;
    };
    return {edge:different(local,edge),field:different(local,field),
      edgeVsField:different(edge,field)};
  })()`);
  assert.ok(Object.values(pathPlacement).every(count=>count>35),
    'path placement choices must produce meaningfully distinct artwork: '+
    JSON.stringify(pathPlacement));
  const initial=await evaluate('({tabs:document.querySelectorAll(".settings-tab").length,tools:document.querySelectorAll(".editor-tool-card").length,preview:document.querySelector(".wallpaper-frame").getBoundingClientRect().height,scroll:document.documentElement.scrollHeight})');
  assert.equal(initial.tabs,7);
  assert.ok(initial.tools>=18);
  assert.ok(initial.preview>450);
  assert.ok(initial.scroll<=915);
  await evaluate('document.getElementById("mobileEdit").click()');
  await waitFor('document.body.classList.contains("mobile-edit-open")');
  // Experimental Focus: a shared slider controls the *real* field, keeps
  // All controls one tap away, and never edits values on view switching.
  const focusBaseline=await evaluate(`(()=>{
    const structure=document.querySelector('#controls [name=structure]');
    structure.value='paths';structure.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('#tab-stripes').click();
    document.querySelector('.editor-tool-tab[data-editor-tool=structure]').click();
    const source=document.querySelector('#controls [name=stripeWidth]');
    const recipe=JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('r')));
    const originalSource=source;
    document.querySelector('.editor-focus-toggle').click();
    const focused=document.querySelector('.editor-focus-panel:not([hidden])');
    const chip=focused.querySelector('[data-focus-key="stripeWidth"]');
    if(chip)chip.click();
    return {before:recipe,value:source.value,step:Number(source.step)||1,
      max:Number(source.max),min:Number(source.min),
      panel:!!focused,sourceUnmoved:originalSource===document.querySelector('[name=stripeWidth]'),
      chip:!!chip,
      all:!!focused?.querySelector('.editor-focus-all'),
      visible:focused?focused.getBoundingClientRect().height:0,
      sourceColor:source.style.getPropertyValue('--roygbiv-slider-color'),
      focusColor:focused?.querySelector('.editor-focus-slider')?.style.getPropertyValue('--roygbiv-slider-color'),
      off:!document.querySelector('#controls').classList.contains('editor-focus-active')};
  })()`);
  assert.ok(focusBaseline.panel&&focusBaseline.chip&&focusBaseline.all&&focusBaseline.visible>65);
  assert.ok(focusBaseline.sourceUnmoved&&!focusBaseline.off);
  assert.ok(focusBaseline.sourceColor&&focusBaseline.sourceColor===focusBaseline.focusColor,
    'The focused adjustment must inherit its source panel ROYGBIV colour');
  assert.deepEqual(await evaluate(
    'JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r")))'),
    focusBaseline.before,'Opening Focus or choosing a parameter changed the recipe');
  // The reference atlas exposed a half-hidden Focus slider at 412×892.
  // Test the real phone viewport and require the entire active adjustment,
  // explanatory help and source preview to fit without scrolling the tray.
  await command('Emulation.setDeviceMetricsOverride',{
    width:412,height:892,deviceScaleFactor:1,mobile:true,
    screenWidth:412,screenHeight:892,
  });
  // The editor's 180ms sheet translation must finish before measuring its
  // final resting bounds. Otherwise DOMRect observes a moving offscreen tray.
  await delay(320);
  const focusViewport=await evaluate(`(()=>{
    const bounds=selector=>document.querySelector(selector).getBoundingClientRect();
    const panel=bounds('.editor-focus-panel');
    const slider=bounds('.editor-focus-slider-row');
    const help=bounds('.editor-focus-help');
    const stage=bounds('.studio-stage');
    const tray=bounds('#mobileDesignSheet');
    return {height:innerHeight,panelBottom:panel.bottom,sliderBottom:slider.bottom,
      helpBottom:help.bottom,sliderHeight:slider.height,
      stageBottom:stage.bottom,trayTop:tray.top,
      panelScrollable:document.querySelector('.editor-focus-panel').scrollHeight>
        document.querySelector('.editor-focus-panel').clientHeight+2};
  })()`);
  assert.ok(focusViewport.sliderHeight>=40&&
    focusViewport.sliderBottom<=Math.min(focusViewport.panelBottom,focusViewport.height)-2,
    '412×892 Focus adjustment must fit fully in the visible sheet: '+JSON.stringify(focusViewport));
  assert.ok(focusViewport.helpBottom<=Math.min(focusViewport.panelBottom,focusViewport.height)+1,
    'Focus help should be readable without scrolling at normal phone height: '+
    JSON.stringify(focusViewport));
  assert.ok(focusViewport.stageBottom<=focusViewport.trayTop+2,
    'Expanding Focus must contract preview space rather than covering artwork');
  await command('Emulation.setDeviceMetricsOverride',{
    width:412,height:915,deviceScaleFactor:1,mobile:true,
    screenWidth:412,screenHeight:915,
  });
  console.log('PIXEL6PRO_FOCUS_VIEWPORT_FIT',JSON.stringify(focusViewport));
  await evaluate(`(()=>{
    const input=document.querySelector('.editor-focus-slider');
    const delta=Number(input.value)<Number(input.max)?1:-1;
    document.querySelector('.editor-focus-slider-row .editor-focus-step'+(delta>0?':last-of-type':':first-of-type')).click();
  })()`);
  await waitFor(`Number(document.querySelector('[name=stripeWidth]').value)!==${Number(focusBaseline.value)}`);
  const focusedAfter=await evaluate(`(()=>{
    const source=document.querySelector('[name=stripeWidth]');
    const form=document.querySelector('#controls');
    const label=document.querySelector('.editor-focus-value').textContent;
    const recipe=JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('r')));
    return {value:source.value,display:label,recipe,active:form.classList.contains('editor-focus-active')};
  })()`);
  assert.ok(focusedAfter.active&&focusedAfter.value===focusedAfter.display);
  assert.equal(Number(focusedAfter.recipe.stripeWidth),Number(focusedAfter.value));
  assert.deepEqual(Object.keys(focusBaseline.before).filter(
    k=>JSON.stringify(focusBaseline.before[k])!==JSON.stringify(focusedAfter.recipe[k])),
    ['stripeWidth'],'Focus adjusted other recipe fields unexpectedly');
  // Undo is an external command. It replays saved source controls without
  // dispatching native input/change from the selected slider. Focus must
  // display the restored value and remain operable while it is open.
  await evaluate('document.getElementById("undo").click()');
  await waitFor(`JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).stripeWidth===${Number(focusBaseline.before.stripeWidth)}`);
  const focusedUndone=await evaluate(`(()=>{
    const source=document.querySelector('[name=stripeWidth]');
    const shared=document.querySelector('.editor-focus-slider');
    const output=document.querySelector('.editor-focus-value');
    return {source:Number(source.value),shared:Number(shared.value),
      output:Number(output.textContent),active:document.querySelector('#controls')
        .classList.contains('editor-focus-active')};
  })()`);
  assert.equal(focusedUndone.source,Number(focusBaseline.before.stripeWidth));
  assert.equal(focusedUndone.shared,focusedUndone.source,
    'Focus must follow an external Undo of its original source setting');
  assert.equal(focusedUndone.output,focusedUndone.source);
  assert.equal(focusedUndone.active,true);
  // Lock is another recipe-driven action without a source slider 'change'
  // event. Focus must become inert and then re-enable after unlocking.
  const focusedLock=await evaluate(`(()=>{
    const source=document.querySelector('[name=stripeWidth]');
    const lock=document.querySelector('[data-lock-key=stripeWidth]');
    lock.click();
    const focus=document.querySelector('.editor-focus-slider');
    const before=JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('r')));
    const state={sourceDisabled:source.disabled,focusedDisabled:focus.disabled,
      stepDisabled:[...document.querySelectorAll('.editor-focus-step')].every(x=>x.disabled),
      locked:before.lockedSettings.includes('stripeWidth')};
    state.beforeStep=before;
    document.querySelector('.editor-focus-step').click();
    state.after=JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('r')));
    lock.click();
    state.enabled=!source.disabled&&!focus.disabled;
    return state;
  })()`);
  assert.ok(focusedLock.sourceDisabled&&focusedLock.focusedDisabled&&
    focusedLock.stepDisabled&&focusedLock.locked&&focusedLock.enabled,
    'Focused slider must immediately respect and recover from source locks');
  assert.deepEqual(focusedLock.after,focusedLock.beforeStep,
    'Locked focused step must not mutate recipe');
  await evaluate(`(()=>{
    document.querySelector('.editor-focus-all').click();
    const source=document.querySelector('[name=stripeWidth]');
    source.value=${JSON.stringify(focusBaseline.value)};
    source.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await waitFor(`Number(document.querySelector('[name=stripeWidth]').value)===${Number(focusBaseline.value)}`);
  await waitFor(`JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('r'))).stripeWidth===${Number(focusBaseline.before.stripeWidth)}`);
  assert.equal(await evaluate('document.querySelector("#controls").classList.contains("editor-focus-active")'),false);
  assert.ok(await evaluate('document.querySelector(".editor-tool-card[data-editor-tool=structure]").getBoundingClientRect().height>0'));
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
  assert.deepEqual(editor.tabs,['Layout','Path','Shapes','Details','Colour','Material','Effects']);
  // Every live source category gets a distinct flat accent, without changing
  // slider values, disabled handlers or the four-column material rotation.
  const rowPalette=await evaluate(`(()=>{
    const seen={};
    for(const row of document.querySelectorAll('.editor-setting-row[data-control-category]')){
      const key=row.dataset.controlCategory;
      if(seen[key])continue;
      const style=getComputedStyle(row);
      seen[key]={accent:style.getPropertyValue('--editor-row-accent').trim(),
        kind:row.dataset.controlKind,keys:row.dataset.controlKeys,
        shadow:style.boxShadow};
    }
    return seen;
  })()`);
  assert.deepEqual(Object.keys(rowPalette).sort(),
    ['colour','details','effects','layout','material','path','stripes']);
  assert.equal(new Set(Object.values(rowPalette).map(x=>x.accent)).size,7);
  assert.ok(Object.values(rowPalette).every(x=>x.keys&&x.kind&&x.shadow.includes('-3px')));
  console.log('EDITOR_FLAT_SEVEN_COLOUR_ROWS',JSON.stringify(rowPalette));
  const sourcedDieNames=await evaluate(`(()=>({
    stripe:document.querySelector('[data-random-setting="stripeWidth"]')?.getAttribute('aria-label'),
    rotation:document.querySelector('[data-random-setting="textureRotation"]')?.getAttribute('aria-label'),
    background:document.querySelector('[data-random-setting="background"]')?.getAttribute('aria-label')
  }))()`);
  assert.equal(sourcedDieNames.stripe,'Randomize only Stripe thickness');
  assert.match(sourcedDieNames.rotation,/^Randomize only Texture layer 1 rotation in degrees$/);
  assert.equal(sourcedDieNames.background,'Randomize only Background');
  console.log('SOURCE_SETTING_RANDOMIZE_LABELS',JSON.stringify(sourcedDieNames));
  const iconPlacement=await evaluate('(()=>({tabs:[...document.querySelectorAll(".settings-tab")].map(b=>({width:b.getBoundingClientRect().width,icon:!!b.querySelector("svg.ui-icon")})),dock:[...document.querySelectorAll("#mobileActionDock>button")].map(b=>({width:b.getBoundingClientRect().width,icon:!!b.querySelector("svg.ui-icon")})),rail:[...document.querySelectorAll("#mobileEditorActionRail>button")].map(b=>({width:b.getBoundingClientRect().width,icon:!!b.querySelector("svg.ui-icon")})),remoteImages:document.querySelectorAll("img.ui-icon").length,categoryHeight:document.querySelector(".settings-tabs").getBoundingClientRect().height}))()');
  assert.equal(iconPlacement.remoteImages,0,'inlined icons inherit theme contrast');
  const previewShortcutIcons=await evaluate('(()=>{const box=id=>{const b=document.getElementById(id);const r=b.getBoundingClientRect();return {height:r.height,width:r.width,icon:!!b.querySelector("svg.ui-icon"),labelHeight:b.querySelector(".toolbar-wording")?.getBoundingClientRect().height||0}};const prime=document.querySelector(".mobile-preview-rail-left .prime-toggle");return {prime:{height:prime.getBoundingClientRect().height,icon:!!prime.querySelector("svg.ui-icon"),labelHeight:prime.querySelector(".toolbar-wording").getBoundingClientRect().height},draw:box("drawPathToggle"),import:box("importPathToggle")}})()');
  assert.ok(previewShortcutIcons.prime.icon,'Primes only uses approved SVG');
  assert.ok(previewShortcutIcons.import.icon,'Import path uses approved SVG');
  assert.ok(previewShortcutIcons.import.height>=previewShortcutIcons.draw.height-2,'Import shortcut matches the existing column height');
  assert.ok(previewShortcutIcons.import.height>=previewShortcutIcons.import.labelHeight+17,'Import icon and caption fit within the button');
  console.log('PREVIEW_SHORTCUT_ICONS',JSON.stringify(previewShortcutIcons));
  assert.ok(iconPlacement.tabs.every(t=>t.icon&&t.width>20));
  assert.ok(iconPlacement.dock.every(t=>t.icon&&t.width>25));
  assert.ok(iconPlacement.rail.every(t=>t.icon&&t.width>=25));
  assert.ok(iconPlacement.categoryHeight<=50,'icons may not introduce a second tab row');
  console.log('ICON_PLACEMENT_INVARIANTS',JSON.stringify(iconPlacement));
  const schema=await evaluate('(async()=>{const m=await import("/src/editor-schema.js");const keys=[...document.querySelectorAll("#controls [data-setting]")].map(x=>x.name).filter(x=>x&&!["family","primesOnly"].includes(x));keys.push("textureLayer2Enabled","textureLayer3Enabled");return {...m.validateEditorSchema([...new Set(keys)]),wizard:m.WIZARD_STEPS,toolCount:m.TOOL_LIST.length}})()');
  console.log('EDITOR_SCHEMA',JSON.stringify(schema));
  assert.deepEqual(schema.missing,[]);
  assert.deepEqual(schema.duplicated,[]);
  assert.deepEqual(schema.unknown,[]);
  assert.equal(schema.wizard.length,7);
  assert.ok(schema.toolCount>=18);
  // Interior element controls must work through the real mobile editor and
  // remain portable in the same URL/PNG recipe as the rest of the scene.
  const undetailed=await evaluate('document.getElementById("preview").toDataURL()');
  await evaluate('document.getElementById("tab-details").click();document.querySelector("[data-editor-tool=interior]").click();document.querySelector(".interior-toolbar button").click()');
  await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).interiorElements.length===1');
  await waitFor('document.getElementById("preview").dataset.renderPending!=="true"',20000);
  const detailed=await evaluate('document.getElementById("preview").toDataURL()');
  assert.notEqual(detailed,undetailed,'adding an interior hairline must change painted pixels');
  await evaluate('document.querySelector("[data-editor-tool=interior-style]").click();(()=>{const select=document.querySelector(".editor-tool-card[data-editor-tool=interior-style] select");select.value="band";select.dispatchEvent(new Event("change",{bubbles:true}))})()');
  await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).interiorElements[0].type==="band"');
  await evaluate('document.querySelector("[data-editor-tool=interior-targets]").click();(()=>{const boxes=[...document.querySelectorAll(".interior-targets input")];boxes[1].click()})()');
  await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).interiorElements[0].colorSlots.length===6');
  await evaluate('document.querySelector("[data-editor-tool=interior]").click();document.querySelectorAll(".interior-toolbar button")[1].click()');
  await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).interiorElements.length===0');
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
  await evaluate('(()=>{const f=document.querySelector("[name=material2]");f.value="none";f.dispatchEvent(new Event("change",{bubbles:true}))})()');
  await waitFor('document.querySelector("[data-editor-tool=layer2]").dataset.materialState==="off"');
  const finish2Off=await evaluate('(()=>{const n=document.querySelector("[data-editor-tool=finish2] .material-finish-help");return {hidden:n.hidden,text:n.textContent}})()');
  assert.ok(!finish2Off.hidden&&finish2Off.text.includes('Choose a texture in Layer 2'));
  await evaluate('(()=>{const el=document.querySelector("[name=material2]");el.value="linen";el.dispatchEvent(new Event("change",{bubbles:true}))})()');
  await waitFor('document.getElementById("textureLayer2Enabled").checked===true');
  assert.ok(await evaluate('document.querySelector("#panel-material .editor-tool-card:not([hidden]) [name=material2]")!==null'));
  // Visual layer chips announce the authoritative source model state, not
  // fake enabled switches or stale values from a previous category.
  await waitFor('document.querySelector("[data-editor-tool=layer2]").dataset.materialState==="on"');
  const layer2Status=await evaluate('(()=>{const b=document.querySelector("[data-editor-tool=layer2]");return {state:b.dataset.materialState,label:b.getAttribute("aria-label"),title:b.title}})()');
  assert.equal(layer2Status.label,'Layer 2: Texture selected');
  assert.equal(layer2Status.title,layer2Status.label);
  assert.ok(await evaluate('document.querySelector("[data-editor-tool=finish2] .material-finish-help").hidden'),
    'Finish 2 explanation must disappear when a real texture activates the layer');
  await evaluate('(()=>{const f=document.querySelector("[name=material3]");f.value="foil";f.dispatchEvent(new Event("change",{bubbles:true}))})()');
  await waitFor('document.querySelector("[data-editor-tool=layer3]").dataset.materialState==="on"');
  await evaluate('(()=>{const f=document.querySelector("[name=textureStrength3]");f.value="0";f.dispatchEvent(new Event("change",{bubbles:true}))})()');
  await waitFor('document.querySelector("[data-editor-tool=layer3]").dataset.materialState==="zero"');
  const layer3Zero=await evaluate('document.querySelector("[data-editor-tool=layer3]").getAttribute("aria-label")');
  assert.equal(layer3Zero,'Layer 3: Strength 0%');
  const finish3Zero=await evaluate('(()=>{const n=document.querySelector("[data-editor-tool=finish3] .material-finish-help");return {hidden:n.hidden,text:n.textContent}})()');
  assert.ok(!finish3Zero.hidden&&finish3Zero.text.includes('0% strength'));
  await evaluate('(()=>{const f=document.querySelector("[name=material3]");f.value="none";f.dispatchEvent(new Event("change",{bubbles:true}))})()');
  await waitFor('document.querySelector("[data-editor-tool=layer3]").dataset.materialState==="off"');
  console.log('MATERIAL_SOURCE_STATUS_STATES',JSON.stringify({layer2Status,layer3Zero}));

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
    'structure','patterns','marks','motif-scale','tone','character']);
  await evaluate('document.getElementById("tab-details").click();document.querySelector("[data-editor-tool=shadows]").click()');
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
  // Mode changes must expose relevant geometry, retain dormant path settings,
  // and keep the same no-scroll card design across both new scene families.
  for(const [structure,expectedTool] of [['radial','rays'],['regions','regions']]){
    await evaluate('document.getElementById("tab-layout").click()');
    await evaluate('document.querySelector("[data-editor-tool=structure-mode]").click()');
    await evaluate('(()=>{const f=document.querySelector("[name=structure]");f.value="'+structure+'";f.dispatchEvent(new Event("change",{bubbles:true}))})()');
    await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).structure==="'+structure+'"');
    await evaluate('document.getElementById("tab-path").click()');
    const state=await evaluate('(()=>({tool:document.querySelector(".editor-tool-card:not([hidden])").dataset.editorTool,geometryInactive:document.querySelector("[name=geometry]").disabled,activeChips:[...document.querySelectorAll(".editor-tool-tab:not([hidden])")].map(x=>x.dataset.editorTool)}))()');
    assert.equal(state.tool,expectedTool,structure);
    assert.equal(state.geometryInactive,true,structure);
    assert.ok(state.activeChips.includes(expectedTool),structure);
    const scene=await evaluate('(async()=>{const {resolveScene}=await import("/src/model.js");const r=JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r")));const s=resolveScene(r);return {kinds:[...new Set(s.objects.map(x=>x.kind))],colors:[...new Set(s.objects.map(x=>x.colorIndex))]}})()');
    assert.deepEqual(scene.kinds,['region']);
    assert.deepEqual(scene.colors,[0,1,2,3,4,5,6]);
    const badCards=await evaluate('(()=>{const bad=[];for(const tab of document.querySelectorAll(".settings-tab")){tab.click();for(const chip of document.querySelectorAll(".editor-tool-tab:not([hidden])")){chip.click();const card=document.querySelector(".editor-tool-card:not([hidden])"),rect=card.getBoundingClientRect();for(const el of card.querySelectorAll("input:not([type=hidden]),select")){if(!el.getClientRects().length||el.closest("[hidden]"))continue;const r=el.getBoundingClientRect();if(r.top<rect.top-3||r.bottom>rect.bottom+3||r.left<rect.left-3||r.right>rect.right+3)bad.push({tool:chip.dataset.editorTool,field:el.name})}}}return bad})()');
    console.log('NEW_STRUCTURE_CARD_FIT',structure,JSON.stringify(badCards));
    assert.deepEqual(badCards,[],'all '+structure+' controls fit without scrolling');
    await evaluate('document.getElementById("tab-path").click()');
  }
  await evaluate('document.querySelector("[data-editor-tool=regions]").click()');
  await evaluate('(()=>{const f=document.querySelector("[name=regionMode]");f.value="nested";f.dispatchEvent(new Event("change",{bubbles:true}))})()');
  await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).regionMode==="nested"');
  assert.ok(await evaluate('[...document.querySelectorAll(".editor-tool-tab:not([hidden])")].some(x=>x.dataset.editorTool==="origin")'));
  await evaluate('document.getElementById("tab-layout").click()');
  await evaluate('document.querySelector("[data-editor-tool=structure-mode]").click()');
  await evaluate('(()=>{const f=document.querySelector("[name=structure]");f.value="paths";f.dispatchEvent(new Event("change",{bubbles:true}))})()');
  await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).structure==="paths"');
  await evaluate('document.getElementById("tab-path").click()');
  assert.equal(await evaluate('document.querySelector(".editor-tool-card:not([hidden])").dataset.editorTool'),'geometry');
  assert.equal(await evaluate('document.querySelector("[name=geometry]").disabled'),false);
  await evaluate('document.getElementById("tab-effects").click()');

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
    assert.equal(bounds.categoryRows,1,'all seven categories must occupy one row');
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
    if(noClippedTools.length){
      const diagnostic=await evaluate(`(()=>{
        const result=[];
        for(const tool of ['finish1','finish2','finish3']){
          document.getElementById('tab-material').click();
          document.querySelector('[data-editor-tool='+tool+'].editor-tool-tab').click();
          const card=document.querySelector('.editor-tool-card:not([hidden])');
          const cb=card.getBoundingClientRect();
          const controls=card.querySelector('.rotation-controls');
          const field=controls.closest('.texture-rotation-field');
          result.push({tool,diagnostic:true,controls:controls.getBoundingClientRect().toJSON(),row:field.getBoundingClientRect().toJSON(),
            style:{columns:getComputedStyle(field).gridTemplateColumns,
              controlsGrid:getComputedStyle(controls).gridColumn,
              justify:getComputedStyle(controls).justifyContent,
              controlsWidth:getComputedStyle(controls).width,
              firstChild:controls.firstElementChild.getBoundingClientRect().toJSON(),
              number:controls.querySelector('input').getBoundingClientRect().toJSON()}});
          for(const el of card.querySelectorAll('.rotation-controls button')){
            const b=el.getBoundingClientRect();
            result.push({tool,text:el.textContent,card:[cb.left,cb.top,cb.right,cb.bottom],
              rect:[b.left,b.top,b.right,b.bottom],
              row:el.closest('.texture-rotation-field').getBoundingClientRect().toJSON()});
          }
        }
        return result;
      })()`);
      console.log('ROTATION_FIT_DIAG',JSON.stringify(diagnostic));
    }
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
  // Screenshot regressions: a dense region editor and every new Details
  // card must fit at the zoomed browser size with no hidden final control.
  await evaluate(`(()=>{
    const field=document.querySelector('[name=structure]');
    field.value='regions';
    field.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).structure==="regions"');
  const fitNewTools=await evaluate(`(()=>{
    const issues=[];
    const inspect=(name)=>{
      const card=document.querySelector('.editor-tool-card:not([hidden])');
      const frame=card.getBoundingClientRect();
      for(const el of card.querySelectorAll('select,input:not([type=hidden]),button')){
        if(!el.getClientRects().length||el.closest('[hidden]'))continue;
        const b=el.getBoundingClientRect();
        if(b.top<frame.top-2||b.bottom>frame.bottom+2||
           b.left<frame.left-2||b.right>frame.right+2)
          issues.push({name,control:el.name||el.getAttribute('aria-label')||el.textContent,
            overflow:Math.round(b.bottom-frame.bottom)});
      }
    };
    document.getElementById('tab-path').click();
    for(const name of ['regions','region-detail','origin']){
      document.querySelector('[data-editor-tool="'+name+'"]').click();inspect(name);
    }
    document.getElementById('tab-details').click();
    document.querySelector('[data-editor-tool="interior"]').click();
    document.querySelector('.interior-toolbar button').click();
    for(const name of ['interior','interior-style','interior-motion','interior-placement','interior-targets']){
      document.querySelector('[data-editor-tool="'+name+'"]').click();inspect(name);
    }
    return issues;
  })()`);
  assert.deepEqual(fitNewTools,[],
    'all geometric and interior controls must fit on a phone with browser zoom');
  await captureUI('67-percent-details-placement');
  const elementUsability=await evaluate(`(async()=>{
    document.getElementById('tab-details').click();
    document.querySelector('[data-editor-tool="interior"]').click();
    const manager=document.querySelector('.editor-tool-card[data-editor-tool="interior"]');
    const select=manager.querySelector('.interior-toolbar select');
    const scopeRow=manager.querySelector('.interior-scope');
    const scope=scopeRow?.textContent||'';
    const accessibleScope=scopeRow?.getAttribute('aria-label')||'';
    const elementState=scopeRow?.dataset.elementVisibility||'';
    const lock=manager.querySelector('.interior-actions button:last-child');
    lock.click();
    const locked=document.querySelector('.editor-tool-card[data-editor-tool="interior-style"] select').disabled;
    const chooseAvailable=!document.querySelector('.interior-toolbar select').disabled;
    document.querySelector('.interior-actions button:last-child').click();
    const unlocked=!document.querySelector('.editor-tool-card[data-editor-tool="interior-style"] select').disabled;
    const identity=document.querySelector('.interior-toolbar select');
    const background=document.querySelector('[name=background]');
    background.value=background.value==='black'?'white':'black';
    background.dispatchEvent(new Event('change',{bubbles:true}));
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    return {scope,accessibleScope,elementState,locked,chooseAvailable,unlocked,
      stable:identity===document.querySelector('.interior-toolbar select')};
  })()`);
  assert.equal(elementUsability.accessibleScope,elementUsability.scope);
  assert.match(elementUsability.scope,/Element [1-8] of [1-8] · Enabled/);
  assert.equal(elementUsability.elementState,'enabled');
  assert.ok(elementUsability.scope.includes('all seven colours'),
    'the element manager should explain its colour scope');
  assert.ok(elementUsability.locked&&elementUsability.chooseAvailable&&
    elementUsability.unlocked&&elementUsability.stable,
    'locks must visibly disable changes and unrelated edits must not rebuild Details: '+
    JSON.stringify(elementUsability));
  // A rapid sequence of changes must settle on the last requested state,
  // and every change must actually refresh the painted wallpaper.
  await waitFor('document.getElementById("preview").dataset.renderPending!=="true"',20000);
  const previewBefore=await evaluate('document.getElementById("preview").toDataURL()');
  await evaluate(`(()=>{
    const select=document.querySelector('[name=regionMode]');
    select.value='facets';
    select.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).regionMode==="facets"&&document.getElementById("preview").dataset.renderPending!=="true"',20000);
  const previewAfter=await evaluate('document.getElementById("preview").toDataURL()');
  assert.notEqual(previewBefore,previewAfter,
    'committed geometry choices must eventually repaint exact settled pixels');
  await evaluate(`(()=>{
    const field=document.querySelector('[name=structure]');
    field.value='paths';field.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).structure==="paths"');
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
  const desktopRotationBoxes=await evaluate(`(()=>{
    const problems=[];
    document.querySelector('#tab-material').click();
    for(const tool of ['finish1','finish2','finish3']){
      document.querySelector('[data-editor-tool="'+tool+'"].editor-tool-tab').click();
      const card=document.querySelector('.editor-tool-card[data-editor-tool="'+tool+'"]:not([hidden])');
      const row=card.querySelector('.texture-rotation-field .rotation-controls');
      if(!row){problems.push({tool,error:'missing original rotation row'});continue;}
      const host=row.getBoundingClientRect();
      if(host.width<150||host.height<20){
        problems.push({tool,error:'rotation row hidden or zero-size',width:host.width,height:host.height});
        continue;
      }
      for(const button of row.querySelectorAll('button,input[type=number]')){
        const box=button.getBoundingClientRect();
        if(box.top<host.top-2||box.bottom>host.bottom+2||
           box.left<host.left-2||box.right>host.right+2)
          problems.push({tool,label:button.getAttribute('aria-label')||button.textContent,
            containerHeight:host.height,height:box.height,
            top:box.top-host.top,bottom:box.bottom-host.bottom,
            left:box.left-host.left,right:box.right-host.right});
      }
    }
    return problems;
  })()`);
  assert.deepEqual(desktopRotationBoxes,[],
    'Every material rotation button must fit its visible desktop control row');

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
  // Earlier renderer coverage switches to desktop. Explicitly return to the
  // Pixel-size mobile viewport before qualifying touch hitboxes.
  await command('Emulation.setDeviceMetricsOverride',{
    width:412,height:915,deviceScaleFactor:1,mobile:true,
    screenWidth:412,screenHeight:915,
  });
  const editableRecipe=JSON.parse(readFileSync(join(cwd,'tests/fixtures/drawn-knot-t0b4v5.json'),'utf8'));
  await command('Page.navigate',{url:url+'?r='+encodeURIComponent(JSON.stringify(editableRecipe))});
  await waitFor('document.body.classList.contains("mobile-studio")',15000);
  await waitFor('document.readyState==="complete"&&document.querySelector("#drawPathToggle")',15000);
  await waitFor('document.querySelectorAll(".editor-tool-card").length>=18',15000);
  const pointEditorCheck=await evaluate(`(async()=>{
    const {createPointEditor}=await import('/src/path-point-editor.js');
    const recipe=JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('r')));
    const before=JSON.stringify(recipe.customPath);
    const button=document.getElementById('drawPathToggle');
    button.click();
    const panel=document.getElementById('drawPathPanel');
    const surfaceColour=getComputedStyle(panel).backgroundColor;
    const panelOpacity=surfaceColour.startsWith('rgba(')?
      Number(surfaceColour.split(',').at(-1).replace(')','')):1;
    const initialPhase=panel.dataset.phase;
    const sourceButtons=['drawSmooth','drawGeometric','drawEditPoints',
      'drawAgain','drawApply','drawCancel','drawAddPoint','drawDeletePoint',
      'drawCornerPoint','drawResmoothPoints','drawUndoPoint'];
    const originalActions=sourceButtons.every(id=>!!document.getElementById(id));
    const semanticGroups=['.draw-fit-group','.draw-refine-group','.draw-finish-group']
      .every(sel=>panel.querySelector(sel)?.getAttribute('role')==='group');
    document.getElementById('drawEditPoints').click();
    const editingPhase=panel.dataset.phase;
    const drawingTargets=[...panel.querySelectorAll('.draw-path-controls button')]
      .filter(button=>!button.hidden&&getComputedStyle(button).display!=='none')
      .map(button=>{
        const r=button.getBoundingClientRect();
        const parent=panel.getBoundingClientRect();
        return {id:button.id,width:r.width,height:r.height,
          horizontallyInside:r.left>=parent.left-1&&r.right<=parent.right+1};
      });
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
    return {changed,pinned,corners,undoAvailable,panelOpacity,initialPhase,editingPhase,
      originalActions,semanticGroups,drawingTargets,
      restored:JSON.stringify(restored.customPath)===before};
  })()`);
  console.log('LIVE_ANCHOR_EDITOR_ACCEPTANCE',JSON.stringify(pointEditorCheck));
  assert.equal(pointEditorCheck.panelOpacity,1,
    'drawing action surface must remain opaque over shortcuts and saved wallpaper');
  assert.equal(pointEditorCheck.initialPhase,'refine',
    'existing saved path should offer refinement rather than empty sketch');
  assert.equal(pointEditorCheck.editingPhase,'anchors',
    'point edit action should visibly identify the anchor editing phase');
  assert.ok(pointEditorCheck.originalActions&&pointEditorCheck.semanticGroups,
    'drawing workflow must retain all eleven original action identities in named groups');
  assert.ok(pointEditorCheck.drawingTargets.length>=9,
    'Sketch, Refine, Finish and anchor actions remain reachable');
  assert.deepEqual(pointEditorCheck.drawingTargets.filter(t=>
    t.height<33||t.width<24||!t.horizontallyInside),[],
    'Compact drawing actions must expose usable touch rectangles without side clipping');
  assert.ok(pointEditorCheck.changed&&pointEditorCheck.pinned>0&&pointEditorCheck.corners>0,
    'dragging a point must modify and pin the selected anchor');
  assert.ok(pointEditorCheck.undoAvailable&&pointEditorCheck.restored,
    'local Undo and wallpaper Undo must both remain usable');
  // Preserve the desktop viewport expected by the following Material and
  // geometry probes. Breakpoint boundaries are tested separately later.
  await command('Emulation.setDeviceMetricsOverride',{
    width:1280,height:900,deviceScaleFactor:1,mobile:false,
    screenWidth:1280,screenHeight:900,
  });
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
  const imageImportPhase=await evaluate(`(()=>{
    const dialog=document.getElementById('imagePathDialog');
    return {phase:dialog.dataset.phase,
      label:dialog.querySelector('.image-path-phase')?.textContent,
      candidateCount:document.getElementById('imagePathCandidate').options.length,
      choiceEnabled:!document.getElementById('imagePathCandidate').disabled};
  })()`);
  assert.equal(imageImportPhase.phase,'ready');
  assert.equal(imageImportPhase.label,'Select path');
  assert.ok(imageImportPhase.choiceEnabled&&imageImportPhase.candidateCount>0);
  await captureUI('image-path-ready-phone');
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
  await waitFor('document.getElementById("imagePathDialog").dataset.phase==="idle"');
  assert.equal(await evaluate('document.querySelector("#imagePathDialog .image-path-phase").textContent'),'Choose image');
  console.log('IMAGE_IMPORT_WORKFLOW_PHASES',JSON.stringify(imageImportPhase));
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
  // Wait for the NEW upload's analysis, not residual options from the
  // previous dialog. The chooser is disabled throughout the new decode.
  await waitFor('document.getElementById("imagePathDialog").open && !document.getElementById("imagePathCandidate").disabled && [...document.getElementById("imagePathCandidate").options].some(o=>o.textContent.includes("Line "))',15000);
  await evaluate(`(()=>{
    const select=document.getElementById('imagePathCandidate');
    const line=[...select.options].find(o=>o.textContent.includes('Line '));
    if(line){select.value=line.value;
      select.dispatchEvent(new Event('change',{bubbles:true}));}
  })()`);
  await waitFor('!document.getElementById("imagePathAngle").disabled',5000);
  const appliedAngle=await evaluate(`(async()=>{
    const select=document.getElementById('imagePathCandidate');
    const line=[...select.options].find(o=>o.textContent.includes('Line '));
    if(!line)return {missingLine:true};
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
  // Reload the default five-destination app independently of initial smoke.
  // This must work with no query flag or pre-existing settings from the prior page.
  await command('Emulation.setDeviceMetricsOverride',{
    width:412,height:915,deviceScaleFactor:1,mobile:true,
    screenWidth:412,screenHeight:915,
  });
  await command('Page.navigate',{url});
  await waitFor('document.readyState==="complete"&&document.body?.classList.contains("mobile-studio")',15000);
  await delay(400);
  const trialBoot=await evaluate(`(()=>({
    query:location.search.slice(0,100),body:document.body.className,
    saved:!!document.getElementById('mobileSaved'),
    favourite:!!document.getElementById('mobileFavorite'),
    download:!!document.getElementById('mobileDownload'),
    shortcutHost:!!document.querySelector('.mobile-five-shortcuts'),
    hostParent:document.querySelector('.mobile-five-shortcuts')?.parentElement?.className,
    previewRail:!!document.querySelector('.mobile-preview-rail-left'),
    leftChildren:[...document.querySelector('.mobile-preview-rail-left')?.children||[]]
      .map(el=>el.className||el.id).slice(0,8),
    navButtons:[...document.querySelectorAll('#mobileActionDock>button')].map(el=>el.id)
  }))()`);
  assert.ok(!new URLSearchParams(trialBoot.query).has('nav'),
    'default five-destination navigation cannot depend on a URL experiment switch');
  console.log('FIVE_BOOT_DIAGNOSTICS',JSON.stringify(trialBoot));
  await waitFor('document.body?.classList.contains("mobile-five-nav")&&!!document.getElementById("mobileSaved")&&!!document.querySelector(".mobile-preview-rail-left .mobile-five-shortcuts>#mobileFavorite")&&!!document.querySelector(".mobile-preview-rail-left .mobile-five-shortcuts>#mobileDownload")',15000);
  const fiveNav=await evaluate(`(()=>{
    const dock=[...document.querySelectorAll('#mobileActionDock>button')];
    const ids=dock.map(button=>button.id);
    const hasAction=id=>document.getElementById(id)?.tagName==='BUTTON';
    const favorite=document.getElementById('mobileFavorite');
    const download=document.getElementById('mobileDownload');
    const shuffle=document.getElementById('mobileShuffle');
    const quickHost=favorite.closest('.mobile-five-shortcuts');
    const quick=!!quickHost&&quickHost===download.closest('.mobile-five-shortcuts');
    const rects=dock.map(b=>b.getBoundingClientRect());
    document.getElementById('mobileSaved').click();
    const saved={mode:document.getElementById('gallery').dataset.view,
      selected:document.getElementById('mobileSaved').getAttribute('aria-current'),
      expanded:document.getElementById('mobileSaved').getAttribute('aria-expanded'),
      open:document.body.classList.contains('mobile-gallery-open')};
    document.getElementById('mobileExplore').click();
    const explore={mode:document.getElementById('gallery').dataset.view,
      selected:document.getElementById('mobileExplore').getAttribute('aria-current'),
      open:document.body.classList.contains('mobile-gallery-open')};
    document.getElementById('mobileStudio').click();
    const studio={selected:document.getElementById('mobileStudio').getAttribute('aria-current'),
      galleryClosed:!document.body.classList.contains('mobile-gallery-open')};
    return {ids,allNamed:['mobileShuffle','mobileFavorite','mobileDownload'].every(hasAction),
      quick,shuffleInMore:!!shuffle.closest('#mobileToolsContent .mobile-more-group'),
      iconCount:dock.filter(b=>!!b.querySelector('svg.ui-icon')).length,
      widths:rects.map(b=>b.width),
      saved,explore,studio};
  })()`);
  assert.deepEqual(fiveNav.ids,
    ['mobileStudio','mobileEdit','mobileExplore','mobileSaved','mobileMore']);
  assert.ok(fiveNav.allNamed&&fiveNav.quick&&fiveNav.shuffleInMore);
  assert.equal(fiveNav.iconCount,5);
  assert.ok(fiveNav.widths.every(width=>width>45));
  assert.deepEqual(fiveNav.saved,{mode:'saved',selected:'page',expanded:'true',open:true});
  assert.deepEqual(fiveNav.explore,{mode:'explore',selected:'page',open:true});
  assert.deepEqual(fiveNav.studio,{selected:'page',galleryClosed:true});
  const moreGroups=await evaluate(`(()=>{
    document.getElementById('mobileMore').click();
    const groups=[...document.querySelectorAll('#mobileToolsContent .mobile-more-group')];
    const selectorToGroup={
      '#mobileShuffle':0,'.action-tray':0,'.export-metadata':1,
      '.secondary-actions':1,'.composition-positioner':2,'.details-bar':2
    };
    const placement=Object.fromEntries(Object.entries(selectorToGroup).map(
      ([selector,group])=>[selector,groups[group]?.contains(document.querySelector(selector))||false]));
    const visible=groups.every(group=>group.getBoundingClientRect().height>0);
    document.getElementById('mobileMore').click();
    return {headings:groups.map(group=>group.querySelector('h3')?.textContent),
      placement,visible,closed:!document.body.classList.contains('mobile-tools-open')};
  })()`);
  assert.deepEqual(moreGroups.headings,[
    'Create & seed','Import, export & share','Position & design details'
  ]);
  assert.ok(Object.values(moreGroups.placement).every(Boolean));
  assert.ok(moreGroups.visible&&moreGroups.closed);
  console.log('MOBILE_MORE_GROUP_CENSUS',JSON.stringify(moreGroups));
  console.log('FIVE_DESTINATION_TRIAL_ACCEPTANCE',JSON.stringify(fiveNav));
  // Match the actual design reference's 412×892 CSS viewport, not only the
  // slightly taller general mobile-smoke profile.
  await command('Emulation.setDeviceMetricsOverride',{
    width:412,height:892,deviceScaleFactor:1,mobile:true,
    screenWidth:412,screenHeight:892,
  });
  await delay(220);
  const trialGeometry=await evaluate(`(()=>{
    const rect=selector=>document.querySelector(selector)?.getBoundingClientRect();
    const dock=rect('#mobileActionDock');
    const frame=rect('.wallpaper-frame');
    const preview=rect('.studio-stage');
    const quick=[...document.querySelectorAll('.mobile-five-shortcuts>button')]
      .map(button=>button.getBoundingClientRect());
    return {dock:{top:dock.top,bottom:dock.bottom},
      preview:{top:preview.top,bottom:preview.bottom},
      frame:{left:frame.left,right:frame.right,height:frame.height},
      shortcuts:quick.map(r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom}))};
  })()`);
  assert.equal(trialGeometry.shortcuts.length,2);
  assert.ok(trialGeometry.dock.top>=trialGeometry.preview.bottom-2,
    'five-item dock must not cover preview stage');
  assert.ok(trialGeometry.dock.bottom<=893);
  assert.ok(trialGeometry.frame.height>300);
  assert.ok(trialGeometry.shortcuts.every(r=>r.right<=trialGeometry.frame.left+5),
    'preview quick actions must not obscure any wallpaper pixel');
  console.log('FIVE_DESTINATION_412_892_GEOMETRY',JSON.stringify(trialGeometry));
  // Retain real Chromium images for independent design review. These are not
  // concept art or an assertion that the opt-in shell is visually approved.
  await captureUI('five-nav-studio-412x892');
  await evaluate('document.getElementById("mobileExplore").click()');
  await delay(180);
  await captureUI('five-nav-explore-412x892');
  await evaluate('document.getElementById("mobileSaved").click()');
  await delay(180);
  await captureUI('five-nav-saved-412x892');
  await evaluate('document.getElementById("mobileEdit").click()');
  await delay(180);
  await captureUI('five-nav-edit-412x892');
  await evaluate('document.getElementById("mobileMore").click()');
  await delay(180);
  await captureUI('five-nav-more-412x892');
  // Compare a genuinely rendered second palette, not a recoloured mockup.
  await evaluate('document.querySelector("[data-studio-theme=dark]").click()');
  await evaluate('document.getElementById("mobileStudio").click()');
  await delay(180);
  await captureUI('five-nav-studio-dark-412x892');
  await evaluate('document.getElementById("mobileSaved").click()');
  await delay(180);
  await captureUI('five-nav-saved-dark-412x892');
  assert.equal(await evaluate('document.documentElement.dataset.theme'),'dark');
  await evaluate('document.querySelector("[data-studio-theme=cream]").click()');
  await evaluate('document.getElementById("mobileStudio").click()');
  // A relocated source button must still forward into the canonical handler.
  const favouriteRoundtrip=await evaluate(`(()=>{
    const src=document.getElementById('mobileFavorite');
    const canonical=document.getElementById('favorite');
    const before=canonical.getAttribute('aria-pressed');
    src.click();
    const during=canonical.getAttribute('aria-pressed');
    src.click();
    return {before,during,after:canonical.getAttribute('aria-pressed'),
      quickConnected:src.isConnected,source:src.id};
  })()`);
  assert.ok(favouriteRoundtrip.quickConnected);
  assert.notEqual(favouriteRoundtrip.before,favouriteRoundtrip.during,
    'five-item preview Favourite must invoke canonical saved state');
  assert.equal(favouriteRoundtrip.after,favouriteRoundtrip.before,
    'favourite shortcut roundtrip must restore original state');
  console.log('FIVE_DESTINATION_FAVOURITE_ROUNDTRIP',JSON.stringify(favouriteRoundtrip));
  // The short-panel class is intentionally navigation-driven. It must
  // actually shrink the reserved tray (and grow the unobscured preview),
  // not merely decorate the body with an inert CSS class. A complex
  // multi-control panel must reclaim the full height on the next click.
  const compactRecipeBefore=await evaluate(
    'JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r")))');
  await evaluate('document.getElementById("mobileEdit").click()');
  await waitFor('document.body.classList.contains("mobile-edit-open")');
  await delay(260);
  const compactGeometry=async()=>evaluate(`(()=>{
    const stage=document.querySelector('.studio-stage').getBoundingClientRect();
    const tray=document.querySelector('.sidebar').getBoundingClientRect();
    const layout=document.querySelector('.layout').getBoundingClientRect();
    const card=document.querySelector('.editor-tool-card:not([hidden])');
    return {compact:document.body.classList.contains('mobile-edit-compact'),
      selected:document.querySelector('.editor-tool-tab[aria-pressed=true]')?.dataset.editorTool,
      cardVisible:!!card&&card.getBoundingClientRect().height>16,
      trayHeight:tray.height,layoutHeight:layout.height,
      stageBottom:stage.bottom,trayTop:tray.top,
      trayLeft:tray.left,trayRight:tray.right,trayBottom:tray.bottom,
      sourceNavTabs:document.querySelectorAll('.settings-tabs .settings-tab').length};
  })()`);
  await evaluate('document.getElementById("tab-layout").click()');
  await evaluate('document.querySelector(".editor-tool-tab[data-editor-tool=structure-mode]").click()');
  await waitFor('document.body.classList.contains("mobile-edit-compact")');
  const sparseTray=await compactGeometry();
  await captureUI('compact-tray-sparse-tool-412x892');
  await evaluate('document.getElementById("tab-material").click()');
  await evaluate('document.querySelector(".editor-tool-tab[data-editor-tool=layer1]").click()');
  await waitFor('!document.body.classList.contains("mobile-edit-compact")');
  const fullTray=await compactGeometry();
  await captureUI('compact-tray-full-tool-412x892');
  assert.equal(sparseTray.selected,'structure-mode');
  assert.equal(fullTray.selected,'layer1');
  assert.ok(sparseTray.compact&&!fullTray.compact&&
    sparseTray.cardVisible&&fullTray.cardVisible);
  assert.ok(fullTray.trayHeight-sparseTray.trayHeight>=20,
    'a short tool must reclaim actual vertical wallpaper space');
  assert.ok(sparseTray.layoutHeight-fullTray.layoutHeight>=20,
    'the preview must grow when the settings tray shrinks');
  assert.ok(Math.abs((sparseTray.layoutHeight+sparseTray.trayHeight)-
    (fullTray.layoutHeight+fullTray.trayHeight))<=3,
    'preview and tray must resize as one reserved screen partition');
  for(const [tool,geometry] of [['structure-mode',sparseTray],['layer1',fullTray]]){
    assert.ok(geometry.stageBottom<=geometry.trayTop+2,
      tool+' camera and tray must not overlap');
    assert.ok(geometry.trayLeft>=-1&&geometry.trayRight<=413&&
      geometry.trayBottom<=893&&geometry.sourceNavTabs===7,
      tool+' retains all seven source categories within the phone');
  }
  const compactRecipeAfter=await evaluate(
    'JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r")))');
  assert.deepEqual(compactRecipeAfter,compactRecipeBefore,
    'switching sparse/full editor tools must not mutate the artwork recipe');
  await evaluate('document.getElementById("mobileDismissHandle").click()');
  await waitFor('!document.body.classList.contains("mobile-edit-open")');
  assert.equal(await evaluate('document.getElementById("mobileActionDock").inert'),false);
  console.log('NAVIGATION_ONLY_COMPACT_TRAY',JSON.stringify({sparseTray,fullTray,
    gainedPreview:sparseTray.layoutHeight-fullTray.layoutHeight}));

  const boundaryViewports=[[499,892],[500,892],[790,892],[700,412],[791,892],[412,892]];
  const trialBoundaries=[];
  for(const [width,height] of boundaryViewports){
    await command('Emulation.setDeviceMetricsOverride',{
      width,height,deviceScaleFactor:1,mobile:true,screenWidth:width,screenHeight:height,
    });
    await delay(130);
    const state=await evaluate(`(()=>{
      const box=selector=>document.querySelector(selector)?.getBoundingClientRect();
      const dock=box('#mobileActionDock');
      const stage=box('.studio-stage');
      const frame=box('.wallpaper-frame');
      const scrollRail=document.querySelector('.mobile-preview-rail-left');
      let shortcutScroll=null;
      if(scrollRail){
        const originalScroll=scrollRail.scrollTop;
        scrollRail.scrollTop=scrollRail.scrollHeight;
        const lastShortcut=box('#mobileDownload');
        const railBounds=scrollRail.getBoundingClientRect();
        const lowerShortcutReachable=lastShortcut.top>=railBounds.top-2&&
          lastShortcut.bottom<=railBounds.bottom+2;
        shortcutScroll={
          overflow:getComputedStyle(scrollRail).overflowY,
          maxScroll:scrollRail.scrollHeight-scrollRail.clientHeight,
          lowerShortcutReachable
        };
        scrollRail.scrollTop=originalScroll;
      }
      return {mobile:document.body.classList.contains('mobile-studio'),
        dockStyle:getComputedStyle(document.getElementById('mobileActionDock')).display,
        buttons:document.querySelectorAll('#mobileActionDock>button').length,
        quickActionsConnected:['mobileFavorite','mobileDownload'].every(id=>
          document.getElementById(id)?.isConnected),
        dock:{left:dock.left,right:dock.right,top:dock.top,bottom:dock.bottom},
        shortcutHost:document.querySelector('.mobile-five-shortcuts')?.parentElement?.className||null,
        shortcutScroll,
        stageBottom:stage.bottom,frameHeight:frame.height};
    })()`);
    trialBoundaries.push({width,height,...state});
    console.log('FIVE_NAV_VIEWPORT',JSON.stringify({width,height,...state}));
    if(height<=620){
      assert.equal(state.shortcutScroll.overflow,'auto',
        'constrained landscape shortcut rail must remain vertically navigable');
      assert.ok(state.shortcutScroll.lowerShortcutReachable,
        'Download must be reachable by scrolling only the left shortcut rail');
    }
    assert.ok(state.quickActionsConnected,
      'responsive rail detachment must preserve both source action identities');
    if(width<=790){
      assert.ok(state.mobile&&state.dockStyle!=='none');
      assert.ok(state.shortcutHost?.includes('mobile-preview-rail-left'),
        'resizing back to mobile must remount the original source actions');
      assert.equal(state.buttons,5);
      assert.ok(state.dock.left>=-1&&state.dock.right<=width+1);
      assert.ok(state.dock.bottom<=height+1);
      assert.ok(state.stageBottom<=state.dock.top+2,
        'five-nav viewport stage overlaps bottom dock');
    }else{
      assert.equal(state.mobile,false,'791px must return to desktop shell');
      assert.equal(state.dockStyle,'none');
    }
    // Unlike the studio-only check above, test the *open* editor's camera,
    // real tool rail, tray and surviving dock actions at each mobile CSS
    // breakpoint. Landscape is deliberately constrained but not overlaid.
    if(width<=790){
      await evaluate('document.getElementById("mobileEdit").click()');
      await delay(245);
      const edit=await evaluate(`(()=>{
        const rect=selector=>document.querySelector(selector)?.getBoundingClientRect();
        const stage=rect('.studio-stage'),tray=rect('.sidebar'),
          layout=rect('.layout'),nav=rect('.settings-tabs'),
          strip=rect('.editor-tool-chooser'),
          card=rect('.editor-tool-card:not([hidden])');
        const sourceIds=['drawPathToggle','mobileFavorite','mobileDownload'];
        return {
          open:document.body.classList.contains('mobile-edit-open'),
          stageBottom:stage.bottom,trayTop:tray.top,
          stageHeight:stage.height,layoutHeight:layout.height,
          navVisible:nav.height>15,toolStripVisible:strip.height>12,
          cardVisible:card.height>12,
          trayRight:tray.right,trayLeft:tray.left,
          trayBottom:tray.bottom,
          sourceActionsConnected:sourceIds.every(id=>document.getElementById(id)?.isConnected),
          selection:document.querySelector('.editor-tool-tab[aria-pressed=true]')?.dataset.editorTool,
          dockRecessed:document.getElementById('mobileActionDock').getAttribute('aria-hidden')==='true',
          dockInert:document.getElementById('mobileActionDock').inert,
          hiddenDockNotFocusable:(()=>{
            const home=document.getElementById('mobileStudio');home.focus();
            const blocked=document.activeElement!==home;
            document.getElementById('mobileDismissHandle').focus();
            return blocked;
          })()
        };
      })()`);
      trialBoundaries.at(-1).edit=edit;
      assert.ok(edit.open&&edit.dockRecessed&&edit.dockInert&&edit.hiddenDockNotFocusable,
        'offscreen Edit dock must be hidden and inert, not keyboard-focusable');
      assert.ok(edit.sourceActionsConnected,'all source quick actions must survive Edit at this breakpoint');
      assert.ok(edit.stageHeight>25&&edit.layoutHeight>25,
        'Edit must reserve a positive preview viewport even in landscape');
      assert.ok(edit.stageBottom<=edit.trayTop+2,
        'Edit tray overlaps canvas at '+width+'×'+height);
      assert.ok(edit.navVisible&&edit.toolStripVisible&&edit.cardVisible&&edit.selection,
        'Edit must expose a selected source tool at '+width+'×'+height);
      assert.ok(edit.trayLeft>=-2&&edit.trayRight<=width+2&&edit.trayBottom<=height+1);
      if(width===499||width===500||width===790||height<=620)
        await captureUI('five-nav-edit-boundary-'+width+'x'+height);
      await evaluate('document.getElementById("mobileDismissHandle").click()');
      await delay(215);
      assert.equal(await evaluate('document.getElementById("mobileActionDock").inert'),false,
        'visible five-destination dock must regain normal focus after Edit closes');
      // More is a scrollable real sheet, not a synthetic element census.
      // Exercise its furthest-down camera pad at each boundary and the
      // constrained-height landscape. A JS click on an offscreen control
      // would be a false positive, so first verify a user could hit it.
      await evaluate('document.getElementById("mobileMore").click()');
      await waitFor('document.body.classList.contains("mobile-tools-open")');
      const moreReachability=await evaluate(`(async()=>{
        const sheet=document.getElementById('mobileToolsSheet');
        const dock=document.getElementById('mobileActionDock');
        const pad=sheet.querySelector('.mobile-more-group-body>.viewport-positioner');
        if(!pad)throw Error('Missing live viewport pan row in More');
        const actions=['up','left','reset','right','down'];
        const targets=[];
        for(const action of actions){
          const button=pad.querySelector('[data-view-pan="'+action+'"]');
          button.scrollIntoView({block:'center',behavior:'instant'});
          await new Promise(resolve=>requestAnimationFrame(resolve));
          const b=button.getBoundingClientRect();
          const s=sheet.getBoundingClientRect();
          const x=b.left+b.width/2,y=b.top+b.height/2;
          const hit=document.elementFromPoint(x,y);
          targets.push({action,width:b.width,height:b.height,
            withinSheet:x>=s.left&&x<=s.right&&y>=s.top&&y<=s.bottom,
            hit:hit===button||button.contains(hit),
            labelled:!!button.getAttribute('aria-label')});
        }
        const s=sheet.getBoundingClientRect(),d=dock.getBoundingClientRect();
        const groups=[...sheet.querySelectorAll('.mobile-more-group')];
        return {open:!sheet.hidden,sheet:{left:s.left,right:s.right,
          top:s.top,bottom:s.bottom},dockTop:d.top,
          scrollRange:sheet.scrollHeight-sheet.clientHeight,
          headings:groups.map(g=>g.querySelector('h3')?.textContent),
          originalPanConnected:pad.isConnected,
          targets};
      })()`);
      trialBoundaries.at(-1).more=moreReachability;
      assert.ok(moreReachability.open&&moreReachability.originalPanConnected);
      assert.ok(moreReachability.sheet.left>=-1&&moreReachability.sheet.right<=width+1);
      assert.ok(moreReachability.sheet.top>=-1&&
        moreReachability.sheet.bottom<=moreReachability.dockTop+1,
        'More sheet must stop above the five-destination dock at '+width+'×'+height);
      assert.ok(moreReachability.scrollRange>0,
        'More must scroll to expose lower source controls at '+width+'×'+height);
      assert.deepEqual(moreReachability.headings,
        ['Create & seed','Import, export & share','Position & design details']);
      assert.deepEqual(moreReachability.targets.map(x=>x.action),
        ['up','left','reset','right','down']);
      assert.ok(moreReachability.targets.every(x=>x.width>=34&&x.height>=34&&
        x.withinSheet&&x.hit&&x.labelled),
        'Camera controls must be scroll-reachable, hit-testable and named in More: '+
          width+'×'+height+' '+JSON.stringify(moreReachability));
      // Change the genuine serialized camera state without contaminating
      // composition position. Then recenter through the actual source pad.
      const beforeMorePan=await evaluate(
        'JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r")))');
      await evaluate('document.querySelector("[data-view-pan=right]").click()');
      await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).viewPanX==='+
        (beforeMorePan.viewPanX+5));
      const duringMorePan=await evaluate(
        'JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r")))');
      assert.equal(duringMorePan.positionX,beforeMorePan.positionX);
      assert.equal(duringMorePan.positionY,beforeMorePan.positionY);
      await evaluate('document.querySelector("[data-view-pan=reset]").click()');
      await waitFor('JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r"))).viewPanX===0');
      const afterMorePan=await evaluate(
        'JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("r")))');
      assert.equal(afterMorePan.viewPanY,0);
      assert.equal(afterMorePan.positionX,beforeMorePan.positionX);
      assert.equal(afterMorePan.positionY,beforeMorePan.positionY);
      if(width===499||width===500||width===790||height<=620)
        await captureUI('five-nav-more-boundary-'+width+'x'+height);
      await evaluate('document.getElementById("mobileToolsClose").click()');
      await waitFor('!document.body.classList.contains("mobile-tools-open")');
      console.log('MORE_PAN_BREAKPOINT',JSON.stringify({
        width,height,...moreReachability,deltaX:duringMorePan.viewPanX-beforeMorePan.viewPanX,
        recenteredX:afterMorePan.viewPanX,recenteredY:afterMorePan.viewPanY
      }));
    }
  }
  console.log('FIVE_DESTINATION_BREAKPOINTS',JSON.stringify(trialBoundaries));
  // A populated Explore gallery must survive visiting Saved without a reroll.
  await evaluate('document.getElementById("batch").click()');
  await waitFor('document.querySelectorAll("#gallery .thumb").length===12',12000);
  const firstExplore=await evaluate(`(()=>{
    const thumb=document.querySelector('#gallery .thumb');
    return {mode:document.getElementById('gallery').dataset.view,
      count:document.querySelectorAll('#gallery .thumb').length,
      caption:thumb?.textContent,
      seeds:[...document.querySelectorAll('#gallery .thumb')].map(card=>card.dataset.recipeSeed)};
  })()`);
  await evaluate('document.getElementById("mobileSaved").click()');
  await waitFor('document.getElementById("gallery").dataset.view==="saved"');
  await evaluate('document.getElementById("mobileExplore").click()');
  await waitFor('document.getElementById("gallery").dataset.view==="explore"&&document.querySelectorAll("#gallery .thumb").length===12',12000);
  const returnedExplore=await evaluate(`(()=>{
    const thumb=document.querySelector('#gallery .thumb');
    return {mode:document.getElementById('gallery').dataset.view,
      count:document.querySelectorAll('#gallery .thumb').length,
      caption:thumb?.textContent,
      seeds:[...document.querySelectorAll('#gallery .thumb')].map(card=>card.dataset.recipeSeed)};
  })()`);
  assert.deepEqual(returnedExplore,firstExplore,
    'Saved visits must preserve the previous Explore contact sheet');
  console.log('FIVE_DESTINATION_POPULATED_GALLERY_ROUNDTRIP',JSON.stringify(returnedExplore));




  // Follow actual tab/chip clicks across every reachable source structure.
  // Tonal is a separately noted legacy import state: its option is hidden and
  // disabled in the shipping form, so this MUST NOT claim 40/40 user reachability.
  const interactionCensus=await evaluate(`(()=>{
    document.getElementById('mobileEdit').click();
    if(document.getElementById('controls').classList.contains('editor-focus-active'))
      document.querySelector('.editor-focus-all').click();
    const structure=document.querySelector('[name=structure]');
    const construction=document.querySelector('[name=construction]');
    const regionMode=document.querySelector('[name=regionMode]');
    construction.value='ribbon'; // Tonal is deliberately hidden/disabled.
    construction.dispatchEvent(new Event('change',{bubbles:true}));
    const failures=[],reached=new Set(),perScene={};
    for(const [scene,region] of [
      ['paths','voronoi'],['radial','voronoi'],
      ['regions','voronoi'],['regions','nested']
    ]){
      structure.value=scene;
      structure.dispatchEvent(new Event('change',{bubbles:true}));
      if(scene==='regions'){
        regionMode.value=region;
        regionMode.dispatchEvent(new Event('change',{bubbles:true}));
      }
      const sceneKey=scene==='regions'?scene+'-'+region:scene;
      perScene[sceneKey]=[];
      for(const tab of document.querySelectorAll('.settings-tab[data-tab]')){
        if(tab.disabled)continue;
        tab.click();
        const available=[...document.querySelectorAll('.editor-tool-chooser [data-editor-tool]')]
          .filter(chip=>!chip.hidden&&!chip.disabled);
        for(const chip of available){
          chip.scrollIntoView({block:'nearest',inline:'nearest'});
          chip.click();
          const category=tab.dataset.tab,tool=chip.dataset.editorTool;
          const card=document.querySelector('.editor-tool-card[data-editor-tool="'+tool+'"]');
          const current=document.querySelector('.settings-tab[aria-selected="true"]');
          const ok=card&&!card.hidden&&getComputedStyle(card).display!=='none'&&
            card.getBoundingClientRect().height>0&&
            chip.getAttribute('aria-pressed')==='true'&&
            current?.dataset.tab===category;
          if(!ok)failures.push(sceneKey+':'+category+'/'+tool);
          else{
            reached.add(category+'/'+tool);
            perScene[sceneKey].push(category+'/'+tool);
          }
        }
      }
    }
    const tonalOption=document.querySelector('[name=construction] option[value=tonal]');
    return {reached:[...reached].sort(),perScene,failures,
      legacyTonalHidden:!!tonalOption?.hidden&&!!tonalOption?.disabled,
      toneSourceCard:!!document.querySelector('.editor-tool-card[data-editor-tool=tone]')};
  })()`);
  assert.deepEqual(interactionCensus.failures,[]);
  assert.equal(interactionCensus.reached.length,39,
    '39 enabled source tools must be accessible through real category/chip selection');
  assert.ok(interactionCensus.legacyTonalHidden&&interactionCensus.toneSourceCard,
    '40th named tool is a preserved legacy tonal state, not a visible user choice');
  assert.ok(!interactionCensus.reached.includes('stripes/tone'));
  console.log('EDITOR_INTERACTIVE_TOOL_MATRIX',JSON.stringify(interactionCensus));
  // The seven rainbow accents are randomly shuffled once per tool panel,
  // but must NOT reshuffle when a user navigates away and back. Verify live
  // source slider nodes rather than an illustrative colour palette.
  const rainbowStability=await evaluate(`(()=>{
    const panels=[...document.querySelectorAll('#controls .editor-tool-card')];
    const read=()=>new Map(panels.map(panel=>[
      panel.dataset.editorTool,
      [...panel.querySelectorAll('input[type=range]')].map((slider,i)=>({
        key:slider.dataset.rainbowKey||slider.name||slider.id||'slot-'+i,
        colour:slider.style.getPropertyValue('--roygbiv-slider-color').trim()
      }))
    ]));
    const before=read();
    for(const tab of document.querySelectorAll('.settings-tab[data-tab]')){
      if(tab.disabled)continue;
      tab.click();
      for(const chip of document.querySelectorAll('.editor-tool-chooser [data-editor-tool]')){
        if(!chip.hidden&&!chip.disabled)chip.click();
      }
    }
    const after=read(),failures=[],hues=new Set();let ranges=0;
    for(const [tool,values] of before){
      if(!values.length)continue;
      ranges+=values.length;
      const assigned=values.map(x=>x.colour);
      if(assigned.some(x=>!x))failures.push(tool+':unassigned');
      if(new Set(assigned).size!==assigned.length)failures.push(tool+':duplicate');
      for(const x of assigned)hues.add(x);
      if(JSON.stringify(values)!==JSON.stringify(after.get(tool)))
        failures.push(tool+':reshuffled');
    }
    const source=document.querySelector('.editor-tool-card[data-editor-tool=finish1] input[type=range]');
    const accentColour=source?getComputedStyle(source).accentColor:'';
    return {panels:before.size,ranges,distinctTracks:hues.size,accentColour,failures};
  })()`);
  assert.deepEqual(rainbowStability.failures,[]);
  assert.ok(rainbowStability.ranges>=20&&rainbowStability.distinctTracks>=4,
    'live panels must show several distinct accents from the full seven-colour family');
  assert.notEqual(rainbowStability.accentColour,'auto',
    'the actual Material Finish slider must use the computed palette accent');
  console.log('ROYGBIV_SLIDER_NAVIGATION_STABILITY',JSON.stringify(rainbowStability));
  const chooserSearch=await evaluate(`(()=>{
    if(document.getElementById('controls').classList.contains('editor-focus-active'))
      document.querySelector('.editor-focus-all').click();
    document.getElementById('tab-material').click();
    const rail=document.querySelector('.editor-tool-chooser');
    const max=rail.scrollWidth-rail.clientWidth;
    rail.scrollLeft=Math.min(70,max);
    const start=rail.scrollLeft;
    document.querySelector('.editor-tool-tab[data-editor-tool=layer2]').click();
    const afterTap=rail.scrollLeft;
    document.querySelector('.editor-search-toggle').click();
    const input=document.querySelector('.editor-search-input');
    input.value='layer 3 rotation';
    input.dispatchEvent(new Event('input',{bubbles:true}));
    const chip=rail.querySelector('.editor-tool-tab[aria-pressed=true]');
    const a=rail.getBoundingClientRect(),c=chip?.getBoundingClientRect();
    const focus=rail.querySelector('.editor-focus-toggle');
    const inset=focus&&getComputedStyle(focus).display!=='none'?focus.getBoundingClientRect().width:0;
    const visible=!!c&&c.left>=a.left+inset-3&&c.right<=a.right+3;
    const human=chip?.dataset.editorTool;
    input.value='textureRotation3';input.dispatchEvent(new Event('input',{bubbles:true}));
    const legacy=rail.querySelector('.editor-tool-tab[aria-pressed=true]')?.dataset.editorTool;
    document.querySelector('.editor-search-close').click();
    return {max,start,afterTap,visible,human,legacy};
  })()`);
  assert.ok(chooserSearch.max>5&&chooserSearch.start>5);
  assert.ok(Math.abs(chooserSearch.afterTap-chooserSearch.start)<=2,'manual tool taps preserve scroll');
  assert.ok(chooserSearch.visible&&chooserSearch.human==='finish3','search reveals source-named rotation tool');
  assert.equal(chooserSearch.legacy,'finish3');
  console.log('TOOL_STRIP_MANUAL_SCROLL_AND_SOURCE_SEARCH',JSON.stringify(chooserSearch));
  // A disabling geometry must DISPLAY zero but never overwrite the real
  // source recipe values. This is a visual/state promise from the user,
  // not an invitation to normalize inactive shape parameters to zero.
  await evaluate(`(()=>{
    const form=document.getElementById('controls');
    const choose=(name,value)=>{
      const field=form.elements.namedItem(name);field.value=value;
      field.dispatchEvent(new Event('change',{bubbles:true}));
    };
    choose('structure','paths');
    choose('geometry','zigzag');
    choose('shapeFrequency','61');
    choose('shapeDepth','79');
  })()`);
  await waitFor('(()=>{const r=new URLSearchParams(location.search).get("r");if(!r)return false;const a=JSON.parse(decodeURIComponent(r));return a.geometry==="zigzag"&&a.shapeFrequency===61&&a.shapeDepth===79})()',15000);
  await evaluate(`(()=>{
    const field=document.querySelector('[name=geometry]');
    field.value='straight';field.dispatchEvent(new Event('change',{bubbles:true}));
    document.getElementById('tab-path').click();
    document.querySelector('.editor-tool-tab[data-editor-tool=geometry]').click();
  })()`);
  await waitFor('document.querySelector("[name=shapeDepth]").dataset.inactive==="true"');
  const inactiveShapes=await evaluate(`(()=>{
    const names=['shapeFrequency','shapeDepth'];
    const fields=Object.fromEntries(names.map(key=>{
      const input=document.querySelector('[name='+key+']');
      const numeric=document.querySelector('[data-number-for='+key+']');
      return [key,{value:input.value,disabled:input.disabled,
        inactive:input.dataset.inactive,numeric:numeric?.value||null,
        hostInactive:!!input.closest('.setting-inactive')}];
    }));
    const rgb=value=>(value.match(/[0-9.]+/g)||[]).slice(0,3).map(Number);
    const lum=value=>rgb(value).map(x=>x/255).map(x=>
      x<=.04045?x/12.92:((x+.055)/1.055)**2.4)
      .reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0);
    const contrast=(a,b)=>{
      const x=lum(a),y=lum(b);
      return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
    };
    // Rows can be transparent over their parent card. Contrast requires the
    // actual opaque backing surface, not transparent black (rgba(0,0,0,0)).
    const backdrop=element=>{
      for(let node=element;node;node=node.parentElement){
        const colour=getComputedStyle(node).backgroundColor;
        const channels=(colour.match(/[0-9.]+/g)||[]).map(Number);
        if(channels.length>=3&&(channels.length<4||channels[3]>=.995))
          return colour;
      }
      throw Error('No opaque row backing surface found');
    };
    const originalTheme=document.documentElement.dataset.theme;
    const readability={};
    for(const theme of ['cream','dark']){
      document.querySelector('[data-studio-theme="'+theme+'"]').click();
      const input=document.querySelector('[name=shapeFrequency]');
      const row=input.closest('.setting-inactive');
      const field=row.querySelector('.field')||row;
      const numeric=document.querySelector('[data-number-for=shapeFrequency]');
      const hostStyle=getComputedStyle(row);
      const labelStyle=getComputedStyle(field);
      const numberStyle=getComputedStyle(numeric);
      readability[theme]={
        opacity:hostStyle.opacity,filter:hostStyle.filter,
        labelContrast:contrast(labelStyle.color,backdrop(field)),
        numberContrast:contrast(numberStyle.webkitTextFillColor,numberStyle.backgroundColor),
        numberOpacity:numberStyle.opacity,
      };
    }
    document.querySelector('[data-studio-theme="'+originalTheme+'"]').click();
    const recipe=JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('r')));
    return {fields,stored:{shapeFrequency:recipe.shapeFrequency,shapeDepth:recipe.shapeDepth},readability};
  })()`);
  for(const [name,stored] of [['shapeFrequency',61],['shapeDepth',79]]){
    const visible=inactiveShapes.fields[name];
    assert.ok(visible.disabled&&visible.inactive==='true'&&visible.hostInactive);
    assert.equal(visible.value,'0','inactive range must visibly display zero');
    if(visible.numeric!==null)assert.equal(visible.numeric,'0');
    assert.equal(inactiveShapes.stored[name],stored,'inactive recipe value must survive');
  }
  for(const [theme,metrics] of Object.entries(inactiveShapes.readability)){
    assert.equal(metrics.opacity,'1',theme+' inactive row must remain legible');
    assert.equal(metrics.filter,'none',theme+' must retain its true theme colours');
    assert.ok(metrics.labelContrast>=4.5,theme+' inactive label AA contrast: '+JSON.stringify(metrics));
    assert.ok(metrics.numberContrast>=4.5,theme+' zero-value AA contrast: '+JSON.stringify(metrics));
    assert.equal(metrics.numberOpacity,'1',theme+' zero-value field remains opaque');
  }
  await captureUI('straight-path-inactive-zero-values');
  await evaluate(`(()=>{
    const field=document.querySelector('[name=geometry]');
    field.value='zigzag';field.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await waitFor('document.querySelector("[name=shapeFrequency]").dataset.inactive==="false"');
  const restoredShapes=await evaluate(`(()=>{
    const r=JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('r')));
    return {frequency:document.querySelector('[name=shapeFrequency]').value,
      depth:document.querySelector('[name=shapeDepth]').value,
      frequencyEnabled:!document.querySelector('[name=shapeFrequency]').disabled,
      depthEnabled:!document.querySelector('[name=shapeDepth]').disabled,
      storedFrequency:r.shapeFrequency,storedDepth:r.shapeDepth};
  })()`);
  assert.deepEqual(restoredShapes,{frequency:'61',depth:'79',
    frequencyEnabled:true,depthEnabled:true,storedFrequency:61,storedDepth:79});
  console.log('CONDITIONAL_ZERO_PRESERVES_SOURCE_RECIPE',JSON.stringify({inactiveShapes,restoredShapes}));
  // The real 412px atlas found Layer 1 rotation almost white on cream,
  // even after generic inactive-row repair. Its caption is a direct span,
  // not the .field label tested by the Shape frequency/depth acceptance.
  const rotationReadability=await evaluate(`(()=>{
    const set=(key,value)=>{
      const field=document.querySelector('[name="'+key+'"]');
      field.value=value;field.dispatchEvent(new Event('change',{bubbles:true}));
    };
    const parts=css=>(css.match(/[0-9.]+/g)||[]).map(Number);
    const lum=css=>parts(css).slice(0,3).map(v=>v/255).map(c=>
      c<=.04045?c/12.92:((c+.055)/1.055)**2.4)
      .reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0);
    const contrast=(a,b)=>{
      const x=lum(a),y=lum(b);
      return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
    };
    const backdrop=element=>{
      for(let el=element;el;el=el.parentElement){
        const value=getComputedStyle(el).backgroundColor;
        const c=parts(value);
        if(c.length>=3&&(c.length===3||c[3]>=.995))return value;
      }
      throw Error('No opaque backdrop for rotation caption');
    };
    const inspect=()=>{
      const input=document.querySelector('[name=textureRotation]');
      const row=input.closest('.texture-rotation-field');
      const label=row.querySelector(':scope > span');
      if(!label)throw Error('Missing layer 1 rotation source label');
      return {contrast:contrast(getComputedStyle(label).color,backdrop(label)),
        disabled:input.disabled,zero:input.value==='0',
        inactive:row.classList.contains('setting-inactive'),
        opacity:getComputedStyle(row).opacity};
    };
    const originalTheme=document.documentElement.dataset.theme;
    set('material','linen');
    set('textureStrength','65');
    const active={};
    for(const theme of ['cream','dark']){
      document.querySelector('[data-studio-theme="'+theme+'"]').click();
      active[theme]=inspect();
    }
    set('material','none');
    const inactive={};
    for(const theme of ['cream','dark']){
      document.querySelector('[data-studio-theme="'+theme+'"]').click();
      inactive[theme]=inspect();
    }
    document.querySelector('[data-studio-theme="'+originalTheme+'"]').click();
    return {active,inactive};
  })()`);
  for(const theme of ['cream','dark']){
    const active=rotationReadability.active[theme];
    const inactive=rotationReadability.inactive[theme];
    assert.ok(active.contrast>=4.5&&!active.inactive&&!active.disabled,
      theme+' active material rotation caption must remain readable: '+JSON.stringify(active));
    assert.ok(inactive.contrast>=4.5&&inactive.inactive&&inactive.disabled&&inactive.zero,
      theme+' inactive material rotation caption and 0-value must remain readable: '+
      JSON.stringify(inactive));
    assert.equal(inactive.opacity,'1',theme+' inactive rotation row must remain opaque');
  }
  console.log('MATERIAL_ROTATION_LABEL_CONTRAST',JSON.stringify(rotationReadability));
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
