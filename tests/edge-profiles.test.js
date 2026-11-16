import test from 'node:test';
import assert from 'node:assert/strict';
import {edgePitch,edgeWave,circularScallop,stripeEdgeOffset,decorateRegionObjects,
  normalizeRegionEdgeOverrides} from '../src/edge-profiles.js';
import {samplePath,ribbonEdge,widthAt} from '../src/path-geometry.js';
import {normalizeRecipe,resolveScene} from '../src/model.js';
import {SETTING_TOOL} from '../src/editor-schema.js';

const polygon=(id,vertices,index=0)=>({kind:'region',id,colorIndex:index,
  color:'#ff0000',vertices});
const rectangle=(x0,y0,x1,y1)=>[
  {x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}
];
const regional=(overrides={})=>({
  regionEdgeStyle:'scalloped',regionEdgeSize:45,regionEdgeDepth:75,
  regionEdgePhase:0,regionEdgeDirection:'outward',...overrides
});

test('scallops, waves, teeth and steps have independent deterministic profiles',()=>{
  const pitch=edgePitch(50);
  assert.ok(pitch>=60&&pitch<=100);
  assert.ok(Math.abs(edgeWave('scalloped',0,pitch))<1e-12);
  assert.ok(Math.abs(edgeWave('scalloped',pitch/2,pitch)-1)<1e-12);
  assert.ok(Math.abs(edgeWave('pinked',pitch/2,pitch)-1)<1e-12);
  assert.ok(Math.abs(edgeWave('wavy',pitch/4,pitch)-1)<1e-12);
  assert.equal(edgeWave('stepped',pitch/2,pitch),1);
  assert.equal(edgeWave('stepped',0,pitch),0);
  assert.equal(edgeWave('scalloped',pitch/2,pitch,0,'inward'),-1);
  assert.equal(edgeWave('scalloped',pitch*1.5,pitch,0,'alternating'),-1);
  assert.equal(edgeWave('straight',pitch/2,pitch),0);
});

