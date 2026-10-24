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
