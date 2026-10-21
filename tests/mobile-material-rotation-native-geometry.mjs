#!/usr/bin/env node
/** Mobile Material rotation: all six source children, pointer ownership and taps. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,normalizeRotation,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/mobile-material-rotation-native-geometry');
await mkdir(out,{recursive:true});
const source=normalizeRecipe({seed:'native-material-rotation-touch',structure:'paths',
  geometry:'zigzag',material:'linen',textureStrength:65,textureRotation:17.5,
  textureLayer2Enabled:true,material2:'foil',textureStrength2:60,textureRotation2:72.5,
  textureLayer3Enabled:true,material3:'grain',textureStrength3:55,textureRotation3:307.5,
  positionX:3,positionY:-2,viewZoom:.8,viewPanX:10,viewPanY:-5});
const browser=await chromium.launch({headless:true}),records=[],failures=[];
try{
 for(const width of [320,412,499])for(const theme of ['cream','dark']){
  const context=await browser.newContext({viewport:{width,height:892},
    isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(String(e)));
  try{
   await page.goto(origin+'/?r='+encodeRecipe(source),{waitUntil:'domcontentloaded'});
   await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
   await page.reload({waitUntil:'domcontentloaded'});
   const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
   assert.deepEqual(current(),source);
   await page.locator('#mobileEdit').tap();
   await page.locator('#tab-material').tap();
   const stage=await page.locator('.studio-stage').boundingBox();
   const tray=await page.locator('#mobileDesignSheet').boundingBox();
   assert.ok(stage.y+stage.height<=tray.y+2,'Material controls overlapped artwork');
   const layers=[];
   for(let layer=1;layer<=3;layer++){
    const key='textureRotation'+(layer===1?'':layer);
    await page.locator('.editor-tool-chooser [data-editor-tool="finish'+layer+'"]').tap();
    const card=page.locator('.editor-tool-card[data-editor-tool="finish'+layer+'"]');
    assert.equal(await card.isVisible(),true);
    const selectors=['[data-rotate-delta="-90"]','[data-rotate-delta="-1"]',
      '[data-rotate-delta="1"]','[data-rotate-delta="90"]','[data-rotate-set="0"]'];
    const buttons=selectors.map(s=>card.locator('[data-rotate-target="'+key+'"]'+s));
    const number=card.locator('input[name="'+key+'"]');
    assert.equal(await number.count(),1);
    const measured=[];
    const rotationRail=card.locator('.texture-rotation-field .rotation-controls');
    const track=await rotationRail.evaluate(el=>({client:el.clientWidth,
      scroll:el.scrollWidth,overflow:getComputedStyle(el).overflowX}));
    assert.equal(track.overflow,'auto','Original rotation rail must be finger scrollable');
    let fingerScroll=0;
    if(track.scroll>track.client+2){
      const cdp=await context.newCDPSession(page);
      const frame=await rotationRail.boundingBox(),x=frame.x+frame.width-22,
        y=frame.y+frame.height/2;
      await cdp.send('Input.dispatchTouchEvent',{
        type:'touchStart',touchPoints:[{x,y,id:1}]});
      for(let i=1;i<=9;i++){
        await cdp.send('Input.dispatchTouchEvent',{
          type:'touchMove',touchPoints:[{x:x-13*i,y,id:1}]});
        await page.waitForTimeout(16);
      }
      await cdp.send('Input.dispatchTouchEvent',{
        type:'touchEnd',touchPoints:[]});
      await page.waitForTimeout(140);
      fingerScroll=await rotationRail.evaluate(el=>el.scrollLeft);
      assert.ok(fingerScroll>1,'Material source rotation strip rejected finger swipe');
    }
    await rotationRail.evaluate(el=>{el.scrollLeft=0});
    const measured=[];
    for(const [index,el] of [...buttons,number].entries()){
      await el.scrollIntoViewIfNeeded();
      const box=await el.evaluate(node=>{
        const r=node.getBoundingClientRect(),card=node.closest('.editor-tool-card')
          .getBoundingClientRect();
        const owners=[.18,.5,.82].flatMap(y=>[.18,.5,.82].map(x=>{
          const top=document.elementFromPoint(r.left+r.width*x,r.top+r.height*y);
          return top===node||node.contains(top);
        }));
        return {x:r.x,y:r.y,w:r.width,h:r.height,
          withinCard:r.left>=card.left-1&&r.right<=card.right+1&&
            r.top>=card.top-1&&r.bottom<=card.bottom+1,
          owners,disabled:node.disabled};
      });
      measured.push({kind:index<5?'shortcut':'number',index,...box});
      assert.ok(box.w>=44&&box.h>=44&&box.withinCard&&box.owners.every(Boolean)&&!box.disabled,
        'Native Material rotation child unavailable: '+
          JSON.stringify({width,theme,layer,index,box}));
    }
    // Individual measurements occur after horizontal scrolling and thus
    // belong to different scroll positions; comparing their recorded global
    // x positions would manufacture false sibling overlaps. Query the live
    // rail's unscrolled *layout* positions instead, in one DOM snapshot.
    const siblingsOverlap=await rotationRail.evaluate(el=>{
      const positions=[...el.children].filter(node=>!node.hidden).map(node=>({
        left:node.offsetLeft,width:node.offsetWidth,top:node.offsetTop,
        height:node.offsetHeight}));
      let overlap=false;
      for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++){
        const a=positions[i],b=positions[j];
        if(a.left<b.left+b.width-1&&b.left<a.left+a.width-1&&
          a.top<b.top+b.height-1&&b.top<a.top+a.height-1)overlap=true;
      }
      return overlap;
    });
    assert.equal(siblingsOverlap,false,'Material 44px source cells overlap in layout');
    for(const control of [card.locator('.texture-rotation-field>.editor-setting-die'),
      card.locator('.texture-rotation-field>.setting-lock')]){
      const r=await control.boundingBox();
      assert.ok(r&&r.width>=44&&r.height>=44,
        'Material header die/lock remain below44');
    }
    const actions=[-90,-1,1,90,null];
    for(let i=0;i<5;i++){
      const before=current();
      await buttons[i].tap();
      const expected=actions[i]===null?0:normalizeRotation(before[key]+actions[i]);
      assert.deepEqual(current(),{...before,[key]:expected},
        'Native source Material action changed unrelated field '+key);
      assert.equal(Number(await number.inputValue()),expected);
    }
    const beforeInput=current();
    await number.tap();
    await number.fill('137.5');
    await number.press('Tab');
    assert.deepEqual(current(),{...beforeInput,[key]:137.5},
      'Native Material numeric input changed unrelated source field '+key);
    const plus=buttons[2],minus=buttons[1];
    const positions=[.18,.5,.82].flatMap(fy=>[.18,.5,.82].map(fx=>({fx,fy})));
    for(const point of positions){
      const before=current(),r=await plus.boundingBox();
      await plus.tap({position:{x:r.width*point.fx,y:r.height*point.fy}});
      assert.deepEqual(current(),{...before,[key]:normalizeRotation(before[key]+1)},
        'Near-edge real Material +1 touch missed intended field');
      await minus.tap();
      assert.deepEqual(current(),before,'Paired Material ±1 did not exactly restore recipe');
    }
    layers.push({layer,key,controls:measured,track,fingerScroll,actions:5,
      nativePlusEdgePairs:positions.length,under44:measured.filter(x=>x.w<44||x.h<44).length,
      sourceUnchangedFields:true});
    await page.screenshot({path:join(out,width+'-'+theme+'-finish'+layer+'.png'),
      animations:'disabled'});
   }
   assert.deepEqual(errors,[]);
   const record={width,theme,layers,stage:{height:stage.height},independentSixChildren:true};
   records.push(record);
   console.log('MATERIAL_NATIVE_GEOMETRY_PASS',JSON.stringify(record));
  }catch(error){
   failures.push({width,theme,error:String(error),stack:error.stack,pageErrors:errors});
   await page.screenshot({path:join(out,'failure-'+width+'-'+theme+'.png'),
     animations:'disabled'}).catch(()=>{});
  }finally{await context.close();}
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({records,failures,
   boundary:'Browser-source actual touch reachability, not ergonomic 44px comfort',
   remaining:['production 44px Material row design','physical Pixel thumb accuracy',
      'TalkBack', 'human visual approval']},null,2));
 assert.deepEqual(failures,[],'Source Material rotation native touch counterexamples');
}finally{await browser.close()}
