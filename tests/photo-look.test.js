import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PHOTO_PRESETS,normalizePhotoLook,isNeutralPhotoLook,processPhotoPixels,applyPhotoFinish} from '../src/photo-look.js';
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

test('simulated low-res webcam has real spatial sampling, quantization and stable alpha',()=>{
  const width=600,height=60,raw=pixels(128,128,128,width,height);
  // Input contains one-pixel-wide vertical black/white stripes that are
  // finer than the simulated 200-column sensor can resolve.
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const at=(y*width+x)*4,level=(x%2)*255;
    raw[at]=level;raw[at+1]=level;raw[at+2]=level;
  }
  const camera=normalizePhotoLook({enabled:true,presetId:'camera-webcam-signal',
    amount:100,parameters:{grain:0,vignette:0,contrast:1,saturation:1,
      shadow:0,highlight:0,red:0,green:0,blue:0}});
  const a=raw.slice(),b=raw.slice();
  processPhotoPixels(a,width,height,camera,'my-sensor');
  processPhotoPixels(b,width,height,camera,'my-sensor');
  assert.deepEqual(a,b);
  assert.notDeepEqual(a,raw);
  for(let y of [0,30,59])for(let x=0;x<width;x+=3){
    const first=(y*width+x)*4;
    assert.deepEqual([...a.slice(first,first+3)],
      [...a.slice(first+4,first+7)],'adjacent output pixels share sensor sample');
    assert.deepEqual([...a.slice(first,first+3)],
      [...a.slice(first+8,first+11)],'bounded capture resolution survives upscaling');
    assert.equal(a[first+3],255);
  }
});
test('webcam capture changes chroma spatial bandwidth, with neutral amount bypass',()=>{
  const width=300,height=120,raw=pixels(0,0,0,width,height);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const at=(y*width+x)*4;
    if(Math.floor(x/2)%2){raw[at]=255;raw[at+2]=0;}
    else{raw[at]=0;raw[at+2]=255;}
  }
  const camera=normalizePhotoLook({enabled:true,presetId:'camera-webcam-signal',amount:100,
    parameters:{grain:0,vignette:0,contrast:1,saturation:1,shadow:0,highlight:0,
      red:0,green:0,blue:0}});
  const filtered=raw.slice();
  processPhotoPixels(filtered,width,height,camera,'chroma');
  assert.notDeepEqual(filtered,raw,'4:2:0-style chroma reduction must affect source');
  const disabled=raw.slice();
  processPhotoPixels(disabled,width,height,{...camera,amount:0},'chroma');
  assert.deepEqual(disabled,raw,'neutral amount must not change bytes');
});

test('warm film halation is a stable recipe field only for the new optical look',()=>{
  const optical=normalizePhotoLook({enabled:true,presetId:'film-halation-only',
    parameters:{halation:150,grain:0}});
  assert.equal(optical.parameters.halation,100);
  assert.equal(optical.parameters.grain,0);
  assert.equal(optical.parameters.contrast,1);
  assert.equal(optical.parameters.saturation,1);
  assert.deepEqual(normalizePhotoLook(optical),optical);
  const saved=normalizeRecipe({seed:'halation-stored',photoLook:optical});
  assert.deepEqual(decodeRecipe(encodeRecipe(saved)),saved);
  for(const id of ['film-slide','film-grain-only','camera-webcam','camera-webcam-signal']){
    const old=normalizePhotoLook({enabled:true,presetId:id});
    assert.equal(Object.hasOwn(old.parameters,'halation'),false,
      'older saved preset parameter shape must not be upgraded silently');
  }
});
test('warm halation lights dark neighbours of bright ribbons without altering source',()=>{
  const w=180,h=160;
  const original=pixels(0,0,0,w,h);
  // Yellow is luminous; the red band is visually saturated but not high-luma.
  for(let y=35;y<125;y++)for(let x=50;x<82;x++){
    const i=(y*w+x)*4;original[i]=255;original[i+1]=235;original[i+2]=0;
  }
  const look=normalizePhotoLook({enabled:true,presetId:'film-halation-only',amount:100,
    parameters:{halation:100,grain:0,vignette:0}});
  const snapshot=original.slice();
  const a=original.slice(),b=original.slice();
  processPhotoPixels(a,w,h,look,'same-emulsion');
  processPhotoPixels(b,w,h,look,'same-emulsion');
  assert.deepEqual(a,b,'optical effect must be reproducible');
  const at=(x,y)=>(y*w+x)*4;
  const adjacent=at(83,80),far=at(150,80),center=at(65,80);
  assert.ok(a[adjacent]>8,'warm bleed should appear beyond the light edge');
  assert.ok(a[adjacent]>a[adjacent+1]*2,
    'red-orange spill must not be a neutral-white blur');
  assert.equal(a[far],0,'distant black background should remain true black');
  assert.deepEqual([...a.slice(center,center+4)],
    [...original.slice(center,center+4)],'opaque luminous center should stay intact');
  assert.equal(a[adjacent+3],255,'alpha remains unchanged');
  assert.deepEqual(original,snapshot,'photo finish must not mutate source sample');
});
test('zero halation and zero overall amount are strict no-op for neutral new preset',()=>{
  const input=pixels(10,50,200,80,80);
  for(const settings of [
    {enabled:true,presetId:'film-halation-only',amount:100,
      parameters:{halation:0,grain:0}},
    {enabled:true,presetId:'film-halation-only',amount:0,
      parameters:{halation:100,grain:0}},
  ]){
    const out=input.slice();
    processPhotoPixels(out,80,80,settings,'neutral');
    assert.deepEqual(out,input);
  }
});

