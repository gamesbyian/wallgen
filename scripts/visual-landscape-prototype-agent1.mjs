#!/usr/bin/env node
/**
 * #294 opt-in-only browser A/B: does a landscape split improve real wallpaper
 * legibility without occluding original controls? NO production CSS modified.
 * All proposed styles are runtime-injected into a throwaway Chromium page.
 */
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const base=process.argv.find(x=>x.startsWith('--base-url='))?.slice(11)||'http://127.0.0.1:4173';
const output=resolve(process.argv.find(x=>x.startsWith('--out='))?.slice(6)||'artifacts/visual-landscape-294');
const sizes=[{id:'short-700x412',width:700,height:412},
 {id:'wide-790x500',width:790,height:500},
 {id:'short-600x360',width:600,height:360},
 {id:'portrait-412x700',width:412,height:700}];
const scenes=[{id:'path-geometry',tab:'path',tool:'geometry'},
 {id:'material-finish',tab:'material',tool:'finish1'},
 {id:'colour-rainbow',tab:'colour',tool:'rainbow'}];
const proposedCss=`
/* EXPERIMENT ONLY. 62/38 inspector/preview ratio; NOT shipped. */
@media (min-width:570px) and (max-width:790px) and (max-height:530px) and (orientation:landscape){
 body.mobile-studio.mobile-edit-open .layout{
   position:fixed!important;inset:0!important;display:block!important;
   width:100vw!important;height:100dvh!important;overflow:hidden!important;
 }
 body.mobile-studio.mobile-edit-open .workspace{
   position:fixed!important;left:62%!important;right:0!important;
   top:0!important;bottom:0!important;width:38%!important;
   height:100dvh!important;max-height:100dvh!important;
   margin:0!important;padding:6px!important;overflow:hidden!important;
 }
 body.mobile-studio.mobile-edit-open .studio-stage{
   width:100%!important;height:100%!important;min-height:0!important;
   max-height:none!important;
 }
 body.mobile-studio.mobile-edit-open .sidebar{
   position:fixed!important;top:0!important;bottom:0!important;
   left:0!important;right:auto!important;width:62%!important;
   height:100dvh!important;max-height:100dvh!important;min-height:0!important;
   padding:0 8px 4px!important;border-radius:0!important;
   transform:translateY(0)!important;overflow:hidden!important;
 }
 /* Experiment with honest two-row labels, not overlapping seven text tabs. */
 body.mobile-studio.mobile-edit-open .sidebar .settings-tabs{
   grid-template-columns:repeat(4,minmax(0,1fr))!important;
   grid-template-rows:repeat(2,35px)!important;
   height:70px!important;min-height:70px!important;max-height:70px!important;
   flex:0 0 70px!important;
 }
}`;
const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();
 return {x:r.x,y:r.y,width:r.width,height:r.height,
  right:r.right,bottom:r.bottom};};
const overlap=(a,b)=>!a||!b?0:Math.max(0,Math.min(a.right,b.right)-Math.max(a.x,b.x))*
 Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y));
