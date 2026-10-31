import test from 'node:test';
import assert from 'node:assert/strict';
import {snapScatteredCentre} from '../src/scattered-centre-snap.js';
const scene=[
  {id:'region-1',kind:'region',circle:{cx:100,cy:100,r:30}},
  {id:'region-2',kind:'region',editCircle:{cx:200,cy:400,r:25}},
  {id:'not-a-region',kind:'texture',circle:{cx:215,cy:427,r:2}}
];
const view={canvasWidth:600,canvasHeight:1300,cssWidth:300,cssHeight:650};
const recipe={viewZoom:1,viewPanX:0,viewPanY:0,positionX:0,positionY:0};
const snap=(point,options={},otherScene=scene,otherView=view,otherRecipe=recipe)=>
  snapScatteredCentre(point,otherScene,'region-1',otherRecipe,otherView,
    {enabled:true,...options});

test('alignment is independently acquired in real CSS-screen units',()=>{
  const original=structuredClone(scene),proposal=[214,427];
  const result=snap(proposal);
  assert.deepEqual(result.point,[200,427]);
  assert.equal(result.locks.x.id,'region-2');
  assert.equal(result.locks.y,null);
  assert.deepEqual(proposal,[214,427]);
  assert.deepEqual(scene,original);
});

test('hysteresis retains then releases one target without any accumulated drift',()=>{
  const first=snap([214,427]);
  const held=snap([224,427],{previous:first.locks});
  assert.equal(held.point[0],200);
  const released=snap([230,427],{previous:held.locks});
  assert.equal(released.point[0],230);
  assert.equal(released.locks.x,null);
});

test('axis constraint excludes the frozen source dimension',()=>{
  const result=snap([214,407],{axis:'y'});
  assert.deepEqual(result.point,[214,400]);
  assert.equal(result.locks.x,null);
  assert.equal(result.locks.y.id,'region-2');
});

test('same CSS threshold works under zoom, camera pan and unequal display aspect',()=>{
  assert.equal(snap([214,427]).locks.x.id,'region-2');
  assert.equal(snap([214,427],{},scene,view,{...recipe,viewZoom:2}).locks.x,null);
  assert.deepEqual(snap([214,427],{},scene,view,
    {...recipe,viewPanX:22,viewPanY:-18}).point,[200,427]);
  const squeezed={...view,cssHeight:500};
  assert.deepEqual(snap([210,413],{},scene,squeezed).point,[200,400]);
});

test('art centre guides work without inventing a region or changing source',()=>{
  const centred=snap([307,649],{},[]);
  assert.deepEqual(centred.point,[300,650]);
  assert.equal(centred.locks.x.id,'design-centre');
  assert.equal(centred.locks.y.id,'design-centre');
});

test('disabled, invalid or missing targets fail closed',()=>{
  assert.deepEqual(snapScatteredCentre([214,427],scene,'region-1',recipe,view),
    {point:[214,427],locks:{x:null,y:null}});
  assert.deepEqual(snap([214,427],{},scene,{...view,cssWidth:0}).point,[214,427]);
  assert.equal(snap([NaN,10]).point,null);
  assert.deepEqual(snap([800,1100],{},[{}]).point,[800,1100]);
});
