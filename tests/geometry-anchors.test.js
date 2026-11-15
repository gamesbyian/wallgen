import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';
import {stripeAnchorCoordinate,groupAnchorCoordinate,bandAnchorCoordinate} from '../src/geometry-anchors.js';
import {balanceStripeEnds} from '../src/renderer.js';

const close=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-7,message+' ('+a+' vs '+b+')');
const stripeByName=(scene,name)=>scene.stripes.find(s=>s.name===name);
test('choosing any stripe anchor does not move existing ink; further spread preserves selected colour',()=>{
  for(const geometry of ['straight','wave','hairpin','loop','drawn'])
    for(const reverseStripes of [false,true])
      for(const anchor of ['red','green','violet','centre']){
        const source={seed:'anchor-nonlinear',geometry,reverseStripes,
          orientation:'vertical',chaos:85,spread:30};
        const original=resolveScene(source);
        const name=anchor[0].toUpperCase()+anchor.slice(1);
        const pin=anchor==='centre'?
          (original.stripes[0].center+original.stripes.at(-1).center)/2:
          stripeByName(original,name).center;
        const withAnchor={...source,spreadAnchor:anchor,spreadAnchorPosition:pin};
        const selected=resolveScene(withAnchor);
        selected.stripes.forEach((stripe,i)=>close(stripe.center,original.stripes[i].center,'selection cannot jump '+anchor));
        const expanded=resolveScene({...withAnchor,spread:94});
        if(anchor==='centre')
          close((expanded.stripes[0].center+expanded.stripes.at(-1).center)/2,pin,'rainbow midpoint remains fixed');
        else close(stripeByName(expanded,name).center,pin,'pinned '+name+' must stay at authored position');
        assert.ok(expanded.stripes.every(stripe=>Number.isFinite(stripe.center)));
      }
});
test('group first/centre/last anchors preserve their coordinates as spacing, spread and count change',()=>{
  for(const anchor of ['first','centre','last']){
    const source={seed:'groups-anchored',composition:'repeat',repeatCount:4,repeatSpacing:25,spread:38};
    const original=resolveScene(source),pin=groupAnchorCoordinate(original.bundleOffsets,anchor);
    const recipe={...source,repeatAnchor:anchor,repeatAnchorPosition:pin};
    const selected=resolveScene(recipe);
    original.bundleOffsets.forEach((value,i)=>close(selected.bundleOffsets[i],value,'selection cannot move group'));
    for(const repeatCount of [2,4,6]){
      const varied=resolveScene({...recipe,repeatCount,repeatSpacing:91,spread:68});
      close(groupAnchorCoordinate(varied.bundleOffsets,anchor),pin,anchor+' group stays put');
    }
  }
});
test('anchors survive saved recipe transport and invalid references cannot poison geometry',()=>{
  const recipe=normalizeRecipe({seed:'portable-anchors',spreadAnchor:'red',
    spreadAnchorPosition:-172.25,repeatAnchor:'first',repeatAnchorPosition:64,
    repeatCount:4,composition:'repeat'});
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
  assert.deepEqual(resolveScene(recipe).bundleOffsets,resolveScene(recipe).objects.map(g=>g.offset));
  const broken=normalizeRecipe({...recipe,spreadAnchor:'purple',
    spreadAnchorPosition:Infinity,repeatAnchorPosition:NaN});
  assert.equal(broken.spreadAnchor,undefined);
  assert.equal(broken.repeatAnchorPosition,undefined);
  assert.ok(resolveScene(broken).stripes.every(s=>Number.isFinite(s.center)));
  const legacy=normalizeRecipe({});
  assert.equal(legacy.spreadAnchor,undefined);
  assert.equal(legacy.repeatAnchor,undefined);
  close(stripeAnchorCoordinate([-3,-2,-1,.1,1.2,2,3],'green',true),.1,'middle slot');
});

test('ribbon thickness can grow while holding a semantic outer edge or band centre',()=>{
  for(const reverseStripes of [false,true])
    for(const anchor of ['centre','red-edge','violet-edge']){
      const base={seed:'width-anchors',stripeWidth:35,spread:52,
        reverseStripes,construction:'ribbon',chaos:76};
      const original=resolveScene(base);
      const coordinate=bandAnchorCoordinate(original.stripes,anchor);
      const recipe={...base,widthAnchor:anchor,
        widthAnchorBasis:base.stripeWidth,widthAnchorOffset:0};
      const chosen=resolveScene(recipe);
      chosen.stripes.forEach((stripe,i)=>close(stripe.center,original.stripes[i].center,
        'choosing width anchor must not move art'));
      const changed=resolveScene({...recipe,stripeWidth:88});
      close(bandAnchorCoordinate(changed.stripes,anchor),coordinate,
        anchor+' boundary must remain at selected world coordinate');
      assert.ok(changed.stripes.some((stripe,i)=>stripe.width!==original.stripes[i].width));
    }
});

