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
test('wide warm film diffusion is separate, deterministic, bounded and saveable',()=>{
  const w=180,h=160;
  const source=pixels(0,0,0,w,h);
  for(let y=35;y<125;y++)for(let x=50;x<82;x++){
    const i=(y*w+x)*4;
    source[i]=255;source[i+1]=235;source[i+2]=0;
  }
  const original=source.slice();
  const preset=id=>normalizePhotoLook({enabled:true,presetId:id,amount:100,
    parameters:{halation:100,grain:0,vignette:0}});
  const old=source.slice(),newA=source.slice(),newB=source.slice();
  const classic=preset('film-halation-only');
  const diffused=preset('film-halation-diffusion');
  assert.equal(diffused.parameters.halation,100);
  assert.equal(isNeutralPhotoLook(diffused),false);
  assert.deepEqual(decodeRecipe(encodeRecipe(
    normalizeRecipe({seed:'warm-film',photoLook:diffused}))).photoLook,diffused);
  processPhotoPixels(old,w,h,classic,'same-scene');
  processPhotoPixels(newA,w,h,diffused,'same-scene');
  processPhotoPixels(newB,w,h,diffused,'same-scene');
  assert.deepEqual(newA,newB,'diffusion must be deterministic');
  assert.deepEqual(source,original,'input must remain unchanged');
  const at=(x,y)=>(y*w+x)*4;
  assert.ok(newA[at(87,80)]>old[at(87,80)]+5,
    'wide profile extends noticeably farther beyond a bright source');
  assert.ok(newA[at(83,80)]>newA[at(83,80)+1]*2,
    'warm red-biased spill should be perceptually distinct');
  assert.equal(newA[at(160,80)],0,'distant black stays truly black');
  for(let i=3;i<newA.length;i+=4)assert.equal(newA[i],255);
  const neutral=source.slice();
  processPhotoPixels(neutral,w,h,{enabled:true,presetId:'film-halation-diffusion',
    amount:100,parameters:{halation:0,grain:0}},'same-scene');
  assert.deepEqual(neutral,source,'zero optical strength is a strict no-op');
});
test('new diffusion selector remains a compact contextual Photo control',()=>{
  const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
  assert.match(read('index.html'),/<option value="film-halation-diffusion">/);
  assert.match(read('src/app.js'),/\['film-halation-only','film-halation-diffusion'\]\.includes\(presetId\)/);
  assert.match(read('scripts/review-photo-looks.mjs'),/--focus-diffusion/);
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

test('Photo Before uses a temporary view-only recipe and never changes saved settings',async()=>{
  const {photoPreviewRecipe}=await import('../src/photo-preview-compare.js');
  const original=normalizeRecipe({seed:'compare-film',
    positionX:18,viewZoom:1.4,viewPanX:-9,
    photoLook:normalizePhotoLook({enabled:true,presetId:'film-halation-only',
      amount:100,parameters:{halation:88}})});
  const snapshot=JSON.stringify(original);
  const before=photoPreviewRecipe(original,true);
  assert.notStrictEqual(before,original);
  assert.equal(before.photoLook.enabled,false);
  assert.equal(before.photoLook.presetId,original.photoLook.presetId);
  assert.equal(before.photoLook.parameters.halation,88);
  assert.equal(before.positionX,original.positionX);
  assert.equal(before.viewZoom,original.viewZoom);
  assert.equal(before.viewPanX,original.viewPanX);
  assert.equal(JSON.stringify(original),snapshot,'comparison cannot mutate Undo, PNG or URL state');
  assert.strictEqual(photoPreviewRecipe(original,false),original);
  assert.strictEqual(photoPreviewRecipe({...original,photoLook:{...original.photoLook,
    enabled:false}},true).photoLook.enabled,false);
});
test('Photo Before button reuses cached stage and is accessible without enlarging control grid',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  const css=readFileSync(new URL('../photo-controls.css',import.meta.url),'utf8');
  assert.equal((html.match(/data-photo-compare/g)||[]).length,1);
  assert.match(html,/data-photo-compare aria-pressed="false" disabled/);
  assert.match(css,/\.photo-compare-row\{display:flex/);
  assert.match(app,/presentNudgedArtwork\(preview,previewLayers,previewDisplayRecipe\(\)\)/);
  assert.match(app,/photoCompareButton\.addEventListener\('click'/);
  assert.match(app,/if\(photoBeforeActive\)\{closeFrame\(message\);return;\}/);
  assert.match(app,/photoBeforeActive=false;/);
});

test('deep-black negative is isolated from legacy film-negative on bright source pixels',()=>{
  const input=pixels(0,0,0,60,30);
  for(let y=0;y<30;y++)for(let x=20;x<40;x++){
    const i=(y*60+x)*4;
    input[i]=255;input[i+1]=83;input[i+2]=28;
  }
  for(let y=0;y<30;y++)for(let x=40;x<60;x++){
    const i=(y*60+x)*4;
    input[i]=12;input[i+1]=12;input[i+2]=12;
  }
  const old=normalizePhotoLook({enabled:true,presetId:'film-negative',amount:100});
  const deep=normalizePhotoLook({enabled:true,presetId:'film-negative-deepblack',amount:100});
  const normal=input.slice(),safe=input.slice(),again=input.slice();
  processPhotoPixels(normal,60,30,old,'negative-seed');
  processPhotoPixels(safe,60,30,deep,'negative-seed');
  processPhotoPixels(again,60,30,deep,'negative-seed');
  assert.deepEqual(safe,again,'deterministic');
  const at=(x,y)=>(y*60+x)*4;
  assert.deepEqual([...safe.slice(at(5,10),at(5,10)+3)],[0,0,0],
    'true-black wallpaper background stays exactly black');
  assert.ok(normal[at(5,10)]>0,'legacy negative must retain its original lifted floor');
  assert.deepEqual(safe.slice(at(25,10),at(25,10)+4),
    normal.slice(at(25,10),at(25,10)+4),
    'same tones and seeded grain for brightly coloured artwork');
  assert.ok(safe[at(45,10)]<normal[at(45,10)],
    'deep near-black shadow must lift less strongly');
  assert.equal(safe[at(5,10)+3],255);
  const stored=normalizeRecipe({seed:'photo-dark',photoLook:deep});
  assert.deepEqual(decodeRecipe(encodeRecipe(stored)),stored);
  assert.deepEqual(normalizePhotoLook(stored.photoLook),deep);
});
test('deep-black negative lives in the original Light Photo selector',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.equal((html.match(/value="film-negative-deepblack"/g)||[]).length,1);
});

test('new DSLR-inspired acutance uses a bounded source-luma edge field and no false spatial no-op',()=>{
  const width=150,height=90,source=pixels(0,0,0,width,height);
  for(let y=12;y<78;y++)for(let x=35;x<114;x++){
    const at=(y*width+x)*4;
    source[at]=180;source[at+1]=82;source[at+2]=28;
  }
  const neutralParams={contrast:1,saturation:1,shadow:0,highlight:0,
    red:0,green:0,blue:0,grain:0,vignette:0};
  const lens=normalizePhotoLook({enabled:true,presetId:'camera-dslr-optics',
    amount:100,parameters:neutralParams});
  const reference=normalizePhotoLook({enabled:true,presetId:'camera-natural',
    amount:100,parameters:neutralParams});
  assert.equal(isNeutralPhotoLook(lens),false,'optical pass remains active at neutral grade');
  assert.equal(isNeutralPhotoLook(reference),true);
  const first=source.slice(),again=source.slice(),unchanged=source.slice();
  processPhotoPixels(first,width,height,lens,'lens-seed');
  processPhotoPixels(again,width,height,lens,'lens-seed');
  processPhotoPixels(unchanged,width,height,reference,'lens-seed');
  assert.deepEqual(first,again,'reproducible optical edge field');
  assert.deepEqual(unchanged,source,'neutral reference should preserve exact source');
  assert.notDeepEqual(first,source,'lens acuity must do real spatial processing');
  const pixel=(a,x,y,c=0)=>a[(y*width+x)*4+c];
  assert.equal(pixel(first,5,5),0,'flat black field stays black');
  assert.equal(pixel(first,65,40),pixel(source,65,40),'flat stripe centre stays true-colour');
  assert.ok([34,35,36,112,113,114].some(x=>pixel(first,x,40)!==pixel(source,x,40)),
    'only actual high-contrast boundaries should sharpen');
  for(let at=3;at<first.length;at+=4)assert.equal(first[at],source[at],'unchanged alpha');
  const off=source.slice();processPhotoPixels(off,width,height,{...lens,amount:0});
  assert.deepEqual(off,source);
  const saved=normalizeRecipe({seed:'lens-optics',photoLook:lens});
  assert.deepEqual(decodeRecipe(encodeRecipe(saved)),saved);
});
test('independent compact flash lights the center, darkens corners, and preserves black',()=>{
  const w=120,h=180,source=pixels(120,85,40,w,h);
  for(let y=15;y<45;y++)for(let x=15;x<45;x++){
    const at=(y*w+x)*4;
    source[at]=0;source[at+1]=0;source[at+2]=0;
  }
  const look=normalizePhotoLook({enabled:true,presetId:'camera-pocket-flash',
    amount:100,parameters:{grain:0,vignette:0}});
  assert.equal(look.family,'camera');
  assert.equal(look.parameters.grain,0);
  const a=source.slice(),b=source.slice();
  processPhotoPixels(a,w,h,look,'pocket-flash');
  processPhotoPixels(b,w,h,look,'pocket-flash');
  assert.deepEqual(a,b,'deterministic on-axis illumination');
  const at=(x,y)=>(y*w+x)*4;
  assert.ok(a[at(60,90)]>a[at(110,165)]+25,
    'a flat surface must have a distinctive on-axis exposure hotspot');
  assert.deepEqual([...a.slice(at(20,20),at(20,20)+3)],[0,0,0],
    'nonreflective black substrate stays black');
  for(let i=3;i<a.length;i+=4)assert.equal(a[i],255,'alpha untouched');
  const original=source.slice();
  processPhotoPixels(original,w,h,{...look,amount:0},'pocket-flash');
  assert.deepEqual(original,source,'zero amount leaves source alone');
  const neutralFlash=normalizePhotoLook({enabled:true,presetId:'camera-pocket-flash',
    amount:100,parameters:{contrast:1,saturation:1,shadow:0,highlight:0,
      red:0,green:0,blue:0,grain:0,vignette:0}});
  assert.equal(isNeutralPhotoLook(neutralFlash),false,
    'center-weighted spatial flash must survive neutral tonal settings');
  const saved=normalizeRecipe({seed:'camera-flash',photoLook:look});
  assert.deepEqual(decodeRecipe(encodeRecipe(saved)),saved);
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html,/<option value="camera-pocket-flash">/);
  const reviewer=readFileSync(new URL('../scripts/review-photo-looks.mjs',import.meta.url),'utf8');
  assert.match(reviewer,/--focus-flash/);
});
test('DSLR-inspired optic shares the original Photo selector and bounded authored frame',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const code=readFileSync(new URL('../src/photo-look.js',import.meta.url),'utf8');
  assert.equal((html.match(/value="camera-dslr-optics"/g)||[]).length,1);
  assert.match(code,/fieldWidth=Math\.min\(600,width\)/);
  assert.match(code,/fieldHeight=Math\.min\(1300,height/);
  assert.match(code,/const lens=look\.presetId==='camera-dslr-optics'/);
});

// Exact pixel parity across independently graded strips: small, deliberately
// discontinuous image to exercise noise cells, alpha, flash radius and edges.
test('non-spatial Film and Camera strips match the full-frame grading pixel-for-pixel',()=>{
  const width=17,height=43,original=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4,black=(x+y)%13===0;
    original[i]=black?0:(x*19+y*3)%256;
    original[i+1]=black?0:(x*7+y*13)%256;
    original[i+2]=black?0:(x*5+y*11)%256;
    original[i+3]=(x+y)%11===0?124:255;
  }
  for(const presetId of ['film-negative','film-negative-deepblack','film-grain-only',
    'film-mono','camera-natural','camera-hdr','camera-pocket-flash']){
    const look=normalizePhotoLook({enabled:true,presetId,amount:83});
    const expected=original.slice(),actual=original.slice();
    processPhotoPixels(expected,width,height,look,'strip-parity');
    for(let y=0;y<height;y+=7){
      const h=Math.min(7,height-y),strip=original.slice(y*width*4,(y+h)*width*4);
      processPhotoPixels(strip,width,h,look,'strip-parity',
        {frameHeight:height,rowOffset:y});
      actual.set(strip,y*width*4);
    }
    assert.deepEqual(actual,expected,presetId+' pixel parity across strip seams');
  }
});

