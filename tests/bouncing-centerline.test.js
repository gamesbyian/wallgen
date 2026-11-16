import test from 'node:test';
import assert from 'node:assert/strict';
import {bouncingCenterline,bouncingPitch,pathPosition,samplePath,ribbonEdge,
  widthAt} from '../src/path-geometry.js';
import {stripeEdgeOffset} from '../src/edge-profiles.js';
import {normalizeRecipe,resolveScene} from '../src/model.js';

const close=(a,b,tolerance=1e-7)=>assert.ok(Math.abs(a-b)<=tolerance,
  `expected ${a} ≈ ${b} (tolerance ${tolerance})`);
const make=(overrides={})=>resolveScene(normalizeRecipe({
  seed:'one-physical-centerline',geometry:'scalloped',orientation:'horizontal',
  individuality:0,chaos:0,shapeFrequency:45,shapeDepth:80,
  stripeEdgeStyle:'straight',...overrides
}));
const excursion=(frequency,height,phase=0)=>{
  const pitch=bouncingPitch(frequency),values=[];
  for(let i=0;i<=600;i++)values.push(bouncingCenterline(pitch*i/600,
    frequency,height,phase));
  return Math.max(...values)-Math.min(...values);
};

test('bouncing path repeats periodically with rounded, tangent-continuous contacts',()=>{
  for(const frequency of [0,25,50,75,100]){
    const pitch=bouncingPitch(frequency),h=80,phase=.2;
    for(const t of [-.75,0,.13,.37,.5,.9,1.25]){
      const value=bouncingCenterline(pitch*t,frequency,h,phase);
      close(value,bouncingCenterline(pitch*(t+1),frequency,h,phase),1e-9);
    }
    // Contacts lie at whole periods for phase zero; both the slope and
    // curvature must meet across the seam of the next period.
    const dx=pitch*1e-4,fn=x=>bouncingCenterline(x,frequency,h);
    const left=(fn(0)-fn(-dx))/dx,right=(fn(dx)-fn(0))/dx;
    assert.ok(Math.abs(left-right)<.01,'no sharp rebound at '+frequency);
    const cLeft=(fn(0)-2*fn(-dx)+fn(-2*dx))/(dx*dx);
    const cRight=(fn(2*dx)-2*fn(dx)+fn(0))/(dx*dx);
    assert.ok(Math.abs(cLeft-cRight)<.15,'no curvature jump at '+frequency);
  }
});

test('each repetition is a broad circular-looking arch, not a travelling wave',()=>{
  const pitch=bouncingPitch(50),height=100;
  const at=t=>bouncingCenterline(t*pitch,50,height);
  const contact=at(0),crown=at(.5);
  close(contact,at(1));
  close(crown,at(-.5));
  close(contact-crown,40+.16*pitch,1e-8);
  // One arch, with its crown in the MIDDLE of each cell. No early peak,
  // asymmetric falling side, or alternating upward/downward half-bounce.
  for(let i=1;i<=100;i++){
    const t=i/200;
    assert.ok(at(t)<at(t-.005),
      'first half must climb monotonically to the arch crown at '+t);
    close(at(t),at(1-t),1e-9);
  }
  // A circular cap has broad shoulders and steeper approaches to its feet.
  // A half-sine or generic smooth wave has lower shoulders at quarter pitch.
  const quarterRise=(contact-at(.25))/(contact-crown);
  assert.ok(quarterRise>.79&&quarterRise<.9,
    'quarter-pitch shoulder must look circular rather than sinusoidal');
  assert.ok((contact-at(.05))/(contact-crown)>.25,
    'the circular arc must rise quickly just after its narrow join');
});

test('adjacent archlets repeat the same geometry and round both joins',()=>{
  for(const frequency of [0,35,70,100]){
    const pitch=bouncingPitch(frequency);
    const at=t=>bouncingCenterline(t*pitch,frequency,85);
    for(let i=-3;i<=3;i++){
      close(at(i),at(0));
      close(at(i+.5),at(.5));
    }
    // Contact is a very narrow, rounded valley; the neighbouring crowns
    // remain smooth, without a broad flat platform through the join.
    assert.ok(at(.015)<at(0)&&at(-.015)<at(0));
    const e=.0001;
    close((at(e)-at(-e))/(2*e),0,1e-8);
    close((at(.5+e)-at(.5-e))/(2*e),0,1e-8);
  }
});

