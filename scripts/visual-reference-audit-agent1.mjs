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
  'explore-populated':'explore',
  'saved-empty':'explore',
  'saved-populated':'explore',
  more:'more',material:'material',colour:'colour',diagonal:'diagonal',
  compact:'compact',focus:'focus',history:'history',search:'search'
};
const all=Object.keys(plates).filter(name=>!['explore-populated','saved-empty','saved-populated'].includes(name));
const profiles=[
  // Exact lower-width CSS boundary plus the app's minimum supported width.
  // These are actual mobile Chromium layouts, never CSS-root zoom proxies.
  {id:'minimum-320x640',width:320,height:640,cases:['studio','geometry','material','more','explore','explore-populated','saved-empty','saved-populated','draw']},
  {id:'edge-360x740',width:360,height:740,cases:['studio','geometry','material','more','explore','saved-empty','saved-populated','focus']},
  // Height-constrained portrait and the two-row rotation 399/400px boundary.
  // Gallery thumbnail size must not cliff at this exact media-query edge.
  {id:'edge-399x740',width:399,height:740,cases:['studio','material','saved-empty','saved-populated']},
  {id:'edge-400x740',width:400,height:740,cases:['studio','material','saved-empty','saved-populated']},
  {id:'short-phone-412x740',width:412,height:740,cases:['studio','material','saved-empty','saved-populated','explore-populated']},
  // Probe the handoff among <=670px short landscape, 680px compact
  // portrait, and >790px normal-height thumbnail recipes.
  {id:'height-edge-412x670',width:412,height:670,cases:['studio','saved-populated']},
  {id:'height-edge-412x671',width:412,height:671,cases:['studio','saved-populated']},
  {id:'height-edge-412x679',width:412,height:679,cases:['studio','saved-populated']},
  {id:'height-edge-412x680',width:412,height:680,cases:['studio','saved-populated']},
  {id:'height-edge-412x790',width:412,height:790,cases:['studio','saved-populated']},
  {id:'height-edge-412x791',width:412,height:791,cases:['studio','saved-populated']},
  // Above 791px the old fixed 160px rule stopped at 840px even though the
  // gallery did not have enough clipped height for a complete 195px image.
  {id:'height-edge-412x840',width:412,height:840,cases:['studio','saved-populated']},
  {id:'height-edge-412x841',width:412,height:841,cases:['studio','saved-populated']},
  {id:'height-edge-412x859',width:412,height:859,cases:['studio','saved-populated']},
  {id:'height-edge-412x860',width:412,height:860,cases:['studio','saved-populated']},
  {id:'height-edge-412x861',width:412,height:861,cases:['studio','saved-populated']},
  // A narrower source header wraps and changes the real gallery ink budget.
  {id:'height-edge-320x700',width:320,height:700,cases:['studio','saved-populated']},
  {id:'height-edge-320x841',width:320,height:841,cases:['studio','saved-populated']},
  {id:'short-edge-499x740',width:499,height:740,cases:['studio','material','saved-populated']},
  {id:'short-edge-500x740',width:500,height:740,cases:['studio','material','saved-populated']},
  {id:'phone-412x892',width:412,height:892,cases:[...all,'explore-populated','saved-empty','saved-populated']},
  {id:'edge-499x892',width:499,height:892,cases:['studio','geometry','material','more','focus']},
  {id:'edge-500x892',width:500,height:892,cases:all},
  {id:'edge-790x892',width:790,height:892,cases:['studio','geometry','material','more','explore']},
  {id:'desktop-791x892',width:791,height:892,cases:['studio','geometry','material']},
  {id:'landscape-700x412',width:700,height:412,cases:['studio','geometry','draw','more','explore','explore-populated','saved-empty','saved-populated']},
  {id:'zoom-out-412x892',width:412,height:892,cases:['studio','geometry','more'],zoom:.75}
];
const errors=[],shots=[];
const pause=ms=>new Promise(done=>setTimeout(done,ms));
// Cards are inserted before their async bitmap work finishes. A real
// screenshot must never certify an allocated-but-unpainted <canvas>.
// Alpha at a background corner discriminates a cleared canvas from actual
// wallpaper artwork without imposing a motif-specific colour requirement.
const awaitPaintedThumbnails=async(page,required)=>{
  await page.waitForFunction(count=>{
    const cards=[...document.querySelectorAll('#gallery .thumb canvas')];
    if(cards.length<count)return false;
    return cards.slice(0,count).every(canvas=>{
      if(!canvas.width||!canvas.height)return false;
      try{return canvas.getContext('2d').getImageData(0,0,1,1).data[3]>0;}
      catch{return false;}
    });
  },required,{timeout:90000});
};
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
    // This short gallery intentionally preserves some canvas above it;
    // don't let the decorative seven-bar ribbon hide the actionable guidance
    // behind the grid's overflow-y:hidden clipping rectangle.
    if(profile.width<=790&&profile.height<=670&&state.empty){
      const legibility=await page.evaluate(()=>{
        const clip=document.querySelector('#gallery').getBoundingClientRect();
        const heading=document.querySelector('#gallery .gallery-empty-heading')?.getBoundingClientRect();
        const hint=document.querySelector('#gallery .gallery-placeholder>span')?.getBoundingClientRect();
        return {clipTop:clip.top,clipBottom:clip.bottom,headingTop:heading?.top,
          headingBottom:heading?.bottom,hintTop:hint?.top,hintBottom:hint?.bottom};
      });
      if(legibility.headingTop==null||legibility.hintTop==null||
          legibility.headingTop<legibility.clipTop-1||
          legibility.hintBottom>legibility.clipBottom+1)
        throw Error('Short-screen gallery empty guidance clipped: '+JSON.stringify(legibility));
    }
  },
  'saved-empty':async(page,profile)=>{
    if(profile.width>790)return;
    await click(page,'#mobileSaved');
    await page.waitForFunction(()=>document.body.classList.contains('mobile-gallery-open')&&
      document.querySelector('#gallery')?.dataset.view==='saved');
    await page.locator('#gallery .gallery-placeholder').waitFor({state:'visible'});
    // Save-specific copy can wrap differently from Explore. Check real text
    // rectangles against the scroll-hidden gallery, without removing lines.
    const evidence=await page.evaluate(()=>{
      const gallery=document.querySelector('#gallery');
      const heading=gallery.querySelector('.gallery-empty-heading');
      const hint=gallery.querySelector('.gallery-placeholder>span');
      const rect=el=>{
        const r=el.getBoundingClientRect();
        return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height};
      };
      return {mode:gallery.dataset.view,clip:rect(gallery),
        heading:heading?rect(heading):null,hint:hint?rect(hint):null,
        text:heading?.textContent?.trim(),instruction:hint?.textContent?.trim()};
    });
    console.log('SAVED EMPTY '+profile.id+' '+JSON.stringify(evidence));
    if(evidence.text!=='Nothing saved yet.'||
        !evidence.instruction?.includes('tap the heart')||
        !evidence.heading||!evidence.hint||
        evidence.heading.top<evidence.clip.top-1||
        evidence.hint.bottom>evidence.clip.bottom+1||
        evidence.heading.left<evidence.clip.left-1||
        evidence.hint.right>evidence.clip.right+1)
      throw Error('Saved empty-state guidance clipped or incorrect: '+JSON.stringify(evidence));
  },
  'saved-populated':async(page,profile)=>{
    if(profile.width>790)return;
    // Use the real Studio heart action and Saved destination, not DOM-injected
    // gallery cards or manually seeded localStorage. This also proves the
    // saved screen is not accidentally a stale Explore contact sheet.
    await click(page,'#mobileFavorite');
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('wallgen:favorites:v1')||'[]').length===1);
    await click(page,'#mobileSaved');
    await page.waitForFunction(()=>document.querySelector('#gallery')?.dataset.view==='saved'&&
      document.querySelectorAll('#gallery .thumb').length===1&&
      !document.querySelector('#gallery')?.hasAttribute('aria-busy'));
    await awaitPaintedThumbnails(page,1);
    await pause(150);
    const capture=await page.evaluate(()=>{
      const grid=document.querySelector('#gallery');
      const card=grid.querySelector('.thumb');
      const canvas=card?.querySelector('canvas');
      const caption=card?.querySelector('.thumb-caption');
      const bounds=el=>{
        const r=el.getBoundingClientRect();
        return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};
      };
      return {mode:grid.dataset.view,count:grid.querySelectorAll('.thumb').length,
        stored:JSON.parse(localStorage.getItem('wallgen:favorites:v1')||'[]').length,
        clip:bounds(grid),card:bounds(card),canvas:bounds(canvas),
        caption:bounds(caption),captionText:caption?.textContent?.trim(),
        aria:card?.getAttribute('title')};
    });
    console.log('SAVED POPULATED '+profile.id+' '+JSON.stringify(capture));
    const {clip,card,canvas,caption}=capture;
    if(capture.mode!=='saved'||capture.count!==1||capture.stored!==1||
      !capture.captionText||!capture.aria||
      card.left<clip.left-1||card.right>clip.right+1||
      canvas.top<clip.top-1||canvas.bottom>clip.bottom+1||
      caption.top<clip.top-1||caption.bottom>clip.bottom+1)
      throw Error('Real favourite cropped or missing in Saved: '+JSON.stringify(capture));
  },
  'explore-populated':async(page)=>{
    // Real twelve-way generation is slower than the preloaded empty gallery.
    // Capture the result rather than reconstructing fake card screenshots.
    await click(page,'#mobileExplore');
    await page.locator('#gallery').waitFor({state:'visible'});
    await click(page,'#batch');
    await page.waitForFunction(()=>document.querySelectorAll('#gallery .thumb').length>=12,
      null,{timeout:60000});
    await awaitPaintedThumbnails(page,12);
    await pause(150);
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
    const dockLabels=[...document.querySelectorAll('#mobileActionDock>button>small')].map(el=>{
      const label=el.getBoundingClientRect(),button=el.parentElement.getBoundingClientRect();
      return {text:el.textContent.trim(),fontSize:parseFloat(getComputedStyle(el).fontSize),
        label:{x:label.x,y:label.y,right:label.right,bottom:label.bottom},
        button:{x:button.x,y:button.y,right:button.right,bottom:button.bottom}};
    });
    // Source DOM, not guessed recipe labels. Inspect the native six-part
    // rotation toolbar as displayed on tiny phones, including actual paint
    // order at each interactive element's centre.
    const rotationRow=document.querySelector(
      '.editor-tool-card[data-editor-tool="finish1"] .texture-rotation-field .rotation-controls');
    const rotationFrame=rotationRow?.getBoundingClientRect();
    const rotationCells=rotationRow?[...rotationRow.querySelectorAll('button,input[type=number]')]
      .map(el=>{
        const r=el.getBoundingClientRect();
        const probe=document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2);
        return {name:el.getAttribute('aria-label')||el.value||el.textContent.trim(),
          x:r.left,right:r.right,y:r.top,bottom:r.bottom,width:r.width,height:r.height,
          centerTarget:el===probe||el.contains(probe)};
      }):[];
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
      stage,sidebar,gallery,more,dock:rect('#mobileActionDock'),dockLabels,
      rotationFrame:rotationFrame?{x:rotationFrame.x,right:rotationFrame.right,y:rotationFrame.y,bottom:rotationFrame.bottom}:null,rotationCells,
      galleryGrid:rect('#gallery'),firstThumb:rect('#gallery .thumb'),
      firstThumbCanvas:rect('#gallery .thumb canvas'),
      firstThumbCaption:rect('#gallery .thumb-caption'),
      galleryGridOverflowY:document.querySelector('#gallery')?getComputedStyle(document.querySelector('#gallery')).overflowY:null,
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
          if(name==='explore-populated'){
            const grid=measured.galleryGrid,canvas=measured.firstThumbCanvas;
            const hidden=grid?.visible&&canvas?.visible?
              Math.max(0,canvas.bottom-grid.bottom):null;
            console.log('GALLERY THUMB: '+key+' canvas hidden below clip='+hidden+
              'px; grid overflow-y='+measured.galleryGridOverflowY);
            if(profile.id==='landscape-700x412'||profile.id==='minimum-320x640'){
              const card=measured.firstThumb,caption=measured.firstThumbCaption;
              const bad=!grid?.visible||!canvas?.visible||!card?.visible||!caption?.visible||
                canvas.y<grid.y-1||canvas.bottom>grid.bottom+1||
                card.bottom>grid.bottom+1||caption.bottom>grid.bottom+1||
                canvas.height>54||canvas.width/canvas.height>.5;
              if(bad){
                const error='Short-landscape populated thumbnail is cropped or caption hidden: '+
                  JSON.stringify({grid,card,canvas,caption});
                errors.push({key,error});
                console.error('VISUAL FAILURE '+key+' '+error);
              }
            }
          }
          console.log('CAPTURED '+key+' overlap='+measured.stageOverlap);
          // The screenshot and geometry remain in the artifact on failure:
          // an attractive comparison gallery is not evidence of safe layout.
          if(profile.width<=790&&!profile.zoom&&measured.dock?.visible){
            const labels=measured.dockLabels;
            const clipped=labels.filter(item=>
              item.fontSize<9.9||item.label.x<item.button.x-1||
              item.label.right>item.button.right+1||
              item.label.y<item.button.y-1||
              item.label.bottom>item.button.bottom+1);
            if(labels.length!==5||clipped.length){
              const error='Five-dock caption label size or clipping: '+
                JSON.stringify({count:labels.length,clipped});
              errors.push({key,error});
              console.error('VISUAL FAILURE '+key+' '+error);
            }
          }
          if(profile.width<=412&&name==='material'){
            // Optical inventory first: the current raster appears crowded.
            // Keep source-accurate boxes/centre hit targets in the artifact
            // before deciding whether another production CSS change is safe.
            console.log('MATERIAL ROTATION '+key+' '+JSON.stringify({
              frame:measured.rotationFrame,cells:measured.rotationCells}));
            const frame=measured.rotationFrame,cells=measured.rotationCells;
            const blocked=!frame||cells.length!==6||cells.some(cell=>
              !cell.centerTarget||cell.width<24||cell.height<24||
              cell.x<frame.x-1||cell.right>frame.right+1||
              cell.y<frame.y-1||cell.bottom>frame.bottom+1);
            if(blocked){
              const error='One or more of six Material rotation targets clipped or blocked: '+
                JSON.stringify({frame,cells});
              errors.push({key,error});
              console.error('VISUAL FAILURE '+key+' '+error);
            }
          }
          if(profile.width<=360){
            for(const [name,rect] of [['preview',measured.stage],['dock',measured.dock]]){
              if(rect?.visible&&(rect.x< -1||rect.right>profile.width+1)){
                const error='Narrow phone '+name+' extends outside '+profile.width+
                  'px viewport: '+JSON.stringify(rect);
                errors.push({key,error});
                console.error('VISUAL FAILURE '+key+' '+error);
              }
            }
          }
          if(profile.id==='desktop-791x892'&&measured.undersized24.length){
            const error='Editor action targets below 24 CSS px: '+measured.undersized24.join(', ');
            errors.push({key,error});
            console.error('VISUAL FAILURE '+key+' '+error);
          }
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
