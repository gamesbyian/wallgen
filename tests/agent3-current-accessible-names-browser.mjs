#!/usr/bin/env node
// Selective, current-DOM adaptation of the orphaned
// redesign/assistive-accessible-names-20261019 browser experiment.
// Genuine Chromium semantics; NEVER evidence of native Android TalkBack.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {EDITOR_CATEGORIES} from '../src/editor-schema.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/agent3-664-names');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const evidence=[];
try{
  for(const [width,height] of [[320,700],[412,892]]){
    const context=await browser.newContext({
      viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    page.setDefaultTimeout(30000);
    try{
      await page.goto(origin,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.body.classList.contains('mobile-five-nav'));
      const nav=page.getByRole('navigation',{name:'Wallpaper destinations'});
      assert.equal(await nav.count(),1);
      for(const [id,name] of [
        ['mobileStudio','Studio canvas'],['mobileEdit','Edit'],
        ['mobileExplore','Explore'],['mobileSaved','Saved wallpapers'],['mobileMore','More']
      ]){
        const target=nav.getByRole('button',{name,exact:true});
        assert.equal(await target.count(),1,id+' name inaccessible');
        assert.equal(await target.getAttribute('id'),id);
        assert.equal(await target.isVisible(),true,id+' visually absent');
      }
      for(const name of ['Download wallpaper PNG','Add to favourites']){
        assert.equal(await page.getByRole('button',{name,exact:true}).count(),1,
          'studio shortcut lacks expected computed name '+name);
      }
      assert.equal(await page.getByRole('img',{
        name:'Procedurally generated seven stripe rainbow wallpaper'}).count(),1);
      const status=page.locator('#studioStatus');
      assert.equal(await status.getAttribute('role'),'status');
      assert.equal(await status.getAttribute('aria-live'),'polite');
      assert.equal(await status.getAttribute('aria-atomic'),'true');
      await nav.getByRole('button',{name:'More',exact:true}).tap();
      assert.equal(await page.locator('#mobileMore').getAttribute('aria-current'),'page');
      assert.equal(await page.getByRole('button',{name:'Close tools'}).count(),1);
      for(const [role,name] of [
        ['textbox','Design seed'],['button','Apply seed'],
        ['button','Import design from PNG or JSON recipe'],
        ['button','↗ Copy design link'],
        ['button','Copy recipe JSON'],
        ['button','Save recipe JSON']
      ])assert.equal(await page.getByRole(role,{name,exact:true}).count(),1,
        'More control missing semantic '+name);
      const metadata=page.getByRole('button',{name:/Edit image metadata/});
      assert.equal(await metadata.count(),1);
      await metadata.tap();
      assert.equal(await metadata.getAttribute('aria-expanded'),'true');
      for(const name of [
        'Title','Creator / artist','Description','Copyright / usage notice',
        'Keywords','Software','Creation date & time',
        'Camera / device maker','Camera / device model','Additional comment'
      ])assert.equal(await page.getByLabel(name,{exact:true}).count(),1,
        'metadata field has no computed label '+name);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#mobileMore').getAttribute('aria-current'),null);
      assert.equal(await page.evaluate(()=>document.activeElement?.id),'mobileMore');
      await nav.getByRole('button',{name:'Edit',exact:true}).tap();
      assert.equal(await page.locator('#mobileEdit').getAttribute('aria-current'),'page');
      for(const cat of EDITOR_CATEGORIES){
        const tab=page.getByRole('tab',{name:cat.label,exact:true});
        assert.equal(await tab.count(),1,'category without accessible name '+cat.id);
        assert.equal(await tab.getAttribute('id'),'tab-'+cat.id);
        assert.equal(await tab.isVisible(),true);
      }
      await page.locator('#tab-details').tap();
      await page.locator('[data-editor-tool="typography"]').first().tap();
      assert.equal(await page.getByRole('button',{name:'Add text',exact:true}).count(),1);
      assert.equal(await page.getByLabel('Select text object').count(),1);
      assert.equal(await page.getByLabel('Import a TTF/OTF font from this device').count(),1);
      assert.deepEqual(errors,[],'page errors');
      evidence.push({viewport:[width,height],destinations:5,categories:7,
        metaLabels:10,typographyNames:true,chromium:true,talkBack:'NOT TESTED'});
      await page.screenshot({path:join(out,width+'x'+height+'.png'),
        animations:'disabled'});
      console.log('AGENT3_NAMES_PASS',JSON.stringify(evidence.at(-1)));
    }catch(e){
      await page.screenshot({path:join(out,'failure-'+width+'.png')}).catch(()=>{});
      throw new Error(width+'x'+height+': '+e.stack);
    }finally{await context.close();}
  }
  await writeFile(join(out,'evidence.json'),JSON.stringify(evidence,null,2));
}finally{await browser.close()}
