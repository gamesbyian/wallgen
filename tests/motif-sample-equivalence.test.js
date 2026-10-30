import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene} from '../src/model.js';
import {samplePath} from '../src/path-geometry.js';
import {motifFits,textureHeight} from '../src/renderer.js';

test('shared motif path point exactly matches independent forward sampling',()=>{
  for(const geometry of ['straight','wave','loop','loops','hairpin']){
    for(const textureCoverage of ['both','stripes','background']){
      const recipe=normalizeRecipe({
        seed:'motif-reuse-'+geometry+'-'+textureCoverage,
        structure:'paths',geometry,construction:'ribbon',motif:'dashes',
        textureDisplacement:95,material:'wood-grain',
        textureStrength:82,textureCoverage,
        stripeWidth:50,shapeFrequency:62,shapeDepth:65,
      });
      const scene=resolveScene(recipe);
      const stripe=scene.stripes[3];
      for(const x of [-.8,-.4,0,.3,.75].map(t=>scene.extent*t)){
        const point=samplePath(stripe,x,scene.extent);
        for(const side of [-1,0,1]){
          const direct=textureHeight(scene,stripe,x,side);
          const reused=textureHeight(scene,stripe,x,side,point);
          assert.equal(reused,direct,geometry+' '+textureCoverage+' '+x+' '+side);
        }
        for(const transverse of [-10,0,10]){
          for(const half of [1,5,12]){
            const fit=motifFits(stripe,scene,x,point.y+transverse,half,half,scene.extent);
            const reused=motifFits(stripe,scene,x,point.y+transverse,half,half,scene.extent,point);
            assert.equal(reused,fit,
              geometry+' '+textureCoverage+' '+x+' '+transverse+' '+half);
          }
        }
      }
      if(textureCoverage==='background')
        assert.equal(textureHeight(scene,stripe,0,0),0,
          'background-only material cannot displace stripe marks');
    }
  }
});