test('Canvas2D adapter reads no more than 2 MiB per non-spatial strip',()=>{
  const width=2048,height=257,look=normalizePhotoLook({enabled:true,
    presetId:'film-grain-only',amount:70});
  const calls=[];
  const ctx={
    getImageData(x,y,w,h){
      assert.equal(x,0);assert.equal(w,width);
      assert.ok(w*h*4<=2*1024*1024);
      calls.push([y,h]);
      return {data:new Uint8ClampedArray(w*h*4)};
    },
    putImageData(image,x,y){assert.equal(x,0);assert.equal(image.data.length,width*4*calls.at(-1)[1]);}
  };
  assert.equal(applyPhotoFinish(ctx,width,height,look,'large-finish'),true);
  assert.deepEqual(calls,[[0,256],[256,1]]);
});

test('spatial source effects never grade partial frames without a precomputed field',()=>{
  const source=pixels(200,100,20,8,9);
  for(const presetId of ['film-halation-diffusion','camera-webcam-signal',
    'camera-digicam-signal','camera-dslr-optics']){
    const look=normalizePhotoLook({enabled:true,presetId,amount:80});
    const ctx={reads:0,writes:0,
      getImageData(x,y,w,h){assert.deepEqual([x,y,w,h],[0,0,8,9]);this.reads++;return {data:source.slice()};},
      putImageData(_pixels,x,y){assert.deepEqual([x,y],[0,0]);this.writes++;}};
    assert.equal(applyPhotoFinish(ctx,8,9,look,'spatial'),true);
    // All spatial looks now read an unmodified bounded source sample field
    // first, then a separate bounded destination before finishing.
    assert.equal(ctx.reads,2);
    assert.equal(ctx.writes,1);
    assert.throws(()=>processPhotoPixels(source.slice(),8,9,look,'spatial',
      {frameHeight:20,rowOffset:2}),/whole-frame source/);
  }
});