test('floating endpoint anchors hold every visible stripe when length is shortened',()=>{
  for(const anchor of ['start','centre','end']){
    const base={seed:'floating-length-anchors',composition:'floating',
      geometry:'straight',orientation:'vertical',pathLength:72,spread:35,
      individuality:45};
    const original=resolveScene(base);
    const endpoints=scene=>scene.stripes.map(s=>{
      const stripe={...s};
      balanceStripeEnds(scene,stripe,false);
      return stripe.hidden?null:{start:stripe.segmentStart,end:stripe.segmentEnd};
    });
    const before=endpoints(original);
    const points=before.map(e=>!e?null:anchor==='start'?e.start:
      anchor==='end'?e.end:(e.start+e.end)/2);
    const recipe={...base,pathLengthAnchor:anchor,pathLengthAnchorPoints:points};
    const chosen=endpoints(resolveScene(recipe));
    before.forEach((e,i)=>{
      if(!e)return;
      close(chosen[i].start,e.start,'selecting endpoint anchor cannot jump start');
      close(chosen[i].end,e.end,'selecting endpoint anchor cannot jump end');
    });
    const shortened=endpoints(resolveScene({...recipe,pathLength:25}));
    shortened.forEach((e,i)=>{
      if(!e||points[i]===null)return;
      const coordinate=anchor==='start'?e.start:anchor==='end'?e.end:(e.start+e.end)/2;
      close(coordinate,points[i],anchor+' must preserve world-station endpoint');
    });
    assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),
      normalizeRecipe(recipe));
  }
});

test('repeat anchors stay dormant for single and floating compositions',()=>{
  const withAnchor={seed:'repeat-mode-guard',repeatAnchor:'first',
    repeatAnchorPosition:-240,repeatCount:5,repeatSpacing:88};
  assert.deepEqual(resolveScene({...withAnchor,composition:'single'}).bundleOffsets,[0]);
  assert.deepEqual(resolveScene({...withAnchor,composition:'floating'}).bundleOffsets,[0]);
  assert.equal(resolveScene({...withAnchor,composition:'repeat'}).bundleOffsets[0],-240);
});

test('width and spread anchors compose without double-counting either reference',()=>{
  const source={seed:'anchor-combination',spread:28,stripeWidth:36,chaos:72,
    geometry:'straight',orientation:'vertical',reverseStripes:true};
  const initial=resolveScene(source);
  const red=initial.stripes.find(s=>s.name==='Red').center;
  const both={...source,spreadAnchor:'red',spreadAnchorPosition:red,
    widthAnchor:'violet-edge',widthAnchorBasis:source.stripeWidth,widthAnchorOffset:0};
  let scene=resolveScene(both);
  scene.stripes.forEach((stripe,i)=>close(stripe.center,initial.stripes[i].center,'two anchors selection must not shift'));
  const violetEdge=bandAnchorCoordinate(scene.stripes,'violet-edge');
  const thickened={...both,stripeWidth:90};
  scene=resolveScene(thickened);
  close(bandAnchorCoordinate(scene.stripes,'violet-edge'),violetEdge,'width action pins edge');
  // Selecting the Red anchor AFTER the width has changed uses the pre-width
  // geometric coordinate; otherwise the width translation gets applied twice.
  const unwidth=resolveScene({...thickened,widthAnchor:undefined,
    widthAnchorBasis:undefined,widthAnchorOffset:undefined});
  const captured=unwidth.stripes.find(s=>s.name==='Red').center;
  const reanchored={...thickened,spreadAnchor:'red',spreadAnchorPosition:captured};
  close(resolveScene(reanchored).stripes.find(s=>s.name==='Red').center,
    scene.stripes.find(s=>s.name==='Red').center,'reselecting spread anchor cannot jump');
  const expanded=resolveScene({...reanchored,spread:78});
  close(expanded.stripes.find(s=>s.name==='Red').center,
    scene.stripes.find(s=>s.name==='Red').center,'spread action preserves Red with width anchor active');
});
