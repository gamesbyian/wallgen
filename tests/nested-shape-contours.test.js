import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene} from '../src/model.js';
import {normalizeNestedShapeContours,nestedContourDistances,
  planNestedShapeContours,fitNestedShapeContours,DEFAULT_NESTED_CONTOURS} from '../src/nested-shape-contours.js';
import {pointInPolygon,polygonInsetContours} from '../src/polygon-inset.js';
import {frameImportedSilhouette,frameUnpositionedNestedSilhouette,NESTED_FRAME_MARGINS} from '../src/nested-shape-framing.js';

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


test('auto-fit preserves source silhouette and restores seven inset levels on a narrow banner',()=>{
  const source=box(0,0,300,45);
  const before=serial(source);
  const initial=preview(source);
  assert.ok(initial.visibleCount<7);
  const fit=fitNestedShapeContours(source,DEFAULT_NESTED_CONTOURS);
  assert.equal(fit.fitted,true,fit.reason);
  assert.equal(fit.changed,true);
  assert.equal(fit.settings.strokeWidth,2,'maintain legible stroke where possible');
  assert.equal(fit.settings.firstInset,3,'preserve outer margin before reducing it');
  assert.ok(fit.settings.gap<DEFAULT_NESTED_CONTOURS.gap);
  assert.equal(preview(source).visibleCount,initial.visibleCount,
    'old authored parameters remain unchanged');
  assert.equal(planNestedShapeContours(source,fit.settings,{resolution:1}).visibleCount,7);
  assert.deepEqual(source,before,'the original imported vertices must remain byte-identical');
  const serialized=normalizeRecipe({nestedShapeContours:fit.settings});
  assert.deepEqual(normalizeRecipe(serial(serialized)),serialized);
});

test('auto-fit refuses geometrically impossible seven lines without modifying authored values',()=>{
  const thin=box(0,0,300,8);
  const settings={...DEFAULT_NESTED_CONTOURS};
  const result=fitNestedShapeContours(thin,settings);
  assert.equal(result.fitted,false);
  assert.equal(result.changed,false);
  assert.deepEqual(result.settings,settings);
  assert.match(result.reason,/too narrow/i);
});

test('auto-fit is a no-op when seven contours already fit',()=>{
  const result=fitNestedShapeContours(box(0,0,360,200),
    DEFAULT_NESTED_CONTOURS);
  assert.equal(result.fitted,true);
  assert.equal(result.changed,false);
  assert.deepEqual(result.settings,DEFAULT_NESTED_CONTOURS);
});


test('shared distance samples preserve exact topology and geometry across seven levels',()=>{
  const delta=[
    {x:140,y:0},{x:240,y:280},{x:155,y:228},
    {x:140,y:254},{x:125,y:228},{x:40,y:280}
  ];
  const cloud=Array.from({length:52},(_,i)=>{
    const theta=i*2*Math.PI/52;
    const radius=1+.16*Math.sin(5*theta)+.08*Math.cos(9*theta);
    return {x:180+Math.cos(theta)*135*radius,
      y:125+Math.sin(theta)*105*radius};
  });
  const shapes=[
    box(-15,-10,260,160),
    [box(-20,-20,260,260),box(80,75,170,175)],
    delta,
    cloud,
    [box(0,0,110,105),box(150,35,230,140)]
  ];
  const viewports=[
    {resolution:1},
    {resolution:.7,bounds:{left:25,right:190,top:35,bottom:205},padding:6}
  ];
  for(const shape of shapes)for(const options of viewports){
    const optimized=planNestedShapeContours(shape,DEFAULT_NESTED_CONTOURS,options);
    const baseline=planNestedShapeContours(shape,DEFAULT_NESTED_CONTOURS,
      {...options,cacheDistances:false});
    assert.deepEqual(optimized,baseline,
      'cached vs independent signed-distance scans must be exactly identical');
  }
});

test('shared sample cache is opt-in to single inset invocation and never leaks across source shapes',()=>{
  const sample={columns:new Map(),count:0,limit:32};
  const first=box(0,0,200,180),second=box(0,0,80,70);
  const cached=polygonInsetContours(first,7,{resolution:1,distanceCache:sample});
  assert.deepEqual(cached,polygonInsetContours(first,7,{resolution:1}));
  assert.equal(sample.count,32,'shared cache fills only its bounded allowance');
  assert.ok(sample.columns.size>0,'the local cache should actually receive world samples');
  // A second independent planner call has its own per-call cache; no stale
  // distance field is accidentally reused when the underlying shape changes.
  assert.deepEqual(planNestedShapeContours(second,DEFAULT_NESTED_CONTOURS),
    planNestedShapeContours(second,DEFAULT_NESTED_CONTOURS,{cacheDistances:false}));
});