// Halation is a spatial effect, but its emitter field only needs four exact
// original source samples per bounded cell. Verify streaming against the
// pre-existing full-frame algorithm, including the cross-strip halo Y mapping.
test('original and wide halation stream with exact full-frame pixels and bounded reads',()=>{
  const width=1024,height=520,raw=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4;
    const lit=(x>width*.22&&x<width*.68&&Math.abs(y-height*.53)<42)||
      (Math.abs(x-width*.73)<13&&Math.abs(y-height*.75)<90);
    raw[i]=lit?240:0;
    raw[i+1]=lit?((x*7+y)%160+70):0;
    raw[i+2]=lit?30:0;
    raw[i+3]=(x+y)%11===0?160:255;
  }
  for(const presetId of ['film-halation-only','film-halation-diffusion']){
    const look=normalizePhotoLook({enabled:true,presetId,amount:96,
      parameters:{grain:7,halation:90}});
    const expected=raw.slice(),actual=raw.slice(),reads=[];
    processPhotoPixels(expected,width,height,look,'halation-source-parity');
    const ctx={
      getImageData(x,y,w,h){
        assert.equal(x,0);assert.equal(w,width);
        assert.ok(w*h*4<=2*1024*1024,'bounded 2 MiB readback');
        reads.push({y,h});
        return {data:actual.slice(y*width*4,(y+h)*width*4)};
      },
      putImageData(image,x,y){assert.equal(x,0);actual.set(image.data,y*width*4);}
    };
    assert.equal(applyPhotoFinish(ctx,width,height,look,'halation-source-parity'),true);
    assert.ok(reads.length>=4,'read source and destination in multiple strips');
    let difference=-1;
    for(let i=0;i<actual.length;i++)if(actual[i]!==expected[i]){difference=i;break;}
    assert.equal(difference,-1,presetId+' must preserve RGB/alpha at every coordinate');
  }
});

