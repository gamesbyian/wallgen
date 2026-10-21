#!/usr/bin/env node
/** Source Shapes row: tall-phone native 44px hit cells, lock, reroll and stepper. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/tall-shapes-width-44px');
await mkdir(out,{recursive:true});
const source=normalizeRecipe({seed:'tall-shapes-width-native-44',structure:'paths',
 geometry:'zigzag',stripeWidth:61,shapeDepth:79,lockedSettings:[],
 viewZoom:.8,viewPanX:3,viewPanY:-4});
const browser=await chromium.launch({headless:true}),rows=[],failures=[];
try{
 for(const [width,height] of [[320,892],[412,892],[499,892],[320,700]])for(const theme of ['cream','dark']){
  const context=await browser.newContext({viewport:{width,height},
    isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.setDefaultTimeout(18000);
  const recipe=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
  try{
   await page.goto(origin+'/?r='+encodeRecipe(source),{waitUntil:'domcontentloaded'});
   await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
   await page.reload({waitUntil:'domcontentloaded'});
   assert.deepEqual(recipe(),source);
   await page.locator('#mobileEdit').tap();
   await page.locator('#tab-stripes').tap();
   await page.locator('.editor-tool-chooser [data-editor-tool="structure"]').tap();
   const row=page.locator('.editor-tool-card[data-editor-tool="structure"] .lockable-setting:has(input[name="stripeWidth"])');
   const lock=row.locator(':scope > .setting-lock'),die=row.locator(':scope > .editor-setting-die');
   const minus=row.locator('.stepper>.step-button').nth(0);
   const plus=row.locator('.stepper>.step-button').nth(1);
   const number=row.locator('.stepper>.slider-number');
   const slider=row.locator('.stepper>input[type=range]');
   const label=row.locator(':scope > .field.range-field > span:not(.stepper)');
   const pairs=[['die',die],['lock',lock],['minus',minus],['plus',plus],['number',number],['slider',slider]];
   await row.scrollIntoViewIfNeeded();
   const metrics=await row.evaluate(node=>{
     const r=node.getBoundingClientRect();
     const card=node.closest('.editor-tool-card').getBoundingClientRect();
     const next=node.nextElementSibling?.getBoundingClientRect();
     const stage=document.querySelector('.studio-stage').getBoundingClientRect();
     const tray=document.querySelector('#mobileDesignSheet').getBoundingClientRect();
     return {row:{x:r.x,y:r.y,width:r.width,height:r.height},
       card:{top:card.top,bottom:card.bottom},
       next:next?{top:next.top,bottom:next.bottom}:null,
       stageBottom:stage.bottom,trayTop:tray.top,
       rowWithinCard:r.top>=card.top-2&&r.bottom<=card.bottom+2};
   });
   const regions=[];
   for(const [name,el] of pairs){
    await el.scrollIntoViewIfNeeded();
    const datum=await el.evaluate(node=>{
      const r=node.getBoundingClientRect(),
        owners=[.18,.5,.82].flatMap(y=>[.18,.5,.82].map(x=>{
          const top=document.elementFromPoint(r.left+r.width*x,r.top+r.height*y);
          return top===node||node.contains(top);
        }));
      return {x:r.x,y:r.y,width:r.width,height:r.height,owners,disabled:node.disabled};
    });
    regions.push({name,...datum});
    if(height>=840){
     assert.ok(datum.width>=44&&datum.height>=44&&datum.owners.every(Boolean)&&!datum.disabled,
      '44px Shapes source target blocked or undersized: '+JSON.stringify({width,theme,name,datum}));
    }
   }
   assert.ok(metrics.stageBottom<=metrics.trayTop+2&&metrics.rowWithinCard,
     'Tall Shapes source row obscured artwork or clipped within tool card: '+
       JSON.stringify({width,theme,metrics}));
   if(height>=840)assert.ok(!metrics.next||metrics.row.y+metrics.row.height<=metrics.next.top+1,
     'Expanded Shapes row collides with next field: '+JSON.stringify({width,theme,metrics}));
   const header=await label.boundingBox();
   assert.ok(header,'Original source Path range label missing');
   if(height>=840){
    const h=regions.find(x=>x.name==='lock'),d=regions.find(x=>x.name==='die');
    assert.ok(header.x+header.width<=d.x+2&&d.x+d.width<=h.x+1,
      'Expanded die/lock overlap original label or each other');
    for(const a of regions.filter(x=>x.name!=='slider'))
     for(const b of regions.filter(x=>x.name!=='slider'&&x.name!==a.name)){
      if(a.name>=b.name)continue;
      assert.ok(a.x+a.width<=b.x+1||b.x+b.width<=a.x+1||
        a.y+a.height<=b.y+1||b.y+b.height<=a.y+1,
        'Original separate source touch rectangles intersect: '+JSON.stringify({a,b}));
     }
   }
   const points=[.18,.5,.82].flatMap(fy=>[.18,.5,.82].map(fx=>({fx,fy})));
   for(const point of points){
    const before=recipe(),box=await plus.boundingBox();
    await plus.tap({position:{x:box.width*point.fx,y:box.height*point.fy}});
    assert.deepEqual(recipe(),{...before,stripeWidth:before.stripeWidth+1},
      'Plus corner touch changed wrong source setting');
    const m=await minus.boundingBox();
    await minus.tap({position:{x:m.width*point.fx,y:m.height*point.fy}});
    assert.deepEqual(recipe(),before,'Paired minus touch did not restore recipe');
   }
   await number.fill('72');await number.press('Tab');
   assert.deepEqual(recipe(),{...source,stripeWidth:72},
     'Native numeric edit changed unrelated source state');
   await number.fill('61');await number.press('Tab');
   assert.deepEqual(recipe(),source);
   await lock.tap();
   assert.ok(recipe().lockedSettings.includes('stripeWidth'));
   assert.ok(await plus.isDisabled()&&await minus.isDisabled()&&await number.isDisabled()&&await die.isDisabled());
   await lock.tap();assert.deepEqual(recipe(),source);
   const old=recipe();
   await die.tap();
   const changed=recipe();
   for(const key of Object.keys(old).filter(k=>k!=='stripeWidth'))
     assert.deepEqual(changed[key],old[key],'Reroll changed unrelated source field '+key);
   if(changed.stripeWidth!==old.stripeWidth){
    await page.locator('#undo').tap();
    assert.deepEqual(recipe(),old);
   }
   assert.deepEqual(errors,[]);
   const record={width,height,theme,regions,metrics,
     nativeStepEdgePairs:9,scopedReroll:true,lockedControlsDisabled:true,
     recipeRoundtrip:true,under44:regions.filter(x=>x.width<44||x.height<44).map(x=>x.name)};
   rows.push(record);
   await page.screenshot({path:join(out,width+'x'+height+'-'+theme+'.png'),animations:'disabled'});
   console.log('TALL_SHAPES_SOURCE_44_PASS',JSON.stringify(record));
  }catch(e){
   failures.push({width,height,theme,error:String(e),stack:e.stack,pageErrors:errors});
   await page.screenshot({path:join(out,'failure-'+width+'x'+height+'-'+theme+'.png'),animations:'disabled'}).catch(()=>{});
  }finally{await context.close()}
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({rows,failures,
  exclusions:['other settings','short phone comfort','physical Android','TalkBack','human approval']},null,2));
 assert.deepEqual(failures,[],'Source Shapes 44px touch trial failed');
}finally{await browser.close()}