test('frequency controls pitch; height controls excursion independently of width',()=>{
  assert.equal(bouncingPitch(0),360);
  assert.equal(bouncingPitch(100),90);
  for(let f=0;f<100;f+=10)assert.ok(bouncingPitch(f)>bouncingPitch(f+10));
  for(const f of [0,50,100]){
    assert.equal(excursion(f,0),0);
    assert.ok(excursion(f,90)>excursion(f,45)*1.9);
    assert.ok(excursion(f,100)>60);
  }
  const ratio=excursion(0,100)/excursion(100,100);
  assert.ok(ratio<1.8,'changing pitch must not redefine amplitude fourfold');
  const sceneA=make({shapeDepth:100,stripeWidth:3,construction:'stroke'});
  const sceneB=make({shapeDepth:100,stripeWidth:100,construction:'ribbon'});
  const a=sceneA.stripes[3],b=sceneB.stripes[3];
  for(const x of [-93,0,33,87,173]){
    close(pathPosition(a,x,sceneA.extent).y,
      pathPosition(b,x,sceneB.extent).y,1e-9);
  }
});

test('height zero makes a genuinely straight centerline at every angle',()=>{
  for(const orientation of ['horizontal','vertical','diagonal']){
    const scene=make({orientation,shapeDepth:0,individuality:0});
    for(const stripe of scene.stripes)for(const x of [-200,-77,0,73,200]){
      close(samplePath(stripe,x,scene.extent).y,stripe.center);
      close(samplePath(stripe,x,scene.extent).nx,0);
      close(samplePath(stripe,x,scene.extent).ny,1);
    }
  }
});

test('the two ribbon boundaries are equal and opposite NORMAL offsets',()=>{
  for(const construction of ['stroke','ribbon']){
    const scene=make({shapeDepth:100,shapeFrequency:75,construction,
      stripeWidth:construction==='stroke'?10:85,startTaper:40,endTaper:80});
    const stripe=scene.stripes[3];
    assert.equal(stripe.edgeStyle,'straight','no implicit bouncing edge style');
    for(const x of [-225,-115,-42,0,50,123,230]){
      const p=samplePath(stripe,x,scene.extent);
      const half=widthAt(stripe,x,scene.extent)/2;
      const upper=ribbonEdge(stripe,x,scene.extent,-1,0,p);
      const lower=ribbonEdge(stripe,x,scene.extent,1,0,p);
      close(upper.x,p.x-p.nx*half);close(upper.y,p.y-p.ny*half);
      close(lower.x,p.x+p.nx*half);close(lower.y,p.y+p.ny*half);
      close(Math.hypot(lower.x-upper.x,lower.y-upper.y),half*2);
      close((upper.x+lower.x)/2,p.x);close((upper.y+lower.y)/2,p.y);
      assert.equal(stripeEdgeOffset(stripe,x,-1,half*2),0);
      assert.equal(stripeEdgeOffset(stripe,x,1,half*2),0);
    }
  }
});

test('bounce alignment and individuality modify the centerline, not two edges',()=>{
  const base={shapeDepth:80,stripeEdgeStyle:'straight',stripeEdgePhase:0,
    stripeEdgePhaseB:0,individuality:0};
  const aligned=make({...base,stripeEdgeAlignment:'aligned'});
  const staggered=make({...base,stripeEdgeAlignment:'staggered'});
  const p=bouncingPitch(45),centerline=(scene,i,x)=>
    pathPosition(scene.stripes[i],x,scene.extent).y;
  close(centerline(aligned,0,p/4),centerline(aligned,1,p/4));
  assert.ok(Math.abs(centerline(staggered,0,p/4)-centerline(staggered,1,p/4))>10);
  const independent=make({...base,stripeEdgeAlignment:'aligned',individuality:100});
  assert.ok(Math.abs(centerline(independent,0,p/4)-centerline(independent,1,p/4))>1);
  const phaseB=make({...base,stripeEdgePhaseB:50});
  close(centerline(aligned,3,p/4),centerline(phaseB,3,p/4));
});

test('decorative edges remain independent and coexist with bouncing geometry',()=>{
  const plain=make({stripeEdgeStyle:'straight',shapeDepth:100});
  const decorated=make({stripeEdgeStyle:'wavy',stripeEdgeDepth:70,
    stripeEdgePhase:0,stripeEdgePhaseB:50,shapeDepth:100});
  const a=plain.stripes[3],b=decorated.stripes[3];
  assert.equal(b.edgeStyle,'wavy');
  for(const x of [-65,0,27,63]){
    close(pathPosition(a,x,plain.extent).y,pathPosition(b,x,decorated.extent).y);
  }
  const x=30,p=samplePath(b,x,decorated.extent),half=widthAt(b,x,decorated.extent)/2;
  const edge=ribbonEdge(b,x,decorated.extent,1,0,p);
  const extra=stripeEdgeOffset(b,x,1,half*2);
  assert.ok(Math.abs(extra)>1e-5);
  close(edge.x,p.x+p.nx*(half+extra));
  close(edge.y,p.y+p.ny*(half+extra));
  assert.equal(plain.geometry??plain.stripes[3].geometry,'scalloped');
  assert.equal(normalizeRecipe({geometry:'scalloped'}).geometry,'scalloped');
});
