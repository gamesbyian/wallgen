#!/usr/bin/env node
/**
 * Independent actual-pixel acceptance for Drawn, Radial, Voronoi and Nested
 * Regions at two raster sizes plus native 3024x6552 Radial.
 * This samples only stable colored artwork pixels, not empty backgrounds.
 *
 * Launch with a running HTTP server: node tests/redesign-world-pixel-acceptance.mjs
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe} from '../src/model.js';

const url=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve(process.env.ROYGBIV_PIXEL_OUT||'artifacts/agent3-world-pixels');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:900,height:900}});
const checks=[],errors=[];
page.on('pageerror',e=>errors.push(String(e)));
const fixtures=[
  {name:'drawn-extrapolated',input:{
    seed:'a3-pixel-drawn',structure:'paths',geometry:'drawn',
    customPath:[[-.2,.18],[.36,.33],[.67,.61],[1.2,.84]],
    drawnAnchors:[1,2],extendDrawnPath:true,
    viewZoom:.7,viewPanX:10,viewPanY:-15,
    material:'none',background:'black'
  }},
  {name:'radial-pinwheel',input:{
    seed:'a3-pixel-radial',structure:'radial',radialMode:'pinwheel',
    rayCount:23,rayTwist:39,viewZoom:1.35,viewPanX:-15,viewPanY:5,
    material:'none',background:'black'
  }},
  {name:'regions-voronoi',input:{
    seed:'a3-pixel-voronoi',structure:'regions',regionMode:'voronoi',
    regionCount:19,regionJitter:53,viewZoom:.8,viewPanX:10,
    material:'none',background:'black'
  }},
  {name:'regions-nested',input:{
    seed:'a3-pixel-nested',structure:'regions',regionMode:'nested',
    regionCount:13,regionSides:7,viewZoom:.68,viewPanX:15,viewPanY:-10,
    material:'none',background:'black'
  }}
];
try{
  await page.goto(url,{waitUntil:'domcontentloaded'});
  for(const fixture of fixtures){
    const recipe=normalizeRecipe(fixture.input);
    const native=fixture.name==='radial-pinwheel';
    const trials=[
      {name:'two-size',small:[300,650],large:[600,1300],stride:11},
      ...(native?[{name:'native-export-size',small:[600,1300],large:[3024,6552],stride:23}]:[])
    ];
    for(const trial of trials){
      const record=await page.evaluate(async({recipe,trial,capture})=>{
        const {drawWallpaper}=await import('/src/renderer.js');
        function render(dimensions){
          const canvas=document.createElement('canvas');
          canvas.width=dimensions[0];canvas.height=dimensions[1];
          drawWallpaper(canvas,recipe);
          return canvas;
        }
        const small=render(trial.small),large=render(trial.large);
        const a=small.getContext('2d',{willReadFrequently:true})
          .getImageData(0,0,small.width,small.height).data;
        const b=large.getContext('2d',{willReadFrequently:true})
          .getImageData(0,0,large.width,large.height).data;
        const pixel=(data,w,x,y)=>{
          const o=(y*w+x)*4;return [data[o],data[o+1],data[o+2]];
        };
        const difference=(x,y)=>Math.max(...x.map((v,i)=>Math.abs(v-y[i])));
        let stable=0,foreground=0,disagree=0,foregroundDisagree=0;
        const examples=[];
        for(let y=12;y<small.height-12;y+=trial.stride)
          for(let x=12;x<small.width-12;x+=trial.stride){
            const center=pixel(a,small.width,x,y);
            // Reject potential edge/antialias points, including diagonals.
            if([[2,0],[-2,0],[0,2],[0,-2],[2,2],[-2,-2]]
              .some(([dx,dy])=>
                difference(center,pixel(a,small.width,x+dx,y+dy))>8))continue;
            const bx=Math.round((x+.5)*large.width/small.width-.5);
            const by=Math.round((y+.5)*large.height/small.height-.5);
            const actual=pixel(b,large.width,bx,by);
            const diff=difference(center,actual);
            stable++;
            // A saturated rainbow pixel must be genuinely painted foreground,
            // not an empty black/white surface counted as passing geometry.
            const ink=Math.max(...center)>75 &&
              Math.max(...center)-Math.min(...center)>36;
            if(ink)foreground++;
            if(diff>22){
              disagree++;
              if(ink)foregroundDisagree++;
              if(examples.length<8)examples.push({x,y,expected:center,actual,diff});
            }
          }
        const smallPNG=capture?small.toDataURL('image/png').split(',')[1]:null;
        // Free the large native surface before starting the next fixture.
        small.width=small.height=large.width=large.height=0;
        return {sizeSmall:trial.small,sizeLarge:trial.large,
          stable,foreground,disagree,foregroundDisagree,examples,smallPNG};
      },{recipe,trial,capture:trial.name==='two-size'});
      const {smallPNG,...metrics}=record;
      metrics.name=fixture.name+'/'+trial.name;
      metrics.stableDisagreement=metrics.stable?metrics.disagree/metrics.stable:null;
      metrics.foregroundDisagreement=metrics.foreground?
        metrics.foregroundDisagree/metrics.foreground:null;
      console.log('AGENT3_WORLD_PIXELS',JSON.stringify(metrics));
      assert.ok(metrics.stable>=200,
        metrics.name+': not enough locally stable sample pixels');
      assert.ok(metrics.foreground>=30,
        metrics.name+': painted foreground coverage too small for qualification');
      assert.ok(metrics.stableDisagreement<=.04,
        metrics.name+': stable artwork pixels changed at different sizes');
      assert.ok(metrics.foregroundDisagreement<=.06,
        metrics.name+': coloured artwork geometry disagrees at different sizes');
      checks.push(metrics);
      if(smallPNG)await writeFile(join(out,fixture.name+'-preview.png'),
        Buffer.from(smallPNG,'base64'));
    }
  }
  assert.deepEqual(errors,[],'uncaught renderer errors during actual pixel comparisons');
  await writeFile(join(out,'evidence.json'),JSON.stringify({
    classification:'behavior-verified only for qualified raster-size pairs',
    metric:'max channel difference; only locally flat foreground samples',
    exclusions:['stochastic texture parity','native PNG UI export button',
      'physical-device GPU comparison','reference-screenshot fidelity'],
    checks,errors
  },null,2));
  console.log('AGENT3_WORLD_PIXEL_ACCEPTANCE_SUCCESS');
}catch(error){
  await writeFile(join(out,'failure.json'),JSON.stringify({
    classification:'not verified',error:String(error),stack:error.stack,
    checks,errors
  },null,2));
  throw error;
}finally{
  await page.close();
  await browser.close();
}