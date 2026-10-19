#!/usr/bin/env node
/**
 * Agent 3 independent mobile shell keyboard and direct-hit acceptance.
 * No synthetic DOM click or programmatic focus substitutes for Tab.
 * This tests shell destinations, not every conditional editor control.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve(process.env.ROYGBIV_FOCUS_OUT||'artifacts/agent3-focus-boundaries');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const captures=[],failures=[];
const viewports=[
  [412,892],[499,892],[500,892],[790,892],[791,892],[700,412]
];
const ids=['mobileStudio','mobileExplore','mobileSaved','mobileEdit','mobileMore'];
try {
  for(const [width,height] of viewports){
    const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    try{
      await page.goto(origin,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.body.classList.contains('mobile-five-nav'));
      // At >=791px the phone dock is deliberately hidden. Assert the
      // breakpoint transition instead of demanding a false mobile hitbox.
      if(width>790){
        assert.equal(await page.evaluate(()=>document.body.classList.contains('mobile-studio')),false,
          'Desktop breakpoint must not present mobile Studio at '+width);
        captures.push({viewport:[width,height],mode:'desktop',mobileDockExpected:false,errors});
        assert.deepEqual(errors,[]);
        continue;
      }
      const base=await page.evaluate(ids=>{
        const samples={};
        for(const id of ids){
          const el=document.getElementById(id);
          assertElement(el,id);
          const rect=el.getBoundingClientRect();
          const x=rect.left+rect.width/2,y=rect.top+rect.height/2;
          const target=document.elementFromPoint(x,y);
          samples[id]={x,y,width:rect.width,height:rect.height,
            label:el.getAttribute('aria-label')||el.textContent.trim(),
            visible:getComputedStyle(el).visibility!=='hidden'&&rect.width>0&&rect.height>0,
            hit:target===el||el.contains(target),
            inViewport:x>=0&&x<innerWidth&&y>=0&&y<innerHeight};
        }
        return samples;
        function assertElement(el,id){if(!el)throw new Error('Missing '+id)}
      },ids);
      for(const [id,record] of Object.entries(base)){
        assert.ok(record.label,id+' missing name at '+width+'x'+height);
        assert.ok(record.visible&&record.hit&&record.inViewport,
          id+' not physically hit-testable at '+width+'x'+height+': '+JSON.stringify(record));
        assert.ok(record.width>=24&&record.height>=24,
          id+' too small for even the 24px audit floor: '+JSON.stringify(record));
      }
      // Traverse with the actual keyboard, starting from document body.
      // Hidden/offscreen focus is a regression even if click navigation works.
      await page.evaluate(()=>document.activeElement?.blur());
      const visited=[],focusProblems=[];
      for(let i=0;i<130;i++){
        await page.keyboard.press('Tab');
        const trace=await page.evaluate(()=>{
          const el=document.activeElement;
          if(!el||el===document.body)return {id:'body'};
          const rect=el.getBoundingClientRect(),css=getComputedStyle(el);
          return {id:el.id||'',tag:el.tagName,
            hidden:css.visibility==='hidden'||css.display==='none'||
              rect.width===0||rect.height===0,
            inert:!!el.closest('[inert]'),
            rect:[rect.left,rect.top,rect.width,rect.height]};
        });
        if(trace.hidden||trace.inert)focusProblems.push(trace);
        if(ids.includes(trace.id))visited.push(trace.id);
        if(new Set(visited).size===ids.length)break;
      }
      assert.deepEqual(focusProblems,[],
        'Keyboard reached hidden/inert control at '+width+'x'+height);
      assert.equal(new Set(visited).size,ids.length,
        'Tab sequence could not reach all five dock destinations at '+width+'x'+height+
        ': '+JSON.stringify(visited));
      // Real pointer route, followed by Escape, verifies More opener focus.
      await page.locator('#mobileMore').click();
      await page.waitForFunction(()=>document.querySelector('#mobileMore')?.getAttribute('aria-current')==='page');
      await page.keyboard.press('Escape');
      assert.equal(await page.evaluate(()=>document.activeElement?.id),'mobileMore',
        'Escape must return focus to More opener at '+width+'x'+height);
      assert.deepEqual(errors,[],'Page errors at '+width+'x'+height);
      const capture={viewport:[width,height],dock:base,keyboardDestinations:[...new Set(visited)],errors};
      captures.push(capture);
      console.log('AGENT3_FOCUS_BOUNDARY',JSON.stringify(capture));
      await page.screenshot({path:join(out,'shell-'+width+'x'+height+'.png'),animations:'disabled'});
    }catch(error){
      failures.push({viewport:[width,height],message:String(error),stack:error.stack});
      await page.screenshot({path:join(out,'failure-'+width+'x'+height+'.png'),animations:'disabled'}).catch(()=>{});
    }finally{await context.close()}
  }
  await writeFile(join(out,'evidence.json'),JSON.stringify({
    classification:failures.length?'not verified':'browser-observed and behavior-verified for named shell destinations',
    limitations:['not all conditional editor controls','not screen reader verification',
      'not native Android Chrome','24px diagnostic floor is not a WCAG pass'],
    captures,failures
  },null,2));
  assert.deepEqual(failures,[],'Mobile breakpoint focus/hit audit failed');
  console.log('AGENT3_FOCUS_BOUNDARY_SUCCESS');
}finally{await browser.close()}