test('scallops are actual circular arcs, including shallower circular segments',()=>{
  const pitch=80,half=pitch/2;
  for(const h of [half,half*.35]){
    const radius=(half*half+h*h)/(2*h);
    for(const t of [0,.125,.25,.5,.75,.875,1]){
      const x=(t-.5)*pitch;
      const y=circularScallop(t*pitch,pitch,0,h);
      assert.ok(Math.abs(x*x+Math.pow(y+radius-h,2)-radius*radius)<1e-7,
        'sample must lie on the generating circle at t='+t);
    }
  }
  for(const i of [0,1,2,3,4]){
    assert.ok(Math.abs(circularScallop(i*pitch+.5*pitch,pitch,0,half)-half)<1e-8);
    assert.ok(Math.abs(circularScallop(i*pitch,pitch,0,half))<1e-8);
  }
});
test('ric-rac, bunting and edge-only are independent selectable silhouettes',()=>{
  const base={seed:'three-forms',geometry:'straight',construction:'stroke',
    stripeWidth:75,spread:70,individuality:0,shapeFrequency:100,shapeDepth:100,
    stripeEdgeStyle:'scalloped',stripeEdgeSize:50,stripeEdgeDepth:100,
    stripeEdgeSides:'negative',stripeEdgeDirection:'outward'};
  const ricrac=resolveScene(normalizeRecipe({...base,stripeScallopForm:'ricrac'}));
  const bunting=resolveScene(normalizeRecipe({...base,stripeScallopForm:'bunting'}));
  const edgeOnly=resolveScene(normalizeRecipe({...base,stripeScallopForm:'edge-only'}));
  const pitch=edgePitch(base.stripeEdgeSize),x=pitch/2;
  const a=ricrac.stripes[3],b=bunting.stripes[3],c=edgeOnly.stripes[3];
  assert.ok(samplePath(a,x,ricrac.extent).y>a.center);
  assert.ok(samplePath(a,x+pitch,ricrac.extent).y<a.center);
  assert.equal(samplePath(b,x,bunting.extent).y,b.center);
  assert.equal(samplePath(c,x,edgeOnly.extent).y,c.center);
  assert.equal(stripeEdgeOffset(a,x,-1,a.width),0);
  assert.equal(stripeEdgeOffset(a,x,1,a.width),0);
  assert.ok(stripeEdgeOffset(b,x,-1,b.width)<0);
  assert.ok(stripeEdgeOffset(b,x,1,b.width)>0,
    'bunting is a symmetric pair of decorated edges');
  assert.ok(stripeEdgeOffset(c,x,-1,c.width)<0);
  assert.equal(stripeEdgeOffset(c,x,1,c.width),0,
    'edge-only respects selected physical edge');
  const zeroWave=resolveScene(normalizeRecipe({...base,stripeScallopForm:'ricrac',
    shapeFrequency:0,shapeDepth:0}));
  assert.equal(samplePath(zeroWave.stripes[3],x,zeroWave.extent).y,
    samplePath(a,x,ricrac.extent).y,
    'ric-rac must not inherit the generic wave frequency or depth');
  const invalid=normalizeRecipe({...base,stripeScallopForm:'bad'});
  assert.equal(invalid.stripeScallopForm,'edge-only');
  for(const mode of ['ricrac','bunting','edge-only']){
    const recipe=normalizeRecipe({...base,stripeScallopForm:mode});
    assert.deepEqual(normalizeRecipe(recipe),recipe);
  }
});
test('scallop depth stays even under authored stripe taper',()=>{
  const stripe={edgeStyle:'scalloped',scallopForm:'edge-only',
    edgeDepth:100,edgeSize:50,edgeDirection:'outward',
    edgeSides:'both',edgePhasePercent:0,width:50};
  const x=edgePitch(50)/2;
  assert.equal(stripeEdgeOffset(stripe,x,-1,20),
    stripeEdgeOffset(stripe,x,-1,45));
  assert.ok(Math.abs(stripeEdgeOffset(stripe,x,1,45))>0);
  assert.equal(stripeEdgeOffset({...stripe,edgeStyle:'wavy',
    scallopForm:'bunting',edgeSides:'negative'},x,1,45),0,
    'bunting choice must not override edge selection on non-scalloped styles');
});

