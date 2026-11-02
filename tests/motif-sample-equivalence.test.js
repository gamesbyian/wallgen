import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene,rng} from '../src/model.js';
import {samplePath,ribbonEdge} from '../src/path-geometry.js';
import {motifFits,textureHeight,motifVariation,motifStripeFactors} from '../src/renderer.js';

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

test('precomputed motif stripe factors preserve every original seeded mark exactly',()=>{
  for(const geometry of ['straight','wave','loop','loops','hairpin']){
    for(const overridePatternHomogeneity of [false,true]){
      for(const patternHomogeneity of [0,37,100]){
        const recipe=normalizeRecipe({
          seed:'motif-factor-parity-'+geometry+'-'+overridePatternHomogeneity+'-'+patternHomogeneity,
          structure:'paths',geometry,construction:'ribbon',motif:'dots',
          patternHomogeneity,overridePatternHomogeneity,individuality:89,
        });
        const scene=resolveScene(recipe);
        for(const stripe of [scene.stripes[0],scene.stripes[3],scene.stripes[6]]){
          const factors=motifStripeFactors(scene,stripe);
          const stripeEffect=scene.overridePatternHomogeneity?scene.individuality/100:0;
          const oldStripeRandom=rng(scene.seed+':motif-stripe:'+stripe.index);
          const stripeScale=1+(oldStripeRandom()-.5)*1.0*stripeEffect;
          const stripeAngle=(oldStripeRandom()-.5)*1.6*stripeEffect;
          const stripeOpacity=1-(oldStripeRandom()*.45*stripeEffect);
          assert.deepEqual(factors,{stripeScale,stripeAngle,stripeOpacity});
          const seed=scene.seed+':motifs:'+stripe.index;
          const originalRandom=rng(seed);
          const cachedRandom=rng(seed);
          const publicRandom=rng(seed);
          const variance=1-scene.patternHomogeneity/100;
          for(let mark=0;mark<96;mark++){
            const reference={
              scale:Math.max(.28,stripeScale*(1+(originalRandom()-.5)*1.1*variance)),
              angle:stripeAngle+(originalRandom()-.5)*Math.PI*variance,
              opacity:Math.max(.16,stripeOpacity*(1-originalRandom()*.75*variance)),
            };
            assert.deepEqual(motifVariation(scene,stripe,cachedRandom,factors),
              reference,'cached motif parity '+geometry+' '+stripe.index+' '+mark);
            assert.deepEqual(motifVariation(scene,stripe,publicRandom),
              reference,'standalone motif parity '+geometry+' '+stripe.index+' '+mark);
          }
        }
      }
    }
  }
});

test('textured ribbon edges reuse precisely the original centreline sample',()=>{
  for(const geometry of ['straight','wave','jagged','loop','loops','hairpin']){
    for(const textureCoverage of ['both','stripes','background']){
      for(const textureDisplacement of [0,48,95]){
        const scene=resolveScene(normalizeRecipe({
          seed:'edge-station-'+geometry+'-'+textureCoverage+'-'+textureDisplacement,
          structure:'paths',geometry,construction:'ribbon',motif:'dashes',
          material:'wood-grain',textureStrength:87,
          textureCoverage,textureDisplacement,
          shapeFrequency:77,shapeDepth:69,edgeTaper:45,
          mirrorHorizontal:true,mirrorVertical:true,
        }));
        for(const stripe of [scene.stripes[0],scene.stripes[3],scene.stripes[6]]){
          for(const fraction of [-.95,-.5,-.17,0,.3,.63,.97]){
            const x=scene.extent*fraction,point=samplePath(stripe,x,scene.extent);
            for(const side of [-1,0,1]){
              const original=ribbonEdge(stripe,x,scene.extent,side,
                textureHeight(scene,stripe,x,side));
              const shared=ribbonEdge(stripe,x,scene.extent,side,
                textureHeight(scene,stripe,x,side,point),point);
              assert.deepEqual(shared,original,
                'edge parity '+geometry+' '+textureCoverage+' '+textureDisplacement+
                ' '+stripe.index+' '+fraction+' '+side);
            }
          }
        }
      }
    }
  }
});
