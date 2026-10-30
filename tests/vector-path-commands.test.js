import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeVectorPath,vectorPathFromPolyline,flattenVectorPath,prepareVectorDrawnPath,
  moveVectorNode,moveVectorHandle,setVectorNodeMode,splitVectorSegment,
  nearestVectorSegment,pointOnVectorSegment,VECTOR_PATH_MAX_SAMPLES}
  from '../src/vector-path-commands.js';
import {prepareDrawnPath,pointOnDrawnPath} from '../src/drawn-path.js';

const eq=(a,b,eps=1e-8)=>Math.hypot(...a.map((x,i)=>x-b[i]))<eps;
const sample={space:'normalized-design',closed:false,
  start:{id:'start',point:[.2,.3]},
  segments:[{kind:'cubic',to:{id:'mid',point:[.5,.6]},controlOut:[.3,.35],controlIn:[.4,.6]},
    {kind:'cubic',to:{id:'end',point:[.8,.35]},controlOut:[.6,.6],controlIn:[.7,.4]}],
  nodeModes:{mid:'mirrored'}};

test('normalize vector commands rejects invalid topology, unknown keys and unsafe controls',()=>{
  const n=normalizeVectorPath(sample);
  assert.ok(n);assert.notStrictEqual(n,sample);assert.notStrictEqual(n.segments[0].to,sample.segments[0].to);
  assert.equal(normalizeVectorPath({...sample,closed:true}),null);
  assert.equal(normalizeVectorPath({...sample,segments:[sample.segments[0],
    {...sample.segments[1],to:{id:'mid',point:[.8,.35]}}]}),null);
  assert.equal(normalizeVectorPath({...sample,nodeModes:{unknown:'corner'}}),null);
  assert.equal(normalizeVectorPath({...sample,segments:[{kind:'cubic',
    to:{id:'end',point:[.8,.35]},controlOut:[Infinity,0],controlIn:[0,0]}]}),null);
  assert.equal(normalizeVectorPath({...sample,segments:[]}),null);
  assert.equal(normalizeVectorPath({...sample,segments:[{kind:'cubic',
    to:{id:'end',point:[.8,.35]},controlOut:[.25,.3],controlIn:[.4,.4],unexpected:'field'}]}),null);
  const idLikePrototype=normalizeVectorPath({space:'normalized-design',closed:false,
    start:{id:'constructor',point:[0,0]},
    segments:[{kind:'line',to:{id:'toString',point:[.5,.5]}}]});
  assert.deepEqual(idLikePrototype.nodeModes,{});
  assert.ok(flattenVectorPath(idLikePrototype));
});

test('line import preserves ordered stations, offscreen geometry and explicit closure',()=>{
  const pts=[[-.2,.1],[.1,.9],[1.2,.7]];
  for(const closed of [false,true]){
    const p=vectorPathFromPolyline(pts,{closed});
    assert.ok(p);const f=flattenVectorPath(p);
    assert.deepEqual(f.points,closed?[...pts,pts[0]]:pts);
    assert.deepEqual(f.stationIndices,{n0:0,n1:1,n2:2});
    assert.equal(f.closed,closed);
  }
  assert.equal(vectorPathFromPolyline([[0,0],[NaN,1]]),null);
});

test('world adapter uses exact original 600x1300 design metric and common pathOnDrawnPath contract',()=>{
  const p=vectorPathFromPolyline([[.1,.2],[.5,.6],[.9,.8]]);
  const w=prepareVectorDrawnPath(p),common=prepareDrawnPath(p);
  assert.deepEqual(w.points,[{x:-240,y:-390},{x:0,y:130},{x:240,y:390}]);
  assert.deepEqual(w,common);
  assert.equal(w.lengths[0],0);assert.ok(w.total>0);
  assert.deepEqual(pointOnDrawnPath(common,0),{x:-240,y:-390});
  assert.deepEqual(pointOnDrawnPath(common,1),{x:240,y:390});
  assert.deepEqual(pointOnDrawnPath(common,.5),pointOnDrawnPath(w,.5));
});

test('cubic compiler preserves endpoints, crossing/turning order and deterministic samples',()=>{
  const p=normalizeVectorPath(sample),flat=flattenVectorPath(p,{tolerance:.3});
  assert.ok(flat.points.length>3&&flat.points.length<500);
  assert.deepEqual(flat.points[0],p.start.point);
  assert.deepEqual(flat.points.at(-1),p.segments.at(-1).to.point);
  assert.ok(flat.stationIndices.mid>0);
  assert.equal(flat.stationIndices.end,flat.points.length-1);
  assert.deepEqual(flat,flattenVectorPath(p,{tolerance:.3}));
  const w=prepareDrawnPath(p);
  assert.ok(w.total>0);
  assert.ok(Number.isFinite(pointOnDrawnPath(w,.35).x));
});

test('a reversing collinear cubic cannot be flattened to its endpoint chord',()=>{
  const p=normalizeVectorPath({space:'normalized-design',closed:false,
    start:{id:'a',point:[.3,.5]},
    segments:[{kind:'cubic',to:{id:'b',point:[.6,.5]},
      controlOut:[1.9,.5],controlIn:[-1.2,.5]}]});
  const flat=flattenVectorPath(p,{tolerance:.3});
  assert.ok(flat.points.length>10);
  assert.ok(Math.max(...flat.points.map(x=>x[0]))>.7);
  assert.ok(Math.min(...flat.points.map(x=>x[0]))<.3);
});

