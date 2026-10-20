#!/usr/bin/env node
/**
 * Independent browser accessibility-semantics check. This reads the actual
 * Chromium accessible-name mappings through Playwright getByRole/getByLabel,
 * rather than treating a CSS-visible glyph or aria-label attribute as proof
 * that an assistive user can discover the control.
 *
 * This does not claim Android TalkBack speech, contrast or physical-device QA.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {EDITOR_CATEGORIES} from '../src/editor-schema.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/agent3-accessible-names');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const layouts=[[412,892],[700,412]];
const evidence=[],errors=[];
const nav=[
  ['mobileStudio','Studio canvas'],['mobileEdit','Edit'],
  ['mobileExplore','Explore'],['mobileSaved','Saved wallpapers'],
  ['mobileMore','More']
];
try{
  for(const [width,height] of layouts){
    const page=await browser.newPage({
      viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion:'reduce'
    });
    const record={viewport:[width,height],navigation:[],metadata:[],categories:[],notes:[]};
    try{
      await page.goto(origin,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.body.classList.contains('mobile-five-nav'));
      const destination=page.getByRole('navigation',{name:'Wallpaper destinations'});
      assert.equal(await destination.count(),1,'semantic five-mode navigation missing');
      for(const [id,name] of nav){
        const button=destination.getByRole('button',{name,exact:true});
        assert.equal(await button.count(),1,'accessible destination missing '+id);
        assert.equal(await button.getAttribute('id'),id);
        assert.ok(await button.isVisible(),id+' inaccessible to sighted user');
        record.navigation.push({id,name});
      }
      const status=page.getByRole('status').filter({has:page.locator('#studioStatus')});
      // Use the original source status node. It is a real polite, atomic
      // live region and must remain mounted throughout navigation.
      const statusNode=page.locator('#studioStatus');
      assert.equal(await statusNode.getAttribute('role'),'status');
      assert.equal(await statusNode.getAttribute('aria-live'),'polite');
      assert.equal(await statusNode.getAttribute('aria-atomic'),'true');
      assert.ok(await statusNode.isVisible(),'global announced status is hidden');
      assert.equal(await page.getByRole('img',{name:'Procedurally generated seven stripe rainbow wallpaper'}).count(),1);
      for(const [id,name] of [
        ['mobileFavorite','Save or remove favourite'],
        ['mobileDownload','Download wallpaper PNG']
      ]){
        assert.equal(await page.getByRole('button',{name,exact:true}).count(),1,
          'source artwork shortcut has no accessible name: '+id);
      }
      await destination.getByRole('button',{name:'More',exact:true}).click();
      assert.equal(await page.locator('#mobileMore').getAttribute('aria-current'),'page');
      assert.equal(await page.getByRole('button',{name:'Close tools'}).count(),1);
      for(const [id,name] of [
        ['seedInput','Design seed'],
        ['applySeed','Apply seed'],
        ['importRecipePNG','Restore design from saved PNG metadata'],
        ['copyLink','↗ Copy design link'],
        ['copyRecipe','Copy recipe JSON'],
        ['downloadRecipe','Save recipe JSON']
      ]){
        const el=page.locator('#'+id);
        assert.ok(await el.isVisible(),id+' is hidden in More');
        const role=id==='seedInput'?'textbox':'button';
        const found=page.getByRole(role,{name,exact:true});
        assert.equal(await found.count(),1,'original More accessible name missing: '+id);
        record.metadata.push({id,name,role});
      }
      const toggle=page.getByRole('button',{name:/Edit image metadata/});
      assert.equal(await toggle.count(),1);
      assert.equal(await toggle.getAttribute('aria-expanded'),'false');
      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-expanded'),'true');
      for(const name of [
        'Title','Creator / artist','Description','Copyright / usage notice',
        'Keywords','Software','Creation date & time',
        'Camera / device maker','Camera / device model','Additional comment'
      ]){
        const field=page.getByLabel(name,{exact:true});
        assert.equal(await field.count(),1,'metadata field has no computed label: '+name);
        assert.ok(await field.isVisible(),'metadata field is hidden: '+name);
        record.metadata.push({name,role:await field.getAttribute('type')||'text'});
      }
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#mobileMore').getAttribute('aria-current'),null,
        'Escape left More selected');
      assert.equal(await page.evaluate(()=>document.activeElement?.id),'mobileMore',
        'Escape must restore focus to the More destination');
      await destination.getByRole('button',{name:'Edit',exact:true}).click();
      assert.equal(await page.locator('#mobileEdit').getAttribute('aria-current'),'page');
      for(const cat of EDITOR_CATEGORIES){
        const el=page.getByRole('tab',{name:cat.label,exact:true});
        assert.equal(await el.count(),1,
          'source editor category has no unique accessible role/name: '+cat.id);
        assert.equal(await el.getAttribute('id'),'tab-'+cat.id);
        assert.ok(await el.isVisible(),'source category not visible: '+cat.id);
        record.categories.push(cat.id);
      }
      await page.screenshot({path:join(out,width+'x'+height+'-editor.png'),
        animations:'disabled'});
      evidence.push(record);
      console.log('ACCESSIBLE_NAMES',JSON.stringify({
        viewport:record.viewport,navigation:record.navigation.length,
        metadata:record.metadata.length,categories:record.categories.length
      }));
    }catch(error){
      errors.push({viewport:[width,height],message:String(error),stack:error.stack});
      await page.screenshot({path:join(out,'failure-'+width+'x'+height+'.png'),
        animations:'disabled'}).catch(()=>{});
    }finally{await page.close()}
  }
  await writeFile(join(out,'evidence.json'),JSON.stringify({
    classification:errors.length?'NOT VERIFIED':'actual Chromium accessible names and semantic navigation verified',
    limits:['not TalkBack or VoiceOver speech','not native Android Chrome',
      'not full contrast or every conditional screen state'],
    evidence,errors
  },null,2));
  assert.deepEqual(errors,[],'accessible-name acceptance failures');
  console.log('ACCESSIBLE_NAMES_SUCCESS');
}finally{await browser.close()}
