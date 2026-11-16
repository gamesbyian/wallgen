#!/usr/bin/env node
// Production-DOM test that checks actual visibility inside the clipped
// mobile tool card. A detached/overflow-clipped select is not a usable tool.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe,resolveScene} from '../src/model.js';

const url=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/inset-anchor-layout-browser');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const evidence=[];
const close=(a,b,msg)=>assert.ok(Math.abs(a-b)<1e-6,
  `${msg}: ${a} versus ${b}`);
try{
  for(const [width,height] of [[320,700],[412,892]]){
    const context=await browser.newContext({viewport:{width,height},
      isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    page.setDefaultTimeout(30000);
    const getRecipe=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
    const waitRecipe=(key,value)=>page.waitForFunction(({key,value})=>{
      try{
        const data=JSON.parse(decodeURIComponent(
          new URL(location.href).searchParams.get('r')));
        return data[key]===value;
      }catch{return false;}
    },{key,value});
    const initial=normalizeRecipe({seed:'inset-visual-'+width,structure:'paths',
      composition:'floating',geometry:'straight',orientation:'vertical',
      spread:33,stripeWidth:27,pathLength:30,insetAlignment:'independent'});
    await page.goto(url+'/?r='+encodeRecipe(initial),{waitUntil:'domcontentloaded'});
    await page.waitForSelector('.geometry-anchor-strip',{state:'attached'});
    await page.locator('#mobileEdit').tap();
    await page.locator('#tab-stripes').tap();
    await page.locator('.editor-tool-chooser [data-editor-tool="structure"]').tap();
    const card=page.locator('.editor-tool-card[data-editor-tool="structure"]');
    const strip=card.locator('.geometry-anchor-strip');
    assert.equal(await strip.isVisible(),true,'stripe anchor control is hidden');
    const rect=await strip.boundingBox(),host=await card.boundingBox();
    assert.ok(rect&&host,'anchor strip has no layout box');
    assert.ok(rect.y>=host.y-2&&rect.y+rect.height<=host.y+host.height+2,
      `Anchor clipped from ${width}x${height}: ${JSON.stringify({rect,host})}`);
    for(const name of ['spreadAnchor','widthAnchor']){
      const select=strip.locator('select[name="'+name+'"]');
      const b=await select.boundingBox();
      assert.ok(b&&b.width>=44&&b.height>=40,
        `${name} is not usable at ${width}px`);
      assert.ok(b.x>=host.x-1&&b.x+b.width<=host.x+host.width+1,
        name+' clipped horizontally');
    }
    const before=resolveScene(initial);
    const red=before.stripes.find(s=>s.name==='Red').center;
    await strip.locator('select[name="spreadAnchor"]').selectOption('red');
    await waitRecipe('spreadAnchor','red');
    close(resolveScene(getRecipe()).stripes.find(s=>s.name==='Red').center,
      red,'choosing a stationary stripe must not move its geometry');
    await page.locator('input[name="spread"]').evaluate(input=>{
      input.value='66';input.dispatchEvent(new Event('input',{bubbles:true}));
      input.dispatchEvent(new Event('change',{bubbles:true}));
    });
    await waitRecipe('spread',66);
    close(resolveScene(getRecipe()).stripes.find(s=>s.name==='Red').center,
      red,'changing spacing must preserve selected red position');
    const insetTool=page.locator('.editor-tool-chooser [data-editor-tool="inset"]');
    assert.equal(await insetTool.isVisible(),true,'Inset stripes tool is not discoverable');
    await insetTool.tap();
    const insetCard=page.locator('.editor-tool-card[data-editor-tool="inset"]');
    const alignment=insetCard.locator('select[name="insetAlignment"]');
    assert.equal(await alignment.isVisible(),true,'Inset modes not visible');
    const optionTexts=await alignment.locator('option').allTextContents();
    assert.ok(optionTexts.some(label=>label.includes('Dependent')),
      'Dependent inset mode is not named');
    await alignment.selectOption('aligned');
    await waitRecipe('insetAlignment','aligned');
    assert.equal(await insetCard.locator('.inset-alignment-description').isVisible(),true);
    await insetCard.locator('.inset-endpoints-link').tap();
    assert.equal(await page.locator('.editor-tool-card[data-editor-tool="ends"]').isVisible(),
      true,'Inset length navigation did not open the Path endpoints tool');
    assert.deepEqual(errors,[],'browser errors');
    await page.screenshot({path:join(out,width+'x'+height+'.png'),animations:'disabled'});
    evidence.push({width,height,anchorVisibleInsideCard:true,
      bothAnchorSelectionsUsable:true,insetToolVisible:true,errors});
    await context.close();
  }
  await writeFile(join(out,'report.json'),JSON.stringify(evidence,null,2));
  console.log('INSET_ANCHOR_LAYOUT_PASS '+JSON.stringify(evidence));
}finally{await browser.close();}
