#!/usr/bin/env node
/**
 * Render actual source Canvas2D ink, not a mocked crossing-order enum.
 * Prove Over, Under and Weave create separately measurable crossing pixels
 * without shifting the seven generated centreline geometries. Re-run with
 * a zoomed-out camera so clipping/camera expansion cannot hide the junction.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve(process.env.ROYGBIV_CROSSING_PIXELS_OUT||
  'artifacts/agent3-crossing-pixels');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const records=[],errors=[];
const contour=Array.from({length:170},(_,i)=>{
  const t=-Math.PI/2+2*Math.PI*i/169;
  return [.5+.34*Math.sin(t),.49+.24*Math.sin(2*t)];
});
try{
  const page=await browser.newPage({viewport:{width:920,height:840}});
  page.setDefaultTimeout(20000);
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  for(const testCase of [
    {id:'single-loop',scene:{seed:'crossing-loop',structure:'paths',
      geometry:'loop',loopSweep:270,loopRadius:85,
      geometrySafety:false,orientation:'vertical',spread:65}},
    {id:'saved-figure-eight',scene:{seed:'crossing-drawn',
      structure:'paths',geometry:'drawn',customPath:contour,
      geometrySafety:false,spread:65,extendDrawnPath:true}}
  ])for(const zoom of [1,.75]){
    const scene={...testCase.scene,viewZoom:zoom,viewPanX:0,viewPanY:0,
      palette:'electric',material:'none',lightingMood:'off',
      construction:'ribbon',motif:'solid',stripeWidth:75,
      individuality:0,outline:'white',stripeShadowStrength:0,
      textureDisplacement:0,brushRoughness:0,background:'black'};
    try{
      const result=await page.evaluate(async input=>{
        const {drawWallpaper}=await import('/src/renderer.js');
        const {normalizeRecipe,resolveScene}=await import('/src/model.js');
        const {findPathCrossings}=await import('/src/crossing-order.js');
        const {samplePath}=await import('/src/path-geometry.js');
        const modes=['over','under','weave'],images=[],recipes=[];
        const base=normalizeRecipe({...input,crossingMode:'over'});
        const core=resolveScene(base);
        const crossings=findPathCrossings(core.stripes[3],core.extent,samplePath);
        for(const mode of modes){
          const recipe=normalizeRecipe({...base,crossingMode:mode});
          const generated=resolveScene(recipe);
          const same=JSON.stringify(generated.stripes)===JSON.stringify(core.stripes);
          recipes.push({mode,sameGeometry:same,sourcePathRetained:
            JSON.stringify(recipe.customPath)===JSON.stringify(base.customPath)});
          const canvas=document.createElement('canvas');
          canvas.width=240;canvas.height=520;
          drawWallpaper(canvas,recipe);
          const pixels=canvas.getContext('2d',{willReadFrequently:true})
            .getImageData(0,0,canvas.width,canvas.height).data;
          images.push({mode,pixels:Array.from(pixels),
            png:canvas.toDataURL('image/png').split(',')[1]});
        }
        const comparisons=[];
        for(let i=0;i<modes.length;i++)for(let j=i+1;j<modes.length;j++){
          const a=images[i].pixels,b=images[j].pixels;
          let changed=0,foregroundChanged=0,largest=0;
          for(let offset=0;offset<a.length;offset+=4){
            const delta=Math.max(...[0,1,2].map(channel=>
              Math.abs(a[offset+channel]-b[offset+channel])));
            if(delta>9){
              changed++;largest=Math.max(largest,delta);
              const first=[a[offset],a[offset+1],a[offset+2]],
                second=[b[offset],b[offset+1],b[offset+2]];
              const saturated=v=>Math.max(...v)>70&&
                Math.max(...v)-Math.min(...v)>30;
              if(saturated(first)||saturated(second))foregroundChanged++;
            }
          }
          comparisons.push({a:modes[i],b:modes[j],changed,
            foregroundChanged,largest});
        }
        return {crossings:crossings.length,recipes,comparisons,
          images:images.map(({mode,png})=>({mode,png}))};
      },scene);
      assert.ok(result.crossings>0,
        testCase.id+'/'+zoom+' does not contain an actual transverse junction');
      assert.ok(result.recipes.every(x=>x.sameGeometry&&x.sourcePathRetained),
        'Changing depth order silently regenerated a source stripe/path');
      for(const compare of result.comparisons){
        assert.ok(compare.changed>=8&&compare.foregroundChanged>=1,
          testCase.id+'/'+zoom+' crossing modes indistinguishable in painted foreground: '+
          JSON.stringify(compare));
      }
      for(const image of result.images)
        await writeFile(join(out,testCase.id+'-'+zoom+'-'+image.mode+'.png'),
          Buffer.from(image.png,'base64'));
      const record={case:testCase.id,zoom,viewport:[240,520],
        crossings:result.crossings,comparison:result.comparisons,
        geometryStable:true};
      records.push(record);
      console.log('AGENT3_CROSSING_PIXELS',JSON.stringify(record));
    }catch(error){
      errors.push({case:testCase.id,zoom,message:String(error),stack:error.stack});
    }
  }
  await writeFile(join(out,'evidence.json'),JSON.stringify({
    classification:errors.length?'NOT VERIFIED':'Canvas2D crossing order visually distinguished',
    records,errors,
    exclusions:['Mode-by-mode native Download PNG IDAT at 3024x6552 not checked',
      'No stochastic texture, physical device, or human visual signoff']
  },null,2));
  assert.deepEqual(errors,[],'Production Canvas2D intersection pixel acceptance failed');
  console.log('AGENT3_CROSSING_PIXELS_SUCCESS');
}finally{await browser.close();}
