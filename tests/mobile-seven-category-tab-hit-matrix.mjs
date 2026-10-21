#!/usr/bin/env node
/** Seven actual category tabs: native hit census across portrait breakpoints. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {EDITOR_CATEGORIES} from '../src/editor-schema.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/mobile-seven-category-tabs');
await mkdir(out,{recursive:true});
const baseline=normalizeRecipe({seed:'category-hit-geometry',structure:'paths',
  geometry:'zigzag',shapeFrequency:61,shapeDepth:79,lockedSettings:[]});
const browser=await chromium.launch({headless:true}),rows=[];
try{
 for(const width of [320,360,412,499,500,790]){
  for(const theme of ['cream','dark']){
   const context=await browser.newContext({viewport:{width,height:892},
     isMobile:true,hasTouch:true,reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[];
   page.setDefaultTimeout(16000);
   page.on('pageerror',e=>errors.push(String(e)));
   try{
    await page.goto(origin+'/?r='+encodeRecipe(baseline),{waitUntil:'domcontentloaded'});
    await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#mobileEdit').tap();
    const tabs=page.locator('.sidebar .settings-tabs .settings-tab:not([hidden])');
    assert.equal(await tabs.count(),EDITOR_CATEGORIES.length,
      'Mobile category source tab inventory is not seven');
    const rail=page.locator('.sidebar .settings-tabs');
    const settings=await rail.boundingBox();
    // A real horizontal finger gesture, not scrollIntoView(), must make
    // previously clipped later categories reachable at narrow widths.
    await rail.evaluate(el=>{el.scrollLeft=0});
    const track=await rail.evaluate(el=>({
      client:el.clientWidth,content:el.scrollWidth,overflow:getComputedStyle(el).overflowX
    }));
    if(width<=499)assert.equal(track.overflow,'auto',
      'Narrow category tabs have no native swipeable source rail');
    let fingerScroll=0;
    if(track.content>track.client+2){
      const cdp=await context.newCDPSession(page);
      const x=settings.x+settings.width-20,y=settings.y+settings.height/2;
      await cdp.send('Input.dispatchTouchEvent',{
        type:'touchStart',touchPoints:[{x,y,id:1}]
      });
      for(let i=1;i<=9;i++){
        await cdp.send('Input.dispatchTouchEvent',{
          type:'touchMove',touchPoints:[{x:x-19*i,y,id:1}]
        });
        await page.waitForTimeout(16);
      }
      await cdp.send('Input.dispatchTouchEvent',{
        type:'touchEnd',touchPoints:[]
      });
      await page.waitForTimeout(140);
      fingerScroll=await rail.evaluate(el=>el.scrollLeft);
      assert.ok(fingerScroll>=5,'Native category strip does not respond to finger swipe: '+
        JSON.stringify({width,theme,track,fingerScroll}));
    }
    await rail.evaluate(el=>{el.scrollLeft=0});
    const items=[];
    for(let i=0;i<EDITOR_CATEGORIES.length;i++){
      const category=EDITOR_CATEGORIES[i];
      const tab=page.locator('#tab-'+category.id);
      assert.equal(await tab.count(),1,'Duplicate source tab '+category.id);
      // Scroll each real tab within the *same* user-swipeable source rail
      // before measuring its full touch region. This never creates clones.
      // The editor tray animates when changing categories. Wait for its
      // resting bounds; a moving DOMRect falsely appears clipped.
      await page.waitForTimeout(220);
      await tab.scrollIntoViewIfNeeded();
      await page.waitForTimeout(40);
      const datum=await tab.evaluate(el=>{
        const r=el.getBoundingClientRect();
        const rail=el.closest('.settings-tabs').getBoundingClientRect();
        const siblings=[...el.parentElement.children].filter(node=>node!==el&&
          !node.hidden).map(node=>node.getBoundingClientRect());
        const hits=[.18,.5,.82].flatMap(fy=>[.18,.5,.82].map(fx=>{
          const owner=document.elementFromPoint(r.left+r.width*fx,r.top+r.height*fy);
          return owner===el||el.contains(owner);
        }));
        const overlaps=siblings.filter(b=>r.left<b.right-1&&r.right>b.left+1&&
          r.top<b.bottom-1&&r.bottom>b.top+1).length;
        return {name:el.textContent.trim(),width:r.width,height:r.height,
          x:r.x,y:r.y,nineOwn:hits.every(Boolean),overlaps,
          contained:r.left>=rail.left-1&&r.right<=rail.right+1,
          aria:el.getAttribute('aria-label')||el.textContent.trim()};
      });
      assert.ok(datum.width>=44&&datum.height>=44&&datum.nineOwn&&
        !datum.overlaps&&datum.contained,
        'Source category tab is blocked/out of bounds: '+
        JSON.stringify({width,theme,category:category.id,datum}));
      await tab.tap();
      assert.equal(await tab.getAttribute('aria-selected'),'true',
        'Touch did not select original category '+category.id);
      assert.deepEqual(decodeRecipe(new URL(page.url()).searchParams.get('r')),
        baseline,'Category tab touch mutated normalized recipe');
      await page.waitForTimeout(220);
      items.push({id:category.id,...datum,under44:datum.width<44||datum.height<44});
    }
    const stage=await page.locator('.studio-stage').boundingBox();
    const tray=await page.locator('#mobileDesignSheet').boundingBox();
    assert.ok(stage.y+stage.height<=tray.y+2,
      'Taller category row obscured the wallpaper stage: '+JSON.stringify({width,theme,stage,tray}));
    assert.ok(items.every(item=>!item.under44),
      'Each source category must own a 44px by 44px region');
    assert.deepEqual(errors,[]);
    const record={width,theme,tabCount:items.length,rail:settings,
      scroll:track,fingerScroll,
      under44:items.filter(x=>x.under44).length,items,
      sevenNativeCategoryTouches:true,recipeUnchanged:true};
    rows.push(record);
    await page.screenshot({path:join(out,width+'-'+theme+'.png'),animations:'disabled'});
    console.log('CATEGORY_TAB_TOUCH_MATRIX_PASS',JSON.stringify(record));
   }finally{await context.close()}
  }
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({rows,
   limitation:'True native touch reachability is not 44px ergonomic approval',
   excluded:['Android physical fingertip accuracy','TalkBack',
     'text zoom and subjective optics']},null,2));
}finally{await browser.close()}
