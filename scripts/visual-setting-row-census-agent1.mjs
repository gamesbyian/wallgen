#!/usr/bin/env node
/** Source-owned, real Chromium setting-row census. Capture is observational;
 * do not pretend a direct DOM click is a physical device tap. */
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {EDITOR_CATEGORIES,TOOL_LIST} from '../src/editor-schema.js';
import {toolAppliesToScene} from '../src/editor-tool-applicability.js';

const base=process.argv.find(x=>x.startsWith('--base-url='))?.slice(11)||'http://127.0.0.1:4173';
const output=resolve(process.argv.find(x=>x.startsWith('--out='))?.slice(6)||'artifacts/visual-agent1');
const modes=[
  {id:'paths-ribbon',structure:'paths',construction:'ribbon',regionMode:'voronoi'},
  {id:'radial',structure:'radial',construction:'ribbon',regionMode:'voronoi'},
  {id:'regions-voronoi',structure:'regions',construction:'ribbon',regionMode:'voronoi'},
  {id:'regions-nested',structure:'regions',construction:'ribbon',regionMode:'nested'},
];
const profiles=[{id:'phone-412x892',width:412,height:892},{id:'desktop-791x892',width:791,height:892}];
const visited=new Set(),records=[],errors=[],rowScreens=[];
const pictured=new Set();
const activeTools=new Set(TOOL_LIST.filter(t=>modes.some(scene=>toolAppliesToScene(t,scene))).map(t=>t.id));
const click=async(page,sel)=>{
  const loc=page.locator(sel).first();
  if(!await loc.count())throw Error('Missing live control '+sel);
  await loc.evaluate(el=>el.click());
};
const field=async(page,key,value)=>{
  const loc=page.locator('#controls [name="'+key+'"]');
  await loc.evaluate((el,v)=>{
    if(el.type==='checkbox')el.checked=Boolean(v);else el.value=String(v);
    el.dispatchEvent(new Event('change',{bubbles:true}));
  },value);
};
const browser=await chromium.launch({headless:true});
try{
 for(const profile of profiles)for(const theme of ['cream','dark']){
  const ctx=await browser.newContext({viewport:{width:profile.width,height:profile.height},
    isMobile:profile.width<=790,hasTouch:profile.width<=790,reducedMotion:'reduce'});
  try{
   const page=await ctx.newPage();
   await page.goto(base,{waitUntil:'domcontentloaded'});
   await page.locator('.editor-tool-tab').first().waitFor({state:'attached'});
   await click(page,'[data-studio-theme="'+theme+'"]');
   if(profile.width<=790)await click(page,'#mobileEdit');
   // Real layer state; the upper layers otherwise hide their rows.
   await field(page,'textureLayer2Enabled',true);
   await field(page,'textureLayer3Enabled',true);
   const tonal=await page.locator('#controls [name="construction"] option[value="tonal"]')
     .evaluate(el=>({hidden:el.hidden,disabled:el.disabled}));
   if(!tonal.hidden||!tonal.disabled)errors.push({profile:profile.id,theme,
     error:'Legacy tonal mode became selectable; extend census to the tonal Shapes tool'});
   for(const mode of modes){
    await field(page,'structure',mode.structure);
    await field(page,'regionMode',mode.regionMode);
    await field(page,'construction',mode.construction);
    for(const category of EDITOR_CATEGORIES){
     const available=category.tools.filter(spec=>
       toolAppliesToScene({...spec,category:category.id},mode));
     if(!available.length)continue;
     await click(page,'#tab-'+category.id);
     for(const spec of available){
      const key=profile.id+'/'+theme+'/'+mode.id+'/'+category.id+'/'+spec.id;
      try{
       const chip='.editor-tool-tab[data-editor-tool="'+spec.id+'"]';
       if(await page.locator(chip).isHidden())throw Error('Expected scene tool is hidden');
       await click(page,chip);
       const state=await page.evaluate(({category,tool})=>{
        const card=document.querySelector('.editor-tool-card[data-editor-tool="'+tool+'"]');
        const cards=[...document.querySelectorAll('.editor-tool-card:not([hidden])')];
        const bounds=card?.getBoundingClientRect();
        const rows=[...card.querySelectorAll('.editor-setting-row')].map(el=>{
          const r=el.getBoundingClientRect(),css=getComputedStyle(el);
          const visible=r.width>0&&r.height>0&&css.display!=='none'&&css.visibility!=='hidden';
          const rotation=el.classList.contains('texture-rotation-field');
          const controls=el.querySelector('.rotation-controls');
          return {keys:el.dataset.controlKeys,category:el.dataset.controlCategory,
            tool:el.dataset.controlTool,kind:el.dataset.controlKind,
            visible,rotation,left:r.left,right:r.right,cardLeft:bounds?.left,
            cardRight:bounds?.right,width:r.width,
            opacity:Number(css.opacity),textColor:css.color,
            buttons:rotation?controls?.querySelectorAll('button').length:undefined,
            numbers:rotation?controls?.querySelectorAll('input[type=number]').length:undefined};
        });
        const fields=[...card.querySelectorAll('input[name],select[name],textarea[name]')]
          .map(el=>el.name);
        return {selected:cards.length===1&&cards[0]===card,visibleCard:!!bounds&&bounds.width>0&&bounds.height>0,
          category,tool,rows,fields};
       },{category:category.id,tool:spec.id});
       visited.add(spec.id);
       records.push({key,...state});
       if(!state.selected||!state.visibleCard)throw Error('Wrong active source tool/card');
       for(const row of state.rows){
        if(row.category!==category.id||row.tool!==spec.id)
          throw Error('Row identity moved to wrong category/tool: '+JSON.stringify(row));
        if(!row.keys||!row.kind)throw Error('Untyped source setting row: '+JSON.stringify(row));
        if(row.visible&&(row.left<row.cardLeft-1||row.right>row.cardRight+1))
          throw Error('Visible source row exceeds card: '+JSON.stringify(row));
        if(row.rotation&&(row.buttons!==5||row.numbers!==1))
          throw Error('Material rotation loses source 5-button/1-number grammar');
       }
       for(const sourceKey of spec.settings.filter(x=>
         !['textureLayer2Enabled','textureLayer3Enabled'].includes(x))){
        if(!state.fields.includes(sourceKey))
          throw Error('Source setting missing from active card: '+sourceKey);
       }
       // One *source-exact* optical crop per reachable tool at each viewport
       // and theme. The 380 scene-specific inspections remain complete in
       // JSON; the 156 PNGs provide human-reviewable family-level evidence.
       const pictureKey=profile.id+'/'+theme+'/'+spec.id;
       if(!pictured.has(pictureKey)){
        const liveCard=page.locator('.editor-tool-card[data-editor-tool="'+spec.id+'"]');
        const file='row-screens/'+profile.id+'/'+theme+'/'+category.id+'-'+spec.id+'.png';
        await mkdir(join(output,'row-screens',profile.id,theme),{recursive:true});
        await liveCard.screenshot({path:join(output,file),animations:'disabled',
          timeout:15000});
        rowScreens.push({key:pictureKey,profile:profile.id,theme,scene:mode.id,
          category:category.id,tool:spec.id,title:spec.name,file,
          sourceRowKeys:state.rows.map(row=>row.keys),sourceRowKinds:state.rows.map(row=>row.kind),
          proof:'actual Chromium crop of the active source editor-tool card'});
        pictured.add(pictureKey);
       }
      }catch(e){errors.push({key,error:String(e)});console.error('ROW CENSUS FAILURE '+key+' '+e);}
     }
    }
   }
   await page.close();
  }finally{await ctx.close();}
 }
}finally{await browser.close();}
const missing=[...activeTools].filter(tool=>!visited.has(tool));
if(missing.length)errors.push({error:'Unvisited applicable tool IDs: '+missing.join(', ')});
if(TOOL_LIST.length!==40||EDITOR_CATEGORIES.length!==7)
 errors.push({error:'Source editor inventory changed from 7 categories / 40 declared tools'});
