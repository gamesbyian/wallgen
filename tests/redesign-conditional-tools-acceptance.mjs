#!/usr/bin/env node
/**
 * Agent 3: independently exercise every actually-applicable named editor
 * tool through a real Chromium pointer journey, including negative chips.
 * Never count disabled legacy Tonal as available to a new user.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {EDITOR_CATEGORIES,TOOL_LIST} from '../src/editor-schema.js';
import {toolAppliesToScene} from '../src/editor-tool-applicability.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve(process.env.ROYGBIV_TOOLS_OUT||'artifacts/agent3-conditional-tools');
await mkdir(out,{recursive:true});
assert.equal(EDITOR_CATEGORIES.length,7,'Expected seven source editor categories');
assert.equal(TOOL_LIST.length,40,'Expected forty source-defined named tools');
assert.equal(new Set(TOOL_LIST.map(t=>t.id)).size,40,
  'Named tools must have unique IDs for source-to-browser traceability');

const scenarios=[
  {id:'paths-ribbon',source:{seed:'a3-tools-paths',structure:'paths',
    construction:'ribbon',material:'linen',
    textureLayer2Enabled:true,material2:'grain',
    textureLayer3Enabled:true,material3:'foil'}},
  {id:'radial-pinwheel',source:{seed:'a3-tools-radial',
    structure:'radial',radialMode:'pinwheel',rayCount:23,material:'linen',
    textureLayer2Enabled:true,material2:'grain',
    textureLayer3Enabled:true,material3:'foil'}},
  {id:'region-voronoi',source:{seed:'a3-tools-voronoi',structure:'regions',
    regionMode:'voronoi',regionCount:19,material:'linen',
    textureLayer2Enabled:true,material2:'grain',
    textureLayer3Enabled:true,material3:'foil'}},
  {id:'region-nested',source:{seed:'a3-tools-nested',structure:'regions',
    regionMode:'nested',regionCount:12,material:'linen',
    textureLayer2Enabled:true,material2:'grain',
    textureLayer3Enabled:true,material3:'foil'}}
];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:412,height:892},
  hasTouch:true,isMobile:true,reducedMotion:'reduce'});
page.setDefaultTimeout(16000);
const observations=[],errors=[],reached=new Set();
page.on('pageerror',e=>errors.push(String(e)));
const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
try{
  for(const scenario of scenarios){
    const recipe=normalizeRecipe(scenario.source);
    await page.goto(origin+'/?r='+encodeRecipe(recipe),{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.body.classList.contains('mobile-five-nav'));
    assert.deepEqual(current(),recipe,scenario.id+': initial URL recipe changed');
    await page.locator('#mobileEdit').click();
    assert.equal(await page.locator('#mobileEdit').getAttribute('aria-current'),'page');

    const seen=[],scene={
      structure:recipe.structure,regionMode:recipe.regionMode,
      construction:recipe.construction
    };
    for(const category of EDITOR_CATEGORIES){
      const tab=page.locator('#tab-'+category.id);
      const applicable=category.tools.filter(t=>
        toolAppliesToScene({category:category.id,id:t.id},scene));
      if(!applicable.length){
        assert.equal(await tab.isDisabled(),true,
          scenario.id+'/'+category.id+': empty category must be genuinely disabled');
        continue;
      }
      assert.equal(await tab.isDisabled(),false,
        scenario.id+'/'+category.id+': category with applicable tools disabled');
      await tab.click();
      assert.equal(await tab.getAttribute('aria-selected'),'true',
        'real category pointer click failed '+scenario.id+'/'+category.id);
      const visibleIds=await page.locator('.editor-tool-chooser [data-editor-tool]')
        .evaluateAll(chips=>chips.filter(el=>!el.hidden&&getComputedStyle(el).display!=='none')
          .map(el=>el.dataset.editorTool));
      assert.deepEqual(visibleIds,applicable.map(t=>t.id),
        scenario.id+'/'+category.id+': live visible tools differ from source applicability');
      for(const tool of category.tools){
        const chip=page.locator('.editor-tool-chooser [data-editor-tool="'+tool.id+'"]');
        if(!applicable.includes(tool)){
          assert.equal(await chip.isVisible(),false,
            scenario.id+'/'+category.id+'/'+tool.id+': inapplicable chip leaked visibly');
          continue;
        }
        assert.equal(await chip.isEnabled(),true,
          scenario.id+'/'+tool.id+': applicable chip disabled');
        await chip.click(); // real Playwright pointer, including horizontal scroll
        assert.equal(await chip.getAttribute('aria-pressed'),'true',
          scenario.id+'/'+tool.id+': named chip failed to select');
        assert.equal(await chip.getAttribute('tabindex'),'0',
          scenario.id+'/'+tool.id+': roving keyboard focus points elsewhere');
        const card=page.locator('.editor-tool-card[data-editor-tool="'+tool.id+'"]');
        assert.equal(await card.isVisible(),true,
          scenario.id+'/'+tool.id+': active source card hidden');
        assert.equal(await card.getAttribute('aria-label'),tool.name+' controls',
          scenario.id+'/'+tool.id+': wrong dynamic card accessible name');
        const others=await page.locator('.editor-tool-card:not([hidden])')
          .evaluateAll(nodes=>nodes.map(el=>el.dataset.editorTool));
        assert.deepEqual(others,[tool.id],
          scenario.id+'/'+tool.id+': ghost or duplicate active editor card');
        // Inspect the source setting controls as identity witnesses, not
        // assume each is editable in every context (locks and inapplicable
        // source fields must survive unchanged).
        const missingSettings=await page.evaluate(settings=>
          settings.filter(key=>!document.getElementById('controls').elements.namedItem(key)),
          tool.settings);
        assert.deepEqual(missingSettings,[],
          scenario.id+'/'+tool.id+': original source setting field vanished');
        seen.push({category:category.id,id:tool.id,settings:tool.settings.length});
        reached.add(tool.id);
      }
      await page.screenshot({
        path:join(out,scenario.id+'-'+category.id+'.png'),animations:'disabled'
      });
    }
    assert.deepEqual(current(),recipe,
      scenario.id+': navigating source tools must not mutate the recipe');
    observations.push({scenario:scenario.id,scene,
      reached:seen,toolCount:seen.length,recipePreserved:true});
    console.log('AGENT3_CONDITIONAL_TOOLS',JSON.stringify({
      scenario:scenario.id,toolCount:seen.length,tools:seen.map(s=>s.id)
    }));
  }
  // The historical 'tonal' construction is intentionally disabled in the
  // native select. Its source tool is not credited as user-reachable merely
  // because imported recipes can still contain it.
  const tonalOption=await page.locator('#controls [name="construction"] option[value="tonal"]')
    .evaluate(node=>({disabled:node.disabled,text:node.textContent.trim()}));
  assert.equal(tonalOption.disabled,true,
    'Legacy Tonal policy changed: explicitly reassess reachable tool census');
  const unroutable=TOOL_LIST.filter(t=>!reached.has(t.id)).map(t=>t.id);
  assert.deepEqual(unroutable,['tone'],
    'Expected all 39 enabled-reachable named tools and only legacy Tonal held out');
  assert.deepEqual(errors,[],'Uncaught source editor errors');
  const evidence={classification:'behavior-verified for covered click-selected tool states',
    sourceTools:TOOL_LIST.length,enabledReachable:reached.size,
    withheldLegacy:{id:'tone',nativeOptionDisabled:true,reason:'Tonal construction is HTML-disabled'},
    exclusions:['imported Tonal compatibility not user creation','all conditional inner-control paths',
      'physical Pixel 6 Pro browser','screen-reader output','canonical visual signoff'],
    observations,errors};
  await writeFile(join(out,'evidence.json'),JSON.stringify(evidence,null,2));
  console.log('AGENT3_CONDITIONAL_TOOL_ACCEPTANCE_SUCCESS',reached.size);
}catch(error){
  await writeFile(join(out,'failure.json'),JSON.stringify({
    classification:'not verified',error:String(error),stack:error.stack,
    observations,reached:[...reached],errors
  },null,2));
  await page.screenshot({path:join(out,'failure.png'),animations:'disabled'}).catch(()=>{});
  throw error;
}finally{await browser.close()}
