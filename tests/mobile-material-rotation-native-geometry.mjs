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
    for(const [index,el] of [...buttons,number].entries()){
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
      assert.ok(box.w>=20&&box.h>=24&&box.withinCard&&box.owners.every(Boolean)&&!box.disabled,
        'Native Material rotation child unavailable: '+
          JSON.stringify({width,theme,layer,index,box}));
    }
    for(let a=0;a<measured.length;a++)for(let b=a+1;b<measured.length;b++){
      const p=measured[a],q=measured[b];
      assert.ok(p.x+p.w<=q.x||q.x+q.w<=p.x||p.y+p.h<=q.y||q.y+q.h<=p.y,
        'Independent Material controls have intersecting rectangles: '+
          JSON.stringify({width,theme,layer,a,b,p,q}));
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
    layers.push({layer,key,controls:measured,actions:5,
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
