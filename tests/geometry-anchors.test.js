import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';
import {stripeAnchorCoordinate,groupAnchorCoordinate} from '../src/geometry-anchors.js';

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
