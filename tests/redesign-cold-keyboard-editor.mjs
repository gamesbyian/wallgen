#!/usr/bin/env node
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';

const out=resolve('artifacts/agent3-cold-keyboard');
await mkdir(out,{recursive:true});
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const viewports=[[412,892],[700,412],[790,892]];
const evidence=[],failures=[];
try{
  for(const [width,height] of viewports){
    const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
    const record={viewport:[width,height],before:[],inside:[],escape:null};
    try{
      await page.goto(origin,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.body.classList.contains('mobile-five-nav'));
      // Start with physical keyboard from the document, not .focus() or
      // programmatic .click(). Limit traversal to a reproducible bound.
      let found=false;
      for(let i=0;i<160;i++){
        await page.keyboard.press('Tab');
        const id=await page.evaluate(()=>document.activeElement?.id||'');
        if(record.before.length<160)record.before.push(id);
        if(id==='mobileEdit'){found=true;break;}
      }
      assert.ok(found,'Cold Tab traversal cannot reach the Edit destination');
      await page.keyboard.press('Enter');
      await page.waitForFunction(()=>document.body.classList.contains('mobile-edit-open'));
      assert.equal(await page.evaluate(()=>document.activeElement?.id),'mobileDismissHandle',
        'Opening editor must transfer focus to visible dismiss affordance');
      let reachedCategory=false,reachedTool=false;
      for(let i=0;i<180;i++){
        await page.keyboard.press('Tab');
        const state=await page.evaluate(()=>{
          const el=document.activeElement,r=el?.getBoundingClientRect();
          const s=el?getComputedStyle(el):null;
          return {id:el?.id||'',tool:el?.dataset?.editorTool||'',
            hidden:!r||r.width===0||r.height===0||s.display==='none'||
              s.visibility==='hidden'||!!el.closest('[inert]'),
            offscreen:!!r&&(r.bottom<=0||r.top>=innerHeight||
              r.right<=0||r.left>=innerWidth)};
        });
        record.inside.push(state);
        assert.equal(state.hidden,false,'Cold Tab reached hidden/inert editor control: '+JSON.stringify(state));
        if(state.id.startsWith('tab-'))reachedCategory=true;
        if(state.tool)reachedTool=true;
        if(reachedCategory&&reachedTool)break;
      }
      assert.ok(reachedCategory,'No category reachable from cold Edit keyboard');
      assert.ok(reachedTool,'No named tool reachable from cold Edit keyboard');
      await page.keyboard.press('Escape');
      assert.equal(await page.evaluate(()=>document.body.classList.contains('mobile-edit-open')),false);
      const focus=await page.evaluate(()=>({id:document.activeElement?.id,
        hidden:!!document.activeElement?.closest('[inert]')}));
      assert.equal(focus.hidden,false,'Escape left focus inside inert dock');
      record.escape=focus;
      evidence.push(record);
      console.log('AGENT3_COLD_KEYBOARD',JSON.stringify({viewport:record.viewport,
        before:record.before.length,inside:record.inside.length,escape:record.escape}));
    }catch(e){
      failures.push({viewport:[width,height],message:String(e),stack:e.stack,record});
      await page.screenshot({path:join(out,'failed-'+width+'x'+height+'.png')}).catch(()=>{});
    }finally{await page.close()}
  }
  await writeFile(join(out,'evidence.json'),JSON.stringify({evidence,failures,
    scope:'real Tab/Enter/Escape from document to Edit, category, tool; not screen reader output or comprehensive focus order'},null,2));
  assert.deepEqual(failures,[],'Cold keyboard acceptance failure');
  console.log('AGENT3_COLD_KEYBOARD_SUCCESS');
}finally{await browser.close()}
