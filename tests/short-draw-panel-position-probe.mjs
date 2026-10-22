#!/usr/bin/env node
/* Source-only diagnostic for issue #422: no production geometry changed. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/short-draw-panel-probe');
await mkdir(out,{recursive:true});
const source=normalizeRecipe({seed:'short-panel-native-probe',structure:'paths',
 geometry:'drawn',customPath:[[.12,.14],[.25,.32],[.42,.49],[.56,.59],
 [.74,.77],[.88,.91]],drawnAnchors:[2,3],drawnCorners:[],
 viewZoom:1,viewPanX:0,viewPanY:0});
const variants=[
 ['original',null],
 ['left150','left:55px!important;right:auto!important;transform:none!important;width:150px!important'],
 ['left165','left:55px!important;right:auto!important;transform:none!important;width:165px!important'],
 ['left180','left:55px!important;right:auto!important;transform:none!important;width:180px!important'],
 ['right150','left:auto!important;right:55px!important;transform:none!important;width:150px!important'],
 ['right165','left:auto!important;right:55px!important;transform:none!important;width:165px!important'],
 ['right180','left:auto!important;right:55px!important;transform:none!important;width:180px!important']
];
const browser=await chromium.launch({headless:true}),records=[],failures=[];
const rect=r=>({x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height});
try{
 for(const theme of ['cream','dark']){
  const ctx=await browser.newContext({viewport:{width:500,height:700},
    isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  try{
   await page.goto(origin+'/?r='+encodeRecipe(source),{waitUntil:'domcontentloaded'});
   await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('#drawPathToggle').tap();
   await page.locator('#drawEditPoints').tap();
   assert.equal(await page.locator('#drawPathPanel').getAttribute('data-phase'),'anchors');
   const preview=await page.locator('#preview').boundingBox();
   const anchor={x:preview.x+preview.width*source.customPath[2][0],
     y:preview.y+preview.height*source.customPath[2][1]};
   const style=await page.addStyleTag({content:''});
   for(const [id,css] of variants){
    await style.evaluate((el,css)=>el.textContent=css?
      'body.mobile-studio.path-drawing .draw-path-panel{'+css+'}':'',css);
    await page.waitForTimeout(80);
    const data=await page.evaluate(({anchor})=>{
      const panel=document.querySelector('#drawPathPanel'),p=panel.getBoundingClientRect();
      const stage=document.querySelector('.studio-stage').getBoundingClientRect();
      const preview=document.querySelector('#preview').getBoundingClientRect();
      const measures=sel=>{
        const el=document.querySelector(sel);if(!el)return null;
        const r=el.getBoundingClientRect();
        return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};
      };
      const overlap=(a,b)=>a&&b?Math.max(0,Math.min(a.right,b.right)-Math.max(a.x,b.x))*
        Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)):0;
      const panelRect=measures('#drawPathPanel');
      const controls=['#drawApply','#drawCancel','#drawEditPoints','#drawCornerPoint']
        .map(sel=>({name:sel,...measures(sel)}));
      const owner=document.elementFromPoint(anchor.x,anchor.y);
      const left=measures('.mobile-preview-rail-left');
      const right=measures('.mobile-preview-rail-right');
      return {panel:panelRect,stage:measures('.studio-stage'),preview:measures('#preview'),
        anchorOwner:owner?.id||owner?.className||'none',
        anchorAccessible:owner?.id==='drawOverlay',
        panelWithinStage:p.top>=stage.top-2&&p.bottom<=stage.bottom+2,
        panelOverlapPreview:overlap(panelRect,measures('#preview')),
        overlapLeftRail:overlap(panelRect,left),
        overlapRightRail:overlap(panelRect,right),
        controls,
        maxScroll:panel.scrollHeight-panel.clientHeight};
    },{anchor});
    const row={theme,variant:id,anchor,...data};
    records.push(row);
    await page.screenshot({path:join(out,theme+'-'+id+'.png'),animations:'disabled'});
    console.log('SHORT_DRAW_PANEL_POSITION',JSON.stringify(row));
   }
   assert.deepEqual(decodeRecipe(new URL(page.url()).searchParams.get('r')),source,
     'Diagnostic CSS choices changed live source recipe');
   assert.deepEqual(errors,[]);
  }catch(e){failures.push({theme,error:String(e),stack:e.stack,errors});
    await page.screenshot({path:join(out,'failure-'+theme+'.png'),animations:'disabled'}).catch(()=>{});
  }finally{await ctx.close();}
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({records,failures,
  constraints:['diagnostic only','no production CSS change','native CSS candidates only',
    'physical Pixel and TalkBack not tested']},null,2));
 assert.deepEqual(failures,[]);
 const originals=records.filter(x=>x.variant==='original');
 assert.equal(originals.length,2);
 assert.ok(originals.every(x=>!x.anchorAccessible),
   'Source occlusion baseline changed: re-evaluate issue #422 rather than guessing');
}finally{await browser.close()}
