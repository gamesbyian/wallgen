#!/usr/bin/env node
/**
 * UI state atlas. Art is deliberately held to a fixed recipe: this inventories
 * navigable controls, not generated wallpaper variations.
 *
 * Run: npm run screenshots:ui
 * Options: --base-url=http://127.0.0.1:4173 --out=artifacts/ui-atlas
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { EDITOR_CATEGORIES } from '../src/editor-schema.js';
import { captureSpecialStates } from './ui-atlas-special.mjs';
import { writeAtlasReport } from './ui-atlas-report.mjs';

const arg = key => process.argv.find(x => x.startsWith('--'+key+'='))?.split('=').slice(1).join('=');
const baseURL = arg('base-url') || 'http://127.0.0.1:4173';
const out = resolve(arg('out') || 'artifacts/ui-atlas');
const zooms = [100,75,66,50];
const surfaces = [
  {id:'desktop',viewport:{width:1440,height:900},mobile:false},
  {id:'pixel-6-pro',viewport:{width:412,height:892},mobile:true}
];
const cases=[];const errors=[];const inapplicable=[];const seen=new Set();
const safe=s=>String(s).toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-|-$/g,'');
const browser=await chromium.launch({headless:true});
const fixedSeed='ui-atlas-fixed';
async function settle(page){
  await page.waitForTimeout(160);
  await page.evaluate(async()=>{
    await document.fonts.ready;
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  });
}
async function clickIfVisible(page,selector){
  const loc=page.locator(selector).first();
  if(await loc.count() && await loc.isVisible() && await loc.isEnabled()){
    await loc.click({timeout:2500});return true;
  }
  return false;
}
async function change(page,name,value){
  const field=page.locator('#controls [name="'+name+'"]').first();
  if(!await field.count())throw Error('Missing setting '+name);
  await field.evaluate((el,value)=>{
    if(el.type==='checkbox')el.checked=Boolean(value);
    else el.value=String(value);
    el.dispatchEvent(new Event(el.type==='range'?'input':'change',{bubbles:true}));
    if(el.type==='range')el.dispatchEvent(new Event('change',{bubbles:true}));
  },value);
  await settle(page);
}
async function capture(page,context,slug,meta={}){
  const key=context.surface.id+'/'+context.zoom+'/'+slug;
  if(seen.has(key))return;
  seen.add(key);
  const filename=join(context.surface.id,String(context.zoom),safe(slug)+'.png');
  await mkdir(join(out,context.surface.id,String(context.zoom)),{recursive:true});
  await settle(page);
  const visible=await page.evaluate(()=>[...document.querySelectorAll('[role="dialog"],dialog,.editor-tool-card:not([hidden]),[aria-expanded="true"]')]
    .filter(x=>x.getBoundingClientRect().width>0 && x.getBoundingClientRect().height>0)
    .slice(0,12).map(x=>x.id||x.getAttribute('aria-label')||x.dataset.editorTool||x.tagName));
  await page.screenshot({path:join(out,filename),animations:'disabled',fullPage:false});
  cases.push({id:key,file:filename,zoomPercent:context.zoom,profile:context.surface.id,visible, ...meta});
  if(cases.length%50===0)console.log('Atlas progress:',cases.length,'screenshots,',errors.length,'traversal errors, last:',key);
}
async function openEditor(page,surface){
  if(surface.mobile)await clickIfVisible(page,'#mobileEdit');
  await settle(page);
}
async function navigate(page,category,tool){
  await clickIfVisible(page,'#tab-'+category);
  const chip=page.locator('[data-editor-tool="'+tool+'"].editor-tool-tab');
  if(await chip.isVisible())await chip.click();
  await settle(page);
  const active=await page.locator('.editor-tool-card[data-editor-tool="'+tool+'"]').evaluate(el=>!el.hidden&&el.getBoundingClientRect().height>0).catch(()=>false);
  if(!active)throw Error('Tool unreachable: '+category+'/'+tool);
}
async function exercise(page,ctx){
  await capture(page,ctx,'studio-default',{kind:'shell'});
  await openEditor(page,ctx.surface);
  await capture(page,ctx,'editor-open',{kind:'shell'});
  // Every canonical tool, in each structural family. Unsupported tools are
  // recorded as deliberately inapplicable rather than falsely covered.
  for(const [structure,recipe] of Object.entries({
    paths:{structure:'paths',geometry:'straight',construction:'ribbon',composition:'single'},
    radial:{structure:'radial',radialMode:'sunburst'},
    regions:{structure:'regions',regionMode:'voronoi'},
    nested:{structure:'regions',regionMode:'nested'},
    tonal:{structure:'paths',construction:'tonal'}
  })){
    for(const [name,value] of Object.entries(recipe))await change(page,name,value);
    for(const category of EDITOR_CATEGORIES){
      for(const tool of category.tools){
        try {
          // Category availability depends on the structural family and mode.
          // A hidden chip represents a non-applicable tool, not a failure.
          await clickIfVisible(page,'#tab-'+category.id);
          const available=page.locator('[data-editor-tool="'+tool.id+'"].editor-tool-tab');
          if(!await available.isVisible() || !await available.isEnabled()){
            inapplicable.push({profile:ctx.surface.id,zoom:ctx.zoom,structure,category:category.id,tool:tool.id});
            continue;
          }
          await navigate(page,category.id,tool.id);
          await capture(page,ctx,'tool-'+structure+'-'+category.id+'-'+tool.id,{kind:'tool',structure,category:category.id,tool:tool.id,settings:tool.settings});
          // Reveal controls below a scrollable card's fold.
          const last=page.locator('.editor-tool-card[data-editor-tool="'+tool.id+'"] input:not([type=hidden]),.editor-tool-card[data-editor-tool="'+tool.id+'"] select,.editor-tool-card[data-editor-tool="'+tool.id+'"] button').last();
          if(await last.count()){
            const shifted=await last.evaluate(el=>{
              const ancestors=[document.scrollingElement];
              for(let p=el.parentElement;p;p=p.parentElement)
                if(p.scrollHeight>p.clientHeight+2)ancestors.push(p);
              const positions=ancestors.map(a=>a.scrollTop);
              el.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
              return ancestors.some((a,i)=>Math.abs(a.scrollTop-positions[i])>15);
            });
            if(shifted)await capture(page,ctx,'tool-'+structure+'-'+category.id+'-'+tool.id+'-scrolled',{kind:'tool-tail',structure,category:category.id,tool:tool.id});
          }
          // Disabled, active, locked and expanded control states are distinct UI.
          const card=page.locator('.editor-tool-card[data-editor-tool="'+tool.id+'"]');
          const field=card.locator('select:not(:disabled),input[type=checkbox]:not(:disabled)').first();
          if(await field.count()){
            const kind=await field.evaluate(el=>el.type);
            if(kind==='checkbox'){
              await field.evaluate(el=>{el.checked=!el.checked;el.dispatchEvent(new Event('change',{bubbles:true}));});
              await capture(page,ctx,'state-'+structure+'-'+tool.id+'-checked',{kind:'control-state'});
              await field.evaluate(el=>{el.checked=!el.checked;el.dispatchEvent(new Event('change',{bubbles:true}));});
            }
          }
        }catch(e){
          errors.push({profile:ctx.surface.id,zoom:ctx.zoom,structure,category:category.id,tool:tool.id,error:String(e)});
        }
      }
    }
  }
  // Conditional panels need explicit activating recipes.
  const variants=[
    ['repeat',{structure:'paths',composition:'repeat'}],
    ['floating',{structure:'paths',composition:'floating'}],
    ['diagonal',{structure:'paths',orientation:'diagonal'}],
    ['hairpin',{structure:'paths',geometry:'hairpin'}],
    ['loop',{structure:'paths',geometry:'loop'}],
    ['loops',{structure:'paths',geometry:'loops'}],
    ['stepped',{structure:'paths',geometry:'stepped'}],
    ['chevron',{structure:'paths',geometry:'chevron'}],
    ['radial-pinwheel',{structure:'radial',radialMode:'pinwheel'}],
    ['radial-concentric',{structure:'radial',radialMode:'concentric'}],
    ['regions-nested',{structure:'regions',regionMode:'nested'}],
    ['motif-dots',{structure:'paths',construction:'ribbon',motif:'dots'}],
    ['construction-woven',{structure:'paths',construction:'woven'}],
    ['construction-stroke',{structure:'paths',construction:'stroke'}],
    ['construction-tonal',{structure:'paths',construction:'tonal'}],
    ['radial-spokes',{structure:'radial',radialMode:'spokes'}],
    ['regions-organic',{structure:'regions',regionMode:'organic'}],
    ['material-layers',{structure:'paths',material:'grain',textureLayer2Enabled:true,material2:'linen',textureLayer3Enabled:true,material3:'grain'}],
    ['lighting',{lightingMood:'daylight',lightStrength:50,shadowStrength:30}],
    ['shadows',{stripeShadowStrength:55}],
    ['outline',{structure:'paths',outline:'white'}]
  ];
  for(const [name,values] of variants){
    try{
      for(const [key,value] of Object.entries({structure:'paths',composition:'single',orientation:'vertical',geometry:'straight',construction:'ribbon',...values}))await change(page,key,value);
      const categoryTool=name==='repeat'||name==='floating'?['layout','arrange']:
        name==='diagonal'?['layout','direction']:
        name==='material-layers'?['material','layer3']:
        name==='lighting'?['effects','lighting']:
        name==='shadows'?['details','shadows']:
        name==='outline'?['details','outlines']:
        name.startsWith('radial')?['path','ray-shape']:
        name.startsWith('regions')?['path','region-detail']:
        name==='motif-dots'?['stripes','marks']:
        name.startsWith('construction')?['stripes','structure']:
        ['path',name==='hairpin'?'turn':name==='loop'?'single-loop':name==='loops'?'safety':'shape-details'];
      await navigate(page,...categoryTool);
      await capture(page,ctx,'conditional-'+name,{kind:'conditional',values});
    }catch(e){errors.push({profile:ctx.surface.id,zoom:ctx.zoom,case:name,error:String(e)});}
  }
  await captureSpecialStates({page,ctx,capture,navigate,change,settle,clickIfVisible,errors});
  // Shell states and special tools: do not upload/download or alter assets.
  for(const [name,selector] of [
    ['editor-search','.editor-search-toggle'],
    ['primes-only','[name=primesOnly]'],
    ['draw-path','#drawPathToggle'],
    ['metadata','#metadataToggle'],
    ['favorites','#showFavorites'],
    ['mobile-more','#mobileMore'],
    ['mobile-explore','#mobileExplore'],
    ['mobile-dock-expand','#mobileDockExpand']
  ]){
    try{
      if(await clickIfVisible(page,selector)){
        await capture(page,ctx,'shell-'+name,{kind:'surface-state'});
        if(name==='draw-path')await clickIfVisible(page,'#drawPathToggle');
        else if(name==='mobile-more')await clickIfVisible(page,'#mobileMore');
        else if(name==='mobile-explore')await clickIfVisible(page,'#mobileExplore');
        else if(name==='mobile-dock-expand')await clickIfVisible(page,'#mobileDockExpand');
      }
    }catch(e){errors.push({profile:ctx.surface.id,zoom:ctx.zoom,case:name,error:String(e)});}
  }
}
try{
  for(const surface of surfaces){
    for(const zoom of zooms){
      const context=await browser.newContext({viewport:surface.viewport,isMobile:surface.mobile,hasTouch:surface.mobile,deviceScaleFactor:1, reducedMotion:'reduce'});
      const page=await context.newPage();
      page.on('pageerror',e=>errors.push({profile:surface.id,zoom,case:'pageerror',error:String(e)}));
      try{
        await page.goto(baseURL,{waitUntil:'domcontentloaded'});
        await page.evaluate(({zoom,fixedSeed})=>{
          localStorage.clear();
          document.documentElement.style.zoom=(zoom/100).toString();
          const seed=document.querySelector('#seedInput');
          if(seed){seed.value=fixedSeed;seed.dispatchEvent(new Event('change',{bubbles:true}));}
        },{zoom,fixedSeed});
        await page.locator('#applySeed').evaluate(el=>el.click());
        // The canvas is only a positional reference for the UI. Suppressing
        // its image dramatically reduces artifact size and removes all false
        // variation from the screenshots. Controls, overlays and frames remain.
        await page.addStyleTag({content:`
          #preview, #gallery .thumb canvas { visibility:hidden!important; }
          .wallpaper-surface { background: #d2d2d2!important; }
          #gallery .thumb { background:#e4e4e4; }
        `});
        await settle(page);
        await exercise(page,{surface,zoom});
      }catch(e){errors.push({profile:surface.id,zoom,case:'fatal',error:String(e)});}
      finally{await context.close();}
    }
  }
}finally{await browser.close();}
await mkdir(out,{recursive:true});
const missingExpected=[];
for(const surface of surfaces)for(const zoom of zooms){
  const subset=cases.filter(x=>x.profile===surface.id && x.zoomPercent===zoom);
  const required=[
    ...EDITOR_CATEGORIES.flatMap(c=>c.tools.map(t=>({kind:'tool',tool:t.id}))),
    ...['repeat','floating','diagonal','hairpin','loop','loops','stepped','chevron','radial-pinwheel','radial-concentric','radial-spokes','regions-nested','regions-organic','motif-dots','construction-woven','construction-stroke','construction-tonal','material-layers','lighting','shadows','outline'].map(name=>({id:'conditional-'+name})),
    ...['dark-theme','vary-wild','search-expanded-empty','setting-locked','interior-empty','interior-one-element','interior-band-style','interior-contour-placement','interior-custom-colour-enabled','interior-two-elements','interior-stack-locked','gallery-empty-favourites','gallery-with-favourite','metadata-expanded','draw-empty-panel','draw-ready-path','draw-edit-point-anchors','image-import-candidate-or-error'].map(name=>({id:'special-'+name})),
    ...(surface.mobile?[{id:'special-mobile-edit-rail'}]:[])
  ];
  for(const expectation of required){
    if(!subset.some(x=>Object.entries(expectation).every(([k,v])=>k==='id'?x.id.endsWith('/'+v):x[k]===v)))
      missingExpected.push({profile:surface.id,zoom,missing:expectation});
  }
}
await writeFile(join(out,'manifest.json'),JSON.stringify({created:new Date().toISOString(),baseURL,zoomMethod:'CSS root zoom; viewport held fixed',cases,inapplicable,errors,missingExpected},null,2));
const byKind=Object.groupBy?Object.groupBy(cases,x=>x.kind):{};
const report=['# ROYGBIV UI screenshot atlas','','Profiles: desktop 1440×900, mobile 412×892. Zoom: 100%, 75%, 66%, 50%.','','Screenshots: '+cases.length,'Recorded traversal failures: '+errors.length,'Correctly inapplicable tools: '+inapplicable.length,'Missing required UI states: '+missingExpected.length,'','The manifest lists every attempted screenshot, active overlays and navigation context. Static wallpaper artwork is deliberately unchanged across cases.','','## Coverage by kind',...Object.entries(byKind).map(([k,v])=>'- '+k+': '+v.length),'','## Missing/unreachable states',...errors.map(x=>'- '+JSON.stringify(x)),''];
await writeFile(join(out,'README.md'),report.join('\n'));
await writeAtlasReport(out,{cases,errors,inapplicable,missingExpected});
console.log('UI atlas:',cases.length,'captures,',errors.length,'traversal failures,',missingExpected.length,'missing expected states. Output:',out);
if(errors.length||missingExpected.length)process.exitCode=1;