const browser=await chromium.launch({headless:true});
const records=[],failures=[],baselineDefects=[];
await mkdir(output,{recursive:true});
try{
 for(const size of sizes)for(const theme of ['cream','dark']){
  const ctx=await browser.newContext({viewport:{width:size.width,height:size.height},
    isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  try{
   const page=await ctx.newPage();
   await page.goto(base,{waitUntil:'domcontentloaded'});
   await page.locator('.editor-tool-tab').first().waitFor({state:'attached'});
   await page.locator('[data-studio-theme="'+theme+'"]').evaluate(el=>el.click());
   // The actual Edit button, not a fabricated editor DOM.
   await page.locator('#mobileEdit').click();
   for(const scene of scenes){
    const sel='#tab-'+scene.tab;
    await page.locator(sel).evaluate(el=>el.click());
    const chip='.editor-tool-tab[data-editor-tool="'+scene.tool+'"]';
    if(!await page.locator(chip).count())throw Error('Original tool missing '+chip);
    await page.locator(chip).evaluate(el=>el.click());
    const key=size.id+'/'+theme+'/'+scene.id;
    const capture=async(kind)=>{
     const shot=await page.evaluate(toolId=>{
      const sel=s=>document.querySelector(s);
      const get=e=>{if(!e)return null;const r=e.getBoundingClientRect();
       return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
      const hit=e=>{if(!e)return false;const r=e.getBoundingClientRect();
       const x=r.x+r.width/2,y=r.y+r.height/2;
       if(x<0||y<0||x>=innerWidth||y>=innerHeight)return false;
       const p=document.elementFromPoint(x,y);return p===e||e.contains(p)};
      const card=sel('.editor-tool-card[data-editor-tool="'+toolId+'"]');
      const targets=[
       ['selectedTool',sel('.editor-tool-tab[data-editor-tool="'+toolId+'"]')],
       ['settingCategory',sel('.settings-tab[aria-selected="true"]')],
       ['sourceRow',card?.querySelector('.editor-setting-row')],
       ['sourceControl',card?.querySelector('input:not([disabled]),select:not([disabled]),button:not([disabled])')],
       ['dismiss',sel('#mobileDismissHandle')],
       ['dockReturn',sel('.mobile-dock-expand')],
       ['zoomIn',sel('.mobile-zoom-button[data-zoom="in"]')],
      ].map(([id,el])=>({id,rect:get(el),hit:hit(el),
        disabled:!!el?.disabled,hidden:!el||getComputedStyle(el).display==='none'}));
      return {
       viewport:[innerWidth,innerHeight],body:document.body.className,
       stage:get(sel('.studio-stage')),preview:get(sel('#preview')),
       wallpaper:get(sel('.wallpaper-frame')),sidebar:get(sel('.sidebar')),
       layout:get(sel('.layout')),selectedCard:get(card),
       targets,sourceRows:card?[...card.querySelectorAll('.editor-setting-row')]
        .filter(e=>get(e).width&&get(e).height)
        .map(e=>({key:e.dataset.controlKeys,rect:get(e)})):[],
       numberOfSourceInputs:card?.querySelectorAll('input,select').length||0,
       rotationActions:card?[...card.querySelectorAll('.rotation-controls button,.rotation-controls input[type=number]')]
         .map(e=>({name:e.getAttribute('aria-label')||e.getAttribute('title')||e.textContent?.trim(),
           rect:get(e),hit:hit(e),disabled:!!e.disabled,
           visible:get(e).width>0&&get(e).height>0})):[],
       scrollWidth:document.documentElement.scrollWidth
      };
     },scene.tool);
     const filename=kind+'/'+size.id+'/'+theme+'/'+scene.id+'.png';
     await mkdir(join(output,kind,size.id,theme),{recursive:true});
     await page.screenshot({path:join(output,filename),animations:'disabled'});
     return {...shot,file:filename};
    };
    // Baseline screenshot first. Remove prototype styles between scenes so
    // each comparison starts with actual committed production CSS.
    for(const old of await page.locator('style[data-experimental-294]').all())
     await old.evaluate(el=>el.remove());
    const before=await capture('production');
    const injected=await page.addStyleTag({content:proposedCss});
    await injected.evaluate(el=>el.setAttribute('data-experimental-294','true'));
    const after=await capture('experimental');
    const gain=before.preview.width?after.preview.width/before.preview.width:null;
    const stageSidebarOverlap=overlap(after.stage,after.sidebar);
    const portrait=size.width<=size.height;
    // A prototype is not accepted solely for making the canvas bigger.
    // Log all source hitability/size tradeoffs for independent human review.
    const deltas={
      canvasWidthRatio:gain===null?null:Number(gain.toFixed(3)),
      previewDeltaHeight:Number((after.preview.height-before.preview.height).toFixed(2)),
      stageSidebarOverlap:Number(stageSidebarOverlap.toFixed(2)),
      sourceInputCountEqual:before.numberOfSourceInputs===after.numberOfSourceInputs,
      selectedToolHitBefore:before.targets.find(t=>t.id==='selectedTool')?.hit,
      selectedToolHitAfter:after.targets.find(t=>t.id==='selectedTool')?.hit,
      sourceControlHitBefore:before.targets.find(t=>t.id==='sourceControl')?.hit,
      sourceControlHitAfter:after.targets.find(t=>t.id==='sourceControl')?.hit,
      rotationHitBefore:before.rotationActions.filter(a=>a.visible&&!a.disabled&&a.hit).length+
       '/'+before.rotationActions.filter(a=>a.visible&&!a.disabled).length,
      rotationHitAfter:after.rotationActions.filter(a=>a.visible&&!a.disabled&&a.hit).length+
       '/'+after.rotationActions.filter(a=>a.visible&&!a.disabled).length,
      sourceCardFitsAfter:!!after.selectedCard&&!!after.sidebar&&
       after.selectedCard.bottom<=after.sidebar.bottom+1,
      portraitUnchanged:!portrait||Math.abs(after.preview.width-before.preview.width)<.2
    };
    if(!before.preview.width||!before.preview.height)
     baselineDefects.push({key,error:'Production native canvas is zero-sized',preview:before.preview,stage:before.stage});
    if(!after.preview.width||!after.preview.height)
     failures.push({key,error:'Experimental native canvas is zero-sized'});
    if(!deltas.sourceInputCountEqual)
     failures.push({key,error:'Source controls changed count in style-only experiment'});
    if(!deltas.portraitUnchanged)
     failures.push({key,error:'Landscape-only proposal altered portrait viewport'});
    if(stageSidebarOverlap>2)failures.push({key,error:'Proposal lays source inspector over stage'});
    records.push({key,size,theme,scene,production:before,experimental:after,deltas});
    console.log('LANDSCAPE_294 '+JSON.stringify({key,...deltas}));
   }
   await page.close();
  }catch(e){failures.push({viewport:size.id,theme,error:String(e)});}
  finally{await ctx.close();}
 }
}finally{await browser.close();}
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const grid=records.map(r=>'<article><h2>'+esc(r.key)+'</h2><p>Actual source canvas width: '+
 r.production.preview.width.toFixed(1)+'px baseline → '+
 r.experimental.preview.width.toFixed(1)+'px prototype; ratio '+
 (r.deltas.canvasWidthRatio===null?'undefined (0px baseline)':r.deltas.canvasWidthRatio.toFixed(2)+'×')+'. Original source hit: '+
 esc(String(r.deltas.sourceControlHitAfter))+'</p><div class="pair">'+
 '<figure><img src="'+esc(r.production.file)+'" alt="Production screenshot"><figcaption>PRODUCTION BASELINE</figcaption></figure>'+
 '<figure><img src="'+esc(r.experimental.file)+'" alt="Experimental CSS-injected screenshot"><figcaption>EXPERIMENT ONLY, NOT SHIPPED</figcaption></figure>'+
 '</div></article>').join('');
await writeFile(join(output,'review.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><title>#294 live landscape experiment</title><style>
body{font:14px system-ui;background:#f5f2ee;color:#211c27;margin:18px}
article{background:white;border:1px solid #d0c9cb;padding:12px;margin-bottom:14px}
h1{font-size:22px}h2{font-size:15px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}
figure{margin:0}img{max-width:100%;height:auto;border:1px solid #ddd}
figcaption{font-size:11px;font-weight:700;padding:5px;color:#594c61}
p{font-size:12px}</style><h1>Issue #294: real source side-by-side A/B</h1>
<p>The LEFT images are unaltered production DOM and CSS. RIGHT are the same running
application and controls with a temporary media-guarded CSS prototype injected solely
by Playwright. No product feature, visual default, canonical plate, or simulation changed.
At 600×360 the unmodified production canvas is 0×0: tracked as issue #301, not a prototype failure. Desktop and physical-device approval remain unclaimed.</p>`+grid+'</html>');
await writeFile(join(output,'measurements.json'),JSON.stringify({
 status:failures.length?'experiment invariant failure':'experiment measured; existing baseline defects reported separately',
 method:'Actual Chromium source DOM; temporary landscape-only CSS style injection; NOT a merged application design',
 profiles:sizes,scenes,variantStyles:proposedCss,records,failures,baselineDefects,
 limits:['No human taste judgment','No physical-device guarantee',
 'DOM-invoked category selection is not physical touch','CSS concept does not assert ideal usability']
},null,2));
console.log('LANDSCAPE_294_SUMMARY',JSON.stringify({states:records.length,
 failures:failures.length,baselineDefects:baselineDefects.length,issues:failures}));
if(failures.length)process.exitCode=1;
