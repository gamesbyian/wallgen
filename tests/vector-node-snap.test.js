import test from 'node:test';
import assert from 'node:assert/strict';
import {snapVectorNode,SNAP_ACQUIRE_CSS,SNAP_RELEASE_CSS} from '../src/vector-node-snap.js';
const nodes=[{id:'a',point:[.2,.3]},{id:'b',point:[.6,.7]}];
const project=([x,y])=>[x*400,y*700];
test('snap acquires independently on each CSS-projected screen axis',()=>{
  const p=[.218,.692],s=snapVectorNode(p,nodes,{project,enabled:true});
  assert.deepEqual(s.point,[.2,.7]);
  assert.equal(s.locks.x.id,'a');
  assert.equal(s.locks.y.id,'b');
  assert.deepEqual(p,[.218,.692]);
  assert.equal(SNAP_ACQUIRE_CSS,8);
  assert.equal(SNAP_RELEASE_CSS,14);
});
test('snap release hysteresis holds until drift exceeds threshold',()=>{
  const p=[.218,.5];
  const a=snapVectorNode(p,nodes,{project,enabled:true});
  assert.equal(a.locks.x.id,'a');
  const follow=snapVectorNode([.229,.5],nodes,{project,enabled:true,previous:a.locks});
  assert.equal(follow.locks.x.id,'a');
  const released=snapVectorNode([.24,.5],nodes,{project,enabled:true,previous:follow.locks});
  assert.equal(released.locks.x,null);
  assert.equal(released.point[0],.24);
});
test('direction constraint protects frozen axis while allowing snap on moving axis',()=>{
  const original=[.218,.692];
  const x=snapVectorNode(original,nodes,{project,enabled:true,axis:'x'});
  assert.deepEqual(x.point,[.2,.692]);
  assert.equal(x.locks.y,null);
  const y=snapVectorNode(original,nodes,{project,enabled:true,axis:'y'});
  assert.deepEqual(y.point,[.218,.7]);
  assert.equal(y.locks.x,null);
});
test('zoom changes snap sensitivity in design coordinates, not CSS hit radius',()=>{
  const nearby=[.218,.5];
  const at1=snapVectorNode(nearby,nodes,{project,enabled:true});
  const at3=snapVectorNode(nearby,nodes,{project:p=>project(p).map(x=>x*3),enabled:true});
  assert.equal(at1.locks.x.id,'a');
  assert.equal(at3.locks.x,null);
});
test('disabled/invalid snap returns source coordinates, never stores screen pixels',()=>{
  const p=[.23,.3];
  assert.deepEqual(snapVectorNode(p,nodes,{project}),{point:p,locks:{x:null,y:null}});
  assert.equal(snapVectorNode([NaN,.2],nodes,{project,enabled:true}).point,null);
  assert.deepEqual(snapVectorNode(p,nodes,{project:()=>[Infinity,3],enabled:true}).point,p);
  assert.deepEqual(snapVectorNode(p,[{id:'bad',point:[NaN,.5]}],{project,enabled:true}).point,p);
});
