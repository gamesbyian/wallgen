#!/usr/bin/env node
// Repeatable, opt-in matched Auto-fit timing. Run on one Node/Linux runner;
// no claims about physical Pixel speed, startup or actual bitmap rendering.
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {fitNestedShapeContours,DEFAULT_NESTED_CONTOURS} from '../src/nested-shape-contours.js';
const box=(w,h)=>[{x:0,y:0},{x:w,y:0},{x:w,y:h},{x:0,y:h}];
const delta=[{x:160,y:2},{x:300,y:280},{x:184,y:208},
  {x:160,y:244},{x:136,y:208},{x:20,y:280}];
const ellipse=(rx,ry,n)=>Array.from({length:n},(_,i)=>{
  const a=2*Math.PI*i/n;return {x:150+rx*Math.cos(a),y:150+ry*Math.sin(a)};
});
const fixtures=[
  ['narrow-rectangle',box(300,42)],
  ['wide-rectangle',box(360,200)],
  ['pointed-delta',delta],
  ['thin-ellipse-72',ellipse(130,35,72)],
  ['thin-ellipse-256',ellipse(130,35,256)],
  ['donut',[box(260,260),box(90,90).map(p=>({x:p.x+90,y:p.y+90}))]]
];
function run(shape,settings,mode){
 const started=performance.now();
 const result=fitNestedShapeContours(shape,settings,
  mode==='baseline'?{earlyExit:false}:{});
 return {elapsed:performance.now()-started,result};
}
for(const [name,shape] of fixtures){
 const settings={...DEFAULT_NESTED_CONTOURS};
 // One warm-up, then alternate order. Keep the expensive detailed checks
 // bounded to two iterations on the shared CI runner.
 run(shape,settings,'baseline');run(shape,settings,'fast');
 const times={baseline:[],fast:[]};
 const n=name==='thin-ellipse-256'?2:3;
 for(let i=0;i<n;i++){
  for(const mode of i%2?['fast','baseline']:['baseline','fast']){
   const observation=run(shape,settings,mode);
   times[mode].push(observation.elapsed);
   assert.deepEqual(observation.result,
     fitNestedShapeContours(shape,settings,{earlyExit:false}),
     'exact algorithmic equivalence');
  }
 }
 const med=arr=>arr.slice().sort((a,b)=>a-b)[Math.floor(arr.length/2)];
 const baseline=med(times.baseline),fast=med(times.fast);
 console.log('NESTED_FIT_BENCH '+JSON.stringify({
  fixture:name,baselineMs:+baseline.toFixed(1),fastMs:+fast.toFixed(1),
  ratio:+(baseline/fast).toFixed(2),
  deviceTested:false,exactDecisionParity:true
 }));
}
