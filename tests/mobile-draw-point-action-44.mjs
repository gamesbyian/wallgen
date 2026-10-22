#!/usr/bin/env node
/** Original Draw tool panel: 44px finger regions without a new overlay rail. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/tall-draw-point-action-44');
await mkdir(out,{recursive:true});
const source=normalizeRecipe({seed:'draw-point-action-tall-44',
  structure:'paths',geometry:'drawn',customPath:[[.12,.14],[.25,.32],
  [.42,.49],[.56,.59],[.74,.77],[.88,.91]],drawnAnchors:[2,3],
  drawnCorners:[],viewZoom:1,viewPanX:0,viewPanY:0});
const ids=['drawSmooth','drawGeometric','drawAgain','drawApply','drawCancel',
  'drawEditPoints','drawAddPoint','drawDeletePoint','drawCornerPoint',
  'drawResmoothPoints','drawUndoPoint'];
const browser=await chromium.launch({headless:true}),rows=[],failures=[];
try{
 for(const [width,height] of [[320,892],[412,892],[499,892],[500,892],[600,892],[790,892],[320,700],[500,700]])
  for(const theme of ['cream','dark']){
   const context=await browser.newContext({viewport:{width,height},
     isMobile:true,hasTouch:true,reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.setDefaultTimeout(18000);
   const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
   try{
    await page.goto(origin+'/?r='+encodeRecipe(source),{waitUntil:'domcontentloaded'});
    await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
    await page.reload({waitUntil:'domcontentloaded'});
    assert.deepEqual(current(),source);
    await page.locator('#drawPathToggle').tap();
    await page.locator('#drawEditPoints').tap();
    const panel=page.locator('#drawPathPanel'),stage=page.locator('.studio-stage');
    assert.equal(await panel.getAttribute('data-phase'),'anchors');
    const stageRect=await stage.boundingBox(),rect=await panel.boundingBox();
    assert.ok(rect.y>=stageRect.y-2&&rect.y+rect.height<=stageRect.y+stageRect.height+2,
      'Draw point panel escaped its existing stage: '+JSON.stringify({width,height,rect,stageRect}));
    assert.ok(rect.height<=370+2,'Point panel expanded beyond original viewport budget');
    const regions=[];
    for(const id of ids){
      const el=page.locator('#'+id);
      assert.ok(await el.isVisible(),'Original Draw action inaccessible: '+id);
      await el.scrollIntoViewIfNeeded();
      const m=await el.evaluate(node=>{
        const r=node.getBoundingClientRect(),panel=node.closest('.draw-path-panel')
         .getBoundingClientRect();
        const owners=[.18,.5,.82].flatMap(y=>[.18,.5,.82].map(x=>{
          const hit=document.elementFromPoint(r.left+r.width*x,r.top+r.height*y);
          return hit===node||node.contains(hit);
        }));
        return {width:r.width,height:r.height,x:r.x,y:r.y,
          nineOwner:owners.every(Boolean),
          insidePanel:r.left>=panel.left-2&&r.right<=panel.right+2&&
            r.top>=panel.top-2&&r.bottom<=panel.bottom+2,
          disabled:node.disabled};
      });
      if(height>=840)
        assert.ok(m.height>=44&&m.nineOwner&&m.insidePanel,
          'Original Draw button lacks 44px real hit region: '+JSON.stringify({width,theme,id,m}));
      regions.push({id,...m});
    }
    const anchorRect=await page.locator('#preview').boundingBox(),
      x=anchorRect.x+anchorRect.width*source.customPath[2][0],
      y=anchorRect.y+anchorRect.height*source.customPath[2][1];
    assert.equal(await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.id,{x,y}),
      'drawOverlay','Expanded Draw panel blocked source anchor midpoint');
    await page.touchscreen.tap(x,y);
    assert.ok(await page.locator('#drawCornerPoint').isEnabled(),
      'Finger tap failed selected point behind enlarged actions');
    await page.locator('#drawCornerPoint').tap();
    assert.equal(await page.locator('#drawCornerPoint').textContent(),'Make smooth');
    await page.locator('#drawUndoPoint').tap();
    assert.equal(await page.locator('#drawCornerPoint').textContent(),'Make corner');
    assert.deepEqual(current(),source,'Unapplied native point action changed recipe');
    await page.locator('#drawCancel').tap();
    assert.deepEqual(current(),source,'Enlarged Cancel mutated source recipe');
    assert.deepEqual(errors,[]);
    const row={width,height,theme,regions,
      sourceAnchorTouch:true,pointLocalUndo:true,fullRecipeStable:true,
      panel:{height:rect.height,width:rect.width}};
    rows.push(row);
    await page.screenshot({path:join(out,width+'x'+height+'-'+theme+'.png'),animations:'disabled'});
    console.log('DRAW_POINT_44_PASS',JSON.stringify(row));
   }catch(error){
    failures.push({width,height,theme,error:String(error),stack:error.stack,pageErrors:errors});
    await page.screenshot({path:join(out,'failure-'+width+'-'+theme+'.png'),
      animations:'disabled'}).catch(()=>{});
   }finally{await context.close();}
  }
 await writeFile(join(out,'evidence.json'),JSON.stringify({rows,failures,
   limitations:['physical Pixel fingertip accuracy','TalkBack','all dense/crowded handle paths',
    'short viewport compact controls','human aesthetic approval']},null,2));
 assert.deepEqual(failures,[],'Original Draw point buttons source touch acceptance failed');
}finally{await browser.close()}
