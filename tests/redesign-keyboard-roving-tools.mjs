#!/usr/bin/env node
/**
 * Independent Agent 3 actual keyboard acceptance for the named tool chooser.
 * Pointer selection was qualified in #196; this verifies roving Arrow/Home/End
 * input, focus identity and unobscured focus at mobile/short-landscape widths.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {EDITOR_CATEGORIES} from '../src/editor-schema.js';
import {toolAppliesToScene} from '../src/editor-tool-applicability.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve(process.env.ROYGBIV_ROVING_OUT||'artifacts/agent3-tool-keyboard');
await mkdir(out,{recursive:true});
const cases=[
  {name:'phone-paths',viewport:{width:412,height:892},source:{
    seed:'a3-roving-paths',structure:'paths',construction:'ribbon'}},
  {name:'phone-radial',viewport:{width:412,height:892},source:{
    seed:'a3-roving-radial',structure:'radial',radialMode:'pinwheel',rayCount:23}},
  {name:'landscape-nested',viewport:{width:700,height:412},source:{
    seed:'a3-roving-nested',structure:'regions',regionMode:'nested',regionCount:13}}
];
const browser=await chromium.launch({headless:true});
const observations=[],errors=[];
try{
  for(const scenario of cases){
    const page=await browser.newPage({viewport:scenario.viewport,
      isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    page.setDefaultTimeout(14000);
    const localErrors=[];
    page.on('pageerror',e=>localErrors.push(String(e)));
    const recipe=normalizeRecipe(scenario.source);
    const sourceScene={structure:recipe.structure,regionMode:recipe.regionMode,
      construction:recipe.construction};
    const record=[];
    try{
      await page.goto(origin+'/?r='+encodeRecipe(recipe),{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.body.classList.contains('mobile-five-nav'));
      await page.locator('#mobileEdit').click();
      assert.equal(await page.locator('#mobileEdit').getAttribute('aria-current'),'page',
        'Cannot keyboard-traverse tools when real Edit sheet is closed');
      for(const category of EDITOR_CATEGORIES){
        const tab=page.locator('#tab-'+category.id);
        const expected=category.tools.filter(tool=>toolAppliesToScene({
          category:category.id,id:tool.id
        },sourceScene));
        if(!expected.length){
          assert.equal(await tab.isDisabled(),true,
            scenario.name+': category with no applicable tools remains keyboard-selectable');
          continue;
        }
        await tab.click();
        assert.equal(await tab.getAttribute('aria-selected'),'true');
        const ids=expected.map(x=>x.id);
        const chip=id=>page.locator('.editor-tool-chooser [data-editor-tool="'+id+'"]');

        async function verify(id,step){
          const state=await page.evaluate(id=>{
            const el=document.querySelector('.editor-tool-chooser [data-editor-tool="'+id+'"]');
            const chooser=document.querySelector('.editor-tool-chooser');
            const rect=el?.getBoundingClientRect(),rail=chooser?.getBoundingClientRect();
            const x=rect?rect.left+rect.width/2:-1;
            const y=rect?rect.top+rect.height/2:-1;
            const hit=x>=0&&x<innerWidth&&y>=0&&y<innerHeight?
              document.elementFromPoint(x,y):null;
            return {focused:document.activeElement===el,
              pressed:el?.getAttribute('aria-pressed'),tabindex:el?.tabIndex,
              hidden:!!el?.hidden,cardVisible:!document.querySelector(
                '.editor-tool-card[data-editor-tool="'+id+'"]')?.hidden,
              centerHit:!!el&&(hit===el||el.contains(hit)),
              inRail:!!rect&&!!rail&&x>=rail.left&&x<rail.right&&
                y>=rail.top&&y<rail.bottom,
              rect:rect?[rect.left,rect.top,rect.width,rect.height]:null};
          },id);
          assert.ok(state.focused&&state.pressed==='true'&&
            state.tabindex===0&&!state.hidden&&state.cardVisible,
            scenario.name+'/'+category.id+'/'+step+
            ': keyboard selection or focus ownership broken: '+JSON.stringify(state));
          assert.ok(state.centerHit&&state.inRail,
            scenario.name+'/'+category.id+'/'+step+
            ': keyboard-selected tool remains obscured or off the rail: '+JSON.stringify(state));
          return state;
        }
        await chip(ids[0]).click(); // real pointer starts keyboard focus
        await verify(ids[0],'pointer-initial');
        // Even one-item conditional tabs must keep their selected chip
        // reachable when Home, End, Left and Right are pressed.
        await page.keyboard.press('End');
        await verify(ids[ids.length-1],'end');
        await page.keyboard.press('Home');
        await verify(ids[0],'home');
        for(let index=1;index<ids.length;index++){
          await page.keyboard.press('ArrowRight');
          await verify(ids[index],'right-'+index);
        }
        await page.keyboard.press('ArrowRight');
        await verify(ids[0],'right-wrap');
        await page.keyboard.press('ArrowLeft');
        await verify(ids[ids.length-1],'left-wrap');
        await page.keyboard.press('Home');
        await verify(ids[0],'restore-home');
        record.push({category:category.id,available:ids,
          keyboardActions:ids.length+5,focusObscured:false});
        if(['path','details','material'].includes(category.id)){
          await page.screenshot({path:join(out,scenario.name+'-'+category.id+'.png'),
            animations:'disabled'});
        }
      }
      assert.deepEqual(
        decodeRecipe(new URL(page.url()).searchParams.get('r')),recipe,
        scenario.name+': keyboard tool navigation mutated wallpaper settings');
      assert.deepEqual(localErrors,[],'Uncaught browser errors during tool traversal');
      observations.push({scenario:scenario.name,viewport:scenario.viewport,
        categories:record,recipePreserved:true});
      console.log('AGENT3_TOOL_ROVING',JSON.stringify({scenario:scenario.name,
        categories:record.length,keys:record.reduce((n,x)=>n+x.keyboardActions,0)}));
    }catch(error){
      errors.push({scenario:scenario.name,message:String(error),stack:error.stack});
      await page.screenshot({path:join(out,'failure-'+scenario.name+'.png'),
        animations:'disabled'}).catch(()=>{});
    }finally{await page.close()}
  }
  await writeFile(join(out,'evidence.json'),JSON.stringify({
    classification:errors.length?'not verified':'actual keyboard behavior verified for tested tool strips',
    limitations:['native screen-reader announcements not tested',
      'native Pixel 6 Pro Chrome not observed','canonical visual fidelity not approved',
      'actual keyboard navigation exercised from an initially pointer-selected chip'],
    observations,errors
  },null,2));
  assert.deepEqual(errors,[],'Tool strip keyboard acceptance failure');
  console.log('AGENT3_TOOL_ROVING_SUCCESS');
}finally{await browser.close()}
