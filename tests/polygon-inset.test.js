import test from 'node:test';
import assert from 'node:assert/strict';
import {pointInPolygon,polygonInsetContours,polygonInsetScale} from '../src/polygon-inset.js';
import {resolveScene} from '../src/model.js';

const box=(x0,y0,x1,y1)=>[
  {x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}
];
const close=(a,b,tol=1)=>Math.abs(a-b)<=tol;
const extent=path=>({
  minX:Math.min(...path.points.map(p=>p.x)),
  maxX:Math.max(...path.points.map(p=>p.x)),
  minY:Math.min(...path.points.map(p=>p.y)),
  maxY:Math.max(...path.points.map(p=>p.y)),
});
function segmentDistance(p,a,b){
  const dx=b.x-a.x,dy=b.y-a.y;
  const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));
  return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
}
function distanceToRings(p,polygon){
  const rings=Array.isArray(polygon[0])?polygon:[polygon];
  let min=Infinity;
  for(const ring of rings)for(let i=0;i<ring.length;i++)
    min=Math.min(min,segmentDistance(p,ring[i],ring[(i+1)%ring.length]));
  return min;
}
const finite=contours=>contours.every(c=>c.points.every(p=>
  Number.isFinite(p.x)&&Number.isFinite(p.y)));

test('square inset has true fixed edge distance regardless of winding and vertex order',()=>{
  const polygon=box(0,0,100,80);
  const forward=polygonInsetContours(polygon,10,{resolution:.75});
  const backward=polygonInsetContours([...polygon].reverse(),10,{resolution:.75});
  assert.equal(forward.length,1);
  assert.equal(backward.length,1);
  assert.ok(forward[0].closed&&backward[0].closed);
  for(const result of [forward,backward]){
    const e=extent(result[0]);
    assert.ok(close(e.minX,10,.65)&&close(e.maxX,90,.65));
    assert.ok(close(e.minY,10,.65)&&close(e.maxY,70,.65));
    for(const p of result[0].points.filter((_,i)=>i%9===0)){
      assert.ok(pointInPolygon(p.x,p.y,polygon));
      assert.ok(close(distanceToRings(p,polygon),10,.8),JSON.stringify(p));
    }
  }
  assert.deepEqual(polygonInsetContours(polygon,10,{resolution:.75}),forward);
});

test('concave dumbbell splits into two disconnected inset loops when the bridge disappears',()=>{
  const polygon=[
    {x:0,y:0},{x:40,y:0},{x:40,y:18},
    {x:70,y:18},{x:70,y:0},{x:110,y:0},
    {x:110,y:50},{x:70,y:50},{x:70,y:32},
    {x:40,y:32},{x:40,y:50},{x:0,y:50}
  ];
  const contours=polygonInsetContours(polygon,8,{resolution:.65});
  assert.equal(contours.length,2,JSON.stringify(contours.map(extent)));
  assert.ok(contours.every(c=>c.closed));
  assert.ok(extent(contours[0]).maxX<extent(contours[1]).minX ||
    extent(contours[1]).maxX<extent(contours[0]).minX);
  for(const c of contours)for(const p of c.points.filter((_,i)=>i%7===0)){
    assert.ok(pointInPolygon(p.x,p.y,polygon));
    assert.ok(close(distanceToRings(p,polygon),8,.8));
  }
});

test('even-odd polygon holes expand while outer boundary contracts on inward offset',()=>{
  const rings=[box(0,0,120,120),box(40,40,80,80)];
  const contours=polygonInsetContours(rings,10,{resolution:.75});
  assert.equal(contours.length,2,JSON.stringify(contours.map(extent)));
  assert.ok(contours.every(c=>c.closed));
  for(const c of contours)for(const p of c.points.filter((_,i)=>i%11===0)){
    assert.ok(pointInPolygon(p.x,p.y,rings));
    assert.ok(close(distanceToRings(p,rings),10,.8));
  }
});

