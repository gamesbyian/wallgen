#!/usr/bin/env node
// Genuine Chromium touch/keyboard, DOM, IndexedDB and downloaded PNG evidence.
// Physical Pixel/Android IME/TalkBack/human creative behaviour are NOT TESTED.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {decodeRecipe} from '../src/model.js';
import {extractPngRecipe} from '../src/png-metadata.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/agent3-664-typography');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const evidence=[];
try{
  for(const [width,height] of [[320,700],[412,892]]){
    const context=await browser.newContext({viewport:{width,height},
      isMobile:true,hasTouch:true,acceptDownloads:true,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[],remoteRequests=[];
    page.on('pageerror',e=>errors.push(String(e)));
    page.on('request',r=>{if(r.url().startsWith('https://api.github.com/'))
      remoteRequests.push(r.url());});
    page.setDefaultTimeout(45000);
    const recipe=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
    try{
      await page.goto(origin,{waitUntil:'domcontentloaded'});
      await page.locator('#mobileEdit').tap();
      await page.locator('#tab-details').tap();
      await page.locator('.editor-tool-chooser [data-editor-tool="typography"]').tap();
      await page.locator('[data-text-add]').tap();
      const initial=recipe();
      assert.equal(initial.textOverlays.length,1);
      const textarea=page.locator('[data-text-key="text"]');
      assert.equal(await textarea.evaluate(el=>document.activeElement===el),true,
        'new text must focus the actual editable input');
      await textarea.fill('Rainbow café fi ffi');
      await textarea.press('Tab'); // commit on change; ordinary typing must not steal focus
      assert.equal(recipe().textOverlays[0].text,'Rainbow café fi ffi');
      await page.locator('[data-text-key="colour"]').selectOption('rainbow-letter');
      await page.locator('[data-text-key="outline"]').selectOption('white');
      assert.equal(recipe().textOverlays[0].colour,'rainbow-letter');
      assert.equal(recipe().textOverlays[0].outline,'white');
      // Use an actual licensed TTF from the production font bundle as a
      // synthetic private import; never upload user data or third-party files.
      await page.locator('[data-text-import]').setInputFiles(resolve('assets/fonts/bangers.ttf'));
      await page.waitForFunction(()=>document.querySelector('[data-text-font-status]')
        ?.textContent.includes('Font installed locally:'));
      const withFont=recipe();
      const font=withFont.textOverlays[0].font;
      assert.match(font,/^user-[a-f0-9]{64}$/,'real private import missing');
      await page.reload({waitUntil:'domcontentloaded'});
      assert.equal(recipe().textOverlays[0].font,font,'recipe link lost font ID');
      await page.locator('#mobileEdit').tap();
      await page.locator('#tab-details').tap();
      await page.locator('.editor-tool-chooser [data-editor-tool="typography"]').tap();
      await page.waitForFunction(expected=>
        [...document.querySelectorAll('[data-text-key="font"] option')]
          .some(x=>x.value===expected&&x.textContent.includes('My fonts')),font,
          {timeout:20000});
      assert.equal(await page.locator('[data-text-font-status]').textContent(),'',
        'private font missing on reload');
      await page.locator('[data-text-move]').tap();
      const scale=page.getByRole('button',{name:/^Scale text\. Drag or use/});
      const rotate=page.getByRole('button',{name:/^Rotate text\. Drag or use/});
      for(const handle of [scale,rotate]){
        assert.equal(await handle.isVisible(),true,'text transform handle hidden');
        const size=await handle.boundingBox();
        assert.ok(size.width>=43&&size.height>=43,'transform handle below 44px reach');
      }
      const beforeScale=recipe().textOverlays[0].size;
      await scale.focus();await scale.press('ArrowUp');
      assert.equal(recipe().textOverlays[0].size,beforeScale+8,
        'keyboard scale did not commit canonical recipe');
      await page.locator('#undo').tap();
      assert.equal(recipe().textOverlays[0].size,beforeScale,'Undo did not reverse scale');
      await rotate.focus();await rotate.press('ArrowRight');
      assert.equal(recipe().textOverlays[0].rotation,15,
        'keyboard rotate did not commit');
      await page.locator('#undo').tap();
      assert.equal(recipe().textOverlays[0].rotation,0,'Undo did not reverse rotation');
      await page.locator('#textDirectDone').tap();
      const saved=recipe();
      await page.screenshot({path:join(out,width+'x'+height+'-wallpaper.png'),
        animations:'disabled'});
      const [pngDownload]=await Promise.all([
        page.waitForEvent('download',{timeout:120000}),
        page.locator('#mobileDownload').tap()
      ]);
      assert.match(pngDownload.suggestedFilename(),/\.png$/);
      const bytes=new Uint8Array(await readFile(await pngDownload.path()));
      assert.deepEqual(extractPngRecipe(bytes),saved,'visible PNG export changed recipe');
      assert.ok(bytes.length>100000,'real PNG image unexpectedly tiny');
      // Private font identifiers may be portable; the binary stays local.
      assert.ok(!Buffer.from(bytes).includes(Buffer.from('Bangers-Regular')),
        'PNG contains unexpected raw font signature');
      await page.locator('#mobileMore').tap();
      const [jsonDownload]=await Promise.all([
        page.waitForEvent('download',{timeout:30000}),
        page.locator('#downloadRecipe').tap()
      ]);
      assert.match(jsonDownload.suggestedFilename(),/\.json$/);
      const json=JSON.parse(await readFile(await jsonDownload.path(),'utf8'));
      // Recipe JSON may include a version wrapper; canonical text remains present.
      assert.ok(JSON.stringify(json).includes(font));
      await page.locator('#importRecipeFile').setInputFiles({
        name:'restored.png',mimeType:'image/png',buffer:Buffer.from(bytes)
      });
      await page.waitForFunction(seed=>
        document.querySelector('#seedInput')?.value===seed,saved.seed);
      assert.deepEqual(recipe(),saved,'PNG recipe restore changed canonical art');
      assert.deepEqual(errors,[],'uncaught app exceptions');
      assert.deepEqual(remoteRequests,[],'nonconsensual GitHub API call');
      evidence.push({viewport:[width,height],privateFontId:font.slice(0,19)+'…',
        persisted:true,textInput:true,outline:true,rainbow:true,
        scaleUndo:true,rotateUndo:true,handle44px:true,visibleDownload:true,
        pngBytes:bytes.length,pngRecipeExact:true,jsonSaved:true,pngRestored:true,
        remoteCalls:0,physicalPixel:'NOT TESTED',androidIME:'NOT TESTED',
        talkBack:'NOT TESTED'});
      console.log('AGENT3_TYPE_JOURNEY_PASS',JSON.stringify(evidence.at(-1)));
    }catch(e){
      await page.screenshot({path:join(out,'failure-'+width+'x'+height+'.png'),
        animations:'disabled'}).catch(()=>{});
      throw new Error(width+'x'+height+': '+e.stack);
    }finally{await context.close();}
  }
  await writeFile(join(out,'evidence.json'),JSON.stringify(evidence,null,2));
}finally{await browser.close()}
