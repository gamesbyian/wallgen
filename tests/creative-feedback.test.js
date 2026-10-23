import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldOfferCreativeQuestion} from '../src/creative-feedback.js';

test('export can offer one-click response each time, intermittently or never',()=>{
  assert.equal(shouldOfferCreativeQuestion('export',{frequency:'every'}),true);
  assert.equal(shouldOfferCreativeQuestion('export',{frequency:'never'}),false);
  assert.equal(shouldOfferCreativeQuestion('export',{frequency:'occasionally',eligibleCount:1}),true);
  assert.equal(shouldOfferCreativeQuestion('export',{frequency:'occasionally',eligibleCount:2}),false);
  assert.equal(shouldOfferCreativeQuestion('export',{frequency:'occasionally',eligibleCount:4}),true);
});
test('replacement survey requires substantial manual edits, engaged time and unexported final',()=>{
  const good={manualEdits:3,engagedMs:45000,finalExported:false};
  assert.equal(shouldOfferCreativeQuestion('superseded',good),true);
  for(const bad of [{manualEdits:2},{engagedMs:44999},{finalExported:true}])
    assert.equal(shouldOfferCreativeQuestion('superseded',{...good,...bad}),false);
  assert.equal(shouldOfferCreativeQuestion('wrong',good),false);
});

test('a pending PNG export suppresses the misleading abandoned-design survey',()=>{
  const good={manualEdits:3,engagedMs:45000,finalExported:false,finalExportPending:false};
  assert.equal(shouldOfferCreativeQuestion('superseded',good),true);
  assert.equal(shouldOfferCreativeQuestion('superseded',
    {...good,finalExportPending:true}),false);
});