test('insets exceeding the inradius vanish without inverted or self-crossing loops',()=>{
  const polygon=box(-10,-5,10,5);
  assert.deepEqual(polygonInsetContours(polygon,6,{resolution:.5}),[]);
});

test('camera-bounded inset returns open chains instead of inventing frame-edge caps',()=>{
  const polygon=box(0,0,100,100);
  const contours=polygonInsetContours(polygon,10,{
    resolution:.5,bounds:{left:35,right:65,top:0,bottom:10},padding:0
  });
  assert.ok(contours.length>=1);
  assert.ok(contours.some(c=>!c.closed));
  assert.ok(finite(contours));
});

test('offset distance and contour computation are deterministic across geometry families',()=>{
  for(const [structure,modes,property] of [
    ['radial',['sunburst','starburst','pinwheel','spokes','concentric'],'radialMode'],
    ['regions',['voronoi','organic','facets','blocks','nested'],'regionMode'],
  ])for(const mode of modes){
    const scene=resolveScene({structure,[property]:mode,seed:'inset-fixture',rayCount:7,regionCount:7});
    const object=scene.objects[0];
    const scale=polygonInsetScale(object.vertices);
    assert.ok(Number.isFinite(scale)&&scale>0&&scale<=100,mode);
    const bounds={left:0,top:0,right:600,bottom:1300};
    const inset=Math.max(1,scale*.10);
    const a=polygonInsetContours(object.vertices,inset,{bounds});
    const b=polygonInsetContours(object.vertices,inset,{bounds});
    assert.deepEqual(a,b,mode);
    assert.ok(finite(a),mode);
  }
});

test('degenerate rings and nonsensical values cannot create nonfinite contours',()=>{
  const boxShape=box(0,0,50,70);
  assert.deepEqual(polygonInsetContours([],10),[]);
  assert.deepEqual(polygonInsetContours([{x:NaN,y:0}],4),[]);
  assert.deepEqual(polygonInsetContours(boxShape,NaN),[]);
  assert.deepEqual(polygonInsetContours(boxShape,-1),[]);
  assert.deepEqual(polygonInsetContours(boxShape,0),[{points:boxShape,closed:true}]);
});

test('deeply concave L shape follows edge normals, not an exterior centroid',()=>{
  const polygon=[
    {x:0,y:0},{x:100,y:0},{x:100,y:25},
    {x:25,y:25},{x:25,y:100},{x:0,y:100}
  ];
  const loops=polygonInsetContours(polygon,6,{resolution:.65});
  assert.equal(loops.length,1);
  assert.ok(loops[0].closed);
  for(const p of loops[0].points.filter((_,i)=>i%13===0)){
    assert.ok(pointInPolygon(p.x,p.y,polygon));
    assert.ok(close(distanceToRings(p,polygon),6,.7));
  }
});

test('canonical world-space grid gives identical shared inset points for zoom crops',()=>{
  const polygon=[
    {x:-100,y:0},{x:700,y:0},{x:480,y:1200},{x:120,y:1200}
  ];
  const full=polygonInsetContours(polygon,11,{
    bounds:{left:-100,right:700,top:0,bottom:1200},resolution:1.25
  });
  const crop=polygonInsetContours(polygon,11,{
    bounds:{left:150,right:450,top:250,bottom:1000},resolution:1.25
  });
  const key=p=>Math.round(p.x*1000)+','+Math.round(p.y*1000);
  const all=new Set(full.flatMap(c=>c.points).map(key));
  const insideCrop=crop.flatMap(c=>c.points).filter(p=>
    p.x>165&&p.x<435&&p.y>265&&p.y<985);
  assert.ok(insideCrop.length>10,'expect an actual cropped contour');
  assert.ok(insideCrop.every(p=>all.has(key(p))),
    'changing camera bounds must not move the underlying inset samples');
});
