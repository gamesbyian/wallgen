#!/usr/bin/env node
/**
 * Agent 1 high-DPI Chromium optical challenge.
 * These are true touch-emulated Playwright taps and real source screenshots,
 * NOT proof of a physical Pixel 6 Pro or Android's OS font/screen settings.
 */
import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const output=resolve(process.argv.find(x=>x.startsWith('--out='))?.slice(6)||'artifacts/visual-agent1-dpr');
const base=process.argv.find(x=>x.startsWith('--base-url='))?.slice(11)||'http://127.0.0.1:4173';
const profiles=[
  // The declared minimum supported portrait width was missing from the
  // high-density *touch* journey, despite having source-click screenshot checks.
  {id:'minimum-320-portrait',width:320,height:700,dpr:3},
  {id:'narrow-360-portrait',width:360,height:740,dpr:3},
  {id:'pixel6pro-css-proxy',width:412,height:892,dpr:3.5},
  {id:'edge-499-portrait',width:499,height:892,dpr:3},
  {id:'edge-500',width:500,height:892,dpr:3},
  {id:'short-landscape',width:700,height:412,dpr:3},
];
const states=[
 {id:'studio',apply:async()=>{}},
 {id:'edit-material',apply:async page=>{
   await page.locator('#mobileEdit').tap();
   await page.locator('#tab-material').tap();
   await page.locator('.editor-tool-tab[data-editor-tool="finish1"]').tap();
 }},
 {id:'edit-interior',apply:async page=>{
   await page.locator('#mobileEdit').tap();
   await page.locator('#tab-details').tap();
   await page.locator('.editor-tool-tab[data-editor-tool="interior"]').tap();
 }},
 {id:'explore',apply:async page=>{
   await page.locator('#mobileExplore').tap();
   await page.locator('#gallery').waitFor({state:'visible'});
 }},
 {id:'saved',apply:async page=>{
   await page.locator('#mobileSaved').tap();
   await page.locator('#gallery').waitFor({state:'visible'});
 }},
 {id:'more',apply:async page=>{
   await page.locator('#mobileMore').tap();
   await page.locator('#mobileToolsSheet:not([hidden])').waitFor({state:'visible'});
 }},
 {id:'draw',apply:async page=>{
   await page.locator('#drawPathToggle').tap();
   await page.locator('#drawPathPanel:not([hidden])').waitFor({state:'visible'});
 }},
];
const errors=[],warnings=[],records=[];
const screenshotWidth=(buffer)=>buffer.readUInt32BE(16);
const screenshotHeight=(buffer)=>buffer.readUInt32BE(20);
const browser=await chromium.launch({headless:true});
try{
 for(const profile of profiles)for(const theme of ['cream','dark']){
  const context=await browser.newContext({
    viewport:{width:profile.width,height:profile.height},isMobile:true,
    hasTouch:true,deviceScaleFactor:profile.dpr,reducedMotion:'reduce'
  });
  try{
   for(const state of states){
    const key=profile.id+'/'+theme+'/'+state.id;
    const page=await context.newPage();
    try{
     await page.goto(base,{waitUntil:'domcontentloaded'});
     await page.locator('#mobileEdit').waitFor({state:'visible'});
     await page.locator('[data-studio-theme="'+theme+'"]').tap();
     await state.apply(page);
     await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>
       requestAnimationFrame(()=>requestAnimationFrame(r)));});
     const geometry=await page.evaluate(()=>{
       const rect=sel=>{
        const el=document.querySelector(sel);
        if(!el)return null;
        const r=el.getBoundingClientRect(),css=getComputedStyle(el);
        return {x:r.x,left:r.left,right:r.right,y:r.y,top:r.top,bottom:r.bottom,
          width:r.width,height:r.height,visible:css.display!=='none'&&
          css.visibility!=='hidden'&&r.width>0&&r.height>0};
       };
       const stage=rect('.studio-stage'),preview=rect('#preview'),sidebar=rect('.sidebar'),
         gallery=rect('.gallery-section'),more=rect('#mobileToolsSheet'),
         dock=rect('#mobileActionDock');
       const body=document.body;
       const surface=body.classList.contains('mobile-edit-open')?sidebar:
         body.classList.contains('mobile-gallery-open')?gallery:
         body.classList.contains('mobile-tools-open')?more:null;
       const overlap=stage?.visible&&surface?.visible?
         Math.max(0,Math.min(stage.bottom,surface.bottom)-Math.max(stage.top,surface.top)):0;
       const labels=[...document.querySelectorAll('#mobileActionDock>button')].map(el=>{
         const r=el.getBoundingClientRect();
         const caption=el.querySelector('small')?.getBoundingClientRect();
         const hit=document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2);
         return {name:el.textContent.trim(),rect:{left:r.left,right:r.right,top:r.top,bottom:r.bottom},
           caption:caption?{left:caption.left,right:caption.right,top:caption.top,bottom:caption.bottom}:null,
           hit:hit===el||el.contains(hit)};
       });
       const dockNode=document.querySelector('#mobileActionDock');
       return {stage,preview,surface,dock,overlap,labels,
         dockInert:!!dockNode?.inert||
           [...(dockNode?.querySelectorAll('button')||[])].every(b=>b.inert||!!b.closest('[inert]')),
         horizontalScroll:document.documentElement.scrollWidth>innerWidth+1,
         cssViewport:{width:innerWidth,height:innerHeight},
         scale:window.visualViewport?.scale};
     });
     const file='screens/'+profile.id+'/'+theme+'/'+state.id+'.png';
     await mkdir(join(output,'screens',profile.id,theme),{recursive:true});
     await page.screenshot({path:join(output,file),fullPage:false,animations:'disabled'});
     const data=await readFile(join(output,file));
     const png={width:screenshotWidth(data),height:screenshotHeight(data)};
     records.push({key,profile:profile.id,theme,state:state.id,file,png,
       cssViewport:[profile.width,profile.height],deviceScaleFactor:profile.dpr,
       interaction:'true Playwright touch .tap() on original browser elements',
       geometry});
     if(png.width!==Math.round(profile.width*profile.dpr)||
        png.height!==Math.round(profile.height*profile.dpr))
       throw Error('Unexpected physical PNG resolution '+JSON.stringify(png));
     if(geometry.horizontalScroll||geometry.overlap>1)
       throw Error('Layout overflow or stage/sheet intersection '+JSON.stringify(geometry));
     // A previous short-phone-landscape bug collapsed the actual canvas to
     // 0x0 while the stage box still existed. Guard intended PORTRAIT editing
     // (and Studio/Draw), without creating a non-target landscape release gate.
     const portrait=profile.width<profile.height;
     const artworkState=state.id==='studio'||state.id.startsWith('edit-')||state.id==='draw';
     if(portrait&&artworkState&&
       (!geometry.preview?.visible||geometry.preview.width<1||geometry.preview.height<1))
       throw Error('Supported portrait source preview collapsed: '+JSON.stringify(geometry.preview));
     // The full editor deliberately moves the bottom dock off-screen and
     // makes it inert. Only visible mobile destinations should be hittable.
     const editing=state.id.startsWith('edit-');
     const unobstructed=geometry.labels.every(x=>x.hit);
     const completelyOffscreen=geometry.labels.every(x=>
       x.rect.left>=profile.width-1||x.rect.right<=1);
     const captionContained=geometry.labels.every(x=>x.caption&&
       x.caption.left>=x.rect.left-1&&x.caption.right<=x.rect.right+1&&
       x.caption.top>=x.rect.top-1&&x.caption.bottom<=x.rect.bottom+1);
     if(geometry.labels.length!==5||!captionContained||
       (editing?(!completelyOffscreen||!geometry.dockInert):!unobstructed))
       throw Error('Dock visibility/hidden-inert state violates source navigation: '+
         JSON.stringify({editing,unobstructed,completelyOffscreen,
           dockInert:geometry.dockInert,labels:geometry.labels}));
     console.log('HIGH-DPI CAPTURE '+key+' physical='+png.width+'x'+png.height);
    }catch(e){
     // Preserve source screenshots and report genuine non-target landscape
     // failures without turning sideways phone editing into a release gate.
     const diagnostic={key,error:String(e)};
     if(profile.width>profile.height){
       warnings.push(diagnostic);
       console.warn('HIGH-DPI NONBLOCKING LANDSCAPE '+key+' '+e);
     }else{
       errors.push(diagnostic);
       console.error('HIGH-DPI FAILURE '+key+' '+e);
     }
    }finally{await page.close();}
   }
  }finally{await context.close();}
 }
}finally{await browser.close();}
await mkdir(output,{recursive:true});
const portraitProfiles=profiles.filter(p=>p.height>p.width);
const requiredPortrait=portraitProfiles.length*2*states.length;
const capturedPortrait=records.filter(r=>portraitProfiles.some(p=>p.id===r.profile)).length;
if(capturedPortrait!==requiredPortrait)
 errors.push({error:'Missing supported portrait screenshot states '+capturedPortrait+'/'+requiredPortrait});
