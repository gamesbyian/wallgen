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
  assert.ok(phone.dock.height<=55,'normal bottom toolbar should be shorter');
  assert.ok(phone.dock.y>=phone.header.bottom,'normal dock does not collide with the header');
  await evaluate('document.getElementById("mobileEdit").click()');
  await waitFor(`(()=>{
    const stage=document.querySelector('.studio-stage').getBoundingClientRect();
    const sidebar=document.querySelector('.sidebar').getBoundingClientRect();
    const dock=document.querySelector('.mobile-dock').getBoundingClientRect();
    return document.body.classList.contains('mobile-edit-open') &&
      stage.bottom<=sidebar.top+2 && sidebar.bottom<=innerHeight+1 &&
      dock.left>=innerWidth-2 &&
      getComputedStyle(document.querySelector('.mobile-dock')).visibility==='hidden' &&
      document.querySelector('.masthead').getBoundingClientRect().bottom<=0;
  })()`);
  const editor=await evaluate(`(()=>({
    open:document.body.classList.contains('mobile-edit-open'),
    visible:document.querySelector('.sidebar').getBoundingClientRect().top<innerHeight,
    tabs:[...document.querySelectorAll('.settings-tab')].map(x=>x.textContent.trim())
  }))()`);
  assert.ok(editor.open&&editor.visible);
  assert.equal(editor.tabs.length,4);
  const editing=await evaluate(`(()=>{
    const bounds=s=>{const r=document.querySelector(s).getBoundingClientRect();
      return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height}};
    return {preview:bounds('.wallpaper-frame'),stage:bounds('.studio-stage'),
      sidebar:bounds('.sidebar'),dock:bounds('.mobile-dock'),
      header:bounds('.masthead'),arrow:bounds('#mobileDockExpand'),
      dockHidden:getComputedStyle(document.querySelector('.mobile-dock')).visibility==='hidden',
      arrowVisible:getComputedStyle(document.getElementById('mobileDockExpand')).display==='flex',
      headerHidden:bounds('.masthead').bottom<=0,
      narrowRandomize:document.getElementById('randomizeAll').getBoundingClientRect().width<=46,
      narrowTabs:document.querySelector('.settings-tabs').getBoundingClientRect().height<=29,
      noDimmer:getComputedStyle(document.getElementById('mobileSheetBackdrop')).display==='none',
      nonmodal:document.getElementById('mobileDesignSheet').getAttribute('aria-modal')===null,
      scrollable:getComputedStyle(document.getElementById('mobileDesignSheet')).overflowY==='hidden',
      totalHeight:document.documentElement.scrollHeight,
      tabsVisible:document.querySelector('.settings-tabs').getBoundingClientRect().bottom<=innerHeight};
  })()`);
  console.log('EDITING_LAYOUT_METRICS',JSON.stringify(editing));
  assert.ok(editing.preview.height>640,'editing must preserve a nearly full-height phone wallpaper');
  assert.ok(editing.preview.bottom<=editing.sidebar.top+2,'editing controls must not overlap the wallpaper');
  assert.ok(editing.stage.bottom<=editing.sidebar.top+2,'reserved layout must keep stage above the panel');
  assert.ok(editing.sidebar.bottom<=915+1,'settings replace the dock without leaving the screen');
  assert.ok(editing.sidebar.top>=editing.stage.bottom,'editor must use its own space');
  assert.ok(editing.headerHidden && editing.dockHidden && editing.arrowVisible,
    'header and toolbar must recede leaving the expand arrow');
  assert.ok(editing.arrow.left>editing.sidebar.left+editing.sidebar.width-2 &&
    editing.arrow.right<=412+1,'expand arrow lives beside the editor');
  assert.ok(editing.narrowRandomize&&editing.narrowTabs,'toolbar texts should be compact');
  assert.ok(editing.noDimmer&&editing.nonmodal&&editing.scrollable&&editing.tabsVisible);
  assert.ok(editing.stage.top<=10,'header must release its vertical space');
  assert.ok(editing.totalHeight<=915,'opening edit must not introduce page scrolling');
  // Changing a real setting must repaint the *visible* canvas without closing the tray.
  await evaluate(`(()=>{
    const canvas=document.getElementById('preview');
    window.__wallpaperBefore=canvas.toDataURL();
    const input=document.querySelector('input[name="stripeWidth"]');
    input.value=input.value==='90'?'11':'90';
    input.dispatchEvent(new Event('input',{bubbles:true}));
  })()`);
  await waitFor(`document.getElementById('preview').toDataURL()!==window.__wallpaperBefore`,16000);
  assert.ok(await evaluate('document.body.classList.contains("mobile-edit-open")'));
  // Full-fidelity controls, including portable reverse order and diagonal
  // transforms, must be reachable in the small no-scroll phone editor.
  await evaluate('window.__reverseBefore=document.getElementById("preview").toDataURL()');
  await evaluate('document.querySelector("[name=reverseStripes]").click()');
  await waitFor('document.getElementById("preview").toDataURL()!==window.__reverseBefore',16000);
  assert.ok(await evaluate('document.querySelector("[name=reverseStripes]").checked'));
  await evaluate(`(()=>{
    const direction=document.querySelector('[name=orientation]');
    direction.value='diagonal';
    direction.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await waitFor(`!document.getElementById('diagonalSettings').hidden`);
  assert.ok(await evaluate(`(()=>{
    const card=[...document.querySelectorAll('.mobile-setting-cluster')]
      .find(el=>el.dataset.group==='Diagonal transform');
    return card&&!card.hidden&&card.querySelector('[name=diagonalRotation]') &&
      card.querySelector('[name=mirrorHorizontal]')&&card.querySelector('[name=mirrorVertical]') &&
      card.scrollHeight<=card.clientHeight+2;
  })()`),'all three diagonal controls must be on one fully visible card');
  await evaluate('window.__rotationBefore=document.getElementById("preview").toDataURL()');
  await evaluate(`(()=>{
    const slider=document.querySelector('[name=diagonalRotation]');
    slider.value='48';slider.dispatchEvent(new Event('input',{bubbles:true}));
  })()`);
  await waitFor(`document.getElementById('preview').toDataURL()!==window.__rotationBefore`,16000);
  await evaluate('document.querySelector("[name=mirrorHorizontal]").click()');
  assert.ok(await evaluate('document.querySelector("[name=mirrorHorizontal]").checked'));
  await evaluate('document.querySelector("[name=mirrorVertical]").click()');
  assert.ok(await evaluate('document.querySelector("[name=mirrorVertical]").checked'));
  await evaluate(`(()=>{
    const direction=document.querySelector('[name=orientation]');
    direction.value='vertical';direction.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await waitFor(`document.getElementById('diagonalSettings').hidden`);
  await evaluate(`(()=>{
    const direction=document.querySelector('[name=orientation]');
    direction.value='diagonal';direction.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await waitFor(`!document.getElementById('diagonalSettings').hidden`);
  // Actual fields are now horizontal cards, not a tall scrolling list.
  const rail=await evaluate(`(()=>{
    const p=document.getElementById('panel-design');
    const tab=document.querySelector('.settings-tabs');
    const position=document.getElementById('mobileSettingPosition');
    return {
      overflowX:getComputedStyle(p).overflowX, overflowY:getComputedStyle(p).overflowY,
      snap:getComputedStyle(p).scrollSnapType, width:p.clientWidth,
      scrollWidth:p.scrollWidth,
      tabsVisible:tab.getBoundingClientRect().bottom<p.getBoundingClientRect().top,
      count:position.textContent.trim(),
      noHeading:getComputedStyle(document.getElementById('mobileDismissHandle')).display!=='none',
      removed:!document.getElementById('mobilePreviewSpace')&&!document.getElementById('mobileDesignClose')
    };
  })()`);
  console.log('SWIPE_RAIL_METRICS',JSON.stringify(rail));
  assert.ok(rail.scrollWidth>rail.width*4,'settings must lay out horizontally');
  assert.equal(rail.overflowX,'auto');assert.equal(rail.overflowY,'hidden');
  assert.ok(rail.snap.includes('mandatory')&&rail.tabsVisible&&rail.noHeading&&rail.removed);
  // Related modifiers must be on the SAME swipe card as their parent.
  // Every active card and its actual controls must be fully visible, with
  // no internal vertical scrolling, including Colour and Texture categories.
  const groups=await evaluate(`(()=>{
    const entries=[
      ['Geometry',['geometry','shapeFrequency','shapeDepth']],
      ['Path details',['turnRadius','hairpinAngle']],
      ['Stripe pattern',['motif','patternHomogeneity']],
      ['Stripe shadows',['stripeShadowEnabled','stripeShadowStrength','stripeShadowSoftness','stripeShadowDirection']],
      ['Outlines',['outline','gap']],
      ['Canvas lighting',['lightingMood','lightDirection','lightStrength','shadowStrength']],
      ...[1,2,3].flatMap(n=>[
        ['Texture '+n+' material',['material','textureCoverage','textureBlend'].map(k=>k+(n===1?'':n))],
        ['Texture '+n+' finish',['textureStrength','textureScale','textureRotation'].map(k=>k+(n===1?'':n))]
      ]),
      ['Individuality',['individuality','overridePatternHomogeneity']]
    ];
    return entries.map(([name,fields])=>{
      const card=[...document.querySelectorAll('.mobile-setting-cluster')].find(x=>x.dataset.group===name);
      return {name,panel:card?.closest('.settings-panel')?.id,
        fields:fields.map(key=>!!card?.querySelector('[name="'+key+'"]'))};
    });
  })()`);
  console.log('CONTEXTUAL_CARDS',JSON.stringify(groups));
  for(const item of groups){
    assert.ok(item.fields.every(Boolean),item.name+' missing dependent controls');
  }
  const steppers=await evaluate(`(()=>{
    const nodes=[...document.querySelectorAll('.mobile-setting-cluster:not([hidden]) input[type=range]')];
    return nodes.map(input=>{
      const stepper=input.closest('.stepper'),style=stepper&&getComputedStyle(stepper.querySelector('.step-button'));
      return {name:input.name,buttons:stepper?.querySelectorAll('.step-button').length,
        display:style?.display,visible:input.getClientRects().length>0,
        rect:stepper?.querySelector('.step-button').getBoundingClientRect().width||0};
    });
  })()`);
  console.log('STEPPER_FAIL_DIAGNOSTIC',JSON.stringify(
    steppers.filter(x=>x.buttons!==2||x.display==='none'||(x.visible&&x.rect<18))
  ));
  assert.ok(steppers.length>20,'enough sliders for comprehensive stepper audit');
  assert.ok(steppers.every(x=>x.buttons===2&&x.display!=='none'&&(!x.visible||x.rect>=18)),
    'every swipe-card slider shows both minus and plus buttons');
  console.log('ALL_MOBILE_STEPPERS_VISIBLE',steppers.length);

  const previewTools=await evaluate(`(()=>{
    const stage=document.querySelector('.studio-stage');
    const prime=document.querySelector('[name=primesOnly]');
    return {
      left:!!stage.querySelector('.mobile-preview-rail-left #randomizeAll'),
      right:!!stage.querySelector('.mobile-preview-rail-right .nudge-pad'),
      nudgeButtons:stage.querySelectorAll('[data-nudge]').length,
      zoomButtons:stage.querySelectorAll('.mobile-zoom-button').length,
      formOwner:prime.form?.id,
      tabDecoration:getComputedStyle(document.getElementById('tab-design')).backgroundColor,
      activeBorder:getComputedStyle(document.getElementById('tab-design')).borderBottomWidth,
    };
  })()`);
  assert.ok(previewTools.left&&previewTools.right);
  assert.equal(previewTools.nudgeButtons,5);
  assert.equal(previewTools.zoomButtons,2);
  assert.equal(previewTools.formOwner,'controls');
  assert.equal(previewTools.activeBorder,'2px');
  assert.ok(await evaluate('document.getElementById("primeModeHint").hidden'));
  await evaluate('document.querySelector("[name=primesOnly]").click()');
  assert.ok(await evaluate('document.getElementById("primeModeHint").hidden'));
  assert.ok(await evaluate('document.querySelector("[name=primesOnly]").checked'));
  // Toggling Primes must reach the recipe, despite the original checkbox now
  // living outside the <form> element's DOM subtree.
  await evaluate('document.getElementById("randomizeAll").click()');
  const primeDraw=await evaluate(`(()=>{
    const percentages=['shapeFrequency','shapeDepth','stripeWidth','spread'];
    return {checked:document.querySelector('[name=primesOnly]').checked,
      values:percentages.map(k=>({
        value:Number(document.querySelector('[name="'+k+'"]').value),
        inactive:document.querySelector('[name="'+k+'"]').dataset.inactive==='true'
      }))};
  })()`);
  const isPrime=n=>Number.isInteger(n)&&n>=2&&
    Array.from({length:Math.max(0,Math.floor(Math.sqrt(n))-1)},(_,i)=>i+2)
      .every(d=>n%d!==0);
  assert.ok(primeDraw.checked&&primeDraw.values.every(x=>
    x.inactive?x.value===0:isPrime(x.value)),
    'randomized percentages should use primes when the moved toggle is selected');
  assert.ok(await evaluate('document.body.classList.contains("mobile-edit-open")'),
    'preview-side Randomize must keep the editor open');
  const originalImage=await evaluate('document.getElementById("preview").toDataURL()');
  await evaluate('document.querySelector("[data-zoom=in]").click()');
  assert.equal(await evaluate('document.querySelector(".studio-stage").style.getPropertyValue("--mobile-preview-zoom")'),'1.1');
  assert.equal(await evaluate('document.getElementById("preview").toDataURL()'),originalImage,
    'zooming should only magnify the preview, never modify wallpaper pixels');
  await evaluate('document.querySelector("[data-zoom=out]").click()');
  assert.equal(await evaluate('document.querySelector(".studio-stage").style.getPropertyValue("--mobile-preview-zoom")'),'1');
  await evaluate('document.querySelector("[data-zoom=out]").click()');
  assert.equal(await evaluate('document.querySelector(".studio-stage").style.getPropertyValue("--mobile-preview-zoom")'),'0.9');
  assert.equal(await evaluate('document.getElementById("preview").toDataURL()'),originalImage);
  for(let i=0;i<4;i++)await evaluate('document.querySelector("[data-zoom=out]").click()');
  assert.equal(await evaluate('document.querySelector(".studio-stage").style.getPropertyValue("--mobile-preview-zoom")'),'0.5');
  assert.ok(await evaluate('document.querySelector("[data-zoom=out]").disabled'),
    'the very first wallpaper can zoom out to 50%');
  for(let i=0;i<5;i++)await evaluate('document.querySelector("[data-zoom=in]").click()');
  await evaluate('document.querySelector(".studio-stage [data-nudge=right]").click()');
  assert.ok((await evaluate('document.getElementById("positionStatus").textContent')).includes('X +1%'));
  await evaluate('document.querySelector(".studio-stage [data-nudge=reset]").click()');

  // All nonhidden cards must have *no* vertical scroll or clipped controls.
  const auditCards=async()=>evaluate(`(()=>{
    const p=document.querySelector('.settings-panel:not([hidden])');
    const cards=[...p.querySelectorAll('.mobile-setting-cluster:not([hidden])')];
    return cards.map(card=>({panelHeight:p.clientHeight,formHeight:document.getElementById('controls').clientHeight,
      formRect:JSON.stringify(document.getElementById('controls').getBoundingClientRect().toJSON()),
      formDisplay:getComputedStyle(document.getElementById('controls')).display,
      formPosition:getComputedStyle(document.getElementById('controls')).position,
      formFlex:getComputedStyle(document.getElementById('controls')).flex,
      formTop:getComputedStyle(document.getElementById('controls')).top,
      formBottom:getComputedStyle(document.getElementById('controls')).bottom,
      formParent:document.getElementById('controls').parentElement.id,
      formHidden:document.getElementById('controls').hidden,
      sidebarDisplay:getComputedStyle(document.querySelector('.sidebar')).display,
      sidebarRect:JSON.stringify(document.querySelector('.sidebar').getBoundingClientRect().toJSON()),
      navHeight:document.querySelector('.settings-tabs').clientHeight,
      panelStyle:getComputedStyle(p).flex,
      name:card.dataset.group,
      clientHeight:card.clientHeight,scrollHeight:card.scrollHeight,
      overflow:getComputedStyle(card).overflowY,
      controlOverflow:[...card.querySelectorAll('select,input:not([type=hidden]),button')].filter(el=>{
        if(el.closest('[hidden]')||el.offsetParent===null)return false;
        const c=card.getBoundingClientRect(),r=el.getBoundingClientRect();
        return r.top<c.top-2||r.bottom>c.bottom+2;
      }).map(el=>el.name||el.id||el.tagName)
    }));
  })()`);
  for(const category of ['design','colour','textures','refine']){
    await evaluate(`document.getElementById('tab-${category}').click()`);
    await delay(250);
    const audited=await auditCards();
    console.log('NO_VERTICAL_CARDS',category,JSON.stringify(audited));
    for(const card of audited){
      assert.ok(card.scrollHeight<=card.clientHeight+2,category+' '+card.name+' has vertical overflow');
      assert.equal(card.overflow,'hidden',category+' '+card.name+' can vertically scroll');
      assert.deepEqual(card.controlOverflow,[],category+' '+card.name+' clips controls');
    }
  }
  await evaluate('document.getElementById("tab-design").click()');
  await delay(280);

  // Programmatic scroll tests the native snap strip and progress indicator.
  await evaluate('document.getElementById("panel-design").scrollTo({left:document.getElementById("panel-design").clientWidth+8,behavior:"instant"})');
  await waitFor('document.getElementById("mobileSettingPosition").textContent.startsWith("2 /")');
  const pos2=await evaluate('document.getElementById("mobileSettingPosition").textContent');
  assert.match(pos2,/^2 \/ /);
  // Category changes reset to the first card and leave the canvas visible.
  await evaluate('document.getElementById("tab-textures").click()');
  await waitFor('document.getElementById("panel-textures").hidden===false');
  const textures=await evaluate(`(()=>{
    const el=document.getElementById('panel-textures');
    return {scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,
      material:!!el.querySelector('[name="material"]'),
      layer2:!!document.getElementById('textureLayer2Panel'),
      layer3:!!document.getElementById('textureLayer3Panel'),
      vertical:getComputedStyle(document.getElementById('mobileDesignSheet')).overflowY,
      previewVisible:document.querySelector('.studio-stage').getBoundingClientRect().bottom<
        document.getElementById('mobileDesignSheet').getBoundingClientRect().top};
  })()`);
  assert.ok(textures.scrollWidth>textures.clientWidth*1.5 && textures.material && textures.layer2 && textures.layer3,
    'texture panel should contain a layer card plus displacement card, not one card per slider');
  assert.equal(textures.vertical,'hidden');assert.ok(textures.previewVisible);
  await evaluate('document.getElementById("addTextureLayer2").click()');
  await waitFor('document.getElementById("textureLayer2Panel").hidden===false');
  assert.ok(await evaluate(`(()=>{
    const card=[...document.querySelectorAll('.mobile-setting-cluster')]
      .find(el=>el.dataset.group==='Texture 2 material');
    return !card?.hidden && card?.getBoundingClientRect().width>80 &&
      card?.querySelector('[name=material2]') &&
      getComputedStyle(card).display!=='none';
  })()`),'enabled texture layer and all associated controls should appear on one card');
  const textureExpansion=await evaluate(`(()=>{
    const cards=[...document.querySelectorAll('.mobile-setting-cluster')]
      .filter(el=>el.dataset.group.startsWith('Texture 2')&&!el.hidden);
    return cards.map(el=>({name:el.dataset.group,client:el.clientHeight,
      scroll:el.scrollHeight,
      visible:([...el.querySelectorAll('select,input,button')].filter(node=>{
        if(node.closest('[hidden]')||node.offsetParent===null)return false;
        const r=node.getBoundingClientRect(),c=el.getBoundingClientRect();
        return r.top>=c.top-2&&r.bottom<=c.bottom+2;
      })).length}));
  })()`);
  console.log('EXPANDED_TEXTURE_CARD',JSON.stringify(textureExpansion));
  assert.equal(textureExpansion.length,2);
  for(const card of textureExpansion)assert.ok(card.scroll<=card.client+2,card.name+' must fit completely');

  await evaluate('document.getElementById("tab-design").click()');
  await evaluate(`(()=>{const box=document.querySelector('[name=stripeShadowEnabled]');if(!box.checked)box.click()})()`);
  await waitFor('document.getElementById("stripeShadowControls").hidden===false');
  const expandedShadow=await evaluate(`(()=>{
    const card=[...document.querySelectorAll('.mobile-setting-cluster')]
      .find(el=>el.dataset.group==='Stripe shadows');
    return {visible:card?.clientHeight,content:card?.scrollHeight,
      clipped:[...card.querySelectorAll('input,select')].filter(el=>{
        if(el.closest('[hidden]')||el.offsetParent===null)return false;
        const c=card.getBoundingClientRect(),r=el.getBoundingClientRect();
        return r.top<c.top-2||r.bottom>c.bottom+2;
      }).map(el=>el.name)};
  })()`);
  console.log('EXPANDED_SHADOW_CARD',JSON.stringify(expandedShadow));
  assert.ok(expandedShadow.content<=expandedShadow.visible+2,'expanded shadows should fit');
  assert.deepEqual(expandedShadow.clipped,[]);
  // Exercise actual Chrome touch events, not just DOM clicks.
  const swipe=async (from,to)=>{
    await command('Input.dispatchTouchEvent',{type:'touchStart',
      touchPoints:[{x:from.x,y:from.y,id:1}]});
    await command('Input.dispatchTouchEvent',{type:'touchMove',
      touchPoints:[{x:(from.x+to.x)/2,y:(from.y+to.y)/2,id:1}]});
    await command('Input.dispatchTouchEvent',{type:'touchMove',
      touchPoints:[{x:to.x,y:to.y,id:1}]});
    await command('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  };
  // Test sideways flicks in the historically problematic Colour and Texture
  // categories with actual browser touch events, not scripted scrollLeft.
  for(const category of ['colour','textures']){
    await evaluate(`document.getElementById('tab-${category}').click()`);
    await delay(370);
    const railBounds=await evaluate(`(()=>{
      const p=document.getElementById('panel-${category}');
      const r=p.getBoundingClientRect();
      return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,
        initial:p.scrollLeft,maximum:p.scrollWidth-p.clientWidth};
    })()`);
    assert.ok(railBounds.maximum>railBounds.right-railBounds.left,
      category+' should have multiple horizontal cards');
    await swipe({x:Math.round(railBounds.right-32),y:Math.round(railBounds.bottom-9)},
                {x:Math.round(railBounds.left+35),y:Math.round(railBounds.bottom-9)});
    await waitFor(`document.getElementById('panel-${category}').scrollLeft>50`);
    console.log('TOUCH_CATEGORY_SWIPE',category,await evaluate(`document.getElementById('panel-${category}').scrollLeft`));
  }
  await evaluate('document.getElementById("tab-design").click()');
  await delay(320);
  const navPosition=await evaluate(`(()=>{
    const r=document.querySelector('.settings-tabs').getBoundingClientRect();
    return {y:Math.round(r.top+r.height/2),left:Math.round(r.left),right:Math.round(r.right)};
  })()`);
  await swipe({x:navPosition.right-34,y:navPosition.y},
              {x:navPosition.left+40,y:navPosition.y});
  await waitFor(`document.getElementById('tab-colour').getAttribute('aria-selected')==='true'`);
  // A real finger drag should adjust a slider, not scroll to another card.
  await evaluate('document.getElementById("tab-design").click()');
  // Randomize may select a straight or returning path, which legitimately
  // disables shape frequency; select a geometry where this thumb is active.
  await evaluate(`(()=>{
    const geometry=document.querySelector('[name=geometry]');
    geometry.value='wave';geometry.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await waitFor(`document.querySelector('[name=shapeFrequency]').disabled===false`);
  // Start this touch check from a middle track position, even if the earlier
  // Prime-mode randomization happened to choose a value near 0 or 100.
  await evaluate(`(()=>{
    const input=document.querySelector('[name=shapeFrequency]');
    input.value='50';input.dispatchEvent(new Event('input',{bubbles:true}));
  })()`);
  // Tab selection asynchronously resets the rail to its first card.
  // Let that reset and CSS snap finish before navigating to the nested slider.
  await delay(330);
  await evaluate(`(()=>{
    const card=[...document.querySelectorAll('#panel-design .mobile-setting-cluster')]
      .find(el=>el.dataset.group==='Geometry');
    card.scrollIntoView({inline:'start',block:'nearest',behavior:'instant'});
    document.querySelector('[name=shapeFrequency]').scrollIntoView({
      inline:'nearest',block:'center',behavior:'instant'
    });
  })()`);
  await delay(280);
  await waitFor(`(()=>{
    const control=document.querySelector('[name=shapeFrequency]').getBoundingClientRect();
    const card=[...document.querySelectorAll('#panel-design .mobile-setting-cluster')]
      .find(el=>el.dataset.group==='Geometry').getBoundingClientRect();
    return control.left>0&&control.right<innerWidth &&
      control.top>=card.top && control.bottom<=card.bottom;
  })()`);
  const slider=await evaluate(`(()=>{
    const r=document.querySelector('[name=shapeFrequency]').getBoundingClientRect();
    return {left:r.left,right:r.right,y:Math.round(r.top+r.height/2),
      value:Number(document.querySelector('[name=shapeFrequency]').value),
      scrollLeft:document.getElementById('panel-design').scrollLeft};
  })()`);
  console.log('SHAPE_SLIDER_BEFORE',JSON.stringify(await evaluate(`(()=>{
    const target=document.querySelector('[name=shapeFrequency]');
    const card=target.closest('.mobile-setting-cluster');
    const pointX=Math.round((target.getBoundingClientRect().left+target.getBoundingClientRect().right)/2);
    const pointY=Math.round((target.getBoundingClientRect().top+target.getBoundingClientRect().bottom)/2);
    const hit=document.elementFromPoint(pointX,pointY);
    return {pointX,pointY,hit:hit?.outerHTML?.slice(0,300),name:hit?.name,
      disabled:target.disabled,touchAction:getComputedStyle(target).touchAction,
      cardScroll:card.scrollTop,cardHeight:card.clientHeight,
      totalCardHeight:card.scrollHeight,value:target.value,top:target.getBoundingClientRect().top,
      railScroll:document.getElementById('panel-design').scrollLeft};
  })()`)));
  // Drag the actual thumb at its existing value. Touching the very
  // beginning of a track is a value-jump, not a thumb drag.
  const thumbX=Math.round(slider.left+(slider.right-slider.left)*slider.value/100);
  await swipe({x:thumbX,y:slider.y},
              {x:Math.round(slider.right-13),y:slider.y});
  console.log('SHAPE_SLIDER_AFTER',JSON.stringify(await evaluate(`(()=>{
    const target=document.querySelector('[name=shapeFrequency]');
    return {value:target.value,railScroll:document.getElementById('panel-design').scrollLeft,
      cardScroll:target.closest('.mobile-setting-cluster').scrollTop};
  })()`)));
  await waitFor(`Number(document.querySelector('[name=shapeFrequency]').value)>${slider.value}`);

  const afterSlider=await evaluate(`({
    value:Number(document.querySelector('[name=shapeFrequency]').value),
    scroll:document.getElementById('panel-design').scrollLeft,
    category:document.querySelector('.settings-tab[aria-selected="true"]').dataset.tab
  })`);
  assert.ok(afterSlider.value>slider.value,'range slider responds to a real finger drag');
  assert.ok(Math.abs(afterSlider.scroll-slider.scrollLeft)<40,'dragging a slider should not swipe away the card');
  assert.equal(afterSlider.category,'design');
  // Pull down by the narrow, unobtrusive grab handle.
  const grab=await evaluate(`(()=>{
    const r=document.getElementById('mobileDismissHandle').getBoundingClientRect();
    return {x:Math.round(r.x+r.width/2),y:Math.round(r.top+r.height/2)};
  })()`);
  await swipe(grab,{x:grab.x,y:grab.y+92});
  await waitFor('!document.body.classList.contains("mobile-edit-open")');
  assert.ok(!await evaluate('document.body.classList.contains("mobile-edit-open")'));

  // Draw on the exact preview overlay using native Chromium touch events,
  // apply a regularized path, and ensure Undo restores the prior wallpaper.
  const priorPath=await evaluate(`(()=>{
    const r=JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('r')));
    return {geometry:r.geometry,customPath:r.customPath};
  })()`);
  const undoInRail=await evaluate(`(()=>{
    const rail=document.querySelector('.mobile-preview-rail-left');
    const prime=rail.querySelector('.prime-toggle').getBoundingClientRect();
    const undo=rail.querySelector('#undo').getBoundingClientRect();
    return {visible:undo.width>20,below:undo.top>=prime.bottom-1,
      toggle:!!rail.querySelector('#drawPathToggle')};
  })()`);
  assert.ok(undoInRail.visible&&undoInRail.below&&undoInRail.toggle,
    'Undo should be immediately below Primes Only with drawing beside it');
  await evaluate('document.getElementById("drawPathToggle").click()');
  await waitFor('document.getElementById("drawOverlay").hidden===false');
  const box=await evaluate(`(()=>{
    const r=document.getElementById('drawOverlay').getBoundingClientRect();
    const frame=document.getElementById('preview').getBoundingClientRect();
    return {left:r.left,top:r.top,width:r.width,height:r.height,
      frameLeft:frame.left,frameTop:frame.top,frameWidth:frame.width,frameHeight:frame.height};
  })()`);
  assert.ok(box.width>box.frameWidth,'drawing plane includes gutters outside the frame');
  await swipe({x:Math.round(box.left+box.width*.24),y:Math.round(box.top+box.height*.19)},
              {x:Math.round(box.left+box.width*.73),y:Math.round(box.top+box.height*.68)});
  await waitFor('document.getElementById("drawApply").disabled===false');
  await evaluate('document.getElementById("drawGeometric").click()');
  assert.ok(await evaluate('document.getElementById("drawGeometric").getAttribute("aria-pressed")==="true"'));
  await evaluate('document.getElementById("drawApply").click()');
  await waitFor(`(()=>{
    const r=JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('r')));
    return r.geometry==='drawn'&&r.customPath.length>2;
  })()`);
  assert.equal(await evaluate('document.getElementById("drawOverlay").hidden'),true);
  await evaluate('document.getElementById("undo").click()');
  await waitFor(`(()=>{
    const r=JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('r')));
    return r.geometry===${JSON.stringify(priorPath.geometry)}&&
      JSON.stringify(r.customPath)===${JSON.stringify(JSON.stringify(priorPath.customPath))};
  })()`);
  console.log('TOUCH_DOODLE_SMOOTH_GEOMETRIC_UNDO_SUCCESS');

  // Doodle coordinates must still be recipe-space coordinates when the
  // preview is zoomed; zooming is purely a visual transform, not regeneration.
  await evaluate('document.querySelector("[data-zoom=in]").click()');
  await evaluate('document.getElementById("drawPathToggle").click()');
  const zoomBox=await evaluate(`(()=>{
    const r=document.getElementById('preview').getBoundingClientRect();
    return {left:r.left,top:r.top,width:r.width,height:r.height};
  })()`);
  await swipe({x:Math.round(zoomBox.left+zoomBox.width*.31),y:Math.round(zoomBox.top+zoomBox.height*.27)},
              {x:Math.round(zoomBox.left+zoomBox.width*.67),y:Math.round(zoomBox.top+zoomBox.height*.62)});
  await waitFor('document.getElementById("drawApply").disabled===false');
  await evaluate('document.getElementById("drawApply").click()');
  const zoomedPath=await evaluate(`(()=>{
    const recipe=JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('r')));
    return recipe.customPath[0];
  })()`);
  assert.ok(Math.abs(zoomedPath[0]-.31)<.04&&Math.abs(zoomedPath[1]-.27)<.04,
    'zoomed input must map back into unzoomed wallpaper coordinates');
  await evaluate('document.getElementById("undo").click()');
  await evaluate('document.querySelector("[data-zoom=out]").click()');
  console.log('ZOOMED_FINGER_PATH_COORDINATES_SUCCESS');


  await evaluate('document.getElementById("mobileEdit").click()');
  await waitFor('document.body.classList.contains("mobile-edit-open")');
  await evaluate(`(()=>{const theme=document.getElementById('studioTheme');
    theme.value='dark';theme.dispatchEvent(new Event('change',{bubbles:true}))})()`);
  assert.equal(await evaluate('document.documentElement.dataset.theme'),'dark');
  await evaluate('document.getElementById("mobileDismissHandle").click()');
  // Reopen then restore toolbar through the small surviving expand arrow.
  await evaluate('document.getElementById("mobileDockExpand").click()');
  await waitFor(`!document.body.classList.contains('mobile-edit-open') &&
    document.querySelector('.mobile-dock').getBoundingClientRect().left<10 &&
    document.querySelector('.masthead').getBoundingClientRect().top>=0`);
  const restored=await evaluate(`({
    headerHeight:document.querySelector('.masthead').getBoundingClientRect().height,
    dockHeight:document.querySelector('.mobile-dock').getBoundingClientRect().height,
    arrowHidden:getComputedStyle(document.getElementById('mobileDockExpand')).opacity==='0',
    theme:document.documentElement.dataset.theme
  })`);
  assert.ok(restored.headerHeight>=65&&restored.dockHeight<=55&&restored.arrowHidden);
  assert.equal(restored.theme,'dark');
  await evaluate('document.getElementById("mobileMore").click()');
  await waitFor(`(()=>{
    const stage=document.querySelector('.studio-stage').getBoundingClientRect();
    const sheet=document.getElementById('mobileToolsSheet').getBoundingClientRect();
    return stage.bottom<=sheet.top+2;
  })()`);
  const tools=await evaluate(`(()=>({
    open:document.body.classList.contains('mobile-tools-open'),
    seed:!!document.querySelector('#mobileToolsContent #seedInput'),
    metadata:!!document.querySelector('#mobileToolsContent #metadataToggle'),
    nudge:!!document.querySelector('.studio-stage .nudge-pad'),
    copy:!!document.querySelector('#mobileToolsContent #copyLink'),
    undo:!!document.querySelector('.studio-stage .mobile-preview-rail-left #undo')
  }))()`);
  assert.ok(Object.values(tools).every(Boolean),'mobile utilities and preview Undo should be available');
  const utilities=await evaluate(`(()=>{
    const r=document.querySelector('.studio-stage').getBoundingClientRect();
    const t=document.getElementById('mobileToolsSheet').getBoundingClientRect();
    return {previewHeight:document.querySelector('.wallpaper-frame').getBoundingClientRect().height,
      separated:r.bottom<=t.top+2,toolsHeight:t.height};
  })()`);
  assert.ok(utilities.separated&&utilities.previewHeight>300,'More tools must not cover the preview');
  await evaluate('document.getElementById("mobileToolsClose").click()');
  await evaluate('document.getElementById("mobileExplore").click()');
  await waitFor(`(()=>{
    const stage=document.querySelector('.studio-stage').getBoundingClientRect();
    const tray=document.querySelector('.workspace>.gallery-section').getBoundingClientRect();
    return stage.bottom<=tray.top+2;
  })()`);
  assert.ok(await evaluate('document.body.classList.contains("mobile-gallery-open")'));
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".workspace>.gallery-section")).display'),'flex');
  const galleryMetrics=await evaluate(`(()=>{
    const preview=document.querySelector('.studio-stage').getBoundingClientRect();
    const gallery=document.querySelector('.workspace>.gallery-section').getBoundingClientRect();
    return {previewHeight:preview.height,separate:preview.bottom<=gallery.top+2};
  })()`);
  assert.ok(galleryMetrics.separate&&galleryMetrics.previewHeight>340,
    'exploring variations must also keep the preview visible');
  await evaluate('document.getElementById("mobileExplore").click()');
  assert.ok(!await evaluate('document.body.classList.contains("mobile-gallery-open")'));
  // A PNG generated elsewhere must be able to restore the *complete*
  // recipe, rather than only seed/EXIF strings. Exercise the real file input.
  await evaluate(`(async()=>{
    const module=await import('/src/png-metadata.js');
    const canvas=document.getElementById('preview');
    const raw=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    const recipe={seed:'png-restore-qa',orientation:'diagonal',diagonalRotation:-61,
      reverseStripes:true,mirrorHorizontal:true,mirrorVertical:true,
      positionX:7,positionY:-4,textureLayer2Enabled:true,material2:'felt',
      lockedSettings:['reverseStripes','diagonalRotation']};
    const packed=module.embedPngMetadata(await raw.arrayBuffer(),{}, {recipe});
    const transfer=new DataTransfer();
    transfer.items.add(new File([packed],'saved-wallpaper.png',{type:'image/png'}));
    const chooser=document.getElementById('importRecipeFile');
    chooser.files=transfer.files;
    chooser.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await waitFor(`(()=>{
    const raw=new URLSearchParams(location.search).get('r');
    if(!raw)return false;
    const recipe=JSON.parse(decodeURIComponent(raw));
    return recipe.seed==='png-restore-qa'&&recipe.diagonalRotation===-61&&
      recipe.mirrorHorizontal&&recipe.mirrorVertical&&recipe.reverseStripes&&
      recipe.positionX===7&&recipe.positionY===-4;
  })()`);
  assert.ok(await evaluate('document.querySelector("[name=reverseStripes]").checked'));
  assert.equal(await evaluate('document.querySelector("[name=diagonalRotation]").value'),'-61');
  console.log('PNG_RECIPE_IMPORT_SUCCESS');

  await command('Emulation.setDeviceMetricsOverride',{
    width:1280,height:900,deviceScaleFactor:1,mobile:false,
    screenWidth:1280,screenHeight:900,
  });
  await waitFor('!document.body.classList.contains("mobile-studio")');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".mobile-dock")).display'),'none');
  assert.equal(await evaluate('document.documentElement.dataset.theme'),'dark');
  const restoredSettings=await evaluate(`({
    groups:document.querySelectorAll('.mobile-setting-cluster').length,
    geometry:document.querySelector('[name=geometry]').closest('#panel-design')!==null,
    shape:document.querySelector('[name=shapeFrequency]').closest('#panel-design')!==null,
    outlineBuffer:document.querySelector('[name=gap]').closest('#panel-refine')!==null,
    lockCount:document.querySelectorAll('#controls .setting-lock').length,
  })`);
  assert.equal(restoredSettings.groups,0,'desktop must restore independent controls');
  assert.ok(await evaluate('document.querySelector(".composition-positioner .nudge-pad")!==null'));
  assert.ok(await evaluate('document.querySelector("#controls .randomize-toolbar")!==null'));
  assert.ok(restoredSettings.geometry&&restoredSettings.shape&&restoredSettings.outlineBuffer);
  assert.ok(restoredSettings.lockCount>25,'locks must survive DOM reparenting');
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
