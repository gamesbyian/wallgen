#!/usr/bin/env node
// Optional deterministic path-preparation microbenchmark; never a CI gate.
// A multi-line text object needn't rebuild the same immutable Draw/Hairpin/
// Loop source station table four times. Time both methods on this machine.
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {prepareTextFollowPath,layoutTextOnPath} from '../src/text-path-geometry.js';
const points=[[.04,.35],[.14,.30],[.36,.44],[.61,.59],[.87,.35],[.97,.44]];
const lines=['THE RAINBOW','CURVES THROUGH','A HOME SCREEN','IN FOUR LINES'];
const measure=unit=>[...unit].length*18;
const rounds=100;
function round(mode,useShared){
  const item={id:'micro',text:lines.join('\n'),size:61,path:mode,
    pathHeight:130,x:50,y:50};
  let signature=0;
  const start=performance.now();
  for(let repeat=0;repeat<rounds;repeat++){
    const prepared=useShared?prepareTextFollowPath(item,points):undefined;
    for(const line of lines){
      const layout=layoutTextOnPath(item,line,measure,points,
        useShared?{preparedPath:prepared}:{});
      assert.equal(layout.supported,true);
      for(const glyph of layout.glyphs)
        signature+=glyph.x+glyph.y+glyph.angle+glyph.advance;
    }
  }
  return {ms:performance.now()-start,signature};
}
const results=[];
for(const mode of ['drawn','hairpin','loop']){
  // Small warmup so startup jitter is not confused with geometry work.
  const warmup=round(mode,true);
  const old=round(mode,false),next=round(mode,true);
  assert.ok(Math.abs(old.signature-next.signature)<.000001,
    'Cached multiline layout must be numerically identical');
  results.push({mode,rounds,lines:lines.length,
    previousMilliseconds:Number(old.ms.toFixed(3)),
    sharedMilliseconds:Number(next.ms.toFixed(3)),
    speedup:Number((old.ms/next.ms).toFixed(2)),
    signatureVerified:true,warmupMs:Number(warmup.ms.toFixed(3))});
}
console.log('TEXT_CURVE_PREP_BENCH '+JSON.stringify(results));
