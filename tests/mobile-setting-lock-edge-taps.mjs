#!/usr/bin/env node
/**
 * Representative source setting lock: real 3×3 edge taps, not just DOM
 * bounding boxes. Record neighbouring die geometry without claiming WCAG
 * certification or proposing a universal 44px width inside compact rows.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve(process.env.ROYGBIV_LOCK_EDGE_OUT||
  'artifacts/mobile-setting-lock-edges');
await mkdir(out,{recursive:true});
const fixture=normalizeRecipe({
  seed:'source-setting-edge-taps',structure:'paths',geometry:'zigzag',
  shapeFrequency:61,shapeDepth:79,lockedSettings:[]
});
const browser=await chromium.launch({headless:true}),observations=[];
try{
  for(const width of [320,412]){
    for(const theme of ['cream','dark']){
      const context=await browser.newContext({viewport:{width,height:892},
        isMobile:true,hasTouch:true,reducedMotion:'reduce'});
      const page=await context.newPage(),errors=[];
      page.setDefaultTimeout(15000);
      page.on('pageerror',error=>errors.push(String(error)));
      try{
        await page.goto(origin+'/?r='+encodeRecipe(fixture),{waitUntil:'domcontentloaded'});
        await page.evaluate(theme=>localStorage.setItem('roygbiv:studio-theme:v1',theme),theme);
        await page.reload({waitUntil:'domcontentloaded'});
        const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
        assert.deepEqual(current(),fixture,'Source fixture was modified on import');
        await page.locator('#mobileEdit').tap();
        await page.locator('#tab-path').tap();
        await page.locator('.editor-tool-chooser [data-editor-tool="geometry"]').tap();
        const lock=page.locator('.setting-lock[data-lock-key="shapeFrequency"]');
        const die=page.locator('#controls [data-random-setting="shapeFrequency"]');
        const source=page.locator('[data-setting][name="shapeFrequency"]');
        assert.equal(await lock.count(),1);
        assert.equal(await die.count(),1);
        assert.ok(await lock.isEnabled()&&await die.isEnabled()&&await source.isEnabled());
        await lock.scrollIntoViewIfNeeded();
        const initial=await page.evaluate(()=>{
          const lock=document.querySelector('.setting-lock[data-lock-key="shapeFrequency"]');
          const die=document.querySelector('#controls [data-random-setting="shapeFrequency"]');
          const l=lock.getBoundingClientRect(),d=die.getBoundingClientRect();
          const ownerAt=(x,y)=>{const own=document.elementFromPoint(x,y);
            return own===lock||lock.contains(own)};
          const probes=[.12,.5,.88].flatMap(fy=>[.12,.5,.88].map(fx=>
            ownerAt(l.left+l.width*fx,l.top+l.height*fy)));
          return {lock:{width:l.width,height:l.height,x:l.x,y:l.y},
            die:{width:d.width,height:d.height,x:d.x,y:d.y},
            gapX:Math.max(0,d.left-l.right,l.left-d.right),
            gapY:Math.max(0,d.top-l.bottom,l.top-d.bottom),
            ninePointerOwners:probes};
        });
        assert.ok(initial.lock.width>=24&&initial.lock.height>=24,
          'Original mobile source lock is below WCAG 24px size floor: '+
          JSON.stringify(initial));
        assert.equal(initial.ninePointerOwners.length,9);
        assert.ok(initial.ninePointerOwners.every(Boolean),
          'Original source lock is obstructed within its real visible box: '+
          JSON.stringify(initial));
        const points=[.12,.5,.88].flatMap(fy=>[.12,.5,.88].map(fx=>({fx,fy})));
        for(const point of points){
          await lock.scrollIntoViewIfNeeded();
          const r=await lock.boundingBox();
          const x=r.width*point.fx,y=r.height*point.fy;
          await lock.tap({position:{x,y}});
          assert.ok(current().lockedSettings.includes('shapeFrequency'),
            'Edge touch must lock precisely shapeFrequency at '+JSON.stringify(point));
          assert.equal(await source.isDisabled(),true);
          assert.equal(await die.isDisabled(),true);
          await lock.tap({position:{x,y}});
          assert.deepEqual(current(),fixture,
            'Two native corner/edge touches must exactly restore whole recipe at '+
            JSON.stringify(point));
          assert.equal(await die.isEnabled(),true);
        }
        // The die is an independent neighbouring source button. Its own nine
        // true native touch positions must dispatch to the die, never the lock.
        // Reroll is stochastic, so count actual click ownership even if a
        // legitimate reroll returns the same value; Undo only real mutations.
        const dieGeometry=await die.evaluate(el=>{
          const r=el.getBoundingClientRect();
          const lock=el.closest('.lockable-setting').querySelector('.setting-lock');
          const owners=[.12,.5,.88].flatMap(fy=>[.12,.5,.88].map(fx=>{
            const top=document.elementFromPoint(r.left+r.width*fx,r.top+r.height*fy);
            return top===el||el.contains(top);
          }));
          window.__sourceDieTouchCount=0;
          el.addEventListener('click',()=>{window.__sourceDieTouchCount++});
          return {width:r.width,height:r.height,owners,
            lockDisabled:lock.disabled};
        });
        assert.ok(dieGeometry.width>=24&&dieGeometry.height>=24&&
          dieGeometry.owners.every(Boolean),
          'Original die is obstructed/under 24px in source row: '+JSON.stringify(dieGeometry));
        const dieActions=[];
        for(const point of points){
          await die.scrollIntoViewIfNeeded();
          const r=await die.boundingBox(),before=current();
          const clicksBefore=await page.evaluate(()=>window.__sourceDieTouchCount);
          await die.tap({position:{x:r.width*point.fx,y:r.height*point.fy}});
          const clicksAfter=await page.evaluate(()=>window.__sourceDieTouchCount);
          assert.equal(clicksAfter,clicksBefore+1,
            'Die edge tap missed the original source die: '+JSON.stringify(point));
          const after=current();
          for(const key of Object.keys(before).filter(k=>k!=='shapeFrequency'))
            assert.deepEqual(after[key],before[key],
              'Die edge tap changed unrelated source field '+key);
          assert.ok(!after.lockedSettings.includes('shapeFrequency'),
            'Die touch accidentally locked its neighbour');
          if(after.shapeFrequency!==before.shapeFrequency){
            await page.locator('#undo').tap();
            assert.deepEqual(current(),before,
              'Scoped die source mutation failed exact full-recipe Undo');
          }
          dieActions.push({...point,clickDispatched:true,
            valueChanged:after.shapeFrequency!==before.shapeFrequency});
        }
        // Nearby native minus, plus and numeric controls are the next
        // independently undersized class. Exercise real touch positions while
        // the lock/die stay adjacent, without substituting a Focus slider.
        const stepper=lock.locator('xpath=..').locator('.stepper');
        const buttons=stepper.locator('.step-button');
        const numeric=stepper.locator('.slider-number');
        assert.equal(await buttons.count(),2);
        assert.equal(await numeric.count(),1);
        const stepGeometry=[];
        for(const el of [buttons.nth(0),buttons.nth(1),numeric]){
          const m=await el.evaluate(node=>{
            const r=node.getBoundingClientRect();
            const owners=[.12,.5,.88].flatMap(fy=>[.12,.5,.88].map(fx=>{
              const top=document.elementFromPoint(r.left+r.width*fx,r.top+r.height*fy);
              return top===node||node.contains(top);
            }));
            return {width:r.width,height:r.height,owners};
          });
          assert.ok(m.width>=20&&m.height>=24&&m.owners.every(Boolean),
            'Original numeric stepper child clipped/blocked: '+JSON.stringify(m));
          stepGeometry.push(m);
        }
        const step=Number(await source.getAttribute('step'))||1;
        const stepTouches=[];
        for(const point of points){
          const before=current(),plus=buttons.nth(1),minus=buttons.nth(0);
          const pr=await plus.boundingBox();
          await plus.tap({position:{x:pr.width*point.fx,y:pr.height*point.fy}});
          assert.deepEqual(current(),{...before,shapeFrequency:before.shapeFrequency+step},
            'Native plus edge touch mutated unexpected source field');
          const mr=await minus.boundingBox();
          await minus.tap({position:{x:mr.width*point.fx,y:mr.height*point.fy}});
          assert.deepEqual(current(),before,
            'Paired original +/- native edge touches failed exact recipe restoration');
          stepTouches.push({...point,pairedRoundTrip:true});
        }
        const beforeNumeric=current();
        await numeric.tap();
        await numeric.fill(String(beforeNumeric.shapeFrequency+step));
        await numeric.press('Tab');
        assert.deepEqual(current(),{...beforeNumeric,
          shapeFrequency:beforeNumeric.shapeFrequency+step},
          'Native numeric source edit changed an unrelated field');
        await numeric.fill(String(beforeNumeric.shapeFrequency));
        await numeric.press('Tab');
        assert.deepEqual(current(),beforeNumeric,
          'Native numeric value could not restore original whole recipe');
        await lock.tap();
        assert.equal(await buttons.nth(0).isDisabled(),true);
        assert.equal(await buttons.nth(1).isDisabled(),true);
        assert.equal(await numeric.isDisabled(),true);
        await lock.tap();
        assert.deepEqual(current(),fixture,'Stepper lock/unlock lost source recipe');
        assert.deepEqual(current(),fixture,
          'Native die edge matrix changed original source recipe');
        assert.deepEqual(errors,[],'Source browser errors');
        const observation={width,theme,initial,touched:points,dieGeometry,dieActions,stepGeometry,stepTouches,
          exactRoundTrips:points.length,recipePreserved:true,
          under44:initial.lock.width<44||initial.lock.height<44||
            dieGeometry.width<44||dieGeometry.height<44};
        observations.push(observation);
        await page.screenshot({path:join(out,width+'-'+theme+'.png'),
          animations:'disabled'});
        console.log('SETTING_LOCK_EDGE_PASS',JSON.stringify(observation));
      }finally{await context.close()}
    }
  }
  await writeFile(join(out,'evidence.json'),JSON.stringify({
    source:'real mobile Chromium, nine independent native lock, die, +/- stepper touch pairs per scene',
    observations,claims:[
      'Representative original lock reachability and exact native lock/unlock',
      'Neighbour die 9-position real touch dispatch, setting-only scope and exact Undo',
      'Original plus/minus 9-position paired native touch, numeric edit and lock gates',
      'Original 24px target is not necessarily ergonomic 44px target'
    ],exclusions:['other 82 setting dice','other lockable rows',
      'physical Android finger precision','TalkBack and human visual review']
  },null,2));
}finally{await browser.close()}
