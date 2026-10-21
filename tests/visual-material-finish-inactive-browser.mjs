#!/usr/bin/env node
/** Source pixel regression: inactive Finish rotations must remain on-card. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
const base=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/inactive-material-visual');await mkdir(out,{recursive:true});
const original=normalizeRecipe({seed:'material-inactive-card-optical',
 structure:'paths',construction:'ribbon',material:'linen',
 material2:'none',textureLayer2Enabled:false,textureStrength2:72,
 material3:'none',textureLayer3Enabled:false,textureStrength3:64});
const browser=await chromium.launch({headless:true});
const records=[],failures=[];
try{
 const profiles=[
  {width:320,height:640},{width:320,height:700},{width:320,height:892},
  {width:360,height:740},{width:412,height:892},{width:499,height:892},
  {width:500,height:892},{width:790,height:892},{width:791,height:892}
 ];
 for(const {width,height} of profiles){
  for(const theme of ['cream','dark']){
   const mobile=width<=790;
   const ctx=await browser.newContext({viewport:{width,height},
     isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
   const page=await ctx.newPage();page.setDefaultTimeout(20000);
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   try{
    await page.goto(base+'/?r='+encodeRecipe(original),{waitUntil:'domcontentloaded'});
    await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
    await page.reload({waitUntil:'domcontentloaded'});
    if(mobile)await page.locator('#mobileEdit').click();
    await page.locator('#tab-material').click();
    for(const id of ['finish2','finish3']){
     await page.locator('.editor-tool-chooser [data-editor-tool="'+id+'"]').click();
     const card=page.locator('.editor-tool-card[data-editor-tool="'+id+'"]');
     assert.equal(await card.isVisible(),true);
     const rects=await card.evaluate(el=>{
      const cr=el.getBoundingClientRect();
      const note=el.querySelector('.material-finish-help');
      const nr=note?.getBoundingClientRect();
      const rotation=el.querySelector('.texture-rotation-field');
      const rr=rotation?.getBoundingClientRect();
      const controls=[...rotation.querySelectorAll('.rotation-controls button,.rotation-controls input[type="number"]')]
       .map(e=>{const r=e.getBoundingClientRect();return{
        left:r.left,right:r.right,top:r.top,bottom:r.bottom,
        width:r.width,height:r.height,disabled:e.disabled};});
      return {card:{left:cr.left,right:cr.right,top:cr.top,bottom:cr.bottom},
       note:{text:note?.textContent,hidden:note?.hidden,top:nr?.top,bottom:nr?.bottom},
       rotation:{top:rr?.top,bottom:rr?.bottom},controls};
     });
     assert.match(rects.note.text,/inactive.*Choose a texture/i);
     assert.equal(rects.note.hidden,false);
     assert.ok(rects.note.bottom<=rects.card.bottom+1);
     assert.equal(rects.controls.length,6,
      'Original disabled source five-shortcut/numeric grammar changed');
     for(const r of rects.controls)
      assert.ok(r.top>=rects.card.top-1&&r.bottom<=rects.card.bottom+1&&
       r.left>=rects.card.left-1&&r.right<=rects.card.right+1&&
       r.width>9&&r.height>9,
       'Material Finish disabled rotation is visibly clipped: '+
        JSON.stringify({width,height,theme,id,rects}));
     assert.ok(rects.controls.every(x=>x.disabled),
      'Disabled Material layer rotation became operational');
     records.push({width,height,theme,id,rects});
     await card.screenshot({path:join(out,theme+'-'+width+'x'+height+'-'+id+'.png'),
      animations:'disabled'});
    }
    assert.deepEqual(decodeRecipe(new URL(page.url()).searchParams.get('r')),original);
    assert.deepEqual(errors,[]);
    console.log('INACTIVE_MATERIAL_FINISH_OPTICAL_PASS',JSON.stringify({width,height,theme}));
   }catch(e){
    failures.push({width,height,theme,error:String(e),stack:e.stack,errors});
    await page.screenshot({path:join(out,'failure-'+theme+'-'+width+'x'+height+'.png'),
     animations:'disabled'}).catch(()=>{});
   }finally{await ctx.close();}
  }
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({records,failures,
  exclusions:['native Android','visual human approval','other condition permutations']},null,2));
 assert.deepEqual(failures,[],'Inactive Finish controls cut by card');
 assert.equal(records.length,36);
}finally{await browser.close();}
