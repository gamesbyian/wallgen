#!/usr/bin/env node
/**
 * Agent 3: real Tab order and More metadata expansion at compact widths.
 * The live sheet must never Tab into hidden/inert/zero-size descendants,
 * including while an expanded metadata form scrolls within the sheet.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve(process.env.ROYGBIV_MORE_TAB_OUT||'artifacts/agent3-more-keyboard');
await mkdir(out,{recursive:true});
const layouts=[[320,700],[412,892],[700,412],[790,892]];
const browser=await chromium.launch({headless:true});
const evidence=[],errors=[];
try{
  for(const [width,height] of layouts){
    const page=await browser.newPage({viewport:{width,height},
      isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    page.setDefaultTimeout(14000);
    const record={viewport:[width,height],focusSequence:[],metadataExpanded:false,
      reached:[],hiddenFocus:[]};
    try{
      await page.goto(origin,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.body.classList.contains('mobile-five-nav'));
      await page.locator('#mobileMore').click();
      assert.equal(await page.evaluate(()=>document.activeElement?.id),'mobileToolsClose',
        'Opening More should start keyboard focus at visible close control');
      // Generate 12 is an Explore-owned action, not part of the More sheet.
      const required=['seedInput','applySeed','importRecipePNG',
        'metadataToggle','copyLink','copyRecipe','downloadRecipe'];
      const visited=new Set(),names=[];
      let metadataExpanded=false,ended=false;
      // More is nonmodal; a complete traversal can leave the sheet.
      // Collect all required source targets without assuming which appears
      // first, and use Enter rather than synthetic .click for expansion.
      for(let i=0;i<210;i++){
        await page.keyboard.press('Tab');
        const state=await page.evaluate(()=>{
          const el=document.activeElement;
          const r=el?.getBoundingClientRect(),s=el?getComputedStyle(el):null;
          const x=r?r.left+r.width/2:0,y=r?r.top+r.height/2:0;
          const hit=r&&x>=0&&x<innerWidth&&y>=0&&y<innerHeight?
            document.elementFromPoint(x,y):null;
          return {id:el?.id||'',tag:el?.tagName||'',name:el?.name||'',
            withinMore:!!el?.closest('#mobileToolsSheet'),
            hidden:!r||r.width<1||r.height<1||s.display==='none'||
              s.visibility==='hidden'||!!el.closest('[inert],[hidden]'),
            offscreen:!r||r.bottom<=0||r.top>=innerHeight||
              r.right<=0||r.left>=innerWidth,
            centerHit:!!r&&(hit===el||el.contains(hit)),
            rect:r?[r.x,r.y,r.width,r.height]:null};
        });
        if(state.hidden)record.hiddenFocus.push(state);
        assert.ok(!state.hidden,
          'Hidden or inert More keyboard stop: '+JSON.stringify({width,height,i,state}));
        if(state.withinMore){
          assert.ok(!state.offscreen&&state.centerHit,
            'More keyboard focus is offscreen or covered: '+JSON.stringify({width,height,i,state}));
        }
        record.focusSequence.push(state.id||state.name||state.tag);
        if(required.includes(state.id))visited.add(state.id);
        if(state.id==='metadataToggle'&&!metadataExpanded){
          await page.keyboard.press('Enter');
          assert.equal(await page.locator('#metadataToggle').getAttribute('aria-expanded'),'true',
            'Metadata Enter did not expand real source panel');
          metadataExpanded=true;record.metadataExpanded=true;
        }
        if(state.id==='mobileMore'&&visited.size>=required.length){
          ended=true;break;
        }
        // A labelled form field can be reached with its name even if an id
        // is intentionally not assigned by the source HTML.
        if(state.tag==='INPUT'&&state.name==='title')names.push('title');
        if(state.tag==='INPUT'&&state.name==='creator')names.push('creator');
        if(state.tag==='INPUT'&&state.name==='keywords')names.push('keywords');
        if(visited.size===required.length&&names.includes('title')&&
          names.includes('creator')&&names.includes('keywords')){
          ended=true;break;
        }
      }
      record.reached=[...visited];record.metadataFields=names;
      assert.deepEqual([...visited].sort(),required.slice().sort(),
        'Original More controls are not keyboard-discoverable');
      assert.ok(names.includes('title')&&names.includes('creator')&&
        names.includes('keywords'),
        'Expanded metadata inputs are absent from natural keyboard Tab order');
      assert.ok(metadataExpanded&&ended,'More input traversal did not finish');
      await page.screenshot({path:join(out,width+'x'+height+'-expanded-more.png'),
        animations:'disabled'});
      await page.keyboard.press('Escape');
      assert.equal(await page.evaluate(()=>document.body.classList.contains('mobile-tools-open')),
        false,'Escape left More sheet open after long Tab traversal');
      assert.equal(await page.evaluate(()=>document.activeElement?.id),'mobileMore',
        'Escape failed to return focus to the real More opener');
      evidence.push(record);
      console.log('AGENT3_MORE_KEYBOARD',JSON.stringify({
        viewport:record.viewport,tabSteps:record.focusSequence.length,
        sourceControls:record.reached.length,metadataFields:record.metadataFields.length,
        hiddenFocus:record.hiddenFocus.length
      }));
    }catch(error){
      errors.push({viewport:[width,height],error:String(error),stack:error.stack,record});
      await page.screenshot({path:join(out,'failure-'+width+'x'+height+'.png'),
        animations:'disabled'}).catch(()=>{});
    }finally{await page.close()}
  }
  await writeFile(join(out,'evidence.json'),JSON.stringify({
    classification:errors.length?'not verified':'actual keyboard More traversal verified at four sizes',
    limitations:['does not measure ideal Tab order or OS screen-reader speech',
      'does not assert all form values or physical Android behaviour'],
    evidence,errors
  },null,2));
  assert.deepEqual(errors,[],'More keyboard access failure');
  console.log('AGENT3_MORE_KEYBOARD_SUCCESS');
}finally{await browser.close()}
