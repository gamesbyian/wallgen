import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';
import {pathPosition,modulation,widthAt} from '../src/path-geometry.js';
import {randomizeScope} from '../src/scoped-random.js';

test('coherent geometry is the default, and unrestricted choice survives regeneration',()=>{
  assert.equal(normalizeRecipe({}).geometrySafety,true);
  for(const geometrySafety of [true,false]){
    const r=normalizeRecipe({seed:'safety-toggle',geometry:'loops',geometrySafety,shapeDepth:100});
    assert.equal(decodeRecipe(encodeRecipe(r)).geometrySafety,geometrySafety);
    assert.equal(resolveScene(r).geometrySafety,geometrySafety);
  }
});
test('unrestricted hand-drawn stripe spacing uses requested range while safety caps dangerous bends',()=>{
  const options={seed:'safety-drawn',geometry:'drawn',spread:100,
    customPath:[[.25,.08],[.24,.28],[.6,.6],[.76,.8],[.79,.25]]};
  const safe=resolveScene({...options,geometrySafety:true});
  const free=resolveScene({...options,geometrySafety:false});
  const span=scene=>scene.stripes.at(-1).center-scene.stripes[0].center;
  assert.ok(span(free)>=span(safe));
  assert.ok(span(free)>span(safe)*1.15,'unrestricted permits visibly wider offset pack');
});
test('loop height remains responsive while unrestricted can exceed safe separation',()=>{
  const input={seed:'loop-audit',geometry:'loops',orientation:'vertical',
    composition:'repeat',repeatCount:6,shapeFrequency:50};
  const low=resolveScene({...input,shapeDepth:0,geometrySafety:true});
  const max=resolveScene({...input,shapeDepth:100,geometrySafety:true});
  const free=resolveScene({...input,shapeDepth:100,geometrySafety:false});
  assert.ok(max.stripes[3].loopAmplitude>low.stripes[3].loopAmplitude,
    'no fully saturated slider in safe mode');
  assert.ok(free.stripes[3].loopAmplitude>max.stripes[3].loopAmplitude,
    'unrestricted reaches exaggerated loops');
});
test('arc frequency changes the actual modulation curve',()=>{
  const extent=900;
  const sample=(period)=>Array.from({length:80},(_,i)=>
    modulation(-extent+2*extent*i/79,'arc',0,period,40,extent));
  assert.notDeepEqual(sample(500),sample(100));
  assert.ok(sample(100).every(Number.isFinite));
});
test('stroke thickness slider does not saturate at six pixels',()=>{
  const base={seed:'stroke-audit',geometry:'straight',construction:'stroke',
    orientation:'vertical',chaos:0,individuality:0};
  const sizes=[0,25,50,75,100].map(stripeWidth=>
    resolveScene({...base,stripeWidth}).stripes[3].width);
  assert.ok(sizes.every((x,i)=>!i||x>sizes[i-1]),JSON.stringify(sizes));
  assert.ok(sizes.at(-1)>6);
});
test('extreme individuality preserves selected geometry family',()=>{
  for(const geometry of ['wave','zigzag','chevron','stepped','jagged','contour','arc']){
    const s=resolveScene({seed:'family-identity',geometry,individuality:100,chaos:100});
    assert.ok(s.stripes.every(stripe=>stripe.geometry===geometry),geometry);
  }
});
test('small nonzero end tapers are distinct, not flattened to ten percent',()=>{
  const stripe={width:20,taper:0,edgePhase:0,phase:0,segmentStart:-100,segmentEnd:100};
  const values=[0,1,3,5,10,20].map(endTaper=>
    widthAt({...stripe,endTaper},99.5,100));
  assert.ok(new Set(values.map(n=>n.toFixed(6))).size>=5,JSON.stringify(values));
});
test('nearby randomization respects physical angular and count bounds',()=>{
  const input=normalizeRecipe({textureRotation:300,repeatCount:4,geometry:'hairpin',
    hairpinAngle:175,turnRadius:50});
  const control=k=>({tagName:'INPUT',min:k==='textureRotation'?'0':
      k==='repeatCount'?'2':k==='hairpinAngle'?'60':'0',
    max:k==='textureRotation'?'359':k==='repeatCount'?'6':
      k==='hairpinAngle'?'180':'100',step:'1',dataset:{}});
  for(const key of ['textureRotation','repeatCount','hairpinAngle']){
    const r=randomizeScope(input,{scope:'setting',name:key,mode:'vary',strength:'wild',
      seed:'variation-'+key,control}).recipe;
    assert.ok(Number.isFinite(r[key]));
    const unchanged=Object.keys(input).filter(k=>k!==key);
    for(const k of unchanged)assert.deepEqual(r[k],input[k],k);
    if(key==='textureRotation')assert.ok(r[key]>=0&&r[key]<=359);
    if(key==='repeatCount')assert.ok(Number.isInteger(r[key])&&r[key]>=2&&r[key]<=6);
    if(key==='hairpinAngle')assert.ok(r[key]>=60&&r[key]<=180);
  }
});

test('motif size and density belong to decorations, not centreline geometry',()=>{
  const base={seed:'motif-audit',geometry:'wave',shapeFrequency:64,shapeDepth:75,
    motif:'chevrons',construction:'ribbon'};
  const small=resolveScene({...base,motifSize:0,motifFrequency:0});
  const large=resolveScene({...base,motifSize:100,motifFrequency:100});
  assert.equal(small.motifSize,0);
  assert.equal(large.motifFrequency,100);
  for(let i=0;i<7;i++){
    assert.equal(small.stripes[i].sharedPeriod,large.stripes[i].sharedPeriod);
    assert.equal(small.stripes[i].sharedDisplacement,large.stripes[i].sharedDisplacement);
    assert.equal(small.stripes[i].center,large.stripes[i].center);
  }
  assert.deepEqual(decodeRecipe(encodeRecipe({...base,motifSize:93,motifFrequency:7})).motifSize,93);
});

test('step count changes number of plateaus rather than shape period',()=>{
  const sample=n=>Array.from({length:160},(_,i)=>
    modulation(i*2.5,'stepped',0,400,25,1000,{stepCount:n}));
  const count=samples=>new Set(samples.map(n=>n.toFixed(2))).size;
  assert.equal(count(sample(2)),2);
  assert.equal(count(sample(12)),12);
  assert.ok(count(sample(12))>count(sample(2)));
});
test('chevron sharpness changes vertices without changing number of peaks',()=>{
  const flat=modulation(52,'chevron',0,240,30,1000,{chevronSharpness:0});
  const pointed=modulation(52,'chevron',0,240,30,1000,{chevronSharpness:100});
  assert.notEqual(flat,pointed);
  const a=resolveScene({geometry:'chevron',chevronSharpness:0});
  const b=resolveScene({geometry:'chevron',chevronSharpness:100});
  assert.equal(a.stripes[0].sharedPeriod,b.stripes[0].sharedPeriod);
});
test('loop aspect can alter loop width independently of loop height',()=>{
  const base={geometry:'loops',shapeDepth:60,shapeFrequency:50};
  const tall=resolveScene({...base,loopAspect:0}).stripes[3];
  const wide=resolveScene({...base,loopAspect:100}).stripes[3];
  const t=pathPosition(tall,10,1000),w=pathPosition(wide,10,1000);
  assert.equal(t.y,w.y);
  assert.notEqual(t.x,w.x);
});
