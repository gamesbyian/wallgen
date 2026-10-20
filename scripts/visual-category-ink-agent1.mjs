#!/usr/bin/env node
/**
 * Source-exact narrow-editor category title collision and physical tap test.
 * The historical seven-column 320px grid caused "DETAILSCOLOURMATERIAL"
 * text ink to paint across adjacent tabs while DOM hitboxes stayed distinct.
 * This tests actual glyph rectangles and original .tap() category navigation.
 */
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';

const base=process.argv.find(s=>s.startsWith('--base-url='))?.slice(11)||'http://127.0.0.1:4173';
const output=resolve(process.argv.find(s=>s.startsWith('--out='))?.slice(6)||
  'artifacts/visual-agent1-category-ink');
const profiles=[
  {id:'minimum-320',width:320,height:700},
  {id:'narrow-360',width:360,height:740},
  {id:'edge-399',width:399,height:740},
  {id:'edge-400',width:400,height:740},
  {id:'phone-412',width:412,height:892},
  {id:'edge-499',width:499,height:892},
  {id:'edge-500',width:500,height:892}
];
const themes=['cream','dark'];
const categories=['layout','path','stripes','details','colour','material','effects'];
const results=[],errors=[];
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const profile of profiles)for(const theme of themes){
  const key=profile.id+'/'+theme;
  const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},
    isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  try{
   const page=await context.newPage();
   try{
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.locator('#mobileEdit').tap();
    await page.locator('#tab-layout').waitFor({state:'visible'});
    await page.locator('[data-studio-theme="'+theme+'"]').tap();
    await page.evaluate(async()=>{await document.fonts.ready;});
    const inspect=async()=>page.evaluate(()=>{
      const nav=document.querySelector('body.mobile-studio .sidebar .settings-tabs');
      if(!nav)throw Error('Live seven-category navigation missing');
      const bounds=e=>{
        const r=e.getBoundingClientRect();
        return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,
          width:r.width,height:r.height};
      };
      const items=[...nav.querySelectorAll('.settings-tab')].filter(btn=>!btn.hidden)
        .map(btn=>{
          const range=document.createRange();range.selectNodeContents(btn);
          const ink=bounds(range),box=bounds(btn);
          return {id:btn.id,label:btn.textContent.trim(),ink,box,
            selected:btn.getAttribute('aria-selected')==='true'};
        });
      const collisions=[];
      for(let a=0;a<items.length;a++)for(let b=a+1;b<items.length;b++){
        const x=items[a].ink,y=items[b].ink;
        const overlapX=Math.min(x.right,y.right)-Math.max(x.left,y.left);
        const overlapY=Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top);
        if(overlapX>1&&overlapY>1)
          collisions.push({a:items[a].id,b:items[b].id,overlapX,overlapY});
      }
      const navBox=bounds(nav),style=getComputedStyle(nav);
      return {items,collisions,navBox,scrollLeft:nav.scrollLeft,
        scrollWidth:nav.scrollWidth,clientWidth:nav.clientWidth,
        overflowX:style.overflowX,display:style.display,
        pageHorizontalScroll:document.documentElement.scrollWidth>innerWidth+1};
    });
    const initial=await inspect();
    if(initial.items.length!==7||initial.items.some(x=>!x.id||!x.label))
      throw Error('Expected all seven labelled original source tabs');
    if(initial.collisions.length)throw Error('Category label ink collision: '+JSON.stringify(initial.collisions));
    if(initial.pageHorizontalScroll)throw Error('Horizontal document overflow');
    if(profile.width<=399 &&
       !(initial.scrollWidth>initial.clientWidth+5&&initial.overflowX==='auto'))
      throw Error('Narrow category navigation not independently swipeable');
    const fileRoot=join(output,profile.id,theme);
    await mkdir(fileRoot,{recursive:true});
    await page.screenshot({path:join(fileRoot,'before-navigation.png'),
      fullPage:false,animations:'disabled'});
    const taps=[];
    for(const category of categories){
      const tab=page.locator('#tab-'+category);
      await tab.tap({timeout:15000});
      const state=await inspect();
      const target=state.items.find(x=>x.id==='tab-'+category);
      const hits=await tab.evaluate(el=>{
        const r=el.getBoundingClientRect();
        const node=document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2);
        return node===el||el.contains(node);
      });
      taps.push({category,selected:target?.selected,hit:hits,
        scrollLeft:state.scrollLeft,inkCollisions:state.collisions});
      if(!target?.selected||!hits||state.collisions.length)
        throw Error('Physically tapped category unreadable or unreachable: '+
          JSON.stringify(taps.at(-1)));
    }
    await page.locator('#tab-material').tap();
    await page.screenshot({path:join(fileRoot,'material-after-physical-navigation.png'),
      fullPage:false,animations:'disabled'});
    results.push({key,profile,theme,initial,taps,
      initialScreenshot:profile.id+'/'+theme+'/before-navigation.png',
      afterScreenshot:profile.id+'/'+theme+'/material-after-physical-navigation.png'});
    console.log('CATEGORY INK PASS '+key+
      ' seven source tabs, 7 physical taps, 0 ink overlaps');
   }catch(e){
    errors.push({key,error:String(e)});
    console.error('CATEGORY INK FAILURE '+key+' '+e);
   }finally{await page.close();}
  }finally{await context.close();}
 }
}finally{await browser.close();}
if(results.length!==profiles.length*themes.length)
 errors.push({error:'Missing source state cases '+results.length+'/'+profiles.length*themes.length});
await writeFile(join(output,'category-ink-manifest.json'),JSON.stringify({
  provenance:'Original live app Chromium, real touch-enabled page, DOM Range text glyph geometry',
  profiles,categories,themes,results,errors,
  approval:'Technical collision/hit test, not aesthetic or physical Android sign-off'
},null,2));
console.log('CATEGORY INK AUDIT: '+results.length+'/'+(profiles.length*themes.length)+
  ' source layouts, '+results.length*categories.length+' original touchscreen taps, '+
  errors.length+' failures');
if(errors.length)process.exitCode=1;
