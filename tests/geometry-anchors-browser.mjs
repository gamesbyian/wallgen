#!/usr/bin/env node
// Opt-in production-DOM anchor acceptance. Source controls are exercised in
// real Chromium at two Android-sized CSS viewports, not a mock form.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe,resolveScene} from '../src/model.js';
import {bandAnchorCoordinate,groupAnchorCoordinate} from '../src/geometry-anchors.js';
import {balanceStripeEnds} from '../src/renderer.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/geometry-anchors-browser');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
const close=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-6,`${message}: ${a} vs ${b}`);
const sourceEndpoints=recipe=>{
  const scene=resolveScene(recipe);
  return scene.stripes.map(original=>{
    const stripe={...original};
    balanceStripeEnds(scene,stripe,false);
    return stripe.hidden?null:{start:stripe.segmentStart,end:stripe.segmentEnd};
  });
};
try{
  for(const [width,height] of [[320,700],[412,892]]){
    const context=await browser.newContext({
      viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.setDefaultTimeout(30000);
    page.on('pageerror',error=>errors.push(String(error)));
    const current=()=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
    const waitValue=(key,value)=>page.waitForFunction(({key,value})=>{
      const encoded=new URL(location.href).searchParams.get('r');
      if(!encoded)return false;
      try{return JSON.parse(decodeURIComponent(encoded))[key]===value;}
      catch{return false;}
    },{key,value});
    const adjust=async(name,value)=>{
      await page.locator('input[name="'+name+'"]').evaluate((input,value)=>{
        input.value=String(value);
        input.dispatchEvent(new Event('input',{bubbles:true}));
        input.dispatchEvent(new Event('change',{bubbles:true}));
      },value);
      await waitValue(name,value);
    };
    const seed=normalizeRecipe({seed:'browser-anchor-'+width,
      structure:'paths',composition:'repeat',repeatCount:4,
      geometry:'straight',orientation:'vertical',chaos:78,
      spread:38,repeatSpacing:35,stripeWidth:42,pathLength:68});
    await page.goto(origin+'/?r='+encodeRecipe(seed),{waitUntil:'domcontentloaded'});
    await page.waitForSelector('.geometry-anchor-setting select[name="spreadAnchor"]',{state:'attached'});
    await page.locator('#mobileEdit').tap();
    await page.locator('#tab-stripes').tap();
    await page.locator('.editor-tool-chooser [data-category="stripes"][data-editor-tool="structure"]').tap();
    const spreadSelect=page.locator('select[name="spreadAnchor"]');
    assert.equal(await spreadSelect.isVisible(),true,'spread anchor not visible');
    const box=await spreadSelect.boundingBox();
    assert.ok(box.width>=44&&box.height>=44,'spread anchor target below 44px');
    let oldScene=resolveScene(current());
    await spreadSelect.selectOption('red');
    await waitValue('spreadAnchor','red');
    const chosen=resolveScene(current());
    chosen.stripes.forEach((stripe,i)=>close(stripe.center,oldScene.stripes[i].center,'select red did not preserve layout'));
    const red=chosen.stripes.find(s=>s.name==='Red').center;
    await adjust('spread',78);
    close(resolveScene(current()).stripes.find(s=>s.name==='Red').center,
      red,'Red world-space position moved after spread');

    const widthSelect=page.locator('select[name="widthAnchor"]');
    assert.equal(await widthSelect.isVisible(),true);
    oldScene=resolveScene(current());
    await widthSelect.selectOption('violet-edge');
    await waitValue('widthAnchor','violet-edge');
    const edge=bandAnchorCoordinate(oldScene.stripes,'violet-edge');
    close(bandAnchorCoordinate(resolveScene(current()).stripes,'violet-edge'),
      edge,'width anchor selection jumped');
    await adjust('stripeWidth',72);
    close(bandAnchorCoordinate(resolveScene(current()).stripes,'violet-edge'),
      edge,'Violet physical boundary moved');

    await page.locator('#tab-layout').tap();
    await page.locator('.editor-tool-chooser [data-category="layout"][data-editor-tool="arrange"]').tap();
    const repeatSelect=page.locator('select[name="repeatAnchor"]');
    assert.equal(await repeatSelect.isVisible(),true);
    const oldGroups=resolveScene(current()).bundleOffsets;
    await repeatSelect.selectOption('first');
    await waitValue('repeatAnchor','first');
    close(resolveScene(current()).bundleOffsets[0],oldGroups[0],'group anchor selection jumped');
    await adjust('repeatSpacing',84);
    close(resolveScene(current()).bundleOffsets[0],oldGroups[0],'first group moved');

    // A dormant repeat anchor cannot displace a Single/Floating composition.
    await page.locator('select[name="composition"]').selectOption('floating');
    await waitValue('composition','floating');
    assert.deepEqual(resolveScene(current()).bundleOffsets,[0]);
    await page.locator('#tab-path').tap();
    await page.locator('.editor-tool-chooser [data-category="path"][data-editor-tool="ends"]').tap();
    const lengthSelect=page.locator('select[name="pathLengthAnchor"]');
    assert.equal(await lengthSelect.isVisible(),true);
    const earlier=sourceEndpoints(current());
    await lengthSelect.selectOption('start');
    await waitValue('pathLengthAnchor','start');
    const points=current().pathLengthAnchorPoints;
    assert.equal(points.length,7);
    assert.ok(points.some(Number.isFinite),'no visible floating paths to anchor');
    const choice=sourceEndpoints(current());
    earlier.forEach((value,i)=>{if(value){
      close(choice[i].start,value.start,'path endpoint shifted on selection');
      close(choice[i].end,value.end,'path endpoint shifted on selection');
    }});
    await adjust('pathLength',25);
    const shortened=sourceEndpoints(current());
    shortened.forEach((value,i)=>{
      if(value&&Number.isFinite(points[i]))
        close(value.start,points[i],'floating start moved during shortening');
    });
    assert.deepEqual(errors,[],'browser errors');
    await page.screenshot({path:join(out,`${width}x${height}.png`),animations:'disabled'});
    results.push({width,height,selectionNoJump:true,redAnchor:true,
      violetWidthEdge:true,firstGroup:true,floatingStart:true,errors});
    await context.close();
  }
  await writeFile(join(out,'result.json'),JSON.stringify(results,null,2));
  console.log('GEOMETRY_ANCHORS_BROWSER_PASS '+JSON.stringify(results));
}finally{await browser.close();}
