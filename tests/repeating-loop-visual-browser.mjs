#!/usr/bin/env node
// Opt-in source Canvas2D proof for the reported thick repeating loops.
// Uses production model and painter, not an independently drawn mock.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';

const out=resolve(process.env.ROYGBIV_LOOP_PIXELS_OUT||
  'artifacts/repeating-loop-visual');
await mkdir(out,{recursive:true});
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const results=[];
try{
  const page=await browser.newPage({viewport:{width:900,height:900}});
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  for(const aspect of [0,50,100])for(const width of [0,53,100]){
    const result=await page.evaluate(async ({aspect,width})=>{
      const {normalizeRecipe,resolveScene}=await import('/src/model.js');
      const {drawWallpaper}=await import('/src/renderer.js');
      const {samplePath}=await import('/src/path-geometry.js');
      const TAU=2*Math.PI;
      const recipe=normalizeRecipe({
        seed:'12su8dt-e72gl1',family:'studio',structure:'paths',
        geometry:'loops',orientation:'horizontal',
        construction:'ribbon',shapeFrequency:34,shapeDepth:32,
        spread:65,stripeWidth:width,loopAspect:aspect,
        chaos:10,individuality:53,geometrySafety:true,
        palette:'jewel',background:'white',motif:'solid',
        material:'none',lightingMood:'off',outline:'none',
        brushRoughness:0,textureDisplacement:0,glow:0,
        stripeShadowStrength:0
      });
      const scene=resolveScene(recipe);
      const canvas=document.createElement('canvas');
      canvas.width=600;canvas.height=1300;
      drawWallpaper(canvas,recipe);
      const stripe=scene.stripes[3],pitch=stripe.loopPeriod;
      let station=-(stripe.sharedPhase??0)*pitch/TAU;
      station+=Math.round(-station/pitch)*pitch;
      const k=TAU*stripe.loopXAmplitude/pitch;
      let lo=.00001,hi=Math.PI;
      for(let i=0;i<48;i++){
        const t=(lo+hi)/2;
        if(k*Math.sin(t)>t)lo=t;else hi=t;
      }
      const theta=(lo+hi)/2;
      const rim=samplePath(stripe,station,scene.extent);
      const hole={x:scene.centerX+station,
        y:scene.centerY+stripe.center+
          stripe.loopAmplitude*(1+Math.cos(theta))/2};
      const outer={x:scene.centerX+rim.x,y:scene.centerY+rim.y};
      const pixels=canvas.getContext('2d',{willReadFrequently:true});
      const at=p=>{
        const x=Math.round(p.x),y=Math.round(p.y);
        if(x<2||x>597||y<2||y>1297)return null;
        return [...pixels.getImageData(x,y,1,1).data].slice(0,3);
      };
      return {aspect,width,pitch,amplitude:stripe.loopAmplitude,
        stripePixels:stripe.width,spread:scene.stripes[6].center-scene.stripes[0].center,
        hole,outer,holeRgb:at(hole),outerRgb:at(outer),
        png:canvas.toDataURL('image/png').split(',')[1]};
    },{aspect,width});
    assert.ok(result.holeRgb,'central loop opening fell outside rendered canvas');
    assert.ok(result.outerRgb,'central ribbon rim fell outside rendered canvas');
    assert.ok(result.holeRgb.every(channel=>channel>=245),
      'filled ribbon or adjacent hue erased visible loop opening: '+JSON.stringify({
        aspect,width,rgb:result.holeRgb,hole:result.hole}));
    assert.ok(Math.min(...result.outerRgb)<215,
      'missing visible coloured loop boundary: '+JSON.stringify({
        aspect,width,rgb:result.outerRgb,outer:result.outer}));
    await writeFile(join(out,'loops-aspect-'+aspect+'-width-'+width+'.png'),
      Buffer.from(result.png,'base64'));
    delete result.png;
    results.push(result);
    console.log('VISIBLE_REPEATING_LOOP',JSON.stringify(result));
  }
  await writeFile(join(out,'evidence.json'),JSON.stringify({
    classification:'REAL_SOURCE_CHROMIUM_CANVAS2D',
    sourceSeed:'12su8dt-e72gl1',canvas:[600,1300],results
  },null,2));
  console.log('REPEATING_LOOP_PIXELS_SUCCESS');
}finally{
  await browser.close();
}
