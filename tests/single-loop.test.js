import test from 'node:test';
import assert from 'node:assert/strict';
import {GEOMETRIES,LOCKABLE_SETTINGS,normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';
import {pathPosition,samplePath} from '../src/path-geometry.js';

const near=(actual,expected,tol=.001)=>assert.ok(Math.abs(actual-expected)<=tol,
  `expected ${actual} to be within ${tol} of ${expected}`);
const sample=(stripe,u,extent)=>pathPosition(stripe,(2*u-1)*extent,extent);
const unit=(a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy);return [dx/n,dy/n];};
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];

test('single-loop is independent from repeating loops and persists all its parameters',()=>{
  assert.ok(GEOMETRIES.includes('loop'));
  assert.ok(GEOMETRIES.includes('loops'));
  for(const key of ['loopRadius','loopSweep'])assert.ok(LOCKABLE_SETTINGS.includes(key));
  const input={geometry:'loop',loopRadius:77,loopSweep:405,geometrySafety:false,seed:'one-turn'};
  const recipe=normalizeRecipe(input),decoded=decodeRecipe(encodeRecipe(recipe));
  assert.equal(decoded.geometry,'loop');
  assert.equal(decoded.loopRadius,77);
  assert.equal(decoded.loopSweep,405);
  assert.equal(decoded.geometrySafety,false);
  assert.equal(normalizeRecipe({loopRadius:-50,loopSweep:200}).loopRadius,0);
  assert.equal(normalizeRecipe({loopRadius:250,loopSweep:600}).loopSweep,450);
  assert.equal(normalizeRecipe({}).loopSweep,360);
});

test('a single loop joins its incoming line and outgoing tangent without kinks',()=>{
  for(const sweep of [240,300,360,405,450]){
    const scene=resolveScene({seed:'loop-smooth',geometry:'loop',loopSweep:sweep,
      loopRadius:50,spread:35,individuality:0,geometrySafety:true});
    const stripe=scene.stripes[3],r=stripe.loopRadius;
    const circle=r*sweep*Math.PI/180,approach=900,total=approach+circle+1070;
    const enter=approach/total,exit=(approach+circle)/total;
    const at=u=>sample(stripe,u,scene.extent);
    const e=0.00005;
    for(const junction of [enter,exit]){
      const before=unit(at(junction-e),at(junction));
      const after=unit(at(junction),at(junction+e));
      assert.ok(dot(before,after)>.999,
        `sweep ${sweep}: continuous tangent at ${junction}`);
      // Same arc-length speed through both joins.
      const a=at(junction-e),b=at(junction),c=at(junction+e);
      const l1=Math.hypot(b.x-a.x,b.y-a.y);
      const l2=Math.hypot(c.x-b.x,c.y-b.y);
      assert.ok(Math.abs(l1-l2)<.02,`constant speed at sweep ${sweep}`);
    }
  }
});

test('at 360° the path makes exactly one circle with straight approach and departure',()=>{
  const scene=resolveScene({seed:'one-circle',geometry:'loop',loopSweep:360,loopRadius:50,
    individuality:0,chaos:0,orientation:'vertical'});
  const stripe=scene.stripes[3],r=stripe.loopRadius,total=900+2*Math.PI*r+1070;
  const enter=900/total,exit=(900+2*Math.PI*r)/total;
  const at=u=>sample(stripe,u,scene.extent);
  const p=at(enter),q=at(exit);
  near(p.x,-r);near(p.y,-180);
  near(q.x,p.x);near(q.y,p.y);
  for(let i=0;i<=48;i++){
    const pos=at(enter+(exit-enter)*i/48);
    near(Math.hypot(pos.x,pos.y+180),r,.00001);
  }
  const top=at(0),bottom=at(1);
  near(top.x,-r);near(bottom.x,-r);
  assert.ok(top.y<-900 && bottom.y>600,'long entry and exit legs');
});

test('loop sweep changes the outgoing direction but not the entry leg',()=>{
  const input={seed:'one-loop-sweep',geometry:'loop',orientation:'vertical',
    loopRadius:58,individuality:0};
  const a=resolveScene({...input,loopSweep:270}),b=resolveScene({...input,loopSweep:420});
  const one=a.stripes[3],two=b.stripes[3];
  near(sample(one,0,a.extent).x,sample(two,0,b.extent).x);
  near(sample(one,0,a.extent).y,sample(two,0,b.extent).y);
  const endA=sample(one,1,a.extent),endB=sample(two,1,b.extent);
  assert.ok(Math.hypot(endA.x-endB.x,endA.y-endB.y)>200);
});

test('the seven ribbons remain normal-offset and nested around the single loop',()=>{
  const scene=resolveScene({seed:'seven-loop-bands',geometry:'loop',loopSweep:360,
    loopRadius:70,spread:72,geometrySafety:true,individuality:0});
  const a=scene.stripes[2],b=scene.stripes[3],r=a.loopRadius,total=900+2*Math.PI*r+1070;
  const u=(900+Math.PI*r)/total;
  const t=(2*u-1)*scene.extent;
  const p=samplePath(a,t,scene.extent),q=samplePath(b,t,scene.extent);
  near(Math.hypot(p.x-q.x,p.y-q.y),b.center-a.center,.001);
  near(p.tx,q.tx,.00001);near(p.ty,q.ty,.00001);
});

test('coherent loop radius stays nested and fits 600px canvas at all slider ends',()=>{
  for(const spread of [0,25,50,75,100])for(const loopRadius of [0,50,100]){
    const scene=resolveScene({seed:'single-loop-safe',geometry:'loop',spread,
      loopRadius,geometrySafety:true});
    const r=scene.stripes[0].loopRadius;
    const pack=scene.stripes.at(-1).center-scene.stripes[0].center;
    assert.ok(r-pack*.57>=-.001,`no inverted inner loop at ${spread}/${loopRadius}`);
    assert.ok(r+pack/2<=258+.001,`no off-frame outer loop at ${spread}/${loopRadius}`);
  }
  const safe=resolveScene({seed:'single-loop-bounds',geometry:'loop',
    loopRadius:100,spread:100,geometrySafety:true});
  const free=resolveScene({...safe,loopRadius:100,geometrySafety:false});
  assert.ok(free.stripes[0].loopRadius>safe.stripes[0].loopRadius+50);
});

test('existing continuous loops geometry keeps its independent repeating-wave parameters',()=>{
  const repeating=resolveScene({seed:'unchanged-loops',geometry:'loops',
    shapeFrequency:65,shapeDepth:73});
  const another=resolveScene({seed:'unchanged-loops',geometry:'loops',
    shapeFrequency:65,shapeDepth:73,loopRadius:100,loopSweep:450});
  for(let i=0;i<7;i++){
    assert.equal(repeating.stripes[i].loopPeriod,another.stripes[i].loopPeriod);
    assert.equal(repeating.stripes[i].loopAmplitude,another.stripes[i].loopAmplitude);
    const t=123;
    assert.deepEqual(pathPosition(repeating.stripes[i],t,repeating.extent),
      pathPosition(another.stripes[i],t,another.extent));
  }
});
