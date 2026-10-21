#!/usr/bin/env node
/** Independent axe WCAG 2.2 browser sweep of all currently operable editor tools.
 * Source tool chips and real generated cards are used; disabled Tonal is a
 * negative case. Does not certify human usability, physical touch or AT speech.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import axe from 'axe-core';
import {EDITOR_CATEGORIES,TOOL_LIST} from '../src/editor-schema.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const output=resolve('artifacts/independent-all-tool-axe');
await mkdir(output,{recursive:true});
const fixtures=[
  {id:'paths',source:{seed:'axe-all-tools-paths',structure:'paths',
    geometry:'zigzag',construction:'ribbon',material:'linen',
    textureLayer2Enabled:true,material2:'foil',
    textureLayer3Enabled:true,material3:'grain',
    lightingMood:'daylight',stripeShadowStrength:40}},
  {id:'radial',source:{seed:'axe-all-tools-radial',structure:'radial',
    radialMode:'pinwheel',material:'linen',textureLayer2Enabled:true,
    material2:'foil',textureLayer3Enabled:true,material3:'grain'}},
  {id:'nested',source:{seed:'axe-all-tools-nested',structure:'regions',
    regionMode:'nested',material:'linen',textureLayer2Enabled:true,
    material2:'foil',textureLayer3Enabled:true,material3:'grain'}},
  {id:'voronoi',source:{seed:'axe-all-tools-voronoi',structure:'regions',
    regionMode:'voronoi',material:'linen',textureLayer2Enabled:true,
    material2:'foil',textureLayer3Enabled:true,material3:'grain'}}
];
const browser=await chromium.launch({headless:true});
const results=[],errors=[];
try{
 for(const viewport of [{width:412,height:892},{width:1024,height:768}]){
  for(const theme of ['cream','dark']){
   const context=await browser.newContext({viewport,isMobile:viewport.width<=790,
     hasTouch:viewport.width<=790,reducedMotion:'reduce'});
   const page=await context.newPage();page.setDefaultTimeout(19000);
   const seen=new Set(),report={viewport,theme,tools:[],unavailable:[],violations:[],
     pageErrors:[]};
   page.on('pageerror',error=>report.pageErrors.push(String(error)));
   try{
    for(const fixture of fixtures){
     const original=normalizeRecipe(fixture.source);
     await page.goto(origin+'/?r='+encodeRecipe(original),{waitUntil:'domcontentloaded'});
     await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
     await page.reload({waitUntil:'domcontentloaded'});
     if(viewport.width<=790)await page.locator('#mobileEdit').click();
     await page.addScriptTag({content:axe.source});
     for(const category of EDITOR_CATEGORIES){
      const tab=page.locator('#tab-'+category.id);
      if(!await tab.isEnabled())continue;
      await tab.click();
      for(const tool of category.tools){
       if(seen.has(tool.id))continue;
       const chip=page.locator('.editor-tool-chooser .editor-tool-tab[data-editor-tool="'+tool.id+'"]');
       if(await chip.count()!==1 || !await chip.isVisible() || !await chip.isEnabled()){
        report.unavailable.push({fixture:fixture.id,tool:tool.id});
        continue;
       }
       await chip.click();
       const card=page.locator('.editor-tool-card[data-editor-tool="'+tool.id+'"]');
       assert.equal(await card.isVisible(),true,tool.id+' selected source tool missing');
       assert.equal(await page.getByRole('group',{name:tool.name+' controls'}).count(),1,
         tool.id+' source controls lost computed accessibility name');
       const screenshot=theme+'-'+viewport.width+'-'+tool.id;
       const audit=await page.evaluate(()=>window.axe.run(document,{
         runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']},
         resultTypes:['violations']
       }));
       const violations=audit.violations.map(v=>({id:v.id,impact:v.impact,
         nodes:v.nodes.slice(0,9).map(n=>({target:n.target,summary:n.failureSummary})),
         affectedNodes:v.nodes.length}));
       if(violations.length){
        report.violations.push({fixture:fixture.id,tool:tool.id,violations});
        await page.screenshot({path:join(output,'failure-'+screenshot+'.png'),
          animations:'disabled'}).catch(()=>{});
       }
       const actual=decodeRecipe(new URL(page.url()).searchParams.get('r'));
       assert.deepEqual(actual,original,
         tool.id+': navigating named controls modified serialized wallpaper');
       seen.add(tool.id);
       report.tools.push({fixture:fixture.id,category:category.id,
         tool:tool.id,violations:violations.length});
      }
     }
    }
    const expected=TOOL_LIST.filter(x=>x.id!=='tone').map(x=>x.id);
    assert.deepEqual([...seen].sort(),expected.sort(),
      'Some source-applicable editor tool missed or HTML-disabled Tone incorrectly credited');
    assert.deepEqual(report.pageErrors,[],'Page runtime errors during tool sweep');
    assert.deepEqual(report.violations,[],'Automated WCAG tool-card violation');
    results.push(report);
    console.log('INDEPENDENT_ALL_TOOL_AXE_PASS',JSON.stringify({
      viewport,theme,tools:seen.size,scans:report.tools.length,
      automaticViolations:report.violations.length,
      knownException:'HTML-disabled Tone'
    }));
   }catch(error){
    errors.push({viewport,theme,error:String(error),stack:error.stack,
      visited:[...seen],violations:report.violations,pageErrors:report.pageErrors});
    await page.screenshot({path:join(output,'error-'+theme+'-'+viewport.width+'.png'),
      animations:'disabled'}).catch(()=>{});
   }finally{await context.close();}
  }
 }
 await writeFile(join(output,'evidence.json'),JSON.stringify({results,errors,
   boundaries:['All 39 currently applicable named tools per viewport/theme',
     'WCAG 2.2 A/AA automated axe rules only',
     'Not human comprehension, actual OS screen reader speech, or Android hardware']},null,2));
 assert.deepEqual(errors,[],'All-tool automated accessibility source matrix failed');
 assert.equal(results.length,4);
 console.log('INDEPENDENT_ALL_TOOL_AXE_SUCCESS');
}finally{await browser.close();}
