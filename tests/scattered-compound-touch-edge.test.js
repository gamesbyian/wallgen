import test from 'node:test';
import assert from 'node:assert/strict';
import {hitScatteredRegions,pickScatteredRegion}
  from '../src/scattered-drag.js';

const square=(left,top,right,bottom)=>[
  {x:left,y:top},{x:right,y:top},{x:right,y:bottom},{x:left,y:bottom}
];
const compound={id:'region-2',kind:'region',rings:[
  square(0,0,100,100),square(25,25,75,75),
  square(40,40,60,60),square(150,20,170,40)
]};
const back={id:'region-1',kind:'region',circle:{cx:50,cy:50,r:80}};
const scene=[back,compound];
const ids=(point,tolerance=0)=>hitScatteredRegions(scene,point,tolerance)
  .map(object=>object.id);

test('exterior touch tolerance reaches an imported silhouette edge only',()=>{
  const original=structuredClone(scene);
  assert.deepEqual(ids({x:-3,y:50}),['region-1']);
  assert.deepEqual(ids({x:-3,y:50},2),['region-1']);
  assert.deepEqual(ids({x:-3,y:50},3),['region-2','region-1']);
  assert.deepEqual(ids({x:103,y:50},4),['region-2','region-1']);
  assert.deepEqual(ids({x:104.1,y:50},4),['region-1']);
  assert.deepEqual(scene,original,'hit testing must never mutate authored geometry');
});

test('cutout interiors stay transparent even within touch reach of their rim',()=>{
  for(const point of [{x:26,y:50},{x:39,y:50},{x:74,y:50}]){
    assert.deepEqual(ids(point,15),['region-1']);
    assert.equal(pickScatteredRegion([compound],point,15),null);
  }
  assert.deepEqual(ids({x:50,y:50},15),['region-2','region-1'],
    'an intentional inner island remains selectable');
});

test('detached islands use real polygon edges and preserve front-to-back order',()=>{
  assert.deepEqual(ids({x:173,y:30},3),['region-2']);
  assert.deepEqual(ids({x:173.01,y:30},3),[]);
  assert.deepEqual(ids({x:160,y:30}),['region-2']);
  assert.deepEqual(ids({x:180,y:30},3),[]);
});

test('degenerate and invalid rings cannot acquire distant phantom touch targets',()=>{
  const damaged={id:'region-3',kind:'region',rings:[
    [{x:0,y:0},{x:0,y:0},{x:0,y:0}],
    [{x:NaN,y:0},{x:NaN,y:10},{x:NaN,y:30}],
    [{x:1,y:1}]
  ]};
  assert.deepEqual(hitScatteredRegions([damaged],{x:100,y:100},12),[]);
  assert.deepEqual(hitScatteredRegions([compound],{x:105,y:50},NaN),[]);
  assert.deepEqual(hitScatteredRegions([compound],{x:105,y:50},-10),[]);
  assert.deepEqual(hitScatteredRegions([compound],{x:NaN,y:50},20),[]);
});
