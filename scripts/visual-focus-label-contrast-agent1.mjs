#!/usr/bin/env node
/** True source-browser Focus label contrast audit. Text/background values are
 * computed from the real DOM in both toggle states, not hand-coded CSS hexes. */
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';

const base=process.argv.find(s=>s.startsWith('--base-url='))?.slice(11)||'http://127.0.0.1:4173';
const out=resolve(process.argv.find(s=>s.startsWith('--out='))?.slice(6)||
  'artifacts/visual-agent1-dpr/focus-contrast');
const profiles=[
 {id:'minimum-320',width:320,height:700},
 {id:'narrow-360',width:360,height:740},
 {id:'phone-412',width:412,height:892},
 {id:'edge-499',width:499,height:892},
 {id:'edge-500',width:500,height:892}
];
const themes=['cream','dark'];
const results=[],errors=[];
const srgb=n=>{const x=n/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;};
const luminance=rgb=>.2126*srgb(rgb[0])+.7152*srgb(rgb[1])+.0722*srgb(rgb[2]);
const rgba=color=>{
 const m=color.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
 if(!m)throw Error('Unsupported computed CSS colour '+color);
 return m.slice(1,4).map(Number);
};
const contrast=(text,bg)=>{
 const a=luminance(rgba(text)),b=luminance(rgba(bg));
 return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
};
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const profile of profiles)for(const theme of themes){
  const key=profile.id+'/'+theme;
  const ctx=await browser.newContext({
    viewport:{width:profile.width,height:profile.height},
    isMobile:true,hasTouch:true,reducedMotion:'reduce'
  });
  try{
   const page=await ctx.newPage();
   try{
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.locator('[data-studio-theme="'+theme+'"]').tap();
    await page.locator('#mobileEdit').tap();
    await page.locator('#tab-material').tap();
    await page.locator('.editor-tool-tab[data-editor-tool="finish1"]').tap();
    const toggle=page.locator('.editor-focus-toggle');
    await toggle.waitFor({state:'visible'});
    const sample=()=>toggle.evaluate(el=>{
      const style=getComputedStyle(el),rect=el.getBoundingClientRect();
      return {textColor:style.color,background:style.backgroundColor,
        visible:rect.width>0&&rect.height>0,pressed:el.getAttribute('aria-pressed'),
        label:el.textContent.trim(),aria:el.getAttribute('aria-label'),
        rect:{left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom}};
    });
    const normal=await sample();
    const folder=join(out,profile.id,theme);
    await mkdir(folder,{recursive:true});
    await page.screenshot({path:join(folder,'normal.png'),animations:'disabled'});
    if(normal.pressed!=='false'||normal.label!=='Focus'||!normal.visible)
      throw Error('Normal original Focus control unavailable: '+JSON.stringify(normal));
    normal.contrast=contrast(normal.textColor,normal.background);
    if(normal.contrast<4.5)
      throw Error('Normal Focus text contrast below WCAG AA 4.5: '+JSON.stringify(normal));
    await toggle.tap();
    const pressed=await sample();
    pressed.contrast=contrast(pressed.textColor,pressed.background);
    await page.screenshot({path:join(folder,'pressed.png'),animations:'disabled'});
    const active=await page.locator('#controls').evaluate(el=>el.classList.contains('editor-focus-active'));
    if(pressed.pressed!=='true'||!active||pressed.contrast<4.5)
      throw Error('Pressed Focus source state inaccessible or low contrast: '+JSON.stringify({pressed,active}));
    await toggle.tap();
    const restored=await sample();
    const preserved=await page.evaluate(()=>({
      active:document.querySelector('#controls')?.classList.contains('editor-focus-active'),
      category:document.querySelector('#tab-material')?.getAttribute('aria-selected'),
      tool:document.querySelector('.editor-tool-tab[data-editor-tool="finish1"]')?.getAttribute('aria-pressed')
    }));
    if(restored.pressed!=='false'||preserved.active||
      preserved.category!=='true'||preserved.tool!=='true')
      throw Error('Focus toggling lost source category/tool state: '+JSON.stringify({restored,preserved}));
    results.push({key,normal,pressed,restored,preserved,
      proof:'real Chromium computed style plus original .tap() state change'});
    console.log('FOCUS CONTRAST PASS '+key+' normal '+normal.contrast.toFixed(2)+
      ':1 pressed '+pressed.contrast.toFixed(2)+':1');
   }catch(e){errors.push({key,error:String(e)});console.error('FOCUS CONTRAST FAILURE '+key+' '+e);}
   finally{await page.close();}
  }finally{await ctx.close();}
 }
}finally{await browser.close();}
if(results.length!==profiles.length*themes.length)
 errors.push({error:'Missing viewport/theme checks '+results.length+'/'+profiles.length*themes.length});
await writeFile(join(out,'focus-contrast.json'),JSON.stringify({
  source:'Actual Chromium DOM/colour/press state; original Edit Material Finish1',
  profiles,themes,results,errors,approval:'Technical WCAG ratio and original touch actions only'
},null,2));
console.log('FOCUS CONTRAST: '+results.length+'/'+(profiles.length*themes.length)+
  ' source cases, '+errors.length+' errors');
if(errors.length)process.exitCode=1;
