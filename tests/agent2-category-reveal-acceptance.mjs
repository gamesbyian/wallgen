#!/usr/bin/env node
/** Real Chromium source search/keyboard category reveal, issue #329. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/agent2-category-reveal');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const errors=[],results=[];
const recipe=normalizeRecipe({seed:'category-reveal-320',structure:'paths',
  geometry:'wave',material:'linen'});
try{
  for(const [width,height] of [[320,700],[360,740]]){
    for(const theme of ['cream','dark']){
      const context=await browser.newContext({viewport:{width,height},
        isMobile:true,hasTouch:true,reducedMotion:'reduce'});
      const page=await context.newPage();
      page.setDefaultTimeout(20000);
      page.on('pageerror',e=>errors.push({width,theme,pageError:String(e)}));
      const row={width,height,theme};
      const witness=category=>page.evaluate(id=>{
        const rail=document.querySelector('.settings-tabs');
        const tab=rail.querySelector('[data-tab="'+id+'"]');
        const a=rail.getBoundingClientRect(),b=tab.getBoundingClientRect();
        const x=b.left+b.width/2,y=b.top+b.height/2;
        const top=document.elementFromPoint(x,y);
        return {id,selected:tab.getAttribute('aria-selected'),
          tabIndex:tab.tabIndex,active:document.activeElement===tab,
          railOverflow:rail.scrollWidth>rail.clientWidth,
          fullyInRail:b.left>=a.left-1&&b.right<=a.right+1,
          centerHittable:top===tab||tab.contains(top),
          railScroll:rail.scrollLeft,tabBox:[b.left,b.right],
          railBox:[a.left,a.right]};
      },category);
      const selectedTool=tool=>page.evaluate(id=>{
        const chip=document.querySelector(
          '.editor-tool-chooser [data-editor-tool="'+id+'"]');
        const box=chip.getBoundingClientRect();
        const top=document.elementFromPoint(box.left+box.width/2,
          box.top+box.height/2);
        return {tool:id,visible:box.width>0&&box.height>0,
          selected:chip.getAttribute('aria-pressed'),
          centerHittable:top===chip||chip.contains(top)};
      },tool);
      try{
        await page.goto(origin+'/?r='+encodeRecipe(recipe),{waitUntil:'domcontentloaded'});
        await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
        await page.reload({waitUntil:'domcontentloaded'});
        assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),
          theme);
        const originalRecipe=new URL(page.url()).searchParams.get('r');
        await page.locator('#mobileEdit').click();
        await page.waitForFunction(()=>document.body.classList.contains('mobile-edit-open'));
        assert.equal((await witness('layout')).railOverflow,true,
          'Seven categories should overflow at supported narrow viewport');

        // Genuine Find input from leftward user state must reveal rightmost tab.
        await page.locator('.settings-tabs').evaluate(el=>{el.scrollLeft=0;});
        await page.getByRole('button',{name:'Find a setting',exact:true}).click();
        await page.locator('.editor-search-input').fill('Lighting');
        await page.waitForFunction(()=>document.querySelector('#tab-effects')
          ?.getAttribute('aria-selected')==='true');
        row.searchRight={tab:await witness('effects'),tool:await selectedTool('lighting')};
        assert.equal(row.searchRight.tab.fullyInRail,true,
          'Search selected Effects but left its tab offscreen');
        assert.equal(row.searchRight.tab.centerHittable,true,
          'Search-selected category is occluded');
        assert.deepEqual([row.searchRight.tool.visible,row.searchRight.tool.selected,
          row.searchRight.tool.centerHittable],[true,'true',true],
          'Search-selected Lighting tool is not genuinely reachable');

        // Reverse to offscreen Layout while category row is scrolled right.
        await page.locator('.settings-tabs').evaluate(el=>{
          el.scrollLeft=el.scrollWidth-el.clientWidth;
        });
        await page.locator('.editor-search-input').fill('Arrangement');
        await page.waitForFunction(()=>document.querySelector('#tab-layout')
          ?.getAttribute('aria-selected')==='true');
        row.searchLeft={tab:await witness('layout'),tool:await selectedTool('arrange')};
        assert.equal(row.searchLeft.tab.fullyInRail,true,
          'Search returned Layout but its category is still offscreen');
        assert.equal(row.searchLeft.tab.centerHittable,true);
        assert.deepEqual([row.searchLeft.tool.visible,row.searchLeft.tool.selected,
          row.searchLeft.tool.centerHittable],[true,'true',true]);

        // A real Home/End key from the selected tab must rove selection and
        // focus and reveal both extreme categories, not edit the recipe.
        await page.locator('#tab-layout').focus();
        await page.keyboard.press('End');
        row.keyboardEnd=await witness('effects');
        assert.equal(row.keyboardEnd.fullyInRail,true);
        assert.equal(row.keyboardEnd.active,true);
        assert.equal(row.keyboardEnd.selected,'true');
        await page.keyboard.press('Home');
        row.keyboardHome=await witness('layout');
        assert.equal(row.keyboardHome.fullyInRail,true);
        assert.equal(row.keyboardHome.active,true);
        assert.equal(row.keyboardHome.selected,'true');

        // Unrelated source-option adjustment must not reset a manual swipe.
        await page.locator('.editor-search-close').click();
        const scrolled=await page.locator('.settings-tabs').evaluate(el=>{
          el.scrollLeft=(el.scrollWidth-el.clientWidth)/2;
          return el.scrollLeft;
        });
        assert.ok(scrolled>0,'Manual rail scroll fixture did not move');
        await page.locator('#editorVariationStrength').selectOption('wild');
        const after=await page.locator('.settings-tabs').evaluate(el=>el.scrollLeft);
        row.manualPosition={before:scrolled,after};
        assert.ok(Math.abs(after-scrolled)<=2,
          'Unrelated editor action reset user-swiped category row');
        assert.equal(new URL(page.url()).searchParams.get('r'),originalRecipe,
          'Navigation/search/keyboard changed wallpaper recipe');
        await page.screenshot({path:join(out,theme+'-'+width+'.png'),
          animations:'disabled'});
        results.push(row);
        console.log('AGENT2_CATEGORY_REVEAL_PASS',JSON.stringify(row));
      }catch(e){
        errors.push({width,theme,error:String(e),stack:e.stack});
        await page.screenshot({path:join(out,'failure-'+theme+'-'+width+'.png'),
          animations:'disabled'}).catch(()=>{});
      }finally{await context.close();}
    }
  }
  await writeFile(join(out,'evidence.json'),JSON.stringify({results,errors,
    limitations:['Chromium emulated mobile touch, not physical Android hardware',
      'search and real keyboard operation on supported narrow viewports']},null,2));
  assert.deepEqual(errors,[],'Narrow category search/keyboard reveal failed');
}finally{await browser.close();}
