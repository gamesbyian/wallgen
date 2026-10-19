#!/usr/bin/env node
/**
 * Agent 1 independent visual evidence. Never used as a generated UI mockup:
 * real DOM/control handlers, actual canvas, canonical SVG next to screenshot.
 * Usage: node scripts/visual-reference-audit-agent1.mjs --out=artifacts/visual-agent1
 * Requires a running local server on port 4173 and playwright installed.
 */
import {chromium} from 'playwright';
import {mkdir, writeFile, copyFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';

const output=resolve(process.argv.find(x=>x.startsWith('--out='))?.slice(6)||'artifacts/visual-agent1');
const url=process.argv.find(x=>x.startsWith('--base-url='))?.slice(11)||'http://127.0.0.1:4173';
const plates={
  studio:'studio',geometry:'geometry',draw:'draw',explore:'explore',
  more:'more',material:'material',colour:'colour',diagonal:'diagonal',
  compact:'compact',focus:'focus',history:'history',search:'search'
};
const all=Object.keys(plates);
const profiles=[
  {id:'phone-412x892',width:412,height:892,cases:all},
  {id:'edge-499x892',width:499,height:892,cases:['studio','geometry','material','more','focus']},
  {id:'edge-500x892',width:500,height:892,cases:all},
  {id:'edge-790x892',width:790,height:892,cases:['studio','geometry','material','more','explore']},
  {id:'desktop-791x892',width:791,height:892,cases:['studio','geometry','material']},
  {id:'landscape-700x412',width:700,height:412,cases:['studio','geometry','draw','more','explore']},
  {id:'zoom-out-412x892',width:412,height:892,cases:['studio','geometry','more'],zoom:.75}
];
const errors=[],shots=[];
const pause=ms=>new Promise(done=>setTimeout(done,ms));
const click=async(page,selector)=>{
  const control=page.locator(selector).first();
  if(!await control.count())throw Error('Source action absent: '+selector);
  // Where the live editor temporarily hides the masthead/dock, invoke the
  // ORIGINAL element's click handler without pretending it was a touch tap.
  await control.evaluate(el=>el.click());
  await pause(110);
};
const field=async(page,name,value)=>{
  const source=page.locator('#controls [name="'+name+'"]').first();
  if(!await source.count())throw Error('Source setting absent: '+name);
  await source.evaluate((el,value)=>{
    if(el.type==='checkbox')el.checked=Boolean(value);
    else el.value=String(value);
    el.dispatchEvent(new Event(el.type==='range'?'input':'change',{bubbles:true}));
    if(el.type==='range')el.dispatchEvent(new Event('change',{bubbles:true}));
  },value);
  await pause(130);
};
const edit=async(page,profile)=>{
  if(profile.width<=790)await click(page,'#mobileEdit');
  await page.locator('.editor-tool-tab[data-editor-tool="arrange"]').waitFor({state:'attached'});
};
const tool=async(page,category,name)=>{
  await click(page,'#tab-'+category);
  await click(page,'.editor-tool-tab[data-editor-tool="'+name+'"]');
  await page.waitForFunction(name=>{
    const card=document.querySelector('.editor-tool-card[data-editor-tool="'+name+'"]');
    return Boolean(card&&!card.hidden&&card.getBoundingClientRect().height>0);
  },name);
};
const scenarios={
  studio:async()=>{},
  geometry:async(page,profile)=>{
    await edit(page,profile);await field(page,'structure','paths');
    await tool(page,'path','geometry');
  },
  draw:async(page)=>{
    await click(page,'#drawPathToggle');
    await page.locator('#drawPathPanel:not([hidden])').waitFor({state:'visible'});
    const box=await page.locator('#drawOverlay').boundingBox();
    if(!box||box.height<100||box.width<100)throw Error('Draw overlay rectangle unavailable');
    const pts=[[.24,.22],[.32,.30],[.43,.38],[.55,.48],[.69,.61]];
    await page.mouse.move(box.x+box.width*pts[0][0],box.y+box.height*pts[0][1]);
    await page.mouse.down();
    for(const [x,y] of pts.slice(1))
      await page.mouse.move(box.x+box.width*x,box.y+box.height*y,{steps:5});
    await page.mouse.up();
    await page.locator('#drawApply:enabled').waitFor({state:'visible'});
  },
  explore:async(page,profile)=>{
    if(profile.width>790)return;
    // Explore is valid with zero saved items. Capturing its empty gallery
    // state avoids falsely requiring that the independent Saved-favourites
    // model has been populated by a single favourite click.
    await click(page,'#mobileExplore');
    await page.waitForFunction(()=>document.body.classList.contains('mobile-gallery-open'));
    await page.locator('#gallery').waitFor({state:'visible'});
    const state=await page.evaluate(()=>{
      const section=document.querySelector('#gallery');
      return {thumbs:section.querySelectorAll('.thumb').length,
        empty:!!section.querySelector('.gallery-placeholder')};
    });
    if(!state.empty&&!state.thumbs)throw Error('Explore gallery has neither thumbnails nor empty guidance');
  },
  more:async(page,profile)=>{
    if(profile.width<=790){
      await click(page,'#mobileMore');
      await page.locator('#mobileToolsSheet:not([hidden])').waitFor({state:'visible'});
    }
  },
  material:async(page,profile)=>{
    await edit(page,profile);await field(page,'structure','paths');
    await field(page,'material','grain');await tool(page,'material','finish1');
  },
  colour:async(page,profile)=>{
    await edit(page,profile);await tool(page,'colour','rainbow');
  },
  diagonal:async(page,profile)=>{
    await edit(page,profile);await field(page,'orientation','diagonal');
    await tool(page,'layout','direction');
  },
  compact:async(page,profile)=>{
    await edit(page,profile);await tool(page,'colour','canvas');
  },
  focus:async(page,profile)=>{
    await edit(page,profile);await field(page,'structure','paths');
    await tool(page,'stripes','structure');
    await click(page,'.editor-focus-toggle');
    await click(page,'.editor-focus-chip[data-focus-key=stripeWidth]');
    await page.locator('#editorFocusPanel:not([hidden])').waitFor({state:'visible'});
  },
  history:async(page,profile)=>{
    await edit(page,profile);await click(page,'#randomize');
    await click(page,'#editorHistoryToggle');
  },
  search:async(page,profile)=>{
    await edit(page,profile);await click(page,'.editor-search-toggle');
    await page.locator('.editor-search-input').fill('shadow');
  }
};
function geometryFromPage(page){
  return page.evaluate(()=>{
    const rect=selector=>{
      const el=document.querySelector(selector);
      if(!el)return null;
      const r=el.getBoundingClientRect();
      const css=getComputedStyle(el);
      return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,
        visible:css.display!=='none'&&css.visibility!=='hidden'&&r.width>0&&r.height>0};
    };
    const body=document.body;
    const actionSelectors=['#mobileEdit','#mobileMore','#mobileStudio','#mobileSaved',
      '.settings-tabs .settings-tab:not(:disabled)',
      '.editor-tool-tab[aria-pressed="true"]',
      '.editor-tool-card:not([hidden]) .setting-lock:not(:disabled)',
      '.editor-tool-card:not([hidden]) .editor-setting-die:not(:disabled)'];
    const actionTargets=actionSelectors.map(selector=>({selector,...rect(selector)}))
      .filter(el=>el.visible);
    const stage=rect('.studio-stage'),sidebar=rect('.sidebar'),
      gallery=rect('.gallery-section'),more=rect('#mobileToolsSheet');
    const openSheet=body.classList.contains('mobile-edit-open')?sidebar:
      body.classList.contains('mobile-gallery-open')?gallery:
      body.classList.contains('mobile-tools-open')?more:null;
    const stageOverlap=openSheet?.visible&&stage?.visible?
      Math.max(0,Math.min(stage.bottom,openSheet.bottom)-Math.max(stage.y,openSheet.y)):0;
    return {
      theme:document.documentElement.dataset.theme,
      bodyClasses:body.className,
      stage,sidebar,gallery,more,dock:rect('#mobileActionDock'),
      stageOverlap,actionTargets,
      undersized24:actionTargets.filter(el=>el.width<24||el.height<24)
        .map(el=>el.selector),
      categoryDisabled:[...document.querySelectorAll('.settings-tabs .settings-tab:disabled')]
        .map(el=>({label:el.textContent.trim(),opacity:getComputedStyle(el).opacity,
          foreground:getComputedStyle(el).color}))
    };
  });
}
await mkdir(join(output,'plates'),{recursive:true});
for(const filename of new Set(Object.values(plates))){
  await copyFile('docs/ui-reference/'+filename+'.svg',join(output,'plates',filename+'.svg'));
}
const browser=await chromium.launch({headless:true});
try{
  for(const profile of profiles)for(const theme of ['cream','dark']){
    const context=await browser.newContext({
      viewport:{width:profile.width,height:profile.height},
      isMobile:profile.width<=790,hasTouch:profile.width<=790,
      deviceScaleFactor:1,reducedMotion:'reduce'
    });
    try{
      for(const name of profile.cases){
        const page=await context.newPage();
        const key=profile.id+'/'+theme+'/'+name;
        const filename=join('screens',profile.id,theme,name+'.png');
        try{
          await page.goto(url,{waitUntil:'domcontentloaded'});
          await page.locator('.editor-tool-tab').first().waitFor({state:'attached',timeout:12000});
          await page.evaluate(()=>{
            const input=document.querySelector('#seedInput');
            if(input){input.value='agent1-reference-fixed';input.dispatchEvent(new Event('change',{bubbles:true}));}
          });
          await click(page,'#applySeed');
          await click(page,'[data-studio-theme="'+theme+'"]');
          if(profile.zoom)await page.evaluate(zoom=>{document.documentElement.style.zoom=String(zoom);},profile.zoom);
          await scenarios[name](page,profile);
          await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
          await pause(130);
          const measured=await geometryFromPage(page);
          await mkdir(join(output,'screens',profile.id,theme),{recursive:true});
          await page.screenshot({path:join(output,filename),animations:'disabled',fullPage:false});
          shots.push({key,profile:profile.id,theme,screen:name,plate:plates[name],
            file:filename,zoomMethod:profile.zoom?'CSS root zoom (approximation)':'native CSS viewport',
            interaction:'original source handlers invoked; not a physical tap acceptance',
            ...measured});
          console.log('CAPTURED '+key+' overlap='+measured.stageOverlap);
          // The screenshot and geometry remain in the artifact on failure:
          // an attractive comparison gallery is not evidence of safe layout.
          if(measured.stageOverlap>1){
            const error='Visible preview is overlapped by open '+name+
              ' surface: '+measured.stageOverlap.toFixed(1)+'px';
            errors.push({key,error});
            console.error('VISUAL FAILURE '+key+' '+error);
          }
        }catch(e){
          errors.push({key,error:String(e)});
          console.error('VISUAL FAILURE '+key+' '+String(e));
        }finally{await page.close();}
      }
    }finally{await context.close();}
  }
}finally{await browser.close();}
const imageCards=shots.map(s=>'<article><h2>'+s.key+'</h2><div class="pair">'+
  '<figure><img src="plates/'+s.plate+'.svg" alt="Reference plate"/><figcaption>Canonical schematic (inventory governs)</figcaption></figure>'+
  '<figure><img src="'+s.file+'" alt="Real Chromium screenshot"/><figcaption>Real app screenshot at '+s.profile+'; '+s.theme+'</figcaption></figure>'+
  '</div><p>Stage/tray overlap: '+s.stageOverlap.toFixed(1)+'px; target undersize below 24px: '+s.undersized24.join(', ')+'</p></article>').join('\n');