test('high-detail traced silhouette uses exactly the same geometric output as baseline',()=>{
  const detailed=Array.from({length:256},(_,i)=>{
    const a=i*2*Math.PI/256;
    return {x:155+130*Math.cos(a),y:190+175*Math.sin(a)};
  });
  const options={resolution:1,bounds:{left:4,right:300,top:3,bottom:350}};
  const cached=planNestedShapeContours(detailed,DEFAULT_NESTED_CONTOURS,options);
  const baseline=planNestedShapeContours(detailed,DEFAULT_NESTED_CONTOURS,
    {...options,cacheDistances:false});
  assert.deepEqual(cached,baseline);
  assert.equal(cached.visibleCount,7);
});


test('nesting preset frames wide, tall and pointed imported silhouette geometry without distortion',()=>{
  const cases=[
    {type:'compound-region',space:'asset-local',fillRule:'evenodd',viewBox:[0,0,600,200],
      components:[{outer:[[0,0],[600,0],[600,200],[0,200]],holes:[]}]},
    {type:'compound-region',space:'asset-local',fillRule:'evenodd',viewBox:[0,0,120,900],
      components:[{outer:[[0,0],[120,0],[120,900],[0,900]],holes:[]}]},
    {type:'compound-region',space:'asset-local',fillRule:'evenodd',viewBox:[0,0,360,360],
      components:[{outer:[[180,18],[310,330],[228,270],[180,306],[132,270],[50,330]],
        holes:[[[180,135],[198,195],[162,195]]]}]}
  ];
  for(const geometry of cases){
    const original=serial(geometry);
    const position=frameImportedSilhouette(geometry);
    assert.ok(position,'a validated source must have a safe design-plane fit');
    const shape={schema:'roygbiv.geometry-snapshot',version:1,geometry};
    const recipe=normalizeRecipe({seed:'frame-source',structure:'regions',
      regionMode:'scattered',scatteredShapeKind:'imported',
      scatteredShape:shape,scatteredCount:1,scatteredMinSize:80,
      scatteredMaxSize:100,scatteredVariation:0,scatteredEdgeCrop:0,
      scatteredOverrides:[position],nestedShapeContours:DEFAULT_NESTED_CONTOURS});
    const obj=resolveScene(recipe).objects[0];
    assert.ok(obj?.rings?.length,'exact imported shape must survive canonical rendering');
    const x=obj.rings.flat().map(p=>p.x),y=obj.rings.flat().map(p=>p.y);
    assert.ok(Math.min(...x)>=NESTED_FRAME_MARGINS.x-.02);
    assert.ok(Math.max(...x)<=600-NESTED_FRAME_MARGINS.x+.02);
    assert.ok(Math.min(...y)>=NESTED_FRAME_MARGINS.y-.02);
    assert.ok(Math.max(...y)<=1300-NESTED_FRAME_MARGINS.y+.02);
    assert.deepEqual(geometry,original,'framing must never alter source geometry');
    assert.deepEqual(normalizeRecipe(serial(recipe)),recipe);
  }
});

test('design-plane framing preserves detached components, holes and aspect ratio',()=>{
  const shape={type:'compound-region',space:'asset-local',fillRule:'evenodd',viewBox:[0,0,400,100],
    components:[
      {outer:[[0,0],[280,0],[280,100],[0,100]],
        holes:[[[90,25],[140,25],[140,65],[90,65]]]},
      {outer:[[310,20],[400,20],[400,80],[310,80]],holes:[]}
    ]};
  const position=frameImportedSilhouette(shape);
  assert.ok(position);
  const template={schema:'roygbiv.geometry-snapshot',version:1,geometry:shape};
  const scene=resolveScene(normalizeRecipe({seed:'compound-fit',
    structure:'regions',regionMode:'scattered',scatteredShapeKind:'imported',
    scatteredCount:1,scatteredShape:template,scatteredOverrides:[position]}));
  assert.equal(scene.objects[0].rings.length,3);
  const scaled=scene.objects[0].rings[0];
  const width=scaled[1].x-scaled[0].x,height=scaled[2].y-scaled[1].y;
  assert.ok(Math.abs(width/height-2.8)<1e-6,'source proportion must survive');
});

test('invalid or degenerate imported shape cannot create an unsafe frame transform',()=>{
  for(const value of [null,{}, {type:'compound-region',viewBox:[0,0,0,1],
    components:[]},{type:'compound-region',viewBox:[0,0,20,20],
    components:[{outer:[[1,1],[1,1],[1,1]],holes:[]}]}]){
    assert.equal(frameImportedSilhouette(value),null);
  }
});


