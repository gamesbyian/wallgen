#!/usr/bin/env node
/**
 * Independent desktop breakpoint accessibility falsification probe.
 * No synthetic DOM controls: enter each actual tool/metadata screen by click.
 * Automated axe evidence is bounded, not an assistive technology signoff.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import axe from 'axe-core';

const base=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const output=resolve('artifacts/independent-desktop-axe');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const records=[],errors=[];
const scenarios=[
  {name:'studio',enter:async()=>{}},
  {name:'path',enter:async page=>{
    await page.locator('#tab-path').click();
    await page.locator('[data-editor-tool="geometry"].editor-tool-tab').click();
    assert.ok(await page.locator('[data-editor-tool="geometry"].editor-tool-card').isVisible());
  }},
  {name:'material',enter:async page=>{
    await page.locator('#tab-material').click();
    await page.locator('[data-editor-tool="finish1"].editor-tool-tab').click();
    assert.ok(await page.locator('[data-editor-tool="finish1"].editor-tool-card').isVisible());
  }},
  {name:'colour',enter:async page=>{
    await page.locator('#tab-colour').click();
    await page.locator('[data-editor-tool="rainbow"].editor-tool-tab').click();
    assert.ok(await page.locator('[data-editor-tool="rainbow"].editor-tool-card').isVisible());
  }},
  {name:'metadata',enter:async page=>{
    await page.locator('#metadataToggle').click();
    assert.equal(await page.locator('#metadataToggle').getAttribute('aria-expanded'),'true');
  }}
];
try{
 for(const [width,height] of [[791,892],[1024,768]]){
  for(const theme of ['cream','dark']){
   for(const scenario of scenarios){
    const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
    const page=await context.newPage();page.setDefaultTimeout(18000);
    const pageErrors=[];page.on('pageerror',err=>pageErrors.push(String(err)));
    try{
     await page.goto(base,{waitUntil:'domcontentloaded'});
     await page.evaluate(theme=>localStorage.setItem('roygbiv:studio-theme:v1',theme),theme);
     await page.reload({waitUntil:'domcontentloaded'});
     assert.equal(await page.evaluate(()=>document.body.classList.contains('mobile-studio')),false,
       'Desktop audit unexpectedly operating in the mobile Studio shell');
     await scenario.enter(page);
     assert.equal(await page.getByRole('img',{name:'Red orange yellow green blue indigo violet'}).count(),1,
       'Decorative seven-colour stack has no reliable computed accessible name');
     await page.addScriptTag({content:axe.source});
     const report=await page.evaluate(()=>window.axe.run(document,{
       runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']},
       resultTypes:['violations','incomplete']
     }));
     const entry={viewport:[width,height],theme,scenario:scenario.name,
       violations:report.violations.map(v=>({id:v.id,impact:v.impact,
         nodes:v.nodes.slice(0,15).map(n=>({target:n.target,summary:n.failureSummary})),
         affectedNodes:v.nodes.length})),
       incomplete:report.incomplete.map(v=>({id:v.id,nodes:v.nodes.slice(0,10)
         .map(n=>({target:n.target,summary:n.failureSummary}))})),
       passes:report.passes.length};
     records.push(entry);
     assert.deepEqual(pageErrors,[],'Page runtime error');
     await page.screenshot({path:join(output,theme+'-'+width+'x'+height+'-'+scenario.name+'.png'),
       animations:'disabled'});
     console.log('INDEPENDENT_DESKTOP_AXE',JSON.stringify(entry));
    }catch(e){
     errors.push({viewport:[width,height],theme,scenario:scenario.name,
       message:String(e),stack:e.stack,pageErrors});
     await page.screenshot({path:join(output,'failure-'+theme+'-'+width+'x'+height+'-'+scenario.name+'.png'),
       animations:'disabled'}).catch(()=>{});
    }finally{await context.close();}
   }
  }
 }
 await writeFile(join(output,'evidence.json'),JSON.stringify({
   classification:errors.length?'NOT VERIFIED':'real-browser automated WCAG audit only',
   records,errors,limitations:['Not full WCAG conformance','No physical device or AT speech',
    'Axe incomplete reports require manual inspection',
    'Only five desktop screens and two viewports represented']
 },null,2));
 assert.deepEqual(errors,[],'Desktop audit setup or source navigation failures');
 assert.equal(records.length,20,'Expected 20 desktop snapshots');
 const violations=records.flatMap(v=>v.violations.map(x=>({viewport:v.viewport,
    theme:v.theme,scenario:v.scenario,id:x.id,nodes:x.nodes})));
 assert.deepEqual(violations,[],'Desktop axe WCAG 2.2 violation witness');
 console.log('INDEPENDENT_DESKTOP_AXE_SUCCESS');
}finally{await browser.close();}
