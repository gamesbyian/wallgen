import test from 'node:test';
import assert from 'node:assert/strict';
import {chainLinkCurve,sampleChainLinkSegments,chainLinkContacts} from '../src/chain-stitch-topology.js';
import {resolveScene} from '../src/model.js';
import {drawRibbonEmbroidery,normalizeSurfaceTreatments} from '../src/embroidery.js';
import {samplePath} from '../src/path-geometry.js';

const horizontal=x=>chainLinkCurve(x,0,1,0,0,1,10.64,5.04);
const linkPair=()=>[horizontal(0),horizontal(19.6)];

test('chain link analytic source geometry exactly reproduces original cubic controls',()=>{
  const g=chainLinkCurve(4,6,1,0,0,1,10,5);
  assert.deepEqual(g,{
    a:[-6,6],b:[14,6],
    upper1:[-1.5,11],upper2:[10,11],
    lower1:[10,1],lower2:[-1.5,1]
  });
  const shifted=chainLinkCurve(4,6,1,0,0,1,10,5,.42,1.5,-2);
  assert.deepEqual(shifted.a,[-4.5,4.42]);
  assert.deepEqual(shifted.b,[15.5,4.42]);
  assert.equal(chainLinkCurve(0,0,1,0,0,1,-1,4),null);
  assert.equal(chainLinkCurve(NaN,0,1,0,0,1,1,4),null);
});

test('actual successive chain cubic ovals cross transversely in two lower/upper yarn locations',()=>{
  const [older,newer]=linkPair();
  const a=chainLinkContacts(older,newer,{width:1.4});
  assert.equal(a.length,2,'two genuine contacts between distinct upper/lower cubic arms');
  assert.ok(a[0].hit.x>9&&a[0].hit.x<11);
  assert.ok(a[1].hit.x>9&&a[1].hit.x<11);
  assert.ok(a[0].hit.y>0&&a[1].hit.y<0);
  assert.ok(a.every(item=>Number.isFinite(item.hit.x)&&
    Number.isFinite(item.hit.y)&&item.bottom.width===1.4&&
    item.top.width===1.4));
  assert.deepEqual(chainLinkContacts(older,newer,{width:1.4}),a,
    'original source links cannot change contacts across crop or repeated renders');
});

test('rotation and translation preserve chain cubic contact identity without screen-unit rules',()=>{
  const [older,newer]=linkPair();
  const turn=p=>[-p[1]+42,p[0]-13];
  const rotate=g=>Object.fromEntries(Object.entries(g).map(([k,v])=>[k,turn(v)]));
  const a=chainLinkContacts(older,newer,{width:1.4});
  const b=chainLinkContacts(rotate(older),rotate(newer),{width:1.4});
  assert.equal(b.length,a.length);
  for(let i=0;i<a.length;i++){
    const expected=turn([a[i].hit.x,a[i].hit.y]);
    assert.ok(Math.hypot(b[i].hit.x-expected[0],b[i].hit.y-expected[1])<1e-8);
  }
});

test('bounded chain contact graph excludes separated, invalid and nonintersecting yarn',()=>{
  const [older]=linkPair();
  assert.deepEqual(chainLinkContacts(older,horizontal(40)),[]);
  assert.deepEqual(chainLinkContacts(older,older),[],
    'same link is not an upper/lower original source link pair');
  assert.deepEqual(chainLinkContacts(older,null),[]);
  assert.deepEqual(chainLinkContacts(older,horizontal(19.6),{width:0}),[]);
  assert.deepEqual(chainLinkContacts(older,horizontal(19.6),{width:Infinity}),[]);
  const segments=sampleChainLinkSegments(older);
  assert.equal(segments.length,24,'fixed twelve subdivisions per source cubic half');
  assert.ok(segments.every(x=>Number.isFinite(x.start.x)&&Number.isFinite(x.end.y)));
  assert.deepEqual(sampleChainLinkSegments({a:[1,2]}),[]);
});

test('actual chain painter retains deterministic global station and cubic path count',()=>{
  const scene=resolveScene({seed:'real-chain-source-curves',
    geometry:'loop',construction:'ribbon',motif:'solid',stripeWidth:72});
  const stripe=scene.stripes[3],style=normalizeSurfaceTreatments([{
    id:'chain-test',style:'chain',enabled:true,pitch:7,relief:85,
    target:{scope:'all',role:'fill',ids:[],colorSlots:[]}
  }])[0];
  const ctx=()=>{const operations=[];return{
    operations,save(){},restore(){},beginPath(){operations.push(['begin'])},
    moveTo(...p){operations.push(['move',...p])},
    bezierCurveTo(...p){operations.push(['cubic',...p])},
    stroke(){operations.push(['stroke'])}
  }};
  const first=ctx(),second=ctx();
  const n=drawRibbonEmbroidery(first,stripe,scene.extent,style),
    repeat=drawRibbonEmbroidery(second,stripe,scene.extent,style);
  assert.ok(n>3);
  assert.equal(n,repeat);
  assert.deepEqual(first.operations,second.operations);
  assert.equal(first.operations.filter(x=>x[0]==='cubic').length,n*4,
    'each linked oval retains two cubics for each original material shading pass');
  const p=samplePath(stripe,0,scene.extent);
  assert.ok([p.tx,p.ty,p.nx,p.ny].every(Number.isFinite));
});