test('Auto-fit early failure exit is bit-for-bit equivalent to full seven-level planner',()=>{
  const delta=[
    {x:160,y:2},{x:300,y:280},{x:184,y:208},
    {x:160,y:244},{x:136,y:208},{x:20,y:280}
  ];
  const shaped=Array.from({length:72},(_,i)=>{
    const a=i*2*Math.PI/72,r=1+.14*Math.sin(5*a)+.11*Math.cos(9*a);
    return {x:130+115*r*Math.cos(a),y:115+86*r*Math.sin(a)};
  });
  const narrow=box(0,0,310,42), impossible=box(0,0,310,7);
  for(const shape of [delta,shaped,narrow,impossible,
    [box(0,0,300,170),box(100,48,215,118)],
    [box(0,0,180,120),box(240,0,360,90)]]){
    // Extreme tight/default authored distances cover both successful and
    // failed fit decisions without turning permanent quick CI into a benchmark.
    for(const gap of [.5,5]){
      const settings={...DEFAULT_NESTED_CONTOURS,gap};
      const fast=fitNestedShapeContours(shape,settings);
      const original=fitNestedShapeContours(shape,settings,{earlyExit:false});
      assert.deepEqual(fast,original,
        'early termination must make the exact same user-facing choice');
    }
  }
});

test('detailed source cache and fast rejection retain exact Auto-fit settings',()=>{
  const ellipse=Array.from({length:256},(_,i)=>{
    const a=i*2*Math.PI/256;
    return {x:135+125*Math.cos(a),y:160+28*Math.sin(a)};
  });
  const settings={...DEFAULT_NESTED_CONTOURS};
  assert.deepEqual(
    fitNestedShapeContours(ellipse,settings),
    fitNestedShapeContours(ellipse,settings,{earlyExit:false}));
});


test('Regions Nest gives a fresh imported silhouette the same source-aware frame as library Nest',()=>{
  const geometry={type:'compound-region',space:'asset-local',fillRule:'evenodd',
    viewBox:[0,0,400,130],components:[{
      outer:[[0,0],[400,0],[400,130],[0,130]],
      holes:[[[150,40],[250,40],[250,85],[150,85]]]}]};
  const input=serial(geometry);
  const predicted=frameImportedSilhouette(geometry);
  const direct=frameUnpositionedNestedSilhouette({scatteredOverrides:[]},geometry);
  assert.deepEqual(direct,[predicted]);
  const snapshot={schema:'roygbiv.geometry-snapshot',version:1,geometry};
  const recipe=normalizeRecipe({
    seed:'nested-contextual',structure:'regions',regionMode:'scattered',
    scatteredShapeKind:'imported',scatteredCount:1,scatteredShape:snapshot,
    scatteredOverrides:direct,nestedShapeContours:DEFAULT_NESTED_CONTOURS});
  const object=resolveScene(recipe).objects.find(o=>o.id==='region-0');
  const verts=object.rings.flat(),xs=verts.map(p=>p.x),ys=verts.map(p=>p.y);
  assert.ok(Math.min(...xs)>=NESTED_FRAME_MARGINS.x-.02);
  assert.ok(Math.max(...xs)<=600-NESTED_FRAME_MARGINS.x+.02);
  assert.ok(Math.min(...ys)>=NESTED_FRAME_MARGINS.y-.02);
  assert.ok(Math.max(...ys)<=1300-NESTED_FRAME_MARGINS.y+.02);
  assert.deepEqual(geometry,input,'source rings must never be rewritten');
  assert.deepEqual(normalizeRecipe(serial(recipe)),recipe);
});

test('Regions Nest preserves explicitly moved source transform and unrelated slots',()=>{
  const existing=[
    {index:0,x:.73,y:.47,radius:.29},
    {index:3,x:.2,y:.67,radius:.16}
  ];
  const geometry={type:'compound-region',viewBox:[0,0,100,100],
    components:[{outer:[[0,0],[100,0],[100,100],[0,100]],holes:[]}]};
  assert.deepEqual(frameUnpositionedNestedSilhouette(
    {scatteredOverrides:existing},geometry),existing,
    'intentional object-0 placement must not change');
  const untouched=frameUnpositionedNestedSilhouette(
    {scatteredOverrides:[existing[1]]},geometry);
  assert.equal(untouched[0].index,0);
  assert.deepEqual(untouched[1],existing[1],'other hue transforms preserved');
  assert.deepEqual(frameUnpositionedNestedSilhouette({},null),[],
    'missing source shape never creates a fictional transform');
});