test('stripe edge directions, single-side editing, and zero-depth leave core stable',()=>{
  const stripe={edgeStyle:'scalloped',edgeDepth:100,edgeSize:50,
    edgeSides:'both',edgePhasePercent:0,edgeDirection:'outward'};
  const station=edgePitch(stripe.edgeSize)/2;
  const upper=stripeEdgeOffset(stripe,station,-1,40);
  const lower=stripeEdgeOffset(stripe,station,1,40);
  assert.ok(upper<0&&lower>0);
  assert.equal(Math.abs(upper),Math.abs(lower));
  assert.ok(Math.abs(lower)<20,'scallops cannot consume all ribbon thickness');
  assert.equal(stripeEdgeOffset({...stripe,edgeSides:'positive'},station,-1,40),0);
  assert.equal(stripeEdgeOffset({...stripe,edgeSides:'negative'},station,1,40),0);
  assert.equal(stripeEdgeOffset({...stripe,edgeDepth:0},station,1,40),0);
  assert.ok(stripeEdgeOffset({...stripe,edgeDirection:'inward'},station,1,40)<0);
});
test('independent edges do not alter old repeated-loop ribbon cross-sections',()=>{
  const scene=resolveScene(normalizeRecipe({seed:'legacy-loops',geometry:'loops'}));
  const stripe=scene.stripes[2],station=41.125;
  assert.equal(stripe.edgeStyle,undefined);
  for(const side of [-1,1]){
    const p=samplePath(stripe,station,scene.extent);
    const actual=ribbonEdge(stripe,station,scene.extent,side);
    const distance=side*widthAt(stripe,station,scene.extent)/2;
    assert.deepEqual(actual,{x:p.x+p.nx*distance,y:p.y+p.ny*distance});
  }
});
test('all unstyled regions remain the same source objects without path churn',()=>{
  const objects=[polygon('region-0',rectangle(0,0,100,100))];
  const processed=decorateRegionObjects(objects,{regionEdgeStyle:'straight'});
  assert.equal(processed[0],objects[0]);
});
test('matching adjacent regions use the exact same scalloped physical edge',()=>{
  const objects=[
    polygon('region-0',rectangle(0,0,100,100)),
    polygon('region-1',rectangle(100,0,200,100),1)
  ];
  const [left,right]=decorateRegionObjects(objects,regional());
  const sharedPoints=object=>object.vertices.filter(p=>
    p.y>20&&p.y<80&&p.x>78&&p.x<122)
    .map(p=>[p.x,p.y].map(n=>Number(n.toFixed(8))))
    .sort((a,b)=>a[1]-b[1]);
  assert.ok(sharedPoints(left).length>10);
  assert.deepEqual(sharedPoints(left),sharedPoints(right),
    'a shared Voronoi/block edge must never be rasterized twice differently');
});
test('different region styles retreat on shared edges rather than overlap neighbours',()=>{
  const objects=[
    polygon('region-0',rectangle(0,0,100,100)),
    polygon('region-1',rectangle(100,0,200,100),1)
  ];
  const scene=regional({regionEdgeOverrides:[
    {id:'region-0',style:'pinked',size:50,depth:75,phase:0,direction:'outward'}
  ]});
  const [left,right]=decorateRegionObjects(objects,scene);
  const middle=object=>object.vertices.filter(p=>p.y>25&&p.y<75&&
    p.x>65&&p.x<135);
  assert.ok(middle(left).some(p=>p.x<99.9));
  assert.ok(middle(right).some(p=>p.x>100.1));
  assert.ok(middle(left).every(p=>p.x<=100.00001));
  assert.ok(middle(right).every(p=>p.x>=99.99999));
});
test('circle profiles and compound holes produce finite, retained region rings',()=>{
  const outer=rectangle(0,0,200,200),hole=rectangle(50,50,150,150);
  const objects=[
    {...polygon('region-0',outer),rings:[outer,hole]},
    {...polygon('region-1',Array.from({length:128},(_,i)=>{
      const a=i*Math.PI/64;return {x:260+50*Math.cos(a),y:100+50*Math.sin(a)};
    }),1),circle:{cx:260,cy:100,r:50}}
  ];
  const [a,b]=decorateRegionObjects(objects,regional({regionEdgeStyle:'wavy'}));
  assert.equal(a.rings.length,2);
  assert.ok(a.rings.every(r=>r.length>100));
  assert.equal(b.circle,undefined);
  assert.ok(b.vertices.length>100);
  for(const object of [a,b])for(const p of (object.rings||[object.vertices]).flat())
    assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
});
test('invalid per-region overrides normalize and legacy recipes retain off defaults',()=>{
  const list=normalizeRegionEdgeOverrides([
    {id:'region-0',style:'scalloped',size:500,depth:-100,phase:60},
    {id:'region-0',style:'pinked'},
    {id:'../../bad',style:'pinked'},
    {id:'region-2',style:'unknown',size:'wat'}
  ]);
  assert.equal(list.length,2);
  assert.deepEqual(list[0],{id:'region-0',style:'scalloped',size:100,
    depth:0,phase:60,direction:'outward'});
  assert.equal(list[1].style,'straight');
  const old=normalizeRecipe({seed:'old-recipe'});
  assert.equal(old.regionEdgeStyle,'straight');
  assert.equal(old.stripeEdgeStyle,'straight');
  assert.equal(old.regionEdgeOverrides,undefined);
  const saved=normalizeRecipe({regionEdgeOverrides:list,
    stripeEdgeStyle:'pinked',stripeEdgeAlignment:'staggered'});
  assert.deepEqual(normalizeRecipe(saved),saved);
  assert.equal(saved.stripeEdgeAlignment,'staggered');
});
test('both edge editors are independently discoverable in the canonical tool map',()=>{
  assert.deepEqual([SETTING_TOOL.regionEdgeStyle.category,
    SETTING_TOOL.regionEdgeStyle.tool],['path','region-edges']);
  assert.deepEqual([SETTING_TOOL.stripeEdgeStyle.category,
    SETTING_TOOL.stripeEdgeStyle.tool],['stripes','edges']);
});


