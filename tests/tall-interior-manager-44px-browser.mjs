#!/usr/bin/env node
/** Real source Interior Elements: seven 44px targets, identities, locks and Undo. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/tall-interior-manager-44');
await mkdir(out,{recursive:true});
const base=normalizeRecipe({
 seed:'interior-manager-tall-native-44',structure:'paths',geometry:'zigzag',
 interiorElements:[
  {id:'manager-alpha',enabled:true,type:'line',shape:'wave',
    placement:'field',color:'white',width:1.5,frequency:6,amplitude:.12},
  {id:'manager-beta',enabled:true,type:'line',shape:'loop',
    placement:'contour',color:'black',width:2,frequency:3,amplitude:.07}
 ],lockedSettings:[],viewZoom:.8,viewPanY:8
});
const browser=await chromium.launch({headless:true}),rows=[],failures=[];
try{
 for(const [width,height] of [[320,892],[360,892],[412,892],[499,892],[320,700]])
 for(const theme of ['cream','dark']){
  const context=await browser.newContext({viewport:{width,height:892===height?892:height},
    isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.setDefaultTimeout(22000);
  const recipe=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
  try{
   await page.goto(origin+'/?r='+encodeRecipe(base),{waitUntil:'domcontentloaded'});
   await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
   await page.reload({waitUntil:'domcontentloaded'});
   assert.deepEqual(recipe(),base,'Imported source interior fixture mutated');
   await page.locator('#mobileEdit').tap();
   await page.locator('#tab-details').tap();
   await page.locator('.editor-tool-chooser [data-editor-tool="interior"]').tap();
   const card=page.locator('.editor-tool-card[data-editor-tool="interior"]');
   const chooser=card.locator('.interior-toolbar select');
   const add=card.locator('.interior-toolbar button').first();
   const remove=card.locator('.interior-toolbar button').last();
   const up=card.locator('.interior-actions button').nth(0);
   const down=card.locator('.interior-actions button').nth(1);
   const lock=card.locator('.interior-actions button').nth(2);
   const toggle=card.locator('label.interior-toggle');
   const controls=[['chooser',chooser],['add',add],['remove',remove],
     ['up',up],['down',down],['lock',lock],['enabled-label',toggle]];
   assert.equal(await card.isVisible(),true);
   const tray=await page.locator('#mobileDesignSheet').boundingBox();
   const stage=await page.locator('.studio-stage').boundingBox();
   assert.ok(stage.y+stage.height<=tray.y+2,'Interior UI overlaps reserved art stage');
   const measurements=[];
   for(const [name,el] of controls){
    await el.scrollIntoViewIfNeeded();
    const m=await el.evaluate(node=>{
      const r=node.getBoundingClientRect(),card=node.closest('.editor-tool-card').getBoundingClientRect();
      const owners=[.18,.5,.82].flatMap(y=>[.18,.5,.82].map(x=>{
        const hit=document.elementFromPoint(r.left+r.width*x,r.top+r.height*y);
        return hit===node||node.contains(hit);
      }));
      return {x:r.x,y:r.y,width:r.width,height:r.height,
        owners:owners.every(Boolean),
        withinCard:r.left>=card.left-2&&r.right<=card.right+2&&
          r.top>=card.top-2&&r.bottom<=card.bottom+2};
    });
    if(height>=840)
     assert.ok(m.width>=44&&m.height>=44&&m.owners&&m.withinCard,
       'Original Interior manager touch target below44/blocked: '+JSON.stringify({name,width,theme,m}));
    measurements.push({name,...m});
   }
   for(let a=0;a<measurements.length;a++)for(let b=a+1;b<measurements.length;b++){
    const x=measurements[a],y=measurements[b];
    if(height<840)continue;
    assert.ok(x.x+x.width<=y.x+1||y.x+y.width<=x.x+1||
      x.y+x.height<=y.y+1||y.y+y.height<=x.y+1,
      'Independent Interior source cells overlap: '+JSON.stringify({x,y}));
   }
   await chooser.selectOption('1');
   assert.deepEqual(recipe(),base,'Selecting original second element mutated authored source');
   await chooser.selectOption('0');
   assert.deepEqual(recipe(),base);
   const taps=[.18,.82].flatMap(fy=>[.18,.82].map(fx=>({fx,fy})));
   const at=async(el,point)=>{
     await el.scrollIntoViewIfNeeded();
     const b=await el.boundingBox();
     await el.tap({position:{x:b.width*point.fx,y:b.height*point.fy}});
   };
   for(const point of taps){
    await at(add,point);
    assert.equal(recipe().interiorElements.length,3,'Native Add corner missed source action');
    assert.deepEqual(recipe().interiorElements.slice(0,2),base.interiorElements);
    await page.locator('#undo').tap();
    assert.deepEqual(recipe(),base,'Original Add→global Undo changed original IDs');

    await at(remove,point);
    assert.deepEqual(recipe().interiorElements.map(e=>e.id),['manager-beta'],
      'Native Remove corner targeted wrong original element');
    await page.locator('#undo').tap();
    assert.deepEqual(recipe(),base,'Remove→Undo lost original source fields');

    assert.equal(await up.isDisabled(),true);
    await at(down,point);
    assert.deepEqual(recipe().interiorElements.map(e=>e.id),
      ['manager-beta','manager-alpha'],'Native Down corner reordered wrong stable identity');
    await at(up,point);
    assert.deepEqual(recipe(),base,'Native Down→Up did not restore original source recipe');

    await at(lock,point);
    assert.ok(recipe().lockedSettings.includes('interiorElements'),
      'Native Lock corner did not lock original stack');
    await at(lock,point);
    assert.deepEqual(recipe(),base,'Lock→Unlock changed unrelated scene');

    await at(toggle,point);
    assert.equal(recipe().interiorElements[0].enabled,false,
      'Enabled source label corner failed its native checkbox');
    await at(toggle,point);
    assert.deepEqual(recipe(),base,'Enabled double touch corrupted full source recipe');
   }
   assert.deepEqual(errors,[],'Uncaught browser page error');
   const record={width,height,theme,measurements,actionsPerType:taps.length,
     exactSourceRoundTrip:true,stableElementIds:true,
     previewReservationPreserved:true,
     under44:measurements.filter(x=>x.width<44||x.height<44).map(x=>x.name)};
   rows.push(record);
   await page.screenshot({path:join(out,width+'x'+height+'-'+theme+'.png'),
     animations:'disabled'});
   console.log('INTERIOR_MANAGER_44_PASS',JSON.stringify(record));
  }catch(error){
   failures.push({width,height,theme,error:String(error),stack:error.stack,pageErrors:errors});
   await page.screenshot({path:join(out,'failure-'+width+'-'+height+'-'+theme+'.png'),
     animations:'disabled'}).catch(()=>{});
  }finally{await context.close();}
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({rows,failures,
   exclusions:['all eight-element capacity states','physical Pixel thumb taps','TalkBack',
     'human visual preference','short-height 44px sizing']},null,2));
 assert.deepEqual(failures,[],'Interior Elements manager native touch test failed');
}finally{await browser.close()}
