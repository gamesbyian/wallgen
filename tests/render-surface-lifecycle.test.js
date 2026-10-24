import test from 'node:test';
import assert from 'node:assert/strict';
import {drawWallpaper} from '../src/renderer.js';
import {normalizeRecipe} from '../src/model.js';

// A failed target ink context must not strand a full-resolution backing store.
// This is a Node fault-path contract; successful pixels are checked separately
// by the opt-in production Chromium real-art test.
for(const useCache of [false,true]){
  test('failed ink allocation releases its backing store (cache='+useCache+')',()=>{
    const context={setTransform(){},clearRect(){}};
    const target={width:3024,height:6552,getContext(){return context;}};
    const ink=[];
    const cache={};
    assert.throws(()=>drawWallpaper(target,normalizeRecipe({
      seed:'resource-error-path',geometry:'loops',
      material:'linen-organic',textureStrength:50
    }),{...(useCache?{cache}:{}),canvasFactory:(w,h)=>{
      const surface={width:w,height:h,getContext(){return null;}};
      ink.push(surface);
      return surface;
    }}),/Canvas ink layer unavailable/);
    assert.equal(ink.length,1);
    assert.equal(ink[0].width,0);
    assert.equal(ink[0].height,0);
    assert.equal(cache.ink,undefined,'a failed paint is never a reusable cache');
  });
}

const noOp=()=>{};
function proxyCanvasContext({throwOnPresent=false}={}){
  const value={
    drawImage(){if(throwOnPresent)throw new Error('Injected final compositor failure');},
    createLinearGradient(){return {addColorStop:noOp};},
    createRadialGradient(){return {addColorStop:noOp};}
  };
  return new Proxy(value,{get(target,key){return key in target?target[key]:noOp;},
    set(target,key,next){target[key]=next;return true;}});
}

test('a final compositor error must not publish an incomplete preview cache or strand its canvases',()=>{
  // Regions avoid browser Path2D and permit precise Node fault injection at
  // the final destination drawImage, after background and ink were prepared.
  const target={width:600,height:1300,
    getContext(){return proxyCanvasContext({throwOnPresent:true});}};
  const surfaces=[];
  const previousInk={width:14,height:22};
  const previousBackground={width:14,height:22};
  const previousOverhang={left:1,top:2,width:14,height:22};
  const cache={ink:previousInk,background:previousBackground,
    overhang:previousOverhang};
  const factory=(width,height)=>{
    const surface={width,height,getContext(){return proxyCanvasContext();}};
    surfaces.push(surface);
    return surface;
  };
  assert.throws(()=>drawWallpaper(target,normalizeRecipe({
    seed:'final-compositor-exception',structure:'regions',regionMode:'blocks',
    material:'none',glow:0,lightingMood:'off',stripeShadowStrength:0
  }),{cache,canvasFactory:factory}),/Injected final compositor failure/);
  assert.equal(surfaces.length,2,'background and ink had been prepared');
  assert.equal(cache.ink,previousInk,'failure must retain the previous good ink');
  assert.equal(cache.background,previousBackground,'failure must retain the previous good background');
  assert.equal(cache.overhang,previousOverhang,'failure must not publish new framing');
  for(const surface of surfaces){
    assert.equal(surface.width,0,'failed render must release every canvas width');
    assert.equal(surface.height,0,'failed render must release every canvas height');
  }
});

test('successful settled previews preserve only their two reusable cache surfaces',()=>{
  const target={width:280,height:607,getContext(){return proxyCanvasContext();}};
  const surfaces=[],cache={};
  const factory=(width,height)=>{
    const surface={width,height,getContext(){return proxyCanvasContext();}};
    surfaces.push(surface);
    return surface;
  };
  drawWallpaper(target,normalizeRecipe({
    seed:'successful-cache-ownership',structure:'regions',regionMode:'blocks',
    material:'none',lightingMood:'off'
  }),{cache,canvasFactory:factory});
  assert.equal(surfaces.length,2);
  assert.ok(cache.ink.width>0);
  assert.equal(cache.background.width,target.width);
  assert.equal(cache.background.height,target.height);
});
