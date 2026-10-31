import test from 'node:test';
import assert from 'node:assert/strict';
import {hitScatteredRegions,pickScatteredRegion} from '../src/scattered-drag.js';
import {advanceScatteredTapCycle,continuesScatteredTapCycle}
  from '../src/scattered-overlap-cycle.js';
const objects=[
 {id:'region-1',kind:'region',circle:{cx:300,cy:600,r:150}},
 {id:'region-2',kind:'region',circle:{cx:300,cy:600,r:90}},
 {id:'region-3',kind:'region',circle:{cx:300,cy:600,r:40}}
];
test('all overlapping hits preserve actual painter order and old topmost semantics',()=>{
 const original=structuredClone(objects);
 const hits=hitScatteredRegions(objects,{x:300,y:600});
 assert.deepEqual(hits.map(x=>x.id),['region-3','region-2','region-1']);
 assert.equal(pickScatteredRegion(objects,{x:300,y:600})?.id,'region-3');
 assert.deepEqual(objects,original);
 assert.deepEqual(hitScatteredRegions(objects,{x:500,y:600}),[]);
 assert.deepEqual(hitScatteredRegions(objects,{x:NaN,y:600}),[]);
});
test('even-odd holes and islands do not introduce phantom hit targets',()=>{
 const ring=(a,b)=>[{x:a,y:a},{x:b,y:a},{x:b,y:b},{x:a,y:b}];
 const under={id:'region-4',kind:'region',circle:{cx:40,cy:40,r:60}};
 const over={id:'region-5',kind:'region',rings:[
   ring(0,100),ring(25,75),ring(35,45)
 ]};
 assert.deepEqual(hitScatteredRegions([under,over],{x:20,y:20})
   .map(x=>x.id),['region-5','region-4']);
 assert.deepEqual(hitScatteredRegions([under,over],{x:30,y:30})
   .map(x=>x.id),['region-4']);
 assert.deepEqual(hitScatteredRegions([under,over],{x:40,y:40})
   .map(x=>x.id),['region-5','region-4']);
});
test('stationary repeated taps cycle front to back and wrap without editing recipe',()=>{
 const pos={x:160,y:320},hits=hitScatteredRegions(objects,{x:300,y:600});
 const first=advanceScatteredTapCycle(null,hits,pos,1000);
 assert.equal(first.selected.id,'region-3');
 const second=advanceScatteredTapCycle(first.state,hits,{x:168,y:316},1200);
 assert.equal(second.selected.id,'region-2');
 const third=advanceScatteredTapCycle(second.state,hits,pos,1350);
 assert.equal(third.selected.id,'region-1');
 const wrap=advanceScatteredTapCycle(third.state,hits,pos,1450);
 assert.equal(wrap.selected.id,'region-3');
 assert.equal(continuesScatteredTapCycle(first.state,hits,pos,1150),true);
 assert.equal(continuesScatteredTapCycle(first.state,hits,{x:201,y:320},1150),false);
 assert.equal(continuesScatteredTapCycle(first.state,hits,pos,2501),false);
 assert.equal(continuesScatteredTapCycle(first.state,hits,pos,999),false);
 assert.equal(continuesScatteredTapCycle(first.state,hits,hits[0],1150),false);
 assert.deepEqual(objects[0].circle,{cx:300,cy:600,r:150});
});
test('different hit stack, elapsed time or distant tap restarts from top',()=>{
 const hits=hitScatteredRegions(objects,{x:300,y:600});
 const pos={x:50,y:75};
 const first=advanceScatteredTapCycle(null,hits,pos,0);
 for(const [list,point,when] of [
   [hits,pos,1301],[hits,{x:80,y:75},500],
   [hits.slice(1),pos,500],[hits,pos,-1]
 ]){
  const next=advanceScatteredTapCycle(first.state,list,point,when);
  assert.equal(next.selected.id,list[0].id);
 }
 assert.deepEqual(advanceScatteredTapCycle(first.state,[],pos,500),
   {selected:null,state:null});
});
