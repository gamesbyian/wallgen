#!/usr/bin/env node
// Opt-in, one-shot REAL Chromium/IndexedDB app acceptance. Synthetic owner
// gestures only: no participant, physical Android, credential, or remote sync.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';

const url=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const dir=resolve('artifacts/agent3-activity-idb-browser');
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true});
const evidence=[];
try{
  for(const [width,height] of [[412,892],[320,700]]){
    const context=await browser.newContext({viewport:{width,height},
      isMobile:true,hasTouch:true,acceptDownloads:true,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[],remoteCalls=[];
    page.on('pageerror',e=>errors.push(String(e)));
    page.on('request',r=>{
      if(r.url().startsWith('https://api.github.com/'))
        remoteCalls.push({method:r.method(),url:r.url()});
    });
    page.setDefaultTimeout(25000);
    const open=async()=>{
      await page.locator('#creativeActivityOpen').evaluate(el=>el.click());
      await page.locator('#creativeActivityDialog[open]').waitFor();
    };
    const close=async()=>{
      await page.locator('[data-usage-close]').click();
      await page.waitForFunction(()=>!document.getElementById('creativeActivityDialog').open);
    };
    const exportEvents=async()=>{
      const downloadPromise=page.waitForEvent('download');
      await page.locator('[data-usage-export]').click();
      const download=await downloadPromise;
      assert.match(download.suggestedFilename(),/^roygbiv-activity-/);
      const file=await download.path();
      const data=JSON.parse(await readFile(file,'utf8'));
      assert.equal(data.source,'ROYGBIV local activity');
      return data;
    };
    try{
      await page.goto(url,{waitUntil:'domcontentloaded'});
      await page.locator('#creativeActivityOpen').waitFor({state:'attached'});
      await open();
      assert.equal(await page.locator('[data-usage-enabled]').isChecked(),false,
        'fresh Chrome context must be recording OFF');
      let record=await exportEvents();
      assert.equal(record.events.length,0,
        'activity before local consent must be entirely absent');
      assert.equal(await page.evaluate(()=>localStorage.getItem('roygbiv:creative-usage-mode:v1')),null);
      await page.locator('[data-usage-enabled]').check();
      await page.waitForFunction(()=>document.querySelector('[data-usage-status]')?.textContent.includes('Recording on'));
      assert.equal(await page.evaluate(()=>localStorage.getItem('roygbiv:creative-usage-mode:v1')),'local');
      record=await exportEvents();
      assert.ok(record.events.some(x=>x.type==='episode_start'),'explicit opt-in starts an episode');
      const initial=record.events.length;
      await close();

      // Trigger the real Seed Apply and Randomize All application handlers,
      // without impersonating an observed human creative journey.
      await page.evaluate(()=>{
        document.getElementById('seedInput').value='agent3-idb-fixture';
        document.getElementById('applySeed').click();
      });
      await page.evaluate(()=>document.getElementById('randomizeAll').click());
      await open();
      record=await exportEvents();
      assert.ok(record.events.some(e=>e.type==='recipe_commit'&&e.changes?.some(c=>c.key==='seed')),
        'Seed Apply must commit a canonical recipe patch');
      assert.ok(record.events.some(e=>e.type==='episode_end'&&e.cause==='randomize_all'),
        'Randomize All must preserve the superseded draft as an ended episode');
      assert.ok(record.events.length>initial);
      const beforeReload=record.events.length;
      assert.match(await page.locator('[data-usage-queue]').textContent(),/0 confirmed remotely/,
        'without a token, no event may be acknowledged as remote');
      await close();

      await page.reload({waitUntil:'domcontentloaded'});
      await page.locator('#creativeActivityOpen').waitFor({state:'attached'});
      await open();
      assert.equal(await page.locator('[data-usage-enabled]').isChecked(),true,
        'explicit previous opt-in persists on reload');
      record=await exportEvents();
      assert.ok(record.events.length>=beforeReload);
      assert.ok(record.events.some(x=>x.type==='session_interrupted'&&x.uncertain===true),
        'previous launch must be honestly tagged uncertain');
      const beforeOptOut=record.events.length;
      await page.locator('[data-usage-enabled]').uncheck();
      await page.waitForFunction(()=>document.querySelector('[data-usage-status]')?.textContent.includes('Recording off'));
      await page.evaluate(()=>document.getElementById('randomizeAll').click());
      record=await exportEvents();
      assert.equal(record.events.length,beforeOptOut,
        'revocation stops new events even after another Randomize All');
      assert.equal(await page.evaluate(()=>localStorage.getItem('roygbiv:creative-usage-mode:v1')),'off');

      // The only user-owned history here is generated inside an isolated
      // ephemeral test profile. This confirmation is synthetic and explicit.
      page.once('dialog',dialog=>dialog.accept());
      await page.locator('[data-usage-clear]').click();
      await page.waitForFunction(()=>document.querySelector('[data-usage-status]')?.textContent.includes('0 events'));
      record=await exportEvents();
      assert.deepEqual(record.events,[],'local deletion removes all events');
      assert.equal(record.lastKnown,null,'local deletion removes last-known recipe');
      await close();
      await page.reload({waitUntil:'domcontentloaded'});
      await page.locator('#creativeActivityOpen').waitFor({state:'attached'});
      await open();
      assert.equal(await page.locator('[data-usage-enabled]').isChecked(),false,
        'revocation stays effective after another restart');
      record=await exportEvents();
      assert.deepEqual(record.events,[]);
      assert.deepEqual(remoteCalls,[],'no local consent step ever invokes GitHub API');
      assert.deepEqual(errors,[],'no unhandled page exception');
      const item={width,height,freshOff:true,explicitConsent:true,
        canonicalSeedCommit:true,supersession:true,uncertainRestart:true,
        optOutStopsCapture:true,localClear:true,remoteRequests:0,
        pageErrors:0,kind:'Chromium IndexedDB plus synthetic UI handlers',
        physicalPixel:false,authenticatedGitHub:false,humanObservation:false};
      evidence.push(item);
      console.log('AGENT3_ACTIVITY_IDB_PASS '+JSON.stringify(item));
    }catch(e){
      console.error('AGENT3_ACTIVITY_IDB_FAIL',width,height,String(e));
      throw e;
    }finally{await context.close()}
  }
}finally{await browser.close()}
await writeFile(join(dir,'summary.json'),JSON.stringify({evidence},null,2)+'\n');
