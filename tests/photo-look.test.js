import test from 'node:test';
import assert from 'node:assert/strict';
import {PHOTO_PRESETS,normalizePhotoLook,processPhotoPixels,applyPhotoFinish} from '../src/photo-look.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe,resolveScene} from '../src/model.js';

const pixels=(r=200,g=120,b=40,w=8,h=9)=>{
  const arr=new Uint8ClampedArray(w*h*4);
  for(let i=0;i<arr.length;i+=4){arr[i]=r;arr[i+1]=g;arr[i+2]=b;arr[i+3]=255;}
  return arr;
};
test('old designs have no Photo recipe object and the off path performs no canvas readback',()=>{
  const old=normalizeRecipe({seed:'previous-art',palette:'jewel'});
  assert.equal(Object.hasOwn(old,'photoLook'),false);
  assert.equal(Object.hasOwn(resolveScene(old),'photoLook'),false);
  const ctx={getImageData(){throw Error('off path must never read pixels');}};
  assert.equal(applyPhotoFinish(ctx,1200,2600,old.photoLook,old.seed),false);
  assert.equal(applyPhotoFinish(ctx,1200,2600,{enabled:false,amount:100},old.seed),false);
  assert.equal(applyPhotoFinish(ctx,1200,2600,{enabled:true,amount:0},old.seed),false);
});
test('photo presets are self-contained, bounded and transport through URL/PNG recipe encoding',()=>{
  for(const presetId of Object.keys(PHOTO_PRESETS)){
    const r=normalizeRecipe({seed:'🌈',photoLook:{enabled:true,presetId,amount:72}});
    assert.equal(r.photoLook.version,1);
    assert.equal(r.photoLook.family,PHOTO_PRESETS[presetId].family);
    assert.equal(r.photoLook.presetId,presetId);
    assert.deepEqual(decodeRecipe(encodeRecipe(r)),r,presetId);
    assert.deepEqual(normalizeRecipe(r),r,presetId);
  }
  const bad=normalizePhotoLook({enabled:true,presetId:'unknown',amount:Infinity,
    parameters:{contrast:999,saturation:-10,grain:'bad',red:Infinity}});
  assert.equal(bad.presetId,'film-slide');
  assert.equal(bad.amount,75);
  assert.equal(bad.parameters.contrast,1.8);
  assert.equal(bad.parameters.saturation,0);
  assert.equal(bad.parameters.grain,12);
  assert.equal(bad.parameters.red,PHOTO_PRESETS['film-slide'].red);
});
test('off, zero amount and zero strength preserve RGBA bytes exactly',()=>{
  const original=pixels(0,152,251);
  for(const input of [{enabled:false,presetId:'film-mono',amount:100},
    {enabled:true,presetId:'film-mono',amount:0}]){
    const dest=original.slice();
    assert.strictEqual(processPhotoPixels(dest,8,9,input,'alpha'),dest);
    assert.deepEqual(dest,original);
  }
});
test('film and camera looks are distinguishable and reproducible with unchanged alpha',()=>{
  const raw=pixels();
  const results={};
  for(const presetId of Object.keys(PHOTO_PRESETS)){
    const config=normalizePhotoLook({enabled:true,presetId,amount:100});
    const a=raw.slice(),b=raw.slice();
    processPhotoPixels(a,8,9,config,'same-seed');
    processPhotoPixels(b,8,9,config,'same-seed');
    assert.deepEqual(a,b,presetId);
    assert.equal(a[3],255);
    assert.notDeepEqual(a,raw,presetId);
    results[presetId]=Array.from(a.slice(0,3));
  }
  const mono=results['film-mono'];
  assert.equal(mono[0],mono[1]);
  assert.equal(mono[1],mono[2]);
  assert.notDeepEqual(results['film-slide'],results['camera-natural']);
  assert.notDeepEqual(results['camera-hdr'],results['camera-webcam']);
});
test('deterministic grain changes with seed but does not reroll for a given source',()=>{
  const look=normalizePhotoLook({enabled:true,presetId:'film-negative',amount:100,
    parameters:{grain:100,vignette:0}});
  const a=pixels(),b=pixels(),c=pixels();
  processPhotoPixels(a,8,9,look,'seed-one');
  processPhotoPixels(b,8,9,look,'seed-one');
  processPhotoPixels(c,8,9,look,'seed-two');
  assert.deepEqual(a,b);
  assert.notDeepEqual(a,c);
});
test('finished-compositor adapter reads once and applies pixel data once',()=>{
  const original=pixels(200,80,30,2,3);
  const ctx={
    reads:0,writes:0,
    getImageData(x,y,w,h){
      assert.deepEqual([x,y,w,h],[0,0,2,3]);this.reads++;
      return {data:original.slice()};
    },
    putImageData(result,x,y){assert.deepEqual([x,y],[0,0]);this.writes++;this.last=result.data;}
  };
  const look=normalizePhotoLook({enabled:true,presetId:'film-mono',amount:100});
  assert.equal(applyPhotoFinish(ctx,2,3,look,'render'),true);
  assert.equal(ctx.reads,1);
  assert.equal(ctx.writes,1);
  assert.notDeepEqual(ctx.last,original);
});

test('grain-only look has neutral tone, hue and vignette when grain is zero',()=>{
  const look=normalizePhotoLook({enabled:true,presetId:'film-grain-only',amount:100,
    parameters:{grain:0}});
  assert.equal(look.parameters.contrast,1);
  assert.equal(look.parameters.saturation,1);
  assert.equal(look.parameters.vignette,0);
  for(const rgb of [[0,0,0],[255,255,255],[15,100,213],[250,50,6]]){
    const original=pixels(...rgb,21,19),output=original.slice();
    processPhotoPixels(output,21,19,look,'neutral');
    assert.deepEqual(output,original,'grain zero must not recolour authored hues');
  }
});
test('layered emulsion grain is deterministic, resolution-aware and finer than logical pixels',()=>{
  const look=normalizePhotoLook({enabled:true,presetId:'film-grain-only',amount:100,
    parameters:{grain:100}});
  const source=pixels(128,128,128,1200,16);
  const left=source.slice(),again=source.slice(),alternate=source.slice();
  processPhotoPixels(left,1200,16,look,'emulsion');
  processPhotoPixels(again,1200,16,look,'emulsion');
  processPhotoPixels(alternate,1200,16,look,'other-film');
  assert.deepEqual(left,again);
  assert.notDeepEqual(left,alternate);
  // At 2 output pixels per authored horizontal unit, an old 600-cell
  // sampler would repeat its noise value inside every same-cell pair.
  // This new mode resolves fine-grain variation without resampling pixels.
  let adjacentDifferences=0;
  for(let x=0;x<1200;x+=2)
    if(left[x*4]!==left[(x+1)*4])adjacentDifferences++;
  assert.ok(adjacentDifferences>200,adjacentDifferences+' distinct fine-grain pairs');
  assert.equal(left[3],255);
  assert.equal(left[left.length-1],255);
});
