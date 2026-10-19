#!/usr/bin/env node
/**
 * Agent 3 real-DOM static source-ID census, not an exhaustive test of all
 * conditional controls. Records accessibility labels and physical exposure
 * separately, preserving hidden controls as required source affordances.
 */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve(process.env.ROYGBIV_CENSUS_OUT||'artifacts/agent3-runtime-source-census');
await mkdir(out,{recursive:true});
const inventory=JSON.parse(await readFile(new URL('../docs/ui-reference/source-control-inventory.json',import.meta.url),'utf8'));
assert.equal(inventory.staticIds.length,inventory.counts.staticIds,'source static ID inventory must reconcile');
assert.equal(new Set(inventory.staticIds).size,inventory.staticIds.length,'source inventory contains duplicated IDs');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:412,height:892},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
page.setDefaultTimeout(15000);
const samples=[],errors=[];
page.on('pageerror',e=>errors.push(String(e)));
async function census(state){
  const report=await page.evaluate(ids=>{
    const items=ids.map(id=>{
      // Editor migration deliberately renames old panel IDs to legacy-ID;
      // these are represented, but not falsely marked currently actionable.
      const exact=document.getElementById(id);
      const old=exact?null:document.getElementById('legacy-'+id);
      const el=exact||old;
      if(!el)return {id,present:false,renamedLegacy:false,exposed:false};
      const rect=el.getBoundingClientRect();
      const style=getComputedStyle(el);
      const x=rect.left+rect.width/2,y=rect.top+rect.height/2;
      const top=x>=0&&x<innerWidth&&y>=0&&y<innerHeight?
        document.elementFromPoint(x,y):null;
      const exposed=rect.width>0&&rect.height>0&&style.display!=='none'&&
        style.visibility!=='hidden'&&x>=0&&x<innerWidth&&
        y>=0&&y<innerHeight;
      const label=el.getAttribute('aria-label')||el.title||
        (el.labels?.[0]?.innerText||'').trim()||
        el.innerText?.trim().slice(0,120)||'';
      return {id,present:true,renamedLegacy:!!old,
        tag:el.tagName,interactive:/^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName),
        exposed,centerHit:exposed&&(top===el||el.contains(top)),
        label:label.slice(0,120),width:Math.round(rect.width),height:Math.round(rect.height)};
    });
    return {current:document.querySelector('#mobileActionDock [aria-current=page]')?.id||null,
      items};
  },inventory.staticIds);
  const missing=report.items.filter(i=>!i.present).map(i=>i.id);
  const visible=report.items.filter(i=>i.exposed);
  const unnamed=visible.filter(i=>i.interactive&&!i.label).map(i=>i.id);
  const measured={state,current:report.current,
    count:report.items.length,present:report.items.filter(i=>i.present).length,
    remappedLegacy:report.items.filter(i=>i.renamedLegacy).map(i=>i.id),
    missing,exposed:visible.map(i=>i.id),
    centerHit:visible.filter(i=>i.centerHit).map(i=>i.id),
    unnamedVisibleInteractive:unnamed};
  samples.push(measured);
  console.log('AGENT3_RUNTIME_SOURCE_CENSUS',JSON.stringify({
    state,current:measured.current,present:measured.present,
    exposed:visible.length,remappedLegacy:measured.remappedLegacy,
    missing,unnamedVisibleInteractive:unnamed
  }));
  return measured;
}
try{
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.body.classList.contains('mobile-five-nav'));
  const studio=await census('studio');
  assert.equal(studio.current,'mobileStudio');
  assert.deepEqual(studio.missing,[],'A source-inventoried control has vanished from actual Studio DOM');
  await page.locator('#mobileEdit').click();
  const edit=await census('edit');
  assert.equal(edit.current,'mobileEdit');
  await page.locator('#mobileDismissHandle').click();
  await page.locator('#mobileMore').click();
  const more=await census('more');
  assert.equal(more.current,'mobileMore');
  for(const id of ['seedInput','applySeed','download','copyRecipe','metadataToggle']){
    assert.ok(more.exposed.includes(id),'More lost visible source control '+id);
  }
  await page.keyboard.press('Escape');
  await page.locator('#mobileExplore').click();
  const explore=await census('explore');
  assert.equal(explore.current,'mobileExplore');
  assert.ok(explore.exposed.includes('gallery'),'Explore gallery is not exposed');
  await page.locator('#mobileSaved').click();
  const saved=await census('saved');
  assert.equal(saved.current,'mobileSaved');
  assert.ok(saved.exposed.includes('gallery'),'Saved gallery is not exposed');
  for(const s of samples)assert.deepEqual(s.missing,[],
    'Source IDs disappeared during live destination '+s.state);
  assert.deepEqual(errors,[],'Uncaught errors during source census');
  await writeFile(join(out,'evidence.json'),JSON.stringify({
    classification:'browser-observed DOM identity and named surface exposure',
    inventoryVersion:inventory.version,sourceCounts:inventory.counts,
    limitations:['DOM presence is not interactive reachability',
      'not all conditional phases or 40 tools exercised',
      'not native Android Chrome or screen-reader output',
      'center hit does not prove all parts of a control are reachable'],
    samples,errors
  },null,2));
  console.log('AGENT3_RUNTIME_SOURCE_CENSUS_SUCCESS');
}catch(error){
  await writeFile(join(out,'failure.json'),JSON.stringify({
    classification:'not verified',error:String(error),stack:error.stack,
    samples,errors
  },null,2));
  await page.screenshot({path:join(out,'failure.png'),animations:'disabled'}).catch(()=>{});
  throw error;
}finally{await browser.close()}
