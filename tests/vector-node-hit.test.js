import test from 'node:test';
import assert from 'node:assert/strict';
import {vectorNodeTargets,hitVectorEditTarget} from '../src/vector-node-hit.js';
import {normalizeVectorPath,vectorPathFromPolyline} from '../src/vector-path-commands.js';
const project=p=>[p[0]*320,p[1]*700];
const example=normalizeVectorPath({
  space:'normalized-design',closed:false,
  start:{id:'start',point:[.1,.1]},
  segments:[
    {kind:'cubic',to:{id:'bend',point:[.5,.5]},
      controlOut:[.3,.1],controlIn:[.4,.4]},
    {kind:'cubic',to:{id:'end',point:[.9,.9]},
      controlOut:[.6,.6],controlIn:[.7,.9]}
  ],nodeModes:{bend:'aligned'}
});
test('true-node target listing owns stable IDs and both cubic handles',()=>{
  const found=vectorNodeTargets(example);
  assert.deepEqual(found.nodes.map(x=>x.id),['start','bend','end']);
  assert.deepEqual(found.handles.map(x=>[x.id,x.side]),
    [['start','out'],['bend','in'],['bend','out'],['end','in']]);
  assert.equal(found.closed,false);
  assert.equal(vectorNodeTargets({broken:true}),null);
});
test('nearest real anchor outranks any selected tangent control',()=>{
  const p=project(example.segments[0].to.point);
  const hit=hitVectorEditTarget(example,p,{project,selectedId:'bend'});
  assert.equal(hit.kind,'node');assert.equal(hit.id,'bend');
  assert.equal(hit.distanceCss,0);
  assert.deepEqual(hit.overlaps,['bend']);
});
test('selected tangent handles can be grabbed without taking other node controls',()=>{
  const p=project(example.segments[1].controlOut);
  const hit=hitVectorEditTarget(example,p,{project,selectedId:'bend'});
  assert.equal(hit.kind,'handle');assert.equal(hit.id,'bend');
  assert.equal(hit.side,'out');
  const notSelected=hitVectorEditTarget(example,p,{project,selectedId:'start',
    segmentRadiusCss:1});
  assert.ok(!notSelected||notSelected.kind!=='handle');
});
test('closed cubic seam exposes final outgoing and first incoming controls',()=>{
  const closed=normalizeVectorPath({...example,closed:true,
    closing:{kind:'cubic',controlOut:[.95,.5],controlIn:[.03,.3]}});
  const targets=vectorNodeTargets(closed);
  assert.deepEqual(targets.handles.slice(-2).map(x=>[x.id,x.side]),
    [['end','out'],['start','in']]);
  const x=hitVectorEditTarget(closed,project([.03,.3]),
    {project,selectedId:'start'});
  assert.equal(x.kind,'handle');assert.equal(x.id,'start');assert.equal(x.side,'in');
});
test('collapsed corner creates no phantom tangent targets',()=>{
  const corner=normalizeVectorPath({...example,nodeModes:{bend:'corner'},
    segments:[
      {...example.segments[0],controlIn:[.5,.5]},
      {...example.segments[1],controlOut:[.5,.5]}
    ]});
  const targets=vectorNodeTargets(corner);
  assert.deepEqual(targets.handles.map(x=>x.id),['start','end']);
  assert.equal(hitVectorEditTarget(corner,project([.5,.5]),
    {project,selectedId:'bend'}).kind,'node');
});
test('overlapping nodes can be selected by explicit cyclic stable order',()=>{
  const p=vectorPathFromPolyline([[.2,.2],[.7,.5],[.2,.2],[.8,.7]]);
  const pointer=project([.2,.2]);
  const first=hitVectorEditTarget(p,pointer,{project,cycle:0});
  const second=hitVectorEditTarget(p,pointer,{project,cycle:1});
  assert.equal(first.kind,'node');assert.equal(second.kind,'node');
  assert.deepEqual(first.overlaps,['n0','n2']);
  assert.equal(first.id,'n0');assert.equal(second.id,'n2');
  assert.equal(hitVectorEditTarget(p,pointer,{project,cycle:2}).id,'n0');
});
test('segment hit stays on branch under finger at an overlap',()=>{
  const p=vectorPathFromPolyline([[.15,.15],[.85,.85],[.15,.85],[.85,.15]]);
  const x=hitVectorEditTarget(p,project([.72,.28]),
    {project,nodeRadiusCss:8,segmentRadiusCss:12});
  assert.equal(x.kind,'segment');assert.equal(x.segmentIndex,2);
  assert.ok(x.t>0&&x.t<1);
});
test('a pointer can hit explicit closing seam for exact future insertion',()=>{
  const p=vectorPathFromPolyline([[.15,.15],[.8,.15],[.8,.85]],{closed:true});
  const x=hitVectorEditTarget(p,project([.475,.5]),
    {project,nodeRadiusCss:10,segmentRadiusCss:12});
  assert.equal(x.kind,'segment');assert.equal(x.segmentIndex,2);
});
test('hit thresholds are CSS-only and invariant under projection zoom',()=>{
  const p=project(example.start.point);
  const hit=hitVectorEditTarget(example,[p[0]+15,p[1]],
    {project,nodeRadiusCss:22});
  assert.equal(hit.id,'start');
  const zoomed=point=>{const [x,y]=project(point);return [x*2,y*2];};
  const hit2=hitVectorEditTarget(example,[p[0]*2+15,p[1]*2],
    {project:zoomed,nodeRadiusCss:22});
  assert.equal(hit2.id,'start');
  assert.equal(hit2.distanceCss,15);
});
test('invalid projections, pointers, tolerances and hostile geometry fail closed',()=>{
  assert.equal(hitVectorEditTarget(example,[Infinity,0],{project}),null);
  assert.equal(hitVectorEditTarget(example,[1,2],{project:()=>[NaN,NaN]}),null);
  assert.equal(hitVectorEditTarget(example,[1,2],{project,nodeRadiusCss:-1}),null);
  assert.equal(hitVectorEditTarget(example,[1,2],{project,cycle:-1}),null);
  assert.equal(hitVectorEditTarget(example,[1,2],{project:null}),null);
  assert.equal(hitVectorEditTarget({invalid:true},[1,2],{project}),null);
});
