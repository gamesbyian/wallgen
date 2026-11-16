#!/usr/bin/env node
// Opt-in real Chromium proof of independently configured coloured cast shadows
// and masked inner glows. Uses production drawWallpaper and real Canvas2D.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const out='artifacts/stripe-effects-browser';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:412,height:892}});
  const errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(process.env.ROYGBIV_URL||'http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(async()=>{
    const {drawWallpaper}=await import('/src/renderer.js');
    const common={seed:'masked-edge-chromium-2026',structure:'paths',
      orientation:'vertical',geometry:'straight',motif:'solid',lineStyle:'continuous',
      palette:'classic',outline:'none',material:'none',lightingMood:'off',
      lightStrength:0,shadowStrength:0,background:'black',glow:0,stripeShadowStrength:0};
    const paint=extra=>{
      const canvas=document.createElement('canvas');
      canvas.width=300;canvas.height=650;
      const started=performance.now();
      drawWallpaper(canvas,{...common,...extra});
      const ms=performance.now()-started;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      return {ms,data:new Uint8ClampedArray(ctx.getImageData(0,0,300,650).data),
        image:canvas.toDataURL('image/png')};
    };
    const baseline=paint({});
    const whiteShadow=paint({stripeShadowStrength:100,stripeShadowSoftness:0,
      stripeShadowColorMode:'black',stripeShadowInvert:true,
      stripeShadowPlacement:'outer'});
    const darkShadow=paint({stripeShadowStrength:100,stripeShadowSoftness:0,
      stripeShadowColorMode:'black',stripeShadowInvert:false,
      stripeShadowPlacement:'outer'});
    const innerGlow=paint({glow:90,glowColorMode:'white',glowPlacement:'inner'});
    const outerGlow=paint({glow:90,glowColorMode:'white',glowPlacement:'outer'});
    const both=paint({glow:90,glowColorMode:'white',glowPlacement:'both',
      stripeShadowStrength:90,stripeShadowColorMode:'stripe',stripeShadowPlacement:'both'});
    const changed=(candidate,where)=>{
      let n=0;
      for(let i=0;i<baseline.data.length;i+=4){
        const base=Math.max(...baseline.data.subarray(i,i+3));
        if((where==='outside'&&base>2)||(where==='inside'&&base<80))continue;
        const delta=Math.max(...[0,1,2].map(k=>Math.abs(candidate.data[i+k]-baseline.data[i+k])));
        if(delta>12)n++;
      }
      return n;
    };
    // A production regional cutout and radial convergence must both render
    // through the same mask painter rather than throwing or blocking exports.
    const regional=paint({structure:'regions',regionMode:'voronoi',
      stripeShadowStrength:100,stripeShadowColorMode:'white',
      stripeShadowPlacement:'inner',glow:50,glowPlacement:'both'});
    const radial=paint({structure:'radial',radialMode:'sunburst',rayCore:0,
      stripeShadowStrength:75,stripeShadowColorMode:'dark-stripe',
      stripeShadowPlacement:'both',glow:40,glowPlacement:'inner'});
    return {
      renderMs:{baseline:baseline.ms,outerShadow:whiteShadow.ms,
        innerGlow:innerGlow.ms,outerGlow:outerGlow.ms,both:both.ms,
        regional:regional.ms,radial:radial.ms},
      whiteOutside:changed(whiteShadow,'outside'),
      blackOutside:changed(darkShadow,'outside'),
      innerGlowInside:changed(innerGlow,'inside'),
      innerGlowOutside:changed(innerGlow,'outside'),
      outerGlowOutside:changed(outerGlow,'outside'),
      bothInside:changed(both,'inside'),
      bothOutside:changed(both,'outside'),
      controls:['stripeShadowColorMode','stripeShadowPlacement','stripeShadowInvert',
        'glowColorMode','glowPlacement','glowInvert'].map(key=>[key,
        Boolean(document.querySelector('[name="'+key+'"]'))]),
      images:{whiteShadow:whiteShadow.image,innerGlow:innerGlow.image,
        outerGlow:outerGlow.image,both:both.image,regional:regional.image,radial:radial.image}
    };
  });
  for(const [name,data] of Object.entries(result.images))
    await writeFile(out+'/'+name+'.png',Buffer.from(data.split(',')[1],'base64'));
  delete result.images;
  assert.deepEqual(result.controls.filter(([,exists])=>!exists),[],
    'new editor controls must be present in the actual production DOM');
  assert.ok(result.whiteOutside>40,
    'fully opaque inverted black shadow must become a visible white cast shadow');
  assert.ok(result.whiteOutside>result.blackOutside+20,
    'black and inverted white casts must not render identically on black canvas');
  assert.ok(result.innerGlowInside>20,'inner glow must alter stripe interior pixels');
  assert.ok(result.innerGlowOutside<result.outerGlowOutside/4+5,
    'inner-only glow must stay in the source silhouette');
  assert.ok(result.outerGlowOutside>40,'outer glow must extend beyond stripes');
  assert.ok(result.bothInside>20&&result.bothOutside>40,
    'Both must preserve inset and outside contributions');
  assert.deepEqual(errors,[],'Browser page errors');
  console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
