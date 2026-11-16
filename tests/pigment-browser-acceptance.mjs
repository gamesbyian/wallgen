#!/usr/bin/env node
// Run against the real renderer in Chromium. Requires a local static server on
// ROYGBIV_URL (default :4173) and Playwright's Chromium installation.
// Proves source RGB changes via alpha pigment, including independent regions.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:900,height:800}});
  await page.goto(process.env.ROYGBIV_URL||'http://127.0.0.1:4173',
    {waitUntil:'domcontentloaded'});
  const cases=await page.evaluate(async()=>{
    const {drawWallpaper}=await import('/src/renderer.js');
    const {normalizeRecipe}=await import('/src/model.js');
    function paint(overrides){
      const recipe=normalizeRecipe({seed:'pigment-chromium-acceptance',
        geometry:'straight',structure:'paths',orientation:'vertical',
        construction:'ribbon',motif:'solid',outline:'none',glow:0,
        stripeWidth:92,spread:65,background:'white',material:'none',
        brushRoughness:0,...overrides});
      const canvas=document.createElement('canvas');
      canvas.width=360;canvas.height=780;
      const started=performance.now();
      drawWallpaper(canvas,recipe);
      const ms=performance.now()-started;
      return {pixels:canvas.getContext('2d',{willReadFrequently:true})
        .getImageData(0,0,canvas.width,canvas.height).data,
        ms};
    }
    function compare(plain,rough){
      let source=0,modified=0,exposed=0,pigmentLoss=0;
      for(let i=0;i<plain.pixels.length;i+=4){
        const a=plain.pixels,b=rough.pixels;
        const oldDist=(255-a[i])+(255-a[i+1])+(255-a[i+2]);
        const newDist=(255-b[i])+(255-b[i+1])+(255-b[i+2]);
        if(oldDist<80)continue;
        source++;
        if(Math.abs(oldDist-newDist)>12)modified++;
        if(newDist<oldDist-30)exposed++;
        pigmentLoss+=oldDist-newDist;
      }
      return {source,modified,exposed,meanLoss:source?pigmentLoss/source:0,
        ms:rough.ms};
    }
    const path={structure:'paths',geometry:'straight'};
    const regions={structure:'regions',regionMode:'voronoi',regionCount:21,
      dividerColor:'none'};
    const pathPlain=paint({...path,brushRoughness:0});
    const pathRough=paint({...path,brushRoughness:95,
      pigmentStyle:'dry-brush',pigmentEdgeBreakup:80});
    const pathRepeat=paint({...path,brushRoughness:95,
      pigmentStyle:'dry-brush',pigmentEdgeBreakup:80});
    const regionPlain=paint({...regions,brushRoughness:0});
    const regionRough=paint({...regions,brushRoughness:90,pigmentStyle:'chalk'});
    const ink=paint({...path,brushRoughness:95,pigmentStyle:'ink'});
    const linen=paint({...path,brushRoughness:95,
      pigmentStyle:'dry-brush',pigmentEdgeBreakup:80,
      material:'linen',textureCoverage:'stripes',textureStrength:80});
    const equal=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
    const countDiff=(a,b)=>{
      let changed=0;
      for(let i=0;i<a.length;i+=4)
        if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+
          Math.abs(a[i+2]-b[i+2])>10)changed++;
      return changed;
    };
    return {paths:compare(pathPlain,pathRough),
      regions:compare(regionPlain,regionRough),
      repeatExact:equal(pathRough.pixels,pathRepeat.pixels),
      presetDifference:countDiff(pathRough.pixels,ink.pixels),
      materialDifference:countDiff(pathRough.pixels,linen.pixels),
      renderMs:{plain:pathPlain.ms,rough:pathRough.ms,regions:regionRough.ms,
        linen:linen.ms}};
  });
  for(const type of ['paths','regions']){
    const c=cases[type];
    assert.ok(c.source>1200,{type,c});
    assert.ok(c.modified>1500,{type,c});
    assert.ok(c.exposed>1000,{type,c});
    assert.ok(c.meanLoss>10,{type,c});
  }
  assert.equal(cases.repeatExact,true,'identical source pigment must be deterministic');
  assert.ok(cases.presetDifference>1200,'application presets must change source pixels');
  assert.ok(cases.materialDifference>800,'material must influence the pigment surface');
  console.log('PIGMENT_CHROMIUM_ACCEPTANCE',JSON.stringify(cases));
}finally{await browser.close();}
