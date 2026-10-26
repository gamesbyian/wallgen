#!/usr/bin/env node
// Opt-in actual Chromium source-pixels → image-import → accessible refusal.
// This is not physical Pixel, native Android IME, TalkBack or a human session.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const output=resolve('artifacts/agent3-664-sparse-refusal');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const report=[];
try{
 for(const [width,height] of [[320,700],[412,892]]){
  const ctx=await browser.newContext({viewport:{width,height},isMobile:true,
    hasTouch:true,reducedMotion:'reduce'});
  const page=await ctx.newPage();
  const errors=[],remote=[];
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('request',req=>{if(req.url().startsWith('https://api.github.com/'))
    remote.push(req.url());});
  try{
   await page.goto(origin,{waitUntil:'domcontentloaded'});
   for(const [name,slots] of [
    ['isolated-blue',[4]],['red-blue-gap',[0,4]]]){
    // Independently authored metadata-free Canvas PNGs. Do not reuse
    // a canonical recipe, its source metadata or renderer to generate art.
    const dataUrl=await page.evaluate(indices=>{
      const c=document.createElement('canvas');c.width=480;c.height=1040;
      const g=c.getContext('2d');
      g.fillStyle='#000000';g.fillRect(0,0,c.width,c.height);
      const colours=['#ff0000','#ff8800','#ffff00','#00ff00',
        '#0000ff','#4b0082','#8f00ff'];
      indices.forEach((slot,i)=>{
       const x=indices.length===1?240:135+i*210,y=indices.length===1?520:350+i*290;
       g.fillStyle=colours[slot];g.beginPath();
       for(let j=0;j<5;j++){
        const a=-Math.PI/2+Math.PI*2*j/5;
        const px=x+75*Math.cos(a),py=y+75*Math.sin(a);
        j===0?g.moveTo(px,py):g.lineTo(px,py);
       }
       g.closePath();g.fill();
      });
      return c.toDataURL('image/png');
    },slots);
    const png=Buffer.from(dataUrl.slice(dataUrl.indexOf(',')+1),'base64');
    const originalHash=createHash('sha256').update(png).digest('hex');
    await page.locator('#imagePathFile').setInputFiles({
      name:name+'.png',mimeType:'image/png',buffer:png
    });
    const status=page.locator('#imageRecipeUnavailable');
    await status.waitFor({state:'visible',timeout:45000});
    const text=await status.textContent();
    assert.match(text,/No faithful editable recipe/);
    assert.match(text,/skip earlier ROYGBIV slots/);
    assert.match(text,/path or silhouette/);
    assert.match(text,/source image is unchanged/);
    assert.equal(await status.getAttribute('role'),'status');
    assert.equal(await status.getAttribute('aria-live'),'polite');
    assert.equal(await page.locator('#imageRecipeWorkspace').isVisible(),false);
    assert.equal(await page.locator('#imageRecipeApply').isEnabled(),false);
    assert.equal(await page.locator('#imageRecipeCandidate option').count(),0);
    const size=await status.boundingBox();
    assert.ok(size&&size.width>0&&size.height>0);
    await page.screenshot({path:join(output,width+'x'+height+'-'+name+'.png')});
    assert.equal(createHash('sha256').update(png).digest('hex'),originalHash);
    report.push({viewport:[width,height],case:name,hueSlots:slots,
      role:'status',live:'polite',visibleText:text,
      phantomCandidate:false,sourceSHA256:originalHash});
   }
   // Real second source and a later import must clear the old refusal.
   const red=await page.evaluate(()=>{
    const c=document.createElement('canvas');c.width=480;c.height=1040;
    const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,480,1040);
    g.fillStyle='#ff0000';g.fillRect(160,400,160,160);
    return c.toDataURL('image/png');
   });
   await page.locator('#imagePathFile').setInputFiles({name:'first-red.png',
     mimeType:'image/png',buffer:Buffer.from(red.split(',')[1],'base64')});
   await page.waitForFunction(()=>document.getElementById('imagePathDialog')?.open&&
     document.getElementById('imageRecipeWorkspace')?.hidden===false,undefined,
     {timeout:60000});
   assert.equal(await page.locator('#imageRecipeUnavailable').isVisible(),false,
     'previous missing-colour refusal leaked into representable source');
   assert.ok(await page.locator('#imageRecipeCandidate option').count()>0);
   await page.locator('#imagePathCancel').click();
   await page.locator('#imagePathDialog').waitFor({state:'hidden'});
   assert.equal(await page.locator('#imageRecipeUnavailable').textContent(),'');
   assert.deepEqual(errors,[],'browser app exceptions');
   assert.deepEqual(remote,[],'unconsented GitHub remote requests');
  }finally{await ctx.close();}
 }
 await writeFile(join(output,'report.json'),JSON.stringify({
  schema:'roygbiv-agent3-664-sparse-refusal/v1',evidence:'real-headless-Chromium',
  nativePixel:'NOT TESTED',androidTalkBack:'NOT TESTED',cases:report
 },null,2)+'\n');
 console.log('AGENT3_SPARSE_REFUSAL_PASS '+JSON.stringify({cases:report.length,
   viewports:[[320,700],[412,892]],sourceUnchanged:true,remoteRequests:0}));
}finally{await browser.close();}