await writeFile(join(output,'manifest.json'),JSON.stringify({
  provenance:'Real browser Chromium source; touch/DPR emulation only, not Pixel hardware or Android OS',
  profiles,states:states.map(({id})=>id),records,errors,warnings,
  scope:'Portrait phone checks are required; historical short phone landscape is diagnostic only'
},null,2));
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
await writeFile(join(output,'review.html'),'<html lang="en"><meta charset="utf-8">'+
 '<title>ROYGBIV high-DPI touch optical review</title><style>body{font:14px system-ui;background:#f7f2e9;'+
 'color:#211a2a;margin:18px}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));'+
 'gap:10px}article{background:#fff;border:1px solid #ccc;border-radius:10px;padding:10px}'+
 'img{width:100%;height:auto}h2{font-size:14px}</style><h1>True touch-emulated high-density source frames</h1>'+
 '<p>Source app, two themes, original taps, DPR 3 to 3.5. These raster frames are NOT an Android or physical-device sign-off. Supported portrait issues fail acceptance; historical short phone-landscape checks are non-blocking diagnostics only.</p>'+
 '<main>'+records.map(r=>'<article><h2>'+escape(r.key)+' · '+r.png.width+'×'+r.png.height+
 '</h2><img loading="lazy" src="'+escape(r.file)+'" alt="Real Chromium '+escape(r.state)+
 ' touch-rendered screenshot"><p>'+escape(r.profile)+' source layout, DPR '+r.deviceScaleFactor+
 '</p></article>').join('')+'</main></html>');
console.log('HIGH-DPI EVIDENCE: '+records.length+' real physical-resolution screenshots, '+errors.length+' required portrait errors; '+warnings.length+' optional landscape diagnostics');
if(errors.length)process.exitCode=1;
