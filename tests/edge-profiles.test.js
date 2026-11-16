import test from 'node:test';
import assert from 'node:assert/strict';
import {edgePitch,edgeWave,stripeEdgeOffset,decorateRegionObjects,
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
test('scalloped geometry is a true straight centreline with rounded boundaries',()=>{
  const recipe=normalizeRecipe({seed:'ornamental-scene',geometry:'scalloped',
    stripeWidth:70,spread:60,construction:'ribbon'});
  const scene=resolveScene(recipe),stripe=scene.stripes[3];
  for(const x of [-500,-25,0,25,500]){
    assert.equal(samplePath(stripe,x,scene.extent).y,stripe.center);
  }
  const p1=ribbonEdge(stripe,edgePitch(recipe.stripeEdgeSize)/2,
    scene.extent,-1);
  const p2=ribbonEdge(stripe,0,scene.extent,-1);
  assert.ok(p1.y<p2.y,'scallop must bulge from the actual upper ribbon edge');
  assert.equal(scene.geometry,'scalloped');
  assert.equal(stripe.edgeStyle,'scalloped');
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