test('sampling limits never silently truncate a complex vector path',()=>{
  const p=normalizeVectorPath(sample);
  assert.equal(flattenVectorPath(p,{tolerance:.0001,maxSamples:4}),null);
  assert.equal(flattenVectorPath(p,{tolerance:.0001,maxDepth:1}),null);
  assert.equal(flattenVectorPath(p,{maxSamples:VECTOR_PATH_MAX_SAMPLES+1}),null);
  assert.equal(prepareDrawnPath({...sample,segments:[{kind:'cubic',
    to:{id:'bad',point:[Infinity,0]},controlOut:[0,0],controlIn:[0,0]}]}),null);
});

test('node movement translates exact adjacent controls without changing other IDs',()=>{
  const p=moveVectorNode(sample,'mid',[.55,.65]);assert.ok(p);
  assert.deepEqual(p.segments[0].to.point,[.55,.65]);
  assert.ok(eq(p.segments[0].controlIn,[.45,.65]));
  assert.ok(eq(p.segments[1].controlOut,[.65,.65]));
  assert.equal(p.segments[1].to.id,'end');
  assert.deepEqual(sample.segments[0].to.point,[.5,.6]);
  assert.equal(moveVectorNode(sample,'mid',[50,0]),null);
});

test('mirrored and aligned handle modes use Euclidean rather than screen/bounds units',()=>{
  const mir=moveVectorHandle(sample,'mid','out',[.6,.65]);assert.ok(mir);
  const center=[.5,.6],out=mir.segments[1].controlOut,inp=mir.segments[0].controlIn;
  assert.ok(eq([(out[0]-center[0])*600,(out[1]-center[1])*1300],
    [-(inp[0]-center[0])*600,-(inp[1]-center[1])*1300]));
  const aligned=setVectorNodeMode(sample,'mid','aligned');
  const a=moveVectorHandle(aligned,'mid','out',[.6,.65]);
  const len=p=>Math.hypot((p[0]-center[0])*600,(p[1]-center[1])*1300);
  assert.ok(Math.abs(len(a.segments[0].controlIn)-len(aligned.segments[0].controlIn))<1e-8);
  const independent=setVectorNodeMode(sample,'mid','independent');
  assert.deepEqual(moveVectorHandle(independent,'mid','out',[.6,.65]).segments[0].controlIn,
    independent.segments[0].controlIn);
});

test('switching a mode immediately reconciles genuine cubic handle continuity',()=>{
  const mir=setVectorNodeMode(sample,'mid','mirrored');assert.ok(mir);
  const c=[.5,.6],inp=mir.segments[0].controlIn,out=mir.segments[1].controlOut;
  assert.ok(eq([(inp[0]-c[0])*600,(inp[1]-c[1])*1300],
    [-(out[0]-c[0])*600,-(out[1]-c[1])*1300]));
  const corner=setVectorNodeMode(mir,'mid','corner');
  assert.equal(corner.nodeModes.mid,undefined);
  assert.equal(setVectorNodeMode(sample,'unknown','aligned'),null);
});

test('De Casteljau subdivision preserves exact original cubic and existing endpoint IDs',()=>{
  const p=normalizeVectorPath(sample);
  const before=flattenVectorPath(p,{tolerance:.3});
  const split=splitVectorSegment(p,0,.5,'inserted');
  assert.ok(split);assert.equal(split.segments[0].to.id,'inserted');
  assert.equal(split.segments[1].to.id,'mid');
  const after=flattenVectorPath(split,{tolerance:.3});
  const nearest=x=>Math.min(...after.points.map(y=>
    Math.hypot((x[0]-y[0])*600,(x[1]-y[1])*1300)));
  assert.ok(Math.max(...before.points.map(nearest))<2);
  assert.deepEqual(sample.segments[0].to.point,[.5,.6]);
  assert.equal(splitVectorSegment(p,0,.5,'mid'),null);
});

test('true nearest cubic hit returns correct segment and insertion parameter',()=>{
  const p=normalizeVectorPath(sample);
  const exact=pointOnVectorSegment(p,0,.375);
  const hit=nearestVectorSegment(p,exact,{tolerance:.25});
  assert.ok(hit);assert.equal(hit.segmentIndex,0);
  assert.ok(Math.abs(hit.t-.375)<.003);
  assert.ok(hit.distanceDesign<.01);
  assert.equal(nearestVectorSegment(p,[Infinity,0]),null);
});

test('crossing path lookup identifies branch rather than merely nearest node',()=>{
  const p=vectorPathFromPolyline([[.2,.2],[.8,.8],[.2,.8],[.8,.2]]);
  const low=nearestVectorSegment(p,[.7,.3]);
  assert.equal(low.segmentIndex,2);
  assert.ok(Math.abs(low.t-5/6)<.01);
  const upper=nearestVectorSegment(p,[.5,.8]);
  assert.equal(upper.segmentIndex,1);
  assert.ok(upper.distanceDesign<.00001);
});

test('closed vector path hit resolves explicit closing segment',()=>{
  const p=vectorPathFromPolyline([[.2,.2],[.75,.2],[.75,.75]],{closed:true});
  const hit=nearestVectorSegment(p,[.475,.475]);
  assert.equal(hit.segmentIndex,2);
  assert.ok(Math.abs(hit.t-.5)<.01);
});

test('dense sampled-path import preserves exact authored world-space line stations',()=>{
  // Source Draw recipes already round dense authored paths to 5 decimals.
  const dense=Array.from({length:64},(_,i)=>[
    Number((.2+.58*i/63).toFixed(5)),
    Number((.5+.24*Math.sin(i/63*Math.PI*3)).toFixed(5))]);
  const p=vectorPathFromPolyline(dense);
  const old=prepareDrawnPath(dense),next=prepareDrawnPath(p);
  assert.ok(old&&next);
  assert.equal(old.points.length,dense.length);
  assert.deepEqual(next.points,old.points);
  assert.deepEqual(next.lengths,old.lengths);
  assert.equal(next.total,old.total);
  assert.equal(next.closed,old.closed);
});