await mkdir(output,{recursive:true});
const expectedPictures=activeTools.size*profiles.length*2;
if(rowScreens.length!==expectedPictures)
 errors.push({error:'Missing source-exact tool crops: '+rowScreens.length+'/'+expectedPictures});
await writeFile(join(output,'row-census.json'),JSON.stringify({
  provenance:'Real source DOM / Chromium, not generated controls; 2 viewports x 2 themes',
  declaredTools:TOOL_LIST.length,declaredCategories:EDITOR_CATEGORIES.length,
  sceneModes:modes,applicableTools:[...activeTools],visitedTools:[...visited],
  excludedCondition:'tone requires legacy tonal option which is currently hidden and disabled',
  records,rowScreens,expectedPictures,errors
},null,2));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const sections=profiles.flatMap(profile=>['cream','dark'].map(theme=>{
  const cards=rowScreens.filter(s=>s.profile===profile.id&&s.theme===theme);
  return '<section><h2>'+esc(profile.id)+' / '+esc(theme)+'</h2><div class="grid">'+
    cards.map(s=>'<article><h3>'+esc(s.category)+' / '+esc(s.title)+'</h3>'+
      '<img src="'+esc(s.file)+'" alt="Real source editor card: '+esc(s.title)+' in '+
      esc(s.theme)+' at '+esc(s.profile)+'"><p>Actual '+esc(s.scene)+
      ' controls · source keys: '+esc(s.sourceRowKeys.join(', '))+'</p></article>').join('')+
    '</div></section>';
})).join('');
await writeFile(join(output,'row-review.html'),
  '<!doctype html><html lang="en"><meta charset="utf-8"><title>Live ROYGBIV source setting row atlas</title>'+
  '<style>body{font:14px system-ui;background:#f4f0e9;color:#25212c;margin:20px}'+
  '.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,310px),1fr));gap:12px}'+
  'article{background:white;border:1px solid #d1c8c4;border-radius:12px;padding:10px;min-width:0}'+
  'h3{font-size:14px;margin:0 0 8px}img{display:block;max-width:100%;height:auto;'+
  'background:#eee}p{font-size:11px;overflow-wrap:anywhere}</style><h1>Real 7-family editor row atlas</h1>'+
  '<p>'+rowScreens.length+' source-exact Chromium tool-card screenshots across '+
  profiles.length+' CSS viewports, two themes, and '+activeTools.size+
  ' applicable named tools. Screenshots are actual source controls, not redrawn samples. '+
  'Legacy tonal construction is hidden/disabled. This is evidence for human optical review, '+
  'not an aesthetic approval or native Android proof.</p>'+sections+'</html>');
console.log('ROW CENSUS: '+visited.size+'/'+activeTools.size+' applicable tools, '+
  records.length+' real tool-state inspections, '+rowScreens.length+
  ' optical crops, '+errors.length+' errors');
if(errors.length)process.exitCode=1;
