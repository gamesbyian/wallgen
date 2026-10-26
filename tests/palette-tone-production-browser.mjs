#!/usr/bin/env node
/**
 * Opt-in real Chromium creative Tone acceptance on the actual mobile UI.
 * Not owner/usability/physical handset approval. Canonical colour rendering
 * stays in model -> resolveScene -> production renderer; do not duplicate it.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
import {extractPngRecipe} from '../src/png-metadata.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/palette-tone-browser');
await mkdir(out,{recursive:true});
const base=normalizeRecipe({
  seed:'tone-real-mobile-source',family:'studio',palette:'jewel',
  structure:'regions',regionMode:'scattered',scatteredCount:7,
  material:'none',outline:'none',paletteToneEnabled:false
});
const original=JSON.stringify(base);
const browser=await chromium.launch({headless:true});
const summary=[];
try{
  for(const [width,height] of [[320,700],[412,892]]){
    const context=await browser.newContext({
      viewport:{width,height},isMobile:true,hasTouch:true,
      reducedMotion:'reduce',acceptDownloads:true
    });
    const page=await context.newPage(),errors=[],remote=[];
    page.setDefaultTimeout(25000);
    page.on('pageerror',error=>errors.push(String(error)));
    page.on('request',request=>{
      if(request.url().startsWith('https://api.github.com/'))
        remote.push(request.url());
    });
    const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
    const capture=async name=>{
      const raw=await page.locator('#preview').evaluate(canvas=>
        canvas.toDataURL('image/png').split(',')[1]);
      const bytes=Buffer.from(raw,'base64');
      await writeFile(join(out,width+'x'+height+'-'+name+'.png'),bytes);
      return bytes;
    };
    try{
      await page.goto(origin+'/?r='+encodeRecipe(base),{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>
        document.body.classList.contains('mobile-five-nav'));
      assert.deepEqual(current(),base,'original portable recipe reimported unchanged');
      const before=await capture('baseline');
      await page.locator('#mobileEdit').tap();
      await page.locator('#tab-colour').tap();
      const tool=page.locator('.editor-tool-chooser [data-editor-tool="palette-tone"]');
      await tool.scrollIntoViewIfNeeded(); await tool.tap();
      assert.equal(await tool.getAttribute('aria-pressed'),'true');
      const enabled=page.locator('input[name="paletteToneEnabled"]');
      const saturation=page.locator('input[name="paletteSaturation"]');
      const lightness=page.locator('input[name="paletteLightness"]');
      assert.equal(await enabled.isChecked(),false);
      assert.equal(await saturation.isDisabled(),true);
      assert.equal(await lightness.isDisabled(),true);
      await enabled.check();
      assert.equal(current().paletteToneEnabled,true);
      assert.equal(current().paletteSaturation,84);
      assert.equal(current().paletteLightness,39);
      assert.equal(await saturation.isEnabled(),true);
      assert.equal(await lightness.isEnabled(),true);
      const unchanged=await capture('enabled-before-edit');
      assert.ok(before.equals(unchanged),
        'first enabling custom Tone must have ZERO preview pixel changes');
      // All modifications below use native keyboard events, not DOM value
      // assignment and synthetic input dispatch.
      await saturation.focus();
      await saturation.press('Home');
      for(let n=0;n<23;n++)await saturation.press('ArrowRight');
      await saturation.press('Tab');
      assert.equal(current().paletteSaturation,23);
      await lightness.focus();
      await lightness.press('End');
      for(let n=0;n<30;n++)await lightness.press('ArrowLeft');
      await lightness.press('Tab');
      assert.equal(current().paletteLightness,70);
      const authored=current();
      assert.equal(authored.paletteToneEnabled,true);
      const changed=await capture('custom-23-70');
      assert.ok(!before.equals(changed),
        'authored low-saturation artwork must change genuine preview pixels');
      const undoButton=page.locator('#undo');
      assert.ok(await undoButton.isEnabled());
      await undoButton.tap();
      assert.notDeepEqual(current(),authored,'real Undo must roll back a Tone edit');
      assert.equal(current().paletteToneEnabled,true,
        'Undo after Tone edit must not alter the enabled flag');

      // A separately authored direct recipe is a stronger transport oracle
      // than walking UI Undo history to reach an exact-slider target.
      await page.goto(origin+'/?r='+encodeRecipe(authored),{waitUntil:'domcontentloaded'});
      assert.deepEqual(current(),authored);
      if(width===412){
        const [download]=await Promise.all([
          page.waitForEvent('download',{timeout:120000}),
          page.locator('#mobileDownload').tap()
        ]);
        const png=new Uint8Array(await readFile(await download.path()));
        assert.ok(png.length>100000,'actual visible full wallpaper PNG empty');
        const embedded=extractPngRecipe(png);
        assert.deepEqual(embedded,authored,
          'actual 19.8MP PNG recipe metadata lost Tone/shape settings');
        await writeFile(join(out,'visible-full-resolution.png'),png);
      }
      await page.screenshot({path:join(out,width+'x'+height+'-controls.png'),
        animations:'disabled'});
      assert.deepEqual(errors,[],'uncaught browser errors');
      assert.deepEqual(remote,[],'no remote private-data requests');
      assert.equal(JSON.stringify(base),original,'original imported source untouched');
      const entry={viewport:[width,height],firstEnableZeroPixelChange:true,
        customToneChangesInk:true,keyboardEdit:true,undo:true,
        exactRecipeTransport:true,visibleDownload:width===412,
        pageErrors:errors.length,remoteRequests:remote.length,
        physicalPixel:'NOT TESTED',humanApproval:'NOT TESTED'};
      summary.push(entry);
      console.log('PALETTE_TONE_REAL_BROWSER '+JSON.stringify(entry));
    }finally{await context.close();}
  }
  await writeFile(join(out,'report.json'),JSON.stringify({
    schema:'roygbiv-palette-tone-browser/v1',
    evidence:'genuine-current-Chromium-portrait',
    results:summary},null,2)+'\n');
  console.log('PALETTE_TONE_REAL_BROWSER_PASS '+summary.length);
}finally{await browser.close();}