test('physical ribbon edges have independently adjustable phase for all four edge styles',()=>{
  const base={seed:'two-edge-phases',geometry:'straight',construction:'ribbon',
    individuality:0,stripeWidth:75,spread:60,stripeEdgeSize:50,
    stripeEdgeDepth:85,stripeEdgePhase:0,stripeEdgePhaseB:0,
    stripeEdgeSides:'both',stripeEdgeAlignment:'aligned',
    stripeScallopForm:'bunting'};
  const station=edgePitch(50)*.10;
  for(const style of ['wavy','pinked','scalloped','stepped']){
    const first=resolveScene(normalizeRecipe({...base,stripeEdgeStyle:style})).stripes[3];
    const offset=resolveScene(normalizeRecipe({...base,stripeEdgeStyle:style,
      stripeEdgePhaseB:50})).stripes[3];
    assert.equal(stripeEdgeOffset(first,station,-1,first.width),
      stripeEdgeOffset(offset,station,-1,offset.width),
      style+' must retain first-edge phase when second is changed');
    assert.notEqual(stripeEdgeOffset(first,station,1,first.width),
      stripeEdgeOffset(offset,station,1,offset.width),
      style+' must change only the second edge');
    assert.ok(Math.abs(stripeEdgeOffset(first,station+edgePitch(50)/2,1,first.width)-
      stripeEdgeOffset(offset,station,1,offset.width))<1e-8,
      style+' second edge must shift precisely half a pitch');
  }
  const normalized=normalizeRecipe({...base,stripeEdgePhase:37,stripeEdgePhaseB:87});
  assert.equal(normalized.stripeEdgePhase,37);
  assert.equal(normalized.stripeEdgePhaseB,87);
  assert.deepEqual(normalizeRecipe(normalized),normalized);
});

test('stripe-to-stripe alignment maintains the chosen physical-edge offset',()=>{
  for(const alignment of ['aligned','staggered','independent']){
    const scene=resolveScene(normalizeRecipe({
      seed:'relative-alignment',stripeEdgeStyle:'wavy',
      stripeEdgeAlignment:alignment,stripeEdgePhase:23,stripeEdgePhaseB:73
    }));
    for(const stripe of scene.stripes)
      assert.ok(Math.abs(stripe.edgePhasePercentB-stripe.edgePhasePercent-50)<1e-10);
  }
});

test('sweeping arc depth reaches three times its previous maximum while gentle bends remain unchanged',()=>{
  const base={seed:'arc-depth-range',geometry:'arc',individuality:0,
    shapeFrequency:37,shapeDepth:50};
  const gentle=resolveScene(normalizeRecipe(base)).stripes[3];
  const extreme=resolveScene(normalizeRecipe({...base,shapeDepth:100})).stripes[3];
  const oldDepthRatio=Math.pow(100/50,1.3);
  const relative=extreme.sharedDisplacement/gentle.sharedDisplacement;
  assert.ok(Math.abs(relative-3*oldDepthRatio)<1e-10,
    'the maximum arc displacement must be 3x its original value');
  const waveGentle=resolveScene(normalizeRecipe({...base,geometry:'wave'})).stripes[3];
  const waveExtreme=resolveScene(normalizeRecipe({...base,geometry:'wave',shapeDepth:100})).stripes[3];
  assert.ok(Math.abs(waveExtreme.sharedDisplacement/waveGentle.sharedDisplacement-
    oldDepthRatio)<1e-10,
    'other path geometries must retain their old maximum bend depth');
});