test('Auto-fit enlarges real inner hue geometry only when it is a tiny remnant',()=>{
  const cloud=Array.from({length:52},(_,i)=>{
    const a=i*2*Math.PI/52,r=1+.18*Math.sin(5*a)+.07*Math.cos(11*a);
    return [300+250*r*Math.cos(a),95+66*r*Math.sin(a)];
  });
  const triangle=[[180,145],[205,215],[155,215]];
  const cases=[
    {geometry:{type:'compound-region',space:'asset-local',fillRule:'evenodd',
      viewBox:[0,0,600,190],components:[{outer:cloud,holes:[]}]},
      expected:'cloud'},
    {geometry:{type:'compound-region',space:'asset-local',fillRule:'evenodd',
      viewBox:[0,0,360,360],components:[{
        outer:[[180,12],[336,348],[223,260],[180,315],[137,260],[24,348]],
        holes:[triangle]}]},expected:'delta'}
  ];
  for(const {geometry,expected} of cases){
    const untouched=serial(geometry);
    const original=normalizeRecipe({seed:'auto-balance-'+expected,
      structure:'regions',regionMode:'scattered',scatteredShapeKind:'imported',
      scatteredCount:1,scatteredMinSize:80,scatteredMaxSize:100,
      scatteredVariation:0,scatteredSpacing:0,scatteredEdgeCrop:0,
      scatteredShape:{schema:'roygbiv.geometry-snapshot',version:1,geometry},
      scatteredOverrides:[frameImportedSilhouette(geometry)]});
    const rings=resolveScene(original).objects[0].rings;
    const settings={...DEFAULT_NESTED_CONTOURS,gap:30};
    const baseline=fitNestedShapeContours(rings,settings,{balanceInnerInk:false});
    const improved=fitNestedShapeContours(rings,settings);
    assert.equal(baseline.fitted,true);
    assert.equal(improved.balancedInnerColours,true);
    assert.ok(improved.settings.gap<baseline.settings.gap);
    assert.equal(improved.settings.strokeWidth,baseline.settings.strokeWidth);
    assert.equal(improved.settings.firstInset,baseline.settings.firstInset);
    assert.equal(planNestedShapeContours(rings,improved.settings).visibleCount,7);
    const lengths=plan=>plan.levels.map(level=>level.contours.reduce((sum,c)=>{
      let length=0;
      for(let i=1;i<c.points.length;i++)length+=Math.hypot(
        c.points[i].x-c.points[i-1].x,c.points[i].y-c.points[i-1].y);
      if(c.closed)length+=Math.hypot(c.points[0].x-c.points.at(-1).x,
        c.points[0].y-c.points.at(-1).y);
      return sum+length;
    },0));
    const originalLengths=lengths(planNestedShapeContours(rings,baseline.settings));
    const newLengths=lengths(planNestedShapeContours(rings,improved.settings));
    assert.ok(originalLengths[6]/originalLengths[0]<.1);
    assert.ok(newLengths[6]/newLengths[0]>=.25);
    assert.deepEqual(geometry,untouched,'creator source vector is immutable');
    const adopted=normalizeRecipe({...original,nestedShapeContours:improved.settings});
    assert.deepEqual(normalizeRecipe(serial(adopted)),adopted);
  }
});

test('Auto-fit does not crowd a readable skinny ellipse or modify a valid manual gap',()=>{
  const geometry={type:'compound-region',space:'asset-local',fillRule:'evenodd',
    viewBox:[0,0,620,140],components:[{outer:Array.from({length:88},(_,i)=>{
      const a=i*2*Math.PI/88;
      return [310+280*Math.cos(a),70+41*Math.sin(a)];
    }),holes:[]}]};
  const r=normalizeRecipe({seed:'auto-balance-ellipse',structure:'regions',
    regionMode:'scattered',scatteredShapeKind:'imported',scatteredCount:1,
    scatteredShape:{schema:'roygbiv.geometry-snapshot',version:1,geometry},
    scatteredOverrides:[frameImportedSilhouette(geometry)]});
  const rings=resolveScene(r).objects[0].rings;
  const settings={...DEFAULT_NESTED_CONTOURS,gap:30};
  const baseline=fitNestedShapeContours(rings,settings,{balanceInnerInk:false});
  const improved=fitNestedShapeContours(rings,settings);
  assert.equal(improved.fitted,true);
  assert.deepEqual(improved.settings,baseline.settings,
    'readable violet must not sacrifice normal outer separation');
  assert.equal(improved.balancedInnerColours,undefined);
  const already=fitNestedShapeContours(rings,improved.settings);
  assert.equal(already.changed,false,
    'a deliberate already-valid selection is never silently rebalanced');
});