test('seven-image photo review uses exact matching recipes and production headless renderer',()=>{
  const script=readFileSync(new URL('../scripts/review-photo-looks.mjs',import.meta.url),'utf8');
  assert.match(script,/const cases=Object\.freeze\(\[/);
  const presets=[...script.matchAll(/presetId:'([a-z-]+)'/g)].map(m=>m[1]);
  assert.deepEqual(presets,['film-slide','film-negative','film-grain-only',
    'film-halation-only','camera-hdr','camera-webcam-signal']);
  assert.match(script,/presetId:null/);
  assert.match(script,/normalizeRecipe\(\{\.\.\.base,seed:opts\.seed/);
  assert.match(script,/JSON\.stringify\(recipe,null,2\)/);
  assert.match(script,/\['--recipe',source,'--width','600','--height','1300','--out',image\]/);
  assert.match(script,/Review output already exists/);
  assert.match(script,/produced-awaiting-human-review/);
});

test('halation editor reuses the second Photo slider slot without growing the tray',()=>{
  const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
  const html=read('index.html'),app=read('src/app.js'),css=read('photo-controls.css');
  assert.match(html,/data-photo-secondary="grain"/);
  assert.match(html,/data-photo-secondary="halation" hidden/);
  assert.match(html,/name="photoHalation" min="0" max="100" value="75"/);
  assert.match(css,/\[data-photo-secondary\]\[hidden\]\{display:none!important\}/);
  assert.match(app,/function syncPhotoSecondarySlot\(presetId\)/);
  assert.match(app,/syncPhotoSecondarySlot\(photo\.presetId\)/);
  assert.match(app,/halation:Number\(form\.elements\.namedItem\('photoHalation'\)\.value\)/);
  assert.match(app,/\['photoHalation',photo\.parameters\.halation\?\?/);
  assert.match(app,/syncPhotoSecondarySlot\(event\.target\.value\)/);
  assert.match(app,/photoAmount','photoGrain','photoHalation'/);
});
test('halation-only strength 0 to 100 actually changes rim light while preserving original colors',()=>{
  const w=100,h=100,source=pixels(0,0,0,w,h);
  for(let y=20;y<80;y++)for(let x=24;x<56;x++){
    const pos=(y*w+x)*4;source[pos]=255;source[pos+1]=230;
  }
  const withLevel=value=>normalizePhotoLook({enabled:true,presetId:'film-halation-only',
    amount:100,parameters:{halation:value,grain:0,vignette:0}});
  const off=source.slice(),soft=source.slice(),full=source.slice();
  processPhotoPixels(off,w,h,withLevel(0),'same');
  processPhotoPixels(soft,w,h,withLevel(35),'same');
  processPhotoPixels(full,w,h,withLevel(100),'same');
  assert.deepEqual(off,source);
  const neighbor=(50*w+56)*4;
  assert.ok(full[neighbor]>soft[neighbor]&&soft[neighbor]>0);
  for(const result of [soft,full]){
    assert.equal(result[neighbor+3],255);
    const center=(50*w+35)*4;
    assert.deepEqual(result.slice(center,center+4),source.slice(center,center+4));
  }
});

test('zero optical/grain effect bypasses large Canvas readback with unchanged recipe',()=>{
  const ctx={getImageData(){throw Error('neutral look must never allocate ImageData');},
    putImageData(){throw Error('neutral look must never write ImageData');}};
  for(const value of [
    {enabled:true,presetId:'film-grain-only',amount:100,parameters:{grain:0}},
    {enabled:true,presetId:'film-halation-only',amount:100,
      parameters:{grain:0,halation:0}},
    {enabled:true,presetId:'film-slide',amount:100,
      parameters:{contrast:1,saturation:1,shadow:0,highlight:0,
        red:0,green:0,blue:0,grain:0,vignette:0}},
  ]){
    const before=normalizePhotoLook(value);
    assert.equal(isNeutralPhotoLook(before),true);
    assert.equal(applyPhotoFinish(ctx,3024,6552,value,'no-pixels'),false);
    assert.deepEqual(normalizePhotoLook(value),before,
      'neutral optimization must not mutate authored Photo settings');
    const raw=pixels(14,190,77),copy=raw.slice();
    assert.strictEqual(processPhotoPixels(copy,8,9,value,'no-pixels'),copy);
    assert.deepEqual(copy,raw);
  }
});
test('spatial webcam capture and active film grain are not falsely optimized away',()=>{
  const neutralSignal=normalizePhotoLook({enabled:true,presetId:'camera-webcam-signal',
    amount:100,parameters:{contrast:1,saturation:1,shadow:0,highlight:0,
      red:0,green:0,blue:0,grain:0,vignette:0}});
  const activeGrain=normalizePhotoLook({enabled:true,presetId:'film-grain-only',
    amount:100,parameters:{grain:30}});
  assert.equal(isNeutralPhotoLook(neutralSignal),false);
  assert.equal(isNeutralPhotoLook(activeGrain),false);
  let reads=0,writes=0;
  const ctx={
    getImageData(x,y,w,h){reads++;return {data:pixels(80,150,220,w,h)};},
    putImageData(){writes++;}
  };
  assert.equal(applyPhotoFinish(ctx,6,6,neutralSignal,'sensor'),true);
  assert.equal(applyPhotoFinish(ctx,6,6,activeGrain,'emulsion'),true);
  assert.deepEqual([reads,writes],[2,2]);
  assert.throws(()=>processPhotoPixels(new Uint8ClampedArray(3),8,9,
    {enabled:true,presetId:'film-grain-only',parameters:{grain:0}}),
    /Invalid photo pixel buffer/,
    'invalid active buffer is still validated even if look is neutral');
});

test('early digicam gives its own bounded capture signature and deterministic alpha',()=>{
  const width=900,height=72,raw=pixels(30,80,150,width,height);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4;
    raw[i]=(x%4)<2?250:10;
    raw[i+1]=y%3?80:220;
    raw[i+2]=(Math.floor(x/3)%2)?240:20;
  }
  const snapshot=raw.slice();
  const neutral={grain:0,vignette:0,contrast:1,saturation:1,shadow:0,
    highlight:0,red:0,green:0,blue:0};
  const newLook=normalizePhotoLook({enabled:true,presetId:'camera-digicam-signal',
    amount:100,parameters:neutral});
  const webcam=normalizePhotoLook({enabled:true,presetId:'camera-webcam-signal',
    amount:100,parameters:neutral});
  assert.equal(isNeutralPhotoLook(newLook),false);
  const first=raw.slice(),again=raw.slice(),legacy=raw.slice();
  processPhotoPixels(first,width,height,newLook,'same-photo');
  processPhotoPixels(again,width,height,newLook,'same-photo');
  processPhotoPixels(legacy,width,height,webcam,'same-photo');
  assert.deepEqual(first,again);
  assert.notDeepEqual(first,raw);
  assert.notDeepEqual(first,legacy,'360-column virtual digicam differs from 200-column webcam');
  assert.equal(first[3],255);
  assert.equal(first[first.length-1],255);
  const sample=(x,y)=>first[(y*width+x)*4];
  assert.equal(sample(30,30),sample(31,30),'adjacent output pixels share a virtual sensor sample');
  assert.deepEqual(raw,snapshot,'source pixels are unchanged');
  const saved=normalizeRecipe({seed:'early-digicam',photoLook:newLook});
  assert.deepEqual(decodeRecipe(encodeRecipe(saved)),saved);
  assert.deepEqual(normalizePhotoLook(saved.photoLook),newLook);
  const off=raw.slice();processPhotoPixels(off,width,height,{...newLook,amount:0},'same-photo');
  assert.deepEqual(off,raw);
});
test('early digicam uses the existing Light Photo selector, without a new category',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.equal((html.match(/value="camera-digicam-signal"/g)||[]).length,1);
  const old=normalizePhotoLook({enabled:true,presetId:'camera-webcam-signal'});
  assert.equal(Object.hasOwn(old.parameters,'halation'),false);
});
