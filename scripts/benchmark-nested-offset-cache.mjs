#!/usr/bin/env node
// Opt-in matched current-source performance comparison, not a mobile claim.
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {planNestedShapeContours,DEFAULT_NESTED_CONTOURS} from '../src/nested-shape-contours.js';

const clock=fn=>{const t=performance.now();const r=fn();return [performance.now()-t,r];};
const ellipse=(cx,cy,rx,ry,points)=>Array.from({length:points},(_,i)=>{
  const a=i*2*Math.PI/points;
  return {x:cx+rx*Math.cos(a),y:cy+ry*Math.sin(a)};
});
const cloud=(cx,cy,rx,ry,points)=>Array.from({length:points},(_,i)=>{
  const a=i*2*Math.PI/points,r=1+.11*Math.sin(7*a)+.06*Math.cos(13*a);
  return {x:cx+rx*Math.cos(a)*r,y:cy+ry*Math.sin(a)*r};
});
const delta=[
  {x:210,y:0},{x:390,y:580},{x:240,y:440},
  {x:210,y:500},{x:180,y:440},{x:30,y:580}
];
const tests=[
  ['wide-ellipse',ellipse(245,420,220,380,64)],
  ['irregular-cloud',cloud(260,370,200,300,70)],
  ['delta-cutout',[delta,ellipse(210,260,30,45,20)]]
];
for(const [name,shape] of tests){
  const base=()=>planNestedShapeContours(shape,DEFAULT_NESTED_CONTOURS,
    {cacheDistances:false});
  const cached=()=>planNestedShapeContours(shape,DEFAULT_NESTED_CONTOURS);
  assert.deepEqual(base(),cached(),name+' source contour parity');
  // Interleave order so warmup and clock drift are not one-sided.
  for(let i=0;i<1;i++){base();cached();}
  const old=[],now=[];
  for(let i=0;i<3;i++){
    if(i%2){now.push(clock(cached)[0]);old.push(clock(base)[0]);}
    else{old.push(clock(base)[0]);now.push(clock(cached)[0]);}
  }
  const median=xs=>xs.sort((a,b)=>a-b)[1];
  const before=median(old),after=median(now);
  console.log('NESTED_CACHE_BENCH '+JSON.stringify({shape:name,
    withoutCacheMs:+before.toFixed(1),withCacheMs:+after.toFixed(1),
    ratio:+(before/after).toFixed(3),
    nativePixelClaims:false,sourceEquivalent:true}));
}