test('partial halation buffers require a precomputed source field',()=>{
  const look=normalizePhotoLook({enabled:true,presetId:'film-halation-only',amount:80});
  assert.throws(()=>processPhotoPixels(pixels(100,40,20,8,9),8,9,look,'partial',
    {frameHeight:20,rowOffset:3}),/Spatial photo finish requires whole-frame source/);
});

// The same small source sample grid is used for full-frame and bounded
// finishing. Check fidelity without fabricating physical-sensor equivalence.
test('Webcam, Digicam and DSLR finish exact pixels with bounded source and output reads',()=>{
  const width=1024,height=520,raw=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4;
    const band=Math.abs((x+Math.round(y*.37))%123-61)<13;
    raw[i]=band?251:(x*13+y*3)%256;
    raw[i+1]=band?57:(x*5+y*11)%256;
    raw[i+2]=band?9:(x*17+y*7)%256;
    raw[i+3]=(x+y)%19===0?111:255;
  }
  for(const presetId of ['camera-webcam-signal','camera-digicam-signal',
    'camera-dslr-optics']){
    const look=normalizePhotoLook({enabled:true,presetId,amount:91,
      parameters:{grain:11,vignette:8}});
    const expected=raw.slice(),actual=raw.slice(),reads=[];
    processPhotoPixels(expected,width,height,look,'spatial-source-parity');
    const ctx={
      getImageData(x,y,w,h){
        assert.equal(x,0);assert.equal(w,width);
        assert.ok(w*h*4<=2*1024*1024,'at most 2 MiB readback');
        reads.push([y,h]);
        return {data:actual.slice(y*width*4,(y+h)*width*4)};
      },
      putImageData(image,x,y){assert.equal(x,0);actual.set(image.data,y*width*4);}
    };
    assert.equal(applyPhotoFinish(ctx,width,height,look,'spatial-source-parity'),true);
    assert.ok(reads.length>=4,presetId+' should read source and write multiple strips');
    let mismatch=-1;
    for(let i=0;i<expected.length;i++)if(expected[i]!==actual[i]){mismatch=i;break;}
    assert.equal(mismatch,-1,presetId+' must preserve all old RGB and alpha bytes');
  }
});
