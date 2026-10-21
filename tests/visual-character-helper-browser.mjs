#!/usr/bin/env node
/** Optical regression: source Character hint cannot be half-cut in a compact tray. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/character-helper-optical');await mkdir(out,{recursive:true});
const base=normalizeRecipe({seed:'character-help-crop-source',
 structure:'paths',construction:'ribbon',motif:'dots',individuality:54,
 overridePatternHomogeneity:false});
const browser=await chromium.launch({headless:true}),errors=[],records=[];
try{
 for(const width of [320,360,412,499,500,790,791,1024]){
  for(const theme of ['cream','dark']){
   const mobile=width<=790;
   const context=await browser.newContext({viewport:{width,height:892},
     isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
   const page=await context.newPage();page.setDefaultTimeout(18000);
   const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
   try{
    await page.goto(origin+'/?r='+encodeRecipe(base),{waitUntil:'domcontentloaded'});
    await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
    await page.reload({waitUntil:'domcontentloaded'});
    if(mobile)await page.locator('#mobileEdit').click();
    await page.locator('#tab-stripes').click();
    await page.locator('.editor-tool-chooser [data-editor-tool="character"]').click();
    const card=page.locator('.editor-tool-card[data-editor-tool="character"]');
    assert.equal(await card.isVisible(),true);
    const checkbox=card.locator('input[name="overridePatternHomogeneity"]');
    assert.equal(await checkbox.count(),1);
    assert.match(await checkbox.getAttribute('aria-description'),/additional per-stripe differences/);
    const bounds=await card.evaluate(el=>{
      const help=el.querySelector('.homogeneity-override small');
      const label=el.querySelector('.homogeneity-override');
      const primary=label.querySelector('span');
      const cb=label.querySelector('input');
      const cr=el.getBoundingClientRect(),lr=label.getBoundingClientRect(),
        pr=primary.getBoundingClientRect(),br=cb.getBoundingClientRect();
      const element=document.elementFromPoint(br.left+br.width/2,br.top+br.height/2);
      return {card:[cr.top,cr.bottom],label:[lr.top,lr.bottom],
        primary:[pr.top,pr.bottom],helper:getComputedStyle(help).display,
        clickedAtCentre:element===cb||label.contains(element),
        accessibleText:label.innerText};
    });
    assert.ok(bounds.primary[1]<=bounds.card[1]+1,
      'Character label extends beyond source card: '+JSON.stringify({width,theme,bounds}));
    assert.ok(bounds.clickedAtCentre,'Original Character checkbox is occluded');
    assert.ok(bounds.accessibleText.includes('Override pattern homogeneity'));
    if(mobile)assert.equal(bounds.helper,'none',
      'Mobile card still paints a half-cut explanation');
    else assert.notEqual(bounds.helper,'none',
      'Desktop card inexplicably lost visible long help');
    await checkbox.check();
    assert.equal(decodeRecipe(new URL(page.url()).searchParams.get('r')).overridePatternHomogeneity,true);
    await checkbox.uncheck();
    assert.deepEqual(decodeRecipe(new URL(page.url()).searchParams.get('r')),base,
      'Help legibility change accidentally altered original setting action');
    assert.deepEqual(pageErrors,[]);
    await page.screenshot({path:join(out,theme+'-'+width+'.png'),animations:'disabled'});
    records.push({width,theme,bounds,sourceAction:'checkbox on/off exact'});
    console.log('CHARACTER_HELP_OPTICAL_PASS',JSON.stringify({width,theme,bounds}));
   }catch(e){
    errors.push({width,theme,message:String(e),stack:e.stack,pageErrors});
    await page.screenshot({path:join(out,'failure-'+theme+'-'+width+'.png'),
      animations:'disabled'}).catch(()=>{});
   }finally{await context.close();}
  }
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({records,errors,
  reviewBoundary:'Actual CSS geometry/browser input; native OS/human aesthetic review separate'},null,2));
 assert.deepEqual(errors,[],'Clipped Character help / lost original source action');
 assert.equal(records.length,16);
}finally{await browser.close();}
