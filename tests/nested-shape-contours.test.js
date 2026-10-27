import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene} from '../src/model.js';
import {normalizeNestedShapeContours,nestedContourDistances,
  planNestedShapeContours,DEFAULT_NESTED_CONTOURS} from '../src/nested-shape-contours.js';
import {pointInPolygon} from '../src/polygon-inset.js';

const box=(x0,y0,x1,y1)=>[
  {x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}
];
const serial=value=>JSON.parse(JSON.stringify(value));
const preview=rings=>planNestedShapeContours(rings,DEFAULT_NESTED_CONTOURS,
  {resolution:1.0});

test('legacy recipes have no new nesting key and user opt-in is fully portable',()=>{
  const old=normalizeRecipe({seed:'old'});
  assert.equal(Object.hasOwn(old,'nestedShapeContours'),false);
  const options=normalizeNestedShapeContours({enabled:true,objectId:'region-0',
    count:7,strokeWidth:2,gap:5,firstInset:3,colourOrder:'reverse'});
  const next=normalizeRecipe({...old,nestedShapeContours:options});
  assert.deepEqual(normalizeRecipe(serial(next)),next);
  assert.equal(next.nestedShapeContours.colourOrder,'reverse');
  assert.equal(normalizeRecipe({...next,nestedShapeContours:null}).nestedShapeContours,undefined);
});

test('strictly bounded nesting control fields cannot create degenerate geometry',()=>{
  const opts=normalizeNestedShapeContours({count:999,strokeWidth:NaN,gap:-100,
    firstInset:Infinity,objectId:'<img onerror=x>',colourOrder:'bogus'});
  assert.deepEqual(opts,{
    enabled:true,objectId:'region-0',count:7,strokeWidth:2,
    gap:.5,firstInset:3,colourOrder:'forward',fit:'exact'});
  assert.deepEqual(nestedContourDistances({...opts,count:3,strokeWidth:2,
    gap:5,firstInset:3}),[4,11,18]);
  assert.deepEqual(nestedContourDistances({...opts,enabled:false}),[]);
});

test('seven inset rectangular contours use actual fixed distances, not scaled width/height',()=>{
  const source=box(0,0,360,200);
  const result=preview(source);
  assert.equal(result.visibleCount,7);
  assert.equal(result.collapsed,0);
  for(const layer of result.levels){
    assert.equal(layer.contours.length,1);
    assert.ok(layer.contours[0].closed);
    const p=layer.contours[0].points;
    const minX=Math.min(...p.map(v=>v.x)),maxX=Math.max(...p.map(v=>v.x));
    const minY=Math.min(...p.map(v=>v.y)),maxY=Math.max(...p.map(v=>v.y));
    assert.ok(Math.abs(minX-layer.distance)<1.2);
    assert.ok(Math.abs(maxX-(360-layer.distance))<1.2);
    assert.ok(Math.abs(minY-layer.distance)<1.2);
    assert.ok(Math.abs(maxY-(200-layer.distance))<1.2);
  }
});

test('pointed deltas and narrow necks retain honest topology and finite loops',()=>{
  const delta=[
    {x:140,y:0},{x:240,y:280},{x:155,y:228},
    {x:140,y:254},{x:125,y:228},{x:40,y:280}
  ];
  const a=preview(delta),b=preview([...delta].reverse());
  const quantized=report=>report.levels.map(level=>({
    distance:level.distance,
    contours:level.contours.map(contour=>({
      closed:contour.closed,
      points:contour.points.map(p=>[
        Math.round(p.x*1e6)/1e6,Math.round(p.y*1e6)/1e6
      ])
    }))
  }));
  assert.deepEqual(quantized(a),quantized(b),
    'winding cannot change pixel-relevant contour geometry');
  assert.equal(a.requestedCount,7);
  assert.ok(a.levels.every(level=>level.contours.every(c=>c.closed)),
    'uncropped closed Delta cannot contain unfinished interior lines or cap dots');
  for(const level of a.levels){
    assert.ok(level.contours.every(c=>c.points.length>=2));
    for(const contour of level.contours)for(const p of contour.points)
      assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
  }
  const thin=planNestedShapeContours(box(0,0,300,45),
    DEFAULT_NESTED_CONTOURS,{resolution:.8});
  assert.ok(thin.visibleCount<7,'seven full inset levels cannot fit a 45-pixel tall banner');
  assert.equal(thin.visibleCount+thin.collapsed,7);
  assert.ok(thin.collapsed>0,'no invisible hue should be falsely counted');
});

test('negative-space hole advances outward and detached islands remain source-pixel safe',()=>{
  const donut=[box(0,0,330,330),box(110,110,220,220)];
  const result=preview(donut);
  assert.ok(result.levels[0].contours.length>=2);
  for(const layer of result.levels)
    for(const contour of layer.contours)
      for(const p of contour.points.filter((_,i)=>i%13===0)){
        assert.ok(pointInPolygon(p.x,p.y,donut),
          'outlines stay inside original outside-minus-hole silhouette');
      }
  const original=serial(donut);
  preview(donut);
  assert.deepEqual(donut,original,'source silhouette must remain untouched');
});

test('opt-in is always attached to existing current imported object, never ordinary stripes',()=>{
  const disabled=normalizeRecipe({nestedShapeContours:null});
  assert.equal(disabled.nestedShapeContours,undefined);
  const r=normalizeRecipe({structure:'regions',regionMode:'scattered',
    scatteredShapeKind:'circle',
    nestedShapeContours:{...DEFAULT_NESTED_CONTOURS}});
  const scene=resolveScene(r);
  assert.equal(scene.nestedShapeContours.objectId,'region-0');
  assert.equal(scene.scatteredShapeKind,'circle');
  assert.ok(scene.objects.every(o=>!o.rings),'circle objects do not receive custom shape insets');
});

test('contour-level planner retains real open chains only at camera crop edges',()=>{
  const r={...DEFAULT_NESTED_CONTOURS,count:1,firstInset:11,strokeWidth:2};
  const source=box(0,0,160,120);
  const cropped=planNestedShapeContours(source,r,{
    resolution:.7,bounds:{left:-5,right:36,top:20,bottom:105},padding:0
  });
  assert.ok(cropped.levels[0].contours.length>=1);
  assert.ok(cropped.levels[0].contours.some(c=>!c.closed),
    'genuine cropped source boundary must not be discarded');
});
