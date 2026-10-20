#!/usr/bin/env node
/**
 * #276 real Chromium audit: source range track + label ink + adjacent controls.
 * Observational source state setup; human visual approval is a separate gate.
 * Run after serving the real repository on http://127.0.0.1:4173.
 */
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {EDITOR_CATEGORIES,TOOL_LIST} from '../src/editor-schema.js';
import {toolAppliesToScene} from '../src/editor-tool-applicability.js';

const base=process.argv.find(x=>x.startsWith('--base-url='))?.slice(11)||'http://127.0.0.1:4173';
const out=resolve(process.argv.find(x=>x.startsWith('--out='))?.slice(6)||'artifacts/visual-agent1');
const profiles=[
 {id:'phone-412x892',width:412,height:892},
 {id:'phone-499x892',width:499,height:892},
 {id:'phone-500x892',width:500,height:892},
 {id:'phone-790x892',width:790,height:892},
 {id:'desktop-791x892',width:791,height:892},
 {id:'desktop-850x892',width:850,height:892},
 {id:'desktop-899x892',width:899,height:892},
 {id:'desktop-900x892',width:900,height:892},
 {id:'desktop-1024x892',width:1024,height:892},
 {id:'desktop-1150x892',width:1150,height:892},
 {id:'desktop-1151x892',width:1151,height:892},
 {id:'desktop-1280x892',width:1280,height:892},
 {id:'landscape-700x412',width:700,height:412}
];
const modes=[
 {id:'paths',structure:'paths',construction:'ribbon',regionMode:'voronoi'},
 {id:'radial',structure:'radial',construction:'ribbon',regionMode:'voronoi'},
 {id:'nested',structure:'regions',construction:'ribbon',regionMode:'nested'}
];
const samples=[],failures=[],pictures=[],covered=new Set();
const click=async(page,s)=>page.locator(s).first().evaluate(e=>e.click());
const field=async(page,k,v)=>page.locator('#controls [name="'+k+'"]').evaluate((e,value)=>{
  if(e.type==='checkbox')e.checked=Boolean(value);else e.value=String(value);
  e.dispatchEvent(new Event('change',{bubbles:true}));
},v);
const browser=await chromium.launch({headless:true});
try{
 for(const profile of profiles)for(const theme of ['cream','dark']){
  const mobile=profile.width<=790;
  const ctx=await browser.newContext({viewport:{width:profile.width,height:profile.height},
    isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
  try{
   const page=await ctx.newPage();
   await page.goto(base,{waitUntil:'domcontentloaded'});
   await page.locator('.editor-tool-tab').first().waitFor({state:'attached'});
   await click(page,'[data-studio-theme="'+theme+'"]');
   if(mobile)await click(page,'#mobileEdit');
   await field(page,'textureLayer2Enabled',true);
   await field(page,'textureLayer3Enabled',true);
   for(const mode of modes){
    await field(page,'structure',mode.structure);
    await field(page,'regionMode',mode.regionMode);
    await field(page,'construction',mode.construction);
    for(const category of EDITOR_CATEGORIES){
     const tools=category.tools.filter(tool=>toolAppliesToScene({...tool,category:category.id},mode));
     if(!tools.length)continue;
     await click(page,'#tab-'+category.id);
     for(const tool of tools){
      const key=[profile.id,theme,mode.id,category.id,tool.id].join('/');
      try{
       const chip='.editor-tool-tab[data-editor-tool="'+tool.id+'"]';
       if(await page.locator(chip).isHidden())throw Error('Tool hidden: '+tool.id);
       await click(page,chip);
       const rows=await page.evaluate(toolId=>{
        const card=document.querySelector('.editor-tool-card[data-editor-tool="'+toolId+'"]');
        if(!card||card.hidden)throw Error('No live source card for '+toolId);
        const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();
          return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
        const intersects=(a,b)=>a&&b&&a.left<b.right-1&&a.right>b.left+1&&
          a.top<b.bottom-1&&a.bottom>b.top+1;
        return [...card.querySelectorAll('.field.range-field')].map(f=>{
         const slider=f.querySelector('input[type=range]');
         const stepper=f.querySelector('.stepper');
         const label=f.querySelector(':scope > span');
         if(!slider||!stepper)return null;
         const labelRange=label?document.createRange():null;
         if(labelRange)labelRange.selectNodeContents(label);
         const ink=labelRange?rect(labelRange):null;
         const bounds=rect(f),steps=rect(stepper),track=rect(slider);
         const num=rect(f.querySelector('.slider-number'));
         const buttons=[...stepper.querySelectorAll('.step-button')].map(rect);
         const wrapper=f.closest('.editor-setting-row');
         const die=rect(wrapper?.querySelector(':scope > .editor-setting-die'));
         const lock=rect(wrapper?.querySelector(':scope > .setting-lock'));
         return {sourceKeys:wrapper?.dataset.controlKeys||'',disabled:slider.disabled,
          bounds,steps,track,labelInk:ink,number:num,buttons,die,lock,
          wrapper:rect(wrapper),card:rect(card),
          labelCollision:intersects(ink,steps),
          childCollision:[...buttons,num,track].filter(Boolean).some((a,i,all)=>
            all.slice(i+1).some(b=>intersects(a,b))),
          nativeValue:slider.value,sourceName:slider.name};
        }).filter(Boolean).filter(row=>row.bounds.width>0&&row.bounds.height>0);
       },tool.id);
       samples.push({key,rows});
       for(const r of rows){
        // Small-tray screens may show the last range row as present in DOM
        // while its actual bottom 6px is hidden by the source card clip.
        // This is a physical card-boundary test, not a scrollWidth proxy.
        if(profile.width>=500&&profile.width<=790&&tool.id==='lighting'&&
           r.wrapper&&r.card&&r.wrapper.bottom>r.card.bottom-1)
          failures.push({key,source:r.sourceKeys,type:'Lighting source row below visible card',
            bottomOverflow:r.wrapper.bottom-r.card.bottom});
        if(profile.width>=791){
         if(r.track.width<64)failures.push({key,source:r.sourceKeys,type:'compressed active track',width:r.track.width});
         if(r.labelCollision)failures.push({key,source:r.sourceKeys,type:'label ink overlaps steppers'});
         if(r.childCollision)failures.push({key,source:r.sourceKeys,type:'stepper children intersect'});
         if(r.steps.left<r.bounds.left-1||r.steps.right>r.bounds.right+1)
          failures.push({key,source:r.sourceKeys,type:'stepper outside source field'});
        }
       }
       const pictureKey=[profile.id,theme,category.id].join('/');
       // One live source card per category per profile/theme, never a rendered mock.
       // Additional 791px Path, Material and Effects crops come from the preexisting row census.
       if(!covered.has(pictureKey)&&rows.length){
        const loc=page.locator('.editor-tool-card[data-editor-tool="'+tool.id+'"]');
        const file='range-screens/'+profile.id+'/'+theme+'/'+category.id+'-'+tool.id+'.png';
        await mkdir(join(out,'range-screens',profile.id,theme),{recursive:true});
        await loc.screenshot({path:join(out,file),animations:'disabled',timeout:15000});
        pictures.push({key,category:category.id,file});
        covered.add(pictureKey);
       }
      }catch(error){failures.push({key,type:String(error)});console.error('RANGE AUDIT ERROR',key,String(error));}
     }
    }
   }
   await page.close();
  }finally{await ctx.close();}
 }
}finally{await browser.close();}
await mkdir(out,{recursive:true});
const scopes=samples.flatMap(s=>s.rows.map(r=>({...r,key:s.key})));
const scoped=scopes.filter(x=>/desktop-(791|850|899|900|1024|1150|1151|1280)x892/.test(x.key));
const minimum=scoped.length?Math.min(...scoped.map(x=>x.track.width)):null;
if(!scoped.length)failures.push({type:'No desktop handoff range fields measured'});
if(pictures.length<profiles.length*2*4)
 failures.push({type:'Missing category source screenshots',got:pictures.length});
await writeFile(join(out,'narrow-desktop-range-audit.json'),JSON.stringify({
 source:'actual production controls, measured with Chromium DOMRange and getBoundingClientRect',
 profiles,modes,recordCount:samples.length,rangeFieldCount:scopes.length,
 desktopSourceFields:scoped.length,minDesktopTrackWidth:minimum,
 screenshots:pictures,failures,records:samples
},null,2));
console.log('NARROW RANGE AUDIT: '+samples.length+' live tool states, '+
 scopes.length+' visible source range fields, '+scoped.length+
 ' source >=791px desktop tracks (active and disabled), minimum width '+minimum+'px, '+
 pictures.length+' live screenshots, '+failures.length+' failures');
if(failures.length)process.exitCode=1;
