#!/usr/bin/env node
/**
 * Independent axe-core real-browser accessibility diagnostic, 20 surfaces.
 * Deliberately records baseline violations rather than declaring a pass:
 * automated axe checks are necessary evidence, never complete WCAG/AT signoff.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import axe from 'axe-core';
const base=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/independent-axe-audit');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const findings=[],errors=[];
const states=[
 {name:'studio',enter:async()=>{}},
 {name:'edit-material',enter:async p=>{
   await p.locator('#mobileEdit').click();
   await p.locator('#tab-material').click();
   await p.locator('[data-editor-tool="finish1"].editor-tool-tab').click();
 }},
 {name:'edit-focus',enter:async p=>{
   await p.locator('#mobileEdit').click();
   await p.locator('#tab-path').click();
   await p.locator('[data-editor-tool="geometry"].editor-tool-tab').click();
   await p.locator('.editor-focus-toggle').click();
 }},
 {name:'explore',enter:async p=>{await p.locator('#mobileExplore').click();}},
 {name:'saved',enter:async p=>{await p.locator('#mobileSaved').click();}},
 {name:'more-metadata',enter:async p=>{
   await p.locator('#mobileMore').click();
   await p.locator('#metadataToggle').click();
 }}
];
try{
 for(const [width,height] of [[412,892],[700,412]]){
  for(const theme of ['cream','dark']){
   for(const state of states){
    const context=await browser.newContext({viewport:{width,height},
      hasTouch:true,isMobile:true,reducedMotion:'reduce'});
    const page=await context.newPage();page.setDefaultTimeout(16000);
    try{
     await page.goto(base,{waitUntil:'domcontentloaded'});
     await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
     await page.reload({waitUntil:'domcontentloaded'});
     await state.enter(page);
     await page.addScriptTag({content:axe.source});
     const audit=await page.evaluate(async()=>window.axe.run(document,{
       runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']},
       resultTypes:['violations','incomplete']
     }));
     const entry={viewport:[width,height],theme,state:state.name,
       violations:audit.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,
         nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary})).slice(0,12),
         affectedNodes:v.nodes.length})),
       incomplete:audit.incomplete.map(v=>({id:v.id,count:v.nodes.length})),
       passes:audit.passes.length};
     findings.push(entry);
     console.log('INDEPENDENT_AXE_DIAGNOSTIC',JSON.stringify(entry));
     await page.screenshot({path:join(out,theme+'-'+width+'x'+height+'-'+state.name+'.png'),
       animations:'disabled'});
    }catch(e){errors.push({viewport:[width,height],theme,state:state.name,
      error:String(e),stack:e.stack});}
    finally{await context.close();}
   }
  }
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({findings,errors,
   classification:'diagnostic only: violations require independent interpretation',
   limitations:['Axe cannot evaluate user comprehension, real screen-reader narration or all keyboard traversal',
     'WCAG 2.x automated rules are not an all-criteria accessibility certificate',
     'A colour contrast warning requires confirming actual layered backgrounds and state',
     'Mobile device, touch and physical screen reader still pending']},null,2));
 assert.deepEqual(errors,[],'Real-browser axe setup or navigation failed');
 assert.equal(findings.length,24,'Missing an axe state or viewport sample');
 console.log('INDEPENDENT_AXE_AUDIT_RECORDED');
}finally{await browser.close();}