const gallery='<!doctype html><html lang="en"><meta charset="utf-8"><title>Agent 1 live reference comparisons</title>'+
  '<style>body{font:15px system-ui;margin:24px;background:#f5f0e9;color:#1f1e25}article{padding:18px;margin:16px 0;background:white;border-radius:12px}'+
  '.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0;min-width:0}img{width:100%;height:640px;object-fit:contain;background:#eee;border:1px solid #ccc}'+
  'figcaption{font-size:12px}h2{font-size:16px;overflow-wrap:anywhere}p{font-size:12px}@media(max-width:750px){.pair{grid-template-columns:1fr}img{height:auto}}</style>'+
  '<h1>ROYGBIV: live app versus 12 reference plates</h1>'+
  '<p>References are explanatory source-backed schematic plates, never pixel-perfect golden images. This gallery provides paired evidence for independent visual approval, not approval itself. Browser is Playwright Chromium, with real UI elements, original event handlers and visible live artwork. CSS root zoom is labelled where used, and is not native Android/browser zoom proof.</p>'+
  imageCards+'<p><a href="icon-review.html">Review unwired SVG source icons against the 68-symbol multi-state matrix</a></p></html>';
await writeFile(join(output,'review.html'),gallery);
const iconCandidates=['pan','anchor-points','smooth-path','extend-path','weave','focus-slider','metadata','restore-variation'];
const iconFindings=[];
for(const candidate of iconCandidates){
  const svg=readFileSync('assets/icons/roygbiv/'+candidate+'.svg','utf8');
  const item={icon:candidate,viewBox32:/viewBox="0 0 32 32"/.test(svg),
    hasGradient:/<(?:linearGradient|radialGradient|pattern)\b/i.test(svg),
    hasScript:/<script\b|onload=|onclick=/i.test(svg)};
  iconFindings.push(item);
  if(!item.viewBox32||item.hasGradient||item.hasScript)errors.push({key:'svg/'+candidate,error:JSON.stringify(item)});
}
// Render the actual production 68-symbol fixture, not a reconstructed SVG
// preview. Each candidate filter contains 20/24/28px across both themes
// and normal/selected/disabled/focused states.
const iconShots=[];
const iconsBrowser=await chromium.launch({headless:true});
try{
  const context=await iconsBrowser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1});
  const page=await context.newPage();
  await page.goto(url+'/assets/icons/roygbiv/state-matrix.html',{waitUntil:'domcontentloaded'});
  await page.locator('#filter').waitFor({state:'visible'});
  await page.evaluate(async()=>document.fonts.ready);
  await mkdir(join(output,'icons'),{recursive:true});
  await page.screenshot({path:join(output,'icons','all-68-state-matrix.png'),fullPage:true,animations:'disabled'});
  for(const candidate of iconCandidates){
    await page.locator('#filter').fill(candidate);
    await pause(90);
    const file='icons/'+candidate+'-states.png';
    await page.screenshot({path:join(output,file),fullPage:true,animations:'disabled'});
    iconShots.push({candidate,file,states:'20/24/28px, cream/dark, normal/selected/disabled/focus'});
  }
  await context.close();
}finally{await iconsBrowser.close();}
const iconCards=iconShots.map(row=>'<section><h2>'+row.candidate+'</h2><img alt="'+row.candidate+' state matrix" src="'+row.file+'"></section>').join('\n');
await writeFile(join(output,'icon-review.html'),
  '<!doctype html><html lang="en"><meta charset="utf-8"><title>Candidate SVG source review</title>'+
  '<style>body{font:14px system-ui;margin:22px;background:#f7f2eb;color:#18151f}section{background:#fff;padding:18px;margin:18px 0}img{max-width:100%;height:auto;border:1px solid #ddd}</style>'+
  '<h1>Eight unwired candidates, rendered in the real 68-symbol matrix</h1>'+
  '<p>This is source-backed multi-state optical evidence, not approval or permission to wire icons. Full established matrix: <a href="icons/all-68-state-matrix.png">68 symbols</a>.</p>'+
  iconCards+'</html>');

await writeFile(join(output,'manifest.json'),JSON.stringify({
  source:'git checkout used by Action',plateSource:'docs/ui-reference',profiles,shots,errors,
  iconCandidates:iconFindings,iconScreenshots:iconShots,notes:[
    'No visual/human sign-off inferred from passing geometry or screenshot capture',
    'Candidate icon matrix lives at assets/icons/roygbiv/state-matrix.html',
    'Original application controls remain live; only source click handlers are invoked',
    'Browser engine is Chromium CI, not user Pixel 6 Pro hardware'
  ]},null,2));
console.log('VISUAL EVIDENCE: '+shots.length+' captures, '+errors.length+' errors; gallery '+join(output,'review.html'));
if(errors.length)process.exitCode=1;
